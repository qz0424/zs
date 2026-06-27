const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

router.get('/:dimension', (req, res) => {
  const { dimension } = req.params;
  const items = db.prepare('SELECT id, name FROM category_options WHERE dimension = ? ORDER BY sort_order').all(dimension);
  res.json(items);
});

router.get('/', (req, res) => {
  const dims = ['category', 'material', 'style', 'light', 'space'];
  const result = {};
  dims.forEach(d => {
    result[d] = db.prepare('SELECT id, name FROM category_options WHERE dimension = ? ORDER BY sort_order').all(d);
  });
  res.json(result);
});

router.post('/', auth, (req, res) => {
  const { dimension, name } = req.body;
  if (!dimension || !name) return res.status(400).json({ error: '缺少参数' });
  const info = db.prepare('INSERT INTO category_options (dimension, name) VALUES (?, ?)').run(dimension, name);
  res.json({ id: info.lastInsertRowid, dimension, name });
});

router.put('/:id', auth, (req, res) => {
  const { name } = req.body;
  db.prepare('UPDATE category_options SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM category_options WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
