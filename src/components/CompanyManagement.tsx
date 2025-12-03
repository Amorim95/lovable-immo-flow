import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Trash2, Building, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AccessControl } from '@/components/AccessControl';

interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  user_count?: number;
  leads_count?: number;
}

export function CompanyManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCompany, setDeletingCompany] = useState<string | null>(null);
  const { isSuperAdmin } = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    if (isSuperAdmin) {
      loadCompanies();
    }
  }, [isSuperAdmin]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Para cada empresa, buscar contagens de usuários e leads
      const companiesWithCounts = await Promise.all(
        (companiesData || []).map(async (company) => {
          // Contar usuários
          const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          // Contar leads
          const { count: leadsCount } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', company.id);

          return {
            ...company,
            user_count: userCount || 0,
            leads_count: leadsCount || 0
          };
        })
      );

      setCompanies(companiesWithCounts);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    try {
      setDeletingCompany(companyId);

      // Chamar a edge function para deletar a empresa
      const { data, error } = await supabase.functions.invoke('delete-company', {
        method: 'DELETE',
        body: { companyId }
      });

      if (error) {
        console.error('Erro ao deletar empresa:', error);
        throw new Error(error.message || 'Erro ao deletar empresa');
      }

      toast({
        title: "Empresa deletada",
        description: `A empresa "${companyName}" foi deletada com sucesso`,
      });

      // Recarregar a lista
      await loadCompanies();
    } catch (error) {
      console.error('Erro ao deletar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar a empresa",
        variant: "destructive",
      });
    } finally {
      setDeletingCompany(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Acesso negado. Apenas super administradores podem gerenciar empresas.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Carregando empresas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciamento de Empresas</h2>
          <p className="text-muted-foreground">
            Gerencie todas as empresas cadastradas na plataforma
          </p>
        </div>
        <Badge variant="destructive">
          Super Admin
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => (
          <Card key={company.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {company.logo_url ? (
                    <img 
                      src={company.logo_url} 
                      alt={`Logo ${company.name}`}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(company.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingCompany === company.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deletar Empresa</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja deletar a empresa "{company.name}"? 
                        Esta ação irá remover permanentemente:
                        <br />
                        • Todos os usuários ({company.user_count})
                        <br />
                        • Todos os leads ({company.leads_count})
                        <br />
                        • Todos os imóveis e dados relacionados
                        <br />
                        <br />
                        <strong>Esta ação não pode ser desfeita.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deletingCompany === company.id ? 'Deletando...' : 'Deletar Empresa'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {company.user_count} usuário{company.user_count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {company.leads_count} lead{company.leads_count !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  ID: {company.id}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center p-8">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhuma empresa encontrada</p>
        </div>
      )}
    </div>
  );
}