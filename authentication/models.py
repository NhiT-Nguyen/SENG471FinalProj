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
