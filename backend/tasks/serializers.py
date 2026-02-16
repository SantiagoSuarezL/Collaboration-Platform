from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Board, List, Task, BoardMember, ActivityLog

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(many=True, read_only=True)
    assigned_to_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=User.objects.all(), source='assigned_to'
    )

    class Meta:
        model = Task
        fields = ['id', 'list', 'title', 'description', 'position', 'due_date', 'assigned_to', 'assigned_to_ids', 'priority', 'created_at', 'updated_at']

class ListSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = ['id', 'board', 'title', 'position', 'tasks', 'created_at', 'updated_at']

class BoardMemberSerializer(serializers.ModelSerializer):
    id = serializers.ReadOnlyField(source='user.id')
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = BoardMember
        fields = ['id', 'username', 'email', 'role']

class BoardSerializer(serializers.ModelSerializer):
    lists = ListSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    members = BoardMemberSerializer(source='board_members', many=True, read_only=True)

    class Meta:
        model = Board
        fields = ['id', 'name', 'description', 'owner', 'members', 'lists', 'created_at', 'updated_at']

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'action', 'timestamp', 'content_type', 'object_id']
