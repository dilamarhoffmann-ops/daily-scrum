import React, { useState } from 'react';
import { 
  Plus, Trash2, Rocket, Clock, Calendar, ChevronDown, ChevronUp, 
  MessageSquare, Check, Hash, Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';
import useAgileStore from '../../store/useAgileStore';
import Modal from '../common/Modal';
import { getEpicColor } from '../../lib/colorUtils';

const StoryCard = ({ story, tasks, epicName, onEdit, onDelete, onAddTask, onMoveToSprint, onReorder, canDelete, storyPriority, isReadOnly }) => {
  const color = getEpicColor(story.epic_id);
  const isInSprint = !!story.sprint_id;
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  return (
    <div 
      onClick={(e) => { 
        if (!isReadOnly && (e.target === e.currentTarget || e.currentTarget.contains(e.target))) {
          onEdit(story); 
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



      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`badge-harmony ${color.text} border-2 ${color.border}`}>
                {epicName || 'Sem Épico'}
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
            
            {/* Story Progress Bar */}
            {totalTasks > 0 && (
              <div className="mt-4 max-w-md">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Progresso das Tarefas
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {completedTasks}/{totalTasks} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${color.bg}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <button 
                onClick={(e) => { e.stopPropagation(); onMoveToSprint(story.id); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all shadow-md hover:scale-105 active:scale-95 ${
                  isInSprint 
                    ? 'bg-white dark:bg-slate-900 text-brand-success border-2 border-brand-success/30 shadow-brand-success/10' 
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-2 border-slate-100 dark:border-slate-700 hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                {isInSprint ? <Check size={14} /> : <Rocket size={14} />}
                {isInSprint ? 'Planejada' : 'Lançar Foguete'}
              </button>
            )}

            {canDelete && !isReadOnly && (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(story); }}
                  className="p-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-brand-primary hover:border-brand-primary/20 rounded-xl transition-all shadow-md"
                >
                  <Pencil size={15} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(story.id); }}
                  className="p-2 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-brand-danger hover:border-brand-danger/20 rounded-xl transition-all shadow-md"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )}
            {isReadOnly && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-200/30">
                Somente Leitura
              </span>
            )}
          </div>
        </div>

        {/* Tasks Preview - Mirroring Sprint Planning */}
        <div className="flex flex-wrap gap-4 mt-2">
          {tasks.map(task => (
            <div key={task.id} className={`group relative hover:shadow-md hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-slate-800 border ${isInSprint ? 'border-slate-200 dark:border-slate-700 shadow-sm' : 'border-slate-100 dark:border-slate-800 shadow-sm'} rounded-xl min-h-[120px] w-48 p-4 flex flex-col justify-between overflow-hidden`}>
              {/* Accent Bar */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${isInSprint ? color.bg : 'bg-slate-300 dark:bg-slate-600'}`} />
              
              <div className="flex justify-between items-center pl-2 mb-2">
                <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white shadow-sm">
                  Prio {storyPriority}
                </span>
                <div className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isInSprint ? `${color.bg} text-white` : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                  {task.estimated_hours}h
                </div>
              </div>
              
              <div className="flex-1 pr-6 pl-2 mt-1">
                 <p className="text-slate-800 dark:text-slate-200 text-xs font-bold leading-snug line-clamp-3">{task.title}</p>
              </div>
              
              <div className="mt-4 pl-2 flex justify-between items-center w-full">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">#{task.id.slice(0, 4)}</span>
                <div className="flex items-center gap-1.5">
                  <span className="truncate max-w-[50px] text-[10px] font-medium text-slate-600 dark:text-slate-400">{task.assigned_to || 'Sem Dono'}</span>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${isInSprint ? color.bg : 'bg-slate-300 dark:bg-slate-600'}`}>
                    {(task.assigned_to || 'SD').substring(0, 2).toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className={`flex items-center gap-1.5 ${isInSprint ? 'text-white/60 bg-white/10' : `${color.text} ${color.light}`} px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border ${isInSprint ? 'border-white/10' : color.border}`}>
              <Clock size={12} />
              {story.estimated_hours}h Estimadas
            </div>
          )}
          {story.due_date && (
            <div className={`flex items-center gap-1.5 ${isInSprint ? 'text-white/60 bg-white/10' : 'text-slate-400 bg-slate-50 dark:bg-slate-800'} px-3 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border ${isInSprint ? 'border-white/10' : 'border-slate-100 dark:border-slate-700'}`}>
              <Calendar size={12} />
              Prazo: {new Date(story.due_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {story.backlog_justification && !isInSprint && (
          <div className="p-4 rounded-2xl flex items-start gap-3 bg-brand-danger/5 border border-brand-danger/10">
            <MessageSquare size={14} className="text-brand-danger shrink-0 mt-1" />
            <p className="text-[11px] font-bold italic leading-tight text-brand-danger">
              {story.backlog_justification}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const EpicCard = ({ epic, stories, tasks, onAddStory, onEditStory, onMoveToSprint, onMoveStoryToSprint, onDelete, onDeleteStory, onReorderStories, onReorder, onAddStoryToStory, canDelete, isFinished, rank, isReadOnly }) => {
  const { userStories, activeProjectId } = useAgileStore();
  const [expanded, setExpanded] = useState(!isFinished);
  const color = getEpicColor(epic.id);
  
  const totalPoints = stories.reduce((acc, s) => acc + (s.story_points || 0), 0);
  const donePoints = stories.filter(s => s.status === 'done').reduce((acc, s) => acc + (s.story_points || 0), 0);
  const progressPercent = totalPoints > 0 ? (donePoints / totalPoints) * 100 : 0;

  return (
    <div className={`flex flex-col rounded-3xl overflow-hidden transition-all duration-500 bg-white border border-slate-100 shadow-sm hover:shadow-md ${isFinished ? 'opacity-70 grayscale-[0.5]' : 'mb-8'}`}>
      <div 
        onClick={() => setExpanded(!expanded)}
        className={`p-8 cursor-pointer flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 transition-all duration-300 bg-white hover:bg-slate-50 ${expanded ? `border-b border-slate-100` : ''}`}
      >
        <div className="flex items-center gap-8">
           {!isFinished && !isReadOnly && (
            <div className="flex flex-col items-center bg-slate-50 border border-slate-200/80 p-2 rounded-xl gap-0.5 shadow-sm">
              <button 
                onClick={(e) => { e.stopPropagation(); onReorder(epic.id, 'up'); }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-all active:scale-90"
              >
                <ChevronUp size={14} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none">RANK</span>
                <span className={`text-base font-black ${color.text} tabular-nums leading-tight`}>{rank}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onReorder(epic.id, 'down'); }}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-all active:scale-90"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className={`w-2 h-2 rounded-full ${color.bg} animate-pulse`} />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {stories.length} Histórias
                  </span>
               </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800 leading-none">{epic.title}</h3>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-10 w-full lg:w-auto">
          <div className="flex flex-col items-end gap-3 min-w-[300px] w-full md:w-auto">
            <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
               <span>Progresso Estratégico</span>
               <span className={color.text}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden p-1 border border-slate-200 dark:border-slate-800 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                className="h-full rounded-full bg-brand-primary shadow-sm"
              />
            </div>
            <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span>{donePoints} / {totalPoints} SP</span>
               <span className="opacity-50">Conclusão de Valor</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
             {canDelete && !isReadOnly && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(epic.id); }}
                  className="p-2.5 border-2 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 hover:text-brand-danger hover:border-brand-danger/20 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
             )}
             <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-400 border-2 border-slate-100 dark:border-slate-800 transition-all duration-500 ${expanded ? 'rotate-180 bg-white dark:bg-slate-800 border-brand-primary/20 text-brand-primary shadow-md' : ''}`}>
                <ChevronDown size={18} />
             </div>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-12 flex flex-col gap-10 bg-slate-50/50 dark:bg-slate-950/50 border-t-[3px] border-slate-100 dark:border-slate-900/50">
          <div className="flex items-center gap-3 px-2">
            <div className={`w-1.5 h-10 rounded-full ${color.bg}`} />
            <div>
              <h4 className="text-xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter">Detalhamento das Histórias</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Clique para editar ou priorizar</p>
            </div>
          </div>
          <div className="flex flex-col gap-8">
            {[...stories].sort((a, b) => {
              if ((a.priority_order || 0) !== (b.priority_order || 0)) {
                return (a.priority_order || 0) - (b.priority_order || 0);
              }
              return a.id.localeCompare(b.id);
            }).map(story => {
              const sortedStories = [...userStories]
                .filter(s => s.project_id === activeProjectId)
                .sort((a, b) => {
                  if ((a.priority_order || 0) !== (b.priority_order || 0)) {
                    return (a.priority_order || 0) - (b.priority_order || 0);
                  }
                  return a.id.localeCompare(b.id);
                });
              const storyPriority = sortedStories.findIndex(s => s.id === story.id) + 1;
              return (
                <StoryCard 
                  key={story.id}
                  story={story}
                  epicName={epic.title}
                  tasks={tasks.filter(t => t.story_id === story.id)}
                  onEdit={onEditStory}
                  onDelete={onDeleteStory}
                  onAddTask={onAddStoryToStory}
                  onMoveToSprint={onMoveStoryToSprint}
                  onReorder={onReorderStories}
                  canDelete={canDelete}
                  storyPriority={storyPriority}
                  isReadOnly={isReadOnly}
                />
              );
            })}
          </div>
          {!isFinished && !isReadOnly && (
            <button 
              onClick={() => onAddStory(epic.id)}
              className="group p-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-phase-po/50 hover:text-phase-po hover:bg-white dark:hover:bg-slate-900 transition-all duration-500 w-full"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Plus size={18} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Adicionar Nova História ao Épico</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default function ProductBacklog() {
  const { 
    epics, userStories, sprints, tasks, user, confirmed_users, projects,
    addEpic, addUserStory, addTask, updateUserStory, assignEpicToSprint, 
    assignStoryToSprint, deleteStory, deleteEpic, deleteTask, reorderEpics, 
    reorderStories, activeProjectId, addSprint, addProject, archiveProject 
  } = useAgileStore();
  
  const activeProject = projects.find(p => p.id === activeProjectId);
  const isProjectPaused = activeProject?.status === 'paused';
  
  const [isEpicModalOpen, setIsEpicModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedEpicId, setSelectedEpicId] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  
  const [newProjectData, setNewProjectData] = useState({ name: '', methodology: 'Scrum' });
  const [newSprint, setNewSprint] = useState({ goal: '', start_date: '', end_date: '' });
  const [newEpic, setNewEpic] = useState({ title: '', description: '' });
  const [newStory, setNewStory] = useState({ title: '', story_points: 1, estimated_hours: 0, due_date: '', assigned_to: '' });
  const [newTask, setNewTask] = useState({ title: '', estimated_hours: 0, assigned_to: '', story_points: 1, due_date: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const hasActiveSprint = sprints.some(s => s.status === 'active' && s.project_id === activeProjectId);

  const handleCreateProject = (e) => {
    e.preventDefault();
    addProject(newProjectData);
    setIsProjectModalOpen(false);
    setNewProjectData({ name: '', methodology: 'Scrum' });
  };

  const filteredEpics = epics
    .filter(e => e.project_id === activeProjectId)
    .filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userStories.some(s => s.epic_id === e.id && s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => (a.priority_order || 0) - (b.priority_order || 0));

  const filteredStories = userStories.filter(s => s.project_id === activeProjectId);
  const activeSprint = sprints.find(s => s.status === 'active' && s.project_id === activeProjectId) || sprints.find(s => s.project_id === activeProjectId);


  const handleCreateEpic = (e) => {
    e.preventDefault();
    addEpic(newEpic);
    setIsEpicModalOpen(false);
    setNewEpic({ title: '', description: '' });
  };

  const handleCreateStory = (e) => {
    e.preventDefault();
    addUserStory({ ...newStory, epic_id: selectedEpicId, status: 'backlog', project_id: activeProjectId });
    setIsStoryModalOpen(false);
    setNewStory({ title: '', story_points: 1, estimated_hours: 0, due_date: '', assigned_to: '' });
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

  const handleMoveToSprint = (epicId) => {
    if (activeSprint) {
      assignEpicToSprint(epicId, activeSprint.id);
    } else {
      setIsSprintModalOpen(true);
    }
  };

  const isEpicFinished = (epicId) => {
    const epicStories = filteredStories.filter(s => s.epic_id === epicId);
    return epicStories.length > 0 && epicStories.every(s => s.status === 'done');
  };

  const activeEpics = filteredEpics.filter(e => !isEpicFinished(e.id));
  const finishedEpics = filteredEpics.filter(e => isEpicFinished(e.id));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-100 pb-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-800">Product Backlog</h2>
          <div className="mt-4 flex flex-col gap-2 max-w-2xl">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest px-1">Visão do Produto (Search & Filters)</label>
            <div className="relative group">
              <input 
                className="w-full bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-phase-po outline-none py-1 text-lg font-bold text-slate-700 dark:text-slate-300 placeholder:italic transition-all"
                placeholder="Pesquisar épicos, histórias ou temas estratégicos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-0 bottom-2 text-slate-300 dark:text-slate-700 group-hover:text-phase-po transition-colors">
                <Hash size={14} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end">
          <button 
            onClick={() => setIsProjectModalOpen(true)}
            className="btn-primary bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 border-none cursor-pointer"
          >
            <Plus size={16} />
            Novo Produto
          </button>
          {!hasActiveSprint && !isProjectPaused && (
            <button 
              onClick={() => setIsSprintModalOpen(true)}
              className="btn-primary bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 border-none cursor-pointer"
            >
              <Rocket size={16} />
              Ativar Sprint
            </button>
          )}
          {!isProjectPaused && (
            <button 
              onClick={() => setIsEpicModalOpen(true)}
              className="btn-primary bg-phase-po hover:bg-phase-po/90 flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl shadow-lg shadow-phase-po/20 transition-all hover:scale-105 active:scale-95 border-none cursor-pointer"
            >
              <Plus size={16} />
              Novo Épico
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-phase-po animate-pulse" />
          Épicos em Desenvolvimento
        </h3>
        {activeEpics.map((epic, index) => (
          <EpicCard 
            key={epic.id} 
            epic={epic} 
            stories={filteredStories.filter(s => s.epic_id === epic.id)}
            tasks={tasks.filter(t => t.project_id === activeProjectId)}
            rank={index + 1}
            onAddStory={(id) => { setSelectedEpicId(id); setIsStoryModalOpen(true); }}
            onEditStory={(story) => { setEditingStory(story); setIsEditModalOpen(true); }}
            onMoveToSprint={handleMoveToSprint}
            onMoveStoryToSprint={(storyId) => {
              if (!activeSprint) {
                setIsSprintModalOpen(true);
                return;
              }
              assignStoryToSprint(storyId, activeSprint.id);
            }}
            onDelete={deleteEpic}
            onDeleteStory={(id) => {
              if (user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente') {
                if(confirm('Tem certeza que deseja excluir esta história?')) {
                  deleteStory(id);
                }
              } else {
                alert('Apenas Gestores, Gerentes ou Product Owners podem excluir histórias.');
              }
            }}
            onReorder={reorderEpics}
            onReorderStories={reorderStories}
            onAddStoryToStory={(id) => { setSelectedStoryId(id); setIsTaskModalOpen(true); }}
            canDelete={(user?.role === 'Gestor' || user?.role === 'Product Owner' || user?.role === 'Gerente') && !isProjectPaused}
            isReadOnly={isProjectPaused}
          />
        ))}

        {finishedEpics.length > 0 && (
          <div className="mt-12 flex flex-col gap-8">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] px-2 flex items-center gap-2">
              <Check size={16} className="text-brand-success" />
              Épicos Finalizados / Arquivados
            </h3>
            <div className="flex flex-col gap-8">
              {finishedEpics.map((epic, index) => (
                <EpicCard 
                  key={epic.id} 
                  epic={epic} 
                  isFinished={true}
                  rank={index + 1}
                  stories={filteredStories.filter(s => s.epic_id === epic.id)}
                  tasks={tasks.filter(t => t.project_id === activeProjectId)}
                  onAddStory={() => {}}
                  onEditStory={(story) => { setEditingStory(story); setIsEditModalOpen(true); }}
                  onMoveToSprint={() => {}}
                  onMoveStoryToSprint={(storyId) => assignStoryToSprint(storyId, activeSprint?.id)}
                  onDelete={() => {}}
                  onReorder={() => {}}
                  onReorderStories={() => {}}
                  canDelete={false}
                  isReadOnly={isProjectPaused}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isEpicModalOpen} onClose={() => setIsEpicModalOpen(false)} title="Criar Novo Épico">
        <form onSubmit={handleCreateEpic} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Título do Épico</label>
            <input required className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newEpic.title} onChange={e => setNewEpic({...newEpic, title: e.target.value})} placeholder="Ex: Módulo de Checkout" />
          </div>
          <button type="submit" className="btn-primary bg-phase-po hover:bg-phase-po/90 w-full mt-4">Criar Épico</button>
        </form>
      </Modal>

      <Modal isOpen={isStoryModalOpen} onClose={() => setIsStoryModalOpen(false)} title="Nova User Story">
        <form onSubmit={handleCreateStory} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">O que deve ser feito? (User Story)</label>
            <textarea required className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white resize-none" rows={3} value={newStory.title} onChange={e => setNewStory({...newStory, title: e.target.value})} placeholder="Ex: Como usuário, quero..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Prazo de Entrega</label>
              <input type="date" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newStory.due_date} onChange={e => setNewStory({...newStory, due_date: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hora Estimada</label>
              <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newStory.estimated_hours} onChange={e => setNewStory({...newStory, estimated_hours: parseInt(e.target.value) || 0})} />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Complexidade (Fibonacci)</label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 5, 8, 13, 21].map(point => (
                <button
                  key={point}
                  type="button"
                  onClick={() => setNewStory({...newStory, story_points: point})}
                  className={`w-11 h-11 rounded-2xl font-black text-xs transition-all border-2 ${
                    newStory.story_points === point 
                      ? 'bg-phase-po border-phase-po text-white shadow-lg shadow-phase-po/25 scale-110' 
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-phase-po/50'
                  }`}
                >
                  {point}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">Responsável pela História</label>
            <select 
              className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white appearance-none cursor-pointer"
              value={newStory.assigned_to || ''}
              onChange={e => setNewStory({...newStory, assigned_to: e.target.value})}
            >
              <option value="">Ninguém atribuído ainda...</option>
              {confirmed_users.map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
          
          <button type="submit" className="btn-primary bg-phase-po hover:bg-phase-po/90 w-full mt-4 border-none">Criar História no Backlog</button>
        </form>
      </Modal>

      {/* Task Modal */}
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

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Configurar User Story">
        {editingStory && (
          <form onSubmit={handleEditStory} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Título da História</label>
              <textarea 
                required 
                className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white resize-none" 
                rows={3} 
                value={editingStory.title} 
                onChange={e => setEditingStory({...editingStory, title: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Prazo de Entrega</label>
                <input type="date" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={editingStory.due_date || ''} onChange={e => setEditingStory({...editingStory, due_date: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Hora Estimada</label>
                <input type="number" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={editingStory.estimated_hours || 0} onChange={e => setEditingStory({...editingStory, estimated_hours: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-slate-500 dark:text-slate-600 uppercase tracking-widest">Responsável pela História</label>
              <select 
                className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white appearance-none cursor-pointer"
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
                    className={`w-11 h-11 rounded-2xl font-black text-xs transition-all border-2 ${
                      editingStory.story_points === point 
                        ? 'bg-phase-po border-phase-po text-white shadow-lg shadow-phase-po/25 scale-110' 
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:border-phase-po/50'
                    }`}
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>
            
            <button type="submit" className="btn-primary bg-phase-po hover:bg-phase-po/90 w-full mt-4 border-none">Salvar Alterações</button>
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

      {/* New Project/Product Modal */}
      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Criar Novo Produto">
        <form onSubmit={handleCreateProject} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome do Produto</label>
            <input 
              required 
              className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" 
              placeholder="Ex: Agile Sphere Engine" 
              value={newProjectData.name}
              onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full mt-4 bg-slate-800 hover:bg-slate-900 border-none">Inicializar Produto</button>
        </form>
      </Modal>
    </div>
  );
}
