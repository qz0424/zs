const { Router } = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const notify = require('./notify');

const router = Router();

async function genOrderNo() {
  const d = new Date();
  const ds = d.getFullYear().toString() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  const last = await db.prepare("SELECT order_no FROM orders WHERE order_no LIKE ? ORDER BY id DESC LIMIT 1").get('OD' + ds + '%');
  const seq = last ? parseInt(last.order_no.slice(-3)) + 1 : 1;
  return 'OD' + ds + String(seq).padStart(3, '0');
}

router.post('/', async (req, res) => {
  const { customer_name, customer_phone, community, building, unit, room, address_detail, items, note } = req.body;
  if (!customer_phone) return res.status(400).json({ error: '请填写手机号' });
  if (!community) return res.status(400).json({ error: '请填写小区名称' });
  if (!items || items.length === 0) return res.status(400).json({ error: '请至少添加一组窗帘' });

  const createOrder = db.transaction(async (txnDb) => {
    const order_no = await genOrderNo();
    const info = await txnDb.prepare(`INSERT INTO orders (order_no, customer_name, customer_phone, community, building, unit, room, address_detail, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(order_no, customer_name || null, customer_phone, community, building || null, unit || null, room || null, address_detail || null, note || null);
    const orderId = Number(info.lastInsertRowid);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await txnDb.prepare(`INSERT INTO order_items (order_id, sort_order, space, curtain_id, color_id, width, height, quantity, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(orderId, i + 1, item.space, item.curtain_id || null, item.color_id || null, item.width || null, item.height || null, item.quantity || 1, item.note || null);
    }

    await txnDb.prepare(`INSERT INTO order_status_log (order_id, to_status) VALUES (?, 'new')`).run(orderId);

    return { id: orderId, order_no };
  });

  const result = await createOrder();
  notify.notify({ type: 'new_order', order_no: result.order_no, id: result.id, time: new Date().toLocaleString() });
  res.json(result);
});

router.get('/lookup', async (req, res) => {
  const phone = (req.query.phone || '').trim();
  if (!phone || phone.length < 3) return res.status(400).json({ error: '请输入手机号' });

  const orders = await db.prepare(
    "SELECT id, order_no, status, community, building, unit, room, customer_phone, created_at FROM orders WHERE customer_phone LIKE ? ORDER BY created_at DESC LIMIT 20"
  ).all('%' + phone + '%');

  for (const o of orders) {
    o.items = await db.prepare('SELECT space, curtain_id, color_id, width, height FROM order_items WHERE order_id = ? ORDER BY sort_order').all(o.id);
    for (const item of o.items) {
      item.curtain = await db.prepare('SELECT name FROM curtains WHERE id = ?').get(item.curtain_id);
      item.color = await db.prepare('SELECT color_name, color_code FROM curtain_colors WHERE id = ?').get(item.color_id);
    }
  }

  res.json({ orders });
});

router.get('/', auth, async (req, res) => {
  let { status, community, search, page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 20;
  const offset = (page - 1) * limit;

  let sql = 'SELECT * FROM orders WHERE 1=1';
  let countSql = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
  const params = [];
  const countParams = [];

  if (status) { sql += ' AND status = ?'; params.push(status); countSql += ' AND status = ?'; countParams.push(status); }
  if (community) { sql += ' AND community LIKE ?'; params.push('%' + community + '%'); countSql += ' AND community LIKE ?'; countParams.push('%' + community + '%'); }
  if (search) {
    sql += ' AND (order_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    params.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
    countSql += ' AND (order_no LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    countParams.push('%' + search + '%', '%' + search + '%', '%' + search + '%');
  }

  const totalRow = await db.prepare(countSql).get(...countParams);
  const total = totalRow.total;
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const orders = await db.prepare(sql).all(...params);
  for (const o of orders) {
    const cntRow = await db.prepare('SELECT COUNT(*) as cnt FROM order_items WHERE order_id = ?').get(o.id);
    o.item_count = cntRow.cnt;
    o.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY sort_order').all(o.id);
    for (const item of o.items) {
      item.curtain = await db.prepare(`SELECT c.id, c.name, co.name as category_name FROM curtains c LEFT JOIN category_options co ON co.id = c.category_id WHERE c.id = ?`).get(item.curtain_id);
      item.color = await db.prepare('SELECT id, color_name, color_code FROM curtain_colors WHERE id = ?').get(item.color_id);
    }
  }

  res.json({ orders, total, page, limit });
});

router.get('/:id', async (req, res) => {
  const order = await db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  order.items = await db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY sort_order').all(order.id);
  for (const item of order.items) {
    item.curtain = await db.prepare(`SELECT c.id, c.name, c.size_range, co.name as category_name FROM curtains c LEFT JOIN category_options co ON co.id = c.category_id WHERE c.id = ?`).get(item.curtain_id);
    item.color = await db.prepare('SELECT id, color_name, color_code FROM curtain_colors WHERE id = ?').get(item.color_id);
    if (item.curtain) {
      const cover = await db.prepare("SELECT url FROM curtain_media WHERE curtain_id = ? AND type = 'image' ORDER BY sort_order LIMIT 1").get(item.curtain_id);
      item.curtain.cover = cover?.url || null;
    }
  }
  order.logs = await db.prepare('SELECT * FROM order_status_log WHERE order_id = ? ORDER BY changed_at DESC').all(order.id);
  res.json(order);
});

router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const valid = ['new', 'confirmed', 'producing', 'completed', 'delivered'];
  if (!valid.includes(status)) return res.status(400).json({ error: '状态无效' });

  const order = await db.prepare('SELECT id, status FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: '订单不存在' });

  const update = db.transaction(async (txnDb) => {
    await txnDb.prepare("UPDATE orders SET status=?, updated_at=NOW() WHERE id=?").run(status, req.params.id);
    await txnDb.prepare('INSERT INTO order_status_log (order_id, from_status, to_status) VALUES (?, ?, ?)').run(req.params.id, order.status, status);
  });
  await update();
  res.json({ ok: true });
});

module.exports = router;
