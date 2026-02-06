"use client";

import { useEffect, useState } from "react";
import { DashboardData } from "@/types";
import {
  Ticket,
  BookmarkCheck,
  UserCheck,
  CircleDot,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cards = data
    ? [
        {
          label: "Total de Ingressos",
          value: data.total,
          icon: Ticket,
          color: "bg-blue-50 text-blue-700",
          iconBg: "bg-blue-100",
        },
        {
          label: "Reservados (Cotas)",
          value: data.reservados,
          icon: BookmarkCheck,
          color: "bg-amber-50 text-amber-700",
          iconBg: "bg-amber-100",
        },
        {
          label: "Cadastrados",
          value: data.cadastrados,
          icon: UserCheck,
          color: "bg-green-50 text-green-700",
          iconBg: "bg-green-100",
        },
        {
          label: "Livres",
          value: data.livres,
          icon: CircleDot,
          color: "bg-purple-50 text-purple-700",
          iconBg: "bg-purple-100",
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Visão geral dos ingressos Tax Summit 2026
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="card">
                <div
                  className={`h-12 w-12 ${card.iconBg} rounded-lg flex items-center justify-center mb-4`}
                >
                  <Icon size={24} className={card.color.split(" ")[1]} />
                </div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}

      {data && (
        <div className="mt-8 card">
          <h2 className="text-lg font-semibold mb-4">Utilização</h2>
          <div className="w-full bg-gray-100 rounded-full h-6 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-green-500 transition-all duration-500"
                style={{
                  width: `${(data.cadastrados / data.total) * 100}%`,
                }}
                title={`Cadastrados: ${data.cadastrados}`}
              />
              <div
                className="bg-amber-400 transition-all duration-500"
                style={{
                  width: `${(data.reservados / data.total) * 100}%`,
                }}
                title={`Reservados: ${data.reservados}`}
              />
            </div>
          </div>
          <div className="flex gap-6 mt-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              Cadastrados ({data.cadastrados})
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-400 rounded-full" />
              Reservados ({data.reservados})
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-200 rounded-full" />
              Livres ({data.livres})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
