# Frontend - Interface Utilisateur

Application React pour la gestion et visualisation des prospects collectés par scraping.

## Stack Technique

- **Node.js** 22.19.0
- **React** 18.2.0
- **Vite** 5.0.8 (build tool)
- **React Router** 6.20.0 (routing)
- **TailwindCSS** 3.3.6 (styling)
- **Axios** 1.6.2 (requêtes API)

## Structure du projet

```
frontend/
├── src/
│   ├── main.jsx                   # Point d'entrée
│   ├── App.jsx                    # Composant principal avec onglets
│   ├── components/
│   │   ├── Header.jsx             # En-tête de l'application
│   │   ├── ProspectList.jsx       # Tableau prospects avec tri
│   │   ├── ProspectCard.jsx       # Carte prospect (mode grille)
│   │   ├── ProspectDetailsModal.jsx # Modal détails prospect
│   │   ├── ProspectStats.jsx      # Dashboard statistiques
│   │   ├── ProspectFilters.jsx    # Filtres (source, tag, recherche)
│   │   ├── Pagination.jsx         # Pagination avec navigation
│   │   ├── ScrapingForm.jsx       # Formulaire lancement scraping
│   │   ├── ProgressTracker.jsx    # Suivi temps réel scraping
│   │   ├── ExportMenu.jsx         # Menu export multi-format
│   │   ├── TagManager.jsx         # Gestion CRUD des tags
│   │   ├── TagBadge.jsx           # Badge tags sur prospect
│   │   ├── AntiBotConfig.jsx      # Configuration anti-bot
│   │   └── GoogleMapsConfig.jsx   # Configuration Google Maps
│   ├── pages/
│   │   ├── NotFound.jsx           # Page 404
│   │   └── ServerError.jsx        # Page 500
│   ├── services/
│   │   └── api.js                 # Service API Axios
│   ├── utils/
│   │   └── export.js              # Fonctions export CSV/JSON
│   └── styles/
│       └── index.css              # Styles Tailwind globaux
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.cjs
```

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env.local` basé sur `.env.example`

```env
VITE_API_URL=http://localhost:3001
```

## Développement

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5173`

## Build Production

```bash
npm run build
```

Les fichiers générés sont dans le dossier `dist/`

## Fonctionnalités Principales

### 1. Affichage des Prospects

#### Modes de Vue
- **Tableau** : Vue par défaut avec colonnes triables
- **Grille** : Vue en cartes pour visualisation rapide

#### Colonnes du Tableau
- **Nom de l'entreprise** (triable, largeur max 256px)
- **Adresse** (largeur max 320px)
- **Code postal** (triable)
- **Ville** (triable)
- **Téléphone** (cliquable pour appel direct)
- **Tags** (gestion inline)

Les colonnes entreprise et adresse utilisent des hauteurs de ligne variables avec retour à la ligne automatique pour éviter le débordement horizontal.

### 2. Système de Tri

Tri sur 3 colonnes :
- Nom de l'entreprise
- Code postal
- Ville

Fonctionnement :
- 1er clic : tri ascendant (ASC)
- 2ème clic : tri descendant (DESC)
- 3ème clic : réinitialisation du tri

Les icônes de tri sont affichées avec indication visuelle :
- Gris clair au survol pour colonnes non triées
- Bleu avec flèche pour colonne active

### 3. Filtrage

#### Filtre par Source
- Pages Jaunes
- Google Maps
- LinkedIn
- Manual

#### Filtre par Tag
Liste déroulante des tags disponibles

#### Recherche Textuelle
Recherche sur tous les champs :
- Nom entreprise
- Téléphone
- Email
- Adresse
- Ville
- Code postal

### 4. Export de Données

#### Modal de Sélection de Portée
Lors d'un export, une modal permet de choisir :
- **Page actuelle** : Exporte uniquement les prospects visibles (limite de pagination)
- **Tous les prospects filtrés** : Exporte tous les prospects correspondant aux filtres et tri actifs

#### Formats d'Export

