-- Script d'initialisation de la base de données pour Outil de Scraping
-- À exécuter une seule fois après la création de la base de données

-- ============================================================================
-- Table: prospects
-- Stocke les prospects collectés via scraping
-- ============================================================================
CREATE TABLE IF NOT EXISTS prospects (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nom_entreprise VARCHAR(255) NOT NULL,
  nom_contact VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  telephone VARCHAR(50),
  adresse TEXT,
  url_site VARCHAR(255) UNIQUE,
  source_scraping VARCHAR(100) NOT NULL DEFAULT 'Manual',
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_nom_entreprise (nom_entreprise),
  INDEX idx_email (email),
  INDEX idx_source_scraping (source_scraping),
  INDEX idx_date_ajout (date_ajout)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: tags
-- Catégories/domaines pour classifier les prospects
-- ============================================================================
CREATE TABLE IF NOT EXISTS tags (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) UNIQUE NOT NULL,
  
  INDEX idx_nom (nom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Table: prospects_tags (Relation N:M)
-- Lie les prospects aux tags
-- ============================================================================
CREATE TABLE IF NOT EXISTS prospects_tags (
  prospect_id INT NOT NULL,
  tag_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (prospect_id, tag_id),
  CONSTRAINT fk_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
  CONSTRAINT fk_tag FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,

  INDEX idx_prospect_id (prospect_id),
  INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Données de test (optionnel)
-- Décommentez pour insérer des données de test
-- ============================================================================

-- INSERT INTO tags (nom) VALUES
-- ('Restauration'),
-- ('Bâtiment'),
-- ('Technologie'),
-- ('Non-Contacté'),
-- ('Qualifié');

-- INSERT INTO prospects (nom_entreprise, nom_contact, email, telephone, adresse, url_site, source_scraping) VALUES
-- ('Plomberie Martin', 'Martin Dupont', 'contact@plomberie-martin.fr', '04 78 12 34 56', '123 Rue de la Paix, 69000 Lyon', 'https://plomberie-martin.fr', 'Google Maps'),
-- ('Électricité Dubois', 'Pierre Dubois', 'info@electricite-dubois.fr', '04 78 56 78 90', '456 Avenue des Champs, 69001 Lyon', 'https://electricite-dubois.fr', 'Pages Jaunes');

-- INSERT INTO prospects_tags (prospect_id, tag_id) VALUES
-- (1, 2), -- Plomberie Martin + Bâtiment
-- (1, 4), -- Plomberie Martin + Non-Contacté
-- (2, 2); -- Électricité Dubois + Bâtiment
