"use client";

import { useState } from "react";
import { FileSpreadsheet, Download, FileText } from "lucide-react";

export default function ExportarPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (type: "tax-summit" | "interno") => {
    setDownloading(type);
    try {
      const res = await fetch(`/api/export?type=${type}`);
      if (!res.ok) throw new Error("Erro ao exportar");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        type === "tax-summit"
          ? "tax-summit-2026-participantes.xlsx"
          : "relatorio-interno-tax-summit.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
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
          Exporte os dados dos participantes em planilha Excel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tax Summit Export */}
        <div className="card flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
            <FileSpreadsheet size={32} className="text-green-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Planilha Tax Summit</h2>
          <p className="text-sm text-gray-500 mb-6">
            Exporta apenas os campos necessários para o evento: nome, e-mail,
            cargo, WhatsApp, empresa, CPF, dados da credencial, necessidades
            especiais e atendimento específico.
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

        {/* Internal Report */}
        <div className="card flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <FileText size={32} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Relatório Interno</h2>
          <p className="text-sm text-gray-500 mb-6">
            Exporta todos os campos incluindo vendedor responsável, cota
            associada e data de cadastro. Ideal para controle interno e
            acompanhamento da equipe comercial.
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
