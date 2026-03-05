
CREATE TABLE public.company_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  stage_name text NOT NULL,
  tag_ids uuid[] DEFAULT '{}',
  team_id uuid REFERENCES public.equipes(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(slug)
);

ALTER TABLE public.company_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins podem gerenciar webhooks"
  ON public.company_webhooks
  FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Admins podem ver webhooks da empresa"
  ON public.company_webhooks
  FOR SELECT
  USING (company_id = get_user_company_id());
