-- ============================================
-- TELEMEDICINA PRO - SQL PARA SUPABASE
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Criar tabela de disponibilidade do médico por data
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date)
);

-- PASSO 2: Criar índice para doctor_id
CREATE INDEX idx_doctor_availability_doctor ON doctor_availability(doctor_id);

-- PASSO 3: Criar índice para date
CREATE INDEX idx_doctor_availability_date ON doctor_availability(date);

-- PASSO 4: Policy para qualquer pessoa ver disponibilidade
CREATE POLICY "Anyone can view doctor availability" ON doctor_availability
  FOR SELECT USING (true);

-- PASSO 5: Policy para médicos gerenciarem próprios horários
CREATE POLICY "Doctors can manage own availability" ON doctor_availability
  FOR ALL USING (auth.uid() = doctor_id);

-- ============================================
-- FIM DO SCRIPT
-- ============================================