# 💾 Schéma de Base de Données

## Vue d'ensemble

Modèle de données relationnel utilisant PostgreSQL ou MySQL.

---

## Tables Principales

### Table: `prospects`

Stocke les données des prospects collectées lors du scraping.

```sql
CREATE TABLE prospects (
  id SERIAL PRIMARY KEY,
  nom_entreprise VARCHAR(255) NOT NULL,
  nom_contact VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  telephone VARCHAR(50),
  adresse TEXT,
  url_site VARCHAR(255) UNIQUE,
  source_scraping VARCHAR(100) NOT NULL,
  date_ajout TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Colonnes:**
| Colonne | Type | Contrainte | Description |
|---------|------|-----------|-------------|
| `id` | SERIAL | PK | Identifiant unique |
| `nom_entreprise` | VARCHAR(255) | NOT NULL | Nom de l'entreprise |
| `nom_contact` | VARCHAR(255) | - | Nom du contact |
| `email` | VARCHAR(255) | UNIQUE | Email professionnel |
| `telephone` | VARCHAR(50) | - | Numéro de téléphone |
| `adresse` | TEXT | - | Adresse complète |
| `url_site` | VARCHAR(255) | UNIQUE | URL du site web |
| `source_scraping` | VARCHAR(100) | NOT NULL | Source (Google Maps, Pages Jaunes) |
| `date_ajout` | TIMESTAMP | NOT NULL | Date d'ajout |
| `date_modification` | TIMESTAMP | - | Dernière modification |

---

### Table: `tags`

Catégories/domaines d'activités pour classer les prospects.

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL
);
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
  FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
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
INSERT INTO prospects (nom_entreprise, email, telephone, adresse, source_scraping)
VALUES
  ('Plomberie Martin', 'contact@plomberie-martin.fr', '04 78 12 34 56', '123 Rue de la Paix, 69000 Lyon', 'Google Maps'),
  ('Électricité Dubois', 'info@electricite-dubois.fr', '04 78 56 78 90', '456 Avenue des Champs, 69001 Lyon', 'Pages Jaunes');
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
