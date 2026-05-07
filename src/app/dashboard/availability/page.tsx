"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [newSlots, setNewSlots] = useState<{ day_of_week: number; start_time: string; end_time: string }[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

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

    if (profile?.role !== "medico") {
      window.location.href = "/dashboard";
      return;
    }

    getAvailability(user.id);
  }

  async function getAvailability(doctorId: string) {
    const { data } = await supabase
      .from("availability")
      .select("*")
      .eq("doctor_id", doctorId)
      .order("day_of_week")
      .order("start_time");

    setAvailability(data || []);
    setLoading(false);
  }

  function addSlot() {
    setNewSlots([
      ...newSlots,
      { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    ]);
  }

  function removeNewSlot(index: number) {
    setNewSlots(newSlots.filter((_, i) => i !== index));
  }

  function updateNewSlot(index: number, field: string, value: any) {
    const updated = [...newSlots];
    updated[index] = { ...updated[index], [field]: value };
    setNewSlots(updated);
  }

  async function removeSlot(slotId: string) {
    await supabase.from("availability").delete().eq("id", slotId);
    getAvailability(user.id);
  }

  async function saveSlots() {
    if (newSlots.length === 0) return;
    setSaving(true);

    const slots = newSlots.map((slot) => ({
      ...slot,
      doctor_id: user.id,
    }));

    const { error } = await supabase.from("availability").insert(slots);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setNewSlots([]);
    getAvailability(user.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Minha Agenda</h1>
        <p className="text-gray-600">
          Configure seus horários de atendimento
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Horários Atuais</h2>
          
          {availability.length === 0 ? (
            <p className="text-gray-500">Nenhum horário cadastrado</p>
          ) : (
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day) => {
                const daySlots = availability.filter(s => s.day_of_week === day.value);
                if (daySlots.length === 0) return null;
                
                return (
                  <div key={day.value} className="border rounded-lg p-3">
                    <p className="font-medium text-sm text-gray-700 mb-2">{day.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-lg flex items-center gap-2"
                        >
                          <span>{slot.start_time} - {slot.end_time}</span>
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Adicionar Horários</h2>
          
          <div className="space-y-4">
            {newSlots.map((slot, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={slot.day_of_week}
                  onChange={(e) => updateNewSlot(index, "day_of_week", Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg"
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.start_time}
                  onChange={(e) => updateNewSlot(index, "start_time", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <span className="text-gray-500">até</span>
                <input
                  type="time"
                  value={slot.end_time}
                  onChange={(e) => updateNewSlot(index, "end_time", e.target.value)}
                  className="px-3 py-2 border rounded-lg"
                />
                <button
                  onClick={() => removeNewSlot(index)}
                  className="text-red-500 hover:text-red-700 text-xl"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              onClick={addSlot}
              className="text-primary hover:underline"
            >
              + Adicionar horário
            </button>

            {newSlots.length > 0 && (
              <button
                onClick={saveSlots}
                disabled={saving}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Horários"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}