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
import { Plus, Trash2, Webhook, Copy, Check, Loader2, Link2 } from "lucide-react";

interface WebhookConfig {
  id: string;
  name: string;
  slug: string;
  stage_name: string;
  tag_ids: string[];
  team_id: string | null;
  is_active: boolean;
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
  const { toast } = useToast();

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

  const getWebhookUrl = (slug: string) => {
    return `https://${projectId}.supabase.co/functions/v1/webhook-lead-dynamic?slug=${slug}`;
  };

  const handleCopyUrl = (slug: string) => {
    navigator.clipboard.writeText(getWebhookUrl(slug));
    setCopiedSlug(slug);
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
    if (webhooks.length >= MAX_WEBHOOKS) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          <Label className="text-base font-medium">Webhooks (Conectar)</Label>
          <Badge variant="secondary" className="text-xs">{webhooks.length}/{MAX_WEBHOOKS}</Badge>
        </div>
        {webhooks.length < MAX_WEBHOOKS && (
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
            <div key={webhook.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{webhook.name}</span>
                  <Badge variant={webhook.is_active ? "default" : "secondary"} className="text-[10px] px-1.5">
                    {webhook.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </div>

              {/* URL */}
              <div className="flex items-center gap-1 bg-muted rounded px-2 py-1">
                <code className="text-[10px] text-muted-foreground flex-1 truncate">
                  {getWebhookUrl(webhook.slug)}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={() => handleCopyUrl(webhook.slug)}
                >
                  {copiedSlug === webhook.slug ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>

              {/* Config details */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <Badge variant="outline" className="gap-1 text-[10px]">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getStageColor(webhook.stage_name) }} />
                  {getStageNameDisplay(webhook.stage_name)}
                </Badge>
                {webhook.tag_ids.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? (
                    <Badge key={tagId} variant="outline" className="gap-1 text-[10px]" style={{ borderColor: tag.cor || undefined }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.cor || "#3B82F6" }} />
                      {tag.nome}
                    </Badge>
                  ) : null;
                })}
                {webhook.team_id && (
                  <Badge variant="outline" className="text-[10px]">
                    Equipe: {teams.find(t => t.id === webhook.team_id)?.nome || "—"}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
