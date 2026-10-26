Gestion des conges

Application web pour gerer les conges a SUP Herman. Un employe envoie une demande, son manager la valide ou la refuse, et le service RH garde une vue d'ensemble sur les equipes et le calendrier.

## Fonctionnalites

- Connexion par email / mot de passe avec JWT
- Creation de demandes : CP, RTT, sans solde, maladie ou formation
- Calcul automatique des jours ouvrables (week-ends exclus)
- Verification du solde disponible et des chevauchements
- Validation, refus, annulation selon le role
- Calendrier des conges valides, filtrable par equipe
- Gestion des utilisateurs par le RH (creation, roles, reset de mot de passe)

## Technologies

- Backend : Node.js, Express, Mongoose
- Frontend : React 18, React Router, Axios
- Base de donnees : MongoDB
- Securite : JWT, bcryptjs

## Installation

Prerequis : Node.js 18+, MongoDB local sur `mongodb://localhost:27017` (ou Atlas), npm.

```bash
cd backend
npm install
cd ../frontend
npm install
```

Creer le fichier `backend/.env` :

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/fint2-leaves
JWT_SECRET=changez-cette-valeur-en-local
```

Initialiser les comptes de demo :

```bash
cd backend
npm run seed
```

Lancer le backend puis le frontend (deux terminaux) :

```bash
cd backend
npm start
```

```bash
cd frontend
npm start
```

L'app est sur http://localhost:3000, l'API sur http://localhost:5001. Verification : http://localhost:5001/api/health.

Pour lancer FINT1 et FINT2 en meme temps, utiliser le port 3001 pour le frontend FINT2.

## Comptes de demonstration

| Role | Email | Mot de passe |
| --- | --- | --- |
| RH | rh@supherman.com | Suph3rm4n! |
| Manager | manager@supherman.com | Suph3rm4n! |
| Employe | employe@supherman.com | Suph3rm4n! |

## API

Base : `http://localhost:5001/api`, token dans l'en-tete `Authorization: Bearer <token>` (sauf login).

### Authentification

| Methode | Route | Description |
| --- | --- | --- |
| POST | /auth/login | Connexion, retourne un token |
| POST | /auth/first-login | Definir le mot de passe initial |
| GET | /auth/me | Profil courant |
| PUT | /auth/change-password | Changer le mot de passe |

### Demandes

| Methode | Route | Description |
| --- | --- | --- |
| GET | /demandes | Liste selon le role (voir pagination ci-dessous) |
| GET | /demandes/:id | Detail d'une demande |
| POST | /demandes | Creer une demande |
| PUT | /demandes/:id/annuler | Annuler une demande en attente |
| PUT | /demandes/:id/valider | Manager ou RH : valider |
| PUT | /demandes/:id/refuse | Manager ou RH : refuser (motif optionnel) |
| PUT | /demandes/:id/modifier-statut | RH : changer le statut |

La liste supporte la pagination, la recherche et le tri via ces parametres :

- `page` : numero de page (defaut 1)
- `limit` : elements par page (defaut 10)
- `statut` : en_attente, validee, refusee, annulee
- `type` : CP, RTT, Sans Solde, Maladie, Formation
- `search` : recherche par email d'employe
- `sort` : champ de tri (defaut `-createdAt`, prefixe `-` = decroissant)

Reponse : `{ "demandes": [...], "pagination": { page, limit, total, totalPages } }`.

Exemple : `GET /demandes?page=2&limit=10&statut=en_attente&type=CP&sort=-createdAt`.

Creation d'une demande (POST /demandes) :

```json
{
  "type": "CP",
  "dateDebut": "2026-10-12",
  "dateFin": "2026-10-16",
  "commentaire": "Conges en famille"
}
```

Le nombre de jours est calcule cote API. Les demandes qui chevauchent une demande existante ou depassent le solde sont refusees. `Maladie` et `Sans Solde` ne consomment pas le solde.

### Utilisateurs (RH)

