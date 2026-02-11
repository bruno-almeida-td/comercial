"use client";

import { useEffect, useState } from "react";
import {
  getVouchers,
  importVouchers,
  getParticipants,
  clearUnusedVouchers,
} from "@/lib/storage";
import { Participant } from "@/types";
import {
  Tags,
  Upload,
  CheckCircle,
  CircleDot,
  Package,
  Trash2,
  RefreshCw,
} from "lucide-react";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = () => {
    setVouchers(getVouchers());
    setParticipants(getParticipants());
  };

  useEffect(() => {
    loadData();
  }, []);

  const usedSet = new Set(participants.map((p) => p.voucher));
  const totalCount = vouchers.length;
  const usedCount = vouchers.filter((v) => usedSet.has(v)).length;
  const availableCount = totalCount - usedCount;

  const handleImport = () => {
    const codes = text.split(/[\n,;]+/);
    const count = importVouchers(codes);
    if (count > 0) {
      setMessage({ type: "success", text: `${count} voucher(s) importado(s) com sucesso!` });
      setText("");
      loadData();
    } else {
      setMessage({
        type: "error",
        text: "Nenhum voucher novo encontrado. Verifique se já foram importados.",
      });
    }
  };

  const handleClear = () => {
    if (!confirm("Tem certeza que deseja remover todos os vouchers não utilizados?")) return;
    const removed = clearUnusedVouchers();
    setMessage({ type: "success", text: `${removed} voucher(s) removido(s).` });
    loadData();
  };

  const getOwner = (code: string): string | null => {
    const p = participants.find((p) => p.voucher === code);
    return p ? p.nome : null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Vouchers</h1>
          <p className="text-gray-500 mt-1">Importe e acompanhe seus vouchers</p>
        </div>
        <button onClick={loadData} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <Package size={20} className="text-blue-600" />
          </div>
          <p className="text-sm text-gray-500">Total Importados</p>
          <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
        </div>
        <div className="card text-center">
          <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <p className="text-sm text-gray-500">Entregues</p>
          <p className="text-2xl font-bold text-green-600">{usedCount}</p>
        </div>
        <div className="card text-center">
          <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <CircleDot size={20} className="text-purple-600" />
          </div>
          <p className="text-sm text-gray-500">Disponíveis</p>
          <p className="text-2xl font-bold text-purple-600">{availableCount}</p>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Upload size={20} />
          Importar Vouchers
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Cole os códigos dos vouchers abaixo (um por linha). Duplicatas serão ignoradas automaticamente.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field h-40 font-mono text-sm"
          placeholder={"VCH-001\nVCH-002\nVCH-003\n..."}
        />
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleImport}
            disabled={!text.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Upload size={16} />
            Importar
          </button>
          {totalCount > 0 && availableCount > 0 && (
            <button
              onClick={handleClear}
              className="btn-danger flex items-center gap-2"
            >
              <Trash2 size={14} />
              Limpar não utilizados
            </button>
          )}
        </div>
        {message && (
          <p
            className={`mt-3 text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {totalCount > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Tags size={20} />
            Todos os Vouchers ({totalCount})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">#</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Código</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Atribuído a</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v, i) => {
                  const owner = getOwner(v);
                  return (
                    <tr key={v} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium">{v}</td>
                      <td className="py-3 px-4">
                        {owner ? (
                          <span className="inline-block bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            Entregue
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                            Disponível
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {owner || <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
