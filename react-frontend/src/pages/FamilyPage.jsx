import React, { useState, useEffect } from 'react'
import { authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h2>{title}</h2><button className="modal-close" onClick={onClose}>×</button></div>
        {children}
      </div>
    </div>
  )
}

export default function FamilyPage() {
  const { isPatient, isFamilyMember } = useAuth()
  const t = useToast()
  const [patient, setPatient]       = useState(null)
  const [familyPatients, setFamilyPatients] = useState([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState(false)
  const [removeModal, setRemoveModal] = useState(null)
  const [form, setForm] = useState({ username: '', relationship: 'child', is_emergency_contact: false })

  const reload = async () => {
    setLoading(true)
    try {
      if (isPatient) {
        const p = await authApi.myPatientRecord()
        setPatient(p)
      }
      if (isFamilyMember) {
        const fps = await authApi.myFamilyPatients()
        setFamilyPatients(Array.isArray(fps) ? fps : fps.results || [])
      }
    } catch (e) {
      // patient record may not exist yet
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [isPatient, isFamilyMember])

  const addMember = async () => {
    try {
      await authApi.addFamilyMember(patient.id, form)
      t.success('Family member added')
      setModal(false)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const removeMember = async (username) => {
    try {
      await authApi.removeFamilyMember(patient.id, { username })
      t.success('Family member removed')
      setRemoveModal(null)
      reload()
    } catch (e) { t.error(e.message) }
  }

  const RELATIONSHIPS = ['spouse','parent','child','sibling','grandparent','grandchild','other']

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <h1>Family Access</h1>
        <p>{isPatient ? 'Manage who can access your health information' : 'Patients you have access to'}</p>
      </div>

      {/* Patient view: manage family members */}
      {isPatient && (
        <>
          {!patient ? (
            <div className="alert alert-info">No patient record found. Please complete your profile first.</div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn btn-primary" onClick={() => setModal(true)}>+ Add Family Member</button>
              </div>

              <div className="card table-wrap">
                {(!patient.family_members || patient.family_members.length === 0) ? (
                  <div className="empty-state"><p>No family members added yet</p></div>
                ) : (
                  <table>
                    <thead>
                      <tr><th>Username</th><th>Relationship</th><th>Emergency Contact</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {(patient.family_members || []).map((fm, i) => (
                        <tr key={i}>
                          <td>{typeof fm === 'object' ? fm.username || fm.user_username : fm}</td>
                          <td style={{ textTransform: 'capitalize' }}>{fm.relationship || '—'}</td>
                          <td>{fm.is_emergency_contact ? '✓' : '—'}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => setRemoveModal(typeof fm === 'object' ? fm.username || fm.user_username : fm)}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Family member view: see patients they have access to */}
      {isFamilyMember && (
        <div className="card table-wrap">
          {familyPatients.length === 0 ? (
            <div className="empty-state"><p>You have not been added as a family member for any patient yet</p></div>
          ) : (
            <table>
              <thead>
                <tr><th>Patient</th><th>Date of Birth</th><th>Blood Type</th><th>Emergency Contact</th></tr>
              </thead>
              <tbody>
                {familyPatients.map(p => (
                  <tr key={p.id}>
                    <td>{p.user_username || p.name || p.id}</td>
                    <td>{p.date_of_birth || '—'}</td>
                    <td>{p.blood_type || '—'}</td>
                    <td>{p.emergency_contact || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add member modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Family Member">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className="form-control" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Their username" required />
          </div>
          <div className="form-group">
            <label className="form-label">Relationship</label>
            <select className="form-control" value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}>
              {RELATIONSHIPS.map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="emerg" checked={form.is_emergency_contact}
              onChange={e => setForm(f => ({ ...f, is_emergency_contact: e.target.checked }))} />
            <label htmlFor="emerg" style={{ fontSize: 14, cursor: 'pointer' }}>Emergency contact</label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={addMember} disabled={!form.username}>Add</button>
        </div>
      </Modal>

      {/* Remove confirm */}
      <Modal open={!!removeModal} onClose={() => setRemoveModal(null)} title="Remove Family Member">
        <div className="modal-body">
          <p>Remove <strong>{removeModal}</strong> from your family access list?</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setRemoveModal(null)}>Cancel</button>
          <button className="btn btn-danger" onClick={() => removeMember(removeModal)}>Remove</button>
        </div>
      </Modal>
    </div>
  )
}
