-- Adicionar campo para controlar primeiro acesso na tabela users
ALTER TABLE public.users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Atualizar enum de roles para incluir "dono"
ALTER TYPE public.user_role ADD VALUE 'dono';

-- Comentário: O "dono" será automaticamente atribuído ao primeiro usuário de uma nova empresa