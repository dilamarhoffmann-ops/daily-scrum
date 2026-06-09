-- Scrum Time - Alter projects table to allow 'paused' status and add justification
-- Run this script in Supabase SQL Editor

-- 1. Remove old CHECK constraint if it exists
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- 2. Create new CHECK constraint supporting 'paused'
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK (status IN ('active', 'archived', 'paused'));

-- 3. Add paused_reason column to store the justification
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS paused_reason TEXT;

-- 4. Reload PostgREST schema cache to ensure the API recognizes the changes
NOTIFY pgrst, 'reload schema';
