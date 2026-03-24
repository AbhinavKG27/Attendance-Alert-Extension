/**
 * Minimal approval backend for Attendance extension (Option A).
 *
 * Endpoints:
 * POST /events           -> Extension posts popup-detected events
 * GET  /approvals/latest -> Extension polls this for manual approval
 * POST /approvals        -> Mobile/client submits approval
 */
const http = require('http');

const PORT = process.env.PORT || 8787;
const API_KEY = process.env.ATTENDANCE_API_KEY || '';

const state = {
  latestEvent: null,
  latestApproval: null
};

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(body));
}

function isAuthorized(req) {
  if (!API_KEY) return true;
  return req.headers['x-api-key'] === API_KEY;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { ok: false, error: 'Unauthorized' });
    return;
  }

  if (req.method === 'POST' && req.url === '/events') {
    try {
      const body = await readBody(req);
      state.latestEvent = {
        receivedAt: new Date().toISOString(),
        ...(body.payload || {})
      };
      sendJson(res, 200, { ok: true, latestEvent: state.latestEvent });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/approvals/latest') {
    const latest = state.latestApproval;
    const event = state.latestEvent;
    const approve = Boolean(latest && event && latest.popupId === event.popupId && !latest.consumed);

    if (approve) {
      latest.consumed = true;
    }

    sendJson(res, 200, {
      ok: true,
      approve,
      popupId: event?.popupId || null,
      latestEvent: event
    });
    return;
  }

  if (req.method === 'POST' && req.url === '/approvals') {
    try {
      const body = await readBody(req);
      state.latestApproval = {
        popupId: body.popupId,
        approvedAt: new Date().toISOString(),
        consumed: false
      };
      sendJson(res, 200, { ok: true, latestApproval: state.latestApproval });
    } catch (error) {
      sendJson(res, 400, { ok: false, error: error.message });
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true, status: 'up' });
    return;
  }

  sendJson(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Attendance approval backend running on http://localhost:${PORT}`);
});