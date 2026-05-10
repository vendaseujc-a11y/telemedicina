"use client";

import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRole } from "@/types";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        alert("✓ Código verificado com sucesso! Agora você pode completar seu cadastro.");
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      setLoading(false);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      setError("A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número");
      setLoading(false);
      return;
    }

    if (role === "medico" && !codeVerified) {
      setError("Você precisa verificar o código de registro primeiro");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          specialty: role === "medico" ? specialty : null,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        name,
        role,
        specialty: role === "medico" ? specialty : null,
      });

      if (profileError) {
        setError(profileError.message);
        return;
      }
    }

    router.push("/login?registered=true");
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-6">Cadastrar</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sou um
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setRole("paciente"); setCodeVerified(false); }}
                className={`flex-1 py-3 rounded-lg border-2 transition ${
                  role === "paciente"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">🧑‍⚕️</div>
                <div className="text-sm font-medium">Paciente</div>
              </button>
              <button
                type="button"
                onClick={() => setRole("medico")}
                className={`flex-1 py-3 rounded-lg border-2 transition ${
                  role === "medico"
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-2xl mb-1">👨‍⚕️</div>
                <div className="text-sm font-medium">Médico</div>
              </button>
            </div>
          </div>

          {role === "medico" && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  Para se cadastrar como médico, você precisa de um código de registro.
                  Solicite o código ao administrador.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value.toUpperCase())}
                    placeholder="Digite o código"
                    className="flex-1 px-4 py-2 border rounded-lg"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    disabled={requestingCode}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm"
                  >
                    {requestingCode ? "Autenticando..." : "Autenticar Código"}
                  </button>
                </div>
                {codeVerified && (
                  <p className="text-green-600 text-sm mt-2">✓ Código verificado com sucesso!</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidade
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
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
            </>
          )}

          <button
            type="submit"
            disabled={loading || (role === "medico" && !codeVerified)}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={handleGoogleSignup}
            className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <span>🔵</span> Cadastrar com Google
          </button>
        </div>

        <p className="mt-4 text-center text-gray-600">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}