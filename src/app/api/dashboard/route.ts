import { NextResponse } from "next/server";
import { getParticipants, getQuotas } from "@/lib/sheets";
import { TOTAL_TICKETS } from "@/lib/constants";
import { DashboardData } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [participants, quotas] = await Promise.all([
      getParticipants(),
      getQuotas(),
    ]);

    const cadastrados = participants.length;
    const reservados = quotas.reduce(
      (acc, q) => acc + (q.quantidade - q.usados),
      0
    );
    const livres = TOTAL_TICKETS - cadastrados - reservados;

    const data: DashboardData = {
      total: TOTAL_TICKETS,
      reservados: Math.max(0, reservados),
      cadastrados,
      livres: Math.max(0, livres),
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}
