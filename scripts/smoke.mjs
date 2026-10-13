// End-to-end smoke test against a running server. Creates two throwaway users and deletes them at the end.
// Usage: npm run build && npm start, then in another terminal: npm run smoke  (BASE_URL defaults to http://localhost:3000)
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const stamp = Date.now().toString(36);
const loc = { latitude: 12.9716, longitude: 77.5946, place: { label: 'Bengaluru, Karnataka', city: 'Bengaluru', countryCode: 'IN' } };

function client() {
  const jar = new Map();
  const cookie = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  async function req(path, { method = 'GET', body, form } = {}) {
    const headers = { cookie: cookie() };
    let payload;
    if (form) {
      headers['content-type'] = 'application/x-www-form-urlencoded';
      payload = new URLSearchParams(form).toString();
    } else if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, { method, headers, body: payload, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) {
      const [pair] = c.split(';');
      const i = pair.indexOf('=');
      jar.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text.slice(0, 120);
    }
    return { status: res.status, data, headers: res.headers };
  }
  async function signIn(email, password) {
    const { data } = await req('/api/auth/csrf');
    await req('/api/auth/callback/credentials', { method: 'POST', form: { csrfToken: data.csrfToken, email, password, json: 'true' } });
    return (await req('/api/auth/session')).data;
  }
  return { req, signIn };
}

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail: ok ? '' : JSON.stringify(detail).slice(0, 200) });

const guest = client();
for (const path of ['/', '/feed', '/marketplace', '/map', '/emergency', '/terms', '/privacy', '/guidelines', '/auth/signin', '/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/icon']) {
  const r = await guest.req(path);
  check(`GET ${path}`, r.status === 200, r.status);
}
let r = await guest.req('/settings');
check('guest redirected from /settings', r.status === 307 || r.status === 308, r.status);
r = await guest.req('/no-such-page');
check('unknown page is 404', r.status === 404, r.status);
r = await guest.req('/');
check('security headers sent', Boolean(r.headers.get('content-security-policy') && r.headers.get('x-frame-options')), [...r.headers.keys()]);

const a = client();
const b = client();
const ua = { name: 'Smoke Alice', username: `sa_${stamp}`, email: `sa_${stamp}@example.com`, password: 'password123', acceptTerms: true };
const ub = { name: 'Smoke Bob', username: `sb_${stamp}`, email: `sb_${stamp}@example.com`, password: 'password123', acceptTerms: true };

r = await a.req('/api/auth/register', { method: 'POST', body: ua });
check('register A', r.status === 201, r);
r = await b.req('/api/auth/register', { method: 'POST', body: ub });
check('register B', r.status === 201, r);
r = await a.req('/api/auth/register', { method: 'POST', body: ua });
check('duplicate register rejected', r.status === 409, r);

const sa = await a.signIn(ua.email, ua.password);
check('sign in A', sa?.user?.username === ua.username, sa);
const sb = await b.signIn(ub.email, ub.password);
check('sign in B', sb?.user?.username === ub.username, sb);
check('wrong password rejected', !(await client().signIn(ua.email, 'wrongpass'))?.user, null);

try {
  r = await a.req('/api/me', { method: 'PATCH', body: { location: loc, bio: 'hello' } });
  check('update profile', r.status === 200 && r.data.place?.city === 'Bengaluru', r);

  r = await a.req('/api/posts', { method: 'POST', body: { type: 'community', text: 'Smoke test post', images: [], tags: ['smoke'], location: loc } });
  check('create post', r.status === 201, r);
  const postId = r.data.id;
  r = await a.req('/api/posts', { method: 'POST', body: { type: 'emergency', text: 'Smoke emergency', images: [], tags: [], location: loc } });
  check('emergency without severity rejected', r.status === 400, r);

  r = await b.req(`/api/posts?lat=${loc.latitude}&lng=${loc.longitude}&radiusKm=5`);
  check('nearby feed includes post', r.data.items?.some((p) => p.id === postId), r);
  r = await b.req('/api/posts?lat=40.7&lng=-74&radiusKm=5');
  check('far-away feed excludes post', !r.data.items?.some((p) => p.id === postId), r);
  r = await b.req(`/api/posts/${postId}/like`, { method: 'POST' });
  check('like post', r.status === 200, r);
  r = await b.req(`/api/posts/${postId}/comments`, { method: 'POST', body: { text: 'Nice post!' } });
  check('comment', r.status === 201, r);
  r = await b.req(`/api/posts/${postId}`);
  check('like and comment counted', r.data.likeCount === 1 && r.data.commentCount === 1, r.data);
  r = await a.req('/api/notifications');
  check('owner notified', r.data.items?.length >= 2, r);

  r = await a.req('/api/listings', { method: 'POST', body: { title: 'Chair', description: 'A comfy chair', price: 10, currency: 'INR', category: 'furniture', condition: 'good', images: [], location: loc } });
  check('listing without photo rejected', r.status === 400, r);

  r = await b.req('/api/conversations', { method: 'POST', body: { recipientId: sa.user.id, text: 'Hi Alice!' } });
  check('start conversation', r.status === 201, r);
  const convId = r.data.conversationId;
  r = await a.req('/api/me/counts');
  check('unread message counted', r.data.messages === 1, r);
  r = await a.req(`/api/conversations/${convId}`, { method: 'POST', body: { text: 'Hi Bob!' } });
  check('reply', r.status === 201, r);
  r = await a.req('/api/me/counts');
  check('unread cleared after reading', r.data.messages === 0, r);

  r = await a.req(`/api/users/${sb.user.id}/block`, { method: 'POST' });
  check('block user', r.data.blocked === true, r);
  r = await b.req(`/api/conversations/${convId}`, { method: 'POST', body: { text: 'still there?' } });
  check('blocked user cannot message', r.status === 403, r);

  r = await b.req('/api/reports', { method: 'POST', body: { targetType: 'post', targetId: postId, reason: 'spam' } });
  check('report post', r.status === 201, r);
  r = await b.req('/api/admin');
  check('non-admin blocked from admin API', r.status === 403, r);
  r = await b.req(`/api/posts/${postId}`, { method: 'DELETE' });
  check('non-owner cannot delete post', r.status === 403, r);
  r = await client().req('/api/posts', { method: 'POST', body: {} });
  check('guest cannot post', r.status === 401, r);

  r = await b.req(`/api/emergency/contacts?countryCode=IN&lat=${loc.latitude}&lng=${loc.longitude}`);
  check('official numbers for India', r.data.official?.some((n) => n.phone === '112'), r);
  r = await b.req('/api/geocode?q=Bengaluru');
  check('place search', r.status === 200, r);
} finally {
  r = await a.req('/api/me', { method: 'DELETE', body: { password: ua.password } });
  check('delete A', r.status === 200, r);
  r = await b.req('/api/me', { method: 'DELETE', body: { password: ub.password } });
  check('delete B', r.status === 200, r);
}

for (const { name, ok, detail } of results) console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  ${detail}` : ''}`);
const failed = results.filter((x) => !x.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed against ${BASE}`);
process.exitCode = failed ? 1 : 0;
