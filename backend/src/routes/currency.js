// Static indicative exchange rates with INR as base (1 INR = X foreign).
// These are approximate mid-market rates for display-only conversion.
// Future: add live-fetch with TTL + cache.
const BASE_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AED: 0.044,
  CAD: 0.016,
  AUD: 0.018,
  JPY: 1.8,
  CNY: 0.086,
  SGD: 0.016,
  HKD: 0.094,
  NZD: 0.02,
  CHF: 0.011,
  SEK: 0.13,
  NOK: 0.13,
  DKK: 0.082,
  ZAR: 0.22,
  BRL: 0.06,
  MXN: 0.21,
  SAR: 0.045,
  AFN: 0.82,
  THB: 0.41,
  KRW: 16,
  TWD: 0.38,
  PHP: 0.68,
  IDR: 192,
  MYR: 0.056,
  VND: 305,
  PKR: 3.36,
  BDT: 1.44,
  LKR: 3.6,
  NPR: 1.6,
  EGP: 0.58,
  TRY: 0.41,
  RUB: 1.1,
  PLN: 0.048,
  CZK: 0.28,
  HUF: 4.5,
  RON: 0.055,
  ILS: 0.044,
  KWD: 0.0037,
  QAR: 0.044,
  OMR: 0.0046,
  BHD: 0.0045,
  JOD: 0.0085,
  NGN: 18.5,
  GHS: 0.18,
  KES: 1.55,
  ZMW: 0.32,
  UGX: 46,
  TZS: 30,
  XOF: 7.2,
  XAF: 7.2,
  DZD: 1.6,
  MAD: 1.2,
  TND: 0.038,
  CLP: 11.5,
  COP: 48,
  PEN: 0.046,
  ARS: 12.8,
  UYU: 0.49,
  BGN: 0.022,
  RSD: 1.3,
  UAH: 0.49,
  GEL: 0.033,
  AMD: 4.7,
  AZN: 0.02,
  KZT: 5.7,
  UZS: 152,
  MNT: 42,
  MMK: 25,
  LAK: 260,
  KHR: 50,
  BND: 0.016,
  FJD: 0.027,
  PGK: 0.048,
  TOP: 0.028,
  MVR: 0.19,
  SCR: 0.16,
  MUR: 0.55,
  DJF: 2.14,
  ERN: 0.18,
  BIF: 35,
  RWF: 15,
  SDG: 7.2,
  SLL: 240,
  LRD: 2.2,
  CVE: 1.16,
  STN: 0.27,
  GMD: 0.86,
  MZN: 0.76,
  MWK: 20.8,
  ZWL: 3.8,
  SZL: 0.22,
  LSL: 0.22,
  NAD: 0.22,
  BAM: 0.022,
  ISK: 1.65,
  ALL: 1.1,
  MKD: 0.68,
  IRR: 510,
  IQD: 15.6,
  LBP: 10900,
  SYP: 152,
  YER: 3.0,
  KMF: 5.4,
  GNF: 104,
  TJS: 0.13,
  KGS: 1.08,
  HTG: 1.6,
  DOP: 0.72,
  BBD: 0.024,
  XCD: 0.032,
  JMD: 1.9,
  TTD: 0.082,
  BSD: 0.012,
  BZD: 0.024,
  GTQ: 0.096,
  HNL: 0.3,
  NIO: 0.44,
  SVC: 0.1,
  PYG: 92,
  BOB: 0.083,
  VES: 0.45,
  GYD: 2.5,
  SRD: 0.43,
  AWG: 0.022,
  ANG: 0.022,
  BMD: 0.012,
  KYD: 0.01,
  VUV: 1.4,
}

const RATES = { ...BASE_RATES }

