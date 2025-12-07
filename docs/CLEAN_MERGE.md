# Nettoyage et Fusion des Doublons - Documentation

## 📋 Vue d'ensemble

Cette fonctionnalité permet de détecter et fusionner automatiquement les prospects en doublon dans la base de données. Elle utilise des algorithmes intelligents pour identifier les prospects identiques provenant de différentes sources ou avec des variations dans les données.

## 🎯 Problématique résolue

**Avant** : Même avec la normalisation d'adresses et les sources multiples, il peut arriver qu'un même prospect soit enregistré deux fois avec des variations :
- Noms d'entreprise différents : "L'Entr Potes" vs "L'ENTR'potes - Restaurant - Hyères"
- Adresses avec des compléments : "9 rue Nicéphore Niepce" vs "9 Rue Nicéphore Niépce, Chem. du Palyvestre ZA du"
- Données partielles sur chaque source

**Après** : Le script de nettoyage détecte ces doublons et les fusionne intelligemment en conservant toutes les informations.

## 🔍 Critères de détection des doublons

Le script utilise une logique stricte pour détecter les doublons et éviter les faux positifs.

### 1. Critère obligatoire

- **Même code postal** : Les prospects doivent avoir le même code postal
  - ⚠️ Utilise le code postal plutôt que la ville car plusieurs villes peuvent avoir le même nom
  - Si un des deux prospects n'a pas de code postal, ils ne peuvent pas être fusionnés

### 2. Deux chemins de détection

#### Chemin A : Les deux prospects ont une adresse

**Requiert LES DEUX critères suivants :**

1. **Adresses similaires** (70% de similarité)
   - Utilise la normalisation d'adresses (voir [SOURCES_MULTIPLES.md](SOURCES_MULTIPLES.md#normalisation-dadresses))
   - Détecte les variations : "rue" vs "r", "boulevard" vs "bd", etc.
   - Détecte les compléments : "9 rue X" vs "9 rue X, Batiment A"

**ET**

2. **Noms d'entreprise similaires** (85% de similarité)
   - Algorithme de similarité de Levenshtein
   - Seuil : **85% de similarité minimum**
   - Détecte : "L'Entr Potes" ≈ "L'ENTR'potes - Restaurant - Hyères" (90% similarité)

⚠️ **Rationale** : Évite de fusionner différentes entreprises situées dans le même immeuble

#### Chemin B : Un des prospects n'a pas d'adresse

**Requiert le critère suivant :**

1. **Noms d'entreprise similaires** (85% de similarité)

**ET au moins un des critères suivants :**

- **Même téléphone** : Comparaison exacte après normalisation (suppression des espaces)
- **Même email** : Comparaison exacte
- **Même URL site** : Comparaison exacte

⚠️ **Rationale** : Évite de fusionner plusieurs agences/succursales d'une même entreprise dans la même ville

## 🔀 Stratégie de fusion

Lors de la fusion de deux prospects :

### 1. Sélection du prospect à conserver
- **Critère** : Nombre de champs remplis
- Le prospect avec le plus de données est conservé
- L'autre est supprimé après fusion

### 2. Fusion des données
- **Pour chaque champ** : Prendre la valeur non vide
- **Si les deux sont remplis** :
  - Pour `nom_entreprise` et `adresse` : Prendre la plus longue (généralement plus complète)
  - Pour les autres champs : Garder celle du prospect conservé

### 3. Fusion des relations

#### Tags
- **Tous les tags** des deux prospects sont conservés
- Pas de doublons : si les deux ont le même tag, il n'est ajouté qu'une fois

#### Sources
- **Toutes les sources** des deux prospects sont conservées
- Traçabilité complète de l'origine des données

### 4. Suppression
- Le prospect en doublon est supprimé après la fusion réussie

## 📊 Exemple concret

### Données initiales

