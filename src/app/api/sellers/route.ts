import { NextResponse } from "next/server";
import { getParticipants } from "@/lib/sheets";
import { SellerRanking } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const participants = await getParticipants();

    const sellerMap = new Map<string, number>();
    for (const p of participants) {
      if (p.vendedor) {
        sellerMap.set(p.vendedor, (sellerMap.get(p.vendedor) || 0) + 1);
      }
    }

    const ranking: SellerRanking[] = Array.from(sellerMap.entries())
      .map(([vendedor, cadastros]) => ({ vendedor, cadastros }))
      .sort((a, b) => b.cadastros - a.cadastros);

    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Sellers ranking error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar ranking" },
      { status: 500 }
    );
  }
}
