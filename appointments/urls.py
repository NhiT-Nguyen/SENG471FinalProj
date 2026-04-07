from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet)
router.register(r'availabilities', views.AvailabilityViewSet)
router.register(r'availability-confirmations', views.AvailabilityConfirmationViewSet)
router.register(r'appointment-requests', views.AppointmentRequestViewSet)

urlpatterns = [
    path('', include(router.urls)),
]