import { useEffect, useRef, useState } from 'react'
import { GLOSSARY } from '../explain.js'

// Small "?" button that explains a term in plain words. The bubble is placed so it never leaves the screen.
export default function InfoTip({ term }) {
  const g = GLOSSARY[term]
  const btn = useRef(null)
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!pos) return
    const close = e => { if (e.type !== 'keydown' || e.key === 'Escape') setPos(null) }
    const outside = e => { if (!btn.current?.contains(e.target)) setPos(null) }
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    window.addEventListener('keydown', close)
    document.addEventListener('pointerdown', outside)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
      window.removeEventListener('keydown', close)
      document.removeEventListener('pointerdown', outside)
    }
  }, [pos])

  if (!g) return null

  const toggle = () => {
    if (pos) { setPos(null); return }
    const r = btn.current.getBoundingClientRect()
    const width = Math.min(290, window.innerWidth - 24)
    const left = Math.min(Math.max(12, r.left + r.width / 2 - width / 2), window.innerWidth - width - 12)
    const below = r.top < 180
    setPos(below ? { left, width, top: r.bottom + 8 } : { left, width, bottom: window.innerHeight - r.top + 8 })
  }

  return (
    <span className="tip">
      <button ref={btn} type="button" className="tip-btn" aria-expanded={!!pos}
              aria-label={`What does ${g.title.toLowerCase()} mean?`} onClick={toggle}>?</button>
      {pos && <span className="tip-bubble" role="tooltip" style={pos}><strong>{g.title}</strong>{g.text}</span>}
    </span>
  )
}
