import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NextUserData {
  nextUser: {
    id: string;
    name: string;
    email: string;
    lastLeadReceived: string | null;
  };
  queueInfo: Array<{
    id: string;
    name: string;
    email: string;
    lastLeadReceived: string | null;
    totalLeads: number;
  }>;
}

export function NextUserQueue() {
  const [data, setData] = useState<NextUserData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadNextUser = async () => {
    try {
      setLoading(true);
      
      const { data: responseData, error } = await supabase.functions.invoke('get-next-user');
      
      if (error) {
        console.error('Error calling get-next-user:', error);
        toast({
          title: "Erro ao carregar fila",
          description: "Não foi possível carregar as informações da fila.",
          variant: "destructive",
        });
        return;
      }

      setData(responseData);
    } catch (error) {
      console.error('Error loading next user:', error);
      toast({
        title: "Erro interno",
        description: "Erro interno ao carregar fila.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNextUser();
  }, []);

  const formatLastReceived = (lastReceived: string | null) => {
    if (!lastReceived) {
      return 'Nunca recebeu';
    }
    
    try {
      return format(new Date(lastReceived), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Próximo na Fila
          </CardTitle>
          <CardDescription>
            Carregando informações da fila...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Próximo na Fila
          </CardTitle>
          <CardDescription>
            Erro ao carregar fila
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadNextUser} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Próximo usuário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Próximo na Fila
          </CardTitle>
          <CardDescription>
            Usuário que receberá o próximo lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">{data.nextUser.name}</p>
              <p className="text-sm text-muted-foreground">{data.nextUser.email}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Último lead: {formatLastReceived(data.nextUser.lastLeadReceived)}
              </div>
            </div>
            <div className="text-right">
              <Badge variant="default">Próximo</Badge>
            </div>
          </div>
          
          <Button 
            onClick={loadNextUser} 
            variant="outline" 
            size="sm" 
            className="w-full mt-4"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardContent>
      </Card>

      {/* Fila completa */}
      <Card>
        <CardHeader>
          <CardTitle>Ordem da Fila</CardTitle>
          <CardDescription>
            Todos os usuários ativos ordenados por última recepção de lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.queueInfo.map((user, index) => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === 0 ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"} className="min-w-[2rem] justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatLastReceived(user.lastLeadReceived)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{user.totalLeads} leads</p>
                </div>
              </div>
            ))}
            {data.queueInfo.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhum usuário ativo encontrado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}