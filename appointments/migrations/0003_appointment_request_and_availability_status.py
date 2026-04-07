# Generated migration for appointment request feature

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('appointments', '0002_update_appointment'),
        ('authentication', '0001_initial'),
    ]

    operations = [
        # Add status field to Availability
        migrations.AddField(
            model_name='availability',
            name='status',
            field=models.CharField(
                choices=[
                    ('available', 'Available'),
                    ('busy', 'Busy'),
                    ('appointment_request_pending', 'Appointment Request Pending'),
                ],
                default='available',
                max_length=30,
            ),
        ),
        # Create AppointmentRequest model
        migrations.CreateModel(
            name='AppointmentRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('requested_date', models.DateField()),
                ('requested_start_time', models.TimeField()),
                ('requested_end_time', models.TimeField()),
                ('notes', models.TextField(blank=True)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('cancelled', 'Cancelled')],
                    default='pending',
                    max_length=20,
                )),
                ('appointment', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='appointment_request', to='appointments.appointment')),
                ('proposed_date', models.DateField(blank=True, null=True)),
                ('proposed_start_time', models.TimeField(blank=True, null=True)),
                ('proposed_end_time', models.TimeField(blank=True, null=True)),
                ('proposed_notes', models.TextField(blank=True)),
                ('change_status', models.CharField(
                    choices=[('none', 'None'), ('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')],
                    default='none',
                    max_length=20,
                )),
                ('change_requested_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appointment_requests', to='authentication.patient')),
                ('healthcare_provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_requests', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
