# Système de Sources Multiples - Documentation

## 📋 Vue d'ensemble

Ce document décrit l'implémentation du système de sources multiples pour les prospects, permettant de tracer toutes les sources de scraping d'un prospect (Pages Jaunes, Google Maps, LinkedIn, etc.).

## 🎯 Problématique résolue

**Avant** : Un prospect ne pouvait avoir qu'une seule source de scraping. Si le même prospect était trouvé sur plusieurs sources, seule la dernière source était conservée.

**Après** : Un prospect peut avoir **plusieurs sources de scraping** simultanément. Lorsqu'un doublon est détecté, la nouvelle source est automatiquement ajoutée sans perdre les sources existantes.

## 🏗️ Architecture

### Base de données

#### Table `sources_scraping`
```sql
CREATE TABLE sources_scraping (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  couleur VARCHAR(7) DEFAULT '#3B82F6',
  actif BOOLEAN NOT NULL DEFAULT true,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Sources par défaut** :
- Pages Jaunes (#FFD700 - doré)
- Google Maps (#4285F4 - bleu)
- LinkedIn (#0077B5 - bleu LinkedIn)
- Manual (#6B7280 - gris)

#### Table de liaison `prospects_sources`
```sql
CREATE TABLE prospects_sources (
  prospect_id INT NOT NULL,
  source_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (prospect_id, source_id),
  FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources_scraping(id) ON DELETE CASCADE
);
```

**Note** : `created_at` indique la date d'association de la source au prospect.

#### Modifications table `prospects`
- **Suppression** : Colonne `source_scraping` (remplacée par la relation many-to-many)

### Backend

#### Modèles Sequelize

**Nouveau modèle** : [SourceScraping.js](backend/src/models/SourceScraping.js)
```javascript
{
  id: INTEGER (PK, AUTO_INCREMENT),
  nom: STRING(100) UNIQUE,
  description: TEXT,
  couleur: STRING(7),
  actif: BOOLEAN,
  date_creation: DATE
}
```

**Associations** dans [models/index.js](backend/src/models/index.js) :
```javascript
// Many-to-Many
Prospect.belongsToMany(SourceScraping, {
  through: "prospects_sources",
  as: "sources"
});

