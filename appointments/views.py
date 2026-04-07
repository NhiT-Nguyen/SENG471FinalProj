from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Q
from .models import Appointment, Availability, AvailabilityConfirmation, AppointmentRequest
from .serializers import AppointmentSerializer, AvailabilitySerializer, AvailabilityConfirmationSerializer, AvailabilityWithProviderSerializer, AppointmentRequestSerializer
from authentication.models import HealthcareProvider, Patient
from authentication.serializers import HealthcareProviderDetailSerializer

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
        """Get availability slots for a specific provider"""
        provider_id = request.query_params.get('provider_id')
        if not provider_id:
            return Response({'error': 'provider_id required'}, status=status.HTTP_400_BAD_REQUEST)
        availabilities = self.queryset.filter(healthcare_provider_id=provider_id, is_available=True)
        serializer = AvailabilityWithProviderSerializer(availabilities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search_providers(self, request):
        """Search healthcare providers by name"""
        search_term = request.query_params.get('q', '')
        if not search_term:
            return Response({'error': 'Search term required'}, status=status.HTTP_400_BAD_REQUEST)
        
        providers = HealthcareProvider.objects.filter(
            Q(user__first_name__icontains=search_term) |
            Q(user__last_name__icontains=search_term) |
            Q(user__username__icontains=search_term)
        )
        serializer = HealthcareProviderDetailSerializer(providers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def filter_by_specialty(self, request):
        """Filter healthcare providers by specialty"""
        specialty = request.query_params.get('specialty', '')
        if not specialty:
            return Response({'error': 'Specialty required'}, status=status.HTTP_400_BAD_REQUEST)
        
        providers = HealthcareProvider.objects.filter(specialty=specialty)
        serializer = HealthcareProviderDetailSerializer(providers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available_at_datetime(self, request):
        """Get healthcare providers available at a specific date and time"""
        date_str = request.query_params.get('date')
        time_str = request.query_params.get('time')
        
        if not date_str or not time_str:
            return Response({'error': 'Date and time required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
            time = datetime.strptime(time_str, '%H:%M:%S').time()
        except ValueError:
            return Response({'error': 'Invalid date or time format. Use YYYY-MM-DD and HH:MM:SS'}, status=status.HTTP_400_BAD_REQUEST)
        
        day_of_week = date.weekday()
        
        # Find all availability slots for the requested day and time
        availabilities = Availability.objects.filter(
            day_of_week=day_of_week,
            start_time__lte=time,
            end_time__gt=time,
            is_available=True
        ).select_related('healthcare_provider')
        
        # Also check non-recurring overrides for that specific week
        week_start = date - timedelta(days=date.weekday())
        week_availabilities = Availability.objects.filter(
            day_of_week=day_of_week,
            start_time__lte=time,
            end_time__gt=time,
            is_available=True,
            is_recurring=False,
            week_start_date=week_start
        ).select_related('healthcare_provider')
        
        # Combine results and get unique providers
        all_availabilities = list(availabilities) + list(week_availabilities)
        unique_providers = {}
        for avail in all_availabilities:
            provider_id = avail.healthcare_provider_id
            if provider_id not in unique_providers:
                try:
                    provider = HealthcareProvider.objects.get(user_id=provider_id)
                    unique_providers[provider_id] = provider
                except HealthcareProvider.DoesNotExist:
                    pass
        
        serializer = HealthcareProviderDetailSerializer(unique_providers.values(), many=True)
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


class AppointmentRequestViewSet(viewsets.ModelViewSet):
    queryset = AppointmentRequest.objects.all()
    serializer_class = AppointmentRequestSerializer

    @action(detail=False, methods=['post'])
    def request_appointment(self, request):
        """Create an appointment request"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            appointment_request = serializer.save()
            
            # Update availability status to "appointment_request_pending"
            self._update_availability_on_request(appointment_request)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """Get pending appointment requests for a provider"""
        provider_id = request.query_params.get('provider_id')
        if not provider_id:
            return Response({'error': 'provider_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        pending = self.queryset.filter(
            healthcare_provider_id=provider_id,
            status='pending'
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an appointment request and create the appointment"""
        appointment_request = self.get_object()
        
        if appointment_request.status != 'pending':
            return Response(
                {'error': 'Can only approve pending requests'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create the actual appointment
            appointment = Appointment.objects.create(
                patient=appointment_request.patient,
                healthcare_provider=appointment_request.healthcare_provider,
                date=appointment_request.requested_date,
                time=appointment_request.requested_start_time,
                duration=timedelta(
                    seconds=(
                        (datetime.combine(datetime.min, appointment_request.requested_end_time) -
                         datetime.combine(datetime.min, appointment_request.requested_start_time)).total_seconds()
                    )
                ),
                notes=appointment_request.notes,
                location=''
            )
            
            # Update appointment request status
            appointment_request.status = 'approved'
            appointment_request.resolved_at = timezone.now()
            appointment_request.save()
            
            # Update availability status to "busy"
            self._update_availability_on_approval(appointment_request)
            
            response_data = self.get_serializer(appointment_request).data
            response_data['created_appointment'] = AppointmentSerializer(appointment).data
            return Response(response_data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an appointment request"""
        appointment_request = self.get_object()
        
        if appointment_request.status != 'pending':
            return Response(
                {'error': 'Can only reject pending requests'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment_request.status = 'rejected'
        appointment_request.resolved_at = timezone.now()
        appointment_request.save()
        
        # Update availability status back to "available"
        self._revert_availability_on_rejection(appointment_request)
        
        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _update_availability_on_request(self, appointment_request):
        """Update availability status to 'appointment_request_pending'"""
        day_of_week = appointment_request.requested_date.weekday()
        
        # Find availability for the requested time
        availability = Availability.objects.filter(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=day_of_week,
            start_time__lte=appointment_request.requested_start_time,
            end_time__gte=appointment_request.requested_end_time,
        ).first()
        
        if availability:
            # Create a non-recurring override with appointment_request_pending status
            week_start = appointment_request.requested_date - timedelta(
                days=appointment_request.requested_date.weekday()
            )
            override = Availability.objects.create(
                healthcare_provider=availability.healthcare_provider,
                day_of_week=availability.day_of_week,
                start_time=appointment_request.requested_start_time,
                end_time=appointment_request.requested_end_time,
                is_recurring=False,
                week_start_date=week_start,
                status='appointment_request_pending',
                is_available=False  # Mark as unavailable while pending
            )

    def _update_availability_on_approval(self, appointment_request):
        """Update availability status to 'busy' after approval"""
        day_of_week = appointment_request.requested_date.weekday()
        week_start = appointment_request.requested_date - timedelta(
            days=appointment_request.requested_date.weekday()
        )
        
        # Find the pending availability override and update it to busy
        availability = Availability.objects.filter(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=day_of_week,
            start_time=appointment_request.requested_start_time,
            end_time=appointment_request.requested_end_time,
            week_start_date=week_start,
            status='appointment_request_pending'
        ).first()
        
        if availability:
            availability.status = 'busy'
            availability.is_available = False
            availability.save()

    def _revert_availability_on_rejection(self, appointment_request):
        """Revert availability status back to 'available' after rejection"""
        day_of_week = appointment_request.requested_date.weekday()
        week_start = appointment_request.requested_date - timedelta(
            days=appointment_request.requested_date.weekday()
        )
        
        # Remove the pending availability override
        Availability.objects.filter(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=day_of_week,
            start_time=appointment_request.requested_start_time,
            end_time=appointment_request.requested_end_time,
            week_start_date=week_start,
            status='appointment_request_pending'
        ).delete()
