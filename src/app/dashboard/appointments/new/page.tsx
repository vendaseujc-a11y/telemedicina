"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar_url: string;
}

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function NewAppointment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser();
    getDoctors();
  }, []);

  useEffect(() => {
    const doctorId = searchParams.get("doctor");
    if (doctorId) {
      setSelectedDoctor(doctorId);
      getAvailability(doctorId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      generateTimeSlots();
    }
  }, [selectedDate, availability]);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function getDoctors() {
    const { data } = await supabase
      .from("profiles")
      .select("id, name, specialty, avatar_url")
      .eq("role", "medico")
      .order("name");
    setDoctors(data || []);
  }

  async function getAvailability(doctorId: string) {
    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week");
    setAvailability(data || []);
  }

  function generateTimeSlots() {
    if (!selectedDate) return;
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek);
    
    if (dayAvailability.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const slots: string[] = [];
    
    dayAvailability.forEach(avail => {
      const [startHour, startMin] = avail.start_time.split(":").map(Number);
      const [endHour, endMin] = avail.end_time.split(":").map(Number);
      
      let currentHour = startHour;
      let currentMin = startMin;
      
      while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
        slots.push(`${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`);
        currentMin += 30;
        if (currentMin >= 60) {
          currentHour += 1;
          currentMin = 0;
        }
      }
    });
    
    setAvailableSlots(slots);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setError("Preencha todos os campos");
      setLoading(false);
      return;
    }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

    const { data: existingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("doctor_id", selectedDoctor)
      .eq("scheduled_at", scheduledAt.toISOString())
      .single();

    if (existingAppointment) {
      setError("Este horário já está agendado");
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("appointments")
      .insert({
        doctor_id: selectedDoctor,
        patient_id: user?.id,
        scheduled_at: scheduledAt.toISOString(),
        status: "pendente",
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/dashboard/appointments");
  }

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

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold">Nova Consulta</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Escolha o médico
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {doctors.map((doctor) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => {
                    setSelectedDoctor(doctor.id);
                    getAvailability(doctor.id);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedDoctor === doctor.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{doctor.name}</div>
                  <div className="text-sm text-gray-500">
                    {specialties[doctor.specialty] || doctor.specialty}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da consulta
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime("");
              }}
              min={today}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horário disponível
            </label>
            {selectedDate && availableSlots.length === 0 ? (
              <p className="text-gray-500">Nenhum horário disponível nesta data</p>
            ) : (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 rounded-lg border text-sm transition ${
                      selectedTime === slot
                        ? "border-primary bg-primary text-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !selectedDoctor || !selectedDate || !selectedTime}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Agendando..." : "Agendar Consulta"}
          </button>
        </form>
      </div>
    </div>
  );
}