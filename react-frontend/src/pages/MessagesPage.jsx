import React, { useState, useEffect, useRef } from 'react'
import { messageApi, authApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'

export default function MessagesPage() {
  const { user } = useAuth()
  const t = useToast()
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [thread, setThread]     = useState([])
  const [users, setUsers]       = useState([])
  const [compose, setCompose]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [form, setForm]         = useState({ receiver: '', content: '' })
  const bottomRef = useRef()

  const reload = async () => {
    setLoading(true)
    try {
      const [msgs, profiles] = await Promise.allSettled([
        messageApi.list(),
        authApi.myProfile(),
      ])
      const arr = msgs.value ? (Array.isArray(msgs.value) ? msgs.value : msgs.value.results || []) : []
      setMessages(arr)
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread])

  // Load thread when selected user changes
  useEffect(() => {
    if (!selected) { setThread([]); return }
    const th = messages.filter(m =>
      (m.sender_username === selected || m.receiver_username === selected) ||
      (m.sender === selected || m.receiver === selected)
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setThread(th)
    // Mark unread
    th.filter(m => !m.is_read && m.receiver_username === user?.username)
      .forEach(m => messageApi.markRead(m.id).catch(() => {}))
  }, [selected, messages, user])

  // Derive conversation partners
  const partners = [...new Set(messages.map(m =>
    m.sender_username === user?.username ? m.receiver_username : m.sender_username
  ))].filter(Boolean)

  const send = async () => {
    if (!form.content.trim()) return
    setSending(true)
    try {
      await messageApi.send({ receiver_username: form.receiver || selected, content: form.content })
      setForm(f => ({ ...f, content: '' }))
      setCompose(false)
      await reload()
      if (form.receiver) setSelected(form.receiver)
    } catch (e) { t.error(e.message) }
    finally { setSending(false) }
  }

  const unreadCount = (partner) =>
    messages.filter(m => m.sender_username === partner && !m.is_read).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Messages</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { setCompose(true); setForm({ receiver: '', content: '' }) }}>
          + New Message
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, height: 'calc(100vh - 200px)', minHeight: 400 }}>
        {/* Contacts */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 13 }}>
            Conversations
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {partners.length === 0 && !loading && (
              <div style={{ padding: 16, color: 'var(--gray-400)', fontSize: 13, textAlign: 'center' }}>No conversations yet</div>
            )}
            {partners.map(partner => (
              <button
                key={partner}
                onClick={() => setSelected(partner)}
                style={{
                  width: '100%', textAlign: 'left', padding: '12px 16px',
                  background: selected === partner ? 'var(--primary-light)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--gray-100)',
                  cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontWeight: selected === partner ? 600 : 400 }}>{partner}</span>
                {unreadCount(partner) > 0 && (
                  <span style={{
                    background: 'var(--primary)', color: '#fff', borderRadius: '50%',
                    width: 18, height: 18, fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{unreadCount(partner)}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected && !compose ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p>Select a conversation or start a new message</p>
            </div>
          ) : compose ? (
            <div style={{ flex: 1, padding: 24 }}>
              <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>New Message</h3>
              <div className="form-group">
                <label className="form-label">To (username)</label>
                <input className="form-control" value={form.receiver} onChange={e => setForm(f => ({ ...f, receiver: e.target.value }))} placeholder="Enter recipient username" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea className="form-control" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your message…" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setCompose(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={send} disabled={sending || !form.receiver || !form.content.trim()}>
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--gray-100)', fontWeight: 600, fontSize: 14 }}>
                {selected}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thread.map(msg => {
                  const mine = msg.sender_username === user?.username
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '8px 14px', borderRadius: 12,
                        background: mine ? 'var(--primary)' : 'var(--gray-100)',
                        color: mine ? '#fff' : 'var(--gray-800)',
                        fontSize: 13, lineHeight: 1.5,
                      }}>
                        {msg.content}
                        <div style={{ fontSize: 10, opacity: .7, marginTop: 4, textAlign: 'right' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {mine && msg.is_read && ' ✓'}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              {/* Reply box */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-100)', display: 'flex', gap: 8 }}>
                <input
                  className="form-control" placeholder="Reply…"
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={send} disabled={sending || !form.content.trim()}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
