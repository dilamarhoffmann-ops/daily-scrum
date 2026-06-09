-- Scrum Time - Alter tasks table to allow pausing individual tasks
-- Run this script in Supabase SQL Editor

-- 1. Add is_paused column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;

-- 2. Add paused_reason column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS paused_reason TEXT;

-- 3. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
