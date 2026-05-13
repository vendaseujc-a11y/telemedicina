const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const ATTEMPTS_WINDOW_MINUTES = 15;

const loginAttempts = new Map<string, { count: number; lockedUntil: number; attempts: { time: number }[] }>();

export type SecurityEventType = 
  | "login_success" 
  | "login_failed" 
  | "login_blocked"
  | "password_validation_failed"
  | "sql_injection_attempt"
  | "xss_attempt"
  | "rate_limit_exceeded"
  | "suspicious_request"
  | "data_breach_attempt"
  | "session_hijack_attempt";

interface SecurityLogEntry {
  timestamp: string;
  eventType: SecurityEventType;
  ip?: string;
  userAgent?: string;
  email?: string;
  details?: string;
  severity: "low" | "medium" | "high" | "critical";
}

const securityLogs: SecurityLogEntry[] = [];

export function logSecurityEvent(
  eventType: SecurityEventType,
  details: {
    ip?: string;
    userAgent?: string;
    email?: string;
    details?: string;
    severity?: "low" | "medium" | "high" | "critical";
  }
): void {
  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: details.ip,
    userAgent: details.userAgent,
    email: details.email,
    details: details.details,
    severity: details.severity || "medium",
  };
  
  securityLogs.push(entry);
  
  if (securityLogs.length > 10000) {
    securityLogs.shift();
  }
  
  if (details.severity === "high" || details.severity === "critical") {
    console.error("[SECURITY ALERT]", entry);
  } else {
    console.log("[SECURITY]", entry);
  }
}

export function getSecurityLogs(filter?: { eventType?: SecurityEventType; severity?: string; since?: Date }): SecurityLogEntry[] {
  let filtered = [...securityLogs];
  
  if (filter?.eventType) {
    filtered = filtered.filter(l => l.eventType === filter.eventType);
  }
  if (filter?.severity) {
    filtered = filtered.filter(l => l.severity === filter.severity);
  }
  if (filter?.since) {
    filtered = filtered.filter(l => new Date(l.timestamp) > filter.since!);
  }
  
  return filtered.slice(-100);
}

export function checkLoginAttempts(email: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now();
  const record = loginAttempts.get(email.toLowerCase());
  
  if (!record) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }
  
  if (record.lockedUntil > now) {
    const lockedUntil = new Date(record.lockedUntil);
    logSecurityEvent("login_blocked", { 
      email, 
      details: `Locked until ${lockedUntil.toISOString()}`,
      severity: "medium" 
    });
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockedUntil: lockedUntil.getTime() 
    };
  }
  
  const recentAttempts = record.attempts.filter(a => now - a.time < ATTEMPTS_WINDOW_MINUTES * 60 * 1000);
  
  if (recentAttempts.length >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MINUTES * 60 * 1000;
    loginAttempts.set(email.toLowerCase(), record);
    const lockedUntil = new Date(record.lockedUntil);
    logSecurityEvent("login_blocked", { 
      email, 
      details: `Max attempts exceeded. Locked until ${lockedUntil.toISOString()}`,
      severity: "high" 
    });
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      lockedUntil: lockedUntil.getTime() 
    };
  }
  
  return { 
    allowed: true, 
    remainingAttempts: MAX_LOGIN_ATTEMPTS - recentAttempts.length 
  };
}

export function recordFailedLoginAttempt(email: string): void {
  const now = Date.now();
  const emailLower = email.toLowerCase();
  let record = loginAttempts.get(emailLower);
  
  if (!record) {
    record = { count: 0, lockedUntil: 0, attempts: [] };
  }
  
  record.attempts.push({ time: now });
  record.attempts = record.attempts.filter(a => now - a.time < ATTEMPTS_WINDOW_MINUTES * 60 * 1000);
  record.count = record.attempts.length;
  
  loginAttempts.set(emailLower, record);
  
  logSecurityEvent("login_failed", { 
    email, 
    details: `Attempt ${record.count}/${MAX_LOGIN_ATTEMPTS}`,
    severity: "low" 
  });
}

export function clearLoginAttempts(email: string): void {
  loginAttempts.delete(email.toLowerCase());
  logSecurityEvent("login_success", { email, details: "Login successful, attempts cleared", severity: "low" });
}

const COMMON_PASSWORDS = [
  "password", "123456", "senha123", "qwerty", "abc123", "password1",
  "senha", "admin", "login", "welcome", "letmein", "monkey", "dragon",
  "master", "root", "pass123", "12345678", "1234567890", "111111",
  "123123", "987654321", "qwerty123", "1q2w3e4r", "zaq12wsx"
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
  /(\bUNION\b.*\bSELECT\b)/i,
  /(--|\/\*|\*\/|;)/,
  /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)/i,
  /(\bOR\b.*=.*\bOR\b)/i,
  /('\s*(or|and)\s*')/i,
  /(EXEC\s*\()/i,
  /(\bINTO\s+(OUTFILE|DUMPFILE)\b)/i,
];

