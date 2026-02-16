from django.contrib.auth.models import User
from rest_framework import status, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Board, List, Task, ActivityLog
from .serializers import BoardSerializer, ListSerializer, TaskSerializer, ActivityLogSerializer, BoardMemberSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class RegisterView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email', '')

        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(username=username, password=password, email=email)
        
        # Auto-add user to all existing boards as a member and notify
        from .models import BoardMember
        channel_layer = get_channel_layer()
        
        for board in Board.objects.all():
            member, created = BoardMember.objects.get_or_create(user=user, board=board, defaults={'role': 'member'})
            
            # Notify board group
            serializer = BoardMemberSerializer(member)
            async_to_sync(channel_layer.group_send)(
                f'board_{board.id}',
                {
                    'type': 'member_added',
                    'member': serializer.data
                }
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'username': user.username,
                'email': user.email,
                'id': user.id
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class BoardViewSet(viewsets.ModelViewSet):
    queryset = Board.objects.all()
    serializer_class = BoardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # En una app real filtraríamos por membresía
        return Board.objects.all()

class ListViewSet(viewsets.ModelViewSet):
    queryset = List.objects.all()
    serializer_class = ListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        from django.contrib.contenttypes.models import ContentType
        last_log = ActivityLog.objects.filter(
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id
        ).first()
        if last_log:
            last_log.user = self.request.user
            last_log.save()

    def perform_destroy(self, instance):
        # El signal post_delete no tiene acceso al request, lo registramos aquí antes de borrar
        from django.contrib.contenttypes.models import ContentType
        ActivityLog.objects.create(
            user=self.request.user,
            action=f"deleted list '{instance.title}'",
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id
        )
        instance.delete()

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        
        from django.contrib.contenttypes.models import ContentType
        last_log = ActivityLog.objects.filter(
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id
        ).first()
        
        if last_log:
            last_log.user = self.request.user
            last_log.save()

    def perform_update(self, serializer):
        old_instance = self.get_object()
        old_list = old_instance.list
        old_title = old_instance.title
        old_description = old_instance.description
        old_position = old_instance.position
        old_assigned = set(old_instance.assigned_to.all())

        instance = serializer.save()
        
        # Check if anything relevant changed
        has_list_changed = old_list != instance.list
        has_content_changed = old_title != instance.title or old_description != instance.description
        # Position diff check (rounding)
        has_position_changed = abs(float(old_position) - float(instance.position)) > 0.0001
        
        new_assigned = set(instance.assigned_to.all())
        has_assignment_changed = old_assigned != new_assigned

        from django.contrib.contenttypes.models import ContentType
        # Ultimo log creado por el signal
        last_log = ActivityLog.objects.filter(
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id,
            user__isnull=True
        ).order_by('-timestamp').first()

        if not (has_list_changed or has_content_changed or has_position_changed or has_assignment_changed):
            # No real changes, delete noise log
            if last_log: last_log.delete()
            return

        if has_list_changed:
            action_msg = f"moved task '{instance.title}' to '{instance.list.title}'"
        elif has_assignment_changed:
            added = new_assigned - old_assigned
            removed = old_assigned - new_assigned
            if added:
                names = ", ".join([u.username for u in added if u and hasattr(u, 'username')])
                action_msg = f"assigned task '{instance.title}' to {names}"
            elif removed:
                names = ", ".join([u.username for u in removed if u and hasattr(u, 'username')])
                action_msg = f"unassigned {names} from task '{instance.title}'"
            else:
                action_msg = f"updated assignments for task '{instance.title}'"
        elif has_position_changed and not has_content_changed:
            action_msg = f"reordered task '{instance.title}' in '{instance.list.title}'"
        else:
            action_msg = f"updated task '{instance.title}'"

        if last_log:
            last_log.user = self.request.user
            last_log.action = action_msg
            last_log.save()


    def perform_destroy(self, instance):
        from django.contrib.contenttypes.models import ContentType
        ActivityLog.objects.create(
            user=self.request.user,
            action=f"deleted task '{instance.title}'",
            content_type=ContentType.objects.get_for_model(instance),
            object_id=instance.id
        )
        instance.delete()




class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = ActivityLog.objects.all().order_by('-timestamp')
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

