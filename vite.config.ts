import { defineConfig, type Plugin } from 'vite';
import { createHash } from 'node:crypto';

/**
 * Tiny service-worker generator: after the bundle is written we know every
 * file name, so we emit sw.js with a precache list and a content-hash version.
 * Keeps the app 100% offline without pulling in a PWA plugin.
 */
function serviceWorker(): Plugin {
  return {
    name: 'emily-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map'));
      const extra = ['./', 'manifest.webmanifest', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];
      const list = [...extra, ...files];
      const version = createHash('sha1').update(list.join('|') + Date.now()).digest('hex').slice(0, 10);
      const src = `const CACHE = 'emily-sudoku-${version}';
const PRECACHE = ${JSON.stringify(list)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; }).catch(() => caches.match('./', { ignoreVary: true })));
    return;
  }
  e.respondWith(caches.match(req, { ignoreVary: true }).then((hit) => hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; })));
});
`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: src });
    },
  };
}

export default defineConfig({
  base: '/Emily-sudoku/',
  define: {
    // Identifies each published version, so progress is backed up before a new one runs.
    __BUILD_ID__: JSON.stringify(process.env.GITHUB_SHA ?? `local-${Date.now()}`),
  },
  plugins: [serviceWorker()],
  build: { target: 'es2020' },
  worker: { format: 'es' },
});
