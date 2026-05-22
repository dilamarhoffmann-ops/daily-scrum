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

export default function BurndownChart() {
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
  
  // Map each story to its "effective" items (tasks if any, else the story itself)
  const sprintItems = sprintStories.map(story => {
    const storyTasks = (tasks || []).filter(t => t.story_id === story.id);
    if (storyTasks.length > 0) {
      return { type: 'tasks', items: storyTasks };
    }
    return { type: 'story', items: [story] };
  });

  // Calculate total scope based on hybrid items
  const sprintScope = sprintItems.reduce((acc, group) => {
    const groupHours = group.items.reduce((sum, item) => sum + (item.estimated_hours || 0), 0);
    return acc + groupHours;
  }, 0);

  const projectTasks = tasks.filter(t => t.project_id === activeProjectId);

  if (sprintScope === 0 && sprintStories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-sm">Nenhum item vinculado a esta sprint ainda</p>
      </div>
    );
  }

  // 3. Calculation Logic
  const workingDays = getWorkingDays(activeSprint.start_date, activeSprint.end_date) || 10;
  const startDate = new Date(activeSprint.start_date);
  const chartData = [];
  const idealStep = sprintScope / workingDays;

  for (let i = 0; i <= workingDays; i++) {
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + i);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const actualRemainingValue = sprintItems.reduce((acc, group) => {
      const groupRemaining = group.items.reduce((sum, item) => {
        // Se a tarefa foi concluída neste dia ou antes, resta 0
        const compDate = item.completed_at ? new Date(item.completed_at) : (item.created_at ? new Date(item.created_at) : startDate);
        const dayDiff = Math.floor((compDate - startDate) / (1000 * 60 * 60 * 24));
        if (item.status === 'done' && dayDiff <= i) {
           return sum + 0;
        }

        // Caso contrário, busca o histórico de queima (burn_history)
        const history = item.burn_history || {};
        const historyDates = Object.keys(history).sort();
        let closestRemaining = item.estimated_hours || 0;
        
        for (const date of historyDates) {
          if (date <= targetDateStr) {
            closestRemaining = history[date];
          }
        }
        
        // Se for o dia atual e o targetDateStr já alcançou hoje, usa o valor atual real-time
        if (targetDateStr >= todayStr && item.remaining_hours !== undefined) {
           closestRemaining = item.remaining_hours;
        }

        return sum + Math.max(0, closestRemaining);
      }, 0);
      
      return acc + groupRemaining;
    }, 0);

    const idealRemainingValue = Math.max(0, sprintScope - (idealStep * i));

    chartData.push({
      day: i,
      ideal: parseFloat(idealRemainingValue.toFixed(1)),
      real: i <= Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24)) ? parseFloat(actualRemainingValue.toFixed(1)) : null,
      hours: parseFloat(actualRemainingValue.toFixed(1))
    });
  }

  const latestPoint = [...chartData].reverse().find(d => d.real !== null);
  const isBehind = latestPoint && latestPoint.real > latestPoint.ideal;
  const burndownColor = isBehind ? '#8B0000' : '#4f46e5'; // Dark Red if Behind, Indigo if Ahead

  // Metrics calculation (Project-wide for comparison)
  const totalCapacity = (confirmed_users || []).reduce((acc, u) => acc + ((u?.daily_hours || 8) * workingDays), 0);
  
  // totalEstimated and totalCompleted should use the same hybrid logic for the current sprint viewport
  const totalEstimated = sprintScope;
  const totalCompleted = sprintScope - sprintItems.reduce((acc, group) => {
    return acc + group.items.reduce((sum, item) => {
      if (item.status === 'done') return sum + 0;
      return sum + (item.remaining_hours !== undefined ? item.remaining_hours : (item.estimated_hours || 0));
    }, 0);
  }, 0);

  const efficiency = totalCapacity > 0 ? (totalCompleted / totalCapacity).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Relatórios Agile</h2>
          <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Projeto: {activeSprint.goal}</p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-brand-primary/5 dark:bg-brand-primary/10 rounded-xl border border-brand-primary/10 dark:border-brand-primary/20">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Capacidade Total</p>
            <p className="text-sm font-black text-brand-primary uppercase">{totalCapacity} Horas</p>
          </div>
          <div className="px-4 py-2 bg-brand-success/5 dark:bg-brand-success/10 rounded-xl border border-brand-success/10 dark:border-brand-success/20">
            <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase mb-0.5">Escopo Sprint</p>
            <p className="text-sm font-black text-brand-success uppercase">{totalEstimated} Horas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] p-10 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Burndown Progress</h3>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-3 py-1 rounded-full">X: Horas | Y: Dias</span>
          </div>
          
          <div className="h-[400px]" style={{ minHeight: '400px' }}>
            <ResponsiveContainer width="99%" height="100%" minHeight={400}>
              <LineChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke={darkMode ? "#1e293b" : "#f1f5f9"} />
                <XAxis 
                   type="number" 
                   dataKey="hours" 
                   domain={[0, Math.max(1, sprintScope)]} 
                   reversed 
                   stroke={darkMode ? "#475569" : "#94a3b8"} 
                   fontSize={10} 
                   fontWeight="bold"
                   tickLine={false}
                   axisLine={false}
                />
                <YAxis 
                  type="number" 
                  dataKey="day" 
                  domain={[0, workingDays]} 
                  stroke={darkMode ? "#475569" : "#94a3b8"} 
                  fontSize={10} 
                  fontWeight="bold"
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'DIAS', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 900, fill: darkMode ? "#475569" : "#cbd5e1" } }}
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
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Line 
                  type="monotone" 
                  dataKey="ideal" 
                  name="Ideal" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  strokeDasharray="4 4" 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="real" 
                  name="Real" 
                  stroke={burndownColor} 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: burndownColor, strokeWidth: 2, stroke: darkMode ? '#0f172a' : '#ffffff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-8 bg-slate-900 dark:bg-brand-primary/10 border-2 border-transparent dark:border-brand-primary/20 rounded-[32px] text-white shadow-xl flex flex-col gap-4 transition-colors">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Sprint Efficiency</p>
             <h4 className="text-5xl font-black tracking-tighter text-white">{efficiency}</h4>
             <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-brand-primary h-full transition-all duration-1000" style={{ width: `${Math.min(100, parseFloat(efficiency) * 100)}%` }} />
             </div>
             <p className="text-[10px] font-bold opacity-70 italic mt-2">* Performance baseada em horas concluídas vs capacidade total.</p>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-sm flex flex-col gap-6 transition-colors">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">Alocação de Tempo</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Horas Planejadas</span>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">{totalEstimated}h</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Horas Concluídas</span>
                  <span className="text-xs font-black text-brand-success">{totalCompleted}h</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Horas Restantes</span>
                  <span className="text-xs font-black text-brand-danger">{Math.max(0, totalEstimated - totalCompleted)}h</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

