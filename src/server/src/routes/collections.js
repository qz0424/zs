const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', (req, res) => {
  const list = db.prepare('SELECT * FROM collections ORDER BY sort_order, id').all();
  list.forEach(c => {
    c.count = db.prepare('SELECT COUNT(*) as cnt FROM favorites WHERE collection_id = ?').get(c.id).cnt;
  });
  res.json(list);
});

router.post('/', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: '请输入收藏夹名称' });
  const info = db.prepare('INSERT INTO collections (name) VALUES (?)').run(name);
  res.json({ id: info.lastInsertRowid, name, sort_order: 0 });
});

router.put('/:id', auth, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: '请输入收藏夹名称' });
  db.prepare('UPDATE collections SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ message: 'ok' });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('UPDATE favorites SET collection_id = NULL WHERE collection_id = ?').run(req.params.id);
  db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  res.json({ message: 'ok' });
});

module.exports = router;
