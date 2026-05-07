import Link from "next/link";
import { createServerClient } from "@/lib/supabase";

async function getUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId: string) {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

async function getUpcomingAppointments(userId: string, role: string) {
  const supabase = createServerClient();
  let query = supabase
    .from("appointments")
    .select(`
      *,
      doctor:profiles!doctor_id(name, specialty, avatar_url),
      patient:profiles!patient_id(name, avatar_url)
    `)
    .gte("scheduled_at", new Date().toISOString())
    .in("status", ["pendente", "confirmado"])
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (role === "medico") {
    query = query.eq("doctor_id", userId);
  } else {
    query = query.eq("patient_id", userId);
  }

  const { data } = await query;
  return data || [];
}

async function getDoctors() {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, specialty, avatar_url")
    .eq("role", "medico")
    .order("name");
  return data || [];
}

export default async function Dashboard() {
  const user = await getUser();
  const profile = await getProfile(user?.id!);
  const appointments = await getUpcomingAppointments(user?.id!, profile?.role);
  const doctors = await getDoctors();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Olá, {profile?.name}!
        </h1>
        <p className="text-gray-600">
          {profile?.role === "medico"
            ? "Veja suas próximas consultas"
            : "Gerencie suas consultas médicas"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Próximas Consultas</h2>
              <Link
                href="/dashboard/appointments/new"
                className="text-primary hover:underline text-sm"
              >
                Nova consulta
              </Link>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-4">📅</p>
                <p>Nenhuma consulta agendada</p>
                {profile?.role === "paciente" && (
                  <Link
                    href="/dashboard/appointments/new"
                    className="inline-block mt-4 bg-primary text-white px-4 py-2 rounded-lg"
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
                    className="border rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {profile?.role === "medico"
                          ? apt.patient.name.charAt(0)
                          : apt.doctor.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {profile?.role === "medico"
                            ? apt.patient.name
                            : `Dr. ${apt.doctor.name}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(apt.scheduled_at).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          apt.status === "confirmado"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {apt.status === "confirmado" ? "Confirmado" : "Pendente"}
                      </span>
                      {apt.status === "confirmado" && (
                        <Link
                          href={`/dashboard/video/${apt.id}`}
                          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
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

        <div>
          {profile?.role === "paciente" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Especialistas</h2>
              <div className="space-y-3">
                {doctors.map((doctor: any) => (
                  <Link
                    key={doctor.id}
                    href={`/dashboard/appointments/new?doctor=${doctor.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {doctor.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dr. {doctor.name}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {doctor.specialty?.replace("_", " ")}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}