from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile, Patient
from .serializers import (
    ProfileSerializer, PatientSerializer, RegistrationSerializer,
    PatientRegistrationSerializer, LoginSerializer, UserSerializer,
    PatientDataSerializer
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


class PatientViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patients.
    Patients can view and update their own data.
    Caregivers can view patients they manage.
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter patients based on user role."""
        user = self.request.user
        try:
            profile = Profile.objects.get(user=user)
            
            # Patients can only see their own record
            if profile.role == 'patient':
                return Patient.objects.filter(user=user)
            
            # Caregivers can see patients they manage
            elif profile.role == 'caregiver':
                return Patient.objects.filter(caregivers_managed=user)
            
            # Healthcare providers can see all patients
            elif profile.role == 'healthcare_provider':
                return Patient.objects.all()
            
            # Family members can see patients they manage
            elif profile.role == 'family_member':
                return Patient.objects.filter(caregivers_managed=user)
        except Profile.DoesNotExist:
            return Patient.objects.none()

    @action(detail=False, methods=['get'])
    def my_patient_data(self, request):
        """Retrieve the current patient's own data (for patients only)."""
        try:
            profile = Profile.objects.get(user=request.user)
            if profile.role != 'patient':
                return Response(
                    {'error': 'This endpoint is only available for patients'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            patient = Patient.objects.get(user=request.user)
            serializer = self.get_serializer(patient)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Profile.DoesNotExist:
            return Response(
                {'error': 'Profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient data not found'},
                status=status.HTTP_404_NOT_FOUND
            )