const COUNTRY_CURRENCY = {
  IN: 'INR', US: 'USD', GB: 'GBP', JP: 'JPY', CN: 'CNY', KR: 'KRW', TW: 'TWD',
  TH: 'THB', VN: 'VND', MY: 'MYR', SG: 'SGD', ID: 'IDR', PH: 'PHP', BD: 'BDT',
  PK: 'PKR', LK: 'LKR', NP: 'NPR', AF: 'AFN', MM: 'MMK', KH: 'KHR', LA: 'LAK',
  MN: 'MNT', KG: 'KGS', KZ: 'KZT', UZ: 'UZS', TJ: 'TJS', TM: 'TMT',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', JO: 'JOD',
  IL: 'ILS', LB: 'LBP', IQ: 'IQD', IR: 'IRR', YE: 'YER', GE: 'GEL', AM: 'AMD',
  AZ: 'AZN', AU: 'AUD', NZ: 'NZD', FJ: 'FJD', PG: 'PGK',
  CA: 'CAD', MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN',
  VE: 'VES', UY: 'UYU', PY: 'PYG', BO: 'BOB', GY: 'GYD', SR: 'SRD', TT: 'TTD',
  JM: 'JMD', BB: 'BBD', BS: 'BSD', BZ: 'BZD', GT: 'GTQ', HN: 'HNL', NI: 'NIO',
  CR: 'CRC', DO: 'DOP', HT: 'HTG',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR', SK: 'EUR', EE: 'EUR',
  LV: 'EUR', LT: 'EUR', SI: 'EUR', CY: 'EUR', MT: 'EUR', MC: 'EUR', AD: 'EUR',
  ME: 'EUR', SM: 'EUR', VA: 'EUR', GF: 'EUR',
  ZA: 'ZAR', NG: 'NGN', GH: 'GHS', KE: 'KES', TZ: 'TZS', UG: 'UGX', ET: 'ETB',
  RW: 'RWF', CI: 'XOF', SN: 'XOF', BJ: 'XOF', BF: 'XOF', ML: 'XOF', NE: 'XOF',
  TG: 'XOF', GN: 'GNF', SL: 'SLL', LR: 'LRD', MR: 'MRU', GM: 'GMD', CV: 'CVE',
  ST: 'STN', AO: 'AOA', MZ: 'MZN', MW: 'MWK', ZW: 'ZWL', ZM: 'ZMW', BW: 'BWP',
  NA: 'NAD', SZ: 'SZL', LS: 'LSL', MG: 'MGA', MU: 'MUR', SC: 'SCR', DJ: 'DJF',
  ER: 'ERN', SO: 'SOS', SD: 'SDG', SS: 'SSP', CM: 'XAF', TD: 'XAF', CG: 'XAF',
  GA: 'XAF', BI: 'BIF', CF: 'XAF', RU: 'RUB', UA: 'UAH', BY: 'BYN', MD: 'MDL',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', HR: 'HRK', RS: 'RSD',
  BA: 'BAM', MK: 'MKD', AL: 'ALL', IS: 'ISK', NO: 'NOK', SE: 'SEK', DK: 'DKK',
  CH: 'CHF', LI: 'CHF', TR: 'TRY',
}

export function locateRoutes(app) {
  app.get('/api/locate', async (req, res) => {
    try {
      const ip =
        (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() ||
        req.ip ||
        '127.0.0.1'

      if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
        return res.json({ country: 'IN', currency: 'INR', ip: 'loopback' })
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 800)
      try {
        const resp = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (resp.ok) {
          const data = await resp.json()
          const country = (data.country_code || 'IN').toUpperCase()
          const currency = COUNTRY_CURRENCY[country] || 'INR'
          return res.json({ country, currency })
        }
      } catch {
        clearTimeout(timeout)
      }

      return res.json({ country: 'IN', currency: 'INR' })
    } catch {
      return res.json({ country: 'IN', currency: 'INR' })
    }
  })

  app.get('/api/rates', (req, res) => {
    const base = (req.query.base || 'INR').toUpperCase()
    if (base !== 'INR') {
      const factor = RATES[base]
      if (!factor || factor === 0) {
        return res.status(400).json({ error: `Unknown base currency: ${base}` })
      }
      const converted = {}
      for (const [code, rate] of Object.entries(RATES)) {
        converted[code] = rate / factor
      }
      return res.json({ base, rates: converted })
    }
    res.json({ base: 'INR', rates: RATES })
  })
}