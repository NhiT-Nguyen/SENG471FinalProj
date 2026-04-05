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
- Schedule and manage appointments
- Link appointments to patients and caregivers

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

- Appointments: `/api/appointments/appointments/`

- Medications: `/api/medications/medications/`

- Notifications: `/api/notifications/`
  - Settings: `/api/notifications/settings/`
  - Alerts: `/api/notifications/alerts/`

- Token Auth: `/api-token-auth/`

## Usage

1. Start the backend server.
2. Open the frontend in a browser.
3. Register/login users via the admin or API.
4. Use the frontend to manage patients, appointments, medications, and settings.

## Development Notes

- This is a skeleton implementation.
- Authentication is required for most endpoints.
- CORS is enabled for frontend-backend communication.
- Use the Django admin at `/admin/` for data management.