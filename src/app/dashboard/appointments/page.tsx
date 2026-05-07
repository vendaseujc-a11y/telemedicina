"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"todas" | "pendente" | "confirmado" | "concluido">("todas");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && profile) {
      getAppointments();
    }
  }, [user, profile, filter]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setUser(user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profile);
  }

  async function getAppointments() {
    setLoading(true);
    
    let query = supabase
      .from("appointments")
      .select(`
        *,
        doctor:profiles!doctor_id(name, specialty),
        patient:profiles!patient_id(name)
      `)
      .order("scheduled_at", { ascending: false });

    if (filter !== "todas") {
      query = query.eq("status", filter);
    }

    if (profile?.role === "medico") {
      query = query.eq("doctor_id", user.id);
    } else {
      query = query.eq("patient_id", user.id);
    }

    const { data } = await query;
    setAppointments(data || []);
    setLoading(false);
  }

  async function updateStatus(appointmentId: string, newStatus: string) {
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    getAppointments();
  }

  const statusColors: Record<string, string> = {
    pendente: "bg-yellow-100 text-yellow-700",
    confirmado: "bg-green-100 text-green-700",
    concluido: "bg-gray-100 text-gray-700",
    cancelado: "bg-red-100 text-red-700",
  };

  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Minhas Consultas</h1>
          <p className="text-gray-600">
            Gerencie suas consultas agendadas
          </p>
        </div>
        {profile?.role === "paciente" && (
          <Link
            href="/dashboard/appointments/new"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
          >
            Nova Consulta
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex gap-2">
            {(["todas", "pendente", "confirmado", "concluido"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filter === f
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {f === "todas" ? "Todas" : statusLabels[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-4">📅</p>
              <p>Nenhuma consulta encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {profile?.role === "medico"
                        ? apt.patient?.name?.charAt(0)
                        : apt.doctor?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">
                        {profile?.role === "medico"
                          ? apt.patient?.name
                          : `Dr. ${apt.doctor?.name}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[apt.status]}`}>
                      {statusLabels[apt.status]}
                    </span>
                    
                    {profile?.role === "medico" && apt.status === "pendente" && (
                      <button
                        onClick={() => updateStatus(apt.id, "confirmado")}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                      >
                        Confirmar
                      </button>
                    )}
                    
                    {apt.status === "confirmado" && (
                      <Link
                        href={`/dashboard/video/${apt.id}`}
                        className="bg-primary text-white px-3 py-1 rounded-lg text-sm hover:bg-primary-dark"
                      >
                        Entrar
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}