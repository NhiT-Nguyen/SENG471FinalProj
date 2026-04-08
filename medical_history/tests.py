from django.test import TestCase
from django.contrib.auth.models import User
from authentication.models import Patient, HealthcareProvider, Profile
from appointments.models import Appointment
from medications.models import Medication
from medical_history.models import MedicalRecord, MedicalHistorySummary
from datetime import date, time, timedelta
import json


class MedicalRecordTests(TestCase):
    def setUp(self):
        """Create test data"""
        # Create a patient user
        self.patient_user = User.objects.create_user(
            username='testpatient',
            email='patient@test.com',
            password='testpass123'
        )
        Profile.objects.create(user=self.patient_user, role='patient')
        self.patient = Patient.objects.create(
            user=self.patient_user,
            name='John Doe',
            date_of_birth=date(1990, 1, 1)
        )

        # Create a healthcare provider user
        self.provider_user = User.objects.create_user(
            username='testprovider',
            email='provider@test.com',
            password='testpass123',
            first_name='Dr.',
            last_name='Smith'
        )
        Profile.objects.create(user=self.provider_user, role='healthcare_provider')
        self.provider = HealthcareProvider.objects.create(
            user=self.provider_user,
            specialty='general_practice'
        )

    def test_medical_record_creation(self):
        """Test creating a medical record"""
        record = MedicalRecord.objects.create(
            patient=self.patient,
            record_type='appointment',
            title='General Checkup',
            description='Annual physical examination',
            healthcare_provider=self.provider,
            recorded_date=date.today()
        )
        self.assertEqual(record.patient.name, 'John Doe')
        self.assertEqual(record.record_type, 'appointment')

    def test_medical_record_with_appointment(self):
        """Test medical record linked to appointment"""
        appointment = Appointment.objects.create(
            patient=self.patient,
            healthcare_provider=self.provider_user,
            date=date.today(),
            time=time(10, 0),
            notes='Patient doing well',
            reasons_for_visit='Follow-up'
        )
        record = MedicalRecord.objects.create(
            patient=self.patient,
            record_type='appointment',
            title='Follow-up Appointment',
            appointment=appointment,
            healthcare_provider=self.provider,
            recorded_date=date.today()
        )
        self.assertEqual(record.appointment.id, appointment.id)

    def test_medical_history_summary(self):
        """Test medical history summary creation"""
        summary = MedicalHistorySummary.objects.create(
            patient=self.patient,
            known_allergies='Penicillin, Sulfa',
            chronic_conditions='Hypertension, Type 2 Diabetes'
        )
        self.assertEqual(summary.patient.name, 'John Doe')
        self.assertIn('Penicillin', summary.known_allergies)
