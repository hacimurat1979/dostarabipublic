/* B1: Çevrimdışı destek. Site vanilla kalıyor -- bu dosya tek başına bir
 * runtime bağımlılığı değil, tarayıcının kendi Service Worker API'si.
 *
 * Strateji bilerek muhafazakâr: JS/CSS için HER ZAMAN önce ağ denenir,
 * yalnız çevrimdışıyken önbelleğe düşülür -- "her zaman ağdan taze kod"
 * ile "çevrimdışı da açılsın" arasında, kodun aylarca eski bir önbellek
 * sürümünde takılı kalması riskini almadan bir denge. Veri (JSON) için
 * stale-while-revalidate: önce önbellek (hızlı + çevrimdışı çalışır),
 * arka planda ağdan güncellenir -- daha önce görülmüş bir kısmı tekrar
 * ziyaret etmek artık ağ gerektirmiyor.
 */
"use strict";

const CACHE_VERSION = "dost-sw-4cbc160a1bf7";  // scripts/sri-guncelle.py yazar (içerik özeti) -- elle değiştirme
const SHELL_URLS = [
  "./",
  "./index.html",
  "./assets/style.css",
  "./manifest.json",
  "./assets/favicon.svg",
  "./data/ibn-arabi/ontology.json",
  "./assets/welcome.js",
  "./assets/theme.js",
  "./assets/vendor/d3-custom.min.js",
  "./assets/i18n.js",
  "./assets/view-status.js",
  "./assets/graph-utils.js",
  "./assets/nav-drawer.js",
  "./assets/helix.js",
  "./assets/graph-hint.js",
  "./assets/lightbox.js",
  "./assets/kademe.js",
  "./assets/search.js",
  "./assets/font-scale.js",
  "./assets/reading-mode.js",
  "./assets/honorifics.js",
  "./assets/anlamsal-yakin.js",
  "./assets/view-loader.js",
  "./assets/ontology.js",
  "./assets/crosslink-preview.js",
  "./assets/ayet-onizleme.js",
  "./assets/start-hint.js",
  "./assets/ontoloji-mobil-liste.js",
  "./assets/secret-nav.js",
  "./assets/sessiz-mod.js",
  "./assets/cevrimdisi.js",
  "./assets/kavram-defteri.js",
  "./assets/fonts/SourceSans3-Regular-static.woff2",
  "./assets/fonts/Fraunces-SemiBold-static.woff2",
];

// --- Çevrimdışı katman (2026-10-10, Android uygulaması hazırlığı) ---------
// ÇEVRİMİÇİ DAVRANIŞ DEĞİŞMEDİ: sayfa/JS/CSS yine önce ağdan, veri yine
// stale-while-revalidate (yalnız CACHE_VERSION önbelleğinden). Aşağıdakiler
// yalnız AĞ BAŞARISIZ olunca devreye girer:
//  - "Bütün içeriği indir" (assets/cevrimdisi.js) kullanıcı isteyince
//    sitenin dosyalarını ICERIK_CACHE'e indirir; sürümden bağımsızdır,
//    activate onu silmez. İndiricinin istekleri INDIR_BASLIGI taşır ve bu
//    betik onlara hiç karışmaz (doğrudan ağ -- eski bir önbellek kopyası
//    indirmeye "yeni" diye yazılmasın).
//  - Gezinme çevrimdışıyken: indirme tamamsa onun uygulama kabuğu (aynı
//    indirmenin JS'leriyle tutarlı -- SRI özetleri birbirini tutar), yoksa
//    önbellekteki sayfa, o da yoksa kabuk, o da yoksa offline.html; hiçbiri
//    yoksa küçük bir yedek sayfa. Hepsi HTTP 200 (TWA 200 dışını çökme sayar).
const ICERIK_CACHE = "dost-cevrimdisi";
const ICERIK_DURUM = "./__cevrimdisi-durum.json"; // indirmenin künyesi: { surum, tamam, dosyalar }
const OFFLINE_URL = "./offline.html";
const INDIR_BASLIGI = "X-Dost-Cevrimdisi";

