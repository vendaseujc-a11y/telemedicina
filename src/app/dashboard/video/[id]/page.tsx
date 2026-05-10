"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function VideoRoom() {
  const params = useParams();
  const appointmentId = params.id as string;
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && appointmentId) {
      getAppointment();
    }
  }, [user, appointmentId]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
  }

  async function getAppointment() {
    try {
      const { data: apt, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctor:profiles!doctor_id(name, specialty),
          patient:profiles!patient_id(name)
        `)
        .eq("id", appointmentId)
        .single();

      if (error || !apt) {
        setError("Consulta não encontrada");
        setLoading(false);
        return;
      }

      if (apt.doctor_id !== user.id && apt.patient_id !== user.id) {
        setError("Você não tem autorização para acessar esta sala");
        setLoading(false);
        return;
      }

      setAppointment(apt);
      setNotes(apt.notes || "");
      setLoading(false);
    } catch (err) {
      setError("Erro ao carregar consulta");
      setLoading(false);
    }
  }

  async function saveNotes() {
    await supabase
      .from("appointments")
      .update({ notes })
      .eq("id", appointmentId);
  }

  async function endCall() {
    await supabase
      .from("appointments")
      .update({ status: "concluido" })
      .eq("id", appointmentId);
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Carregando sala de vídeo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white bg-red-900/50 p-8 rounded-2xl">
          <p className="text-red-400 mb-4 text-xl">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            Voltar ao Painel
          </button>
        </div>
      </div>
    );
  }

  const roomId = `telemedicina-${appointmentId.replace(/-/g, '')}`;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <header className="bg-gray-800 px-4 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-white font-semibold">
            📹 Consulta com {appointment?.doctor?.name}
          </h1>
          <p className="text-gray-400 text-sm">
            {new Date(appointment?.scheduled_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <button
          onClick={endCall}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Encerrar Consulta
        </button>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          <iframe
            src={`https://meet.jit.si/${roomId}`}
            className="w-full h-full border-0"
            allow="camera; microphone; fullscreen; display-capture"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>

        {appointment?.doctor_id === user?.id && (
          <div className="w-80 bg-white p-4 border-l">
            <h3 className="font-semibold mb-2">📝 Anotações Médico</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              className="w-full h-64 p-3 border rounded-lg resize-none"
              placeholder="Digite suas anotações aqui..."
            />
            <p className="text-xs text-gray-500 mt-2">
              As anotações são salvas automaticamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}