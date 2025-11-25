# Extraction Google Maps - Méthode de Scoring

## Vue d'ensemble

Le scraper Google Maps utilise une approche innovante d'**extraction passive** qui récupère les données directement depuis les cards visibles dans la liste de résultats, sans avoir besoin de cliquer sur chaque entreprise. Cette méthode est beaucoup plus rapide et fiable que l'approche traditionnelle par clicks.

## Architecture de l'extraction

### 1. Principe général

Au lieu d'interagir avec la page (clicks, ouverture de panels), le scraper :
1. Charge la liste de résultats via infinite scroll
2. Analyse le DOM de chaque card article
3. Extrait les données visibles directement
4. Utilise des algorithmes de scoring pour identifier les bonnes informations

### 2. Avantages de cette approche

**✅ Performance** : Pas d'attente de chargement de panels (3-5s par prospect économisés)
**✅ Fiabilité** : Moins de points de défaillance (pas de panels qui ne s'ouvrent pas)
**✅ Simplicité** : Code plus simple et maintenable
**✅ Discrétion** : Moins d'interactions = moins de risque de détection

## Extraction par champ

### Nom de l'entreprise

**Source** : Attribut `aria-label` du lien principal

```javascript
// Le nom est dans aria-label, pas dans textContent
const nameEl = el.querySelector('a[href*="/maps/place/"]');
const nom = nameEl?.getAttribute('aria-label');
```

**Exemple** :
```html
<a aria-label="L'Atelier du Plombier Paris" href="...">
  <!-- Le textContent est vide, mais aria-label contient le nom -->
</a>
```

**Résultat** : `"L'Atelier du Plombier Paris"`

---

### Adresse

**Source** : Éléments div/span feuilles (sans enfants) analysés par scoring

#### Algorithme de scoring

Le système attribue des points positifs et négatifs pour identifier la vraie adresse :

**Points positifs** :
- `+10` : Contient un code postal français (5 chiffres) - ex: "75001"
- `+8` : Contient un type de voie - ex: "rue", "avenue", "boulevard", "impasse", "place"
- `+5` : Commence par un numéro - ex: "15 rue de..."
- `+3` : Contient une ville connue - ex: "Paris", "Lyon", "Marseille"

**Points négatifs** :
- `-10` : Contient des mots métier - ex: "plombier", "électricien", "chauffagiste"
- `-5` : Texte trop long (>100 caractères) = probablement du texte concaténé

#### Filtres préliminaires

Avant le scoring, plusieurs filtres éliminent les candidats invalides :

```javascript
// ❌ Skip si l'élément a des enfants (= parent qui contient tout)
if (element.children.length > 0) continue;

// ❌ Skip si c'est exactement le nom de l'entreprise
if (text === nom) continue;

// ❌ Skip si contient une note avec parenthèses (signe de concaténation)
// Exemple: "Leonardo Services 5,0(357)Plombier · 22 Rue..."
if (text.match(/\d+[,.]?\d*\(\d+\)/)) continue;

// ❌ Skip si le texte contient le nom (= parent qui contient nom + adresse)
if (text.includes(nom) && text.length > nom.length + 10) continue;
```

#### Exemple de scoring

```javascript
// Candidat 1: "100 Rue Alexandre Dumas"
// +5 (commence par numéro) + +8 (mot "Rue") = Score: 13 ✅

// Candidat 2: "Plombier à Paris"
// +3 (ville Paris) - 10 (mot "Plombier") = Score: -7 ❌

// Candidat 3: "L'Atelier du Plombier Paris 4,6(322)Plombier"
// Filtré par: contient note avec parenthèses ❌
```

**Sélection** : Le candidat avec le **meilleur score** est choisi

**Résultat typique** : `"100 Rue Alexandre Dumas"` (score: 13)

---

### Téléphone

**Source** : Éléments div/span feuilles analysés par regex

#### Patterns supportés

Le système teste plusieurs formats de numéros français :

```javascript
const phoneRegexes = [
  /\b0[1-9](?:[\s\.]?\d{2}){4}\b/,           // 01 23 45 67 89 ou 01.23.45.67.89
  /\b\+33[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/, // +33 1 23 45 67 89
  /\b(?:0033|0)[\s\.]?[1-9](?:[\s\.]?\d{2}){4}\b/ // 0033 1 23 45 67 89
];
```

**Exemples reconnus** :
- `01 88 27 39 76` ✅
- `01.88.27.39.76` ✅
- `0188273976` ✅
- `+33 1 88 27 39 76` ✅
- `06 99 30 15 34` ✅ (mobile)
- `07 87 26 41 51` ✅ (mobile)

**Résultat typique** : `"01 88 27 39 76"`

---

### Note (Rating)

**Source** : Attribut `aria-label` du span avec `role="img"`

```javascript
const ratingEl = el.querySelector('span[role="img"]');
const ariaLabel = ratingEl?.getAttribute('aria-label');
// Exemple: "Noté 4,6 sur 5,0 étoiles, 322 avis"
const match = ariaLabel?.match(/(\d+[,.]?\d*)/);
const note = match ? parseFloat(match[1].replace(',', '.')) : null;
```

**Résultat typique** : `4.6` (float)

---

### URL Google Maps

**Source** : Attribut `href` du lien principal

```javascript
const linkEl = el.querySelector('a[href*="/maps/place/"]');
const url_maps = linkEl?.href;
```

**Résultat typique** : `"https://www.google.com/maps/place/L%27Atelier+du+Plombier+Paris/data=!4m7!3m6!..."`

---

## Structure du code

### Fichier principal
`backend/src/services/googleMapsService.js`

### Fonction d'extraction
`_extractDetailedProspects(page, resultsSelector, count, onProgress)`

### Flux d'exécution

```
1. Récupérer tous les articles du DOM
   ↓
2. Pour chaque article (limité à 'count')
   ↓
3. Exécuter l'extraction dans le contexte du navigateur (evaluate)
   ↓
4. Extraction nom (aria-label)
   ↓
5. Extraction adresse (scoring)
   ↓
6. Extraction téléphone (regex)
   ↓
7. Extraction note (aria-label)
   ↓
8. Extraction URL (href)
   ↓
9. Validation et ajout à la liste
   ↓
10. Logger les résultats
```

## Logs de debug

Les logs incluent des informations de scoring pour faciliter le debug :

```javascript
[GoogleMapsService] 🔍 Debug prospect 1: {
  nom: "L'Atelier du Plombier Paris",
  adresse: '100 Rue Alexandre Dumas',
  telephone: '01 88 27 39 76',
  note: 4.6,
  url: 'https://www.google.com/maps/place/L%27Atelier+du+Plombier+Pa',
  selectors: {
    name: 'found (aria-label)',
    address: 'found (score: 13)',  // ← Score de l'adresse
    phone: 'found',
    rating: 'found',
    link: 'found'
  }
}
```

## Gestion des cas limites

### Adresse manquante
Si aucun candidat n'obtient un score > 0, l'adresse sera `null`

### Téléphone non visible
Certaines entreprises n'affichent pas leur téléphone dans la liste. Dans ce cas, le champ reste `null`.

### Noms longs tronqués
Google tronque parfois les noms longs dans `aria-label`. Solution future : cliquer pour obtenir le nom complet si nécessaire.

### Cards sponsorisées
Les résultats sponsorisés peuvent avoir une structure différente. Le système les ignore naturellement s'ils ne correspondent pas aux patterns.

## Performance

**Temps d'extraction par prospect** : ~100-200ms
**Temps de scroll pour charger 20 résultats** : ~2-3s
**Total pour 20 prospects** : ~5-6s (vs 60-90s avec méthode par clicks)

**Gain de performance** : **10-15x plus rapide** 🚀

## Améliorations futures possibles

1. **Extraction du site web** : Certaines cards affichent un lien vers le site de l'entreprise
2. **Extraction des horaires** : Visible dans certaines cards ("Ouvert", "Fermé", horaires)
3. **Extraction de la catégorie** : Type d'établissement (restaurant, hôtel, etc.)
4. **Extraction du nombre d'avis** : Visible à côté de la note
5. **Validation des coordonnées GPS** : Extraire depuis l'URL pour géolocalisation
6. **Détection des cards sponsorisées** : Pour les traiter différemment ou les filtrer

## Maintenance

### Tests
Pour tester l'extraction, utiliser la fonction de test intégrée :
```
POST /api/antibot/test/googleMaps
```

### Adaptation aux changements Google
Si Google modifie la structure HTML :
1. Examiner les logs debug (HTML du premier article)
2. Identifier les nouveaux sélecteurs
3. Ajuster les patterns dans `_extractDetailedProspects`
4. Mettre à jour les tests

### Monitoring
Les logs incluent :
- Nombre de résultats chargés
- Nombre de prospects extraits avec succès
- Détails de chaque extraction (avec sélecteurs et scores)

---

**Dernière mise à jour** : 2025-01-25
**Version du scraper** : 2.0 (Extraction passive avec scoring)
