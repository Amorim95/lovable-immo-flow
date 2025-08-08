import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Bed, Bath, Car, Home, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Imovel } from "@/types/crm";

export default function ImovelPublico() {
  const { slug } = useParams<{ slug: string }>();
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
    window.open(`https://wa.me/?text=${message}`, '_blank');
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
          <div className="flex items-center gap-2 mb-2">
            <Home className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-primary">CRM Imóveis</span>
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
            {/* Imagem Principal */}
            <Card>
              <CardContent className="p-0">
                <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Home className="w-16 h-16 mx-auto mb-2" />
                    <p>Imagem em breve</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  <p className="text-muted-foreground leading-relaxed">{imovel.descricao}</p>
                </div>
              </CardContent>
            </Card>

            {/* Características */}
            <Card>
              <CardHeader>
                <CardTitle>Características</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { condition: imovel.vaga_carro, label: 'Vaga de carro' },
                    { condition: imovel.aceita_animais, label: 'Aceita animais' },
                    { condition: imovel.condominio_fechado, label: 'Condomínio fechado' },
                    { condition: imovel.closet, label: 'Closet' },
                    { condition: imovel.portaria_24h, label: 'Portaria 24h' },
                    { condition: imovel.portao_eletronico, label: 'Portão eletrônico' },
                  ].map(({ condition, label }, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {condition ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={condition ? 'text-foreground' : 'text-muted-foreground'}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
                
                <Button variant="outline" className="w-full">
                  Agendar Visita
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}