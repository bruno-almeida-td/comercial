"use client";

import { useState } from "react";
import { getParticipants } from "@/lib/storage";
import { FileSpreadsheet, Download, FileText } from "lucide-react";
import * as XLSX from "xlsx";

export default function ExportarPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = (type: "tax-summit" | "interno") => {
    setDownloading(type);

    try {
      const participants = getParticipants();

      const rows =
        type === "tax-summit"
          ? participants.map((p) => ({
              Nome: p.nome,
              Empresa: p.empresa,
              "E-mail": p.email,
              WhatsApp: p.whatsapp,
              "Código do Voucher": p.voucher,
            }))
          : participants.map((p) => ({
              Nome: p.nome,
              Empresa: p.empresa,
              "E-mail": p.email,
              WhatsApp: p.whatsapp,
              "Código do Voucher": p.voucher,
              Cota: p.cota || "—",
              "Data Cadastro": new Date(p.created_at).toLocaleString("pt-BR"),
            }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Participantes");

      const filename =
        type === "tax-summit"
          ? "tax-summit-2026-vouchers.xlsx"
          : "relatorio-interno-vouchers.xlsx";

      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      alert("Erro ao exportar dados. Tente novamente.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Exportar Dados</h1>
        <p className="text-gray-500 mt-1">
          Exporte os dados dos vouchers entregues em planilha Excel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <FileSpreadsheet size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Planilha Tax Summit</h2>
          <p className="text-sm text-gray-500 mb-6">
            Exporta nome, empresa, e-mail, WhatsApp e código do voucher
            de cada participante.
          </p>
          <button
            onClick={() => handleExport("tax-summit")}
            disabled={downloading !== null}
            className="btn-primary flex items-center gap-2 mt-auto"
          >
            <Download size={18} />
            {downloading === "tax-summit" ? "Exportando..." : "Baixar Planilha"}
          </button>
        </div>

        <div className="card flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={32} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Relatório Interno</h2>
          <p className="text-sm text-gray-500 mb-6">
            Exporta todos os campos incluindo cota associada e data de
            cadastro. Ideal para controle interno.
          </p>
          <button
            onClick={() => handleExport("interno")}
            disabled={downloading !== null}
            className="btn-primary flex items-center gap-2 mt-auto"
          >
            <Download size={18} />
            {downloading === "interno" ? "Exportando..." : "Baixar Relatório"}
          </button>
        </div>
      </div>
    </div>
  );
}
