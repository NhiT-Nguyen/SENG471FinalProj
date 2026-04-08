from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

router = SimpleRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'availabilities', views.AvailabilityViewSet, basename='availability')
router.register(r'availability-confirmations', views.AvailabilityConfirmationViewSet, basename='availability-confirmation')
router.register(r'appointment-requests', views.AppointmentRequestViewSet, basename='appointment-request')

urlpatterns = [
    path('', include(router.urls)),
]