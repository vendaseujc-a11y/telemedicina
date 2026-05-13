import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sanitizeInput, validateEmail, detectSQLInjection, detectXSS, logSecurityEvent, withSecurityHeaders } from '@/lib/security';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hosvbcrkitzhkxgoymes.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'adm.telemedicinapro@gmail.com';

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const requestLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = requestLimits.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestLimits.set(identifier, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  
  if (record.count >= 5) {
    return false;
  }
  
  record.count++;
  return true;
}

function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const array = new Uint8Array(6);
  crypto.getRandomValues?.(array) || array.forEach((_, i) => array[i] = Math.floor(Math.random() * 256));
  for (let i = 0; i < 6; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email } = body;

    if (!email) {
      return withSecurityHeaders(
        NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
      );
    }

    email = sanitizeInput(email.toLowerCase().trim(), 255);

    if (!validateEmail(email)) {
      logSecurityEvent("suspicious_request", {
        details: `Invalid email format: ${email}`,
        severity: "low"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: 'Email inválido' }, { status: 400 })
      );
    }

    if (detectSQLInjection(email) || detectXSS(email)) {
      logSecurityEvent("suspicious_request", {
        details: "Possible injection in request-code",
        severity: "high"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: 'Request blocked' }, { status: 400 })
      );
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.ip || "unknown";
    if (!checkRateLimit(clientIp)) {
      logSecurityEvent("rate_limit_exceeded", {
        details: `Rate limit exceeded for IP: ${clientIp}`,
        severity: "medium"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: 'Muitas solicitações. Tente novamente mais tarde.' }, { status: 429 })
      );
    }

    const code = generateSecureCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('registration_codes')
      .insert({
        code,
        email,
        expires_at: expiresAt,
        used: false
      });

    if (error) {
      console.error('Erro ao salvar código:', error);
      return withSecurityHeaders(
        NextResponse.json({ error: 'Erro ao salvar código' }, { status: 500 })
      );
    }

    console.log(`========================================`);
    console.log(`NOVO CÓDIGO DE REGISTRO`);
    console.log(`Email: ${email}`);
    console.log(`Código: ${code}`);
    console.log(`========================================`);

    if (resend) {
      try {
        await resend.emails.send({
          from: 'TelemedicinaPro <noreply@telemedicinapro.com>',
          to: adminEmail,
          subject: `Solicitação de Código - ${email}`,
          html: `
            <h2>Nova Solicitação de Código de Registro</h2>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Código:</strong> ${code}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            <hr>
            <p>Envie este código ao usuário para que ele possa se cadastrar.</p>
          `
        });
        console.log('Email enviado para administrador');
      } catch (emailError) {
        console.error('Erro ao enviar email:', emailError);
      }
    }

    return withSecurityHeaders(
      NextResponse.json({
        success: true,
        message: 'Solicitação enviada! O código será enviado para seu email em breve.'
      })
    );

  } catch (error) {
    logSecurityEvent("suspicious_request", {
      details: `Request-code API error: ${error instanceof Error ? error.message : "Unknown"}`,
      severity: "medium"
    });
    return withSecurityHeaders(
      NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 })
    );
  }
}

export async function GET() {
  return withSecurityHeaders(
    NextResponse.json({
      instructions: 'Use POST to request a registration code',
      body: { email: 'seu email' }
    })
  );
}