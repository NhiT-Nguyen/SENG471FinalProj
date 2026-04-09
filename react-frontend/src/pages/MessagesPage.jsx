import React, { useState, useEffect, useRef } from 'react'
import { messageApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import drSmithPhoto from '../static/dr_smith.png'

const USER_PHOTOS = { dr_smith: drSmithPhoto }

function Icon({ path, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={path} />
    </svg>
  )
}

function Avatar({ username, size = 32 }) {
  const photo = USER_PHOTOS[username]
  const initial = (username || 'U')[0].toUpperCase()
  const colors = [
    ['#dbeafe','#1e40af'], ['#dcfce7','#166534'], ['#f3e8ff','#6b21a8'],
    ['#ffe4e6','#9f1239'], ['#fef3c7','#92400e'], ['#ccfbf1','#0f766e'],
  ]
  const [bg, fg] = colors[initial.charCodeAt(0) % colors.length]

  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.28,
      overflow: 'hidden', flexShrink: 0,
      background: photo ? 'transparent' : bg,
      border: '1.5px solid rgba(0,0,0,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: fg,
    }}>
      {photo
        ? <img src={photo} alt={username} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        : initial
      }
    </div>
  )
}

function formatThreadDate(dateStr) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d
  if (diff < 86400000 && d.getDate() === now.getDate())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diff < 604800000)
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isSameDay(a, b) {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

function DateSeparator({ date }) {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  let label
  if (diff < 86400000 && d.getDate() === now.getDate()) label = 'Today'
  else if (diff < 172800000) label = 'Yesterday'
  else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
      <span style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--gray-100)' }} />
    </div>
  )
}

