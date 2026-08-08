import React from "react";

export const metadata = {
  title: "Aide iOS — Ma Maison",
  description: "Instructions pas à pas pour installer Ma Maison sur iPhone / iPad",
};

export default function AideIosPage() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Installer Ma Maison sur iPhone / iPad</h1>
      <section className="mb-4">
        <p className="mb-2">Suivez ces étapes simples pour ajouter Ma Maison à votre écran d&apos;accueil et l&apos;utiliser comme une application :</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Ouvrez Safari et accédez au site Ma Maison.</li>
          <li>Touchez le bouton <strong>Partager</strong> (icône carrée avec une flèche vers le haut).</li>
          <li>Faites défiler les options et sélectionnez <strong>Ajouter à l&apos;écran d&apos;accueil</strong>.</li>
          <li>Donnez un nom (par défaut : Ma Maison) puis touchez <strong>Ajouter</strong>.</li>
          <li>Le raccourci apparaîtra sur votre écran d&apos;accueil comme une application.</li>
        </ol>
      </section>
      <section>
        <h2 className="text-lg font-medium mb-2">Conseils</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Assurez-vous d&apos;utiliser Safari (iOS ne supporte pas l&apos;ajout depuis Chrome).</li>
          <li>Nous recommandons d&apos;autoriser les notifications si vous souhaitez recevoir des alertes d&apos;annonces.</li>
        </ul>
      </section>
    </main>
  );
}
