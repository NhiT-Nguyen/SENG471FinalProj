from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404

from .models import MedicalRecord, MedicalHistorySummary
from .serializers import (
    MedicalRecordSerializer, 
    MedicalHistorySummarySerializer,
    ComprehensiveMedicalHistorySerializer
)
from appointments.models import Appointment
from medications.models import Medication
from authentication.models import Patient, Profile


class MedicalRecordViewSet(viewsets.ModelViewSet):
    """
    API endpoints for medical records.
    Supports viewing and managing comprehensive medical history.
    """
    serializer_class = MedicalRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter records based on user role and permissions"""
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return MedicalRecord.objects.none()

        if profile.role == 'patient':
            patient = getattr(user, 'patient_profile', None)
            if patient:
                return MedicalRecord.objects.filter(patient=patient).order_by('-recorded_date')
        
        elif profile.role in ['caregiver', 'family_member']:
            patient_ids = []
            if profile.role == 'caregiver':
                patient_ids = list(user.patients.values_list('id', flat=True))
            elif profile.role == 'family_member':
                patient_ids = list(user.family_patients.values_list('id', flat=True))
            
            return MedicalRecord.objects.filter(
                patient_id__in=patient_ids
            ).order_by('-recorded_date')
        
        elif profile.role == 'healthcare_provider':
            provider = getattr(user, 'healthcare_provider_profile', None)
            if provider:
                return MedicalRecord.objects.filter(
                    healthcare_provider=provider
                ).order_by('-recorded_date')

        return MedicalRecord.objects.none()

    def perform_create(self, serializer):
        """Allow healthcare providers to create medical records"""
        user = self.request.user
        profile = getattr(user, 'profile', None)
        
        if profile and profile.role == 'healthcare_provider':
            provider = getattr(user, 'healthcare_provider_profile', None)
            serializer.save(healthcare_provider=provider)
        else:
            raise ValidationError(
                "Only healthcare providers can create medical records."
            )

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get medical records filtered by type"""
        record_type = request.query_params.get('type')
        queryset = self.get_queryset()
        
        if record_type:
            queryset = queryset.filter(record_type=record_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent medical records"""
        limit = int(request.query_params.get('limit', 10))
        queryset = self.get_queryset()[:limit]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class MedicalHistorySummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoints for medical history summaries.
    Provides quick access to key medical information.
    """
    serializer_class = MedicalHistorySummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter summaries based on user permissions"""
        user = self.request.user
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return MedicalHistorySummary.objects.none()

        if profile.role == 'patient':
            patient = getattr(user, 'patient_profile', None)
            if patient:
                return MedicalHistorySummary.objects.filter(patient=patient)
        
        elif profile.role in ['caregiver', 'family_member']:
            patient_ids = []
            if profile.role == 'caregiver':
                patient_ids = list(user.patients.values_list('id', flat=True))
            elif profile.role == 'family_member':
                patient_ids = list(user.family_patients.values_list('id', flat=True))
            
            return MedicalHistorySummary.objects.filter(patient_id__in=patient_ids)

        return MedicalHistorySummary.objects.none()


class ComprehensiveMedicalHistoryViewSet(viewsets.ViewSet):
    """
    Comprehensive view combining all medical history information
    (appointments, medications, medical records) for a patient.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def patient_history(self, request):
        """Get complete medical history for a patient"""
        patient_id = request.query_params.get('patient_id')
        user = request.user
        
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response(
                {'error': 'User profile required'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Determine which patient to access
        target_patient = None
        
        if profile.role == 'patient' and not patient_id:
            target_patient = getattr(user, 'patient_profile', None)
        elif patient_id:
            target_patient = get_object_or_404(Patient, id=patient_id)
            
            # Verify access permissions
            if profile.role == 'patient':
                if target_patient != getattr(user, 'patient_profile', None):
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif profile.role == 'caregiver':
                if target_patient not in user.patients.all():
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif profile.role == 'family_member':
                if target_patient not in user.family_patients.all():
                    return Response(
                        {'error': 'Access denied'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            elif profile.role != 'healthcare_provider':
                return Response(
                    {'error': 'Access denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
        else:
            return Response(
                {'error': 'Patient ID required or user must be a patient'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not target_patient:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Fetch all medical history data
        appointments = Appointment.objects.filter(patient=target_patient).order_by('-date')
        medications = Medication.objects.filter(patient=target_patient).order_by('-prescribed_date')
        medical_records = MedicalRecord.objects.filter(patient=target_patient).order_by('-recorded_date')

        data = {
            'patient': target_patient,
            'appointments': appointments,
            'medications': medications,
            'medical_records': medical_records,
        }

        serializer = ComprehensiveMedicalHistorySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_history(self, request):
        """Get current logged-in user's medical history"""
        user = request.user
        
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            return Response(
                {'error': 'User profile required'},
                status=status.HTTP_403_FORBIDDEN
            )

        if profile.role != 'patient':
            return Response(
                {'error': 'Only patients can view their own history'},
                status=status.HTTP_403_FORBIDDEN
            )

        patient = getattr(user, 'patient_profile', None)
        if not patient:
            return Response(
                {'error': 'Patient profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Fetch all medical history data
        appointments = Appointment.objects.filter(patient=patient).order_by('-date')
        medications = Medication.objects.filter(patient=patient).order_by('-prescribed_date')
        medical_records = MedicalRecord.objects.filter(patient=patient).order_by('-recorded_date')

        data = {
            'patient': patient,
            'appointments': appointments,
            'medications': medications,
            'medical_records': medical_records,
        }

        serializer = ComprehensiveMedicalHistorySerializer(data)
        return Response(serializer.data)
