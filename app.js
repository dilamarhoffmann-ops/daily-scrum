/* ============================================================
   Daily Scrum – Project Management App
   Core Application Logic
   ============================================================ */

// ── Data Layer (LocalStorage Persistence) ─────────────────────
const STORAGE_KEYS = {
  users: 'ds_users',
  projects: 'ds_projects',
  currentUser: 'ds_current_user',
  dailyEntries: 'ds_daily_entries',
  appConfig: 'ds_app_config',
};

const DEFAULT_PASSWORD = '123mudar';

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── State ─────────────────────────────────────────────────────
let users = loadData(STORAGE_KEYS.users);
let projects = loadData(STORAGE_KEYS.projects);
let dailyEntries = loadData(STORAGE_KEYS.dailyEntries);
let appConfig = loadData(STORAGE_KEYS.appConfig) || [{ id: 'global', helpText: '<h4>Bem-vindo à Central de Ajuda</h4><p>Use este espaço para documentar processos da equipe.</p>' }];

// Export to window for debugging
window.users = users;
window.projects = projects;
window.appConfig = appConfig;

// Função para sincronizar dados globais (Help) do Supabase
async function syncGlobalConfig() {
  if (!window.supabaseClient) return;
  try {
    const { data, error } = await window.supabaseClient.from('app_config').select('*').eq('id', 'global').single();
    if (data && data.helpText) {
      appConfig[0].helpText = data.helpText;
      saveData(STORAGE_KEYS.appConfig, appConfig);
      renderHelpContent();
    }
  } catch (err) {
    console.error('Erro ao sincronizar config global:', err);
  }
}
let currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null');
let editingUserId = null;
let editingProjectId = null;
let editingDailyId = null;
let selectedTeamIds = [];
let modalMilestones = [];

// ── Seed default Admin (Apenas no fallback LocalStorage) ─────
if (users.length === 0) {
  users.push({
    id: 'admin_local_fallback',
    name: 'Administrador Local',
    email: 'admin@empresa.com',
    role: 'Gestor de Projetos',
    access: 'Admin',
    password: DEFAULT_PASSWORD,
    mustChangePassword: true,
  });
  saveData(STORAGE_KEYS.users, users);
}

// ── Função de Sincronização Supabase ──────────────────────────
async function syncToSupabase(key, arrayData) {
  if (!window.supabaseClient) return;
  try {
    const table =
      key === STORAGE_KEYS.users ? 'users' :
        key === STORAGE_KEYS.projects ? 'projects' :
        key === STORAGE_KEYS.dailyEntries ? 'daily_entries' :
        key === STORAGE_KEYS.appConfig ? 'app_config' : null;

    if (table) {
      // Para prototipagem: Upserta o array todo no banco assincronamente (Fire-and-forget)
      const { error } = await window.supabaseClient.from(table).upsert(arrayData);
      if (error) {
        console.error(`Supabase upsert error na tabela ${table}:`, error);
        // Exibe um alerta visual pro usuário não perder dados sem saber
        alert(`Aviso: Erro ao sincronizar dados na nuvem (Tabela: ${table}). Verifique o console ou sua conexão.`);
      }
    }
  } catch (e) {
    console.error('Supabase sync exception:', e);
  }
}

// Intercepta o saveData local para paralelamente jogar pra Nuvem
const originalSaveData = saveData;
saveData = function (key, data) {
  originalSaveData(key, data);
  syncToSupabase(key, data); // Dispara pra DB sem travar o UI
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // 1. Tenta carregar dados fresquinhos do Supabase
  if (window.supabaseClient) {
    try {
      const [u, p, d] = await Promise.all([
        window.supabaseClient.from('users').select('*'),
        window.supabaseClient.from('projects').select('*'),
        window.supabaseClient.from('daily_entries').select('*')
      ]);

      console.log(`📊 Supabase data received: ${u.data?.length || 0} users, ${p.data?.length || 0} projects, ${d.data?.length || 0} entries`);

      if (u.data && u.data.length > 0) { 
        users = u.data; 
        window.users = users;
        originalSaveData(STORAGE_KEYS.users, users); 
      }
      if (p.data && p.data.length > 0) { 
        projects = p.data; 
        window.projects = projects;
        originalSaveData(STORAGE_KEYS.projects, projects); 
      }
      if (d.data && d.data.length > 0) { 
        dailyEntries = d.data; 
        originalSaveData(STORAGE_KEYS.dailyEntries, dailyEntries); 
      }
      
      const { data: configData } = await window.supabaseClient.from('app_config').select('*').eq('id', 'global');
      if (configData && configData.length > 0) { 
        appConfig = configData; 
        originalSaveData(STORAGE_KEYS.appConfig, appConfig); 
      }
    } catch (err) {
      console.warn('Usando apenas dados em cache/local. Erro com DB:', err);
    }
  }

  populateLoginSelect();

  // Scan existing projects: auto-complete any already at 100%
  let anyAutoCompleted = false;
  projects.forEach(p => {
    const before = p.status;
    checkAndAutoComplete(p);
    if (p.status !== before) anyAutoCompleted = true;
  });
  if (anyAutoCompleted) saveData(STORAGE_KEYS.projects, projects);

  if (currentUser) {
    // Revalidar info do usuario na base remota, se existir
    const remoteUser = users.find(x => x.id === currentUser.id);
    if (remoteUser) {
      currentUser = remoteUser;
      originalSaveData(STORAGE_KEYS.currentUser, currentUser);
    }
    showApp();
  }
});

// ══════════════════════════════════════════════════════════════
//  LOGIN
// ══════════════════════════════════════════════════════════════
function populateLoginSelect() {
  const select = document.getElementById('loginSelect');
  if (!select) {
    console.error('❌ Element #loginSelect not found!');
    return;
  }
  
  console.log(`🔄 Populating login select with ${users?.length || 0} users...`);
  
  select.innerHTML = '<option value="">Selecione seu usuário...</option>';
  
  if (!users || !Array.isArray(users) || users.length === 0) {
    console.warn('⚠️ No users available to populate login select.');
    return;
  }

  try {
    const validUsers = users.filter(u => u && u.name);
    const sorted = [...validUsers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    sorted.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.name;
      select.appendChild(opt);
    });
    console.log('✅ Login select populated successfully.');
  } catch (err) {
    console.error('❌ Error sorting/populating users:', err);
  }
}

function doLogin() {
  console.log('🚀 doLogin() triggered');
  const idValue = document.getElementById('loginSelect').value;
  const passValue = document.getElementById('loginPassword').value;
  
  console.log('ID selected:', idValue);
  console.log('Password length:', passValue ? passValue.length : 0);

  if (!idValue) { alert('Selecione um usuário.'); return; }
  if (!passValue) { alert('Digite a senha.'); return; }

  const user = users.find(u => u.id === idValue) || null;
  console.log('User found in memory:', user ? user.name : 'NOT FOUND');

  if (!user) {
    alert('Erro: Usuário não encontrado na base de dados local.');
    return;
  }

  // Compat: user without password uses default
  const userPass = user.password || DEFAULT_PASSWORD;

  if (passValue !== userPass) {
    console.warn('❌ Password mismatch!');
    alert('Senha incorreta!');
    return;
  }

  console.log('✅ Password correct. Proceeding to login...');
  currentUser = user;

  // Force password change on first login (no custom password set yet)
  // or if admin explicitly flagged the user
  if (!user.password || user.mustChangePassword === true) {
    console.log('⚠️ Password change required.');
    openChangePasswordModal(user.id);
    return;
  }

  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
  console.log('🏠 Showing app...');
  showApp();
}

function openChangePasswordModal(userId) {
  editingUserId = userId;
  document.getElementById('changePasswordModalOverlay').classList.add('active');
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}

function closeChangePasswordModal() {
  document.getElementById('changePasswordModalOverlay').classList.remove('active');
  editingUserId = null;
}

