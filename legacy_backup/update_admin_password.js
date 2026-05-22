import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    acc[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
  return acc;
}, {});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function updateAdminPassword() {
  const { data, error } = await supabase
    .from('users')
    .update({ password: 'ap0104dm1m', mustChangePassword: false })
    .eq('id', 'admin_1');

  if (error) {
    console.error('Error updating admin password:', error);
    return;
  }
  
  console.log('Successfully updated password for admin users:', data);
}

updateAdminPassword();
