from django.db import models
from authentication.models import Patient

class Medication(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    dosage = models.CharField(max_length=50)
    schedule = models.CharField(max_length=100)  # e.g., "twice daily"
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} for {self.patient.name}"
