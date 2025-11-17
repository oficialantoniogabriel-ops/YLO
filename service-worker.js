self.addEventListener('install', e=>{
  e.waitUntil(caches.open('ylo-v1').then(cache=>cache.addAll(['/','/index.html','/src/style.css'])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
