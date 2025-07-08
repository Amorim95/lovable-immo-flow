
export interface Lead {
  id: string;
  nome: string;
  telefone: string;
  dadosAdicionais?: string;
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

export interface Equipe {
  id: string;
  nome: string;
  responsavelId: string;
  responsavelNome: string;
  corretores: string[];
}

export interface Corretor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo';
  permissoes: string[];
  leads: string[];
  equipeId?: string;
  equipeNome?: string;
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

export interface Fila {
  id: string;
  nome: string;
  corretores: string[];
  ordem: 'sequencial' | 'random';
  origem: 'meta-ads' | 'google-ads' | 'indicacao' | 'geral';
  status: 'ativa' | 'pausada';
  configuracoes: {
    tempoResposta: number;
    maxLeadsPorCorretor: number;
  };
}
