const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://obdcncruzcbibujhvcpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZGNuY3J1emNiaWJ1amh2Y3BnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzQ2MjMsImV4cCI6MjA5MjAxMDYyM30.ZL_yYa7eDPOCGMLmg-psO-CxynVsU4sZqksR_qTNbbE'

console.log('Testing connection to:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('projects').select('*').limit(1)
    if (error) {
      console.error('❌ Table "projects" check failed:', error.message)
    } else {
      console.log('✅ "projects" table accessible. Found:', data.length)
    }

    const { data: users, error: uError } = await supabase.from('profiles').select('*').limit(1)
    if (uError) {
      console.error('❌ Table "profiles" check failed:', uError.message)
    } else {
      console.log('✅ "profiles" table accessible. Found:', users.length)
    }
  } catch (err) {
    console.error('💥 Execution error:', err.message)
  }
}

testConnection()
