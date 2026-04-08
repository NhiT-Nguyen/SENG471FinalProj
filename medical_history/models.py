from django.db import models
from authentication.models import Patient, HealthcareProvider
from appointments.models import Appointment
from medications.models import Medication


class MedicalRecord(models.Model):
    """
    Aggregated medical record for a patient.
    This model serves as a comprehensive medical history entry that can reference
    appointments, medications, test results, diagnoses, etc.
    """
    RECORD_TYPE_CHOICES = [
        ('appointment', 'Appointment Visit'),
        ('medication', 'Medication Record'),
        ('lab_test', 'Lab Test Result'),
        ('diagnosis', 'Diagnosis'),
        ('procedure', 'Procedure'),
        ('vaccination', 'Vaccination'),
        ('allergy', 'Allergy'),
        ('note', 'Clinical Note'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Reference to related objects
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='medical_records')
    medication = models.ForeignKey(Medication, on_delete=models.SET_NULL, null=True, blank=True, related_name='medical_records')
    
    # Clinical details
    healthcare_provider = models.ForeignKey(HealthcareProvider, on_delete=models.SET_NULL, null=True, blank=True)
    recorded_date = models.DateField()
    
    # Document/attachment support (optional - can be extended)
    files = models.TextField(blank=True, help_text="JSON list of file references")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-recorded_date', '-created_at']
        indexes = [
            models.Index(fields=['patient', '-recorded_date']),
            models.Index(fields=['patient', 'record_type']),
        ]

    def __str__(self):
        return f"{self.patient.name} - {self.get_record_type_display()} ({self.recorded_date})"


class MedicalHistorySummary(models.Model):
    """
    Cached summary of a patient's key medical information for quick access.
    Updates when significant medical events occur.
    """
    patient = models.OneToOneField(Patient, on_delete=models.CASCADE, related_name='medical_summary')
    
    # Quick statistics
    total_appointments = models.PositiveIntegerField(default=0)
    active_medications_count = models.PositiveIntegerField(default=0)
    known_allergies = models.TextField(blank=True, help_text="Comma-separated list of known allergies")
    chronic_conditions = models.TextField(blank=True, help_text="Comma-separated list of chronic conditions")
    
    # Important dates
    last_visit_date = models.DateField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Medical Summary for {self.patient.name}"
