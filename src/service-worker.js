self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open('my-cache-name').then(function (cache) {
			return cache.addAll(['/wordlist_en.txt', '/wordlist_minimal.txt']);
		})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(
		caches.match(event.request).then(function (response) {
			return response || fetch(event.request);
		})
	);
});
