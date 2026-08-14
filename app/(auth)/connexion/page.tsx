"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { motion } from "framer-motion";
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

    let loggedUser: any = null;
    let userRole = "";
    let userStatus = "";

    try {
      // 1. Call API route to authenticate and establish server cookies
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        loggedUser = result.user;
        userRole = String(result.profile?.role || "").toUpperCase();
        userStatus = String(result.profile?.status || "").toUpperCase();

        // Sync browser client session
        try {
          await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
          });
        } catch {
          // Non-critical if browser client auto-refreshes from cookie
        }
      } else {
        // Fallback: direct browser client sign-in
        const { data: authResult, error: clientAuthError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (clientAuthError || !authResult?.user) {
          const errorMsg = result.error || clientAuthError?.message || "Email ou mot de passe incorrect.";
          setServerError(errorMsg);
          toast.error(errorMsg);
          return;
        }

        loggedUser = authResult.user;
      }
    } catch (err: any) {
      // Network fallback
      const { data: authResult, error: clientAuthError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (clientAuthError || !authResult?.user) {
        const errorMsg = err?.message || "Erreur de connexion.";
        setServerError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      loggedUser = authResult.user;
    }

    if (!loggedUser) {
      setServerError("Impossible de récupérer la session utilisateur.");
      return;
    }

    // Determine role if not already obtained
    if (!userRole) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", loggedUser.id)
        .single();

      userRole = String(profile?.role || loggedUser.user_metadata?.role || "").toUpperCase();
      userStatus = String(profile?.status || "").toUpperCase();
    }

    if (userStatus === "SUSPENDED") {
      toast.error("Votre compte est suspendu.");
      router.push("/compte-suspendu");
      return;
    }

    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const redirectTo = searchParams?.get("redirectTo");

    let target = "/dashboard";
    if (userRole === "ADMIN") {
      target = "/admin";
    } else if (redirectTo && redirectTo.startsWith("/")) {
      target = redirectTo;
    }

    window.location.href = target;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4 sm:p-6 lg:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-2xl md:grid-cols-2"
      >
        {/* Left Side: Brand Showcase Panel (Desktop split / stacked mobile) */}
        <div className="relative flex flex-col justify-between bg-[var(--color-primary-950)] p-8 text-white md:p-12 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--color-secondary-500)]/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--color-primary-400)]/10 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <Logo variant="light" />
            <div className="pt-6 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-secondary-400)]/30 bg-[var(--color-secondary-400)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-secondary-400)]">
            Espace Membre
              </span>
              <h2 className="text-2xl font-bold font-heading leading-tight text-white sm:text-3xl">
                La référence immobilière de confiance au Niger
              </h2>
              <p className="text-sm leading-relaxed text-stone-300 font-sans">
                Accédez à des centaines d&apos;annonces exclusives, contactez directement les propriétaires et gérez vos biens en toute simplicité.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 space-y-3 border-t border-white/10 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-secondary-400)]" />
              <span>Mettez-vous en relation avec des propriétaires</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--color-secondary-400)]" />
              <span>Plateforme immobilière au Niger</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 bg-white text-left">
          {/* Header */}
          <div className="space-y-2 mb-6">
            <h1 className="text-h3 font-bold text-[var(--color-text)] font-heading">Connexion à votre compte</h1>
            <p className="text-small text-stone-500 dark:text-stone-400 font-sans">
              Accédez à votre espace Ma Maison Niger
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-xs font-medium text-red-700 dark:text-red-400 animate-fade-in">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Adresse e-mail *"
              type="email"
              placeholder="votre.email@exemple.com"
              leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
              {...register("email")}
              error={errors.email?.message}
            />

            <div className="space-y-1">
              <Input
                label="Mot de passe *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                {...register("password")}
                error={errors.password?.message}
              />
              <div className="flex justify-end pt-1">
                <Link
                  href="/mot-de-passe-oublie"
                  className="text-xs font-semibold text-[var(--color-primary-text)] hover:underline"
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
          <div className="mt-8 border-t border-stone-200 dark:border-stone-800 pt-6 text-center text-xs text-stone-500 dark:text-stone-400">
            Vous n&apos;avez pas encore de compte ?{" "}
            <Link
              href={
                typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirectTo")
                  ? `/inscription?redirectTo=${encodeURIComponent(new URLSearchParams(window.location.search).get("redirectTo")!)}`
                  : "/inscription"
              }
              className="font-bold text-[var(--color-primary-text)] hover:underline inline-flex items-center gap-1"
            >
              S&apos;inscrire <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

