# Generated migration for HealthcareProvider model

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='HealthcareProvider',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('specialty', models.CharField(choices=[('general_practice', 'General Practice'), ('cardiology', 'Cardiology'), ('neurology', 'Neurology'), ('pediatrics', 'Pediatrics'), ('orthopedics', 'Orthopedics'), ('dermatology', 'Dermatology'), ('psychiatry', 'Psychiatry'), ('radiology', 'Radiology'), ('emergency_medicine', 'Emergency Medicine'), ('nursing', 'Nursing'), ('pharmacy', 'Pharmacy'), ('other', 'Other')], default='general_practice', max_length=50)),
                ('license_number', models.CharField(blank=True, max_length=100)),
                ('hospital_clinic', models.CharField(blank=True, max_length=200)),
                ('phone_number', models.CharField(blank=True, max_length=20)),
                ('bio', models.TextField(blank=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='healthcare_provider_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]