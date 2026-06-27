require('dotenv').config();
const app = require('./admin-app');
const db = require('./db');

const PORT = process.env.ADMIN_PORT || 3001;

const bcrypt = require('bcryptjs');
const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existing) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  console.log('默认管理员已创建: admin / admin123');
}

app.listen(PORT, () => {
  console.log(`管理端已启动: http://localhost:${PORT}`);
});
