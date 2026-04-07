from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Patient

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
    caregivers = UserSerializer(many=True)

    class Meta:
        model = Patient
        fields = ['id', 'name', 'date_of_birth', 'caregivers']
