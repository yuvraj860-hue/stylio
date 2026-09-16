const COLOR_HEX = {
  white: '#ffffff',
  black: '#111111',
  grey: '#8c8c8c',
  gray: '#8c8c8c',
  'heather grey': '#b8b8b8',
  navy: '#22314e',
  blue: '#3f6fae',
  'washed blue': '#7d9bc0',
  'dark indigo': '#2c2f57',
  'light blue': '#a8c4e0',
  green: '#4e7d5a',
  'moss green': '#6b6f3c',
  olive: '#5f6b3c',
  cream: '#efe6d6',
  champagne: '#ead9b4',
  tan: '#c49a6c',
  'floral blue': '#92b4d9',
  'floral pink': '#e7b8c4',
  'gold/green': '#c8a24e',
  'black/green': '#2f3b33',
  brown: '#8b5a2b',
  beige: '#e8e0d2',
  red: '#c0392b',
  maroon: '#7b2d3b',
  pink: '#eba1ae',
  purple: '#6b5b95',
  yellow: '#e6c65b',
  orange: '#d97b3d',
  silver: '#c0c0c0',
  gold: '#d4af37',
  khaki: '#b8a889',
}

export function colorHex(name) {
  const key = String(name || '')
    .trim()
    .toLowerCase()
  return COLOR_HEX[key] || '#d8d3c8'
}