"use client";

import { useEffect, useRef, useState } from "react";
import { getQuotas, addParticipant, getAvailableVouchers } from "@/lib/storage";
import { Quota } from "@/types";
import { Send, Bot, User, CheckCircle, RotateCcw } from "lucide-react";

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

  return (
    <div className="max-w-2xl flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cadastro Conversacional</h1>
          <p className="text-gray-500 mt-1 text-sm">Registre participantes respondendo às perguntas</p>
        </div>
        <button onClick={handleReset} className="btn-secondary flex items-center gap-2 text-sm">
          <RotateCcw size={16} />
          Recomeçar
        </button>
      </div>

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
    </div>
  );
}
