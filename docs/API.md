# 📡 Spécifications des APIs

## Vue d'ensemble

Le backend fournit une API RESTful pour la gestion des prospects et le lancement de tâches de scraping.

Remarque : la version initiale du MVP est prévue pour un fonctionnement local (localhost). Les endpoints décrits ci‑dessous sont exposés par le serveur Express démarré localement.

---

## Endpoints

### Prospects

#### GET /api/prospects

Récupérer la liste de tous les prospects.

**Query Parameters:**

- `limit` (optional, default: 20) - Nombre de résultats
- `offset` (optional, default: 0) - Décalage pour pagination
- `tag` (optional) - Filtrer par tag
- `source` (optional) - Filtrer par source de scraping (ex: "Google Maps") 🎯 Mis à jour
- `search` (optional) - Recherche textuelle sur nom, email, téléphone, adresse
- `sortBy` (optional) - Champ de tri (nom_entreprise, ville, code_postal)
- `sortOrder` (optional) - Ordre de tri (ASC ou DESC)

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "nom_entreprise": "Acme Corp",
      "nom_contact": "Jean Dupont",
      "email": "jean@acme.com",
      "telephone": "01 23 45 67 89",
      "adresse": "123 Rue de la Paix",
      "ville": "Paris",
      "code_postal": "75000",
      "url_site": "https://acme.com",
      "latitude": 48.8566,
      "longitude": 2.3522,
      "note": 4.5,
      "date_ajout": "2025-11-13T10:30:00Z",
      "date_modification": "2025-11-13T10:30:00Z",
      "tags": [
        {
          "id": 1,
          "nom": "Restauration"
        },
        {
          "id": 2,
          "nom": "Non-Contacté"
        }
      ],
      "sources": [
        {
          "id": 2,
          "nom": "Google Maps",
          "description": "Service de cartographie Google",
          "couleur": "#4285F4",
          "actif": true,
          "date_creation": "2025-12-03T09:00:00Z",
          "prospects_sources": {
            "createdAt": "2025-12-03T10:15:00Z",
            "updatedAt": "2025-12-03T10:15:00Z"
          }
        },
        {
          "id": 1,
          "nom": "Pages Jaunes",
          "description": "Annuaire professionnel français",
          "couleur": "#FFD700",
          "actif": true,
          "date_creation": "2025-12-03T09:00:00Z",
          "prospects_sources": {
            "createdAt": "2025-12-03T11:20:00Z",
            "updatedAt": "2025-12-03T11:20:00Z"
          }
        }
      ]
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

> 🎯 **Nouveauté (3 déc 2025)** : Le champ `source_scraping` a été remplacé par un tableau `sources` contenant toutes les sources de scraping du prospect. Chaque source inclut la date d'association (`prospects_sources.createdAt`).

#### POST /api/prospects

Créer un nouveau prospect.

**Body:**

```json
{
  "nom_entreprise": "Nouvelle Entreprise",
  "nom_contact": "Marie Martin",
  "email": "marie@entreprise.com",
  "telephone": "01 23 45 67 89",
  "adresse": "456 Avenue des Champs",
  "ville": "Paris",
  "code_postal": "75008",
  "url_site": "https://entreprise.com",
  "latitude": 48.8738,
  "longitude": 2.2950,
  "note": 4.2
}
```

> 🎯 **Nouveauté (3 déc 2025)** : Le champ `source_scraping` n'est plus requis. Les sources sont gérées via la relation many-to-many dans la table `prospects_sources`.

#### GET /api/prospects/:id

Récupérer un prospect spécifique.

#### PUT /api/prospects/:id

Mettre à jour un prospect.

#### DELETE /api/prospects/:id

Supprimer un prospect.

---

### Sources de Scraping 🎯 NOUVEAU

#### GET /api/sources

Récupérer toutes les sources de scraping disponibles.

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "nom": "Pages Jaunes",
      "description": "Annuaire professionnel français",
      "couleur": "#FFD700",
      "actif": true,
      "date_creation": "2025-12-03T09:00:00Z"
    },
    {
      "id": 2,
      "nom": "Google Maps",
      "description": "Service de cartographie Google",
      "couleur": "#4285F4",
      "actif": true,
      "date_creation": "2025-12-03T09:00:00Z"
    },
    {
      "id": 3,
      "nom": "LinkedIn",
      "description": "Réseau social professionnel",
      "couleur": "#0077B5",
      "actif": true,
      "date_creation": "2025-12-03T09:00:00Z"
    }
  ]
}
```

> **Note** : Cette route peut être implémentée si besoin. Actuellement, les sources sont gérées automatiquement lors du scraping via `findOrCreate`.

---

### Tags

#### GET /api/tags

Récupérer tous les tags.

**Response:**

```json
{
  "data": [
    { "id": 1, "nom": "Restauration" },
    { "id": 2, "nom": "Bâtiment" }
  ]
}
```

#### POST /api/tags

Créer un nouveau tag.

**Body:**

```json
{
  "nom": "Secteur Technologie"
}
```

#### POST /api/prospects/:id/tags

Associer un tag à un prospect.

**Body:**

```json
{
  "tag_id": 1
}
```

#### DELETE /api/prospects/:id/tags/:tag_id

Retirer un tag d'un prospect.

---

### Scraping

#### POST /api/scraping/lancer

Lancer une tâche de scraping.

**Body:**

```json
{
  "keyword": "plombier",
  "location": "Lyon",
  "source": "Google Maps"
}
```

**Response:**

```json
{
  "task_id": "task_abc123",
  "status": "pending",
  "message": "Scraping task initiated"
}
```

#### GET /api/scraping/status/:task_id

Récupérer le statut d'une tâche de scraping.

**Response:**

```json
{
  "task_id": "task_abc123",
  "status": "in_progress",
  "progress": 45,
  "prospects_found": 23,
  "started_at": "2025-11-13T10:30:00Z"
}
```

---

## Codes de Réponse

| Code | Signification                          |
| :--: | -------------------------------------- |
| 200  | OK - Succès                            |
| 201  | Created - Ressource créée              |
| 400  | Bad Request - Requête invalide         |
| 401  | Unauthorized - Non authentifié         |
| 404  | Not Found - Ressource non trouvée      |
| 500  | Internal Server Error - Erreur serveur |
