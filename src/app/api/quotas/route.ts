import { NextRequest, NextResponse } from "next/server";
import { getQuotas, addQuota, deleteQuota } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const quotas = await getQuotas();
    return NextResponse.json(quotas);
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
    const data = await request.json();

    if (!data.parceiro?.trim()) {
      return NextResponse.json(
        { error: "Nome do parceiro é obrigatório" },
        { status: 400 }
      );
    }

    if (!data.quantidade || data.quantidade < 1) {
      return NextResponse.json(
        { error: "Quantidade deve ser pelo menos 1" },
        { status: 400 }
      );
    }

    const quota = await addQuota(data.parceiro.trim(), data.quantidade);
    return NextResponse.json(quota, { status: 201 });
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

    const deleted = await deleteQuota(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Cota não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir cota";
    console.error("Delete quota error:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
