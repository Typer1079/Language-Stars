import { PRIVACY, SUPPORT, TERMS, type LegalDoc } from './legal'

/** Pages anyone can open without signing in, at their own web addresses (App Store listing links). */
export const PUBLIC_PAGES: Record<string, { doc: LegalDoc; label: string }> = {
  '#/privacy': { doc: PRIVACY, label: 'Privacy Policy' },
  '#/terms': { doc: TERMS, label: 'Terms of Use' },
  '#/support': { doc: SUPPORT, label: 'Support' },
}

export const publicPageFor = (hash: string) => PUBLIC_PAGES[hash.toLowerCase().replace(/\/+$/, '')] ?? null
