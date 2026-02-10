import { Participant, Quota, DashboardData } from "@/types";
import { TOTAL_TICKETS } from "@/lib/constants";

const PARTICIPANTS_KEY = "tax-summit-participants";
const QUOTAS_KEY = "tax-summit-quotas";

// --- Participants ---

export function getParticipants(): Participant[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PARTICIPANTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function addParticipant(
  data: Omit<Participant, "id" | "created_at">
): Participant {
  const participants = getParticipants();
  const participant: Participant = {
    ...data,
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

// --- Dashboard ---

export function getDashboardData(): DashboardData {
  const participants = getParticipants();
  const quotas = getQuotas();
  const cadastrados = participants.length;
  const reservados = quotas.reduce(
    (acc, q) => acc + (q.quantidade - q.usados),
    0
  );
  const livres = Math.max(0, TOTAL_TICKETS - cadastrados - reservados);
  return { total: TOTAL_TICKETS, reservados, cadastrados, livres };
}
