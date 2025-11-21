import dotenv from "dotenv";
import { sequelize, Prospect, Tag } from "../src/models/index.js";

dotenv.config();

// Données de test
const tagsData = [
  { nom: "Premium" },
  { nom: "Contacté" },
  { nom: "Intéressé" },
  { nom: "Lead Chaud" },
  { nom: "A Rappeler" }
];

const prospectsData = [
  {
    nom_entreprise: "Plomberie Dupont",
    nom_contact: "Jean Dupont",
    email: "jean.dupont@plomberie-dupont.fr",
    telephone: "01 23 45 67 89",
    adresse: "12 Rue de la République, 75001 Paris",
    url_site: "https://www.plomberie-dupont.fr",
    source_scraping: "pagesJaunes",
    latitude: 48.8566,
    longitude: 2.3522,
    note: "Entreprise familiale depuis 1985"
  },
  {
    nom_entreprise: "Électricité Martin",
    nom_contact: "Marie Martin",
    email: "contact@electricite-martin.fr",
    telephone: "01 34 56 78 90",
    adresse: "45 Avenue des Champs-Élysées, 75008 Paris",
    url_site: "https://www.electricite-martin.fr",
    source_scraping: "googleMaps",
    latitude: 48.8698,
    longitude: 2.3077,
    note: "Spécialiste en installation électrique"
  },
  {
    nom_entreprise: "Menuiserie Bernard",
    nom_contact: "Pierre Bernard",
    email: "pierre@menuiserie-bernard.com",
    telephone: "01 45 67 89 01",
    adresse: "78 Boulevard Saint-Germain, 75006 Paris",
    url_site: "https://www.menuiserie-bernard.com",
    source_scraping: "pagesJaunes",
    latitude: 48.8534,
    longitude: 2.3329,
    note: "Menuiserie sur mesure"
  },
  {
    nom_entreprise: "Boulangerie Lefebvre",
    nom_contact: "Sophie Lefebvre",
    email: "sophie@boulangerie-lefebvre.fr",
    telephone: "01 56 78 90 12",
    adresse: "23 Rue de Rivoli, 75004 Paris",
    url_site: null,
    source_scraping: "googleMaps",
    latitude: 48.8574,
    longitude: 2.3563,
    note: "Boulangerie artisanale primée"
  },
  {
    nom_entreprise: "Cabinet d'Avocats Rousseau",
    nom_contact: "Antoine Rousseau",
    email: "a.rousseau@cabinet-rousseau.fr",
    telephone: "01 67 89 01 23",
    adresse: "56 Avenue Montaigne, 75008 Paris",
    url_site: "https://www.cabinet-rousseau.fr",
    source_scraping: "linkedin",
    latitude: 48.8688,
    longitude: 2.3043,
    note: "Droit des affaires et commercial"
  }
];

(async () => {
  try {
    console.log("🌱 Démarrage du seeding...");

    // Authentifier la connexion
    console.log("📡 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✓ Connecté à la base de données");

    // Créer les tags
    console.log("\n📋 Création des tags...");
    const tags = [];
    for (const tagData of tagsData) {
      const tag = await Tag.create(tagData);
      tags.push(tag);
      console.log(`✓ Tag créé: ${tag.nom}`);
    }
    console.log(`✓ ${tags.length} tags créés`);

    // Créer les prospects
    console.log("\n👥 Création des prospects...");
    const prospects = [];
    for (const prospectData of prospectsData) {
      const prospect = await Prospect.create(prospectData);
      prospects.push(prospect);
      console.log(`✓ Prospect créé: ${prospect.nom_entreprise}`);
    }
    console.log(`✓ ${prospects.length} prospects créés`);

    // Associer des tags aléatoires aux prospects
    console.log("\n🔗 Association des tags aux prospects...");
    for (const prospect of prospects) {
      // Sélectionner 1 à 3 tags aléatoires
      const numTags = Math.floor(Math.random() * 3) + 1;
      const shuffledTags = tags.sort(() => 0.5 - Math.random());
      const selectedTags = shuffledTags.slice(0, numTags);

      await prospect.addTags(selectedTags);
      console.log(`✓ ${prospect.nom_entreprise}: ${selectedTags.map(t => t.nom).join(", ")}`);
    }

    console.log("\n✅ Seeding terminé avec succès !");
    console.log(`\n📊 Résumé:`);
    console.log(`   - ${tags.length} tags créés`);
    console.log(`   - ${prospects.length} prospects créés`);
    console.log(`   - Associations tags/prospects créées`);

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Erreur lors du seeding:", err);
    process.exit(1);
  }
})();
