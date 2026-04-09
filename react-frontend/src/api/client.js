const BASE = ''  // Vite proxy handles /api -> localhost:8000

function getToken() {
  return localStorage.getItem('authToken')
}

async function request(method, url, body = null, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Token ${token}`

  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const res = await fetch(BASE + url, config)

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const msg = data.detail || data.error || Object.values(data)[0] || `Error ${res.status}`
    const err = new Error(Array.isArray(msg) ? msg[0] : msg)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export const api = {
  get:    (url)        => request('GET',    url),
  post:   (url, body)  => request('POST',   url, body),
  patch:  (url, body)  => request('PATCH',  url, body),
  put:    (url, body)  => request('PUT',    url, body),
  delete: (url)        => request('DELETE', url),
}

// Auth
export const authApi = {
  login:       (data) => api.post('/api-token-auth/', data),
  register:    (data) => api.post('/api/auth/register/', data),
  myProfile:   ()     => api.get('/api/auth/profiles/my_profile/'),
  updateProfile: (data) => api.patch('/api/auth/profiles/update_my_profile/', data),
  myPatientRecord: () => api.get('/api/auth/patients/my_patient_record/'),
  myFamilyPatients: () => api.get('/api/auth/patients/my_family_patients/'),
  patients:    ()     => api.get('/api/auth/patients/'),
  patient:     (id)   => api.get(`/api/auth/patients/${id}/`),
  providers:   ()     => api.get('/api/auth/healthcare-providers/'),
  provider:    (id)   => api.get(`/api/auth/healthcare-providers/${id}/`),
  addFamilyMember: (patientId, data) => api.post(`/api/auth/patients/${patientId}/add_family_member/`, data),
  removeFamilyMember: (patientId, data) => api.post(`/api/auth/patients/${patientId}/remove_family_member/`, data),
}

// Appointments
export const appointmentApi = {
  list:            ()        => api.get('/api/appointments/appointments/'),
  history:         ()        => api.get('/api/appointments/appointments/history/'),
  updateNotes:     (id, data) => api.patch(`/api/appointments/appointments/${id}/update_notes/`, data),

  availabilities:  ()        => api.get('/api/appointments/availabilities/'),
  myAvailability:  ()        => api.get('/api/appointments/availabilities/provider_availability/'),
  searchProviders: (q)       => api.get(`/api/appointments/availabilities/search_providers/?q=${encodeURIComponent(q)}`),
  filterBySpecialty: (s)     => api.get(`/api/appointments/availabilities/filter_by_specialty/?specialty=${encodeURIComponent(s)}`),
  availableAtDatetime: (dt)  => api.get(`/api/appointments/availabilities/available_at_datetime/?datetime=${encodeURIComponent(dt)}`),
  createAvailability: (data) => api.post('/api/appointments/availabilities/', data),

  pendingConfirmations: ()   => api.get('/api/appointments/availability-confirmations/pending_confirmations/'),
  confirmAvailability: (id)  => api.post(`/api/appointments/availability-confirmations/${id}/confirm/`, {}),

  // data: { provider (user_id), requested_date, requested_start_time, requested_end_time?, notes }
  requestAppointment: (data) => api.post('/api/appointments/appointment-requests/request_appointment/', data),
  pendingRequests:    ()     => api.get('/api/appointments/appointment-requests/pending_requests/'),
  pendingChanges:     ()     => api.get('/api/appointments/appointment-requests/pending_change_requests/'),
  myRequests:         ()     => api.get('/api/appointments/appointment-requests/my_requests/'),
  approveRequest:     (id)   => api.post(`/api/appointments/appointment-requests/${id}/approve/`, {}),
  rejectRequest:      (id, data) => api.post(`/api/appointments/appointment-requests/${id}/reject/`, data),
  cancelRequest:      (id)   => api.post(`/api/appointments/appointment-requests/${id}/cancel/`, {}),
  acceptChanges:      (id)   => api.post(`/api/appointments/appointment-requests/${id}/accept_changes/`, {}),
  declineChanges:     (id)   => api.post(`/api/appointments/appointment-requests/${id}/decline_changes/`, {}),
  updateRequest:      (id, data) => api.patch(`/api/appointments/appointment-requests/${id}/`, data),
}

// Medications
export const medicationApi = {
  list:         ()        => api.get('/api/medications/medications/'),
  current:      ()        => api.get('/api/medications/medications/current/'),
  prescribe:    (data)    => api.post('/api/medications/medications/', data),
  update:       (id, data) => api.patch(`/api/medications/medications/${id}/`, data),
  discontinue:  (id, data) => api.post(`/api/medications/medications/${id}/discontinue/`, data || {}),
}

// Messages
export const messageApi = {
  list:       ()        => api.get('/api/messages/messages/'),
  unread:     ()        => api.get('/api/messages/messages/unread/'),
  send:       (data)    => api.post('/api/messages/messages/', data),
  markRead:   (id)      => api.post(`/api/messages/messages/${id}/mark_as_read/`, {}),
}

// Notifications
export const notificationApi = {
  mySettings:     ()     => api.get('/api/notifications/settings/me/'),
  updateSettings: (data) => api.patch('/api/notifications/settings/me/', data),
  alerts:         ()     => api.get('/api/notifications/alerts/'),
  createAlert:    (data) => api.post('/api/notifications/alerts/', data),
  markRead:       (id)   => api.post(`/api/notifications/alerts/${id}/mark_as_read/`, {}),
}

// Medical History
export const medicalApi = {
  records:        ()      => api.get('/api/medical-history/records/'),
  byType:         (type)  => api.get(`/api/medical-history/records/by_type/?type=${encodeURIComponent(type)}`),
  recent:         ()      => api.get('/api/medical-history/records/recent/'),
  createRecord:   (data)  => api.post('/api/medical-history/records/', data),
  summary:        ()      => api.get('/api/medical-history/summary/'),
  myHistory:      ()      => api.get('/api/medical-history/history/my_history/'),
  patientHistory: (id)    => api.get(`/api/medical-history/history/patient_history/?patient_id=${id}`),
}
