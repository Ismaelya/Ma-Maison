"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast-notification";
import { formatAuthError } from "@/lib/utils";

export default function MotDePasseOubliePage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setServerError(null);
    const supabase = createClient();

    const origin = typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${origin}/callback?next=/connexion`,
    });

    if (error) {
      const formatted = formatAuthError(error.message);
      setServerError(formatted);
      toast.error(formatted);
      return;
    }

    setIsSubmitted(true);
    toast.success("Instructions envoyées par e-mail !");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-muted)]/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg)] p-8 shadow-[var(--shadow-card)] animate-fade-in text-left">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo />
          </div>
          <h1 className="text-h3 font-bold text-[var(--color-text)]">Mot de passe oublié</h1>
          <p className="text-small text-neutral-500">
            Entrez votre adresse e-mail pour réinitialiser votre accès
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 text-center space-y-4 animate-scale-in">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[var(--color-primary)]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-h4 font-bold text-blue-900">E-mail envoyé !</h2>
            <p className="text-xs text-blue-800">
              Si un compte est associé à cet e-mail, vous recevrez un lien de réinitialisation d&apos;ici quelques instants.
            </p>
            <div className="pt-2">
              <Link href="/connexion">
                <Button variant="outline" size="sm" fullWidth leftIcon={<ArrowLeft className="h-4 w-4" />}>
                  Retour à la connexion
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Adresse e-mail *"
                type="email"
                placeholder="votre.email@exemple.com"
                leftIcon={<Mail className="h-4 w-4" />}
                {...register("email")}
                error={errors.email?.message}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                leftIcon={<KeyRound className="h-4 w-4" />}
              >
                Envoyer le lien de réinitialisation
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
