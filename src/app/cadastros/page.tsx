"use client";

import { useEffect, useState } from "react";
import { Participant } from "@/types";
import { Users, Search, RefreshCw } from "lucide-react";

export default function CadastrosPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/participants");
      const data = await res.json();
      setParticipants(data);
    } catch {
      console.error("Erro ao carregar cadastros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  const filtered = participants.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.empresa.toLowerCase().includes(term) ||
      p.vendedor.toLowerCase().includes(term) ||
      p.cpf.includes(term)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastros Realizados</h1>
          <p className="text-gray-500 mt-1">
            {participants.length} participantes cadastrados
          </p>
        </div>
        <button
          onClick={fetchParticipants}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, empresa, vendedor ou CPF..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400">
              {search
                ? "Nenhum resultado encontrado"
                : "Nenhum participante cadastrado"}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Nome
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  E-mail
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Empresa
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Cargo
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Vendedor
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Cota
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium">{p.nome}</td>
                  <td className="py-3 px-4 text-gray-600">{p.email}</td>
                  <td className="py-3 px-4">{p.empresa}</td>
                  <td className="py-3 px-4">{p.cargo}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block bg-primary-50 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
                      {p.vendedor}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {p.cota ? (
                      <span className="inline-block bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-medium">
                        {p.cota}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(p.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
