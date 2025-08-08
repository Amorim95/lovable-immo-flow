import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Bed, Bath, Car, Home, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Imovel, ImovelMidia } from "@/types/crm";
import { useCompany } from "@/contexts/CompanyContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ImovelPublico() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useCompany();
  const { user } = useAuth();
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [midias, setMidias] = useState<ImovelMidia[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [userPhone, setUserPhone] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchUserPhone();
    }
  }, [user]);

  const fetchUserPhone = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('telefone')
        .eq('id', user.id)
        .single();

      if (!error && data?.telefone) {
        setUserPhone(data.telefone);
      }
    } catch (error) {
      console.error('Erro ao buscar telefone do usuário:', error);
    }
  };

  useEffect(() => {
    if (slug) {
      fetchImovel();
    }
  }, [slug]);

  const fetchImovel = async () => {
    try {
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('slug', slug)
        .eq('publico', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setNotFound(true);
        }
        throw error;
      }

      setImovel(data);

      // Buscar mídias do imóvel
      const { data: midiaData, error: midiaError } = await supabase
        .from('imovel_midias')
        .select('*')
        .eq('imovel_id', data.id)
        .order('ordem', { ascending: true });

      if (midiaError) {
        console.error('Erro ao carregar mídias:', midiaError);
      } else {
        setMidias((midiaData || []) as ImovelMidia[]);
      }


    } catch (error) {
      console.error('Erro ao carregar imóvel:', error);
      setNotFound(true);
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

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Olá! Tenho interesse no imóvel: ${imovel?.endereco} - ${formatPrice(imovel?.preco || 0)}`
    );
    const phoneNumber = userPhone ? userPhone.replace(/\D/g, '') : '';
    const whatsappUrl = phoneNumber ? `https://wa.me/55${phoneNumber}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % midias.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + midias.length) % midias.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando imóvel...</p>
        </div>
      </div>
    );
  }

  if (notFound || !imovel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-muted-foreground mb-2">
            Imóvel não encontrado
          </h1>
          <p className="text-muted-foreground">
            O imóvel que você está procurando não existe ou não está mais disponível.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 flex-shrink-0">
              <img 
                src={settings.logo || "/lovable-uploads/3ebecda3-d067-45fc-8317-a3481a6aed5a.png"} 
                alt={`${settings.name} Logo`} 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-primary">{settings.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{formatPrice(imovel.preco)}</h1>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{imovel.localizacao}</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
          {/* Galeria de Imagens */}
          <Card>
            <CardContent className="p-0">
              {midias.length > 0 ? (
                <div className="relative">
                  <div className="h-64 rounded-lg overflow-hidden">
                    {midias[currentImageIndex]?.tipo === 'imagem' ? (
                      <img
                        src={midias[currentImageIndex]?.url}
                        alt={`Foto ${currentImageIndex + 1} do imóvel`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={midias[currentImageIndex]?.url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                  </div>
                  
                  {midias.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                        {currentImageIndex + 1} / {midias.length}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Home className="w-16 h-16 mx-auto mb-2" />
                    <p>Imagens em breve</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Miniaturas */}
          {midias.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {midias.map((midia, index) => (
                <button
                  key={midia.id}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  {midia.tipo === 'imagem' ? (
                    <img
                      src={midia.url}
                      alt={`Miniatura ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600">Vídeo</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações do Imóvel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {imovel.quartos && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Bed className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Quartos</p>
                      <p className="text-lg font-semibold">{imovel.quartos}</p>
                    </div>
                  )}
                  
                  {imovel.banheiros && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Bath className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Banheiros</p>
                      <p className="text-lg font-semibold">{imovel.banheiros}</p>
                    </div>
                  )}
                  
                  {imovel.vaga_carro && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Car className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Vaga</p>
                      <p className="text-lg font-semibold">Sim</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Endereço</h3>
                  <p className="text-muted-foreground">{imovel.endereco}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{imovel.descricao}</p>
                </div>
              </CardContent>
            </Card>

            {/* Características - só mostra se houver características selecionadas */}
            {(() => {
              const caracteristicas = [
                { condition: imovel.vaga_carro, label: 'Vaga de carro' },
                { condition: imovel.aceita_animais, label: 'Aceita animais' },
                { condition: imovel.condominio_fechado, label: 'Condomínio fechado' },
                { condition: imovel.closet, label: 'Closet' },
                { condition: imovel.portaria_24h, label: 'Portaria 24h' },
                { condition: imovel.portao_eletronico, label: 'Portão eletrônico' },
              ].filter(item => item.condition);

              if (caracteristicas.length === 0) {
                return null;
              }

              return (
                <Card>
                  <CardHeader>
                    <CardTitle>Características</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {caracteristicas.map(({ label }, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="text-foreground">{label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Valores */}
            <Card>
              <CardHeader>
                <CardTitle>Valores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Preço</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(imovel.preco)}</p>
                </div>
                
                {imovel.condominio && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Condomínio:</span>
                    <span className="font-semibold">{formatPrice(imovel.condominio)}</span>
                  </div>
                )}
                
                {imovel.iptu && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IPTU:</span>
                    <span className="font-semibold">{formatPrice(imovel.iptu)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contato */}
            <Card>
              <CardHeader>
                <CardTitle>Interessado?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Entre em contato conosco para mais informações ou para agendar uma visita.
                </p>
                
                <Button 
                  onClick={handleWhatsAppContact}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Contatar via WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}