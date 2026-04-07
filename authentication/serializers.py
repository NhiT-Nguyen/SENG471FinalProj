from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Profile, Patient, HealthcareProvider
from django.contrib.auth import authenticate


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class PatientDataSerializer(serializers.ModelSerializer):
    """Serializer for patient-specific data"""
    class Meta:
        model = Patient
        fields = ['id', 'name', 'date_of_birth']
        read_only_fields = ['id']


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
        valid_roles = ['patient', 'caregiver', 'family_member', 'healthcare_provider']
        if role not in valid_roles:
            raise serializers.ValidationError({'role': f'Invalid role. Must be one of: {", ".join(valid_roles)}'})

        return data

    def create(self, validated_data):
        """Create a new user and associated profile."""
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
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


class PatientRegistrationSerializer(serializers.Serializer):
    """Serializer for patient registration with medical data"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    date_of_birth = serializers.DateField(required=True)

    def validate(self, data):
        """Validate patient registration data."""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        if User.objects.filter(username=data.get('username')).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})

        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({'email': 'This email is already registered.'})

        return data

    def create(self, validated_data):
        """Create a patient user account with patient profile data."""
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        date_of_birth = validated_data.pop('date_of_birth')

        # Create User account for patient
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=password
        )

        # Create Profile with patient role
        Profile.objects.create(user=user, role='patient')

        # Create Patient record linked to the user
        patient = Patient.objects.create(
            user=user,
            name=f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip() or validated_data['username'],
            date_of_birth=date_of_birth
        )

        # Create token for the patient user
        Token.objects.create(user=user)

        return patient


class HealthcareProviderRegistrationSerializer(serializers.Serializer):
    """Serializer for healthcare provider registration with professional data"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    license_number = serializers.CharField(max_length=50)
    specialization = serializers.ChoiceField(choices=[
        ('general_practice', 'General Practice'),
        ('cardiology', 'Cardiology'),
        ('neurology', 'Neurology'),
        ('pediatrics', 'Pediatrics'),
        ('orthopedics', 'Orthopedics'),
        ('dermatology', 'Dermatology'),
        ('psychiatry', 'Psychiatry'),
        ('radiology', 'Radiology'),
        ('emergency_medicine', 'Emergency Medicine'),
        ('nursing', 'Nursing'),
        ('pharmacy', 'Pharmacy'),
        ('other', 'Other'),
    ])
    hospital_clinic = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    years_of_experience = serializers.IntegerField(min_value=0, default=0)

    def validate(self, data):
        """Validate healthcare provider registration data."""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        if User.objects.filter(username=data.get('username')).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})

        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({'email': 'This email is already registered.'})

        if HealthcareProvider.objects.filter(license_number=data.get('license_number')).exists():
            raise serializers.ValidationError({'license_number': 'This license number is already registered.'})

        return data

    def create(self, validated_data):
        """Create a healthcare provider user account with professional profile data."""
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        license_number = validated_data.pop('license_number')
        specialization = validated_data.pop('specialization')
        hospital_clinic = validated_data.pop('hospital_clinic', '')
        phone_number = validated_data.pop('phone_number', '')
        years_of_experience = validated_data.pop('years_of_experience', 0)

        # Create User account for healthcare provider
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=password
        )

        # Create Profile with healthcare_provider role
        Profile.objects.create(user=user, role='healthcare_provider')

        # Create HealthcareProvider record linked to the user
        healthcare_provider = HealthcareProvider.objects.create(
            user=user,
            license_number=license_number,
            specialization=specialization,
            hospital_clinic=hospital_clinic,
            phone_number=phone_number,
            years_of_experience=years_of_experience
        )

        # Create token for the healthcare provider user
        Token.objects.create(user=user)

        return healthcare_provider


class FamilyMemberRegistrationSerializer(serializers.Serializer):
    """Serializer for family member registration with relationship data"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    relationship_to_patient = serializers.ChoiceField(choices=[
        ('spouse', 'Spouse'),
        ('parent', 'Parent'),
        ('child', 'Child'),
        ('sibling', 'Sibling'),
        ('grandparent', 'Grandparent'),
        ('grandchild', 'Grandchild'),
        ('aunt_uncle', 'Aunt/Uncle'),
        ('niece_nephew', 'Niece/Nephew'),
        ('cousin', 'Cousin'),
        ('in_law', 'In-law'),
        ('guardian', 'Guardian'),
        ('other', 'Other'),
    ], default='other')
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    emergency_contact = serializers.BooleanField(default=False)
    preferred_contact_method = serializers.ChoiceField(
        choices=[('phone', 'Phone'), ('email', 'Email'), ('text', 'Text Message')],
        default='email'
    )

    def validate(self, data):
        """Validate family member registration data."""
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        if User.objects.filter(username=data.get('username')).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})

        if User.objects.filter(email=data.get('email')).exists():
            raise serializers.ValidationError({'email': 'This email is already registered.'})

        return data

    def create(self, validated_data):
        """Create a family member user account with relationship profile data."""
        password = validated_data.pop('password')
        validated_data.pop('password_confirm')
        relationship_to_patient = validated_data.pop('relationship_to_patient')
        phone_number = validated_data.pop('phone_number', '')
        address = validated_data.pop('address', '')
        emergency_contact = validated_data.pop('emergency_contact', False)
        preferred_contact_method = validated_data.pop('preferred_contact_method', 'email')

        # Create User account for family member
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=password
        )

        # Create Profile with family_member role
        Profile.objects.create(user=user, role='family_member')

        # Create FamilyMember record linked to the user
        family_member = FamilyMember.objects.create(
            user=user,
            relationship_to_patient=relationship_to_patient,
            phone_number=phone_number,
            address=address,
            emergency_contact=emergency_contact,
            preferred_contact_method=preferred_contact_method
        )

        # Create token for the family member user
        Token.objects.create(user=user)

        return family_member


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
    caregivers = UserSerializer(many=True, read_only=True)
    family_members = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Patient
        fields = ['id', 'name', 'date_of_birth', 'caregivers', 'family_members']


class HealthcareProviderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = HealthcareProvider
        fields = ['id', 'user', 'license_number', 'specialization', 'specialization_display', 'hospital_clinic', 'phone_number', 'years_of_experience']

    def get_specialization_display(self, obj):
        return obj.get_specialization_display()


class FamilyMemberSerializer(serializers.Serializer):
    username = serializers.CharField()

    def validate_username(self, value):
        try:
            user = User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError(f'No user found with username "{value}".')
        try:
            profile = user.profile
        except Exception:
            raise serializers.ValidationError('That user does not have a profile.')
        if profile.role != 'family_member':
            raise serializers.ValidationError(
                f'User "{value}" has role "{profile.role}". Only users with role "family_member" can be added.'
            )
        return value


class FamilyMemberModelSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = FamilyMember
        fields = ['id', 'user', 'relationship_to_patient', 'relationship_display', 'phone_number', 'address', 'emergency_contact', 'preferred_contact_method']

    def get_relationship_display(self, obj):
        return obj.get_relationship_to_patient_display()
