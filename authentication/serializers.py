from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Profile, Patient
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(max_length=20, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'role']

    def validate(self, data):
        """Validate that passwords match and username is unique."""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        if User.objects.filter(username=data.get('username')).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})

        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({'email': 'This email is already registered.'})

        role = data.get('role')
        valid_roles = ['caregiver', 'family_member', 'healthcare_provider']
        if role not in valid_roles:
            raise serializers.ValidationError({'role': f'Invalid role. Must be one of: {", ".join(valid_roles)}'})

        return data

    def create(self, validated_data):
        """Create a new user and associated profile."""
        password = validated_data.pop('password')
        password_confirm = validated_data.pop('password_confirm')
        role = validated_data.pop('role')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=password
        )

        # Create associated profile
        Profile.objects.create(user=user, role=role)

        # Create token for the user
        Token.objects.create(user=user)

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Authenticate user and check if account exists."""
        username = data.get('username')
        password = data.get('password')

        # First check if user exists
        if not User.objects.filter(username=username).exists():
            raise serializers.ValidationError({
                'detail': 'Account not found. Please create an account first.',
                'error_code': 'account_not_found'
            })

        # Authenticate the user
        user = authenticate(username=username, password=password)
        if user is None:
            raise serializers.ValidationError({
                'detail': 'Invalid username or password.',
                'error_code': 'invalid_credentials'
            })

        data['user'] = user
        return data


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = Profile
        fields = ['user', 'role']


class UpdateProfileSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(choices=['caregiver', 'family_member', 'healthcare_provider'], required=False)

    def validate_email(self, value):
        user = self.context['request'].user
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This email is already in use by another account.')
        return value

    def update(self, instance, validated_data):
        user = instance.user
        user.first_name = validated_data.get('first_name', user.first_name)
        user.last_name = validated_data.get('last_name', user.last_name)
        user.email = validated_data.get('email', user.email)
        user.save()

        instance.role = validated_data.get('role', instance.role)
        instance.save()
        return instance


class PatientSerializer(serializers.ModelSerializer):
    caregivers = UserSerializer(many=True)

    class Meta:
        model = Patient
        fields = ['id', 'name', 'date_of_birth', 'caregivers']