SourceScraping.belongsToMany(Prospect, {
  through: "prospects_sources",
  as: "prospects"
});
```

#### Controllers

**[scrapingController.js](backend/src/controllers/scrapingController.js)** :
- Fonction `saveProspects()` mise à jour pour gérer les sources multiples
- Détection de doublons par :
  - Nom entreprise + adresse
  - Nom entreprise + GPS (latitude/longitude)
  - Email unique
  - URL site unique
- Lors d'un doublon : ajout automatique de la nouvelle source
- Enrichissement automatique des données

**[prospectController.js](backend/src/controllers/prospectController.js)** :
- Inclusion des sources dans toutes les réponses API
- Support du filtre par source (requêtes SQL optimisées)
- Possibilité de filtrer par source ET tag simultanément

#### Utilitaires

**[addressNormalizer.js](backend/src/utils/addressNormalizer.js)** (NOUVEAU) :
- Fonction `normalizeAddress(address)` : Normalise une adresse pour la comparaison
- Fonction `addressesMatch(address1, address2)` : Compare deux adresses avec fuzzy matching
- Dictionnaire complet d'abréviations françaises
- Gère les variations d'écriture, accents, ponctuation, compléments
- Fonction de test intégrée pour validation

### Frontend

#### Nouveau composant : [SourceBadge.jsx](frontend/src/components/SourceBadge.jsx)

Affiche les sources de scraping sous forme de badges colorés :
```jsx
<SourceBadge prospect={prospect} />
```

Caractéristiques :
- Badges colorés selon la couleur définie dans la table `sources_scraping`
- Tooltip au survol indiquant la date d'association
- Adaptatif : plusieurs badges s'ils existent, message si aucune source

#### Composants modifiés

**[ProspectList.jsx](frontend/src/components/ProspectList.jsx)** :
- Nouvelle colonne "Sources" dans le tableau
- Affichage des badges de sources pour chaque prospect

**[ProspectCard.jsx](frontend/src/components/ProspectCard.jsx)** :
- Remplacement du badge unique par `SourceBadge` (vue grille)

**[ProspectDetailsModal.jsx](frontend/src/components/ProspectDetailsModal.jsx)** :
- Affichage des sources dans la modal de détails
- Section dédiée avec label "Sources"

**[ProspectFilters.jsx](frontend/src/components/ProspectFilters.jsx)** :
- Filtre par source déjà existant et fonctionnel
- Options : Pages Jaunes, Google Maps, LinkedIn

## 🚀 Migration

### Script de migration : [migrate-sources-scraping.js](backend/scripts/migrate-sources-scraping.js)

**Exécution** :
```bash
node backend/scripts/migrate-sources-scraping.js
```

**Étapes** :
1. Création de la table `sources_scraping`
2. Création de la table de liaison `prospects_sources`
3. Insertion des 4 sources par défaut
4. Migration des données existantes (si colonne `source_scraping` existe)
5. Suppression de la colonne `source_scraping` de la table `prospects`
6. Statistiques finales

**⚠️ Important** : La migration est **idempotente** et peut être relancée sans risque.

## 🧪 Tests

### Scripts de test

#### [test-sources-multiples.js](backend/scripts/test-sources-multiples.js)

**Exécution** :
```bash
node backend/scripts/test-sources-multiples.js
```

**Tests effectués** :
1. ✅ Vérification que les tables existent
2. ✅ Création des sources de test (Pages Jaunes, Google Maps, LinkedIn)
3. ✅ Création d'un prospect avec 1 source
4. ✅ Simulation doublon + ajout d'une 2ème source
5. ✅ Ajout d'une 3ème source
6. ✅ Vérification des associations dans la table de liaison
7. ✅ Test bonus : filtrage par source

**Résultat** : **Tous les tests passent** (6/6) ✅

#### [test-address-normalization.js](backend/scripts/test-address-normalization.js) (NOUVEAU)

**Exécution** :
```bash
node backend/scripts/test-address-normalization.js
```

**Tests effectués** :
- 12 cas de test couvrant toutes les variations d'adresses
- Inclut les exemples fournis par l'utilisateur
- Test des abréviations (boulevard/bd, avenue/av, rue/r, etc.)
- Test des compléments d'adresse (batiment, residence, etc.)
- Test des accents et de la casse
- Vérification des faux positifs (adresses réellement différentes)

**Résultat** : **Tous les tests passent** (12/12 - 100%) ✅

## 📊 Fonctionnalités

### Gestion automatique des doublons

Lors d'un scraping, si un prospect existe déjà :
1. **Détection intelligente** :
   - Par email ou URL (correspondance exacte)
   - Par nom + GPS (latitude/longitude)
   - Par nom + adresse **avec normalisation** (voir ci-dessous)
2. **Ajout source** : La nouvelle source est ajoutée (si pas déjà présente)
3. **Enrichissement** : Les données manquantes sont complétées
4. **Traçabilité** : Date d'ajout de chaque source conservée

#### Normalisation d'adresses

Pour améliorer la détection des doublons, les adresses sont normalisées avant comparaison. Cela permet de détecter les mêmes prospects même si les sources utilisent des formats différents.

**Traitements appliqués** :
- Conversion en minuscules
- Suppression des accents (`é` → `e`, `è` → `e`, etc.)
- Suppression de la ponctuation (`,`, `.`, `;`, `-`, etc.)
- Remplacement des mots complets par leurs abréviations courantes :
  - `boulevard` → `bd`, `avenue` → `av`, `rue` → `r`
  - `place` → `pl`, `cours` → `crs`, `allée` → `all`
  - `saint` → `st`, `général` → `gal`, etc.
- Suppression des compléments d'adresse :
  - Bâtiment, résidence, appartement, escalier, étage
  - Articles (`les`, `le`, `la`, `l'`)
- Comparaison avec 70% de similarité (mots en commun)

**Exemples de doublons détectés** :
```
✅ "84 boulevard Picaud" ≈ "84 bd Picaud"
✅ "2 rue felix faure" ≈ "les allées 2 rue felix faure"
✅ "15 Avenue des Champs Elysées" ≈ "15 av des Champs Elysées"
✅ "10 Place Saint-Michel, Batiment A" ≈ "10 pl St Michel"
✅ "12 Allée du Général Leclerc" ≈ "12 allee du general leclerc"
```

**Faux positifs évités** :
```
❌ "10 Rue de la Paix" ≠ "20 Rue de la Paix" (numéros différents)
❌ "42 Rue Victor Hugo" ≠ "99 Avenue de la République" (adresses différentes)
```

### Exemple de flux

