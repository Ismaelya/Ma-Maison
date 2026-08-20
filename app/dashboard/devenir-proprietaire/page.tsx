import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { DevenirProprietaireClient } from "./devenir-proprietaire-client";

export const metadata = {
  title: "Devenir Propriétaire | Ma Maison",
  description: "Passez de locataire à propriétaire et publiez vos annonces gratuitement au Niger.",
};

export default async function DevenirProprietairePage() {
  const user = await requireAuth();

  const role = String(user.profile.role || "").toUpperCase();

  // Accessible exclusively to TENANT logged-in users — redirect elsewhere if already OWNER/AGENCY/ADMIN
  if (role !== "TENANT") {
    redirect("/dashboard/annonces");
  }

  return <DevenirProprietaireClient userName={user.profile.name} />;
}
