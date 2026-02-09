import { Participant, Quota } from "@/types";

const KEYS = {
  REGISTRATIONS: "tax-summit-registrations",
  QUOTAS: "tax-summit-quotas",
} as const;

export function getRegistrations(): Participant[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.REGISTRATIONS);
  return data ? JSON.parse(data) : [];
}

export function addRegistration(
  data: Omit<Participant, "id" | "created_at">
): Participant {
  const registrations = getRegistrations();
  const participant: Participant = {
    ...data,
    id: `P-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  registrations.push(participant);
  localStorage.setItem(KEYS.REGISTRATIONS, JSON.stringify(registrations));

  // Increment quota usage
  if (participant.cota) {
    const quotas = getQuotas();
    const idx = quotas.findIndex((q) => q.parceiro === participant.cota);
    if (idx !== -1) {
      quotas[idx].usados += 1;
      localStorage.setItem(KEYS.QUOTAS, JSON.stringify(quotas));
    }
  }

  return participant;
}

export function getQuotas(): Quota[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(KEYS.QUOTAS);
  return data ? JSON.parse(data) : [];
}

export function addQuota(parceiro: string, quantidade: number): Quota {
  const quotas = getQuotas();
  const quota: Quota = {
    id: `Q-${Date.now()}`,
    parceiro,
    quantidade,
    usados: 0,
    created_at: new Date().toISOString(),
  };
  quotas.push(quota);
  localStorage.setItem(KEYS.QUOTAS, JSON.stringify(quotas));
  return quota;
}

export function deleteQuota(id: string): { success: boolean; error?: string } {
  const quotas = getQuotas();
  const quota = quotas.find((q) => q.id === id);
  if (!quota) return { success: false, error: "Cota não encontrada" };

  const registrations = getRegistrations();
  const hasRegistrations = registrations.some((r) => r.cota === quota.parceiro);
  if (hasRegistrations) {
    return {
      success: false,
      error: "Não é possível excluir cota com cadastros associados",
    };
  }

  const filtered = quotas.filter((q) => q.id !== id);
  localStorage.setItem(KEYS.QUOTAS, JSON.stringify(filtered));
  return { success: true };
}
