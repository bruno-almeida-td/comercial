import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { TOTAL_TICKETS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [{ count: cadastrados }, { data: quotas }] = await Promise.all([
      supabase.from("registrations").select("*", { count: "exact", head: true }),
      supabase.from("quotas").select("quantidade, usados"),
    ]);

    const reservados = (quotas || []).reduce(
      (acc, q) => acc + (q.quantidade - q.usados),
      0
    );

    const registered = cadastrados || 0;

    return NextResponse.json({
      total: TOTAL_TICKETS,
      reservados: Math.max(0, reservados),
      cadastrados: registered,
      livres: Math.max(0, TOTAL_TICKETS - registered - reservados),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}
