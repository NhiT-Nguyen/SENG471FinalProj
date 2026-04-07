ReadMe.md
@ -0,0 +1,96 @@
@ -0,0 +1,95 @@
# Healthcare Coordination Platform

A digital platform to enable caregivers, family members, and healthcare providers to coordinate medication management, schedule appointments, and receive timely alerts for elderly patients.

## Architecture

- **Backend**: Django REST Framework (DRF) API
- **Frontend**: Simple HTML/JavaScript application
- **Database**: SQLite (for development)

## Backend Features

### User Authentication
- Token-based authentication
- User profiles with roles (caregiver, family member, healthcare provider)
- Patient management

### Appointment Management
- Schedule and manage appointments with healthcare providers
- Appointment fields: patient, healthcare provider, date, time, duration, notes, location
- Automatic availability updates when appointments are booked

### Availability Management
- Healthcare providers can set weekly recurring availability windows
- Option to edit availability on a week-by-week basis
- Automatic marking of unavailable time slots when appointments are confirmed
- Weekly confirmation prompts for healthcare providers

### Medication Management
- Track medications for patients
- Dosage, schedule, and duration

### Notification Settings
- Configure alert preferences (email, SMS, push)
- Manage alerts

## Setup Instructions

### Backend Setup

1. Navigate to the project directory:
   ```
   cd healthcare_platform
   ```

2. Activate the virtual environment:
   ```
   .venv\Scripts\activate  # On Windows
   ```

3. Run migrations:
   ```
   python manage.py migrate
   ```

4. Create a superuser:
   ```
   python manage.py createsuperuser
   ```

5. Start the server:
   ```
   python manage.py runserver
   ```

The API will be available at `http://127.0.0.1:8000/api/`

### Frontend Setup

1. Open `frontend/index.html` in a web browser.

2. Use the interface to interact with the backend API.

## API Endpoints

- Authentication: `/api/auth/`
  - Profiles: `/api/auth/profiles/`
  - Patients: `/api/auth/patients/`

- Appointments: `/api/appointments/`
  - Appointments: `/api/appointments/appointments/`
  - Availabilities: `/api/appointments/availabilities/`
  - Availability Confirmations: `/api/appointments/availability-confirmations/`
    - Pending confirmations: `/api/appointments/availability-confirmations/pending-confirmations/`

- Medications: `/api/medications/medications/`

- Notifications: `/api/notifications/`
  - Settings: `/api/notifications/settings/`
  - Alerts: `/api/notifications/alerts/`

- Token Auth: `/api-token-auth/`

## Management Commands

- `python manage.py create_weekly_confirmations`: Creates weekly availability confirmation prompts for all healthcare providers. Run this command weekly (e.g., every Monday) to prompt providers to confirm their availability for the upcoming week.

## Development Notes

- This is a skeleton implementation.
- Authentication is required for most endpoints.
- CORS is enabled for frontend-backend communication.
- Use the Django admin at `/admin/` for data management.