| Methode | Route | Description |
| --- | --- | --- |
| GET | /users | Liste (page, limit, search) |
| POST | /users | Creer un utilisateur |
| PUT | /users/:id | Modifier |
| PUT | /users/:id/reset-password | Reinitialiser le mot de passe |
| PUT | /users/:id/toggle-active | Activer / desactiver |

### Calendrier

| Methode | Route | Description |
| --- | --- | --- |
| GET | /calendar | Demandes validees visibles |
| GET | /calendar?equipe=true | Manager / RH : vue de l'equipe |

Les erreurs sont renvoyees au format `{"message":"..."}` (400, 401, 403, 404, 500).

## Manuel utilisateur

### Connexion

- Aller sur http://localhost:3000
- Entrer son email et son mot de passe
- A la premiere connexion, l'app demande de definir un nouveau mot de passe (6 caracteres min.)
- Mot de passe oublie : demander au service RH de le reinitialiser depuis Gestion des utilisateurs

### Employe

- **Tableau de bord** : jours de conges restants, demandes en attente, historique, prochains conges valides
- **Nouvelle demande** : choisir le type (CP, RTT, Sans Solde, Maladie, Formation), les dates, un commentaire facultatif et un justificatif (JPG, PNG ou PDF, 5 Mo max). Le nombre de jours est calcule automatiquement. L'app bloque les chevauchements et les demandes qui depassent le solde
- **Mes demandes** : liste avec type, dates, jours, statut. Cliquer sur une demande ouvre le detail et les commentaires du manager. Une demande en attente peut etre annulee

### Manager

- **Gestion des demandes** : uniquement les demandes de son equipe
- **Valider / Refuser** : a cote de chaque demande en attente. Le refus demande un motif obligatoire. La validation reduit le solde de l'employe
- **Calendrier** : cocher "Afficher les conges de mon equipe"

### RH

- **Gestion des utilisateurs** : creer un utilisateur (email, mot de passe, role, manager responsable), modifier, activer/desactiver, reinitialiser les mots de passe
- **Corriger un statut** : dans Gestion des demandes, le menu deroulant change le statut de n'importe quelle demande. Le solde est ajuste automatiquement

### Profil

- Page Profil : informations, solde de conges, changement de mot de passe

## Documentation technique

Architecture client-serveur : backend REST (Node.js + Express) qui expose des routes JSON, frontend React (SPA) avec React Router qui consomme l'API.

```
FINT2/
├── backend/
│   ├── config/db.js          Connexion MongoDB
│   ├── middleware/auth.js    Protection JWT et gardes de roles
│   ├── models/               Modeles Mongoose (User, Demande)
│   ├── routes/               Controleurs REST (auth, demandes, users, calendar)
│   ├── seed.js               Donnees de test
│   └── index.js              Point d'entree
├── frontend/
│   ├── src/context/          Contexte d'authentification, clients HTTP
│   ├── src/pages/            Vues (dashboard, demandes, calendrier, utilisateurs...)
│   ├── src/components/       Composants (Navbar, PrivateRoute)
│   └── src/App.js            Routes
└── README.md
```

Modeles principaux :

- **User** : email (unique), mot de passe hache (jamais renvoye), role (employe, manager, rh), manager (ObjectId vers User), congesRestants (defaut 25), isFirstLogin, isActive
- **Demande** : user, type, dateDebut/dateFin, nbJours (calcules, week-ends exclus), statut (en_attente, validee, refusee, annulee), commentaire, motifRefus, justificatif, traitePar

Regles metier :

- Calcul des jours : fonction `calculerJoursOuvrables` qui exclut samedis et dimanches
- Un manager ne voit et ne traite que les demandes des employes dont il est le manager
- `Maladie` et `Sans Solde` ne consomment pas le solde, les autres types deduisent nbJours a la validation
- Mots de passe haches avec bcryptjs (10 rounds), JWT 7 jours, comptes desactivables bloques a la connexion

## GitHub

Code source : https://github.com/Fararouille/FINT2

Projet de 4e annee - SUP Herman.
