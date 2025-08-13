import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

import { Building2, Users, LayoutList, Plus, RefreshCw, ShieldCheck, Search, Trash2 } from "lucide-react";

type CompanyRow = {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at: string;
  user_count: number;
  leads_count: number;
};

export default function AdminConsole() {
  const { isSuperAdmin, loading: permLoading } = usePermissions();
  const { toast } = useToast();

  // SEO title
  useEffect(() => {
    document.title = "Admin | Gestão de Contas";
  }, []);

  // Quick stats
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    enabled: isSuperAdmin && !permLoading,
    queryFn: async () => {
      const [companiesMeta, usersMeta, leadsMeta] = await Promise.all([
        supabase.from("companies").select("*", { count: "exact", head: true }),
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*", { count: "exact", head: true }),
      ]);
      return {
        companies: companiesMeta.count || 0,
        users: usersMeta.count || 0,
        leads: leadsMeta.count || 0,
      };
    },
  });

  // Companies list with counts
  const companiesQuery = useQuery<CompanyRow[]>({
    queryKey: ["admin-companies"],
    enabled: isSuperAdmin && !permLoading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, logo_url, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const rows: CompanyRow[] = await Promise.all(
        (data || []).map(async (c) => {
          const [{ count: userCount }, { count: leadsCount }] = await Promise.all([
            supabase.from("users").select("*", { count: "exact", head: true }).eq("company_id", c.id),
            supabase.from("leads").select("*", { count: "exact", head: true }).eq("company_id", c.id),
          ]);
          return {
            id: c.id,
            name: c.name,
            logo_url: (c as any).logo_url ?? null,
            created_at: c.created_at as any,
            user_count: userCount || 0,
            leads_count: leadsCount || 0,
          };
        })
      );
      return rows;
    },
  });

  // Create company modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({ companyName: "", adminName: "", adminEmail: "", adminPassword: "" });

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const list = companiesQuery.data || [];
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter((r) => r.name.toLowerCase().includes(s) || r.id.toLowerCase().includes(s));
  }, [companiesQuery.data, search]);

  async function handleCreate() {
    if (!formData.companyName || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-company", { body: formData });
      if (error || !data?.success) {
        toast({ title: "Erro ao criar", description: error?.message || data?.error || "Tente novamente.", variant: "destructive" });
        return;
      }
      toast({ title: "Imobiliária criada", description: data.message });
      setIsModalOpen(false);
      setFormData({ companyName: "", adminName: "", adminEmail: "", adminPassword: "" });
      companiesQuery.refetch();
      statsQuery.refetch();
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha inesperada.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(companyId: string, name: string) {
    if (!confirm(`Deletar a empresa "${name}"? Esta ação é irreversível.`)) return;
    try {
      const { error } = await supabase.functions.invoke("delete-company", { body: { companyId } });
      if (error) throw error;
      toast({ title: "Empresa deletada", description: `\"${name}\" removida com sucesso.` });
      companiesQuery.refetch();
      statsQuery.refetch();
    } catch (e: any) {
      toast({ title: "Erro ao deletar", description: e.message || "Tente novamente.", variant: "destructive" });
    }
  }

  if (permLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Acesso negado</h2>
            <p className="text-muted-foreground">Esta área é exclusiva para Super Admins.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <header className="bg-gradient-to-br from-primary/20 via-accent/10 to-background">
        <div className="container mx-auto px-6 py-10">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="text-sm text-muted-foreground">Área exclusiva</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Console de Gestão • Super Admin</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">Crie, gerencie e audite as imobiliárias da plataforma com segurança.</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Nova Imobiliária
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Imobiliária</DialogTitle>
                  <DialogDescription>Preencha os dados para criar a nova conta</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Nome da Imobiliária</Label>
                    <Input id="companyName" value={formData.companyName} onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))} placeholder="Ex: Imobiliária ABC" />
                  </div>
                  <div>
                    <Label htmlFor="adminName">Nome do Administrador</Label>
                    <Input id="adminName" value={formData.adminName} onChange={(e) => setFormData((p) => ({ ...p, adminName: e.target.value }))} placeholder="Ex: João Silva" />
                  </div>
                  <div>
                    <Label htmlFor="adminEmail">Email do Administrador</Label>
                    <Input id="adminEmail" type="email" value={formData.adminEmail} onChange={(e) => setFormData((p) => ({ ...p, adminEmail: e.target.value }))} placeholder="admin@imobiliaria.com" />
                  </div>
                  <div>
                    <Label htmlFor="adminPassword">Senha Inicial</Label>
                    <Input id="adminPassword" type="password" value={formData.adminPassword} onChange={(e) => setFormData((p) => ({ ...p, adminPassword: e.target.value }))} placeholder="Senha temporária" />
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? "Criando..." : "Criar Imobiliária"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={() => { statsQuery.refetch(); companiesQuery.refetch(); }}>
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <section>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">Empresas</CardTitle>
                <Building2 className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {statsQuery.data?.companies ?? "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">Usuários</CardTitle>
                <Users className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {statsQuery.data?.users ?? "-"}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base">Leads</CardTitle>
                <LayoutList className="w-4 h-4 text-primary" />
              </CardHeader>
              <CardContent className="text-3xl font-bold">
                {statsQuery.data?.leads ?? "-"}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Companies table */}
        <section>
          <Card>
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Empresas cadastradas</CardTitle>
                  <CardDescription>Busque, filtre e gerencie rapidamente</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou ID" className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent>
              <Table>
                <TableCaption>
                  {companiesQuery.isLoading ? "Carregando empresas..." : `${filtered.length} resultado(s)`}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead className="hidden md:table-cell">Criada em</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filtered || []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.logo_url ? (
                            <img src={c.logo_url} alt={`Logo ${c.name}`} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted grid place-items-center">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium leading-tight">{c.name}</div>
                            <div className="text-xs text-muted-foreground leading-tight">{c.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>{c.user_count}</TableCell>
                      <TableCell>{c.leads_count}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(c.id, c.name)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Deletar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
