"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Phone, Building2, UserCheck, ShieldCheck, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast-notification";
import { cn } from "@/lib/utils";

export default function InscriptionPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "TENANT",
    },
  });

  const selectedRole = (watch("role") || "TENANT").toUpperCase();

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    const supabase = createClient();
    const normalizedRole = data.role.toUpperCase();

    // 1. Attempt client sign up
    let { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.fullName,
          phone: data.phone || "",
          role: normalizedRole,
          agencyName: normalizedRole === "AGENCY" ? data.agencyName || "" : null,
        },
      },
    });

    // 2. Fallback to API route if client signUp returned error
    if (error || !signUpData.user) {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.fullName,
          phone: data.phone || "",
          role: normalizedRole,
          agencyName: normalizedRole === "AGENCY" ? data.agencyName || "" : null,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        const errorMsg = result.error || "Erreur lors de la création du compte.";
        setServerError(errorMsg);
        toast.error(errorMsg);
        return;
      }
    }

    setIsSuccess(true);
    toast.success("Compte créé ! Vérifiez votre boîte de réception.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4 sm:p-6 lg:p-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white shadow-2xl md:grid-cols-12"
      >
        {/* Left Side: Brand Panel */}
        <div className="relative flex flex-col justify-between bg-[var(--color-primary-950)] p-8 text-white md:col-span-5 md:p-10 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[var(--color-secondary-500)]/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[var(--color-primary-400)]/10 blur-3xl" />

          <div className="relative z-10 space-y-6">
            <Logo variant="light" />
            <div className="pt-4 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-secondary-400)]/30 bg-[var(--color-secondary-400)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-secondary-400)]">
                <Sparkles className="h-3.5 w-3.5" /> Inscription Gratuite
              </span>
              <h2 className="text-2xl font-bold font-heading leading-tight text-white sm:text-3xl">
                Rejoignez le réseau immobilier d&apos;exception
              </h2>
              <p className="text-sm leading-relaxed text-stone-300 font-sans">
                Créez votre compte en 1 minute. Que vous soyez locataire, propriétaire ou agence, Ma Maison s&apos;adapte à vos besoins.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-8 space-y-3 border-t border-white/10 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--color-secondary-400)]" />
              <span>Publication illimitée pour les propriétaires</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[var(--color-secondary-400)]" />
              <span>Mise en relation directe et sécurisée</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 bg-white text-left md:col-span-7">
          {/* Header */}
          <div className="space-y-2 mb-6">
            <h1 className="text-h3 font-bold text-[var(--color-text)] font-heading">Créer votre compte</h1>
            <p className="text-small text-stone-500 font-sans">
              Rejoignez la plateforme immobilière de référence au Niger
            </p>
          </div>

          {isSuccess ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-4 animate-scale-in">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-h4 font-bold text-emerald-900 font-heading">Vérifiez votre boîte de réception</h2>
              <p className="text-sm text-emerald-700 max-w-md mx-auto font-sans">
                Un email de confirmation vous a été envoyé. Cliquez sur le lien qu&apos;il contient pour activer votre compte avant de vous connecter.
              </p>
              <div className="pt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
                    const redirectTo = searchParams?.get("redirectTo");
                    if (redirectTo) {
                      router.push(`/connexion?redirectTo=${encodeURIComponent(redirectTo)}`);
                    } else {
                      router.push("/connexion");
                    }
                  }}
                >
                  Aller à la connexion
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Server Error Alert */}
              {serverError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700 animate-fade-in">
                  {serverError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Role Selection */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 font-sans">
                    Je m&apos;inscris en tant que *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { value: "TENANT", label: "Locataire", icon: <UserCheck className="h-4 w-4" />, desc: "Cherche bien" },
                      { value: "OWNER", label: "Propriétaire", icon: <User className="h-4 w-4" />, desc: "Publie des biens" },
                      { value: "AGENCY", label: "Agence", icon: <Building2 className="h-4 w-4" />, desc: "Équipe & agence" },
                    ].map((roleOpt) => (
                      <button
                        key={roleOpt.value}
                        type="button"
                        onClick={() => setValue("role", roleOpt.value as any)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center",
                          selectedRole === roleOpt.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold shadow-sm"
                            : "border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                        )}
                      >
                        <div className="mb-1">{roleOpt.icon}</div>
                        <span className="text-xs font-bold font-heading">{roleOpt.label}</span>
                        <span className="text-[10px] text-stone-400 font-sans">{roleOpt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Nom complet *"
                    placeholder="Ex: Ibrahim Boubacar"
                    leftIcon={<User className="h-4 w-4 text-stone-400" />}
                    {...register("fullName")}
                    error={errors.fullName?.message}
                  />

                  <Input
                    label="Adresse e-mail *"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
                    {...register("email")}
                    error={errors.email?.message}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone (optionnel)"
                    placeholder="+227 90 00 00 00"
                    leftIcon={<Phone className="h-4 w-4 text-stone-400" />}
                    {...register("phone")}
                    error={errors.phone?.message}
                  />

                  {selectedRole === "AGENCY" && (
                    <Input
                      label="Nom de l'agence immobilière *"
                      placeholder="Ex: Agence Sahel Immo"
                      leftIcon={<Building2 className="h-4 w-4 text-stone-400" />}
                      {...register("agencyName")}
                      error={errors.agencyName?.message}
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Mot de passe *"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                    {...register("password")}
                    error={errors.password?.message}
                    helperText="Au moins 8 car., 1 majuscule, 1 chiffre."
                  />

                  <Input
                    label="Confirmer le mot de passe *"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                  />
                </div>

                {/* Free plan info banner */}
                {(selectedRole === "OWNER" || selectedRole === "AGENCY") && (
                  <div className="rounded-xl border border-[var(--color-secondary-500)]/30 bg-[var(--color-secondary-500)]/10 p-3.5 text-xs text-[var(--color-text)] flex items-start gap-2.5 font-sans">
                    <ShieldCheck className="h-4 w-4 text-[var(--color-secondary-600)] flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Compte Gratuit inclus :</strong> publication illimitée et accès immédiat sans carte bancaire.
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                >
                  Créer mon compte
                </Button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 border-t border-stone-200 pt-6 text-center text-xs text-stone-500 font-sans">
            Vous avez déjà un compte ?{" "}
            <Link
              href={
                typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirectTo")
                  ? `/connexion?redirectTo=${encodeURIComponent(new URLSearchParams(window.location.search).get("redirectTo")!)}`
                  : "/connexion"
              }
              className="font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              Se connecter <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

