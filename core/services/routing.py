"""
WebSocket URL routing for services app.
"""

from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path('ws/inventory/', consumers.InventoryConsumer.as_asgi()),
    path('ws/notifications/', consumers.NotificationConsumer.as_asgi()),
]