import { AuthSlidingCard } from "@/components/auth/auth-sliding-card";

export const metadata = {
  title: "Authentification — Ma Maison",
  description: "Connectez-vous ou créez un compte sur Ma Maison Niger.",
};

export default function AuthPage() {
  return <AuthSlidingCard initialMode="signIn" />;
}
