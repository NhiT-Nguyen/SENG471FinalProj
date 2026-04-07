from rest_framework import serializers
from .models import Appointment, Availability, AvailabilityConfirmation
from authentication.serializers import HealthcareProviderDetailSerializer

class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['id', 'patient', 'healthcare_provider', 'date', 'time', 'duration', 'notes', 'location']

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['id', 'healthcare_provider', 'day_of_week', 'start_time', 'end_time', 'is_recurring', 'week_start_date', 'is_available']

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