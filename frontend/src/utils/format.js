let activeCurrency = 'INR'
let rates = { INR: 1 }

export function setCurrency(code, rateMap) {
  activeCurrency = 'INR'
  rates = { INR: 1 }
}

export function getCurrency() {
  return 'INR'
}

export const fmt = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return Number.isInteger(n)
    ? `₹${n.toLocaleString('en-IN')}`
    : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export const fmtFreeShipLimit = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

export const fmtCurrencyCode = () => '₹'