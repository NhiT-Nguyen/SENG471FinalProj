from rest_framework import serializers
from .models import NotificationSettings, Alert

class NotificationSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationSettings
        fields = [
            'id',
            'user',
            'email_alerts',
            'sms_alerts',
            'push_notifications',
            'appointment_reminder_enabled',
            'appointment_reminder_email',
            'appointment_reminder_sms',
            'appointment_reminder_push',
            'appointment_reminder_hours_before',
            'medication_reminder_enabled',
            'medication_reminder_email',
            'medication_reminder_sms',
            'medication_reminder_push',
            'medication_reminder_minutes_before',
            'profile_change_notification_enabled',
            'profile_change_notification_email',
            'profile_change_notification_sms',
            'profile_change_notification_push',
        ]
        read_only_fields = ['id', 'user']

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'user', 'message', 'created_at', 'is_read']