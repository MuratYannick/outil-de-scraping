# Scripts de Gestion de Base de Données

Ce dossier contient les scripts pour gérer la base de données de l'application.

## Commandes Disponibles

### `npm run db:setup`
**Objectif**: Créer la base de données si elle n'existe pas

**Usage**:
```bash
cd backend
npm run db:setup
```

**Note**: À exécuter une seule fois lors de l'installation initiale.

---

### `npm run db:migrate`
**Objectif**: Créer ou mettre à jour les tables selon les modèles Sequelize

**Usage**:
```bash
cd backend
npm run db:migrate
```

**Détails**:
- Crée les tables `prospects`, `tags`, et `prospects_tags`
- Met à jour la structure si nécessaire (ALTER TABLE)
- Utilise `sequelize.sync({ alter: true })`

---

### `npm run db:seed`
**Objectif**: Remplir la base de données avec des données de test

**Usage**:
```bash
cd backend
npm run db:seed
```

**Données créées**:
- 5 tags de test (Premium, Contacté, Intéressé, Lead Chaud, A Rappeler)
- 5 prospects de test avec informations complètes
- Associations aléatoires entre prospects et tags

**Exemple de sortie**:
```
🌱 Démarrage du seeding...
📡 Connexion à la base de données...
✓ Connecté à la base de données

📋 Création des tags...
✓ Tag créé: Premium
✓ Tag créé: Contacté
...

✅ Seeding terminé avec succès !
```

---

### `npm run db:clear`
**Objectif**: Vider toutes les tables (DELETE) sans les détruire

**Usage**:
```bash
cd backend
npm run db:clear
```

**⚠️ ATTENTION**: Cette commande VIDE toutes les données !

**Comportement**:
1. Affiche le nombre d'enregistrements actuels
2. Demande confirmation (`oui/non`)
3. Vide les tables en respectant l'ordre des contraintes:
   - `prospects_tags` (table de liaison)
   - `prospects`
   - `tags`
4. Les tables restent existantes (structure préservée)

**Exemple d'utilisation**:
```
🗑️  Nettoyage de la base de données
⚠️  ATTENTION: Cette opération va VIDER toutes les tables !

📊 Données actuelles:
   - 15 prospect(s)
   - 8 tag(s)
   - Associations dans prospects_tags

⚠️  Êtes-vous sûr de vouloir VIDER toutes les tables ? (oui/non): oui

🧹 Vidage des tables en cours...
✓ prospects_tags vidée
✓ prospects vidée
✓ tags vidée

✅ Toutes les tables ont été vidées avec succès !
```

**Quand l'utiliser**:
- Pour nettoyer les données de test
- Pour réinitialiser l'application sans perdre la structure
- Avant de lancer un nouveau seeding

---

### `npm run db:drop`
**Objectif**: Détruire complètement toutes les tables (DROP TABLE)

**Usage**:
```bash
cd backend
npm run db:drop
```

**⚠️ DANGER**: Cette commande DÉTRUIT toutes les tables et leurs données !

**Comportement**:
1. Affiche la liste des tables qui seront détruites
2. Demande DEUX confirmations:
   - Première: `oui/non`
   - Deuxième: Taper `DÉTRUIRE` en majuscules
3. Détruit les tables dans l'ordre:
   - `prospects_tags`
   - `prospects`
   - `tags`
4. Les tables n'existent plus après cette opération

**Exemple d'utilisation**:
```
💥 Destruction des tables de la base de données
⚠️  ATTENTION: Cette opération va DÉTRUIRE toutes les tables !

Les tables suivantes seront supprimées:
   - prospects
   - tags
   - prospects_tags

⚠️  Toutes les données seront DÉFINITIVEMENT perdues !

⚠️  Êtes-vous sûr de vouloir DÉTRUIRE toutes les tables ? (oui/non): oui
⚠️  DERNIÈRE CONFIRMATION - Tapez 'DÉTRUIRE' en majuscules pour confirmer: DÉTRUIRE

💥 Destruction des tables en cours...
✓ prospects_tags détruite
✓ prospects détruite
✓ tags détruite

✅ Toutes les tables ont été détruites avec succès !
```

**Quand l'utiliser**:
- Pour réinitialiser complètement la base de données
- Avant une migration majeure
- Pour corriger des problèmes de structure de tables

---

## Workflows Courants

### 🚀 Installation Initiale
```bash
npm run db:setup      # Créer la DB
npm run db:migrate    # Créer les tables
npm run db:seed       # Ajouter des données de test
```

### 🔄 Réinitialisation Complète
```bash
npm run db:drop       # Détruire les tables
npm run db:migrate    # Recréer les tables
npm run db:seed       # Ajouter des données de test
```

### 🧹 Nettoyage Simple
```bash
npm run db:clear      # Vider les données
npm run db:seed       # Ajouter de nouvelles données de test
```

### 🔧 Mise à Jour de la Structure
```bash
# Modifier les modèles dans src/models/
npm run db:migrate    # Appliquer les changements
```

---

## Sécurité

- ✅ **Confirmation requise**: Les commandes destructives (`db:clear` et `db:drop`) demandent confirmation
- ✅ **Double confirmation**: `db:drop` demande une confirmation supplémentaire
- ✅ **Messages clairs**: Les scripts affichent clairement ce qui va être fait
- ✅ **Gestion des erreurs**: Les scripts gèrent les erreurs et affichent des messages explicites
- ✅ **Contraintes FK**: Les scripts désactivent temporairement les contraintes de clés étrangères

---

## Fichiers

- `setup-db.js` - Création de la base de données
- `migrate.js` - Migration/création des tables
- `seed.js` - Peuplement avec données de test
- `clear.js` - Vidage des tables (DELETE)
- `drop.js` - Destruction des tables (DROP)

---

## Dépannage

### Erreur de connexion
```
Error: Access denied for user
```
**Solution**: Vérifier les credentials dans `.env`

### Tables verrouillées
```
Error: Table is locked
```
**Solution**: Arrêter le serveur backend avant d'exécuter les scripts

### Contraintes de clés étrangères
```
Error: Cannot delete or update a parent row
```
**Solution**: Les scripts gèrent automatiquement ce cas avec `SET FOREIGN_KEY_CHECKS = 0`
