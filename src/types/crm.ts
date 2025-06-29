
export interface Lead {
  id: string;
  nome: string;
  imovel: string;
  telefone: string;
  telefoneExtra?: string;
  temFGTS: boolean;
  rendaFamiliar: number;
  possuiEntrada: boolean;
  campanha?: string;
  conjunto?: string;
  anuncio?: string;
  dataCriacao: Date;
  etapa: LeadStage;
  etiquetas: LeadTag[];
  corretor: string;
  atividades: Atividade[];
  status: 'ativo' | 'inativo';
}

export type LeadStage = 
  | 'aguardando-atendimento'
  | 'tentativas-contato' 
  | 'atendeu'
  | 'visita'
  | 'vendas-fechadas'
  | 'em-pausa';

export type LeadTag = 
  | 'tentando-financiamento'
  | 'parou-responder'
  | 'cpf-restricao';

export interface Atividade {
  id: string;
  tipo: 'ligacao' | 'whatsapp' | 'email' | 'visita' | 'proposta' | 'observacao';
  descricao: string;
  data: Date;
  corretor: string;
}

export interface Corretor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  permissoes: string[];
  leads: string[];
}

export interface Imovel {
  id: string;
  titulo: string;
  endereco: string;
  tipo: 'apartamento' | 'casa' | 'terreno' | 'comercial';
  valor: number;
  area: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  descricao: string;
  fotos: string[];
  status: 'disponivel' | 'reservado' | 'vendido';
  corretor: string;
}

export interface DashboardData {
  totalLeads: number;
  leadsConvertidos: number;
  taxaConversao: number;
  leadsPorEtapa: Record<LeadStage, number>;
  leadsPorCorretor: Record<string, number>;
  leadsPorMes: Record<string, number>;
  valorTotalVendas: number;
}
