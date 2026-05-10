"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { CURRENT_YEAR, MONTHS_CONFIG, TIMES } from "@/types";

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

export default function NewAppointment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [doctorData, setDoctorData] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [symptoms, setSymptoms] = useState("");

  useEffect(() => {
    loadUserAndDoctors();
  }, []);

  useEffect(() => {
    const doctorId = searchParams.get("doctor");
    if (doctorId && doctors.length > 0) {
      const doc = doctors.find(d => d.id === doctorId);
      if (doc) {
        setSelectedDoctor(doctorId);
        setDoctorData(doc);
      }
    }
  }, [searchParams, doctors]);

  useEffect(() => {
    if (selectedDoctor) {
      loadDoctorAvailability();
    }
  }, [selectedDoctor, selectedMonth]);

  async function loadUserAndDoctors() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    const { data: doctorsData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "medico")
      .order("name");

    setDoctors(doctorsData || []);
    setLoadingDoctors(false);
  }

  async function loadDoctorAvailability() {
    const doc = doctors.find(d => d.id === selectedDoctor);
    setDoctorData(doc);

    const month = selectedMonth + 1;
    const startDate = `${CURRENT_YEAR}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${CURRENT_YEAR}-${String(month).padStart(2, "0")}-31`;

    const { data } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", selectedDoctor)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    setAvailability(data || []);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function isDateAvailable(dateStr: string) {
    return availability.some(a => a.date === dateStr);
  }

  function getTimesForDate(dateStr: string) {
    const avail = availability.find(a => a.date === dateStr);
    return avail?.time_slots || [];
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError("Selecione o médico, a data e o horário");
      return;
    }

    setLoading(true);

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

    const { data: existing } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", selectedDoctor)
      .eq("scheduled_at", scheduledAt.toISOString())
      .single();

    if (existing) {
      setError("Este horário já está reservado!");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("appointments")
      .insert({
        doctor_id: selectedDoctor,
        patient_id: user?.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "pendente",
        patient_symptoms: symptoms,
      });

    setLoading(false);

    if (insertError) {
      setError("Erro ao agendar: " + insertError.message);
      return;
    }

    setSuccess("Consulta agendada com sucesso!");
    setTimeout(() => {
      router.push("/dashboard/appointments");
    }, 1500);
  }

  const availableTimes = selectedDate ? getTimesForDate(selectedDate) : [];

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-2xl">
          ←
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">📅 Agendar Consulta</h1>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 font-medium">
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 font-medium">
          ✅ {success}
        </div>
      )}

      {loadingDoctors ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">👨‍⚕️ Escolha o Médico</h2>
            
            {doctors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">😔</p>
                <p>Nenhum médico disponível no momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => {
                      setSelectedDoctor(doctor.id);
                      setDoctorData(doctor);
                      loadDoctorAvailability();
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      selectedDoctor === doctor.id
                        ? "border-sky-500 bg-sky-50"
                        : "border-gray-200 hover:border-sky-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-lg font-bold text-sky-600">
                        {doctor.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{doctor.name}</p>
                        <p className="text-sm text-gray-500">
                          {specialties[doctor.specialty] || doctor.specialty}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDoctor && doctorData && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">📅 Selecione a Data e Horário</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o mês:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full px-4 py-3 border-2 rounded-xl"
                >
                  {MONTHS_CONFIG.filter(m => m.value >= new Date().getMonth()).map(m => (
                    <option key={m.value} value={m.value}>{m.label} {CURRENT_YEAR}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  Calendário de {MONTHS_CONFIG.find(m => m.value === selectedMonth)?.label} {CURRENT_YEAR}
                </h3>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border rounded"></div>
                    <span className="text-sm">Disponível</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-sky-500 rounded"></div>
                    <span className="text-sm">Selecionado</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: getFirstDayOfMonth(CURRENT_YEAR, selectedMonth) }, (_, i) => (
                    <div key={`empty-${i}`} className="w-12 h-12"></div>
                  )).concat(
                    Array.from({ length: getDaysInMonth(CURRENT_YEAR, selectedMonth) }, (_, i) => {
                      const day = i + 1;
                      const dateStr = `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const available = isDateAvailable(dateStr);
                      const isPast = dateStr < new Date().toISOString().split("T")[0];
                      const isSelected = selectedDate === dateStr;

                      return (
                        <button
                          key={day}
                          onClick={() => available && setSelectedDate(dateStr)}
                          disabled={!available || isPast}
                          className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${
                            isPast ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                            available ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer" :
                            "bg-gray-100 text-gray-400 cursor-not-allowed"
                          } ${isSelected ? "bg-sky-500 text-white" : ""}`}
                        >
                          {day}
                        </button>
                      );
                    })
                  )}
                </div>

                {availability.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Este médico não possui horários disponíveis neste mês
                  </p>
                )}
              </div>

              {selectedDate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Horários em {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { 
                      weekday: "long", day: "numeric", month: "long" 
                    })}
                  </h3>
                  
                  {availableTimes.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum horário disponível nesta data
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availableTimes.map((time: string) => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                            selectedTime === time
                              ? "bg-sky-500 text-white shadow-lg"
                              : "bg-gray-100 text-gray-700 hover:bg-sky-100"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Descreva seus sintomas e problemas
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 resize-none"
                  rows={4}
                  placeholder="Descreva aqui os sintomas e problemas que está enfrentando..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !selectedDoctor || !selectedDate || !selectedTime}
                className="w-full bg-sky-500 text-white py-4 rounded-xl hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {loading ? "⏳ Agendando..." : "✅ Confirmar Agendamento"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}