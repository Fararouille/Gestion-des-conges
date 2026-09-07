const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Demande = require('./models/Demande');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecte pour le seed');

    // Clear existing data
    await User.deleteMany({});
    await Demande.deleteMany({});
    console.log('Donnees existantes supprimees');

    // Create RH user
    const rhPassword = await bcrypt.hash('Suph3rm4n!', 10);
    const rh = await User.create({
      email: 'rh@supherman.com',
      password: rhPassword,
      role: 'rh',
      congesRestants: 25,
      isFirstLogin: false,
      isActive: true
    });
    console.log('RH cree:', rh.email);

    // Create Manager user
    const managerPassword = await bcrypt.hash('Suph3rm4n!', 10);
    const manager = await User.create({
      email: 'manager@supherman.com',
      password: managerPassword,
      role: 'manager',
      congesRestants: 25,
      isFirstLogin: false,
      isActive: true
    });
    console.log('Manager cree:', manager.email);

    // Create Employe user with manager assigned
    const employePassword = await bcrypt.hash('Suph3rm4n!', 10);
    const employe = await User.create({
      email: 'employe@supherman.com',
      password: employePassword,
      role: 'employe',
      manager: manager._id,
      congesRestants: 20,
      isFirstLogin: false,
      isActive: true
    });
    console.log('Employe cree:', employe.email, '(manager:', manager.email, ')');

    // Create sample demandes
    const now = new Date();

    // Future CP - en attente
    const cpDebut1 = new Date(now);
    cpDebut1.setDate(now.getDate() + 10);
    const cpFin1 = new Date(cpDebut1);
    cpFin1.setDate(cpDebut1.getDate() + 4);

    await Demande.create({
      user: employe._id,
      type: 'CP',
      dateDebut: cpDebut1,
      dateFin: cpFin1,
      nbJours: 5,
      statut: 'en_attente',
      commentaire: 'Vacances en famille'
    });

    // Future RTT - validee
    const rttDebut = new Date(now);
    rttDebut.setDate(now.getDate() + 20);
    const rttFin = new Date(rttDebut);
    rttFin.setDate(rttDebut.getDate() + 1);

    await Demande.create({
      user: employe._id,
      type: 'RTT',
      dateDebut: rttDebut,
      dateFin: rttFin,
      nbJours: 2,
      statut: 'validee',
      traitePar: manager._id,
      commentaire: 'RTT personnel'
    });

    // Past CP - refusee
    const cpDebut2 = new Date(now);
    cpDebut2.setDate(now.getDate() - 30);
    const cpFin2 = new Date(cpDebut2);
    cpFin2.setDate(cpDebut2.getDate() + 9);

    await Demande.create({
      user: employe._id,
      type: 'CP',
      dateDebut: cpDebut2,
      dateFin: cpFin2,
      nbJours: 10,
      statut: 'refusee',
      traitePar: manager._id,
      motifRefus: 'Periode trop chargee pour l equipe'
    });

    // Formation - en attente
    const formDebut = new Date(now);
    formDebut.setDate(now.getDate() + 15);
    const formFin = new Date(formDebut);
    formFin.setDate(formDebut.getDate() + 2);

    await Demande.create({
      user: employe._id,
      type: 'Formation',
      dateDebut: formDebut,
      dateFin: formFin,
      nbJours: 3,
      statut: 'en_attente',
      commentaire: 'Formation React avancee'
    });

    // Manager own CP - en attente
    const mgrDebut = new Date(now);
    mgrDebut.setDate(now.getDate() + 30);
    const mgrFin = new Date(mgrDebut);
    mgrFin.setDate(mgrDebut.getDate() + 6);

    await Demande.create({
      user: manager._id,
      type: 'CP',
      dateDebut: mgrDebut,
      dateFin: mgrFin,
      nbJours: 7,
      statut: 'en_attente',
      commentaire: 'Conges d ete'
    });

    console.log('Demandes echantillon creees avec succes');
    console.log('\n=== UTILISATEURS CREES ===');
    console.log('RH:      rh@supherman.com / Suph3rm4n!');
    console.log('Manager: manager@supherman.com / Suph3rm4n!');
    console.log('Employe: employe@supherman.com / Suph3rm4n!');

    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seed:', error);
    process.exit(1);
  }
};

seed();
