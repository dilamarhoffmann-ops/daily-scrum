import React from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, CartesianGrid

} from 'recharts';
import { Users, Zap, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';

export default function TeamEngagement({ involvedUsers, workingDays }) {
  const { darkMode } = useAgileStore();

  if (!involvedUsers || involvedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
        <Users className="text-slate-300 mb-4" size={32} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Nenhum dado de engajamento disponível</p>
      </div>
    );
  }

  // Preparar dados para o Radar Geral do Time (Média)
  const safeUsers = (involvedUsers || []).filter(u => u != null);
  
  const avgAllocation = safeUsers.length > 0 
    ? safeUsers.reduce((acc, u) => acc + (u.assignedHours / ((u.daily_hours || 8) * workingDays * 0.8 || 1)), 0) / safeUsers.length
    : 0;
    
  const avgEfficiency = safeUsers.length > 0 
    ? safeUsers.reduce((acc, u) => {
        const ratio = u.actualHours > 0 ? Math.min(1, u.assignedHours / u.actualHours) : 1;
        return acc + ratio;
      }, 0) / safeUsers.length
    : 1;

  
  const radarData = [
    { subject: 'Alocação', A: avgAllocation * 100, fullMark: 100 },
    { subject: 'Eficiência', A: avgEfficiency * 100, fullMark: 100 },
    { subject: 'Consistência', A: 85, fullMark: 100 }, // Placeholder for now
    { subject: 'Foco', A: 90, fullMark: 100 },
    { subject: 'Multitasking', A: (involvedUsers.reduce((acc, u) => acc + u.projectCount, 0) / involvedUsers.length) * 20, fullMark: 100 },
  ];

  const chartColor = darkMode ? '#818cf8' : '#4f46e5';

  return (
    <div className="flex flex-col gap-10">
      {/* Top Visual: Radar + Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Zap size={80} />
          </div>
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-8">Saúde Operacional do Time</h4>
          
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="h-[350px] flex-1 w-full">

              <ResponsiveContainer width="99%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 900 }} 
                  />
                  <Radar
                    name="Time"
                    dataKey="A"
                    stroke={chartColor}
                    fill={chartColor}
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição % Donut */}
            <div className="h-[350px] flex-1 w-full border-l border-slate-100 dark:border-slate-800/50 pl-4">

              <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Distribuição de Carga (%)</h5>
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie
                    data={involvedUsers}
                    dataKey="assignedHours"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >

                    {involvedUsers.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={[`#4f46e5`, `#10b981`, `#f59e0b`, `#8B0000`, `#8b5cf6`][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: darkMode ? '#1e293b' : '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                     {involvedUsers.map((u, i) => {
                       const totalAssigned = involvedUsers.reduce((acc, user) => acc + user.assignedHours, 0);
                       const pct = totalAssigned > 0 ? (u.assignedHours / totalAssigned) * 100 : 0;
                       return (
                        <div key={i} className="flex items-center gap-1.5">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: [`#4f46e5`, `#10b981`, `#f59e0b`, `#8B0000`, `#8b5cf6`][i % 5] }} />
                          <span className="text-[8px] font-black text-slate-500 uppercase">{u.name.split(' ')[0]} ({Math.round(pct)}%)</span>
                        </div>
                       );
                     })}
                  </div>

            </div>
          </div>
        </div>


        <div className="flex flex-col gap-6">
          <div className="card-pastel-purple p-8 rounded-[40px] text-violet-950 border shadow-xl relative overflow-hidden premium-shadow">
             <div className="absolute -right-10 -bottom-10 opacity-5">
               <TrendingUp size={120} />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-violet-500">Índice de Sprint</p>
             <h3 className="text-4xl font-black tracking-tighter mb-6">Alta Performance</h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-3xl border border-white/40">
                  <p className="text-[9px] font-black uppercase text-violet-500/60 mb-1">Carga Média</p>
                  <p className="text-xl font-black tabular-nums">{Math.round(avgAllocation * 100)}%</p>
                </div>
                <div className="bg-white/40 backdrop-blur-md p-4 rounded-3xl border border-white/40">
                  <p className="text-[9px] font-black uppercase text-violet-500/60 mb-1">Precisão Estimativa</p>
                  <p className="text-xl font-black tabular-nums">{Math.round(avgEfficiency * 100)}%</p>
                </div>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm flex-1">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6">Diferença de Esforço (Real vs Estimado)</h4>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="99%" height="100%">
                 <BarChart data={involvedUsers} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 9, fontWeight: 900 }}
                     interval={0}
                     tickFormatter={(name) => name.split(' ')[0]}
                   />
                   <Tooltip 
                     cursor={{fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: darkMode ? '#1e293b' : '#fff' }}
                     labelStyle={{ fontWeight: 900, color: darkMode ? '#f8fafc' : '#1e293b', marginBottom: '4px', fontSize: '10px', textTransform: 'uppercase' }}
                     itemStyle={{ fontWeight: 700, color: darkMode ? '#f8fafc' : '#475569' }}
                   />
                   <Bar name="Estimado" dataKey="assignedHours" fill={darkMode ? '#334155' : '#e2e8f0'} radius={[4, 4, 0, 0]} barSize={12} />
                   <Bar name="Realizado" dataKey="actualHours" radius={[4, 4, 0, 0]} barSize={12}>
                     {involvedUsers.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.actualHours > entry.assignedHours ? '#8B0000' : '#10b981'} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>

          </div>
        </div>
      </div>

      {/* Lista de Membros Refinada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {involvedUsers.map((member, i) => {
          const focusLimit = (member.daily_hours || 8) * workingDays * 0.8;
          const usagePercent = Math.min(100, (member.assignedHours / (focusLimit || 1)) * 100);
          const isOverloaded = member.assignedHours > focusLimit;
          const memberVariance = member.actualHours - member.assignedHours;

          return (
            <div key={i} className="group relative bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
              {/* Indicador de Status lateral */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isOverloaded ? 'bg-[#8B0000]' : 'bg-indigo-500'}`} />
              
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 border-white dark:border-slate-800 shadow-lg text-xl transition-transform group-hover:scale-110 ${isOverloaded ? 'bg-[#fff0f0] dark:bg-[#8B0000]/10 text-[#8B0000]' : 'bg-slate-50 dark:bg-slate-800 text-indigo-500'}`}>
                    {member.name[0]}
                  </div>
                  <div>
                    <h5 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">{member.name}</h5>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.role || 'Sprint Member'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`flex items-center gap-1 font-black text-[10px] uppercase px-3 py-1 rounded-full ${isOverloaded ? 'bg-[#fff0f0] text-[#8B0000] border border-[#8B0000]/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {isOverloaded ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                    {isOverloaded ? 'Sobrecarga' : 'Disponível'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Estimado</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-200 tabular-nums">{member.assignedHours}h</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Realizado</p>
                    <div className="flex items-center gap-2">
                       <p className={`text-lg font-black tabular-nums ${memberVariance > 0 ? 'text-[#8B0000]' : 'text-emerald-500'}`}>{member.actualHours}h</p>
                       <span className={`text-[9px] font-black ${memberVariance > 0 ? 'text-[#8B0000]/70' : 'text-emerald-400'}`}>
                        ({memberVariance > 0 ? `+${memberVariance}` : memberVariance}h)
                      </span>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carga de Foco (Target 80%)</span>
                   <span className={`text-xs font-black ${isOverloaded ? 'text-[#8B0000]' : 'text-indigo-500'}`}>{Math.round(usagePercent)}%</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                   <div 
                     className={`h-full rounded-full transition-all duration-1000 ${isOverloaded ? 'bg-[#8B0000] shadow-[0_0_12px_rgba(139,0,0,0.4)]' : usagePercent > 80 ? 'bg-amber-500' : 'bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.3)]'}`} 
                     style={{ width: `${usagePercent}%` }}
                   />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
