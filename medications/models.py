from django.db import models
from authentication.models import Patient, HealthcareProvider

class Medication(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('discontinued', 'Discontinued'),
        ('completed', 'Completed'),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    prescribed_by = models.ForeignKey(HealthcareProvider, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)
    frequency = models.CharField(max_length=100)  # e.g., "twice daily"
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    administration_instructions = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    prescribed_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} prescribed to {self.patient.name} by {self.prescribed_by}"
