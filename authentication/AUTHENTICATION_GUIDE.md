# Backend Authentication Service

## Overview

The authentication service provides token-based authentication for the Healthcare Coordination Platform. It allows users to register new accounts, log in securely, and access protected resources using authentication tokens.

## Features

✅ **User Registration**
- Create new accounts with email validation
- Assign user roles (caregiver, family_member, healthcare_provider)
- Password strength validation
- Automatic token generation

✅ **Secure Login**
- Authenticate users with username and password
- Non-existent account detection
- Clear error messages with actionable guidance
- Token-based session management

✅ **Role-Based Access**
- Three user roles: Caregiver, Family Member, Healthcare Provider
- Profile management for role assignment
- Extensible role system

✅ **Protection**
- Users without accounts cannot log in
- Non-existent users are prompted to create an account
- Password validation (minimum 8 characters)
- Unique email and username enforcement

## API Endpoints

### 1. User Registration

**Endpoint:** `POST /api/auth/register/`

**Description:** Create a new user account with a specified role.

**Request Payload:**
```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePassword123",
    "password_confirm": "SecurePassword123",
    "role": "caregiver"
}
```

**Valid Roles:**
- `caregiver` - Healthcare caregiver
- `family_member` - Family member of patient
- `healthcare_provider` - Doctor or medical professional

**Success Response (201 Created):**
```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe"
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
    "role": ["Invalid role. Must be one of: caregiver, family_member, healthcare_provider"]
}
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/login/`

**Description:** Authenticate a user and retrieve their authentication token.

**Request Payload:**
```json
{
    "username": "john_doe",
    "password": "SecurePassword123"
}
```

**Success Response (200 OK):**
```json
{
    "message": "Login successful",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "caregiver"
    }
}
```

**Account Not Found Error (401 Unauthorized):**
```json
{
    "error": "Account not found. Please create an account first.",
    "error_code": "account_not_found",
    "action": "Please register a new account using the /register/ endpoint"
}
```

**Invalid Credentials Error (401 Unauthorized):**
```json
{
    "error": "Invalid username or password.",
    "error_code": "invalid_credentials"
}
```

---

### 3. Get User Profile

**Endpoint:** `GET /api/auth/profiles/my_profile/`

**Description:** Retrieve the current authenticated user's profile information.

**Headers Required:**
```
Authorization: Token a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Success Response (200 OK):**
```json
{
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe"
    },
    "role": "caregiver"
}
```

---

## Authentication Usage

### Using Token in API Requests

Include the token in the `Authorization` header for all authenticated endpoints:

```bash
curl -H "Authorization: Token a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" \
     http://127.0.0.1:8000/api/auth/profiles/my_profile/
```

### JavaScript Example

```javascript
const token = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6";

fetch('http://127.0.0.1:8000/api/auth/profiles/my_profile/', {
    headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Complete Authentication Flow

### 1. New User Registration Flow

```
User (no account)
       ↓
   POST /api/auth/register/
       ↓
   Validation checks (username unique, email unique, passwords match, role valid)
       ↓
   User & Profile created
   Token generated
       ↓
   Returns: User data + Token
       ↓
   User can now access protected endpoints
```

### 2. Existing User Login Flow

```
User (has account)
       ↓
   POST /api/auth/login/
       ↓
   Check if account exists
       ├─ NO → Return error + registration prompt
       └─ YES → Continue
       ↓
   Validate password
       ├─ Invalid → Return invalid credentials error
       └─ Valid → Continue
       ↓
   Get or create token
       ↓
   Returns: Token + User data
       ↓
   User can now access protected endpoints
```

### 3. Non-Existent User Login Attempt Flow

```
User tries to login with non-existent account
       ↓
   POST /api/auth/login/ with invalid username
       ↓
   Account NOT found check (before password validation)
       ↓
   Return 401 Unauthorized with:
   - Error: "Account not found. Please create an account first."
   - Action: "Please register a new account using the /register/ endpoint"
       ↓
   User redirected to registration
```

---

## Configuration Details

### Installed Components

- **django.contrib.auth** - Django authentication backend
- **rest_framework.authtoken** - Token authentication for REST API
- **rest_framework** - Django REST Framework
- **corsheaders** - CORS support for frontend communication

### Authentication Settings

From `healthcare_platform/settings.py`:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### Database Models

**User Model** (Django built-in)
- username
- email
- password (hashed)
- first_name
- last_name

**Profile Model** (extended user info)
- user (OneToOneField to User)
- role (choice: caregiver, family_member, healthcare_provider)

**Token Model** (auto-generated)
- key (unique token)
- user (OneToOneField to User)

---

## Error Handling

| Error Code | Status | Meaning | Action |
|-----------|--------|---------|--------|
| `account_not_found` | 401 | User account doesn't exist | Register new account |
| `invalid_credentials` | 401 | Wrong password | Retry login or reset password |
| (validation error) | 400 | Invalid input data | Check request format |

---

## Security Best Practices

1. **Passwords**
   - Minimum 8 characters required
   - Must match confirmation field
   - Stored as hashes (never plain text)

2. **Tokens**
   - Unique per user
   - Store securely on client (localStorage or secure cookies)
   - Include in Authorization header for requests
   - Can be regenerated on each login

3. **Email & Username**
   - Must be unique
   - Email format validated
   - Username validated against existing accounts

4. **CORS**
   - Currently allows all origins for development
   - Should be restricted to specific domains in production

---

## Example Usage: Frontend Integration

```javascript
// Registration
async function register(userData) {
    const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    } else {
        const errors = await response.json();
        throw errors;
    }
}

// Login
async function login(username, password) {
    const response = await fetch('http://127.0.0.1:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    
    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return data;
    } else {
        const error = await response.json();
        if (error.error_code === 'account_not_found') {
            // Prompt user to register
            alert(error.action);
        }
        throw error;
    }
}

// Authenticated API call
async function getProfile() {
    const token = localStorage.getItem('token');
    const response = await fetch('http://127.0.0.1:8000/api/auth/profiles/my_profile/', {
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
        }
    });
    return response.json();
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}
```

---

## Testing the Authentication Service

### Command Line Tests

```bash
# Register a new user
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User",
    "password": "TestPass123",
    "password_confirm": "TestPass123",
    "role": "caregiver"
  }'

# Login with existing user
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123"
  }'

# Login with non-existent user (error case)
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nonexistent",
    "password": "SomePassword123"
  }'

# Get profile (requires token)
curl -X GET http://127.0.0.1:8000/api/auth/profiles/my_profile/ \
  -H "Authorization: Token YOUR_TOKEN_HERE"
```

---

## Next Steps

1. Run migrations: `python manage.py migrate`
2. Start the server: `python manage.py runserver`
3. Test endpoints using the cURL commands above or Postman
4. Integrate token storage in frontend (localStorage or cookies)
5. Add password reset functionality (optional)
6. Implement user profile editing (optional)
