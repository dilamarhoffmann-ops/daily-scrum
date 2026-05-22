const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://obdcncruzcbibujhvcpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGNuY3J1emNiaWJ1amh2Y3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ2MjMsImV4cCI6MjA5MjAxMDYyM30.ZL_yYa7eDPOCGMLmg-psO-CxynVsU4sZqksR_qTNbbE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function migrateUser() {
  const email = 'dilamar.hoffmann@redesaoroque.com.br'
  console.log(`🧹 Limpando perfil antigo para: ${email}...`)
  
  // 1. Deletar rastro antigo do profiles
  const { error: dError } = await supabase
    .from('profiles')
    .delete()
    .eq('email', email)
  
  if (dError) {
    console.error('❌ Erro ao limpar perfil:', dError.message)
    return
  }
  console.log('✅ Perfil antigo removido.')

  // 2. Tentar registrar no Auth
  console.log(`🚀 Criando conta oficial para: ${email}...`)
  const { data, error: sError } = await supabase.auth.signUp({
    email: email,
    password: 'Agile@2026',
    options: {
      data: {
        name: 'Dilamar Hoffmann'
      }
    }
  })

  if (sError) {
    console.error('❌ Erro ao criar conta:', sError.message)
    process.exit(1)
  }

  console.log('✅ Usuário registrado no sistema de segurança!')
  console.log('ID Oficial (UUID):', data.user.id)
  console.log('Status: Pronto para login com a senha "Agile@2026".')
}

migrateUser()
