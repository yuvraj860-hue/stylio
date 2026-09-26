import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { apiGet } from '../services/api'
import { setCurrency as applyFormatCurrency, getCurrency } from '../utils/format'

const CurrencyContext = createContext(null)

const LANGUAGE_CURRENCY = {
  'en-IN': 'INR', 'hi-IN': 'INR',
  'en-US': 'USD', 'en-GB': 'GBP', 'en-AU': 'AUD', 'en-CA': 'CAD',
  'en-SG': 'SGD', 'en-NZ': 'NZD', 'en-ZA': 'ZAR', 'en-AE': 'AED',
  'en-KE': 'KES', 'en-NG': 'NGN', 'en-PH': 'PHP', 'en-MY': 'MYR',
  'en-PK': 'PKR', 'en-BD': 'BDT', 'en-LK': 'LKR', 'en-NP': 'NPR',
  'de-DE': 'EUR', 'fr-FR': 'EUR', 'it-IT': 'EUR', 'es-ES': 'EUR',
  'nl-NL': 'EUR', 'pt-PT': 'EUR', 'ja-JP': 'JPY', 'zh-CN': 'CNY',
  'ko-KR': 'KRW', 'th-TH': 'THB', 'vi-VN': 'VND', 'id-ID': 'IDR',
  'de-CH': 'CHF', 'sv-SE': 'SEK', 'nb-NO': 'NOK', 'da-DK': 'DKK',
  'pl-PL': 'PLN', 'cs-CZ': 'CZK', 'hu-HU': 'HUF', 'ro-RO': 'RON',
  'tr-TR': 'TRY', 'ru-RU': 'RUB', 'ar-SA': 'SAR', 'ar-AE': 'AED',
}

function currencyFromLanguage(lang) {
  if (!lang) return null
  const key = lang.replace('_', '-')
  if (LANGUAGE_CURRENCY[key]) return LANGUAGE_CURRENCY[key]
  if (LANGUAGE_CURRENCY[key.split('-')[0]]) return LANGUAGE_CURRENCY[key.split('-')[0]]
  return null
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('INR')
  const [rates, setRates] = useState({ INR: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Strictly INR for Indian market & user requirement
    applyFormatCurrency('INR', { INR: 1 })
    setCurrencyState('INR')
  }, [])

  const setCurrency = useCallback((code) => {
    setCurrencyState('INR')
    applyFormatCurrency('INR', { INR: 1 })
  }, [])

  const value = {
    currency: 'INR',
    rates: { INR: 1 },
    setCurrency,
    loading: false,
    error: null,
    geosLoaded: true,
    fmtNow: () => 'INR',
  }

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider')
  return ctx
}

export default CurrencyContext