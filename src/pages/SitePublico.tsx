import { useState, useEffect } from "react";
import { Search, MapPin, Bed, Bath, Car, Phone, Mail, ArrowLeft, ChevronLeft, ChevronRight, Facebook, Instagram } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Imovel } from "@/types/crm";

interface ImovelComFotos extends Imovel {
  fotos: string[];
}

export default function SitePublico() {
  const { settings } = useCompany();
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState<ImovelComFotos[]>([]);
  const [filteredImoveis, setFilteredImoveis] = useState<ImovelComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tipo: "",
    quartos: "",
    banheiros: "",
    precoMin: "",
    precoMax: "",
    vaga: false
  });

  useEffect(() => {
    fetchImoveis();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, imoveis]);

  const fetchImoveis = async () => {
    try {
      // Buscar todos os imóveis com suas fotos
      const { data: imoveisData, error: imoveisError } = await supabase
        .from('imoveis')
        .select('*')
        .order('created_at', { ascending: false });

      if (imoveisError) throw imoveisError;

      // Buscar fotos para cada imóvel
      const imoveisComFotos: ImovelComFotos[] = [];
      
      for (const imovel of (imoveisData || [])) {
        const { data: fotosData, error: fotosError } = await supabase
          .from('imovel_midias')
          .select('url')
          .eq('imovel_id', imovel.id)
          .eq('tipo', 'imagem')
          .order('ordem', { ascending: true });

        if (fotosError) {
          console.error('Erro ao carregar fotos do imóvel:', fotosError);
        }

        imoveisComFotos.push({
          ...imovel,
          fotos: fotosData?.map(foto => foto.url) || []
        });
      }

      setImoveis(imoveisComFotos);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...imoveis];

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(imovel =>
        imovel.endereco?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.localizacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo - removido pois não existe na interface Imovel

    // Filtro por quartos
    if (filters.quartos && filters.quartos !== "todos") {
      const quartosNum = parseInt(filters.quartos);
      if (filters.quartos === "4+") {
        filtered = filtered.filter(imovel => imovel.quartos && imovel.quartos >= 4);
      } else {
        filtered = filtered.filter(imovel => imovel.quartos === quartosNum);
      }
    }

    // Filtro por banheiros
    if (filters.banheiros && filters.banheiros !== "todos") {
      const banheirosNum = parseInt(filters.banheiros);
      if (filters.banheiros === "3+") {
        filtered = filtered.filter(imovel => imovel.banheiros && imovel.banheiros >= 3);
      } else {
        filtered = filtered.filter(imovel => imovel.banheiros === banheirosNum);
      }
    }

    // Filtro por preço
    if (filters.precoMin) {
      filtered = filtered.filter(imovel => imovel.preco >= parseFloat(filters.precoMin));
    }
    if (filters.precoMax) {
      filtered = filtered.filter(imovel => imovel.preco <= parseFloat(filters.precoMax));
    }

    // Filtro por vaga
    if (filters.vaga) {
      filtered = filtered.filter(imovel => imovel.vaga_carro);
    }

    setFilteredImoveis(filtered);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const clearFilters = () => {
    setFilters({
      tipo: "",
      quartos: "",
      banheiros: "",
      precoMin: "",
      precoMax: "",
      vaga: false
    });
    setSearchTerm("");
  };

  // Componente do carrossel de fotos
  const ImageCarousel = ({ fotos, alt }: { fotos: string[], alt: string }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!fotos || fotos.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
      );
    }

    const nextImage = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev + 1) % fotos.length);
    };

    const prevImage = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
    };

    return (
      <div className="relative w-full h-full">
        <img
          src={fotos[currentIndex]}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5TZW0gaW1hZ2VtPC90ZXh0Pjwvc3ZnPg==';
          }}
        />
        
        {fotos.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            
            {/* Indicadores */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {fotos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
            
            {/* Contador */}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando imóveis...</p>
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
            <div className="flex-1" />
            
            <div className="flex justify-center">
              <img 
                src={settings.logo || "/lovable-uploads/3ebecda3-d067-45fc-8317-a3481a6aed5a.png"} 
                alt={settings.name} 
                className="h-20 w-auto" 
              />
            </div>
            
            <div className="flex-1 flex justify-end items-center gap-6">
              <Link to="/sobre-nos" className="text-muted-foreground hover:text-primary">Sobre Nós</Link>
              {settings.site_facebook && (
                <a 
                  href={settings.site_facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {settings.site_instagram && (
                <a 
                  href={settings.site_instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              <Link to="/contato" className="text-muted-foreground hover:text-primary">Contato</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Pesquisa */}
      <section className="bg-gray-50 py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por endereço, bairro ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Filtros</h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpar
                  </Button>
                </div>

                <div className="space-y-4">

                  <div>
                    <label className="text-sm font-medium mb-2 block">Quartos</label>
                    <Select value={filters.quartos} onValueChange={(value) => setFilters(prev => ({...prev, quartos: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Qualquer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Qualquer</SelectItem>
                        <SelectItem value="1">1 quarto</SelectItem>
                        <SelectItem value="2">2 quartos</SelectItem>
                        <SelectItem value="3">3 quartos</SelectItem>
                        <SelectItem value="4+">4+ quartos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Banheiros</label>
                    <Select value={filters.banheiros} onValueChange={(value) => setFilters(prev => ({...prev, banheiros: value}))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Qualquer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Qualquer</SelectItem>
                        <SelectItem value="1">1 banheiro</SelectItem>
                        <SelectItem value="2">2 banheiros</SelectItem>
                        <SelectItem value="3+">3+ banheiros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Preço</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Mín"
                        type="number"
                        value={filters.precoMin}
                        onChange={(e) => setFilters(prev => ({...prev, precoMin: e.target.value}))}
                      />
                      <Input
                        placeholder="Máx"
                        type="number"
                        value={filters.precoMax}
                        onChange={(e) => setFilters(prev => ({...prev, precoMax: e.target.value}))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="vaga"
                      checked={filters.vaga}
                      onChange={(e) => setFilters(prev => ({...prev, vaga: e.target.checked}))}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="vaga" className="text-sm">Com vaga de garagem</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-muted-foreground">
                {filteredImoveis.length} imóveis encontrados
              </p>
            </div>

            {filteredImoveis.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum imóvel encontrado
                  </h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros para encontrar mais imóveis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredImoveis.map((imovel) => (
                  <Card 
                    key={imovel.id} 
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/imovel/${imovel.id}`)}
                  >
                    <div className="aspect-video bg-gray-100 relative">
                      <ImageCarousel 
                        fotos={imovel.fotos} 
                        alt={`Imóvel em ${imovel.localizacao}`}
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" className="bg-white/90">
                          {imovel.fotos?.length || 0} foto{(imovel.fotos?.length || 0) !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-2xl font-bold text-primary mb-1">
                          {formatPrice(imovel.preco)}
                        </h3>
                        <p className="text-muted-foreground flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {imovel.localizacao}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {imovel.endereco}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                        {imovel.quartos && (
                          <div className="flex items-center">
                            <Bed className="w-4 h-4 mr-1" />
                            {imovel.quartos} quartos
                          </div>
                        )}
                        {imovel.banheiros && (
                          <div className="flex items-center">
                            <Bath className="w-4 h-4 mr-1" />
                            {imovel.banheiros} banheiros
                          </div>
                        )}
                        {imovel.vaga_carro && (
                          <div className="flex items-center">
                            <Car className="w-4 h-4 mr-1" />
                            Vaga
                          </div>
                        )}
                      </div>

                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-4">{settings.site_title || settings.name}</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              {settings.site_description || 'Sua parceira na busca pelo imóvel ideal. Encontre as melhores oportunidades do mercado.'}
            </p>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {settings.site_title || settings.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}