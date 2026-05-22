import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
const GITHUB_TOKEN = envVars.GITHUB_TOKEN;
const GITHUB_ORG = envVars.GITHUB_ORG || 'redesaoroquegroup';
const ORG_ID = 'O_kgDOCmXDNg'; // ID da Organização Redesaoroquegroup no GitHub

async function ghQuery(query, variables = {}) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

async function exportProjects() {
  console.log('🚀 Iniciando exportação de projetos locais para o GitHub...');

  // 1. Pegar projetos locais que não vieram do GitHub
  const { data: projects } = await supabase.from('projects').select('*').neq('status', 'Arquivado');
  const localProjects = (projects || []).filter(p => !p.id.startsWith('proj_github_'));

  if (localProjects.length === 0) {
    console.log('✅ Nenhum projeto local novo para exportar.');
    return;
  }

  // 2. Verificar o que já existe no GitHub para evitar duplicatas pelo nome
  const listQuery = `query($org: String!) { organization(login: $org) { projectsV2(first: 100) { nodes { title } } } }`;
  const listRes = await ghQuery(listQuery, { org: GITHUB_ORG });
  const existingTitles = new Set((listRes.data?.organization?.projectsV2?.nodes || []).map(p => p.title.toLowerCase()));

  for (const p of localProjects) {
    if (existingTitles.has(p.name.toLowerCase())) {
      console.log(`⏭️ Projeto '${p.name}' já parece existir no GitHub. Ignorando.`);
      continue;
    }

    console.log(`📦 Criando projeto no GitHub: ${p.name}`);

    // A. Criar o Projeto
    const createMutation = `
      mutation($ownerId: ID!, $title: String!) {
        createProjectV2(input: { ownerId: $ownerId, title: $title }) {
          projectV2 { id number }
        }
      }
    `;
    const createRes = await ghQuery(createMutation, { ownerId: ORG_ID, title: p.name });
    
    if (createRes.errors) {
      console.error(`❌ Erro ao criar projeto '${p.name}':`, createRes.errors);
      continue;
    }

    const ghProject = createRes.data.createProjectV2.projectV2;
    console.log(`   ✅ Projeto #${ghProject.number} criado.`);

    // B. Atualizar Descrição
    if (p.objective) {
      const updateMutation = `
        mutation($projectId: ID!, $desc: String!) {
          updateProjectV2(input: { projectId: $projectId, shortDescription: $desc }) {
            projectV2 { id }
          }
        }
      `;
      await ghQuery(updateMutation, { projectId: ghProject.id, desc: p.objective.substring(0, 500) });
    }

    // C. Adicionar Tarefas como Draft Issues
    const tasks = p.tasks || [];
    for (const task of tasks) {
      const addTaskMutation = `
        mutation($projectId: ID!, $title: String!) {
          addProjectV2DraftIssue(input: { projectId: $projectId, title: $title }) {
            projectItem { id }
          }
        }
      `;
      const taskRes = await ghQuery(addTaskMutation, { projectId: ghProject.id, title: task.text });
      if (taskRes.errors) {
        console.warn(`      ⚠️ Erro ao adicionar tarefa: ${task.text}`);
      }
    }
    
    console.log(`   📝 ${tasks.length} tarefas sincronizadas.`);
  }

  console.log('\n🏁 Exportação concluída!');
  process.exit(0);
}

exportProjects();
