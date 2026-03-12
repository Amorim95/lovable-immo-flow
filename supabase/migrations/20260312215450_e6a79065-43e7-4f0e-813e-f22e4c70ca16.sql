
-- Tabela para histórico de notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'lead', -- 'lead', 'repique', 'transfer'
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias notificações
CREATE POLICY "Usuários podem ver suas notificações"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem atualizar suas notificações (marcar como lida)
CREATE POLICY "Usuários podem atualizar suas notificações"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Service role pode inserir notificações (via webhooks)
CREATE POLICY "Service role pode inserir notificações"
  ON public.notifications FOR INSERT
  WITH CHECK (true);
