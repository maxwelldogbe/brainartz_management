"""
WebSocket consumers for real-time procurement and inventory notifications.
"""

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

logger = logging.getLogger(__name__)

User = get_user_model()


class InventoryConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for inventory and procurement real-time updates.
    Handles organization-level inventory notifications.
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        # Extract user from scope (set by auth middleware)
        self.user = self.scope.get('user', AnonymousUser())
        
        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            # Reject connection for unauthenticated users
            await self.close(code=4001)
            return
        
        # Join organization-wide inventory group
        # For now, we'll use a global group, but this could be org-specific
        self.group_name = "inventory_updates"
        
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        
        await self.accept()
        
        logger.info(f"User {self.user.username} connected to inventory updates")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        
        logger.info(f"User disconnected from inventory updates: {close_code}")
    
    async def receive(self, text_data):
        """Handle messages from WebSocket (not used in this implementation)"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # For future expansion: handle client-side subscription preferences
            if message_type == 'subscribe_material':
                # Could implement per-material subscriptions
                material_id = data.get('material_id')
                # Add to material-specific group if needed
                pass
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'error': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")
    
    async def inventory_message(self, event):
        """Handle inventory messages from group"""
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'event': event['event'],
            'data': event['data'],
            'timestamp': self.get_current_timestamp()
        }))
    
    def get_current_timestamp(self):
        """Get current timestamp for messages"""
        from django.utils import timezone
        return timezone.now().isoformat()


# Authentication middleware for WebSocket connections
class TokenAuthMiddleware:
    """
    Custom middleware to authenticate WebSocket connections using JWT tokens.
    """
    
    def __init__(self, inner):
        self.inner = inner
    
    async def __call__(self, scope, receive, send):
        # Extract token from query string or headers
        query_string = scope.get('query_string', b'').decode()
        token = None
        
        # Try to get token from query string
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=', 1)[1]
                    break
        
        # Try to get token from headers (if not in query string)
        if not token:
            headers = dict(scope['headers'])
            auth_header = headers.get(b'authorization', b'').decode()
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ', 1)[1]
        
        # Authenticate user
        scope['user'] = await self.get_user_from_token(token)
        
        return await self.inner(scope, receive, send)
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """Get user from JWT token"""
        if not token:
            return AnonymousUser()
        
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
            
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            user = jwt_auth.get_user(validated_token)
            return user
            
        except (InvalidToken, TokenError, Exception) as e:
            logger.warning(f"WebSocket authentication failed: {e}")
            return AnonymousUser()


def TokenAuthMiddlewareStack(inner):
    """Middleware stack for WebSocket authentication"""
    return TokenAuthMiddleware(inner)