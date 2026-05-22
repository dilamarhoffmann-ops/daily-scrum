import React, { useState } from 'react';
import { Users, Shield, Settings, Database, CheckCircle2, XCircle, UserPlus, Clock, Plus, Calendar } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';
import Modal from '../common/Modal';
import { getWorkingDays } from '../../lib/agileUtils';

export default function SettingsView() {
  const [activeSubTab, setActiveSubTab] = useState('users');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSprintModalOpen, setIsSprintModalOpen] = useState(false);
  const [isEditSprintModalOpen, setIsEditSprintModalOpen] = useState(false);
  const [sprintForm, setSprintForm] = useState({ goal: '', start_date: '', end_date: '', status: 'todo' });
  const [editingSprintId, setEditingSprintId] = useState(null);
  
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'Developer' });
  const { 
    user: currentUser, 
    pending_users, 
    confirmed_users, 
    approveUser, 
    rejectUser, 
    addUser, 
    sprints, 
    activeProjectId, 
    updateUserHours,
    updateUser,
    deleteUser,
    addSprint,
    updateSprint
  } = useAgileStore();
  
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const canManageUsers = currentUser?.role === 'Gestor' || currentUser?.role === 'Gerente';
  const canEditUser = (userId) => canManageUsers || currentUser?.id === userId;
  
  const activeSprint = sprints.find(s => s.status === 'active' && s.project_id === activeProjectId) || sprints.find(s => s.project_id === activeProjectId);
  const workingDays = getWorkingDays(activeSprint?.start_date, activeSprint?.end_date) || 10;

  const totalCapacity = confirmed_users.reduce((acc, u) => {
    return acc + ((u.daily_hours || 8) * workingDays);
  }, 0);

  const focusCapacity = totalCapacity * 0.8;
  
  const allUsers = [...pending_users, ...confirmed_users];

  const handleAddUser = (e) => {
    e.preventDefault();
    addUser(newUser);
    setIsAddUserModalOpen(false);
    setNewUser({ name: '', email: '', password: '', role: 'Developer' });
  };

  const handleSaveSprint = (e) => {
    e.preventDefault();
    if (editingSprintId) {
      updateSprint(editingSprintId, sprintForm);
      setIsEditSprintModalOpen(false);
    } else {
      addSprint(sprintForm);
      setIsSprintModalOpen(false);
    }
    setSprintForm({ goal: '', start_date: '', end_date: '', status: 'todo' });
    setEditingSprintId(null);
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-between items-end border-b-4 border-slate-200 dark:border-slate-800 pb-8 transition-colors">
        <div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Configurações</h2>
          <p className="text-slate-500 dark:text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Gestão de Time e Parâmetros do Sistema</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setActiveSubTab('users')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'users' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'}`}
           >
             Usuários
           </button>
           <button 
             onClick={() => setActiveSubTab('project')}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'project' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800'}`}
           >
             Projeto
           </button>
        </div>
      </div>

      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                   <Users className="text-brand-primary" size={24} />
                   Membros do Time
                 </h3>
                 <button 
                   onClick={() => setIsAddUserModalOpen(true)}
                   className="flex items-center gap-2 bg-brand-primary/10 text-brand-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-sm"
                 >
                   <Plus size={14} />
                   Novo Usuário
                 </button>
               </div>
               <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                 {allUsers.length} Membros
               </span>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allUsers.map(u => {
                  const isPending = pending_users.some(p => p.id === u.id);
                  return (
                  <div key={u.id} className={`group relative bg-white dark:bg-slate-900 border ${isPending ? 'border-brand-danger/30' : 'border-slate-100 dark:border-slate-800'} rounded-[32px] p-6 shadow-sm hover:shadow-xl ${isPending ? 'hover:shadow-brand-danger/5 hover:border-brand-danger/50' : 'hover:shadow-brand-success/5 hover:border-brand-success/30'} transition-all duration-500 overflow-hidden`}>
                    {/* Hover Glow */}
                    <div className={`absolute top-0 right-0 w-24 h-24 ${isPending ? 'bg-brand-danger/5' : 'bg-brand-success/5'} rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity`} />
                    
                    <div className="flex flex-col gap-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${isPending ? 'from-brand-danger/20 to-brand-danger/5 text-brand-danger border-brand-danger/10' : 'from-brand-success/20 to-brand-success/5 text-brand-success border-brand-success/10'} rounded-2xl flex items-center justify-center font-black border text-xl shadow-inner`}>
                            {u.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-slate-800 dark:text-white font-black text-lg tracking-tight leading-none">{u.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded">
                                {u.role}
                              </span>
                              {u.id === currentUser?.id && (
                                <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-black uppercase tracking-widest rounded border border-brand-primary/10">
                                  Você
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-brand-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-brand-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isPending ? 'text-brand-danger' : 'text-brand-success'}`}>{isPending ? 'Pendente' : 'Ativo'}</span>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            <span className="text-slate-500 dark:text-slate-300">{(u.daily_hours || 8) * 0.8}h</span> / {u.daily_hours || 8}h dia
                          </p>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800/50 w-full" />

                      <div className="flex items-center justify-between">
                         <div className="flex gap-1.5">
                            {canEditUser(u.id) && (
                              <button 
                                onClick={() => {
                                  setEditingUser({ ...u });
                                  setIsEditUserModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-primary hover:text-white transition-all rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand-primary shadow-sm active:scale-95"
                              >
                                <Settings size={14} />
                                Editar
                              </button>
                            )}
                            {canManageUsers && u.id !== currentUser?.id && (
                              <button 
                                onClick={() => {
                                  setDeletingUserId(u.id);
                                  setIsDeleteConfirmModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-danger hover:bg-brand-danger/5 transition-all rounded-xl border border-transparent hover:border-brand-danger/10 active:scale-95"
                              >
                                <XCircle size={14} />
                                Remover
                              </button>
                            )}
                         </div>
                         <div className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest italic">
                           ID: {u.id.slice(0, 8)}...
                         </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
             <div className="bg-white dark:bg-slate-900 rounded-[40px] p-8 text-slate-800 dark:text-white flex flex-col gap-6 shadow-sm border border-brand-primary/10 dark:border-brand-primary/5 relative overflow-hidden ring-4 ring-white dark:ring-slate-950 transition-colors">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="p-2 bg-brand-primary/5 rounded-lg border border-brand-primary/10 dark:border-brand-primary/20">
                    <Shield className="text-brand-primary" size={24} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 dark:text-white">Portal de Segurança</h3>
                </div>
                <div className="space-y-4 relative z-10">
                   <div className="flex items-center justify-between p-4 bg-slate-50/30 dark:bg-slate-800/30 rounded-2xl border border-slate-50 dark:border-slate-800">
                     <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Seu Perfil</span>
                     <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-lg text-[10px] font-black">{currentUser?.role}</span>
                   </div>
                   <div className="flex items-center justify-between p-4 bg-slate-50/30 dark:bg-slate-800/30 rounded-2xl border border-slate-50 dark:border-slate-800">
                     <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Status de Acesso</span>
                     <div className="flex items-center gap-1.5 font-black uppercase italic text-[10px]">
                       <div className="w-2 h-2 rounded-full bg-brand-success shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                       <span className="text-brand-success">Verificado</span>
                     </div>
                   </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-500 leading-relaxed italic relative z-10">
                  Segurança Scrum Time: Acesso master concedido.
                </p>
             </div>
          </div>
        </div>
      )}

      {activeSubTab === 'project' && (
        <div className="flex flex-col gap-10">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 flex flex-col gap-8 shadow-sm transition-colors">
            <div className="flex items-center justify-between border-b-2 border-slate-50 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                  <Calendar size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Gestão de Sprints</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2">{sprints.filter(s => s.project_id === activeProjectId).length} Sprints no Histórico</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSprintForm({ goal: '', start_date: '', end_date: '', status: 'todo' });
                  setEditingSprintId(null);
                  setIsSprintModalOpen(true);
                }}
                className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-brand-primary/20"
              >
                <Plus size={16} />
                Nova Sprint
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {sprints.filter(s => s.project_id === activeProjectId).map(sprint => (
                <div key={sprint.id} className={`p-6 rounded-[32px] border-2 transition-all flex items-center justify-between ${sprint.status === 'active' ? 'border-brand-primary/30 bg-brand-primary/[0.02]' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${sprint.status === 'active' ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                      {sprint.status === 'active' ? <Clock size={20} /> : <CheckCircle2 size={20} />}
                    </div>
                    <div>
                      <p className={`text-lg font-black tracking-tight ${sprint.status === 'active' ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                        {sprint.goal}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${sprint.status === 'active' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                          {sprint.status === 'active' ? 'ATIVA' : sprint.status.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{sprint.start_date || 'N/A'} - {sprint.end_date || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {sprint.status !== 'active' ? (
                      <button 
                        onClick={() => {
                          sprints.filter(s => s.project_id === activeProjectId && s.status === 'active').forEach(s => updateSprint(s.id, { status: 'closed' }));
                          updateSprint(sprint.id, { status: 'active' });
                        }}
                        className="px-4 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary/90 transition-all"
                      >
                        Tornar Ativa
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateSprint(sprint.id, { status: 'closed' })}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        Finalizar
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setSprintForm({ goal: sprint.goal, start_date: sprint.start_date || '', end_date: sprint.end_date || '', status: sprint.status });
                        setEditingSprintId(sprint.id);
                        setIsEditSprintModalOpen(true);
                      }}
                      className="p-2 text-slate-300 hover:text-brand-primary transition-all"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border-2 border-slate-100 dark:border-slate-800 flex flex-col gap-8 shadow-sm transition-colors">
              <div className="flex items-center gap-4 border-b-2 border-slate-50 dark:border-slate-800 pb-6">
                <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
                  <Shield size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Carga do Time</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2">{confirmed_users.length} Membros Online</p>
                </div>
              </div>

              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800"><Clock className="text-brand-primary" size={20} /></div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">Período da Sprint Ativa</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{activeSprint?.start_date || 'N/A'} até {activeSprint?.end_date || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-brand-primary tracking-tighter">{workingDays}</p>
                    <p className="text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Dias Úteis</p>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest px-2">Carga Horária por Membro (Horas/Dia)</h4>
                  <div className="space-y-3">
                    {confirmed_users.map(u => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-brand-primary/20 transition-all shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 dark:text-slate-600 border border-slate-100 dark:border-slate-800 uppercase">
                             {u.name[0]}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{u.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-black text-center text-slate-800 dark:text-white outline-none focus:border-brand-primary transition-all"
                            value={u.daily_hours || 8}
                            min={0}
                            max={24}
                            onChange={(e) => updateUserHours(u.id, parseInt(e.target.value) || 0)}
                          />
                          <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase">h/dia</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 p-6 bg-slate-900 dark:bg-white rounded-[32px] text-white dark:text-slate-900 shadow-xl shadow-slate-900/10">
                   <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-end border-b border-white/10 dark:border-slate-100 pb-4">
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Foco Produtivo (80%)</p>
                            <h4 className="text-4xl font-black tracking-tighter mt-1">{Math.floor(focusCapacity)}h</h4>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Bruto</p>
                            <p className="text-lg font-black tracking-tighter">{totalCapacity}h</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="text-brand-primary" size={24} />
                        </div>
                        <p className="text-[10px] font-medium leading-relaxed italic opacity-80">
                          * Aplicado fator de 80% para reuniões, imprevistos e rituais ágeis. 
                          Limite diário sugerido: <strong>{Math.floor(focusCapacity / workingDays)}h</strong> para o time.
                        </p>
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[40px] p-10 border border-slate-100 dark:border-slate-800 flex flex-col gap-8 shadow-sm transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-brand-secondary/10 rounded-xl">
                  <Database className="text-brand-secondary" size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Backup & Sync</h3>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <Clock className="text-slate-300 dark:text-slate-700" size={18} />
                    <span className="text-xs font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Último Sync ao Supabase</span>
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-500 mb-6 italic">Sincronizado há poucos instantes</p>
                <button className="w-full bg-brand-secondary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl hover:scale-[1.02] transition-all shadow-lg shadow-brand-secondary/20 active:scale-95">
                    Forçar Sincronização Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} title="Cadastrar Novo Usuário">
        <form onSubmit={handleAddUser} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Nome Completo</label>
            <input required className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: Jorge Henrique" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">E-mail Corporativo</label>
            <input required type="email" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="email@empresa.com" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Senha Provisória</label>
            <input required type="text" className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} placeholder="Defina uma senha" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Cargo/Role</label>
            <select className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
              <option value="Developer" className="bg-white dark:bg-slate-900">Developer</option>
              <option value="Product Owner" className="bg-white dark:bg-slate-900">Product Owner</option>
              <option value="Gestor" className="bg-white dark:bg-slate-900">Gestor</option>
              <option value="Gerente" className="bg-white dark:bg-slate-900">Gerente</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full mt-2">Finalizar Cadastro</button>
        </form>
      </Modal>

      <Modal 
        isOpen={isSprintModalOpen || isEditSprintModalOpen} 
        onClose={() => { setIsSprintModalOpen(false); setIsEditSprintModalOpen(false); }} 
        title={editingSprintId ? "Editar Sprint" : "Nova Sprint Ativa"}
      >
        <form onSubmit={handleSaveSprint} className="flex flex-col gap-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-800">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Meta Principal da Sprint</label>
            <textarea 
              required
              className="w-full bg-transparent border-none text-xl font-black text-slate-800 dark:text-white placeholder:text-slate-200 outline-none resize-none h-24"
              placeholder="Ex: Lançar módulo de pagamentos v1..."
              value={sprintForm.goal}
              onChange={(e) => setSprintForm({...sprintForm, goal: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Início</label>
              <input 
                type="date" 
                required
                className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                value={sprintForm.start_date}
                onChange={(e) => setSprintForm({...sprintForm, start_date: e.target.value})}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Término</label>
              <input 
                type="date" 
                required
                className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white"
                value={sprintForm.end_date}
                onChange={(e) => setSprintForm({...sprintForm, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Status Inicial</label>
            <select 
              className="input-field dark:bg-slate-900 dark:border-slate-800 dark:text-white"
              value={sprintForm.status}
              onChange={(e) => setSprintForm({...sprintForm, status: e.target.value})}
            >
              <option value="todo">Planejada (To Do)</option>
              <option value="active">Iniciar Imediatamente (Ativa)</option>
            </select>
          </div>

          <div className="flex gap-4 mt-4">
            <button type="submit" className="flex-1 btn-primary bg-slate-900 dark:bg-white dark:text-slate-900 border-none active:scale-95 transition-all">
              {editingSprintId ? "Salvar Alterações" : "Criar e Lançar"}
            </button>
            <button 
              type="button"
              onClick={() => { setIsSprintModalOpen(false); setIsEditSprintModalOpen(false); }}
              className="px-4 py-2 rounded-[0.625rem] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Edição de Usuário */}
      <Modal 
        isOpen={isEditUserModalOpen} 
        onClose={() => setIsEditUserModalOpen(false)} 
        title={editingUser && pending_users.some(p => p.id === editingUser.id) ? "Autorizar Acesso do Membro" : "Editar Membro do Time"}
      >
        {editingUser && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              updateUser(editingUser.id, editingUser);
              setIsEditUserModalOpen(false);
            }} 
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome do Membro</label>
              <input 
                required 
                className="input-field dark:bg-slate-900" 
                value={editingUser.name} 
                onChange={e => setEditingUser({...editingUser, name: e.target.value})} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">E-mail do Membro</label>
              <input 
                required 
                type="email"
                className="input-field dark:bg-slate-900" 
                value={editingUser.email || ''} 
                onChange={e => setEditingUser({...editingUser, email: e.target.value})} 
                placeholder="email@empresa.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cargo/Função</label>
              <select 
                className="input-field dark:bg-slate-900" 
                value={editingUser.role} 
                onChange={e => setEditingUser({...editingUser, role: e.target.value})}
              >
                <option value="Developer">Developer</option>
                <option value="Product Owner">Product Owner</option>
                <option value="Gestor">Gestor</option>
                <option value="Gerente">Gerente</option>
                <option value="Scrum Master">Scrum Master</option>
                <option value="Designer">Designer</option>
                <option value="QA">QA</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Carga Horária (Horas/Dia)</label>
              <input 
                type="number" 
                min={0} max={24}
                className="input-field dark:bg-slate-900" 
                value={editingUser.daily_hours || 8} 
                onChange={e => setEditingUser({...editingUser, daily_hours: parseInt(e.target.value) || 0})} 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha (Opcional)</label>
              <input 
                type="text"
                className="input-field dark:bg-slate-900" 
                value={editingUser.password || ''} 
                onChange={e => setEditingUser({...editingUser, password: e.target.value})} 
                placeholder="Defina uma nova senha"
              />
            </div>
            <div className="flex gap-3 mt-4">
               {pending_users.some(p => p.id === editingUser.id) ? (
                 <>
                   <button 
                     type="button" 
                     onClick={() => { approveUser(editingUser.id); setIsEditUserModalOpen(false); }} 
                     className="flex-1 btn-primary !bg-brand-success !shadow-brand-success/20 hover:!bg-brand-success/90"
                   >
                     Autorizar Acesso
                   </button>
                   <button 
                     type="button" 
                     onClick={() => { rejectUser(editingUser.id); setIsEditUserModalOpen(false); }} 
                     className="flex-1 btn-primary !bg-brand-danger !shadow-brand-danger/20 hover:!bg-brand-danger/90"
                   >
                     Rejeitar
                   </button>
                 </>
               ) : (
                 <button type="submit" className="flex-1 btn-primary">Salvar Alterações</button>
               )}
               <button 
                 type="button" 
                 onClick={() => setIsEditUserModalOpen(false)}
                 className="px-4 py-2 rounded-[0.625rem] bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-xs uppercase tracking-wider"
               >
                 Cancelar
               </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal 
        isOpen={isDeleteConfirmModalOpen} 
        onClose={() => setIsDeleteConfirmModalOpen(false)} 
        title="Remover Membro"
      >
        <div className="flex flex-col gap-6 text-center">
          <div className="w-20 h-20 bg-brand-danger/10 text-brand-danger rounded-full flex items-center justify-center mx-auto mb-2">
            <XCircle size={40} />
          </div>
          <div>
            <p className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Tem certeza absoluto?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic mt-2">
              Esta ação removerá o membro permanentemente das configurações e cálculos de carga.
            </p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                deleteUser(deletingUserId);
                setIsDeleteConfirmModalOpen(false);
              }}
              className="flex-1 btn-primary bg-brand-danger shadow-lg shadow-brand-danger/20 active:scale-95 transition-all"
            >
              Sim, Remover Membro
            </button>
            <button 
              onClick={() => setIsDeleteConfirmModalOpen(false)}
              className="flex-1 py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[0.625rem] font-semibold uppercase tracking-wider text-xs hover:bg-slate-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
