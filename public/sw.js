// キャッシュの名前（バージョン管理用）
const CACHE_NAME = 'v202604170035';

// 1. インストール時の処理
self.addEventListener('install', (event) => {
  // 新しいバージョンを即座にアクティブにする
  self.skipWaiting();
});

// 2. フェッチ時の処理（ネットワーク優先、失敗時のみキャッシュ）
self.addEventListener('fetch', (event) => {
  // データファイルにはキャッシュバスティング用クエリを付与してHTTPキャッシュを回避
  const url = new URL(event.request.url);
  const needsBust = url.pathname.endsWith('.json') || url.pathname.endsWith('.png') || url.pathname.endsWith('.mp3');
  const fetchRequest = needsBust
    ? new Request(`${url.origin}${url.pathname}?_=${CACHE_NAME}`, { headers: event.request.headers })
    : event.request;

  event.respondWith(
    fetch(fetchRequest)
      .then((response) => {
        // ネットワーク成功時はキャッシュに保存して返す（元のURLをキーにする）
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request.url, clone));
        }
        return response;
      })
      .catch(() => {
        // ネットワーク失敗時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});

// 3. アクティベート時の処理（古いキャッシュを削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});
