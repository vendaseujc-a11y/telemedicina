-- Verificar se o paciente tem profile criado
SELECT id, name, role FROM profiles WHERE role = 'paciente';

-- Verificar se o médico tem profile criado  
SELECT id, name, role FROM profiles WHERE role = 'medico';

-- Verificar consultas existentes
SELECT * FROM appointments ORDER BY created_at DESC LIMIT 10;

-- Verificar estrutura da tabela
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments';

-- Desabilitar RLS temporariamente para teste (execute depois de testar)
-- ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;