**Prospect 1 (Pages Jaunes)** :
```json
{
  "id": 123,
  "nom_entreprise": "L'Entr Potes",
  "telephone": "04 94 91 63 01",
  "adresse": "9 rue Nicéphore Niepce",
  "ville": "Hyères",
  "code_postal": "83400",
  "latitude": null,
  "longitude": null,
  "note": null,
  "tags": [{"nom": "Restaurant"}],
  "sources": [{"nom": "Pages Jaunes"}]
}
```

**Prospect 2 (Google Maps)** :
```json
{
  "id": 456,
  "nom_entreprise": "L'ENTR'potes - Restaurant - Hyères",
  "telephone": null,
  "adresse": "9 Rue Nicéphore Niépce, Chem. du Palyvestre ZA du",
  "ville": "Hyères",
  "code_postal": "83400",
  "latitude": 43.1043498,
  "longitude": 6.1411603,
  "note": 4.6,
  "tags": [{"nom": "Fast-Food"}],
  "sources": [{"nom": "Google Maps"}]
}
```

### Détection

✅ **Doublon détecté** avec les raisons suivantes :
1. Même code postal : "83400" ✓
2. Les deux ont une adresse → Utilise le **Chemin A**
3. Adresses similaires : "9 rue Nicéphore Niepce" ≈ "9 Rue Nicéphore Niépce..." ✓
4. Noms similaires : "L'Entr Potes" ≈ "L'ENTR'potes..." (90% similarité) ✓
5. ✅ **Les deux critères du Chemin A sont remplis** → C'est un doublon

### Résultat après fusion

**Prospect conservé (ID 456)** - Plus de champs remplis :
```json
{
  "id": 456,
  "nom_entreprise": "L'ENTR'potes - Restaurant - Hyères",
  "telephone": "04 94 91 63 01",
  "adresse": "9 Rue Nicéphore Niépce, Chem. du Palyvestre ZA du",
  "ville": "Hyères",
  "code_postal": "83400",
  "latitude": 43.1043498,
  "longitude": 6.1411603,
  "note": 4.6,
  "tags": [
    {"nom": "Restaurant"},
    {"nom": "Fast-Food"}
  ],
  "sources": [
    {"nom": "Pages Jaunes"},
    {"nom": "Google Maps"}
  ]
}
```

**Prospect supprimé** : ID 123

### Exemples de NON-doublons (faux positifs évités)

#### Cas 1 : Différentes entreprises dans le même immeuble

```json
// Prospect A
{
  "nom_entreprise": "Avocat Dupont",
  "adresse": "15 rue Victor Hugo",
  "code_postal": "83400"
}

// Prospect B
{
  "nom_entreprise": "Cabinet Médical Martin",
  "adresse": "15 rue Victor Hugo",
  "code_postal": "83400"
}
```

❌ **Non fusionnés** : Même adresse mais noms différents (< 85% similarité)

#### Cas 2 : Plusieurs agences de la même entreprise

```json
// Prospect A
{
  "nom_entreprise": "La Poste",
  "adresse": "10 avenue de la République",
  "code_postal": "83400",
  "telephone": "01 23 45 67 89"
}

// Prospect B
{
  "nom_entreprise": "La Poste",
  "adresse": "25 boulevard Gambetta",
  "code_postal": "83400",
  "telephone": "01 98 76 54 32"
}
```

❌ **Non fusionnés** : Même nom mais adresses différentes (< 70% similarité)

#### Cas 3 : Noms similaires sans contact commun

```json
// Prospect A
{
  "nom_entreprise": "Restaurant Le Jardin",
  "code_postal": "83400",
  "telephone": "04 94 11 11 11"
}

// Prospect B
{
  "nom_entreprise": "Restaurant Le Jardin Fleuri",
  "code_postal": "83400",
  "telephone": "04 94 22 22 22"
}
```

❌ **Non fusionnés** : Noms similaires (> 85%) mais pas d'adresse ET contacts différents

## 🚀 Utilisation

### Option 1 : Via l'Interface Web (Recommandée)

1. **Accéder à la page Prospects** :
   - Ouvrir l'application web dans votre navigateur
   - Cliquer sur l'onglet "📋 Prospects"

