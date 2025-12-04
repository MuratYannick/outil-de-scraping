# Changelog - Outil de Scraping

## [Non versionnée] - 3 Décembre 2025

### ✨ Nouvelle Fonctionnalité : Interface de Nettoyage des Doublons
**Date** : 3 décembre 2025 (nuit - suite)

**Objectif** : Permettre à l'utilisateur de nettoyer les doublons directement depuis l'interface web.

**Fonctionnalités ajoutées** :

1. **API Backend** :
   - Route `GET /api/prospects/duplicates/detect` - Détecte les doublons
   - Route `POST /api/prospects/duplicates/clean` - Fusionne les doublons
   - Service `duplicateCleanerService.js` - Logique réutilisable extraite du script CLI

2. **Interface Frontend** :
   - Composant `DuplicateCleanerButton.jsx` - Bouton avec modal de confirmation
   - Modal d'affichage des doublons détectés avec comparaison visuelle
   - Intégration dans la barre d'actions de la page Prospects
   - Rafraîchissement automatique après nettoyage

3. **Fonctionnement** :
   - Clic sur "Nettoyer les doublons" → Détection en cours
   - Affichage d'un modal listant tous les doublons avec détails
   - Confirmation requise avant fusion
   - Fusion avec indicateur de progression
   - Message de succès avec statistiques

**Fichiers créés** :
- `backend/src/services/duplicateCleanerService.js` - Service de détection et fusion
- `frontend/src/components/DuplicateCleanerButton.jsx` - Composant React du bouton

**Fichiers modifiés** :
- `backend/src/controllers/prospectController.js` - Ajout des contrôleurs d'API
- `backend/src/routes/prospectRoutes.js` - Ajout des routes
- `frontend/src/services/api.js` - Ajout des appels API
- `frontend/src/App.jsx` - Intégration du bouton

**Avantages** :
- Plus besoin d'utiliser le terminal pour nettoyer les doublons
- Interface visuelle pour voir exactement ce qui sera fusionné
- Confirmation interactive avant toute modification
- Retour immédiat avec statistiques détaillées

---

### 🔧 Amélioration : Détection de Doublons Plus Stricte
**Date** : 3 décembre 2025 (nuit)

**Objectif** : Affiner la logique de détection pour éviter les faux positifs.

**Modifications apportées** :
1. **Changement du critère obligatoire** : Code postal au lieu de ville
   - Rationale : Plusieurs villes peuvent avoir le même nom
   - Empêche les fusions erronées entre villes homonymes

2. **Logique combinée (AND au lieu de OR)** :
   - **Chemin A** (avec adresses) : Requiert adresse similaire **ET** nom similaire (≥85%)
   - **Chemin B** (sans adresse) : Requiert nom similaire (≥85%) **ET** au moins un contact identique
   - Empêche la fusion de différentes entreprises dans le même immeuble
   - Empêche la fusion de plusieurs agences d'une même entreprise

3. **Amélioration de l'algorithme de similarité des noms** :
   - Implémentation complète de l'algorithme de Levenshtein (matrice)
   - Normalisation avancée : suppression accents, apostrophes, tirets
   - Détection des noms contenus dans d'autres (ex: "L'Entr Potes" ⊂ "L'ENTR'potes - Restaurant")
   - Comparaison basée sur les mots (ordre différent acceptable)
   - Similarité par intersection de mots (≥65% de mots en commun)

4. **Fichiers modifiés** :
   - `backend/scripts/clean-merge-duplicates.js` - Logique de détection affinée
   - `CLEAN_MERGE.md` - Documentation mise à jour avec exemples de non-doublons
   - `backend/scripts/test-duplicate-detection-logic.js` - Suite de tests complète (10 tests)

**Résultats des tests** :
- ✅ 10/10 tests passent (100%)
- Détecte correctement le cas "L'Entr Potes"
- Évite les faux positifs (entreprises différentes, agences multiples)

---

