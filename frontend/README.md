# Frontend - Interface Utilisateur

À compléter selon les technologies définies par le chef de projet.

## Structure

## À définir

# Frontend - Interface Utilisateur

## Stack Technique

- **Node.js** 22.19.0
- **React** 18.2.0 (latest)
- **Vite** 5.0.8 (build tool)
- **React Router** 6.20.0 (routing)
- **TailwindCSS** 3.3.6 (styling)
- **Axios** pour les requêtes API

## Structure du projet

```
frontend/
├── src/
│   ├── main.jsx             # Point d'entrée
│   ├── App.jsx              # Composant principal
│   ├── components/          # Composants réutilisables
│   ├── pages/               # Pages/routes
│   ├── services/            # Services API (axios)
│   └── styles/              # CSS globals
├── index.html               # HTML principal
├── package.json
├── vite.config.js           # Configuration Vite
├── tailwind.config.js       # Configuration TailwindCSS
├── postcss.config.js        # PostCSS avec autoprefixer
└── .env.example
```

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env.local` basé sur `.env.example`

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
