from django.db import models
from django.contrib.auth.models import User

class NotificationSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    email_alerts = models.BooleanField(default=True)
    sms_alerts = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    appointment_reminder_enabled = models.BooleanField(default=True)
    appointment_reminder_email = models.BooleanField(default=True)
    appointment_reminder_sms = models.BooleanField(default=False)
    appointment_reminder_push = models.BooleanField(default=True)
    appointment_reminder_hours_before = models.PositiveIntegerField(default=24)

    def __str__(self):
        return f"Settings for {self.user.username}"

class Alert(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Alert for {self.user.username}: {self.message[:50]}"
