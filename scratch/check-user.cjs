const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://obdcncruzcbibujhvcpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGNuY3J1emNiaWJ1amh2Y3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ2MjMsImV4cCI6MjA5MjAxMDYyM30.ZL_yYa7eDPOCGMLmg-psO-CxynVsU4sZqksR_qTNbbE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkUser() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'dilamar.hoffmann@redesaoroque.com.br')
  
  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (data.length > 0) {
    console.log('🔍 Usuário encontrado no PROFILES:', JSON.stringify(data[0], null, 2))
  } else {
    console.log('❌ Usuário não encontrado no PROFILES.')
  }
}

checkUser()
