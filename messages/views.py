from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth.models import User
from .models import Message
from .serializers import MessageSerializer
from notifications.models import Alert

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('created_at')

    def create(self, request, *args, **kwargs):
        """Support sending by receiver_username or receiver (user id)."""
        data = request.data.copy()
        if 'receiver_username' in data and not data.get('receiver'):
            username = data.pop('receiver_username')
            if isinstance(username, list):
                username = username[0]
            try:
                receiver = User.objects.get(username=username)
                data['receiver'] = receiver.id
            except User.DoesNotExist:
                return Response({'error': f'User "{username}" not found'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        # Create notification for the receiver
        Alert.objects.create(
            user=message.receiver,
            message=f"New message from {message.sender.username}: {message.content[:50]}..."
        )

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver == request.user:
            message.is_read = True
            message.save()
            return Response({'status': 'message marked as read'})
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        unread_messages = Message.objects.filter(receiver=request.user, is_read=False)
        serializer = self.get_serializer(unread_messages, many=True)
        return Response(serializer.data)