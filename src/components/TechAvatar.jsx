// Cartoon avatars for the demo service team, drawn as SVG so they work offline.
const LOOKS = {
  mv: { bg: '#f6ead2', skin: '#f1c7a3', hair: '#7a4b2a', style: 'short', hat: '#e3b23c', beard: true, shirt: '#2c5d73', vest: '#e8892a' },
  ak: { bg: '#dfe9ee', skin: '#f5d3b8', hair: '#c9963f', style: 'long', cap: '#4e7a3a', shirt: '#4e7a3a' },
  jl: { bg: '#e4ecdc', skin: '#e2b08c', hair: '#2f2a26', style: 'short', hat: '#e8892a', glasses: true, shirt: '#2c5d73', vest: '#e3b23c' },
  sp: { bg: '#eceeec', skin: '#c98e68', hair: '#3a2418', style: 'bun', shirt: '#7c8789' },
}

export default function TechAvatar({ id, size = 44, title }) {
  const l = LOOKS[id] ?? LOOKS.sp
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={title ?? 'Technician'} className="tech-svg">
      <circle cx="32" cy="32" r="32" fill={l.bg} />
      <clipPath id={`clip-${id}`}><circle cx="32" cy="32" r="32" /></clipPath>
      <g clipPath={`url(#clip-${id})`}>
        {/* long hair sits behind the head */}
        {l.style === 'long' && <path d="M17 30 Q17 14 32 14 Q47 14 47 30 L48 48 L16 48 Z" fill={l.hair} />}
        {/* body and work clothes */}
        <path d="M10 64 Q10 46 32 46 Q54 46 54 64 Z" fill={l.shirt} />
        {l.vest && <path d="M18 64 L22 49 Q32 52 42 49 L46 64 Z" fill={l.vest} />}
        {l.vest && <rect x="20" y="56" width="24" height="3" fill="#f4f4f0" opacity="0.85" />}
        <rect x="28" y="38" width="8" height="9" rx="3" fill={l.skin} />
        {/* head */}
        <circle cx="32" cy="29" r="12" fill={l.skin} />
        <circle cx="20.5" cy="30" r="2.2" fill={l.skin} />
        <circle cx="43.5" cy="30" r="2.2" fill={l.skin} />
        {/* hair on top */}
        {l.style === 'short' && <path d="M20 27 Q20 16 32 16 Q44 16 44 27 Q40 21 32 21 Q24 21 20 27 Z" fill={l.hair} />}
        {l.style === 'long' && <path d="M20 28 Q21 17 32 17 Q43 17 44 28 Q38 21 30 22 Q24 23 20 28 Z" fill={l.hair} />}
        {l.style === 'bun' && <>
          <circle cx="32" cy="14" r="5" fill={l.hair} />
          <path d="M20 28 Q20 17 32 17 Q44 17 44 28 Q40 21 32 21 Q24 21 20 28 Z" fill={l.hair} />
        </>}
        {/* beard */}
        {l.beard && <path d="M21 31 Q22 43 32 43 Q42 43 43 31 Q40 37 32 37 Q24 37 21 31 Z" fill={l.hair} />}
        {/* face */}
        <circle cx="27.5" cy="29" r="1.4" fill="#1e2a2b" />
        <circle cx="36.5" cy="29" r="1.4" fill="#1e2a2b" />
        <path d="M28.5 34 Q32 36.5 35.5 34" fill="none" stroke="#1e2a2b" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="25" cy="32.5" r="1.6" fill="#e58b7b" opacity="0.45" />
        <circle cx="39" cy="32.5" r="1.6" fill="#e58b7b" opacity="0.45" />
        {l.glasses && <g fill="none" stroke="#1e2a2b" strokeWidth="1.1">
          <circle cx="27.5" cy="29" r="3.3" /><circle cx="36.5" cy="29" r="3.3" /><path d="M30.8 29 H33.2" />
        </g>}
        {/* hard hat or cap */}
        {l.hat && <>
          <path d="M19 24 Q19 11 32 11 Q45 11 45 24 Z" fill={l.hat} />
          <rect x="16" y="22.5" width="32" height="3.5" rx="1.7" fill={l.hat} />
          <rect x="30.5" y="11.5" width="3" height="11" rx="1.5" fill="#ffffff" opacity="0.35" />
        </>}
        {l.cap && <>
          <path d="M20 23 Q20 13 32 13 Q44 13 44 23 Z" fill={l.cap} />
          <path d="M30 22 L48 22 Q49 25 45 25 L30 25 Z" fill={l.cap} />
        </>}
      </g>
    </svg>
  )
}