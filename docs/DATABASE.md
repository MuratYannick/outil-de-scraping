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
  adresse TEXT,
  url_site VARCHAR(255) UNIQUE,
  source_scraping VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,7) COMMENT 'Latitude GPS (Google Maps)',
  longitude DECIMAL(10,7) COMMENT 'Longitude GPS (Google Maps)',
  note DECIMAL(2,1) COMMENT 'Note/avis (ex: 4.5/5)',
  ville VARCHAR(100) COMMENT 'Ville extraite via geocoding inversé depuis GPS',
  code_postal VARCHAR(10) COMMENT 'Code postal extrait via geocoding inversé depuis GPS',
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
| `adresse` | TEXT | - | Adresse complète (rue) |
| `url_site` | VARCHAR(255) | UNIQUE | URL du site web ou Google Maps |
| `source_scraping` | VARCHAR(100) | NOT NULL | Source (Google Maps, Pages Jaunes) |
| `latitude` | DECIMAL(10,7) | - | Latitude GPS (Google Maps) |
| `longitude` | DECIMAL(10,7) | - | Longitude GPS (Google Maps) |
| `note` | DECIMAL(2,1) | - | Note/avis (ex: 4.5/5) |
| `ville` | VARCHAR(100) | - | Ville (geocoding inversé depuis GPS) ✨ |
| `code_postal` | VARCHAR(10) | - | Code postal (geocoding inversé depuis GPS) ✨ |
| `date_ajout` | DATETIME | NOT NULL | Date d'ajout |
| `date_modification` | DATETIME | - | Dernière modification |

> ✨ **Nouveauté (26 nov 2025)** : Les champs `ville` et `code_postal` sont extraits automatiquement depuis les coordonnées GPS via le service de geocoding inversé (API Gouvernementale française + fallback Nominatim). Voir [GEOCODING.md](GEOCODING.md) pour plus de détails.

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

## Relations

```
prospects (1) ──── (N) prospects_tags ──── (N) tags
    ↓
 Prospects peut avoir plusieurs Tags
 Tags peut être associé à plusieurs Prospects
```

---

## Exemples de Données

### Insertion de prospects

```sql
INSERT INTO prospects (
  nom_entreprise, email, telephone, adresse, url_site, source_scraping,
  latitude, longitude, note, ville, code_postal
)
VALUES
  (
    'Plomberie Martin',
    'contact@plomberie-martin.fr',
    '04 78 12 34 56',
    '123 Rue de la Paix',
    'https://plomberie-martin.fr',
    'Google Maps Scraper (Enhanced)',
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
    'Pages Jaunes',
    45.7720,
    4.8410,
    4.8,
    'Lyon',
    '69001'
  );
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

-- Optimiser les filtres par source
CREATE INDEX idx_prospects_source ON prospects(source_scraping);

-- Optimiser les recherches par date
CREATE INDEX idx_prospects_date_ajout ON prospects(date_ajout);

-- Optimiser les filtres géographiques ✨ NOUVEAUX
CREATE INDEX idx_prospects_ville ON prospects(ville);
CREATE INDEX idx_prospects_code_postal ON prospects(code_postal);
CREATE INDEX idx_prospects_coords ON prospects(latitude, longitude);

-- Optimiser les jointures tags
CREATE INDEX idx_prospects_tags_prospect ON prospects_tags(prospect_id);
CREATE INDEX idx_prospects_tags_tag ON prospects_tags(tag_id);
```

---

## Diagramme ER

```
┌─────────────────────┐
│     prospects       │
├─────────────────────┤
│ id (PK)             │
│ nom_entreprise      │
│ nom_contact         │
│ email               │
│ telephone           │
│ adresse             │
│ url_site            │
│ source_scraping     │
│ date_ajout          │
└─────────────────────┘
          │
          │ (N)
          │
┌─────────────────────┐
│ prospects_tags (N:M)│
├─────────────────────┤
│ prospect_id (FK)    │
│ tag_id (FK)         │
└─────────────────────┘
          │
          │ (N)
          │
    ┌─────────────┐
    │    tags     │
    ├─────────────┤
    │ id (PK)     │
    │ nom         │
    └─────────────┘
```
