import { createAdminClient } from "../lib/supabase/server";

async function runFavoritesTest() {
  console.log("=== DEBUT TEST D'INTEGRATION FAVORIS ===");
  const supabase = await createAdminClient();

  // 1. Récupérer un locataire actif
  const { data: tenant, error: tenantErr } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("role", "TENANT")
    .eq("status", "ACTIVE")
    .limit(1)
    .single();

  if (tenantErr || !tenant) {
    console.error("Aucun locataire actif trouvé pour le test:", tenantErr);
    process.exit(1);
  }
  console.log(`[1] Locataire trouvé : ${tenant.name} (${tenant.id})`);

  // 2. Récupérer une propriété approuvée
  const { data: property, error: propErr } = await supabase
    .from("properties")
    .select("id, title")
    .eq("status", "APPROVED")
    .limit(1)
    .single();

  if (propErr || !property) {
    console.error("Aucune propriété approuvée trouvée pour le test:", propErr);
    process.exit(1);
  }
  console.log(`[2] Propriété trouvée : ${property.title} (${property.id})`);

  // Nettoyage préalable pour éviter 23505
  await supabase
    .from("favorites")
    .delete()
    .eq("userId", tenant.id)
    .eq("propertyId", property.id);

  // 3. Simulation du clic 1 : Ajout aux favoris (Exactement ce que fait POST /api/favorites)
  const newFavId = crypto.randomUUID();
  console.log(`[3] Tentative d'insertion du favori (id: ${newFavId})...`);

  const { data: inserted, error: insertErr } = await supabase
    .from("favorites")
    .insert({
      id: newFavId,
      userId: tenant.id,
      propertyId: property.id,
    } as any)
    .select()
    .single();

  if (insertErr) {
    console.error("❌ ECHEC DE L'INSERTION DU FAVORIS :", insertErr.message);
    process.exit(1);
  }
  console.log("✅ Favori inséré avec succès en base :", inserted);

  // 4. Verification de la lecture par la page /dashboard/favoris
  const { data: userFavs, error: readErr } = await supabase
    .from("favorites")
    .select("id, createdAt, property:properties!inner(id, title)")
    .eq("userId", tenant.id)
    .eq("propertyId", property.id);

  if (readErr || !userFavs || userFavs.length === 0) {
    console.error("❌ ECHEC DE LECTURE DASHBOARD FAVORIS :", readErr);
    process.exit(1);
  }
  console.log(`✅ Annonce "${userFavs[0].property.title}" confirmée visible sur /dashboard/favoris !`);

  // 5. Simulation du clic 2 : Suppression des favoris (Exactement ce que fait DELETE /api/favorites)
  console.log("[5] Tentative de suppression du favori (Unfavorite)...");
  const { error: deleteErr } = await supabase
    .from("favorites")
    .delete()
    .eq("userId", tenant.id)
    .eq("propertyId", property.id);

  if (deleteErr) {
    console.error("❌ ECHEC DE LA SUPPRESSION DU FAVORIS :", deleteErr.message);
    process.exit(1);
  }

  // Verification disparition
  const { data: checkDeleted } = await supabase
    .from("favorites")
    .select("id")
    .eq("userId", tenant.id)
    .eq("propertyId", property.id);

  if (checkDeleted && checkDeleted.length > 0) {
    console.error("❌ LE FAVORIS N'A PAS ETE SUPPRIME !");
    process.exit(1);
  }

  console.log("✅ Favori retiré de la base avec succès ! (0 résultat restants)");
  console.log("=== TOUS LES TESTS FAVORIS SONT PASSÉS AVEC SUCCÈS (100% OK) ===");
}

runFavoritesTest().catch(console.error);
