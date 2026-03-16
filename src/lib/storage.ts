import { Participant, Quota, DashboardData } from "@/types";

const PARTICIPANTS_KEY = "tax-summit-participants";
const QUOTAS_KEY = "tax-summit-quotas";
const VOUCHERS_KEY = "tax-summit-vouchers";

// --- Vouchers ---

export function getVouchers(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VOUCHERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function importVouchers(codes: string[]): number {
  const existing = new Set(getVouchers());
  const newCodes = codes
    .map((c) => c.trim())
    .filter((c) => c.length > 0 && !existing.has(c));
  const updated = [...Array.from(existing), ...newCodes];
  localStorage.setItem(VOUCHERS_KEY, JSON.stringify(updated));
  return newCodes.length;
}

export function clearUnusedVouchers(): number {
  const participants = getParticipants();
  const usedSet = new Set(participants.map((p) => p.voucher));
  const all = getVouchers();
  const removed = all.filter((v) => !usedSet.has(v)).length;
  const keep = all.filter((v) => usedSet.has(v));
  localStorage.setItem(VOUCHERS_KEY, JSON.stringify(keep));
  return removed;
}

export function getAvailableVouchers(): string[] {
  const all = getVouchers();
  const participants = getParticipants();
  const usedSet = new Set(participants.map((p) => p.voucher));
  return all.filter((v) => !usedSet.has(v));
}

// --- Participants ---

export function getParticipants(): Participant[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PARTICIPANTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addParticipant(
  data: Omit<Participant, "id" | "created_at" | "voucher">
): Participant {
  const available = getAvailableVouchers();
  if (available.length === 0) {
    throw new Error("Nenhum voucher disponível. Importe vouchers primeiro.");
  }

  const voucher = available[0];
  const participants = getParticipants();
  const participant: Participant = {
    ...data,
    voucher,
    id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };
  participants.push(participant);
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));

  // If linked to a quota, increment usados
  if (data.cota) {
    const quotas = getQuotas();
    const idx = quotas.findIndex((q) => q.parceiro === data.cota);
    if (idx !== -1) {
      quotas[idx].usados += 1;
      localStorage.setItem(QUOTAS_KEY, JSON.stringify(quotas));
    }
  }

  return participant;
}

export function deleteParticipant(id: string): void {
  const participants = getParticipants();
  const participant = participants.find((p) => p.id === id);
  if (!participant) return;

  // If linked to a quota, decrement usados
  if (participant.cota) {
    const quotas = getQuotas();
    const idx = quotas.findIndex((q) => q.parceiro === participant.cota);
    if (idx !== -1 && quotas[idx].usados > 0) {
      quotas[idx].usados -= 1;
      localStorage.setItem(QUOTAS_KEY, JSON.stringify(quotas));
    }
  }

  const updated = participants.filter((p) => p.id !== id);
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(updated));
}

// --- Quotas ---

