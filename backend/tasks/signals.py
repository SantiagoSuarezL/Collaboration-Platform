from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Board, Task, List, ActivityLog


@receiver(post_save, sender=Board)
def log_board_activity(sender, instance, created, **kwargs):
    """
    Registra automáticamente la creación o actualización de un Board
    y envía notificación WebSocket.
    """
    if created:
        action = f"Board '{instance.name}' created"
    else:
        action = f"Board '{instance.name}' updated"
    
    ActivityLog.objects.create(
        user=instance.owner,
        action=action,
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.id
    )
    
    # Enviar notificación WebSocket si no es creación (evitar notificar antes de que exista el grupo)
    if not created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f'board_{instance.id}',
            {
                'type': 'board_updated',
                'board': {
                    'id': instance.id,
                    'name': instance.name,
                    'description': instance.description,
                }
            }
        )


@receiver(post_save, sender=Task)
def log_task_activity(sender, instance, created, **kwargs):
    """
    Registra automáticamente la creación o actualización de una Task
    y envía notificación WebSocket.
    """
    if created:
        action = f"Task '{instance.title}' created in list '{instance.list.title}'"
        event_type = 'task_created'
    else:
        action = f"Task '{instance.title}' updated"
        event_type = 'task_updated'
    
    # Intentamos obtener el usuario del contexto si está disponible
    # En un escenario real, podrías usar middleware o contexto de request
    # Por ahora, dejamos user como None si no está disponible
    ActivityLog.objects.create(
        user=None,  # Puedes modificar esto para obtener el usuario del contexto
        action=action,
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.id
    )
    
    # Enviar notificación WebSocket al grupo del tablero
    channel_layer = get_channel_layer()
    board_id = instance.list.board.id
    
    async_to_sync(channel_layer.group_send)(
        f'board_{board_id}',
        {
            'type': event_type,
            'task': {
                'id': instance.id,
                'title': instance.title,
                'description': instance.description,
                'list_id': instance.list.id,
                'position': str(instance.position),
                'due_date': instance.due_date.isoformat() if instance.due_date else None,
            }
        }
    )


@receiver(post_save, sender=List)
def log_list_activity(sender, instance, created, **kwargs):
    """
    Registra automáticamente la creación o actualización de una List
    y envía notificación WebSocket.
    """
    if created:
        action = f"List '{instance.title}' created in board '{instance.board.name}'"
        event_type = 'list_created'
    else:
        action = f"List '{instance.title}' updated"
        event_type = 'list_updated'
    
    ActivityLog.objects.create(
        user=None,
        action=action,
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.id
    )
    
    # Enviar notificación WebSocket al grupo del tablero
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f'board_{instance.board.id}',
        {
            'type': event_type,
            'list': {
                'id': instance.id,
                'title': instance.title,
                'board_id': instance.board.id,
                'position': str(instance.position),
            }
        }
    )


@receiver(post_delete, sender=Board)
def log_board_deletion(sender, instance, **kwargs):
    """
    Registra la eliminación de un Board.
    """
    ActivityLog.objects.create(
        user=instance.owner,
        action=f"Board '{instance.name}' deleted",
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.id
    )


@receiver(post_delete, sender=Task)
def log_task_deletion(sender, instance, **kwargs):
    """
    Registra la eliminación de una Task y envía notificación WebSocket.
    """
    board_id = instance.list.board.id
    
    ActivityLog.objects.create(
        user=None,  # Puedes modificar esto para obtener el usuario del contexto
        action=f"Task '{instance.title}' deleted",
        content_type=ContentType.objects.get_for_model(instance),
        object_id=instance.id
    )
    
    # Enviar notificación WebSocket al grupo del tablero
    channel_layer = get_channel_layer()
    
    async_to_sync(channel_layer.group_send)(
        f'board_{board_id}',
        {
            'type': 'task_deleted',
            'task_id': instance.id
        }
    )
