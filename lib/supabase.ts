import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Creamos una única instancia (Singleton) de nuestra conexión
export const supabase = createClient(supabaseUrl, supabaseAnonKey)