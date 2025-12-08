-- Inserir etapas padrão para MAYS IMOB
INSERT INTO public.lead_stages (company_id, nome, legacy_key, cor, ordem, ativo) VALUES
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Aguardando Atendimento', 'aguardando-atendimento', '#3B82F6', 1, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Tentativas de Contato', 'tentativas-contato', '#F59E0B', 2, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Atendeu', 'atendeu', '#10B981', 3, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Nome Sujo', 'nome-sujo', '#EF4444', 4, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Nome Limpo', 'nome-limpo', '#22C55E', 5, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Visita', 'visita', '#8B5CF6', 6, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Vendas Fechadas', 'vendas-fechadas', '#059669', 7, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Em Pausa', 'em-pausa', '#6B7280', 8, true),
  ('c1a4e8e3-1367-45ac-a36a-061cfb768713', 'Descarte', 'descarte', '#DC2626', 9, true);

-- Ativar usuário Amorim Gestor
UPDATE public.users 
SET status = 'ativo' 
WHERE id = 'fb9d1753-b890-42c4-a70a-dc0b32d52a17';