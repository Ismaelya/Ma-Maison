"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Phone, Building2, UserCheck, ArrowRight, CheckCircle2 } from "lucide-react";
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
  const [emailSent, setEmailSent] = useState(true);
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
      acceptTerms: false,
    },
  });

  const selectedRole = (watch("role") || "TENANT").toUpperCase();
  const isTermsAccepted = watch("acceptTerms");

  async function onSubmit(data: RegisterFormData) {
    setServerError(null);
    const normalizedRole = data.role.toUpperCase();

    try {
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

      const wasEmailSent = result.emailSent !== false;
      setEmailSent(wasEmailSent);
      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg = err?.message || "Erreur réseau lors de l'inscription.";
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)] p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-[540px] rounded-[28px] bg-white p-6 shadow-2xl sm:p-9"
      >
        {/* Header */}
        <div className="mb-7 space-y-3 text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-bold text-[var(--color-text)] sm:text-3xl">
              Rejoignez Ma Maison
            </h1>
            <p className="text-sm text-stone-500 font-sans">
              Créez votre compte en 1 minute
            </p>
          </div>
        </div>

          {isSuccess ? (
            <div
              className={cn(
                "rounded-3xl border p-8 text-center space-y-4 animate-scale-in",
                emailSent
                  ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/30"
                  : "border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/30"
              )}
            >
              <div
                className={cn(
                  "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl",
                  emailSent
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
                )}
              >
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2
                className={cn(
                  "text-h4 font-bold font-heading",
                  emailSent ? "text-emerald-900 dark:text-emerald-300" : "text-amber-900 dark:text-amber-300"
                )}
              >
                {emailSent ? "Vérifiez votre boîte de réception" : "Compte créé"}
              </h2>
              <p
                className={cn(
                  "text-sm max-w-md mx-auto font-sans",
                  emailSent ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-400"
                )}
              >
                {emailSent
                  ? "Un email de confirmation vous a été envoyé. Cliquez sur le lien qu'il contient pour activer votre compte avant de vous connecter."
                  : "Compte créé, mais l'email n'a pas pu être envoyé — réessayez depuis la page de connexion."}
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
                <div className="mb-5 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-xs font-medium text-red-700 dark:text-red-400 animate-fade-in">
                  {serverError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Role Selection */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 font-sans">
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
                          "flex flex-col items-center justify-center gap-1 p-3 rounded-2xl border-2 transition-all text-center bg-stone-50 dark:bg-slate-800",
                          selectedRole === roleOpt.value
                            ? "border-[var(--color-secondary-500)] bg-white shadow-[0_0_0_4px_rgba(5,203,173,0.12)]"
                            : "border-transparent hover:border-stone-200 dark:hover:border-stone-600 hover:bg-stone-100 dark:hover:bg-slate-700"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity",
                            selectedRole !== roleOpt.value && "opacity-60"
                          )}
                          style={{ background: "linear-gradient(135deg, #102281 0%, #05CBAD 100%)" }}
                        >
                          {roleOpt.icon}
                        </div>
                        <span
                          className={cn(
                            "text-xs font-bold font-heading",
                            selectedRole === roleOpt.value ? "text-[var(--color-primary-text)]" : "text-stone-600 dark:text-stone-300"
                          )}
                        >
                          {roleOpt.label}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-300 font-sans">{roleOpt.desc}</span>
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
                    variant="filled"
                  />

                  <Input
                    label="Adresse e-mail *"
                    type="email"
                    placeholder="votre.email@exemple.com"
                    leftIcon={<Mail className="h-4 w-4 text-stone-400" />}
                    {...register("email")}
                    error={errors.email?.message}
                    variant="filled"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Téléphone (optionnel)"
                    placeholder="+227 90 00 00 00"
                    leftIcon={<Phone className="h-4 w-4 text-stone-400" />}
                    {...register("phone")}
                    error={errors.phone?.message}
                    variant="filled"
                  />

                  {selectedRole === "AGENCY" && (
                    <Input
                      label="Nom de l'agence immobilière *"
                      placeholder="Ex: Agence Sahel Immo"
                      leftIcon={<Building2 className="h-4 w-4 text-stone-400" />}
                      {...register("agencyName")}
                      error={errors.agencyName?.message}
                      variant="filled"
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
                    variant="filled"
                  />

                  <Input
                    label="Confirmer le mot de passe *"
                    type="password"
                    placeholder="••••••••"
                    leftIcon={<Lock className="h-4 w-4 text-stone-400" />}
                    {...register("confirmPassword")}
                    error={errors.confirmPassword?.message}
                    variant="filled"
                  />
                </div>

                {/* Consentement CGU et Confidentialité */}
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      {...register("acceptTerms")}
                      className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[var(--color-primary-text)] focus:ring-[var(--color-primary-text)] cursor-pointer"
                    />
                    <span className="text-xs text-stone-600 font-sans leading-snug">
                      J&apos;ai lu et j&apos;accepte les{" "}
                      <Link
                        href="/conditions-generales"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--color-primary-text)] underline hover:text-stone-900"
                      >
                        Conditions Générales d&apos;Utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link
                        href="/confidentialite"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[var(--color-primary-text)] underline hover:text-stone-900"
                      >
                        Politique de Confidentialité
                      </Link>
                      . *
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-[11px] font-medium text-red-500 pl-7">
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSubmitting}
                  disabled={!isTermsAccepted || isSubmitting}
                  className="rounded-2xl border-0 text-white shadow-[0_10px_30px_rgba(5,203,173,0.35)] transition-transform hover:scale-[1.01] hover:shadow-[0_12px_36px_rgba(5,203,173,0.45)] disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #102281 0%, #05CBAD 100%)" }}
                >
                  Créer mon compte
                </Button>
              </form>
            </>
          )}

          {/* Footer */}
          <div className="mt-6 border-t border-stone-200 dark:border-stone-800 pt-6 text-center text-xs text-stone-500 dark:text-stone-400 font-sans">
            Vous avez déjà un compte ?{" "}
            <Link
              href={
                typeof window !== "undefined" && new URLSearchParams(window.location.search).get("redirectTo")
                  ? `/connexion?redirectTo=${encodeURIComponent(new URLSearchParams(window.location.search).get("redirectTo")!)}`
                  : "/connexion"
              }
              className="font-bold text-[var(--color-primary-text)] hover:underline inline-flex items-center gap-1"
            >
              Se connecter <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
      </motion.div>
    </div>
  );
}

