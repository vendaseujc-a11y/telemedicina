import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeInput, detectSQLInjection, detectXSS, logSecurityEvent, withSecurityHeaders } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let code = searchParams.get('code');

  if (!code) {
    return withSecurityHeaders(
      NextResponse.json({ error: 'Código não fornecido' }, { status: 400 })
    );
  }

  code = sanitizeInput(code.toUpperCase(), 20);

  if (code.length < 5 || code.length > 20) {
    return withSecurityHeaders(
      NextResponse.json({ error: 'Código inválido' }, { status: 400 })
    );
  }

  if (detectSQLInjection(code) || detectXSS(code)) {
    logSecurityEvent("suspicious_request", {
      details: "Possible injection attempt in verify-code",
      severity: "high"
    });
    return withSecurityHeaders(
      NextResponse.json({ error: 'Request blocked' }, { status: 400 })
    );
  }

  try {
    const { data: codeData, error: fetchError } = await supabase
      .from('registration_codes')
      .select('*')
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (fetchError || !codeData) {
      return withSecurityHeaders(
        NextResponse.json({ 
          error: 'Código inválido ou expirado',
          success: false 
        })
      );
    }

    return withSecurityHeaders(
      NextResponse.json({
        success: true,
        message: 'Código verificado com sucesso!',
        code: code
      })
    );
  } catch (error) {
    logSecurityEvent("suspicious_request", {
      details: `Verify-code API error: ${error instanceof Error ? error.message : "Unknown"}`,
      severity: "medium"
    });
    return withSecurityHeaders(
      NextResponse.json({ 
        error: 'Erro ao verificar código',
        success: false 
      }, { status: 500 })
    );
  }
}