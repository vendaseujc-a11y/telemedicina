import { NextRequest, NextResponse } from "next/server";
import { getSecurityLogs, logSecurityEvent, sanitizeInput, SecurityEventType } from "@/lib/security";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader ?? undefined;
  
  if (!token || !token.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const eventTypeRaw = searchParams.get("eventType");
  const severityRaw = searchParams.get("severity");
  const limit = parseInt(searchParams.get("limit") || "100");
  
  const logs = getSecurityLogs({
    eventType: eventTypeRaw as SecurityEventType | undefined,
    severity: severityRaw as "low" | "medium" | "high" | "critical" | undefined,
  });
  
  return NextResponse.json({
    logs: logs.slice(-limit),
    total: logs.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    if (action === "report") {
      const body = await request.json();
      const { eventType, details, severity } = body;
      
      if (!eventType || !details) {
        return NextResponse.json(
          { error: "eventType e details são obrigatórios" },
          { status: 400 }
        );
      }
      
      logSecurityEvent(sanitizeInput(eventType) as any, {
        details: sanitizeInput(details),
        severity: severity || "medium",
      });
      
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}