**CSV (16 colonnes)**
```
ID, Entreprise, Contact, Email, Téléphone, Adresse, Ville, Code Postal,
Site Web, Latitude, Longitude, Note, Source, Tags, Date Ajout, Date Modification
```
- Encodage UTF-8 avec BOM
- Dates au format français (DD/MM/YYYY)
- Tags séparés par point-virgule
- Échappement des guillemets doubles

**JSON**
- Format complet avec tous les champs
- Indentation sur 2 espaces
- Structure identique à la réponse API

**Presse-papiers**
Format texte simplifié :
```
Entreprise - Contact
Email: xxx
Tél: xxx
Adresse
URL
---
```

### 5. Pagination

- Limite configurable : 20, 50, 100 prospects par page
- Navigation : Première, Précédente, Suivante, Dernière page
- Affichage du total de prospects filtrés
- Offset automatique avec préservation des filtres

### 6. Gestion des Tags

#### Création
- Nom (requis, 1-50 caractères)
- Couleur (sélecteur hex)

#### Association
- Ajout/retrait de tags sur prospects
- Affichage en badges colorés
- Compteur de prospects par tag

### 7. Statistiques

Dashboard avec :
- Total de prospects
- Prospects par source
- Distribution par tags
- Taux de complétion des données
- Graphiques visuels (à venir)

### 8. Lancement de Scraping

Formulaire avec :
- **Source** : Pages Jaunes, Google Maps
- **Mot-clé** : Terme de recherche
- **Localisation** : Ville/département
- **Nombre max de résultats** : 1-1000
- **Nombre max de pages** : 1-100
- **Page de départ** : 1-10000
- **Exclure les doublons** : Basé sur nom/adresse

Suivi en temps réel avec :
- Barre de progression
- Nombre de prospects trouvés
- Temps écoulé
- Statut (en cours, succès, erreur)

## Composants Clés

### ProspectList.jsx
Tableau responsive avec tri et modal de détails. Gère l'affichage en mode tableau ou grille.

**Props** :
- `prospects` : Array de prospects
- `loading` : Boolean état de chargement
- `error` : String message d'erreur
- `viewMode` : 'table' | 'grid'
- `onProspectUpdated` : Callback mise à jour
- `sortBy` : Colonne de tri active
- `sortOrder` : 'ASC' | 'DESC'
- `onSortChange` : Callback changement de tri

### ExportMenu.jsx
Menu déroulant avec modal de sélection de portée.

**Props** :
- `prospects` : Prospects de la page actuelle
- `totalCount` : Total de prospects filtrés
- `filters` : Objet avec source, tag, search
- `sorting` : Objet avec sortBy, sortOrder

**Workflow** :
1. Sélection du format (CSV, JSON, clipboard)
2. Ouverture de la modal
3. Choix de la portée (page/tous)
4. Si "tous" : fetch API avec filtres/tri
5. Export dans le format sélectionné

### ProspectFilters.jsx
Filtres avec réinitialisation et compteur de résultats.

**État géré** :
- Source de scraping
- Tag sélectionné
- Texte de recherche

### Pagination.jsx
Composant de pagination avec navigation complète.

**Features** :
- Boutons Première/Dernière page
- Sélecteur de limite (20/50/100)
- Affichage "X-Y sur Z résultats"
- Désactivation intelligente des boutons

## API Integration

### Endpoints utilisés

```javascript
// Prospects
GET    /api/prospects?limit=20&offset=0&source=&tag=&search=&sortBy=&sortOrder=
GET    /api/prospects/:id
POST   /api/prospects
PUT    /api/prospects/:id
DELETE /api/prospects/:id

// Tags
GET    /api/tags
POST   /api/tags
PUT    /api/tags/:id
DELETE /api/tags/:id
POST   /api/prospects/:id/tags
DELETE /api/prospects/:id/tags/:tagId

// Scraping
POST   /api/scraping/start
GET    /api/scraping/status/:taskId
```

### Service API (services/api.js)

