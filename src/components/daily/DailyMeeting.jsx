import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, MessageSquare, AlertCircle, 
  CheckCircle2, Clock, User, Plus, Trash2, ShieldAlert, Flag 
} from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';

export default function DailyMeeting() {
  const { tasks, userStories, daily_items, addDailyItem, deleteDailyItem, activeProjectId, updateTask } = useAgileStore();
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [newItem, setNewItem] = useState({ content: '', type: 'action', task_id: '' });

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItem.content.trim()) return;
    addDailyItem(newItem);
    setNewItem({ ...newItem, content: '', task_id: '' });
  };

  const activeTasks = tasks.filter(t => t.project_id === activeProjectId && t.status !== 'done');
  const blockedTasks = tasks.filter(t => t.project_id === activeProjectId && t.is_blocked);
  const filteredDailyItems = daily_items.filter(item => item.project_id === activeProjectId);

  const tasksByUser = activeTasks.reduce((acc, task) => {
    const user = task.assigned_to || 'Sem Responsável';
    if (!acc[user]) acc[user] = [];
    acc[user].push(task);
    return acc;
  }, {});

  const getStatusBorderClass = (status) => {
    switch (status) {
      case 'todo': return 'border-phase-st-plan';
      case 'in_progress': return 'border-phase-dev-daily';
      case 'ready_to_test': return 'border-phase-dev-backlog';
      case 'review': return 'border-phase-st-review';
      case 'done': return 'border-phase-st-review';
      default: return 'border-slate-100 dark:border-slate-800';
    }
  };

  const getGroupedItemsByTask = (taskId) => {
    const taskItems = filteredDailyItems.filter(item => item.task_id === taskId);
    return taskItems.reduce((acc, item) => {
      const date = new Date(item.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    }, {});
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-500">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Daily Meeting</h2>
          <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Inspeção e Adaptação Diária</p>
        </div>
        <div className="flex items-center gap-6 bg-white dark:bg-slate-900 px-8 py-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl self-start transition-colors">
           <div className="flex flex-col">
             <span className="badge-harmony badge-harmony-neutral border-2 mb-1">Timebox Daily</span>
             <span className={`text-3xl font-black tabular-nums tracking-tighter transition-colors ${seconds > 900 ? 'text-brand-danger' : 'text-slate-800 dark:text-slate-100'}`}>
               {formatTime(seconds)}
             </span>
           </div>
           <div className="flex gap-2">
             <button 
               onClick={() => setIsActive(!isActive)}
               className={`p-3 rounded-2xl transition-all ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' : 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'}`}
             >
               {isActive ? <Pause size={20} /> : <Play size={20} />}
             </button>
             <button 
               onClick={() => { setSeconds(0); setIsActive(false); }}
               className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-400 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition-all"
             >
               <RotateCcw size={20} />
             </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Foco nos Membros */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-brand-primary" size={24} />
              Status por Membro
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(tasksByUser).map(([user, userTasks]) => (
              <div key={user} className="glass-card p-6 transition-all border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter leading-none">{user}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-1">{userTasks.length} Atividades</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {userTasks.map(t => {
                    const groupedHistory = getGroupedItemsByTask(t.id);
                    const hasHistory = Object.keys(groupedHistory).length > 0;
                    const story = t.story_id 
                      ? userStories.find(s => s.id === t.story_id)
                      : null;

                    const statusBorder = getStatusBorderClass(t.status);

                    return (
                      <div key={t.id} className="flex flex-col gap-3">
                        <div className={`glass-card p-4 min-h-[140px] flex flex-col justify-between group relative transition-all duration-300 border
                          ${t.is_blocked 
                            ? 'border-brand-danger ring-4 ring-brand-danger/10' 
                            : statusBorder
                          }
                        `}>
                          <div className={`badge-harmony absolute top-4 right-4 ${t.is_blocked ? 'badge-harmony-danger' : 'badge-harmony-neutral'} border-2 flex items-center gap-1`}>
                            {t.is_blocked && <Flag size={10} />}
                            <input 
                               type="number"
                               min="0"
                               className="w-8 bg-transparent text-right outline-none text-[10px] font-black p-0 m-0"
                               value={t.remaining_hours !== undefined ? t.remaining_hours : t.estimated_hours}
                               onChange={(e) => {
                                 const val = parseInt(e.target.value);
                                 if (!isNaN(val)) updateTask(t.id, { remaining_hours: val });
                               }}
                               title="Tempo Restante"
                               onClick={(e) => e.stopPropagation()}
                            />h
                          </div>
                          
                          <div className="flex-1 pr-6 pt-2">
                            {/* Story Context */}
                            {story && (
                              <div className="mb-2 flex flex-col gap-1 opacity-70">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                                  <p className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter truncate">
                                    US: {story.title}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            <p className="text-slate-900 dark:text-white text-[11px] font-black leading-tight tracking-tight uppercase">
                              {t.title}
                            </p>
                            
                            {t.is_blocked && (
                              <p className="text-[9px] text-brand-danger dark:text-brand-danger/80 font-bold mt-2 italic flex items-center gap-1">
                                <AlertCircle size={10} /> {t.block_reason || 'Bloqueado'}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 mt-auto">
                            <div className="post-it-divider dark:bg-white/5" />
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                              <span className="opacity-40">TASK-{t.id.slice(0, 4)}</span>
                              <div className="flex items-center gap-2">
                                <span className={`badge-harmony border-2 ${t.status === 'in_progress' ? 'badge-harmony-primary' : 'badge-harmony-neutral'}`}>
                                  {t.status.replace('_', ' ')}
                                </span>
                                <div className="flex items-center gap-1 text-brand-primary">
                                  <User size={10} />
                                  <span className="truncate max-w-[50px]">{t.assigned_to || 'S/D'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Histórico da Tarefa (Abaixo do Card) */}
                        {hasHistory && (
                          <div className="ml-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-3 mb-4">
                            {Object.entries(groupedHistory).sort((a, b) => new Date(b[0]) - new Date(a[0])).map(([date, items]) => (
                              <div key={date} className="flex flex-col gap-1.5">
                                <span className="text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-50 dark:bg-slate-950 w-fit px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-800">
                                  {date === new Date().toLocaleDateString() ? 'Hoje' : date}
                                </span>
                                <div className="space-y-1.5 pl-1">
                                  {items.map(item => (
                                    <div key={item.id} className="flex items-start gap-2 group/h">
                                      <div className={`w-1 h-3 rounded-full mt-0.5 shrink-0 ${item.type === 'action' ? 'bg-blue-400/50' : 'bg-brand-danger/50'}`} />
                                      <div className="flex-1">
                                        <p className="text-[9px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                                          {item.content}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className={`text-[7px] font-black uppercase ${item.type === 'action' ? 'text-blue-500' : 'text-brand-danger'}`}>
                                            {item.type === 'action' ? 'Ação' : 'Impedimento'}
                                          </span>
                                          <span className="text-[6px] font-medium text-slate-400">
                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(tasksByUser).length === 0 && (
              <div className="md:col-span-2 p-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px] text-center">
                <p className="text-slate-400 dark:text-slate-600 text-sm font-bold uppercase tracking-widest">Nenhuma tarefa ativa neste projeto</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumo e Impedimentos Críticos */}
        <div className="flex flex-col gap-8">
           {/* Seção de Entrada de Itens da Daily */}
           <div className="glass-card p-6 flex flex-col gap-6 transition-colors border border-slate-100">
             <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">Nova Ação / Impedimento</h3>
             <form onSubmit={handleAddItem} className="flex flex-col gap-4">
               <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl">
                 <button 
                   type="button"
                   onClick={() => setNewItem({...newItem, type: 'action'})}
                   className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${newItem.type === 'action' ? 'bg-white dark:bg-slate-800 text-brand-primary dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
                 >
                   Ação
                 </button>
                 <button 
                   type="button"
                   onClick={() => setNewItem({...newItem, type: 'impediment'})}
                   className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${newItem.type === 'impediment' ? 'bg-white dark:bg-slate-800 text-brand-danger dark:text-brand-danger/90 shadow-sm' : 'text-slate-400 dark:text-slate-600'}`}
                 >
                   Impedimento
                 </button>
               </div>
               <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest px-1">Tarefa Relacionada (Opcional)</label>
                 <select 
                   value={newItem.task_id}
                   onChange={e => setNewItem({...newItem, task_id: e.target.value})}
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-brand-primary appearance-none cursor-pointer"
                 >
                   <option value="">Nenhuma tarefa específica</option>
                   {activeTasks.map(t => (
                     <option key={t.id} value={t.id}>[{t.assigned_to || 'S/D'}] {t.title}</option>
                   ))}
                 </select>
               </div>
               <textarea 
                 value={newItem.content}
                 onChange={e => setNewItem({...newItem, content: e.target.value})}
                 placeholder="Descreva aqui o detalhe da ação ou impedimento..."
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-brand-primary min-h-[80px] placeholder:text-slate-400 dark:placeholder:text-slate-700"
               />
               <button type="submit" className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black dark:hover:bg-white transition-all shadow-lg shadow-black/10">
                 Adicionar Card
               </button>
             </form>
             
             {/* Listagem de Cards da Daily */}
             <div className="flex flex-col gap-4">
                {filteredDailyItems.map(item => (
                  <div key={item.id} className={`p-4 rounded-3xl border-2 transition-all group relative overflow-hidden ${item.type === 'action' ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30' : 'bg-[#fff0f0]/50 border-[#8B0000]/20 dark:bg-[#8B0000]/10 dark:border-[#8B0000]/30'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${item.type === 'action' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'bg-[#fff0f0] dark:bg-[#8B0000]/40 text-[#8B0000] dark:text-[#8B0000]'}`}>
                        {item.type === 'action' ? 'AÇÃO' : 'IMPEDIMENTO'}
                      </span>
                      <button 
                        onClick={() => deleteDailyItem(item.id)}
                        className="text-slate-300 dark:text-slate-700 hover:text-brand-danger transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {item.task_id && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/40 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/5 mb-1 w-fit">
                          <Flag size={12} className={item.type === 'action' ? 'text-blue-500' : 'text-[#8B0000]'} />
                          <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 line-clamp-1">
                            {tasks.find(t => t.id === item.task_id)?.title || 'Tarefa não encontrada'}
                          </p>
                        </div>
                      )}
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-snug tracking-tight">{item.content}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                      <span>Daily Note</span>
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
                {filteredDailyItems.length === 0 && (
                  <div className="w-full p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px] flex flex-col items-center justify-center gap-3">
                    <MessageSquare size={24} className="text-slate-200 dark:text-slate-800" />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest text-center leading-relaxed">Nenhum card de ação<br/>adicionado nesta Daily.</p>
                  </div>
                )}
             </div>
           </div>
 
           <div className="glass-card p-6 flex flex-col gap-6 mt-4 transition-colors border border-slate-100">
             <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">Impedimentos do Board</h3>
             
             {blockedTasks.length > 0 ? (
               <div className="grid grid-cols-1 gap-4">
                 {blockedTasks.map(task => (
                   <div key={task.id} className="flex gap-4 items-start border-l-4 border-brand-danger bg-brand-danger/5 dark:bg-brand-danger/10 p-4 rounded-[var(--radius-premium)]">
                     <Flag className="text-brand-danger shrink-0 mt-0.5" size={14} />
                     <div>
                       <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tighter">{task.title}</p>
                       <p className="text-[10px] text-brand-danger dark:text-brand-danger/80 font-bold italic line-clamp-2">{task.block_reason || 'Bloqueio técnico sem descrição.'}</p>
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="flex flex-col items-center py-4 text-center">
                 <CheckCircle2 size={32} className="text-brand-success opacity-30 mb-2" />
                 <p className="text-xs font-bold text-slate-400 dark:text-slate-600">Time sem bloqueios técnicos no Kanban.</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}