export function getQuotas(): Quota[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(QUOTAS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addQuota(parceiro: string, quantidade: number): Quota {
  const quotas = getQuotas();
  const quota: Quota = {
    id: `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    parceiro,
    quantidade,
    usados: 0,
    created_at: new Date().toISOString(),
  };
  quotas.push(quota);
  localStorage.setItem(QUOTAS_KEY, JSON.stringify(quotas));
  return quota;
}

export function deleteQuota(id: string): { ok: boolean; error?: string } {
  const quotas = getQuotas();
  const quota = quotas.find((q) => q.id === id);
  if (!quota) return { ok: false, error: "Cota não encontrada" };
  if (quota.usados > 0) {
    return {
      ok: false,
      error: `Não é possível excluir: ${quota.usados} cadastro(s) vinculado(s)`,
    };
  }
  const updated = quotas.filter((q) => q.id !== id);
  localStorage.setItem(QUOTAS_KEY, JSON.stringify(updated));
  return { ok: true };
}

// --- Direct participant insert (bypasses voucher auto-assign) ---

export function addParticipantDirect(
  data: Omit<Participant, "id" | "created_at">
): Participant | null {
  const participants = getParticipants();
  if (participants.some((p) => p.voucher === data.voucher)) return null; // idempotente

  const participant: Participant = {
    ...data,
    id: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };
  participants.push(participant);
  localStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(participants));
  return participant;
}

// --- Seed inicial: Cota Guga ---

const GUGA_VOUCHERS = [
  "GJU6GJ", "M833B8", "77F755", "6NYUUN", "N7ZL4B", "3NWRIA",
  "YCA4PV", "IAUMRA", "R3K4PF", "Z6LERM", "8XUSMH", "TPTUY5",
  "2AUG2A", "VL4RB4", "85TLRW", "GAWNZQ", "XQ1GE8", "34BR1D",
  "YUXIXL", "M5SYA1", "UPZ6JB",
];

export function seedGugaData(): void {
  const quotas = getQuotas();
  if (quotas.some((q) => q.parceiro === "Guga")) return; // já inicializado

  // Importa os vouchers
  importVouchers(GUGA_VOUCHERS);

  // Cria a cota Guga com todos já marcados como usados
  const quota: Quota = {
    id: `Q-GUGA`,
    parceiro: "Guga",
    quantidade: GUGA_VOUCHERS.length,
    usados: GUGA_VOUCHERS.length,
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(QUOTAS_KEY, JSON.stringify([...quotas, quota]));

  // Cria um registro de participante para cada voucher (controle interno)
  GUGA_VOUCHERS.forEach((voucher) => {
    addParticipantDirect({
      nome: "Guga",
      empresa: "Controle interno",
      email: "",
      whatsapp: "",
      cota: "Guga",
      voucher,
    });
  });
}

// --- Seed inicial: Participantes Sompo ---

const SOMPO_PARTICIPANTS = [
  {
    nome: "Alberto dos Santos Barbosa",
    empresa: "Sompo",
    email: "asbarbosa@sompo.com.br",
    whatsapp: "(11) 99544-9407",
    cpf: "224.267.768-38",
    cota: null,
    voucher: "WB3PX9",
  },
  {
    nome: "Nicolas Queiroz de Souza Silva",
    empresa: "Sompo",
    email: "nqssilva@sompo.com.br",
    whatsapp: "(11) 91468-7955",
    cpf: "459.684.338-41",
    cota: null,
    voucher: "T7YRQK",
  },
  {
    nome: "Gabriel Felipe Lima",
    empresa: "Sompo",
    email: "gflima@sompo.com.br",
    whatsapp: "(11) 98204-0746",
    cpf: "443.828.758-89",
    cota: null,
    voucher: "5VHJDM",
  },
  {
    nome: "Gabriela Furquim de Almeida",
    empresa: "",
    email: "gabriela.furquimdealmeida@gmail.com",
    whatsapp: "(11) 95677-0908",
    cpf: "230.085.488-06",
    cota: null,
    voucher: "CN4AUQ",
  },
];

export function seedSompoParticipants(): void {
  const participants = getParticipants();
  const existingVouchers = new Set(participants.map((p) => p.voucher));
  if (SOMPO_PARTICIPANTS.every((p) => existingVouchers.has(p.voucher))) return;

  // Importa os vouchers
  importVouchers(SOMPO_PARTICIPANTS.map((p) => p.voucher));

  // Cria os participantes
  SOMPO_PARTICIPANTS.forEach((p) => {
    if (!existingVouchers.has(p.voucher)) {
      addParticipantDirect(p);
    }
  });
}

// --- Dashboard ---

export function getDashboardData(): DashboardData {
  const vouchers = getVouchers();
  const participants = getParticipants();
  const quotas = getQuotas();
  const total = vouchers.length;
  const entregues = participants.length;
  const restantes = total - entregues;
  const reservados = quotas.reduce(
    (acc, q) => acc + (q.quantidade - q.usados),
    0
  );
  return { total, entregues, restantes, reservados };
}
