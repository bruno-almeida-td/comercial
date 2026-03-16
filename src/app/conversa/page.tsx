"use client";

import { useEffect, useRef, useState } from "react";
import { getQuotas, addParticipant, getAvailableVouchers } from "@/lib/storage";
import { Quota } from "@/types";
import { Send, Bot, User, CheckCircle, RotateCcw, ClipboardPaste, MessageSquare } from "lucide-react";

// --- Paste mode helpers ---
interface Parsed {
  nome: string; empresa: string; email: string; whatsapp: string; cpf: string; cota: string;
}

function parseText(text: string): Parsed {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  const cpfMatch = text.match(/\d{3}[\s.]?\d{3}[\s.]?\d{3}[\s.-]?\d{2}/);
  const phoneMatch = text.match(/\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}/);
  const cpf = cpfMatch
    ? cpfMatch[0].replace(/\D/g, "").replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : "";
  const rawPhone = phoneMatch ? phoneMatch[0].replace(/\D/g, "").slice(0, 11) : "";
  let whatsapp = "";
  if (rawPhone.length >= 10) {
    whatsapp = rawPhone.length === 11
      ? `(${rawPhone.slice(0,2)}) ${rawPhone.slice(2,7)}-${rawPhone.slice(7)}`
      : `(${rawPhone.slice(0,2)}) ${rawPhone.slice(2,6)}-${rawPhone.slice(6)}`;
  }
  const lines = text.split("\n").map((l) => l.replace(/^(nome|name)[\s:]+/i, "").trim()).filter((l) => l.length > 2);
  const dataPatterns = [/@/, /cpf/i, /celular/i, /email/i, /fone/i, /whatsapp/i, /empresa/i, /\d{3}\.\d{3}/];
  const nameLine = lines.find((l) => !dataPatterns.some((p) => p.test(l))) || "";
  const empresaMatch = text.match(/empresa[\s:]+(.+)/i);
  const empresa = empresaMatch ? empresaMatch[1].trim() : "";
  return { nome: nameLine, empresa, email: emailMatch?.[0] || "", whatsapp, cpf, cota: "" };
}

interface Message {
  from: "bot" | "user";
  text: string;
}

type StepKey = "nome" | "empresa" | "email" | "whatsapp" | "cpf" | "cota" | "confirm";

interface FormState {
  nome: string;
  empresa: string;
  email: string;
  whatsapp: string;
  cpf: string;
  cota: string;
}

const STEPS: StepKey[] = ["nome", "empresa", "email", "whatsapp", "cpf", "cota", "confirm"];

const stepQuestion: Record<StepKey, string> = {
  nome: "Qual o **nome completo** do participante?",
  empresa: "Qual a **empresa**? (deixe em branco para pular)",
  email: "Qual o **e-mail**? (deixe em branco para pular)",
  whatsapp: "Qual o **WhatsApp**? (deixe em branco para pular)",
  cpf: "Qual o **CPF**? (deixe em branco para pular)",
  cota: "Deseja vincular a alguma **cota**? (deixe em branco para nenhuma)",
  confirm: "",
};

