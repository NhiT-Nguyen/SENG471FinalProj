from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Medication
from .serializers import MedicationSerializer
from authentication.models import HealthcareProvider, Patient

class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        if profile and profile.role == 'healthcare_provider':
            # Healthcare providers can see medications they prescribed
            provider = getattr(user, 'healthcare_provider_profile', None)
            if provider:
                return Medication.objects.filter(prescribed_by=provider).order_by('-prescribed_date')
        elif profile and profile.role == 'patient':
            # Patients can see their own medications
            patient = getattr(user, 'patient_profile', None)
            if patient:
                return Medication.objects.filter(patient=patient).order_by('-prescribed_date')
        elif profile and profile.role in ['caregiver', 'family_member']:
            # Caregivers and family members can see medications for their patients
            patient_ids = []
            if profile.role == 'caregiver':
                patient_ids = list(user.patients.values_list('id', flat=True))
            elif profile.role == 'family_member':
                patient_ids = list(user.family_patients.values_list('id', flat=True))
            return Medication.objects.filter(patient_id__in=patient_ids).order_by('-prescribed_date')
        return Medication.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        if not profile or profile.role != 'healthcare_provider':
            raise serializers.ValidationError("Only healthcare providers can prescribe medications.")
        
        provider = getattr(user, 'healthcare_provider_profile', None)
        if not provider:
            raise serializers.ValidationError("Healthcare provider profile not found.")
        
        serializer.save(prescribed_by=provider)

    @action(detail=True, methods=['post'])
    def discontinue(self, request, pk=None):
        medication = self.get_object()
        user = request.user
        profile = getattr(user, 'profile', None)
        if not profile or profile.role != 'healthcare_provider':
            return Response({"error": "Only healthcare providers can discontinue prescriptions."}, status=status.HTTP_403_FORBIDDEN)
        
        provider = getattr(user, 'healthcare_provider_profile', None)
        if medication.prescribed_by != provider:
            return Response({"error": "You can only discontinue prescriptions you created."}, status=status.HTTP_403_FORBIDDEN)
        
        medication.status = 'discontinued'
        medication.save()
        serializer = self.get_serializer(medication)
        return Response(serializer.data)
