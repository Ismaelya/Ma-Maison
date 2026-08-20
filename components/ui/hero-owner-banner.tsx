import Link from "next/link";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

interface HeroOwnerBannerProps {
  userRole?: string | null;
  isAuthenticated: boolean;
}

export function HeroOwnerBanner({ userRole, isAuthenticated }: HeroOwnerBannerProps) {
  const normalizedRole = String(userRole || "").toUpperCase();

  // Connected OWNER, AGENCY, or ADMIN: hide banner completely
  if (isAuthenticated && (normalizedRole === "OWNER" || normalizedRole === "AGENCY" || normalizedRole === "ADMIN")) {
    return null;
  }

  const isTenant = isAuthenticated && normalizedRole === "TENANT";

  const bannerHref = isTenant ? "/dashboard/devenir-proprietaire" : "/inscription?role=OWNER";
  const buttonText = isTenant ? "Devenir Propriétaire" : "Commencer gratuitement";
  const subtitleText = isTenant
    ? "Passez votre compte en Propriétaire en 1 clic et commencez à publier immédiatement sans créer de nouveau compte."
    : "Publiez vos annonces gratuitement au Niger et touchez directement des milliers de locataires et acheteurs qualifiés.";

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#102281] via-[#0C2D9A] to-[#05CBAD] p-8 sm:p-14 text-white shadow-2xl">
          {/* Ambient Glow Orbs */}
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#05CBAD]/30 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>Espace Propriétaire — 100% Gratuit</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-space-grotesk leading-tight text-white">
                Vous avez un bien à louer ou vendre ? Publiez gratuitement en 2 minutes
              </h2>

              <p className="text-sm sm:text-base text-cyan-50 font-medium leading-relaxed opacity-90">
                {subtitleText}
              </p>
            </div>

            <div className="flex-shrink-0">
              <Link
                href={bannerHref}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-4 text-base font-extrabold text-[#102281] shadow-xl transition-all duration-200 hover:bg-cyan-50 hover:shadow-2xl hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Zap className="h-5 w-5 fill-[#05CBAD] text-[#05CBAD]" />
                <span>{buttonText}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
