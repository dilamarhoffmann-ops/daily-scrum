import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, Layers, Calendar, Kanban, BarChart3, Settings, LogOut, Plus, 
  ArrowRight, Clock, CheckCircle2, AlertCircle, Users, MessageSquare, Search, RotateCcw,
  Shield, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Pause, Play
} from 'lucide-react';
import useAgileStore from './store/useAgileStore';
import ProductBacklog from './components/backlog/ProductBacklog';
import SprintPlanning from './components/planning/SprintPlanning';
import KanbanBoard from './components/kanban/KanbanBoard';
import DailyMeeting from './components/daily/DailyMeeting';
import SprintReview from './components/review/SprintReview';
import SprintRetrospective from './components/retro/SprintRetrospective';
import BurndownChart from './components/metrics/BurndownChart';
import BurnupChart from './components/metrics/BurnupChart';
import CycleTimeScatterplot from './components/metrics/CycleTimeScatterplot';
import EffortAllocationChart from './components/metrics/EffortAllocationChart';
import SettingsView from './components/settings/SettingsView';
import LoginView from './components/auth/LoginView';
import Modal from './components/common/Modal';
import { getWorkingDays } from './lib/agileUtils';
import SprintBurndown from './components/dashboard/SprintBurndown';
import TeamEngagement from './components/dashboard/TeamEngagement';
import ExecutiveDashboard from './components/dashboard/ExecutiveDashboard';
import ScrumCard from './components/common/ScrumCard';
import ExecutiveReports from './components/metrics/ExecutiveReports';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button 
    onClick={onClick} 
    className={`sidebar-item group ${active ? `sidebar-item-active` : 'sidebar-item-inactive'} ${collapsed ? 'justify-center px-0 w-11 h-11' : ''}`}
    title={collapsed ? label : undefined}
  >
    <Icon size={16} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-800 transition-colors'} />
    {!collapsed && <span className="font-semibold text-sm transition-all duration-300">{label}</span>}
  </button>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-20 text-center">
          <h1 className="text-2xl font-black text-rose-600 mb-4">Erro de Renderização</h1>
          <pre className="p-4 bg-slate-100 rounded-xl text-left overflow-auto text-xs">
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-8 px-6 py-2 bg-brand-primary text-white rounded-xl">
            Tentar Novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {


  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('single');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', methodology: 'Scrum' });
  const [metricsView, setMetricsView] = useState('burndown');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResumeConfirmOpen, setIsResumeConfirmOpen] = useState(false);

  const { 
    fetchData, initializeAuth, isAuthenticated, user, logout, projects, activeProjectId, 
    setActiveProject, addProject, archiveProject, unarchiveProject, resumeProject, reorderProjects, confirmed_users, 
    sprints, tasks, userStories
  } = useAgileStore();

  useEffect(() => {
    console.log('🚀 App Initializing...');
    initializeAuth();
    fetchData();
  }, []);

  
  // Removed dark mode logic

  const activeProject = projects.find(p => p.id === activeProjectId);
  
  const getPauseInfo = (reason) => {
    if (!reason) return { taskName: '', justification: '' };
    try {
      const parsed = JSON.parse(reason);
      if (parsed && typeof parsed === 'object' && 'taskName' in parsed) {
        return { taskName: parsed.taskName, justification: parsed.justification || '' };
      }
    } catch (e) {}
    return { taskName: '', justification: reason };
  };
  const pauseInfo = getPauseInfo(activeProject?.paused_reason);

  const activeSprint = sprints.find(s => s.status === 'active' && s.project_id === activeProjectId) || sprints.find(s => s.project_id === activeProjectId);
  const activeProjectIds = projects.filter(p => p.status === 'active').map(p => p.id);

  // Executive Metrics Logic
  const filteredStories = viewMode === 'single' 
    ? userStories.filter(s => s.project_id === activeProjectId)
    : userStories.filter(s => activeProjectIds.includes(s.project_id));

  const totalProjectHours = (filteredStories || []).reduce((acc, story) => {
    const storyTasks = (tasks || []).filter(t => t && t.story_id === story.id);
    if (storyTasks.length > 0) {
      return acc + storyTasks.reduce((tAcc, t) => tAcc + (parseFloat(t.estimated_hours) || 0), 0);
    }
    return acc + (parseFloat(story.estimated_hours) || 0);
  }, 0);

  const finishedHours = (filteredStories || []).reduce((acc, story) => {
    const storyTasks = (tasks || []).filter(t => t && t.story_id === story.id);
    if (storyTasks.length > 0) {
      return acc + storyTasks
        .filter(t => t.status === 'done')
        .reduce((tAcc, t) => tAcc + (parseFloat(t.estimated_hours) || 0), 0);
    }
    return story.status === 'done' ? acc + (parseFloat(story.estimated_hours) || 0) : acc;
  }, 0);

  const remainingHours = Math.max(0, totalProjectHours - finishedHours);
  
  // Resource Allocation Logic
  const userStatsMap = (confirmed_users || []).reduce((acc, u) => {
    if (u && u.name) {
      acc[u.name] = { hours: 0, actualHours: 0, projectIds: new Set() };
    }
    return acc;
  }, {});


  const currentTasks = viewMode === 'single' 
    ? (tasks || []).filter(t => t && t.project_id === activeProjectId)
    : (tasks || []).filter(t => t && activeProjectIds.includes(t.project_id));

  currentTasks.forEach(task => {
    if (task.assigned_to && userStatsMap[task.assigned_to]) {
      userStatsMap[task.assigned_to].hours += (parseFloat(task.estimated_hours) || 0);
      userStatsMap[task.assigned_to].actualHours += (parseFloat(task.actual_hours) || 0);
      userStatsMap[task.assigned_to].projectIds.add(task.project_id);
    }
  });

  const totalActualHours = currentTasks.reduce((acc, t) => acc + (parseFloat(t.actual_hours) || 0), 0);
  const hourVariance = totalActualHours - totalProjectHours;

  const involvedUsers = (confirmed_users || [])
    .map(u => ({ 
      ...u, 
      assignedHours: userStatsMap[u?.name]?.hours || 0,
      actualHours: userStatsMap[u?.name]?.actualHours || 0,
      projectCount: userStatsMap[u?.name]?.projectIds.size || 0
    }))
    .filter(u => viewMode === 'all' || u.assignedHours > 0 || u.role === 'Gestor' || u.role === 'Product Owner')
    .sort((a, b) => b.assignedHours - a.assignedHours);


  const workingDays = getWorkingDays(activeSprint?.start_date, activeSprint?.end_date) || 10;
  const totalCapacity = (confirmed_users || []).reduce((acc, u) => {
    return acc + ((u?.daily_hours || 8) * workingDays * 0.8);
  }, 0);


  useEffect(() => {
    if (isAuthenticated) {
       fetchData();
    }
  }, [isAuthenticated, fetchData]);

  if (!isAuthenticated) return <LoginView />;

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-[var(--bg-main)] text-slate-800 font-sans">

      {/* Sidebar */}
      <aside className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20 p-4' : 'w-72 p-8'} bg-white border-r border-slate-100 flex flex-col gap-8 relative z-50 shadow-sm`}>
        {/* Toggle Collapse Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer transition-all z-[100]"
          title={isSidebarCollapsed ? "Expandir Menu" : "Recuar Menu"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={10} strokeWidth={3} />
          ) : (
            <ChevronLeft size={10} strokeWidth={3} />
          )}
        </button>

        <div className={`flex items-center gap-4 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2'}`}>
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--primary-blue)] to-[var(--deep-blue)] flex items-center justify-center rounded-xl shadow-md shrink-0">
            <Layers className="text-white" size={22} />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col transition-all duration-300">
              <span className="text-xl font-bold text-slate-800 leading-none">
                Scrum
              </span>
              <span className="text-xs font-semibold text-slate-500 mt-0.5">
                Time Apoio
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={isSidebarCollapsed} />
          <div className="h-4" />
          {!isSidebarCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-4">Projetos Ativos</p>}
          <div className={`flex flex-col ${isSidebarCollapsed ? 'items-center gap-2' : 'gap-1.5 px-2'} mb-6`}>
            {projects
              .filter(p => p.status === 'active' || p.status === 'paused')
              .map(p => {
                if (isSidebarCollapsed) {
                  const isActive = activeProjectId === p.id;
                  const isPaused = p.status === 'paused';
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveProject(p.id)}
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-black transition-all relative ${
                        isActive 
                          ? isPaused 
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                            : 'bg-[var(--primary-blue)] text-white shadow-md shadow-blue-500/20' 
                          : isPaused
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200/50'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/50'
                      }`}
                      title={isPaused ? `${p.name} (Pausado)` : p.name}
                    >
                      {p.name.substring(0, 2).toUpperCase()}
                      {isPaused && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 border border-white rounded-full flex items-center justify-center text-[7px] text-white">
                          ⏸
                        </span>
                      )}
                    </button>
                  );
                }
                const isPaused = p.status === 'paused';
                return (
                  <div 
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl group transition-all ${
                      activeProjectId === p.id 
                        ? isPaused
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-[var(--primary-blue)] text-white shadow-md' 
                        : isPaused
                          ? 'bg-amber-50/50 text-amber-700 hover:bg-amber-50 border border-amber-100/50'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <button 
                      onClick={() => setActiveProject(p.id)}
                      className="flex-1 text-left px-4 py-3 text-sm font-semibold truncate flex items-center gap-2"
                    >
                      {isPaused && <Pause size={10} fill="currentColor" />}
                      {p.name}
                      {isPaused && <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded ml-auto">Pausado</span>}
                    </button>
                    
                    {/* Up/Down Priority Controls */}
                    <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                      <button 
                        onClick={(e) => { e.stopPropagation(); reorderProjects(p.id, 'up'); }}
                        className={`p-1 rounded-md transition-all ${
                          activeProjectId === p.id 
                            ? 'hover:bg-white/20 text-white/70 hover:text-white' 
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Subir Prioridade"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); reorderProjects(p.id, 'down'); }}
                        className={`p-1 rounded-md transition-all ${
                          activeProjectId === p.id 
                            ? 'hover:bg-white/20 text-white/70 hover:text-white' 
                            : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
                        }`}
                        title="Baixar Prioridade"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>
                    
                    {activeProjectId === p.id && <div className="w-1.5 h-1.5 bg-white rounded-full mr-4 shrink-0" />}
                  </div>
                );
              })}
          </div>

          {!isSidebarCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-3 mt-2">Lifecycle Management</p>}
          <SidebarItem icon={Layers} label="Product Backlog" active={activeTab === 'backlog'} onClick={() => setActiveTab('backlog')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={Calendar} label="Sprint Planning" active={activeTab === 'planning'} onClick={() => setActiveTab('planning')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={Kanban} label="Sprint Backlog" active={activeTab === 'board'} onClick={() => setActiveTab('board')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={MessageSquare} label="Daily Meeting" active={activeTab === 'daily'} onClick={() => setActiveTab('daily')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={Search} label="Sprint Review" active={activeTab === 'review'} onClick={() => setActiveTab('review')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={RotateCcw} label="Retrospective" active={activeTab === 'retro'} onClick={() => setActiveTab('retro')} collapsed={isSidebarCollapsed} />
          <div className="h-4" />
          <SidebarItem icon={BarChart3} label="Performance Metrics" active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')} collapsed={isSidebarCollapsed} />
          
          {projects.some(p => p.status === 'archived') && !isSidebarCollapsed && (
            <>
              <div className="h-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 mb-2">Arquivados</p>
              <div className="flex flex-col gap-1 px-2 opacity-60">
                {projects.filter(p => p.status === 'archived').map(p => (
                  <button 
                    key={p.id}
                    onClick={() => setActiveProject(p.id)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeProjectId === p.id 
                        ? 'bg-slate-100 text-slate-900' 
                        : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    📁 {p.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </nav>

        <div className={`mt-auto pt-6 border-t-2 border-slate-200 ${isSidebarCollapsed ? 'flex flex-col items-center gap-3 px-0' : 'space-y-1'}`}>
          <SidebarItem icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={isSidebarCollapsed} />
          {isSidebarCollapsed ? (
            <button 
              onClick={logout}
              className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all mt-2 cursor-pointer"
              title="Encerrar Sessão"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all mt-2 cursor-pointer"
            >
              <LogOut size={14} />
              <span className="text-sm font-semibold">Encerrar Sessão</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6 py-10 overflow-auto">
        <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-4">
               <h1 className="text-3xl font-bold text-slate-800 leading-none">
                 {activeProject?.name || 'Agile Engine'}
               </h1>
                {activeProject?.status === 'archived' && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">ARQUIVADO</span>
                )}
                {activeProject?.status === 'paused' && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                    <Pause size={10} fill="currentColor" /> PAUSADO
                  </span>
                )}
             </div>
            <div className="flex items-center gap-3 mt-2">
               <div className="flex items-center gap-2 text-[var(--primary-blue)] font-semibold text-sm bg-[var(--ice-blue)] bg-opacity-20 px-3 py-1 rounded-full">
                 <Shield className="w-4 h-4" />
                 {user?.role || 'Sprint Team Member'}
               </div>
               <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
               <div className="text-sm font-medium text-slate-500">
                 Acesso Seguro Concedido
               </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeProject && activeProject.status === 'archived' && (user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente' || user?.role === 'Administrador' || user?.role === 'Admin') && (
              <button 
                onClick={() => {
                  if (window.confirm(`Deseja restaurar o produto "${activeProject.name}"? Ele voltará para a lista de ativos.`)) {
                    unarchiveProject(activeProjectId);
                  }
                }}
                className="bg-transparent text-brand-success hover:bg-brand-success hover:text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 border-brand-success flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                <RotateCcw size={14} /> Restaurar Produto
              </button>
            )}
            {activeProject && (activeProject.status === 'active' || activeProject.status === 'paused') && (user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente' || user?.role === 'Administrador' || user?.role === 'Admin') && (
              <button 
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="bg-transparent text-[#8B0000] hover:bg-[#8B0000] hover:text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 border-[#8B0000] flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              >
                Excluir/Arquivar Produto
              </button>
            )}
          </div>
        </header>

        {activeProject?.status === 'paused' && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-fade-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
                <Pause size={20} fill="currentColor" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Aviso: Projeto Pausado</span>
                <p className="text-sm font-semibold text-slate-850">
                  Todas as interações estão em modo somente leitura (read-only) por decisão estratégica.
                </p>
                {pauseInfo.taskName && (
                  <p className="text-xs font-bold text-amber-900 mt-1 flex items-center gap-1.5">
                    <span className="font-extrabold uppercase text-[9px] tracking-wide px-2 py-0.5 bg-amber-200/60 rounded border border-amber-300/40 text-amber-900">Tarefa:</span>
                    "{pauseInfo.taskName}"
                  </p>
                )}
                {pauseInfo.justification && (
                  <p className="text-xs font-bold text-amber-800 bg-amber-100/50 px-3 py-1.5 rounded-lg border border-amber-200/30 mt-1.5 max-w-2xl leading-relaxed">
                    <span className="font-extrabold uppercase text-[9px] tracking-wide block mb-0.5 opacity-80">Justificativa da Pausa:</span>
                    "{pauseInfo.justification}"
                  </p>
                )}
              </div>
            </div>
            
            {(user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente' || user?.role === 'Administrador' || user?.role === 'Admin') && (
              <button
                onClick={() => setIsResumeConfirmOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-amber-500/25 flex items-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0 border-none"
              >
                <Play size={12} fill="currentColor" /> Retomar Projeto
              </button>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            {/* Header de Controle do Dashboard */}
            <div className="flex justify-between items-center glass-card p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--ice-blue)] flex items-center justify-center text-[var(--primary-blue)] rounded-xl">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 leading-none">Scrum Compass</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Direcionamento Estratégico do Time</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setViewMode('single')}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'single' ? 'bg-white text-[var(--primary-blue)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Projeto Atual
                    </button>
                    <button 
                       onClick={() => setViewMode('all')}
                       className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'all' ? 'bg-white text-[var(--primary-blue)] shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                      Portfólio Global
                    </button>
                </div>
            </div>

            <ExecutiveDashboard 
              projects={projects}
              tasks={tasks}
              userStories={userStories}
              confirmedUsers={confirmed_users}
              activeProjectId={activeProjectId}
              viewMode={viewMode}
            />


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Seção Lateral: Burndown ou Lista de Projetos (Espaço Reduzido) */}
              <ScrumCard className="lg:col-span-1 relative overflow-hidden">


                <div className="flex justify-between items-center mb-8 border-b-2 border-slate-200 pb-4">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                      {viewMode === 'single' ? 'Fluxo de Queima (Burndown)' : 'Saúde do Portfólio'}
                    </h3>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mt-1">
                      {viewMode === 'single' ? 'Acompanhamento diário da Sprint' : 'Progresso consolidado por projeto'}
                    </p>
                  </div>
                </div>

                {viewMode === 'single' ? (
                  <SprintBurndown 
                    sprint={activeSprint}
                    tasks={tasks.filter(t => t.project_id === activeProjectId)}
                    confirmedUsers={confirmed_users}
                    userStories={userStories}
                  />
                ) : (
                  <div className="space-y-6">
                    {projects.filter(p => p.status === 'active').map(project => {
                      const projStories = userStories.filter(s => s.project_id === project.id);
                      const projTasks = tasks.filter(t => t.project_id === project.id);
                      const totalH = projStories.reduce((acc, s) => {
                          const sTasks = projTasks.filter(t => t.story_id === s.id);
                          return acc + (sTasks.length > 0 ? sTasks.reduce((tA, t) => tA + (parseFloat(t.estimated_hours) || 0), 0) : (parseFloat(s.estimated_hours) || 0));
                      }, 0);
                      const doneH = projStories.reduce((acc, s) => {
                          const sTasks = projTasks.filter(t => t.story_id === s.id && t.status === 'done');
                          return acc + sTasks.reduce((tA, t) => tA + (parseFloat(t.estimated_hours) || 0), 0);
                      }, 0);
                      const progress = totalH > 0 ? (doneH / totalH) * 100 : 0;

                      return (
                        <div key={project.id} className="group p-5 bg-white rounded-none border-2 border-slate-200 transition-all hover:bg-neutral-50 relative overflow-hidden">
                          <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-none border-2 border-slate-200 flex items-center justify-center font-black text-slate-800`}>
                                  {Math.round(progress)}%
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tighter">{project.name}</h4>
                                  <p className="text-[10px] font-bold text-neutral-500 uppercase">{project.methodology} Engine</p>
                                </div>
                            </div>
                            <button onClick={() => { setActiveProject(project.id); setViewMode('single'); }} className="opacity-0 group-hover:opacity-100 transition-all p-3 border-2 border-slate-200 bg-white rounded-none hover:bg-slate-800 hover:text-white">
                              <ArrowRight size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 h-3 bg-white border-2 border-slate-200 rounded-none overflow-hidden relative">
                                <div className={`h-full transition-all duration-1000 bg-slate-800`} style={{ width: `${progress}%` }}></div>
                             </div>
                             <span className="text-[12px] font-black text-slate-800 tabular-nums">{doneH}h / {totalH}h</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrumCard>

              {/* Seção Principal: Saúde Operacional do Time (Espaço Expandido) */}
              <ScrumCard className="lg:col-span-2 flex flex-col border-none shadow-none bg-transparent p-0 gap-8">

                <div>
                <TeamEngagement 
                  involvedUsers={involvedUsers}
                  workingDays={workingDays}
                />

                </div>

                <div className="bg-white p-6 rounded-none border-2 border-slate-200">
                   <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4">Apoio Estratégico</h4>
                   <p className="text-xs text-slate-800 font-bold leading-relaxed uppercase tracking-wide">
                     O Dashboard está exibindo dados calculados em tempo real com base no {viewMode === 'single' ? 'Projeto Atual' : 'Portfólio Global de Ativos'}.
                   </p>
                </div>
              </ScrumCard>
            </div>
          </div>
        )}

        {activeTab === 'backlog' && <ProductBacklog />}
        {activeTab === 'planning' && <SprintPlanning />}
        {activeTab === 'board' && <KanbanBoard />}
        {activeTab === 'daily' && <DailyMeeting />}
        {activeTab === 'review' && <SprintReview />}
        {activeTab === 'retro' && <SprintRetrospective />}
        {activeTab === 'metrics' && (
          <div className="flex flex-col gap-8">
            <div className="flex bg-white p-1 rounded-none border-2 border-slate-200 w-fit flex-wrap gap-2 md:gap-0">
              <button 
                onClick={() => setMetricsView('burndown')}
                className={`px-6 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${metricsView === 'burndown' ? 'bg-slate-800 text-white' : 'text-neutral-500 hover:text-slate-800 bg-transparent'}`}
              >
                Sprint Burndown
              </button>
              <button 
                onClick={() => setMetricsView('burnup')}
                className={`px-6 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${metricsView === 'burnup' ? 'bg-slate-800 text-white' : 'text-neutral-500 hover:text-slate-800 bg-transparent'}`}
              >
                Sprint Burnup
              </button>
              <button 
                onClick={() => setMetricsView('scatterplot')}
                className={`px-6 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${metricsView === 'scatterplot' ? 'bg-slate-800 text-white' : 'text-neutral-500 hover:text-slate-800 bg-transparent'}`}
              >
                Cycle Time
              </button>
              <button 
                onClick={() => setMetricsView('allocation')}
                className={`px-6 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${metricsView === 'allocation' ? 'bg-slate-800 text-white' : 'text-neutral-500 hover:text-slate-800 bg-transparent'}`}
              >
                Alocação de Esforço
              </button>
              <button 
                onClick={() => setMetricsView('reports')}
                className={`px-6 py-3 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all ${metricsView === 'reports' ? 'bg-slate-800 text-white' : 'text-neutral-500 hover:text-slate-800 bg-transparent'}`}
              >
                Relatórios Executivos
              </button>
            </div>
            
            {metricsView === 'burndown' && <BurndownChart />}
            {metricsView === 'burnup' && <BurnupChart />}
            {metricsView === 'scatterplot' && <CycleTimeScatterplot />}
            {metricsView === 'allocation' && <EffortAllocationChart />}
            {metricsView === 'reports' && <ExecutiveReports />}
          </div>
        )}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Criar Novo Projeto">
        <form 
          onSubmit={(e) => { 
            e.preventDefault(); 
            addProject(newProjectData);
            setIsProjectModalOpen(false); 
            setNewProjectData({ name: '', methodology: 'Scrum' });
          }} 
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome do Projeto</label>
            <input 
              required 
              className="input-field" 
              placeholder="Ex: Agile Sphere Engine" 
              value={newProjectData.name}
              onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-4">Inicializar Projeto</button>
        </form>
      </Modal>

      <Modal 
        isOpen={isDeleteConfirmOpen} 
        onClose={() => setIsDeleteConfirmOpen(false)} 
        title="⚠️ ATENÇÃO: Confirmar Exclusão"
      >
        <div className="flex flex-col gap-6 text-center">
          <div className="mx-auto w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-200/50">
            <AlertCircle size={32} className="text-rose-600 animate-pulse" />
          </div>
          <div className="space-y-3">
            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              Deseja realmente excluir/arquivar o produto <span className="font-bold text-slate-800">"{activeProject?.name}"</span>?
            </p>
            <p className="text-slate-400 text-xs leading-normal">
              Esta ação removerá o produto da lista de ativos e o ocultará do painel principal de execução.
            </p>
          </div>
          
          <div className="flex gap-4 mt-2">
            <button 
              type="button"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 border-none"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => {
                archiveProject(activeProjectId);
                setIsDeleteConfirmOpen(false);
              }}
              className="flex-1 px-5 py-3.5 bg-[#8B0000] hover:bg-[#a00000] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-rose-900/10 border-none"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isResumeConfirmOpen} 
        onClose={() => setIsResumeConfirmOpen(false)} 
        title="▶️ Confirmar Retomada de Projeto"
      >
        <div className="flex flex-col gap-6 text-center">
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-200/50">
            <Play size={32} className="text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-3">
            <p className="text-slate-655 text-sm font-semibold leading-relaxed">
              Deseja retomar o projeto <span className="font-bold text-slate-800">"{activeProject?.name}"</span>?
            </p>
            <p className="text-slate-400 text-xs leading-normal">
              Ele voltará para o estado ativo e as edições serão liberadas.
            </p>
          </div>
          
          <div className="flex gap-4 mt-2">
            <button 
              type="button"
              onClick={() => setIsResumeConfirmOpen(false)}
              className="flex-1 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 border-none"
            >
              Cancelar
            </button>
            <button 
              type="button"
              onClick={() => {
                resumeProject(activeProjectId);
                setIsResumeConfirmOpen(false);
              }}
              className="flex-1 px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md shadow-amber-500/25 border-none"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>
      </div>
    </ErrorBoundary>
  );
}

