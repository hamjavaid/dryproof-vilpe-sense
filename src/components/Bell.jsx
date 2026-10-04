import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWorkflow } from '../workflow.jsx'

// Notification bell: everything the workflow routed to the signed-in role.
export default function Bell({ role }) {
  const { notificationsFor, markSeen } = useWorkflow()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const navigate = useNavigate()
  const items = notificationsFor(role)
  const unread = items.filter(n => n.unread).length

  useEffect(() => {
    if (!open) return
    const outside = e => { if (!box.current?.contains(e.target)) setOpen(false) }
    const esc = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', esc) }
  }, [open])

  const toggle = () => {
    if (!open && unread) markSeen(role)
    setOpen(v => !v)
  }

  return (
    <div className="bell" ref={box}>
      <button className="bell-btn" onClick={toggle} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} new` : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" />
        </svg>
        {unread > 0 && <span className="bell-count num">{unread}</span>}
      </button>
      {open && (
        <div className="bell-panel" role="dialog" aria-label="Notifications">
          <p className="bell-head">Notifications<span className="faint">Routed to you by DryProof</span></p>
          {items.length === 0 ? <p className="bell-empty">Nothing new.</p> : (
            <ul>
              {items.map(n => (
                <li key={n.id}>
                  <button onClick={() => { setOpen(false); navigate(n.to) }} className={n.unread ? 'is-unread' : ''}>
                    <i className={`dot-${n.tone}`} />
                    <span><strong>{n.title}</strong><span>{n.text}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
