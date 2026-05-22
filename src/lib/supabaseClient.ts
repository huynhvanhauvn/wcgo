import { createClient } from '@supabase/supabase-js'

// Vite requires VITE_ prefix for environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// SECURE DEBUG LOGGING (Visible in Browser Console F12)
console.log('--- Supabase Init Debug ---')
console.log('URL defined:', !!supabaseUrl)
console.log('URL value:', supabaseUrl)
console.log('Key defined:', !!supabaseAnonKey)
if (supabaseAnonKey) {
  console.log('Key Length:', supabaseAnonKey.length)
  console.log('Key Starts with:', supabaseAnonKey.substring(0, 5) + '...')
  console.log('Key Ends with:', '...' + supabaseAnonKey.substring(supabaseAnonKey.length - 5))
} else {
  console.error('CRITICAL: VITE_SUPABASE_PUBLISHABLE_KEY is undefined!')
}
console.log('---------------------------')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration is incomplete!', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  })
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)
