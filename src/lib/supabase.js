import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

// Inicializa a conexão apenas se as credenciais existirem, senão cria um placeholder para evitar crashes
export const supabase = (supabaseUrl && supabaseAnonKey !== 'placeholder') 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase credentials missing. App running in local mode (mock data only).');
} else {
  console.log('✅ Supabase Client Initialized!');
  window.supabaseClient = supabase;
}
