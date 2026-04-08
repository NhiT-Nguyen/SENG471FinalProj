from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Patient, HealthcareProvider

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Profile
        fields = ['user', 'role']

class PatientSerializer(serializers.ModelSerializer):
    caregivers = UserSerializer(many=True, read_only=True)
    family_members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'user', 'name', 'date_of_birth', 'caregivers', 'family_members']

class PatientDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'name', 'date_of_birth', 'user']

class HealthcareProviderSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    specialty_display = serializers.CharField(source='get_specialty_display', read_only=True)

    class Meta:
        model = HealthcareProvider
        fields = ['id', 'user', 'specialty', 'specialty_display', 'license_number', 'hospital_clinic', 'phone_number', 'bio']

class HealthcareProviderDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.CharField(source='user.id', read_only=True)
    specialty_display = serializers.CharField(source='get_specialty_display', read_only=True)

    class Meta:
        model = HealthcareProvider
        fields = ['id', 'user_id', 'user_name', 'user_email', 'specialty', 'specialty_display', 'license_number', 'hospital_clinic', 'phone_number', 'bio']
