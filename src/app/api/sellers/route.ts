import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SellerRanking } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select("vendedor");

    if (error) throw error;

    const sellerMap = new Map<string, number>();
    for (const row of data || []) {
      if (row.vendedor) {
        sellerMap.set(row.vendedor, (sellerMap.get(row.vendedor) || 0) + 1);
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
