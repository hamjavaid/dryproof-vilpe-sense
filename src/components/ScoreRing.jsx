// Ring that fills up to a 0 to 100 score.
export default function ScoreRing({ value, size = 52, stroke = 6, color = 'var(--moss)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const mid = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--line-2)" strokeWidth={stroke} />
      <circle cx={mid} cy={mid} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(value, 100)) / 100)}
              transform={`rotate(-90 ${mid} ${mid})`} style={{ transition: 'stroke-dashoffset 200ms linear' }} />
    </svg>
  )
}
