export const EPIC_COLORS = {
  0: { 
    bg: 'bg-brand-primary', 
    text: 'text-brand-primary', 
    border: 'border-brand-primary/20', 
    light: 'bg-pastel-blue', 
    glow: 'shadow-brand-primary/10', 
    hover: 'hover:border-brand-primary' 
  },
  1: { 
    bg: 'bg-brand-success', 
    text: 'text-brand-success', 
    border: 'border-brand-success/20', 
    light: 'bg-pastel-mint', 
    glow: 'shadow-brand-success/10', 
    hover: 'hover:border-brand-success' 
  },
  2: { 
    bg: 'bg-phase-dev-backlog', 
    text: 'text-phase-dev-backlog', 
    border: 'border-phase-dev-backlog/20', 
    light: 'bg-pastel-yellow', 
    glow: 'shadow-phase-dev-backlog/10', 
    hover: 'hover:border-phase-dev-backlog' 
  },
  3: { 
    bg: 'bg-brand-danger', 
    text: 'text-brand-danger', 
    border: 'border-brand-danger/20', 
    light: 'bg-pastel-rose', 
    glow: 'shadow-brand-danger/10', 
    hover: 'hover:border-brand-danger' 
  },
  4: { 
    bg: 'bg-phase-dev-daily', 
    text: 'text-phase-dev-daily', 
    border: 'border-phase-dev-daily/20', 
    light: 'bg-slate-50 dark:bg-slate-800/50', 
    glow: 'shadow-phase-dev-daily/10', 
    hover: 'hover:border-phase-dev-daily' 
  },
  5: { 
    bg: 'bg-phase-st-plan', 
    text: 'text-phase-st-plan', 
    border: 'border-phase-st-plan/20', 
    light: 'bg-pastel-purple', 
    glow: 'shadow-phase-st-plan/10', 
    hover: 'hover:border-phase-st-plan' 
  },
};

export const getEpicColor = (epicId) => {
  // Retorna uma cor fixa (brand-primary) para todos os épicos
  // conforme solicitado para padronizar o visual.
  return EPIC_COLORS[0];
};
