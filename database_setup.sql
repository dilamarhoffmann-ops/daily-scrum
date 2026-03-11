-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO - SUPABASE (DAILY SCRUM)
-- Copie todo este conteúdo e rode na aba "SQL Editor" do seu painel do Supabase.
-- ==========================================

-- 1. Criação da Tabela de Usuários (Users)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT,
    access TEXT DEFAULT 'Colaborador',
    password TEXT NOT NULL,
    "mustChangePassword" BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criação da Tabela de Projetos (Projects)
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Ativo',
    priority TEXT DEFAULT 'Média',
    objective TEXT,
    justification TEXT,
    "scopeIn" TEXT,
    "scopeOut" TEXT,
    acceptance TEXT,
    "startDate" TEXT,
    deadline TEXT,
    milestones TEXT,
    "ownerId" TEXT,
    "managerId" TEXT,
    team JSONB DEFAULT '[]'::jsonb,
    tech TEXT,
    budget TEXT,
    "riskKnown" TEXT,
    "riskMitigation" TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,
    impediments TEXT,
    "resolvedHistory" JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criação da Tabela do Daily (Daily Entries)
CREATE TABLE IF NOT EXISTS public.daily_entries (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    date TEXT NOT NULL,
    blockers TEXT,
    "yesterdayActivities" JSONB DEFAULT '[]'::jsonb,
    "todayActivities" JSONB DEFAULT '[]'::jsonb,
    "createdAt" NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Criação da Tabela de Configuração Global (App Config)
CREATE TABLE IF NOT EXISTS public.app_config (
    id TEXT PRIMARY KEY,
    "helpText" TEXT DEFAULT '<h4>Bem-vindo à Central de Ajuda</h4><p>Use este espaço para documentar processos da equipe.</p>',
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Políticas de RLs (Row Level Security) 
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow ALL on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on daily_entries" ON public.daily_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on app_config" ON public.app_config FOR ALL USING (true) WITH CHECK (true);

-- 4. Inserir o primeiro usuário Admin padrão
INSERT INTO public.users (id, name, email, role, access, password, "mustChangePassword")
VALUES (
  'admin_seed_' || extract(epoch from now())::text, 
  'Administrador', 
  'admin@empresa.com', 
  'Gestor de Projetos', 
  'Admin', 
  '123mudar', 
  true
) ON CONFLICT DO NOTHING;

-- 6. Inserir configuração inicial
INSERT INTO public.app_config (id, "helpText") 
VALUES ('global', '<h4>Bem-vindo à Central de Ajuda</h4><p>Use este espaço para documentar processos da equipe.</p>')
ON CONFLICT DO NOTHING;