self.addEventListener("install", (event) => {
  // cache.addAll() tarayıcının kendi HTTP önbelleğinden besleniyor -- satır
  // 60'taki "cache: reload" düzeltmesiyle aynı sebepten (GitHub Pages'in
  // Cache-Control: max-age=600'ü), install anında GÜNCEL sürüm yerine 10
  // dakikaya kadar eski bir kabuk önbelleğe yazılabiliyordu. Her URL ayrı
  // ayrı reload ile çekilip elle put ediliyor; bir URL 404 verirse (ör.
  // yeniden adlandırılmış bir vendor dosyası) yalnız o atlanır, TÜM install
  // addAll()'daki gibi sessizce başarısız olmaz.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        SHELL_URLS.concat([OFFLINE_URL]).map((url) =>
          fetch(new Request(url, { cache: "reload" }))
            .then((resp) => { if (resp.ok) return cache.put(url, resp); })
            .catch(() => {})
        )
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION && k !== ICERIK_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isDataRequest(url) {
  // 2026-08-26 genişletme: yalnız /data/ibn-arabi/ ve themes.json'u kapsıyordu;
  // data/icerik/ (kademeli açılım, G15), data/kavramlar/ (kavram.js) ve
  // data/daphne* (Daphne profili/arşivi) hiç önbelleğe yazılmıyordu -- ne
  // stale-while-revalidate ne de pasif çevrimdışı düşme, bu betiğin kendi
  // üstteki "Veri için stale-while-revalidate" iddiasının aksine.
  return url.pathname.includes("/data/");
}

// caches.match({cacheName}) önbellek yoksa onu YARATMAZ (caches.open
// yaratırdı) -- indirme hiç yapılmadıysa ICERIK_CACHE hiç oluşmasın.
function onbellekte(req, cacheName) {
  return caches.match(req, { cacheName })
    .then((r) => r || caches.match(req, { cacheName, ignoreSearch: true }))
    .catch(() => undefined);
}

function indirmeTamam() {
  return caches.match(ICERIK_DURUM, { cacheName: ICERIK_CACHE })
    .then((r) => (r ? r.json() : null))
    .then((d) => !!(d && d.tamam))
    .catch(() => false);
}

// Uygulama kabuğunun (index.html) çözebildiği adres mi? Elle yazılmış
// sayfalar (compare.html, gizlilik/, araştırma araçları) kabukla açılmaz.
function uygulamaAdresi(url) {
  const p = url.pathname;
  if (/\.[a-z0-9]+$/i.test(p) && !/\/index\.html$/.test(p)) return false;
  return !/^\/(gizlilik|arastirma|\.well-known)(\/|$)/.test(p);
}

function yedekSayfa() {
  const html = '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dost Arabî</title></head>'
    + '<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:15vh auto;padding:0 16px;text-align:center">'
    + '<p>Şu an çevrimdışısın. · You are offline. · Está offline.</p>'
    + '<p><a href="/">Ana sayfa · Home · Início</a></p></body></html>';
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Bir kaynak (JS/CSS/font/veri/arama dizini) ağdan gelmedi: önce tutarlı
// tam indirme (varsa), sonra sürüm önbelleği -- ya da tersi.
function cevrimdisiKaynak(req) {
  return indirmeTamam().then((tam) => {
    const sira = tam ? [ICERIK_CACHE, CACHE_VERSION] : [CACHE_VERSION, ICERIK_CACHE];
    return onbellekte(req, sira[0]).then((r) => r || onbellekte(req, sira[1]));
  });
}

function cevrimdisiSayfa(req) {
  const url = new URL(req.url);
  const uygulama = uygulamaAdresi(url);
  return indirmeTamam().then((tam) => {
    const adimlar = [];
    if (tam && uygulama) adimlar.push(() => onbellekte("./index.html", ICERIK_CACHE));
    adimlar.push(() => onbellekte(req, CACHE_VERSION));
    adimlar.push(() => onbellekte(req, ICERIK_CACHE));
    if (uygulama) {
      adimlar.push(() => onbellekte("./index.html", CACHE_VERSION));
      adimlar.push(() => onbellekte("./index.html", ICERIK_CACHE));
    }
    adimlar.push(() => onbellekte(OFFLINE_URL, CACHE_VERSION));
    adimlar.push(() => onbellekte(OFFLINE_URL, ICERIK_CACHE));
    return adimlar.reduce((p, adim) => p.then((r) => r || adim()), Promise.resolve(undefined))
      .then((r) => r || yedekSayfa());
  });
}

// GitHub Pages rota dosyası olmayan adreslere (ör. /esma/cemil/) 404.html'i
// HTTP 404 ile veriyor; o sayfa JS ile /?p=... adresine yönlendiriyor
// (bkz. 404.html). Ziyaretçi için sonuç aynı; yalnız ara yanıtın durumu
// 200'e çevrilir -- TWA bir gezinmenin 404 dönmesini çökme sayıyor. Gövde
// ve başlıklar değişmez; bu yanıt önbelleğe yazılmaz.
function yumusat404(resp) {
  return new Response(resp.body, { status: 200, statusText: "OK", headers: resp.headers });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Analytics vb. üçüncü taraf -- karışma.
  if (req.headers.has(INDIR_BASLIGI)) return;      // "Bütün içeriği indir": doğrudan ağ.

  if (isDataRequest(url)) {
    // stale-while-revalidate: cache varsa hemen onu ver, arka planda tazele.
    // Ağ da yoksa (çevrimdışı, hiç görülmemiş dosya) indirilmiş içerik.
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((resp) => { if (resp.ok) cache.put(req, resp.clone()); return resp; })
            .catch(() => cached || cevrimdisiKaynak(req));
          return cached || network;
        })
      )
    );
    return;
  }

  // Sayfalar + JS/CSS: önce ağ, yalnız çevrimdışıyken önbelleğe düş.
  // "cache: reload" şart -- yoksa fetch() tarayıcının kendi HTTP önbelleğinden
  // (GitHub Pages'in verdiği Cache-Control: max-age=600 sebebiyle) 10 dakikaya
  // kadar eski bir kopya döndürebilir ve "önce ağ" niyeti sessizce bozulur --
  // sayfayı ctrl+shift+r ile zorlamadan yeni sürümün görünmemesinin sebebi buydu.
  const isNavOrAsset = req.destination === "script" || req.destination === "style" || req.mode === "navigate";
  event.respondWith(
    fetch(isNavOrAsset ? new Request(req, { cache: "reload" }) : req)
      .then((resp) => {
        if (resp.ok && (req.destination === "script" || req.destination === "style" || req.mode === "navigate")) {
          // clone() HEMEN burada, senkron olarak: caches.open() bekleyen bir
          // await/then arasına düşerse, tarayıcı bu sırada return edilen
          // resp'in gövdesini okumaya başlıyor ve sonra çağrılan clone()
          // "Response body is already used" hatasıyla patlıyor -- konsolda
          // her navigasyonda görülen TypeError (2026-08-06, kullanıcı
          // bildirimi). Sonucu: cache.put() hiç tamamlanmıyor, SW'nin kendi
          // önbelleği asla tazelenmiyor, "yeni sürüm görünmüyor" şikâyetinin
          // asıl kaynağı satır 62'deki ctrl+shift+r notundan FARKLI bir kusurmuş.
          const toCache = resp.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, toCache));
        }
        if (req.mode === "navigate" && resp.status === 404) return yumusat404(resp);
        return resp;
      })
      .catch(() => (req.mode === "navigate" ? cevrimdisiSayfa(req) : cevrimdisiKaynak(req)))
  );
});
