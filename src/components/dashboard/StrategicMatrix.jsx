import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, User, Briefcase, ChevronRight, 
  Crosshair, Info, AlertCircle, CheckCircle2,
  TrendingUp, Users
} from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';

export default function StrategicMatrix({ projects, tasks, confirmedUsers, darkMode }) {
  const activeProjects = (projects || []).filter(p => p && p.status === 'active');
  const activeProjectIds = activeProjects.map(p => p.id);

  // Filter users who have at least one task in the active projects
  const displayUsers = (confirmedUsers || []).filter(user => {
    if (!user || !user.name) return false;
    return (tasks || []).some(t => 
      t && 
      activeProjectIds.includes(t.project_id) && 
      (t.assignee_id === user.id || t.assigned_to === user.name) &&
      (parseFloat(t.estimated_hours) || 0) > 0 // Ensure there's actual work
    );
  });

  // Helper to get initials
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (activeProjects.length === 0 || displayUsers.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-20 rounded-none border-2 border-slate-200 flex flex-col items-center justify-center text-center"
      >
        <div className="w-16 h-16 bg-slate-800 rounded-none flex items-center justify-center text-white mb-6">
          <Users size={24} />
        </div>
        <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-2">Sem Alocações Ativas</h4>
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest max-w-xs">
          Não foram encontradas tarefas atribuídas aos projetos em andamento para este ciclo.
        </p>
      </motion.div>
    );
  }

  // Helper to determine heat color
  const getHeatColor = (hours, isRemaining = false) => {
    if (hours === 0) return 'bg-white text-slate-800 border-2 border-slate-200';
    if (isRemaining) {
      if (hours > 20) return 'bg-white text-[#8B0000] border-2 border-[#8B0000]';
      if (hours > 10) return 'bg-white text-slate-800 border-2 border-slate-200';
      return 'bg-slate-800 text-white border-2 border-slate-200';
    }
    if (hours > 40) return 'bg-slate-800 text-white border-2 border-slate-200';
    return 'bg-white text-neutral-600 border-2 border-neutral-300';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-10 rounded-none border-2 border-slate-200 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b-2 border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-slate-800 rounded-none text-white">
              <Users size={16} />
            </div>
            <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Strategic Heatmap</h4>
          </div>
          <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-[0.2em] ml-1">Workload Distribution & Delivery Momentum</p>
        </div>

        <div className="flex flex-wrap gap-3">
           <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-none border-2 border-slate-200 transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">Baixo Risco</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-800 rounded-none border-2 border-slate-200 transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">Moderado</span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-white text-[#8B0000] rounded-none border-2 border-[#8B0000] transition-all">
              <span className="text-[10px] font-bold uppercase tracking-widest">Crítico</span>
           </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto custom-scrollbar pb-6 relative z-10">
        <table className="w-full border-separate border-spacing-x-3 border-spacing-y-4">
          <thead>
            <tr>
              <th className="text-left p-6 sticky left-0 bg-white z-20 min-w-[280px] rounded-none border-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <Briefcase size={14} className="text-slate-800" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-[0.2em]">Project Portfolio</span>
                </div>
              </th>
              {displayUsers.map((user, idx) => (
                <th key={user.id} className="p-4 min-w-[140px]">
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex flex-col items-center gap-3 group"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-none bg-white flex items-center justify-center text-xs font-black text-slate-800 border-2 border-slate-200 relative z-10 transition-transform group-hover:scale-110">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full rounded-none object-cover" />
                        ) : getInitials(user.name)}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight text-center truncate w-full">
                      {user.name.split(' ')[0]}
                    </span>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {activeProjects.map((project, pIdx) => (
                <motion.tr 
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + pIdx * 0.05 }}
                  className="group"
                >
                  <td className="p-6 sticky left-0 bg-white z-20 group-hover:bg-neutral-50 rounded-none transition-all border-2 border-slate-200">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-black text-slate-800 uppercase tracking-tight transition-colors">
                          {project.name}
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-white rounded-none border-2 border-slate-200">
                          <span className="text-[8px] font-bold uppercase">On Track</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-white border-2 border-slate-200 rounded-none overflow-hidden">
                           {/* Calculating project total progress */}
                           {(() => {
                             const projStories = (projects || []).find(pr => pr.id === project.id); // Just a placeholder check
                             const pTotal = (tasks || []).filter(t => t.project_id === project.id).reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
                             const pDone = (tasks || []).filter(t => t.project_id === project.id && t.status === 'done').reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
                             const pPct = pTotal > 0 ? (pDone / pTotal) * 100 : 0;
                             return (
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${pPct}%` }}
                                 className="h-full bg-slate-800 rounded-none" 
                               />
                             );
                           })()}
                        </div>
                        <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest tabular-nums">
                          {(() => {
                             const pTotal = (tasks || []).filter(t => t.project_id === project.id).reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
                             const pDone = (tasks || []).filter(t => t.project_id === project.id && t.status === 'done').reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
                             return pTotal > 0 ? `${Math.round((pDone / pTotal) * 100)}%` : '0%';
                          })()}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  {displayUsers.map(user => {
                    const userTasks = (tasks || []).filter(t => 
                      t && t.project_id === project.id && (t.assignee_id === user.id || t.assigned_to === user.name)
                    );
                    
                    const total = userTasks.reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
                    const done = userTasks.filter(t => t.status === 'done').reduce((acc, t) => acc + (parseFloat(t.estimated_hours) || 0), 0);
                    const remaining = Math.max(0, total - done);
                    
                    if (total === 0) {
                      return (
                        <td key={`${project.id}-${user.id}`} className="p-4 text-center border-b-2 border-slate-200">
                          <div className="w-2 h-2 rounded-none bg-slate-800 mx-auto" />
                        </td>
                      );
                    }

                    return (
                      <td key={`${project.id}-${user.id}`} className="p-2 border-b-2 border-slate-200">
                        <motion.div 
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`p-4 rounded-none transition-all duration-300 flex flex-col items-center gap-2 ${getHeatColor(remaining, true)}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="" />
                            <span className="text-xl font-black tabular-nums tracking-tighter">{remaining}h</span>
                          </div>
                          
                          <div className="w-full space-y-1">
                             <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-tighter">
                                <span>{done}h / {total}h</span>
                                <span>{Math.round((done/total) * 100)}%</span>
                             </div>
                             <div className="w-full h-1.5 border border-current rounded-none overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(done/total) * 100}%` }}
                                  className={`h-full bg-current rounded-none`}
                                />
                             </div>
                          </div>
                        </motion.div>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer / Summary Info */}
      <div className="mt-8 pt-8 border-t-2 border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="flex -space-x-3">
              {displayUsers.slice(0, 5).map((u, i) => (
                <div key={i} className="w-8 h-8 rounded-none border-2 border-slate-200 bg-white flex items-center justify-center text-[10px] font-black text-slate-800">
                  {getInitials(u.name)}
                </div>
              ))}
           </div>
           <p className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
             {displayUsers.length} Colaboradores Ativos no Ciclo
           </p>
        </div>
        
        <div className="flex items-center gap-2 text-slate-800">
           <Info size={12} />
           <span className="text-[10px] font-bold uppercase tracking-widest">Valores baseados em estimativas de tarefas ativas</span>
        </div>
      </div>
    </motion.div>
  );
}
