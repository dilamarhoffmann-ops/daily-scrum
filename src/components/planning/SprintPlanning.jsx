import React, { useState } from 'react';
import { Plus, ListChecks, ChevronRight, ChevronDown, ChevronUp, Clock, Trash2, ArrowRight, User, Pencil, Calendar, Rocket, Check, AlertCircle } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';
import Modal from '../common/Modal';
import { getWorkingDays } from '../../lib/agileUtils';
import { getEpicColor } from '../../lib/colorUtils';

const StoryPlanCard = ({ story, tasks, epicName, epicId, onAddTask, onDeleteTask, onDeleteStory, onEditStory, onReorder, onMoveToSprint, isInSprint, canDelete }) => {
  const color = getEpicColor(epicId);

  return (
    <div 
      onClick={(e) => { 
        if (e.target === e.currentTarget || e.currentTarget.contains(e.target)) {
          onEditStory(story); 
        }
      }}
      className={`glass-card p-6 flex gap-6 group cursor-pointer relative overflow-hidden border ${
        isInSprint 
          ? `border-[var(--primary-blue)] ring-2 ring-[var(--primary-blue)] shadow-md` 
          : 'border-slate-100'
      }`}
    >
      {/* Background Decorative Gradient */}
      {isInSprint && (
        <div className={`absolute inset-0 opacity-[0.03] ${color.bg} pointer-events-none`} />
      )}
      {/* Accent Bar */}
      <div className={`absolute top-0 left-0 bottom-0 w-2.5 transition-all duration-500 ${isInSprint ? color.bg : 'bg-slate-200 dark:bg-slate-700'}`} />
      
      {/* Glow Effect */}
      {isInSprint && (
        <div className={`absolute -right-20 -top-20 w-64 h-64 ${color.bg} opacity-[0.03] blur-[100px] rounded-full pointer-events-none`} />
      )}

      {/* Priority Controls */}
      <div className="flex flex-col gap-2 justify-center border-r-2 border-slate-50 dark:border-white/5 pr-6 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={(e) => { e.stopPropagation(); onReorder(story.id, 'up'); }}
          className={`p-1.5 bg-slate-50 dark:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-all cursor-pointer ${isInSprint ? `hover:${color.bg}` : 'hover:bg-brand-primary'}`}
          title="Subir Prioridade"
        >
          <ChevronUp size={20} />
        </button>
        <div className="text-[10px] font-black text-slate-500 dark:text-slate-500 text-center uppercase">PRIO</div>
        <button 
          onClick={(e) => { e.stopPropagation(); onReorder(story.id, 'down'); }}
          className={`p-1.5 bg-slate-50 dark:bg-slate-800 hover:text-white rounded-lg text-slate-400 transition-all cursor-pointer ${isInSprint ? `hover:${color.bg}` : 'hover:bg-brand-primary'}`}
          title="Baixar Prioridade"
        >
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge-harmony ${color.text} border-2 ${color.border}`}>
                {epicName || 'Sem Épico'}
              </span>
              <span className="badge-harmony badge-harmony-neutral border-2">
                User Story
              </span>
              <span className="badge-harmony badge-harmony-neutral border-2">
                {story.story_points} SP
              </span>
              {story.backlog_justification && !isInSprint && (
                <span className="badge-harmony badge-harmony-danger border-2">
                  Retornada
                </span>
              )}
              {isInSprint && (
                <span className="badge-harmony badge-harmony-success border-2 flex items-center gap-2">
                  <Rocket size={12} />
                  Na Sprint
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 leading-none mt-2">
              {story.title}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); onMoveToSprint(story.id); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl hover:scale-105 active:scale-95 ${
                isInSprint 
                  ? 'bg-white dark:bg-slate-900 text-brand-success border-2 border-brand-success/30 shadow-brand-success/10' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-slate-100 dark:border-slate-700 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {isInSprint ? <Check size={16} /> : <Rocket size={16} />}
              {isInSprint ? 'Planejada' : 'Lançar Foguete'}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onAddTask(story.id); }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-slate-100 dark:border-slate-700 hover:border-brand-primary hover:text-brand-primary transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              Quebrar em Tarefas
            </button>
            {canDelete && (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditStory(story); }}
                  className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-brand-primary hover:border-brand-primary/20 rounded-2xl transition-all shadow-md"
                  title="Editar História"
                >
                  <Pencil size={20} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteStory(story.id); }}
                  className="p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-brand-danger hover:border-brand-danger/20 rounded-2xl transition-all shadow-md"
                  title="Excluir História e suas tarefas"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          {tasks.map(task => (
            <div key={task.id} className={`group relative hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-800 border ${isInSprint ? 'border-slate-200 dark:border-slate-700 shadow-sm' : 'border-slate-100 dark:border-slate-800 shadow-sm'} rounded-xl min-h-[140px] w-56 p-4 flex flex-col justify-between overflow-hidden`}>
              {/* Accent Bar */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isInSprint ? color.bg : 'bg-slate-300 dark:bg-slate-600'}`} />
              
              <div className="flex justify-between items-start pl-2">
                {task.story_points > 0 ? (
                  <div className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isInSprint ? `${color.bg} text-white` : 'bg-slate-100 text-slate-500'}`}>
                    {task.story_points} SP
                  </div>
                ) : (
                  <div />
                )}
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isInSprint ? `${color.bg} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  {task.estimated_hours}h
                </div>
              </div>
              
              <div className="flex-1 pr-2 pl-2 mt-2">
                 <p className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-snug line-clamp-3">{task.title}</p>
                 {task.due_date && (
                   <div className="mt-2 flex items-center gap-1 text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                     <Calendar size={10} />
                     {new Date(task.due_date).toLocaleDateString()}
                   </div>
                 )}
              </div>
              
              <div className="mt-4 pl-2 flex justify-between items-end w-full">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-0.5">#{task.id.slice(0, 4)}</span>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate max-w-[60px] text-[10px] font-medium text-slate-600 dark:text-slate-400">{task.assigned_to || 'Sem Dono'}</span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${isInSprint ? color.bg : 'bg-slate-300 dark:bg-slate-600'}`}>
                      {(task.assigned_to || 'SD').substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                  
                  {canDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                      className="text-slate-300 dark:text-slate-600 hover:text-brand-danger transition-all pb-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className={`col-span-full border-2 border-dashed ${isInSprint ? color.border : 'border-slate-100 dark:border-slate-800'} rounded-[32px] p-10 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic font-black uppercase text-[10px] tracking-widest w-full`}>
              Nenhuma tarefa técnica definida ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SprintPlanning() {
  const { 
    userStories, tasks, epics, confirmed_users, user, addTask, 
    sprints, setSprintGoal, deleteTask, deleteStory, updateUserStory, 
    assignStoryToSprint, reorderStories, activeProjectId, addSprint 
  } = useAgileStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [newSprint, setNewSprint] = useState({ goal: '', start_date: '', end_date: '' });
  const [newTask, setNewTask] = useState({ title: '', estimated_hours: 0, assigned_to: '' });

  const activeSprint = sprints.find(s => s.status === 'active' && s.project_id === activeProjectId) || sprints.find(s => s.project_id === activeProjectId);
  const workingDays = getWorkingDays(activeSprint?.start_date, activeSprint?.end_date) || 10;
  
  const totalCapacity = confirmed_users.reduce((acc, u) => {
    return acc + ((u.daily_hours || 8) * workingDays * 0.8);
  }, 0);

  const totalPlannedHours = userStories
    .filter(s => s.sprint_id === activeSprint?.id && s.project_id === activeProjectId)
    .reduce((acc, story) => {
      const storyTasks = tasks.filter(t => t.story_id === story.id && t.project_id === activeProjectId);
      if (storyTasks.length > 0) {
        return acc + storyTasks.reduce((tAcc, t) => tAcc + (parseFloat(t.estimated_hours) || 0), 0);
      }
      return acc + (parseFloat(story.estimated_hours) || 0);
    }, 0);

  const isOverCapacity = totalPlannedHours > totalCapacity;

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    const sprintData = {
      project_id: activeProjectId,
      goal: newSprint.goal,
      start_date: newSprint.start_date,
      end_date: newSprint.end_date,
      status: 'active'
    };
    await addSprint(sprintData);
    setIsSprintModalOpen(false);
    setNewSprint({ goal: '', start_date: '', end_date: '' });
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    addTask({ ...newTask, story_id: selectedStoryId, status: 'todo', project_id: activeProjectId });
    setIsTaskModalOpen(false);
    setNewTask({ title: '', estimated_hours: 0, assigned_to: '', story_points: 1, due_date: '' });
  };

  const handleEditStory = (e) => {
    e.preventDefault();
    updateUserStory(editingStory.id, editingStory);
    setIsEditModalOpen(false);
    setEditingStory(null);
  };

  // Only stories in progress or to be planned for active project, sorted by priority_order
  const planStories = userStories
    .filter(s => s.status !== 'done' && s.project_id === activeProjectId)
    .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-100 pb-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">Sprint Planning</h2>
          <div className="mt-4 flex flex-col gap-2 max-w-2xl">
            <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Meta da Sprint (Sprint Goal)</label>
            <input 
              className="bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-brand-primary dark:focus:border-brand-primary outline-none py-1 text-lg font-bold text-slate-700 dark:text-slate-300 placeholder:italic transition-all"
              placeholder="Ex: Entregar MVP do motor de agilidade..."
              value={activeSprint?.goal || ''}
              onChange={(e) => setSprintGoal(activeSprint.id, e.target.value)}
            />
          </div>
        </div>
        <div className={`flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border transition-all ${isOverCapacity ? 'border-brand-danger shadow-lg shadow-brand-danger/10 ring-2 ring-brand-danger/20' : 'border-slate-100 dark:border-slate-800 shadow-sm'} self-start`}>
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isOverCapacity ? 'bg-brand-danger/10 text-brand-danger' : 'bg-brand-primary/10 text-brand-primary'}`}>
             {isOverCapacity ? <AlertCircle size={22} /> : <ListChecks size={22} />}
           </div>
           <div className="flex flex-col">
             <span className={`text-xs font-black uppercase tracking-tighter ${isOverCapacity ? 'text-brand-danger' : 'text-slate-800 dark:text-white'}`}>
               {totalPlannedHours}h / {Math.floor(totalCapacity)}h
             </span>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Capacidade de Foco (80%)</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col gap-10">
        {planStories.map(story => (
          <StoryPlanCard 
            key={story.id} 
            story={story} 
            epicId={story.epic_id}
            epicName={epics.find(e => e.id === story.epic_id)?.title}
            tasks={tasks.filter(t => t.story_id === story.id && t.project_id === activeProjectId)}
            onAddTask={(id) => { setSelectedStoryId(id); setIsTaskModalOpen(true); }}
            onReorder={reorderStories}
            onMoveToSprint={(id) => {
              if (!activeSprint) {
                setIsSprintModalOpen(true);
                return;
              }
              assignStoryToSprint(id, activeSprint.id);
            }}
            isInSprint={story.sprint_id === activeSprint?.id}
            onDeleteTask={(id) => {
              if (user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente') {
                deleteTask(id);
              } else {
                alert('Apenas Gestores, Gerentes ou Product Owners podem excluir tarefas.');
              }
            }}
            onDeleteStory={(id) => {
              if (user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente') {
                if(confirm('Tem certeza que deseja excluir esta história e todas as suas tarefas técnicas?')) {
                  deleteStory(id);
                }
              } else {
                alert('Apenas Gestores, Gerentes ou Product Owners podem excluir histórias.');
              }
            }}
            onEditStory={(story) => {
              setEditingStory(story);
              setIsEditModalOpen(true);
            }}
            canDelete={user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente'}
          />
        ))}
      </div>

      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)} 
        title={`Quebrar em Tarefa Técnica: ${userStories.find(s => s.id === selectedStoryId)?.title || ''}`}
      >
        <form onSubmit={handleCreateTask} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Título da Tarefa Técnica</label>
            <textarea 
              required 
              rows={2}
              className="input-field resize-none" 
              value={newTask.title} 
              onChange={e => setNewTask({...newTask, title: e.target.value})} 
              placeholder="O que será feito tecnicamente?" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Prazo de Entrega</label>
              <input type="date" className="input-field" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hora Estimada</label>
              <input type="number" className="input-field" value={newTask.estimated_hours} onChange={e => setNewTask({...newTask, estimated_hours: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Complexidade (Fibonacci)</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 8, 13, 21].map(point => (
                <button
                  key={point}
                  type="button"
                  onClick={() => setNewTask({...newTask, story_points: point})}
                  className={`w-10 h-10 rounded-xl font-black text-xs transition-all border-2 ${
                    newTask.story_points === point 
                      ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-110' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-brand-primary/50 hover:text-brand-primary'
                  }`}
                >
                  {point}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Responsável pela Tarefa</label>
            <select 
              required
              className="input-field"
              value={newTask.assigned_to}
              onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}
            >
              <option value="">Selecione um membro...</option>
              {confirmed_users.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-4">Adicionar ao Sprint Backlog</button>
        </form>
      </Modal>

      {/* Edit Story Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar User Story">
        {editingStory && (
          <form onSubmit={handleEditStory} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Título da História</label>
              <textarea 
                required 
                className="input-field resize-none" 
                rows={3} 
                value={editingStory.title} 
                onChange={e => setEditingStory({...editingStory, title: e.target.value})} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Prazo de Entrega</label>
                <input type="date" className="input-field" value={editingStory.due_date || ''} onChange={e => setEditingStory({...editingStory, due_date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hora Estimada</label>
                <input type="number" className="input-field" value={editingStory.estimated_hours || 0} onChange={e => setEditingStory({...editingStory, estimated_hours: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Responsável pela História</label>
              <select 
                className="input-field appearance-none cursor-pointer"
                value={editingStory.assigned_to || ''}
                onChange={e => setEditingStory({...editingStory, assigned_to: e.target.value})}
              >
                <option value="">Ninguém atribuído ainda...</option>
                {confirmed_users.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Complexidade (Fibonacci)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 8, 13, 21].map(point => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => setEditingStory({...editingStory, story_points: point})}
                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all border-2 ${
                      editingStory.story_points === point 
                        ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-110' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-brand-primary/50 hover:text-brand-primary'
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-4">Salvar Alterações</button>
          </form>
        )}
      </Modal>

      {/* New Sprint Modal */}
      <Modal isOpen={isSprintModalOpen} onClose={() => setIsSprintModalOpen(false)} title="Criar e Ativar Nova Sprint">
        <form onSubmit={handleCreateSprint} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Meta da Sprint (Goal)</label>
            <textarea 
              required 
              rows={2}
              className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white resize-none" 
              value={newSprint.goal} 
              onChange={e => setNewSprint({...newSprint, goal: e.target.value})} 
              placeholder="O que vamos entregar de valor nesta iteração?" 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Data de Início</label>
              <input type="date" required className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newSprint.start_date} onChange={e => setNewSprint({...newSprint, start_date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Data de Fim</label>
              <input type="date" required className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newSprint.end_date} onChange={e => setNewSprint({...newSprint, end_date: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="btn-primary bg-brand-primary w-full mt-4 border-none">Ativar Sprint Agora 🚀</button>
        </form>
      </Modal>
    </div>
  );
}
