"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile, DoctorAvailability } from "@/types";

const specialties = [
  { value: "clinico_geral", label: "Clínico Geral" },
  { value: "cardiologia", label: "Cardiologia" },
  { value: "dermatologia", label: "Dermatologia" },
  { value: "pediatria", label: "Pediatria" },
  { value: "psicologia", label: "Psicologia" },
  { value: "psiquiatria", label: "Psiquiatria" },
  { value: "ortopedia", label: "Ortopedia" },
  { value: "ginecologia", label: "Ginecologia" },
  { value: "neurologia", label: "Neurologia" },
  { value: "oftalmologia", label: "Oftalmologia" },
];

interface Doctor extends Profile {}

export default function Home() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchSpecialty, setSearchSpecialty] = useState("");
  const [showDoctors, setShowDoctors] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadDoctors();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  async function loadDoctors() {
    let query = supabase.from("profiles").select("*").eq("role", "medico");
    if (searchSpecialty) {
      query = query.eq("specialty", searchSpecialty);
    }
    const { data } = await query;
    if (data) setDoctors(data as Doctor[]);
  }

  async function handleSearch() {
    setLoading(true);
    await loadDoctors();
    setLoading(false);
    setShowDoctors(true);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  }

  async function handleBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    if (!bookingDoctor || !bookingDate || !bookingTime) return;

    setBookingLoading(true);
    setBookingError("");

    const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();

    const { error } = await supabase.from("appointments").insert({
      doctor_id: bookingDoctor.id,
      patient_id: user.id,
      scheduled_at: scheduledAt,
      status: "pendente",
    });

    setBookingLoading(false);

    if (error) {
      setBookingError(error.message);
    } else {
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingDoctor(null);
        setBookingSuccess(false);
        setBookingDate("");
        setBookingTime("");
      }, 3000);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">Telemedicina<span className="text-sky-500">Pro</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-sky-500 transition">Funcionalidades</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-sky-500 transition">Como Funciona</a>
              {user && <Link href="/dashboard" className="text-gray-600 hover:text-sky-500 transition">Painel Administrativo</Link>}
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 hover:text-sky-500 font-medium transition">Painel Administrativo</Link>
                  <button onClick={handleSignOut} className="text-gray-600 hover:text-sky-500 font-medium transition">Sair</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-sky-500 font-medium transition">Entrar</Link>
                  <Link href="/register" className="bg-sky-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-sky-600 transition shadow-lg shadow-sky-500/30">Cadastrar</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-500 to-cyan-400 min-h-screen flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-medium mb-6">🏥 Saúde Digital ao Seu Alcance</span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Consultas Médicas <span className="text-cyan-200">Online</span> de Forma Simples
              </h1>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Conecte-se com médicos especializados através de videochamadas seguras. 
                Agende consultas, receba prescrições e cuide da sua saúde sem sair de casa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={() => user ? setShowDoctors(true) : router.push("/register")} className="bg-white text-sky-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-xl text-center">
                  Agendar Consulta
                  <svg className="w-5 h-5 inline ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
                <a href="#how-it-works" className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition text-center">
                  Como Funciona
                </a>
              </div>
              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs font-bold text-sky-500">JD</div>
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs font-bold text-sky-500">MC</div>
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-white flex items-center justify-center text-xs font-bold text-sky-500">RP</div>
                </div>
                <div className="text-white/80">
                  <span className="font-bold text-white">+10.000</span> pacientes atendidos
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-white/10 rounded-3xl blur-3xl"></div>
              <div className="relative bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl">👨‍⚕️</div>
                  <div>
                    <div className="text-white font-semibold">Dr. Carlos Santos</div>
                    <div className="text-white/70 text-sm">Cardiologista • CRM-SP 123456</div>
                  </div>
                  <div className="ml-auto">
                    <span className="px-3 py-1 bg-green-500 text-white text-xs rounded-full">Online</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white/80 text-sm">Consulta em andamento...</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button className="bg-white/20 text-white py-3 rounded-xl hover:bg-white/30 transition">
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                  <button className="bg-white/20 text-white py-3 rounded-xl hover:bg-white/30 transition">
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                    </svg>
                  </button>
                  <button className="bg-red-500 text-white py-3 rounded-xl hover:bg-red-600 transition">
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Doctors Section */}
      {showDoctors && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Encontre seu Médico</h2>
              <p className="text-gray-600 mt-4">Busque por especialidade e agende sua consulta</p>
            </div>

            {/* Search Form */}
            <div className="bg-gray-50 p-6 rounded-2xl mb-12">
              <div className="grid md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                  <select 
                    value={searchSpecialty}
                    onChange={(e) => setSearchSpecialty(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    {specialties.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button 
                    onClick={handleSearch}
                    className="w-full bg-sky-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-sky-600 transition"
                  >
                    Buscar Médicos
                  </button>
                </div>
                <div>
                  <button 
                    onClick={() => setShowDoctors(false)}
                    className="w-full border border-gray-300 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>

            {/* Doctors List */}
            {doctors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="bg-gray-50 p-6 rounded-2xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-2xl">
                        {doctor.avatar_url ? (
                          <img src={doctor.avatar_url} alt={doctor.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          "👨‍⚕️"
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                        <p className="text-gray-600 text-sm">{specialties.find(s => s.value === doctor.specialty)?.label || doctor.specialty}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBookingDoctor(doctor)}
                      className="w-full bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 transition"
                    >
                      Agendar Consulta
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Nenhum médico encontrado. Tente outra especialidade.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Agendar Consulta</h3>
            <p className="text-gray-600 mb-6">com {bookingDoctor.name}</p>

            {bookingSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Consulta Agendada!</h4>
                <p className="text-gray-600">Você receberá uma confirmação por e-mail.</p>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {bookingError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {bookingError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingDoctor(null)}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 bg-sky-500 text-white py-3 rounded-xl font-medium hover:bg-sky-600 disabled:opacity-50 transition"
                  >
                    {bookingLoading ? "Agendando..." : "Confirmar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sky-500 font-medium">Funcionalidades</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Recursos para sua saúde</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">Uma plataforma completa para consultas médicas online com recursos avançados de telemedicina.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card-hover bg-gray-50 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V21m8-4V4a1 1 0 00-1-1H4a1 1 0 00-1 1v12a1 1 0 001 1h4a1 1 0 001-1zm8 0h-4a1 1 0 00-1 1v12a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Agendamento Online</h3>
              <p className="text-gray-600">Agenda sua consulta em poucos cliques. Escolha médico, especialidade e horário que melhor te atende.</p>
            </div>
            <div className="card-hover bg-gray-50 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Videochamada HD</h3>
              <p className="text-gray-600">Conexão de alta qualidade para consultas por vídeo com médicos em tempo real.</p>
            </div>
            <div className="card-hover bg-gray-50 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Receitas Digitais</h3>
              <p className="text-gray-600">Receba suas prescrições de forma digital, assinadas electronicamente pelos médicos.</p>
            </div>
            <div className="card-hover bg-gray-50 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Uma plataforma completa para consultas médicas online com recursos avançados de telemedicina</h3>
            </div>
            <div className="card-hover bg-gray-50 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Mensagens Seguras</h3>
              <p className="text-gray-600">Comunique-se com seu médico através de mensagens seguras e criptografadas.</p>
            </div>
            <div className="card-hover bg-gray-50 p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-7 h-7 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Disponibilidade 24/7</h3>
              <p className="text-gray-600">Atenção médica disponível a qualquer hora, todos os dias da semana.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sky-500 font-medium">Como Funciona</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Simples em 3 passos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cadastre-se</h3>
              <p className="text-gray-600">Crie sua conta em menos de 2 minutos</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Escolha seu Médico</h3>
              <p className="text-gray-600">Selecione especialidade e horário disponível</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Consulta Online</h3>
              <p className="text-gray-600">Conecte-se por vídeo no horário agendado</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-sky-500 to-cyan-400">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Pronto para cuidar da sua saúde?</h2>
          <p className="text-xl text-white/80 mb-8">Junte-se a milhares de pacientes que já utilizam a TelemedicinaPro</p>
          <button onClick={() => user ? setShowDoctors(true) : router.push("/register")} className="inline-block bg-white text-sky-500 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-xl">
            Criar Conta Grátis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                  </svg>
                </div>
                <span className="text-white font-bold">TelemedicinaPro</span>
              </div>
              <p className="text-sm">Saúde digital ao alcance de todos.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-white transition">Planos</a></li>
                <li><a href="#" className="hover:text-white transition">Médicos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition">Carreiras</a></li>
                <li><a href="#" className="hover:text-white transition">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacidade" className="hover:text-white transition">Política de Privacidade</a></li>
                <li><a href="/termos" className="hover:text-white transition">Termos de Uso</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
            <p>© 2026 TelemedicinaPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}