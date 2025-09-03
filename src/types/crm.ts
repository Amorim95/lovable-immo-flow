
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
  userId?: string;
  primeira_visualizacao?: string;
}

export type LeadStage = 
  | 'aguardando-atendimento'
  | 'tentativas-contato' 
  | 'atendeu'
  | 'nome-sujo'
  | 'nome-limpo'
  | 'visita'
  | 'vendas-fechadas'
  | 'em-pausa'
  | 'descarte';

export type LeadTag = 
  | 'tentando-financiamento'
  | 'parou-responder'
  | 'cpf-restricao'
  | 'aprovado';

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
  status: 'ativo' | 'inativo' | 'pendente';
  permissoes: string[];
  leads: string[];
  equipeId?: string;
  equipeNome?: string;
  role: 'admin' | 'gestor' | 'corretor' | 'dono';
}

export interface Imovel {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  preco: number;
  localizacao: string;
  endereco: string;
  descricao: string;
  quartos?: number;
  condominio?: number;
  iptu?: number;
  vaga_carro: boolean;
  banheiros?: number;
  aceita_animais: boolean;
  condominio_fechado: boolean;
  closet: boolean;
  portaria_24h: boolean;
  portao_eletronico: boolean;
  publico: boolean;
  slug: string;
}

export interface ImovelMidia {
  id: string;
  created_at: string;
  imovel_id: string;
  url: string;
  tipo: 'imagem' | 'video';
  ordem: number;
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
