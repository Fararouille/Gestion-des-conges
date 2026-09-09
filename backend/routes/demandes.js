const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const Demande = require('../models/Demande');
const User = require('../models/User');
const { protect, managerOrRh } = require('../middleware/auth');

const upload = multer({
  dest: path.join(__dirname, '../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    callback(null, allowed.includes(file.mimetype));
  }
});

// Calculate business days between two dates (excluding weekends)
function calculerJoursOuvrables(dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  let jours = 0;
  const courant = new Date(debut);

  while (courant <= fin) {
    const jour = courant.getDay();
    if (jour !== 0 && jour !== 6) {
      jours++;
    }
    courant.setDate(courant.getDate() + 1);
  }
  return jours;
}

// Check for overlapping leave requests
async function hasOverlap(userId, dateDebut, dateFin, excludeId) {
  const query = {
    user: userId,
    statut: { $in: ['en_attente', 'validee'] },
    $or: [
      { dateDebut: { $lte: new Date(dateFin) }, dateFin: { $gte: new Date(dateDebut) } }
    ]
  };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const overlap = await Demande.findOne(query);
  return overlap !== null;
}

// GET /api/demandes — list demandes based on role, with pagination, search and sort
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { statut, type, search, sort } = req.query;

    let baseQuery = {};
    let finalUserFilter = null;

    if (req.user.role === 'rh') {
      finalUserFilter = {};
    } else if (req.user.role === 'manager') {
      const teamMembers = await User.find({ manager: req.user._id }).select('_id');
      const teamIds = teamMembers.map((m) => m._id);
      teamIds.push(req.user._id);
      finalUserFilter = { user: { $in: teamIds } };
    } else {
      finalUserFilter = { user: req.user._id };
    }

    if (finalUserFilter) baseQuery = { ...baseQuery, ...finalUserFilter };
    if (statut) baseQuery.statut = statut;
    if (type) baseQuery.type = type;

    // Apply search on the matching users (by email) when provided
    let searchUserIds = null;
    if (search && search.trim()) {
      const matchedUsers = await User.find({ email: { $regex: search.trim(), $options: 'i' } }).select('_id');
      searchUserIds = matchedUsers.map((u) => u._id);
    }

    const countQuery = { ...baseQuery };
    const sortField = sort || 'createdAt';
    const sortDirection = sortField.startsWith('-') ? -1 : 1;
    const cleanSortField = sortField.replace(/^-/, '');

    // Count for pagination metadata (respecting search scope)
    let total;
    if (searchUserIds) {
      const searchCountQuery = { ...baseQuery, user: { $in: searchUserIds } };
      total = await Demande.countDocuments(searchCountQuery);
    } else {
      total = await Demande.countDocuments(countQuery);
    }

    let query;
    if (searchUserIds) {
      query = Demande.find({ ...baseQuery, user: { $in: searchUserIds } });
    } else {
      query = Demande.find(baseQuery);
    }

    const demandes = await query
      .populate('user', 'email role manager')
      .populate('traitePar', 'email role')
      .sort({ [cleanSortField]: sortDirection })
      .skip(skip)
      .limit(limit);

    res.json({
      demandes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET /api/demandes/:id — single demande
router.get('/:id', protect, async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id)
      .populate('user', 'email role manager')
      .populate('traitePar', 'email role');

    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    const isOwner = demande.user._id.toString() === req.user._id.toString();
    const isManagerOfOwner = req.user.role === 'manager'
      && demande.user.manager?.toString() === req.user._id.toString();
    if (req.user.role === 'employe' && !isOwner) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if (req.user.role === 'manager' && !isOwner && !isManagerOfOwner) {
      return res.status(403).json({ message: 'Vous ne pouvez voir que les demandes de votre équipe' });
    }

    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/demandes — create new leave request
router.post('/', protect, upload.single('justificatif'), async (req, res) => {
  try {
    const { type, dateDebut, dateFin, commentaire } = req.body;

    if (!type || !dateDebut || !dateFin) {
      return res.status(400).json({ message: 'Type, date de début et date de fin requis' });
    }

    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);

    if (fin < debut) {
      return res.status(400).json({ message: 'La date de fin doit être après la date de début' });
    }

    // Calculate business days
    const nbJours = calculerJoursOuvrables(debut, fin);

    if (nbJours === 0) {
      return res.status(400).json({ message: 'Aucun jour ouvrable dans cette période (weekend uniquement)' });
    }

    // Check remaining days (skip for Maladie and Sans Solde)
    if (type !== 'Maladie' && type !== 'Sans Solde') {
      if (nbJours > req.user.congesRestants) {
        return res.status(400).json({
          message: `Solde insuffisant. Vous avez ${req.user.congesRestants} jours restants, la demande est de ${nbJours} jours`
        });
      }
    }

    // Check overlapping
    const overlap = await hasOverlap(req.user._id, debut, fin);
    if (overlap) {
      return res.status(400).json({ message: 'Chevauchement avec une demande existante' });
    }

    const demande = await Demande.create({
      user: req.user._id,
      type,
      dateDebut: debut,
      dateFin: fin,
      nbJours,
      commentaire: commentaire || '',
      justificatif: req.file ? req.file.filename : ''
    });

    const populated = await Demande.findById(demande._id)
      .populate('user', 'email role manager');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/demandes/:id/annuler — cancel own request (only en_attente)
router.put('/:id/annuler', protect, async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);

    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (demande.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez annuler que vos propres demandes' });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Seules les demandes en attente peuvent être annulées' });
    }

    demande.statut = 'annulee';
    await demande.save();

    const populated = await Demande.findById(demande._id)
      .populate('user', 'email role manager')
      .populate('traitePar', 'email role');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/demandes/:id/valider — manager validates
router.put('/:id/valider', protect, managerOrRh, async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id).populate('user', 'email role manager');

    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Seules les demandes en attente peuvent être validées' });
    }

    // Manager can only validate team requests
    if (req.user.role === 'manager') {
      const user = await User.findById(demande.user._id);
      if (!user || user.manager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Vous ne pouvez valider que les demandes de votre équipe' });
      }
    }

    demande.statut = 'validee';
    demande.traitePar = req.user._id;
    await demande.save();

    // Reduce congesRestants (skip for Maladie and Sans Solde)
    if (demande.type !== 'Maladie' && demande.type !== 'Sans Solde') {
      await User.findByIdAndUpdate(demande.user._id, {
        $inc: { congesRestants: -demande.nbJours }
      });
    }

    const updated = await Demande.findById(demande._id)
      .populate('user', 'email role manager')
      .populate('traitePar', 'email role');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/demandes/:id/refuse — manager refuses
router.put('/:id/refuse', protect, managerOrRh, async (req, res) => {
  try {
    const { motifRefus } = req.body;
    const demande = await Demande.findById(req.params.id).populate('user', 'email role manager');

    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Seules les demandes en attente peuvent être refusées' });
    }

    // Manager can only refuse team requests
    if (req.user.role === 'manager') {
      const user = await User.findById(demande.user._id);
      if (!user || user.manager?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Vous ne pouvez refuser que les demandes de votre équipe' });
      }
    }

    demande.statut = 'refusee';
    demande.traitePar = req.user._id;
    demande.motifRefus = motifRefus || '';
    await demande.save();

    const updated = await Demande.findById(demande._id)
      .populate('user', 'email role manager')
      .populate('traitePar', 'email role');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/demandes/:id/modifier-statut — RH can change any status
router.put('/:id/modifier-statut', protect, async (req, res) => {
  try {
    if (req.user.role !== 'rh') {
      return res.status(403).json({ message: 'Réservé au service RH' });
    }

    const { statut } = req.body;
    const validStatuts = ['en_attente', 'validee', 'refusee', 'annulee'];

    if (!statut || !validStatuts.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const demande = await Demande.findById(req.params.id);
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    const ancienStatut = demande.statut;
    demande.statut = statut;
    demande.traitePar = req.user._id;
    await demande.save();

    // Handle congesRestants adjustments
    if (ancienStatut !== 'validee' && statut === 'validee') {
      // Becoming validated: reduce days
      if (demande.type !== 'Maladie' && demande.type !== 'Sans Solde') {
        await User.findByIdAndUpdate(demande.user._id, {
          $inc: { congesRestants: -demande.nbJours }
        });
      }
    } else if (ancienStatut === 'validee' && statut !== 'validee') {
      // No longer validated: restore days
      if (demande.type !== 'Maladie' && demande.type !== 'Sans Solde') {
        await User.findByIdAndUpdate(demande.user._id, {
          $inc: { congesRestants: demande.nbJours }
        });
      }
    }

    const updated = await Demande.findById(demande._id)
      .populate('user', 'email role manager')
      .populate('traitePar', 'email role');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
