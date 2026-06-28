const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'curtain-showcase-default-secret-2026';

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), SECRET);
    next();
  } catch {
    res.status(401).json({ error: '登录已过期' });
  }
}

module.exports = auth;
