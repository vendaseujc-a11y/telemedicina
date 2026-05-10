import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hosvbcrkitzhkxgoymes.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST() {
  if (!supabase) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const doctors = [
    { name: 'Dr. Jonatas Candido', role: 'medico', specialty: 'clinico_geral', bio: 'Médico Clínico Geral', crm: 'CRM-SP 123456' },
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
  if (!supabase) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'medico');

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  return NextResponse.json({ doctors: data });
}