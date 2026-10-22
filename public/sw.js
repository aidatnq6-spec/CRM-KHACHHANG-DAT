// Retirement worker for browsers that still have the old HTML application's worker.
// Serve this at the old /sw.js URL when deploying the Next.js replacement.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    await caches.delete("crm-cks-mobile-v1");
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: "window" });
    await Promise.all(windows.map(client => client.navigate(client.url)));
  })());
});
