-- ============================================================
-- SCRUM TIME — CORREÇÃO TOTAL DE BANCO DE DADOS (COLUNAS E RLS)
-- Cole todo este script no SQL Editor do Supabase e clique em RUN.
-- ============================================================

-- 1. ADICIONAR COLUNAS EM FALTA NA TABELA DE PROJETOS (projects)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority_order INT DEFAULT 0;

-- 2. ADICIONAR COLUNAS EM FALTA NA TABELA DE TAREFAS (tasks)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS remaining_hours FLOAT;

-- Histórico de Queima JSON
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS burn_history JSONB DEFAULT '{}'::jsonb;

-- Flag do Sprint Backlog (Sprint Planning)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS in_sprint_backlog BOOLEAN DEFAULT false;

-- Datas de início e conclusão (Mapeamento automático de tempo real)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;


-- 2. ADICIONAR COLUNAS EM FALTA NA TABELA DE DAILY (daily_items)
-- Colunas corretas para o novo formato de Daily
ALTER TABLE public.daily_items ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.daily_items ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.daily_items ADD COLUMN IF NOT EXISTS task_id TEXT;


-- 3. CONCEDER PERMISSÕES EXPLÍCITAS PARA TODAS AS TABELAS
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.projects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.epics TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sprints TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_stories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tasks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.daily_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.retro_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.review_items TO anon, authenticated, service_role;


-- 4. GARANTIR QUE O ROW LEVEL SECURITY ESTÁ ATIVADO EM TODAS AS TABELAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;


-- 5. REMOVER POLÍTICAS ANTIGAS PARA EVITAR DUPLICATAS OU CONFLITOS
DROP POLICY IF EXISTS "Allow ALL on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow ALL on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow ALL on epics" ON public.epics;
DROP POLICY IF EXISTS "Allow ALL on sprints" ON public.sprints;
DROP POLICY IF EXISTS "Allow ALL on user_stories" ON public.user_stories;
DROP POLICY IF EXISTS "Allow ALL on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow ALL on daily_items" ON public.daily_items;
DROP POLICY IF EXISTS "Allow ALL on retro_items" ON public.retro_items;
DROP POLICY IF EXISTS "Allow ALL on review_items" ON public.review_items;


-- 6. CRIAR POLÍTICAS UNIVERSAIS DE ACESSO LIVRE (Desenvolvimento)
CREATE POLICY "Allow ALL on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on epics" ON public.epics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on sprints" ON public.sprints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on user_stories" ON public.user_stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on daily_items" ON public.daily_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on retro_items" ON public.retro_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on review_items" ON public.review_items FOR ALL USING (true) WITH CHECK (true);


-- 7. PREENCHER DADOS EXISTENTES DE TAREFAS (Garantir remaining_hours não-nulos)
UPDATE public.tasks 
SET remaining_hours = CASE 
    WHEN status = 'done' THEN 0 
    ELSE estimated_hours 
END
WHERE remaining_hours IS NULL;


-- 8. RECARREGAR O CACHE DO SCHEMA POSTGREST
NOTIFY pgrst, 'reload schema';
