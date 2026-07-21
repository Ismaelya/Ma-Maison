import { AuthSlidingCard } from "@/components/auth/auth-sliding-card";

export const metadata = {
  title: "Inscription — Ma Maison",
  description: "Créer un compte sur Ma Maison Niger.",
};

export default function RegisterPage() {
  return <AuthSlidingCard initialMode="signUp" />;
}
