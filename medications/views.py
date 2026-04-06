from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Medication, MedicationAdministration
from .serializers import MedicationSerializer, MedicationAdministrationSerializer
from authentication.models import Profile

class IsHealthcareProvider(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            try:
                profile = Profile.objects.get(user=request.user)
                return profile.role == 'healthcare_provider'
            except Profile.DoesNotExist:
                return False
        return False

class IsPatientOrCaregiver(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_authenticated:
            try:
                profile = Profile.objects.get(user=request.user)
                if profile.role in ['caregiver', 'family_member']:
                    return obj.patient in request.user.patients.all() or obj.patient in request.user.family_patients.all()
                elif profile.role == 'healthcare_provider':
                    return True  # Providers can see all
            except Profile.DoesNotExist:
                return False
        return False

class MedicationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            profile = Profile.objects.get(user=user)
            if profile.role == 'healthcare_provider':
                return Medication.objects.all()
            else:
                # For caregivers/family, show medications for their patients
                patients = list(user.patients.all()) + list(user.family_patients.all())
                return Medication.objects.filter(patient__in=patients)
        except Profile.DoesNotExist:
            return Medication.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsHealthcareProvider()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(prescribed_by=self.request.user)

    @action(detail=False, methods=['get'])
    def current(self, request):
        queryset = self.get_queryset().filter(end_date__isnull=True) | self.get_queryset().filter(end_date__gte=timezone.now().date())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def past(self, request):
        queryset = self.get_queryset().filter(end_date__lt=timezone.now().date())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class MedicationAdministrationViewSet(viewsets.ModelViewSet):
    serializer_class = MedicationAdministrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            profile = Profile.objects.get(user=user)
            if profile.role == 'healthcare_provider':
                return MedicationAdministration.objects.all()
            else:
                patients = list(user.patients.all()) + list(user.family_patients.all())
                return MedicationAdministration.objects.filter(medication__patient__in=patients)
        except Profile.DoesNotExist:
            return MedicationAdministration.objects.none()

    def perform_create(self, serializer):
        serializer.save(administered_by=self.request.user)
