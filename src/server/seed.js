const db = require('./src/db');

const dims = {
  category: ['全遮光窗帘', '半遮光窗帘', '纱帘', '百叶帘', '罗马帘', '卷帘'],
  material: ['涤纶', '棉麻', '绒布', '雪尼尔', '亚麻', '丝绸'],
  style: ['现代简约', '欧式古典', '日式', '美式乡村', '北欧风', '轻奢'],
  light: ['全遮光', '半遮光', '透光'],
  space: ['客厅', '卧室', '厨房', '书房', '阳台', '儿童房'],
};

Object.entries(dims).forEach(([dim, names]) => {
  names.forEach((name, i) => {
    const exists = db.prepare('SELECT id FROM category_options WHERE dimension = ? AND name = ?').get(dim, name);
    if (!exists) {
      db.prepare('INSERT INTO category_options (dimension, name, sort_order) VALUES (?, ?, ?)').run(dim, name, i);
    }
  });
});

const products = [
  { name: '北欧纯色全遮光窗帘', category: '全遮光窗帘', material: '涤纶', style: '北欧风', light: '全遮光', space: '卧室', size_range: '1.5m×2.7m, 2m×2.7m', description: '简约纯色设计，高密度涤纶面料，物理全遮光，适合卧室使用。', colors: ['深灰', '米白', '雾蓝'], media: ['image'] },
  { name: '轻奢雪尼尔提花窗帘', category: '全遮光窗帘', material: '雪尼尔', style: '轻奢', light: '全遮光', space: '客厅', size_range: '2m×2.7m, 3m×2.7m', description: '雪尼尔面料，立体提花纹理，垂感极佳，彰显轻奢格调。', colors: ['香槟金', '浅灰', '墨绿'], media: ['image'] },
  { name: '日式棉麻透光纱帘', category: '纱帘', material: '棉麻', style: '日式', light: '透光', space: '阳台', size_range: '1.5m×2.7m, 2m×2.7m', description: '天然棉麻混纺，质地轻薄，柔化光线，营造温馨氛围。', colors: ['米白', '卡其', '浅灰'], media: ['image'] },
  { name: '美式乡村碎花窗帘', category: '半遮光窗帘', material: '棉麻', style: '美式乡村', light: '半遮光', space: '厨房', size_range: '1.2m×1.8m, 1.5m×1.8m', description: '碎花图案设计，田园风格，适合厨房和小窗户。', colors: ['白底蓝花', '米底粉花'], media: ['image'] },
  { name: '现代简约百叶窗帘', category: '百叶帘', material: '涤纶', style: '现代简约', light: '半遮光', space: '书房', size_range: '定制尺寸', description: '简洁百叶设计，光线可调节，适合书房、办公室。', colors: ['白色', '灰色', '黑色'], media: ['image'] },
  { name: '欧式古典绒布窗帘', category: '全遮光窗帘', material: '绒布', style: '欧式古典', light: '全遮光', space: '客厅', size_range: '2m×2.7m, 3m×2.7m', description: '加厚绒布面料，奢华质感，垂坠感好，适合大客厅。', colors: ['酒红', '深蓝', '墨绿'], media: ['image'] },
  { name: '儿童房卡通卷帘', category: '卷帘', material: '涤纶', style: '现代简约', light: '半遮光', space: '儿童房', size_range: '定制尺寸', description: '卡通图案卷帘，色彩鲜艳，半遮光保护隐私。', colors: ['星空蓝', '粉色', '淡绿'], media: ['image'] },
  { name: '北欧亚麻自然风格窗帘', category: '半遮光窗帘', material: '亚麻', style: '北欧风', light: '半遮光', space: '卧室', size_range: '1.5m×2.7m, 2m×2.7m', description: '天然亚麻面料，自然褶皱，透气舒适，营造松弛感。', colors: ['原麻色', '米白', '浅灰'], media: ['image'] },
  { name: '新中式山水画窗帘', category: '全遮光窗帘', material: '丝绸', style: '轻奢', light: '全遮光', space: '客厅', size_range: '2m×2.7m, 3m×2.7m', description: '丝绸质感，水墨山水图案，东方韵味与现代工艺结合。', colors: ['水墨灰', '青绿', '米色'], media: ['image'] },
  { name: '法式浪漫蕾丝纱帘', category: '纱帘', material: '涤纶', style: '欧式古典', light: '透光', space: '卧室', size_range: '1.5m×2.7m, 2m×2.7m', description: '蕾丝花边纱帘，浪漫优雅，微风轻拂如梦似幻。', colors: ['白色', '米色', '浅粉'], media: ['image'] },
  { name: '罗马帘竹编窗帘', category: '罗马帘', material: '亚麻', style: '日式', light: '半遮光', space: '阳台', size_range: '定制尺寸', description: '竹编材质罗马帘，自然质朴，适合阳台、茶室等休闲空间。', colors: ['原竹色', '深棕'], media: ['image'] },
  { name: '商务办公卷帘', category: '卷帘', material: '涤纶', style: '现代简约', light: '全遮光', space: '书房', size_range: '定制尺寸', description: '全遮光卷帘，简约干练，适合办公环境。', colors: ['白色', '深灰', '浅蓝'], media: ['image'] },
];

