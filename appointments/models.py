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
    notes = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True, default='')

    def __str__(self):
        return f"Appointment for {self.patient.name} on {self.date}"

class Availability(models.Model):
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
