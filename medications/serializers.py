from rest_framework import serializers
from .models import Medication

class MedicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medication
        fields = ['id', 'patient', 'name', 'dosage', 'schedule', 'start_date', 'end_date']