const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

const PUBLIC_KEYS = ['phone', 'wechat', 'wechat_qr', 'business_name', 'slogan'];

router.get('/', async (req, res) => {
  const rows = await db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  if (!req.headers.authorization) {
    const publicSettings = {};
    PUBLIC_KEYS.forEach(k => { if (settings[k]) publicSettings[k] = settings[k]; });
    return res.json(publicSettings);
  }
  res.json(settings);
});

router.put('/', auth, async (req, res) => {
  const update = db.transaction(async (txnDb) => {
    const stmt = txnDb.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, NOW())
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = NOW()`);
    for (const [key, value] of Object.entries(req.body)) {
      if (key && typeof key === 'string') await stmt.run(key, value || null);
    }
  });
  await update();
  res.json({ ok: true });
});

module.exports = router;
