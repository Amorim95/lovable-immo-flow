import { useState } from "react";
import { Lead } from "@/types/crm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ListView } from "@/components/ListView";
import { LeadModal } from "@/components/LeadModal";
import { NewLeadModal } from "@/components/NewLeadModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  LayoutList, 
  LayoutGrid,
  Plus,
  Calendar
} from "lucide-react";

// Dados mock para demonstração
const mockLeads: Lead[] = [
  {
    id: '1',
    nome: 'João Silva',
    telefone: '(11) 99999-9999',
    dadosAdicionais: 'Interessado em apartamento de 2 quartos no centro. Possui FGTS disponível. Renda familiar de R$ 5.000. Possui entrada de R$ 50.000.',
    campanha: 'Facebook Ads - Apartamentos Centro',
    conjunto: 'Interesse Apartamentos',
    anuncio: 'Apartamento 2Q Centro',
    dataCriacao: new Date('2024-06-28T14:30:00'),
    etapa: 'aguardando-atendimento',
    etiquetas: ['tentando-financiamento'],
    corretor: 'Maria Santos',
    atividades: [
      {
        id: '1',
        tipo: 'ligacao',
        descricao: 'Primeira tentativa de contato - não atendeu',
        data: new Date('2024-06-28T15:00:00'),
        corretor: 'Maria Santos'
      }
    ],
    status: 'ativo'
  },
  {
    id: '2',
    nome: 'Ana Costa',
    telefone: '(11) 77777-7777',
    dadosAdicionais: 'Procura casa de 3 quartos na Zona Leste. Não tem FGTS. Renda familiar de R$ 8.000. Não possui entrada ainda.',
    campanha: 'Google Ads - Casas Zone Leste',
    conjunto: 'Casas Zona Leste',
    anuncio: 'Casa 3Q Vila Prudente',
    dataCriacao: new Date('2024-06-27T10:15:00'),
    etapa: 'tentativas-contato',
    etiquetas: ['parou-responder'],
    corretor: 'Pedro Oliveira',
    atividades: [
      {
        id: '2',
        tipo: 'whatsapp',
        descricao: 'Enviou mensagem via WhatsApp - visualizou mas não respondeu',
        data: new Date('2024-06-27T16:00:00'),
        corretor: 'Pedro Oliveira'
      }
    ],
    status: 'ativo'
  },
  {
    id: '3',
    nome: 'Carlos Rodrigues',
    telefone: '(11) 66666-6666',
    dadosAdicionais: 'Apartamento compacto na Mooca. Tem FGTS. Renda de R$ 3.500. Entrada de R$ 30.000 disponível.',
    campanha: 'Instagram Ads - Apartamentos Compactos',
    conjunto: 'Apartamentos 1Q',
    anuncio: 'Apt 1Q Mooca',
    dataCriacao: new Date('2024-06-26T09:30:00'),
    etapa: 'atendeu',
    etiquetas: [],
    corretor: 'Maria Santos',
    atividades: [
      {
        id: '3',
        tipo: 'ligacao',
        descricao: 'Ligação realizada - cliente interessado, vai pensar',
        data: new Date('2024-06-26T14:30:00'),
        corretor: 'Maria Santos'
      }
    ],
    status: 'ativo'
  },
  {
    id: '4',
    nome: 'Fernanda Lima',
    telefone: '(11) 55555-5555',
    dadosAdicionais: 'Casa de alto padrão no Tatuapé. Tem FGTS. Renda familiar de R$ 12.000. Entrada substancial disponível.',
    campanha: 'Facebook Ads - Casas Luxo',
    conjunto: 'Casas Premium',
    anuncio: 'Casa 4Q Tatuapé',
    dataCriacao: new Date('2024-06-25T11:00:00'),
    etapa: 'visita',
    etiquetas: [],
    corretor: 'Pedro Oliveira',
    atividades: [
      {
        id: '4',
        tipo: 'visita',
        descricao: 'Visita agendada para amanhã às 15h',
        data: new Date('2024-06-25T17:00:00'),
        corretor: 'Pedro Oliveira'
      }
    ],
    status: 'ativo'
  },
  {
    id: '5',
    nome: 'Roberto Santos',
    telefone: '(11) 44444-4444',
    dadosAdicionais: 'Apartamento familiar no Ipiranga. Não tem FGTS. Renda de R$ 7.500. Possui entrada.',
    campanha: 'Google Ads - Apartamentos Familiares',
    conjunto: 'Apartamentos 3Q',
    anuncio: 'Apt 3Q Ipiranga',
    dataCriacao: new Date('2024-06-24T16:45:00'),
    etapa: 'vendas-fechadas',
    etiquetas: [],
    corretor: 'Maria Santos',
    atividades: [
      {
        id: '5',
        tipo: 'proposta',
        descricao: 'Proposta aceita - contrato assinado',
        data: new Date('2024-06-29T10:00:00'),
        corretor: 'Maria Santos'
      }
    ],
    status: 'ativo'
  },
  {
    id: '6',
    nome: 'Patricia Alves',
    telefone: '(11) 33333-3333',
    dadosAdicionais: 'Primeira casa própria na Penha. Tem FGTS. Renda de R$ 4.200. Não possui entrada ainda. CPF com restrição.',
    campanha: 'Facebook Ads - Primeira Casa',
    conjunto: 'Casas Primeira Compra',
    anuncio: 'Casa 2Q Penha',
    dataCriacao: new Date('2024-06-23T13:20:00'),
    etapa: 'em-pausa',
    etiquetas: ['cpf-restricao'],
    corretor: 'Pedro Oliveira',
    atividades: [
      {
        id: '6',
        tipo: 'observacao',
        descricao: 'Cliente com restrição no CPF - aguardando regularização',
        data: new Date('2024-06-23T15:30:00'),
        corretor: 'Pedro Oliveira'
      }
    ],
    status: 'ativo'
  }
];

