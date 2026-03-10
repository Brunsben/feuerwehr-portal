'use strict';

const http = require('http');
const crypto = require('crypto');

// ── Konfiguration ─────────────────────────────────────────────────────────
const POSTGREST_HOST = process.env.POSTGREST_HOST || 'postgrest';
const POSTGREST_PORT = parseInt(process.env.POSTGREST_PORT || '3000');
const JWT_SECRET = process.env.JWT_SECRET || '';
const PORT = 3002;
const COOKIE_NAME = 'fw_jwt';
const COOKIE_MAX_AGE = 28800; // 8 Stunden (passend zum JWT exp)

// ── Rollen → App-Berechtigungen ───────────────────────────────────────────
// Fallback-Map für Benutzer ohne verknüpften Kamerad.
// Wird nur genutzt wenn keine per-User App-Rollen im JWT/DB vorhanden.
const ROLE_APP_MAP = {
  Admin:      { psa: 'Admin', food: 'Admin', fk: 'Admin' },
  Gerätewart: { psa: 'Verwalter', fk: 'Prüfer' },
  Maschinist: { psa: 'Nur lesen', fk: 'Mitglied' },
  User:       { psa: 'Nur lesen' },
};

/** Baut app_permissions aus per-User Rollen (bevorzugt) oder ROLE_APP_MAP (Fallback) */
function buildAppPermissions(userOrPayload) {
  const perms = {};
  const psa = userOrPayload.psa_rolle;
  const food = userOrPayload.food_rolle;
  const fk = userOrPayload.fk_rolle;
  // Wenn mindestens eine per-User Rolle gesetzt ist, diese verwenden
  if (psa || food || fk) {
    if (psa) perms.psa = psa;
    if (food) perms.food = food;
    if (fk) perms.fk = fk;
    return perms;
  }
  // Fallback: globale Rolle → ROLE_APP_MAP
  const rolle = userOrPayload.Rolle || userOrPayload.app_role;
  return ROLE_APP_MAP[rolle] || {};
}

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

function readBody(req, maxSize = 100 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > maxSize) {
        req.destroy();
        return reject(new Error('Payload too large'));
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// ── JWT-Signing (HMAC-SHA256) ─────────────────────────────────────────────
function signJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

/** JWT verifizieren: Signatur + Ablauf prüfen. Gibt Payload oder null zurück. */
function verifyJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const sig = crypto.createHmac('sha256', JWT_SECRET)
      .update(`${parts[0]}.${parts[1]}`).digest('base64url');
    if (sig.length !== parts[2].length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(parts[2]))) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
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
    `SameSite=${isHttps ? 'None' : 'Strict'}`,
    `Max-Age=${COOKIE_MAX_AGE}`,
  ];
  if (isHttps) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearCookie(res, isHttps) {
  const sameSite = isHttps ? 'None' : 'Strict';
  const secure = isHttps ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=${sameSite}${secure}; Max-Age=0`);
}

// ── Auth-Handler ──────────────────────────────────────────────────────────

/** Login/Setup: Credentials → PostgREST → httpOnly-Cookie + User-Info */
async function handleAuth(req, res, rpcPath) {
  let body = await readBody(req);
  // Frontend sendet username/password — DB-Funktion erwartet benutzername/pin
  if (rpcPath === '/rpc/authenticate') {
    try {
      const parsed = JSON.parse(body);
      body = JSON.stringify({
        benutzername: parsed.benutzername || parsed.username,
        pin: parsed.pin || parsed.password,
      });
    } catch { /* body bleibt unverändert */ }
  }
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
  res.end(JSON.stringify({
    user: { ...data.user, app_permissions: buildAppPermissions(data.user) }
  }));
}

/** Session prüfen: JWT aus Cookie verifizieren → User-Info */
function handleMe(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];

  if (!token) {
    res.statusCode = 401;
    res.end('{"error":"not_authenticated"}');
    return;
  }

  const payload = verifyJwt(token);
  if (!payload) {
    clearCookie(res, req.headers['x-forwarded-proto'] === 'https');
    res.statusCode = 401;
    res.end('{"error":"invalid_token"}');
    return;
  }

  res.end(JSON.stringify({
    Benutzername: payload.sub,
    Rolle: payload.app_role,
    KameradId: payload.kamerad_id,
    app_permissions: buildAppPermissions(payload),
  }));
}

// ── HTTP-Server ───────────────────────────────────────────────────────────

/** GET-Proxy für PostgREST (verwendet Service-JWT) */
function getFromPostgREST(path) {
  const serviceToken = signJwt({
    role: 'psa_user',
    app_role: 'Admin',
    exp: Math.floor(Date.now() / 1000) + 60,
  });
  return new Promise((resolve, reject) => {
    const proxyReq = http.request({
      hostname: POSTGREST_HOST,
      port: POSTGREST_PORT,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'Accept': 'application/json',
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
    proxyReq.end();
  });
}

/** Kameraden-Liste: Authentifizierter Zugriff auf zentrale Mitgliederdaten */
async function handleKameraden(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    res.statusCode = 401;
    res.end('{"error":"not_authenticated"}');
    return;
  }
  const payload = verifyJwt(token);
  if (!payload) {
    res.statusCode = 401;
    res.end('{"error":"invalid_token"}');
    return;
  }
  try {
    const result = await getFromPostgREST('/Kameraden?Aktiv=eq.true&order=Name.asc,Vorname.asc');
    res.statusCode = result.status;
    res.end(result.body);
  } catch {
    res.statusCode = 500;
    res.end('{"error":"internal_error"}');
  }
}

/** Benutzer-Liste: Nur für Admins */
async function handleBenutzer(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    res.statusCode = 401;
    res.end('{"error":"not_authenticated"}');
    return;
  }
  const payload = verifyJwt(token);
  if (!payload) {
    res.statusCode = 401;
    res.end('{"error":"invalid_token"}');
    return;
  }
  if (payload.app_role !== 'Admin') {
    res.statusCode = 403;
    res.end('{"error":"forbidden"}');
    return;
  }
  try {
    const result = await getFromPostgREST('/Benutzer?order=Benutzername.asc&select=id,Benutzername,Rolle,KameradId,Aktiv');
    res.statusCode = result.status;
    res.end(result.body);
  } catch {
    res.statusCode = 500;
    res.end('{"error":"internal_error"}');
  }
}

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

    // Kameraden-API: Zentrale Mitgliederliste für alle Sub-Apps
    if (req.method === 'GET' && req.url === '/kameraden') {
      return await handleKameraden(req, res);
    }

    // Benutzer-API: Login-Accounts (nur Admins)
    if (req.method === 'GET' && req.url === '/benutzer') {
      return await handleBenutzer(req, res);
    }

    if (req.method === 'POST' && req.url === '/logout') {
      clearCookie(res, req.headers['x-forwarded-proto'] === 'https');
      res.end('{"ok":true}');
      return;
    }

    res.statusCode = 404;
    res.end('{"error":"not_found"}');
  } catch (e) {
    console.error('Auth proxy error:', e.message);
    if (e.message === 'Payload too large') {
      res.statusCode = 413;
      res.end('{"error":"payload_too_large"}');
    } else {
      res.statusCode = 502;
      res.end('{"error":"upstream_error"}');
    }
  }
});

server.listen(PORT, () => {
  console.log(`Auth proxy listening on :${PORT} → PostgREST ${POSTGREST_HOST}:${POSTGREST_PORT}`);
});