const XSS_PATTERNS = [
  /<script[^>]*>/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*['"]/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /<svg[^>]*onload/i,
  /eval\s*\(/i,
  /expression\s*\(/i,
  /data:\s*text\/html/i,
];

export function detectSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

export function detectXSS(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

export function validatePassword(password: string, name?: string, lastName?: string): { valid: boolean; error?: string } {
  const minLength = 7;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (password.length < minLength) {
    logSecurityEvent("password_validation_failed", { 
      details: `Password too short: ${password.length} chars`,
      severity: "low" 
    });
    return { valid: false, error: `A senha deve ter pelo menos ${minLength} caracteres` };
  }
  
  if (!hasUpperCase) {
    logSecurityEvent("password_validation_failed", { 
      details: "Missing uppercase letter",
      severity: "low" 
    });
    return { valid: false, error: "A senha deve conter pelo menos uma letra maiúscula" };
  }
  
  if (!hasNumber) {
    logSecurityEvent("password_validation_failed", { 
      details: "Missing number",
      severity: "low" 
    });
    return { valid: false, error: "A senha deve conter pelo menos um número" };
  }
  
  if (name || lastName) {
    const nameLower = (name || "").toLowerCase();
    const lastNameLower = (lastName || "").toLowerCase();
    const passwordLower = password.toLowerCase();
    
    const nameParts = [...nameLower.split(" "), ...lastNameLower.split(" ")].filter(p => p.length > 2);
    
    for (const part of nameParts) {
      if (passwordLower.includes(part)) {
        logSecurityEvent("password_validation_failed", { 
          details: `Contains name part: ${part}`,
          severity: "medium" 
        });
        return { 
          valid: false, 
          error: `A senha não pode conter seu nome ou sobrenome` 
        };
      }
    }
  }
  
  const passwordLower = password.toLowerCase();
  for (const common of COMMON_PASSWORDS) {
    if (passwordLower.includes(common)) {
      logSecurityEvent("password_validation_failed", { 
        details: `Common password detected: ${common}`,
        severity: "medium" 
      });
      return { valid: false, error: "Senha muito comum, use uma senha mais segura" };
    }
  }
  
  return { valid: true };
}

export function generateSecurePassword(): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const special = "!@#$%&*";
  
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function sanitizeInput(input: string, maxLength = 500): string {
  if (typeof input !== "string") {
    return "";
  }
  
  let sanitized = input
    .replace(/[<>'"]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .trim();
  
  sanitized = sanitized.slice(0, maxLength);
  
  if (detectSQLInjection(sanitized)) {
    logSecurityEvent("sql_injection_attempt", { 
      details: `Input: ${sanitized.substring(0, 50)}...`,
      severity: "critical" 
    });
  }
  
  if (detectXSS(sanitized)) {
    logSecurityEvent("xss_attempt", { 
      details: `Input: ${sanitized.substring(0, 50)}...`,
      severity: "critical" 
    });
  }
  
  return sanitized;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  const localPart = email.split("@")[0];
  if (localPart.length > 64 || email.length > 254) {
    return false;
  }
  
  return true;
}

export function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("X-Permitted-Cross-Domain-Policies", "none");
  headers.set("Server", "secure");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const SENSITIVE_PATTERNS = {
  cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
  rg: /\d{2}\.\d{3}\.\d{3}-\d/g,
  phone: /\(\d{2}\)\s*\d{4,5}-\d{4}/g,
  creditCard: /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g,
  cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
  healthInsurance: /\d{10,}/g,
};

const SENSITIVE_FIELDS = [
  "password", "senha", "cpf", "rg", "cartao", "credit_card", 
  "token", "secret", "api_key", "private_key", "health_data",
  "medical", "diagnosis", "prescription", "symptoms"
];

export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      masked[key] = "[REDACTED]";
      continue;
    }
    
    if (typeof value === "string") {
      let maskedValue = value;
      
      for (const [patternName, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
        if (patternName === "creditCard" || patternName === "healthInsurance") {
          maskedValue = maskedValue.replace(pattern, "****");
        } else {
          maskedValue = maskedValue.replace(pattern, (match) => "*".repeat(match.length));
        }
      }
      
      masked[key] = maskedValue;
    } else if (Array.isArray(value)) {
      masked[key] = value.map(item => 
        typeof item === "object" && item !== null 
          ? maskSensitiveData(item as Record<string, unknown>)
          : item
      );
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value as Record<string, unknown>);
    } else {
      masked[key] = value;
    }
  }
  
  return masked;
}

export function logDataAccess(userId: string, resource: string, action: "read" | "write" | "delete"): void {
  logSecurityEvent(action === "read" ? "login_success" : "suspicious_request", {
    email: userId,
    details: `${action.toUpperCase()} on ${resource}`,
    severity: action === "delete" ? "high" : "low"
  });
}

export function verifyCSRFToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  
  try {
    return token === sessionToken;
  } catch {
    return false;
  }
}

export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, "0")).join("");
}

export function validateInputTypes(data: Record<string, unknown>, schema: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    
    if (value === undefined || value === null) {
      continue;
    }
    
    const actualType = typeof value;
    
    if (expectedType === "string" && actualType !== "string") {
      errors.push(`Field ${field} must be a string`);
    } else if (expectedType === "number" && actualType !== "number") {
      errors.push(`Field ${field} must be a number`);
    } else if (expectedType === "boolean" && actualType !== "boolean") {
      errors.push(`Field ${field} must be a boolean`);
    } else if (expectedType === "email" && typeof value === "string") {
      if (!validateEmail(value)) {
        errors.push(`Field ${field} must be a valid email`);
      }
    } else if (expectedType === "uuid" && typeof value === "string") {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        errors.push(`Field ${field} must be a valid UUID`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function detectBruteForcePattern(email: string, recentAttempts: number): boolean {
  return recentAttempts >= 3;
}

export function createSecureSession(userId: string): string {
  const payload = {
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    randomSalt: Math.random().toString(36).substring(2),
  };
  
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

export function validateSession(session: string): { valid: boolean; userId?: string; error?: string } {
  try {
    const decoded = JSON.parse(Buffer.from(session, "base64").toString());
    
    if (decoded.expiresAt < Date.now()) {
      return { valid: false, error: "Session expired" };
    }
    
    return { valid: true, userId: decoded.userId };
  } catch {
    return { valid: false, error: "Invalid session" };
  }
}