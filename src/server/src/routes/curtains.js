const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

function getCurtain(id) {
  const curtain = db.prepare('SELECT * FROM curtains WHERE id = ?').get(id);
  if (!curtain) return null;
  curtain.colors = db.prepare('SELECT * FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(id);
  curtain.media = db.prepare('SELECT * FROM curtain_media WHERE curtain_id = ? ORDER BY sort_order').all(id);
  curtain.category = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.category_id);
  curtain.material = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.material_id);
  curtain.style = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.style_id);
  curtain.light_level = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.light_level_id);
  curtain.space = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.space_id);
  return curtain;
}

router.get('/', (req, res) => {
  let { search, category, material, style, space, light, status } = req.query;
  if (!status) status = 'active';

  let sql = 'SELECT id, name, size_range, status, created_at FROM curtains WHERE 1=1';
  const params = [];

  if (!req.headers.authorization) {
    sql += ' AND status = ?';
    params.push('active');
  } else if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (search) { sql += ' AND name LIKE ?'; params.push(`%${search}%`); }
  if (category) { sql += ' AND category_id = ?'; params.push(category); }
  if (material) { sql += ' AND material_id = ?'; params.push(material); }
  if (style) { sql += ' AND style_id = ?'; params.push(style); }
  if (space) { sql += ' AND space_id = ?'; params.push(space); }
  if (light) { sql += ' AND light_level_id = ?'; params.push(light); }

  sql += ' ORDER BY created_at DESC';
  const list = db.prepare(sql).all(...params);

  const result = list.map(c => {
    const cover = db.prepare("SELECT url FROM curtain_media WHERE curtain_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1").get(c.id);
    const colorRows = db.prepare('SELECT id, color_name, color_code FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(c.id);
    const colors = colorRows.map(cl => {
      const media = db.prepare("SELECT url FROM curtain_media WHERE color_id = ? AND type = 'image' LIMIT 1").get(cl.id);
      return { color_name: cl.color_name, color_code: cl.color_code, media_url: media?.url || null };
    });
    return { ...c, cover: cover?.url || null, colors };
  });

  res.json(result);
});

router.get('/:id', (req, res) => {
  const curtain = getCurtain(req.params.id);
  if (!curtain) return res.status(404).json({ error: '款式不存在' });
  res.json(curtain);
});

router.post('/', auth, (req, res) => {
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, colors, media } = req.body;
  if (!name) return res.status(400).json({ error: '款式名称不能为空' });

  const info = db.prepare(`INSERT INTO curtains (name, category_id, material_id, style_id, light_level_id, space_id, size_range, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(name, category_id || null, material_id || null, style_id || null, light_level_id || null, space_id || null, size_range || null, description || null);

  const curtainId = info.lastInsertRowid;

  if (colors) {
    const stmt = db.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?, ?, ?, ?)');
    colors.forEach((c, i) => stmt.run(curtainId, c.color_name, c.color_code || null, i));
  }

  if (media) {
    const stmt = db.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)');
    media.forEach((m, i) => stmt.run(curtainId, m.color_id || null, m.type, m.url, i));
  }

  res.json(getCurtain(curtainId));
});

router.put('/:id', auth, (req, res) => {
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description } = req.body;
  const existing = db.prepare('SELECT id FROM curtains WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '款式不存在' });

  db.prepare(`UPDATE curtains SET name=?, category_id=?, material_id=?, style_id=?, light_level_id=?, space_id=?, size_range=?, description=?, updated_at=datetime('now') WHERE id=?`)
    .run(name || existing.name, category_id ?? null, material_id ?? null, style_id ?? null, light_level_id ?? null, space_id ?? null, size_range ?? null, description ?? null, req.params.id);

  res.json(getCurtain(req.params.id));
});

router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: '状态无效' });
  db.prepare("UPDATE curtains SET status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare('DELETE FROM curtains WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
