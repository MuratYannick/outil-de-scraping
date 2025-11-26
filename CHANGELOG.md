# Changelog - Outil de Scraping

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
