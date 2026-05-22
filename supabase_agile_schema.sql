-- Scrum Time - Database Schema
-- Last updated: 2026-04-17
-- Note: Using TEXT for IDs to match the application's current string ID generation.

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    access TEXT DEFAULT 'Colaborador',
    allowed BOOLEAN DEFAULT true,
    requires_password_change BOOLEAN DEFAULT false,
    daily_hours FLOAT DEFAULT 8,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    methodology TEXT DEFAULT 'Scrum',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Epics Table
CREATE TABLE IF NOT EXISTS public.epics (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planned',
    priority_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Sprints Table
CREATE TABLE IF NOT EXISTS public.sprints (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. User Stories Table
CREATE TABLE IF NOT EXISTS public.user_stories (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    epic_id TEXT REFERENCES public.epics(id) ON DELETE SET NULL,
    sprint_id TEXT REFERENCES public.sprints(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority_order INT DEFAULT 0,
    story_points INT DEFAULT 0,
    estimated_hours FLOAT DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done')),
    assigned_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Suporte a tabelas já existentes (Garantir colunas)
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS estimated_hours FLOAT DEFAULT 0;
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.user_stories ADD COLUMN IF NOT EXISTS assigned_to TEXT;

-- Suporte a colunas de autenticação em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allowed BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT false;

-- 6. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    story_id TEXT REFERENCES public.user_stories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    estimated_hours FLOAT DEFAULT 0,
    actual_hours FLOAT DEFAULT 0,
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    assignee_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to TEXT,
    story_points INT DEFAULT 0,
    priority_order INT DEFAULT 0,
    due_date DATE,
    is_blocked BOOLEAN DEFAULT false,
    block_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Recriar se já existirem)
DROP POLICY IF EXISTS "Allow ALL on profiles" ON public.profiles;
CREATE POLICY "Allow ALL on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on projects" ON public.projects;
CREATE POLICY "Allow ALL on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on epics" ON public.epics;
CREATE POLICY "Allow ALL on epics" ON public.epics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on sprints" ON public.sprints;
CREATE POLICY "Allow ALL on sprints" ON public.sprints FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on user_stories" ON public.user_stories;
CREATE POLICY "Allow ALL on user_stories" ON public.user_stories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on tasks" ON public.tasks;
CREATE POLICY "Allow ALL on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- 7. Initial Data (Users)
INSERT INTO public.profiles (id, name, email, role, access) VALUES
('gh_user_SR-JorgeHenrique', 'Jorge Henrique', 'jorge.henrique@redesaoroque.com.br', 'Gerente Desenvolvimento', 'Gestor'),
('gh_user_germano-saoroque', 'Germano Freitas', 'germano.freitas@redesaoroque.com.br', 'Desenvolvedor', 'Colaborador'),
('gh_user_luisgustavo-saoroque', 'Luis Gustavo', 'luis.gustavo@redesaoroque.com.br', 'Desenvolvedor', 'Colaborador'),
('gh_user_viniciussilva178', 'Vinicius Silva', 'vinicius.silva@redesaoroque.com.br', 'Desenvolvedor', 'Colaborador'),
('gh_user_lucasrdsq', 'Lucas Oliveira', 'lucas.oliveira@redesaoroque.com.br', 'BI', 'Colaborador'),
('gh_user_GuilhermeRodrigues5', 'Guilherme Rodrigues', 'guilherme.rodrigues@redesaoroque.com.br', 'Desenvolvedor', 'Colaborador'),
('gh_user_rangel-rs', 'Rangel Pereira', 'rangel.pereira@redesaoroque.com.br', 'Desenvolvedor', 'Colaborador'),
('admin_1', 'Administrador', 'admin@gestorgn.com', 'Administrador', 'Admin')
ON CONFLICT (id) DO NOTHING;

-- Inserir Projeto e Épico inicial para evitar erros de FK no estado padrão
INSERT INTO public.projects (id, name, methodology, status) 
VALUES ('proj-1', 'Agile Engine', 'Scrum', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.epics (id, project_id, title, description, status, priority_order)
VALUES ('ep1', 'proj-1', 'Infraestrutura Core Engine', 'Setup inicial do motor de agilidade', 'active', 0)
ON CONFLICT (id) DO NOTHING;

-- 8. Daily Items Table
CREATE TABLE IF NOT EXISTS public.daily_items (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    yesterday TEXT,
    today TEXT,
    impediments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Retro Items Table
CREATE TABLE IF NOT EXISTS public.retro_items (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('start', 'stop', 'continue', 'action')),
    content TEXT NOT NULL,
    votes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Review Items (Feedback/Notes)
CREATE TABLE IF NOT EXISTS public.review_items (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para novas tabelas
ALTER TABLE public.daily_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;

-- Políticas para novas tabelas
DROP POLICY IF EXISTS "Allow ALL on daily_items" ON public.daily_items;
CREATE POLICY "Allow ALL on daily_items" ON public.daily_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on retro_items" ON public.retro_items;
CREATE POLICY "Allow ALL on retro_items" ON public.retro_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow ALL on review_items" ON public.review_items;
CREATE POLICY "Allow ALL on review_items" ON public.review_items FOR ALL USING (true) WITH CHECK (true);

-- Recarregar schema cache
NOTIFY pgrst, 'reload schema';
