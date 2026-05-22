const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://obdcncruzcbibujhvcpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGNuY3J1emNiaWJ1amh2Y3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ2MjMsImV4cCI6MjA5MjAxMDYyM30.ZL_yYa7eDPOCGMLmg-psO-CxynVsU4sZqksR_qTNbbE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createUser() {
  console.log('🚀 Criando usuário: dilamar.hoffmann@redesaoroque.com.br...')
  
  const { data, error } = await supabase.auth.signUp({
    email: 'dilamar.hoffmann@redesaoroque.com.br',
    password: 'Agile@2026',
    options: {
      data: {
        name: 'Dilamar Hoffmann'
      }
    }
  })

  if (error) {
    console.error('❌ Erro ao criar usuário:', error.message)
    process.exit(1)
  }

  console.log('✅ Usuário criado com sucesso!')
  console.log('ID:', data.user.id)
  console.log('Instruções: O usuário agora pode fazer login com a senha "Agile@2026".')
}

createUser()
