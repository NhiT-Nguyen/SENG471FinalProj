from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Patient, HealthcareProvider

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    # Flat convenience fields for the frontend
    user_username  = serializers.CharField(source='user.username', read_only=True)
    user_email     = serializers.CharField(source='user.email', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name  = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = Profile
        fields = ['user', 'role', 'user_username', 'user_email', 'user_first_name', 'user_last_name']

class PatientSerializer(serializers.ModelSerializer):
    caregivers = UserSerializer(many=True, read_only=True)
    family_members = UserSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'user', 'user_username', 'name', 'date_of_birth', 'caregivers', 'family_members']

class PatientDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'name', 'date_of_birth', 'user']

class HealthcareProviderSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    specialty_display = serializers.CharField(source='get_specialty_display', read_only=True)
    user_username  = serializers.CharField(source='user.username', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_last_name  = serializers.CharField(source='user.last_name', read_only=True)
    years_of_experience = serializers.IntegerField(read_only=True)

    class Meta:
        model = HealthcareProvider
        fields = ['id', 'user', 'user_username', 'user_first_name', 'user_last_name',
                  'specialty', 'specialty_display', 'license_number', 'hospital_clinic',
                  'phone_number', 'bio', 'years_of_experience']

class HealthcareProviderDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_id = serializers.CharField(source='user.id', read_only=True)
    specialty_display = serializers.CharField(source='get_specialty_display', read_only=True)

    class Meta:
        model = HealthcareProvider
        fields = ['id', 'user_id', 'user_name', 'user_email', 'specialty', 'specialty_display', 'license_number', 'hospital_clinic', 'phone_number', 'bio']
