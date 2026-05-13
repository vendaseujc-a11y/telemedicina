"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types";
import { validatePassword } from "@/lib/security";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("paciente");
  const [specialty, setSpecialty] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const router = useRouter();

  async function handleRequestCode() {
    if (!registrationCode) {
      setError("Digite o código de registro primeiro");
      return;
    }
    
    setRequestingCode(true);
    setError("");

    try {
      const res = await fetch(`/api/verify-code?code=${registrationCode.toUpperCase()}`);
      const data = await res.json();

      if (data.success) {
        setCodeVerified(true);
      } else {
        setError(data.error || "Código inválido");
        setCodeVerified(false);
      }
    } catch (err) {
      setError("Erro ao verificar código");
      setCodeVerified(false);
    }

    setRequestingCode(false);
  }

  const getNameParts = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    const firstName = parts[0] || "";
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    return { firstName, lastName };
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { firstName, lastName } = getNameParts(name);
    const passwordValidation = validatePassword(password, firstName, lastName);
    
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || "Senha inválida");
      setLoading(false);
      return;
    }

    if (role === "medico" && !codeVerified) {
      setError("Verifique o código de registro primeiro");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          password, 
          name, 
          role, 
          specialty: role === "medico" ? specialty : null,
          registrationCode: role === "medico" ? registrationCode : null
        }),
      });
      
      const data = await res.json();
      
      setLoading(false);
      
      if (!res.ok) {
        setError(data.error || "Erro ao fazer cadastro");
        return;
      }
      
      router.push("/login?registered=true");
    } catch (err) {
      setLoading(false);
      setError("Erro ao fazer cadastro");
    }
  }

  async function handleGoogleSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="p-4 sm:p-6">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-zinc-900">Vita<span className="text-primary">Link</span></span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Criar conta</h1>
            <p className="text-zinc-500">Preencha seus dados para começar</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Seu nome"
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="seu@email.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="Mín. 7 caracteres"
                  required
                  minLength={7}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Mínimo 7 caracteres, com letra maiúscula e número</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">Tipo de conta</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole("paciente"); setCodeVerified(false); }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "paciente"
                      ? "border-primary bg-primary/5"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="text-2xl mb-1">🧑‍⚕️</div>
                  <div className="text-sm font-medium text-zinc-700">Paciente</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("medico")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "medico"
                      ? "border-primary bg-primary/5"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍⚕️</div>
                  <div className="text-sm font-medium text-zinc-700">Médico</div>
                </button>
              </div>
            </div>

            {role === "medico" && (
              <div className="space-y-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-sm text-amber-800">
                  Para se cadastrar como médico, você precisa de um código de registro.
                </p>
                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1.5">Código de registro</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={registrationCode}
                      onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
                      placeholder="Digite o código"
                      className="input-field text-sm flex-1"
                      maxLength={20}
                      disabled={codeVerified}
                    />
                    <button
                      type="button"
                      onClick={handleRequestCode}
                      disabled={requestingCode || codeVerified || !registrationCode}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        codeVerified 
                          ? "bg-emerald-500 text-white" 
                          : "bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                      }`}
                    >
                      {codeVerified ? "✓" : requestingCode ? "..." : "Verificar"}
                    </button>
                  </div>
                  {codeVerified && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      Código verificado
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-800 mb-1.5">Especialidade</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="input-field text-sm"
                    required={role === "medico"}
                  >
                    <option value="">Selecione...</option>
                    <option value="clinico_geral">Clínico Geral</option>
                    <option value="cardiologia">Cardiologia</option>
                    <option value="dermatologia">Dermatologia</option>
                    <option value="pediatria">Pediatria</option>
                    <option value="psicologia">Psicologia</option>
                    <option value="psiquiatria">Psiquiatria</option>
                    <option value="ortopedia">Ortopedia</option>
                    <option value="ginecologia">Ginecologia</option>
                    <option value="neurologia">Neurologia</option>
                    <option value="oftalmologia">Oftalmologia</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (role === "medico" && !codeVerified)}
              className="btn-primary w-full"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Cadastrando...
                </span>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-zinc-400">ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignup}
            className="btn-secondary w-full flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}