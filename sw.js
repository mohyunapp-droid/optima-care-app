// 오프라인에서도 열리도록 하는 캐시.
// 화면(html)과 데이터(data/*.json)는 늘 새로 받고, 인터넷이 안 될 때만 저장본을 씀 (배포한 내용이 바로 보이도록).
// 이름에 해시가 붙는 스크립트·스타일(assets/)과 제품 이미지는 저장본을 먼저 씀.
const CACHE = 'optima-care-v2'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

const save = (req, res) => {
  if (res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const copy = res.clone()
    caches.open(CACHE).then((c) => c.put(req, copy))
  }
  return res
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const fresh = req.mode === 'navigate' || url.pathname.includes('/data/') || url.pathname.endsWith('.webmanifest')
  if (fresh) {
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => save(req, res))
        .catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined))),
    )
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => save(req, res))))
})
