import React, { useState } from 'react';
import { Layers, Mail, Lock, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import useAgileStore from '../../store/useAgileStore';

export default function LoginView() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAgileStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await login(email.trim().toLowerCase(), password);
        if (!response.success) setError(response.message);
      } else {
        await register({ name, email: email.trim().toLowerCase(), password });
        setError('Solicitação enviada! Um gestor precisa aprovar seu acesso.');
        setIsLogin(true);
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-phase-st-retro/20 rounded-full blur-[100px]" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-brand-secondary/10 rounded-full blur-[80px] animate-bounce duration-[10s]" />

      <div className="relative z-10 w-full max-w-[450px] px-6">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 shadow-2xl flex flex-col gap-8">
          
          {/* Logo Area */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-brand-primary/40 rotate-12 hover:rotate-0 transition-transform duration-500">
              <Layers className="text-white" size={32} />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Scrum Time</h1>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">Enterprise Agile Engine</p>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
              {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLogin ? 'Acessar Workspace' : 'Solicitar Acesso'}
            </h2>

            {!isLogin && (
              <div className="flex flex-col gap-2 group">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-brand-primary">Nome Completo</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"><ShieldCheck size={18} /></span>
                  <input 
                    required 
                    type="text" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Jorge Henrique"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold outline-none focus:border-brand-primary focus:bg-white/10 transition-all placeholder:text-white/20" 
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 group">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-brand-primary">E-mail Corporativo</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"><Mail size={18} /></span>
                <input 
                  required 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold outline-none focus:border-brand-primary focus:bg-white/10 transition-all placeholder:text-white/20" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 group">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-4 transition-colors group-focus-within:text-brand-primary">Senha de Acesso</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"><Lock size={18} /></span>
                <input 
                  required 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold outline-none focus:border-brand-primary focus:bg-white/10 transition-all placeholder:text-white/20" 
                />
              </div>
            </div>

            {error && (
              <div className={`p-4 rounded-2xl text-xs font-bold text-center animate-shake ${error.includes('enviada') ? 'bg-amber-500/10 text-amber-500' : 'bg-[#8B0000]/10 text-[#8B0000]'}`}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-brand-primary/25 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Entrar no Sistema' : 'Enviar Solicitação'
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-4">
             <button 
               onClick={() => setIsLogin(!isLogin)}
               className="text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
             >
               {isLogin ? 'Não tem conta? Solicite aqui' : 'Já tem acesso? Faça Login'}
             </button>
             
             <div className="flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity">
               <div className="w-1.5 h-1.5 rounded-full bg-white" />
               <div className="w-1.5 h-1.5 rounded-full bg-white" />
               <div className="w-1.5 h-1.5 rounded-full bg-white" />
             </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-white/60 text-[9px] font-black uppercase tracking-[0.2em]">
          &copy; 2026 Redesaoroque Group | Scrum Time Apoio v1.0
        </p>
      </div>
    </div>
  );
}
