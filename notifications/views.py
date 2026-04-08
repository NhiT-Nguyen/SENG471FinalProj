from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NotificationSettings, Alert
from .serializers import NotificationSettingsSerializer, AlertSerializer
from authentication.models import Profile

class NotificationSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return NotificationSettings.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response({'detail': 'User profile required.'}, status=status.HTTP_403_FORBIDDEN)

        if profile.role != 'patient':
            return Response({'detail': 'Only patients can manage reminder preferences.'}, status=status.HTTP_403_FORBIDDEN)

        settings_obj, _ = NotificationSettings.objects.get_or_create(user=request.user)

        if request.method == 'GET':
            serializer = self.get_serializer(settings_obj)
            return Response(serializer.data)

        serializer = self.get_serializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data)

class AlertViewSet(viewsets.ModelViewSet):
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response({'status': 'alert marked as read'})
