# Patient Authentication System - Migration & Setup Guide

## What Changed

### Model Changes

#### 1. **Profile Model** - Added 'patient' role
```python
# OLD
ROLE_CHOICES = [
    ('caregiver', 'Caregiver'),
    ('family_member', 'Family Member'),
    ('healthcare_provider', 'Healthcare Provider'),
]

# NEW
ROLE_CHOICES = [
    ('patient', 'Patient'),  # ← NEW
    ('caregiver', 'Caregiver'),
    ('family_member', 'Family Member'),
    ('healthcare_provider', 'Healthcare Provider'),
]
```

#### 2. **Patient Model** - Added User linking & relationship name change
```python
# OLD
class Patient(models.Model):
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    caregivers = models.ManyToManyField(User, related_name='patients')

# NEW
class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='patient_profile')  # ← NEW
    name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    caregivers = models.ManyToManyField(User, related_name='patients_managed')  # ← CHANGED
```

**Key Points:**
- `user` field links a patient to their login account (OneToOneField)
- Field is nullable (null=True) for backward compatibility with existing patient records
- `related_name` changed from 'patients' to 'patients_managed'

### New API Endpoints

1. **POST /api/auth/register/patient/**
   - Patient self-registration with DOB
   - Creates User + Profile (role='patient') + Patient record
   - Returns authentication token

2. **GET /api/auth/patients/my_patient_data/**
   - Retrieve current patient's own data
   - Filters results to only the authenticated patient
   - Restricted to users with 'patient' role

### New Views & Serializers

**PatientRegistrationView**
- Handles patient-specific registration
- Validates patient data (username, email, password, DOB)
- Creates unified user/patient record

**PatientRegistrationSerializer**
- Separate from generic RegistrationSerializer
- Includes date_of_birth field
- Automatically creates Profile with role='patient'

**PatientDataSerializer**
- Simple serializer for patient medical data
- Used for updating patient information

**Updated PatientViewSet**
- Added `my_patient_data()` action for self-access
- Implemented role-based filtering
- Caregivers can see assigned patients
- Patients can only see themselves

## Required Setup Steps

### 1. Apply Migrations

Navigate to project directory and run:

```bash
# Create migration files
python manage.py makemigrations authentication

# Apply migrations
python manage.py migrate authentication
```

**Important:** The `user` field on Patient is nullable, so existing patient records won't be affected. New patients created through registration will have this field populated.

### 2. Verify Dependencies

Make sure these are installed in requirements.txt:
```
Django>=3.2
djangorestframework>=3.12.0
django-cors-headers>=3.10.0
```

### 3. Test the System

Start the development server:
```bash
python manage.py runserver
```

Test patient registration:
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/patient/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testpatient",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "Patient",
    "password": "TestPass123",
    "password_confirm": "TestPass123",
    "date_of_birth": "1950-01-01"
  }'
```

## Backward Compatibility

### Existing Data

- **Existing Users**: Unaffected - still have Profile roles (caregiver, family_member, healthcare_provider)
- **Existing Patients**: Can continue to be managed by caregivers without login accounts
- **Relationships**: The `patients_managed` relation works the same way as before

### New Patient Linking

Starting from now:
- New patient registrations automatically create a User account
- Patients can log in with their credentials
- Historical patient records (without User) can still be managed by caregivers

### Related Name Change

The change from `related_name='patients'` to `related_name='patients_managed'` means:

```python
# OLD - still works for existing records
user.patients.all()  # ← DEPRECATED

# NEW - should be used
user.patients_managed.all()  # ← USE THIS
```

**User.filter queries that reference 'patients' will need updating.**

## Files Modified

### Core Authentication
- `authentication/models.py` - Added user field to Patient, added 'patient' role
- `authentication/serializers.py` - Added PatientRegistrationSerializer
- `authentication/views.py` - Added PatientRegistrationView
- `authentication/urls.py` - Added patient registration endpoint

### Documentation
- `authentication/AUTHENTICATION_GUIDE.md` - Updated with new patient role
- `authentication/PATIENT_AUTHENTICATION.md` - NEW - Patient-specific guide

## Integration with Other Modules

### Appointments App
No changes needed. The Appointment model still references Patient via ForeignKey:
```python
patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
```

Patients can now:
- Schedule appointments
- View their appointments
- Manage appointment details

### Medications App
No changes needed. The Medication model still references Patient:
```python
patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
```

Patients can now:
- Track their medications
- View medication schedules
- Manage medication information

### Notifications App
No direct changes, but can be extended to:
- Send notifications to patient's email
- Alert caregivers of patient activity
- Pattern matching for medication reminders

## Access Control Summary

### Before Patient Registration
```
User (Caregiver/Provider/Family)
    └─ Can manage generic Patient records
       (no login capability for admin-created patients)
```

### After Patient Registration
```
User (Patient Account)
    └─ Can login
    └─ Links to Patient record
    └─ Has Profile with role='patient'
    └─ Can view own appointments/medications
    └─ Can update own patient data
    └─ Cannot view other patients
```

## Database Schema Impact

### New Columns in authentication_patient
- `user_id` (ForeignKey to authentication_user) - nullable, initially NULL for existing records

### Updated Constraints
- Patient.user now OneToOne with User
- Patient.user nullable for backward compatibility

### Foreign Key Relationships
- User (1) ←→ (1) Patient (NEW)
- User (1) ←→ (M) Patient.caregivers (existing, related_name updated)
- Profile (1) ←→ (1) User (existing)

## Testing Checklist

- [ ] Run migrations successfully
- [ ] New patient registration works
- [ ] Patient login returns token + patient data
- [ ] Patient can access `my_patient_data` endpoint
- [ ] Other users cannot access patient endpoints (get 403)
- [ ] Existing patient records still work with caregivers
- [ ] Appointments app recognizes patients
- [ ] Medications app recognizes patients
- [ ] Admin interface shows updated role options

## Troubleshooting

### Migration Errors

**Error: "user_id constraint failed"**
- Solution: user field is nullable, so no existing data issues
- If error persists, check PostgreSQL/SQLite compatibility

**Error: "patients_managed" relation not found**
- Solution: Ensure migrations are applied
- Check that related_name in model matches usage in code

### Authentication Issues

**Patient can't login**
- Verify user record exists in database
- Check authentication/login view logs
- Ensure token was created during registration

**Patient can't access medicines/appointments**
- Verify Patient record links to User
- Check role is set to 'patient' in Profile
- Verify permissions in ViewSet filters

## Next Steps

1. Apply migrations to database
2. Test patient registration endpoint
3. Test patient login flow
4. Verify patient data access controls
5. Update frontend to use new `/register/patient/` endpoint
6. Test integration with appointments/medications
7. Deploy to staging environment

## Support & Documentation

For complete API documentation:
- See `authentication/AUTHENTICATION_GUIDE.md` - General auth system
- See `authentication/PATIENT_AUTHENTICATION.md` - Patient-specific features
- See README.md - Architecture overview

For troubleshooting:
1. Check error messages in response
2. Verify authentication token in requests
3. Ensure user role matches endpoint access requirements
4. Check database for orphaned records
