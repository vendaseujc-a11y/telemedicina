"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Profile } from "@/types";

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
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
    loadDoctors();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setMenuOpen(false);
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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <span className="text-zinc-500 text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                Vita<span className="text-primary">Link</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-zinc-600 hover:text-primary text-sm font-medium transition-colors">Como funciona</a>
              <a href="#features" className="text-zinc-600 hover:text-primary text-sm font-medium transition-colors">Serviços</a>
              <a href="#doctors" className="text-zinc-600 hover:text-primary text-sm font-medium transition-colors">Médicos</a>
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-zinc-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                      </svg>
                    </div>
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 py-2 animate-fade-in">
                      <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50">Meu painel</Link>
                      <button onClick={handleSignOut} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Sair</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/login" className="btn-ghost hidden sm:block">Entrar</Link>
                  <Link href="/register" className="btn-primary text-sm py-2.5">Começar agora</Link>
                </>
              )}
              
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -mr-2">
                <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-zinc-100 px-4 py-4 space-y-3 animate-slide-up">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="block py-2 text-zinc-700 font-medium">Como funciona</a>
            <a href="#features" onClick={() => setMenuOpen(false)} className="block py-2 text-zinc-700 font-medium">Serviços</a>
            <a href="#doctors" onClick={() => setMenuOpen(false)} className="block py-2 text-zinc-700 font-medium">Médicos</a>
            {!user && (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-zinc-700 font-medium">Entrar</Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="block py-2 text-primary font-medium">Começar agora</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-full mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                <span className="text-primary text-xs font-medium">Teleconsultas disponíveis agora</span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-900 leading-[1.15] mb-5 tracking-tight">
                Saúde na palma da <span className="text-primary">mão</span>
              </h1>
              
              <p className="text-lg text-zinc-600 mb-8 leading-relaxed max-w-xl">
                Conecte-se com médicos certificados em minutos. Sem filas, sem deslocamento. 
                Sua consulta por videochamada começa aqui.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <button 
                  onClick={() => user ? setShowDoctors(true) : router.push("/register")} 
                  className="btn-primary text-center text-base"
                >
                  Agendar consulta
                  <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </button>
                <a href="#how-it-works" className="btn-secondary text-center text-base">
                  Saber mais
                </a>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex -space-x-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-zinc-700">A</div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-zinc-700">B</div>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-300 border-2 border-white flex items-center justify-center text-xs font-semibold text-zinc-700">C</div>
                  <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-xs font-semibold text-primary">+2k</div>
                </div>
                <div className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">4.9</span> avaliação média
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-3xl blur-3xl"></div>
              <div className="relative bg-white rounded-2xl shadow-xl border border-zinc-100 overflow-hidden p-1">
                <div className="bg-zinc-50 rounded-xl p-4 sm:p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                      👨‍⚕️
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-zinc-900 text-sm sm:text-base">Dra. Amanda Costa</div>
                      <div className="text-xs sm:text-sm text-zinc-500">Dermatologista • CRM 123456</div>
                    </div>
                    <div className="badge badge-success text-xs">Online</div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 border border-zinc-100">
                    <div className="flex items-center gap-2 text-zinc-600 text-xs sm:text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-soft"></div>
                      <span>Em consulta com João S.</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <button className="bg-primary/10 text-primary py-2.5 sm:py-3 rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                      <span className="hidden sm:inline">Video</span>
                    </button>
                    <button className="bg-zinc-100 text-zinc-600 py-2.5 sm:py-3 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                      </svg>
                      <span className="hidden sm:inline">Chat</span>
                    </button>
                    <button className="bg-red-500 text-white py-2.5 sm:py-3 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"/>
                      </svg>
                      <span className="hidden sm:inline">Fim</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">Tudo em 3 passos simples</h2>
            <p className="text-zinc-500 max-w-md mx-auto">Comece sua consulta em minutos, sem complicação</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-8 sm:gap-10">
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <span className="text-2xl sm:text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Escolha a especialidade</h3>
              <p className="text-sm text-zinc-500">Encontre o especialista perfeito para sua necessidade</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <span className="text-2xl sm:text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Agende seu horário</h3>
              <p className="text-sm text-zinc-500">Escolha um horário disponível que funcione para você</p>
            </div>
            <div className="text-center group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <span className="text-2xl sm:text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Consulte por vídeo</h3>
              <p className="text-sm text-zinc-500">Conecte-se com o médico no horário agendado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-3">Por que escolher a VitaLink?</h2>
            <p className="text-zinc-500 max-w-md mx-auto">Uma experiência de saúde digitalpensada para você</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Agendamento rápido</h3>
              <p className="text-sm text-zinc-500">Consulte disponíveis em tempo real e reserve seu horário em segundos</p>
            </div>
            
            <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Videochamada HD</h3>
              <p className="text-sm text-zinc-500">Conexão estável e qualidade de imagem para sua tranquilidade</p>
            </div>
            
            <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Receitas digitais</h3>
              <p className="text-sm text-zinc-500">Receba suas prescrições de forma segura no seu email</p>
            </div>
            
            <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">24 horas por dia</h3>
              <p className="text-sm text-zinc-500">Atenção médica disponível a qualquer hora, todos os dias</p>
            </div>
            
            <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Médicos certificados</h3>
              <p className="text-sm text-zinc-500">Todos os profissionais são rigorosamente selecionados</p>
            </div>
            
            <div className="card p-5 sm:p-6 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Dados protegidos</h3>
              <p className="text-sm text-zinc-500">Sua privacidade é nossa prioridade com criptografia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Search */}
      {showDoctors && (
        <section id="doctors" className="py-16 sm:py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">Encontre seu médico</h2>
                <p className="text-zinc-500">Especialistas disponíveis para consulta</p>
              </div>
              <button onClick={() => setShowDoctors(false)} className="btn-ghost text-sm self-start">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Fechar
              </button>
            </div>

            <div className="card p-4 sm:p-6 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-zinc-600 mb-1.5">Especialidade</label>
                  <select 
                    value={searchSpecialty}
                    onChange={(e) => setSearchSpecialty(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Todas as especialidades</option>
                    {specialties.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:self-end">
                  <button 
                    onClick={handleSearch}
                    className="btn-primary w-full sm:w-auto text-sm"
                  >
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : doctors.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="card p-5 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl shrink-0">
                        {doctor.avatar_url ? (
                          <img src={doctor.avatar_url} alt={doctor.name} className="w-14 h-14 rounded-full object-cover" />
                        ) : "👨‍⚕️"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-zinc-900 truncate">{doctor.name}</h3>
                        <p className="text-sm text-zinc-500 truncate">{specialties.find(s => s.value === doctor.specialty)?.label || doctor.specialty}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setBookingDoctor(doctor)}
                      className="btn-primary w-full text-sm"
                    >
                      Agendar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p className="text-zinc-500">Nenhum médico encontrado</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Pronto para sua primeira consulta?</h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">Junte-se a milhares de pacientes que já descobriram a facilidade de consultar online</p>
          <button 
            onClick={() => user ? setShowDoctors(true) : router.push("/register")} 
            className="bg-white text-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-zinc-100 transition-all hover:scale-105 inline-flex items-center gap-2"
          >
            Criar conta gratuita
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">VitaLink</span>
              </div>
              <p className="text-zinc-400 text-sm">Saúde digital acessível para todos.</p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Navegação</h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Como funciona</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Serviços</a></li>
                <li><a href="#doctors" className="hover:text-white transition-colors">Médicos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                <li><a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="/termos" className="hover:text-white transition-colors">Termos</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Contato</h4>
              <ul className="space-y-2.5 text-sm text-zinc-400">
                <li>contato@vitalink.com.br</li>
                <li>CNPJ: 00.000.000/0001-00</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-zinc-800 mt-10 pt-8 text-center text-sm text-zinc-500">
            © 2026 VitaLink. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-md animate-slide-up">
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-zinc-900">Agendar consulta</h3>
                <button onClick={() => setBookingDoctor(null)} className="p-2 -mr-2 hover:bg-zinc-100 rounded-xl transition-colors">
                  <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {bookingSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-zinc-900 mb-2">Consulta agendada!</h4>
                  <p className="text-zinc-500 text-sm">Você receberá a confirmação por email.</p>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-5">
                  {bookingError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                      {bookingError}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">👨‍⚕️</div>
                    <div>
                      <div className="font-medium text-zinc-900 text-sm">{bookingDoctor.name}</div>
                      <div className="text-xs text-zinc-500">{specialties.find(s => s.value === bookingDoctor.specialty)?.label}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Data</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="input-field text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5">Horário</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="input-field text-sm"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setBookingDoctor(null)}
                      className="btn-secondary flex-1 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="btn-primary flex-1 text-sm"
                    >
                      {bookingLoading ? "Agendando..." : "Confirmar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}