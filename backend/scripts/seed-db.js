import dotenv from "dotenv";
import { sequelize, Prospect, Tag } from "../src/models/index.js";

dotenv.config();

// Données de test pour les tags
const tagsData = [
  { nom: "Bâtiment" },
  { nom: "Restauration" },
  { nom: "Technologie" },
  { nom: "Commerce" },
  { nom: "Service" },
  { nom: "Industrie" },
  { nom: "Non-Contacté" },
  { nom: "Qualifié" },
  { nom: "En Négociation" },
  { nom: "Client" },
];

// Données de test pour les prospects
const prospectsData = [
  {
    nom_entreprise: "Plomberie Martin",
    nom_contact: "Martin Dupont",
    email: "contact@plomberie-martin.fr",
    telephone: "04 78 12 34 56",
    adresse: "123 Rue de la Paix, 69000 Lyon",
    url_site: "https://plomberie-martin.fr",
    source_scraping: "Google Maps",
    tags: ["Bâtiment", "Service", "Non-Contacté"],
  },
  {
    nom_entreprise: "Restaurant Le Gourmet",
    nom_contact: "Sophie Petit",
    email: "contact@legourmet-lyon.fr",
    telephone: "04 78 45 67 89",
    adresse: "45 Avenue Victor Hugo, 69002 Lyon",
    url_site: "https://legourmet-lyon.fr",
    source_scraping: "Pages Jaunes",
    tags: ["Restauration", "Commerce", "Qualifié"],
  },
  {
    nom_entreprise: "TechInnovate Solutions",
    nom_contact: "Jean-Pierre Dubois",
    email: "jp.dubois@techinnovate.com",
    telephone: "04 72 98 76 54",
    adresse: "89 Cours Lafayette, 69003 Lyon",
    url_site: "https://techinnovate-solutions.com",
    source_scraping: "LinkedIn",
    tags: ["Technologie", "Service", "En Négociation"],
  },
  {
    nom_entreprise: "Boulangerie Artisanale Durand",
    nom_contact: "Marie Durand",
    email: "marie@boulangerie-durand.fr",
    telephone: "04 78 23 45 67",
    adresse: "12 Rue de la République, 69001 Lyon",
    url_site: "https://boulangerie-durand.fr",
    source_scraping: "Google Maps",
    tags: ["Commerce", "Restauration", "Client"],
  },
  {
    nom_entreprise: "Électricité Moderne",
    nom_contact: "Pierre Moreau",
    email: "contact@electricite-moderne.fr",
    telephone: "04 78 87 65 43",
    adresse: "67 Boulevard des Belges, 69006 Lyon",
    url_site: "https://electricite-moderne.fr",
    source_scraping: "Pages Jaunes",
    tags: ["Bâtiment", "Service", "Qualifié"],
  },
  {
    nom_entreprise: "Cabinet Conseil RH Plus",
    nom_contact: "Isabelle Laurent",
    email: "i.laurent@rh-plus.fr",
    telephone: "04 72 56 78 90",
    adresse: "34 Rue Garibaldi, 69003 Lyon",
    url_site: "https://conseil-rh-plus.fr",
    source_scraping: "LinkedIn",
    tags: ["Service", "Technologie", "Non-Contacté"],
  },
];

async function seedDatabase() {
  try {
    console.log("🌱 Démarrage du seed de la base de données...\n");

    // Connexion à la base de données
    console.log("🔌 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✓ Connecté à la base de données\n");

    // Créer les tags
    console.log("📌 Création des tags...");
    const createdTags = [];
    for (const tagData of tagsData) {
      const [tag, created] = await Tag.findOrCreate({
        where: { nom: tagData.nom },
        defaults: tagData,
      });
      createdTags.push(tag);
      if (created) {
        console.log(`  ✓ Tag créé : ${tag.nom}`);
      } else {
        console.log(`  ℹ️  Tag existant : ${tag.nom}`);
      }
    }
    console.log(`✓ ${createdTags.length} tags disponibles\n`);

    // Créer un map des tags par nom pour faciliter l'association
    const tagMap = {};
    for (const tag of createdTags) {
      tagMap[tag.nom] = tag;
    }

    // Créer les prospects
    console.log("👥 Création des prospects...");
    let prospectsCreated = 0;
    let prospectsExisting = 0;

    for (const prospectData of prospectsData) {
      const { tags: prospectTags, ...prospectInfo } = prospectData;

      // Vérifier si le prospect existe déjà (par email)
      const existingProspect = await Prospect.findOne({
        where: { email: prospectInfo.email },
      });

      if (existingProspect) {
        console.log(`  ℹ️  Prospect existant : ${prospectInfo.nom_entreprise}`);
        prospectsExisting++;
        continue;
      }

      // Créer le prospect
      const prospect = await Prospect.create(prospectInfo);
      prospectsCreated++;
      console.log(`  ✓ Prospect créé : ${prospect.nom_entreprise}`);

      // Associer les tags
      if (prospectTags && prospectTags.length > 0) {
        const tagsToAssociate = prospectTags
          .map((tagName) => tagMap[tagName])
          .filter((tag) => tag !== undefined);

        if (tagsToAssociate.length > 0) {
          await prospect.setTags(tagsToAssociate);
          console.log(
            `    → Tags associés : ${tagsToAssociate.map((t) => t.nom).join(", ")}`
          );
        }
      }
    }

    console.log(
      `\n✓ ${prospectsCreated} prospects créés, ${prospectsExisting} déjà existants\n`
    );

    // Statistiques finales
    const totalProspects = await Prospect.count();
    const totalTags = await Tag.count();

    console.log("📊 Statistiques de la base de données :");
    console.log(`  - Total prospects : ${totalProspects}`);
    console.log(`  - Total tags : ${totalTags}`);

    console.log("\n✅ Seed terminé avec succès !");
  } catch (error) {
    console.error("\n❌ Erreur lors du seed :", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedDatabase();
