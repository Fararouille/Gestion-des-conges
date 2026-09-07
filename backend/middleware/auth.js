const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      return res.status(401).json({ message: 'Non autorisé, utilisateur non trouvé' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Non autorisé, token invalide' });
  }
};

// Restrict to RH only
const rhOnly = (req, res, next) => {
  if (req.user.role !== 'rh') {
    return res.status(403).json({ message: 'Accès réservé au service RH' });
  }
  next();
};

// Restrict to Manager or RH
const managerOrRh = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'rh') {
    return res.status(403).json({ message: 'Accès réservé aux managers et RH' });
  }
  next();
};

module.exports = { protect, rhOnly, managerOrRh };
