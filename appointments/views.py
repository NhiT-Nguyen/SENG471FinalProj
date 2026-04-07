from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_time
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
            # Create a new availability slot marking this time as busy
            Availability.objects.create(
                healthcare_provider=avail.healthcare_provider,
                day_of_week=avail.day_of_week,
                start_time=avail.start_time,
                end_time=avail.end_time,
                is_recurring=False,
                week_start_date=appointment.date - timedelta(days=appointment.date.weekday()),  # Monday of the week
                status='busy',
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
        availabilities = self.queryset.filter(healthcare_provider_id=provider_id, status='available')
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

    @action(detail=False, methods=['get'])
    def pending_change_requests(self, request):
        """Get pending change proposals for a provider"""
        provider_id = request.query_params.get('provider_id')
        if not provider_id:
            return Response({'error': 'provider_id required'}, status=status.HTTP_400_BAD_REQUEST)

        pending = self.queryset.filter(
            healthcare_provider_id=provider_id,
            status='approved',
            change_status='pending'
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get appointment requests for the logged in patient or family member"""
        user = request.user
        requests = self.queryset.filter(
            Q(patient__user=user) | Q(patient__family_members=user)
        )
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        appointment_request = self.get_object()
        user = request.user

        if not self._is_patient_or_family_member(user, appointment_request):
            return Response({'error': 'Only the requesting patient or a linked family member can edit this request.'}, status=status.HTTP_403_FORBIDDEN)

        if appointment_request.status == 'pending':
            return self._partial_update_pending_request(request, appointment_request)

        if appointment_request.status == 'approved':
            return self._partial_update_approved_request(request, appointment_request)

        return Response({'error': 'This appointment request cannot be edited.'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'pending':
            return Response({'error': 'Only pending appointment requests can be approved.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_request_provider(request.user, appointment_request):
            return Response({'error': 'Only the provider can approve appointment requests.'}, status=status.HTTP_403_FORBIDDEN)

        appointment = Appointment.objects.create(
            patient=appointment_request.patient,
            healthcare_provider=appointment_request.healthcare_provider,
            date=appointment_request.requested_date,
            time=appointment_request.requested_start_time,
            duration=timedelta(seconds=(datetime.combine(datetime.min, appointment_request.requested_end_time) - datetime.combine(datetime.min, appointment_request.requested_start_time)).total_seconds()),
            notes=appointment_request.notes or '',
        )

        appointment_request.status = 'approved'
        appointment_request.appointment = appointment
        appointment_request.resolved_at = timezone.now()
        appointment_request.save()
        self._update_availability_on_approval(appointment_request)

        serializer = self.get_serializer(appointment_request)
        return Response({
            'appointment_request': serializer.data,
            'created_appointment': AppointmentSerializer(appointment).data,
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'pending':
            return Response({'error': 'Only pending appointment requests can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_request_provider(request.user, appointment_request):
            return Response({'error': 'Only the provider can reject appointment requests.'}, status=status.HTTP_403_FORBIDDEN)

        appointment_request.status = 'rejected'
        appointment_request.resolved_at = timezone.now()
        appointment_request.save()
        self._revert_availability_on_rejection(appointment_request)

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment_request = self.get_object()
        if not self._is_patient_or_family_member(request.user, appointment_request):
            return Response({'error': 'Only the requesting patient or a linked family member can cancel this request.'}, status=status.HTTP_403_FORBIDDEN)

        if appointment_request.status != 'pending':
            return Response({'error': 'Only pending appointment requests can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment_request.status = 'cancelled'
        appointment_request.resolved_at = timezone.now()
        appointment_request.save()
        self._revert_availability_on_rejection(appointment_request)

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def accept_changes(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'approved' or appointment_request.change_status != 'pending':
            return Response({'error': 'No pending changes to accept.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_request_provider(request.user, appointment_request):
            return Response({'error': 'Only the provider can accept requested changes.'}, status=status.HTTP_403_FORBIDDEN)

        self._apply_requested_changes(appointment_request)
        appointment_request.change_status = 'accepted'
        appointment_request.change_requested_at = None
        appointment_request.proposed_date = None
        appointment_request.proposed_start_time = None
        appointment_request.proposed_end_time = None
        appointment_request.proposed_notes = ''
        appointment_request.save()

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def decline_changes(self, request, pk=None):
        appointment_request = self.get_object()

        if appointment_request.status != 'approved' or appointment_request.change_status != 'pending':
            return Response({'error': 'No pending changes to decline.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_request_provider(request.user, appointment_request):
            return Response({'error': 'Only the provider can decline requested changes.'}, status=status.HTTP_403_FORBIDDEN)

        appointment_request.change_status = 'declined'
        appointment_request.save()

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _partial_update_pending_request(self, request, appointment_request):
        data = request.data
        old_date = appointment_request.requested_date
        old_start = appointment_request.requested_start_time
        old_end = appointment_request.requested_end_time

        new_date = self._parse_date(data.get('requested_date')) if data.get('requested_date') is not None else appointment_request.requested_date
        new_start_time = self._parse_time(data.get('requested_start_time')) if data.get('requested_start_time') is not None else appointment_request.requested_start_time
        new_end_time = self._parse_time(data.get('requested_end_time')) if data.get('requested_end_time') is not None else appointment_request.requested_end_time

        if data.get('requested_date') is not None or data.get('requested_start_time') is not None or data.get('requested_end_time') is not None:
            if new_date is None or new_start_time is None or new_end_time is None:
                return Response({'error': 'Invalid requested date or time format.'}, status=status.HTTP_400_BAD_REQUEST)

            if new_end_time <= new_start_time:
                return Response({'error': 'Requested end time must be after requested start time.'}, status=status.HTTP_400_BAD_REQUEST)

            if not self._is_at_least_24_hours_away(new_date, new_start_time):
                return Response({'error': 'Requested appointment time must be at least 24 hours from now.'}, status=status.HTTP_400_BAD_REQUEST)

            appointment_request.requested_date = new_date
            appointment_request.requested_start_time = new_start_time
            appointment_request.requested_end_time = new_end_time
            self._update_pending_availability_on_request_change(appointment_request, old_date, old_start, old_end)

        if 'notes' in data:
            appointment_request.notes = data.get('notes', appointment_request.notes)

        appointment_request.save()
        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _partial_update_approved_request(self, request, appointment_request):
        if appointment_request.change_status == 'pending':
            return Response({'error': 'There is already a pending change request for this appointment.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment = appointment_request.appointment
        if not appointment:
            return Response({'error': 'Approved appointment record not found.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_at_least_24_hours_away(appointment.date, appointment.time):
            return Response({'error': 'Cannot request changes within 24 hours of the scheduled appointment.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        requested_date = data.get('requested_date')
        requested_start_time = data.get('requested_start_time')
        requested_end_time = data.get('requested_end_time')
        notes = data.get('notes')

        if requested_date is None and requested_start_time is None and requested_end_time is None and notes is None:
            return Response({'error': 'Nothing to update.'}, status=status.HTTP_400_BAD_REQUEST)

        if requested_date is not None:
            proposed_date = self._parse_date(requested_date)
            if proposed_date is None:
                return Response({'error': 'Invalid requested date format.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            proposed_date = appointment_request.requested_date

        if requested_start_time is not None:
            proposed_start_time = self._parse_time(requested_start_time)
            if proposed_start_time is None:
                return Response({'error': 'Invalid requested start time format.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            proposed_start_time = appointment_request.requested_start_time

        if requested_end_time is not None:
            proposed_end_time = self._parse_time(requested_end_time)
            if proposed_end_time is None:
                return Response({'error': 'Invalid requested end time format.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            proposed_end_time = appointment_request.requested_end_time

        if proposed_end_time <= proposed_start_time:
            return Response({'error': 'Requested end time must be after requested start time.'}, status=status.HTTP_400_BAD_REQUEST)

        if not self._is_at_least_24_hours_away(proposed_date, proposed_start_time):
            return Response({'error': 'Requested appointment time must be at least 24 hours from now.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment_request.proposed_date = proposed_date
        appointment_request.proposed_start_time = proposed_start_time
        appointment_request.proposed_end_time = proposed_end_time
        if notes is not None:
            appointment_request.proposed_notes = notes
        appointment_request.change_status = 'pending'
        appointment_request.change_requested_at = timezone.now()
        appointment_request.save()

        serializer = self.get_serializer(appointment_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def _apply_requested_changes(self, appointment_request):
        appointment = appointment_request.appointment
        if not appointment:
            return

        original_date = appointment.date
        original_time = appointment.time
        original_end_time = (datetime.combine(datetime.min, appointment.time) + appointment.duration).time()
        updated = False

        if appointment_request.proposed_notes:
            appointment.notes = appointment_request.proposed_notes
            updated = True

        if appointment_request.proposed_date or appointment_request.proposed_start_time or appointment_request.proposed_end_time:
            new_date = appointment_request.proposed_date or appointment_request.requested_date
            new_start_time = appointment_request.proposed_start_time or appointment_request.requested_start_time
            new_end_time = appointment_request.proposed_end_time or appointment_request.requested_end_time

            if new_date != appointment.date or new_start_time != appointment.time:
                appointment.date = new_date
                appointment.time = new_start_time
                appointment.duration = timedelta(
                    seconds=(datetime.combine(datetime.min, new_end_time) - datetime.combine(datetime.min, new_start_time)).total_seconds()
                )
                updated = True
                self._update_availability_for_approved_change(
                    appointment_request,
                    original_date,
                    original_time,
                    original_end_time,
                    appointment
                )

        if updated:
            appointment.save()

        appointment_request.requested_date = appointment.date
        appointment_request.requested_start_time = appointment.time
        appointment_request.requested_end_time = (datetime.combine(datetime.min, appointment.time) + appointment.duration).time()
        if appointment_request.proposed_notes:
            appointment_request.notes = appointment_request.proposed_notes

    def _update_availability_for_approved_change(self, appointment_request, old_date, old_start_time, old_end_time, appointment):
        old_week_start = old_date - timedelta(days=old_date.weekday())
        Availability.objects.filter(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=old_date.weekday(),
            start_time=old_start_time,
            end_time=old_end_time,
            week_start_date=old_week_start,
            status='busy'
        ).delete()

        new_week_start = appointment.date - timedelta(days=appointment.date.weekday())
        Availability.objects.create(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=appointment.date.weekday(),
            start_time=appointment.time,
            end_time=(datetime.combine(datetime.min, appointment.time) + appointment.duration).time(),
            is_recurring=False,
            week_start_date=new_week_start,
            status='busy',
            is_available=False
        )

    def _is_patient_or_family_member(self, user, appointment_request):
        if appointment_request.patient.user == user:
            return True
        return appointment_request.patient.family_members.filter(id=user.id).exists()

    def _is_request_provider(self, user, appointment_request):
        return appointment_request.healthcare_provider == user

    def _parse_date(self, value):
        if value is None:
            return None
        return parse_date(value)

    def _parse_time(self, value):
        if value is None:
            return None
        return parse_time(value)

    def _is_at_least_24_hours_away(self, date, time):
        requested_dt = datetime.combine(date, time)
        if timezone.is_naive(requested_dt):
            requested_dt = timezone.make_aware(requested_dt, timezone.get_current_timezone())
        return timezone.now() + timedelta(hours=24) <= requested_dt

    def _create_pending_availability_override(self, appointment_request):
        week_start = appointment_request.requested_date - timedelta(days=appointment_request.requested_date.weekday())
        Availability.objects.create(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=appointment_request.requested_date.weekday(),
            start_time=appointment_request.requested_start_time,
            end_time=appointment_request.requested_end_time,
            is_recurring=False,
            week_start_date=week_start,
            status='appointment_request_pending',
            is_available=False
        )

    def _update_pending_availability_on_request_change(self, appointment_request, old_date, old_start, old_end):
        old_week_start = old_date - timedelta(days=old_date.weekday())
        Availability.objects.filter(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=old_date.weekday(),
            start_time=old_start,
            end_time=old_end,
            week_start_date=old_week_start,
            status='appointment_request_pending'
        ).delete()
        self._create_pending_availability_override(appointment_request)

    def _update_availability_on_request(self, appointment_request):
        self._create_pending_availability_override(appointment_request)

    def _update_availability_on_approval(self, appointment_request):
        day_of_week = appointment_request.requested_date.weekday()
        week_start = appointment_request.requested_date - timedelta(
            days=appointment_request.requested_date.weekday()
        )
        
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
        day_of_week = appointment_request.requested_date.weekday()
        week_start = appointment_request.requested_date - timedelta(
            days=appointment_request.requested_date.weekday()
        )
        Availability.objects.filter(
            healthcare_provider=appointment_request.healthcare_provider,
            day_of_week=day_of_week,
            start_time=appointment_request.requested_start_time,
            end_time=appointment_request.requested_end_time,
            week_start_date=week_start,
            status='appointment_request_pending'
        ).delete()
