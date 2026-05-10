"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Profile, Appointment } from "@/types";

const PAGE_SIZE = 20;

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  pendente: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "⏳", label: "Pendente" },
  confirmado: { color: "bg-green-100 text-green-700 border-green-200", icon: "✅", label: "Confirmado" },
  concluido: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: "✔️", label: "Concluído" },
  cancelado: { color: "bg-red-100 text-red-700 border-red-200", icon: "❌", label: "Cancelado" },
};

const specialtyLabels: Record<string, string> = {
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

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("todas");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, pendente: 0, confirmado: 0, concluido: 0 });
  const [page, setPage] = useState(0);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setProfile(profileData);
    await loadAllData(user.id, profileData?.role);
  }

  async function loadAllData(userId: string, role: string, pageNum: number = 0) {
    setLoading(true);
    
    let query = supabase
      .from("appointments")
      .select("*")
      .order("scheduled_at", { ascending: false })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

    const { data: appointmentsData, error } = await query;
    
    if (error) {
      console.error("Erro ao carregar consultas:", error);
    }
    
    const appointmentsList = (appointmentsData || []).filter(
      apt => apt.doctor_id === userId || apt.patient_id === userId
    );
    
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .limit(50);

    const profilesMap: Record<string, Profile> = {};
    profilesData?.forEach(p => { profilesMap[p.id] = p; });

    const pendente = appointmentsList.filter(a => a.status === "pendente").length;
    const confirmado = appointmentsList.filter(a => a.status === "confirmado").length;
    const concluido = appointmentsList.filter(a => a.status === "concluido").length;
    
    setStats({ total: appointmentsList.length, pendente, confirmado, concluido });

    const appointmentsWithProfiles: Appointment[] = appointmentsList.map(apt => ({
      ...apt,
      doctor: profilesMap[apt.doctor_id],
      patient: profilesMap[apt.patient_id]
    }));

    if (filter === "todas") {
      setAppointments(appointmentsWithProfiles);
    } else {
      setAppointments(appointmentsWithProfiles.filter(a => a.status === filter));
    }
    
    setLoading(false);
  }

  function handleFilter(newFilter: string) {
    setFilter(newFilter);
    setPage(0);
    if (user && profile) {
      loadAllData(user.id, profile.role, 0);
    }
  }

  async function updateStatus(appointmentId: string, newStatus: string) {
    await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", appointmentId);

    if (profile) {
      await loadAllData(profile.id, profile.role);
    }
  }

  async function deleteAppointment(appointmentId: string) {
    if (!confirm("Tem certeza que deseja excluir esta consulta?")) return;

    await supabase
      .from("appointments")
      .delete()
      .eq("id", appointmentId);

    if (profile) {
      await loadAllData(profile.id, profile.role);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">📋 Minhas Consultas</h1>
        <p className="text-gray-600 mt-2">
          {profile?.role === "medico" ? "Consultas dos seus pacientes" : "Suas consultas agendadas"}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => handleFilter("todas")}
          className={`p-4 rounded-xl border-2 transition ${
            filter === "todas" ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-sky-300"
          }`}
        >
          <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-sm text-gray-600">Todas</div>
        </button>
        <button
          onClick={() => handleFilter("pendente")}
          className={`p-4 rounded-xl border-2 transition ${
            filter === "pendente" ? "border-yellow-500 bg-yellow-50" : "border-gray-200 hover:border-yellow-300"
          }`}
        >
          <div className="text-3xl font-bold text-yellow-600">{stats.pendente}</div>
          <div className="text-sm text-gray-600">Pendentes</div>
        </button>
        <button
          onClick={() => handleFilter("confirmado")}
          className={`p-4 rounded-xl border-2 transition ${
            filter === "confirmado" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-green-300"
          }`}
        >
          <div className="text-3xl font-bold text-green-600">{stats.confirmado}</div>
          <div className="text-sm text-gray-600">Confirmadas</div>
        </button>
        <button
          onClick={() => handleFilter("concluido")}
          className={`p-4 rounded-xl border-2 transition ${
            filter === "concluido" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
          }`}
        >
          <div className="text-3xl font-bold text-blue-600">{stats.concluido}</div>
          <div className="text-sm text-gray-600">Concluídas</div>
        </button>
      </div>

      {profile?.role === "paciente" && (
        <Link
          href="/dashboard/appointments/new"
          className="inline-block mb-6 bg-sky-500 text-white px-6 py-3 rounded-xl hover:bg-sky-600 font-medium"
        >
          + Nova Consulta
        </Link>
      )}

      <div className="bg-white rounded-2xl shadow-lg">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-lg">
              {filter === "todas" ? "Nenhuma consulta encontrada" : `Nenhuma consulta ${filter}`}
            </p>
            {profile?.role === "paciente" && (
              <Link
                href="/dashboard/appointments/new"
                className="inline-block mt-4 bg-sky-500 text-white px-6 py-3 rounded-xl hover:bg-sky-600 font-medium"
              >
                Agendar Nova Consulta
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((apt) => {
              const status = statusConfig[apt.status] || statusConfig.pendente;
              const isPast = new Date(apt.scheduled_at) < new Date();
              const isMedico = profile?.role === "medico";
              
              return (
                <div key={apt.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold ${
                        apt.status === "confirmado" ? "bg-green-100 text-green-600" :
                        apt.status === "pendente" ? "bg-yellow-100 text-yellow-600" :
                        apt.status === "concluido" ? "bg-blue-100 text-blue-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {isMedico ? apt.patient?.name?.charAt(0) || "P" : apt.doctor?.name?.charAt(0) || "M"}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">
                          {isMedico 
                            ? (apt.patient?.name || "Paciente") 
                            : `Dr. ${apt.doctor?.name || "Médico"}`}
                        </p>
                        {!isMedico && apt.doctor?.specialty && (
                          <p className="text-sm text-gray-500">
                            {specialtyLabels[apt.doctor.specialty] || apt.doctor.specialty}
                          </p>
                        )}
                        <p className="text-gray-500">
                          📅 {formatDate(apt.scheduled_at)}
                        </p>
                        {isMedico && apt.patient_symptoms && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium mb-1">📋 Sintomas descritos pelo paciente:</p>
                            <p className="text-sm text-gray-700">{apt.patient_symptoms}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-4 py-2 rounded-full text-sm font-medium border ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      
                      {isMedico && apt.status === "pendente" && (
                        <button
                          onClick={() => updateStatus(apt.id, "confirmado")}
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700"
                        >
                          ✅ Confirmar
                        </button>
                      )}
                      
                      {apt.status === "confirmado" && (
                        <Link
                          href={`/dashboard/video/${apt.id}`}
                          className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sky-600"
                        >
                          🎥 Entrar
                        </Link>
                      )}
                      
                      {!isMedico && apt.status === "confirmado" && isPast && (
                        <button
                          onClick={() => updateStatus(apt.id, "concluido")}
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
                        >
                          ✔️ Confirmar Presença
                        </button>
                      )}

                      <button
                        onClick={() => deleteAppointment(apt.id)}
                        className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-200 border border-red-200"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}