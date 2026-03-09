'use strict';

const http = require('http');

// ── Konfiguration ─────────────────────────────────────────────────────────
const POSTGREST_HOST = process.env.POSTGREST_HOST || 'postgrest';
const POSTGREST_PORT = parseInt(process.env.POSTGREST_PORT || '3000');
const PORT = 3002;
const COOKIE_NAME = 'fw_jwt';
const COOKIE_MAX_AGE = 28800; // 8 Stunden (passend zum JWT exp)

// ── Rollen → App-Berechtigungen ───────────────────────────────────────────
// Definiert welche Portal-Apps jede Rolle sehen/nutzen darf.
// Wert = Anzeige-Label in der App-Kachel (z.B. "Admin", "Nur lesen").
const ROLE_APP_MAP = {
  Admin:      { psa: 'Admin', food: 'Admin', fk: 'Admin' },
  Gerätewart: { psa: 'Verwalter', fk: 'Prüfer' },
  Maschinist: { psa: 'Nur lesen', fk: 'Mitglied' },
  User:       { psa: 'Nur lesen' },
};

// ── Hilfsfunktionen ───────────────────────────────────────────────────────

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k] = v.join('=');
  });
  return cookies;
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

function proxyToPostgREST(path, body) {
  return new Promise((resolve, reject) => {
    const proxyReq = http.request({
      hostname: POSTGREST_HOST,
      port: POSTGREST_PORT,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, proxyRes => {
      const chunks = [];
      proxyRes.on('data', c => chunks.push(c));
      proxyRes.on('end', () => resolve({
        status: proxyRes.statusCode,
        body: Buffer.concat(chunks).toString(),
      }));
    });
    proxyReq.on('error', reject);
    proxyReq.end(body);
  });
}

function setCookie(res, token, isHttps) {
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (isHttps) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

// ── Auth-Handler ──────────────────────────────────────────────────────────

/** Login/Setup: Credentials → PostgREST → httpOnly-Cookie + User-Info */
async function handleAuth(req, res, rpcPath) {
  const body = await readBody(req);
  const result = await proxyToPostgREST(rpcPath, body);

  if (result.status !== 200) {
    res.statusCode = result.status;
    res.end(result.body);
    return;
  }

  const data = JSON.parse(result.body);
  const isHttps = req.headers['x-forwarded-proto'] === 'https';
  setCookie(res, data.token, isHttps);
  // Token NICHT an Frontend zurückgeben — nur User-Info + Berechtigungen
  const rolle = data.user?.Rolle;
  res.end(JSON.stringify({
    user: { ...data.user, app_permissions: ROLE_APP_MAP[rolle] || {} }
  }));
}

/** Session prüfen: JWT aus Cookie dekodieren → User-Info */
function handleMe(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  if (!token) {
    res.statusCode = 401;
    res.end('{"error":"not_authenticated"}');
    return;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(token.split('.')[1]));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      clearCookie(res);
      res.statusCode = 401;
      res.end('{"error":"token_expired"}');
      return;
    }

    res.end(JSON.stringify({
      Benutzername: payload.sub,
      Rolle: payload.app_role,
      KameradId: payload.kamerad_id,
      app_permissions: ROLE_APP_MAP[payload.app_role] || {},
    }));
  } catch {
    clearCookie(res);
    res.statusCode = 401;
    res.end('{"error":"invalid_token"}');
  }
}

// ── HTTP-Server ───────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method === 'POST' && req.url === '/login') {
      return await handleAuth(req, res, '/rpc/authenticate');
    }

    if (req.method === 'POST' && req.url === '/setup') {
      return await handleAuth(req, res, '/rpc/create_admin');
    }

    if (req.method === 'POST' && req.url === '/check-init') {
      const result = await proxyToPostgREST('/rpc/is_initialized', '{}');
      res.statusCode = result.status;
      res.end(result.body);
      return;
    }

    if (req.method === 'GET' && req.url === '/me') {
      return handleMe(req, res);
    }

    // Interner Verify-Endpoint: Sub-Apps validieren fw_jwt Cookie
    // Gibt 200 + User-Info zurück wenn gültig, 401 wenn nicht
    if (req.method === 'GET' && req.url === '/verify') {
      return handleMe(req, res);
    }

    if (req.method === 'POST' && req.url === '/logout') {
      clearCookie(res);
      res.end('{"ok":true}');
      return;
    }

    res.statusCode = 404;
    res.end('{"error":"not_found"}');
  } catch (e) {
    console.error('Auth proxy error:', e.message);
    res.statusCode = 502;
    res.end('{"error":"upstream_error"}');
  }
});

server.listen(PORT, () => {
  console.log(`Auth proxy listening on :${PORT} → PostgREST ${POSTGREST_HOST}:${POSTGREST_PORT}`);
});
