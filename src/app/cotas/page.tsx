"use client";

import { useEffect, useState, FormEvent } from "react";
import { Quota } from "@/types";
import { getQuotas, addQuota, deleteQuota } from "@/lib/storage";
import { Ticket, Plus, Trash2, RefreshCw } from "lucide-react";

export default function CotasPage() {
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [parceiro, setParceiro] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [error, setError] = useState("");

  const loadQuotas = () => {
    setQuotas(getQuotas());
  };

  useEffect(() => {
    loadQuotas();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    addQuota(parceiro.trim(), parseInt(quantidade, 10));
    setParceiro("");
    setQuantidade("");
    loadQuotas();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta cota?")) return;
    setError("");
    const result = deleteQuota(id);
    if (!result.ok) {
      setError(result.error || "Erro ao excluir cota");
      return;
    }
    loadQuotas();
  };

  const totalReservado = quotas.reduce((acc, q) => acc + q.quantidade, 0);
  const totalUsado = quotas.reduce((acc, q) => acc + q.usados, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cotas de Parceiros</h1>
          <p className="text-gray-500 mt-1">Gerencie as cotas de ingressos por parceiro</p>
        </div>
        <button onClick={loadQuotas} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-sm text-gray-500">Total Reservado</p>
          <p className="text-2xl font-bold text-amber-600">{totalReservado}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Já Utilizado</p>
          <p className="text-2xl font-bold text-green-600">{totalUsado}</p>
        </div>
        <div className="card text-center">
          <p className="text-sm text-gray-500">Disponível nas Cotas</p>
          <p className="text-2xl font-bold text-blue-600">{totalReservado - totalUsado}</p>
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus size={20} />
          Nova Cota
        </h2>
        <form onSubmit={handleSubmit} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="label-field">Nome do Parceiro</label>
            <input type="text" value={parceiro} onChange={(e) => setParceiro(e.target.value)} className="input-field" placeholder="Ex: Empresa XYZ" required />
          </div>
          <div className="w-40">
            <label className="label-field">Quantidade</label>
            <input type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="input-field" min="1" placeholder="10" required />
          </div>
          <button type="submit" className="btn-primary whitespace-nowrap">
            Criar Cota
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Ticket size={20} />
          Cotas Ativas
        </h2>
        {quotas.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Nenhuma cota cadastrada</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Parceiro</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Quantidade</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Usados</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Disponível</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Progresso</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quotas.map((q) => {
                  const available = q.quantidade - q.usados;
                  const pct = q.quantidade > 0 ? Math.round((q.usados / q.quantidade) * 100) : 0;
                  return (
                    <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{q.parceiro}</td>
                      <td className="py-3 px-4 text-center">{q.quantidade}</td>
                      <td className="py-3 px-4 text-center">{q.usados}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${available === 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {available}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button onClick={() => handleDelete(q.id)} className="btn-danger inline-flex items-center gap-1" title="Excluir cota">
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
