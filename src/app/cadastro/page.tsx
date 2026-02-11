"use client";

import { useEffect, useState, FormEvent } from "react";
import { Quota } from "@/types";
import { getQuotas, addParticipant, getAvailableVouchers } from "@/lib/storage";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";

interface FormData {
  nome: string;
  empresa: string;
  email: string;
  whatsapp: string;
  cota: string;
}

const emptyForm: FormData = {
  nome: "",
  empresa: "",
  email: "",
  whatsapp: "",
  cota: "",
};

export default function CadastroPage() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = () => {
    setQuotas(getQuotas());
    setAvailableCount(getAvailableVouchers().length);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const result = addParticipant({
        nome: form.nome,
        empresa: form.empresa,
        email: form.email,
        whatsapp: form.whatsapp,
        cota: form.cota || null,
      });
      setMessage({
        type: "success",
        text: `Cadastrado com sucesso! Voucher atribuído: ${result.voucher}`,
      });
      setForm(emptyForm);
      loadData();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro ao cadastrar",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableQuotas = quotas.filter((q) => q.usados < q.quantidade);
  const noVouchers = availableCount === 0;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Cadastro</h1>
        <p className="text-gray-500 mt-1">
          Registre a entrega de um voucher para o Tax Summit 2026
        </p>
      </div>

      {noVouchers && !message && (
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3 bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle size={20} />
          Nenhum voucher disponível. Importe vouchers na página de Vouchers.
        </div>
      )}

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {!noVouchers && (
          <div className="text-sm text-gray-500 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
            {availableCount} voucher(s) disponível(is) para atribuição
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Nome *</label>
            <input type="text" name="nome" value={form.nome} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Empresa *</label>
            <input type="text" name="empresa" value={form.empresa} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">E-mail *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">WhatsApp *</label>
            <input type="text" name="whatsapp" value={form.whatsapp} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: formatWhatsApp(e.target.value) }))} className="input-field" placeholder="(11) 99999-9999" required />
          </div>
        </div>

        <div>
          <label className="label-field">Cota (opcional)</label>
          <select name="cota" value={form.cota} onChange={handleChange} className="input-field">
            <option value="">Sem cota</option>
            {availableQuotas.map((q) => (
              <option key={q.id} value={q.parceiro}>
                {q.parceiro} ({q.quantidade - q.usados} restantes)
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={submitting || noVouchers} className="btn-primary flex items-center gap-2">
            <UserPlus size={18} />
            {submitting ? "Cadastrando..." : "Cadastrar e Atribuir Voucher"}
          </button>
        </div>
      </form>
    </div>
  );
}
