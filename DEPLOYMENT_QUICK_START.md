# 🚀 Déploiement Rapide - O2Switch

**Guide ultra-rapide pour déployer l'outil de scraping sur O2Switch en 30 minutes**

---

## ⚡ Checklist 5 Minutes

- [ ] Compte O2Switch actif avec SSH
- [ ] Domaine ou sous-domaine configuré
- [ ] Node.js 22.x installé localement
- [ ] Git installé localement

---

## 📝 Étapes Rapides

### 1️⃣ Préparation Locale (5 min)

```bash
# Backend
cd backend
cp .env.production.example .env.production
# ✏️ ÉDITER .env.production avec vos valeurs O2Switch
npm install --production

# Frontend
cd ../frontend
cp .env.production.example .env.production
# ✏️ ÉDITER .env.production avec votre URL d'API
npm install
npm run build
```

### 2️⃣ Base de Données MySQL (5 min)

**Via cPanel:**
1. MySQL® Databases → Créer `outil_scraping`
2. Créer utilisateur `outil_user` avec mot de passe fort
3. Associer l'utilisateur à la base (TOUS PRIVILÈGES)
4. phpMyAdmin → Importer `database/schema.sql`

### 3️⃣ Upload Frontend (5 min)

**Via SFTP (FileZilla):**
- Hôte : `ftp.votre-domaine.com`
- Upload `frontend/dist/*` → `/public_html/scraping-tool/`

### 4️⃣ Upload Backend (5 min)

**Via SFTP:**
- Upload tout `backend/` → `/home/votrecompte/nodejs/scraping-api/`
- **SAUF** : `node_modules/`, `scripts/`, `.env` de dev

### 5️⃣ Configuration Node.js (5 min)

**cPanel → Setup Node.js App:**
1. Create Application
   - Node version: **22.x**
   - App root: `/home/votrecompte/nodejs/scraping-api`
   - App URL: `scraping-api.votre-domaine.com`
   - Startup file: `src/app.js`
2. Run NPM Install
3. Installer Playwright:
```bash
cd /home/votrecompte/nodejs/scraping-api
source /home/votrecompte/nodevenv/scraping-api/22/bin/activate
npx playwright install chromium
```
4. Start/Restart

### 6️⃣ SSL & Tests (5 min)

1. **SSL/TLS Status** → Run AutoSSL
2. **Test API**: `curl https://scraping-api.votre-domaine.com/health`
3. **Test Frontend**: Ouvrir `https://votre-domaine.com/scraping-tool/`
4. **Test Scraping**: Pages Jaunes, 5 prospects, Paris

---

## ✅ C'est Fait !

Votre outil est en production sur O2Switch ! 🎉

**Liens utiles:**
- Documentation complète: [DEPLOYMENT_O2SWITCH.md](docs/DEPLOYMENT_O2SWITCH.md)
- Support O2Switch: support@o2switch.fr
- GitHub Issues: https://github.com/MuratYannick/outil-de-scraping/issues

---

## 🔧 Dépannage Express

**Backend ne démarre pas ?**
```bash
# Vérifier logs
tail -f /home/votrecompte/nodejs/scraping-api/logs/app.log
```

**Frontend ne se connecte pas ?**
- Vérifier `VITE_API_URL` dans `.env.production`
- Rebuild: `npm run build`
- Re-upload `dist/`

**MySQL erreur ?**
- Vérifier credentials dans `.env`
- Test: `mysql -u votrecompte_outil_user -p`

---

**Version**: MVP 1.0
**Dernière mise à jour**: 10/12/2025
