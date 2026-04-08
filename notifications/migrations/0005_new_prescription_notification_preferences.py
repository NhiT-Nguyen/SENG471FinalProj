from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0004_profile_change_notification_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationsettings',
            name='new_prescription_notification_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='new_prescription_notification_email',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='new_prescription_notification_push',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='new_prescription_notification_sms',
            field=models.BooleanField(default=False),
        ),
    ]