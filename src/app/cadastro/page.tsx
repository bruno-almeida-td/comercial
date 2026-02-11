"use client";

import { useEffect, useState, FormEvent } from "react";
import { Quota } from "@/types";
import { getQuotas, addParticipant } from "@/lib/storage";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";

interface FormData {
  nome: string;
  email: string;
  cargo: string;
  whatsapp: string;
  empresa: string;
  cpf: string;
  nome_credencial: string;
  empresa_credencial: string;
  necessidades_especiais: string;
  atendimento_especifico: string;
  voucher: string;
  vendedor: string;
  cota: string;
}

const emptyForm: FormData = {
  nome: "",
  email: "",
  cargo: "",
  whatsapp: "",
  empresa: "",
  cpf: "",
  nome_credencial: "",
  empresa_credencial: "",
  necessidades_especiais: "Não",
  atendimento_especifico: "Não",
  voucher: "",
  vendedor: "",
  cota: "",
};

export default function CadastroPage() {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadQuotas = () => {
    setQuotas(getQuotas());
  };

  useEffect(() => {
    loadQuotas();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "nome" && !form.nome_credencial) {
      setForm((prev) => ({ ...prev, [name]: value, nome_credencial: value }));
    }
    if (name === "empresa" && !form.empresa_credencial) {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        empresa_credencial: value,
      }));
    }
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
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
      addParticipant({
        nome: form.nome,
        email: form.email,
        cargo: form.cargo,
        whatsapp: form.whatsapp,
        empresa: form.empresa,
        cpf: form.cpf,
        nome_credencial: form.nome_credencial || form.nome,
        empresa_credencial: form.empresa_credencial || form.empresa,
        necessidades_especiais: form.necessidades_especiais,
        atendimento_especifico: form.atendimento_especifico,
        voucher: form.voucher,
        vendedor: form.vendedor,
        cota: form.cota || null,
      });
      setMessage({ type: "success", text: "Participante cadastrado com sucesso!" });
      setForm(emptyForm);
      loadQuotas();
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

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Novo Cadastro</h1>
        <p className="text-gray-500 mt-1">
          Cadastre um novo participante para o Tax Summit 2026
        </p>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Nome *</label>
            <input type="text" name="nome" value={form.nome} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">E-mail *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">Cargo *</label>
            <input type="text" name="cargo" value={form.cargo} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">WhatsApp *</label>
            <input type="text" name="whatsapp" value={form.whatsapp} onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: formatWhatsApp(e.target.value) }))} className="input-field" placeholder="(11) 99999-9999" required />
          </div>
          <div>
            <label className="label-field">Empresa *</label>
            <input type="text" name="empresa" value={form.empresa} onChange={handleChange} className="input-field" required />
          </div>
          <div>
            <label className="label-field">CPF *</label>
            <input type="text" name="cpf" value={form.cpf} onChange={(e) => setForm((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))} className="input-field" placeholder="000.000.000-00" required />
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Nome Credencial</label>
            <input type="text" name="nome_credencial" value={form.nome_credencial} onChange={handleChange} className="input-field" placeholder="Igual ao nome se vazio" />
          </div>
          <div>
            <label className="label-field">Empresa Credencial</label>
            <input type="text" name="empresa_credencial" value={form.empresa_credencial} onChange={handleChange} className="input-field" placeholder="Igual à empresa se vazio" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Necessidades Especiais?</label>
            <select name="necessidades_especiais" value={form.necessidades_especiais} onChange={handleChange} className="input-field">
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </select>
          </div>
          <div>
            <label className="label-field">Atendimento Específico?</label>
            <select name="atendimento_especifico" value={form.atendimento_especifico} onChange={handleChange} className="input-field">
              <option value="Não">Não</option>
              <option value="Sim">Sim</option>
            </select>
          </div>
        </div>

        <hr className="border-gray-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label-field">Código do Voucher *</label>
            <input type="text" name="voucher" value={form.voucher} onChange={handleChange} className="input-field" placeholder="Ex: VCH-2026-001" required />
          </div>
          <div>
            <label className="label-field">Vendedor Responsável *</label>
            <input type="text" name="vendedor" value={form.vendedor} onChange={handleChange} className="input-field" placeholder="Nome do vendedor" required />
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
        </div>

        <div className="pt-4">
          <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
            <UserPlus size={18} />
            {submitting ? "Cadastrando..." : "Cadastrar Participante"}
          </button>
        </div>
      </form>
    </div>
  );
}
