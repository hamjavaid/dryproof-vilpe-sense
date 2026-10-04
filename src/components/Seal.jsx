import { useId } from 'react'

// Round stamp printed on the certificate and the passport.
export default function Seal({ size = 116, top = 'VILPE SENSE VERIFIED', bottom = 'DRY STRUCTURE' }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="seal" width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`${top}, ${bottom}`}>
      <defs>
        <path id={`${id}t`} d="M 17 60 A 43 43 0 0 1 103 60" />
        <path id={`${id}b`} d="M 13 60 A 47 47 0 0 0 107 60" />
      </defs>
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="57" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="53" strokeWidth="0.7" />
        <circle cx="60" cy="60" r="31" strokeWidth="0.9" />
        {/* building and water drop */}
        <path d="M45 72 V55 L55 48 L65 55 V72 Z" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M51 72 V64 H59 V72" strokeWidth="1.4" />
        <path d="M73 52 C73 52 79 59 79 63.5 A6 6 0 0 1 67 63.5 C67 59 73 52 73 52 Z" strokeWidth="1.6" strokeLinejoin="round" />
      </g>
      <g fill="currentColor" fontSize="8.2" fontWeight="600" letterSpacing="1.5">
        <text><textPath href={`#${id}t`} startOffset="50%" textAnchor="middle">{top}</textPath></text>
        <text><textPath href={`#${id}b`} startOffset="50%" textAnchor="middle">{bottom}</textPath></text>
      </g>
      <circle cx="16.5" cy="64" r="1.6" fill="currentColor" />
      <circle cx="103.5" cy="64" r="1.6" fill="currentColor" />
    </svg>
  )
}
