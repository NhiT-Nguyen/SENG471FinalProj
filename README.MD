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
- Healthcare provider profiles with specialty information

### Provider Search and Discovery
- **Search by Name**: Patients and family members can search for healthcare providers by first name, last name, or username
- **Filter by Specialty**: Browse providers filtered by medical specialty (Cardiology, Pediatrics, General Practice, etc.)
- **Availability-based Search**: Find providers available at a specific date and time

### Appointment Management
- Schedule and manage appointments with healthcare providers
- Appointment fields: patient, healthcare provider, date, time, duration, notes, location
- Automatic availability updates when appointments are booked
- View provider availability before booking

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
  - Healthcare Providers: `/api/auth/healthcare-providers/`

- Appointments: `/api/appointments/`
  - Appointments: `/api/appointments/appointments/`
  - Availabilities: `/api/appointments/availabilities/`
    - Search providers by name: `/api/appointments/availabilities/search-providers/?q=<search_term>`
    - Filter providers by specialty: `/api/appointments/availabilities/filter-by-specialty/?specialty=<specialty>`
    - Find available providers by date/time: `/api/appointments/availabilities/available-at-datetime/?date=YYYY-MM-DD&time=HH:MM:SS`
  - Availability Confirmations: `/api/appointments/availability-confirmations/`
    - Pending confirmations: `/api/appointments/availability-confirmations/pending-confirmations/`
    - Confirm availability: `/api/appointments/availability-confirmations/<id>/confirm/` [POST]

- Medications: `/api/medications/medications/`

- Notifications: `/api/notifications/`
  - Settings: `/api/notifications/settings/`
  - Alerts: `/api/notifications/alerts/`

- Token Auth: `/api-token-auth/`

## Provider Search Endpoints

### 1. Search Providers by Name
**Endpoint**: `GET /api/appointments/availabilities/search-providers/`

**Query Parameters**:
- `q` (string): Search term to match against provider first name, last name, or username

**Example Request**:
```
GET /api/appointments/availabilities/search-providers/?q=John
```

**Response**: Array of providers matching the search term with full details (name, email, specialty, clinic, bio, etc.)

### 2. Filter Providers by Specialty
**Endpoint**: `GET /api/appointments/availabilities/filter-by-specialty/`

**Query Parameters**:
- `specialty` (string): Medical specialty to filter by (e.g., cardiology, pediatrics, general_practice)

**Available Specialties**:
- general_practice
- cardiology
- neurology
- orthopedics
- pediatrics
- psychiatry
- dermatology
- gastroenterology
- endocrinology
- oncology
- pulmonology
- other

**Example Request**:
```
GET /api/appointments/availabilities/filter-by-specialty/?specialty=cardiology
```

**Response**: Array of providers with the specified specialty and their full details

### 3. Find Available Providers by Date and Time
**Endpoint**: `GET /api/appointments/availabilities/available-at-datetime/`

**Query Parameters**:
- `date` (string): Date in YYYY-MM-DD format
- `time` (string): Time in HH:MM:SS format

**Example Request**:
```
GET /api/appointments/availabilities/available-at-datetime/?date=2025-01-15&time=14:30:00
```

**Response**: Array of providers who have availability at the specified date and time, including their full details and availability slots

## Authentication

All API endpoints except `/api-token-auth/` require authentication with a valid token.

**Token Acquisition**:
1. Send POST request to `/api-token-auth/` with username and password
2. Response includes an authentication token

**Using the Token**:
Include the token in the Authorization header for subsequent requests:
```
Authorization: Token <your_token_here>
```

**Frontend Example**:
```javascript
const token = localStorage.getItem('token');
const response = await fetch('/api/appointments/availabilities/search-providers/?q=John', {
  headers: {
    'Authorization': `Token ${token}`
  }
});
```

## Management Commands

- `python manage.py create_weekly_confirmations`: Creates weekly availability confirmation prompts for all healthcare providers. Run this command weekly (e.g., every Monday) to prompt providers to confirm their availability for the upcoming week.

## Data Models

### HealthcareProvider
Healthcare providers are created from User accounts with the role set to `healthcare_provider`.

**Fields**:
- `user` (OneToOneField): Link to User account
- `specialty` (CharField): Medical specialty (see available specialties in provider search section)
- `license_number` (CharField): Professional license number
- `hospital_clinic` (CharField): Associated hospital or clinic name
- `phone_number` (CharField): Contact phone number
- `bio` (TextField): Professional biography

**Response Fields** (from search endpoints):
- `user_id`: User ID
- `user_name`: First and last name
- `user_email`: Email address
- `specialty`: Medical specialty
- `specialty_display`: Human-readable specialty name
- `license_number`: License number
- `hospital_clinic`: Hospital/clinic name
- `phone_number`: Contact phone
- `bio`: Professional biography

### Appointment
**Fields**:
- `patient` (ForeignKey): Patient being treated
- `healthcare_provider` (ForeignKey): Provider handling the appointment
- `date` (DateField): Appointment date
- `time` (TimeField): Appointment start time
- `duration` (IntegerField): Duration in minutes (default: 60)
- `notes` (TextField): Clinical notes
- `location` (CharField): Location of appointment
- `created_at` (DateTimeField): When appointment was created
- `updated_at` (DateTimeField): When appointment was last updated

### Availability
**Fields**:
- `healthcare_provider` (ForeignKey): Provider for this availability
- `day_of_week` (IntegerField): Day 0-6 (Monday-Sunday)
- `start_time` (TimeField): Availability start time
- `end_time` (TimeField): Availability end time
- `is_recurring` (BooleanField): Whether this is a recurring slot
- `week_start_date` (DateField): For non-recurring overrides
- `is_available` (BooleanField): Current availability status

## Development Notes

- This is a skeleton implementation.
- Authentication is required for most endpoints.
- CORS is enabled for frontend-backend communication.
- Use the Django admin at `/admin/` for data management.