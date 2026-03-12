import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co", 
  supabaseKey || "placeholder-key"
)
