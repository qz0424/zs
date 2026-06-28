const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = Router();

router.get('/', auth, async (req, res) => {
  const tiers = await db.prepare('SELECT * FROM price_tiers ORDER BY sort_order, id').all();
  res.json(tiers);
});

router.get('/enabled', async (req, res) => {
  const tiers = await db.prepare("SELECT id, name, unit_price, description FROM price_tiers WHERE enabled=1 ORDER BY sort_order, id").all();
  res.json(tiers);
});

router.post('/', auth, async (req, res) => {
  const { name, unit_price, description, sort_order, enabled } = req.body;
  if (!name) return res.status(400).json({ error: '档位名称不能为空' });
  if (unit_price == null || unit_price < 0) return res.status(400).json({ error: '请输入有效单价' });
  const info = await db.prepare('INSERT INTO price_tiers (name, unit_price, description, sort_order, enabled) VALUES (?, ?, ?, ?, ?)')
    .run(name, unit_price, description || null, sort_order ?? 0, enabled ?? 1);
  const tier = await db.prepare('SELECT * FROM price_tiers WHERE id = ?').get(Number(info.lastInsertRowid));
  res.json(tier);
});

router.put('/:id', auth, async (req, res) => {
  const { name, unit_price, description, sort_order, enabled } = req.body;
  const existing = await db.prepare('SELECT id FROM price_tiers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '档位不存在' });
  await db.prepare("UPDATE price_tiers SET name=?, unit_price=?, description=?, sort_order=?, enabled=?, updated_at=NOW() WHERE id=?")
    .run(name, unit_price, description || null, sort_order ?? 0, enabled ?? 1, req.params.id);
  const tier = await db.prepare('SELECT * FROM price_tiers WHERE id = ?').get(req.params.id);
  res.json(tier);
});

router.delete('/:id', auth, async (req, res) => {
  const existing = await db.prepare('SELECT id FROM price_tiers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '档位不存在' });
  await db.prepare("UPDATE curtains SET tier_id=NULL WHERE tier_id=?").run(req.params.id);
  await db.prepare('DELETE FROM price_tiers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.put('/:id/toggle', auth, async (req, res) => {
  const tier = await db.prepare('SELECT id, enabled FROM price_tiers WHERE id = ?').get(req.params.id);
  if (!tier) return res.status(404).json({ error: '档位不存在' });
  const newVal = tier.enabled ? 0 : 1;
  await db.prepare("UPDATE price_tiers SET enabled=?, updated_at=NOW() WHERE id=?").run(newVal, req.params.id);
  res.json({ ok: true, enabled: !!newVal });
});

router.put('/batch/tier', auth, async (req, res) => {
  const { curtain_ids, tier_id } = req.body;
  if (!curtain_ids || !Array.isArray(curtain_ids) || curtain_ids.length === 0) return res.status(400).json({ error: '请选择窗帘' });
  if (tier_id) {
    const tier = await db.prepare('SELECT id FROM price_tiers WHERE id = ?').get(tier_id);
    if (!tier) return res.status(404).json({ error: '档位不存在' });
  }
  const update = db.transaction(async (txnDb) => {
    for (const id of curtain_ids) {
      await txnDb.prepare("UPDATE curtains SET tier_id=?, updated_at=NOW() WHERE id=?").run(tier_id || null, id);
    }
  });
  await update();
  res.json({ ok: true });
});

module.exports = router;
