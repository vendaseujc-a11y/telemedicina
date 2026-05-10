"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRENT_YEAR, MONTHS_CONFIG, TIMES } from "@/types";

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface AvailabilityRecord {
  id?: string;
  date: string;
  time_slots: string[];
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [availability, setAvailability] = useState<Map<string, AvailabilityRecord>>(new Map());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (profile) {
      loadAvailability();
    }
  }, [profile, selectedMonth]);

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

    if (profile?.role !== "medico") {
      router.push("/dashboard");
      return;
    }

    await loadAvailability();
  }

  async function loadAvailability() {
    setLoading(true);
    const year = CURRENT_YEAR;
    const month = selectedMonth + 1;
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    const { data, error } = await supabase
      .from("doctor_availability")
      .select("*")
      .eq("doctor_id", profile.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date");

    if (error) {
      setError(error.message);
    }

    const newMap = new Map<string, AvailabilityRecord>();
    if (data) {
      data.forEach(item => {
        newMap.set(item.date, item);
      });
    }
    setAvailability(newMap);
    setLoading(false);
  }

  function getWeekday(day: number) {
    const date = new Date(CURRENT_YEAR, selectedMonth, day);
    return WEEKDAYS[date.getDay()];
  }

  function isDayAvailable(day: number) {
    const dateStr = `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return availability.has(dateStr);
  }

  function getDaySlots(day: number) {
    const dateStr = `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return availability.get(dateStr)?.time_slots || [];
  }

  function openDayEditor(day: number, isEditing = false) {
    const dateStr = `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = availability.get(dateStr);
    
    setEditingDay(day);
    setSelectedTimes(existing ? [...existing.time_slots] : []);
    setError("");
  }

  function closeEditor() {
    setEditingDay(null);
    setSelectedTimes([]);
  }

  function openEditDay(day: number) {
    openDayEditor(day, true);
  }

  function toggleTime(time: string) {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time].sort());
    }
  }

  async function saveDay() {
    if (editingDay === null || selectedTimes.length === 0) return;
    setSaving(true);
    setError("");

    const dateStr = `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, "0")}-${String(editingDay).padStart(2, "0")}`;

    const { error } = await supabase
      .from("doctor_availability")
      .upsert({
        doctor_id: profile.id,
        date: dateStr,
        time_slots: selectedTimes,
      });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Horário salvo com sucesso!");
    setTimeout(() => setSuccess(""), 3000);
    closeEditor();
    await loadAvailability();
  }

  async function removeDay(day: number) {
    const dateStr = `${CURRENT_YEAR}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const avail = availability.get(dateStr);
    
    if (!avail?.id) return;

    const { error } = await supabase
      .from("doctor_availability")
      .delete()
      .eq("id", avail.id);

    if (!error) {
      await loadAvailability();
    }
  }

  const currentMonthData = MONTHS_CONFIG.find(m => m.value === selectedMonth);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📅 Minha Agenda - {CURRENT_YEAR}</h1>
        <p className="text-gray-600 mt-2">Configure sua disponibilidade para {CURRENT_YEAR}</p>
      </div>

      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 font-medium">
          ✓ {success}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        {MONTHS_CONFIG.filter(m => m.value >= new Date().getMonth()).map(m => (
          <button
            key={m.value}
            onClick={() => setSelectedMonth(m.value)}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
              selectedMonth === m.value 
                ? "bg-sky-500 text-white shadow-lg" 
                : "bg-white text-gray-700 hover:bg-sky-100 border border-gray-200"
            }`}
          >
            {m.label} {CURRENT_YEAR}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{MONTH_NAMES[selectedMonth]} {CURRENT_YEAR}</h2>
          <span className="bg-sky-100 text-sky-700 px-4 py-2 rounded-full text-sm font-medium">
            {currentMonthData?.days} dias
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-3">
            {Array.from({ length: currentMonthData?.days || 30 }, (_, i) => i + 1).map(day => {
              const available = isDayAvailable(day);
              const slots = getDaySlots(day);
              
              return (
                <div
                  key={day}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    available
                      ? "bg-green-50 border-green-300"
                      : "bg-gray-50 border-gray-200 hover:border-sky-300 hover:bg-sky-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-2xl font-bold text-gray-800">{day}</span>
                      <span className="ml-2 text-sm text-gray-500">{getWeekday(day)}</span>
                    </div>
                    {available && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {slots.length}h
                      </span>
                    )}
                  </div>

                  {available ? (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {slots.slice(0, 6).map((time, idx) => (
                          <span key={idx} className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                            {time}
                          </span>
                        ))}
                        {slots.length > 6 && (
                          <span className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded">
                            +{slots.length - 6}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditDay(day)}
                          className="flex-1 text-sky-600 hover:bg-sky-50 text-xs py-1 rounded border border-sky-200"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => removeDay(day)}
                          className="flex-1 text-red-500 hover:bg-red-50 text-xs py-1 rounded border border-red-200"
                        >
                          🗑️ Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openDayEditor(day)}
                      className="w-full mt-2 bg-sky-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-sky-600"
                    >
                      + Adicionar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Horários Disponíveis</h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {TIMES.map(time => (
              <div key={time} className="bg-gray-100 text-gray-700 py-3 px-2 rounded-lg text-center font-medium text-sm">
                {time}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Legenda</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded-lg"></div>
              <span>Dia com horários definidos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-sky-300"></div>
              <span>Dia disponível (clique para adicionar)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-500 rounded-lg"></div>
              <span>Dia selecionado para edição</span>
            </div>
          </div>
        </div>
      </div>

      {editingDay !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Dia {editingDay} de {MONTH_NAMES[selectedMonth]} {CURRENT_YEAR}
              </h3>
              <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600 text-2xl">
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4">Selecione os horários disponíveis:</p>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-4 gap-3 mb-6">
              {TIMES.map(time => {
                const isSelected = selectedTimes.includes(time);
                return (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-sky-100"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            {selectedTimes.length > 0 && (
              <div className="bg-sky-50 p-4 rounded-xl mb-4">
                <p className="text-sm text-sky-700 font-medium">
                  {selectedTimes.length} horário(s) selecionado(s)
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeEditor}
                className="flex-1 py-3 px-4 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveDay}
                disabled={saving || selectedTimes.length === 0}
                className="flex-1 py-3 px-4 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar Horários"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}