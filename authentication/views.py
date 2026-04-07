from rest_framework import viewsets
from .models import Profile, Patient, HealthcareProvider
from .serializers import ProfileSerializer, PatientSerializer, HealthcareProviderSerializer, HealthcareProviderDetailSerializer

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

class HealthcareProviderViewSet(viewsets.ModelViewSet):
    queryset = HealthcareProvider.objects.all()
    serializer_class = HealthcareProviderSerializer
