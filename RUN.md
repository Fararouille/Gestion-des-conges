
## Prerequis

- Node.js 18 ou plus recent
- MongoDB demarre localement sur `mongodb://localhost:27017`

## Installation initiale


```powershell
cd "FINT2\backend"
npm install
cd "..\frontend"
npm install
```

## Initialiser les donnees de test


```powershell
cd "FINT2\backend"
npm run seed
```



### Terminal 1 - API backend

```powershell
cd "FINT2\backend"
npm start
```

API : `http://localhost:5001`

Verification : `http://localhost:5001/api/health`

### Terminal 2 - interface React

```powershell
cd "FINT2\frontend"
npm start
```

Interface : `http://localhost:3000`



## Comptes de test

| Role | Email | Mot de passe |
| --- | --- | --- |
| RH | rh@supherman.com | Suph3rm4n! |
| Manager | manager@supherman.com | Suph3rm4n! |
| Employe | employe@supherman.com | Suph3rm4n! |

