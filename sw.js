/* jlpt-drill 离线支持
 *
 * 策略：
 *   静态外壳（页面 / 样式 / 脚本 / 图标）  → 先给缓存，后台更新（秒开、可离线）
 *   题目数据（data/index.json、data/days/*.json）→ 联网拿最新，断网才用缓存
 *
 * 这样每天新增一天的数据，联网打开就是新的；断网时至少昨天的内容还在。
 */

const VERSION = "jlpt-drill-v3";

const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/style.css",
  "./assets/app.js",
  "./assets/icon.svg",
  "./data/bundle.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isDataUrl(u) {
  // bundle.js 里装着全部题目，也算数据：联网必须拿最新的，
  // 否则当天新导入的那一天，第一次打开会看不到。
  return /\/data\/(index\.json|bundle\.js|days\/[^/]+\.json)$/.test(u.pathname);
}

function put(req, res) {
  const copy = res.clone();
  caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (err) {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // 题目数据：优先网络，失败回退缓存
  if (isDataUrl(url)) {
    e.respondWith(
      fetch(req)
        .then((res) => put(req, res))
        .catch(() => caches.match(req).then((r) => r || Response.error()))
    );
    return;
  }

  // 其余资源（页面 / 样式 / 脚本）：联网优先拿最新，断网才用缓存。
  // 这样每次改完代码，刷新即可见到新版本，不必清缓存；离线时仍可打开。
  e.respondWith(
    fetch(req)
      .then((res) => put(req, res))
      .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
