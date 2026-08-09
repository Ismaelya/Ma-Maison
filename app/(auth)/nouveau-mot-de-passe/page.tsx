"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, ArrowLeft, CheckCircle2, KeyRound, AlertTriangle, Loader2 } from "lucide-react";
import { newPasswordSchema, type NewPasswordFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast-notification";
import { formatAuthError } from "@/lib/utils";

function getAuthErrorMessage(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const toast = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
  });

  useEffect(() => {
    async function verifySession() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setHasSession(true);
        } else {
          setHasSession(false);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification de la session :", err);
        setHasSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    }

    verifySession();
  }, []);

  async function onSubmit(data: NewPasswordFormData) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      const errorMessage = getAuthErrorMessage(error) || "Impossible de mettre à jour le mot de passe.";
      const formatted = formatAuthError(errorMessage);
      setServerError(formatted);
      toast.error(formatted);
      return;
    }

    setIsSuccess(true);
    toast.success("Mot de passe modifié avec succès !");

    // Déconnecter proprement pour permettre le test de connexion immédiat avec le nouveau mot de passe
    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/connexion?updated=true");
    }, 1500);
  }

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          <p className="text-small text-neutral-600">Vérification de la session de réinitialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-card)] animate-fade-in text-left">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="text-h3 font-bold text-[var(--color-text)]">Nouveau mot de passe</h1>
          <p className="text-small text-neutral-500">
            Saisissez et confirmez votre nouveau mot de passe
          </p>
        </div>

        {!hasSession && !isSuccess ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-center space-y-4 animate-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-h4 font-bold text-amber-900">Session de réinitialisation invalide</h2>
            <p className="text-xs text-amber-800">
              Le lien de réinitialisation a expiré ou a déjà été utilisé. Veuillez demander un nouveau lien de réinitialisation.
            </p>
            <div className="pt-2">
              <Link href="/mot-de-passe-oublie">
                <Button variant="primary" size="sm" fullWidth leftIcon={<KeyRound className="h-4 w-4" />}>
                  Demander un nouveau lien
                </Button>
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-center space-y-4 animate-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-h4 font-bold text-emerald-900">Mot de passe mis à jour !</h2>
            <p className="text-xs text-emerald-800">
              Votre nouveau mot de passe a été enregistré. Vous allez être redirigé vers la page de connexion...
            </p>
            <div className="pt-2">
              <Link href="/connexion">
                <Button variant="outline" size="sm" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Aller à la connexion
                </Button>
              </Link>
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Nouveau mot de passe *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                {...register("password")}
                error={errors.password?.message}
                helperText="Au moins 8 caractères, 1 majuscule et 1 chiffre"
              />

              <Input
                label="Confirmer le nouveau mot de passe *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={<KeyRound className="h-4 w-4" />}
              >
                Enregistrer le mot de passe
              </Button>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-[var(--color-border)] pt-6 text-center text-xs text-neutral-500">
          <Link
            href="/connexion"
            className="font-medium text-neutral-600 hover:text-[var(--color-primary)] inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la page de connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
