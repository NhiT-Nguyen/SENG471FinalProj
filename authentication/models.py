from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = [
        ('patient', 'Patient'),
        ('caregiver', 'Caregiver'),
        ('family_member', 'Family Member'),
        ('healthcare_provider', 'Healthcare Provider'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='patient_profile')
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    caregivers = models.ManyToManyField(User, related_name='patients')
    family_members = models.ManyToManyField(User, related_name='family_patients', blank=True)

    def __str__(self):
        return self.name

class HealthcareProvider(models.Model):
    SPECIALTY_CHOICES = [
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
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='healthcare_provider_profile')
    specialty = models.CharField(max_length=50, choices=SPECIALTY_CHOICES, default='general_practice')
    license_number = models.CharField(max_length=100, blank=True)
    hospital_clinic = models.CharField(max_length=200, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_specialty_display()}"

class HealthcareProvider(models.Model):
    SPECIALIZATION_CHOICES = [
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
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='healthcare_provider_profile')
    license_number = models.CharField(max_length=50, unique=True)
    specialization = models.CharField(max_length=20, choices=SPECIALIZATION_CHOICES)
    hospital_clinic = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.get_specialization_display()}"

class FamilyMember(models.Model):
    RELATIONSHIP_CHOICES = [
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
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='family_member_profile')
    relationship_to_patient = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES, default='other')
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    emergency_contact = models.BooleanField(default=False)
    preferred_contact_method = models.CharField(
        max_length=10,
        choices=[('phone', 'Phone'), ('email', 'Email'), ('text', 'Text Message')],
        default='email'
    )

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_relationship_to_patient_display()}"
