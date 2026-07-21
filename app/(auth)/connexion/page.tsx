import { AuthSlidingCard } from "@/components/auth/auth-sliding-card";

export const metadata = {
  title: "Connexion — Ma Maison",
  description: "Accédez à votre espace Ma Maison Niger.",
};

export default function LoginPage() {
  return <AuthSlidingCard initialMode="signIn" />;
}
