from django.contrib import admin
from .models import MedicalRecord, MedicalHistorySummary


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('patient', 'record_type', 'title', 'recorded_date', 'healthcare_provider', 'created_at')
    list_filter = ('record_type', 'recorded_date', 'patient')
    search_fields = ('patient__name', 'title', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Patient Information', {
            'fields': ('patient',)
        }),
        ('Record Details', {
            'fields': ('record_type', 'title', 'description', 'recorded_date')
        }),
        ('Related Information', {
            'fields': ('appointment', 'medication', 'healthcare_provider')
        }),
        ('Attachments', {
            'fields': ('files',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MedicalHistorySummary)
class MedicalHistorySummaryAdmin(admin.ModelAdmin):
    list_display = ('patient', 'total_appointments', 'active_medications_count', 'last_visit_date', 'last_updated')
    list_filter = ('last_visit_date', 'last_updated')
    search_fields = ('patient__name',)
    readonly_fields = ('last_updated',)
    fieldsets = (
        ('Patient', {
            'fields': ('patient',)
        }),
        ('Statistics', {
            'fields': ('total_appointments', 'active_medications_count')
        }),
        ('Medical Information', {
            'fields': ('known_allergies', 'chronic_conditions')
        }),
        ('Dates', {
            'fields': ('last_visit_date', 'last_updated')
        }),
    )
