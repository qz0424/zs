const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const curtainRoutes = require('./routes/curtains');
const categoryRoutes = require('./routes/categories');
const favoriteRoutes = require('./routes/favorites');
const collectionRoutes = require('./routes/collections');
const uploadRoutes = require('./routes/upload');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, '..', 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'public', 'js')));
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const adminPages = express.static(path.join(__dirname, '..', 'public', 'admin'));
app.use('/admin', (req, res, next) => {
  if (req.path === '/login.html' || req.path === '/register.html') return adminPages(req, res, next);
  const token = req.query.token || '';
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return adminPages(req, res, next);
  } catch {
    return res.redirect('/admin/login.html');
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/curtains', curtainRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin', uploadRoutes);
app.get('/', (req, res) => res.redirect('/admin/login.html'));
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));

module.exports = app;
