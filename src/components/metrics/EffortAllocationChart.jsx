import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { getEpicColor } from '../../lib/colorUtils';
import useAgileStore from '../../store/useAgileStore';
import ScrumCard from '../common/ScrumCard';

export default function EffortAllocationChart() {
  const { epics, userStories, tasks, confirmed_users, activeProjectId, darkMode } = useAgileStore();

  const activeProjectStories = userStories.filter(s => s.project_id === activeProjectId);
  const activeProjectTasks = tasks.filter(t => t.project_id === activeProjectId);

  // 1. Calculate Effort per Epic
  const epicEffortData = epics
    .filter(e => e.project_id === activeProjectId)
    .map(epic => {
      const epicStories = activeProjectStories.filter(s => s.epic_id === epic.id);
      
      const totalHours = epicStories.reduce((acc, story) => {
        const storyTasks = activeProjectTasks.filter(t => t.story_id === story.id);
        if (storyTasks.length > 0) {
          return acc + storyTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);
        }
        return acc + (parseFloat(story.estimated_hours) || 0);
      }, 0);

      return {
        name: epic.title,
        value: totalHours,
        epicId: epic.id
      };
    })
    .filter(e => e.value > 0);

  // 2. Calculate Effort per Member
  const memberEffortData = confirmed_users.map(user => {
    const userTasks = activeProjectTasks.filter(t => t.assigned_to === user.name);
    const assignedHours = userTasks.reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
    const actualHours = userTasks.reduce((acc, t) => acc + (parseFloat(t.actual_hours) || 0), 0);

    return {
      name: user.name.split(' ')[0],
      "Horas Planejadas": assignedHours,
      "Horas Reais": actualHours
    };
  }).sort((a, b) => b["Horas Planejadas"] - a["Horas Planejadas"]);

  const COLORS = ['#3b82f6', '#10b981', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4'];

  const totalEffort = epicEffortData.reduce((acc, e) => acc + e.value, 0);

  if (totalEffort === 0 && memberEffortData.every(m => m["Horas Planejadas"] === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-sm text-center">
          Nenhum esforço estimado planejado para o projeto atual.<br/>
          <span className="text-[10px] lowercase normal-case tracking-normal opacity-70">
            Adicione horas estimadas em suas histórias e tarefas para ver os dados de esforço.
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Alocação de Esforço</h2>
          <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Esforço Planejado e Realizado em Horas</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-xl border border-brand-primary/10 dark:border-brand-primary/20">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Total Planejado (Ativos)</p>
            <p className="text-sm font-black text-brand-primary uppercase">{totalEffort} Horas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Esforço por Épico (PieChart) */}
        <ScrumCard className="p-10 relative overflow-hidden">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Esforço por Épico</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Horas estimadas consolidadas por objetivo</p>
          </div>
          {epicEffortData.length > 0 ? (
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={epicEffortData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={6}
                    dataKey="value"
                    label={({ name, percent }) => `${name.substring(0, 10)}... (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {epicEffortData.map((entry, index) => {
                      const color = getEpicColor(entry.epicId);
                      return <Cell key={`cell-${index}`} fill={color.accentHex || COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                      fontSize: '11px', 
                      fontWeight: 'bold' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-slate-50 rounded-3xl">
              <span className="text-xs font-bold text-slate-400 uppercase">Nenhum esforço por épicos</span>
            </div>
          )}
        </ScrumCard>

        {/* Esforço por Membro (BarChart) */}
        <ScrumCard className="p-10">
          <div className="mb-8">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Esforço por Colaborador</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Horas planejadas vs. realizadas em atividades</p>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberEffortData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis dataKey="name" fontSize={10} fontWeight="black" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <YAxis fontSize={10} fontWeight="black" stroke="#94a3b8" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    color: darkMode ? '#f1f5f9' : '#1e293b'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="Horas Planejadas" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Horas Reais" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrumCard>
      </div>
    </div>
  );
}