2. **Lancer la détection** :
   - Cliquer sur le bouton orange "Nettoyer les doublons" à droite de la barre d'actions
   - Une détection automatique se lance

3. **Réviser et sélectionner les doublons** :
   - Un modal s'affiche listant tous les doublons détectés
   - Chaque paire affiche les deux prospects côte à côte avec :
     - **ID du prospect** (pour référence)
     - **Nom d'entreprise**
     - **Adresse complète** (avec ville et code postal)
     - **Téléphone**
     - **Sources de scraping** (badges colorés)
     - **Raison de la détection** (ex: "Même code postal + adresses similaires + noms similaires (90%)")
   - **Sélection/Désélection** :
     - ☑️ Tous les doublons sont sélectionnés par défaut (bordure orange)
     - Cliquer sur une checkbox pour désélectionner un doublon (bordure grise)
     - Bouton "Tout sélectionner" pour tout cocher
     - Bouton "Tout désélectionner" pour tout décocher
   - Le compteur en haut indique : "X sélectionné(s) - Sélectionnez les doublons à fusionner"

4. **Confirmer la fusion** :
   - Cliquer sur "Fusionner X doublon(s)" pour confirmer
   - Ou "Annuler" pour fermer le modal sans rien faire
   - Un message de confirmation finale apparaît avec avertissement irréversible

5. **Résultat** :
   - La fusion s'effectue pour les doublons sélectionnés uniquement
   - Un message de succès affiche les statistiques :
     - Nombre de doublons fusionnés
     - Nombre d'erreurs (si applicable)
   - La liste des prospects se rafraîchit automatiquement

**Avantages de l'interface web** :
- ✅ Interface visuelle claire avec comparaison côte à côte
- ✅ **Sélection granulaire** : choisir quels doublons fusionner
- ✅ Confirmation interactive à chaque étape
- ✅ Aucune commande à taper
- ✅ Rafraîchissement automatique de la liste
- ✅ Traçabilité complète (sources, ID, raisons)

### Option 2 : Via la Ligne de Commande

```bash
npm run db:clean-merge
```

ou

```bash
node backend/scripts/clean-merge-duplicates.js
```

### Déroulement

1. **Chargement** : Le script charge tous les prospects avec leurs relations (tags, sources)

2. **Groupement** : Les prospects sont groupés par ville pour optimiser les comparaisons

3. **Détection** : Pour chaque ville, compare tous les prospects entre eux
   - Affiche la progression par ville

4. **Affichage** : Liste tous les doublons détectés avec :
   - Raison de la détection
   - Données de chaque prospect
   - Tags et sources de chacun

5. **Confirmation** : Demande confirmation avant de procéder à la fusion
   - Répondre "oui" ou "o" pour continuer
   - N'importe quelle autre réponse annule l'opération

6. **Fusion** : Fusionne les doublons un par un
   - Transaction atomique pour chaque fusion
   - Rollback automatique en cas d'erreur

7. **Résultat** : Affiche un résumé :
   - Nombre de doublons fusionnés
   - Nombre d'erreurs (si présentes)
   - Nombre de prospects supprimés

### Test avec données exemple

Pour tester le script avec l'exemple L'Entr'potes :

```bash
# 1. Créer les prospects de test
node backend/scripts/test-clean-merge.js

# 2. Lancer la fusion
npm run db:clean-merge
```

## ⚠️ Avertissements et précautions

### Avant d'utiliser le script

1. **Sauvegarde recommandée**
   ```bash
   # Exporter la base de données avant
   mysqldump -u root -p outil_scraping > backup_avant_fusion.sql
   ```

2. **Vérifier les critères**
   - Le seuil de similarité des noms est de 85%
   - Peut être ajusté dans le code si nécessaire (fonction `areDuplicates`)

3. **Tester d'abord**
   - Utiliser `test-clean-merge.js` pour créer des données de test
   - Vérifier que la fusion fonctionne comme attendu

### Pendant l'utilisation

1. **Réviser les doublons détectés**
   - Le script affiche tous les doublons avant de demander confirmation
   - Vérifier qu'il n'y a pas de faux positifs

