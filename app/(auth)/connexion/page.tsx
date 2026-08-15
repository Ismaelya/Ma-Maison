"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast-notification";

export default function ConnexionPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("ma_maison_returning_user")) {
        setIsReturningUser(true);
      }
    } catch {
      // Ignore localStorage read errors (e.g. privacy modes)
    }
  }, []);

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

    try {
      localStorage.setItem("ma_maison_returning_user", "true");
    } catch {
      // Ignore localStorage write errors
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[480px] rounded-[28px] bg-white p-6 shadow-2xl sm:p-9"
      >
        {/* Header */}
        <div className="mb-7 space-y-3 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              {isReturningUser ? "Content de vous revoir" : "Bienvenue sur Ma Maison"}
            </h1>
            <p className="text-sm text-stone-500 font-sans">
              Accédez à votre espace Ma Maison Niger
            </p>
          </div>
        </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-xs font-medium text-red-700 dark:text-red-400 animate-fade-in">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Adresse e-mail"
              type="email"
              placeholder="votre.email@exemple.com"
              leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
              {...register("email")}
              error={errors.email?.message}
              variant="filled"
            />

            <div className="space-y-1">
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                {...register("password")}
                error={errors.password?.message}
                variant="filled"
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
              className="rounded-2xl border-0 text-white shadow-[0_10px_30px_rgba(5,203,173,0.35)] transition-transform hover:scale-[1.01] hover:shadow-[0_12px_36px_rgba(5,203,173,0.45)]"
              style={{ background: "linear-gradient(135deg, #102281 0%, #05CBAD 100%)" }}
            >
              Se connecter
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-7 border-t border-stone-200 dark:border-stone-800 pt-6 text-center text-xs text-stone-500 dark:text-stone-400">
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
      </motion.div>
    </div>
  );
}

