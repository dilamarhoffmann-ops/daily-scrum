-- Script de Correção: Permissões RLS (Row-Level Security) na tabela user_stories
-- Rode este script no SQL Editor do Supabase para corrigir o erro 42501

-- 1. Garante que as permissões gerais da tabela existam
GRANT ALL ON TABLE public.user_stories TO anon, authenticated, service_role;

-- 2. Habilita o Row Level Security (caso tenha sido desativado por acidente)
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;

-- 3. Remove as políticas antigas para evitar duplicação ou conflitos
DROP POLICY IF EXISTS "Allow ALL on user_stories" ON public.user_stories;

-- 4. Cria a política que permite inserção, leitura, atualização e exclusão livre de todas as Histórias
CREATE POLICY "Allow ALL on user_stories" 
ON public.user_stories 
FOR ALL 
USING (true) 
WITH CHECK (true);
