const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');
const auth = require('../middleware/auth');

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isVideo = file.mimetype.startsWith('video/');
    cb(null, path.join(__dirname, '..', '..', 'uploads', isVideo ? 'videos' : 'images'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const imgTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const vidTypes = ['video/mp4', 'video/webm'];
    if ([...imgTypes, ...vidTypes].includes(file.mimetype)) return cb(null, true);
    cb(new Error('不支持的文件格式'));
  }
});

router.post('/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择文件' });
  const url = `/uploads/${req.file.mimetype.startsWith('video/') ? 'videos' : 'images'}/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, type: req.file.mimetype.startsWith('video/') ? 'video' : 'image' });
});

router.post('/curtains', auth, (req, res) => {
  const db = require('../db');
  const { name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, price, colors, media } = req.body;
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

  res.json({ id: curtainId, ok: true });
});

router.post('/import', auth, (req, res) => {
  const db = require('../db');
  const { items } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: '没有数据' });

  const stmt = db.prepare(`INSERT INTO curtains (name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`);
  const insertMany = db.transaction((items) => {
    const ids = [];
    for (const item of items) {
      const info = stmt.run(item.name, item.category_id || null, item.material_id || null, item.style_id || null, item.light_level_id || null, item.space_id || null, item.size_range || null, item.description || null);
      ids.push(info.lastInsertRowid);
    }
    return ids;
  });

  const ids = insertMany(items);
  res.json({ count: ids.length, ids });
});

module.exports = router;
