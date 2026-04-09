from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile, Patient, HealthcareProvider
from .serializers import (
    ProfileSerializer, PatientSerializer, PatientDetailSerializer,
    HealthcareProviderSerializer, HealthcareProviderDetailSerializer,
    UserSerializer,
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user and create their profile."""
    data = request.data
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    password = data.get('password', '')
    password_confirm = data.get('password_confirm', '')
    role = data.get('role', '')

    if not username or not password or not role:
        return Response(
            {'error': 'username, password and role are required'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Allow missing password_confirm for API clients that skip it
    if password_confirm and password != password_confirm:
        return Response(
            {'error': 'Passwords do not match'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valid_roles = [r[0] for r in Profile.ROLE_CHOICES]
    if role not in valid_roles:
        return Response(
            {'error': f'Invalid role. Choose from: {valid_roles}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {'error': 'Username already taken'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
    )
    Profile.objects.create(user=user, role=role)

    if role == 'healthcare_provider':
        specialty = data.get('specialty', 'general_practice')
        # Map free-text specialties to valid choices
        specialty_map = {
            'cardiology': 'cardiology', 'neurology': 'neurology', 'pediatrics': 'pediatrics',
            'orthopedics': 'orthopedics', 'dermatology': 'dermatology', 'psychiatry': 'psychiatry',
            'radiology': 'radiology', 'emergency medicine': 'emergency_medicine', 'emergency_medicine': 'emergency_medicine',
            'nursing': 'nursing', 'pharmacy': 'pharmacy', 'general practice': 'general_practice',
            'general_practice': 'general_practice',
        }
        specialty_key = specialty_map.get(specialty.lower(), 'other')
        HealthcareProvider.objects.create(
            user=user,
            specialty=specialty_key,
            license_number=data.get('license_number', ''),
            hospital_clinic=data.get('hospital_clinic_name', data.get('hospital_clinic', '')),
            phone_number=data.get('phone_number', ''),
            bio=data.get('bio', ''),
            years_of_experience=data.get('years_of_experience', 0) or 0,
        )

    elif role == 'patient':
        dob = data.get('date_of_birth', '1990-01-01') or '1990-01-01'
        patient_name = f"{first_name} {last_name}".strip() or username
        Patient.objects.create(
            user=user,
            name=patient_name,
            date_of_birth=dob,
        )

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            'token': token.key,
            'user': UserSerializer(user).data,
            'role': role,
        },
        status=status.HTTP_201_CREATED,
    )


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Return the authenticated user's profile."""
        try:
            profile = request.user.profile
        except Profile.DoesNotExist:
            return Response(
                {'error': 'No profile found for this user'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_my_profile(self, request):
        """Update the authenticated user's profile fields."""
        user = request.user
        data = request.data

        # Update User fields
        for field in ('first_name', 'last_name', 'email'):
            if field in data:
                setattr(user, field, data[field])
        user.save()

        # Update Profile role
        try:
            profile = user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=user, role=data.get('role', 'patient'))

        if 'role' in data:
            valid_roles = [r[0] for r in Profile.ROLE_CHOICES]
            if data['role'] not in valid_roles:
                return Response(
                    {'error': f'Invalid role. Choose from: {valid_roles}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            profile.role = data['role']
            profile.save()

        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    @action(detail=True, methods=['post'])
    def add_family_member(self, request, pk=None):
        """Add a user as a family member of this patient."""
        patient = self.get_object()
        username = request.data.get('username', '').strip()
        if not username:
            return Response(
                {'error': 'username is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': f'User "{username}" not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        patient.family_members.add(user)
        serializer = self.get_serializer(patient)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_family_member(self, request, pk=None):
        """Remove a user from the family members of this patient."""
        patient = self.get_object()
        username = request.data.get('username', '').strip()
        if not username:
            return Response(
                {'error': 'username is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'error': f'User "{username}" not found'},
                status=status.HTTP_404_NOT_FOUND,
            )
        patient.family_members.remove(user)
        serializer = self.get_serializer(patient)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_patient_record(self, request):
        """Return the Patient record for the currently logged-in patient user."""
        patient = Patient.objects.filter(user=request.user).first()
        if not patient:
            return Response(
                {'error': 'No patient record linked to your account'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = self.get_serializer(patient)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_family_patients(self, request):
        """Return all patients for which the current user is a family member."""
        patients = Patient.objects.filter(family_members=request.user)
        serializer = self.get_serializer(patients, many=True)
        return Response(serializer.data)


class HealthcareProviderViewSet(viewsets.ModelViewSet):
    queryset = HealthcareProvider.objects.all()
    serializer_class = HealthcareProviderSerializer