export default function MessagesPage() {
  const { user } = useAuth()
  const t = useToast()
  const [messages, setMessages] = useState([])
  const [selected, setSelected] = useState(null)
  const [thread, setThread]     = useState([])
  const [compose, setCompose]   = useState(false)
  const [loading, setLoading]   = useState(true)
  const [sending, setSending]   = useState(false)
  const [content, setContent]   = useState('')
  const [newTo, setNewTo]       = useState('')
  const bottomRef = useRef()
  const inputRef  = useRef()

  const reload = async () => {
    setLoading(true)
    try {
      const msgs = await messageApi.list()
      const arr  = Array.isArray(msgs) ? msgs : msgs.results || []
      setMessages(arr)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [thread])

  useEffect(() => {
    if (!selected) { setThread([]); return }
    const th = messages.filter(m =>
      m.sender_username === selected || m.receiver_username === selected ||
      m.sender === selected || m.receiver === selected
    ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    setThread(th)
    th.filter(m => !m.is_read && m.receiver_username === user?.username)
      .forEach(m => messageApi.markRead(m.id).catch(() => {}))
  }, [selected, messages, user])

  const partners = [...new Set(messages.map(m =>
    m.sender_username === user?.username ? m.receiver_username : m.sender_username
  ))].filter(Boolean)

  const unreadFrom = (partner) =>
    messages.filter(m => m.sender_username === partner && !m.is_read && m.receiver_username === user?.username).length

  const lastMsg = (partner) => {
    const msgs = messages.filter(m =>
      m.sender_username === partner || m.receiver_username === partner
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return msgs[0]
  }

  const send = async () => {
    const txt = content.trim()
    if (!txt) return
    const to = compose ? newTo.trim() : selected
    if (!to) return
    setSending(true)
    try {
      await messageApi.send({ receiver_username: to, content: txt })
      setContent('')
      if (compose) { setCompose(false); setSelected(to) }
      await reload()
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (e) { t.error(e.message) }
    finally { setSending(false) }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-h) - 56px)', minHeight: 500 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>
          Messages
        </h1>
        <button className="btn btn-primary btn-sm" onClick={() => { setCompose(true); setSelected(null); setContent(''); setNewTo('') }}>
          <Icon path="M12 5v14M5 12h14" size={14} /> New
        </button>
      </div>

      {/* Main layout */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr',
        border: '1px solid var(--gray-150)', borderRadius: 14,
        overflow: 'hidden', background: 'var(--white)', minHeight: 0,
      }}>

        {/* ── Sidebar ── */}
        <div style={{ borderRight: '1px solid var(--gray-150)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search-like header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Conversations
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && partners.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" /></div>
            )}
            {!loading && partners.length === 0 && (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--gray-400)', fontSize: 13 }}>
                No conversations yet
              </div>
            )}
            {partners.map(partner => {
              const last = lastMsg(partner)
              const unread = unreadFrom(partner)
              const active = selected === partner && !compose
              return (
                <button
                  key={partner}
                  onClick={() => { setSelected(partner); setCompose(false) }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '12px 16px',
                    background: active ? 'var(--primary-light)' : 'transparent',
                    border: 'none', borderBottom: '1px solid var(--gray-100)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    transition: 'background .1s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--gray-25)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Avatar username={partner} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 13, fontWeight: unread > 0 ? 600 : 500,
                        color: active ? 'var(--primary)' : 'var(--gray-800)',
                        letterSpacing: '-0.01em',
                      }}>{partner}</span>
                      {last && (
                        <span style={{ fontSize: 11, color: 'var(--gray-350, #adb5bd)', flexShrink: 0 }}>
                          {formatThreadDate(last.created_at)}
                        </span>
                      )}
                    </div>
                    {last && (
                      <div style={{
                        fontSize: 12, color: unread > 0 ? 'var(--gray-600)' : 'var(--gray-400)',
                        fontWeight: unread > 0 ? 500 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        marginTop: 2,
                      }}>
                        {last.sender_username === user?.username ? 'You: ' : ''}{last.content}
                      </div>
                    )}
                  </div>
                  {unread > 0 && (
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#2563eb', color: '#fff',
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{unread}</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Thread / Compose ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fafbfc' }}>
          {/* Empty state */}
          {!selected && !compose && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--gray-350, #adb5bd)', gap: 10,
            }}>
              <Icon path="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" size={32} />
              <p style={{ fontSize: 13 }}>Select a conversation or start a new message</p>
            </div>
          )}

          {/* Compose */}
          {compose && (
            <>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray-150)', background: 'var(--white)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-800)' }}>New Message</div>
              </div>
              <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">To (username)</label>
                  <input
                    className="form-control"
                    value={newTo}
                    onChange={e => setNewTo(e.target.value)}
                    placeholder="Recipient username"
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-control"
                    style={{ flex: 1, resize: 'none' }}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Write your message…"
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setCompose(false); setContent('') }}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={send} disabled={sending || !newTo.trim() || !content.trim()}>
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Thread */}
          {selected && !compose && (
            <>
              {/* Thread header */}
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid var(--gray-150)',
                background: 'var(--white)',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Avatar username={selected} size={30} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-900)', letterSpacing: '-0.01em' }}>{selected}</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px 20px',
                display: 'flex', flexDirection: 'column',
              }}>
                {thread.length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-350, #adb5bd)', fontSize: 13 }}>
                    No messages yet. Say hello!
                  </div>
                ) : (
                  thread.map((msg, idx) => {
                    const mine = msg.sender_username === user?.username
                    const showDate = idx === 0 || !isSameDay(thread[idx - 1].created_at, msg.created_at)
                    const prevMine = idx > 0 && thread[idx - 1].sender_username === user?.username
                    const sameGroup = !showDate && prevMine === mine
                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && <DateSeparator date={msg.created_at} />}
                        <div style={{
                          display: 'flex',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          gap: 8,
                          marginTop: sameGroup ? 2 : 10,
                        }}>
                          {!mine && (
                            <div style={{ opacity: sameGroup ? 0 : 1, flexShrink: 0 }}>
                              <Avatar username={msg.sender_username} size={26} />
                            </div>
                          )}
                          <div style={{
                            maxWidth: '68%',
                            padding: '9px 13px',
                            borderRadius: mine
                              ? '14px 14px 4px 14px'
                              : '14px 14px 14px 4px',
                            background: mine ? '#2563eb' : 'var(--white)',
                            color: mine ? '#fff' : 'var(--gray-800)',
                            fontSize: 13,
                            lineHeight: 1.55,
                            letterSpacing: '-0.01em',
                            boxShadow: mine ? 'none' : '0 1px 2px rgba(0,0,0,.06)',
                            border: mine ? 'none' : '1px solid var(--gray-150)',
                          }}>
                            <div>{msg.content}</div>
                            <div style={{
                              fontSize: 10, opacity: mine ? 0.65 : 0.5,
                              marginTop: 4, textAlign: 'right',
                              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3,
                            }}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {mine && (
                                <span style={{ opacity: msg.is_read ? 1 : 0.4 }}>
                                  <Icon path={msg.is_read ? 'M1 12l5 5L18 5M6 12l5 5L23 5' : 'M5 12l5 5L20 7'} size={10} color="currentColor" />
                                </span>
                              )}
                            </div>
                          </div>
                          {mine && <div style={{ width: 26 }} />}
                        </div>
                      </React.Fragment>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--gray-150)',
                background: 'var(--white)',
                display: 'flex', alignItems: 'flex-end', gap: 8,
              }}>
                <textarea
                  ref={inputRef}
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 10,
                    padding: '9px 13px',
                    fontSize: 13,
                    fontFamily: 'var(--font)',
                    color: 'var(--gray-800)',
                    background: 'var(--gray-25)',
                    outline: 'none',
                    lineHeight: 1.5,
                    maxHeight: 120,
                    overflowY: 'auto',
                    transition: 'border-color .15s',
                    letterSpacing: '-0.01em',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary-mid)'}
                  onBlur={e => e.target.style.borderColor = 'var(--gray-200)'}
                  placeholder="Message…"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button
                  onClick={send}
                  disabled={sending || !content.trim()}
                  style={{
                    width: 36, height: 36, borderRadius: 10, border: 'none',
                    background: content.trim() ? '#2563eb' : 'var(--gray-100)',
                    color: content.trim() ? '#fff' : 'var(--gray-300)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: content.trim() ? 'pointer' : 'default',
                    transition: 'background .15s, color .15s',
                    flexShrink: 0,
                  }}
                >
                  <Icon path="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
