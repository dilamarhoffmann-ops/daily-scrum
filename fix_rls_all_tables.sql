-- ============================================================
-- SCRUM TIME — CORREÇÃO TOTAL DE RLS (ROW-LEVEL SECURITY)
-- Cole todo este script no SQL Editor do Supabase e clique em RUN.
-- ============================================================

-- 1. Conceder permissões explícitas para as tabelas do sistema
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.projects TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.epics TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sprints TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_stories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tasks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.daily_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.retro_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.review_items TO anon, authenticated, service_role;

-- 2. Garantir que o Row Level Security está ativado em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_items ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas para evitar duplicatas ou conflitos
DROP POLICY IF EXISTS "Allow ALL on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow ALL on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow ALL on epics" ON public.epics;
DROP POLICY IF EXISTS "Allow ALL on sprints" ON public.sprints;
DROP POLICY IF EXISTS "Allow ALL on user_stories" ON public.user_stories;
DROP POLICY IF EXISTS "Allow ALL on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow ALL on daily_items" ON public.daily_items;
DROP POLICY IF EXISTS "Allow ALL on retro_items" ON public.retro_items;
DROP POLICY IF EXISTS "Allow ALL on review_items" ON public.review_items;

-- 4. Criar políticas universais de acesso livre (idênticas ao padrão de desenvolvimento da app)
CREATE POLICY "Allow ALL on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on epics" ON public.epics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on sprints" ON public.sprints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on user_stories" ON public.user_stories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on daily_items" ON public.daily_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on retro_items" ON public.retro_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow ALL on review_items" ON public.review_items FOR ALL USING (true) WITH CHECK (true);

-- 5. Recarregar o cache do PostgREST para aplicar imediatamente as novas regras
NOTIFY pgrst, 'reload schema';

-- 6. Consulta de Verificação (deve listar as políticas ativas)
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
