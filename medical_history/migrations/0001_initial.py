from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('appointments', '0004_appointment_notes'),
        ('authentication', '0003_merge_20260407_1538'),
        ('medications', '0003_update_medication_for_prescriptions'),
    ]

    operations = [
        migrations.CreateModel(
            name='MedicalRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('record_type', models.CharField(choices=[('appointment', 'Appointment Visit'), ('medication', 'Medication Record'), ('lab_test', 'Lab Test Result'), ('diagnosis', 'Diagnosis'), ('procedure', 'Procedure'), ('vaccination', 'Vaccination'), ('allergy', 'Allergy'), ('note', 'Clinical Note')], max_length=20)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('files', models.TextField(blank=True, help_text='JSON list of file references')),
                ('recorded_date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('appointment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='medical_records', to='appointments.appointment')),
                ('healthcare_provider', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='authentication.healthcareprovider')),
                ('medication', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='medical_records', to='medications.medication')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='medical_records', to='authentication.patient')),
            ],
            options={
                'ordering': ['-recorded_date', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MedicalHistorySummary',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_appointments', models.PositiveIntegerField(default=0)),
                ('active_medications_count', models.PositiveIntegerField(default=0)),
                ('known_allergies', models.TextField(blank=True, help_text='Comma-separated list of known allergies')),
                ('chronic_conditions', models.TextField(blank=True, help_text='Comma-separated list of chronic conditions')),
                ('last_visit_date', models.DateField(blank=True, null=True)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('patient', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='medical_summary', to='authentication.patient')),
            ],
        ),
        migrations.AddIndex(
            model_name='medicalrecord',
            index=models.Index(fields=['patient', '-recorded_date'], name='medical_his_patient_idx_idx'),
        ),
        migrations.AddIndex(
            model_name='medicalrecord',
            index=models.Index(fields=['patient', 'record_type'], name='medical_his_patient_idx2_idx'),
        ),
    ]
