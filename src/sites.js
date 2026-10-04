// Where each building is, for work orders and the fleet map.
// The real building is pinned at city level (Vantaa centre); the exact address is not in the provided data.
export const LIVE_SITE = { customer: 'VILPE Oy', lat: 60.2934, lng: 25.0378 }

// Google Maps link that works without an API key: opens directions on the technician's phone
export const mapsUrl = (name, city) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${city}, Finland`)}`
