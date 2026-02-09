import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const { data: participants, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    let rows: Record<string, string>[];
    let filename: string;

    if (type === "tax-summit") {
      rows = (participants || []).map((p) => ({
        Nome: p.nome,
        "E-mail": p.email,
        Cargo: p.cargo,
        WhatsApp: p.whatsapp,
        Empresa: p.empresa,
        CPF: p.cpf,
        "Nome Credencial": p.nome_credencial,
        "Empresa Credencial": p.empresa_credencial,
        "Necessidades Especiais": p.necessidades_especiais,
        "Atendimento Específico": p.atendimento_especifico,
      }));
      filename = "tax-summit-2026-participantes.xlsx";
    } else if (type === "interno") {
      rows = (participants || []).map((p) => ({
        Nome: p.nome,
        "E-mail": p.email,
        Cargo: p.cargo,
        WhatsApp: p.whatsapp,
        Empresa: p.empresa,
        CPF: p.cpf,
        "Nome Credencial": p.nome_credencial,
        "Empresa Credencial": p.empresa_credencial,
        "Necessidades Especiais": p.necessidades_especiais,
        "Atendimento Específico": p.atendimento_especifico,
        Vendedor: p.vendedor,
        Cota: p.cota || "—",
        "Data Cadastro": new Date(p.created_at).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        }),
      }));
      filename = "relatorio-interno-tax-summit.xlsx";
    } else {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Erro ao exportar dados" },
      { status: 500 }
    );
  }
}
