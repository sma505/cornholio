import { en } from './en.js'
import { de } from './de.js'

const translations = { en, de }
const STORAGE_KEY = 'cornholio-lang'

function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && translations[saved]) return saved
  } catch {}
  const browserLang = navigator.language?.slice(0, 2)
  return translations[browserLang] ? browserLang : 'en'
}

let locale = $state(detectLocale())

export function t(key, params) {
  const str = translations[locale]?.[key] ?? translations.en[key] ?? key
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`)
}

export function getLocale() {
  return locale
}

export function setLocale(lang) {
  if (translations[lang]) {
    locale = lang
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
  }
}
