import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Webhook, Copy, Check, Loader2, Link2, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface WebhookConfig {
  id: string;
  name: string;
  slug: string;
  stage_name: string;
  tag_ids: string[];
  team_id: string | null;
  is_active: boolean;
  is_legacy: boolean;
  legacy_function_name: string | null;
}

interface Stage {
  id: string;
  nome: string;
  cor: string;
}

interface Tag {
  id: string;
  nome: string;
  cor: string | null;
}

interface Team {
  id: string;
  nome: string;
}

interface WebhookManagerProps {
  companyId: string;
}

export function WebhookManager({ companyId }: WebhookManagerProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({ name: "", stage_name: "", tag_ids: [] as string[], team_id: "" });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();

  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxveHBvZWhzZGRmZWFybnpjZGxhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTg4NjgsImV4cCI6MjA2Njg3NDg2OH0.2jHJynuzjEhK3Gk_OrFMR6zM3Tyq3JWIYjhiVQVx4wY";
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "loxpoehsddfearnzcdla";
  const MAX_WEBHOOKS = 5;

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [webhooksRes, stagesRes, tagsRes, teamsRes] = await Promise.all([
        supabase.from("company_webhooks").select("*").eq("company_id", companyId).order("created_at"),
        supabase.from("lead_stages").select("id, nome, cor").eq("company_id", companyId).eq("ativo", true).order("ordem"),
        supabase.from("lead_tags").select("id, nome, cor").order("nome"),
        supabase.from("equipes").select("id, nome").eq("company_id", companyId).order("nome"),
      ]);

      if (webhooksRes.data) {
        setWebhooks(webhooksRes.data.map((w: any) => ({
          id: w.id,
          name: w.name,
          slug: w.slug,
          stage_name: w.stage_name,
          tag_ids: w.tag_ids || [],
          team_id: w.team_id,
          is_active: w.is_active,
          is_legacy: w.is_legacy || false,
          legacy_function_name: w.legacy_function_name || null,
        })));
      }
      setStages(stagesRes.data || []);
      setTags(tagsRes.data || []);
      setTeams(teamsRes.data || []);
    } catch (e) {
      console.error("Error loading webhook data:", e);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return `webhook-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${companyId.slice(0, 8)}`;
  };

  const getWebhookUrl = (webhook: WebhookConfig) => {
    if (webhook.is_legacy && webhook.legacy_function_name) {
      return `https://${projectId}.supabase.co/functions/v1/${webhook.legacy_function_name}`;
    }
    return `https://${projectId}.supabase.co/functions/v1/webhook-lead-dynamic?slug=${webhook.slug}`;
  };

  const handleCopyUrl = (webhook: WebhookConfig) => {
    navigator.clipboard.writeText(getWebhookUrl(webhook));
    setCopiedSlug(webhook.slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast({ title: "URL copiada!", description: "A URL do webhook foi copiada para a área de transferência." });
  };

  const handleCreate = async () => {
    if (!newWebhook.name.trim()) {
      toast({ title: "Erro", description: "Nome do webhook é obrigatório.", variant: "destructive" });
      return;
    }
    if (!newWebhook.stage_name) {
      toast({ title: "Erro", description: "Selecione uma etapa obrigatória.", variant: "destructive" });
      return;
    }
    if (webhooks.filter(w => !w.is_legacy).length >= MAX_WEBHOOKS) {
      toast({ title: "Limite atingido", description: `Máximo de ${MAX_WEBHOOKS} webhooks por empresa.`, variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const slug = generateSlug(newWebhook.name);
      
      const { data, error } = await supabase.from("company_webhooks").insert({
        company_id: companyId,
        name: newWebhook.name.trim(),
        slug,
        stage_name: newWebhook.stage_name,
        tag_ids: newWebhook.tag_ids,
        team_id: newWebhook.team_id || null,
      }).select().single();

      if (error) throw error;

      toast({ title: "Webhook criado!", description: `O webhook "${newWebhook.name}" foi criado com sucesso.` });
      setNewWebhook({ name: "", stage_name: "", tag_ids: [], team_id: "" });
      setShowCreateForm(false);
      loadData();
    } catch (e: any) {
      console.error("Error creating webhook:", e);
      toast({ title: "Erro ao criar webhook", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (webhook: WebhookConfig) => {
    setSaving(webhook.id);
    try {
      const { error } = await supabase.from("company_webhooks")
        .update({ is_active: !webhook.is_active })
        .eq("id", webhook.id);
      if (error) throw error;
      setWebhooks(prev => prev.map(w => w.id === webhook.id ? { ...w, is_active: !w.is_active } : w));
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (webhook: WebhookConfig) => {
    if (!confirm(`Deletar o webhook "${webhook.name}"? Esta ação não pode ser desfeita.`)) return;
    setSaving(webhook.id);
    try {
      const { error } = await supabase.from("company_webhooks").delete().eq("id", webhook.id);
      if (error) throw error;
      setWebhooks(prev => prev.filter(w => w.id !== webhook.id));
      toast({ title: "Webhook deletado", description: `"${webhook.name}" foi removido.` });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const toggleTag = (tagId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const getStageNameDisplay = (stageName: string) => {
    const stage = stages.find(s => s.nome === stageName);
    return stage ? stage.nome : stageName;
  };

  const getStageColor = (stageName: string) => {
    const stage = stages.find(s => s.nome === stageName);
    return stage?.cor || "#3B82F6";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando webhooks...</span>
      </div>
    );
  }

  const customWebhooks = webhooks.filter(w => !w.is_legacy);
  const legacyWebhooks = webhooks.filter(w => w.is_legacy);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <Label className="text-base font-medium">Webhooks (Conectar)</Label>
          <Badge variant="secondary" className="text-xs">{customWebhooks.length}/{MAX_WEBHOOKS}</Badge>
        </div>
        {customWebhooks.length < MAX_WEBHOOKS && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-1"
          >
            <Plus className="w-3 h-3" />
            Novo Webhook
          </Button>
        )}
      </div>

      {/* Help Section */}
      <Collapsible open={showHelp} onOpenChange={setShowHelp}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-2 justify-between text-muted-foreground hover:text-foreground">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              <span className="text-sm">Como configurar o webhook?</span>
            </div>
            {showHelp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border rounded-lg p-4 mt-2 space-y-4 bg-muted/30 text-sm">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary" />
              Guia de Integração do Webhook
            </h4>

            <div className="grid gap-3">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Método HTTP</span>
                <div className="bg-background border rounded-md px-3 py-2">
                  <code className="text-xs font-mono text-primary font-semibold">POST</code>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Headers</span>
                <div className="bg-background border rounded-md px-3 py-2 space-y-2">
                  <div className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-muted-foreground shrink-0">Content-Type:</span>
                    <span className="text-foreground">application/json</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs font-mono">
                    <span className="text-muted-foreground shrink-0">Authorization:</span>
                    <span className="text-foreground break-all">Bearer {`${SUPABASE_ANON_KEY.slice(0, 20)}...${SUPABASE_ANON_KEY.slice(-10)}`}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 px-2"
                    onClick={() => {
                      navigator.clipboard.writeText(`Bearer ${SUPABASE_ANON_KEY}`);
                      toast({ title: "Copiado!", description: "Authorization header copiado para a área de transferência." });
                    }}
                  >
                    <Copy className="w-3 h-3" />
                    Copiar Authorization completo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Body Type</span>
                  <div className="bg-background border rounded-md px-3 py-2">
                    <code className="text-xs font-mono text-foreground">raw (JSON)</code>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Content Type</span>
                  <div className="bg-background border rounded-md px-3 py-2">
                    <code className="text-xs font-mono text-foreground">application/json</code>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estrutura JSON (Request Body)</span>
                <div className="bg-background border rounded-md px-3 py-3 overflow-x-auto">
                  <pre className="text-xs font-mono text-foreground leading-relaxed whitespace-pre">{`{
  "nome": "Nome do Lead",
  "telefone": "(11) 99999-9999",
  "dados_adicionais": "Observações opcionais"
}`}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Campos Aceitos</span>
                <div className="bg-background border rounded-md px-3 py-3 space-y-2">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2">
                      <Badge variant="default" className="text-[10px] px-1.5 shrink-0 mt-0.5">obrigatório</Badge>
                      <div>
                        <code className="font-mono text-primary">telefone</code>
                        <span className="text-muted-foreground ml-1">— Aceita: <code className="font-mono">telefone</code>, <code className="font-mono">phone</code>, <code className="font-mono">tel</code>, <code className="font-mono">whatsapp</code></span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 mt-0.5">opcional</Badge>
                      <div>
                        <code className="font-mono text-primary">nome</code>
                        <span className="text-muted-foreground ml-1">— Aceita: <code className="font-mono">nome</code>, <code className="font-mono">name</code>, <code className="font-mono">lead_name</code></span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-[10px] px-1.5 shrink-0 mt-0.5">opcional</Badge>
                      <div>
                        <code className="font-mono text-primary">dados_adicionais</code>
                        <span className="text-muted-foreground ml-1">— Aceita: <code className="font-mono">dados_adicionais</code>, <code className="font-mono">additional_data</code>, <code className="font-mono">message</code>, <code className="font-mono">observacao</code></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Exemplo cURL</span>
                <div className="bg-background border rounded-md px-3 py-3 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-muted-foreground leading-relaxed whitespace-pre">{`curl -X POST \\
  "SUA_URL_DO_WEBHOOK" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY.slice(0, 20)}..." \\
  -d '{
    "nome": "João Silva",
    "telefone": "(11) 91234-5678",
    "dados_adicionais": "Interesse em apartamento"
  }'`}</pre>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                💡 <strong>Dica:</strong> Leads duplicados (mesmo telefone em menos de 24h) são ignorados automaticamente. A distribuição segue round-robin entre os corretores ativos da equipe configurada.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Create form */}
      {showCreateForm && (
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h4 className="font-medium text-sm">Criar Novo Webhook</h4>

          <div className="space-y-2">
            <Label className="text-xs">Nome do Webhook *</Label>
            <Input
              value={newWebhook.name}
              onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Lead Meta Ads"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Etapa (obrigatório) *</Label>
            <Select
              value={newWebhook.stage_name}
              onValueChange={(val) => setNewWebhook(prev => ({ ...prev, stage_name: val }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.nome}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.cor }} />
                      {stage.nome}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Etiquetas (opcional, múltipla escolha)</Label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {tags.map(tag => (
                <label
                  key={tag.id}
                  className="flex items-center gap-1.5 cursor-pointer text-xs border rounded-md px-2 py-1 hover:bg-accent transition-colors"
                  style={{
                    borderColor: newWebhook.tag_ids.includes(tag.id) ? (tag.cor || "#3B82F6") : undefined,
                    backgroundColor: newWebhook.tag_ids.includes(tag.id) ? `${tag.cor || "#3B82F6"}15` : undefined,
                  }}
                >
                  <Checkbox
                    checked={newWebhook.tag_ids.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                    className="w-3 h-3"
                  />
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor || "#3B82F6" }} />
                  {tag.nome}
                </label>
              ))}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma etiqueta disponível</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Equipe (opcional, apenas 1)</Label>
            <Select
              value={newWebhook.team_id}
              onValueChange={(val) => setNewWebhook(prev => ({ ...prev, team_id: val === "none" ? "" : val }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Nenhuma equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma equipe</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
              Criar Webhook
            </Button>
          </div>
        </div>
      )}

      {/* Existing webhooks */}
      {webhooks.length === 0 && !showCreateForm ? (
        <div className="text-center py-6 border rounded-lg border-dashed">
          <Webhook className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum webhook configurado</p>
          <p className="text-xs text-muted-foreground mt-1">Crie um webhook para receber leads automaticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => (
            <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <Webhook className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-sm truncate">{webhook.name}</span>
                  <Badge variant={webhook.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 shrink-0">
                    {webhook.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                  {webhook.is_legacy && (
                    <Badge variant="outline" className="text-[10px] px-1.5 shrink-0 border-amber-400 text-amber-600">
                      Legado
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!webhook.is_legacy && (
                    <>
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={() => handleToggleActive(webhook)}
                        disabled={saving === webhook.id}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(webhook)}
                        disabled={saving === webhook.id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* URL - full width with word break */}
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">URL do Webhook</Label>
                <div className="flex items-start gap-2 bg-muted rounded-md px-3 py-2">
                  <code className="text-[11px] text-muted-foreground break-all flex-1 leading-relaxed select-all">
                    {getWebhookUrl(webhook)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 mt-0.5"
                    onClick={() => handleCopyUrl(webhook)}
                  >
                    {copiedSlug === webhook.slug ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              {/* Config details */}
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Configuração</Label>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="gap-1 text-xs py-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStageColor(webhook.stage_name) }} />
                    {getStageNameDisplay(webhook.stage_name)}
                  </Badge>
                  {webhook.tag_ids.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <Badge key={tagId} variant="outline" className="gap-1 text-xs py-0.5" style={{ borderColor: tag.cor || undefined }}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.cor || "#3B82F6" }} />
                        {tag.nome}
                      </Badge>
                    ) : null;
                  })}
                  {webhook.team_id && (
                    <Badge variant="outline" className="text-xs py-0.5">
                      🏢 {teams.find(t => t.id === webhook.team_id)?.nome || "—"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
