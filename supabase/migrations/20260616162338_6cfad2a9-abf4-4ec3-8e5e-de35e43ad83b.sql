CREATE INDEX IF NOT EXISTS idx_leads_company_created ON public.leads (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_company_user ON public.leads (company_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_relations_lead_id ON public.lead_tag_relations (lead_id);