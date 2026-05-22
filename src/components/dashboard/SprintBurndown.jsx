import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { getWorkingDays } from '../../lib/agileUtils';
import useAgileStore from '../../store/useAgileStore';

export default function SprintBurndown({ sprint, tasks, confirmedUsers, userStories }) {
  const { darkMode } = useAgileStore();
  
  if (!sprint) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800 h-full min-h-[340px]">
        <Clock className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px] text-center">
          Nenhuma Sprint Ativa Encontrada<br/>
          <span className="font-bold lowercase opacity-60">Inicie uma sprint no planejamento para ver o fluxo</span>
        </p>
      </div>
    );
  }

  // 1. Calculate Sprint Scope (Total Hours or Points)
  const sprintStories = userStories.filter(s => String(s.sprint_id) === String(sprint.id));
  
  const sprintTasks = tasks.filter(t => {
    if (String(t.sprint_id) === String(sprint.id)) return true;
    const story = userStories.find(s => s.id === t.story_id);
    return story && String(story.sprint_id) === String(sprint.id);
  });

  let totalScope = 0;

  // Effort from stories in sprint that HAVE NO TASKS in this sprint
  sprintStories.forEach(story => {
    const storyTasksInSprint = sprintTasks.filter(t => t.story_id === story.id);
    if (storyTasksInSprint.length === 0) {
      totalScope += parseFloat(story.estimated_hours) || parseFloat(story.story_points) || 0;
    }
  });

  // Effort from all tasks in the sprint
  totalScope += sprintTasks.reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);

  if (totalScope === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border-2 border-dashed border-slate-100 dark:border-slate-800 h-full min-h-[340px]">
        <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-[10px] text-center">
          Sprint sem estimativas<br/>
          <span className="font-bold lowercase opacity-60">Adicione pontos ou horas às histórias/tarefas para ver o gráfico</span>
        </p>
      </div>
    );
  }

  // 2. Calculate Timeframe
  const workingDays = Math.max(1, getWorkingDays(sprint.start_date, sprint.end_date) || 10);
  const startDate = new Date(sprint.start_date);
  const chartData = [];
  const idealStep = totalScope / workingDays;

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  for (let i = 0; i <= workingDays; i++) {
    const currentIterDate = new Date(startDate);
    currentIterDate.setDate(startDate.getDate() + i);
    currentIterDate.setHours(23, 59, 59, 999);

    let completedOnThisDayOrBefore = 0;
    
    // Effort from stories in sprint that HAVE NO TASKS in this sprint
    sprintStories.forEach(story => {
      const storyTasksInSprint = sprintTasks.filter(t => t.story_id === story.id);
      if (storyTasksInSprint.length === 0 && story.status === 'done') {
        const compDateRaw = story.updated_at || story.created_at;
        const compDate = new Date(compDateRaw);
        if (compDate <= currentIterDate) {
          completedOnThisDayOrBefore += (parseFloat(story.estimated_hours) || parseFloat(story.story_points) || 0);
        }
      }
    });

    // Effort from all tasks in the sprint that are DONE
    completedOnThisDayOrBefore += sprintTasks
      .filter(t => t.status === 'done')
      .filter(t => {
        const compDateRaw = t.completed_at || t.created_at;
        const compDate = new Date(compDateRaw);
        return compDate <= currentIterDate;
      })
      .reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);

    const actualRemainingValue = Math.max(0, totalScope - completedOnThisDayOrBefore);
    const idealRemainingValue = Math.max(0, totalScope - (idealStep * i));

    const isPastOrToday = currentIterDate <= today;

    chartData.push({
      day: `Dia ${i}`,
      ideal: parseFloat(idealRemainingValue.toFixed(1)),
      actual: isPastOrToday ? parseFloat(actualRemainingValue.toFixed(1)) : null
    });
  }

  const latestPoint = [...chartData].reverse().find(d => d.actual !== null);
  const isBehind = latestPoint && latestPoint.actual > latestPoint.ideal;
  const burndownColor = isBehind ? '#8B0000' : '#4f46e5'; // Dark Red if Behind, Indigo if Ahead

  return (
    <div className="flex flex-col gap-8 p-2">
      {/* Mini Guia da Bússola */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-brand-primary/10 rounded-2xl text-brand-primary animate-pulse">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Bússola Scrum</p>
            <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter">Transparência do Tempo Restante</p>
          </div>
        </div>
        
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-1 bg-brand-success/20 rounded-full border border-dashed border-brand-success"></div>
            <span className="text-[10px] font-black text-brand-success uppercase tracking-widest">Ritmo Ideal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-4 h-1 rounded-full shadow-lg ${isBehind ? 'bg-brand-danger shadow-brand-danger/20' : 'bg-brand-primary shadow-brand-primary/20'}`}></div>
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              {isBehind ? 'Em Atraso (Red)' : 'No Ritmo (Blue)'}
            </span>
          </div>
        </div>
      </div>

      <div className="h-[340px] w-full" style={{ minHeight: '340px' }}>
        <ResponsiveContainer width="99%" height="100%" minHeight={340}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={burndownColor} stopOpacity={0.15}/>
                <stop offset="95%" stopColor={burndownColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontVariant: 'tabular-nums', fontWeight: 900, fill: darkMode ? '#64748b' : '#94a3b8' }}
              dy={15}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fontVariant: 'tabular-nums', fontWeight: 900, fill: darkMode ? '#64748b' : '#94a3b8' }}
              tickFormatter={(value) => `${value}h`}
              label={{ value: 'HORAS RESTANTES', angle: -90, position: 'insideLeft', style: { fontSize: 8, fontWeight: 900, fill: '#94a3b8', letterSpacing: '2px' } }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '24px', 
                border: 'none', 
                boxShadow: '0 25px 30px -10px rgba(0,0,0,0.2)',
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                padding: '16px'
              }}
              labelStyle={{ fontWeight: 900, color: darkMode ? '#f8fafc' : '#1e293b', marginBottom: '12px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}
              itemStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '4px 0' }}
              cursor={{ stroke: darkMode ? '#334155' : '#f1f5f9', strokeWidth: 2 }}
            />
            <Area 
              name="Horas Que Faltam"
              type="monotone" 
              dataKey="actual" 
              stroke={burndownColor} 
              strokeWidth={5}
              fillOpacity={1} 
              fill="url(#colorReal)" 
              dot={{ r: 5, fill: burndownColor, strokeWidth: 3, stroke: darkMode ? '#0f172a' : '#fff' }}
              activeDot={{ r: 8, strokeWidth: 0, shadow: `0 0 15px ${burndownColor}` }}
              connectNulls={false}
            />
            <Area 
              name="Ritmo Ideal"
              type="monotone" 
              dataKey="ideal" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="10 10"
              fill="transparent"
              fillOpacity={0}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-col items-center gap-2 mt-4">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] italic">
          "A montanha é alta, mas o passo é firme."
        </p>
        <p className="text-[11px] font-black uppercase tracking-tighter" style={{ color: burndownColor }}>
          {isBehind ? `Atenção: Estamos ${latestPoint?.actual - latestPoint?.ideal}h acima do ideal` : `Excelente: Estamos ${Math.abs(latestPoint?.actual - latestPoint?.ideal).toFixed(1)}h adiantados`}
        </p>
      </div>
    </div>
  );
}
