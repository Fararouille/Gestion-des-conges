# FINT2 - Gestion des conges

FINT2 est une application web qui simplifie la gestion des conges chez SUP Herman. Un employe envoie une demande, un manager peut la traiter et le service RH garde une vue complete sur les equipes et le calendrier.

## Fonctionnalites

- Connexion par email et mot de passe avec authentification JWT.
- Creation de demandes : CP, RTT, sans solde, maladie ou formation.
- Calcul automatique des jours ouvrables, sans les week-ends.
- Controle du solde disponible et detection des chevauchements.
- Validation, refus et annulation selon le role.
- Calendrier des conges valides avec filtrage par equipe.
- Administration des utilisateurs par le service RH.
- Changement et reinitialisation des mots de passe.

## Technologies

- Backend : Node.js, Express et Mongoose.
- Frontend : React 18, React Router et Axios.
- Base de donnees : MongoDB.
- Securite : JWT et bcryptjs.

## Installation et lancement

### Prerequis

- Node.js 18 ou plus recent.
- MongoDB local demarre sur `mongodb://localhost:27017`, ou MongoDB Atlas.
- npm.

Depuis le dossier `FINT2` :

```powershell
cd backend
npm install
cd ..\frontend
npm install
```

Le fichier `backend/.env` doit contenir une configuration adaptee a votre environnement. Ne publiez jamais un vrai secret JWT :

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/fint2-leaves
JWT_SECRET=changez-cette-valeur-en-local
```

Initialiser les comptes de demonstration :

```powershell
cd backend
npm run seed
```

Lancer le backend dans un premier terminal :

```powershell
cd backend
npm start
```

Lancer le frontend dans un second terminal :

```powershell
cd frontend
npm start
```

L'interface est disponible sur [http://localhost:3000](http://localhost:3000) et l'API sur [http://localhost:5001](http://localhost:5001). Le guide detaille se trouve dans [RUN.md](RUN.md).

Verification de l'API : [http://localhost:5001/api/health](http://localhost:5001/api/health).

Pour lancer FINT1 et FINT2 en meme temps, utiliser le port `3001` pour le frontend FINT2 :

```powershell
$env:PORT=3001
npm start
```

## Comptes de demonstration

| Role | Email | Mot de passe |
| --- | --- | --- |
| RH | `rh@supherman.com` | `Suph3rm4n!` |
| Manager | `manager@supherman.com` | `Suph3rm4n!` |
| Employe | `employe@supherman.com` | `Suph3rm4n!` |

Ces comptes sont prevus uniquement pour le developpement local.

## Documentation de l'API

Base URL : `http://localhost:5001/api`.

Sauf indication contraire, les routes necessitent l'en-tete `Authorization: Bearer <token>`.

### Authentification

| Methode | Route | Acces | Description |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Connecte un utilisateur et retourne un token JWT. |
| `POST` | `/auth/first-login` | Authentifie | Definit le mot de passe initial. |
| `GET` | `/auth/me` | Authentifie | Retourne le profil courant. |
| `PUT` | `/auth/change-password` | Authentifie | Change le mot de passe avec `currentPassword` et `newPassword`. |

Exemple de connexion :

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employe@supherman.com","password":"Suph3rm4n!"}'
```

### Demandes de conge

| Methode | Route | Acces | Description |
| --- | --- | --- | --- |
| `GET` | `/demandes` | Authentifie | Liste les demandes accessibles selon le role. |
| `GET` | `/demandes/:id` | Authentifie | Retourne le detail d'une demande. |
| `POST` | `/demandes` | Authentifie | Cree une demande. |
| `PUT` | `/demandes/:id/annuler` | Proprietaire | Annule une demande `en_attente`. |
| `PUT` | `/demandes/:id/valider` | Manager ou RH | Valide une demande en attente. |
| `PUT` | `/demandes/:id/refuse` | Manager ou RH | Refuse une demande avec un `motifRefus` optionnel. |
| `PUT` | `/demandes/:id/modifier-statut` | RH | Change le statut d'une demande. |

Creation d'une demande :

```json
{
  "type": "CP",
  "dateDebut": "2026-10-12",
  "dateFin": "2026-10-16",
  "commentaire": "Conges en famille"
}
```

```bash
curl -X POST http://localhost:5001/api/demandes \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"type":"CP","dateDebut":"2026-10-12","dateFin":"2026-10-16","commentaire":"Conges en famille"}'
```

Le nombre de jours est calcule par l'API. Les chevauchements et les demandes depassant le solde disponible sont refuses. Les conges `Maladie` et `Sans Solde` ne consomment pas le solde.

### Utilisateurs

| Methode | Route | Acces | Description |
| --- | --- | --- | --- |
| `GET` | `/users` | RH | Liste les utilisateurs. |
| `POST` | `/users` | RH | Cree un utilisateur. |
| `PUT` | `/users/:id` | RH | Modifie un utilisateur. |
| `PUT` | `/users/:id/reset-password` | RH | Reinitialise un mot de passe. |
| `PUT` | `/users/:id/toggle-active` | RH | Active ou desactive un compte. |

### Calendrier

| Methode | Route | Acces | Description |
| --- | --- | --- | --- |
| `GET` | `/calendar` | Authentifie | Retourne les demandes validees visibles par l'utilisateur. |
| `GET` | `/calendar?equipe=true` | Manager ou RH | Retourne la vue de l'equipe. |

Les erreurs sont retournees au format `{"message":"..."}` avec un code HTTP `400`, `401`, `403`, `404` ou `500`.

## Organisation du projet

```text
FINT2/
├── backend/       API Express, modeles MongoDB et authentification
├── frontend/      Interface React
├── README.md      Documentation principale
└── RUN.md         Guide de lancement local
```

## GitHub

Le code source est disponible sur [github.com/Fararouille/FINT2](https://github.com/Fararouille/FINT2).

Pour associer un depot local au depot distant :

```bash
git remote add origin https://github.com/Fararouille/FINT2.git
git branch -M main
git push -u origin main
```

Projet de 4e annee - SUP Herman.
