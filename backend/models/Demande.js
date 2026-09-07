const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Utilisateur requis']
  },
  type: {
    type: String,
    enum: ['CP', 'RTT', 'Sans Solde', 'Maladie', 'Formation'],
    required: [true, 'Type de congé requis']
  },
  dateDebut: {
    type: Date,
    required: [true, 'Date de début requise']
  },
  dateFin: {
    type: Date,
    required: [true, 'Date de fin requise']
  },
  nbJours: {
    type: Number,
    required: [true, 'Nombre de jours requis']
  },
  statut: {
    type: String,
    enum: ['en_attente', 'validee', 'refusee', 'annulee'],
    default: 'en_attente'
  },
  commentaire: {
    type: String,
    default: ''
  },
  motifRefus: {
    type: String,
    default: ''
  },
  justificatif: {
    type: String,
    default: ''
  },
  traitePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Demande', demandeSchema);
