import React, { useState } from 'react';
import { Plus, MoreHorizontal, AlertCircle, CheckCircle2, Clock, Calendar, ArrowRight, Check, User, Flag, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';
import Modal from '../common/Modal';

const KanbanColumn = ({ title, status, tasks, stories, onEditTask, onAddTask, onDropTask, onToggleBlock, onReturnToBacklog, onReorder }) => {
  const getStatusColorConfig = (status) => {
    switch (status) {
      case 'todo': return { bg: 'bg-[#2563eb]', text: 'text-white' };
      case 'in_progress': return { bg: 'bg-[#16a34a]', text: 'text-white' };
      case 'ready_to_test': return { bg: 'bg-[#fbbf24]', text: 'text-slate-900' };
      case 'review': return { bg: 'bg-[#f59e0b]', text: 'text-white' };
      case 'done': return { bg: 'bg-[#06b6d4]', text: 'text-white' };
      default: return { bg: 'bg-slate-500', text: 'text-white' };
    }
  };

  const colorConfig = getStatusColorConfig(status);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-slate-50/50', 'dark:bg-slate-800/20', 'scale-[1.01]');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('bg-slate-50/50', 'dark:bg-slate-800/20', 'scale-[1.01]');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleDragLeave(e);
    const taskId = e.dataTransfer.getData('taskId');
    onDropTask(taskId, status);
  };

  return (
    <div className="flex flex-col gap-0 min-w-[320px] flex-1 bg-[#f8fafc] rounded-2xl border border-transparent shadow-sm transition-all duration-300 overflow-hidden">
      <div className={`column-header ${colorConfig.bg} ${colorConfig.text} rounded-t-2xl font-bold flex items-center justify-between px-6 py-4 shadow-sm`}>
        <div className="flex items-center gap-2">
          <span className="text-sm">({tasks.length})</span>
          <span className="text-sm tracking-wide uppercase">{title}</span>
        </div>
        <button onClick={() => onAddTask(status)} className="p-1 rounded-full hover:bg-black/10 transition-colors">
          <Plus size={16} />
        </button>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="flex flex-col gap-6 min-h-[650px] p-6 border-x border-slate-200/50 dark:border-white/5 relative transition-all"
      >
        <div className="relative z-10 flex flex-col gap-5 items-stretch">
          {tasks.map((task, index) => (
            <div key={task.id} className="flex gap-3 items-center group/card">
              {/* Botões de Ordenação Lateral (Apenas no To Do) */}
              {status === 'todo' && (
                <div className="flex flex-col items-center bg-slate-800 dark:bg-brand-primary p-1 rounded-xl shadow-lg opacity-0 group-hover/card:opacity-100 transition-all scale-90">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'up'); }}
                    className="p-1 hover:bg-white/20 text-white/40 hover:text-white rounded-lg transition-all disabled:opacity-0"
                    disabled={index === 0}
                  >
                    <ChevronUp size={12} />
                  </button>
                  <span className="text-[8px] font-black text-white/40 py-0.5">{index + 1}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onReorder(task.id, 'down'); }}
                    className="p-1 hover:bg-white/20 text-white/40 hover:text-white rounded-lg transition-all disabled:opacity-0"
                    disabled={index === tasks.length - 1}
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              )}

              <div 
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('taskId', task.id);
                  e.currentTarget.style.opacity = '0.4';
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onClick={(e) => { 
                  if (e.target === e.currentTarget || e.currentTarget.contains(e.target)) {
                    onEditTask(task); 
                  }
                }}
                className={`group relative cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex-1 bg-white border border-slate-100 rounded-xl shadow-sm min-h-[160px] p-5 flex flex-col justify-between overflow-hidden
                  ${task.is_blocked 
                    ? 'border-[#8B0000]/50 ring-2 ring-[#8B0000]/10' 
                    : ''
                  }
                `} 
              >
                {/* Accent Bar matching column color */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${colorConfig.bg}`} />
                <div className={`badge-harmony absolute top-4 right-4 ${task.is_blocked ? 'badge-harmony-danger' : 'badge-harmony-neutral'} border-2`}>
                  {task.is_blocked ? <Flag size={10} /> : `${task.estimated_hours}h`}
                </div>
                {task.story_points > 0 && (
                  <div className="absolute top-4 left-4 badge-harmony badge-harmony-primary border-2">
                    {task.story_points} SP
                  </div>
                )}
                <div className="flex-1 pr-6 pt-6">
                  {/* Story Context */}
                  {task.story_id && (() => {
                    const story = stories.find(s => s.id === task.story_id);
                    return (
                      <div className="mb-3 p-2.5 bg-brand-primary/[0.03] dark:bg-brand-primary/[0.05] rounded-xl border border-brand-primary/10 flex flex-col gap-1.5 transition-all group-hover:bg-brand-primary/[0.06]">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
                          <p className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tighter truncate">
                            US: {story?.title || 'Geral'}
                          </p>
                        </div>
                        {(story?.assigned_to || story?.due_date) && (
                          <div className="flex items-center gap-3 ml-3 overflow-hidden">
                            {story.assigned_to && (
                              <div className="flex items-center gap-1 text-[8px] font-black text-brand-primary/60 uppercase">
                                <User size={8} /> {story.assigned_to}
                              </div>
                            )}
                            {story.due_date && (
                              <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase">
                                <Calendar size={8} /> {new Date(story.due_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <p className="text-slate-800 text-sm font-semibold leading-snug">{task.title}</p>
                  {(() => {
                      const story = stories.find(s => s.id === task.story_id);
                      const deadline = task.due_date || story?.due_date;
                      if (!deadline) return null;
                      return (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--primary-blue)]">
                          <Calendar size={12} /> {new Date(deadline).toLocaleDateString()}
                        </div>
                      );
                    })()}
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="post-it-divider dark:bg-white/5" />
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                    <span className="opacity-40">TASK-{task.id.slice(0, 4)}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleBlock(task.id); }}
                        className={`p-1 rounded transition-all ${task.is_blocked ? 'text-brand-danger bg-brand-danger/10' : 'text-slate-300 dark:text-slate-700 hover:text-brand-danger'}`}
                        title="Marcar Impedimento"
                      >
                        <AlertCircle size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onReturnToBacklog(task); }}
                        className="p-1 rounded text-slate-300 dark:text-slate-700 hover:text-brand-primary transition-all"
                        title="Voltar para Backlog"
                      >
                        <RotateCcw size={12} />
                      </button>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="truncate max-w-[80px] text-xs font-medium">{task.assigned_to || stories.find(s => s.id === task.story_id)?.assigned_to || 'Sem Dono'}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${colorConfig.bg}`}>
                          {(task.assigned_to || stories.find(s => s.id === task.story_id)?.assigned_to || 'SD').substring(0, 2).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Removed add button here as it's now in the header */}
        </div>
      </div>
    </div>
  );
};

