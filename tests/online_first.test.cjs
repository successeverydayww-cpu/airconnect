const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const files = ['app.html', 'caller.html', 'caller5.html'];
for (const name of files) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  assert.match(html, /const AC_V=144;/);
  assert.doesNotMatch(html, /\bOFC\b|\bofc[A-Z]\w*|Offline Call|\btoggleMode\s*\(|\bMODE\b/);
  assert.match(html, /async function dial\(/);       // internet calls still exist
  assert.match(html, /async function answer\(/);
  assert.match(html, /async function acFlushQ\(/);
  assert.match(html, /function acQueueText\(/);     // text queue still exists
  assert.match(html, /function restoreChats\(/);    // offline reading survives
  assert.match(html, /if\(OFFLINE\|\|!navigator\.onLine\)\{acQueueText/);
  assert.doesNotMatch(html, /\.slice\(-60\)/);      // no silent queue eviction
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert.match(sw, /airconnect-v144/);
assert.match(sw, /caches\.match\('\.\/caller\.html'\)/);

const html = fs.readFileSync(path.join(root, 'caller5.html'), 'utf8');
const start = html.indexOf('function acQueueLoad()');
const end = html.indexOf('async function sendChat()', start);
assert(start > 0 && end > start, 'queue implementation missing');
const queueCode = html.slice(start, end);
const values = new Map();
let storageBlocked = false;
let uuid = 0;
const ctx = {
  localStorage: {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => { if (storageBlocked) throw Error('quota'); values.set(k, v); },
  },
  crypto: { randomUUID: () => `id-${++uuid}` },
  Date, Math,
  OFFLINE: true, ME: '1000000001', CHAT_OPEN: '1000000002',
  CHATS: {}, navigator: { onLine: false },
  toast: () => {}, renderBubbles: () => {},
  e2eEnc: async (_to, text) => `encrypted:${text}`,
  api: async () => { throw Error('not online'); },
};
vm.createContext(ctx);
vm.runInContext(queueCode + '\nglobalThis.qtest={acQueueText,acQueueLoad,acFlushQ};', ctx);
const q = ctx.qtest;

(async () => {
  for (let i = 0; i < 61; i++) {
    const composer = { value: `text-${i}` };
    assert(q.acQueueText('1000000002', composer.value, composer));
    assert.equal(composer.value, '', 'composer only clears after persistence');
  }
  assert.equal(q.acQueueLoad().length, 61, 'old queue cap must not erase messages');
  ctx.OFFLINE = false;
  ctx.navigator.onLine = true;
  let calls = 0;
  ctx.api = async (_action, body) => {
    calls++;
    if (calls === 1) q.acQueueText('1000000003', 'new while flushing', { value: 'new while flushing' });
    return { ok: true, id: `server-${calls}` };
  };
  await q.acFlushQ();
  assert.equal(calls, 61, 'original messages must be sent');
  assert.equal(q.acQueueLoad().length, 1, 'concurrent queued message must remain');
  assert.equal(q.acQueueLoad()[0].text, 'new while flushing');
  assert(ctx.CHATS['1000000002'].every(b => !b.pend), 'acknowledged bubbles updated');
  ctx.api = async () => { throw Error('network failed'); };
  await q.acFlushQ();
  assert.equal(q.acQueueLoad().length, 1, 'network failure retains queued text');
  storageBlocked = true;
  const composer = { value: 'must not be lost' };
  assert.equal(q.acQueueText('1000000002', composer.value, composer), false);
  assert.equal(composer.value, 'must not be lost');
  assert.equal(q.acQueueLoad().length, 1);
  console.log('PASS: no offline calling, internet calling preserved, offline shell, 61-message queue, concurrent enqueue, failed send, blocked storage.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
