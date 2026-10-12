const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const db = require('../db');

const originalQuery = db.query;
const saved = Object.fromEntries(['DEMO_EMAIL', 'DEMO_PASSWORD', 'JWT_SECRET'].map(key => [key, process.env[key]]));
const fixturePassword = 'fixture-only-password';
const fixtureEmail = 'demo-fixture@example.org';
const passwordHash = bcrypt.hashSync(fixturePassword, 4);
db.query = async (_sql, params) => ({ rows: params[0] === fixtureEmail ? [{ id: 7, email: fixtureEmail, password: passwordHash, role: 'caseworker', full_name: 'Fixture User' }] : [] });
const router = require('../routes/auth');
const demoHandler = router.stack.find(layer => layer.route?.path === '/demo-login').route.stack[0].handle;

async function invoke() {
  const result = { statusCode: 200, payload: null };
  const res = { status(code) { result.statusCode = code; return this; }, json(value) { result.payload = value; return this; } };
  await demoHandler({}, res);
  return result;
}

test('demo login uses configured account without returning credentials', async () => {
  process.env.DEMO_EMAIL = fixtureEmail;
  process.env.DEMO_PASSWORD = fixturePassword;
  process.env.JWT_SECRET = 'fixture-only-jwt-secret';
  const result = await invoke();
  assert.equal(result.statusCode, 200);
  assert.equal(result.payload.user.email, fixtureEmail);
  assert.ok(result.payload.token);
  assert.equal(result.payload.user.password, undefined);
});

test('demo login reports missing configuration', async () => {
  delete process.env.DEMO_EMAIL;
  delete process.env.DEMO_PASSWORD;
  const result = await invoke();
  assert.equal(result.statusCode, 503);
  assert.match(result.payload.error, /not configured/);
});

test.after(() => {
  db.query = originalQuery;
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
