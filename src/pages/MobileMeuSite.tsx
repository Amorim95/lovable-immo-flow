import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Eye, Share2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileHeader } from "@/components/MobileHeader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { Imovel } from "@/types/crm";

export default function MobileMeuSite() {
  const navigate = useNavigate();
  const { isAdmin, isGestor, isDono } = useUserRole();
  const [imoveisPublicos, setImoveisPublicos] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImoveisPublicos();
  }, []);

  const fetchImoveisPublicos = async () => {
    try {
      // RLS irá automaticamente filtrar pelos imóveis da empresa do usuário
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('publico', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImoveisPublicos(data || []);
    } catch (error) {
      console.error('Erro ao carregar imóveis públicos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os imóveis públicos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyPublicLink = async (imovel: Imovel) => {
    try {
      const shareUrl = `${window.location.origin}/imovel-publico/${imovel.slug}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link copiado!",
        description: "O link público do imóvel foi copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Erro ao copiar link:', error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  if (loading) {
    return (
      <>
        <MobileHeader title="Meu Site" />
        <div className="p-4">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando site...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader title="Meu Site" />
      <div className="p-4 space-y-4 pb-20">
        {/* Botões de ação */}
        <div className="flex flex-col gap-2">
          {(isAdmin || isGestor || isDono) && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/configuracoes-site')}
              className="w-full"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurar Site
            </Button>
          )}
          <Button 
            onClick={() => window.open('/site-publico', '_blank')}
            className="w-full"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Site Público
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <Globe className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Imóveis Públicos</p>
                <p className="text-xl font-bold">{imoveisPublicos.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <Eye className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Visualizações</p>
                <p className="text-xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  );
}