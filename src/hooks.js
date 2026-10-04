import { useEffect, useState } from 'react'

// True on phone-sized screens. Charts and the roof map use it to stay readable when they shrink.
export function useIsPhone() {
  const query = '(max-width: 600px)'
  const [phone, setPhone] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setPhone(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return phone
}
