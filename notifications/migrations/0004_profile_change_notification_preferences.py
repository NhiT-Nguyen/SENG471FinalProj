from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0003_medication_reminder_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationsettings',
            name='profile_change_notification_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='profile_change_notification_email',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='profile_change_notification_push',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='profile_change_notification_sms',
            field=models.BooleanField(default=False),
        ),
    ]