"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Profile, Appointment, DoctorAvailability } from "@/types";

const specialties: Record<string, string> = {
  clinico_geral: "Clínico Geral",
  cardiologia: "Cardiologia",
  dermatologia: "Dermatologia",
  pediatria: "Pediatria",
  psicologia: "Psicologia",
  psiquiatria: "Psiquiatria",
  ortopedia: "Ortopedia",
  ginecologia: "Ginecologia",
  neurologia: "Neurologia",
  oftalmologia: "Oftalmologia",
};

const MONTHS_CONFIG = [
  { value: 0, label: "Jan" },
  { value: 1, label: "Fev" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Abr" },
  { value: 4, label: "Mai" },
  { value: 5, label: "Jun" },
  { value: 6, label: "Jul" },
  { value: 7, label: "Ago" },
  { value: 8, label: "Set" },
  { value: 9, label: "Out" },
  { value: 10, label: "Nov" },
  { value: 11, label: "Dez" },
];

export default function Dashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Profile[]>([]);
  const [doctorAvailability, setDoctorAvailability] = useState<DoctorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setProfile(profile);

    await Promise.all([
      loadAppointments(user.id, profile?.role),
      loadDoctors()
    ]);

    if (profile?.role === "medico") {
      loadDoctorAvailability(user.id);
    }
    
    setLoading(false);
  }

  async function loadAppointments(userId: string, role: string) {
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: true })
      .limit(20);

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .limit(50);

    const profilesMap: Record<string, Profile> = {};
    profilesData?.forEach(p => { profilesMap[p.id] = p; });

    const filteredAppointments = (appointmentsData || []).filter(
      apt => apt.doctor_id === userId || apt.patient_id === userId
    );

    const appointmentsWithProfiles: Appointment[] = filteredAppointments.map(apt => ({
      ...apt,
      doctor: profilesMap[apt.doctor_id],
      patient: profilesMap[apt.patient_id]
    }));

    setAppointments(appointmentsWithProfiles);
  }

  async function loadDoctors() {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, specialty, avatar_url")
      .eq("role", "medico")
      .order("name")
      .limit(50);
    
    const doctorsData = (data || []).map(d => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      avatar_url: d.avatar_url,
      role: 'medico' as const,
      created_at: '',
      updated_at: ''
    }));
    setDoctors(doctorsData);
  }

  async function loadDoctorAvailability(doctorId: string) {
    const currentYear = new Date().getFullYear();
    const month = selectedMonth + 1;
    const startDate = `${currentYear}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${currentYear}-${String(month).padStart(2, "0")}-31`;

    const { data } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", doctorId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    setDoctorAvailability(data || []);
  }

  async function deleteAppointment(appointmentId: string) {
    if (!confirm("Excluir esta consulta?")) return;

    await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId);

    if (profile) {
      await loadAppointments(profile.id, profile.role);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const nameParts = (profile?.name || "").split(" ");
  const firstName = nameParts[0];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
          Olá, {firstName}! 👋
        </h1>
        <p className="text-zinc-500 mt-1">
          {profile?.role === "medico"
            ? "Gerencie suas consultas e disponibilidade"
            : "Suas consultas médicas"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Próximas Consultas
              </h2>
              {profile?.role === "paciente" && (
                <Link href="/dashboard/appointments/new" className="btn-primary text-sm py-2 text-center">
                  + Nova Consulta
                </Link>
              )}
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="text-zinc-600 mb-4">Nenhuma consulta agendada</p>
                {profile?.role === "paciente" && (
                  <Link href="/dashboard/appointments/new" className="btn-primary inline-block text-sm">
                    Agendar Consulta
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt: any) => (
                  <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                        {profile?.role === "medico"
                          ? apt.patient?.name?.charAt(0)
                          : apt.doctor?.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-zinc-900 truncate">
                          {profile?.role === "medico"
                            ? apt.patient?.name
                            : `Dr. ${apt.doctor?.name}`}
                        </p>
                        <p className="text-sm text-zinc-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                          </svg>
                          {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 ml-16 sm:ml-0">
                      <span className={`badge ${apt.status === "confirmado" ? "badge-success" : "badge-warning"}`}>
                        {apt.status === "confirmado" ? "Confirmado" : "Pendente"}
                      </span>
                      {apt.status === "confirmado" && (
                        <Link
                          href={`/dashboard/video/${apt.id}`}
                          className="btn-primary text-sm py-1.5 px-3"
                        >
                          <svg className="w-4 h-4 inline sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                          </svg>
                          <span className="hidden sm:inline">Entrar</span>
                        </Link>
                      )}
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          {profile?.role === "paciente" && (
            <div className="card p-5">
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                Especialistas
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto hide-scrollbar">
                {doctors.map((doctor: any) => (
                  <Link
                    key={doctor.id}
                    href={`/dashboard/appointments/new?doctor=${doctor.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {doctor.name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 text-sm truncate">Dr. {doctor.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{specialties[doctor.specialty] || doctor.specialty}</p>
                    </div>
                  </Link>
                ))}
                {doctors.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-4">Nenhum médico disponível</p>
                )}
              </div>
            </div>
          )}

          {profile?.role === "medico" && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Minha Agenda
                </h2>
                <Link href="/dashboard/availability" className="text-primary text-sm font-medium hover:underline">
                  Gerenciar →
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {MONTHS_CONFIG.filter(m => m.value >= new Date().getMonth()).slice(0, 6).map((month) => (
                  <button
                    key={month.value}
                    onClick={() => {
                      setSelectedMonth(month.value);
                      if (profile) loadDoctorAvailability(profile.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedMonth === month.value
                        ? "bg-primary text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>

              {doctorAvailability.length === 0 ? (
                <div className="text-center py-6 text-zinc-500">
                  <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm">Nenhum horário cadastrado</p>
                  <Link href="/dashboard/availability" className="text-primary text-sm font-medium hover:underline">
                    Adicionar Horários →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-zinc-600 font-medium">
                    {doctorAvailability.length} dia(s) disponível(is)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {doctorAvailability.slice(0, 4).map((avail) => (
                      <div key={avail.id} className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                        <p className="font-semibold text-emerald-800 text-xs">
                          {formatDate(avail.date)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {avail.time_slots.slice(0, 3).map((time: string, idx: number) => (
                            <span key={idx} className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded">
                              {time}
                            </span>
                          ))}
                          {avail.time_slots.length > 3 && (
                            <span className="text-xs text-emerald-600">+{avail.time_slots.length - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {doctorAvailability.length > 4 && (
                    <Link href="/dashboard/availability" className="block text-center text-primary text-sm py-2 hover:underline">
                      Ver todos →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}