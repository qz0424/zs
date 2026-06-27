const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

const PUBLIC_KEYS = ['phone', 'wechat', 'wechat_qr', 'business_name', 'slogan'];

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  if (!req.headers.authorization) {
    const publicSettings = {};
    PUBLIC_KEYS.forEach(k => { if (settings[k]) publicSettings[k] = settings[k]; });
    return res.json(publicSettings);
  }
  res.json(settings);
});

router.put('/', auth, (req, res) => {
  const stmt = db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`);
  const update = db.transaction(() => {
    for (const [key, value] of Object.entries(req.body)) {
      if (key && typeof key === 'string') stmt.run(key, value || null);
    }
  });
  update();
  res.json({ ok: true });
});

module.exports = router;
