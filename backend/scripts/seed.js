import dotenv from "dotenv";
import { sequelize, Prospect, Tag } from "../src/models/index.js";

dotenv.config();

// Tags par domaine d'activité
const tagsData = [
  { nom: "Plomberie" },
  { nom: "Électricité" },
  { nom: "Menuiserie" },
  { nom: "Boulangerie" },
  { nom: "Restaurant" },
  { nom: "Fast Food" },
  { nom: "Coiffure" },
  { nom: "Garage" },
  { nom: "Bâtiment" },
  { nom: "Commerce" },
  { nom: "Service" }
];

// 15 prospects avec données variées (certains champs manquants)
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
    email: null, // Pas d'email récupéré
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
    telephone: null, // Pas de téléphone récupéré
    adresse: "78 Boulevard Saint-Germain, 75006 Paris",
    url_site: null,
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
    adresse: null, // Pas d'adresse récupérée
    url_site: null,
    source_scraping: "googleMaps",
    latitude: null, // Pas de coordonnées GPS
    longitude: null,
    note: "Boulangerie artisanale primée"
  },
  {
    nom_entreprise: "Ben Burger",
    nom_contact: "Benjamin Ben",
    email: null,
    telephone: "04 78 12 34 56",
    adresse: "23 Rue de la Part-Dieu, 69003 Lyon",
    url_site: "https://www.benburger.fr",
    source_scraping: "googleMaps",
    latitude: 45.7603,
    longitude: 4.8542,
    note: "Fast food américain"
  },
  {
    nom_entreprise: "Restaurant Le Gourmet",
    nom_contact: "François Gourmet",
    email: "contact@le-gourmet.fr",
    telephone: "04 78 23 45 67",
    adresse: "56 Quai Saint-Antoine, 69002 Lyon",
    url_site: "https://www.le-gourmet.fr",
    source_scraping: "pagesJaunes",
    latitude: 45.7597,
    longitude: 4.8295,
    note: "Restaurant gastronomique étoilé"
  },
  {
    nom_entreprise: "Coiffure Élégance",
    nom_contact: "Isabelle Coif",
    email: "contact@coiffure-elegance.fr",
    telephone: null,
    adresse: "12 Place Bellecour, 69002 Lyon",
    url_site: null,
    source_scraping: "googleMaps",
    latitude: 45.7578,
    longitude: 4.8320,
    note: "Salon de coiffure haut de gamme"
  },
  {
    nom_entreprise: "Garage Central",
    nom_contact: "Michel Garage",
    email: null,
    telephone: "04 91 12 34 56",
    adresse: null,
    url_site: "https://www.garage-central.fr",
    source_scraping: "pagesJaunes",
    latitude: null,
    longitude: null,
    note: "Réparation et entretien automobile"
  },
  {
    nom_entreprise: "Bâtiment Rousseau",
    nom_contact: "Antoine Rousseau",
    email: "a.rousseau@batiment-rousseau.fr",
    telephone: "04 91 23 45 67",
    adresse: "89 La Canebière, 13001 Marseille",
    url_site: "https://www.batiment-rousseau.fr",
    source_scraping: "googleMaps",
    latitude: 43.2965,
    longitude: 5.3698,
    note: "Entreprise générale du bâtiment"
  },
  {
    nom_entreprise: "Boulangerie du Port",
    nom_contact: "Julie Pain",
    email: "julie@boulangerie-port.fr",
    telephone: "04 91 34 56 78",
    adresse: "45 Quai du Port, 13002 Marseille",
    url_site: null,
    source_scraping: "pagesJaunes",
    latitude: 43.2952,
    longitude: 5.3678,
    note: "Pains et viennoiseries artisanales"
  },
  {
    nom_entreprise: "Plomberie Service Rapide",
    nom_contact: "David Rapide",
    email: null,
    telephone: "04 91 45 67 89",
    adresse: "78 Rue Paradis, 13006 Marseille",
    url_site: null,
    source_scraping: "googleMaps",
    latitude: 43.2913,
    longitude: 5.3784,
    note: "Dépannage 24h/24"
  },
  {
    nom_entreprise: "Électro Pro",
    nom_contact: "Thomas Volt",
    email: "thomas@electro-pro.fr",
    telephone: null,
    adresse: "34 Rue Saint-Honoré, 75001 Paris",
    url_site: "https://www.electro-pro.fr",
    source_scraping: "linkedin",
    latitude: 48.8616,
    longitude: 2.3421,
    note: "Installation et dépannage électrique"
  },
  {
    nom_entreprise: "Pizza Napoli",
    nom_contact: "Giuseppe Napoli",
    email: "info@pizza-napoli.fr",
    telephone: "01 45 67 89 01",
    adresse: null,
    url_site: "https://www.pizza-napoli.fr",
    source_scraping: "googleMaps",
    latitude: null,
    longitude: null,
    note: "Pizzeria authentique napolitaine"
  },
  {
    nom_entreprise: "Menuiserie Moderne",
    nom_contact: "Laurent Bois",
    email: null,
    telephone: "04 78 34 56 78",
    adresse: "67 Cours Vitton, 69006 Lyon",
    url_site: null,
    source_scraping: "pagesJaunes",
    latitude: 45.7696,
    longitude: 4.8548,
    note: "Agencement et menuiserie contemporaine"
  },
  {
    nom_entreprise: "Coiffure & Style",
    nom_contact: "Nathalie Style",
    email: "nathalie@coiffure-style.fr",
    telephone: "01 56 78 90 12",
    adresse: "90 Rue de Rivoli, 75001 Paris",
    url_site: "https://www.coiffure-style.fr",
    source_scraping: "googleMaps",
    latitude: 48.8594,
    longitude: 2.3447,
    note: "Coiffure et barbier moderne"
  }
];

