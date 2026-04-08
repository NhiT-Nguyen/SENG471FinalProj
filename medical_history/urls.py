from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import (
    MedicalRecordViewSet,
    MedicalHistorySummaryViewSet,
    ComprehensiveMedicalHistoryViewSet
)

router = SimpleRouter()
router.register(r'records', MedicalRecordViewSet, basename='medical-record')
router.register(r'summary', MedicalHistorySummaryViewSet, basename='medical-summary')
router.register(r'history', ComprehensiveMedicalHistoryViewSet, basename='comprehensive-history')

app_name = 'medical_history'

urlpatterns = [
    path('', include(router.urls)),
]
