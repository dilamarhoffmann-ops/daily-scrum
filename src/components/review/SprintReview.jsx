import React from 'react';
import { Search, CheckCircle2, MessageSquare, Plus, ArrowRight, ExternalLink, Trash2, Tag, RotateCcw } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';

export default function SprintReview() {
  const { userStories, tasks, review_items, addReviewItem, deleteReviewItem, rejectTask, activeProjectId } = useAgileStore();
  const [newFeedback, setNewFeedback] = React.useState({ content: '', type: 'improvement', story_id: '', task_id: '' });
  const [rejectingId, setRejectingId] = React.useState(null);
  const [justification, setJustification] = React.useState('');

  const handleConfirmReturn = (taskId) => {
    if (!justification.trim()) return;
    rejectTask(taskId, justification);
    setRejectingId(null);
    setJustification('');
  };
  
  const doneStories = userStories.filter(s => s.status === 'done' && s.project_id === activeProjectId);
  const pendingStories = userStories.filter(s => s.status !== 'done' && s.project_id === activeProjectId);
  const filteredReviewItems = review_items.filter(item => item.project_id === activeProjectId);

  const availableTasks = newFeedback.story_id 
    ? tasks.filter(t => t.story_id === newFeedback.story_id)
    : [];

  const handleAddFeedback = (e) => {
    e.preventDefault();
    if (!newFeedback.content.trim()) return;
    addReviewItem(newFeedback);
    setNewFeedback({ ...newFeedback, content: '', story_id: '', task_id: '' });
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-500">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sprint Review</h2>
          <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Inspeção do Incremento do Produto</p>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm self-start transition-all">
           <Search className="text-phase-st-review" size={24} />
           <span className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">Demonstração Ativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lado Esquerdo: Incremento */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Incremento da Sprint</h3>
            <span className="badge-harmony badge-harmony-success border-2">
              {doneStories.length} Histórias Concluídas
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {doneStories.map(story => (
              <div key={story.id} className="glass-card p-6 flex flex-col gap-5 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-brand-success/10 flex items-center justify-center text-brand-success border border-brand-success/10">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <p className="font-bold text-lg text-slate-800 leading-tight">{story.title}</p>
                         <div className="flex gap-2 mt-1">
                           <span className="badge-harmony badge-harmony-neutral border-2">{story.story_points} SP</span>
                           <span className="badge-harmony badge-harmony-success border-2 italic">D.O.D Verificado</span>
                        </div>
                    </div>
                  </div>
                  <ExternalLink size={18} className="text-slate-300 dark:text-slate-700 group-hover:text-brand-success transition-all" />
                </div>

                <div className="flex flex-col gap-2 mt-2 pt-5 border-t border-slate-50 dark:border-slate-800/50">
                   <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-1">Checklist de Entrega:</p>
                   <div className="flex flex-col gap-3 ml-1">
                      {tasks.filter(t => t.story_id === story.id && t.status === 'done').map(task => (
                        <div key={task.id} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between group/task p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                               <div className="w-2.5 h-2.5 rounded-full bg-brand-success shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                               {task.title}
                            </div>
                            {rejectingId !== task.id && (
                              <button 
                                onClick={() => { setRejectingId(task.id); setJustification(''); }}
                                className="p-1 px-2.5 rounded-lg border border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest hover:border-brand-danger/50 hover:text-brand-danger transition-all opacity-0 group-hover/task:opacity-100"
                                title="Reprovar Tarefa"
                              >
                                <RotateCcw size={10} className="inline mr-1" />
                                Reprovar
                              </button>
                            )}
                          </div>
                          
                          {rejectingId === task.id && (
                            <div className="ml-5 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-brand-danger/20 animate-in slide-in-from-top-2">
                               <textarea 
                                  autoFocus
                                  value={justification}
                                  onChange={(e) => setJustification(e.target.value)}
                                  placeholder="Justificativa da reprovação..."
                                  className="w-full bg-transparent text-[11px] font-bold text-slate-700 dark:text-slate-300 outline-none min-h-[60px] resize-none mb-3"
                                />
                               <div className="flex gap-2">
                                 <button 
                                    onClick={() => handleConfirmReturn(task.id)}
                                    className="flex-1 bg-brand-danger text-white text-[9px] font-black uppercase py-2 rounded-lg"
                                 >
                                   Confirmar Reprovação
                                 </button>
                                 <button 
                                    onClick={() => { setRejectingId(null); setJustification(''); }}
                                    className="px-3 bg-slate-200 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase py-2 rounded-lg"
                                 >
                                   Cancelar
                                 </button>
                               </div>
                            </div>
                          )}
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            ))}
            {doneStories.length === 0 && (
              <div className="p-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] text-center italic text-slate-400 dark:text-slate-600 flex flex-col items-center gap-4">
                <CheckCircle2 size={48} className="opacity-10" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhuma história concluída para revisão</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-5">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2 group flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                Ainda Pendente no Quadro
             </h4>
             <div className="flex flex-wrap gap-3">
               {pendingStories.map(story => (
                 <div key={story.id} className="bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-500 hover:scale-[1.02] transition-transform cursor-default">
                   {story.title}
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Lado Direito: Notas e Feedback */}
        <div className="flex flex-col gap-8">
           <div className="glass-card p-8 flex flex-col gap-8 transition-all">
              <div className="flex items-center gap-5 border-b-2 border-slate-50 dark:border-slate-800/50 pb-8">
                <div className="w-14 h-14 bg-phase-st-review/10 rounded-3xl flex items-center justify-center text-phase-st-review border border-phase-st-review/20">
                  <MessageSquare size={28} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-800">Feedback do Cliente</h3>
                   <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Insights Estratégicos da Review</p>
                </div>
              </div>

              <form onSubmit={handleAddFeedback} className="flex flex-col gap-6">
                <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
                  {['improvement', 'compliment', 'change_request'].map(type => (
                    <button 
                      key={type}
                      type="button"
                      onClick={() => setNewFeedback({...newFeedback, type})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${newFeedback.type === type ? 'bg-white dark:bg-slate-800 text-phase-st-review dark:text-white shadow-lg shadow-phase-st-review/10' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'}`}
                    >
                      {type === 'improvement' ? 'Melhoria' : type === 'compliment' ? 'Elogio' : 'Alteração'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">História (US)</label>
                    <div className="relative">
                        <select 
                          value={newFeedback.story_id}
                          onChange={e => setNewFeedback({...newFeedback, story_id: e.target.value, task_id: ''})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-[11px] font-black text-slate-800 dark:text-slate-200 outline-none focus:border-phase-st-review appearance-none cursor-pointer transition-all hover:bg-white dark:hover:bg-black"
                        >
                          <option value="">Geral (Sprint Scope)</option>
                          {doneStories.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                          ))}
                        </select>
                        <ArrowRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 pointer-events-none rotate-90" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Tarefa Relacionada</label>
                    <div className="relative">
                        <select 
                          disabled={!newFeedback.story_id}
                          value={newFeedback.task_id}
                          onChange={e => setNewFeedback({...newFeedback, task_id: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-[11px] font-black text-slate-800 dark:text-slate-200 outline-none focus:border-phase-st-review appearance-none cursor-pointer disabled:opacity-30 transition-all hover:enabled:bg-white dark:hover:enabled:bg-black"
                        >
                          <option value="">Nenhuma tarefa específica</option>
                          {availableTasks.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                        <ArrowRight size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-700 pointer-events-none rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                   <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Detalhamento do Feedback</label>
                   <textarea 
                     value={newFeedback.content}
                     onChange={e => setNewFeedback({...newFeedback, content: e.target.value})}
                     placeholder="Qual o insight estratégico do stakeholder sobre este incremento?"
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-phase-st-review min-h-[140px] placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-inner resize-none transition-all"
                   />
                </div>

                <button type="submit" className="w-full bg-phase-st-review hover:bg-phase-st-review/90 text-white py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-phase-st-review/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                   <Plus size={20} />
                   Adicionar Insight à Review
                </button>
              </form>
           </div>

           {/* Feedback List */}
           <div className="space-y-5">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] px-4">Insights Registrados</h4>
             {filteredReviewItems.map(item => (
               <div key={item.id} className="glass-card p-6 group hover:shadow-md transition-all relative overflow-hidden border border-slate-100">
                 <div className={`absolute top-0 left-0 w-2 h-full ${item.type === 'compliment' ? 'bg-brand-success' : item.type === 'change_request' ? 'bg-brand-danger' : 'bg-phase-st-review'}`} />
                 
                 <div className="flex justify-between items-start mb-5">
                    <div className="flex flex-col gap-2">
                       <span className={`badge-harmony border-2 w-fit ${item.type === 'compliment' ? 'badge-harmony-success' : item.type === 'change_request' ? 'badge-harmony-danger' : 'badge-harmony-primary'}`}>
                         {item.type.replace('_', ' ')}
                       </span>
                      <div className="flex flex-col gap-1.5 mt-1">
                          {item.story_id && (
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight flex items-center gap-2">
                              <Search size={10} className="text-slate-300 dark:text-slate-700" /> US: {userStories.find(s => s.id === item.story_id)?.title}
                            </p>
                          )}
                          {item.task_id && (
                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-tight flex items-center gap-2">
                              <Tag size={10} className="text-brand-primary/40" /> TAREFA: {tasks.find(t => t.id === item.task_id)?.title}
                            </p>
                          )}
                       </div>
                    </div>
                    <button onClick={() => deleteReviewItem(item.id)} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-700 hover:text-brand-danger hover:bg-brand-danger/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={18} />
                    </button>
                 </div>

                 <p className="text-base font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic pr-4">"{item.content}"</p>
                 
                 <div className="mt-6 pt-5 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-700 uppercase tracking-widest">
                    <span>Stakeholder Insight</span>
                    <div className="flex items-center gap-2 italic">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                 </div>
               </div>
             ))}
             {filteredReviewItems.length === 0 && (
               <div className="text-center p-16 bg-slate-50/50 dark:bg-slate-900/30 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center gap-5 transition-colors">
                 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                    <MessageSquare className="text-slate-200 dark:text-slate-800" size={32} />
                 </div>
                 <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] leading-loose">Nenhum feedback registrado<br/>para este incremento</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
