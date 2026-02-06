import { NextRequest, NextResponse } from "next/server";
import { getParticipants, addParticipant } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const participants = await getParticipants();
    return NextResponse.json(participants);
  } catch (error) {
    console.error("Get participants error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar participantes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    const required = ["nome", "email", "cargo", "whatsapp", "empresa", "cpf", "vendedor"];
    for (const field of required) {
      if (!data[field]?.trim()) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    const participant = await addParticipant({
      nome: data.nome,
      email: data.email,
      cargo: data.cargo,
      whatsapp: data.whatsapp,
      empresa: data.empresa,
      cpf: data.cpf,
      nomeCredencial: data.nomeCredencial || data.nome,
      empresaCredencial: data.empresaCredencial || data.empresa,
      necessidadesEspeciais: data.necessidadesEspeciais || "Não",
      atendimentoEspecifico: data.atendimentoEspecifico || "Não",
      vendedor: data.vendedor,
      cota: data.cota || "",
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error("Add participant error:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar participante" },
      { status: 500 }
    );
  }
}
