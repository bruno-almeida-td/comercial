export interface Participant {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  whatsapp: string;
  empresa: string;
  cpf: string;
  nomeCredencial: string;
  empresaCredencial: string;
  necessidadesEspeciais: string;
  atendimentoEspecifico: string;
  vendedor: string;
  cota: string;
  dataCadastro: string;
}

export interface Quota {
  id: string;
  parceiro: string;
  quantidade: number;
  usados: number;
  dataCriacao: string;
}

export interface DashboardData {
  total: number;
  reservados: number;
  cadastrados: number;
  livres: number;
}

export interface SellerRanking {
  vendedor: string;
  cadastros: number;
}
