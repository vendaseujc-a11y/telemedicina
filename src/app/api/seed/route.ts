import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hosvbcrkitzhkxgoymes.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhvc3ZiY3JraXR6aGt4Z295bWVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAxOTM4OSwiZXhwIjoyMDkzNTk1Mzg5fQ.0pKb0OyQ2PHNg0Wn9SRwKHFv8WIDpnxI1sitn2uyQ8w';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST() {
  const doctors = [
    { name: 'Dr. Carlos Santos', role: 'medico', specialty: 'cardiologia', bio: 'Cardiologista com 15 anos de experiência', crm: 'CRM-SP 123456' },
    { name: 'Dra. Ana Silva', role: 'medico', specialty: 'dermatologia', bio: 'Dermatologista especializada em doenças da pele', crm: 'CRM-SP 234567' },
    { name: 'Dr. Roberto Alves', role: 'medico', specialty: 'psicologia', bio: 'Psicólogo clínico com especialização em terapia online', crm: 'CRP-SP 45678' },
    { name: 'Dra. Fernanda Costa', role: 'medico', specialty: 'pediatria', bio: 'Pediatra com 10 anos de experiência', crm: 'CRM-SP 345678' },
    { name: 'Dr. Marcelo Oliveira', role: 'medico', specialty: 'clinico_geral', bio: 'Clínico Geral especializado em medicina familiar', crm: 'CRM-SP 567890' },
  ];

  const results = [];

  for (const doctor of doctors) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([doctor]);

    if (error) {
      results.push({ doctor: doctor.name, error: error.message });
    } else {
      results.push({ doctor: doctor.name, success: true });
    }
  }

  return NextResponse.json({ results });
}

export async function GET() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'medico');

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  return NextResponse.json({ doctors: data });
}