const Index = () => {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLeadUpdate = (leadId: string, updates: Partial<Lead>) => {
    setLeads(leads.map(lead => 
      lead.id === leadId 
        ? { ...lead, ...updates }
        : lead
    ));
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const handleCreateLead = (leadData: Partial<Lead>) => {
    const newLead = leadData as Lead;
    setLeads([...leads, newLead]);
  };

  const filteredLeads = leads.filter(lead =>
    lead.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lead.dadosAdicionais && lead.dadosAdicionais.toLowerCase().includes(searchTerm.toLowerCase())) ||
    lead.corretor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLeads = leads.length;
  const leadsHoje = leads.filter(lead => {
    const hoje = new Date();
    const leadDate = new Date(lead.dataCriacao);
    return leadDate.toDateString() === hoje.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Leads</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os seus leads de forma eficiente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            className="bg-primary hover:bg-primary/90"
            onClick={() => setIsNewLeadModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <LayoutList className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
              <p className="text-sm text-gray-600">Total de Leads</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{leadsHoje}</p>
              <p className="text-sm text-gray-600">Leads de Hoje</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.etapa === 'vendas-fechadas').length}
              </p>
              <p className="text-sm text-gray-600">Vendas Fechadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {leads.filter(l => l.etapa === 'visita').length}
              </p>
              <p className="text-sm text-gray-600">Visitas Agendadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Controles */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="px-3"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Padrão
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <LayoutList className="w-4 h-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {viewMode === 'kanban' ? (
          <KanbanBoard
            leads={filteredLeads}
            onLeadUpdate={handleLeadUpdate}
            onLeadClick={handleLeadClick}
          />
        ) : (
          <ListView
            leads={filteredLeads}
            onLeadClick={handleLeadClick}
            onLeadUpdate={handleLeadUpdate}
          />
        )}
      </div>

      {/* Modals */}
      <LeadModal
        lead={selectedLead}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        onUpdate={handleLeadUpdate}
      />

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onCreateLead={handleCreateLead}
      />
    </div>
  );
};

export default Index;
