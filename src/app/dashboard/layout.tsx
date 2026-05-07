import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import "./globals.css";

export const dynamic = "force-dynamic";

async function getUser() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
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

async function getAppointments(userId: string, role: string) {
  const supabase = createServerClient();
  let query = supabase
    .from("appointments")
    .select(`
      *,
      doctor:profiles!doctor_id(name, specialty),
      patient:profiles!patient_id(name)
    `)
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true });

  if (role === "medico") {
    query = query.eq("doctor_id", userId);
  } else {
    query = query.eq("patient_id", userId);
  }

  const { data } = await query;
  return data || [];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const profile = await getProfile(user.id);
  const appointments = await getAppointments(user.id, profile?.role);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              Telemedicina Pro
            </Link>
            <nav className="hidden md:flex gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-primary"
              >
                Início
              </Link>
              <Link
                href="/dashboard/appointments"
                className="text-gray-600 hover:text-primary"
              >
                Consultas
              </Link>
              {profile?.role === "medico" && (
                <Link
                  href="/dashboard/patients"
                  className="text-gray-600 hover:text-primary"
                >
                  Pacientes
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{profile?.name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {profile?.role}
              </p>
            </div>
            <form action="/auth/signout" method="post">
              <button className="text-gray-600 hover:text-primary">Sair</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}