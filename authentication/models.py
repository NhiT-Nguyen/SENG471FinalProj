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
    caregivers = models.ManyToManyField(User, related_name='patients_managed')

    def __str__(self):
        return self.name
