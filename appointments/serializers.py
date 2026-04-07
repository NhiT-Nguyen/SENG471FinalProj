from rest_framework import serializers
from .models import Appointment, Availability, AvailabilityConfirmation

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'healthcare_provider', 'date', 'time', 'duration', 'notes', 'location']

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'healthcare_provider', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'week_start_date', 'is_available']

class AvailabilityConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityConfirmation
        fields = ['id', 'healthcare_provider', 'week_start_date', 'confirmed', 'confirmed_at']