(async () => {
  try {
    console.log("🌱 Démarrage du seeding...");

    // Authentifier la connexion
    console.log("📡 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✓ Connecté à la base de données");

    // Créer ou récupérer les tags existants
    console.log("\n📋 Création des tags...");
    const tags = {};
    for (const tagData of tagsData) {
      const [tag, created] = await Tag.findOrCreate({
        where: { nom: tagData.nom },
        defaults: tagData
      });
      tags[tag.nom] = tag;
      console.log(`${created ? '✓' : '↻'} Tag ${created ? 'créé' : 'existant'}: ${tag.nom}`);
    }
    console.log(`✓ ${Object.keys(tags).length} tags prêts`);

    // Créer les prospects avec leurs tags
    console.log("\n👥 Création des prospects et associations...");

    const prospectTagMapping = [
      { index: 0, tags: ["Plomberie", "Service"] },
      { index: 1, tags: ["Électricité", "Service"] },
      { index: 2, tags: ["Menuiserie", "Bâtiment"] },
      { index: 3, tags: ["Boulangerie", "Commerce"] },
      { index: 4, tags: ["Fast Food", "Restaurant", "Commerce"] },
      { index: 5, tags: ["Restaurant", "Commerce"] },
      { index: 6, tags: ["Coiffure", "Service"] },
      { index: 7, tags: ["Garage", "Service"] },
      { index: 8, tags: ["Bâtiment", "Service"] },
      { index: 9, tags: ["Boulangerie", "Commerce"] },
      { index: 10, tags: ["Plomberie", "Service"] },
      { index: 11, tags: ["Électricité", "Service"] },
      { index: 12, tags: ["Restaurant", "Fast Food", "Commerce"] },
      { index: 13, tags: ["Menuiserie", "Bâtiment"] },
      { index: 14, tags: ["Coiffure", "Service"] }
    ];

    for (const mapping of prospectTagMapping) {
      const prospectData = prospectsData[mapping.index];
      const prospect = await Prospect.create(prospectData);

      // Associer les tags
      const prospectTags = mapping.tags.map(tagName => tags[tagName]);
      await prospect.addTags(prospectTags);

      console.log(`✓ ${prospect.nom_entreprise}: ${mapping.tags.join(", ")}`);
    }

    console.log("\n✅ Seeding terminé avec succès !");
    console.log(`\n📊 Résumé:`);
    console.log(`   - ${Object.keys(tags).length} tags créés`);
    console.log(`   - ${prospectsData.length} prospects créés`);
    console.log(`   - Associations tags/prospects créées`);
    console.log(`\n📍 Répartition géographique:`);
    console.log(`   - Paris: 6 prospects`);
    console.log(`   - Lyon: 4 prospects`);
    console.log(`   - Marseille: 4 prospects`);
    console.log(`\n🏷️  Tags les plus utilisés:`);
    console.log(`   - Service: 6 prospects`);
    console.log(`   - Commerce: 5 prospects`);
    console.log(`   - Restaurant: 3 prospects`);
    console.log(`\n⚠️  Données incomplètes (pour tester les cas réels):`);
    console.log(`   - Sans email: 5 prospects`);
    console.log(`   - Sans téléphone: 3 prospects`);
    console.log(`   - Sans adresse: 3 prospects`);
    console.log(`   - Sans coordonnées GPS: 3 prospects`);

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Erreur lors du seeding:", err);
    process.exit(1);
  }
})();
