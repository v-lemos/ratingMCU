import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase dashboard
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://fbiaboxxltmjlddplpxr.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaWFib3h4bHRtamxkZHBscHhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTIzOTIsImV4cCI6MjA3MTM4ODM5Mn0.zUwdK_6E6R7WQZWMYCMIWES4ME_pUAimu4C2n9lbriE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
