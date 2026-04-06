# Patient Authentication & Account System

## Overview

Patients can now create their own accounts and log in to the healthcare platform. The patient authentication system allows patients to:
- Create individual accounts with date of birth
- Log in securely with their credentials
- Access their own patient data
- View assigned caregivers

## Patient Data Storage

### Database Models

**User Model** (Django built-in)
- username
- email  
- password (hashed)
- first_name
- last_name

**Profile Model** (extended user info)
- user (OneToOneField to User)
- role (includes new 'patient' role option)

**Patient Model** (patient-specific data)
- user (OneToOneField to User) - **NEW** - Links patient to their login account
- name
- date_of_birth
- caregivers (ManyToManyField to User) - Note: related_name changed to 'patients_managed'

### Data Flow on Patient Registration

```
Patient Registration Request
         ↓
Validate input (username, email, password, DOB)
         ↓
Create User account (hashed password)
         ↓
Create Profile (role='patient')
         ↓
Create Patient record (linked to User)
         ↓
Generate authentication Token
         ↓
Return patient data + token
```

## Patient Registration

### Endpoint: `POST /api/auth/register/patient/`

**Description:** Create a new patient account with medical data

**Request Payload:**
```json
{
    "username": "jane_smith",
    "email": "jane@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "password": "SecurePassword123",
    "password_confirm": "SecurePassword123",
    "date_of_birth": "1960-05-15"
}
```

**Success Response (201 Created):**
```json
{
    "message": "Patient account created successfully",
    "patient": {
        "id": 5,
        "name": "Jane Smith",
        "date_of_birth": "1960-05-15",
        "user": {
            "id": 15,
            "username": "jane_smith",
            "email": "jane@example.com",
            "first_name": "Jane",
            "last_name": "Smith"
        }
    },
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}
```

**Error Response (400 Bad Request):**
```json
{
    "password": ["Passwords do not match."],
    "username": ["This username is already taken."],
    "email": ["This email is already registered."],
    "date_of_birth": ["Invalid date format. Use YYYY-MM-DD"]
}
```

### Field Validation

| Field | Requirement | Example |
|-------|-------------|---------|
| username | 150 chars max, unique | jane_smith |
| email | Valid email, unique | jane@example.com |
| first_name | Optional, 150 chars max | Jane |
| last_name | Optional, 150 chars max | Smith |
| password | Minimum 8 characters | SecurePassword123 |
| password_confirm | Must match password | SecurePassword123 |
| date_of_birth | Required, YYYY-MM-DD format | 1960-05-15 |

## Patient Login

### Endpoint: `POST /api/auth/login/`

**Description:** Authenticate a patient and retrieve their token

**Request Payload:**
```json
{
    "username": "jane_smith",
    "password": "SecurePassword123"
}
```

**Success Response (200 OK):**
```json
{
    "message": "Login successful",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "user": {
        "id": 15,
        "username": "jane_smith",
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "role": "patient"
    },
    "patient": {
        "id": 5,
        "name": "Jane Smith",
        "date_of_birth": "1960-05-15"
    }
}
```

**Note:** The `patient` object is automatically included in the login response for users with the 'patient' role.

## Patient Data Access

### Endpoint: `GET /api/auth/patients/my_patient_data/`

**Description:** Retrieve the current patient's own data (patients only)

**Headers Required:**
```
Authorization: Token a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Success Response (200 OK):**
```json
{
    "id": 5,
    "user": {
        "id": 15,
        "username": "jane_smith",
        "email": "jane@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
    },
    "name": "Jane Smith",
    "date_of_birth": "1960-05-15",
    "caregivers": [
        {
            "id": 3,
            "username": "dr_johnson",
            "email": "dr.johnson@hospital.com",
            "first_name": "Dr.",
            "last_name": "Johnson"
        },
        {
            "id": 8,
            "username": "caregiver_maria",
            "email": "maria@careservice.com",
            "first_name": "Maria",
            "last_name": "Garcia"
        }
    ]
}
```

### Endpoint: `GET /api/auth/patients/{patient_id}/`

**Description:** Get specific patient data (restricted by role)

**Access Rules:**
- **Patients**: Can only view their own record
- **Caregivers**: Can view their assigned patients
- **Family Members**: Can view their assigned patients  
- **Healthcare Providers**: Can view all patients
- **System Admin**: Can view all patients

**Headers Required:**
```
Authorization: Token YOUR_TOKEN_HERE
```

## Role-Based Data Access

### Patient Role Access Control

| Endpoint | Patient | Caregiver | Family Member | Provider | Admin |
|----------|---------|-----------|---------------|----------|-------|
| GET `/patients/` | Own only | Assigned | Assigned | All | All |
| GET `/patients/my_patient_data/` | Own only | ✗ | ✗ | ✗ | ✗ |
| POST `/appointments/` | Own | Assigned | Assigned | All | All |
| GET `/medications/` | Own | Assigned | Assigned | All | All |

## Complete Patient Authentication Flow

### 1. Patient Registration Flow

```
New Patient (no account)
         ↓
POST /api/auth/register/patient/
         ↓
Validation:
  ├─ Username unique? → NO: Error
  └─ YES: Continue
         ↓
Validation:
  ├─ Email unique? → NO: Error
  └─ YES: Continue
         ↓
Validation:
  ├─ Passwords match? → NO: Error
  └─ YES: Continue
         ↓
