from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0003_appointment_request_and_availability_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='appointment',
            name='reasons_for_visit',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='appointment',
            name='examinations_performed',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='appointment',
            name='tests_requested',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='appointment',
            name='new_medications',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='appointment',
            name='referrals',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='appointment',
            name='follow_up_recommended',
            field=models.BooleanField(default=False),
        ),
    ]
