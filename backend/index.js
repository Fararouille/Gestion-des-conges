const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/demandes', require('./routes/demandes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/calendar', require('./routes/calendar'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FINT2 API fonctionne' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Serveur demarre sur le port ${PORT}`);
});
