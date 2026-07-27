"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast-notification";

export default function ConnexionPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setServerError(null);
    const supabase = createClient();

    // 1. Try browser client sign-in directly for fast session sync
    const { data: authResult, error: clientAuthError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    let loggedUser = authResult?.user;

    // 2. If client sign-in failed, fallback to API route
    if (clientAuthError || !loggedUser) {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Email ou mot de passe incorrect.";
        setServerError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      loggedUser = result.user;
    }

    if (!loggedUser) {
      setServerError("Impossible de récupérer la session utilisateur.");
      return;
    }

    // 3. Query user profile to determine redirect role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", loggedUser.id)
      .single();

    const role = String(profile?.role || "").toUpperCase();
    const status = String(profile?.status || "").toUpperCase();

    if (status === "SUSPENDED") {
      toast.error("Votre compte est suspendu.");
      router.push("/compte-suspendu");
      return;
    }

    toast.success("Connexion réussie ! Redirection...");

    if (role === "ADMIN") {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-card)] animate-fade-in text-left">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="text-h3 font-bold text-[var(--color-text)]">Connexion à votre compte</h1>
          <p className="text-small text-neutral-500">
            Accédez à votre espace Ma Maison Niger
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-xs font-medium text-[var(--color-danger)] animate-fade-in">
            {serverError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Adresse e-mail *"
            type="email"
            placeholder="votre.email@exemple.com"
            leftIcon={<Mail className="h-4 w-4" />}
            {...register("email")}
            error={errors.email?.message}
          />

          <div className="space-y-1">
            <Input
              label="Mot de passe *"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              {...register("password")}
              error={errors.password?.message}
            />
            <div className="flex justify-end pt-1">
              <Link
                href="/mot-de-passe-oublie"
                className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            leftIcon={<LogIn className="h-4 w-4" />}
          >
            Se connecter
          </Button>
        </form>

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] pt-6 text-center text-xs text-neutral-500">
          Vous n&apos;avez pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            S&apos;inscrire <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
