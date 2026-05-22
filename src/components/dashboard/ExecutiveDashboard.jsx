import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Activity, ShieldCheck, AlertCircle, 
  Crosshair, Zap, Clock, CheckCircle2 
} from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';
import StrategicMatrix from './StrategicMatrix';

export default function ExecutiveDashboard({ projects, tasks, userStories, confirmedUsers, activeProjectId, viewMode }) {
  const { darkMode } = useAgileStore();

  // 1. Cálculos de Alto Nível
  const activeProjectIds = (projects || []).filter(p => p && p.status === 'active').map(p => p.id);
  const filteredProjects = viewMode === 'single' 
    ? (projects || []).filter(p => p && p.id === activeProjectId)
    : (projects || []).filter(p => p && p.status === 'active');


  const totalH = userStories.reduce((acc, s) => {
    if (viewMode === 'single' && s.project_id !== activeProjectId) return acc;
    if (viewMode === 'all' && !activeProjectIds.includes(s.project_id)) return acc;
    const sTasks = (tasks || []).filter(t => t && t.story_id === s.id);
    return acc + (sTasks.length > 0 ? sTasks.reduce((tA, t) => tA + (parseFloat(t.estimated_hours) || 0), 0) : (parseFloat(s.estimated_hours) || 0));
  }, 0);


  const doneH = userStories.reduce((acc, s) => {
    if (viewMode === 'single' && s.project_id !== activeProjectId) return acc;
    if (viewMode === 'all' && !activeProjectIds.includes(s.project_id)) return acc;
    const sTasks = (tasks || []).filter(t => t && t.story_id === s.id && t.status === 'done');
    return acc + sTasks.reduce((tA, t) => tA + (parseFloat(t.estimated_hours) || 0), 0);
  }, 0);


  const progress = totalH > 0 ? (doneH / totalH) * 100 : 0;
  
  // Health Score (Fictício baseado em desvio de horas e progresso)
  const healthScore = Math.min(100, Math.max(0, 100 - (progress < 20 ? 30 : 0)));

  return (
    <div className="flex flex-col gap-8">
      {/* KPI Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-6 pl-8">
           <p className="text-sm font-semibold text-slate-500 mb-2">Saúde do Portfólio</p>
           <div className="flex items-baseline gap-2">
             <h3 className="text-4xl font-bold text-slate-800">{Math.round(healthScore)}%</h3>
             <TrendingUp size={20} className="text-[var(--primary-blue)]" />
           </div>
           <p className="text-xs font-medium text-[var(--primary-blue)] mt-2">Estável & Saudável</p>
        </div>

        <div className="glass-card p-6 pl-8">
           <p className="text-sm font-semibold text-slate-500 mb-2">Progresso de Entrega</p>
           <div className="flex items-baseline gap-2">
             <h3 className="text-4xl font-bold text-slate-800">{Math.round(progress)}%</h3>
           </div>
           <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--primary-blue)] to-[var(--deep-blue)] h-full rounded-full" style={{ width: `${progress}%` }} />
           </div>
        </div>

        <div className="glass-card p-6 pl-8">
           <p className="text-sm font-semibold text-slate-500 mb-2">Projetos Ativos</p>
           <div className="flex items-center gap-3">
             <h3 className="text-4xl font-bold text-slate-800">{filteredProjects.length}</h3>
           </div>
        </div>

        <div className="bg-gradient-to-br from-[var(--deep-navy)] to-[var(--deep-blue)] p-6 rounded-2xl shadow-premium text-white relative overflow-hidden">
           <p className="text-sm font-medium text-[var(--ice-blue)] opacity-80 mb-2">Esforço Restante</p>
           <h3 className="text-4xl font-bold">{totalH - doneH}h</h3>
           <p className="text-xs font-medium text-slate-300 mt-2">A realizar</p>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card flex flex-col p-8">
           <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-xl font-bold text-slate-800">Análise de Burn Rate</h4>
                <p className="text-sm font-medium text-slate-500 mt-1">Histórico de Velocidade vs Capacidade</p>
              </div>
              <div className="p-3 bg-[var(--ice-blue)] text-[var(--primary-blue)] rounded-xl">
                <Activity size={20} />
              </div>
           </div>
           
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="99%" height="100%">
               <AreaChart data={[{n: 'S1', v: 40, c: 45}, {n: 'S2', v: 35, c: 45}, {n: 'S3', v: 48, c: 45}, {n: 'S4', v: 52, c: 45}]}>
                 <defs>
                   <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#000000" stopOpacity={0.2}/>
                     <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                 <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#000'}} />
                 <Tooltip contentStyle={{ borderRadius: '0px', border: '2px solid #000', backgroundColor: '#fff', color: '#000' }} />
                 <Area type="monotone" dataKey="v" stroke="#000" strokeWidth={4} fillOpacity={1} fill="url(#colorV)" />
                 <Line type="monotone" dataKey="c" stroke="#8A8A8A" strokeWidth={2} strokeDasharray="5 5" dot={false} />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="lg:col-span-2">
           <StrategicMatrix 
              projects={projects} 
              tasks={tasks} 
              confirmedUsers={confirmedUsers} 
              darkMode={false}
           />
        </div>
      </div>
    </div>
  );
}
