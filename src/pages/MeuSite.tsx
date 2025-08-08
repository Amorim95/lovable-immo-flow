import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Eye, Share2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Imovel } from "@/types/crm";

export default function MeuSite() {
  const navigate = useNavigate();
  const [imoveisPublicos, setImoveisPublicos] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImoveisPublicos();
  }, []);

  const fetchImoveisPublicos = async () => {
    try {
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
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando site...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Meu Site
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie seus imóveis públicos
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/configuracoes-site')}>
            <Settings className="w-4 h-4 mr-2" />
            Configurar Site
          </Button>
          <Button onClick={() => window.open('/site-publico', '_blank')}>
            <Eye className="w-4 h-4 mr-2" />
            Ver Site Público
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Imóveis Públicos</p>
                <p className="text-2xl font-bold">{imoveisPublicos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Visualizações</p>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Imóveis Públicos */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Imóveis Disponíveis no Site</h2>
        
        {imoveisPublicos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhum imóvel público
              </h3>
              <p className="text-muted-foreground">
                Vá para a página de Imóveis e torne alguns imóveis públicos para que apareçam em seu site.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imoveisPublicos.map((imovel) => (
              <Card key={imovel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{formatPrice(imovel.preco)}</CardTitle>
                      <p className="text-sm text-muted-foreground">{imovel.localizacao}</p>
                    </div>
                    <Badge variant="secondary">Público</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm">{imovel.endereco}</p>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {imovel.descricao}
                  </p>

                  {/* Características principais */}
                  <div className="flex gap-2 text-xs">
                    {imovel.quartos && (
                      <Badge variant="outline">{imovel.quartos} quartos</Badge>
                    )}
                    {imovel.banheiros && (
                      <Badge variant="outline">{imovel.banheiros} banheiros</Badge>
                    )}
                    {imovel.vaga_carro && (
                      <Badge variant="outline">Vaga</Badge>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyPublicLink(imovel)}
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Copiar Link
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => window.open(`/imovel-publico/${imovel.slug}`, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}