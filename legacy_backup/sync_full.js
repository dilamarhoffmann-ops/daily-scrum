import { execSync } from 'child_process';
import fs from 'fs';

console.log(`[${new Date().toISOString()}] 🔄 Iniciando Sincronização Bidirecional Automatizada...`);

try {
  // 1. Exportar Projetos Locais para o GitHub
  console.log('\n--- FASE 1: Exportando locais para o GitHub ---');
  execSync('node exportar_projetos_local_para_github.js', { stdio: 'inherit' });

  // 2. Importar/Atualizar Projetos do GitHub para o Local
  console.log('\n--- FASE 2: Importando do GitHub para o Local ---');
  execSync('node importar_projetos_github.js', { stdio: 'inherit' });

  console.log(`\n[${new Date().toISOString()}] ✅ Sincronização Completa com Sucesso!`);
} catch (error) {
  console.error(`\n[${new Date().toISOString()}] ❌ Erro durante a sincronização:`);
  console.error(error.message);
}
