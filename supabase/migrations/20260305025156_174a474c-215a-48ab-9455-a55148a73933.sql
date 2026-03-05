
ALTER TABLE public.company_webhooks 
  ADD COLUMN is_legacy boolean NOT NULL DEFAULT false,
  ADD COLUMN legacy_function_name text;

INSERT INTO public.company_webhooks (company_id, name, slug, stage_name, tag_ids, team_id, is_active, is_legacy, legacy_function_name) VALUES
-- Click Imóveis - Qualificado
('c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6', 'Lead Qualificado (IA)', 'webhook-lead-click-imoveis', 'Aguardando Atendimento', ARRAY['89b0d175-7ac8-44b3-9f47-dec34353ccac']::uuid[], NULL, true, true, 'webhook-lead-click-imoveis'),
-- Click Imóveis - Não Qualificado
('c95541d9-3e6a-4fc1-8d64-c5a6d5f7c9b6', 'Lead Não Qualificado', 'webhook-lead-click-imoveis-nao-qualificado', 'Recuperar', ARRAY['e169ffc5-5574-4a7c-8c06-15bec4b59b63']::uuid[], NULL, true, true, 'webhook-lead-click-imoveis-nao-qualificado'),
-- MAYS IMOB
('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Lead Mays Imob', 'webhook-lead-mays-imob', 'Aguardando Atendimento', '{}'::uuid[], '429b4211-ea7a-49b0-a3ec-c258a8fbbbf0', true, true, 'webhook-lead-mays-imob'),
-- MAYS IMOB - Janaina Vidalete
('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Lead Janaina Vidalete', 'webhook-lead-janaina-vidalete', 'Aguardando Atendimento', '{}'::uuid[], NULL, true, true, 'webhook-lead-janaina-vidalete'),
-- Araújo Broker
('6959ef94-3614-49be-aac8-544e6757e3f4', 'Lead Araújo Broker', 'webhook-lead-araujo-broker', 'Aguardando Atendimento', '{}'::uuid[], NULL, true, true, 'webhook-lead-araujo-broker'),
-- Invest + Imóveis - Qualificado
('fcccf617-0fb0-4745-8048-a4632d80de6d', 'Lead Qualificado (IA)', 'webhook-lead-invest-imoveis', 'Aguardando Atendimento', ARRAY['89b0d175-7ac8-44b3-9f47-dec34353ccac']::uuid[], NULL, true, true, 'webhook-lead-invest-imoveis'),
-- Invest + Imóveis - Não Qualificado
('fcccf617-0fb0-4745-8048-a4632d80de6d', 'Lead Não Qualificado', 'webhook-lead-invest-imoveis-nao-qualificado', 'Aguardando Atendimento', ARRAY['e169ffc5-5574-4a7c-8c06-15bec4b59b63']::uuid[], NULL, true, true, 'webhook-lead-invest-imoveis-nao-qualificado'),
-- RKMF Imóveis - Qualificado
('1f12e1c1-a516-407f-aedd-865ef57b5ea3', 'Lead Qualificado (IA)', 'webhook-lead-rkmf-imoveis', 'Aguardando Atendimento', ARRAY['89b0d175-7ac8-44b3-9f47-dec34353ccac']::uuid[], NULL, true, true, 'webhook-lead-rkmf-imoveis'),
-- RKMF Imóveis - Não Qualificado
('1f12e1c1-a516-407f-aedd-865ef57b5ea3', 'Lead Não Qualificado', 'webhook-lead-rkmf-imoveis-nao-qualificado', 'Aguardando Atendimento', ARRAY['e169ffc5-5574-4a7c-8c06-15bec4b59b63']::uuid[], NULL, true, true, 'webhook-lead-rkmf-imoveis-nao-qualificado'),
-- Vivaz - Zona Norte
('a74befa3-7bb0-4f17-9b11-7bfff9bf0ce6', 'Lead Zona Norte', 'webhook-lead-vivaz', 'Aguardando Atendimento', '{}'::uuid[], '031ca088-8f98-4ba1-bc4b-7f550c538b26', true, true, 'webhook-lead-vivaz'),
-- Vivaz - Zona Leste
('a74befa3-7bb0-4f17-9b11-7bfff9bf0ce6', 'Lead Zona Leste', 'webhook-lead-vivaz-zona-leste', 'Aguardando Atendimento', '{}'::uuid[], '7f3f0423-3324-4c8d-b6f6-72274fdd09ab', true, true, 'webhook-lead-vivaz-zona-leste'),
-- Vivaz - Zona Sul
('a74befa3-7bb0-4f17-9b11-7bfff9bf0ce6', 'Lead Zona Sul', 'webhook-lead-vivaz-zona-sul', 'Aguardando Atendimento', '{}'::uuid[], '578f5e2e-bd93-4ba5-8e7b-2b65dbaa3ffb', true, true, 'webhook-lead-vivaz-zona-sul');
