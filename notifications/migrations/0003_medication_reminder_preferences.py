from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_notification_reminder_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationsettings',
            name='medication_reminder_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='medication_reminder_email',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='medication_reminder_minutes_before',
            field=models.PositiveIntegerField(default=30),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='medication_reminder_push',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='medication_reminder_sms',
            field=models.BooleanField(default=False),
        ),
    ]