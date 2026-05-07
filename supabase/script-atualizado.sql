-- TELEMEDICINA PRO - Script Atualizado
-- Copie tudo e cole no SQL Editor do Supabase

-- 1. Se já existem tabelas,删除 e recriar (opcional - só execute se tiver erro)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.availability CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Criar tabelas
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar_url TEXT,
  specialty TEXT,
  bio TEXT,
  crm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID,
  day_of_week INTEGER,
  start_time TEXT,
  end_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID,
  patient_id UUID,
  scheduled_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pendente',
  video_room_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inserir médicos
INSERT INTO profiles (name, role, specialty, bio, crm) VALUES 
('Dr. Carlos Santos', 'medico', 'cardiologia', 'Cardiologista com 15 anos de experiência', 'CRM-SP 123456'),
('Dra. Ana Silva', 'medico', 'dermatologia', 'Dermatologista especializada em doenças da pele', 'CRM-SP 234567'),
('Dr. Roberto Alves', 'medico', 'psicologia', 'Psicólogo clínico com especialização em terapia online', 'CRP-SP 45678'),
('Dra. Fernanda Costa', 'medico', 'pediatria', 'Pediatra com 10 anos de experiência', 'CRM-SP 345678'),
('Dr. Marcelo Oliveira', 'medico', 'clinico_geral', 'Clínico Geral especializado em medicina familiar', 'CRM-SP 567890');

-- 4. Verificar
SELECT name, specialty, crm FROM profiles WHERE role = 'medico';