function saveNewPassword() {
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;

  if (newPass.length < 6) {
    alert('A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  if (newPass !== confirmPass) {
    alert('As senhas não coincidem!');
    return;
  }

  if (newPass === DEFAULT_PASSWORD) {
    alert('Você não pode usar a senha padrão. Escolha uma nova senha.');
    return;
  }

  const idx = users.findIndex(u => u.id === editingUserId);
  if (idx !== -1) {
    users[idx].password = newPass;
    users[idx].mustChangePassword = false;
    saveData(STORAGE_KEYS.users, users);

    // Auto login after password change
    currentUser = users[idx];
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
    closeChangePasswordModal();
    showApp();
  }
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('loginPassword').value = '';
  populateLoginSelect();
}

function toggleLoginPassword(btn) {
  const input = document.getElementById('loginPassword');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function showApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  updateSidebarUser();
  applyAccessRules();
  switchPage('projects');
  syncGlobalConfig(); // Sincroniza o texto de ajuda global
}

function updateSidebarUser() {
  if (!currentUser) return;
  document.getElementById('userAvatar').textContent = getInitials(currentUser.name);
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('sidebarUserRole').textContent = currentUser.role;
}

// ══════════════════════════════════════════════════════════════
//  ACCESS CONTROL
// ══════════════════════════════════════════════════════════════
function applyAccessRules() {
  if (!currentUser) return;

  const configNav = document.querySelector('[data-page="config"]');
  const btnAddUser = document.getElementById('btnAddUser');
  const btnAddProject = document.getElementById('btnAddProject');

  const isAdmin = currentUser.access === 'Admin';
  const isGestor = currentUser.access === 'Gestor';

  // Config menu: Admin and Gestor can access
  if (isAdmin || isGestor) {
    configNav.classList.remove('hidden');
  } else {
    configNav.classList.add('hidden');
  }

  // "Novo Usuário" button: Admin only
  if (isAdmin) {
    if (btnAddUser) btnAddUser.classList.remove('hidden');
  } else {
    if (btnAddUser) btnAddUser.classList.add('hidden');
  }

  // All users can see projects and create
  if (btnAddProject) btnAddProject.classList.remove('hidden');

  // Reports access: Admin and Gestor only
  const btnDailyReport = document.getElementById('btnDailyReport');
  const btnFlowReport = document.getElementById('btnFlowReport');
  const reportsNav = document.querySelector('[data-page="avazaReports"]');

  if (isAdmin || isGestor) {
    if (btnDailyReport) btnDailyReport.classList.remove('hidden');
    if (btnFlowReport) btnFlowReport.classList.remove('hidden');
    if (reportsNav) reportsNav.classList.remove('hidden');
  } else {
    if (btnDailyReport) btnDailyReport.classList.add('hidden');
    if (btnFlowReport) btnFlowReport.classList.add('hidden');
    if (reportsNav) reportsNav.classList.add('hidden');
  }
}

function canEditProject(project) {
  if (!currentUser) return false;
  if (currentUser.access === 'Admin') return true;
  if (currentUser.access === 'Gestor') return true;
  return false;
}

function canEditTask(project) {
  if (!currentUser) return false;
  if (currentUser.access === 'Admin') return true;
  if (currentUser.access === 'Gestor') return true;
  // Colaborador can edit tasks in assigned projects
  if (project.team && project.team.includes(currentUser.id)) return true;
  return false;
}

function getVisibleProjects() {
  const activeProjects = projects.filter(p => p.status !== 'Arquivado');

  // Admins e Gestores veem tudo ativo
  if (currentUser.access === 'Admin' || currentUser.access === 'Gestor') {
    return activeProjects;
  }
  // Colaboradores veem apenas ativos onde participam
  return activeProjects.filter(p =>
    p.ownerId === currentUser.id ||
    p.managerId === currentUser.id ||
    (p.team && p.team.includes(currentUser.id))
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE NAVIGATION
// ══════════════════════════════════════════════════════════════
function switchPage(page) {
  // Access control for reports page
  if (page === 'avazaReports' || page === 'reports') {
    const isAdmin = currentUser && currentUser.access === 'Admin';
    const isGestor = currentUser && currentUser.access === 'Gestor';
    if (!isAdmin && !isGestor) {
      alert('Acesso negado. Apenas Gestores e Administradores podem visualizar relatórios.');
      return;
    }
  }

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page' + capitalize(page));
  const navEl = document.querySelector(`[data-page="${page}"]`);
  if (pageEl) pageEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  // Render page content
  if (page === 'config') renderConfigPage();
  if (page === 'projects') renderProjectsPage();
  if (page === 'daily') renderDailyPage();
  if (page === 'flow') renderFlowPage();

  // Avaza Pages
  if (page === 'avazaProjects') renderAvazaProjectsPage();
  if (page === 'avazaTasks') renderAvazaTasksPage();
  if (page === 'avazaSchedule') renderAvazaSchedulePage();
  if (page === 'avazaAgenda') renderAvazaAgendaPage();
  if (page === 'avazaReports') renderAvazaReportsPage();

  // Highlight active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderActivePage() {
  const activeNav = document.querySelector('.nav-item.active');
  if (activeNav) {
    const page = activeNav.dataset.page;
    if (page === 'config') renderConfigPage();
    else if (page === 'projects') renderProjectsPage();
    else if (page === 'daily') renderDailyPage();
    else if (page === 'flow') renderFlowPage();
    else if (page === 'avazaProjects') renderAvazaProjectsPage();
    else if (page === 'avazaTasks') renderAvazaTasksPage();
    else if (page === 'avazaSchedule') renderAvazaSchedulePage();
    else if (page === 'avazaAgenda') renderAvazaAgendaPage();
    else if (page === 'avazaReports') renderAvazaReportsPage();
  }
}

// ══════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════
function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getUserById(id) {
  return users.find(u => u.id === id);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

// ══════════════════════════════════════════════════════════════
//  CONFIG PAGE (USERS)
// ══════════════════════════════════════════════════════════════
function renderConfigPage() {
  renderConfigStats();
  renderUsersTable();
}

function renderConfigStats() {
  const admins = users.filter(u => u.access === 'Admin').length;
  const gestors = users.filter(u => u.access === 'Gestor').length;
  const colabs = users.filter(u => u.access === 'Colaborador').length;

  document.getElementById('configStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${users.length}</div>
        <div class="stat-label">Total de Usuários</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${admins}</div>
        <div class="stat-label">Administradores</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon teal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${gestors}</div>
        <div class="stat-label">Gestores</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${colabs}</div>
        <div class="stat-label">Colaboradores</div>
      </div>
    </div>
  `;
}

function renderUsersTable() {
  const search = (document.getElementById('searchUsers')?.value || '').toLowerCase();
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search) ||
    u.email.toLowerCase().includes(search) ||
    u.role.toLowerCase().includes(search)
  );

  const tbody = document.getElementById('usersTableBody');
  const emptyEl = document.getElementById('usersEmpty');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  const isAdmin = currentUser && currentUser.access === 'Admin';

  const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));

  tbody.innerHTML = sorted.map(u => {
    const safeName = escapeHTML(u.name);
    const safeEmail = escapeHTML(u.email);
    const safeRole = u.role ? escapeHTML(u.role) : '<span class="text-muted italic">Não informada</span>';
    const safeAccess = escapeHTML(u.access);

    return `
    <tr>
      <td>
        <div class="flex items-center gap-12">
          <div class="sidebar-user-avatar" style="width:32px;height:32px;font-size:0.7rem;">${getInitials(u.name)}</div>
          <span>${safeName}</span>
        </div>
      </td>
      <td style="color:var(--text-secondary)">${safeEmail}</td>
      <td>${safeRole}</td>
      <td><span class="badge badge-${safeAccess.toLowerCase()}">${safeAccess}</span></td>
      <td>
        ${isAdmin ? `
          <div class="flex gap-8">
            <button class="btn btn-secondary btn-sm" onclick="editUser('${u.id}')" title="Editar Usuário">✏️</button>
            <button class="btn btn-warning btn-sm" onclick="adminResetPassword('${u.id}')" title="Resetar Senha">🔑</button>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}')" title="Remover Usuário">🗑️</button>
          </div>
        ` : '—'}
      </td>
    </tr>
  `;
  }).join('');
}

// ── User Modal ────────────────────────────────────────────────
function openUserModal(id) {
  editingUserId = id || null;
  const overlay = document.getElementById('userModalOverlay');
  const title = document.getElementById('userModalTitle');

  if (editingUserId) {
    title.textContent = 'Editar Usuário';
    const u = getUserById(editingUserId);
    if (u) {
      document.getElementById('userFullName').value = u.name;
      document.getElementById('userEmail').value = u.email || '';
      document.getElementById('modalUserRole').value = u.role || '';
      document.getElementById('userAccess').value = u.access || 'Colaborador';
    }
  } else {
    title.textContent = 'Novo Usuário';
    document.getElementById('userFullName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('modalUserRole').value = '';
    document.getElementById('userAccess').value = 'Colaborador';
  }

  overlay.classList.add('active');
}

function closeUserModal() {
  document.getElementById('userModalOverlay').classList.remove('active');
  editingUserId = null;
}

// ── Admin Reset Password ──────────────────────────────────────
function adminResetPassword(id) {
  editingUserId = id;
  const user = getUserById(id);
  if (!user) return;

  document.getElementById('resetUserTarget').textContent = `Usuário: ${user.name}`;
  document.getElementById('adminNewPassword').value = '';
  document.getElementById('adminResetPasswordModalOverlay').classList.add('active');
}

function closeAdminResetModal() {
  document.getElementById('adminResetPasswordModalOverlay').classList.remove('active');
  editingUserId = null;
}

function saveAdminResetPassword() {
  const newPass = document.getElementById('adminNewPassword').value.trim();
  if (!newPass) {
    showFeedbackModal('Atenção', 'Digite a nova senha temporária para o usuário.', 'warning');
    return;
  }

  const idx = users.findIndex(u => u.id === editingUserId);
  if (idx !== -1) {
    users[idx].password = newPass;
    users[idx].mustChangePassword = true;
    saveData(STORAGE_KEYS.users, users);
    showFeedbackModal('Senha Resetada!', 'A senha foi alterada com sucesso. O usuário será forçado a trocá-la no próximo acesso.');
    closeAdminResetModal();
  }
}

// ── Feedback Modal Logic ──────────────────────────────────────
function showFeedbackModal(title, message, type = 'success') {
  const titleEl = document.getElementById('feedbackTitle');
  const messageEl = document.getElementById('feedbackMessage');
  const iconEl = document.querySelector('.feedback-icon');

  titleEl.textContent = title;
  messageEl.textContent = message;

  // Toggle themes
  iconEl.className = `feedback-icon ${type}`;
  iconEl.textContent = type === 'success' ? '✓' : '⚠️';

  document.getElementById('feedbackModalOverlay').classList.add('active');
}

function closeFeedbackModal() {
  document.getElementById('feedbackModalOverlay').classList.remove('active');
}

function editUser(id) {
  openUserModal(id);
}

function saveUser() {
  const name = document.getElementById('userFullName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const role = document.getElementById('modalUserRole').value.trim();
  const access = document.getElementById('userAccess').value;

  if (!name || !email) return;

  if (editingUserId) {
    const idx = users.findIndex(u => u.id === editingUserId);
    if (idx !== -1) {
      users[idx] = { ...users[idx], name, email, role, access };
    }
  } else {
    users.push({
      id: generateId(),
      name,
      email,
      role,
      access,
      password: DEFAULT_PASSWORD,
      mustChangePassword: true,
      created_at: new Date().toISOString()
    });
  }

  saveData(STORAGE_KEYS.users, users);
  closeUserModal();
  renderConfigPage();
  populateLoginSelect();
}

// DATA SAFETY: Double-confirmation modal before any hard delete
function confirmDoubleDelete(message, onConfirmed) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;';
  overlay.innerHTML = `
    <div style="background:var(--bg-card-solid,#1e293b);border:2px solid var(--danger,#ef4444);border-radius:12px;padding:32px;max-width:420px;width:90%;text-align:center;">
      <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
      <div style="font-weight:700;font-size:1.05rem;margin-bottom:8px;color:var(--danger,#ef4444);">Ação Irreversível</div>
      <div style="font-size:0.9rem;margin-bottom:24px;color:var(--text-secondary,#94a3b8);">${message}</div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button id="ddc-cancel" style="padding:8px 24px;border-radius:8px;border:1px solid var(--input-border,#334155);background:transparent;color:var(--text-primary,#f1f5f9);cursor:pointer;font-size:0.9rem;">Cancelar</button>
        <button id="ddc-confirm" style="padding:8px 24px;border-radius:8px;border:none;background:var(--danger,#ef4444);color:#fff;cursor:pointer;font-size:0.9rem;font-weight:600;">Sim, excluir permanentemente</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#ddc-cancel').onclick = () => document.body.removeChild(overlay);
  overlay.querySelector('#ddc-confirm').onclick = () => { document.body.removeChild(overlay); onConfirmed(); };
}

function deleteUser(id) {
  const u = users.find(u => u.id === id);
  const label = u ? u.name : id;
  confirmDoubleDelete(`Deseja excluir permanentemente o usuário "${label}"? Esta ação não pode ser desfeita.`, () => {
    users = users.filter(u => u.id !== id);
    if (window.supabaseClient) { window.supabaseClient.from('users').delete().eq('id', id).then(); }
    saveData(STORAGE_KEYS.users, users);
    renderConfigPage();
    populateLoginSelect();
  });
}

// ══════════════════════════════════════════════════════════════
//  PROJECTS PAGE
// ══════════════════════════════════════════════════════════════
function renderProjectsPage() {
  renderProjectStats();
  renderProjectsKanban();
}

function renderProjectStats() {
  const visible = getVisibleProjects();
  const active = visible.filter(p => p.status === 'Ativo').length;
  const paused = visible.filter(p => p.status === 'Pausado').length;
  const done = visible.filter(p => p.status === 'Concluído').length;
  const impediments = visible.filter(p => p.impediments && p.impediments.trim()).length;

  document.getElementById('projectStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="12" y2="17"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${visible.length}</div>
        <div class="stat-label">Total de Projetos</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${active}</div>
        <div class="stat-label">Ativos</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon teal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${done}</div>
        <div class="stat-label">Finalizados</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <line x1="10" y1="9" x2="10" y2="15"/>
          <line x1="14" y1="9" x2="14" y2="15"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${paused}</div>
        <div class="stat-label">Pausados</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${impediments}</div>
        <div class="stat-label">Com Impedimentos</div>
      </div>
    </div>
  `;
}

function renderProjectsKanban() {
  const search = (document.getElementById('searchProjects')?.value || '').toLowerCase();
  const visible = getVisibleProjects().filter(p =>
    p.name.toLowerCase().includes(search)
  );

  // Statuses baseados na nova identidade visual
  const statuses = ['Pendente', 'Em Andamento', 'Concluído', 'Pausado'];
  const container = document.getElementById('kanbanColumns');

  container.innerHTML = statuses.map(status => {
    // Compatibilidade: se o projeto for "Ativo", tratamos como "Em Andamento" nesta visualização
    const items = visible.filter(p => {
      if (status === 'Em Andamento' && p.status === 'Ativo') return true;
      return p.status === status;
    });

    const statusClass = status.toLowerCase().replace(/\s/g, '-');

    return `
      <div class="kanban-column">
        <div class="kanban-column-header header-${statusClass}">
          <span class="kanban-column-title">${status}</span>
          <div class="kanban-count-wrapper">
            <span class="kanban-count">${items.length}</span>
            <button class="btn-add-inline" onclick="openProjectModalByStatus('${status}')" title="Adicionar projeto em ${status}">＋</button>
          </div>
        </div>
        <div class="kanban-cards">
          ${items.length === 0 ? `
            <div class="empty-state" style="padding:30px 10px;">
              <div class="icon" style="font-size:1.8rem;">📭</div>
              <p class="text-xs text-muted">Nenhum projeto ${status.toLowerCase()}</p>
            </div>
          ` : items.map(p => renderProjectCard(p)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// Helper para abrir modal já com status selecionado
function openProjectModalByStatus(status) {
  openProjectModal();
  const statusSelect = document.getElementById('projectStatus');
  if (statusSelect) statusSelect.value = status;
}

function renderProjectCard(project) {
  const progress = calculateProgress(project);
  const hasImpediment = project.impediments && project.impediments.trim();

  // Pegar responsável (Manager ou Owner)
  const manager = getUserById(project.managerId) || getUserById(project.ownerId);
  const managerName = manager ? manager.name : 'Sem responsável';
  const managerInitials = manager ? getInitials(manager.name) : '??';

  // Status e Cores
  const displayStatus = project.status === 'Ativo' ? 'Em Andamento' : project.status;
  const statusClass = displayStatus.toLowerCase().replace(/\s/g, '-');
  const priorityClass = (project.priority || 'Média').toLowerCase();

  // ID formatado (curto)
  const shortId = (project.id || '0000').substring(0, 4).toUpperCase();

  // Resumo de Atividades (Checklist)
  const tasks = project.tasks || [];
  const validTasks = tasks.filter(t => t.status !== 'Cancelado');
  const doneTasks = validTasks.filter(t => t.done || t.status === 'Finalizado').length;

  let activitiesHtml = '';
  if (validTasks.length > 0) {
    activitiesHtml = `
        <div class="card-activities">
          <div class="activities-header">
            <span>ATIVIDADES</span>
            <span>${doneTasks}/${validTasks.length}</span>
          </div>
          <div class="activities-list">
            ${validTasks.slice(0, 3).map(t => {
      const isDone = t.done || t.status === 'Finalizado';
      return `
                  <div class="activity-item ${isDone ? 'checked' : ''}">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: ${isDone ? 'var(--success)' : '#cbd5e1'}">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>${escapeHTML(t.text)}</span>
                  </div>
                `;
    }).join('')}
            ${validTasks.length > 3 ? `<div class="text-xs text-muted" style="margin-top:2px;">+ ${validTasks.length - 3} mais...</div>` : ''}
          </div>
        </div>
      `;
  }

  return `
    <div class="project-card indicator-${statusClass} ${hasImpediment ? 'has-impediment' : ''}" onclick="openDetailPanel('${project.id}')">
      <div class="card-tags">
        <span class="tag-id">#${shortId}</span>
        <span class="tag-priority priority-${priorityClass}">${project.priority || 'Média'}</span>
      </div>

      <div class="project-card-title">
        ${escapeHTML(project.name)}
      </div>

      ${activitiesHtml}

      ${hasImpediment ? `
        <div class="impediment-alert">
          <span class="alert-icon">🚨</span>
          <span>${escapeHTML(project.impediments)}</span>
        </div>
      ` : ''}

      <div class="project-card-footer">
        <div class="footer-meta">
          <div class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="8" y1="6" x2="4" y2="6"/><line x1="8" y1="10" x2="4" y2="10"/><line x1="8" y1="14" x2="4" y2="14"/><line x1="8" y1="18" x2="4" y2="18"/></svg>
            <span>${escapeHTML(project.tech || 'GERAL')}</span>
          </div>
          <div class="meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>${formatDate(project.deadline)}</span>
          </div>
        </div>

        <div class="meta-avatar-group">
          <div class="avatar-info">
            <span class="avatar-name">${escapeHTML(managerName)}</span>
          </div>
          <div class="team-avatar-premium" title="${escapeHTML(managerName)}">
            ${managerInitials}
          </div>
        </div>
      </div>
    </div>
  `;
}

function calculateProgress(project) {
  const tasks = project.tasks || [];
  const validTasks = tasks.filter(t => t.status !== 'Cancelado'); // Tarefas canceladas não contam no progresso
  if (validTasks.length === 0) return 0;
  const done = validTasks.filter(t => t.done || t.status === 'Finalizado').length;
  return Math.round((done / validTasks.length) * 100);
}

// ── Project Modal ─────────────────────────────────────────────
function buildRoleSelects() {
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  const usersList = ['<option value="">Selecione...</option>']
    .concat(sorted.map(u => `<option value="${u.id}">${u.name} ${u.role ? `(${u.role})` : ''}</option>`))
    .join('');
  document.getElementById('projectOwner').innerHTML = usersList;
  document.getElementById('projectManager').innerHTML = usersList;
}

function openProjectModal(id) {
  editingProjectId = id || null;
  const overlay = document.getElementById('projectModalOverlay');
  const title = document.getElementById('projectModalTitle');

  buildTeamDropdown();
  buildRoleSelects();

  if (editingProjectId) {
    title.textContent = 'Editar Projeto';
    const p = projects.find(pr => pr.id === editingProjectId);
    if (p) {
      document.getElementById('projectName').value = p.name || '';
      document.getElementById('projectStatus').value = p.status || 'Ativo';
      document.getElementById('projectPriority').value = p.priority || 'Média';
      document.getElementById('projectObjective').value = p.objective || '';
      document.getElementById('projectJustification').value = p.justification || '';
      document.getElementById('projectScopeIn').value = p.scopeIn || '';
      document.getElementById('projectScopeOut').value = p.scopeOut || '';
      document.getElementById('projectAcceptance').value = p.acceptance || '';
      document.getElementById('projectStartDate').value = p.startDate || '';
      document.getElementById('projectDeadline').value = p.deadline || '';

      // Load milestones (backward compat)
      modalMilestones = Array.isArray(p.milestones)
        ? p.milestones.map(m => ({ ...m }))
        : (p.milestones ? [{ date: '', text: p.milestones }] : []);

      document.getElementById('projectOwner').value = p.ownerId || '';
      document.getElementById('projectManager').value = p.managerId || '';
      document.getElementById('projectTech').value = p.tech || '';
      document.getElementById('projectBudget').value = p.budget || '';
      document.getElementById('projectRiskKnown').value = p.riskKnown || '';
      document.getElementById('projectRiskMitigation').value = p.riskMitigation || '';
      selectedTeamIds = [...(p.team || [])];
    }
  } else {
    title.textContent = 'Novo Projeto';
    const fields = [
      'projectName', 'projectObjective', 'projectJustification',
      'projectScopeIn', 'projectScopeOut', 'projectAcceptance',
      'projectStartDate', 'projectDeadline',
      'projectTech', 'projectBudget', 'projectRiskKnown', 'projectRiskMitigation'
    ];
    fields.forEach(f => {
      const el = document.getElementById(f);
      if (el) el.value = '';
    });
    document.getElementById('projectStatus').value = 'Ativo';
    document.getElementById('projectPriority').value = 'Média';
    document.getElementById('projectOwner').value = '';
    document.getElementById('projectManager').value = '';
    selectedTeamIds = [];
    modalMilestones = [{ date: '', text: '' }];
  }

  renderModalMilestones();
  updateTeamDisplay();
  overlay.classList.add('active');
}

function closeProjectModal() {
  document.getElementById('projectModalOverlay').classList.remove('active');
  editingProjectId = null;
  selectedTeamIds = [];
  modalMilestones = [];
}

function renderModalMilestones() {
  const container = document.getElementById('milestonesList');
  if (!container) return;

  if (modalMilestones.length === 0) {
    container.innerHTML = '<p class="text-xs text-muted">Nenhum marco adicionado.</p>';
    return;
  }

  container.innerHTML = modalMilestones.map((m, i) => `
    <div class="milestone-row">
      <input type="date" class="form-control milestone-date" value="${m.date || ''}" onchange="updateMilestone(${i}, 'date', this.value)" />
      <input type="text" class="form-control milestone-text" placeholder="Descrição do marco..." value="${(m.text || '').replace(/"/g, '&quot;')}" onchange="updateMilestone(${i}, 'text', this.value)" />
      <button type="button" class="milestone-btn-remove" onclick="removeMilestone(${i})">✕</button>
    </div>
  `).join('');
}

function addMilestone() {
  modalMilestones.push({ date: '', text: '' });
  renderModalMilestones();
}

function updateMilestone(index, field, value) {
  if (modalMilestones[index]) {
    modalMilestones[index][field] = value;
  }
}

function removeMilestone(index) {
  modalMilestones.splice(index, 1);
  renderModalMilestones();
}

function buildTeamDropdown() {
  const dropdown = document.getElementById('teamDropdown');
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  dropdown.innerHTML = sorted.map(u => `
    <div class="multi-select-option" onclick="toggleTeamMember('${u.id}')">
      <span class="check-mark" id="check-${u.id}"></span>
      <span>${u.name} <span class="text-xs text-muted">(${u.role})</span></span>
    </div>
  `).join('');
}

function toggleTeamDropdown() {
  const dd = document.getElementById('teamDropdown');
  dd.classList.toggle('open');
  updateTeamChecks();
}

function toggleTeamMember(uid) {
  const idx = selectedTeamIds.indexOf(uid);
  if (idx === -1) selectedTeamIds.push(uid);
  else selectedTeamIds.splice(idx, 1);
  updateTeamDisplay();
  updateTeamChecks();
}

function updateTeamDisplay() {
  const display = document.querySelector('#teamMultiSelect .multi-select-display');
  const placeholder = document.getElementById('teamPlaceholder');

  if (selectedTeamIds.length === 0) {
    display.innerHTML = '<span class="text-muted text-sm" id="teamPlaceholder">Selecionar membros...</span>';
    return;
  }

  display.innerHTML = selectedTeamIds.map(uid => {
    const u = getUserById(uid);
    if (!u) return '';
    return `<span class="multi-select-chip">${u.name} <span class="remove-chip" onclick="event.stopPropagation();toggleTeamMember('${uid}')">✕</span></span>`;
  }).join('');
}

function updateTeamChecks() {
  users.forEach(u => {
    const el = document.getElementById('check-' + u.id);
    if (el) {
      el.textContent = selectedTeamIds.includes(u.id) ? '✓' : '';
    }
  });
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const container = document.getElementById('teamMultiSelect');
  if (container && !container.contains(e.target)) {
    document.getElementById('teamDropdown')?.classList.remove('open');
  }
});

function saveProject() {
  const name = document.getElementById('projectName').value.trim();
  if (!name) return;

  const status = document.getElementById('projectStatus').value;
  const tempProject = { tasks: editingProjectId ? (projects.find(p => p.id === editingProjectId)?.tasks || []) : [] };
  const progress = calculateProgress(tempProject);

  if (status === 'Concluído' && progress < 100) {
    alert(`Não é possível concluir o projeto. Ainda existem tarefas pendentes (${progress}% concluído).`);
    return;
  }

  const projectData = {
    name,
    status,
    priority: document.getElementById('projectPriority').value,
    objective: document.getElementById('projectObjective').value.trim(),
    justification: document.getElementById('projectJustification').value.trim(),
    scopeIn: document.getElementById('projectScopeIn').value.trim(),
    scopeOut: document.getElementById('projectScopeOut').value.trim(),
    acceptance: document.getElementById('projectAcceptance').value.trim(),
    startDate: document.getElementById('projectStartDate').value,
    deadline: document.getElementById('projectDeadline').value,
    milestones: modalMilestones.filter(m => m.text.trim()),
    ownerId: document.getElementById('projectOwner').value,
    managerId: document.getElementById('projectManager').value,
    tech: document.getElementById('projectTech').value.trim(),
    budget: document.getElementById('projectBudget').value.trim(),
    riskKnown: document.getElementById('projectRiskKnown').value.trim(),
    riskMitigation: document.getElementById('projectRiskMitigation').value.trim(),
    team: [...selectedTeamIds]
  };

  if (editingProjectId) {
    const idx = projects.findIndex(p => p.id === editingProjectId);
    if (idx !== -1) {
      // Preserve internal fields like tasks, impediments, and history
      projects[idx] = {
        ...projects[idx],
        ...projectData,
        // Explicitly ensuring these stay
        tasks: projects[idx].tasks || [],
        impediments: projects[idx].impediments || '',
        resolvedHistory: projects[idx].resolvedHistory || []
      };
    }
  } else {
    projects.push({
      id: generateId(),
      tasks: [],
      impediments: '',
      resolvedHistory: [],
      created_at: new Date().toISOString(),
      ...projectData
    });
  }

  saveData(STORAGE_KEYS.projects, projects);
  closeProjectModal();
  renderActivePage(); // Re-render whichever page is currently open

  // Always keep "PROJETOS POR COLABORADOR" in sync, even when flow page is not active
  if (document.getElementById('flowUserChart')) {
    renderFlowUserChart();
    renderFlowStats();
  }
}

// ── Project Sharing Logic ─────────────────────────────────────
let sharingProjectId = null;
let currentShareTeam = [];

function openShareModal(projectId) {
  sharingProjectId = projectId;
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  currentShareTeam = [...(project.team || [])];

  document.getElementById('shareProjectName').textContent = project.name;
  renderShareUsers();
  document.getElementById('shareModalOverlay').classList.add('active');
}

function renderShareUsers() {
  const container = document.getElementById('shareUsersList');
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));

  container.innerHTML = sorted.map(u => {
    const isSelected = currentShareTeam.includes(u.id);
    return `
      <div class="share-user-item ${isSelected ? 'selected' : ''}" onclick="toggleShareUser('${u.id}')">
        <div class="check-circle"></div>
        <div class="user-info">
          <div class="user-name">${escapeHTML(u.name)}</div>
          <div class="user-role">${escapeHTML(u.role || '')}</div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleShareUser(userId) {
  const idx = currentShareTeam.indexOf(userId);
  if (idx === -1) {
    currentShareTeam.push(userId);
  } else {
    currentShareTeam.splice(idx, 1);
  }
  renderShareUsers();
}

function saveShareChanges() {
  const project = projects.find(p => p.id === sharingProjectId);
  if (project) {
    project.team = [...currentShareTeam];
    saveData(STORAGE_KEYS.projects, projects);
    renderActivePage();
    if (document.getElementById('detailPanel').classList.contains('open') && project.id === sharingProjectId) {
      renderDetailContent(project);
    }
  }
  closeShareModal();
}

function closeShareModal() {
  document.getElementById('shareModalOverlay').classList.remove('active');
  sharingProjectId = null;
  currentShareTeam = [];
}

// DATA SAFETY: Projects are NEVER hard-deleted. They are archived (soft-delete).
function deleteProject(id) {
  const project = projects.find(p => p.id === id);
  const label = project ? project.name : id;
  confirmDoubleDelete(
    `Deseja arquivar o projeto "${label}"?<br><br><small style="color:var(--text-muted,#64748b);">O projeto será marcado como <strong>Arquivado</strong> e ficará oculto da listagem, mas os dados serão preservados no banco de dados.</small>`,
    () => {
      const idx = projects.findIndex(p => p.id === id);
      if (idx !== -1) {
        projects[idx].status = 'Arquivado';
        if (window.supabaseClient) {
          window.supabaseClient.from('projects').update({ status: 'Arquivado' }).eq('id', id).then();
        }
        saveData(STORAGE_KEYS.projects, projects);
      }
      closeDetailPanel();
      renderProjectsPage();

      // Keep "PROJETOS POR COLABORADOR" in sync after archiving
      if (document.getElementById('flowUserChart')) {
        renderFlowUserChart();
        renderFlowStats();
      }
    }
  );
}

// ══════════════════════════════════════════════════════════════
//  PROJECT DETAIL PANEL
// ══════════════════════════════════════════════════════════════
function openDetailPanel(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  document.getElementById('detailTitle').textContent = project.name;
  document.getElementById('detailOverlay').classList.add('active');
  document.getElementById('detailPanel').classList.add('open');

  renderDetailContent(project);
}

function closeDetailPanel() {
  document.getElementById('detailOverlay').classList.remove('active');
  document.getElementById('detailPanel').classList.remove('open');
}

function renderDetailContent(project) {
  const progress = calculateProgress(project);
  const canEdit = canEditProject(project);
  const canTask = canEditTask(project);
  const isShared = Array.isArray(project.team) && project.team.some(uid => uid !== project.ownerId && uid !== project.managerId);

  const po = getUserById(project.ownerId);
  const manager = getUserById(project.managerId);

  const teamList = (project.team || []).map(uid => {
    const u = getUserById(uid);
    return u ? `
      <div class="flex items-center gap-8" style="padding:6px 0;">
        <div class="team-avatar" style="margin:0;">${getInitials(u.name)}</div>
        <div>
          <div class="text-sm">${escapeHTML(u.name)}</div>
          <div class="text-xs text-muted">${escapeHTML(u.role || '')}</div>
        </div>
      </div>
    ` : '';
  }).join('');

  // Build grouped task HTML
  // Normalizes any unknown/legacy status to a known group key
  const KNOWN_TASK_STATUSES = ['Não Iniciado', 'Em Andamento', 'Finalizado', 'Cancelado'];
  const STATUS_ALIASES = {
    // English mappings (GitHub import)
    'todo': 'Não Iniciado', 'open': 'Não Iniciado', 'not started': 'Não Iniciado',
    'in progress': 'Em Andamento', 'in_progress': 'Em Andamento', 'doing': 'Em Andamento',
    'done': 'Finalizado', 'closed': 'Finalizado', 'complete': 'Finalizado', 'completed': 'Finalizado',
    'resolved': 'Finalizado', 'merged': 'Finalizado',
    'cancelled': 'Cancelado', 'canceled': 'Cancelado', 'wontfix': 'Cancelado',
    // Portuguese aliases
    'não iniciado': 'Não Iniciado', 'em andamento': 'Em Andamento',
    'finalizado': 'Finalizado', 'cancelado': 'Cancelado', 'concluído': 'Finalizado',
  };

  const normalizeTaskStatus = (t) => {
    // 1. If task has no status, use done flag
    if (!t.status) return t.done ? 'Finalizado' : 'Não Iniciado';
    // 2. If status is already a known value, use it directly
    if (KNOWN_TASK_STATUSES.includes(t.status)) return t.status;
    // 3. Try alias map (case-insensitive)
    const alias = STATUS_ALIASES[t.status.toLowerCase().trim()];
    if (alias) return alias;
    // 4. Fallback: any unknown status → A fazer (never hide a task)
    return 'Não Iniciado';
  };

  const taskGroups = [
    { key: 'Não Iniciado', label: 'A fazer' },
    { key: 'Em Andamento', label: 'Em execução' },
    { key: 'Finalizado', label: 'Finalizado' },
    { key: 'Cancelado', label: 'Cancelado' },
  ];

  const groupedTasksHtml = taskGroups.map(group => {
    const indexedTasks = (project.tasks || []).reduce((acc, t, i) => {
      if (normalizeTaskStatus(t) === group.key) acc.push({ t, i });
      return acc;
    }, []);
    if (indexedTasks.length === 0) return '';

    const isDone = group.key === 'Finalizado';
    const isCancelled = group.key === 'Cancelado';

    const rows = indexedTasks.map(({ t, i }) => {
      const commentsHtml = (t.comments || []).map((c, ci) => {
        const isAuthor = currentUser && currentUser.name === c.author;
        const isAdmin = currentUser && (currentUser.access === 'Admin' || currentUser.access === 'Gestor');
        const canEdit = isAuthor || isAdmin;

        return `
        <div class="tl-comment" id="comment-${project.id}-${i}-${ci}">
          <div class="tl-comment-content" id="comment-view-${project.id}-${i}-${ci}">
            <span class="tl-comment-author">${escapeHTML(c.author)}:</span>
            <span class="tl-comment-text">${escapeHTML(c.text)}</span>
          </div>
          ${canEdit ? `
          <div class="comment-edit-actions" id="comment-btns-${project.id}-${i}-${ci}">
            <button class="comment-edit-btn" onclick="editTaskComment('${project.id}', ${i}, ${ci})" title="Editar">✏️</button>
            <button class="comment-edit-btn" onclick="removeTaskComment('${project.id}', ${i}, ${ci})" title="Remover">🗑️</button>
          </div>
          ` : ''}
        </div>
      `;
      }).join('');

      const checkIcon = isDone
        ? `<svg class="tl-check-icon done" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`
        : isCancelled
          ? `<svg class="tl-check-icon cancelled" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
          : `<svg class="tl-check-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;

      return `
        <div class="tl-row">
          <div class="tl-row-main">
            <span class="tl-check-wrap" ${canTask ? `onclick="toggleTask('${project.id}', ${i})"` : ''}>
              ${checkIcon}
            </span>
            <span class="tl-text ${isDone ? 'tl-done' : ''} ${isCancelled ? 'tl-cancelled' : ''}">
              ${escapeHTML(t.text)}
              ${(t.startDate || t.deadline) ? `
                <div class="text-xs text-muted" style="margin-top:2px; font-weight:normal;">
                  📅 ${t.startDate ? formatDate(t.startDate) : ''} ${t.startDate && t.deadline ? 'até' : ''} ${t.deadline ? formatDate(t.deadline) : ''}
                </div>` : ''}
            </span>
            <div class="tl-actions">
              <button class="tl-btn" title="Comentários" onclick="toggleComments('${project.id}', ${i})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </button>
              ${canTask ? `
              <select class="tl-status-select" title="Mudar status" onchange="updateTaskStatus('${project.id}', ${i}, this.value)">
                <option value="Não Iniciado" ${group.key === 'Não Iniciado' ? 'selected' : ''}>A fazer</option>
                <option value="Em Andamento" ${group.key === 'Em Andamento' ? 'selected' : ''}>Em execução</option>
                <option value="Finalizado" ${group.key === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                <option value="Cancelado" ${group.key === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
              </select>
              <button class="tl-btn tl-btn-danger" onclick="removeTask('${project.id}', ${i})" title="Remover">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>` : ''}
            </div>
          </div>
          <div id="comments-container-${project.id}-${i}" class="task-comments-area">
            <div class="comments-list">${commentsHtml}</div>
            <div id="add-comment-row-${project.id}-${i}" class="add-comment-row hidden">
              <input type="text" class="form-control text-xs" id="comment-input-${project.id}-${i}" placeholder="Escreva um comentário..." onkeydown="if(event.key==='Enter')addTaskComment('${project.id}', ${i})" />
              <button class="btn btn-primary btn-sm" style="padding:2px 8px; font-size:0.65rem;" onclick="addTaskComment('${project.id}', ${i})">Enviar</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const groupId = `tl-group-${project.id}-${group.key.replace(/\s/g, '-')}`;
    return `
      <div class="tl-group">
        <div class="tl-group-header" onclick="toggleTaskGroup('${groupId}')">
          <svg class="tl-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          <span class="tl-group-label">${group.label}</span>
          <span class="tl-group-count">${indexedTasks.length}</span>
        </div>
        <div id="${groupId}" class="tl-group-body">${rows}</div>
      </div>
    `;
  }).join('');


  document.getElementById('detailContent').innerHTML = `
    <div class="detail-scroll" style="max-height: calc(100vh - 120px); overflow-y: auto; padding-right: 12px;">
      
      <!-- Status & Progress -->
      <div class="flex items-center gap-12 mb-16">
        <span class="badge badge-${project.status.toLowerCase()}">${project.status}</span>
        <span class="text-sm" style="color:var(--text-secondary)">📅 Previsão: ${formatDate(project.deadline)}</span>
      </div>

      <div class="mb-16">
        <div class="flex items-center gap-8 mb-8">
          <span class="text-sm font-bold">Progresso Geral</span>
          <span class="text-sm" style="color:var(--primary);margin-left:auto;">${progress}%</span>
        </div>
        <div class="progress-bar" style="height:10px;">
          <div class="progress-fill ${progress === 100 ? 'complete' : ''}" style="width:${progress}%"></div>
        </div>
      </div>

      <!-- 1. Identificação -->
      <div class="section-title">Identificação e Propósito</div>
      <div class="glass-card mb-16" style="padding:16px; font-size: 0.85rem;">
        <p class="mb-8"><strong>Objetivo:</strong> ${escapeHTML(project.objective) || '—'}</p>
        <p><strong>Justificativa:</strong> ${escapeHTML(project.justification) || '—'}</p>
      </div>

      <!-- 2. Escopo -->
      <div class="section-title">Escopo e Entregáveis</div>
      <div class="glass-card mb-16" style="padding:16px; font-size: 0.85rem;">
        <p class="mb-8"><strong>O que será feito:</strong><br>${project.scopeIn ? escapeHTML(project.scopeIn).replace(/\n/g, '<br>') : '—'}</p>
        <p class="mb-8"><strong>O que NÃO será feito:</strong><br>${escapeHTML(project.scopeOut) || '—'}</p>
        <p><strong>Critérios de Aceite:</strong><br>${escapeHTML(project.acceptance) || '—'}</p>
      </div>

      <!-- 3. Cronograma e Tarefas -->
      <div class="section-title">Cronograma e Marcos</div>
      <div class="glass-card mb-16" style="padding:16px; font-size: 0.85rem;">
        <p class="mb-8"><strong>Início:</strong> ${formatDate(project.startDate)} | <strong>Fim:</strong> ${formatDate(project.deadline)}</p>
        
        <div class="milestones-view mb-16">
          <strong>Marcos:</strong><br>
          ${Array.isArray(project.milestones) && project.milestones.length > 0
      ? project.milestones.map(m => `<div style="padding:4px 0;">• <span class="font-bold">${formatDate(m.date)}</span>: ${escapeHTML(m.text)}</div>`).join('')
      : (typeof project.milestones === 'string' && project.milestones ? escapeHTML(project.milestones).replace(/\n/g, '<br>') : '—')}
        </div>

        <!-- LISTA DE TAREFAS INTEGRADA AO CARD -->
        <div class="tl-container" style="box-shadow:none; background:transparent; border:none; padding:0; margin-top:20px; border-top: 1px solid rgba(0,0,0,0.05); padding-top:16px;">
          <div class="tl-header" style="padding:0 0 12px 0;">
            <div class="tl-header-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
            <span class="tl-header-title">TAREFAS DO CRONOGRAMA</span>
            <span class="tl-header-count">${(project.tasks || []).length}</span>
          </div>

          ${canTask ? `
          <div class="tl-add-row" style="flex-wrap:wrap; gap:8px; margin-bottom:16px;">
            <input type="text" class="tl-add-input" id="newTaskInput" placeholder="Adicionar tarefa..." onkeydown="if(event.key==='Enter')addTask('${project.id}')" style="flex:1; min-width:200px;" />
            <div class="flex items-center gap-4">
              <input type="date" class="tl-add-date" id="newTaskStart" title="Data de Início" />
              <span class="text-xs text-muted">até</span>
              <input type="date" class="tl-add-date" id="newTaskEnd" title="Prazo Final" />
            </div>
            <select class="tl-add-select" id="newTaskStatus">
              <option value="Não Iniciado">A fazer</option>
              <option value="Em Andamento" selected>Em execução</option>
              <option value="Finalizado">Finalizado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
            <button class="tl-add-btn" onclick="addTask('${project.id}')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          ` : ''}

          <div class="tl-groups">
            ${groupedTasksHtml || '<div class="tl-empty">Nenhuma tarefa cadastrada ainda.</div>'}
          </div>
        </div>
      </div>

      <!-- 4. Equipe -->
      <div class="section-title">Equipe e Responsabilidades</div>
      <div class="glass-card mb-16" style="padding:16px;">
        <div class="grid grid-2 gap-12 mb-12">
          <div>
            <div class="text-xs text-muted mb-4">Dono do Produto (PO)</div>
            <div class="text-sm font-bold">${po ? escapeHTML(po.name) : '—'}</div>
          </div>
          <div>
            <div class="text-xs text-muted mb-4">Gestor Técnico</div>
            <div class="text-sm font-bold">${manager ? escapeHTML(manager.name) : '—'}</div>
          </div>
        </div>
        <div class="flex items-center justify-between mb-8">
          <div class="text-xs text-muted">Equipe Alocada</div>
          <button class="btn btn-secondary btn-sm ${isShared ? 'is-shared' : ''}" style="padding:4px 10px;font-size:0.7rem; gap:6px; display:flex; align-items:center;" onclick="openShareModal('${project.id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
            Compartilhar
          </button>
        </div>
        <div class="team-list-compact">
          ${teamList || '<div class="text-sm text-muted">Nenhum membro alocado</div>'}
        </div>
      </div>

      <!-- 5. Recursos & 6. Riscos -->
      <div class="grid grid-2 gap-16 mb-16" style="align-items: start;">
        <div>
          <div class="section-title">Recursos</div>
          <div class="glass-card" style="padding:16px;">
            <p class="text-xs text-muted mb-4">Tecnologias</p>
            <p class="text-sm mb-8">${escapeHTML(project.tech) || '—'}</p>
            <p class="text-xs text-muted mb-4">Orçamento</p>
            <p class="text-sm">${escapeHTML(project.budget) || '—'}</p>
          </div>
        </div>
        <div>
          <div class="section-title">Riscos</div>
          <div class="glass-card" style="padding:16px;">
            <p class="text-xs text-muted mb-4">Principais Riscos</p>
            <p class="text-sm mb-8">${escapeHTML(project.riskKnown) || '—'}</p>
            <p class="text-xs text-muted mb-4">Mitigação</p>
            <p class="text-sm">${escapeHTML(project.riskMitigation) || '—'}</p>
          </div>
        </div>
      </div>


      <!-- Impedimentos do Projetos -->
      <div class="section-title">Impedimentos Atuais</div>
      <div class="glass-card" style="padding:16px;">
        ${canEdit ? `
          <div class="flex flex-column gap-8">
            <textarea class="form-control" id="impedimentInput" placeholder="Descreva impedimentos..." onchange="saveImpediment('${project.id}')">${project.impediments || ''}</textarea>
            
            ${project.impediments ? `
              <div id="resolvePanel" style="background:var(--light-blue); padding:12px; border-radius:var(--radius-sm); margin-top:8px;">
                <label class="text-xs font-bold mb-4" style="display:block;">Como foi resolvido?</label>
                <textarea class="form-control mb-8" id="resolutionInput" rows="2" placeholder="Descreva o que foi feito para resolver..."></textarea>
                <button class="btn btn-primary btn-sm" onclick="resolveImpediment('${project.id}')">Marcar como Resolvido ✅</button>
              </div>
            ` : ''}
          </div>
        ` : `
          ${project.impediments ? `
            <div class="impediment-alert" style="margin:0;">
              <span class="alert-icon">🚨</span>
              <span>${project.impediments}</span>
            </div>
          ` : '<div class="text-sm text-muted">Nenhum impedimento registrado</div>'}
        `}
      </div>

      <!-- Histórico de Impedimentos -->
      ${project.resolvedHistory && project.resolvedHistory.length > 0 ? `
        <div class="section-title">Impedimentos Resolvidos (Histórico)</div>
        <div class="glass-card" style="padding:16px;">
          ${project.resolvedHistory.map(h => `
            <div style="border-bottom:1px solid var(--input-border); padding-bottom:12px; margin-bottom:12px;">
              <div class="flex items-center gap-8 mb-4">
                <span class="text-xs font-bold text-success">✓ RESOLVIDO</span>
                <span class="text-xs text-muted">${formatDate(h.resolvedAt)}</span>
              </div>
              <div class="text-sm"><strong>O Problema:</strong> ${h.original}</div>
              <div class="text-sm text-muted"><strong>Solução:</strong> ${h.solution}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Actions -->
      ${canEdit ? `
        <div class="flex gap-12 mt-24 mb-24">
          <button class="btn btn-secondary" onclick="openProjectModal('${project.id}');closeDetailPanel();">✏️ Editar Projeto</button>
          <button class="btn btn-danger" onclick="deleteProject('${project.id}')">🗑️ Excluir</button>
        </div>
      ` : ''}
    </div>
  `;
}

// ── Task Group Toggle ─────────────────────────────────────────
function toggleTaskGroup(groupId) {
  const body = document.getElementById(groupId);
  if (!body) return;
  const header = body.previousElementSibling;
  const isOpen = !body.classList.contains('collapsed');
  body.classList.toggle('collapsed', isOpen);
  if (header) header.classList.toggle('collapsed', isOpen);
}

// ── Task Operations ───────────────────────────────────────────
function addTask(projectId) {
  const input = document.getElementById('newTaskInput');
  const startInput = document.getElementById('newTaskStart');
  const endInput = document.getElementById('newTaskEnd');
  const statusInput = document.getElementById('newTaskStatus');
  
  const text = input.value.trim();
  if (!text) return;

  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  const status = statusInput ? statusInput.value : 'Não Iniciado';

  if (!project.tasks) project.tasks = [];
  project.tasks.unshift({
    text,
    done: status === 'Finalizado',
    status: status,
    startDate: startInput ? startInput.value : '',
    deadline: endInput ? endInput.value : ''
  });

  checkAndAutoComplete(project);
  saveData(STORAGE_KEYS.projects, projects);
  
  input.value = '';
  if (startInput) startInput.value = '';
  if (endInput) endInput.value = '';
  
  renderDetailContent(project);
  renderActivePage();
}

// Função que gerencia o status baseado no progresso das tarefas
function checkAndAutoComplete(project) {
  const progress = calculateProgress(project);
  const tasks = project.tasks || [];

  if (progress === 100 && tasks.length > 0) {
    if (project.status !== 'Concluído') {
      project.status = 'Concluído';
    }
  } else if (project.status === 'Concluído' && progress < 100) {
    // Se o projeto estava concluído mas o progresso caiu (ex: nova tarefa), volta para Em Andamento
    project.status = 'Em Andamento';
  }
}

function updateTaskStatus(projectId, taskIndex, newStatus) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks[taskIndex]) return;

  project.tasks[taskIndex].status = newStatus;
  project.tasks[taskIndex].done = (newStatus === 'Finalizado');

  checkAndAutoComplete(project);
  saveData(STORAGE_KEYS.projects, projects);
  renderDetailContent(project);
  renderActivePage();
}

function toggleTask(projectId, taskIndex) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks[taskIndex]) return;

  project.tasks[taskIndex].done = !project.tasks[taskIndex].done;
  // Sync status field with checkbox state
  project.tasks[taskIndex].status = project.tasks[taskIndex].done ? 'Finalizado' : 'Em Andamento';

  checkAndAutoComplete(project);
  saveData(STORAGE_KEYS.projects, projects);
  renderDetailContent(project);
  renderActivePage();
}

function removeTask(projectId, taskIndex) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  project.tasks.splice(taskIndex, 1);
  checkAndAutoComplete(project);
  saveData(STORAGE_KEYS.projects, projects);
  renderDetailContent(project);
  renderActivePage();
}

function toggleComments(projectId, taskIndex) {
  const row = document.getElementById(`add-comment-row-${projectId}-${taskIndex}`);
  if (row) {
    row.classList.toggle('hidden');
    if (!row.classList.contains('hidden')) {
      document.getElementById(`comment-input-${projectId}-${taskIndex}`).focus();
    }
  }
}

function addTaskComment(projectId, taskIndex) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks[taskIndex]) return;

  const input = document.getElementById(`comment-input-${projectId}-${taskIndex}`);
  const text = input.value.trim();
  if (!text) return;

  if (!project.tasks[taskIndex].comments) project.tasks[taskIndex].comments = [];

  project.tasks[taskIndex].comments.push({
    author: currentUser ? currentUser.name : 'Alguém',
    text: text,
    timestamp: new Date().toISOString()
  });

  saveData(STORAGE_KEYS.projects, projects);
  renderDetailContentById(project.id, taskIndex);
}

function editTaskComment(projectId, taskIndex, commentIndex) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks[taskIndex] || !project.tasks[taskIndex].comments[commentIndex]) return;

  const comment = project.tasks[taskIndex].comments[commentIndex];
  const viewEl = document.getElementById(`comment-view-${projectId}-${taskIndex}-${commentIndex}`);
  const btnEl = document.getElementById(`comment-btns-${projectId}-${taskIndex}-${commentIndex}`);

  if (!viewEl) return;

  const currentText = comment.text;
  viewEl.innerHTML = `
    <div class="flex flex-col gap-4 w-full">
      <textarea class="form-control text-xs" id="edit-input-${projectId}-${taskIndex}-${commentIndex}" style="min-height:60px;">${escapeHTML(currentText)}</textarea>
      <div class="flex gap-4">
        <button class="btn btn-primary btn-sm" style="padding:2px 8px; font-size:0.6rem;" onclick="updateTaskComment('${projectId}', ${taskIndex}, ${commentIndex})">Salvar</button>
        <button class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:0.6rem;" onclick="renderDetailContentById('${projectId}', ${taskIndex})">Cancelar</button>
      </div>
    </div>
  `;
  if (btnEl) btnEl.style.display = 'none';
}

function updateTaskComment(projectId, taskIndex, commentIndex) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks[taskIndex] || !project.tasks[taskIndex].comments[commentIndex]) return;

  const input = document.getElementById(`edit-input-${projectId}-${taskIndex}-${commentIndex}`);
  const newText = input.value.trim();

  if (newText) {
    project.tasks[taskIndex].comments[commentIndex].text = newText;
    project.tasks[taskIndex].comments[commentIndex].updated_at = new Date().toISOString();
    saveData(STORAGE_KEYS.projects, projects);
  }

  renderDetailContentById(projectId, taskIndex);
}

function removeTaskComment(projectId, taskIndex, commentIndex) {
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks[taskIndex] || !project.tasks[taskIndex].comments[commentIndex]) return;

  if (confirm('Deseja excluir este comentário?')) {
    project.tasks[taskIndex].comments.splice(commentIndex, 1);
    saveData(STORAGE_KEYS.projects, projects);
    renderDetailContentById(projectId, taskIndex);
  }
}

// Helper to keep task comment area open after refresh
function renderDetailContentById(projectId, taskIndexToOpen) {
  const project = projects.find(p => p.id === projectId);
  if (project) {
    renderDetailContent(project);
    if (taskIndexToOpen !== undefined) {
      setTimeout(() => {
        const row = document.getElementById(`add-comment-row-${projectId}-${taskIndexToOpen}`);
        if (row) row.classList.remove('hidden');
      }, 0);
    }
  }
}

function saveImpediment(projectId) {
  const project = projects.find(p => p.id === projectId);
  if (!project) return;

  const newVal = document.getElementById('impedimentInput').value.trim();
  const changed = project.impediments !== newVal;

  project.impediments = newVal;
  saveData(STORAGE_KEYS.projects, projects);

  if (changed) renderDetailContent(project); // Refresh to show/hide Resolve panel
  renderActivePage();
}

function resolveImpediment(projectId) {
  const project = projects.find(p => p.id === projectId);
  const solution = document.getElementById('resolutionInput').value.trim();

  if (!solution) {
    alert('Por favor, informe o que foi feito para resolver.');
    return;
  }

  if (!project.resolvedHistory) project.resolvedHistory = [];

  project.resolvedHistory.unshift({
    original: project.impediments,
    solution: solution,
    resolvedAt: getTodayStr()
  });

  project.impediments = '';
  saveData(STORAGE_KEYS.projects, projects);
  renderDetailContent(project);
  renderActivePage();
}

// ══════════════════════════════════════════════════════════════
//  FLOW PAGE
// ══════════════════════════════════════════════════════════════
function renderFlowPage() {
  populateFlowFilter();
  renderFlowStats();
  renderFlowUserChart();
  renderFlowDashboard();
}

function populateFlowFilter() {
  const select = document.getElementById('filterFlowUser');
  select.innerHTML = '<option value="">Todos os usuários</option>';
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = `${u.name} (${u.role})`;
    select.appendChild(opt);
  });
}

function renderFlowStats() {
  const visible = getVisibleProjects();
  const uniquePeopleNames = new Set(users.map(u => u.name.toLowerCase()));
  const totalUsersCount = uniquePeopleNames.size;
  const allocatedPeopleNames = new Set();

  visible.forEach(p => {
    (p.team || []).forEach(member => {
      const u = getUserById(member);
      const name = u ? u.name.toLowerCase() : (typeof member === 'string' ? member.toLowerCase() : null);
      if (name) allocatedPeopleNames.add(name);
    });
  });

  const totalUsers = totalUsersCount;
  const allocatedUsersNumber = allocatedPeopleNames.size;
  const withImpediments = visible.filter(p => p.impediments && p.impediments.trim()).length;

  document.getElementById('flowStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${totalUsers}</div>
        <div class="stat-label">Total de Recursos</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon teal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${allocatedUsersNumber}</div>
        <div class="stat-label">Recursos Alocados</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <line x1="9" y1="9" x2="15" y2="9"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="12" y2="17"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${visible.length}</div>
        <div class="stat-label">Projetos Visíveis</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${withImpediments}</div>
        <div class="stat-label">Com Impedimentos</div>
      </div>
    </div>
  `;
}

function renderFlowUserChart() {
  const container = document.getElementById('flowUserChart');
  const visible = getVisibleProjects();

  // Mapa de usuários e contagem de projetos
  const userStats = {};
  users.forEach(u => {
    userStats[u.id] = { name: u.name, count: 0 };
  });

  visible.forEach(p => {
    (p.team || []).forEach(uid => {
      if (userStats[uid]) userStats[uid].count++;
    });
  });

  // Converter para array e filtrar/ordenar
  const statsArray = Object.values(userStats)
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  if (statsArray.length === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const maxCount = Math.max(...statsArray.map(s => s.count));

  container.innerHTML = `
    <div class="glass-card" style="padding: 24px;">
      <div class="flex items-center mb-20" style="gap: 16px;">
        <div class="tl-header-icon" style="background: var(--light-blue); width:32px; height:32px; flex-shrink: 0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--deep-navy); margin: 0;">PROJETOS POR COLABORADOR</h4>
      </div>

      <div class="chart-bars-container" style="display: flex; flex-direction: column; gap: 14px;">
        ${statsArray.map(s => {
    const percentage = (s.count / maxCount) * 100;
    const safeName = escapeHTML(s.name);
    return `
            <div class="chart-row" style="display: flex; align-items: center; gap: 16px;">
              <div class="chart-label" style="width: 140px; font-size: 0.82rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${safeName}">
                ${safeName}
              </div>
              <div class="chart-bar-wrap" style="flex: 1; height: 12px; background: rgba(0,0,0,0.05); border-radius: 6px; overflow: hidden; position: relative;">
                <div class="chart-bar-fill" style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary-blue), var(--light-blue)); border-radius: 6px; transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);"></div>
              </div>
              <div class="chart-value" style="width: 30px; font-size: 0.85rem; font-weight: 800; color: var(--primary-blue); text-align: right;">
                ${s.count}
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}

function renderFlowDashboard() {
  const filterUser = document.getElementById('filterFlowUser').value;
  const visible = getVisibleProjects();
  const grid = document.getElementById('flowGrid');

  let filteredProjects = visible;
  if (filterUser) {
    const selectedUser = users.find(u => u.id === filterUser);
    const userName = selectedUser ? selectedUser.name.toLowerCase() : '';

    filteredProjects = visible.filter(p => {
      // 1. Checar se é o Dono ou Gestor
      if (p.ownerId === filterUser || p.managerId === filterUser) return true;

      const team = p.team || [];
      // 2. Busca por ID no array da equipe
      if (team.includes(filterUser)) return true;

      // 3. Busca por correspondência de nome (robusteza)
      if (userName && team.some(member =>
        (typeof member === 'string' && member.toLowerCase() === userName) ||
        (getUserById(member)?.name?.toLowerCase() === userName)
      )) return true;

      return false;
    });
  }

  if (filteredProjects.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="icon">📊</div>
        <h3>Nenhum projeto encontrado para o filtro selecionado</h3>
      </div>
    `;
    return;
  }

  const pendingProjects = filteredProjects.filter(p => p.status !== 'Concluído');
  const finishedProjects = filteredProjects.filter(p => p.status === 'Concluído');

  const renderFlowGroup = (title, projectsList, typeClass) => {
    if (projectsList.length === 0) return '';

    const rows = projectsList.map(p => {
      const teamArr = Array.isArray(p.team) ? p.team : [];
      const collaborators = teamArr.filter(uid => uid !== p.ownerId && uid !== p.managerId).map(uid => {
        const u = getUserById(uid);
        return u ? escapeHTML(u.name.split(' ')[0]) : '';
      }).filter(Boolean).join(', ');

      const teamAvatars = teamArr.map(uid => {
        const u = getUserById(uid);
        return u ? `<div class="team-avatar" style="width:24px;height:24px;font-size:0.6rem;" title="${u.name}">${getInitials(u.name)}</div>` : '';
      }).join('');

      const isShared = teamArr.some(uid => uid !== p.ownerId && uid !== p.managerId);

      let prioLabel = p.priority || 'Média';
      let prioClass = 'm-prio-medium';
      if (prioLabel === 'Baixa') prioClass = 'm-prio-low';
      if (prioLabel === 'Alta') prioClass = 'm-prio-high';
      if (prioLabel === 'Crítico') prioClass = 'm-prio-critical';
      if (p.impediments && p.impediments.trim()) { prioLabel = 'Crítico'; prioClass = 'm-prio-critical'; }

      const progress = calculateProgress(p);
      const endD = p.deadline ? formatDate(p.deadline) : '—';
      const isDone = p.status === 'Concluído';
      const hasBlock = !!(p.impediments && p.impediments.trim());

      const checkIcon = isDone
        ? `<svg class="tl-check-icon done" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`
        : hasBlock
          ? `<svg class="tl-check-icon cancelled" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
          : `<svg class="tl-check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;



      return `
        <div class="tl-row flow-project-row">
          <div class="tl-row-main" style="gap:14px; padding:13px 20px; cursor:pointer;" onclick="openDetailPanel('${p.id}')">
            <input type="checkbox" class="row-select-checkbox" data-id="${p.id}" onclick="event.stopPropagation()" style="cursor:pointer; margin-right:2px; transform:scale(1.15);">
            <div class="flex flex-col" style="flex:1; min-width:0; gap:2px;">
              <div class="flex items-center gap-8">
                <span class="tl-text" style="font-weight:600; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</span>
                ${isShared ? `
                  <div class="is-shared" style="display:flex; align-items:center; justify-content:center; width:20px; height:20px; background:var(--success-bg); border-radius:4px; flex-shrink:0;" title="Projeto Compartilhado">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  </div>
                ` : ''}
              </div>
              ${collaborators ? `<div class="text-xs text-muted" style="font-size:0.68rem; font-weight:500;">👥 ${collaborators}</div>` : ''}
            </div>
            <div class="monday-avatar-stack" style="flex-shrink:0; gap:0;" onclick="event.stopPropagation()">${teamAvatars || '<span style="font-size:0.72rem;color:var(--text-muted);">—</span>'}</div>
            <div class="flow-progress-cell">
              <div style="width:72px;height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">
                <div style="width:${progress}%;height:100%;background:${progress === 100 ? '#6ec9c4' : 'var(--primary-blue)'};border-radius:3px;transition:width 0.4s ease;"></div>
              </div>
              <span style="font-size:0.72rem;font-weight:700;color:var(--text-secondary);min-width:32px;text-align:right;">${progress}%</span>
            </div>
            <span class="flow-deadline-cell">${endD}</span>
            <span class="monday-badge ${prioClass}" style="flex-shrink:0;">${prioLabel}</span>
          </div>
        </div>
      `;
    }).join('');

    const groupId = `flow-group-${typeClass}`;

    return `
      <div class="tl-group">
        <div class="tl-group-header" onclick="toggleTaskGroup('${groupId}')">
          <svg class="tl-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          <input type="checkbox" onclick="event.stopPropagation(); toggleSelectAll(this, '${groupId}')" style="margin-right: 2px; cursor: pointer; transform: scale(1.1);">
          <span class="tl-group-label">${title}</span>
          <span class="tl-group-count">${projectsList.length}</span>
        </div>
        <div id="${groupId}" class="tl-group-body">${rows}</div>
      </div>
    `;
  };

  grid.innerHTML = `
    <div class="tl-container" style="margin-top:0;">
      <div class="tl-header">
        <div class="tl-header-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></svg>
        </div>
        <span class="tl-header-title">FLUXO DE PROJETOS</span>
        <span class="tl-header-count">${filteredProjects.length}</span>
      </div>
      <div class="tl-groups">
        ${renderFlowGroup('Projetos em Andamento', pendingProjects, 'pending')}
        ${renderFlowGroup('Concluídos', finishedProjects, 'done')}
      </div>
    </div>
  `;
}

function toggleSelectAll(master, groupId) {
  const container = document.getElementById(groupId);
  if (!container) return;
  const checkboxes = container.querySelectorAll('.row-select-checkbox');
  checkboxes.forEach(cb => cb.checked = master.checked);
}

// ══════════════════════════════════════════════════════════════
//  DAILY PAGE
// ══════════════════════════════════════════════════════════════
function getTodayStr() {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

function getUserDailyEntries() {
  if (!currentUser) return [];
  // All users see all daily entries — Daily Scrum is a collective ceremony
  return dailyEntries;
}

function renderDailyPage() {
  // Set default date filter to today if empty
  const filterEl = document.getElementById('dailyDateFilter');
  if (!filterEl.value) filterEl.value = getTodayStr();

  populateDailyUserFilter();
  renderDailyStats();
  renderDailyEntries();
}

function populateDailyUserFilter() {
  const select = document.getElementById('dailyUserFilter');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">Todos os colaboradores</option>';
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  sorted.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.name;
    select.appendChild(opt);
  });
  select.value = currentVal;
}

function renderDailyStats() {
  const filterDate = document.getElementById('dailyDateFilter').value;
  const filterUser = document.getElementById('dailyUserFilter').value;
  let baseEntries = getUserDailyEntries();

  // Filtrar pela pessoa, se selecionada
  if (filterUser) {
    baseEntries = baseEntries.filter(e => e.userId === filterUser);
  }

  // 1. Registros na Data Selecionada
  const dateCount = baseEntries.filter(e => e.date === filterDate).length;

  // 2. Esta Semana (independente do filtro de data, mas respeitando o usuário)
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const weekCount = baseEntries.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= startOfWeek;
  }).length;

  const totalCount = baseEntries.length;
  const withBlockers = baseEntries.filter(e => e.blockers && e.blockers.trim() && e.blockers.toLowerCase() !== 'nenhum').length;

  document.getElementById('dailyStats').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${dateCount}</div>
        <div class="stat-label">Registros na Data</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${weekCount}</div>
        <div class="stat-label">Esta Semana</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${totalCount}</div>
        <div class="stat-label">Total de Registros</div>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">${withBlockers}</div>
        <div class="stat-label">Impedimentos</div>
      </div>
    </div>
  `;
}

function renderDailyEntries() {
  const filterDate = document.getElementById('dailyDateFilter').value;
  const filterUser = document.getElementById('dailyUserFilter').value;
  let entries = getUserDailyEntries();

  if (filterDate) {
    entries = entries.filter(e => e.date === filterDate);
  }
  if (filterUser) {
    entries = entries.filter(e => e.userId === filterUser);
  }

  // Sort by date desc, then by creation
  entries.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const container = document.getElementById('dailyEntries');

  if (entries.length === 0) {
    container.innerHTML = `
      <div class="glass-card">
        <div class="empty-state">
          <div class="icon">📝</div>
          <h3>Nenhum registro para esta data</h3>
          <p class="text-muted">Clique em "+ Novo Registro" para adicionar.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = entries.map(entry => {
    const user = getUserById(entry.userId);
    const blockersText = (entry.blockers || '').trim();
    const hasBlocker = blockersText && blockersText.toLowerCase() !== 'nenhum';
    const isOwner = currentUser && (currentUser.id === entry.userId || currentUser.access === 'Admin');

    // Backward compat: convert old text fields to activity arrays
    const yesterdayActs = entry.yesterdayActivities || (entry.tomorrowTasks ? [{ text: entry.tomorrowTasks, projectId: entry.projectId, collaboratorId: null }] : []);
    const todayActs = entry.todayActivities || (entry.todayTasks ? [{ text: entry.todayTasks, projectId: entry.projectId, collaboratorId: null }] : []);

    return `
      <div class="daily-entry-card glass-card ${hasBlocker ? 'has-impediment' : ''}" style="margin-bottom:16px;">
        <div class="daily-entry-header">
          <div class="flex items-center gap-12">
            <div class="sidebar-user-avatar" style="width:36px;height:36px;font-size:0.75rem;">${user ? getInitials(user.name) : '??'}</div>
            <div>
              <div class="text-sm font-bold">${user ? user.name : 'Usuário removido'}</div>
              <div class="text-xs text-muted">
                ${user ? user.role : ''} · ${formatDate(entry.date)} 
                ${entry.createdAt ? `<span style="opacity:0.7;">às ${formatTime(entry.createdAt)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-8">
            ${isOwner ? `
              <button class="btn btn-secondary btn-sm" onclick="editDaily('${entry.id}')">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deleteDaily('${entry.id}')">🗑️</button>
            ` : ''}
          </div>
        </div>

        <div class="daily-entry-body">
          <div class="daily-section">
            <div class="daily-section-label">
              <span class="daily-dot done"></span>
              O que fiz ontem
            </div>
            <div class="daily-section-content">
              ${renderActivityList(yesterdayActs)}
            </div>
          </div>

          <div class="daily-section">
            <div class="daily-section-label">
              <span class="daily-dot planned"></span>
              O que farei hoje
            </div>
            <div class="daily-section-content">
              ${renderActivityList(todayActs)}
            </div>
          </div>

          ${blockersText ? `
            <div class="${hasBlocker ? 'impediment-alert' : 'text-xs text-muted'}" style="margin-top:12px;">
              <span class="alert-icon">${hasBlocker ? '🚧' : '✅'}</span>
              <span>${blockersText}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderActivityList(activities) {
  if (!activities || activities.length === 0) return '<span class="text-muted">—</span>';
  return activities.map(act => {
    const proj = act.projectId ? projects.find(p => p.id === act.projectId) : null;
    const collab = act.collaboratorId ? getUserById(act.collaboratorId) : null;
    const obs = (act.observations || '').trim();

    const tags = [];
    if (proj) tags.push(`<span class="flow-project-tag" style="margin:0;padding:3px 7px;font-size:0.7rem;" onclick="openDetailPanel('${proj.id}')">📋 ${proj.name}</span>`);
    if (collab) tags.push(`<span class="flow-project-tag" style="margin:0;padding:3px 7px;font-size:0.7rem;background:rgba(87, 155, 252, 0.1);color:#579bfc;border-color:#579bfc;">👤 Ajudado por: ${collab.name}</span>`);

    return `
      <div class="daily-line" style="margin-bottom:8px;">
        <div class="flex items-center gap-8" style="flex-wrap:wrap;">
          <span class="font-bold">• ${act.text}</span>
          ${tags.length ? `<span class="flex items-center gap-4" style="gap:4px;">${tags.join('')}</span>` : ''}
        </div>
        ${obs ? `<div class="text-xs text-muted" style="margin-top:2px; padding-left:14px; font-style:italic;">💬 Obs: ${obs}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ── Daily Modal (Activity-Based) ──────────────────────────────
let modalYesterdayActivities = [];
let modalTodayActivities = [];
let modalPrevPlannedActivities = [];

function buildProjectOptions() {
  const visibleProjects = getVisibleProjects();
  return '<option value="">— Projeto —</option>' +
    visibleProjects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}

function buildUserOptions() {
  const sorted = [...users].sort((a, b) => a.name.localeCompare(b.name));
  return '<option value="">— Colaborador —</option>' +
    sorted.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

function renderActivityRow(section, index, act) {
  return `
    <div class="daily-activity-row" data-section="${section}" data-index="${index}" style="border-left: 3px solid #5483B3; padding-left:12px;">
      <div class="grid grid-2 gap-8 mb-8">
        <select class="form-control text-xs" onchange="updateDailyActivity('${section}', ${index}, 'projectId', this.value)">
          ${buildProjectOptions().replace(`value="${act.projectId || ''}"`, `value="${act.projectId || ''}" selected`)}
        </select>
        <select class="form-control text-xs" onchange="updateDailyActivity('${section}', ${index}, 'collaboratorId', this.value)">
          ${buildUserOptions().replace(`value="${act.collaboratorId || ''}"`, `value="${act.collaboratorId || ''}" selected`)}
        </select>
      </div>

      <div class="form-group mb-4">
        <input type="text" class="form-control" placeholder="Descrição da atividade..."
          id="input-${section}-${index}"
          value="${(act.text || '').replace(/"/g, '&quot;')}"
          onchange="updateDailyActivity('${section}', ${index}, 'text', this.value)" />
      </div>

      <div class="daily-suggestions" id="suggestions-${section}-${index}">
        ${renderTaskSuggestionsContent(act.projectId, section, index)}
      </div>
      
      <div class="flex items-center gap-8 mt-8">
        <input type="text" class="form-control text-xs" style="background:#f8f9fa;" 
          placeholder="Impedimentos / Obs..."
          value="${(act.observations || '').replace(/"/g, '&quot;')}"
          onchange="updateDailyActivity('${section}', ${index}, 'observations', this.value)" />
        <button class="btn btn-danger btn-icon btn-sm" style="height:32px; width:32px; flex-shrink:0;" onclick="removeDailyActivity('${section}', ${index})">✕</button>
      </div>
    </div>
  `;
}

function renderModalActivities(section) {
  const arr = section === 'yesterday' ? modalYesterdayActivities : modalTodayActivities;
  const containerId = section === 'yesterday' ? 'yesterdayActivities' : 'todayActivities';
  const container = document.getElementById(containerId);
  if (!container) return;

  if (arr.length === 0) {
    container.innerHTML = '<div class="text-sm text-muted" style="padding:8px 0;">Nenhuma atividade. Clique em ＋ para adicionar.</div>';
    return;
  }

  container.innerHTML = arr.map((act, i) => renderActivityRow(section, i, act)).join('');
}

function addDailyActivity(section) {
  const arr = section === 'yesterday' ? modalYesterdayActivities : modalTodayActivities;
  arr.push({ text: '', projectId: '', collaboratorId: '', observations: '' });
  renderModalActivities(section);
}

function removeDailyActivity(section, index) {
  const arr = section === 'yesterday' ? modalYesterdayActivities : modalTodayActivities;
  arr.splice(index, 1);
  renderModalActivities(section);
}

function updateDailyActivity(section, index, field, value) {
  const arr = section === 'yesterday' ? modalYesterdayActivities : modalTodayActivities;
  if (!arr[index]) return;
  
  arr[index][field] = value;

  // Se mudar o projeto, atualiza as sugestões
  if (field === 'projectId') {
    const sugDiv = document.getElementById(`suggestions-${section}-${index}`);
    if (sugDiv) {
      sugDiv.innerHTML = renderTaskSuggestionsContent(value, section, index);
    }
  }
}

function renderTaskSuggestionsContent(projectId, section, index) {
  if (!projectId) return '';
  const project = projects.find(p => p.id === projectId);
  if (!project || !project.tasks || project.tasks.length === 0) return '';

  return project.tasks
    .map(t => {
      const statusText = t.done ? '✓ ' : '';
      const className = t.done ? 'daily-suggestion-chip done' : 'daily-suggestion-chip';
      const escapedText = t.text.replace(/`/g, '\\`').replace(/"/g, '&quot;');
      
      return `
        <div class="${className}" 
             title="${t.done ? 'Tarefa concluída' : 'Tarefa pendente'}" 
             onclick="selectTaskSuggestion('${section}', ${index}, \`${escapedText}\`)">
          ${statusText}${t.text}
        </div>`;
    })
    .join('');
}

function selectTaskSuggestion(section, index, text) {
  const arr = section === 'yesterday' ? modalYesterdayActivities : modalTodayActivities;
  if (arr[index]) {
    arr[index].text = text;
    const input = document.getElementById(`input-${section}-${index}`);
    if (input) input.value = text;
    
    // Opcional: esconder sugestões após selecionar
    const sugDiv = document.getElementById(`suggestions-${section}-${index}`);
    if (sugDiv) sugDiv.innerHTML = '';
  }
}

function openDailyModal(id) {
  editingDailyId = id || null;
  const overlay = document.getElementById('dailyModalOverlay');
  const title = document.getElementById('dailyModalTitle');

  if (editingDailyId) {
    title.textContent = 'Editar Registro Daily';
    const entry = dailyEntries.find(e => e.id === editingDailyId);
    if (entry) {
      document.getElementById('dailyDate').value = entry.date;
      document.getElementById('dailyBlockers').value = entry.blockers || '';
      // Load activities (backward compat)
      modalYesterdayActivities = (entry.yesterdayActivities || []).map(a => ({ ...a }));
      modalTodayActivities = (entry.todayActivities || []).map(a => ({ ...a }));
    }
  } else {
    title.textContent = 'Novo Registro Daily';
    document.getElementById('dailyDate').value = getTodayStr();
    document.getElementById('dailyBlockers').value = 'Nenhum';
    modalYesterdayActivities = [{ text: '', projectId: '', collaboratorId: '', observations: '' }];
    modalTodayActivities = [{ text: '', projectId: '', collaboratorId: '', observations: '' }];

    // Buscar a Daily anterior do usuário para comparativo
    const userEntries = dailyEntries.filter(e => e.userId === currentUser.id);
    userEntries.sort((a, b) => b.createdAt - a.createdAt);
    const lastDaily = userEntries[0];

    const prevContainer = document.getElementById('prevDailyContainer');
    const prevList = document.getElementById('prevPlannedList');

    if (lastDaily && lastDaily.todayActivities && lastDaily.todayActivities.length > 0) {
      modalPrevPlannedActivities = lastDaily.todayActivities.map(a => ({ ...a }));
      prevList.innerHTML = modalPrevPlannedActivities.map(a => `• ${escapeHTML(a.text)}`).join('<br>');
      prevContainer.classList.remove('hidden');
    } else {
      modalPrevPlannedActivities = [];
      prevContainer.classList.add('hidden');
    }
  }

  renderModalActivities('yesterday');
  renderModalActivities('today');
  overlay.classList.add('active');
}

function copyPrevPlannedToYesterday() {
  if (modalPrevPlannedActivities.length === 0) return;

  // Substitui a lista de 'ontem' apenas se estiver vazia ou com uma linha branca
  if (modalYesterdayActivities.length === 1 && !modalYesterdayActivities[0].text.trim()) {
    modalYesterdayActivities = modalPrevPlannedActivities.map(a => ({ ...a }));
  } else {
    // Adiciona ao final
    modalYesterdayActivities.push(...modalPrevPlannedActivities.map(a => ({ ...a })));
  }

  renderModalActivities('yesterday');
  document.getElementById('prevDailyContainer').classList.add('hidden');
}

function closeDailyModal() {
  document.getElementById('dailyModalOverlay').classList.remove('active');
  document.getElementById('prevDailyContainer').classList.add('hidden');
  editingDailyId = null;
  modalYesterdayActivities = [];
  modalTodayActivities = [];
  modalPrevPlannedActivities = [];
}

function saveDaily() {
  const date = document.getElementById('dailyDate').value;
  const blockers = document.getElementById('dailyBlockers').value.trim();

  // Filter out empty activities
  const yesterdayActivities = modalYesterdayActivities.filter(a => a.text.trim());
  const todayActivities = modalTodayActivities.filter(a => a.text.trim());

  if (!date || (yesterdayActivities.length === 0 && todayActivities.length === 0)) return;

  if (editingDailyId) {
    const idx = dailyEntries.findIndex(e => e.id === editingDailyId);
    if (idx !== -1) {
      dailyEntries[idx] = {
        ...dailyEntries[idx],
        date,
        yesterdayActivities,
        todayActivities,
        blockers,
        // Clear old fields
        todayTasks: undefined,
        tomorrowTasks: undefined,
        projectId: undefined,
      };
    }
  } else {
    dailyEntries.push({
      id: generateId(),
      userId: currentUser.id,
      date,
      yesterdayActivities,
      todayActivities,
      blockers,
      createdAt: Date.now(),
      created_at: new Date().toISOString(),
    });
  }

  saveData(STORAGE_KEYS.dailyEntries, dailyEntries);
  closeDailyModal();
  renderDailyPage();
}

function editDaily(id) {
  openDailyModal(id);
}

function deleteDaily(id) {
  confirmDoubleDelete('Deseja excluir permanentemente este registro do Daily? Esta ação não pode ser desfeita.', () => {
    dailyEntries = dailyEntries.filter(e => e.id !== id);
    if (window.supabaseClient) { window.supabaseClient.from('daily_entries').delete().eq('id', id).then(); }
    saveData(STORAGE_KEYS.dailyEntries, dailyEntries);
    renderDailyPage();
  });
}

// ══════════════════════════════════════════════════════════════
//  AVAZA ADAPTED PAGES (STATIC RENDER)
// ══════════════════════════════════════════════════════════════

const AVAZA_REPORTS_LIST = [
  { title: 'Project Dashboard', icon: '📊', desc: 'Overview of key project statistics across projects. Filter by customer or project status.' },
  { title: 'Project Summary Report', icon: '📋', desc: 'Complete analysis of crucial project information. Budget, Time, Expense details included.' },
  { title: 'Project Profitability', icon: '💰', desc: 'View a Summary and breakdown of Project Budget vs Time & Expense Costs.' },
  { title: 'Task List', icon: '✔️', desc: 'View tasks details. Filter by one or more clients, projects, users and more.' },
  { title: 'Timesheet Summary', icon: '⏱️', desc: 'Get a better understanding of where your team is spending their time.' },
  { title: 'Staff Utilisation Report', icon: '👥', desc: 'Analyze billable vs non-billable time across your entire team.' }
];

function renderAvazaProjectsPage() {
  const tbody = document.getElementById('avazaProjectsTableBody');
  if (!tbody) return;

  const displayProjects = projects;

  if (displayProjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted);">Nenhum projeto encontrado. <a href="#" onclick="openProjectModal()">Adicione um projeto</a></td></tr>';
    return;
  }

  tbody.innerHTML = displayProjects.map(p => {
    const totalTasks = (p.tasks || []).length;
    const doneTasks = (p.tasks || []).filter(t => t.done).length;
    const teamCount = (p.team || []).length;
    const progress = calculateProgress(p);

    return `
      <tr style="cursor:pointer;" onclick="openDetailPanel('${p.id}')">
        <td>
          <div class="flex items-center gap-8">
            <span style="opacity:0.6;">${p.impediments ? '🚨' : '📋'}</span>
            <strong>${p.name}</strong>
          </div>
        </td>
        <td><span class="text-xs">${p.objective || '—'}</span></td>
        <td>
          <div class="flex gap-4">
            <span class="badge badge-gestor" style="font-size:0.6rem;">${p.tech || 'Dev'}</span>
          </div>
        </td>
        <td>
          <div class="text-xs">
            ${doneTasks} / ${totalTasks}
            <div style="width:40px;height:4px;background:#e2e8f0;border-radius:2px;margin-top:4px;overflow:hidden;">
              <div style="width:${progress}%;height:100%;background:var(--primary-blue);"></div>
            </div>
          </div>
        </td>
        <td><div class="text-xs">${formatDate(p.startDate)}</div></td>
        <td><div class="text-xs">${formatDate(p.deadline)}</div></td>
        <td>
          <div class="flex items-center gap-4">
            <span class="badge badge-ativo" style="font-size:0.6rem;">${p.visibility || 'Público'}</span>
            <span class="text-xs text-muted">👤 ${teamCount}</span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderAvazaTasksPage() {
  const comData = document.getElementById('avazaTasksComData');
  const semData = document.getElementById('avazaTasksSemData');
  if (!comData || !semData) return;

  // Aggregate ALL tasks from all projects
  const allTasks = [];
  projects.forEach(p => {
    if (p.tasks) {
      p.tasks.forEach((t, idx) => {
        allTasks.push({ ...t, projectId: p.id, projectName: p.name, originalIndex: idx });
      });
    }
  });

  if (allTasks.length === 0) {
    comData.innerHTML = '<div class="text-center py-24 text-muted" style="grid-column:1/-1;">Nenhuma tarefa com data encontrada.</div>';
    semData.innerHTML = '<div class="text-center py-24 text-muted" style="grid-column:1/-1;">Nenhuma tarefa encontrada nos projetos. <a href="#" onclick="switchPage(\'projects\')">Vá para projetos</a> para adicionar.</div>';
    return;
  }

  const tasksWithDate = allTasks.filter(t => t.date);
  const tasksWithoutDate = allTasks.filter(t => !t.date);

  comData.innerHTML = tasksWithDate.map(t => `
    <div class="avaza-task-item">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleAvazaTask('${t.projectId}', ${t.originalIndex})" />
      <div class="avaza-task-info" onclick="openDetailPanel('${t.projectId}')" style="cursor:pointer;">
        <div class="avaza-task-title ${t.done ? 'done' : ''}">${t.text}</div>
        <div class="avaza-task-meta">
          <span>📅 ${formatDate(t.date)}</span>
          <span class="badge badge-gestor" style="font-size:0.6rem;">${t.projectName}</span>
        </div>
      </div>
    </div>
  `).join('') || '<div class="text-center py-24 text-muted">Nenhuma tarefa com data.</div>';

  semData.innerHTML = tasksWithoutDate.map(t => `
    <div class="avaza-task-item">
      <input type="checkbox" ${t.done ? 'checked' : ''} onchange="toggleAvazaTask('${t.projectId}', ${t.originalIndex})" />
      <div class="avaza-task-info" onclick="openDetailPanel('${t.projectId}')" style="cursor:pointer;">
        <div class="avaza-task-title ${t.done ? 'done' : ''}">${t.text}</div>
        <div class="avaza-task-meta">
          <span class="badge badge-gestor" style="font-size:0.6rem;">${t.projectName}</span>
        </div>
      </div>
    </div>
  `).join('') || '<div class="text-center py-24 text-muted">Nenhuma tarefa sem data.</div>';
}

function toggleAvazaTask(projectId, taskIndex) {
  toggleTask(projectId, taskIndex);
  renderAvazaTasksPage();
}

function renderAvazaSchedulePage() {
  const container = document.getElementById('avazaScheduleTimeline');
  if (!container) return;

  // Create a 14-day window from today
  const today = new Date();
  const dates = [];
  for (let i = -2; i < 12; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d);
  }

  const dayLabels = dates.map(d => {
    const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return `${labels[d.getDay()]} ${d.getDate()}`;
  });

  let html = `<div class="timeline-container"><div class="timeline-header"><div class="timeline-header-cell">PESSOA</div>`;
  dayLabels.forEach(d => html += `<div class="timeline-header-cell">${d}</div>`);
  html += `</div>`;

  users.forEach(u => {
    const userProjects = projects.filter(p => (p.team || []).includes(u.id));

    html += `<div class="timeline-row">
      <div class="timeline-user-cell">
        <div class="font-bold text-sm" style="color:var(--deep-navy);">${u.name}</div>
        <div class="text-xs text-muted">${u.role}</div>
      </div>`;

    dates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const activeAlloc = userProjects.find(p => {
        const start = p.startDate;
        const end = p.deadline;
        return dateStr >= start && dateStr <= end && date.getDay() !== 0 && date.getDay() !== 6;
      });

      html += `<div class="timeline-day-cell">
        ${activeAlloc ? `
          <div class="allocation-bar" title="Projeto: ${activeAlloc.name}" onclick="openDetailPanel('${activeAlloc.id}')">
            8h
          </div>
        ` : ''}
      </div>`;
    });
    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function renderAvazaAgendaPage() {
  const container = document.getElementById('avazaAgendaList');
  if (!container) return;

  if (!currentUser) return;

  const myProjects = projects.filter(p => (p.team || []).includes(currentUser.id));
  const myTasks = [];
  myProjects.forEach(p => {
    if (p.tasks) {
      p.tasks.forEach(t => {
        if (!t.done) myTasks.push({ ...t, projectName: p.name, projectId: p.id });
      });
    }
  });

  const now = new Date();
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const monthName = months[now.getMonth()];

  container.innerHTML = `
    <div class="glass-card mb-16">
      <div class="flex items-center justify-between mb-16">
        <div class="font-bold">Minhas Tarefas em ${monthName} ${now.getFullYear()}</div>
        <div class="text-sm font-bold badge badge-gestor">${myTasks.length} a fazer</div>
      </div>
      
      <div class="avaza-task-list">
        ${myTasks.length > 0 ? myTasks.map(t => `
          <div class="avaza-task-item" style="background:rgba(255,255,255,0.5);">
            <div class="avaza-task-info" onclick="openDetailPanel('${t.projectId}')" style="cursor:pointer;">
              <div class="avaza-task-title">${t.text}</div>
              <div class="avaza-task-meta">
                <span>📂 ${t.projectName}</span>
                ${t.date ? `<span>📅 ${formatDate(t.date)}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('') : '<div class="text-center py-40 text-muted">Você não tem tarefas pendentes.</div>'}
      </div>
    </div>
  `;
}

function renderAvazaReportsPage() {
  const grid = document.getElementById('avazaReportsGrid');
  if (!grid) return;

  const stats = {
    totalProjects: projects.length,
    totalUsers: users.length,
    totalDaily: dailyEntries.length,
    activeImpediments: projects.filter(p => p.impediments && p.impediments.trim()).length
  };

  const reports = [
    { title: 'Dashboard de Projetos', icon: '📊', desc: `Visão geral de ${stats.totalProjects} projetos ativos e seus respectivos status.`, action: "switchPage('projects')" },
    { title: 'Resumo de Impedimentos', icon: '🚨', desc: `Análise detalhada de ${stats.activeImpediments} impedimentos que bloqueiam o progresso.`, action: "switchPage('flow')" },
    { title: 'Utilização da Equipe', icon: '👥', desc: `Relatório de alocação de ${stats.totalUsers} colaboradores em múltiplos projetos.`, action: "switchPage('avazaSchedule')" },
    { title: 'Prazos e Datas Críticas', icon: '⏳', desc: 'Monitoramento de entregas e marcos contratuais para evitar atrasos.', action: "switchPage('avazaProjects')" },
    { title: 'Engajamento Daily', icon: '📝', desc: `Métricas de participação nas reuniões diárias (${stats.totalDaily} registros).`, action: "switchPage('daily')" },
    { title: 'Minha Agenda', icon: '📖', desc: 'Resumo de suas tarefas e compromissos para hoje.', action: "switchPage('avazaAgenda')" }
  ];

  grid.innerHTML = reports.map(r => `
    <div class="report-card" onclick="${r.action}">
      <div class="report-card-icon">${r.icon}</div>
      <div class="report-card-title">${r.title}</div>
      <div class="report-card-desc">${r.desc}</div>
    </div>
  `).join('');
}


function toggleSelectAllRows(source, event) {
  event.stopPropagation();
  const table = source.closest('table');
  const checkboxes = table.querySelectorAll('.row-select-checkbox');
  checkboxes.forEach(cb => cb.checked = source.checked);
}

function generateMarkedReport() {
  const isAdmin = currentUser && currentUser.access === 'Admin';
  const isGestor = currentUser && currentUser.access === 'Gestor';
  if (!isAdmin && !isGestor) {
    alert('Acesso negado. Apenas Gestores e Administradores podem gerar relatórios.');
    return;
  }

  const selectedCheckboxes = document.querySelectorAll('.row-select-checkbox:checked');
  if (selectedCheckboxes.length === 0) {
    alert('Por favor, selecione ao menos um projeto para gerar o relatório.');
    return;
  }

  const ids = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-id'));
  const selectedProjects = projects.filter(p => ids.includes(p.id));

  let reportHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Projetos</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        .report-header { border-bottom: 2px solid #5483B3; margin-bottom: 30px; padding-bottom: 10px; }
        .project-card { border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
        .project-title { color: #5483B3; margin-top: 0; display: flex; align-items: center; gap: 10px; }
        .is-shared-report { color: #22c55e; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: rgba(34, 197, 94, 0.1); border-radius: 4px; }
        .label { font-weight: bold; color: #666; font-size: 0.85rem; text-transform: uppercase; }
        .team-list { display: flex; gap: 8px; margin-top: 8px; }
        .team-member { background: #f0f4f8; padding: 4px 12px; border-radius: 16px; font-size: 0.8rem; }
        .impediment { background: #fff5f5; border-left: 4px solid #fc8181; padding: 10px; margin-top: 10px; color: #c53030; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #5483B3; color: white; border: none; border-radius: 4px; cursor: pointer;">🖨️ Imprimir / Salvar PDF</button>
      </div>
      <div class="report-header">
        <h1>📊 Relatório de Fluxo de Projetos</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
  `;

  selectedProjects.forEach(p => {
    const teamNames = (p.team || []).map(uid => getUserById(uid)?.name || 'Desconhecido');
    const tasks = p.tasks || [];
    const doneTasks = tasks.filter(t => t.done).length;
    const progress = calculateProgress(p);

    const taskListHtml = tasks.length > 0
      ? `<table style="width:100%; border-collapse:collapse; margin-top:10px; font-size:0.85rem;">
          <thead style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
            <tr>
              <th style="padding:4px 8px; text-align:left; border-right:1px solid #eee;">Status</th>
              <th style="padding:4px 8px; text-align:left;">Atividade / Tarefa</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr style="border-bottom:1px solid #f1f5f9;">
                <td style="padding:4px 8px; border-right:1px solid #eee; width:80px;">
                  <span style="padding:2px 6px; border-radius:4px; font-size:0.7rem; font-weight:bold; background:${t.done ? '#def7ec' : '#fef3c7'}; color:${t.done ? '#03543f' : '#92400e'}">
                    ${t.done ? 'Feito' : (t.status || 'Pendente')}
                  </span>
                </td>
                <td style="padding:4px 8px; ${t.done ? 'text-decoration:line-through; color:#94a3b8;' : ''}">${t.text}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      : '<p class="text-xs text-muted">Sem tarefas cadastradas.</p>';

    reportHtml += `
      <div class="project-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
          <h2 class="project-title" style="margin:0;">
            ${p.name}
            ${Array.isArray(p.team) && p.team.some(uid => uid !== p.ownerId && uid !== p.managerId) ? `
              <span class="is-shared-report" title="Projeto Compartilhado">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </span>
            ` : ''}
          </h2>
          <div style="text-align:right;">
             <div style="font-size:1.2rem; font-weight:900; color:#052659;">${progress}%</div>
             <div style="width:120px; height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;">
                <div style="width:${progress}%; height:100%; background:#5483B3;"></div>
             </div>
             <div style="font-size:0.7rem; color:#666; margin-top:2px;">${doneTasks} de ${tasks.length} concluídas</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; background:#fbfcfe; padding:12px; border-radius:6px; margin-bottom:15px; border:1px solid #edf2f7;">
          <div>
            <span class="label">Prioridade</span>
            <div style="font-size:0.9rem;">${p.priority || 'Média'}</div>
          </div>
          <div>
            <span class="label">Status</span>
            <div style="font-size:0.9rem;">${p.status}</div>
          </div>
          <div>
            <span class="label">Prazo Final</span>
            <div style="font-size:0.9rem;">${formatDate(p.deadline) || '—'}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <span class="label">Responsáveis e Equipe:</span>
          <div style="font-size:0.9rem; margin-top:4px;">
            <strong>PO:</strong> ${getUserById(p.ownerId)?.name || '—'} | 
            <strong>Gestor:</strong> ${getUserById(p.managerId)?.name || '—'}
          </div>
          ${(p.team || []).filter(uid => uid !== p.ownerId && uid !== p.managerId).length > 0 ? `
            <div style="font-size:0.85rem; color:#666; margin-top:4px; font-style:italic;">
              <strong>Colaboradores:</strong> ${(p.team || []).filter(uid => uid !== p.ownerId && uid !== p.managerId).map(uid => getUserById(uid)?.name || '—').join(', ')}
            </div>
          ` : ''}
        </div>

        <div style="margin-bottom:15px;">
          <span class="label">Identificação e Propósito:</span>
          <p style="margin:5px 0; font-size:0.85rem;">${p.objective || 'Nenhum objetivo descrito.'}${p.justification ? ` | <em>${p.justification}</em>` : ''}</p>
        </div>

        <div style="margin-top:20px;">
          <span class="label">📋 Quadro de Atividades</span>
          ${taskListHtml}
        </div>

        <div style="margin-top:20px;">
          <span class="label">🗓️ Marcos do Cronograma</span>
          <div style="font-size:0.85rem; margin-top:8px;">
            ${Array.isArray(p.milestones) && p.milestones.length > 0
        ? p.milestones.map(m => `<div style="padding:3px 0; border-bottom:1px solid #f1f5f9;">• <strong>${formatDate(m.date)}</strong>: ${m.text}</div>`).join('')
        : (p.milestones || 'Nenhum marco definido.')}
          </div>
        </div>

        ${p.impediments ? `
          <div class="impediment">
            <span class="label">🚨 Impedimentos:</span>
            <p style="margin-top: 5px;">${p.impediments}</p>
          </div>
        ` : ''}
      </div>
    `;
  });

  reportHtml += `</body></html>`;

  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(reportHtml);
  reportWindow.document.close();
}

function openDailyReportModal() {
  const isAdmin = currentUser && currentUser.access === 'Admin';
  const isGestor = currentUser && currentUser.access === 'Gestor';
  if (!isAdmin && !isGestor) {
    alert('Acesso negado. Apenas Gestores e Administradores podem acessar esta função.');
    return;
  }

  document.getElementById('dailyReportModalOverlay').classList.add('active');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dailyReportStart').value = today;
  document.getElementById('dailyReportEnd').value = today;

  const userSelect = document.getElementById('dailyReportUser');
  if (userSelect) {
    userSelect.innerHTML = '<option value="">Todos os colaboradores</option>';
    const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));
    sortedUsers.forEach(u => {
      const opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.name;
      userSelect.appendChild(opt);
    });
  }
}

function closeDailyReportModal() {
  document.getElementById('dailyReportModalOverlay').classList.remove('active');
}

function generateDailyPeriodReport() {
  const start = document.getElementById('dailyReportStart').value;
  const end = document.getElementById('dailyReportEnd').value;
  const filterUserId = document.getElementById('dailyReportUser').value;

  if (!start || !end) {
    alert('Por favor, selecione as datas inicial e final.');
    return;
  }

  let entries = dailyEntries.filter(e => e.date >= start && e.date <= end);

  if (filterUserId) {
    const selectedUser = users.find(u => u.id === filterUserId);
    const userName = selectedUser ? selectedUser.name.toLowerCase() : '';
    entries = entries.filter(e => {
      if (e.userId === filterUserId) return true;
      const entryUser = getUserById(e.userId);
      if (userName && entryUser && entryUser.name.toLowerCase() === userName) return true;
      return false;
    });
  }

  if (entries.length === 0) {
    alert('Nenhum registro encontrado no período selecionado.');
    return;
  }

  // Sort by date then user
  entries.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const uA = getUserById(a.userId)?.name || '';
    const uB = getUserById(b.userId)?.name || '';
    return uA.localeCompare(uB);
  });

  let reportHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Daily</title>
      <style>
        body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; line-height: 1.4; background: #f9f9f9; margin: 0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #5483B3; margin-bottom: 20px; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
        .period { color: #666; font-size: 0.9rem; }
        .entry { margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px; width: 100%; box-sizing: border-box; }
        .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }
        .user-name { font-weight: bold; color: #052659; font-size: 1rem; }
        .entry-date { color: #5483B3; font-weight: 600; font-size: 0.9rem; }
        .section { margin-bottom: 12px; }
        .section-title { font-weight: bold; color: #666; font-size: 0.7rem; text-transform: uppercase; margin-bottom: 4px; display: block; border-bottom: 1px solid #f0f0f0; width: fit-content; }
        .activity-text { font-size: 0.85rem; margin: 3px 0; padding-left: 10px; border-left: 2px solid #eee; word-wrap: break-word; overflow-wrap: break-word; }
        .project-tag { font-size: 0.65rem; background: #e8f1fb; color: #5483B3; padding: 1px 5px; border-radius: 4px; font-weight: bold; margin-left: 5px; white-space: nowrap; }
        .blocker { color: #c53030; background: #fff5f5; padding: 8px 12px; border-radius: 4px; border-left: 4px solid #fc8181; font-size: 0.85rem; margin-top: 8px; }
        @media print { 
          @page { margin: 1.5cm; size: auto; }
          body { background: white; padding: 0; margin: 0; }
          .container { box-shadow: none; width: 100% !important; max-width: 100% !important; border: none; padding: 10px; margin: 0; box-sizing: border-box; }
          .no-print { display: none; } 
          .entry { border: 1px solid #eee; page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="no-print" style="margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #5483B3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🖨️ Imprimir / Salvar PDF</button>
        </div>
        <div class="header">
          <div>
            <h1 style="color: #052659; margin: 0;">📝 Relatório Consolidado de Daily</h1>
            <p class="period">Período: ${formatDate(start)} até ${formatDate(end)}</p>
          </div>
          <div style="text-align: right; font-size: 0.8rem; color: #999;">
            Gerado em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </div>
  `;

  entries.forEach(e => {
    const user = getUserById(e.userId);
    const yesterdayActs = e.yesterdayActivities || [];
    const todayActs = e.todayActivities || [];
    const blockers = (e.blockers || '').trim();

    reportHtml += `
      <div class="entry">
        <div class="entry-header">
          <span class="user-name">${user ? user.name : 'Desconhecido'}</span>
          <span class="entry-date">${formatDate(e.date)}</span>
        </div>
        
        <div class="section">
          <span class="section-title">O que foi feito ontem:</span>
          ${yesterdayActs.length ? yesterdayActs.map(a => `
            <div class="activity-text">
              • ${a.text} 
              ${a.projectId ? `<span class="project-tag">${projects.find(p => p.id === a.projectId)?.name || 'Projeto'}</span>` : ''}
            </div>
          `).join('') : '<div class="activity-text italic">Nenhuma atividade registrada.</div>'}
        </div>

        <div class="section">
          <span class="section-title">O que será feito hoje:</span>
          ${todayActs.length ? todayActs.map(a => `
            <div class="activity-text">
              • ${a.text} 
              ${a.projectId ? `<span class="project-tag">${projects.find(p => p.id === a.projectId)?.name || 'Projeto'}</span>` : ''}
            </div>
          `).join('') : '<div class="activity-text italic">Nenhuma atividade registrada.</div>'}
        </div>

        ${blockers && blockers.toLowerCase() !== 'nenhum' ? `
          <div class="blocker">
            <span class="section-title" style="color: #c53030; border-bottom-color: #fab6b6;">Impedimentos / Observações:</span>
            ${blockers}
          </div>
        ` : ''}
      </div>
    `;
  });

  reportHtml += `
      </div>
    </body>
    </html>
  `;

  const reportWindow = window.open('', '_blank');
  reportWindow.document.write(reportHtml);
  reportWindow.document.close();
  closeDailyReportModal();
}

// ── Global Help Logic ─────────────────────────────────────────
function openHelpModal() {
  syncGlobalConfig(); // Tenta atualizar do banco ao abrir
  document.getElementById('helpModalOverlay').classList.add('active');
  renderHelpContent();
  
  // Show admin actions if applicable
  const isAdmin = currentUser && (currentUser.access === 'Admin');
  const adminActions = document.getElementById('helpAdminActions');
  const helpTipFooter = document.getElementById('helpTipFooter');

  if (isAdmin) {
    adminActions.classList.remove('hidden');
    helpTipFooter.classList.remove('hidden');
  } else {
    adminActions.classList.add('hidden');
    helpTipFooter.classList.add('hidden');
  }

  // Reset to view mode
  document.getElementById('helpContentView').classList.remove('hidden');
  document.getElementById('helpContentEdit').classList.add('hidden');
  document.getElementById('btnToggleEditHelp').classList.remove('hidden');
  document.getElementById('btnSaveHelpText').classList.add('hidden');
  document.getElementById('btnCloseHelpPrimary').classList.remove('hidden');
  document.getElementById('btnToggleEditHelp').textContent = '✏️ Editar';
}

function closeHelpModal() {
  document.getElementById('helpModalOverlay').classList.remove('active');
}

function renderHelpContent() {
  const container = document.getElementById('helpContentView');
  const text = appConfig[0].helpText || 'Sem conteúdo de ajuda disponível.';
  
  const lines = text.split('\n');
  const html = lines.map(line => {
    line = line.trim();
    if (!line) return '<div style="height: 10px"></div>';

    // Imagem: ![alt](url)
    const imgMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      return `<img src="${imgMatch[2]}" alt="${imgMatch[1] || 'Imagem de ajuda'}">`;
    }

    // Títulos
    if (line.startsWith('# ')) return `<h1>${line.replace('# ', '')}</h1>`;
    if (line.startsWith('## ')) return `<h2>${line.replace('## ', '')}</h2>`;
    if (line.startsWith('### ')) return `<h3>${line.replace('### ', '')}</h3>`;

    // Q&A Blocks (P: e R:)
    if ((line.includes('P:') || line.includes('Q:')) && (line.includes('R:') || line.includes('A:'))) {
      const parts = line.split(/(R:|A:)/);
      const question = parts[0].replace(/P:|Q:/, '').trim();
      const answer = parts[2] ? parts[2].trim() : '';
      return `
        <div class="qa-block">
          <p class="qa-question"><span class="qa-question-prefix">P:</span> ${question}</p>
          <p class="qa-answer"><span class="qa-answer-prefix">R:</span> ${answer}</p>
        </div>`;
    }

    // Negrito: **texto**
    let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    return `<p>${formattedLine}</p>`;
  }).join('');

  container.innerHTML = html;
}

function toggleEditHelp() {
  const view = document.getElementById('helpContentView');
  const edit = document.getElementById('helpContentEdit');
  const btnToggle = document.getElementById('btnToggleEditHelp');
  const btnSave = document.getElementById('btnSaveHelpText');
  const btnClose = document.getElementById('btnCloseHelpPrimary');
  const input = document.getElementById('helpTextInput');
  const helpTipFooter = document.getElementById('helpTipFooter');

  if (edit.classList.contains('hidden')) {
    // Switch to edit
    view.classList.add('hidden');
    edit.classList.remove('hidden');
    btnToggle.textContent = '👁️ Visualizar';
    btnSave.classList.remove('hidden');
    btnClose.classList.add('hidden');
    helpTipFooter.classList.add('hidden'); // Esconde a dica ao editar
    
    // Mostra o texto puro (Markdown)
    input.value = appConfig[0].helpText || '';
  } else {
    // Switch to view
    view.classList.remove('hidden');
    edit.classList.add('hidden');
    btnToggle.textContent = '✏️ Editar';
    btnSave.classList.add('hidden');
    btnClose.classList.remove('hidden');
    helpTipFooter.classList.remove('hidden'); // Mostra a dica ao visualizar
    renderHelpContent();
  }
}

async function saveHelpText() {
  const newText = document.getElementById('helpTextInput').value;
  appConfig[0].helpText = newText;
  
  // O saveData já dispara a sincronização automática via interceptor syncToSupabase
  saveData(STORAGE_KEYS.appConfig, appConfig);
  
  showFeedback('Conteúdo de ajuda atualizado com sucesso!', 'success');
  toggleEditHelp();
  renderHelpContent();
}

// ══════════════════════════════════════════════════════════════
//  EXPOSE TO WINDOW (for inline onclick/onchange etc. in HTML)
// ══════════════════════════════════════════════════════════════
Object.assign(window, {
  addDailyActivity,
  addMilestone,
  adminResetPassword,
  closeAdminResetModal,
  closeDailyModal,
  closeDailyReportModal,
  closeDetailPanel,
  closeFeedbackModal,
  closeHelpModal,
  closeProjectModal,
  closeShareModal,
  closeUserModal,
  copyPrevPlannedToYesterday,
  doLogin,
  doLogout,
  editUser,
  generateDailyPeriodReport,
  generateMarkedReport,
  openDailyModal,
  openDailyReportModal,
  openHelpModal,
  openProjectModal,
  openUserModal,
  renderDailyPage,
  renderFlowDashboard,
  renderProjectsKanban,
  renderUsersTable,
  saveAdminResetPassword,
  saveDaily,
  saveHelpText,
  saveNewPassword,
  saveProject,
  saveShareChanges,
  saveUser,
  switchPage,
  toggleEditHelp,
  toggleLoginPassword,
  toggleTeamDropdown,
  // Additional utility/page functions
  renderConfigPage,
  renderProjectsPage,
  renderFlowPage,
  openChangePasswordModal,
});
