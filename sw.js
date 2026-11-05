// 오프라인 사용을 위한 서비스 워커. HTTPS(예: GitHub Pages)에서만 등록된다.
// 빌드할 때마다 VERSION이 바뀌어 새 앱 파일을 받는다.
const VERSION = "c7d63fba65";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 앱 파일은 네트워크 우선, 실패하면 저장본을 쓴다.
// 다른 주소로 넘겨진 응답(로그인 화면 등)이나 오류 응답은 저장하지 않아 앱 저장본이 덮이지 않게 한다.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && !res.redirected && res.type === "basic") {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
          return res;
        }
        return caches.match(e.request).then((r) => r || res);
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});
