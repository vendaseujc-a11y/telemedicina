import { NextRequest, NextResponse } from "next/server";
import { 
  sanitizeInput, 
  validateEmail, 
  validateInputTypes,
  detectSQLInjection,
  detectXSS,
  maskSensitiveData,
  logSecurityEvent,
  validateSession,
  generateCSRFToken
} from "@/lib/security";

export interface APIValidationResult {
  valid: boolean;
  sanitized: Record<string, unknown>;
  errors: string[];
}

export function validateAPIRequest(
  data: Record<string, unknown>,
  schema: Record<string, string>
): APIValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      if (schema[key] && !schema[key].startsWith("optional_")) {
        errors.push(`Campo ${key} é obrigatório`);
      }
      continue;
    }
    
    if (typeof value === "string") {
      const sanitizedValue = sanitizeInput(value);
      
      if (detectSQLInjection(sanitizedValue)) {
        errors.push(`Tentativa de SQL Injection detectada no campo ${key}`);
        logSecurityEvent("sql_injection_attempt", { 
          details: `Field: ${key}`, 
          severity: "critical" 
        });
      }
      
      if (detectXSS(sanitizedValue)) {
        errors.push(`Tentativa de XSS detectada no campo ${key}`);
        logSecurityEvent("xss_attempt", { 
          details: `Field: ${key}`, 
          severity: "critical" 
        });
      }
      
      sanitized[key] = sanitizedValue;
    } else if (key.toLowerCase().includes("email") && typeof value === "string") {
      if (!validateEmail(value)) {
        errors.push(`Email inválido no campo ${key}`);
      }
      sanitized[key] = value.toLowerCase().trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  const typeValidation = validateInputTypes(sanitized, schema);
  errors.push(...typeValidation.errors);
  
  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}

export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Server", "secure");
  
  return response;
}

export function createSecureAPIHandler(
  handler: (req: NextRequest, params?: Record<string, string>) => Promise<NextResponse>,
  requireAuth = false
) {
  return async (req: NextRequest, params?: Record<string, string>) => {
    try {
      if (requireAuth) {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return withSecurityHeaders(
            NextResponse.json({ error: "Unauthorized" }, { status: 401 })
          );
        }
        
        const token = authHeader.substring(7);
        const sessionValidation = validateSession(token);
        
        if (!sessionValidation.valid) {
          logSecurityEvent("session_hijack_attempt", {
            details: sessionValidation.error,
            severity: "high"
          });
          
          return withSecurityHeaders(
            NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
          );
        }
      }
      
      const response = await handler(req, params);
      return withSecurityHeaders(response);
      
    } catch (error) {
      logSecurityEvent("suspicious_request", {
        details: `API Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        severity: "medium"
      });
      
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Erro interno do servidor" }, 
          { status: 500 }
        )
      );
    }
  };
}

export function getClientInfo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.ip || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  return { ip, userAgent };
}

export function sanitizeResponse<T>(data: T): T {
  if (typeof data === "object" && data !== null) {
    return maskSensitiveData(data as Record<string, unknown>) as T;
  }
  return data;
}

export function createCSRFToken(req: NextRequest): string {
  return generateCSRFToken();
}

export function verifyCSRF(req: NextRequest): boolean {
  const token = req.headers.get("x-csrf-token");
  const sessionToken = req.cookies.get("csrf-token")?.value;
  
  if (!token || !sessionToken) {
    return false;
  }
  
  return token === sessionToken;
}