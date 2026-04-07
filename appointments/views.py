from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Appointment, Availability, AvailabilityConfirmation
from .serializers import AppointmentSerializer, AvailabilitySerializer, AvailabilityConfirmationSerializer

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    def perform_create(self, serializer):
        appointment = serializer.save()
        # Mark availability as unavailable during appointment time
        self._update_availability_on_booking(appointment)

    def _update_availability_on_booking(self, appointment):
        # Find overlapping availability and mark as unavailable
        day_of_week = appointment.date.weekday()
        start_time = appointment.time
        end_time = (appointment.time + appointment.duration).time() if hasattr(appointment.time, '__add__') else appointment.time  # Assuming duration is timedelta

        # For simplicity, assume duration is in minutes, convert to time
        end_datetime = timezone.datetime.combine(appointment.date, appointment.time) + appointment.duration
        end_time = end_datetime.time()

        availabilities = Availability.objects.filter(
            healthcare_provider=appointment.healthcare_provider,
            day_of_week=day_of_week,
            start_time__lte=start_time,
            end_time__gte=end_time,
            is_available=True
        )
        for avail in availabilities:
            # Create a new availability slot marking this time as unavailable
            Availability.objects.create(
                healthcare_provider=avail.healthcare_provider,
                day_of_week=avail.day_of_week,
                start_time=avail.start_time,
                end_time=avail.end_time,
                is_recurring=False,
                week_start_date=appointment.date - timedelta(days=appointment.date.weekday()),  # Monday of the week
                is_available=False
            )

class AvailabilityViewSet(viewsets.ModelViewSet):
    queryset = Availability.objects.all()
    serializer_class = AvailabilitySerializer

    @action(detail=False, methods=['get'])
    def provider_availability(self, request):
        provider_id = request.query_params.get('provider_id')
        if not provider_id:
            return Response({'error': 'provider_id required'}, status=status.HTTP_400_BAD_REQUEST)
        availabilities = self.queryset.filter(healthcare_provider_id=provider_id)
        serializer = self.get_serializer(availabilities, many=True)
        return Response(serializer.data)

class AvailabilityConfirmationViewSet(viewsets.ModelViewSet):
    queryset = AvailabilityConfirmation.objects.all()
    serializer_class = AvailabilityConfirmationSerializer

    @action(detail=False, methods=['get'])
    def pending_confirmations(self, request):
        provider_id = request.query_params.get('provider_id')
        if not provider_id:
            return Response({'error': 'provider_id required'}, status=status.HTTP_400_BAD_REQUEST)
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        pending = self.queryset.filter(
            healthcare_provider_id=provider_id,
            week_start_date=week_start,
            confirmed=False
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        confirmation = self.get_object()
        confirmation.confirmed = True
        confirmation.confirmed_at = timezone.now()
        confirmation.save()
        serializer = self.get_serializer(confirmation)
        return Response(serializer.data)
