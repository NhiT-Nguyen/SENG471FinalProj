# Healthcare Coordination Platform

A digital platform enabling **caregivers, family members, and healthcare providers** to coordinate medication management, schedule appointments, and receive timely alerts for elderly patients.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [User Roles](#user-roles)
5. [Test Accounts & Data Simulator](#test-accounts--data-simulator)
6. [End-to-End Testing Workflow](#end-to-end-testing-workflow)
7. [Application Features](#application-features)
8. [API Reference](#api-reference)
9. [Data Models](#data-models)
10. [Management Commands](#management-commands)

---

## Overview

The Healthcare Coordination Platform addresses a key challenge in elderly care: keeping patients, their families, caregivers, and healthcare providers all aligned and informed. The system provides:

- **Medication tracking** — providers prescribe, patients and caregivers monitor active prescriptions
- **Appointment coordination** — patients request appointments, providers approve/reject and add clinical notes
- **Real-time alerts** — notifications for appointment changes, new messages, and prescription updates
- **Family access** — patients grant family members read access to their health information
- **Medical history** — centralised records including diagnoses, lab tests, procedures, and vaccinations
- **Direct messaging** — secure messaging between any two users on the platform

---

## Architecture

| Layer | Technology |
|---|---|
| Backend | Django 6 + Django REST Framework |
| Frontend | React 18 + Vite + React Router v6 |
| Database | SQLite (development) |
| Authentication | DRF Token Authentication |
| API Style | RESTful JSON |

The backend is a pure API server. The React frontend runs separately and communicates via authenticated HTTP requests. CORS is enabled for all origins in development.

---

## Quick Start

### Option A — One command (Windows)

```bat
start.bat
```

Opens two terminals: Django on port 8000, React on port 3000.

### Option B — Manual

**Backend**
```bash
# Activate virtual environment
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux

python manage.py migrate     # first time only
python manage.py runserver   # → http://localhost:8000
```

**Frontend**
```bash
cd react-frontend
npm install                  # first time only
npm run dev                  # → http://localhost:3000
```

Open **http://localhost:3000** in your browser.

> The Vite dev server proxies all `/api/*` requests to `localhost:8000` automatically — no manual CORS configuration needed during development.

---

## User Roles

The platform has four distinct roles, each with a tailored dashboard and feature set:

| Role | Description |
|---|---|
| **Patient** | The person receiving care. Can request appointments, view their own medications and medical records, manage family access, and message providers. |
| **Healthcare Provider** | A licensed clinician. Sets weekly availability, approves/rejects appointment requests, writes clinical notes, prescribes medications, and creates medical records. |
| **Caregiver** | A professional carer assigned to one or more patients. Can view patient appointments and medications, and communicate with providers on the patient's behalf. |
| **Family Member** | A relative or emergency contact granted access by the patient. Read-only view of the patient's health data; can also message providers. |

---

## Test Accounts & Data Simulator

### Creating accounts

**Option 1 — Simulator (recommended for testing)**

1. Start both servers and open http://localhost:3000
2. Register any account (e.g. a provider) at `/register`
3. Log in and click **Data Simulator** in the sidebar
4. Click **"Create All Preset Accounts"** — done in seconds

**Option 2 — Register manually**

Go to http://localhost:3000/register and fill in role-specific fields.

---

### Preset accounts

All preset accounts share the password: **`Pass1234!`**

| Username | Role | Specialty / Details |
|---|---|---|
| `dr_smith` | Healthcare Provider | Cardiology · City Medical Center |
| `dr_jones` | Healthcare Provider | General Practice · Family Health Clinic |
| `patient_alice` | Patient | DOB 1985-03-15 · Blood type A+ |
| `patient_bob` | Patient | DOB 1972-08-22 · Blood type O- |
| `caregiver_mary` | Caregiver | — |
| `family_tom` | Family Member | — |

---

### Data Simulator reference

The **Data Simulator** page (sidebar, any logged-in user) lets you inject test data without manual navigation through every form.

| Section | Who can use | What it does |
|---|---|---|
| Quick Setup | Anyone | Creates all 6 preset accounts in one click |
| Register Custom User | Anyone | Create a user with any role |
| Create Availability Slot | Provider | Add a weekly availability slot for the logged-in provider |
| Send Test Message | Anyone | Send a message to any user by username |
| Create Notification Alert | Anyone | Simulate a system alert for any user |
| Prescribe Medication | Provider only | Prescribe a medication to a patient |
| Add Medical Record | Provider only | Create a record (diagnosis, lab test, note, etc.) |
| Request Appointment | Patient / Caregiver | Submit a request to a provider |
| Database State | Anyone | Live count of patients and providers in the database |

---

## End-to-End Testing Workflow

Follow these steps to exercise the full application:

**Step 1 — Provider sets availability**
1. Log in as `dr_smith`
2. Go to **My Availability** → **Add Slot**
3. Create slots (e.g. Monday–Friday, 09:00–17:00, recurring)

**Step 2 — Patient requests an appointment**
1. Log in as `patient_alice`
2. Go to **Find Providers** → search "Smith" or filter by Cardiology
3. Click **Request Appointment**, pick a date/time, submit

**Step 3 — Provider approves the request**
1. Log in as `dr_smith`
2. Go to **Appointments** → **Pending** tab → click **Approve**

**Step 4 — Provider prescribes a medication**
1. Still as `dr_smith`, go to **Medications** → **Prescribe**
2. Select Alice, fill in medication details

**Step 5 — Provider adds a medical record**
1. Go to **Medical History** → **Add Record**
2. Select Alice, choose record type (e.g. diagnosis), submit

**Step 6 — Check patient view**
1. Log in as `patient_alice`
2. Dashboard shows updated stats (appointment, medication counts)
3. Check **Medications**, **Medical History**, **Notifications**

**Step 7 — Messaging**
1. As `patient_alice`, go to **Messages** → **New Message** → To: `dr_smith`
2. Log in as `dr_smith` to read and reply

**Step 8 — Family access**
1. As `patient_alice`, go to **Family Access** → **Add Family Member** → username: `family_tom`
2. Log in as `family_tom` → Family Access now shows Alice's record

---

## Application Features

### Role-based feature matrix

| Feature | Patient | Provider | Caregiver | Family Member |
|---|---|---|---|---|
| Dashboard with stats | ✓ | ✓ | ✓ | ✓ |
| Find providers & request appointments | ✓ | — | ✓ | ✓ |
| Manage weekly availability | — | ✓ | — | — |
| Approve / reject appointment requests | — | ✓ | — | — |
| Write clinical notes post-appointment | — | ✓ | — | — |
| View appointments | ✓ | ✓ | ✓ | ✓ |
| Prescribe medications | — | ✓ | — | — |
| Discontinue medications | — | ✓ | — | — |
| View medications | ✓ | ✓ | ✓ | ✓ |
| Create medical records | — | ✓ | — | — |
| View medical history | ✓ | ✓ | ✓ | ✓ |
| Direct messaging | ✓ | ✓ | ✓ | ✓ |
| Notification alerts | ✓ | ✓ | ✓ | ✓ |
| Notification preferences | ✓ | ✓ | ✓ | ✓ |
| Manage family access (grant / revoke) | ✓ | — | — | — |
| View family patient records | — | — | — | ✓ |

### Appointment workflow

```
Patient submits request
        ↓
Provider reviews (Pending tab)
        ↓
Approve → Appointment created     Reject → Request closed
        ↓
Provider adds clinical notes within the appointment
(reasons for visit, examinations, tests, referrals, follow-up)
```

### Provider availability system

Providers define **recurring weekly slots** (e.g. Monday 09:00–17:00). Each slot has a status:

| Status | Meaning |
|---|---|
| `available` | Open for booking |
| `busy` | Manually blocked |
| `appointment_request_pending` | A patient has submitted a request for this slot |

Providers receive **weekly confirmation prompts** (via `create_weekly_confirmations` management command) to verify their schedule is up to date.

### Provider specialties

Valid choices when registering or updating a provider profile:

`general_practice` · `cardiology` · `neurology` · `pediatrics` · `orthopedics` · `dermatology` · `psychiatry` · `radiology` · `emergency_medicine` · `nursing` · `pharmacy` · `other`

### Medical record types

`appointment` · `medication` · `lab_test` · `diagnosis` · `procedure` · `vaccination` · `allergy` · `note`

---

## API Reference

All endpoints (except `/api-token-auth/` and `/api/auth/register/`) require a token in the `Authorization` header:

```
Authorization: Token <your_token_here>
```

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api-token-auth/` | Obtain token (`username` + `password`) |
| POST | `/api/auth/register/` | Register new user (all roles) |
| GET | `/api/auth/profiles/my_profile/` | Get your own profile |
| PATCH | `/api/auth/profiles/update_my_profile/` | Update your profile |
| GET | `/api/auth/patients/` | List all patients |
| GET | `/api/auth/patients/my_patient_record/` | Your patient record |
| GET | `/api/auth/patients/my_family_patients/` | Patients you're a family member for |
| POST | `/api/auth/patients/{id}/add_family_member/` | Add a family member to a patient |
| POST | `/api/auth/patients/{id}/remove_family_member/` | Remove a family member |
| GET | `/api/auth/healthcare-providers/` | List all providers |

### Appointments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/appointments/appointments/` | List appointments for the current user |
| GET | `/api/appointments/appointments/history/` | Past appointments |
| PATCH | `/api/appointments/appointments/{id}/update_notes/` | Add / update clinical notes |
| GET | `/api/appointments/availabilities/` | All availability slots |
| POST | `/api/appointments/availabilities/` | Create a slot (provider, auto-assigned) |
| GET | `/api/appointments/availabilities/provider_availability/` | Your slots (logged-in provider) |
| GET | `/api/appointments/availabilities/search_providers/?q=name` | Search providers by name |
| GET | `/api/appointments/availabilities/filter_by_specialty/?specialty=cardiology` | Filter by specialty |
| GET | `/api/appointments/availabilities/available_at_datetime/?datetime=…` | Providers available at a datetime |
| GET | `/api/appointments/availability-confirmations/pending_confirmations/` | Unconfirmed weeks |
| POST | `/api/appointments/availability-confirmations/{id}/confirm/` | Confirm a week |
| POST | `/api/appointments/appointment-requests/request_appointment/` | Submit appointment request |
| GET | `/api/appointments/appointment-requests/my_requests/` | Your requests (patient) |
| GET | `/api/appointments/appointment-requests/pending_requests/` | Incoming requests (provider) |
| POST | `/api/appointments/appointment-requests/{id}/approve/` | Approve a request |
| POST | `/api/appointments/appointment-requests/{id}/reject/` | Reject a request |
| POST | `/api/appointments/appointment-requests/{id}/cancel/` | Cancel a request (patient) |

### Medications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medications/medications/` | List medications (filtered by role) |
| POST | `/api/medications/medications/` | Prescribe a medication (provider only) |
| GET | `/api/medications/medications/current/` | Active medications only |
| PATCH | `/api/medications/medications/{id}/` | Update a medication |
| POST | `/api/medications/medications/{id}/discontinue/` | Discontinue a medication (provider) |

### Messages

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/messages/messages/` | List sent and received messages |
| POST | `/api/messages/messages/` | Send a message (`receiver_username` or `receiver` user ID) |
| GET | `/api/messages/messages/unread/` | Unread messages only |
| POST | `/api/messages/messages/{id}/mark_as_read/` | Mark a message as read |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications/alerts/` | List your alerts |
| POST | `/api/notifications/alerts/` | Create an alert |
| POST | `/api/notifications/alerts/{id}/mark_as_read/` | Mark an alert as read |
| GET | `/api/notifications/settings/me/` | Get your notification preferences |
| PATCH | `/api/notifications/settings/me/` | Update your notification preferences |

### Medical History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/medical-history/records/` | List medical records |
| POST | `/api/medical-history/records/` | Create a record (provider only) |
| GET | `/api/medical-history/records/by_type/?type=diagnosis` | Filter records by type |
| GET | `/api/medical-history/records/recent/` | Most recent records |
| GET | `/api/medical-history/history/my_history/` | Full history for the logged-in patient |
| GET | `/api/medical-history/history/patient_history/?patient_id=1` | History for a specific patient |
| GET | `/api/medical-history/summary/` | Summary statistics |

---

## Authentication (API Usage)

```bash
# 1. Obtain a token
curl -X POST http://localhost:8000/api-token-auth/ \
  -H "Content-Type: application/json" \
  -d '{"username": "dr_smith", "password": "Pass1234!"}'
# → {"token": "abc123..."}

# 2. Use it in subsequent requests
curl http://localhost:8000/api/auth/profiles/my_profile/ \
  -H "Authorization: Token abc123..."
```

---

## Data Models

### Profile

Every user has exactly one Profile that sets their role.

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOne → User | Django auth user |
| `role` | CharField | `patient`, `healthcare_provider`, `caregiver`, `family_member` |

### Patient

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOne → User | The patient's user account |
| `name` | CharField | Full name |
| `date_of_birth` | DateField | |
| `caregivers` | ManyToMany → User | Assigned caregivers |
| `family_members` | ManyToMany → User | Granted family access |

### HealthcareProvider

| Field | Type | Notes |
|---|---|---|
| `user` | OneToOne → User | The provider's user account |
| `specialty` | CharField | Choice field — see specialty list above |
| `license_number` | CharField | |
| `hospital_clinic` | CharField | Associated facility |
| `phone_number` | CharField | |
| `bio` | TextField | Professional biography |
| `years_of_experience` | PositiveIntegerField | |

### Appointment

| Field | Type | Notes |
|---|---|---|
| `patient` | ForeignKey → Patient | |
| `healthcare_provider` | ForeignKey → User | Provider's user account |
| `date` | DateField | |
| `time` | TimeField | |
| `duration` | DurationField | Default 1 hour |
| `notes` | TextField | General notes |
| `reasons_for_visit` | TextField | Clinical field |
| `examinations_performed` | TextField | Clinical field |
| `tests_requested` | TextField | Clinical field |
| `new_medications` | TextField | Clinical field |
| `referrals` | TextField | Clinical field |
| `follow_up_recommended` | BooleanField | |
| `location` | CharField | |

### Availability

| Field | Type | Notes |
|---|---|---|
| `healthcare_provider` | ForeignKey → User | Auto-set from logged-in user on create |
| `day_of_week` | IntegerField | 0 = Monday … 6 = Sunday |
| `start_time` | TimeField | |
| `end_time` | TimeField | |
| `is_recurring` | BooleanField | Weekly recurring vs. one-off |
| `week_start_date` | DateField | For non-recurring overrides |
| `status` | CharField | `available`, `busy`, `appointment_request_pending` |

### AppointmentRequest

| Field | Type | Notes |
|---|---|---|
| `patient` | ForeignKey → Patient | Auto-set from logged-in user |
| `healthcare_provider` | ForeignKey → User | Target provider |
| `requested_date` | DateField | |
| `requested_start_time` | TimeField | |
| `requested_end_time` | TimeField | Auto-filled to +1 hour if omitted |
| `notes` | TextField | |
| `status` | CharField | `pending`, `approved`, `rejected`, `cancelled` |

### Medication

| Field | Type | Notes |
|---|---|---|
| `patient` | ForeignKey → Patient | |
| `prescribed_by` | ForeignKey → HealthcareProvider | Auto-set |
| `name` | CharField | |
| `dosage` | CharField | e.g. "500mg" |
| `frequency` | CharField | e.g. "Twice daily" |
| `start_date` | DateField | |
| `end_date` | DateField | Optional |
| `administration_instructions` | TextField | |
| `status` | CharField | `active`, `discontinued`, `completed` |

### Message

| Field | Type | Notes |
|---|---|---|
| `sender` | ForeignKey → User | Auto-set from logged-in user |
| `receiver` | ForeignKey → User | Can be specified by ID or `receiver_username` |
| `content` | TextField | |
| `created_at` | DateTimeField | |
| `is_read` | BooleanField | |

### Alert

| Field | Type | Notes |
|---|---|---|
| `user` | ForeignKey → User | Recipient |
| `message` | TextField | Alert content |
| `created_at` | DateTimeField | |
| `is_read` | BooleanField | |

---

## Project Structure

```
SENG471FinalProj/
├── healthcare_platform/      Django project settings & root URLs
├── authentication/           User profiles, patients, providers, family
├── appointments/             Appointments, availability slots, requests
├── medications/              Prescription tracking
├── medical_history/          Health records & patient history summaries
├── messages/                 Direct user-to-user messaging
├── notifications/            Alerts & notification preferences
├── react-frontend/           React 18 + Vite frontend
│   ├── src/
│   │   ├── api/client.js     Centralised API layer (all endpoints)
│   │   ├── context/          AuthContext — token, role, profile state
│   │   ├── hooks/            useToast — global toast notifications
│   │   ├── components/       Sidebar, TopBar layout shell
│   │   └── pages/            One file per page (Dashboard, Appointments, …)
│   └── vite.config.js        Proxies /api/* → localhost:8000
├── frontend/                 Legacy HTML frontend (kept as reference)
├── venv/                     Python virtual environment
├── start.bat                 Launch both servers (Windows)
├── manage.py
└── requirements.txt
```

---

## Management Commands

```bash
# Generates weekly availability confirmation prompts for all providers.
# Run every Monday to prompt providers to confirm their upcoming week's schedule.
python manage.py create_weekly_confirmations
```

---

## Django Admin

Create a superuser, then access http://localhost:8000/admin/ to manage all data directly.

```bash
python manage.py createsuperuser
```