function formatBold(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

const formatWhatsApp = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export default function ConversaPage() {
  const [mode, setMode] = useState<"chat" | "paste">("chat");

  // --- Paste mode state ---
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [pasteMsg, setPasteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- Chat mode state ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<StepKey>("nome");
  const [form, setForm] = useState<FormState>({ nome: "", empresa: "", email: "", whatsapp: "", cpf: "", cota: "" });
  const [input, setInput] = useState("");
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [done, setDone] = useState(false);
  const [voucher, setVoucher] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const pushBot = (text: string) => setMessages((m) => [...m, { from: "bot", text }]);
  const pushUser = (text: string) => setMessages((m) => [...m, { from: "bot" === "bot" ? "user" : "bot", text }]);

  useEffect(() => {
    const q = getQuotas();
    setQuotas(q);
    pushBot("Olá! Vou ajudar a registrar um novo participante. 📋\n\nQual o **nome completo** do participante?");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const availableQuotaNames = quotas.filter((q) => q.usados < q.quantidade).map((q) => q.parceiro);

  const handleSend = () => {
    const val = input.trim();
    setInput("");

    if (done) return;

    // Add user message
    setMessages((m) => [...m, { from: "user", text: val || "(em branco)" }]);

    if (step === "confirm") {
      if (val.toLowerCase() === "sim" || val === "s" || val === "1") {
        try {
          const result = addParticipant({
            nome: form.nome,
            empresa: form.empresa,
            email: form.email,
            whatsapp: form.whatsapp,
            cpf: form.cpf || undefined,
            cota: form.cota || null,
          });
          setVoucher(result.voucher);
          setDone(true);
          pushBot(`✅ Cadastro realizado com sucesso!\n\nO voucher atribuído foi:\n\n🎫 **${result.voucher}**\n\nEnviado para: ${form.nome}`);
        } catch (e) {
          pushBot(`❌ Erro: ${e instanceof Error ? e.message : "Falha ao cadastrar."}`);
        }
      } else {
        pushBot("Ok, cadastro cancelado. Clique em **Recomeçar** para começar de novo.");
        setDone(true);
      }
      return;
    }

    let nextStep = STEPS[STEPS.indexOf(step) + 1] as StepKey;
    const newForm = { ...form };

    if (step === "nome") {
      if (!val) { pushBot("O nome é obrigatório. Qual o **nome completo**?"); return; }
      newForm.nome = val;
    } else if (step === "empresa") {
      newForm.empresa = val;
    } else if (step === "email") {
      newForm.email = val;
    } else if (step === "whatsapp") {
      newForm.whatsapp = val ? formatWhatsApp(val) : "";
    } else if (step === "cpf") {
      newForm.cpf = val;
    } else if (step === "cota") {
      if (val && !availableQuotaNames.includes(val)) {
        pushBot(`Cota **${val}** não encontrada. Cotas disponíveis: ${availableQuotaNames.join(", ") || "nenhuma"}.\n\nQual a **cota**? (ou deixe em branco)`);
        return;
      }
      newForm.cota = val;
      nextStep = "confirm";
    }

    setForm(newForm);

    if (nextStep === "confirm") {
      const available = getAvailableVouchers().length;
      const resumo = [
        `📋 **Resumo do cadastro:**`,
        `• Nome: ${newForm.nome}`,
        newForm.empresa ? `• Empresa: ${newForm.empresa}` : null,
        newForm.email ? `• E-mail: ${newForm.email}` : null,
        newForm.whatsapp ? `• WhatsApp: ${newForm.whatsapp}` : null,
        newForm.cpf ? `• CPF: ${newForm.cpf}` : null,
        newForm.cota ? `• Cota: ${newForm.cota}` : `• Cota: nenhuma`,
        ``,
        `Vouchers disponíveis: **${available}**`,
        ``,
        `Confirma o cadastro? Digite **sim** para confirmar ou **não** para cancelar.`,
      ].filter(Boolean).join("\n");
      pushBot(resumo);
      setStep("confirm");
    } else {
      pushBot(stepQuestion[nextStep]);
      setStep(nextStep);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setStep("nome");
    setForm({ nome: "", empresa: "", email: "", whatsapp: "", cpf: "", cota: "" });
    setInput("");
    setDone(false);
    setVoucher("");
    const q = getQuotas();
    setQuotas(q);
    setTimeout(() => {
      pushBot("Olá! Vou ajudar a registrar um novo participante. 📋\n\nQual o **nome completo** do participante?");
    }, 50);
  };

  // --- Paste mode handlers ---
  const handleParse = () => { if (raw.trim()) { setParsed(parseText(raw)); setPasteMsg(null); } };
  const handlePasteConfirm = () => {
    if (!parsed) return;
    try {
      const result = addParticipant({ nome: parsed.nome, empresa: parsed.empresa, email: parsed.email, whatsapp: parsed.whatsapp, cpf: parsed.cpf || undefined, cota: parsed.cota || null });
      setPasteMsg({ type: "success", text: `Cadastrado! Voucher atribuído: ${result.voucher}` });
      setRaw(""); setParsed(null);
    } catch (e) {
      setPasteMsg({ type: "error", text: e instanceof Error ? e.message : "Erro ao cadastrar" });
    }
  };

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastro Conversacional</h1>
          <p className="text-gray-500 mt-1 text-sm">Registre participantes de forma rápida</p>
        </div>
        {mode === "chat" && (
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
            <RotateCcw size={16} /> Recomeçar
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setMode("chat")} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "chat" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <MessageSquare size={15} /> Perguntas
        </button>
        <button onClick={() => { setMode("paste"); setPasteMsg(null); }} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === "paste" ? "bg-white text-primary-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
          <ClipboardPaste size={15} /> Colar tudo
        </button>
      </div>

      {/* Paste mode */}
      {mode === "paste" && (
        <div className="space-y-4">
          {pasteMsg && (
            <div className={`p-4 rounded-lg flex items-center gap-3 ${pasteMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {pasteMsg.type === "success" ? <CheckCircle size={20} /> : <span>⚠️</span>}
              {pasteMsg.text}
            </div>
          )}
          <div className="card space-y-4">
            <label className="label-field flex items-center gap-2"><ClipboardPaste size={15} /> Cole os dados aqui</label>
            <textarea value={raw} onChange={(e) => { setRaw(e.target.value); setParsed(null); setPasteMsg(null); }} rows={6} className="input-field resize-none font-mono text-sm"
              placeholder={"Alberto dos Santos Barbosa\nCPF: 224.267.768-38\ne-mail: asbarbosa@sompo.com.br\nCelular: (11) 99544-9407\nEmpresa: Sompo"} />
            <button onClick={handleParse} disabled={!raw.trim()} className="btn-primary flex items-center gap-2">
              <ClipboardPaste size={16} /> Interpretar dados
            </button>
          </div>

          {parsed && (
            <div className="card space-y-4">
              <p className="font-semibold text-gray-800">Confirme os dados extraídos</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["nome","empresa","email","whatsapp","cpf"] as const).map((f) => (
                  <div key={f}>
                    <label className="label-field capitalize">{f === "whatsapp" ? "WhatsApp" : f}</label>
                    <input type="text" value={parsed[f]} onChange={(e) => setParsed((p) => p ? { ...p, [f]: e.target.value } : p)} className="input-field" />
                  </div>
                ))}
                <div>
                  <label className="label-field">Cota (opcional)</label>
                  <select value={parsed.cota} onChange={(e) => setParsed((p) => p ? { ...p, cota: e.target.value } : p)} className="input-field">
                    <option value="">Sem cota</option>
                    {availableQuotaNames.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={handlePasteConfirm} className="btn-primary flex items-center gap-2">
                  <CheckCircle size={16} /> Confirmar e Cadastrar
                </button>
                <button onClick={() => { setParsed(null); setRaw(""); setPasteMsg(null); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium">
                  <RotateCcw size={15} /> Limpar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat mode */}
      {mode === "chat" && (<>

      {/* Cotas disponíveis */}
      {availableQuotaNames.length > 0 && (
        <div className="mb-3 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
          Cotas disponíveis: {availableQuotaNames.map((n) => <span key={n} className="font-medium text-primary-700 mr-2">{n}</span>)}
        </div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.from === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.from === "bot" ? "bg-primary-100" : "bg-gray-200"}`}>
              {msg.from === "bot" ? <Bot size={16} className="text-primary-700" /> : <User size={16} className="text-gray-600" />}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.from === "bot"
                ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                : "bg-primary-600 text-white rounded-tr-sm"
            }`}
              dangerouslySetInnerHTML={{ __html: msg.from === "bot" ? formatBold(msg.text) : msg.text }}
            />
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!done ? (
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="input-field flex-1"
            placeholder="Digite sua resposta..."
            autoFocus
          />
          <button onClick={handleSend} className="btn-primary px-4 flex items-center gap-2">
            <Send size={16} />
            Enviar
          </button>
        </div>
      ) : (
        <div className="pt-3 border-t border-gray-200 flex items-center gap-3">
          {voucher && (
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-green-800 font-medium">Voucher gerado: <span className="font-mono font-bold">{voucher}</span></span>
            </div>
          )}
          <button onClick={handleReset} className="btn-primary flex items-center gap-2">
            <RotateCcw size={16} />
            Novo cadastro
          </button>
        </div>
      )}
      </>)}
    </div>
  );
}
