self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("hotel").then(c =>
      c.addAll([
        "./",
        "index.html",
        "kitchen.html",
        "supply.html",
        "app.js",
        "manifest.json",
        "service-worker.js"
      ])
    )
  );
});
