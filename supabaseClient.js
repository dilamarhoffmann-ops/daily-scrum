import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa a conexão
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Expõe globalmente caso arquivos não-módulo (como app.js legado) precisem dele, temporariamente
window.supabaseClient = supabase;

console.log('✅ Supabase Client Initialized!');
