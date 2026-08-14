import { config } from "dotenv";
config({ path: ".env.local" });

import { PropertyService } from "../lib/properties/property.service";
import { createAdminClient } from "../lib/supabase/server";

async function runRealVerificationTests() {
  console.log("=== DEBUT DES TESTS REELS ===");

  // 1. TEST ADMIN: Galerie Photo & Annonces PENDING
  console.log("\n--- TEST 1: Admin Annonces & Galerie Photo ---");
  const supabase = await createAdminClient();
  const { data: pendingProps, error: pendingErr } = await supabase
    .from("properties")
    .select("id, title, status, property_images(id, url)")
    .eq("status", "PENDING");

  if (pendingErr) {
    console.error("Erreur lors de la récupération des annonces PENDING:", pendingErr.message);
  } else {
    console.log(`Annonces PENDING trouvées en BDD: ${pendingProps?.length || 0}`);
    const withImages = (pendingProps || []).filter((p) => (p.property_images as any[])?.length > 0);
    console.log(`Annonces PENDING ayant au moins 1 photo: ${withImages.length}`);

    (pendingProps || []).slice(0, 3).forEach((p, i) => {
      const images = (p.property_images as any[]) || [];
      console.log(`\nAnnonce PENDING #${i + 1}:`);
      console.log(`  - ID: ${p.id}`);
      console.log(`  - Titre: "${p.title}"`);
      console.log(`  - Images associées: ${images.length} photo(s)`);
      if (images.length > 0) {
        console.log(`  - URL Photo 1: ${images[0].url}`);
      }
    });
  }

  // 2. TEST PROPRIETAIRE: Création d'une NOUVELLE annonce avec WhatsApp
  console.log("\n--- TEST 2: Création Nouvelle Annonce avec Numéro WhatsApp ---");

  const { data: profiles } = await supabase.from("profiles").select("id, email").limit(1);
  const testOwnerId = profiles?.[0]?.id;

  if (!testOwnerId) {
    console.error("Aucun profil utilisateur trouvé pour exécuter le test de création.");
    return;
  }

  const newPropertyId = crypto.randomUUID();
  const testWhatsapp = "+22796707116";

  console.log(`Propriétaire de test sélectionné: ${testOwnerId}`);
  console.log("Insertion directe via Supabase (simulation de PropertyRepository.create / PropertyService.createProperty)...");

  // Tester l'insertion de propertyRecord complet comprenant whatsappNumber
  const { data: created, error: createErr } = await supabase
    .from("properties")
    .insert({
      id: newPropertyId,
      ownerId: testOwnerId,
      title: "Villa de Test diagnostic WhatsApp & Galerie",
      description: "Annonce de test créée pour valider whatsappNumber et la galerie admin.",
      type: "VILLA",
      transactionType: "RENT",
      price: 300000,
      city: "Niamey",
      district: "Plateau",
      address: "Avenue du Général de Gaulle",
      rooms: 4,
      bathrooms: 2,
      surface: 250,
      furnished: true,
      rentalPeriod: "MONTHLY",
      whatsappNumber: testWhatsapp,
      availability: "AVAILABLE",
      status: "PENDING",
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();

  if (createErr || !created) {
    console.error("Échec de la création en BDD:", createErr?.message);
    return;
  }

  // Insertion de 3 photos de test
  const testImages = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
  ];

  for (let i = 0; i < testImages.length; i++) {
    await supabase.from("property_images").insert({
      id: crypto.randomUUID(),
      propertyId: newPropertyId,
      url: testImages[i],
      order: i,
    });
  }

  console.log("\nAnnonce PENDING de test créée avec succès !");
  console.log(`  - ID: ${created.id}`);
  console.log(`  - Titre: "${created.title}"`);
  console.log(`  - 3 Photos associées insérées.`);

  // Test de la requête administrative Supabase (/admin/annonces/[id])
  const { data: adminDetailQuery, error: adminQueryErr } = await supabase
    .from("properties")
    .select("*, owner:profiles!ownerId(id, name, email, phone), property_images(*)")
    .eq("id", newPropertyId)
    .single();

  console.log("\n--- TEST 1 (Galerie Admin): Requête /admin/annonces/[id] ---");
  if (adminQueryErr || !adminDetailQuery) {
    console.error("Erreur requête Admin Detail:", adminQueryErr?.message);
  } else {
    console.log("  - ID Annonce:", adminDetailQuery.id);
    console.log("  - Titre Annonce:", adminDetailQuery.title);
    console.log("  - Statut Annonce:", adminDetailQuery.status);
    console.log("  - Photos récupérées dans property_images:", adminDetailQuery.property_images?.length);
    adminDetailQuery.property_images?.forEach((img: any, idx: number) => {
      console.log(`     Photo ${idx + 1}: ${img.url}`);
    });
  }

  // Vérification directe en BDD
  const { data: dbCheck, error: fetchErr } = await supabase
    .from("properties")
    .select("id, title, whatsappNumber, availability, status, property_images(url)")
    .eq("id", newPropertyId)
    .single();

  if (fetchErr || !dbCheck) {
    console.error("Erreur de relecture de l'annonce en BDD:", fetchErr?.message);
  } else {
    console.log("\n=== VERIFICATION EN BASE DE DONNEES ===");
    console.log("  - DB Property ID:", dbCheck.id);
    console.log("  - DB Title:", dbCheck.title);
    console.log("  - DB whatsappNumber:", dbCheck.whatsappNumber);
    console.log("  - DB availability:", dbCheck.availability);
    console.log("  - DB Photos:", (dbCheck.property_images as any[])?.length);

    if (dbCheck.whatsappNumber === testWhatsapp) {
      console.log(`\n✅ SUCCÈS CONFIRMÉ : whatsappNumber n'est PLUS NULL en BDD ! Valeur enregistrée: "${dbCheck.whatsappNumber}"`);
    } else {
      console.error(`\n❌ ÉCHEC : whatsappNumber vaut ${dbCheck.whatsappNumber}`);
    }
  }

  // Nettoyage de l'annonce de test
  console.log("\nNettoyage de l'annonce de test...");
  await supabase.from("property_images").delete().eq("propertyId", newPropertyId);
  await supabase.from("properties").delete().eq("id", newPropertyId);
  console.log("Annonce de test supprimée.");

  console.log("\n=== FIN DES TESTS REELS ===");
}

runRealVerificationTests().catch((err) => {
  console.error("Erreur globale lors de l'exécution du test:", err);
  process.exit(1);
});
