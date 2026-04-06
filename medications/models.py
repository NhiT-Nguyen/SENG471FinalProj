from django.db import models
from authentication.models import Patient
from django.contrib.auth.models import User
import json

class Medication(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    prescribed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='prescribed_medications')
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)
    schedule = models.CharField(max_length=100)  # e.g., "twice daily"
    instructions = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    reminder_enabled = models.BooleanField(default=False)
    reminder_time = models.TimeField(null=True, blank=True)
    reminder_days = models.JSONField(default=list, blank=True)  # list of days, e.g., ['monday', 'wednesday']

    def __str__(self):
        return f"{self.name} for {self.patient.name}"

    @property
    def is_current(self):
        from django.utils import timezone
        today = timezone.now().date()
        return self.end_date is None or self.end_date >= today

class MedicationAdministration(models.Model):
    medication = models.ForeignKey(Medication, on_delete=models.CASCADE, related_name='administrations')
    administered_at = models.DateTimeField()
    administered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    taken = models.BooleanField()
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Administration of {self.medication.name} at {self.administered_at}"
