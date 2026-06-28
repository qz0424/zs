const { Router } = require('express');
const db = require('../db');

const router = Router();
const clients = [];

router.get('/', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('data: {"type":"connected"}\n\n');
  clients.push(res);
  req.on('close', () => {
    const idx = clients.indexOf(res);
    if (idx >= 0) clients.splice(idx, 1);
  });
});

async function sendToServerChan(title, desp) {
  try {
    const row = await db.prepare("SELECT value FROM settings WHERE key = 'sckey'").get();
    if (!row || !row.value) return;
    const url = `https://sctapi.ftqq.com/${row.value}.send`;
    const body = new URLSearchParams({ title, desp });
    await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  } catch(e) {
    console.error('Server酱推送失败:', e.message);
  }
}

function notify(data) {
  const msg = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c => c.write(msg));

  if (data.type === 'new_order') {
    const title = `新订单: ${data.order_no}`;
    const desp = `订单号: ${data.order_no}\n时间: ${data.time}\n\n请尽快处理`;
    sendToServerChan(title, desp);
  }
}

router.notify = notify;
module.exports = router;
