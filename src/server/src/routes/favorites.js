const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', async (req, res) => {
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
  res.json(await db.prepare(sql).all(...params));
});

router.post('/', async (req, res) => {
  const { curtain_id, collection_id } = req.body;
  const existing = collection_id
    ? await db.prepare('SELECT id FROM favorites WHERE curtain_id = ? AND collection_id = ?').get(curtain_id, collection_id)
    : await db.prepare('SELECT id FROM favorites WHERE curtain_id = ? AND collection_id IS NULL').get(curtain_id);
  if (existing) return res.json({ ok: true });
  await db.prepare('INSERT INTO favorites (curtain_id, collection_id) VALUES (?, ?)').run(curtain_id, collection_id || null);
  res.json({ ok: true });
});

router.put('/:id/move', async (req, res) => {
  const { collection_id } = req.body;
  await db.prepare('UPDATE favorites SET collection_id = ? WHERE id = ?').run(collection_id || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:curtainId', async (req, res) => {
  const { collection_id } = req.query;
  if (collection_id) {
    await db.prepare('DELETE FROM favorites WHERE curtain_id = ? AND collection_id = ?').run(req.params.curtainId, collection_id);
  } else {
    await db.prepare('DELETE FROM favorites WHERE curtain_id = ?').run(req.params.curtainId);
  }
  res.json({ ok: true });
});

module.exports = router;
