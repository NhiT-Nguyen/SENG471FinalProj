from rest_framework import viewsets
from .models import NotificationSettings, Alert
from .serializers import NotificationSettingsSerializer, AlertSerializer

class NotificationSettingsViewSet(viewsets.ModelViewSet):
    queryset = NotificationSettings.objects.all()
    serializer_class = NotificationSettingsSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
