"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      router.push("/login?error=auth_failed");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      await supabase.from("profiles").insert({
        id: user.id,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || "paciente",
        specialty: user.user_metadata?.specialty || null,
      });
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Completando login...</p>
      </div>
    </div>
  );
}