// Se importa dentro del service worker que genera vite-plugin-pwa (workbox.importScripts).
// Muestra los avisos que llegan por Web Push aunque la app esté cerrada.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "MyOrbit";
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.notificationId || undefined,
    data: { notificationId: data.notificationId || null },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows[0];
    if (open) return open.focus();
    return self.clients.openWindow("/");
  })());
});
