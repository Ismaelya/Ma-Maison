"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  Users,
  Building2,
  Globe,
  Mail,
  Share2,
  Lock,
} from "lucide-react";
import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

type AuthMode = "signIn" | "signUp";

type AuthSlidingCardProps = {
  initialMode?: AuthMode;
  redirectUrl?: string;
};

export function AuthSlidingCard({
  initialMode = "signIn",
  redirectUrl = "/dashboard",
}: AuthSlidingCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const router = useRouter();

  const isSignUp = mode === "signUp";

  // Login Form Hook
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors, isSubmitting: isSubmittingLogin },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Register Form Hook
  const {
    register: registerSignUp,
    handleSubmit: handleSubmitSignUp,
    watch: watchSignUp,
    setValue: setSignUpValue,
    formState: { errors: signUpErrors, isSubmitting: isSubmittingSignUp },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "tenant",
    },
  });

  const selectedRole = watchSignUp("role");

  // Handle Login Submit
  async function onLoginSubmit(data: LoginFormData) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setServerError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : "Une erreur est survenue lors de la connexion."
      );
      return;
    }

    router.push(redirectUrl as any);
    router.refresh();
  }

  // Handle Sign Up Submit
  async function onSignUpSubmit(data: RegisterFormData) {
    setServerError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          role: data.role,
          phone: data.phone ?? "",
        },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        setServerError("Cet email est déjà utilisé. Veuillez vous connecter.");
      } else {
        setServerError("Une erreur est survenue lors de l'inscription.");
      }
      return;
    }

    setSignUpSuccess(true);
  }

  const toggleMode = () => {
    setServerError(null);
    setMode((prev) => (prev === "signIn" ? "signUp" : "signIn"));
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-neutral-950 p-4 sm:p-6 lg:p-8">
      {/* Header Logo */}
      <div className="mb-6">
        <Logo variant="light" />
      </div>

      {/* Main Card Container */}
      <div className="relative min-h-[580px] w-full max-w-[840px] overflow-hidden rounded-[30px] bg-white shadow-2xl">
        {/* Mobile Tab Switcher (<640px) */}
        <div className="flex border-b border-neutral-100 sm:hidden">
          <button
            type="button"
            onClick={() => setMode("signIn")}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
              !isSignUp
                ? "border-b-2 border-[#00C9A7] bg-white text-[#0A2540]"
                : "bg-neutral-50 text-neutral-400"
            )}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode("signUp")}
            className={cn(
              "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
              isSignUp
                ? "border-b-2 border-[#00C9A7] bg-white text-[#0A2540]"
                : "bg-neutral-50 text-neutral-400"
            )}
          >
            Créer un compte
          </button>
        </div>

        {/* Global Server Error Banner */}
        {serverError && (
          <div className="absolute left-4 right-4 top-4 z-50 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700 shadow-md sm:left-8 sm:right-8">
            {serverError}
          </div>
        )}

        {/* Desktop Container Grid */}
        <div className="relative grid h-full min-h-[580px] w-full grid-cols-1 sm:grid-cols-2">
          {/* ========================================================================= */}
          {/* SIGN IN FORM (LEFT SIDE DESKTOP) */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "flex flex-col justify-center p-6 transition-all duration-500 sm:p-10",
              !isSignUp ? "opacity-100 z-20" : "opacity-0 pointer-events-none sm:opacity-100"
            )}
          >
            <div className="mx-auto w-full max-w-sm">
              <h2 className="text-center text-2xl font-bold text-[#0A2540] sm:text-3xl">
                Connexion
              </h2>

              {/* Social Login Icons */}
              <div className="my-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  title="Google"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Globe className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Email"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Lock className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center text-xs text-neutral-400">
                Ou connectez-vous avec votre compte
              </p>

              <form
                onSubmit={handleSubmitLogin(onLoginSubmit)}
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="sr-only">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    {...registerLogin("email")}
                    className="w-full rounded-xl border-none bg-neutral-100 px-4 py-3 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                  />
                  {loginErrors.email && (
                    <p className="mt-1 text-xs text-red-500">
                      {loginErrors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="sr-only">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe"
                      autoComplete="current-password"
                      {...registerLogin("password")}
                      className="w-full rounded-xl border-none bg-neutral-100 px-4 py-3 pr-10 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="mt-1 text-xs text-red-500">
                      {loginErrors.password.message}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <Link
                    href={"/mot-de-passe-oublie" as any}
                    className="text-xs font-semibold text-neutral-500 hover:text-[#00C9A7]"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#0A2540] to-[#00C9A7] px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {isSubmittingLogin ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Connexion"
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SIGN UP FORM (RIGHT SIDE DESKTOP) */}
          {/* ========================================================================= */}
          <div
            className={cn(
              "flex flex-col justify-center p-6 transition-all duration-500 sm:p-10",
              isSignUp ? "opacity-100 z-20" : "opacity-0 pointer-events-none sm:opacity-100"
            )}
          >
            <div className="mx-auto w-full max-w-sm">
              <h2 className="text-center text-2xl font-bold text-[#0A2540] sm:text-3xl">
                Créer un compte
              </h2>

              {/* Social Login Icons */}
              <div className="my-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  title="Google"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Globe className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="Email"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Mail className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  title="LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-[#00C9A7] hover:bg-neutral-50 hover:text-[#00C9A7]"
                >
                  <Lock className="h-4 w-4" />
                </button>
              </div>

              <p className="text-center text-xs text-neutral-400">
                Ou inscrivez-vous avec votre email
              </p>

              {signUpSuccess ? (
                <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-xs font-semibold text-green-800">
                    Inscription réussie ! Un email de confirmation vous a été envoyé.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmitSignUp(onSignUpSubmit)}
                  className="mt-4 space-y-3"
                >
                  {/* Role picker */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSignUpValue("role", "tenant")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-[11px] font-semibold transition-all",
                        selectedRole === "tenant"
                          ? "border-[#00C9A7] bg-teal-50 text-[#0A2540]"
                          : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      )}
                    >
                      <Users className="h-3.5 w-3.5 text-[#00C9A7]" />
                      Locataire
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignUpValue("role", "owner")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-[11px] font-semibold transition-all",
                        selectedRole === "owner"
                          ? "border-[#0A2540] bg-blue-50 text-[#0A2540]"
                          : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      )}
                    >
                      <Building2 className="h-3.5 w-3.5 text-[#0A2540]" />
                      Propriétaire
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignUpValue("role", "agency")}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-[11px] font-semibold transition-all",
                        selectedRole === "agency"
                          ? "border-purple-500 bg-purple-50 text-purple-800"
                          : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      )}
                    >
                      <Building2 className="h-3.5 w-3.5 text-purple-600" />
                      Agence
                    </button>
                  </div>

                  <div>
                    <label className="sr-only">Nom complet</label>
                    <input
                      type="text"
                      placeholder="Nom complet"
                      autoComplete="name"
                      {...registerSignUp("fullName")}
                      className="w-full rounded-xl border-none bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                    />
                    {signUpErrors.fullName && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {signUpErrors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="sr-only">Email</label>
                    <input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      {...registerSignUp("email")}
                      className="w-full rounded-xl border-none bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                    />
                    {signUpErrors.email && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {signUpErrors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="sr-only">Mot de passe</label>
                    <input
                      type="password"
                      placeholder="Mot de passe (8+ car, 1 Maj, 1 chiffre)"
                      autoComplete="new-password"
                      {...registerSignUp("password")}
                      className="w-full rounded-xl border-none bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                    />
                    {signUpErrors.password && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {signUpErrors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="sr-only">Confirmer le mot de passe</label>
                    <input
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      autoComplete="new-password"
                      {...registerSignUp("confirmPassword")}
                      className="w-full rounded-xl border-none bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                    />
                    {signUpErrors.confirmPassword && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {signUpErrors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSignUp}
                    className="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#0A2540] to-[#00C9A7] px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:opacity-90 disabled:opacity-60"
                  >
                    {isSubmittingSignUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "S'inscrire"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SLIDING OVERLAY PANEL (DESKTOP ONLY >= 640px) */}
        {/* ========================================================================= */}
        <motion.div
          animate={{ x: isSignUp ? "0%" : "100%" }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
          className="absolute left-0 top-0 hidden h-full w-1/2 overflow-hidden bg-gradient-to-br from-[#0A2540] via-[#0D3B66] to-[#00C9A7] p-8 text-white shadow-2xl sm:flex sm:flex-col sm:items-center sm:justify-center"
          style={{ zIndex: 30 }}
        >
          <AnimatePresence mode="wait">
            {!isSignUp ? (
              /* PANEL RIGHT (SHOWS IN SIGN IN MODE -> PROMPTS SIGN UP) */
              <motion.div
                key="signInOverlay"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center"
              >
                <h3 className="text-3xl font-extrabold tracking-tight">
                  Bienvenue !
                </h3>
                <p className="mt-4 max-w-xs text-xs leading-relaxed opacity-90">
                  Inscrivez-vous et découvrez la meilleure plateforme
                  immobilière au Niger pour louer, vendre ou publier vos biens.
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="mt-8 rounded-full border-2 border-white px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/10"
                >
                  Créer un compte
                </button>
              </motion.div>
            ) : (
              /* PANEL LEFT (SHOWS IN SIGN UP MODE -> PROMPTS SIGN IN) */
              <motion.div
                key="signUpOverlay"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center"
              >
                <h3 className="text-3xl font-extrabold tracking-tight">
                  Ravi de vous revoir !
                </h3>
                <p className="mt-4 max-w-xs text-xs leading-relaxed opacity-90">
                  Pour rester connecté avec nous et gérer vos annonces, veuillez
                  vous connecter avec vos identifiants.
                </p>
                <button
                  type="button"
                  onClick={toggleMode}
                  className="mt-8 rounded-full border-2 border-white px-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition-all hover:bg-white/10"
                >
                  Connexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer copyright note */}
      <p className="mt-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Ma Maison Niger. Tous droits réservés.
      </p>
    </div>
  );
}
