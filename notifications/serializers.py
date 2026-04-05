from rest_framework import serializers
from .models import NotificationSettings, Alert

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = ['id', 'user', 'email_alerts', 'sms_alerts', 'push_notifications']

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'user', 'message', 'created_at', 'is_read']