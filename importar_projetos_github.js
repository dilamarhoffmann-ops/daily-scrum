import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) acc[key.trim()] = value.trim();
  return acc;
}, {});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

const GITHUB_TOKEN = envVars.GITHUB_TOKEN; // Lendo com segurança do .env
const GITHUB_ORG = envVars.GITHUB_ORG || 'redesaoroquegroup';

// ==========================================
// ⚠️ REGRAS DE SEPARAÇÃO
// Este script importa APENAS projetos do GitHub.
// Não toca em registros de Daily. Use importar_daily_pdf.js para isso.
// ==========================================
const PROJECTS_TO_IMPORT = [33]; // Monitoramento de Squad

async function fetchGitHubProjectV2Data(projectNumber) {
  console.log(`\n------------------------------------------------------------`);
  console.log(`🚀 Iniciando extração do Projeto V2 #${projectNumber}...`);

  // Query enriquecida: busca tarefas + datas (Start/End date) por item
  const query = `
    query {
      organization(login: "${GITHUB_ORG}") {
        projectV2(number: ${projectNumber}) {
          title
          shortDescription
          creator {
            login
          }
          items(first: 50) {
            nodes {
              content {
                ... on Issue {
                  title
                  state
                  assignees(first: 10) {
                    nodes { login name }
                  }
                }
                ... on DraftIssue {
                  title
                  assignees(first: 10) {
                    nodes { login name }
                  }
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldDateValue {
                    field {
                      ... on ProjectV2Field { name }
                    }
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

  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    const jsonResponse = await response.json();

    if (jsonResponse.errors) {
      console.error(`   ❌ Erro GraphQL #${projectNumber}:`, JSON.stringify(jsonResponse.errors));
      return null;
    }

    const projectData = jsonResponse.data.organization.projectV2;
    if (!projectData) {
      console.warn(`   ⚠️ Projeto #${projectNumber} não encontrado.`);
      return null;
    }

    const creator = projectData.creator ? projectData.creator.login : 'Desconhecido';

    // Coletar responsáveis únicos
    const membrosMap = new Map();
    membrosMap.set(creator, { login: creator, name: creator });

    // Coletar datas de Start/End (mínima e máxima entre todos os itens)
    let minStart = null;
    let maxEnd = null;

    projectData.items.nodes.forEach(node => {
      if (node.content?.assignees?.nodes) {
        node.content.assignees.nodes.forEach(a => {
          if (!membrosMap.has(a.login)) membrosMap.set(a.login, a);
        });
      }

      // Extrair datas dos campos de cada item
      (node.fieldValues?.nodes || []).forEach(fv => {
        if (fv.field?.name === 'Start date') {
          if (!minStart || fv.date < minStart) minStart = fv.date;
        }
        if (fv.field?.name === 'End date') {
          if (!maxEnd || fv.date > maxEnd) maxEnd = fv.date;
        }
      });
    });

    const membrosGithub = Array.from(membrosMap.values()).map(user => ({
      id: `gh_user_${user.login}`,
      name: user.name || user.login,
      email: `${user.login}@github.com`,
      role: user.login === creator ? 'Dono do Projeto (GitHub)' : 'Colaborador',
      access: user.login === creator ? 'Gestor' : 'Colaborador',
      password: '123mudar',
      mustChangePassword: true
    }));

    const tarefas = projectData.items.nodes.map(node => {
      const content = node.content;
      if (!content) return null;

      const assignee = content.assignees?.nodes?.length
        ? content.assignees.nodes.map(a => a.login).join(', ')
        : 'Não atribuído';

      return {
        id: `gh_task_${Math.random().toString(36).substr(2, 9)}`,
        gh_node_id: node.id,
        text: content.title,
        status: content.state === 'OPEN' ? 'Em Andamento' : (content.state === 'CLOSED' ? 'Finalizado' : 'Não Iniciado'),
        assignee
      };
    }).filter(Boolean);

    console.log(`   ✅ Projeto: ${projectData.title}`);
    console.log(`   👤 Owner: ${creator}`);
    console.log(`   📋 Tarefas: ${tarefas.length}`);
    console.log(`   📅 Datas: ${minStart || '—'} a ${maxEnd || '—'}`);
    console.log(`   👥 Equipe: ${membrosGithub.map(u => u.name).join(', ')}`);

    return {
      name: projectData.title,
      objective: `[GH-${projectNumber}] ${projectData.shortDescription || `Projeto importado do GitHub. Criador: ${creator}`}`,
      tasks: tarefas,
      githubCreator: creator,
      users: membrosGithub,
      startDate: minStart,
      deadline: maxEnd
    };

  } catch (error) {
    console.error(`   ❌ Erro fatal #${projectNumber}:`, error.message);
    return null;
  }
}

async function syncUsers(usersToSync) {
  const { data: existingUsers } = await supabase.from('users').select('id');
  const existingIds = new Set((existingUsers || []).map(u => u.id));

  for (const user of usersToSync) {
    if (!existingIds.has(user.id)) {
      console.log(`   ✨ Criando novo usuário: ${user.name}`);
      const { error } = await supabase.from('users').insert([user]);
      if (error) console.error(`   ❌ Erro ao criar ${user.name}:`, error.message);
    } else {
      console.log(`   ⏭️ Usuário preservado: ${user.name}`);
    }
  }
}

async function insertIntoSupabase(projectData) {
  if (!projectData) return;

  await syncUsers(projectData.users);

  const targetOwnerId = `gh_user_${projectData.githubCreator}`;
  const { data: matchedUser } = await supabase.from('users').select('id, name').eq('id', targetOwnerId).limit(1);
  const { data: fallbackUsers } = await supabase.from('users').select('id, name').limit(1);
  const adminUser = fallbackUsers?.[0] ?? null;

  const owner = matchedUser?.[0] ?? adminUser;

  const { data: existingProjects } = await supabase.from('projects').select('id, name');
  const existingProject = existingProjects?.find(p => p.name.toLowerCase().trim() === projectData.name.toLowerCase().trim());

  const projectId = existingProject ? existingProject.id : `proj_github_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const projectPayload = {
    id: projectId,
    name: projectData.name,
    objective: projectData.objective,
    status: 'Ativo',
    priority: 'Alta',
    tasks: projectData.tasks,
    team: projectData.users.map(u => u.id),
    ownerId: owner?.id ?? null,
    managerId: adminUser?.id ?? null,
    startDate: projectData.startDate ?? null,
    deadline: projectData.deadline ?? null
  };

  const { error } = await supabase.from('projects').upsert([projectPayload]);

  if (error) {
    console.error(`   ❌ Erro ao salvar '${projectData.name}':`, error.message);
  } else {
    console.log(`   🎉 Projeto '${projectData.name}' inserido com sucesso!`);
    if (projectData.startDate || projectData.deadline) {
      console.log(`   📅 Cronograma: ${projectData.startDate || '—'} → ${projectData.deadline || '—'}`);
    }
  }
}

async function runBatchImport() {
  console.log('🚀 Iniciando Importação em Lote (com datas)...');

  for (const projectNum of PROJECTS_TO_IMPORT) {
    const data = await fetchGitHubProjectV2Data(projectNum);
    if (data) await insertIntoSupabase(data);
  }

  console.log('\n✅ Importação em lote finalizada!');
  process.exit(0);
}

runBatchImport();
