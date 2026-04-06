from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'medications', views.MedicationViewSet)
router.register(r'administrations', views.MedicationAdministrationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]