2. **Confirmer attentivement**
   - L'opération est **irréversible** sans backup
   - Les prospects supprimés ne peuvent pas être récupérés

### Après l'utilisation

1. **Vérifier les résultats**
   ```bash
   # Compter les prospects après fusion
   # Via l'interface ou une requête SQL
   ```

2. **Vérifier l'intégrité**
   - Les tags sont-ils tous présents ?
   - Les sources sont-elles toutes conservées ?

## 📁 Fichiers

### Scripts

- **[clean-merge-duplicates.js](backend/scripts/clean-merge-duplicates.js)** : Script principal de nettoyage et fusion
- **[test-clean-merge.js](backend/scripts/test-clean-merge.js)** : Script de test avec l'exemple L'Entr'potes

### Dépendances

Utilise les utilitaires existants :
- **[addressNormalizer.js](backend/src/utils/addressNormalizer.js)** : Normalisation et comparaison des adresses
- **Modèles Sequelize** : Prospect, Tag, SourceScraping

## 🔧 Configuration

### Ajuster le seuil de similarité des noms

Dans `clean-merge-duplicates.js`, fonction `areDuplicates()` :

```javascript
// Ligne ~127
if (nameSimilarity >= 0.85) {  // ← Modifier ce seuil
  return {
    isDuplicate: true,
    reason: `Même ville + noms similaires...`,
    similarity: nameSimilarity
  };
}
```

**Recommandations** :
- **0.80** : Plus permissif (plus de doublons détectés, risque de faux positifs)
- **0.85** : Équilibré (valeur par défaut)
- **0.90** : Plus strict (moins de doublons détectés, moins de faux positifs)

### Ajouter des critères personnalisés

Dans la fonction `areDuplicates()`, ajouter de nouveaux critères :

```javascript
// Exemple : Même code postal ET nom très proche
if (p1.code_postal === p2.code_postal && nameSimilarity >= 0.75) {
  return {
    isDuplicate: true,
    reason: 'Même code postal + nom proche',
    similarity: nameSimilarity
  };
}
```

## 📊 Performances

### Temps d'exécution estimé

- **< 100 prospects** : < 1 seconde
- **100-1000 prospects** : 1-10 secondes
- **1000-10000 prospects** : 10-60 secondes
- **> 10000 prospects** : > 1 minute

**Optimisation** : Le groupement par ville réduit drastiquement le nombre de comparaisons nécessaires.

### Complexité

- **Pire cas** : O(n²) si tous les prospects sont dans la même ville
- **Cas moyen** : O(n × m) où m est la moyenne de prospects par ville (généralement << n)

## 🐛 Dépannage

### Erreur : "Base inconnue"
```bash
# Vérifier que la base de données existe
npm run db:setup
```

### Erreur : "Table inconnue"
```bash
# Exécuter les migrations
npm run db:migrate
```

### Aucun doublon détecté alors qu'il y en a
1. Vérifier que les codes postaux sont identiques (et non vides)
2. Si les deux ont une adresse : vérifier que l'adresse ET le nom sont similaires
3. Si pas d'adresse : vérifier que le nom est similaire ET qu'il y a au moins un contact identique
4. Réduire le seuil de similarité des noms (85% par défaut)

### Faux positifs (prospects non-doublons détectés)
1. Augmenter le seuil de similarité des noms (85% par défaut)
2. Vérifier que les adresses sont suffisamment différentes (70% par défaut)
3. Vérifier manuellement la liste avant de confirmer
4. La nouvelle logique stricte devrait déjà limiter les faux positifs

## 📚 Ressources liées

- [SOURCES_MULTIPLES.md](SOURCES_MULTIPLES.md) : Système de sources multiples
- [DATABASE.md](docs/DATABASE.md) : Structure de la base de données
- [addressNormalizer.js](backend/src/utils/addressNormalizer.js) : Normalisation d'adresses

---

**Date de création** : 3 décembre 2025
**Dernière mise à jour** : 3 décembre 2025
**Version** : 1.0.0
**Statut** : ✅ Production Ready