const catMap = {};
['category', 'material', 'style', 'light', 'space'].forEach(dim => {
  catMap[dim] = {};
  db.prepare('SELECT id, name FROM category_options WHERE dimension = ?').all(dim).forEach(r => {
    catMap[dim][r.name] = r.id;
  });
});

const insertStmt = db.prepare(`INSERT INTO curtains (name, category_id, material_id, style_id, light_level_id, space_id, size_range, description, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`);

const insertColor = db.prepare('INSERT INTO curtain_colors (curtain_id, color_name, color_code, sort_order) VALUES (?, ?, ?, ?)');
const insertMedia = db.prepare("INSERT INTO curtain_media (curtain_id, color_id, type, url, sort_order) VALUES (?, ?, ?, '/assets/placeholder.svg', ?)");

const colorCodes = {
  '深灰': '#4a4a4a', '米白': '#f5f0e8', '雾蓝': '#b0c4de', '香槟金': '#f7e7ce', '浅灰': '#d4d4d4',
  '墨绿': '#2d5a27', '卡其': '#c3b091', '白底蓝花': '#ffffff', '米底粉花': '#f5e6d3', '白色': '#ffffff',
  '灰色': '#808080', '黑色': '#000000', '酒红': '#722f37', '深蓝': '#1a237e', '星空蓝': '#1a1a5e',
  '粉色': '#ffb6c1', '淡绿': '#90ee90', '原麻色': '#c8b896', '水墨灰': '#6d6d6d', '青绿': '#2e8b57',
  '米色': '#f5deb3', '浅粉': '#ffd1dc', '原竹色': '#d2b48c', '深棕': '#5c4033', '浅蓝': '#add8e6',
  '米黄': '#f5e68c', '银灰': '#c0c0c0',
};

const insert = db.transaction(() => {
  products.forEach(p => {
    const info = insertStmt.run(p.name, catMap.category[p.category], catMap.material[p.material], catMap.style[p.style], catMap.light[p.light], catMap.space[p.space], p.size_range, p.description);
    const curtainId = info.lastInsertRowid;
    p.colors.forEach((c, i) => {
      insertColor.run(curtainId, c, colorCodes[c] || '#cccccc', i);
    });
    const allColors = db.prepare('SELECT id, color_name FROM curtain_colors WHERE curtain_id = ? ORDER BY sort_order').all(curtainId);
    allColors.forEach((clr, ci) => {
      insertMedia.run(curtainId, clr.id, 'image', ci);
    });
  });
});

insert();
console.log(`✅ 已导入 ${products.length} 个演示窗帘款式`);
console.log(`✅ 已导入 ${Object.values(dims).flat().length} 个分类选项`);
