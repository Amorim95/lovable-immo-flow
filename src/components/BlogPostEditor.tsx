import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

const CATEGORIES = [
  "CRM Imobiliário",
  "Gestão Imobiliária",
  "Vendas Imobiliárias",
  "Leads Imobiliários",
  "Tecnologia para Imobiliárias",
];

interface BlogPostEditorProps {
  postId?: string | null;
  onBack: () => void;
}

export function BlogPostEditor({ postId, onBack }: BlogPostEditorProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    cover_image: "",
    summary: "",
    content: "",
    meta_title: "",
    meta_description: "",
    keyword: "",
    category: "",
    status: "draft",
    author_name: "",
    published_at: "",
  });

  const postQuery = useQuery({
    queryKey: ["admin-blog-post", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", postId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (postQuery.data) {
      const p = postQuery.data as any;
      setForm({
        title: p.title || "",
        slug: p.slug || "",
        cover_image: p.cover_image || "",
        summary: p.summary || "",
        content: p.content || "",
        meta_title: p.meta_title || "",
        meta_description: p.meta_description || "",
        keyword: p.keyword || "",
        category: p.category || "",
        status: p.status || "draft",
        author_name: p.author_name || "",
        published_at: p.published_at ? p.published_at.slice(0, 16) : "",
      });
    }
  }, [postQuery.data]);

  function generateSlug(title: string) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug || generateSlug(title),
      meta_title: f.meta_title || title,
    }));
  }

  async function handleSave() {
    if (!form.title.trim() || !form.slug.trim()) {
      toast({ title: "Campos obrigatórios", description: "Título e slug são obrigatórios.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        cover_image: form.cover_image || null,
        summary: form.summary || null,
        content: form.content || null,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        keyword: form.keyword || null,
        category: form.category || null,
        status: form.status,
        author_name: form.author_name || null,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : (form.status === "published" ? new Date().toISOString() : null),
      };

      if (postId) {
        const { error } = await supabase.from("blog_posts").update(payload).eq("id", postId);
        if (error) throw error;
        toast({ title: "Post atualizado", description: "Alterações salvas com sucesso." });
      } else {
        const { error } = await supabase.from("blog_posts").insert(payload);
        if (error) throw error;
        toast({ title: "Post criado", description: "Artigo criado com sucesso." });
        onBack();
      }
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (postId && postQuery.isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Carregando post...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h2 className="text-xl font-bold">{postId ? "Editar Post" : "Novo Post"}</h2>
        <div className="flex-1" />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conteúdo do Artigo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título do artigo *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: CRM imobiliário para corretores"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug da URL *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/blog/</span>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="crm-imobiliario-para-corretores"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cover_image">URL da imagem de capa</Label>
                <Input
                  id="cover_image"
                  value={form.cover_image}
                  onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
                {form.cover_image && (
                  <img src={form.cover_image} alt="Preview" className="mt-2 rounded-lg max-h-48 object-cover" />
                )}
              </div>
              <div>
                <Label htmlFor="summary">Resumo do artigo</Label>
                <Textarea
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  placeholder="Descrição curta usada nos cards do blog..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="content">
                  Conteúdo do artigo (Markdown)
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Use Markdown: # H1, ## H2, ### H3, **negrito**, *itálico*, - listas, [link](url), ![imagem](url)
                </p>
                <Textarea
                  id="content"
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  placeholder="Escreva o conteúdo do artigo em Markdown..."
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="published_at">Data de publicação</Label>
                <Input
                  id="published_at"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="author_name">Autor</Label>
                <Input
                  id="author_name"
                  value={form.author_name}
                  onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
                  placeholder="Nome do autor"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  placeholder="Título para o Google (max 60 chars)"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.meta_title.length}/60</p>
              </div>
              <div>
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  placeholder="Descrição para o Google (max 160 chars)"
                  maxLength={160}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.meta_description.length}/160</p>
              </div>
              <div>
                <Label htmlFor="keyword">Palavra-chave principal</Label>
                <Input
                  id="keyword"
                  value={form.keyword}
                  onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
                  placeholder="Ex: CRM imobiliário"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
