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

class IsMedicationOwnerOrCaregiverOrProvider(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return False

        if profile.role == 'healthcare_provider':
            return True
        if profile.role == 'patient':
            return hasattr(request.user, 'patient_profile') and obj.patient == request.user.patient_profile
        if profile.role in ['caregiver', 'family_member']:
            return obj.patient in request.user.patients.all() or obj.patient in request.user.family_patients.all()
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

            patients = list(user.patients.all()) + list(user.family_patients.all())
            if profile.role == 'patient' and hasattr(user, 'patient_profile'):
                patients.append(user.patient_profile)
            return Medication.objects.filter(patient__in=patients)
        except Profile.DoesNotExist:
            return Medication.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsHealthcareProvider()]
        if self.action in ['set_refill_reminder', 'clear_refill_reminder']:
            return [permissions.IsAuthenticated(), IsMedicationOwnerOrCaregiverOrProvider()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(prescribed_by=self.request.user)

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, IsMedicationOwnerOrCaregiverOrProvider])
    def set_refill_reminder(self, request, pk=None):
        medication = self.get_object()
        data = {
            'refill_reminder_enabled': request.data.get('refill_reminder_enabled', True),
            'refill_reminder_date': request.data.get('refill_reminder_date'),
            'refill_reminder_days_before': request.data.get(
                'refill_reminder_days_before',
                medication.refill_reminder_days_before if medication.refill_reminder_days_before is not None else 7
            ),
        }
        if data['refill_reminder_enabled'] and not data['refill_reminder_date']:
            return Response(
                {'detail': 'refill_reminder_date is required when enabling a refill reminder.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = self.get_serializer(medication, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsMedicationOwnerOrCaregiverOrProvider])
    def clear_refill_reminder(self, request, pk=None):
        medication = self.get_object()
        medication.refill_reminder_enabled = False
        medication.refill_reminder_date = None
        medication.refill_reminder_days_before = 0
        medication.save(update_fields=['refill_reminder_enabled', 'refill_reminder_date', 'refill_reminder_days_before'])
        serializer = self.get_serializer(medication)
        return Response(serializer.data)

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
