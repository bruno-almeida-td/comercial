import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
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
    const body = await request.json();

    const required = ["nome", "email", "cargo", "whatsapp", "empresa", "cpf", "vendedor"];
    for (const field of required) {
      if (!body[field]?.trim()) {
        return NextResponse.json(
          { error: `Campo obrigatório: ${field}` },
          { status: 400 }
        );
      }
    }

    const row = {
      nome: body.nome,
      email: body.email,
      cargo: body.cargo,
      whatsapp: body.whatsapp,
      empresa: body.empresa,
      cpf: body.cpf,
      nome_credencial: body.nome_credencial || body.nome,
      empresa_credencial: body.empresa_credencial || body.empresa,
      necessidades_especiais: body.necessidades_especiais || "Não",
      atendimento_especifico: body.atendimento_especifico || "Não",
      vendedor: body.vendedor,
      cota: body.cota || null,
    };

    const { data, error } = await supabase
      .from("registrations")
      .insert(row)
      .select()
      .single();

    if (error) throw error;

    // Increment quota usage if associated
    if (row.cota) {
      const { data: quota } = await supabase
        .from("quotas")
        .select("usados")
        .eq("parceiro", row.cota)
        .single();

      if (quota) {
        await supabase
          .from("quotas")
          .update({ usados: quota.usados + 1 })
          .eq("parceiro", row.cota);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Add participant error:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar participante" },
      { status: 500 }
    );
  }
}