export default function KanbanBoard() {
  const { tasks, userStories, confirmed_users, user, addTask, updateTask, updateTaskStatus, toggleTaskBlock, activeProjectId, returnStoryToBacklog, reorderTasks } = useAgileStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDodOpen, setIsDodOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [targetStatus, setTargetStatus] = useState('todo');
  const [newTask, setNewTask] = useState({ title: '', estimated_hours: 0, actual_hours: 0, assigned_to: '', story_id: '', story_points: 1, due_date: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [justification, setJustification] = useState('');
  const [blockingAlert, setBlockingAlert] = useState(null);

  const storiesInSprint = (userStories || []).filter(s => s && s.project_id === activeProjectId && s.sprint_id);
  const filteredTasks = (tasks || [])
    .filter(t => 
      t && t.project_id === activeProjectId && 
      storiesInSprint.some(s => s && s.id === t.story_id)
    )
    .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));

  const handleOpenModal = (status) => {
    setTargetStatus(status);
    setIsModalOpen(true);
  };

  const handleEditTask = (task) => {
    setEditingTask({ ...task });
    setIsEditModalOpen(true);
  };

  const handleDropTask = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Regra: Toda tarefa precisa de um responsável para mudar de status no Sprint Backlog
    if (!task.assigned_to) {
      setBlockingAlert({
        title: "Operação Bloqueada",
        message: `A tarefa "${task.title}" não possui um responsável definido. Atribua um membro antes de movê-la.`
      });
      return;
    }

    if (newStatus === 'done') {
      setSelectedTask(task);
      setIsDodOpen(true);
    } else {
      updateTaskStatus(taskId, newStatus);
    }
  };

  const handleUpdateTask = (e) => {
    e.preventDefault();
    updateTask(editingTask.id, editingTask);
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleOpenReturnModal = (task) => {
    if (user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente') {
      setSelectedTask(task);
      setIsReturnModalOpen(true);
    } else {
      alert('Apenas Gestores, Gerentes ou Product Owners podem retornar histórias para o Backlog.');
    }
  };

  const confirmReturn = () => {
    if (!justification.trim()) {
      alert('Por favor, informe uma justificativa.');
      return;
    }
    const story = userStories.find(s => s.id === selectedTask.story_id);
    if (story) {
      returnStoryToBacklog(story.id, justification);
      setIsReturnModalOpen(false);
      setJustification('');
      setSelectedTask(null);
    }
  };

  const confirmDoD = () => {
    updateTaskStatus(selectedTask.id, 'done');
    setIsDodOpen(false);
    setSelectedTask(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addTask({ ...newTask, status: targetStatus, project_id: activeProjectId });
    setIsModalOpen(false);
    setNewTask({ title: '', estimated_hours: 0, actual_hours: 0, assigned_to: '', story_points: 1, due_date: '', story_id: '' });
  };

  const columns = [
    { title: 'PENDENTE', status: 'todo' },
    { title: 'EM ANDAMENTO', status: 'in_progress' },
    { title: 'PRONTO PARA TESTE', status: 'ready_to_test' },
    { title: 'EM REVISÃO', status: 'review' },
    { title: 'CONCLUÍDO', status: 'done' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sprint Backlog</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Execução e Plano de Trabalho • Arraste para mover</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[var(--primary-blue)] animate-pulse"></span>
            Fluxo Contínuo Ativo
          </div>
        </div>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-8 snap-x">
        {columns.map((col) => (
          <div key={col.status} className="snap-center">
            <KanbanColumn 
              title={col.title} 
              status={col.status} 
              tasks={filteredTasks.filter(t => t.status === col.status)} 
              stories={userStories}
              onAddTask={handleOpenModal}
              onEditTask={handleEditTask}
              onDropTask={handleDropTask}
              onReturnToBacklog={handleOpenReturnModal}
              onReorder={reorderTasks}
              onToggleBlock={(id) => {
                const reason = prompt('Qual o motivo do impedimento? (Opcional)');
                toggleTaskBlock(id, reason);
              }}
            />
          </div>
        ))}
      </div>

      {/* Modal Adicionar Tarefa */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={`Nova Tarefa - ${targetStatus.toUpperCase()}`}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
           <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Vincular à História (US)</label>
            <select 
              required
              className="input-field dark:bg-slate-900 dark:border-slate-800"
              value={newTask.story_id}
              onChange={(e) => {
                const story = userStories.find(s => s.id === e.target.value);
                setNewTask({
                  ...newTask, 
                  story_id: e.target.value,
                  assigned_to: newTask.assigned_to || story?.assigned_to || '',
                  due_date: newTask.due_date || story?.due_date || ''
                });
              }}
            >
              <option value="">Selecione uma História...</option>
              {storiesInSprint.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">O que deve ser feito?</label>
            <input 
              required
              className="input-field dark:bg-slate-900 dark:border-slate-800" 
              placeholder="Ex: Refatorar componente de busca" 
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Data Limite</label>
              <input type="date" className="input-field dark:bg-slate-900 dark:border-slate-800" value={newTask.due_date} onChange={e => setNewTask({...newTask, due_date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Horas Previstas</label>
              <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800" value={newTask.estimated_hours} onChange={e => setNewTask({...newTask, estimated_hours: parseInt(e.target.value) || 0})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Horas Realizadas</label>
              <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800" value={newTask.actual_hours} onChange={e => setNewTask({...newTask, actual_hours: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Membro Responsável</label>
            <select 
              required
              className="input-field dark:bg-slate-900 dark:border-slate-800"
              value={newTask.assigned_to}
              onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
            >
              <option value="">Selecione o titular...</option>
              {confirmed_users.map(user => (
                <option key={user.id} value={user.name}>{user.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-4 bg-slate-900 dark:bg-white dark:text-slate-900 border-none">Criar na Sprint</button>
        </form>
      </Modal>

      {/* Modal Editar Tarefa */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Editar Tarefa Técnica"
      >
        {editingTask && (
          <form onSubmit={handleUpdateTask} className="flex flex-col gap-6">
            {/* Contexto da US no Modal de Edição */}
            {(() => {
              const story = userStories.find(s => s.id === editingTask.story_id);
              if (!story) return null;
              return (
                <div className="p-5 bg-brand-primary/5 rounded-3xl border border-brand-primary/10 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] leading-none">Vínculo com História</p>
                    <span className="text-[9px] font-black text-slate-400">#US-{story.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight">{story.title}</p>
                  <div className="flex gap-4">
                    {story.assigned_to && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 italic">
                        <User size={12} className="text-brand-primary" /> {story.assigned_to}
                      </div>
                    )}
                    {story.due_date && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 italic">
                        <Calendar size={12} className="text-brand-primary" /> {new Date(story.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Título</label>
              <input 
                required
                className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" 
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Data de Entrega</label>
                <input type="date" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={editingTask.due_date || ''} onChange={e => setEditingTask({...editingTask, due_date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Estimativa (Horas)</label>
                <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={editingTask.estimated_hours} onChange={e => setEditingTask({...editingTask, estimated_hours: parseInt(e.target.value) || 0})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Restante (Horas)</label>
                <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={editingTask.remaining_hours !== undefined ? editingTask.remaining_hours : editingTask.estimated_hours} onChange={e => setEditingTask({...editingTask, remaining_hours: parseInt(e.target.value) || 0})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Realizado (Horas)</label>
                <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={editingTask.actual_hours || 0} onChange={e => setEditingTask({...editingTask, actual_hours: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Complexidade (Fibonacci)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 5, 8, 13, 21].map(point => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => setEditingTask({...editingTask, story_points: point})}
                    className={`w-11 h-11 rounded-2xl font-black text-xs transition-all border-2 ${
                      editingTask.story_points === point 
                        ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/25 scale-110' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-brand-primary/50'
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Responsável</label>
              <select 
                required
                className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                value={editingTask.assigned_to}
                onChange={(e) => setEditingTask({...editingTask, assigned_to: e.target.value})}
              >
                <option value="">Selecione...</option>
                {confirmed_users.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-4 mt-4">
              <button type="submit" className="flex-1 btn-primary bg-slate-900 dark:bg-white dark:text-slate-900 border-none">Salvar Alterações</button>
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-[0.625rem] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase tracking-wider"
              >
                Descartar
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Retorno ao Backlog */}
      <Modal 
        isOpen={isReturnModalOpen} 
        onClose={() => setIsReturnModalOpen(false)} 
        title="Retornar para Backlog"
      >
        <div className="flex flex-col gap-6">
          <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30">
            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-500 leading-relaxed italic">
              A US completa e todas as suas tarefas serão removidas da visualização ativa da Sprint.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Motivo do Cancelamento</label>
            <textarea 
              className="input-field dark:bg-slate-900 dark:border-slate-800 min-h-[120px] resize-none"
              placeholder="Ex: Impedimento crítico, mudança de escopo..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
          </div>
          <button 
            onClick={confirmReturn}
            className="btn-primary w-full bg-brand-danger border-none"
          >
            Confirmar e Retornar
          </button>
        </div>
      </Modal>

      {/* Modal DoD */}
      <Modal 
        isOpen={isDodOpen} 
        onClose={() => setIsDodOpen(false)} 
        title="Checklist: Definição de Pronto"
      >
        <div className="flex flex-col gap-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
             <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Item sendo finalizado:</p>
             <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">"{selectedTask?.title}"</p>
          </div>
          
          <div className="flex flex-col gap-3">
            {[
              'Revisão de código concluída',
              'Critérios de Aceite atendidos',
              'Sem bugs críticos conhecidos',
              'Documentação atualizada'
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 transition-colors group">
                <div className="w-6 h-6 rounded-lg border-2 border-brand-success flex items-center justify-center bg-brand-success/5 group-hover:scale-110 transition-transform">
                  <Check size={16} className="text-brand-success" />
                </div>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-bold uppercase tracking-tight">{item}</span>
              </label>
            ))}
          </div>
          <button 
            onClick={confirmDoD}
            className="btn-primary w-full bg-brand-success shadow-lg shadow-brand-success/20 border-none"
          >
            Validar e Finalizar
          </button>
        </div>
      </Modal>

      {/* Modal de Alerta Premium */}
      <Modal 
        isOpen={!!blockingAlert} 
        onClose={() => setBlockingAlert(null)} 
        title={blockingAlert?.title || "Aviso"}
      >
        <div className="flex flex-col items-center gap-8 py-4">
          <div className="w-24 h-24 bg-brand-danger/10 rounded-[32px] flex items-center justify-center border-2 border-brand-danger/20 animate-bounce">
            <AlertCircle size={48} className="text-brand-danger" />
          </div>
          
          <div className="flex flex-col gap-4 text-center">
            <p className="text-slate-800 dark:text-white text-lg font-black leading-tight uppercase tracking-tight">
              {blockingAlert?.message}
            </p>
            <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest italic">
              "Responsabilidade é o motor da agilidade."
            </p>
          </div>

          <button 
            onClick={() => setBlockingAlert(null)}
            className="btn-primary w-full bg-slate-900 dark:bg-white dark:text-slate-900 border-none"
          >
            Entendido, vou ajustar!
          </button>
        </div>
      </Modal>
    </div>
  );
}
