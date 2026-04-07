from rest_framework import serializers
from .models import Appointment, Availability, AvailabilityConfirmation, AppointmentRequest
from authentication.serializers import HealthcareProviderDetailSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'healthcare_provider', 'date', 'time', 'duration', 'notes', 'location']

class AvailabilitySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Availability
        fields = ['id', 'healthcare_provider', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'week_start_date', 'status', 'status_display', 'is_available']

class AvailabilityWithProviderSerializer(serializers.ModelSerializer):
    provider_details = serializers.SerializerMethodField()
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Availability
        fields = ['id', 'healthcare_provider', 'provider_details', 'day_of_week', 'day_of_week_display', 'start_time', 'end_time', 'is_recurring', 'week_start_date', 'is_available']
    
    def get_provider_details(self, obj):
        from authentication.models import HealthcareProvider
        try:
            provider = HealthcareProvider.objects.get(user=obj.healthcare_provider)
            return HealthcareProviderDetailSerializer(provider).data
        except HealthcareProvider.DoesNotExist:
            return {}

class AvailabilityConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AvailabilityConfirmation
        fields = ['id', 'healthcare_provider', 'week_start_date', 'confirmed', 'confirmed_at']


class AppointmentRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    change_status_display = serializers.CharField(source='get_change_status_display', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    provider_name = serializers.CharField(source='healthcare_provider.get_full_name', read_only=True)

    class Meta:
        model = AppointmentRequest
        fields = [
            'id', 'patient', 'patient_name', 'healthcare_provider', 'provider_name',
            'requested_date', 'requested_start_time', 'requested_end_time',
            'notes', 'status', 'status_display',
            'appointment', 'proposed_date', 'proposed_start_time', 'proposed_end_time', 'proposed_notes',
            'change_status', 'change_status_display', 'change_requested_at',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at', 'patient_name', 'provider_name', 'change_status', 'change_status_display', 'change_requested_at', 'appointment']