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

La liste des demandes supporte la **pagination**, la **recherche** et le **tri** via les parametres de requete :

| Parametre | Type | Description |
| --- | --- | --- |
| `page` | nombre | Numero de page (defaut `1`). |
| `limit` | nombre | Nombre d'elements par page (defaut `10`). |
| `statut` | string | Filtre par statut : `en_attente`, `validee`, `refusee`, `annulee`. |
| `type` | string | Filtre par type : `CP`, `RTT`, `Sans Solde`, `Maladie`, `Formation`. |
| `search` | string | Recherche par email d'employe. |
| `sort` | string | Champ de tri (defaut `-createdAt`). Prefixe `-` pour un tri decroissant. |

Reponse :

```json
{
  "demandes": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

```bash
curl -X GET "http://localhost:5001/api/demandes?page=2&limit=10&statut=en_attente&type=CP&sort=-createdAt" \
  -H "Authorization: Bearer <jwt>"
```
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
| `GET` | `/users` | RH | Liste les utilisateurs (supporte `page`, `limit`, `search`). |
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

## Manuel utilisateur

### Connexion

1. Ouvrir l'application sur `http://localhost:3000`.
2. Saisir votre adresse email et votre mot de passe.
3. Cliquer sur **Se connecter**.

> **Premiere connexion** : si c'est votre premiere connexion, un ecran vous invite a definir un nouveau mot de passe (minimum 6 caracteres).
>
> **Mot de passe oublie** : contactez le service RH qui peut reinitialiser votre mot de passe depuis la page **Gestion des utilisateurs**.

### En tant qu'employe

#### Consulter mon tableau de bord

- Apres connexion, le **Tableau de bord** affiche :
  - Vos **jours de conges restants**.
  - Le nombre de **demandes en attente**.
  - L'**historique** de vos dernieres demandes.
  - La liste des **prochains conges valides**.

#### Creer une demande de conges

1. Cliquez sur **Nouvelle demande** dans le menu lateral.
2. Choisissez le **type de conge** : CP, RTT, Sans Solde, Maladie ou Formation.
3. Selectionnez les **dates de debut et de fin**.
4. Le **nombre de jours ouvrables** est calcule automatiquement (les week-ends sont exclus).
5. Ajoutez un **commentaire** facultatif et un **justificatif** (JPG, PNG ou PDF, 5 Mo max).
6. Verifiez le solde restant affiche, puis cliquez sur **Envoyer la demande**.

> L'application refuse automatiquement les demandes qui chevauchent une demande existante ou qui depassent votre solde disponible.

#### Consulter et annuler mes demandes

1. Cliquez sur **Mes demandes**.
2. Le tableau liste vos demandes avec le type, les dates, le nombre de jours et le statut.
3. **Cliquez sur une demande** pour voir les details et les commentaires du manager.
4. Une demande **En attente** peut etre annulee via le bouton **Annuler**.

### En tant que manager

#### Gerer les demandes de mon equipe

1. Cliquez sur **Gestion des demandes**.
2. Seules les demandes de vos employes (votre equipe) sont affichees.
3. Utilisez les **filtres** (statut, type, employe, periode) pour affiner la liste.

#### Valider ou refuser une demande

- A cote de chaque demande **En attente** :
  - **Valider** : la demande passe au statut **Validee** et le solde de l'employe est reduit.
  - **Refuser** : une modale vous demande un **motif de refus obligatoire**. La demande passe au statut **Refusee**.

#### Consulter le calendrier de mon equipe

- Cliquez sur **Calendrier**, puis cochez **Afficher les conges de mon equipe** pour voir les absences validees de vos collaborateurs.

### En tant que RH

#### Creer et gerer les utilisateurs

1. Cliquez sur **Gestion des utilisateurs**.
2. Cliquez sur **+ Nouvel utilisateur**.
3. Saisissez l'email, choisissez un mot de passe, attribuez un **role** et designez un **manager responsable**.
4. Vous pouvez ensuite :
   - **Modifier** les informations d'un utilisateur.
   - **Activer / desactiver** un compte.
   - **Reinitialiser** le mot de passe d'un employe.

#### Corriger le statut d'une demande

