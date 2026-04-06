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
    LoginSerializer, UserSerializer
)


class RegistrationView(APIView):
    """
    API endpoint for user registration.
    Allows new users to create an account with a role.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Register a new user.
        
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


class LoginView(APIView):
    """
    API endpoint for user login.
    Authenticates existing users and returns their token.
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
            
            return Response(
                {
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
                },
                status=status.HTTP_200_OK
            )

        errors = serializer.errors
        # Check if it's an account not found error
        if 'detail' in errors:
            return Response(
                {
                    'error': errors['detail'][0],
                    'error_code': 'account_not_found',
                    'action': 'Please register a new account using the /register/ endpoint'
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
    """
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
