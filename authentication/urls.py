from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.ProfileViewSet)
router.register(r'patients', views.PatientViewSet)

urlpatterns = [
    path('register/', views.RegistrationView.as_view(), name='register'),
    path('register/patient/', views.PatientRegistrationView.as_view(), name='patient_register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('', include(router.urls)),
]