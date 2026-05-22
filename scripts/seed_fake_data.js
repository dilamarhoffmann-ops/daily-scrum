import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Carregar Variáveis de Ambiente manualmente para script Node
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Dados de Referência (Profiles existentes no SQL)
const profiles = [
  { id: 'gh_user_SR-JorgeHenrique', name: 'Jorge Henrique' },
  { id: 'gh_user_germano-saoroque', name: 'Germano Freitas' },
  { id: 'gh_user_luisgustavo-saoroque', name: 'Luis Gustavo' },
  { id: 'gh_user_viniciussilva178', name: 'Vinicius Silva' },
  { id: 'gh_user_lucasrdsq', name: 'Lucas Oliveira' },
  { id: 'gh_user_GuilhermeRodrigues5', name: 'Guilherme Rodrigues' },
  { id: 'gh_user_rangel-rs', name: 'Rangel Pereira' },
  { id: 'admin_1', name: 'Administrador' }
];

const getRandomProfile = () => profiles[Math.floor(Math.random() * profiles.length)];

async function seed() {
  console.log('🚀 Iniciando população de dados fakes...');

  // --- PROJETOS ---
  const projects = [
    { id: 'proj-alfa', name: 'Agile Sphere 2.0', methodology: 'Scrum', status: 'active' },
    { id: 'proj-beta', name: 'Internal Tools', methodology: 'Scrum', status: 'active' }
  ];

  console.log('📦 Inserindo Projetos...');
  await supabase.from('projects').upsert(projects);

  // --- ÉPICOS ---
  const epics = [
    { id: 'epic-1', project_id: 'proj-alfa', title: 'Sistema de Autenticação v2', status: 'active', priority_order: 1 },
    { id: 'epic-2', project_id: 'proj-alfa', title: 'Dashboard Executivo', status: 'active', priority_order: 2 },
    { id: 'epic-3', project_id: 'proj-beta', title: 'Automação de Relatórios', status: 'active', priority_order: 1 },
    { id: 'epic-4', project_id: 'proj-beta', title: 'Integração com Slack', status: 'active', priority_order: 2 }
  ];

  console.log('🏔️ Inserindo Épicos...');
  await supabase.from('epics').upsert(epics);

  // --- SPRINTS ---
  const today = new Date();
  const pastDate = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const futureDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const now = today.toISOString().split('T')[0];

  const sprints = [
    { id: 'sp-alfa-1', project_id: 'proj-alfa', goal: 'MVP Autenticação', start_date: pastDate, end_date: now, status: 'completed' },
    { id: 'sp-alfa-2', project_id: 'proj-alfa', goal: 'Core Dashboard', start_date: now, end_date: futureDate, status: 'active' },
    { id: 'sp-beta-1', project_id: 'proj-beta', goal: 'Relatório Base', start_date: now, end_date: futureDate, status: 'active' }
  ];

  console.log('🏃 Inserindo Sprints...');
  await supabase.from('sprints').upsert(sprints);

  // --- USER STORIES ---
  const stories = [
    // Alfa - Sprint 1 (Completed)
    { id: 'us-alfa-1', project_id: 'proj-alfa', epic_id: 'epic-1', sprint_id: 'sp-alfa-1', title: 'Login com OAuth2', status: 'done', story_points: 5, priority_order: 1 },
    { id: 'us-alfa-2', project_id: 'proj-alfa', epic_id: 'epic-1', sprint_id: 'sp-alfa-1', title: 'Recuperação de Senha', status: 'done', story_points: 3, priority_order: 2 },
    
    // Alfa - Sprint 2 (Active)
    { id: 'us-alfa-3', project_id: 'proj-alfa', epic_id: 'epic-2', sprint_id: 'sp-alfa-2', title: 'Gráfico de Burndown', status: 'in_progress', story_points: 8, priority_order: 1 },
    { id: 'us-alfa-4', project_id: 'proj-alfa', epic_id: 'epic-2', sprint_id: 'sp-alfa-2', title: 'Cards de Métricas', status: 'todo', story_points: 5, priority_order: 2 },
    { id: 'us-alfa-5', project_id: 'proj-alfa', epic_id: 'epic-1', sprint_id: 'sp-alfa-2', title: 'Refatoração da API de Auth', status: 'review', story_points: 3, priority_order: 3 },

    // Beta - Sprint 1 (Active)
    { id: 'us-beta-1', project_id: 'proj-beta', epic_id: 'epic-3', sprint_id: 'sp-beta-1', title: 'Exportação em PDF', status: 'in_progress', story_points: 5, priority_order: 1 },
    { id: 'us-beta-2', project_id: 'proj-beta', epic_id: 'epic-4', sprint_id: 'sp-beta-1', title: 'Notificação de Deploy', status: 'todo', story_points: 2, priority_order: 2 }
  ];

  console.log('📖 Inserindo User Stories...');
  await supabase.from('user_stories').upsert(stories);

  // --- TASKS ---
  const tasks = [];
  const taskTitles = [
    'Configurar ambiente', 'Desenvolver backend', 'Criar UI Mockup', 
    'Testes Unitários', 'Documentação', 'Fix bugs', 'Refatoração'
  ];

  stories.forEach(story => {
    const numTasks = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numTasks; i++) {
      const profile = getRandomProfile();
      const statusMap = {
        'done': 'done',
        'in_progress': i === 0 ? 'in_progress' : (Math.random() > 0.5 ? 'todo' : 'done'),
        'todo': 'todo',
        'review': i === 0 ? 'review' : 'done'
      };

      tasks.push({
        id: `t-${story.id}-${i}`,
        project_id: story.project_id,
        story_id: story.id,
        title: `${taskTitles[Math.floor(Math.random() * taskTitles.length)]} - ${i + 1}`,
        status: statusMap[story.status] || 'todo',
        assignee_id: profile.id,
        assigned_to: profile.name,
        estimated_hours: 2 + Math.floor(Math.random() * 6),
        actual_hours: story.status === 'done' ? 2 + Math.floor(Math.random() * 6) : 0,
        is_blocked: Math.random() > 0.8,
        block_reason: Math.random() > 0.8 ? 'Aguardando definição do cliente' : ''
      });
    }
  });

  console.log(`🛠️ Inserindo ${tasks.length} Tarefas...`);
  await supabase.from('tasks').upsert(tasks);

  // --- EVENTOS ---
  console.log('📅 Inserindo Daily, Retro e Reviews...');
  
  await supabase.from('daily_items').upsert([
    { id: 'd-1', project_id: 'proj-alfa', type: 'action', content: 'Finalizado login social e ajustes de CSS no Dashboard', created_at: new Date().toISOString() },
    { id: 'd-2', project_id: 'proj-alfa', type: 'impediment', content: 'Lentidão na API de busca de usuários', created_at: new Date().toISOString() },
    { id: 'd-3', project_id: 'proj-beta', type: 'action', content: 'Configuração do Webhook do Slack', created_at: new Date().toISOString() }
  ]);

  await supabase.from('retro_items').upsert([
    { id: 'r-1', project_id: 'proj-alfa', category: 'start', content: 'Fazer mais testes unitários', votes: 3 },
    { id: 'r-2', project_id: 'proj-alfa', category: 'stop', content: 'Longas reuniões de planning', votes: 5 },
    { id: 'r-3', project_id: 'proj-alfa', category: 'continue', content: 'Code reviews frequentes', votes: 4 }
  ]);

  console.log('✅ Tudo pronto! A base de dados foi populada com sucesso.');
}

seed().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
