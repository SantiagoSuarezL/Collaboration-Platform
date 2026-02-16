from django.urls import re_path
from . import consumers

# Patrones de URL para WebSockets
websocket_urlpatterns = [
    # WebSocket para un tablero específico
    # Ejemplo de uso: ws://localhost:8000/ws/board/1/
    re_path(r'ws/board/(?P<board_id>\w+)/$', consumers.BoardConsumer.as_asgi()),
]
