import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hosvbcrkitzhkxgoymes.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'adm.telemedicinapro@gmail.com';

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = resendApiKey ? new Resend(resendApiKey) : null;

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('registration_codes')
      .insert({
        code,
        email: email.toLowerCase(),
        expires_at: expiresAt,
        used: false
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar código:', error);
      return NextResponse.json({ error: 'Erro ao salvar código' }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      message: 'Solicitação enviada! O código será enviado para seu email em breve.',
      code: code
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    instructions: 'Use POST to request a registration code',
    body: { email: 'seu email' }
  });
}