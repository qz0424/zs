const db = require('./src/db');
const bcrypt = require('bcryptjs');

(async () => {
  await db.migrate();

  const p = db.prepare;

  // admin user
  const existing = await p('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    await p('INSERT INTO users (username, password, role) VALUES (?,?,?)').run('admin', bcrypt.hashSync('admin123', 10), 'admin');
  }

  // categories
  const cats = ['客厅', '卧室', '餐厅', '书房', '儿童房'];
  for (const name of cats) {
    const c = await p('SELECT id FROM category_options WHERE dimension=? AND name=?').get('category', name);
    if (!c) await p('INSERT INTO category_options (dimension, name, sort_order) VALUES (?,?,?)').run('category', name, cats.indexOf(name));
  }

  // materials
  const mats = ['棉麻', '绒布', '雪尼尔', '高精密'];
  for (const name of mats) {
    const c = await p('SELECT id FROM category_options WHERE dimension=? AND name=?').get('material', name);
    if (!c) await p('INSERT INTO category_options (dimension, name, sort_order) VALUES (?,?,?)').run('material', name, mats.indexOf(name));
  }

  // styles
  const styles = ['简约', '欧式', '现代', '新中式'];
  for (const name of styles) {
    const c = await p('SELECT id FROM category_options WHERE dimension=? AND name=?').get('style', name);
    if (!c) await p('INSERT INTO category_options (dimension, name, sort_order) VALUES (?,?,?)').run('style', name, styles.indexOf(name));
  }

  // tiers
  const tiers = [
    { name: '经济款', price: 39 },
    { name: '标准款', price: 69 },
    { name: '高端款', price: 129 },
  ];
  for (const t of tiers) {
    const c = await p('SELECT id FROM price_tiers WHERE name=?').get(t.name);
    if (!c) await p('INSERT INTO price_tiers (name, unit_price, description, sort_order) VALUES (?,?,?,?)').run(t.name, t.price, '', tiers.indexOf(t));
  }

  // sample curtains
  const hasCurtains = await p('SELECT id FROM curtains LIMIT 1').get();
  if (!hasCurtains) {
    const samples = [
      { name: '简约棉麻窗帘', category: '客厅', material: '棉麻', style: '简约', cname: '米色', ccode: '#F5E6CC' },
      { name: '欧式绒布窗帘', category: '客厅', material: '绒布', style: '欧式', cname: '酒红', ccode: '#722F37' },
      { name: '现代雪尼尔窗帘', category: '卧室', material: '雪尼尔', style: '现代', cname: '灰色', ccode: '#8C8C8C' },
      { name: '新中式高精密窗帘', category: '书房', material: '高精密', style: '新中式', cname: '靛蓝', ccode: '#2F4F6F' },
    ];
    for (const s of samples) {
      const cat = await p('SELECT id FROM category_options WHERE dimension=? AND name=?').get('category', s.category);
      const mat = await p('SELECT id FROM category_options WHERE dimension=? AND name=?').get('material', s.material);
      const sty = await p('SELECT id FROM category_options WHERE dimension=? AND name=?').get('style', s.style);
      await db.transaction(async (txn) => {
        const r = await txn.prepare('INSERT INTO curtains (name, category_id, material_id, style_id, description, status) VALUES (?,?,?,?,?,?)').run(s.name, cat?.id || null, mat?.id || null, sty?.id || null, s.name + ' 高品质窗帘', 'active');
        await txn.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?,?,?,0)').run(r.lastInsertRowid, s.cname, s.ccode);
      })();
    }
  }

  console.log('Seed data OK!');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
