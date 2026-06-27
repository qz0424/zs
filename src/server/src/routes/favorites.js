const { Router } = require('express');
const db = require('../db');

const router = Router();

router.get('/', (req, res) => {
  const list = db.prepare(`
    SELECT c.id, c.name, c.size_range,
      (SELECT url FROM curtain_media WHERE curtain_id = c.id AND type = 'image' ORDER BY sort_order LIMIT 1) as cover
    FROM favorites f JOIN curtains c ON c.id = f.curtain_id
    ORDER BY f.created_at DESC
  `).all();
  res.json(list);
});

router.post('/', (req, res) => {
  const { curtain_id } = req.body;
  const existing = db.prepare('SELECT id FROM favorites WHERE curtain_id = ?').get(curtain_id);
  if (existing) return res.json({ ok: true });
  db.prepare('INSERT INTO favorites (curtain_id) VALUES (?)').run(curtain_id);
  res.json({ ok: true });
});

router.delete('/:curtainId', (req, res) => {
  db.prepare('DELETE FROM favorites WHERE curtain_id = ?').run(req.params.curtainId);
  res.json({ ok: true });
});

module.exports = router;
