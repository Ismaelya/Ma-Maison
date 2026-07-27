"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User, Phone, Building2, UserCheck, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";
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

    // 3. Attempt immediate auto sign in
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    setIsSuccess(true);
    toast.success("Compte créé avec succès ! Votre espace est prêt.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl space-y-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-card)] animate-fade-in text-left">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="text-h3 font-bold text-[var(--color-text)]">Créer votre compte</h1>
          <p className="text-small text-neutral-500">
            Rejoignez la plateforme immobilière de référence au Niger
          </p>
        </div>

        {isSuccess ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-4 animate-scale-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-h4 font-bold text-emerald-900">Inscription réussie !</h2>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              Votre compte a été créé avec succès. Si vous êtes propriétaire ou agence, votre **essai gratuit de 30 jours** est automatiquement actif.
            </p>
            <div className="pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/connexion")}
              >
                Se connecter maintenant
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Server Error Alert */}
            {serverError && (
              <div className="rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-4 text-xs font-medium text-[var(--color-danger)] animate-fade-in">
                {serverError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                  Je m&apos;inscris en tant que *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: "TENANT", label: "Locataire", icon: <UserCheck className="h-4 w-4" />, desc: "Cherche logement" },
                    { value: "OWNER", label: "Propriétaire", icon: <User className="h-4 w-4" />, desc: "Publie ses biens" },
                    { value: "AGENCY", label: "Agence", icon: <Building2 className="h-4 w-4" />, desc: "Équipe & agence" },
                  ].map((roleOpt) => (
                    <button
                      key={roleOpt.value}
                      type="button"
                      onClick={() => setValue("role", roleOpt.value as any)}
                      className={cn(
                        "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all text-center",
                        selectedRole === roleOpt.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)] font-semibold"
                          : "border-[var(--color-border)] text-neutral-600 hover:border-neutral-300"
                      )}
                    >
                      <div className="mb-1">{roleOpt.icon}</div>
                      <span className="text-xs font-bold">{roleOpt.label}</span>
                      <span className="text-[10px] text-neutral-400">{roleOpt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom complet *"
                  placeholder="Ex: Ibrahim Boubacar"
                  leftIcon={<User className="h-4 w-4" />}
                  {...register("fullName")}
                  error={errors.fullName?.message}
                />

                <Input
                  label="Adresse e-mail *"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Téléphone (optionnel)"
                  placeholder="+227 90 00 00 00"
                  leftIcon={<Phone className="h-4 w-4" />}
                  {...register("phone")}
                  error={errors.phone?.message}
                />

                {selectedRole === "AGENCY" && (
                  <Input
                    label="Nom de l'agence immobilière *"
                    placeholder="Ex: Agence Sahel Immo"
                    leftIcon={<Building2 className="h-4 w-4" />}
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
                  leftIcon={<Lock className="h-4 w-4" />}
                  {...register("password")}
                  error={errors.password?.message}
                  helperText="Au moins 8 car., 1 majuscule, 1 chiffre."
                />

                <Input
                  label="Confirmer le mot de passe *"
                  type="password"
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
              </div>

              {/* Trial Info Banner */}
              {(selectedRole === "OWNER" || selectedRole === "AGENCY") && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Essai Gratuit de 30 jours inclus :</strong> Accès immédiat à la publication sans carte bancaire ni frais initiaux.
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
        <div className="border-t border-[var(--color-border)] pt-6 text-center text-xs text-neutral-500">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/connexion"
            className="font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
          >
            Se connecter <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
