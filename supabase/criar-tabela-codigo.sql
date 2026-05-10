-- Tabela para códigos de registro de médicos
CREATE TABLE IF NOT EXISTS public.registration_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy para verificar código
CREATE POLICY "Anyone can verify code" ON registration_codes
  FOR SELECT USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_registration_codes_code ON registration_codes(code);
CREATE INDEX IF NOT EXISTS idx_registration_codes_email ON registration_codes(email);