// 缓存名称
const CACHE_NAME = 'coffee-sales-cache-v1';

// 获取基础URL路径
const BASE_URL = self.location.pathname.replace('sw.js', '');

// 需要缓存的资源
const urlsToCache = [
  BASE_URL,
  BASE_URL + 'index.html',
  BASE_URL + 'styles.css',
  BASE_URL + 'app.js',
  BASE_URL + 'firebase-config.js',
  BASE_URL + 'manifest.json',
  BASE_URL + 'icons/icon-72x72.png',
  BASE_URL + 'icons/icon-96x96.png',
  BASE_URL + 'icons/icon-128x128.png',
  BASE_URL + 'icons/icon-144x144.png',
  BASE_URL + 'icons/icon-152x152.png',
  BASE_URL + 'icons/icon-192x192.png',
  BASE_URL + 'icons/icon-384x384.png',
  BASE_URL + 'icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// 安装service worker时缓存资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 强制新SW接管页面
  );
});

// 激活service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // 删除不在白名单中的缓存
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 控制所有客户端
  );
});

// 处理fetch请求，优先使用缓存
self.addEventListener('fetch', event => {
  // 针对API请求，使用网络优先策略
  if (event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // 对其他资源使用缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 命中缓存，返回缓存的资源
        if (response) {
          return response;
        }
        
        // 未命中缓存，从网络获取
        return fetch(event.request).then(
          response => {
            // 检查响应是否有效
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应以便同时使用和缓存
            const responseToCache = response.clone();
            
            // 更新缓存
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          }
        );
      })
      .catch(error => {
        console.log('Fetch失败:', error);
        // 尝试返回离线页面或者错误页面
      })
  );
}); 