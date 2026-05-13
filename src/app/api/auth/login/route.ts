import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { 
  checkLoginAttempts, 
  recordFailedLoginAttempt, 
  clearLoginAttempts,
  validateEmail,
  sanitizeInput,
  detectSQLInjection,
  detectXSS,
  logSecurityEvent,
  withSecurityHeaders
} from "@/lib/security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      logSecurityEvent("suspicious_request", {
        details: "Missing email or password in login attempt",
        severity: "medium"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
      );
    }
    
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    
    if (detectSQLInjection(sanitizedEmail) || detectSQLInjection(sanitizedPassword)) {
      logSecurityEvent("sql_injection_attempt", {
        details: "SQL injection attempt in login",
        severity: "critical"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: "Request blocked" }, { status: 400 })
      );
    }
    
    if (detectXSS(sanitizedEmail) || detectXSS(sanitizedPassword)) {
      logSecurityEvent("xss_attempt", {
        details: "XSS attempt in login",
        severity: "critical"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: "Request blocked" }, { status: 400 })
      );
    }
    
    if (!validateEmail(sanitizedEmail)) {
      logSecurityEvent("suspicious_request", {
        details: "Invalid email format in login attempt",
        severity: "low"
      });
      return withSecurityHeaders(
        NextResponse.json({ error: "Email inválido" }, { status: 400 })
      );
    }
    
    const attemptCheck = checkLoginAttempts(sanitizedEmail);
    
    if (!attemptCheck.allowed) {
      logSecurityEvent("login_blocked", {
        email: sanitizedEmail,
        details: "Account locked due to too many attempts",
        severity: "high"
      });
      return withSecurityHeaders(
        NextResponse.json(
          { 
            error: "Muitas tentativas de login. Tente novamente mais tarde.", 
            retryAfter: Math.ceil((attemptCheck.lockedUntil! - Date.now()) / 1000)
          },
          { status: 429 }
        )
      );
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password: sanitizedPassword,
    });
    
    if (error) {
      recordFailedLoginAttempt(sanitizedEmail);
      
      const newAttemptCheck = checkLoginAttempts(sanitizedEmail);
      
      logSecurityEvent("login_failed", {
        email: sanitizedEmail,
        details: `Failed login attempt, ${newAttemptCheck.remainingAttempts} remaining`,
        severity: "medium"
      });
      
      if (newAttemptCheck.remainingAttempts <= 2) {
        return withSecurityHeaders(
          NextResponse.json(
            { 
              error: error.message,
              attemptsRemaining: newAttemptCheck.remainingAttempts,
              warning: `Atenção: você tem ${newAttemptCheck.remainingAttempts} tentativas restantes`
            },
            { status: 401 }
          )
        );
      }
      
      return withSecurityHeaders(
        NextResponse.json({ error: error.message }, { status: 401 })
      );
    }
    
    clearLoginAttempts(sanitizedEmail);
    
    logSecurityEvent("login_success", {
      email: sanitizedEmail,
      details: "Successful login",
      severity: "low"
    });
    
    const responseData = {
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    };
    
    return withSecurityHeaders(
      NextResponse.json(responseData)
    );
    
  } catch (error) {
    logSecurityEvent("suspicious_request", {
      details: `Login API error: ${error instanceof Error ? error.message : "Unknown"}`,
      severity: "medium"
    });
    return withSecurityHeaders(
      NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  
  if (!email) {
    return withSecurityHeaders(
      NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    );
  }
  
  const sanitizedEmail = sanitizeInput(email);
  const attemptCheck = checkLoginAttempts(sanitizedEmail);
  
  return withSecurityHeaders(NextResponse.json(attemptCheck));
}