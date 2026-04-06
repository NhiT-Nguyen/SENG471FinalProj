from rest_framework import serializers
from .models import Medication, MedicationAdministration

class MedicationSerializer(serializers.ModelSerializer):
    prescribed_by_username = serializers.CharField(source='prescribed_by.username', read_only=True)
    is_current = serializers.ReadOnlyField()

    class Meta:
        model = Medication
        fields = ['id', 'patient', 'prescribed_by', 'prescribed_by_username', 'name', 'dosage', 'schedule', 'instructions', 'start_date', 'end_date', 'is_current', 'reminder_enabled', 'reminder_time', 'reminder_days']

class MedicationAdministrationSerializer(serializers.ModelSerializer):
    medication_name = serializers.CharField(source='medication.name', read_only=True)
    administered_by_username = serializers.CharField(source='administered_by.username', read_only=True)

    class Meta:
        model = MedicationAdministration
        fields = ['id', 'medication', 'medication_name', 'administered_at', 'administered_by', 'administered_by_username', 'taken', 'notes']