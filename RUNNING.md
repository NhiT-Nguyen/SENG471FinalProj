# Running the Healthcare Platform

## Quick Start

Double-click `start.bat` — it launches both Django and React automatically.

Or run manually:

### Backend (Django)
```bash
# From project root
python manage.py migrate       # first time only
python manage.py runserver     # http://localhost:8000
```

### Frontend (React)
```bash
cd react-frontend
npm install    # first time only
npm run dev    # http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Creating Test Data (Simulator)

1. Open http://localhost:3000/register and create accounts, OR
2. Log in as any user and navigate to **Data Simulator** in the sidebar
3. Click **"Create All Preset Accounts"** to create 6 test accounts instantly

### Preset accounts (password: `Pass1234!` for all)
| Username | Role | Details |
|---|---|---|
| `dr_smith` | Healthcare Provider | Cardiology, City Medical Center |
| `dr_jones` | Healthcare Provider | General Practice |
| `patient_alice` | Patient | DOB: 1985-03-15, Blood type A+ |
| `patient_bob` | Patient | DOB: 1972-08-22, Blood type O- |
| `caregiver_mary` | Caregiver | |
| `family_tom` | Family Member | |

### End-to-end workflow
1. Log in as `dr_smith` → Go to **My Availability** → Add slots (Mon-Fri 9am-5pm)
2. Log in as `patient_alice` → Go to **Find Providers** → Request appointment with Dr. Smith
3. Log in as `dr_smith` → Go to **Appointments** → Approve the pending request
4. Log in as `dr_smith` → Go to **Medications** → Prescribe a medication to Alice
5. Log in as `patient_alice` → Check **Medications**, **Notifications**, **Dashboard**
6. Use the **Simulator** to send messages, create alerts, add medical records

---

## API Reference
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin/
- Token Auth: `POST /api-token-auth/` with `{username, password}`
