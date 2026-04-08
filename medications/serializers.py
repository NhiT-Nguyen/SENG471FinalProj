from rest_framework import serializers
from .models import Medication

class MedicationSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.CharField(source='prescribed_by.user.get_full_name', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = Medication
        fields = ['id', 'patient', 'patient_name', 'prescribed_by', 'prescribed_by_name', 'name', 'dosage', 'frequency', 'start_date', 'end_date', 'administration_instructions', 'status', 'prescribed_date']
        read_only_fields = ['prescribed_by', 'prescribed_date']