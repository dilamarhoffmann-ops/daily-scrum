import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import useAgileStore from '../../store/useAgileStore';
import { getWorkingDays } from '../../lib/agileUtils';

export default function BurnupChart() {
  const { sprints, tasks, confirmed_users, activeProjectId, userStories, darkMode } = useAgileStore();
  
  const activeSprint = sprints.find(s => s.status === 'active' && s.project_id === activeProjectId) || sprints.find(s => s.project_id === activeProjectId);

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-sm">Sem Sprint Ativa</p>
      </div>
    );
  }

  // 1. Calculate Hybrid Sprint Scope
  const sprintStories = (userStories || []).filter(s => s && s.sprint_id === activeSprint.id);
  
  const sprintItems = sprintStories.map(story => {
    const storyTasks = (tasks || []).filter(t => t.story_id === story.id);
    if (storyTasks.length > 0) {
      return { type: 'tasks', items: storyTasks };
    }
    return { type: 'story', items: [story] };
  });

  const sprintScope = sprintItems.reduce((acc, group) => {
    const groupHours = group.items.reduce((sum, item) => sum + (item.estimated_hours || 0), 0);
    return acc + groupHours;
  }, 0);

  if (sprintScope === 0 && sprintStories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-sm">Nenhum item vinculado a esta sprint ainda</p>
      </div>
    );
  }

  // 2. Calculation Logic for Burnup
  const workingDays = getWorkingDays(activeSprint.start_date, activeSprint.end_date) || 10;
  const startDate = new Date(activeSprint.start_date);
  const chartData = [];
  const idealStep = sprintScope / workingDays;

  for (let i = 0; i <= workingDays; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const actualCompletedValue = sprintItems.reduce((acc, group) => {
      const groupCompleted = group.items.reduce((sum, item) => {
        if (item.status === 'done') {
          const compDate = item.completed_at ? new Date(item.completed_at) : (item.created_at ? new Date(item.created_at) : startDate);
          const dayDiff = Math.floor((compDate - startDate) / (1000 * 60 * 60 * 24));
          if (dayDiff <= i) {
            return sum + (item.estimated_hours || 0);
          }
        }
        return sum;
      }, 0);
      return acc + groupCompleted;
    }, 0);

    const idealCompletedValue = Math.min(sprintScope, idealStep * i);

    chartData.push({
      day: `Dia ${i}`,
      scope: sprintScope,
      ideal: parseFloat(idealCompletedValue.toFixed(1)),
      real: i <= Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)) ? parseFloat(actualCompletedValue.toFixed(1)) : null
    });
  }

  const latestPoint = [...chartData].reverse().find(d => d.real !== null);
  const totalCapacity = (confirmed_users || []).reduce((acc, u) => acc + ((u?.daily_hours || 8) * workingDays), 0);
  const totalCompleted = latestPoint ? latestPoint.real : 0;
  const efficiency = totalCapacity > 0 ? (totalCompleted / totalCapacity).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Sprint Burnup</h2>
          <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Sprint: {activeSprint.goal}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200/50">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Escopo Total</p>
            <p className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase">{sprintScope} Horas</p>
          </div>
          <div className="px-4 py-2 bg-brand-success/5 dark:bg-brand-success/10 rounded-xl border border-brand-success/10 dark:border-brand-success/20">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Total Entregue</p>
            <p className="text-sm font-black text-brand-success uppercase">{totalCompleted} Horas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] p-10 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Progresso Acumulado (Burnup)</h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full">X: Dias | Y: Horas</span>
          </div>
          
          <div className="h-[400px]" style={{ minHeight: '400px' }}>
            <ResponsiveContainer width="99%" height="100%" minHeight={400}>
              <AreaChart data={chartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                   dataKey="day" 
                   stroke={darkMode ? "#475569" : "#94a3b8"} 
                   fontSize={10} 
                   fontWeight="bold"
                   tickLine={false}
                   axisLine={false}
                />
                <YAxis 
                  domain={[0, Math.max(10, sprintScope + 10)]} 
                  stroke={darkMode ? "#475569" : "#94a3b8"} 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: darkMode ? '#f1f5f9' : '#1e293b'
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', wrapperStyle: { marginTop: '20px' } }} />
                
                {/* Scope Line - Flat Target */}
                <Area 
                  type="monotone" 
                  dataKey="scope" 
                  name="Escopo Total" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fill="rgba(239, 68, 68, 0.02)"
                />

                {/* Ideal Progress Line */}
                <Area 
                  type="monotone" 
                  dataKey="ideal" 
                  name="Ideal" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="rgba(59, 130, 246, 0.02)"
                />

                {/* Real Completed Progress Area */}
                <Area 
                  type="monotone" 
                  dataKey="real" 
                  name="Entregue Real" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="rgba(16, 185, 129, 0.08)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-8 bg-slate-900 dark:bg-brand-primary/10 border-2 border-transparent dark:border-brand-primary/20 rounded-[32px] text-white shadow-xl flex flex-col gap-4 transition-colors">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Eficiência de Entrega</p>
             <h4 className="text-5xl font-black tracking-tighter text-white">{efficiency}</h4>
             <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-brand-success h-full transition-all duration-1000" style={{ width: `${Math.min(100, parseFloat(efficiency) * 100)}%` }} />
             </div>
             <p className="text-[10px] font-bold opacity-70 italic mt-2">* Razão entre horas finalizadas da Sprint e capacidade do time.</p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm flex flex-col gap-6 transition-colors">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Resumo Sprint Burnup</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Escopo da Sprint</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{sprintScope}h</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Esforço Concluído</span>
                  <span className="text-xs font-black text-brand-success">{totalCompleted}h</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">% Conclusão Geral</span>
                  <span className="text-xs font-black text-brand-primary">
                    {sprintScope > 0 ? ((totalCompleted / sprintScope) * 100).toFixed(0) : 0}%
                  </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
