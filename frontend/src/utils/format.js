let activeCurrency = 'INR'
let rates = { INR: 1 }

export function setCurrency(code, rateMap) {
  activeCurrency = code || 'INR'
  if (rateMap) rates = { ...rates, ...rateMap }
}

export function getCurrency() {
  return activeCurrency
}

function symbolFor(code) {
  const symbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    CAD: 'CA$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    SGD: 'S$',
    HKD: 'HK$',
    NZD: 'NZ$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    ZAR: 'R',
    BRL: 'R$',
    MXN: 'MX$',
    SAR: '﷼',
    AFN: '؋',
  }
  return symbols[code] || code
}

function convert(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  const rate = Number(rates[activeCurrency])
  const converted = rate && rate > 0 ? n / rate : n
  return converted
}

export const fmt = (value) => {
  const n = convert(value)
  if (n === null) return '—'
  const code = activeCurrency
  if (code === 'INR') {
    return Number.isInteger(n)
      ? `₹${n.toLocaleString('en-IN')}`
      : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  const withLang = (lang) =>
    new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: Number.isInteger(n) ? 0 : 2
    }).format(n)

  const regionByCode = {
    USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB', AED: 'en-AE',
    CAD: 'en-CA', AUD: 'en-AU', JPY: 'ja-JP', CNY: 'zh-CN',
    SGD: 'en-SG', HKD: 'zh-HK', NZD: 'en-NZ', CHF: 'de-CH',
    SEK: 'sv-SE', NOK: 'nb-NO', DKK: 'da-DK', ZAR: 'en-ZA',
    BRL: 'pt-BR', MXN: 'es-MX', SAR: 'ar-SA', AFN: 'fa-AF'
  }
  try {
    return withLang(regionByCode[code] || 'en')
  } catch {
    return `${symbolFor(code)}${n.toLocaleString('en-US')}`
  }
}

export const fmtFreeShipLimit = (value) => {
  const n = convert(value)
  if (n === null) return fmt(value)
  if (activeCurrency === 'INR') return `₹${Number(n).toLocaleString('en-IN')}`
  return fmt(value)
}

export const fmtCurrencyCode = () => symbolFor(activeCurrency)