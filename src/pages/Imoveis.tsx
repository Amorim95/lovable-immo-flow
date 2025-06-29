
import { useState } from "react";
import { Imovel } from "@/types/crm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus,
  Edit
} from "lucide-react";

const mockImoveis: Imovel[] = [
  {
    id: '1',
    titulo: 'Apartamento 2 quartos - Centro',
    endereco: 'Rua das Flores, 123 - Centro, São Paulo - SP',
    tipo: 'apartamento',
    valor: 350000,
    area: 65,
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    descricao: 'Apartamento moderno com 2 quartos, sala ampla, cozinha americana e varanda. Localizado no centro da cidade com fácil acesso ao transporte público.',
    fotos: [],
    status: 'disponivel',
    corretor: 'Maria Santos'
  },
  {
    id: '2',
    titulo: 'Casa 3 quartos - Vila Prudente',
    endereco: 'Av. Vila Prudente, 456 - Vila Prudente, São Paulo - SP',
    tipo: 'casa',
    valor: 480000,
    area: 120,
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    descricao: 'Casa térrea com 3 quartos, sendo 1 suíte, sala de estar e jantar, cozinha ampla, área de serviço e quintal.',
    fotos: [],
    status: 'disponivel',
    corretor: 'Pedro Oliveira'
  },
  {
    id: '3',
    titulo: 'Apartamento 1 quarto - Mooca',
    endereco: 'Rua da Mooca, 789 - Mooca, São Paulo - SP',
    tipo: 'apartamento',
    valor: 280000,
    area: 45,
    quartos: 1,
    banheiros: 1,
    vagas: 1,
    descricao: 'Apartamento compacto e funcional, ideal para solteiros ou casais. Prédio com portaria 24h e área de lazer.',
    fotos: [],
    status: 'reservado',
    corretor: 'Maria Santos'
  },
  {
    id: '4',
    titulo: 'Casa 4 quartos - Tatuapé',
    endereco: 'Rua do Tatuapé, 321 - Tatuapé, São Paulo - SP',
    tipo: 'casa',
    valor: 750000,
    area: 200,
    quartos: 4,
    banheiros: 3,
    vagas: 3,
    descricao: 'Casa de alto padrão com 4 quartos, sendo 2 suítes, sala de estar, sala de jantar, cozinha gourmet, área gourmet e piscina.',
    fotos: [],
    status: 'disponivel',
    corretor: 'Pedro Oliveira'
  }
];

const statusConfig = {
  'disponivel': { label: 'Disponível', color: 'bg-green-100 text-green-800' },
  'reservado': { label: 'Reservado', color: 'bg-yellow-100 text-yellow-800' },
  'vendido': { label: 'Vendido', color: 'bg-gray-100 text-gray-800' }
};

const tipoConfig = {
  'apartamento': 'Apartamento',
  'casa': 'Casa',
  'terreno': 'Terreno',
  'comercial': 'Comercial'
};

const Imoveis = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>(mockImoveis);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredImoveis = imoveis.filter(imovel =>
    imovel.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imovel.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    imovel.corretor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cadastro de Imóveis</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os imóveis disponíveis para venda
          </p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Novo Imóvel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{imoveis.length}</p>
                <p className="text-sm text-gray-600">Total de Imóveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {imoveis.filter(i => i.status === 'disponivel').length}
                </p>
                <p className="text-sm text-gray-600">Disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {imoveis.filter(i => i.status === 'reservado').length}
                </p>
                <p className="text-sm text-gray-600">Reservados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Edit className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {imoveis.filter(i => i.status === 'vendido').length}
                </p>
                <p className="text-sm text-gray-600">Vendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar imóveis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Imóveis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredImoveis.map((imovel) => (
          <Card key={imovel.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{imovel.titulo}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{imovel.endereco}</p>
                </div>
                <Badge className={statusConfig[imovel.status].color}>
                  {statusConfig[imovel.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{tipoConfig[imovel.tipo]}</Badge>
                  <span className="text-2xl font-bold text-primary">
                    {imovel.valor.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Área:</span>
                    <span className="font-medium">{imovel.area}m²</span>
                  </div>
                  {imovel.quartos && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quartos:</span>
                      <span className="font-medium">{imovel.quartos}</span>
                    </div>
                  )}
                  {imovel.banheiros && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Banheiros:</span>
                      <span className="font-medium">{imovel.banheiros}</span>
                    </div>
                  )}
                  {imovel.vagas && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Vagas:</span>
                      <span className="font-medium">{imovel.vagas}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 line-clamp-3">
                  {imovel.descricao}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Corretor: {imovel.corretor}</span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button variant="default" size="sm" className="flex-1">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Imoveis;
