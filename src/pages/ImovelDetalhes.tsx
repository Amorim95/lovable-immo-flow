import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Bed, Bath, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Imovel } from "@/types/crm";

interface ImovelComFotos extends Imovel {
  fotos: string[];
}

export default function ImovelDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useCompany();
  const [imovel, setImovel] = useState<ImovelComFotos | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchImovel();
    }
  }, [id]);

  const fetchImovel = async () => {
    try {
      // Buscar imóvel por ID
      const { data: imovelData, error: imovelError } = await supabase
        .from('imoveis')
        .select('*')
        .eq('id', id)
        .eq('publico', true)
        .single();

      if (imovelError) throw imovelError;

      if (!imovelData) {
        navigate('/site-publico');
        return;
      }

      // Buscar fotos do imóvel
      const { data: fotosData, error: fotosError } = await supabase
        .from('imovel_midias')
        .select('url')
        .eq('imovel_id', imovelData.id)
        .eq('tipo', 'imagem')
        .order('ordem', { ascending: true });

      if (fotosError) {
        console.error('Erro ao carregar fotos do imóvel:', fotosError);
      }

      setImovel({
        ...imovelData,
        fotos: fotosData?.map(foto => foto.url) || []
      });
    } catch (error) {
      console.error('Erro ao carregar imóvel:', error);
      navigate('/site-publico');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const nextImage = () => {
    if (imovel?.fotos && imovel.fotos.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % imovel.fotos.length);
    }
  };

  const prevImage = () => {
    if (imovel?.fotos && imovel.fotos.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + imovel.fotos.length) % imovel.fotos.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (!imovel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Imóvel não encontrado</h2>
          <Button onClick={() => navigate('/site-publico')}>
            Voltar para os imóveis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/site-publico')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            
            <div className="flex-1 flex justify-center">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.name} className="h-8" />
              ) : (
                <h1 className="text-2xl font-bold text-primary">{settings.name}</h1>
              )}
            </div>
            
            <div className="flex-1 flex justify-end">
              <a href="#contato" className="text-muted-foreground hover:text-primary">Contato</a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galeria de Fotos */}
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
              {imovel.fotos && imovel.fotos.length > 0 ? (
                <>
                  <img
                    src={imovel.fotos[currentImageIndex]}
                    alt={`Imóvel em ${imovel.localizacao}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TZW0gaW1hZ2VtPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                  
                  {imovel.fotos.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* Contador */}
                      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {imovel.fotos.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <MapPin className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Miniaturas */}
            {imovel.fotos && imovel.fotos.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {imovel.fotos.map((foto, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-video rounded overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Descrição */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Descrição</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {imovel.descricao}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Informações do Imóvel */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                {formatPrice(imovel.preco)}
              </h1>
              <p className="text-xl text-muted-foreground flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {imovel.localizacao}
              </p>
            </div>

            {/* Características */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Características</h3>
                <div className="grid grid-cols-2 gap-4">
                  {imovel.quartos && (
                    <div className="flex items-center">
                      <Bed className="w-5 h-5 mr-2 text-muted-foreground" />
                      <span>{imovel.quartos} quartos</span>
                    </div>
                  )}
                  {imovel.banheiros && (
                    <div className="flex items-center">
                      <Bath className="w-5 h-5 mr-2 text-muted-foreground" />
                      <span>{imovel.banheiros} banheiros</span>
                    </div>
                  )}
                  {imovel.vaga_carro && (
                    <div className="flex items-center">
                      <Car className="w-5 h-5 mr-2 text-muted-foreground" />
                      <span>Vaga de garagem</span>
                    </div>
                  )}
                </div>

                {/* Características especiais */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {imovel.aceita_animais && (
                    <Badge variant="secondary">Aceita animais</Badge>
                  )}
                  {imovel.condominio_fechado && (
                    <Badge variant="secondary">Condomínio fechado</Badge>
                  )}
                  {imovel.closet && (
                    <Badge variant="secondary">Closet</Badge>
                  )}
                  {imovel.portaria_24h && (
                    <Badge variant="secondary">Portaria 24h</Badge>
                  )}
                  {imovel.portao_eletronico && (
                    <Badge variant="secondary">Portão eletrônico</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Botão WhatsApp */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Entre em Contato</h3>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white" 
                  size="lg"
                  onClick={() => {
                    const message = `Olá! Tenho interesse no imóvel em ${imovel.localizacao} no valor de ${formatPrice(imovel.preco)}`;
                    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  Falar pelo WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Valores */}
            {(imovel.condominio || imovel.iptu) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Valores Adicionais</h3>
                  <div className="space-y-2">
                    {imovel.condominio && (
                      <div className="flex justify-between">
                        <span>Condomínio:</span>
                        <span className="font-medium">{formatPrice(Number(imovel.condominio))}</span>
                      </div>
                    )}
                    {imovel.iptu && (
                      <div className="flex justify-between">
                        <span>IPTU:</span>
                        <span className="font-medium">{formatPrice(Number(imovel.iptu))}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Endereço */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <p className="text-muted-foreground">
                  {imovel.endereco}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{settings.name}</h3>
              <p className="text-gray-300">
                Sua parceira na busca pelo imóvel ideal. Encontre as melhores oportunidades do mercado.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contato</h4>
              <div className="space-y-2 text-gray-300">
                <p>contato@clickimoveis.com.br</p>
                <p>(11) 9999-9999</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Navegação</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-300 hover:text-white">Comprar</a>
                <a href="#" className="block text-gray-300 hover:text-white">Alugar</a>
                <a href="#" className="block text-gray-300 hover:text-white">Contato</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {settings.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}