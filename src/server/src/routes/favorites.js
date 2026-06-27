const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const { collection_id } = req.query;
  let sql = `
    SELECT f.id as fav_id, f.collection_id, c.id, c.name, c.size_range,
      (SELECT url FROM curtain_media WHERE curtain_id = c.id AND type = 'image' ORDER BY sort_order LIMIT 1) as cover
    FROM favorites f JOIN curtains c ON c.id = f.curtain_id
  `;
  const params = [];
  if (collection_id) {
    sql += ' WHERE f.collection_id = ?';
    params.push(collection_id);
  }
  sql += ' ORDER BY f.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { curtain_id, collection_id } = req.body;
  const existing = db.prepare('SELECT id FROM favorites WHERE curtain_id = ? AND collection_id IS ?').get(curtain_id, collection_id || null);
  if (existing) return res.json({ ok: true });
  db.prepare('INSERT INTO favorites (curtain_id, collection_id) VALUES (?, ?)').run(curtain_id, collection_id || null);
  res.json({ ok: true });
});

router.put('/:id/move', (req, res) => {
  const { collection_id } = req.body;
  db.prepare('UPDATE favorites SET collection_id = ? WHERE id = ?').run(collection_id || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:curtainId', (req, res) => {
  const { collection_id } = req.query;
  if (collection_id) {
    db.prepare('DELETE FROM favorites WHERE curtain_id = ? AND collection_id = ?').run(req.params.curtainId, collection_id);
  } else {
    db.prepare('DELETE FROM favorites WHERE curtain_id = ?').run(req.params.curtainId);
  }
  res.json({ ok: true });
});

module.exports = router;
