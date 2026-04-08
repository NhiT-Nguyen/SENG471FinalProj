from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from authentication.models import Profile
from .models import NotificationSettings


class NotificationSettingsTests(TestCase):
	def setUp(self):
		self.client = APIClient()

		self.patient_user = User.objects.create_user(
			username='patient1',
			password='password123',
			email='patient1@example.com'
		)
		Profile.objects.create(user=self.patient_user, role='patient')

		self.caregiver_user = User.objects.create_user(
			username='caregiver1',
			password='password123',
			email='caregiver1@example.com'
		)
		Profile.objects.create(user=self.caregiver_user, role='caregiver')

	def test_patient_can_get_own_notification_settings(self):
		self.client.force_authenticate(user=self.patient_user)

		response = self.client.get('/api/notifications/settings/me/')

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['appointment_reminder_enabled'])
		self.assertEqual(response.data['appointment_reminder_hours_before'], 24)
		self.assertEqual(NotificationSettings.objects.filter(user=self.patient_user).count(), 1)

	def test_patient_can_update_reminder_preferences(self):
		self.client.force_authenticate(user=self.patient_user)

		response = self.client.patch(
			'/api/notifications/settings/me/',
			{
				'appointment_reminder_enabled': True,
				'appointment_reminder_email': True,
				'appointment_reminder_sms': True,
				'appointment_reminder_push': False,
				'appointment_reminder_hours_before': 6,
			},
			format='json'
		)

		self.assertEqual(response.status_code, 200)
		self.assertTrue(response.data['appointment_reminder_sms'])
		self.assertFalse(response.data['appointment_reminder_push'])
		self.assertEqual(response.data['appointment_reminder_hours_before'], 6)

		settings_obj = NotificationSettings.objects.get(user=self.patient_user)
		self.assertTrue(settings_obj.appointment_reminder_sms)
		self.assertEqual(settings_obj.appointment_reminder_hours_before, 6)

	def test_non_patient_cannot_access_reminder_preferences(self):
		self.client.force_authenticate(user=self.caregiver_user)

		response = self.client.get('/api/notifications/settings/me/')

		self.assertEqual(response.status_code, 403)
