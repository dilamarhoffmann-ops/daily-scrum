const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://obdcncruzcbibujhvcpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGNuY3J1emNiaWJ1amh2Y3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ2MjMsImV4cCI6MjA5MjAxMDYyM30.ZL_yYa7eDPOCGMLmg-psO-CxynVsU4sZqksR_qTNbbE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugData() {
  const { data, error } = await supabase.from('tasks').select('count', { count: 'exact' })
  if (error) {
    console.error('❌ Erro ao acessar tarefas:', error.message)
  } else {
    console.log('📊 Total de Tarefas no Banco:', data[0]?.count || 0)
  }

  const { data: projects } = await supabase.from('projects').select('id, name')
  console.log('📁 Projetos no Banco:', JSON.stringify(projects, null, 2))
}

debugData()
