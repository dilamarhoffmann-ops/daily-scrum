import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend 
} from 'recharts';
import { 
  FileText, Download, Users, Clock, Crosshair, 
  Activity, Briefcase, ChevronRight 
} from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';
import ScrumCard from '../common/ScrumCard';

export default function ExecutiveReports() {
  const { projects, tasks, userStories, confirmed_users, activeProjectId } = useAgileStore();

  // 1. Data Processing
  const activeProjects = projects.filter(p => p.status === 'active');
  
  // Project Metrics Map
  const projectMetrics = activeProjects.map(proj => {
    const projStories = userStories.filter(s => s.project_id === proj.id);
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    
    const members = new Set();
    projTasks.forEach(t => t.assigned_to && members.add(t.assigned_to));
    projStories.forEach(s => s.assigned_to && members.add(s.assigned_to));

    const totalEst = projTasks.reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
    const totalAct = projTasks.reduce((acc, t) => acc + (parseFloat(t.actual_hours) || 0), 0);
    const doneTasks = projTasks.filter(t => t.status === 'done');
    const progress = projTasks.length > 0 ? (doneTasks.length / projTasks.length) * 100 : 0;

    return {
      id: proj.id,
      name: proj.name,
      members: members.size,
      estimated: totalEst,
      actual: totalAct,
      progress: Math.round(progress),
      status: proj.status
    };
  });

  // Team Utilization (Hours vs Capacity)
  const teamMetrics = confirmed_users.map(user => {
    const userTasks = tasks.filter(t => t.assigned_to === user.name);
    const assignedHrs = userTasks.reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
    const actualHrs = userTasks.reduce((acc, t) => acc + (parseFloat(t.actual_hours) || 0), 0);
    const capacity = 160; // Assuming 160h per month or similar
    const utilization = Math.min(100, (assignedHrs / capacity) * 100);

    return {
      name: user.name.split(' ')[0],
      assigned: assignedHrs,
      actual: actualHrs,
      utilization: Math.round(utilization)
    };
  }).sort((a, b) => b.assigned - a.assigned);

  const totalPortfolioHours = projectMetrics.reduce((acc, p) => acc + p.estimated, 0);
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8B0000', '#8b5cf6', '#06b6d4'];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header com Botões de Ação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20">
            <FileText size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Relatórios Executivos</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <Activity size={12} className="text-brand-success" /> Inteligência de Dados em Tempo Real
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 no-print">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg"
          >
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Grid de KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Projetos Ativos', value: activeProjects.length, icon: Briefcase, color: 'text-brand-primary' },
          { label: 'Time Envolvido', value: confirmed_users.length, icon: Users, color: 'text-brand-success' },
          { label: 'Carga Total', value: `${totalPortfolioHours}h`, icon: Clock, color: 'text-brand-yellow' },
          { label: 'Eficiência Geral', value: '94%', icon: Crosshair, color: 'text-brand-cyan' }
        ].map((kpi, i) => (
          <ScrumCard key={i} className="flex flex-col gap-4 p-6 group hover:border-brand-primary/30">
            <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 w-fit ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
              <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mt-1">{kpi.value}</p>
            </div>
          </ScrumCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Análise de Carga do Time */}
        <ScrumCard className="p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Ocupação do Time</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">% de Alocação por Membro</p>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamMetrics} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" fontSize={10} fontWeight="black" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} fontSize={10} fontWeight="black" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
                  {teamMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.utilization > 80 ? '#8B0000' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrumCard>

        {/* Distribuição de Horas por Projeto */}
        <ScrumCard className="p-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Esforço por Ativo</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Horas Estimadas Consolidadas</p>
            </div>
          </div>
          <div className="h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectMetrics}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="estimated"
                  label={({ name, percent }) => `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {projectMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ScrumCard>
      </div>

      {/* Lista Detalhada de Projetos */}
      <ScrumCard className="p-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Detalhamento por Projeto</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Status de Entrega e Envolvimento</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Projeto</th>
                <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipe</th>
                <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</th>
                <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Horas Est.</th>
                <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Horas Real.</th>
                <th className="pb-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {projectMetrics.map((proj) => (
                <tr key={proj.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="py-6">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{proj.name}</p>
                    <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Ativo</span>
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{proj.members} membros</span>
                    </div>
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-3 w-40">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-success transition-all" style={{ width: `${proj.progress}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-800 dark:text-white tabular-nums">{proj.progress}%</span>
                    </div>
                  </td>
                  <td className="py-6 text-right">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200">{proj.estimated}h</span>
                  </td>
                  <td className="py-6 text-right">
                    <span className="text-xs font-black text-brand-success">{proj.actual}h</span>
                  </td>
                  <td className="py-6 text-right">
                    <button className="p-2 text-slate-300 hover:text-brand-primary transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrumCard>
    </div>
  );
}
