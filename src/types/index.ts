export interface Participant {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  whatsapp: string;
  empresa: string;
  cpf: string;
  nome_credencial: string;
  empresa_credencial: string;
  necessidades_especiais: string;
  atendimento_especifico: string;
  voucher: string;
  vendedor: string;
  cota: string | null;
  created_at: string;
}

export interface Quota {
  id: string;
  parceiro: string;
  quantidade: number;
  usados: number;
  created_at: string;
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
