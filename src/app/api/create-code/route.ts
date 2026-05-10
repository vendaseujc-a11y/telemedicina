import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hosvbcrkitzhkxgoymes.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code') || 'MEDICO2026';

  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { data: existing } = await supabase
    .from('registration_codes')
    .select('code')
    .eq('code', code.toUpperCase())
    .single();

  if (existing) {
    return NextResponse.json({
      success: true,
      message: `Código ${code.toUpperCase()} já existe no banco!`,
      code: code.toUpperCase()
    });
  }

  const { data, error } = await supabase
    .from('registration_codes')
    .insert({
      code: code.toUpperCase(),
      email: 'admin@telemedicinapro.com',
      expires_at: expiresAt,
      used: false
    })
    .select()
    .single();

  if (error) {
    console.error('Erro detalhado:', JSON.stringify(error));
    return NextResponse.json({ 
      error: error.message,
      success: false 
    });
  }

  return NextResponse.json({
    success: true,
    message: `Código ${code.toUpperCase()} criado com sucesso!`,
    code: data?.code
  });
}