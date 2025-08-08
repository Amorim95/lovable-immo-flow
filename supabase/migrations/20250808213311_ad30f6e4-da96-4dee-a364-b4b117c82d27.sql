-- Adicionar campos de horário de atendimento na tabela company_settings
ALTER TABLE company_settings 
ADD COLUMN site_horario_semana TEXT,
ADD COLUMN site_horario_sabado TEXT,
ADD COLUMN site_horario_domingo TEXT,
ADD COLUMN site_observacoes_horario TEXT;