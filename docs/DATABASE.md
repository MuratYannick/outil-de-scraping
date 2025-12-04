# 💾 Schéma de Base de Données

## Vue d'ensemble

Modèle de données relationnel ciblant **MySQL** (utilisation via Sequelize recommandée).

---

## Tables Principales

### Table: `prospects`

Stocke les données des prospects collectées lors du scraping.

```sql
CREATE TABLE prospects (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nom_entreprise VARCHAR(255) NOT NULL,
  nom_contact VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  telephone VARCHAR(50),
  adresse VARCHAR(500),
  url_site VARCHAR(255) UNIQUE,
  latitude DECIMAL(10,7) COMMENT 'Latitude GPS (Google Maps)',
  longitude DECIMAL(10,7) COMMENT 'Longitude GPS (Google Maps)',
  note DECIMAL(2,1) COMMENT 'Note/avis (ex: 4.5/5)',
  ville VARCHAR(100) COMMENT 'Ville extraite via geocoding inversé depuis GPS',
  code_postal VARCHAR(10) COMMENT 'Code postal extrait via geocoding inversé depuis GPS',
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_entreprise_adresse (nom_entreprise, adresse)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Colonnes:**
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INT AUTO_INCREMENT | PK | Identifiant unique |
| `nom_entreprise` | VARCHAR(255) | NOT NULL | Nom de l'entreprise |
| `nom_contact` | VARCHAR(255) | - | Nom du contact |
| `email` | VARCHAR(255) | UNIQUE | Email professionnel |
| `telephone` | VARCHAR(50) | - | Numéro de téléphone |
| `adresse` | VARCHAR(500) | - | Adresse complète (rue) |
| `url_site` | VARCHAR(255) | UNIQUE | URL du site web |
| `latitude` | DECIMAL(10,7) | - | Latitude GPS (Google Maps) |
| `longitude` | DECIMAL(10,7) | - | Longitude GPS (Google Maps) |
| `note` | DECIMAL(2,1) | - | Note/avis (ex: 4.5/5) |
| `ville` | VARCHAR(100) | - | Ville (geocoding inversé depuis GPS) ✨ |
| `code_postal` | VARCHAR(10) | - | Code postal (geocoding inversé depuis GPS) ✨ |
| `date_ajout` | DATETIME | NOT NULL | Date d'ajout |
| `date_modification` | DATETIME | - | Dernière modification |

> ✨ **Nouveauté (26 nov 2025)** : Les champs `ville` et `code_postal` sont extraits automatiquement depuis les coordonnées GPS via le service de geocoding inversé (API Gouvernementale française + fallback Nominatim). Voir [GEOCODING.md](GEOCODING.md) pour plus de détails.

> 🎯 **Nouveauté (3 déc 2025)** : La colonne `source_scraping` a été **supprimée** et remplacée par une relation many-to-many avec la table `sources_scraping`. Un prospect peut maintenant avoir **plusieurs sources** (Pages Jaunes, Google Maps, LinkedIn, etc.). Voir section "Sources Multiples" ci-dessous.

---

### Table: `tags`

Catégories/domaines d'activités pour classer les prospects.

```sql
CREATE TABLE tags (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Colonnes:**
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | SERIAL | PK | Identifiant unique |
| `nom` | VARCHAR(100) | UNIQUE, NOT NULL | Nom du tag |

---

### Table: `sources_scraping` 🎯 NOUVEAU

Référentiel des sources de scraping (Pages Jaunes, Google Maps, LinkedIn, etc.).

```sql
CREATE TABLE sources_scraping (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  couleur VARCHAR(7) DEFAULT '#3B82F6',
  actif BOOLEAN NOT NULL DEFAULT true,
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Colonnes:**
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | INT AUTO_INCREMENT | PK | Identifiant unique |
| `nom` | VARCHAR(100) | UNIQUE, NOT NULL | Nom de la source (ex: "Pages Jaunes") |
| `description` | TEXT | - | Description optionnelle |
| `couleur` | VARCHAR(7) | - | Code couleur hex pour badges (ex: #FFD700) |
| `actif` | BOOLEAN | NOT NULL | Indique si la source est active |
| `date_creation` | DATETIME | NOT NULL | Date de création |

**Sources par défaut :**
- Pages Jaunes (#FFD700 - doré)
- Google Maps (#4285F4 - bleu)
- LinkedIn (#0077B5 - bleu LinkedIn)
- Manual (#6B7280 - gris)

---

### Table: `prospects_tags` (Relation N:M)

Table de jointure pour établir la relation entre prospects et tags.

```sql
CREATE TABLE prospects_tags (
  prospect_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (prospect_id, tag_id),
  CONSTRAINT fk_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Colonnes:**
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `prospect_id` | INT | FK, PK | Référence prospect |
| `tag_id` | INT | FK, PK | Référence tag |

---

### Table: `prospects_sources` (Relation N:M) 🎯 NOUVEAU

Table de jointure pour établir la relation entre prospects et sources de scraping.
Permet à un prospect d'avoir **plusieurs sources**.

```sql
CREATE TABLE prospects_sources (
  prospect_id INT NOT NULL,
  source_id INT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (prospect_id, source_id),
  CONSTRAINT fk_prospect_source FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_source FOREIGN KEY (source_id) REFERENCES sources_scraping(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Colonnes:**
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `prospect_id` | INT | FK, PK | Référence prospect |
| `source_id` | INT | FK, PK | Référence source de scraping |
| `created_at` | DATETIME | NOT NULL | Date d'association de la source |
| `updated_at` | DATETIME | NOT NULL | Dernière mise à jour |

**Exemple d'utilisation :**
Un prospect trouvé sur Pages Jaunes puis sur Google Maps aura 2 entrées dans cette table :
- `(prospect_id=1, source_id=1)` - Pages Jaunes
- `(prospect_id=1, source_id=2)` - Google Maps

---

## Relations

```
prospects (1) ──── (N) prospects_tags ──── (N) tags
    ↓
    │
    └──── (N) prospects_sources ──── (N) sources_scraping

 Prospects peut avoir plusieurs Tags
 Tags peut être associé à plusieurs Prospects

 Prospects peut avoir plusieurs Sources 🎯 NOUVEAU
 Sources peut être associée à plusieurs Prospects 🎯 NOUVEAU
```

---

## Exemples de Données

### Insertion de sources de scraping 🎯 NOUVEAU

```sql
INSERT INTO sources_scraping (nom, description, couleur, actif)
VALUES
  ('Pages Jaunes', 'Annuaire professionnel français', '#FFD700', true),
  ('Google Maps', 'Service de cartographie Google', '#4285F4', true),
  ('LinkedIn', 'Réseau social professionnel', '#0077B5', true),
  ('Manual', 'Saisie manuelle', '#6B7280', true);
```

### Insertion de prospects

```sql
INSERT INTO prospects (
  nom_entreprise, email, telephone, adresse, url_site,
  latitude, longitude, note, ville, code_postal
)
VALUES
  (
    'Plomberie Martin',
    'contact@plomberie-martin.fr',
    '04 78 12 34 56',
    '123 Rue de la Paix',
    'https://plomberie-martin.fr',
    45.7640,
    4.8357,
    4.5,
    'Lyon',
    '69002'
  ),
  (
    'Électricité Dubois',
    'info@electricite-dubois.fr',
    '04 78 56 78 90',
    '456 Avenue des Champs',
    'https://electricite-dubois.fr',
    45.7720,
    4.8410,
    4.8,
    'Lyon',
    '69001'
  );

-- Associer les prospects aux sources 🎯 NOUVEAU
INSERT INTO prospects_sources (prospect_id, source_id, created_at, updated_at)
VALUES
  (1, 2, NOW(), NOW()),  -- Plomberie Martin trouvée sur Google Maps
  (1, 1, NOW(), NOW()),  -- Plomberie Martin trouvée aussi sur Pages Jaunes
  (2, 1, NOW(), NOW());  -- Électricité Dubois sur Pages Jaunes
```

### Insertion de tags

```sql
INSERT INTO tags (nom)
VALUES
  ('Restauration'),
  ('Bâtiment'),
  ('Technologie'),
  ('Non-Contacté'),
  ('Qualifié');
```

### Association prospect-tag

```sql
INSERT INTO prospects_tags (prospect_id, tag_id)
VALUES
  (1, 2),  -- Plomberie Martin + Bâtiment
  (1, 4);  -- Plomberie Martin + Non-Contacté
```

---

## Indices Recommandés

```sql
-- Optimiser les recherches par email
CREATE INDEX idx_prospects_email ON prospects(email);

-- Optimiser les recherches par date
CREATE INDEX idx_prospects_date_ajout ON prospects(date_ajout);

-- Optimiser les filtres géographiques
CREATE INDEX idx_prospects_ville ON prospects(ville);
CREATE INDEX idx_prospects_code_postal ON prospects(code_postal);
CREATE INDEX idx_prospects_coords ON prospects(latitude, longitude);

-- Optimiser les jointures tags
CREATE INDEX idx_prospects_tags_prospect ON prospects_tags(prospect_id);
CREATE INDEX idx_prospects_tags_tag ON prospects_tags(tag_id);

-- Optimiser les jointures sources 🎯 NOUVEAU
CREATE INDEX idx_prospects_sources_prospect ON prospects_sources(prospect_id);
CREATE INDEX idx_prospects_sources_source ON prospects_sources(source_id);

-- Optimiser les recherches par nom de source 🎯 NOUVEAU
CREATE INDEX idx_sources_scraping_nom ON sources_scraping(nom);
```

---

## Diagramme ER

```
┌──────────────────────┐
│   sources_scraping   │ 🎯 NOUVEAU
├──────────────────────┤
│ id (PK)              │
│ nom (UNIQUE)         │
│ description          │
│ couleur              │
│ actif                │
│ date_creation        │
└──────────────────────┘
          │
          │ (N)
          │
┌─────────────────────────┐
│ prospects_sources (N:M) │ 🎯 NOUVEAU
├─────────────────────────┤
│ prospect_id (FK,PK)     │
│ source_id (FK,PK)       │
│ created_at              │
│ updated_at              │
└─────────────────────────┘
          │
          │ (N)
          │
┌─────────────────────┐
│     prospects       │
├─────────────────────┤
│ id (PK)             │
│ nom_entreprise      │
│ nom_contact         │
│ email (UNIQUE)      │
│ telephone           │
│ adresse             │
│ url_site (UNIQUE)   │
│ latitude            │
│ longitude           │
│ note                │
│ ville               │
│ code_postal         │
│ date_ajout          │
└─────────────────────┘
          │
          │ (N)
          │
┌─────────────────────┐
│ prospects_tags (N:M)│
├─────────────────────┤
│ prospect_id (FK,PK) │
│ tag_id (FK,PK)      │
└─────────────────────┘
          │
          │ (N)
          │
    ┌─────────────┐
    │    tags     │
    ├─────────────┤
    │ id (PK)     │
    │ nom (UNIQUE)│
    └─────────────┘
```

---

## Requêtes SQL Utiles 🎯 NOUVEAU

### Lister les prospects avec toutes leurs sources

```sql
SELECT
  p.id,
  p.nom_entreprise,
  GROUP_CONCAT(ss.nom SEPARATOR ', ') as sources,
  COUNT(ps.source_id) as nb_sources
FROM prospects p
LEFT JOIN prospects_sources ps ON p.id = ps.prospect_id
LEFT JOIN sources_scraping ss ON ps.source_id = ss.id
GROUP BY p.id, p.nom_entreprise
ORDER BY nb_sources DESC, p.nom_entreprise;
```

### Prospects avec sources multiples

```sql
SELECT
  p.nom_entreprise,
  GROUP_CONCAT(ss.nom ORDER BY ps.created_at ASC SEPARATOR ', ') as sources,
  COUNT(ps.source_id) as nb_sources
FROM prospects p
INNER JOIN prospects_sources ps ON p.id = ps.prospect_id
INNER JOIN sources_scraping ss ON ps.source_id = ss.id
GROUP BY p.id, p.nom_entreprise
HAVING COUNT(ps.source_id) > 1
ORDER BY nb_sources DESC;
```

### Statistiques par source

```sql
SELECT
  ss.nom as source,
  ss.couleur,
  COUNT(ps.prospect_id) as nb_prospects,
  COUNT(DISTINCT ps.prospect_id) as nb_prospects_uniques
FROM sources_scraping ss
LEFT JOIN prospects_sources ps ON ss.id = ps.source_id
GROUP BY ss.id, ss.nom, ss.couleur
ORDER BY nb_prospects DESC;
```

### Trouver les prospects présents sur une source spécifique

```sql
SELECT p.*
FROM prospects p
INNER JOIN prospects_sources ps ON p.id = ps.prospect_id
INNER JOIN sources_scraping ss ON ps.source_id = ss.id
WHERE ss.nom = 'Google Maps';
```
