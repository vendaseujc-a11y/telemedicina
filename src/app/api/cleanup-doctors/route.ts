import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hosvbcrkitzhkxgoymes.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST() {
  if (!supabase) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const { data: allDoctors, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'medico');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const results = [];

  for (const doctor of allDoctors || []) {
    if (doctor.name !== 'Dr. Jonatas Candido') {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', doctor.id);

      if (error) {
        results.push({ doctor: doctor.name, error: error.message });
      } else {
        results.push({ doctor: doctor.name, deleted: true });
      }
    } else {
      results.push({ doctor: doctor.name, kept: true });
    }
  }

  return NextResponse.json({ 
    message: 'Cleanup completed',
    results 
  });
}