-- Atualização para suportar Burndown baseado em Tempo Restante na Daily
-- Rode isso no SQL Editor do Supabase

-- 1. Adiciona o Tempo Restante (valor atual) na tabela de tarefas
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS remaining_hours FLOAT;

-- 2. Adiciona o histórico JSON para a queima diária
-- Formato esperado do JSON: { "2026-05-22": 5, "2026-05-23": 2 }
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS burn_history JSONB DEFAULT '{}'::jsonb;

-- 3. Preenche as tarefas existentes (Para as tarefas antigas, o tempo restante é igual ao tempo estimado, ou zero se já estiver Done)
UPDATE public.tasks 
SET remaining_hours = CASE 
    WHEN status = 'done' THEN 0 
    ELSE estimated_hours 
END
WHERE remaining_hours IS NULL;

-- 4. Opcional: Garante que as tarefas não tenham remaining_hours NULL no futuro
-- Não estamos adicionando NOT NULL constraint para evitar quebra no insert caso a Store não mande a tempo,
-- mas é recomendado.
