import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()


# Global store for connected users (In-memory, for dev/single-worker only)
connected_users = {}

class BoardConsumer(AsyncWebsocketConsumer):
    """
    Consumer para manejar las conexiones WebSocket de un tablero.
    Permite a los usuarios unirse a un grupo basado en el board_id
    y recibir notificaciones en tiempo real.
    """
    
    async def connect(self):
        """
        Se ejecuta cuando un cliente intenta conectarse al WebSocket.
        """
        # Obtener el board_id de la URL
        self.board_id = self.scope['url_route']['kwargs']['board_id']
        self.board_group_name = f'board_{self.board_id}'

        # Unirse al grupo del tablero
        await self.channel_layer.group_add(
            self.board_group_name,
            self.channel_name
        )

        # Aceptar la conexión WebSocket
        await self.accept()

        # Obtener información del usuario (si está autenticado)
        user = self.scope.get('user')
        if user and user.is_authenticated:
            # Add to connected users
            if self.board_group_name not in connected_users:
                connected_users[self.board_group_name] = set()
            connected_users[self.board_group_name].add(user.username)

            # Send current online users list to the connecting user
            online_list = list(connected_users[self.board_group_name])
            await self.send(text_data=json.dumps({
                'type': 'present_users',
                'users': online_list
            }))

            # Notificar al grupo que un usuario se ha conectado
            await self.channel_layer.group_send(
                self.board_group_name,
                {
                    'type': 'user_joined',
                    'user': user.username,
                    'message': f'{user.username} se ha unido al tablero'
                }
            )

    async def disconnect(self, close_code):
        """
        Se ejecuta cuando un cliente se desconecta del WebSocket.
        """
        # Obtener información del usuario
        user = self.scope.get('user')
        if user and user.is_authenticated:
            # Remove from connected users
            if self.board_group_name in connected_users:
                connected_users[self.board_group_name].discard(user.username)
                if not connected_users[self.board_group_name]:
                    del connected_users[self.board_group_name]

            # Notificar al grupo que un usuario se ha desconectado
            await self.channel_layer.group_send(
                self.board_group_name,
                {
                    'type': 'user_left',
                    'user': user.username,
                    'message': f'{user.username} ha salido del tablero'
                }
            )

        # Salir del grupo del tablero
        await self.channel_layer.group_discard(
            self.board_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        """
        Se ejecuta cuando se recibe un mensaje del cliente.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            # Obtener el usuario
            user = self.scope.get('user')
            username = user.username if user and user.is_authenticated else 'Anónimo'

            # Enviar el mensaje a todos los miembros del grupo
            await self.channel_layer.group_send(
                self.board_group_name,
                {
                    'type': 'board_message',
                    'message_type': message_type,
                    'data': data,
                    'user': username
                }
            )
        except json.JSONDecodeError:
            # Enviar error al cliente si el JSON es inválido
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Formato de mensaje inválido'
            }))

    # Handlers para diferentes tipos de mensajes

    async def board_message(self, event):
        """
        Handler para mensajes generales del tablero.
        """
        await self.send(text_data=json.dumps({
            'type': event['message_type'],
            'data': event['data'],
            'user': event['user']
        }))

    async def user_joined(self, event):
        """
        Handler cuando un usuario se une al tablero.
        """
        await self.send(text_data=json.dumps({
            'type': 'user_joined',
            'user': event['user'],
            'message': event['message']
        }))

    async def user_left(self, event):
        """
        Handler cuando un usuario sale del tablero.
        """
        await self.send(text_data=json.dumps({
            'type': 'user_left',
            'user': event['user'],
            'message': event['message']
        }))

    async def task_created(self, event):
        """
        Handler cuando se crea una nueva tarea.
        """
        await self.send(text_data=json.dumps({
            'type': 'task_created',
            'task': event['task']
        }))

    async def task_updated(self, event):
        """
        Handler cuando se actualiza una tarea.
        """
        await self.send(text_data=json.dumps({
            'type': 'task_updated',
            'task': event['task']
        }))

    async def task_deleted(self, event):
        """
        Handler cuando se elimina una tarea.
        """
        await self.send(text_data=json.dumps({
            'type': 'task_deleted',
            'task_id': event['task_id']
        }))

    async def list_created(self, event):
        """
        Handler cuando se crea una nueva lista.
        """
        await self.send(text_data=json.dumps({
            'type': 'list_created',
            'list': event['list']
        }))

    async def list_updated(self, event):
        """
        Handler cuando se actualiza una lista.
        """
        await self.send(text_data=json.dumps({
            'type': 'list_updated',
            'list': event['list']
        }))

    async def member_added(self, event):
        """
        Handler cuando se añade un miembro al tablero.
        """
        await self.send(text_data=json.dumps({
            'type': 'member_added',
            'member': event['member']
        }))