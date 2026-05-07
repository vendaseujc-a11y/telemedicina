-- TELEMEDICINA PRO - Apenas inserir médicos
--.Execute apenas este código

-- Inserir médicos (ignora se já existirem)
INSERT INTO profiles (name, role, specialty, bio, crm) VALUES 
('Dr. Carlos Santos', 'medico', 'cardiologia', 'Cardiologista com 15 anos de experiência', 'CRM-SP 123456'),
('Dra. Ana Silva', 'medico', 'dermatologia', 'Dermatologista especializada', 'CRM-SP 234567'),
('Dr. Roberto Alves', 'medico', 'psicologia', 'Psicólogo clínico', 'CRP-SP 45678'),
('Dra. Fernanda Costa', 'medico', 'pediatria', 'Pediatra experiente', 'CRM-SP 345678'),
('Dr. Marcelo Oliveira', 'medico', 'clinico_geral', 'Clínico Geral', 'CRM-SP 567890')
ON CONFLICT DO NOTHING;

-- Ver médicos cadastrados
SELECT name, specialty FROM profiles WHERE role = 'medico';