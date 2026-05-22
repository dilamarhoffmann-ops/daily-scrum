-- ============================================================
-- SCRUM TIME — FIX RLS POLICIES
-- Cole este script no SQL Editor do Supabase e execute.
-- Criado em: 2026-05-22
-- ============================================================

-- 1. Habilitar RLS em todas as tabelas (idempotente)
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items   ENABLE ROW LEVEL SECURITY;

-- 2. Recriar políticas (DROP + CREATE é idempotente)
DROP POLICY IF EXISTS "Allow ALL on profiles"      ON public.profiles;
DROP POLICY IF EXISTS "Allow ALL on projects"       ON public.projects;
DROP POLICY IF EXISTS "Allow ALL on epics"          ON public.epics;
DROP POLICY IF EXISTS "Allow ALL on sprints"        ON public.sprints;
DROP POLICY IF EXISTS "Allow ALL on user_stories"   ON public.user_stories;
DROP POLICY IF EXISTS "Allow ALL on tasks"          ON public.tasks;
DROP POLICY IF EXISTS "Allow ALL on daily_items"    ON public.daily_items;
DROP POLICY IF EXISTS "Allow ALL on retro_items"    ON public.retro_items;
DROP POLICY IF EXISTS "Allow ALL on review_items"   ON public.review_items;

CREATE POLICY "Allow ALL on profiles"      ON public.profiles      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on projects"       ON public.projects       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on epics"          ON public.epics          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on sprints"        ON public.sprints        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on user_stories"   ON public.user_stories   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on tasks"          ON public.tasks          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on daily_items"    ON public.daily_items    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on retro_items"    ON public.retro_items    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on review_items"   ON public.review_items   FOR ALL USING (true) WITH CHECK (true);

-- 3. Recarregar cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- Verificação: Listar políticas ativas (deve retornar 9 linhas)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
