const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

function getCurtain(id) {
  const curtain = db.prepare('SELECT * FROM curtains WHERE id = ?').get(id);
  if (!curtain) return null;
  curtain.colors = db.prepare('SELECT * FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(id);
  curtain.media = db.prepare('SELECT * FROM curtain_media WHERE curtain_id = ? ORDER BY sort_order').all(id);
  curtain.colors.forEach(cl => {
    const m = db.prepare("SELECT url FROM curtain_media WHERE color_id = ? AND type = 'image' LIMIT 1").get(cl.id);
    cl.media_url = m?.url || null;
  });
  curtain.category = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.category_id);
  curtain.material = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.material_id);
  curtain.style = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.style_id);
  curtain.light_level = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.light_level_id);
  curtain.space = db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.space_id);
  curtain.tier = db.prepare('SELECT id, name, unit_price, description FROM price_tiers WHERE id = ?').get(curtain.tier_id);
  return curtain;
}

router.get('/', (req, res) => {
  let { search, category, material, style, space, light, status, tier_id } = req.query;
  if (!status) status = 'active';

  let sql = 'SELECT c.id, c.name, c.size_range, c.status, c.created_at, c.tier_id FROM curtains c WHERE c.deleted_at IS NULL';
  const params = [];

  if (!req.headers.authorization) {
    sql += ' AND c.status = ?';
    params.push('active');
  } else if (status) {
    sql += ' AND c.status = ?';
    params.push(status);
  }

  if (search) { sql += ' AND c.name LIKE ?'; params.push(`%${search}%`); }
  if (category) { sql += ' AND c.category_id = ?'; params.push(category); }
  if (material) { sql += ' AND c.material_id = ?'; params.push(material); }
  if (style) { sql += ' AND c.style_id = ?'; params.push(style); }
  if (space) { sql += ' AND c.space_id = ?'; params.push(space); }
  if (light) { sql += ' AND c.light_level_id = ?'; params.push(light); }

  const tierFilter = req.query.tier_id;
  if (tierFilter) { sql += ' AND c.tier_id = ?'; params.push(tierFilter); }

  sql += ' ORDER BY c.created_at DESC';
  const list = db.prepare(sql).all(...params);

  const result = list.map(c => {
    const cover = db.prepare("SELECT url FROM curtain_media WHERE curtain_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1").get(c.id);
    const colorRows = db.prepare('SELECT id, color_name, color_code FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(c.id);
    const colors = colorRows.map(cl => {
      const media = db.prepare("SELECT url FROM curtain_media WHERE color_id = ? AND type = 'image' LIMIT 1").get(cl.id);
      return { color_name: cl.color_name, color_code: cl.color_code, media_url: media?.url || null };
    });
    const tier = c.tier_id ? db.prepare('SELECT id, name, unit_price, description FROM price_tiers WHERE id = ?').get(c.tier_id) : null;
    return { ...c, cover: cover?.url || null, colors, tier };
  });

  res.json(result);
});

router.get('/:id', (req, res) => {
  const curtain = getCurtain(req.params.id);
  if (!curtain) return res.status(404).json({ error: '款式不存在' });
  res.json(curtain);
});

router.post('/', auth, (req, res) => {
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, colors, media, tier_id } = req.body;
  if (!name) return res.status(400).json({ error: '款式名称不能为空' });

  const createCurtain = db.transaction(() => {
    const info = db.prepare(`INSERT INTO curtains (name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, tier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(name, category_id || null, material_id || null, style_id || null, light_level_id || null, space_id || null, size_range || null, description || null, tier_id || null);
    const curtainId = Number(info.lastInsertRowid);

    const colorIds = [];
    if (colors) {
      const stmt = db.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?, ?, ?, ?)');
      colors.forEach((c, i) => {
        const ci = stmt.run(curtainId, c.color_name, c.color_code || null, i);
        colorIds.push(Number(ci.lastInsertRowid));
      });
    }

    if (media) {
      const stmt = db.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)');
      media.forEach((m, i) => {
        const resolvedColorId = (m.color_id != null && colorIds[m.color_id] != null) ? colorIds[m.color_id] : null;
        stmt.run(curtainId, resolvedColorId, m.type, m.url, i);
      });
    }

    return curtainId;
  });

  const curtainId = createCurtain();
  res.json(getCurtain(curtainId));
});

router.put('/:id', auth, (req, res) => {
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, colors, media, tier_id } = req.body;
  const existing = db.prepare('SELECT id FROM curtains WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '款式不存在' });

  const updateCurtain = db.transaction(() => {
    db.prepare(`UPDATE curtains SET name=?, category_id=?, material_id=?, style_id=?, light_level_id=?, space_id=?, size_range=?, description=?, tier_id=?, updated_at=datetime('now') WHERE id=?`)
      .run(name || existing.name, category_id ?? null, material_id ?? null, style_id ?? null, light_level_id ?? null, space_id ?? null, size_range ?? null, description ?? null, tier_id || null, req.params.id);

    if (colors !== undefined) {
      db.prepare('DELETE FROM curtain_colors WHERE curtain_id = ?').run(req.params.id);
      const stmt = db.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?, ?, ?, ?)');
      const colorIds = [];
      colors.forEach((c, i) => {
        const info = stmt.run(req.params.id, c.color_name, c.color_code || null, i);
        colorIds.push(Number(info.lastInsertRowid));
      });

      if (media !== undefined) {
        db.prepare('DELETE FROM curtain_media WHERE curtain_id = ?').run(req.params.id);
        const mstmt = db.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)');
        media.forEach((m, i) => {
          const resolvedColorId = (m.color_id != null && colorIds[m.color_id] != null) ? colorIds[m.color_id] : null;
          mstmt.run(req.params.id, resolvedColorId, m.type, m.url, i);
        });
      }
    } else if (media !== undefined) {
      db.prepare('DELETE FROM curtain_media WHERE curtain_id = ?').run(req.params.id);
      const mstmt = db.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)');
      media.forEach((m, i) => mstmt.run(req.params.id, m.color_id || null, m.type, m.url, i));
    }
  });

  updateCurtain();
  res.json(getCurtain(req.params.id));
});

router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: '状态无效' });
  db.prepare("UPDATE curtains SET status=?, updated_at=datetime('now') WHERE id=?").run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', auth, (req, res) => {
  db.prepare("UPDATE curtains SET deleted_at=datetime('now'), status='inactive', updated_at=datetime('now') WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

router.get('/recycle/list', auth, (req, res) => {
  const list = db.prepare("SELECT id, name, size_range, status, deleted_at, created_at FROM curtains WHERE deleted_at IS NOT NULL OR status='inactive' ORDER BY COALESCE(deleted_at, updated_at) DESC").all();
  const result = list.map(c => {
    const cover = db.prepare("SELECT url FROM curtain_media WHERE curtain_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1").get(c.id);
    return { ...c, cover: cover?.url || null };
  });
  res.json(result);
});

router.put('/:id/restore', auth, (req, res) => {
  const curtain = db.prepare('SELECT id FROM curtains WHERE id = ?').get(req.params.id);
  if (!curtain) return res.status(404).json({ error: '款式不存在' });
  db.prepare("UPDATE curtains SET deleted_at=NULL, status='active', updated_at=datetime('now') WHERE id=?").run(req.params.id);
  res.json(getCurtain(req.params.id));
});

module.exports = router;
