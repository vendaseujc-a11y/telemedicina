"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CURRENT_YEAR, MONTHS_CONFIG, Profile, Appointment, DoctorAvailability } from "@/types";

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
    const month = selectedMonth + 1;
    const startDate = `${CURRENT_YEAR}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${CURRENT_YEAR}-${String(month).padStart(2, "0")}-31`;

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
    if (!confirm("Tem certeza que deseja excluir esta consulta?")) return;

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Olá, {profile?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {profile?.role === "medico"
            ? "Gerencie suas consultas e disponibilidade"
            : "Gerencie suas consultas médicas"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">📅 Próximas Consultas</h2>
              {profile?.role === "paciente" && (
                <Link
                  href="/dashboard/appointments/new"
                  className="bg-sky-500 text-white px-6 py-2 rounded-xl hover:bg-sky-600 font-medium"
                >
                  + Nova Consulta
                </Link>
              )}
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-lg">Nenhuma consulta agendada</p>
                {profile?.role === "paciente" && (
                  <Link
                    href="/dashboard/appointments/new"
                    className="inline-block mt-4 bg-sky-500 text-white px-6 py-3 rounded-xl font-medium"
                  >
                    Agendar Consulta
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="border-2 border-gray-100 rounded-xl p-4 flex justify-between items-center hover:border-sky-200 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xl">
                        {profile?.role === "medico"
                          ? apt.patient?.name?.charAt(0)
                          : apt.doctor?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {profile?.role === "medico"
                            ? apt.patient?.name
                            : `Dr. ${apt.doctor?.name}`}
                        </p>
                        <p className="text-gray-500">
                          📅 {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          apt.status === "confirmado"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {apt.status === "confirmado" ? "✅ Confirmado" : "⏳ Pendente"}
                      </span>
                      {apt.status === "confirmado" && (
                        <Link
                          href={`/dashboard/video/${apt.id}`}
                          className="bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 font-medium"
                        >
                          🎥 Entrar
                        </Link>
                      )}
                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-xl hover:bg-red-200 text-sm"
                      >
                        🗑️
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
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">👨‍⚕️ Especialistas</h2>
              <div className="space-y-3">
                {doctors.map((doctor: any) => (
                  <Link
                    key={doctor.id}
                    href={`/dashboard/appointments/new?doctor=${doctor.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                      {doctor.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">Dr. {doctor.name}</p>
                      <p className="text-sm text-gray-500">
                        {specialties[doctor.specialty] || doctor.specialty}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {profile?.role === "medico" && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">📅 Minha Agenda</h2>
                <Link
                  href="/dashboard/availability"
                  className="text-sky-500 hover:underline text-sm font-medium"
                >
                  Gerenciar →
                </Link>
              </div>

              <p className="text-gray-600 text-sm mb-4">Configure seus horários de atendimento</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {MONTHS_CONFIG.filter(m => m.value >= new Date().getMonth()).map((month) => (
                  <button
                    key={month.value}
                    onClick={() => {
                      setSelectedMonth(month.value);
                      loadDoctorAvailability(profile.id);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      selectedMonth === month.value
                        ? "bg-sky-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {month.label}
                  </button>
                ))}
              </div>

              {doctorAvailability.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p className="text-sm">Nenhum horário cadastrado neste mês</p>
                  <Link
                    href="/dashboard/availability"
                    className="inline-block mt-3 bg-sky-500 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Adicionar Horários
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 font-medium">
                    {doctorAvailability.length} dia(s) com horários
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {doctorAvailability.slice(0, 6).map((avail) => (
                      <div
                        key={avail.id}
                        className="bg-green-50 border border-green-200 rounded-xl p-3"
                      >
                        <p className="font-semibold text-green-800 text-sm">
                          {formatDate(avail.date)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {avail.time_slots.slice(0, 4).map((time: string, idx: number) => (
                            <span key={idx} className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded">
                              {time}
                            </span>
                          ))}
                          {avail.time_slots.length > 4 && (
                            <span className="text-xs text-green-600">
                              +{avail.time_slots.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {doctorAvailability.length > 6 && (
                    <Link
                      href="/dashboard/availability"
                      className="block text-center text-sky-500 text-sm py-2 hover:underline"
                    >
                      Ver todos os {doctorAvailability.length} dias →
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