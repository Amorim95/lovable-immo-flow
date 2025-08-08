import { useState, useEffect } from "react";
import { Search, MapPin, Bed, Bath, Car, Home, Building, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Imovel, ImovelMidia } from "@/types/crm";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface LeadFormData {
  nome: string;
  email: string;
  telefone: string;
  mensagem: string;
  imovelId: string;
}

export default function SitePublico() {
  const navigate = useNavigate();
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [filteredImoveis, setFilteredImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoImovel, setTipoImovel] = useState<string[]>([]);
  const [quartos, setQuartos] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [temVaga, setTemVaga] = useState(false);
  const [aceitaAnimais, setAceitaAnimais] = useState(false);
  const [condominioFechado, setCondominioFechado] = useState(false);
  
  // Lead form
  const [leadForm, setLeadForm] = useState<LeadFormData>({
    nome: "",
    email: "",
    telefone: "",
    mensagem: "",
    imovelId: ""
  });
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

  useEffect(() => {
    fetchImoveis();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [imoveis, searchTerm, tipoImovel, quartos, banheiros, precoMin, precoMax, temVaga, aceitaAnimais, condominioFechado]);

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
      toast({
        title: "Erro",
        description: "Não foi possível carregar os imóveis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...imoveis];

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(imovel =>
        imovel.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por quartos
    if (quartos) {
      filtered = filtered.filter(imovel => imovel.quartos === parseInt(quartos));
    }

    // Filtro por banheiros
    if (banheiros) {
      filtered = filtered.filter(imovel => imovel.banheiros === parseInt(banheiros));
    }

    // Filtro por preço
    if (precoMin) {
      filtered = filtered.filter(imovel => imovel.preco >= parseFloat(precoMin));
    }
    if (precoMax) {
      filtered = filtered.filter(imovel => imovel.preco <= parseFloat(precoMax));
    }

    // Filtros boolean
    if (temVaga) {
      filtered = filtered.filter(imovel => imovel.vaga_carro);
    }
    if (aceitaAnimais) {
      filtered = filtered.filter(imovel => imovel.aceita_animais);
    }
    if (condominioFechado) {
      filtered = filtered.filter(imovel => imovel.condominio_fechado);
    }

    setFilteredImoveis(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTipoImovel([]);
    setQuartos("");
    setBanheiros("");
    setPrecoMin("");
    setPrecoMax("");
    setTemVaga(false);
    setAceitaAnimais(false);
    setCondominioFechado(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const openLeadDialog = (imovelId: string) => {
    setLeadForm({ ...leadForm, imovelId });
    setLeadDialogOpen(true);
  };

  const submitLead = async () => {
    if (!leadForm.nome || !leadForm.telefone) {
      toast({
        title: "Erro",
        description: "Nome e telefone são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          nome: leadForm.nome,
          telefone: leadForm.telefone,
          dados_adicionais: `Email: ${leadForm.email}\nMensagem: ${leadForm.mensagem}\nImóvel ID: ${leadForm.imovelId}`,
          etapa: 'aguardando-atendimento'
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Seu interesse foi registrado. Em breve entraremos em contato!",
      });

      setLeadDialogOpen(false);
      setLeadForm({ nome: "", email: "", telefone: "", mensagem: "", imovelId: "" });
    } catch (error) {
      console.error('Erro ao enviar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const FiltersPanel = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Limpar
        </Button>
      </div>

      {/* Quartos */}
      <div>
        <Label className="text-sm font-medium">Quartos</Label>
        <Select value={quartos} onValueChange={setQuartos}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Qualquer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Qualquer</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Banheiros */}
      <div>
        <Label className="text-sm font-medium">Banheiros</Label>
        <Select value={banheiros} onValueChange={setBanheiros}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Qualquer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Qualquer</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preço */}
      <div>
        <Label className="text-sm font-medium">Faixa de Preço</Label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <Input
            placeholder="Mínimo"
            type="number"
            value={precoMin}
            onChange={(e) => setPrecoMin(e.target.value)}
          />
          <Input
            placeholder="Máximo"
            type="number"
            value={precoMax}
            onChange={(e) => setPrecoMax(e.target.value)}
          />
        </div>
      </div>

      {/* Características */}
      <div>
        <Label className="text-sm font-medium">Características</Label>
        <div className="space-y-3 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vaga"
              checked={temVaga}
              onCheckedChange={(checked) => setTemVaga(checked as boolean)}
            />
            <Label htmlFor="vaga" className="text-sm">Vaga de carro</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="animais"
              checked={aceitaAnimais}
              onCheckedChange={(checked) => setAceitaAnimais(checked as boolean)}
            />
            <Label htmlFor="animais" className="text-sm">Aceita animais</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="condominio"
              checked={condominioFechado}
              onCheckedChange={(checked) => setCondominioFechado(checked as boolean)}
            />
            <Label htmlFor="condominio" className="text-sm">Condomínio fechado</Label>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando imóveis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <img 
                  src="/lovable-uploads/96ed2187-b9dc-4b74-bc9b-f718fd8f20ed.png" 
                  alt="Click Imóveis" 
                  className="h-10 w-auto"
                />
              </div>
              <nav className="hidden md:flex space-x-6">
                <a href="#" className="text-gray-700 hover:text-primary">Comprar</a>
                <a href="#" className="text-gray-700 hover:text-primary">Alugar</a>
                <a href="#" className="text-gray-700 hover:text-primary">Contato</a>
              </nav>
            </div>
            <Button variant="outline" onClick={() => navigate('/crm')}>
              Área do Corretor
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-primary/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Encontre o imóvel ideal para você
            </h1>
            <p className="text-gray-600">
              {filteredImoveis.length} imóveis disponíveis
            </p>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Digite o nome da rua, bairro ou cidade"
              className="pl-10 pr-4 py-6 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full flex items-center justify-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>

          {/* Filters Sidebar */}
          <div className={`lg:w-80 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardContent className="p-6">
                <FiltersPanel />
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredImoveis.length} imóveis encontrados
              </p>
            </div>

            {filteredImoveis.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum imóvel encontrado
                  </h3>
                  <p className="text-gray-600">
                    Tente ajustar os filtros para encontrar mais opções.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredImoveis.map((imovel) => (
                  <Card key={imovel.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative h-48 bg-gray-200 rounded-t-lg">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Building className="w-12 h-12 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="mb-3">
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {formatPrice(imovel.preco)}
                          </h3>
                          <p className="text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {imovel.localizacao}
                          </p>
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {imovel.descricao}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {imovel.quartos && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Bed className="w-3 h-3" />
                              {imovel.quartos} quartos
                            </Badge>
                          )}
                          {imovel.banheiros && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Bath className="w-3 h-3" />
                              {imovel.banheiros} banheiros
                            </Badge>
                          )}
                          {imovel.vaga_carro && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Car className="w-3 h-3" />
                              Vaga
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => navigate(`/imovel-publico/${imovel.slug}`)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={() => openLeadDialog(imovel.id)}
                          >
                            Tenho Interesse
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Dialog */}
      <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Demonstrar Interesse</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={leadForm.nome}
                onChange={(e) => setLeadForm({ ...leadForm, nome: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={leadForm.email}
                onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={leadForm.telefone}
                onChange={(e) => setLeadForm({ ...leadForm, telefone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                value={leadForm.mensagem}
                onChange={(e) => setLeadForm({ ...leadForm, mensagem: e.target.value })}
                placeholder="Gostaria de mais informações sobre este imóvel..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setLeadDialogOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={submitLead} className="flex-1">
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}