- Dans **Gestion des demandes**, le RH peut changer le statut de n'importe quelle demande via le menu deroulant.
- Le solde de conges est automatiquement ajuste lors des changements (deduit a la validation, restitue a la de-validation).

### Mon profil

- Cliquez sur **Profil** pour voir vos informations, votre solde de conges et modifier votre mot de passe.

## Documentation technique

### Architecture

L'application repose sur une **architecture client-serveur** :
- Un **backend REST API** (Node.js + Express) expose des routes JSON consommees par le frontend.
- Un **frontend** (React 18 avec React Router) fournit une interface a page unique (SPA).

### Structure du projet

```text
FINT2/
├── backend/                  API Express (MVC)
│   ├── config/db.js          Connexion MongoDB
│   ├── middleware/auth.js    Protection JWT et gardes de roles
│   ├── models/               Modeles Mongoose (User, Demande)
│   ├── routes/               Controleurs REST (auth, demandes, users, calendar)
│   ├── seed.js               Script d'initialisation des donnees de test
│   └── index.js              Point d'entree du serveur
├── frontend/                 Interface React
│   ├── src/context/          Contexte d'authentification et clients HTTP
│   ├── src/pages/            Vues (dashboard, demandes, calendrier, utilisateurs...)
│   ├── src/components/       Composants reutilisables (Navbar, PrivateRoute)
│   └── src/App.js            Configuration des routes
├── README.md                 Documentation principale
└── RUN.md                    Guide de lancement local
```

### Choix technologiques

- **Node.js + Express + Mongoose (MERN)** : stack homogene JavaScript entre frontend et backend, ecosysteme riche et documentation abondante, adaptee a une application interne de petite taille.
- **MongoDB (NoSQL)** : modele flexible pour evoluer facilement le schema (ajout de champs) sans migration lourde ; documents imbriques pour les demandes de conges.
- **JWT + bcryptjs** : authentification sans etat (stateless), mots de passe haches avant stockage.

### Modele de donnees

#### Utilisateur (`User`)
| Champ | Type | Description |
| --- | --- | --- |
| `email` | String (unique) | Identifiant de connexion |
| `password` | String (hache) | Mot de passe, jamais expose (`select: false`) |
| `role` | enum | `employe`, `manager`, `rh` |
| `manager` | ObjectId → User | Manager responsable d'un employe (hierarchie) |
| `congesRestants` | Number | Solde de conges disponible (defaut 25) |
| `isFirstLogin` | Boolean | Force le changement de mot de passe a la premiere connexion |
| `isActive` | Boolean | Active / desactive le compte |

#### Demande de conges (`Demande`)
| Champ | Type | Description |
| --- | --- | --- |
| `user` | ObjectId → User | Auteur de la demande |
| `type` | enum | `CP`, `RTT`, `Sans Solde`, `Maladie`, `Formation` |
| `dateDebut` / `dateFin` | Date | Periode demandee |
| `nbJours` | Number | Jours ouvrables calcules (week-ends exclus) |
| `statut` | enum | `en_attente`, `validee`, `refusee`, `annulee` |
| `commentaire` | String | Commentaire de l'auteur |
| `motifRefus` | String | Motif de refus (obligatoire au refus) |
| `justificatif` | String | Chemin du fichier justificatif |
| `traitePar` | ObjectId → User | Personne ayant traite la demande (traçabilite) |

### Règles metier

- **Calcul des jours** : fonction `calculerJoursOuvrables` exclut les samedis et dimanches.
- **Chevauchement** : une demande est refusee si elle chevauche une demande `en_attente` ou `validee` du meme utilisateur.
- **Solde** : les conges `Maladie` et `Sans Solde` ne consomment pas le solde. Les autres types deduisent `nbJours` a la validation.
- **Perimetre manager** : un manager ne voit et ne traite que les demandes des employes dont il est le `manager`.
- **Droits d'acces** : middleware `rhOnly` et `managerOrRh` protegent les routes sensibles.

### Securite

- Mots de passe haches avec `bcryptjs` (10 rounds).
- Authentification par **JWT** (expiration 7 jours) avec intermediaire `protect`.
- Controle d'acces par **role** sur chaque route sensible.
- Validation des entrees (longueur, types, dates, doublons d'email).
- Comptes desactivables (`isActive`) bloques a la connexion.

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
