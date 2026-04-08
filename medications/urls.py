from django.urls import path, include
from rest_framework.routers import SimpleRouter
from . import views

router = SimpleRouter()
router.register(r'medications', views.MedicationViewSet, basename='medication')

urlpatterns = [
    path('', include(router.urls)),
]