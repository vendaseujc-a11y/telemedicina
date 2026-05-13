import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  validateEmail, 
  sanitizeInput, 
  validatePassword,
  detectSQLInjection,
  detectXSS,
  logSecurityEvent,
  validateInputTypes,
  withSecurityHeaders
} from "@/lib/security";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

const inputSchema = {
  email: "email",
  password: "string",
  name: "string",
  role: "string",
  specialty: "optional_string",
  registrationCode: "optional_string",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateAPIInput(body);
    
    if (!validation.valid) {
      return withSecurityHeaders(
        NextResponse.json({ error: validation.errors.join(", ") }, { status: 400 })
      );
    }
    
    const email = String(validation.sanitized.email || "");
    const password = String(validation.sanitized.password || "");
    const name = String(validation.sanitized.name || "");
    const role = String(validation.sanitized.role || "paciente");
    const specialty = validation.sanitized.specialty ? String(validation.sanitized.specialty) : undefined;
    const registrationCode = validation.sanitized.registrationCode ? String(validation.sanitized.registrationCode) : undefined;
    
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
    
    const passwordValidation = validatePassword(password, firstName, lastName);
    
    if (!passwordValidation.valid) {
      return withSecurityHeaders(
        NextResponse.json({ error: passwordValidation.error }, { status: 400 })
      );
    }
    
    if (role === "medico" && registrationCode) {
      const codeRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/registration_codes?code=eq.${registrationCode}&used=eq.false&select=*`,
        {
          headers: {
            "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
        }
      );
      
      const codes = await codeRes.json();
      
      if (!codes || codes.length === 0) {
        return withSecurityHeaders(
          NextResponse.json({ error: "Código de registro inválido ou já utilizado" }, { status: 400 })
        );
      }
    }
    
    const { data, error: signUpError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          specialty: role === "medico" ? specialty : null,
        },
      },
    });
    
    if (signUpError) {
      logSecurityEvent("suspicious_request", {
        email,
        details: `Signup failed: ${signUpError.message}`,
        severity: "medium"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: signUpError.message }, { status: 400 })
      );
    }
    
    if (data.user) {
      await supabaseAdmin.from("profiles").insert({
        id: data.user.id,
        name,
        role,
        specialty: role === "medico" ? specialty : null,
      });
      
      if (role === "medico" && registrationCode) {
        await supabaseAdmin
          .from("registration_codes")
          .update({ used: true, used_by: data.user.id, used_at: new Date().toISOString() })
          .eq("code", registrationCode);
      }
    }
    
    logSecurityEvent("login_success", {
      email,
      details: "New user registered successfully",
      severity: "low"
    });
    
    return withSecurityHeaders(
      NextResponse.json({ success: true, message: "Cadastro realizado com sucesso" })
    );
    
  } catch (error) {
    logSecurityEvent("suspicious_request", {
      details: `Register API error: ${error instanceof Error ? error.message : "Unknown"}`,
      severity: "medium"
    });
    return withSecurityHeaders(
      NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    );
  }
}

function validateAPIInput(data: Record<string, unknown>) {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    if (typeof value === "string") {
      let processed = sanitizeInput(value, key === "password" ? 100 : 255);
      
      if (detectSQLInjection(processed)) {
        errors.push(`Tentativa de SQL Injection detectada`);
      }
      
      if (detectXSS(processed)) {
        errors.push(`Tentativa de XSS detectada`);
      }
      
      sanitized[key] = processed;
    } else {
      sanitized[key] = value;
    }
  }
  
  const requiredFields = ["email", "password", "name", "role"];
  for (const field of requiredFields) {
    if (!sanitized[field]) {
      errors.push(`Campo ${field} é obrigatório`);
    }
  }
  
  if (sanitized.email && !validateEmail(sanitized.email as string)) {
    errors.push("Email inválido");
  }
  
  const validRoles = ["paciente", "medico"];
  if (sanitized.role && !validRoles.includes(sanitized.role as string)) {
    errors.push("Role inválido");
  }
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}