-- =====================================================
-- TELEMEDICINA PRO - SCRIPT COMPLETO DE CRIAÇÃO
-- Execute este código no SQL Editor do Supabase
-- =====================================================

-- =====================================================
-- 1. TABELAS
-- =====================================================

-- Profiles (usuários)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('medico', 'paciente')),
  avatar_url TEXT,
  specialty TEXT,
  bio TEXT,
  crm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- availability (disponibilidade do médico)
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- appointments (consultas)
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES profiles(id),
  patient_id UUID NOT NULL REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado')),
  video_room_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_availability_doctor ON availability(doctor_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- 3. TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated ON profiles;
CREATE TRIGGER profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS appointments_updated ON appointments;
CREATE TRIGGER appointments_updated BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 4. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. POLICIES (RLS)
-- =====================================================

-- Profiles: todos podem ver médicos
DROP POLICY IF EXISTS "Anyone can view doctors" ON profiles;
CREATE POLICY "Anyone can view doctors" ON profiles
  FOR SELECT USING (role = 'medico');

-- Profiles: usuários podem ver próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Profiles: usuários podem atualizar próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Profiles: usuários podem inserir próprio perfil (via trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Availability: médicos podem gerenciar própria disponibilidade
DROP POLICY IF EXISTS "Doctors can manage own availability" ON availability;
CREATE POLICY "Doctors can manage own availability" ON availability
  FOR ALL USING (auth.uid() = doctor_id);

-- Appointments: médicos e pacientes podem ver próprias consultas
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = doctor_id OR auth.uid() = patient_id);

-- Appointments: pacientes podem criar consultas
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;
CREATE POLICY "Patients can create appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = patient_id);

-- Appointments: médicos podem atualizar suas consultas
DROP POLICY IF EXISTS "Doctors can update own appointments" ON appointments;
CREATE POLICY "Doctors can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

-- =====================================================
-- 6. TRIGGER PARA CRIAR PROFILE AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'paciente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. DADOS DE EXEMPLO (SEED)
-- =====================================================

-- Nota: Estes IDs são de exemplo. Substitua pelos IDs reais dos médicos que você criar.

-- Inserir médicos de exemplo (sem referência a auth.users para demo)
DO $$
DECLARE
  doctor_id UUID;
BEGIN
  -- Criar médico 1
  INSERT INTO profiles (name, role, specialty, bio, crm)
  VALUES ('Dr. Carlos Santos', 'medico', 'cardiologia', 'Cardiologista com 15 anos de experiência em telemedicina', 'CRM-SP 123456')
  RETURNING id INTO doctor_id;

  -- Disponibilidade
  INSERT INTO availability (doctor_id, day_of_week, start_time, end_time)
  VALUES 
    (doctor_id, 1, '09:00', '12:00'),
    (doctor_id, 2, '09:00', '12:00'),
    (doctor_id, 3, '14:00', '18:00'),
    (doctor_id, 4, '09:00', '12:00'),
    (doctor_id, 5, '14:00', '18:00');

  -- Criar médico 2
  INSERT INTO profiles (name, role, specialty, bio, crm)
  VALUES ('Dra. Ana Paula Silva', 'medico', 'dermatologia', 'Dermatologista especializada em doenças da pele', 'CRM-SP 234567')
  RETURNING id INTO doctor_id;

  INSERT INTO availability (doctor_id, day_of_week, start_time, end_time)
  VALUES 
    (doctor_id, 1, '08:00', '12:00'),
    (doctor_id, 2, '08:00', '12:00'),
    (doctor_id, 3, '08:00', '12:00'),
    (doctor_id, 4, '13:00', '17:00'),
    (doctor_id, 5, '13:00', '17:00');

  -- Criar médico 3
  INSERT INTO profiles (name, role, specialty, bio, crm)
  VALUES ('Dr. Roberto Alves', 'medico', 'psicologia', 'Psicólogo clínico com especialização em terapia online', 'CRP-SP 45678')
  RETURNING id INTO doctor_id;

  INSERT INTO availability (doctor_id, day_of_week, start_time, end_time)
  VALUES 
    (doctor_id, 1, '10:00', '13:00'),
    (doctor_id, 2, '10:00', '13:00'),
    (doctor_id, 3, '14:00', '19:00'),
    (doctor_id, 4, '10:00', '13:00'),
    (doctor_id, 5, '14:00', '19:00');

  -- Criar médico 4
  INSERT INTO profiles (name, role, specialty, bio, crm)
  VALUES ('Dra. Fernanda Costa', 'medico', 'pediatria', 'Pediatra com 10 anos de experiência', 'CRM-SP 345678')
  RETURNING id INTO doctor_id;

  INSERT INTO availability (doctor_id, day_of_week, start_time, end_time)
  VALUES 
    (doctor_id, 1, '08:00', '12:00'),
    (doctor_id, 2, '08:00', '12:00'),
    (doctor_id, 3, '08:00', '12:00'),
    (doctor_id, 4, '08:00', '12:00'),
    (doctor_id, 5, '08:00', '12:00');

  -- Criar médico 5
  INSERT INTO profiles (name, role, specialty, bio, crm)
  VALUES ('Dr. Marcelo Oliveira', 'medico', 'clinico_geral', 'Clínico Geral especializado em medicina familiar', 'CRM-SP 567890')
  RETURNING id INTO doctor_id;

  INSERT INTO availability (doctor_id, day_of_week, start_time, end_time)
  VALUES 
    (doctor_id, 1, '07:00', '12:00'),
    (doctor_id, 2, '07:00', '12:00'),
    (doctor_id, 3, '07:00', '12:00'),
    (doctor_id, 4, '07:00', '12:00'),
    (doctor_id, 5, '07:00', '12:00'),
    (doctor_id, 6, '08:00', '12:00');

END $$;

-- =====================================================
-- VERIFICAR RESULTADO
-- =====================================================

SELECT 'Tabelas criadas:' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

SELECT 'Médicos inseridos:' AS status;
SELECT name, specialty, crm FROM profiles WHERE role = 'medico';

SELECT 'Disponibilidades inseridas:' AS status;
SELECT COUNT(*) AS total FROM availability;

SELECT 'Script executado com sucesso!' AS mensagem;