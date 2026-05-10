import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código não fornecido' }, { status: 400 });
  }

  const upperCode = code.toUpperCase();

  try {
    const { data: codeData, error: fetchError } = await supabase
      .from('registration_codes')
      .select('*')
      .eq('code', upperCode)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !codeData) {
      return NextResponse.json({ 
        error: 'Código inválido ou expirado',
        success: false 
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Código verificado com sucesso!',
      code: upperCode
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Erro ao verificar código',
      success: false 
    }, { status: 500 });
  }
}