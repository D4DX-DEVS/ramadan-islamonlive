// `||` (not `??`) so an empty value in .env falls back to the default too.
export const WP_URL = process.env.WP_URL || 'https://ramadan.islamonlive.in'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.thafheem.net/'
