import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);
const GITHUB_TOKEN = envVars.GITHUB_TOKEN;
const GITHUB_ORG = envVars.GITHUB_ORG || 'redesaoroquegroup';

async function fetchAllOpenProjects() {
  console.log(`🔍 Buscando todos os projetos abertos em: ${GITHUB_ORG}...`);
  const query = `
    query {
      organization(login: "${GITHUB_ORG}") {
        projectsV2(first: 100, query: "is:open") {
          nodes {
            number
            title
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });
    const json = await response.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data.organization.projectsV2.nodes;
  } catch (e) {
    console.error('❌ Erro ao listar projetos:', e.message);
    return [];
  }
}

async function fetchProjectDetail(projectNumber) {
  console.log(`📦 Extraindo detalhes do Projeto #${projectNumber}...`);
  const query = `
    query {
      organization(login: "${GITHUB_ORG}") {
        projectV2(number: ${projectNumber}) {
          title
          shortDescription
          creator { login }
          items(first: 100) {
            nodes {
              id
              content {
                ... on Issue {
                  title
                  state
                  assignees(first: 10) { nodes { login name } }
                }
                ... on DraftIssue {
                  title
                  assignees(first: 10) { nodes { login name } }
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldDateValue {
                    field { ... on ProjectV2Field { name } }
                    date
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  });
  const json = await response.json();
  if (json.errors) return null;
  
  const projectData = json.data.organization.projectV2;
  const creator = projectData.creator?.login || 'admin';
  
  // Coletar responsáveis e datas
  const usersMap = new Map();
  let minStart = null;
  let maxEnd = null;

  const tasks = projectData.items.nodes.map(node => {
    const content = node.content;
    if (!content) return null;

    (content.assignees?.nodes || []).forEach(u => {
      if (!usersMap.has(u.login)) usersMap.set(u.login, u);
    });

    (node.fieldValues?.nodes || []).forEach(fv => {
      if (fv.field?.name === 'Start date') {
        if (!minStart || fv.date < minStart) minStart = fv.date;
      }
      if (fv.field?.name === 'End date') {
        if (!maxEnd || fv.date > maxEnd) maxEnd = fv.date;
      }
    });

    return {
      id: `gh_task_${node.id}`,
      text: content.title,
      status: content.state === 'OPEN' ? 'Em Andamento' : (content.state === 'CLOSED' ? 'Finalizado' : 'Não Iniciado'),
      assignee: (content.assignees?.nodes || []).map(u => u.login).join(', ')
    };
  }).filter(Boolean);

  return {
    number: projectNumber,
    name: projectData.title,
    objective: `[GH-${projectNumber}] ${projectData.shortDescription || 'Importado do GitHub'}`,
    creator,
    startDate: minStart,
    deadline: maxEnd,
    tasks,
    teamLogins: Array.from(usersMap.keys()),
    teamData: Array.from(usersMap.values())
  };
}

async function syncUsers(users) {
  for (const u of users) {
    const id = `gh_user_${u.login}`;
    const { data: existing } = await supabase.from('users').select('id').eq('id', id).single();
    if (!existing) {
      console.log(`   👤 Criando usuário: ${u.name || u.login}`);
      await supabase.from('users').insert([{
        id,
        name: u.name || u.login,
        email: `${u.login}@github.com`,
        role: 'Colaborador (GitHub)',
        access: 'Colaborador',
        password: '123mudar',
        mustChangePassword: true
      }]);
    }
  }
}

async function runSync() {
  const ghOpenProjects = await fetchAllOpenProjects();
  if (ghOpenProjects.length === 0) return;

  const openProjectNumbers = ghOpenProjects.map(p => p.number);
  console.log(`✅ ${openProjectNumbers.length} projetos abertos encontrados no GitHub.`);

  // 1. Upsert dos projetos abertos
  for (const p of ghOpenProjects) {
    const detail = await fetchProjectDetail(p.number);
    if (!detail) continue;

    await syncUsers(detail.teamData);
    
    // Buscar se já existe por nome ou por ID padrão
    const { data: existing } = await supabase.from('projects').select('id').eq('name', detail.name).limit(1);
    const id = existing?.[0]?.id || `proj_github_${detail.number}`;

    const payload = {
      id,
      name: detail.name,
      objective: detail.objective,
      status: 'Ativo',
      priority: 'Média',
      tasks: detail.tasks,
      team: detail.teamLogins.map(l => `gh_user_${l}`),
      ownerId: `gh_user_${detail.creator}`,
      startDate: detail.startDate,
      deadline: detail.deadline,
    managerId: 'admin_1' // ID do Administrador Principal
    };

    const { error } = await supabase.from('projects').upsert([payload]);
    if (error) console.error(`   ❌ Erro ao salvar ${detail.name}:`, error.message);
    else console.log(`   ✨ Projeto sincronizado: ${detail.name}`);
  }

  // 2. Arquivar projetos que não estão mais na lista de abertos do GitHub
  // Apenas projetos que foram importados do GitHub (prefixo proj_github_ ou nome contendo [GH-])
  const { data: dbProjects } = await supabase.from('projects').select('id, name, objective').neq('status', 'Arquivado');
  
  for (const dbP of (dbProjects || [])) {
    const isGithub = dbP.id.startsWith('proj_github_') || (dbP.objective && dbP.objective.includes('[GH-'));
    if (!isGithub) continue;

    // Extrair número do projeto do objetivo [GH-XX]
    const match = dbP.objective?.match(/\[GH-(\d+)\]/);
    if (match) {
      const ghNum = parseInt(match[1]);
      if (!openProjectNumbers.includes(ghNum)) {
        console.log(`   📦 Arquivando projeto encerrado no GitHub: ${dbP.name}`);
        await supabase.from('projects').update({ status: 'Arquivado' }).eq('id', dbP.id);
      }
    }
  }

  console.log('\n🏁 Sincronização concluída!');
  process.exit(0);
}

runSync();
