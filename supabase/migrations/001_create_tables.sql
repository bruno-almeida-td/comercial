-- Migration: Create tables for Tax Summit 2026 ticket management
-- Run this in Supabase SQL Editor (https://app.supabase.com > SQL Editor)

-- Quotas table (partner ticket allocations)
CREATE TABLE quotas (
  id TEXT PRIMARY KEY DEFAULT 'Q-' || extract(epoch from now())::bigint::text || '-' || floor(random() * 1000)::text,
  parceiro TEXT NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  usados INTEGER NOT NULL DEFAULT 0 CHECK (usados >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registrations table (participants)
CREATE TABLE registrations (
  id TEXT PRIMARY KEY DEFAULT 'P-' || extract(epoch from now())::bigint::text || '-' || floor(random() * 1000)::text,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cargo TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  empresa TEXT NOT NULL,
  cpf TEXT NOT NULL,
  nome_credencial TEXT NOT NULL,
  empresa_credencial TEXT NOT NULL,
  necessidades_especiais TEXT NOT NULL DEFAULT 'Não',
  atendimento_especifico TEXT NOT NULL DEFAULT 'Não',
  vendedor TEXT NOT NULL,
  cota TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_registrations_vendedor ON registrations (vendedor);
CREATE INDEX idx_registrations_cota ON registrations (cota);
CREATE INDEX idx_quotas_parceiro ON quotas (parceiro);

-- Enable Row Level Security (allow all via anon key for this internal tool)
ALTER TABLE quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on quotas" ON quotas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on registrations" ON registrations FOR ALL USING (true) WITH CHECK (true);
