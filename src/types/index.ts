export interface Participant {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  whatsapp: string;
  cpf?: string;
  voucher: string;
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
  entregues: number;
  restantes: number;
  reservados: number;
}
