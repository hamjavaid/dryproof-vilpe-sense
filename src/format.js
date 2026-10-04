// Date helpers shared by every screen. Dates in data.json are 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM'.
const day = iso => new Date(iso.slice(0, 10) + 'T00:00:00')
const fmt = (iso, opts) => day(iso).toLocaleDateString('en-GB', opts)

export const longDate = iso => fmt(iso, { day: 'numeric', month: 'long', year: 'numeric' })
export const shortDate = iso => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' })
export const monthYear = iso => fmt(iso, { month: 'short', year: 'numeric' })

// Local date arithmetic (toISOString would shift the day in Finnish time)
export function addDays(iso, n) {
  const d = day(iso)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// '2025-05-13', '2026-09-11' -> 16
export function monthsBetween(from, to) {
  const [fy, fm] = from.split('-').map(Number)
  const [ty, tm] = to.split('-').map(Number)
  return (ty - fy) * 12 + (tm - fm)
}
