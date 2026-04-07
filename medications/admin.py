from django.contrib import admin
from .models import Medication, MedicationAdministration

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'patient', 'dosage', 'start_date', 'end_date', 'refill_reminder_enabled', 'refill_reminder_date', 'refill_reminder_days_before')
    list_filter = ('refill_reminder_enabled', 'start_date', 'end_date')
    search_fields = ('name', 'patient__name', 'dosage')

@admin.register(MedicationAdministration)
class MedicationAdministrationAdmin(admin.ModelAdmin):
    list_display = ('medication', 'administered_at', 'administered_by', 'taken')
    search_fields = ('medication__name', 'administered_by__username')
