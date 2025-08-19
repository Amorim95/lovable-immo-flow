import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Building2, Users, Plus, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { CompanyManagement } from "@/components/CompanyManagement";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
  user_count?: number;
  access_control?: {
    site_enabled: boolean;
    imoveis_enabled: boolean;
    dashboards_enabled: boolean;
  };
}

export default function GerenciamentoContas() {
  const { isSuperAdmin, loading: permissionsLoading } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  // IMPORTANTE: Mover useQuery para ANTES dos returns condicionais
  // Buscar empresas cadastradas
  const { data: companies, isLoading, refetch } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          logo_url,
          created_at,
          users!inner(count),
          company_access_control(
            site_enabled,
            imoveis_enabled,
            dashboards_enabled
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      // Buscar dados de controle de acesso separadamente para debug
      const companiesWithAccess = [];
      
      for (const company of data || []) {
        // Buscar controle de acesso individual
        const { data: accessData } = await supabase
          .from('company_access_control')
          .select('site_enabled, imoveis_enabled, dashboards_enabled')
          .eq('company_id', company.id)
          .single();
          
        companiesWithAccess.push({
          ...company,
          user_count: Array.isArray(company.users) ? company.users[0]?.count || 0 : 0,
          access_control: accessData || {
            site_enabled: true,
            imoveis_enabled: true,
            dashboards_enabled: true
          }
        });
      }
      
      console.log('Companies with access control:', companiesWithAccess);
      return companiesWithAccess;
    },
    enabled: isSuperAdmin && !permissionsLoading // Só executar se for super admin
  });

  // Verificar se é super admin - APÓS todos os hooks
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
              Você não tem permissão para acessar o gerenciamento de contas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateCompany = async () => {
    if (!formData.companyName || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Enviando dados para create-company:', {
        companyName: formData.companyName,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        passwordProvided: !!formData.adminPassword
      });

      // Chamar a Edge Function para criar a empresa com segurança
      const { data, error } = await supabase.functions.invoke('create-company', {
        body: {
          companyName: formData.companyName,
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword
        }
      });

      if (error) {
        console.error('Erro da Edge Function:', error);
        
        // Tentar obter mais detalhes do erro
        let errorMessage = 'Erro desconhecido';
        if (error.message) {
          errorMessage = error.message;
        }
        
        // Se há contexto adicional
        if (error.context && typeof error.context === 'object') {
          console.error('Contexto do erro:', error.context);
        }
        
        toast({
          title: "Erro ao criar imobiliária",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Erro desconhecido';
        console.error('Função retornou erro:', errorMsg);
        toast({
          title: "Erro ao criar imobiliária", 
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: data.message
      });

      setFormData({ companyName: '', adminName: '', adminEmail: '', adminPassword: '' });
      setIsModalOpen(false);
      refetch();

    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar a conta da imobiliária.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!confirm(`Tem certeza que deseja deletar a empresa "${companyName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Empresa "${companyName}" deletada com sucesso.`
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao deletar a empresa.",
        variant: "destructive"
      });
    }
  };

  const handleToggleAccess = async (companyId: string, feature: 'site_enabled' | 'imoveis_enabled' | 'dashboards_enabled', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('company_access_control')
        .upsert({
          company_id: companyId,
          [feature]: !currentValue
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Acesso ${!currentValue ? 'liberado' : 'bloqueado'} com sucesso.`
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro ao alterar o controle de acesso.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Contas</h1>
        <p className="text-muted-foreground">
          Gerencie as imobiliárias cadastradas na plataforma
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="create">Criar Imobiliárias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Criar Novas Imobiliárias</h2>
              <p className="text-muted-foreground">
                Cadastre novas empresas na plataforma
              </p>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Imobiliária
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Imobiliária</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova conta de imobiliária
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Nome da Imobiliária</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Ex: Imobiliária ABC"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminName">Nome do Administrador</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                      placeholder="Ex: João Silva"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminEmail">Email do Administrador</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminEmail: e.target.value }))}
                      placeholder="admin@imobiliaria.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminPassword">Senha Inicial</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, adminPassword: e.target.value }))}
                      placeholder="Senha temporária"
                    />
                  </div>

                  <Button 
                    onClick={handleCreateCompany} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Criando..." : "Criar Imobiliária"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p>Carregando empresas...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {companies?.map((company) => (
                <Card key={company.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{company.user_count || 0} usuários</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Criada em: {new Date(company.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      
                      {/* Controles de Acesso */}
                      <div className="border-t pt-3">
                        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Controle de Acesso
                        </h4>
                        <div className="space-y-2">
                          {/* Site */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Site</span>
                            <Button
                              size="sm"
                              variant={company.access_control?.site_enabled ? "default" : "destructive"}
                              onClick={() => handleToggleAccess(company.id, 'site_enabled', company.access_control?.site_enabled || false)}
                              className="h-7 px-2"
                            >
                              {company.access_control?.site_enabled ? (
                                <ShieldCheck className="w-3 h-3 mr-1" />
                              ) : (
                                <ShieldX className="w-3 h-3 mr-1" />
                              )}
                              {company.access_control?.site_enabled ? 'Ativo' : 'Bloqueado'}
                            </Button>
                          </div>
                          
                          {/* Imóveis */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Imóveis</span>
                            <Button
                              size="sm"
                              variant={company.access_control?.imoveis_enabled ? "default" : "destructive"}
                              onClick={() => handleToggleAccess(company.id, 'imoveis_enabled', company.access_control?.imoveis_enabled || false)}
                              className="h-7 px-2"
                            >
                              {company.access_control?.imoveis_enabled ? (
                                <ShieldCheck className="w-3 h-3 mr-1" />
                              ) : (
                                <ShieldX className="w-3 h-3 mr-1" />
                              )}
                              {company.access_control?.imoveis_enabled ? 'Ativo' : 'Bloqueado'}
                            </Button>
                          </div>
                          
                          {/* Dashboards */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Dashboards</span>
                            <Button
                              size="sm"
                              variant={company.access_control?.dashboards_enabled ? "default" : "destructive"}
                              onClick={() => handleToggleAccess(company.id, 'dashboards_enabled', company.access_control?.dashboards_enabled || false)}
                              className="h-7 px-2"
                            >
                              {company.access_control?.dashboards_enabled ? (
                                <ShieldCheck className="w-3 h-3 mr-1" />
                              ) : (
                                <ShieldX className="w-3 h-3 mr-1" />
                              )}
                              {company.access_control?.dashboards_enabled ? 'Ativo' : 'Bloqueado'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {companies?.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma imobiliária cadastrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando a primeira conta de imobiliária
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}