```
1. Scraping Pages Jaunes → Prospect "Boulangerie Dupont" créé
   Sources: [Pages Jaunes]

2. Scraping Google Maps → Même prospect détecté (même nom + adresse)
   Sources: [Pages Jaunes, Google Maps]
   + Enrichissement : GPS ajouté

3. Scraping LinkedIn → Même prospect détecté (même nom)
   Sources: [Pages Jaunes, Google Maps, LinkedIn]
   + Enrichissement : Email ajouté
```

### API

**GET /api/prospects**
```json
{
  "data": [
    {
      "id": 1,
      "nom_entreprise": "Boulangerie Dupont",
      "sources": [
        {
          "id": 1,
          "nom": "Pages Jaunes",
          "couleur": "#FFD700",
          "prospects_sources": {
            "createdAt": "2025-12-03T10:12:31.000Z"
          }
        },
        {
          "id": 2,
          "nom": "Google Maps",
          "couleur": "#4285F4",
          "prospects_sources": {
            "createdAt": "2025-12-03T10:15:42.000Z"
          }
        }
      ],
      "tags": [...]
    }
  ]
}
```

**Filtres supportés** :
- `?source=Google Maps` : Prospects ayant cette source
- `?tag=Restaurant` : Prospects avec ce tag
- `?source=Google Maps&tag=Restaurant` : Combinaison des deux

## 🎨 Interface utilisateur

### Affichage des sources

#### Vue tableau
Colonne "Sources" avec badges colorés :
- `[Pages Jaunes]` en doré
- `[Google Maps]` en bleu
- `[LinkedIn]` en bleu LinkedIn

#### Vue grille (cartes)
Badges en haut à droite de chaque carte

#### Modal de détails
Section "Sources" avec label et badges

### Couleurs des sources

Les couleurs sont définies en base de données et peuvent être personnalisées :
```sql
UPDATE sources_scraping SET couleur = '#FF5733' WHERE nom = 'Pages Jaunes';
```

## 📝 Maintenance

### Ajouter une nouvelle source

```javascript
import { SourceScraping } from './models/index.js';

await SourceScraping.create({
  nom: 'Facebook',
  description: 'Réseau social Facebook',
  couleur: '#1877F2',
  actif: true
});
```

### Désactiver une source

```sql
UPDATE sources_scraping SET actif = false WHERE nom = 'LinkedIn';
```

### Statistiques sources

```sql
-- Nombre de prospects par source
SELECT
  ss.nom,
  COUNT(ps.prospect_id) as nb_prospects
FROM sources_scraping ss
LEFT JOIN prospects_sources ps ON ss.id = ps.source_id
GROUP BY ss.id, ss.nom
ORDER BY nb_prospects DESC;

-- Prospects avec sources multiples
SELECT
  p.nom_entreprise,
  GROUP_CONCAT(ss.nom SEPARATOR ', ') as sources
FROM prospects p
INNER JOIN prospects_sources ps ON p.id = ps.prospect_id
INNER JOIN sources_scraping ss ON ps.source_id = ss.id
GROUP BY p.id, p.nom_entreprise
HAVING COUNT(ps.source_id) > 1;
```

## 🔄 Workflow de scraping

```
┌─────────────────────┐
│  Lancer Scraping    │
│  (source, keyword)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Scraper récupère   │
│  les données        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Pour chaque prospect trouvé :      │
│  1. Vérifier si doublon existe      │
│  2. Si OUI :                         │
│     - Ajouter la nouvelle source    │
│     - Enrichir les données          │
│  3. Si NON :                         │
│     - Créer le prospect             │
│     - Associer la source            │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Prospect sauvegardé│
│  avec source(s)     │
└─────────────────────┘
```

## ✅ Avantages

1. **Traçabilité complète** : Toutes les sources d'un prospect sont conservées
2. **Enrichissement progressif** : Chaque source peut apporter de nouvelles données
3. **Pas de perte d'information** : Les sources existantes ne sont jamais écrasées
4. **Filtrage flexible** : Possibilité de filtrer par source
5. **Évolutif** : Ajout facile de nouvelles sources
6. **Performance** : Requêtes SQL optimisées avec index

## 🐛 Problèmes connus

Aucun problème connu à ce jour. Tous les tests passent. ✅

## 📚 Références

- Documentation API : [docs/API.md](docs/API.md)
- Structure BDD : [docs/DATABASE.md](docs/DATABASE.md)
- Guide de tests : [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

---

**Date de création** : 3 décembre 2025
**Dernière mise à jour** : 3 décembre 2025
**Version** : 1.0.0
**Statut** : ✅ Production Ready
