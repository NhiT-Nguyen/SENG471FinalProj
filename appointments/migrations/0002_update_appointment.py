# Generated manually for appointment updates

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from datetime import timedelta


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='appointment',
            old_name='caregiver',
            new_name='healthcare_provider',
        ),
        migrations.AddField(
            model_name='appointment',
            name='duration',
            field=models.DurationField(default=timedelta(hours=1)),
        ),
        migrations.AddField(
            model_name='appointment',
            name='location',
            field=models.CharField(blank=True, default='', max_length=200),
        ),
        migrations.CreateModel(
            name='Availability',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('day_of_week', models.IntegerField(choices=[(0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'), (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday')])),
                ('start_time', models.TimeField()),
                ('end_time', models.TimeField()),
                ('is_recurring', models.BooleanField(default=True)),
                ('week_start_date', models.DateField(blank=True, null=True)),
                ('is_available', models.BooleanField(default=True)),
                ('healthcare_provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='AvailabilityConfirmation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('week_start_date', models.DateField()),
                ('confirmed', models.BooleanField(default=False)),
                ('confirmed_at', models.DateTimeField(blank=True, null=True)),
                ('healthcare_provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='availabilityconfirmation',
            unique_together={('healthcare_provider', 'week_start_date')},
        ),
    ]