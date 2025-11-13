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
- `source` (optional) - Filtrer par source de scraping

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
      "adresse": "123 Rue de la Paix, 75000 Paris",
      "url_site": "https://acme.com",
      "source_scraping": "Google Maps",
      "date_ajout": "2025-11-13T10:30:00Z",
      "tags": ["Restauration", "Non-Contacté"]
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

#### POST /api/prospects

Créer un nouveau prospect.

**Body:**

```json
{
  "nom_entreprise": "Nouvelle Entreprise",
  "nom_contact": "Marie Martin",
  "email": "marie@entreprise.com",
  "telephone": "01 23 45 67 89",
  "adresse": "456 Avenue des Champs, 75008 Paris",
  "url_site": "https://entreprise.com",
  "source_scraping": "Pages Jaunes"
}
```

#### GET /api/prospects/:id

Récupérer un prospect spécifique.

#### PUT /api/prospects/:id

Mettre à jour un prospect.

#### DELETE /api/prospects/:id

Supprimer un prospect.

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
