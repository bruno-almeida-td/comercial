"use client";

import { useEffect, useState } from "react";
import { SellerRanking } from "@/types";
import { Trophy, Medal, RefreshCw } from "lucide-react";

export default function RankingPage() {
  const [ranking, setRanking] = useState<SellerRanking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRanking = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sellers");
      const data = await res.json();
      setRanking(data);
    } catch {
      console.error("Erro ao carregar ranking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-500";
      case 1:
        return "text-gray-400";
      case 2:
        return "text-amber-600";
      default:
        return "text-gray-300";
    }
  };

  const total = ranking.reduce((acc, r) => acc + r.cadastros, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Ranking de Vendedores
          </h1>
          <p className="text-gray-500 mt-1">
            Acompanhe o desempenho dos vendedores
          </p>
        </div>
        <button
          onClick={fetchRanking}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="card animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <div className="card text-center py-12">
          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400">Nenhum cadastro realizado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ranking.map((seller, index) => {
            const pct = total > 0 ? Math.round((seller.cadastros / total) * 100) : 0;
            return (
              <div
                key={seller.vendedor}
                className={`card flex items-center gap-4 ${
                  index < 3 ? "border-l-4" : ""
                } ${
                  index === 0
                    ? "border-l-yellow-400"
                    : index === 1
                      ? "border-l-gray-300"
                      : index === 2
                        ? "border-l-amber-500"
                        : ""
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12">
                  {index < 3 ? (
                    <Medal size={28} className={getMedalColor(index)} />
                  ) : (
                    <span className="text-lg font-bold text-gray-300">
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {seller.vendedor}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-700">
                    {seller.cadastros}
                  </p>
                  <p className="text-xs text-gray-500">cadastros</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
