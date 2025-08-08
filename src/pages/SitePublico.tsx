import { useState, useEffect } from "react";
import { Search, MapPin, Bed, Bath, Car, Phone, Mail, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { Imovel } from "@/types/crm";

export default function SitePublico() {
  const { settings } = useCompany();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [filteredImoveis, setFilteredImoveis] = useState<Imovel[]>([]);
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
      const { data, error } = await supabase
        .from('imoveis')
        .select('*')
        .eq('publico', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImoveis(data || []);
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

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Encontre seu imóvel ideal
            </h2>
            <p className="text-lg text-muted-foreground">
              Descubra as melhores oportunidades do mercado imobiliário
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por endereço, bairro ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button size="lg">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
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
                  <Card key={imovel.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-100 relative">
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <MapPin className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90">
                          Imóvel
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

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1">
                          <Phone className="w-4 h-4 mr-1" />
                          Telefone
                        </Button>
                        <Button className="flex-1">
                          <Mail className="w-4 h-4 mr-1" />
                          Contato
                        </Button>
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
      <footer id="contato" className="bg-gray-900 text-white py-12 mt-16">
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