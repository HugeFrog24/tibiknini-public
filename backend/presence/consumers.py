import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.apps import apps
from django.utils import timezone


class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Accept the WebSocket connection
        await self.accept()

        # Store the channel name and user
        self.user = self.scope["user"]

        # Handle authentication
        if not self.user.is_authenticated:
            # Close connection if user is not authenticated
            await self.close(code=4001)
            return

        # Update user presence
        await self.update_user_presence(True, self.channel_name)

        # Add this channel to the group for broadcasting presence updates
        await self.channel_layer.group_add("presence", self.channel_name)

        # Broadcast the user's online status to all connected clients
        await self.channel_layer.group_send(
            "presence",
            {"type": "presence_update", "user_id": self.user.id, "status": "online"},
        )

    async def disconnect(self, close_code):
        if hasattr(self, "user") and self.user.is_authenticated:
            await self.update_user_presence(False, "")

            # Remove this channel from the group
            await self.channel_layer.group_discard("presence", self.channel_name)

            # Broadcast the user's offline status
            await self.channel_layer.group_send(
                "presence",
                {
                    "type": "presence_update",
                    "user_id": self.user.id,
                    "status": "offline",
                },
            )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            if data.get("type") == "authenticate":
                # Handle authentication if needed
                # The token validation is already handled by Django Channels authentication
                pass
            # Handle other message types if needed
        except json.JSONDecodeError:
            await self.close(code=4000)

    async def presence_update(self, event):
        # Send presence update to WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def update_user_presence(self, is_online, channel_name):
        UserPresence = apps.get_model("presence", "UserPresence")
        presence, _ = UserPresence.objects.get_or_create(user=self.user)
        presence.is_online = is_online
        presence.channel_name = channel_name
        presence.last_seen = timezone.now()
        presence.save()
