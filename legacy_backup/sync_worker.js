import { execSync } from 'child_process';

const ONE_HOUR = 60 * 60 * 1000;

async function runSync() {
  const now = new Date().toLocaleString();
  console.log(`\n[${now}] 🔄 Iniciando ciclo de sincronização...`);
  
  try {
    // 1. Exportar 
    console.log('--- FASE 1: App -> GitHub ---');
    execSync('node exportar_projetos_local_para_github.js', { stdio: 'inherit' });

    // 2. Importar
    console.log('--- FASE 2: GitHub -> App ---');
    execSync('node importar_projetos_github.js', { stdio: 'inherit' });

    console.log(`[${new Date().toLocaleString()}] ✅ Ciclo concluído com sucesso.`);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] ❌ Erro no ciclo:`, error.message);
  }

  console.log(`[${new Date().toLocaleString()}] ⏳ Próxima sincronização em 1 hora...`);
}

// Inicia o loop
console.log('🚀 Worker de sincronização iniciado (Modo Contínuo)');
console.log('Este script rodará a cada 1 hora enquanto o processo estiver ativo.');

// Primeira execução imediata
runSync();

// Agendamento interno
setInterval(runSync, ONE_HOUR);
