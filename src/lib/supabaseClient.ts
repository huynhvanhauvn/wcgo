import { createClient } from '@supabase/supabase-js'

// Use import.meta.env for Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY // Using the key name from your .env

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase keys are missing in env!");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)