### ✨ Nouvelle Fonctionnalité : Nettoyage et Fusion des Doublons
**Date** : 3 décembre 2025 (soir)

**Objectif** : Nettoyer la base de données en détectant et fusionnant intelligemment les prospects en doublon.

**Problématique résolue** :
- Un même prospect peut être enregistré plusieurs fois avec des variations de nom ou d'adresse
- Exemple : "L'Entr Potes" (Pages Jaunes) vs "L'ENTR'potes - Restaurant - Hyères" (Google Maps)
- Données fragmentées entre plusieurs enregistrements

**Critères de détection (logique initiale, affinée ensuite - voir ci-dessus)** :
1. **Obligatoire** : Même code postal (modifié de "ville" vers "code postal")
2. **Chemin A** (avec adresses) : Adresse similaire **ET** nom similaire
3. **Chemin B** (sans adresse) : Nom similaire **ET** contact identique

**Stratégie de fusion** :
- Conserve le prospect avec le plus de champs remplis
- Fusionne tous les tags des deux prospects
- Fusionne toutes les sources des deux prospects
- Enrichit avec les données manquantes
- Supprime le doublon

**Fichiers créés** :
- `backend/scripts/clean-merge-duplicates.js` - Script principal de nettoyage
- `backend/scripts/test-clean-merge.js` - Script de test avec exemple
- `CLEAN_MERGE.md` - Documentation complète (500+ lignes)

**Commande** :
```bash
npm run db:clean-merge
```

