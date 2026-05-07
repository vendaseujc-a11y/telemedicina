@echo off
setlocal enabledelayedexpansion

set "SUPABASE_URL=https://hosvbcrkitzhkxgoymes.supabase.co"
set "API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc3ZiY3JraXR6aGt4Z295bWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAxOTM4OSwiZXhwIjoyMDkzNTk1Mzg5fQ.0pKb0OyQ2PHNg0Wn9SRwKHFv8WIDpnxI1sitn2uyQ8w"

echo ==== Inserindo medicos no Supabase ====

echo.
echo [1] Dr. Carlos Santos - Cardiologia
curl -X POST "!SUPABASE_URL!/rest/v1/profiles" -H "apikey: !API_KEY!" -H "Authorization: Bearer !API_KEY!" -H "Content-Type: application/json" -d "{\"id\": \"11111111-1111-1111-1111-111111111111\", \"name\": \"Dr. Carlos Santos\", \"role\": \"medico\", \"specialty\": \"cardiologia\", \"bio\": \"Cardiologista com 15 anos\", \"crm\": \"CRM-SP 123456\"}" 2>nul

echo [2] Dra. Ana Silva - Dermatologia
curl -X POST "!SUPABASE_URL!/rest/v1/profiles" -H "apikey: !API_KEY!" -H "Authorization: Bearer !API_KEY!" -H "Content-Type: application/json" -d "{\"id\": \"22222222-2222-2222-2222-222222222222\", \"name\": \"Dra. Ana Silva\", \"role\": \"medico\", \"specialty\": \"dermatologia\", \"bio\": \"Dermatologista\", \"crm\": \"CRM-SP 234567\"}" 2>nul

echo [3] Dr. Roberto Alves - Psicologia
curl -X POST "!SUPABASE_URL!/rest/v1/profiles" -H "apikey: !API_KEY!" -H "Authorization: Bearer !API_KEY!" -H "Content-Type: application/json" -d "{\"id\": \"33333333-3333-3333-3333-333333333333\", \"name\": \"Dr. Roberto Alves\", \"role\": \"medico\", \"specialty\": \"psicologia\", \"bio\": \"Psicologo clinico\", \"crm\": \"CRP-SP 45678\"}" 2>nul

echo [4] Dra. Fernanda Costa - Pediatria
curl -X POST "!SUPABASE_URL!/rest/v1/profiles" -H "apikey: !API_KEY!" -H "Authorization: Bearer !API_KEY!" -H "Content-Type: application/json" -d "{\"id\": \"44444444-4444-4444-4444-444444444444\", \"name\": \"Dra. Fernanda Costa\", \"role\": \"medico\", \"specialty\": \"pediatria\", \"bio\": \"Pediatra com 10 anos\", \"crm\": \"CRM-SP 345678\"}" 2>nul

echo [5] Dr. Marcelo Oliveira - Clinico Geral
curl -X POST "!SUPABASE_URL!/rest/v1/profiles" -H "apikey: !API_KEY!" -H "Authorization: Bearer !API_KEY!" -H "Content-Type: application/json" -d "{\"id\": \"55555555-5555-5555-5555-555555555555\", \"name\": \"Dr. Marcelo Oliveira\", \"role\": \"medico\", \"specialty\": \"clinico_geral\", \"bio\": \"Clinico Geral\", \"crm\": \"CRM-SP 567890\"}" 2>nul

echo.
echo ==== Verificando medicos ====
curl -X GET "!SUPABASE_URL!/rest/v1/profiles?role=eq.medico" -H "apikey: !API_KEY!" -H "Authorization: Bearer !API_KEY!"

echo.
echo.
pause