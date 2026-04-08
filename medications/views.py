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
        status_filter = self.request.query_params.get('status', None)
        
        queryset = Medication.objects.all()
        
        if profile and profile.role == 'healthcare_provider':
            # Healthcare providers can see medications they prescribed
            provider = getattr(user, 'healthcare_provider_profile', None)
            if provider:
                queryset = queryset.filter(prescribed_by=provider)
        elif profile and profile.role == 'patient':
            # Patients can see their own medications
            patient = getattr(user, 'patient_profile', None)
            if patient:
                queryset = queryset.filter(patient=patient)
        elif profile and profile.role in ['caregiver', 'family_member']:
            # Caregivers and family members can see medications for their patients
            patient_ids = []
            if profile.role == 'caregiver':
                patient_ids = list(user.patients.values_list('id', flat=True))
            elif profile.role == 'family_member':
                patient_ids = list(user.family_patients.values_list('id', flat=True))
            queryset = queryset.filter(patient_id__in=patient_ids)
        else:
            return Medication.objects.none()
        
        # Apply status filter if provided
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-prescribed_date')

    def perform_create(self, serializer):
        user = self.request.user
        profile = getattr(user, 'profile', None)
        if not profile or profile.role != 'healthcare_provider':
            raise serializers.ValidationError("Only healthcare providers can prescribe medications.")
        
        provider = getattr(user, 'healthcare_provider_profile', None)
        if not provider:
            raise serializers.ValidationError("Healthcare provider profile not found.")
        
        serializer.save(prescribed_by=provider)

    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current (active) medications for the user"""
        user = request.user
        profile = getattr(user, 'profile', None)
        
        if profile and profile.role == 'patient':
            patient = getattr(user, 'patient_profile', None)
            if patient:
                medications = Medication.objects.filter(
                    patient=patient, 
                    status='active'
                ).order_by('-prescribed_date')
                serializer = self.get_serializer(medications, many=True)
                return Response(serializer.data)
        elif profile and profile.role in ['caregiver', 'family_member']:
            patient_ids = []
            if profile.role == 'caregiver':
                patient_ids = list(user.patients.values_list('id', flat=True))
            elif profile.role == 'family_member':
                patient_ids = list(user.family_patients.values_list('id', flat=True))
            medications = Medication.objects.filter(
                patient_id__in=patient_ids,
                status='active'
            ).order_by('-prescribed_date')
            serializer = self.get_serializer(medications, many=True)
            return Response(serializer.data)
        
        return Response({"detail": "Not authorized to view medications."}, status=status.HTTP_403_FORBIDDEN)