User account created (password hashed)
Profile created (role='patient')
Patient record created (linked to user)
Authentication token generated
         ↓
Return: Patient data + Token
         ↓
Patient ready to login
```

### 2. Patient Login Flow

```
Patient (has account)
         ↓
POST /api/auth/login/
         ↓
Check if account exists
  ├─ NO → Return error + registration prompt
  └─ YES: Continue
         ↓
Validate password
  ├─ Invalid → Return invalid credentials error
  └─ Valid: Continue
         ↓
Get or create token
         ↓
Retrieve patient data (if role='patient')
         ↓
Return: Token + User data + Patient data
         ↓
Patient authenticated and ready to access platform
```

### 3. Patient Data Access Flow

```
Authenticated Patient
         ↓
GET /api/auth/patients/my_patient_data/
         ↓
Check authentication (token required)
  ├─ Invalid → Return 401 Unauthorized
  └─ Valid: Continue
         ↓
Check user role
  ├─ NOT patient role → Return 403 Forbidden
  └─ IS patient: Continue
         ↓
Fetch patient record from user
  ├─ NOT found → Return 404 Not Found
  └─ Found: Continue
         ↓
Return patient data with associated caregivers
```

## Patient Data Security

### Password Security
- Minimum 8 characters required
- Must match confirmation field
- Stored as Django password hashes (PBKDF2 by default)
- Never transmitted or logged in plain text

### Account Security
- Unique usernames prevent duplicate accounts
- Unique emails prevent account takeover
- Date of birth stored for medical records/verification
- Token-based session authentication

### Data Isolation
- Patients can only view their own records
- Patient list queries filtered by role
- Non-patient roles have different access rules
- Each query respects user permissions

## Database Relationships

### User ↔ Patient
```
User (1) ────────────────────── (1) Patient
         OneToOneField
         (nullable for staff users)
```

### Patient ↔ Caregivers (User)
```
Patient (1) ────M─────────────────── (M) User
                 ManyToMany
                 (can have multiple caregivers)
```

### User ↔ Profile
```
User (1) ────────────────────── (1) Profile
         OneToOneField
         (auto-created for all users)
```

## Integration Examples

### JavaScript - Patient Registration

```javascript
async function registerPatient(patientData) {
    const response = await fetch('http://127.0.0.1:8000/api/auth/register/patient/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
    });
    
    if (response.ok) {
        const data = await response.json();
        // Store token and patient data
        localStorage.setItem('token', data.token);
        localStorage.setItem('patient', JSON.stringify(data.patient));
        return data;
    } else {
        const errors = await response.json();
        console.error('Registration failed:', errors);
        throw errors;
    }
}

// Usage
registerPatient({
    username: 'jane_smith',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    password: 'SecurePassword123',
    password_confirm: 'SecurePassword123',
    date_of_birth: '1960-05-15'
});
```

### JavaScript - Patient Login

```javascript
async function patientLogin(username, password) {
    const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // If patient, also store patient data
        if (data.patient) {
            localStorage.setItem('patient', JSON.stringify(data.patient));
        }
        
        return data;
    } else {
        const error = await response.json();
        if (error.error_code === 'account_not_found') {
            alert('Account not found. Please register.');
        }
        throw error;
    }
}
```

### JavaScript - Get Patient Data

```javascript
async function getMyPatientData() {
    const token = localStorage.getItem('token');
    const response = await fetch('http://127.0.0.1:8000/api/auth/patients/my_patient_data/', {
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (response.ok) {
        const patientData = await response.json();
        return patientData;
    } else if (response.status === 403) {
        console.error('This endpoint is only for patients');
    } else {
        console.error('Failed to fetch patient data');
    }
}
```

## Database Migration

After updating the models, run the following commands to apply changes:

```bash
# Generate migration
python manage.py makemigrations authentication

# Apply migration
python manage.py migrate

# Check migration status
python manage.py showmigrations authentication
```

## Testing Patient Authentication

### Command Line Tests

```bash
# Register a patient
curl -X POST http://127.0.0.1:8000/api/auth/register/patient/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newpatient",
    "email": "patient@example.com",
    "first_name": "New",
    "last_name": "Patient",
    "password": "PatientPass123",
    "password_confirm": "PatientPass123",
    "date_of_birth": "1970-03-20"
  }'

# Login as patient
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newpatient",
    "password": "PatientPass123"
  }'

# Get patient's own data (requires token from login)
curl -X GET http://127.0.0.1:8000/api/auth/patients/my_patient_data/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

## Error Messages & Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "This username is already taken" | Registration with existing username | Choose different username |
| "This email is already registered" | Registration with existing email | Use different email or login |
| "Passwords do not match" | Password and confirm don't match | Ensure both password fields are identical |
| "Account not found" | Login with non-existent account | Register account first using `/register/patient/` |
| "Invalid username or password" | Wrong password for existing account | Check password (case-sensitive) or try again |
| "This endpoint is only for patients" | Non-patient accessing patient endpoint | Use appropriate endpoint for user role |
| "Invalid date format" | DOB not in YYYY-MM-DD format | Use format: 1960-05-15 |

## Future Enhancements

- [ ] Email verification on account creation
- [ ] Password reset functionality
- [ ] Two-factor authentication for patients
- [ ] Medical history tracking
- [ ] Emergency contact information
- [ ] Appointment reminders
- [ ] Integration with patient portal
