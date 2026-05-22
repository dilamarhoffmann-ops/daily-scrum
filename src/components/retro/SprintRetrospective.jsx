import React, { useState } from 'react';
import { RotateCcw, Plus, Trash2, Heart, Ban, PlayCircle, Star } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';

const RetroCard = ({ item, onDelete }) => {
  const getIcon = () => {
    switch (item.category) {
      case 'keep': return <Heart className="text-brand-success" size={18} />;
      case 'stop': return <Ban className="text-brand-danger" size={18} />;
      case 'start': return <PlayCircle className="text-brand-primary" size={18} />;
      default: return <Star className="text-brand-secondary" size={18} />;
    }
  };

  const getBorder = () => {
    switch (item.category) {
      case 'keep': return 'border-brand-success/20 bg-brand-success/5 dark:bg-brand-success/10 text-brand-success';
      case 'stop': return 'border-brand-danger/20 bg-brand-danger/5 dark:bg-brand-danger/10 text-brand-danger';
      case 'start': return 'border-brand-primary/20 bg-brand-primary/5 dark:bg-brand-primary/10 text-brand-primary';
      default: return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400';
    }
  };

  return (
    <div className={`glass-card p-6 border transition-all hover:shadow-md ${getBorder()} group relative`}>
      <div className="flex gap-4 items-start pr-8">
        <div className="shrink-0 mt-1">{getIcon()}</div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{item.content}</p>
      </div>
      <button 
        onClick={() => onDelete(item.id)}
        className="absolute top-4 right-4 p-2 text-slate-300 dark:text-slate-700 hover:text-brand-danger opacity-0 group-hover:opacity-100 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default function SprintRetrospective() {
  const { retro_items, addRetroItem, deleteRetroItem, activeProjectId, archiveProject, projects, user } = useAgileStore();
  const activeProject = projects.find(p => p.id === activeProjectId);
  const filteredRetro = retro_items.filter(item => item.project_id === activeProjectId);
  const [newItem, setNewItem] = useState({ content: '', category: 'keep' });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newItem.content.trim()) return;
    addRetroItem({ ...newItem, project_id: activeProjectId });
    setNewItem({ ...newItem, content: '' });
  };

  const handleArchive = () => {
    if (window.confirm(`Deseja realmente finalizar a Retrospectiva e ARQUIVAR o projeto "${activeProject?.name}"? Isso encerrará o ciclo de vida deste projeto operacionalmente.`)) {
      archiveProject(activeProjectId);
      alert('Projeto arquivado com sucesso!');
    }
  };

  const categories = [
    { id: 'keep', title: 'O que fizemos bem?', description: 'Pontos positivos e sucessos', color: 'text-brand-success' },
    { id: 'stop', title: 'O que não repetir?', description: 'Frustrações e impedimentos', color: 'text-brand-danger' },
    { id: 'start', title: 'O que podemos melhorar?', description: 'Ideias e melhorias para a próxima', color: 'text-brand-primary' },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all duration-500">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Sprint Retrospective</h2>
          <p className="text-slate-500 dark:text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Melhorias Contínuas para a Próxima Sprint</p>
        </div>
        <div className="flex items-center gap-4 self-start">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
             <RotateCcw className="text-phase-st-retro" size={24} />
             <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter italic">KSS Protocol</span>
          </div>
          {activeProject?.status === 'active' && (user?.role === 'Gestor' || user?.role === 'Product Owner') && (
            <button 
              onClick={handleArchive}
              className="bg-brand-danger/10 text-brand-danger hover:bg-brand-danger hover:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 border-brand-danger/20"
            >
              Finalizar e Arquivar Projeto
            </button>
          )}
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-card p-8 transition-all">
        <form onSubmit={handleCreate} className="flex gap-4">
          <select 
            className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-2 text-xs font-black uppercase tracking-widest outline-none focus:border-phase-st-retro transition-all cursor-pointer text-slate-900 dark:text-white"
            value={newItem.category}
            onChange={e => setNewItem({...newItem, category: e.target.value})}
          >
            <option value="keep">😊 O que fizemos bem?</option>
            <option value="stop">🛑 O que não repetir?</option>
            <option value="start">💡 O que podemos melhorar?</option>
          </select>
          <input 
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-phase-st-retro transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
            placeholder="Compartilhe seu insight com o time..."
            value={newItem.content}
            onChange={e => setNewItem({...newItem, content: e.target.value})}
          />
          <button type="submit" className="btn-primary px-6 bg-slate-900 dark:bg-white dark:text-slate-900 border-none">
            Adicionar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {categories.map(cat => (
          <div key={cat.id} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1 px-2 border-b-2 border-slate-100 dark:border-slate-800 pb-4">
              <h3 className={`text-lg font-bold ${cat.color}`}>{cat.title}</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{cat.description}</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {filteredRetro.filter(item => item.category === cat.id).map(item => (
                <RetroCard key={item.id} item={item} onDelete={deleteRetroItem} />
              ))}
              {filteredRetro.filter(item => item.category === cat.id).length === 0 && (
                <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex items-center justify-center opacity-30 dark:opacity-20 italic text-xs font-bold text-slate-400 dark:text-slate-600">
                   Aguardando colaboração...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
