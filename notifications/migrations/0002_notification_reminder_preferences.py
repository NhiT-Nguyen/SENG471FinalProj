from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationsettings',
            name='appointment_reminder_enabled',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='appointment_reminder_email',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='appointment_reminder_hours_before',
            field=models.PositiveIntegerField(default=24),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='appointment_reminder_push',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='notificationsettings',
            name='appointment_reminder_sms',
            field=models.BooleanField(default=False),
        ),
    ]