from django.contrib import admin
from .models import Medication

@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = ('name', 'patient', 'dosage', 'start_date', 'end_date')
    list_filter = ('start_date', 'end_date')
    search_fields = ('name', 'patient__name', 'dosage')
class MedicationAdministrationAdmin(admin.ModelAdmin):
    list_display = ('medication', 'administered_at', 'administered_by', 'taken')
    search_fields = ('medication__name', 'administered_by__username')
