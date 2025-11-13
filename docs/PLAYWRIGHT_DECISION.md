# Choix technique : Playwright (conserver) — Puppeteer (abandonné)

Ce document explique pourquoi nous avons décidé, pour le MVP local, de conserver **Playwright** comme moteur de scraping et d'abandonner **Puppeteer** dans ce dépôt.

## Contexte

Cibles : Google (Maps/Search), LinkedIn, Pages Jaunes.
Données à extraire : nom de l'entreprise, adresse, URL du site, email, téléphone, domaine d'activité, éventuellement coordonnées géographiques.

## Résumé de la décision

- Nous utilisons **Playwright** comme moteur de scraping principal.
- **Puppeteer** a été supprimé du projet (dépendances désinstallées) pour réduire la surface d'attaque et simplifier la maintenance.

## Raisons principales

1. Robustesse et fiabilité
   - Playwright offre un meilleur support multi-navigateurs (Chromium, Firefox, WebKit) et gère automatiquement des attentes (auto-wait) qui simplifient le code pour sites dynamiques.

2. Fonctionnalités utiles pour nos cibles
   - Emulation de géolocalisation, contrôle fin des permissions, interception réseau et contextes isolés : utiles pour Google Maps et LinkedIn.

3. Sécurité et dépendances
   - L'audit npm a montré des vulnérabilités transitives importantes liées à Puppeteer (packages `tar-fs`, `ws`, etc.). La suppression de Puppeteer élimine ces vulnérabilités.

4. Maintenance et simplification
   - Un seul moteur actif réduit la complexité (moins de dépendances, moins de code à maintenir, une seule API à maîtriser).

## Actions réalisées

- `npm uninstall puppeteer puppeteer-core @puppeteer/browsers` dans `backend/`.
- Audit de sécurité (`npm audit`) après suppression : 0 vulnérabilités restantes.
- Mise à jour de la documentation (`README.md`, `backend/README.md`, `docs/SETUP.md`).

## Conseils d'utilisation (Playwright + Cheerio)

- Utiliser Playwright pour naviguer, interagir et récupérer le HTML final.
- Pour les pages principalement statiques, récupérer le HTML et parser avec Cheerio (plus léger et rapide).
- Normaliser les données extraites (emails, téléphones) dès l'ingestion : utiliser `libphonenumber-js` ou `google-libphonenumber` pour les numéros.
- Pour obtenir des coordonnées (lat/lon), vous pouvez :
  - extraire l'URL du site ou l'adresse et appliquer un geocoding (Google Geocoding API, OpenCage, Nominatim),
  - ou récupérer les coordonnées directement depuis la source si elles sont fournies (ex: Google Maps API ou données structurées).

## Bonnes pratiques anti-détection

- Utiliser des proxies résidentiels/rotatifs pour éviter le blocage IP.
- Simuler une navigation humaine (delays, mouvements de souris, scrolling naturel).
- Randomiser User-Agent, viewport, timezone et polices si nécessaire.
- Respecter les limites et la réglementation (robots.txt, ToS) et mettre en place un rythme raisonnable de requêtes.

## Migration et prochains pas

- Pour tout script existant Puppeteer (s'il en reste dans les notes) : migrer vers Playwright (API très similaire pour actions de base).
- Ajouter un service `backend/src/services/playwrightService.js` avec utilitaires communs (pool de contexts, gestion des retries, logging, traces).
- Écrire des tests basiques de scraping (ex: récupérer un résultat connu sur Pages Jaunes) pour valider la stabilité.

---

Si vous voulez, je peux créer maintenant le fichier `backend/src/services/playwrightService.js` avec un exemple de scraper pour Pages Jaunes et des helpers (retry, normalize).