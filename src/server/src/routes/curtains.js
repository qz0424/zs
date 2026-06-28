const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

async function getCurtain(id) {
  const curtain = await db.prepare('SELECT * FROM curtains WHERE id = ?').get(id);
  if (!curtain) return null;
  curtain.colors = await db.prepare('SELECT * FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(id);
  curtain.media = await db.prepare('SELECT * FROM curtain_media WHERE curtain_id = ? ORDER BY sort_order').all(id);
  for (const cl of curtain.colors) {
    const m = await db.prepare("SELECT url FROM curtain_media WHERE color_id = ? AND type = 'image' LIMIT 1").get(cl.id);
    cl.media_url = m?.url || null;
  }
  const [cat, mat, sty, ll, sp] = await Promise.all([
    db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.category_id),
    db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.material_id),
    db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.style_id),
    db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.light_level_id),
    db.prepare('SELECT name FROM category_options WHERE id = ?').get(curtain.space_id),
  ]);
  curtain.category = cat; curtain.material = mat; curtain.style = sty;
  curtain.light_level = ll; curtain.space = sp;
  curtain.tier = await db.prepare('SELECT id, name, unit_price, description FROM price_tiers WHERE id = ?').get(curtain.tier_id);
  return curtain;
}

router.get('/', async (req, res) => {
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
  const list = await db.prepare(sql).all(...params);

  const result = [];
  for (const c of list) {
    const cover = await db.prepare("SELECT url FROM curtain_media WHERE curtain_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1").get(c.id);
    const colorRows = await db.prepare('SELECT id, color_name, color_code FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(c.id);
    const colors = [];
    for (const cl of colorRows) {
      const media = await db.prepare("SELECT url FROM curtain_media WHERE color_id = ? AND type = 'image' LIMIT 1").get(cl.id);
      colors.push({ color_name: cl.color_name, color_code: cl.color_code, media_url: media?.url || null });
    }
    const tier = c.tier_id ? await db.prepare('SELECT id, name, unit_price, description FROM price_tiers WHERE id = ?').get(c.tier_id) : null;
    result.push({ ...c, cover: cover?.url || null, colors, tier });
  }

  res.json(result);
});

router.get('/:id', async (req, res) => {
  const curtain = await getCurtain(req.params.id);
  if (!curtain) return res.status(404).json({ error: '款式不存在' });
  res.json(curtain);
});

router.post('/', auth, async (req, res) => {
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, colors, media, tier_id } = req.body;
  if (!name) return res.status(400).json({ error: '款式名称不能为空' });

  const createCurtain = db.transaction(async (txnDb) => {
    const info = await txnDb.prepare(`INSERT INTO curtains (name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, tier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(name, category_id || null, material_id || null, style_id || null, light_level_id || null, space_id || null, size_range || null, description || null, tier_id || null);
    const curtainId = Number(info.lastInsertRowid);

    const colorIds = [];
    if (colors) {
      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        const ci = await txnDb.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?, ?, ?, ?)').run(curtainId, c.color_name, c.color_code || null, i);
        colorIds.push(Number(ci.lastInsertRowid));
      }
    }

    if (media) {
      for (let i = 0; i < media.length; i++) {
        const m = media[i];
        const resolvedColorId = (m.color_id != null && colorIds[m.color_id] != null) ? colorIds[m.color_id] : null;
        await txnDb.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)').run(curtainId, resolvedColorId, m.type, m.url, i);
      }
    }

    return curtainId;
  });

  const curtainId = await createCurtain();
  res.json(await getCurtain(curtainId));
});

router.put('/:id', auth, async (req, res) => {
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, colors, media, tier_id } = req.body;
  const existing = await db.prepare('SELECT id FROM curtains WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '款式不存在' });

  const updateCurtain = db.transaction(async (txnDb) => {
    await txnDb.prepare(`UPDATE curtains SET name=?, category_id=?, material_id=?, style_id=?, light_level_id=?, space_id=?, size_range=?, description=?, tier_id=?, updated_at=NOW() WHERE id=?`)
      .run(name || existing.name, category_id ?? null, material_id ?? null, style_id ?? null, light_level_id ?? null, space_id ?? null, size_range ?? null, description ?? null, tier_id || null, req.params.id);

    if (colors !== undefined) {
      await txnDb.prepare('DELETE FROM curtain_colors WHERE curtain_id = ?').run(req.params.id);
      const colorIds = [];
      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        const info = await txnDb.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?, ?, ?, ?)').run(req.params.id, c.color_name, c.color_code || null, i);
        colorIds.push(Number(info.lastInsertRowid));
      }

      if (media !== undefined) {
        await txnDb.prepare('DELETE FROM curtain_media WHERE curtain_id = ?').run(req.params.id);
        for (let i = 0; i < media.length; i++) {
          const m = media[i];
          const resolvedColorId = (m.color_id != null && colorIds[m.color_id] != null) ? colorIds[m.color_id] : null;
          await txnDb.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)').run(req.params.id, resolvedColorId, m.type, m.url, i);
        }
      }
    } else if (media !== undefined) {
      await txnDb.prepare('DELETE FROM curtain_media WHERE curtain_id = ?').run(req.params.id);
      for (let i = 0; i < media.length; i++) {
        const m = media[i];
        await txnDb.prepare('INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, ?, ?)').run(req.params.id, m.color_id || null, m.type, m.url, i);
      }
    }
  });

  await updateCurtain();
  res.json(await getCurtain(req.params.id));
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: '状态无效' });
  await db.prepare("UPDATE curtains SET status=?, updated_at=NOW() WHERE id=?").run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', auth, async (req, res) => {
  await db.prepare("UPDATE curtains SET deleted_at=NOW(), status='inactive', updated_at=NOW() WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

router.get('/recycle/list', auth, async (req, res) => {
  const list = await db.prepare("SELECT id, name, size_range, status, deleted_at, created_at FROM curtains WHERE deleted_at IS NOT NULL OR status='inactive' ORDER BY COALESCE(deleted_at, updated_at) DESC").all();
  const result = [];
  for (const c of list) {
    const cover = await db.prepare("SELECT url FROM curtain_media WHERE curtain_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1").get(c.id);
    result.push({ ...c, cover: cover?.url || null });
  }
  res.json(result);
});

router.put('/:id/restore', auth, async (req, res) => {
  const curtain = await db.prepare('SELECT id FROM curtains WHERE id = ?').get(req.params.id);
  if (!curtain) return res.status(404).json({ error: '款式不存在' });
  await db.prepare("UPDATE curtains SET deleted_at=NULL, status='active', updated_at=NOW() WHERE id=?").run(req.params.id);
  res.json(await getCurtain(req.params.id));
});

module.exports = router;