Axios configuré avec :
- Base URL : `VITE_API_URL` (default: http://localhost:3001)
- Timeout : 30 secondes
- Headers automatiques

Fonctions exportées :
- `getProspects(params)`
- `getProspectById(id)`
- `createProspect(data)`
- `updateProspect(id, data)`
- `deleteProspect(id)`
- `getTags()`
- `createTag(data)`
- `updateTag(id, data)`
- `deleteTag(id)`
- `addTagToProspect(prospectId, tagId)`
- `removeTagFromProspect(prospectId, tagId)`
- `startScraping(params)`
- `getScrapingStatus(taskId)`

## Styling

### TailwindCSS Classes Principales

**Layout** :
- Container responsive avec padding
- Grid system pour cartes (1-3 colonnes selon breakpoint)
- Flexbox pour alignements

**Composants** :
- Buttons : variants primary, secondary, danger
- Inputs : border, focus states, validation
- Cards : shadow, hover effects
- Modals : backdrop blur, z-index 50
- Badges : couleurs dynamiques par tag

**Responsive** :
- Mobile first
- Breakpoints : sm (640px), md (768px), lg (1024px), xl (1280px)

### Personnalisation

Extensions TailwindCSS (tailwind.config.js) :
```javascript
theme: {
  extend: {
    colors: {
      // Couleurs personnalisées si nécessaire
    }
  }
}
```

## Gestion des Erreurs

### ErrorBoundary
Composant React Error Boundary qui capture les erreurs JavaScript et affiche une UI de secours.

### Notifications
Toast notifications pour :
- Succès : création, mise à jour, export
- Erreurs : échecs API, validation
- Info : actions en cours

### Pages d'Erreur
- **404 Not Found** : Route inexistante
- **500 Server Error** : Erreur serveur backend

## Performance

### Optimisations
- Lazy loading des composants (routes)
- Mémoization avec `useMemo` et `useCallback`
- Debouncing de la recherche textuelle (300ms)
- Pagination côté serveur
- Cache des requêtes tags

### Bundle Size
- Vite code splitting automatique
- Tree shaking des imports
- CSS purge en production

## Tests

Tests à implémenter avec Vitest :
- Unit tests des composants
- Tests d'intégration API
- Tests E2E avec Playwright

```bash
npm run test          # Lancer les tests
npm run test:ui       # Interface UI de test
npm run test:coverage # Rapport de couverture
```

## Déploiement

### Build de Production

```bash
npm run build
```

Génère le dossier `dist/` avec :
- HTML minifié
- CSS optimisé et purgé
- JS bundlé et code splitted
- Assets avec hash pour cache busting

### Serveur de Preview

```bash
npm run preview
```

Teste le build de production localement sur http://localhost:4173

## Conventions de Code

### Composants
- Utiliser des functional components avec hooks
- Un composant par fichier
- Export default pour composants principaux
- Export named pour utilitaires

### Naming
- PascalCase pour composants React
- camelCase pour fonctions et variables
- UPPER_SNAKE_CASE pour constantes
- kebab-case pour fichiers CSS

### Structure des Composants
```javascript
// Imports
import React, { useState, useEffect } from 'react';

// Composant
export default function ComponentName({ prop1, prop2 }) {
  // State
  const [state, setState] = useState(null);

  // Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // Handlers
  const handleClick = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

## Troubleshooting

### Port déjà utilisé
```bash
# Changer le port dans vite.config.js
server: { port: 5174 }
```

### Erreur CORS
Vérifier que le backend autorise `http://localhost:5173` dans les CORS.

### Styles non appliqués
```bash
# Reconstruire les assets Tailwind
npm run dev
```

### Erreur "Cannot find module"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

## Roadmap

### À venir
- [ ] Mode sombre
- [ ] Graphiques statistiques (Chart.js)
- [ ] Export Excel (.xlsx)
- [ ] Import CSV de prospects
- [ ] Notifications temps réel (WebSockets)
- [ ] Multi-sélection de prospects
- [ ] Actions en masse (tag, delete)
- [ ] Recherche avancée avec opérateurs
- [ ] Favoris et notes sur prospects
- [ ] Historique des modifications

## Contribution

Projet géré par Yannick Murat.

## License

Propriétaire - Tous droits réservés
