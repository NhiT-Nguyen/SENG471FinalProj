from django.db import models
from django.contrib.auth.models import User
from authentication.models import Patient
from datetime import timedelta

class Appointment(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    healthcare_provider = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    time = models.TimeField()
    duration = models.DurationField(default=timedelta(hours=1))
    notes = models.TextField(blank=True, default='')
    reasons_for_visit = models.TextField(blank=True, default='')
    examinations_performed = models.TextField(blank=True, default='')
    tests_requested = models.TextField(blank=True, default='')
    new_medications = models.TextField(blank=True, default='')
    referrals = models.TextField(blank=True, default='')
    follow_up_recommended = models.BooleanField(default=False)
    location = models.CharField(max_length=200, blank=True, default='')

    def __str__(self):
        return f"Appointment for {self.patient.name} on {self.date}"

class Availability(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('busy', 'Busy'),
        ('appointment_request_pending', 'Appointment Request Pending'),
    ]
    DAYS_OF_WEEK = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]
    healthcare_provider = models.ForeignKey(User, on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_recurring = models.BooleanField(default=True)
    week_start_date = models.DateField(null=True, blank=True)  # For non-recurring overrides
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='available')
    # Keep is_available for backwards compatibility but derive from status
    is_available = models.BooleanField(default=True)  # Can be set to False for booked slots

    def __str__(self):
        day = self.get_day_of_week_display()
        if self.is_recurring:
            return f"{self.healthcare_provider.username} - {day} {self.start_time}-{self.end_time} (recurring)"
        else:
            return f"{self.healthcare_provider.username} - {self.week_start_date} {day} {self.start_time}-{self.end_time}"

class AvailabilityConfirmation(models.Model):
    healthcare_provider = models.ForeignKey(User, on_delete=models.CASCADE)
    week_start_date = models.DateField()
    confirmed = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['healthcare_provider', 'week_start_date']

    def __str__(self):
        return f"{self.healthcare_provider.username} - Week of {self.week_start_date}: {'Confirmed' if self.confirmed else 'Pending'}"


class AppointmentRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    CHANGE_STATUS_CHOICES = [
        ('none', 'None'),
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointment_requests')
    healthcare_provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_requests')
    requested_date = models.DateField()
    requested_start_time = models.TimeField()
    requested_end_time = models.TimeField()
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    appointment = models.OneToOneField('Appointment', null=True, blank=True, on_delete=models.SET_NULL, related_name='appointment_request')
    proposed_date = models.DateField(null=True, blank=True)
    proposed_start_time = models.TimeField(null=True, blank=True)
    proposed_end_time = models.TimeField(null=True, blank=True)
    proposed_notes = models.TextField(blank=True)
    change_status = models.CharField(max_length=20, choices=CHANGE_STATUS_CHOICES, default='none')
    change_requested_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Appointment request: {self.patient.name} with {self.healthcare_provider.get_full_name()} on {self.requested_date}"

