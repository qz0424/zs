const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const curtainRoutes = require('./routes/curtains');
const categoryRoutes = require('./routes/categories');
const favoriteRoutes = require('./routes/favorites');
const collectionRoutes = require('./routes/collections');
const uploadRoutes = require('./routes/upload');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const notifyRoute = require('./routes/notify');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/curtains', curtainRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notify', notifyRoute);
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));
app.get('/client', (req, res) => res.redirect('/client/'));

module.exports = app;
