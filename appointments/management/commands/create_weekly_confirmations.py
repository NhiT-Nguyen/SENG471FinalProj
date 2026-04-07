from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from appointments.models import AvailabilityConfirmation
from authentication.models import Profile
from datetime import timedelta

class Command(BaseCommand):
    help = 'Create weekly availability confirmation prompts for healthcare providers'

    def handle(self, *args, **options):
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())  # Monday of current week

        # Get all healthcare providers
        healthcare_providers = Profile.objects.filter(role='healthcare_provider').values_list('user', flat=True)

        for provider_id in healthcare_providers:
            # Check if confirmation already exists for this week
            if not AvailabilityConfirmation.objects.filter(
                healthcare_provider_id=provider_id,
                week_start_date=week_start
            ).exists():
                AvailabilityConfirmation.objects.create(
                    healthcare_provider_id=provider_id,
                    week_start_date=week_start,
                    confirmed=False
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Created confirmation prompt for provider {provider_id} for week of {week_start}')
                )
            else:
                self.stdout.write(
                    f'Confirmation already exists for provider {provider_id} for week of {week_start}'
                )