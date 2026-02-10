import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("quotas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get quotas error:", error);
    return NextResponse.json(
      { error: "Erro ao carregar cotas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.parceiro?.trim()) {
      return NextResponse.json(
        { error: "Nome do parceiro é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.quantidade || body.quantidade < 1) {
      return NextResponse.json(
        { error: "Quantidade deve ser pelo menos 1" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("quotas")
      .insert({
        parceiro: body.parceiro.trim(),
        quantidade: body.quantidade,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Add quota error:", error);
    return NextResponse.json(
      { error: "Erro ao criar cota" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID da cota é obrigatório" },
        { status: 400 }
      );
    }

    const { data: quota } = await supabase
      .from("quotas")
      .select("parceiro")
      .eq("id", id)
      .single();

    if (!quota) {
      return NextResponse.json(
        { error: "Cota não encontrada" },
        { status: 404 }
      );
    }

    const { count } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("cota", quota.parceiro);

    if (count && count > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir cota com cadastros associados" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("quotas").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete quota error:", error);
    return NextResponse.json(
      { error: "Erro ao excluir cota" },
      { status: 500 }
    );
  }
}
