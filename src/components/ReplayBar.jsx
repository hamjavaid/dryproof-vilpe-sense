import './replay.css'

// Play button and timeline for the replay. Shows the date being displayed.
export default function ReplayBar({ replay }) {
  const { date, day, last, playing, toggle, setDay, isToday } = replay
  if (!date) return null
  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <div className="replay">
      <button className="replay-play" onClick={toggle} aria-label={playing ? 'Pause replay' : 'Play replay'}>
        <span className="replay-icon">
          {playing
            ? <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" /></svg>
            : <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4.5 2.5 L13.5 8 L4.5 13.5 Z" /></svg>}
        </span>
        <span>{playing ? 'Pause' : isToday ? 'Replay 16 months' : 'Play'}</span>
      </button>
      <input className="replay-range" type="range" min="0" max={last} step="1" value={day}
             style={{ '--fill': `${(day / Math.max(last, 1)) * 100}%` }}
             onChange={e => setDay(Number(e.target.value))} aria-label="Choose a date" />
      <span className="replay-date num">{isToday ? `Today, ${label}` : label}</span>
    </div>
  )
}
