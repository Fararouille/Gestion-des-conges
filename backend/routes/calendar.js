const express = require('express');
const router = express.Router();
const Demande = require('../models/Demande');
const User = require('../models/User');
const { protect, managerOrRh } = require('../middleware/auth');

// GET /api/calendar - get validated demandes for calendar
router.get('/', protect, async (req, res) => {
  try {
    let demandes;

    if (req.user.role === 'rh') {
      // RH sees all validated
      demandes = await Demande.find({ statut: 'validee' })
        .populate('user', 'email role')
        .sort({ dateDebut: 1 });
    } else if (req.user.role === 'manager' && req.query.equipe === 'true') {
      // Manager sees team validated
      const teamMembers = await User.find({ manager: req.user._id }).select('_id');
      const teamIds = teamMembers.map((m) => m._id);
      teamIds.push(req.user._id);
      demandes = await Demande.find({ statut: 'validee', user: { $in: teamIds } })
        .populate('user', 'email role')
        .sort({ dateDebut: 1 });
    } else {
      // Employee sees own validated
      demandes = await Demande.find({ statut: 'validee', user: req.user._id })
        .populate('user', 'email role')
        .sort({ dateDebut: 1 });
    }

    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
