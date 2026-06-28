const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'curtain-showcase-default-secret-2026';

const authRoutes = require('./routes/auth');
const curtainRoutes = require('./routes/curtains');
const categoryRoutes = require('./routes/categories');
const favoriteRoutes = require('./routes/favorites');
const collectionRoutes = require('./routes/collections');
const uploadRoutes = require('./routes/upload');
const orderRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');
const notifyRoute = require('./routes/notify');
const pricetierRoutes = require('./routes/pricetiers');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// Admin pages (with auth) — must come before general static
const adminPages = express.static(path.join(__dirname, '..', 'public', 'admin'));
app.use('/admin', (req, res, next) => {
  if (req.path === '/login.html' || req.path === '/register.html') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return adminPages(req, res, next);
  }
  const token = req.query.token || '';
  try {
    jwt.verify(token, JWT_SECRET);
    return adminPages(req, res, next);
  } catch {
    return res.redirect('/admin/login.html');
  }
});

// Static files (no auth needed)
app.use('/css', express.static(path.join(__dirname, '..', 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, '..', 'public', 'js')));
app.use('/assets', express.static(path.join(__dirname, '..', 'public', 'assets')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Client static files (no auth)
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/curtains', curtainRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notify', notifyRoute);
app.use('/api/pricetiers', pricetierRoutes);

// Redirects
app.get('/', (req, res) => res.redirect('/client/'));
app.get('/admin', (req, res) => res.redirect('/admin/login.html'));

// Start
const PORT = process.env.PORT || 3000;

async function init() {
  await db.migrate();

  const bcrypt = require('bcryptjs');
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
    console.log('默认管理员已创建: admin / admin123');
  }

  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`服务已启动: http://localhost:${PORT}`);
  });
}

init().catch(e => { console.error('启动失败:', e); process.exit(1); });
