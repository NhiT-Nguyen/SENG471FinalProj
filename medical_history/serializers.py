from rest_framework import serializers
from .models import MedicalRecord, MedicalHistorySummary
from appointments.models import Appointment
from medications.models import Medication


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    provider_name = serializers.CharField(source='healthcare_provider.user.get_full_name', read_only=True, allow_null=True)
    appointment_date = serializers.DateField(source='appointment.date', read_only=True, allow_null=True)
    medication_name = serializers.CharField(source='medication.name', read_only=True, allow_null=True)
    
    class Meta:
        model = MedicalRecord
        fields = [
            'id', 'patient', 'patient_name', 'record_type', 'title', 'description',
            'appointment', 'appointment_date', 'medication', 'medication_name',
            'healthcare_provider', 'provider_name', 'recorded_date',
            'files', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MedicalHistorySummarySerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_dob = serializers.DateField(source='patient.date_of_birth', read_only=True)
    
    class Meta:
        model = MedicalHistorySummary
        fields = [
            'id', 'patient', 'patient_name', 'patient_dob',
            'total_appointments', 'active_medications_count',
            'known_allergies', 'chronic_conditions',
            'last_visit_date', 'last_updated'
        ]
        read_only_fields = ['last_updated']


class ComprehensiveMedicalHistorySerializer(serializers.Serializer):
    """
    Comprehensive medical history combining appointments, medications, and records
    """
    patient_info = serializers.SerializerMethodField()
    summary = serializers.SerializerMethodField()
    appointments = serializers.SerializerMethodField()
    medications = serializers.SerializerMethodField()
    medical_records = serializers.SerializerMethodField()

    def get_patient_info(self, obj):
        from authentication.serializers import PatientDetailSerializer
        patient = obj.get('patient')
        if patient:
            return PatientDetailSerializer(patient).data
        return None

    def get_summary(self, obj):
        patient = obj.get('patient')
        if patient:
            try:
                summary = patient.medical_summary
                return MedicalHistorySummarySerializer(summary).data
            except MedicalHistorySummary.DoesNotExist:
                return None
        return None

    def get_appointments(self, obj):
        from appointments.serializers import AppointmentSerializer
        appointments = obj.get('appointments', [])
        return AppointmentSerializer(appointments, many=True).data

    def get_medications(self, obj):
        from medications.serializers import MedicationSerializer
        medications = obj.get('medications', [])
        return MedicationSerializer(medications, many=True).data

    def get_medical_records(self, obj):
        records = obj.get('medical_records', [])
        return MedicalRecordSerializer(records, many=True).data
