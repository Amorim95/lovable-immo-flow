import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { CompanyManagement } from "@/components/CompanyManagement";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEffect } from "react";

export default function AdminConsole() {
  const { isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  useEffect(() => {
    document.title = "Admin | Gerenciar Imobiliárias";
  }, []);

  if (permissionsLoading) {
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
            <h2 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Esta área é exclusiva para Super Admins.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateCompany = async () => {
    if (!formData.companyName || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      toast({ title: "Erro", description: "Todos os campos são obrigatórios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-company", {
        body: {
          companyName: formData.companyName,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
        },
      });

      if (error || !data?.success) {
        const msg = error?.message || data?.error || "Erro ao criar a imobiliária";
        toast({ title: "Erro", description: msg, variant: "destructive" });
        return;
      }

      toast({ title: "Sucesso", description: data.message });
      setFormData({ companyName: "", adminName: "", adminEmail: "", adminPassword: "" });
      setIsModalOpen(false);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao criar" , variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Console do Super Admin</h1>
          <p className="text-muted-foreground">Crie e gerencie as imobiliárias da plataforma</p>
        </div>

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
              <Button onClick={handleCreateCompany} disabled={loading} className="w-full">
                {loading ? "Criando..." : "Criar Imobiliária"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas cadastradas</CardTitle>
          <CardDescription>Lista completa de empresas com ações administrativas</CardDescription>
        </CardHeader>
        <CardContent>
          <CompanyManagement />
        </CardContent>
      </Card>
    </div>
  );
}
