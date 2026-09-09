const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, rhOnly } = require('../middleware/auth');

// GET /api/users - list all users (RH only) with pagination and search
router.get('/', protect, rhOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { search } = req.query;

    let query = {};
    if (search && search.trim()) {
      query = { email: { $regex: search.trim(), $options: 'i' } };
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .populate('manager', 'email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      users,
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

// POST /api/users - create new user (RH only)
router.post('/', protect, rhOnly, async (req, res) => {
  try {
    const { email, role, manager, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Cet email existe deja' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'employe',
      manager: manager || null,
      isFirstLogin: true,
      congesRestants: 25
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      manager: user.manager,
      congesRestants: user.congesRestants,
      isFirstLogin: user.isFirstLogin,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/users/:id - update user info (RH only)
router.put('/:id', protect, rhOnly, async (req, res) => {
  try {
    const { role, manager, congesRestants } = req.body;
    const updateData = {};

    if (role !== undefined) updateData.role = role;
    if (manager !== undefined) updateData.manager = manager || null;
    if (congesRestants !== undefined) updateData.congesRestants = congesRestants;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('manager', 'email role');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouve' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      manager: user.manager,
      congesRestants: user.congesRestants,
      isFirstLogin: user.isFirstLogin,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/users/:id/reset-password - reset user password (RH only)
router.put('/:id/reset-password', protect, rhOnly, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caracteres' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouve' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.isFirstLogin = true;
    await user.save();

    res.json({ message: 'Mot de passe modifie avec succes' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/users/:id/toggle-active - activate/deactivate account (RH only)
router.put('/:id/toggle-active', protect, rhOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouve' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      manager: user.manager,
      congesRestants: user.congesRestants,
      isActive: user.isActive,
      message: user.isActive ? 'Compte active' : 'Compte desactive'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
