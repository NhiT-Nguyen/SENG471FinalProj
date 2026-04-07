from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile, Patient, HealthcareProvider, FamilyMember
from .serializers import (
    ProfileSerializer, PatientSerializer, RegistrationSerializer,
    PatientRegistrationSerializer, HealthcareProviderRegistrationSerializer,
    FamilyMemberRegistrationSerializer, LoginSerializer, UserSerializer,
    UpdateProfileSerializer, FamilyMemberSerializer
)


class RegistrationView(APIView):
    """
    API endpoint for user registration.
    Allows new users to create an account with a role (caregiver, family_member, healthcare_provider).
    For patient registration, use the /register/patient/ endpoint instead.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Register a new user (non-patient roles).
        
        Expected payload:
        {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "password": "string",
            "password_confirm": "string",
            "role": "caregiver|family_member|healthcare_provider"
        }
        """
        serializer = RegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = Token.objects.get(user=user)
            return Response(
                {
                    'message': 'User registered successfully',
                    'user': UserSerializer(user).data,
                    'token': token.key
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientRegistrationView(APIView):
    """
    API endpoint for patient account registration.
    Allows patients to create their own accounts with medical data.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Register a new patient account.
        
        Expected payload:
        {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "password": "string",
            "password_confirm": "string",
            "date_of_birth": "YYYY-MM-DD"
        }
        """
        serializer = PatientRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save()
            token = Token.objects.get(user=patient.user)
            return Response(
                {
                    'message': 'Patient account created successfully',
                    'patient': {
                        'id': patient.id,
                        'name': patient.name,
                        'date_of_birth': patient.date_of_birth,
                        'user': {
                            'id': patient.user.id,
                            'username': patient.user.username,
                            'email': patient.user.email,
                            'first_name': patient.user.first_name,
                            'last_name': patient.user.last_name
                        }
                    },
                    'token': token.key
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HealthcareProviderRegistrationView(APIView):
    """
    API endpoint for healthcare provider account registration.
    Allows healthcare providers to create their own accounts with professional data.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Register a new healthcare provider account.
        
        Expected payload:
        {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "password": "string",
            "password_confirm": "string",
            "license_number": "string",
            "specialization": "general_practice|cardiology|neurology|...",
            "hospital_clinic": "string (optional)",
            "phone_number": "string (optional)",
            "years_of_experience": integer (optional, default 0)
        }
        """
        serializer = HealthcareProviderRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            healthcare_provider = serializer.save()
            token = Token.objects.get(user=healthcare_provider.user)
            return Response(
                {
                    'message': 'Healthcare provider account created successfully',
                    'healthcare_provider': {
                        'id': healthcare_provider.id,
                        'license_number': healthcare_provider.license_number,
                        'specialization': healthcare_provider.specialization,
                        'specialization_display': healthcare_provider.get_specialization_display(),
                        'hospital_clinic': healthcare_provider.hospital_clinic,
                        'phone_number': healthcare_provider.phone_number,
                        'years_of_experience': healthcare_provider.years_of_experience,
                        'user': {
                            'id': healthcare_provider.user.id,
                            'username': healthcare_provider.user.username,
                            'email': healthcare_provider.user.email,
                            'first_name': healthcare_provider.user.first_name,
                            'last_name': healthcare_provider.user.last_name
                        }
                    },
                    'token': token.key
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FamilyMemberRegistrationView(APIView):
    """
    API endpoint for family member account registration.
    Allows family members to create their own accounts with relationship data.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Register a new family member account.

        Expected payload:
        {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "password": "string",
            "password_confirm": "string",
            "relationship_to_patient": "spouse|parent|child|sibling|...",
            "phone_number": "string (optional)",
            "address": "string (optional)",
            "emergency_contact": boolean (optional, default false),
            "preferred_contact_method": "phone|email|text" (optional, default email)
        }
        """
        serializer = FamilyMemberRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            family_member = serializer.save()
            token = Token.objects.get(user=family_member.user)
            return Response(
                {
                    'message': 'Family member account created successfully',
                    'family_member': {
                        'id': family_member.id,
                        'relationship_to_patient': family_member.relationship_to_patient,
                        'relationship_display': family_member.get_relationship_to_patient_display(),
                        'phone_number': family_member.phone_number,
                        'address': family_member.address,
                        'emergency_contact': family_member.emergency_contact,
                        'preferred_contact_method': family_member.preferred_contact_method,
                        'user': {
                            'id': family_member.user.id,
                            'username': family_member.user.username,
                            'email': family_member.user.email,
                            'first_name': family_member.user.first_name,
                            'last_name': family_member.user.last_name
                        }
                    },
                    'token': token.key
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    API endpoint for user login.
    Authenticates existing users (patients, caregivers, family members, healthcare providers)
    and returns their token.
    Prevents login for non-existent accounts and prompts account creation.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Login a user.
        
        Expected payload:
        {
            "username": "string",
            "password": "string"
        }
        
        Returns:
        - Token for authenticated users
        - Error with hint to create account if user doesn't exist
        - Error with invalid credentials if password is wrong
        """
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            profile = Profile.objects.get(user=user)
            
            response_data = {
                'message': 'Login successful',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': profile.role
                }
            }
            
            # Include patient data if user is a patient
            if profile.role == 'patient':
                try:
                    patient = Patient.objects.get(user=user)
                    response_data['patient'] = {
                        'id': patient.id,
                        'name': patient.name,
                        'date_of_birth': patient.date_of_birth
                    }
                except Patient.DoesNotExist:
                    pass
            
            # Include healthcare provider data if user is a healthcare provider
            if profile.role == 'healthcare_provider':
                try:
                    healthcare_provider = HealthcareProvider.objects.get(user=user)
                    response_data['healthcare_provider'] = {
                        'id': healthcare_provider.id,
                        'license_number': healthcare_provider.license_number,
                        'specialization': healthcare_provider.specialization,
                        'specialization_display': healthcare_provider.get_specialization_display(),
                        'hospital_clinic': healthcare_provider.hospital_clinic,
                        'phone_number': healthcare_provider.phone_number,
                        'years_of_experience': healthcare_provider.years_of_experience
                    }
                except HealthcareProvider.DoesNotExist:
                    pass
            
            # Include family member data if user is a family member
            if profile.role == 'family_member':
                try:
                    from .models import FamilyMember
                    family_member = FamilyMember.objects.get(user=user)
                    response_data['family_member'] = {
                        'id': family_member.id,
                        'relationship_to_patient': family_member.relationship_to_patient,
                        'relationship_display': family_member.get_relationship_to_patient_display(),
                        'phone_number': family_member.phone_number,
                        'address': family_member.address,
                        'emergency_contact': family_member.emergency_contact,
                        'preferred_contact_method': family_member.preferred_contact_method
                    }
                except FamilyMember.DoesNotExist:
                    pass
            
            return Response(response_data, status=status.HTTP_200_OK)

        errors = serializer.errors
        # Check if it's an account not found error
        if 'detail' in errors:
            return Response(
                {
                    'error': errors['detail'][0],
                    'error_code': 'account_not_found',
                    'action': 'Please register a new account. Use /register/ for staff or /register/patient/ for patients'
                },
                status=status.HTTP_401_UNAUTHORIZED
            )

        return Response(errors, status=status.HTTP_401_UNAUTHORIZED)


class ProfileViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user profiles.
    """
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Retrieve the current user's profile."""
        try:
            profile = Profile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['patch', 'put'])
    def update_my_profile(self, request):
        """Update the current user's profile fields (first_name, last_name, email, role)."""
        try:
            profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UpdateProfileSerializer(
            profile,
            data=request.data,
            partial=request.method == 'PATCH',
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.update(profile, serializer.validated_data)
            updated_profile = Profile.objects.get(user=request.user)
            return Response(ProfileSerializer(updated_profile).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patients.
    Patients can view and update their own data.
    Caregivers can view patients they manage.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def add_family_member(self, request, pk=None):
        """Add a family_member-role user to a patient's family_members list."""
        patient = self.get_object()
        serializer = FamilyMemberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(username=serializer.validated_data['username'])
        if patient.family_members.filter(pk=user.pk).exists():
            return Response(
                {'detail': f'{user.username} is already a family member of this patient.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        patient.family_members.add(user)
        return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def remove_family_member(self, request, pk=None):
        """Remove a user from a patient's family_members list."""
        patient = self.get_object()
        serializer = FamilyMemberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(username=serializer.validated_data['username'])
        if not patient.family_members.filter(pk=user.pk).exists():
            return Response(
                {'detail': f'{user.username} is not a family member of this patient.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        patient.family_members.remove(user)
        return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_family_patients(self, request):
        """Return all patients for which the current user is listed as a family member."""
        patients = Patient.objects.filter(family_members=request.user)
        return Response(PatientSerializer(patients, many=True).data, status=status.HTTP_200_OK)


class HealthcareProviderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing healthcare provider profiles.
    Healthcare providers can view and update their own data.
    Admin users can view all healthcare providers.
    """
    queryset = HealthcareProvider.objects.all()
    serializer_class = HealthcareProviderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter healthcare providers based on user role."""
        user = self.request.user
        try:
            profile = Profile.objects.get(user=user)
            
            # Healthcare providers can only see their own record
            if profile.role == 'healthcare_provider':
                return HealthcareProvider.objects.filter(user=user)
            
            # Admin/system users can see all healthcare providers
            # (You may want to add admin role checking here)
            return HealthcareProvider.objects.all()
        except Profile.DoesNotExist:
            return HealthcareProvider.objects.none()

    @action(detail=False, methods=['get'])
    def my_provider_data(self, request):
        """Retrieve the current healthcare provider's own data."""
        try:
            profile = Profile.objects.get(user=request.user)
            if profile.role != 'healthcare_provider':
                return Response(
                    {'error': 'This endpoint is only available for healthcare providers'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            healthcare_provider = HealthcareProvider.objects.get(user=request.user)
            serializer = self.get_serializer(healthcare_provider)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except HealthcareProvider.DoesNotExist:
            return Response(
                {'error': 'Healthcare provider data not found'},
                status=status.HTTP_404_NOT_FOUND
            )
