from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.ProfileViewSet)
router.register(r'patients', views.PatientViewSet)
router.register(r'healthcare-providers', views.HealthcareProviderViewSet)

urlpatterns = [
    path('', include(router.urls)),
]