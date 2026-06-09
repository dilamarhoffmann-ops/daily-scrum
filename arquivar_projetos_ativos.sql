-- REGRA DE SEGURANÇA (P0): Nunca deletamos projetos (DELETE FROM). 
-- Projetos devem ser marcados como 'archived' para preservar histórico.

UPDATE projects 
SET status = 'archived' 
WHERE status = 'active' OR status IS NULL;