**Fonctionnalités** :
- Groupement par ville pour optimisation
- Algorithme de similarité de Levenshtein pour les noms
- Utilisation de l'addressNormalizer pour les adresses
- Transaction atomique par fusion (rollback en cas d'erreur)
- Confirmation interactive avant fusion
- Rapport détaillé des doublons détectés
- Statistiques finales

**Exemple de résultat** :
- Avant : 2 prospects ("L'Entr Potes" + "L'ENTR'potes - Restaurant - Hyères")
- Après : 1 prospect avec toutes les données fusionnées (téléphone + GPS + note + 2 tags + 2 sources)

**Documentation** : Voir [CLEAN_MERGE.md](CLEAN_MERGE.md)

---

### 🐛 Correction : Extraction URL site web Pages Jaunes
**Date** : 3 décembre 2025 (soir)

**Problème** : Le scraper Pages Jaunes n'extrayait pas l'URL du site web des entreprises lorsqu'elle était disponible.

**Exemple** : Pour "Caron Plomberie" à Hyères, l'URL `http://www.caronplomberie.fr` n'était pas récupérée.

**Cause** : Le sélecteur cherchait `.bi-website a` alors que la structure HTML utilise `a.bi-website` (le lien a directement la classe).

**Fichier corrigé** :
- `backend/src/services/scrapers/pagesJaunesScraper.js` :
  - Ajout de `a.bi-website` en premier sélecteur (priorité)
  - Ajout de `.bi-address a.bi-website` comme alternative
  - Ajout d'un filtre pour exclure les liens internes Pages Jaunes
  - Vérification que l'URL ne contient pas 'pagesjaunes.fr' et ne commence pas par '#'

**Test** :
- Création de `backend/scripts/test-pages-jaunes-website-url.js`
- Test avec l'HTML réel de la carte Caron Plomberie
- ✅ Test passé : URL correctement extraite

**Résultat** : Les URLs des sites web des entreprises sont maintenant correctement récupérées depuis Pages Jaunes.

---

### 🐛 Correction : Scripts db:drop et db:clear
**Date** : 3 décembre 2025 (après-midi)

**Problème** : Les scripts `npm run db:drop` et `npm run db:clear` ne supprimaient pas les nouvelles tables `prospects_sources` et `sources_scraping`.

**Fichiers corrigés** :
- `backend/scripts/drop.js` :
  - Ajout de la suppression de `prospects_sources`
  - Ajout de la suppression de `sources_scraping`
  - Mise à jour des messages de confirmation
- `backend/scripts/clear.js` :
  - Import de `SourceScraping`
  - Ajout du comptage des sources
  - Ajout du vidage de `prospects_sources`
  - Ajout du vidage de `sources_scraping`

**Résultat** : Les commandes `db:drop` et `db:clear` nettoient maintenant correctement toutes les tables du système.

---

### 🔥 Amélioration Critique : Normalisation d'Adresses
**Date** : 3 décembre 2025 (après-midi)

**Objectif** : Améliorer la détection des doublons en normalisant les adresses avant comparaison.

**Problématique résolue** :
- Pages Jaunes utilise des adresses complètes : "84 boulevard Picaud"
- Google Maps utilise des abréviations : "84 bd Picaud"
- Avec/sans compléments : "2 rue felix faure" vs "les allées 2 rue felix faure"
- → Sans normalisation, ces adresses créaient des prospects en double

**Solution implémentée** :
- Nouveau fichier utilitaire : `backend/src/utils/addressNormalizer.js`
- Fonction `normalizeAddress()` : 8 étapes de normalisation
- Fonction `addressesMatch()` : Comparaison fuzzy avec 70% de similarité
- Intégration dans `scrapingController.js` pour la détection de doublons

**Traitements de normalisation** :
1. Conversion en minuscules
2. Suppression des accents (NFD normalization)
3. Suppression de la ponctuation (`,`, `.`, `;`, `-`)
4. Remplacement des mots par abréviations :
   - `boulevard` → `bd`, `avenue` → `av`, `rue` → `r`
   - `place` → `pl`, `cours` → `crs`, `allée` → `all`
   - `saint` → `st`, `général` → `gal`, etc.
   - 67 abréviations dans le dictionnaire
5. Suppression des compléments (batiment, residence, appartement, etc.)
6. Suppression des articles (`les`, `le`, `la`, `l'`)
7. Nettoyage des espaces multiples
8. Filtrage des mots courts non essentiels

**Fichiers créés** :
- `backend/src/utils/addressNormalizer.js` - Utilitaire de normalisation
- `backend/scripts/test-address-normalization.js` - Tests (12 cas, 100% réussis)

**Fichiers modifiés** :
- `backend/src/controllers/scrapingController.js` :
  - Import de `addressesMatch()`
  - Fonction `isDuplicate` : Utilise normalisation pour vérification en temps réel
  - Fonction `saveProspects()` : Détection en 2 étapes (exact + normalisé)
  - Logs détaillés quand doublon détecté via normalisation

**Tests** :
```bash
node backend/scripts/test-address-normalization.js
# ✅ 12/12 tests passés (100%)
```

**Exemples de doublons maintenant détectés** :
- ✅ "84 boulevard Picaud" ≈ "84 bd Picaud"
- ✅ "2 rue felix faure" ≈ "les allées 2 rue felix faure"
- ✅ "15 Avenue des Champs Elysées" ≈ "15 av des Champs Elysées"
- ✅ "10 Place Saint-Michel, Batiment A" ≈ "10 pl St Michel"

**Documentation mise à jour** :
- `SOURCES_MULTIPLES.md` : Nouvelle section "Normalisation d'adresses"

---

### 🎯 Fonctionnalité Majeure : Système de Sources Multiples

#### Implémentation : Gestion des sources multiples pour les prospects
**Date** : 3 décembre 2025

**Objectif** : Permettre à un prospect d'avoir plusieurs sources de scraping et tracer l'origine complète des données.

**Problématique résolue** :
- Avant : Un prospect ne pouvait avoir qu'une seule source. Si trouvé sur plusieurs sources, seule la dernière était conservée.
- Après : Un prospect peut avoir plusieurs sources simultanément. Lors d'un doublon, la nouvelle source est automatiquement ajoutée sans perdre les sources existantes.

**Architecture Base de Données** :

1. **Nouvelle table `sources_scraping`** :
   - `id` (PK, AUTO_INCREMENT)
   - `nom` (VARCHAR 100, UNIQUE) - Ex: "Pages Jaunes", "Google Maps"
   - `description` (TEXT)
   - `couleur` (VARCHAR 7) - Code hex pour badges colorés
   - `actif` (BOOLEAN)
   - `date_creation` (DATETIME)
   - Sources par défaut créées : Pages Jaunes (#FFD700), Google Maps (#4285F4), LinkedIn (#0077B5), Manual (#6B7280)

2. **Table de liaison `prospects_sources`** (Many-to-Many) :
   - `prospect_id` (FK → prospects.id)
   - `source_id` (FK → sources_scraping.id)
   - `created_at` (DATETIME) - Date d'association
   - `updated_at` (DATETIME)
   - Clé primaire composite : (prospect_id, source_id)

3. **Modification table `prospects`** :
   - Suppression de la colonne `source_scraping`

**Backend** :

1. **Nouveau modèle Sequelize** :
   - `backend/src/models/SourceScraping.js` (nouveau)
   - Associations many-to-many configurées dans `models/index.js`

2. **Controllers mis à jour** :
   - `scrapingController.js` :
     - Fonction `saveProspects()` réécrite pour gérer sources multiples
     - Détection doublons par : nom+adresse, nom+GPS, email, URL
     - Ajout automatique de sources lors de doublons
     - Enrichissement automatique des données
   - `prospectController.js` :
     - Inclusion des sources dans toutes les réponses API
     - Requêtes SQL optimisées pour filtrage par source
     - Support filtre source + tag simultanément

**Frontend** :

1. **Nouveau composant** :
   - `frontend/src/components/SourceBadge.jsx` :
     - Affiche badges colorés des sources
     - Tooltip avec date d'association
     - Adaptatif selon nombre de sources

2. **Composants modifiés** :
   - `ProspectList.jsx` : Nouvelle colonne "Sources" dans tableau
   - `ProspectCard.jsx` : Badges sources dans vue grille
   - `ProspectDetailsModal.jsx` : Section sources dans modal détails

**Migration & Tests** :

1. **Script de migration** :
   - `backend/scripts/migrate-sources-scraping.js`
   - Idempotent, peut être relancé sans risque
   - Migre automatiquement les données existantes

2. **Script de test** :
   - `backend/scripts/test-sources-multiples.js`
   - **6/6 tests passent** ✅
   - Teste création, doublon, sources multiples, filtrage

**Fichiers créés** :
- `backend/src/models/SourceScraping.js` (39 lignes)
- `backend/scripts/migrate-sources-scraping.js` (200 lignes)
- `backend/scripts/test-sources-multiples.js` (180 lignes)
- `frontend/src/components/SourceBadge.jsx` (24 lignes)
- `SOURCES_MULTIPLES.md` (documentation complète, 450 lignes)

**Fichiers modifiés** :
- `backend/src/models/Prospect.js` (-8 lignes)
- `backend/src/models/index.js` (+18 lignes)
- `backend/src/controllers/scrapingController.js` (+142 lignes)
- `backend/src/controllers/prospectController.js` (+95 lignes)
- `frontend/src/components/ProspectList.jsx` (+4 lignes)
- `frontend/src/components/ProspectCard.jsx` (+3 lignes)
- `frontend/src/components/ProspectDetailsModal.jsx` (+8 lignes)

**Bénéfices utilisateur** :
- ✅ Traçabilité complète de toutes les sources d'un prospect
- ✅ Enrichissement progressif des données (chaque source apporte de nouvelles infos)
- ✅ Aucune perte d'information lors de doublons
- ✅ Filtrage par source fonctionnel
- ✅ Interface visuelle claire avec badges colorés
- ✅ Performance optimisée avec requêtes SQL indexées

**Documentation** :
- Guide complet dans `SOURCES_MULTIPLES.md`
- Exemples de requêtes SQL pour statistiques
- Workflow détaillé du scraping avec sources multiples

---

## [Non versionnée] - 26 Novembre 2025

### ✨ Améliorations UX

#### Amélioration : Refonte de l'affichage de la liste des prospects
**Date** : 26 novembre 2025

**Objectif** : Améliorer la lisibilité et l'accès aux informations des prospects dans l'interface.

**Modifications apportées** :

1. **Nouvelle organisation des colonnes du tableau** :
   - Nom de l'entreprise (cliquable en bleu)
   - Adresse
   - Code postal
   - Ville
   - Téléphone
   - Tags

2. **Modal de détails complets** :
   - Créé composant `ProspectDetailsModal.jsx`
   - Affiche toutes les informations du prospect :
     - Coordonnées complètes (adresse, CP, ville, téléphone, email)
     - Informations complémentaires (contact, poste, site web, LinkedIn)
     - Note/avis avec étoile
     - Coordonnées GPS avec lien Google Maps
     - Tags avec gestion complète
     - Source et date d'ajout
   - Design moderne avec layout en deux colonnes
   - Scroll interne si contenu long

3. **Interaction améliorée** :
   - Clic sur nom d'entreprise ouvre la modal
   - Téléphone reste cliquable (appel direct)
   - Adresse tronquée avec tooltip au survol
   - Tags directement modifiables depuis modal

**Fichiers créés** :
- `frontend/src/components/ProspectDetailsModal.jsx` (236 lignes)

**Fichiers modifiés** :
- `frontend/src/components/ProspectList.jsx` (152 lignes, +84 insertions)

**Bénéfices utilisateur** :
- ✅ Vision synthétique dans le tableau
- ✅ Accès rapide aux détails complets
- ✅ Mise en valeur des nouvelles données (ville, code postal)
- ✅ Meilleure ergonomie mobile (modal responsive)
- ✅ Toutes les infos accessibles en 1 clic

**Commit** : `dc7252a` feat(frontend): réorganiser affichage prospects + modal détails

---

### 🐛 Corrections majeures

#### Correction : Extraction URL site web vs URL Google Maps
**Date** : 26 novembre 2025

**Symptôme** : L'extraction Google Maps récupérait l'URL du lieu sur Google Maps au lieu de l'URL du site web de l'entreprise.

**Exemple** :
- ❌ URL incorrecte : `https://www.google.com/maps/place/Élégance+plomberie/data=!4m7!3m6!...`
- ✅ URL correcte : `https://elegance-plombier.fr/`

**Cause racine** :
- Le sélecteur `a[href*="/maps/place/"]` récupérait le lien Google Maps
- Ce lien était ensuite copié dans le champ `url_site` (ligne 539)

**Solution** :
- Ajout de sélecteurs spécifiques pour le site web :
  - `a[data-value="Site Web"]` (sélecteur principal)
  - `a[aria-label*="Visiter le site"]` (fallback 1)
  - `a[aria-label*="site web" i]` (fallback 2)
  - `a.lcr4fd[href]:not([href*="google.com"])` (fallback 3)
- Séparation claire entre `url_maps` (Google Maps) et `url_site` (site web externe)
- Suppression du mapping incorrect `url_site = url_maps`

**Test de validation** :
- Script : `backend/scripts/test-google-maps-website-url.js`
- Recherche : "plombier" à "Cannes"
- Résultat : ✅ 100% (5/5 prospects avec URL site web correcte)

**Exemples d'URLs extraites** :
```
1. Élégance plomberie → https://elegance-plombier.fr/
2. Art André → http://art-andre-depannage.fr/
3. Azur Service 06 → https://www.azur-service06.fr/depannage-plomberie
4. Allo James → http://plombier-cannes-allo-james.fr/
5. CL Plomberie → https://www.cl-plomberie-cannes.fr/
```

**Fichiers modifiés** :
- `backend/src/services/googleMapsService.js` (lignes 530-548)

**Fichiers créés** :
- `backend/scripts/test-google-maps-website-url.js` (nouveau test)

**Commit** : `4076b82` fix(google-maps): extraire URL site web au lieu URL Google Maps

---

#### Correction : Téléphones extraits dans le champ adresse
**Date** : 26 novembre 2025

**Symptôme** : Pour les prospects sans adresse physique sur Google Maps, le numéro de téléphone était parfois extrait dans le champ `adresse` au lieu de rester à `null`.

**Exemple** :
- ❌ Avant : `adresse='01 86 95 96 67'`, `telephone='01 86 95 96 67'`
- ✅ Après : `adresse=null`, `telephone='01 86 95 96 67'`

**Cause racine** :
- L'algorithme de scoring des candidats d'adresse ne filtrait pas les numéros de téléphone
- Un texte contenant uniquement un téléphone pouvait obtenir un score positif s'il commençait par un chiffre

**Solution** :
- Ajout d'une détection de pattern téléphone AVANT le scoring d'adresse
- Skip automatique des éléments matchant le pattern téléphone français
- Pattern utilisé : `/\b0[1-9](?:[\s\.]?\d{2}){4}\b|\b\+33[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/`

**Test de validation** :
- Script : `backend/scripts/test-adresse-vs-telephone.js`
- Recherche : "plombier" à "Paris 15" (10 prospects)
- Résultat : ✅ 100% de séparation correcte

**Métriques** :
```
Total prospects: 10
✅ Avec adresse valide (sans téléphone): 9/10 (90%)
✅ Sans adresse (normal): 1/10 (10%)
❌ Téléphone dans adresse: 0/10 (0%)
```

**Exemple de prospect corrigé** :
- **Art André** : `adresse=null`, `telephone='01 86 95 96 67'` ✅

**Fichiers modifiés** :
- `backend/src/services/googleMapsService.js` (lignes 457-460)

**Fichiers créés** :
- `backend/scripts/test-adresse-vs-telephone.js` (nouveau test)

**Commit** : `858c93d` fix(google-maps): empêcher téléphones d'être extraits comme adresse

---

#### Problème : Données manquantes en base de données (téléphone, URL, note, GPS)
**Symptôme** : Lors du scraping Google Maps, seuls le nom et l'adresse étaient sauvegardés en base de données, alors que téléphone, URL, note et coordonnées GPS étaient bien extraits.

**Cause racine** :
1. Dans `googleMapsService.js` (lignes 546-547), les coordonnées GPS étaient forcées à `null` après extraction
2. Dans `scrapingController.js` (ligne 188-196), la fonction `saveProspects()` ne mappait pas les champs `telephone`, `latitude`, `longitude` et `note`
3. La regex d'extraction GPS utilisait le mauvais format (`@lat,lng` au lieu de `!3d...!4d...`)

**Solution** :
- ✅ Supprimé les lignes forçant GPS à `null` dans `googleMapsService.js`
- ✅ Ajouté le mapping de `url_maps` vers `url_site` dans `googleMapsService.js`
- ✅ Corrigé la regex GPS pour supporter le format `!3d48.889609!4d2.344058` (prioritaire) avec fallback sur `@lat,lng`
- ✅ Ajouté les champs `telephone`, `latitude`, `longitude`, `note` dans `Prospect.create()` de `scrapingController.js`

**Fichiers modifiés** :
- `backend/src/services/googleMapsService.js` (lignes 521-564)
- `backend/src/controllers/scrapingController.js` (lignes 188-199)

**Test de validation** :
- Script : `backend/scripts/test-google-maps-extraction.js`
- Résultat : ✅ 100% (3/3 prospects avec URL + note + GPS)
- Script : `backend/scripts/test-google-maps-telephone.js`
- Résultat : ✅ 100% (5/5 électriciens avec téléphone)

**Métriques après correction** :
```
Boulangeries (3 prospects):
- Nom:       100% ✅
- Adresse:   100% ✅
- Téléphone: 0% (normal, boulangeries n'affichent pas leur téléphone)
- URL:       100% ✅
- Note:      100% ✅
- GPS:       100% ✅

Électriciens (5 prospects):
- Nom:       100% ✅
- Adresse:   100% ✅
- Téléphone: 100% ✅ (5/5 avec numéro)
- URL:       100% ✅
- Note:      80% ✅ (4/5)
- GPS:       100% ✅
```

---

#### Problème : Encodage des accents dans les URLs de recherche
**Symptôme** : Les recherches avec mots-clés accentués (ex: "électricien", "Évry") échouaient ou donnaient des résultats incorrects à cause de problèmes d'encodage URL.

**Cause racine** :
Les accents dans les mots-clés n'étaient pas normalisés avant d'être utilisés dans les URLs de recherche, causant des problèmes d'encodage selon les navigateurs et les sites cibles.

**Solution** :
- ✅ Créé module utilitaire `backend/src/utils/stringUtils.js` avec 3 fonctions :
  - `removeAccents(str)` : Retire tous les accents (utilise NFD + regex)
  - `normalizeKeyword(keyword)` : Normalise keyword + trim
  - `normalizeLocation(location)` : Normalise localisation + trim
- ✅ Intégré la normalisation dans les 3 scrapers :
  - `googleMapsService.js` (ligne 30-43)
  - `pagesJaunesScraper.js` (ligne 271-284)
  - `linkedInScraper.js` (ligne 50-63)
- ✅ Ajouté logs informatifs quand normalisation effectuée

**Fichiers créés** :
- `backend/src/utils/stringUtils.js` (63 lignes)

**Fichiers modifiés** :
- `backend/src/services/googleMapsService.js`
- `backend/src/services/scrapers/pagesJaunesScraper.js`
- `backend/src/services/scrapers/linkedInScraper.js`

**Tests de validation** :
- Script : `backend/scripts/test-accent-normalization.js`
- Résultat : ✅ 18/18 tests passés (100%)
- Exemples :
  - `"électricien"` → `"electricien"` ✅
  - `"Évry"` → `"Evry"` ✅
  - `"Saint-Étienne"` → `"Saint-Etienne"` ✅
  - `"Créteil"` → `"Creteil"` ✅

- Script : `backend/scripts/test-scraping-avec-accents.js`
- Résultat : ✅ Normalisation automatique confirmée lors du scraping réel
- Log exemple :
  ```
  [GoogleMapsService] Normalisation des accents:
    Keyword: "électricien" → "electricien"
    Location: "Évry" → "Evry"
  [GoogleMapsService] Recherche: "electricien" à "Evry"
  ```

---

### 📊 Impact global

**Avant** :
- ❌ Téléphones extraits mais non sauvegardés
- ❌ URLs extraites mais non sauvegardées
- ❌ Notes extraites mais non sauvegardées
- ❌ Coordonnées GPS jamais extraites
- ❌ Recherches avec accents échouaient

**Après** :
- ✅ 100% des téléphones sauvegardés (quand visibles)
- ✅ 100% des URLs sauvegardées
- ✅ 100% des notes sauvegardées (quand disponibles)
- ✅ 100% des coordonnées GPS sauvegardées
- ✅ Accents normalisés automatiquement dans tous les scrapers

**Taux de complétude des données** : **0-50% → 90-100%** 🎉

---

### 🧪 Scripts de test ajoutés

1. `backend/scripts/test-google-maps-extraction.js` - Test extraction complète avec sauvegarde
2. `backend/scripts/test-google-maps-telephone.js` - Test spécifique téléphones (électriciens)
3. `backend/scripts/test-accent-normalization.js` - Test normalisation accents (18 tests)
4. `backend/scripts/test-scraping-avec-accents.js` - Test intégration normalisation

---

### 📝 Documentation

- Tous les changements sont documentés inline dans le code
- Logs de debug améliorés pour faciliter le troubleshooting
- Scripts de test commentés et prêts à être relancés

---

**Date** : 26 novembre 2025
**Auteur** : Claude Code + Yannick Murat
**Statut** : ✅ Validé et testé
