import { NextRequest, NextResponse } from "next/server";
import { getParticipants } from "@/lib/sheets";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const participants = await getParticipants();

    let data: Record<string, string>[];
    let filename: string;

    if (type === "tax-summit") {
      // Only event-required fields
      data = participants.map((p) => ({
        Nome: p.nome,
        "E-mail": p.email,
        Cargo: p.cargo,
        WhatsApp: p.whatsapp,
        Empresa: p.empresa,
        CPF: p.cpf,
        "Nome Credencial": p.nomeCredencial,
        "Empresa Credencial": p.empresaCredencial,
        "Necessidades Especiais": p.necessidadesEspeciais,
        "Atendimento Específico": p.atendimentoEspecifico,
      }));
      filename = "tax-summit-2026-participantes.xlsx";
    } else if (type === "interno") {
      // Full internal report
      data = participants.map((p) => ({
        Nome: p.nome,
        "E-mail": p.email,
        Cargo: p.cargo,
        WhatsApp: p.whatsapp,
        Empresa: p.empresa,
        CPF: p.cpf,
        "Nome Credencial": p.nomeCredencial,
        "Empresa Credencial": p.empresaCredencial,
        "Necessidades Especiais": p.necessidadesEspeciais,
        "Atendimento Específico": p.atendimentoEspecifico,
        Vendedor: p.vendedor,
        Cota: p.cota || "—",
        "Data Cadastro": p.dataCadastro,
      }));
      filename = "relatorio-interno-tax-summit.xlsx";
    } else {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
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
