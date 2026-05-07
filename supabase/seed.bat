@echo off
set SUPABASE_URL=https://hosvbcrkitzhkxgoymes.supabase.co
set API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc3ZiY3JraXR6aGt4Z295bWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAxOTM4OSwiZXhwIjoyMDkzNTk1Mzg5fQ.0pKb0OyQ2PHNg0Wn9SRwKHFv8WIDpnxI1sitn2uyQ8w

echo inserindo medicos...

curl -X POST "%SUPABASE_URL%/rest/v1/profiles" -H "apikey: %API_KEY%" -H "Authorization: Bearer %API_KEY%" -H "Content-Type: application/json" -d "{\"id\": \"a0eebc99-9c0b-5ff0-8a0a-11aa22bb33cc\", \"name\": \"Dr. Carlos Santos\", \"role\": \"medico\", \"specialty\": \"cardiologia\", \"bio\": \"Cardiologista\", \"crm\": \"CRM-SP 123456\"}"

echo.
echo Medico 1 inserido!

curl -X POST "%SUPABASE_URL%/rest/v1/profiles" -H "apikey: %API_KEY%" -H "Authorization: Bearer %API_KEY%" -H "Content-Type: application/json" -d "{\"id\": \"b0eebc99-9c0b-5ff0-8a0a-22bb33cc44dd\", \"name\": \"Dra. Ana Silva\", \"role\": \"medico\", \"specialty\": \"dermatologia\", \"bio\": \"Dermatologista\", \"crm\": \"CRM-SP 234567\"}"

echo.
echo Medico 2 inserido!

curl -X POST "%SUPABASE_URL%/rest/v1/profiles" -H "apikey: %API_KEY%" -H "Authorization: Bearer %API_KEY%" -H "Content-Type: application/json" -d "{\"id\": \"c0eebc99-9c0b-5ff0-8a0a-33cc44ddeeff\", \"name\": \"Dr. Roberto Alves\", \"role\": \"medico\", \"specialty\": \"psicologia\", \"bio\": \"Psicologo\", \"crm\": \"CRP-SP 45678\"}"

echo.
echo Medico 3 inserido!

curl -X POST "%SUPABASE_URL%/rest/v1/profiles" -H "apikey: %API_KEY%" -H "Authorization: Bearer %API_KEY%" -H "Content-Type: application/json" -d "{\"id\": \"d0eebc99-9c0b-5ff0-8a0a-44ddeeffaabb\", \"name\": \"Dra. Fernanda Costa\", \"role\": \"medico\", \"specialty\": \"pediatria\", \"bio\": \"Pediatra\", \"crm\": \"CRM-SP 345678\"}"

echo.
echo Medico 4 inserido!

curl -X POST "%SUPABASE_URL%/rest/v1/profiles" -H "apikey: %API_KEY%" -H "Authorization: Bearer %API_KEY%" -H "Content-Type: application/json" -d "{\"id\": \"e0eebc99-9c0b-5ff0-8a0a-55eedffbbaac\", \"name\": \"Dr. Marcelo Oliveira\", \"role\": \"medico\", \"specialty\": \"clinico_geral\", \"bio\": \"Clinico Geral\", \"crm\": \"CRM-SP 567890\"}"

echo.
echo Medico 5 inserido!

echo.
echo Verificando medicos...
curl -X GET "%SUPABASE_URL%/rest/v1/profiles?role=eq.medico" -H "apikey: %API_KEY%" -H "Authorization: Bearer %API_KEY%"

echo.
pause