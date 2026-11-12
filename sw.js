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

const CACHE_VERSION = "dost-sw-afe8d1884170";  // scripts/sri-guncelle.py yazar (içerik özeti) -- elle değiştirme
// F9 (2026-11-07): kurulumda yalnız ÇEKİRDEK önbelleğe girir (ilk ziyarette +924 KB yerine ≈ 0,5 MB, sayfanın zaten
// indirdikleri); kabuğun geri kalanı (harita verisi/betiği, d3, sarmal, ek yazı tipleri) sayfa uygun bağlantıda ve
// boştayken "kabuk-tamamla" mesajı gönderince iner (assets/view-loader.js). Veri tasarrufu / yavaş bağlantıda hiç inmez;
// o durumda sayfa gezildikçe betikler zaten fetch işleyicisiyle önbelleğe girer.
const SHELL_URLS = [
  "./",
  "./index.html",
  "./assets/style.css",
  "./manifest.json",
  "./assets/favicon.svg",
  "./assets/fonts/Fraunces-Regular-static.woff2",
  "./assets/welcome.js",
  "./assets/kabuk.ce5483d8fb.js",
  "./assets/theme.js",
  "./assets/i18n.js",
  "./assets/view-loader.js",
  "./assets/view-status.js",
  "./assets/graph-utils.js",
  "./assets/nav-drawer.js",
  "./assets/search.js",
  "./assets/uygulama-kabugu.js",
  "./assets/cevrimdisi.js",
  "./assets/kavram-defteri.js",
  "./assets/fonts/SourceSans3-Regular-static.woff2",
];
const SHELL_SONRA = [
  "./data/ibn-arabi/ontology.json",
  "./assets/vendor/use-gesture.min.js",
  "./assets/telefon-haritasi.js",
  "./assets/fonts/Fraunces-Italic-static.woff2",
  "./assets/fonts/AmiriQuran-Arabic-400.woff2",
  "./assets/fonts/Dost-065E-Mark.woff2",
  "./assets/fonts/SourceSans3-Italic-static.woff2",
  "./assets/fonts/SourceSans3-Medium-static.woff2",
  "./assets/fonts/SourceSans3-SemiBold-static.woff2",
  "./assets/helix.js",
  "./assets/vendor/d3-custom.min.js",
  "./assets/graph-hint.js",
  "./assets/lightbox.js",
  "./assets/kademe.js",
  "./assets/font-scale.js",
  "./assets/reading-mode.js",
  "./assets/honorifics.js",
  "./assets/anlamsal-yakin.js",
  "./assets/ontology.js",
  "./assets/hareket.js",
  "./assets/harita-erisim.js",
  "./assets/crosslink-preview.js",
  "./assets/ayet-onizleme.js",
  "./assets/start-hint.js",
  "./assets/ontoloji-mobil-liste.js",
  "./assets/secret-nav.js",
  "./assets/sessiz-mod.js",
  "./assets/kabuk-genis.css",
  "./assets/okuma-ek.css",
  "./assets/ek-paket-c.css",
  "./assets/css/ayet-hadis.css",
  "./assets/css/bilmiyoruz.css",
  "./assets/css/cizimler.css",
  "./assets/css/daphne.css",
  "./assets/css/duzenle.css",
  "./assets/css/elestiri.css",
  "./assets/css/eser-agi.css",
  "./assets/css/esma.css",
  "./assets/css/fusus.css",
  "./assets/css/futuhat.css",
  "./assets/css/hakkinda.css",
  "./assets/css/hal.css",
  "./assets/css/helix.css",
  "./assets/css/hocalar.css",
  "./assets/css/kavram.css",
  "./assets/css/kuran-dokusu.css",
  "./assets/css/menziller.css",
  "./assets/css/miskat.css",
  "./assets/css/okuma.css",
  "./assets/css/ortak.css",
  "./assets/css/paralel.css",
  "./assets/css/semalar.css",
  "./assets/css/seyahat-atlasi.css",
  "./assets/css/share.css",
  "./assets/css/sirlar.css",
  "./assets/css/sorular.css",
  "./assets/css/tasiyicilar.css",
  "./assets/css/terimler.css",
  "./assets/css/yolculuk.css",
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
  // cache.addAll() tarayıcının kendi HTTP önbelleğinden besleniyor -- GitHub
  // Pages'in Cache-Control: max-age=600'ü yüzünden install anında GÜNCEL sürüm
  // yerine 10 dakikaya kadar eski bir kabuk önbelleğe yazılabiliyordu. Her URL
  // ayrı ayrı çekilip elle put ediliyor; bir URL 404 verirse (ör. yeniden
  // adlandırılmış bir vendor dosyası) yalnız o atlanır, TÜM install
  // addAll()'daki gibi sessizce başarısız olmaz.
  //
  // 2026-10-15 (mobil teknik dalga 1, S-03): istek "reload" yerine "no-cache"
  // ile yapılıyor. İkisi de HTTP önbelleğindeki bayat kopyayı KULLANMAZ; fark:
  // "reload" koşulsuz yeniden indirir (ilk ziyarette sayfanın az önce indirdiği
  // ~650 KB ikinci kez iniyordu: Mişkât 893 -> 1577 KB), "no-cache" ise
  // sunucuya doğrulama sorar (If-None-Match) -- değişmediyse 304 döner, yalnız
  // başlık iner; değiştiyse yeni gövde iner. Tazelik güvencesi aynı: yayın
  // sonrası her dosyanın GÜNCEL hâli önbelleğe girer.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        SHELL_URLS.concat([OFFLINE_URL]).map((url) =>
          fetch(new Request(url, { cache: "no-cache" }))
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
  return !/^\/(gizlilik|gonul|yan-yana|iletisim|dizin|arastirma|yenilikler|\.well-known)(\/|$)/.test(p);
}

// Y3 (2026-11-07): veri önbelleği (stale-while-revalidate, isDataRequest) sınırsız büyüyordu (98 giriş, ≈4 MB ölçüldü). Basit giriş tavanı:
// her 8. yazımda veri girdileri sayılır, VERI_TAVAN'ı aşan en eski girdiler silinir (kabuk dosyalarına dokunulmaz).
const VERI_TAVAN = 120;
let veriYazim = 0;
function veriTavani(cache) {
  if (++veriYazim % 8) return;
  return cache.keys().then((keys) => {
    const veri = keys.filter((k) => { try { return isDataRequest(new URL(k.url)); } catch (e) { return false; } });
    const fazla = veri.length - VERI_TAVAN;
    for (let i = 0; i < fazla; i++) cache.delete(veri[i]);
  }).catch(() => {});
}

function yedekSayfa() {
  // OFF-02/TD-02 (2026-11-09): boş "çevrimdışısın" sayfası yerine bu cihazda önbellekte olan okuma sayfalarının (en çok 6) bağlantıları verilir.
  // Önbelleğin kendisi burada AÇILMAZ (caches.has ile bakılır): indirme hiç yapılmadıysa ICERIK_CACHE oluşmasın (bkz. yukarıdaki not).
  const adlar = [CACHE_VERSION, ICERIK_CACHE];
  return Promise.all(adlar.map((n) => caches.has(n).then((varMi) => (varMi ? caches.open(n).then((c) => c.keys()) : [])).catch(() => []))).then((listeler) => {
    const gorulen = new Set(), baglar = [];
    listeler.forEach((ks) => ks.forEach((rq) => {
      try {
        const p = new URL(rq.url).pathname;
        const m = /^\/(?:(?:en|pt)\/)?(futuhat|fusus|miskat)\/([a-z0-9]+)\/$/.exec(p);
        if (m && !gorulen.has(p) && baglar.length < 6) {
          gorulen.add(p);
          baglar.push('<li style="margin:6px 0"><a href="' + p + '">' + ({ futuhat: "Fütûhât", fusus: "Füsûs", miskat: "Mişkât" })[m[1]] + " · " + m[2] + "</a></li>");
        }
      } catch (e) { /* adres okunamazsa atlanır */ }
    }));
    const html = '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">'
      + '<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dost Arabî</title></head>'
      + '<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:15vh auto;padding:0 16px;text-align:center">'
      + '<p>Bağlantı yok: bu sayfa bu cihazda kayıtlı değil. · No connection: this page is not saved on this device. · Sem conexão: esta página não está salva neste dispositivo.</p>'
      + (baglar.length ? '<p>Bu cihazda olanlar · Available here · Disponíveis aqui:</p><ul style="list-style:none;padding:0">' + baglar.join("") + "</ul>" : "")
      + '<p><a href="/">Ana sayfa · Home · Início</a></p></body></html>';
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
  });
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

  if (url.pathname.includes("/data/gizli/")) {
    // 2026-11-12 (sahip araçları incelemesi G4/GF11): parola/manifest değişince eski cihaz bayat manifesti ya da .enc'yi görmesin
    // (yeni parola reddedilirdi): önce ağ, yalnız çevrimdışıyken (ya da ağ hatasında) önbellek.
    event.respondWith(
      fetch(new Request(req, { cache: "no-cache" }))
        .then((resp) => { if (resp.ok) caches.open(CACHE_VERSION).then((c) => c.put(req, resp.clone())).catch(() => {}); return resp; })
        .catch(() => caches.open(CACHE_VERSION).then((c) => c.match(req)).then((m) => m || cevrimdisiKaynak(req)))
    );
    return;
  }

  if (isDataRequest(url)) {
    // stale-while-revalidate: cache varsa hemen onu ver, arka planda tazele.
    // Ağ da yoksa (çevrimdışı, hiç görülmemiş dosya) indirilmiş içerik.
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req)
            .then((resp) => { if (resp.ok) cache.put(req, resp.clone()).then(() => veriTavani(cache)).catch(() => {}); return resp; })
            .catch(() => cached || cevrimdisiKaynak(req));
          if (cached) return cached;
          // Fikir 15 (2026-11-07): önbellekte yok ve ağ ~10 sn yanıt vermiyorsa (lie-fi) indirilmiş çevrimdışı kopya varsa o verilir;
          // yoksa ağ beklenmeye devam eder (ağ isteği arka planda sürer ve önbelleği tazeler).
          return Promise.race([
            network,
            new Promise((coz) => setTimeout(() => coz(null), 10000)),
          ]).then((r) => r || cevrimdisiKaynak(req).then((c) => c || network));
        })
      )
    );
    return;
  }

  // Sayfalar + JS/CSS: önce ağ, yalnız çevrimdışıyken önbelleğe düş.
  // Önbellek modu ("reload"/"no-cache") şart -- yoksa fetch() tarayıcının kendi
  // HTTP önbelleğinden (GitHub Pages'in verdiği Cache-Control: max-age=600
  // sebebiyle) 10 dakikaya kadar eski bir kopya döndürebilir ve "önce ağ"
  // niyeti sessizce bozulur -- sayfayı ctrl+shift+r ile zorlamadan yeni
  // sürümün görünmemesinin sebebi buydu.
  // 2026-10-15 (S-03): "reload" -> "no-cache". Aynı tazelik (her istek
  // sunucuya doğrulanır), ama değişmeyen dosya 304 ile döner: kontrollü
  // sayfada her açılışta kabuğu (~430 KB) baştan indirmek yerine yalnız
  // başlıklar iner.
  const isNavOrAsset = req.destination === "script" || req.destination === "style" || req.mode === "navigate";
  // Y1 (2026-11-07): ağ ~4 sn içinde yanıt vermezse (zayıf bağlantı) ve
  // önbellekte kopya varsa onu ver; ağ isteği arka planda sürer ve önbelleği tazeler.
  const ag = fetch(isNavOrAsset ? new Request(req, { cache: "no-cache" }) : req);
  const bekle = isNavOrAsset
    ? Promise.race([
        ag,
        new Promise((coz) => setTimeout(() => coz(null), 4000)),
      ]).then((r) => r || caches.match(req).then((c) => c || ag))
    : ag;
  event.respondWith(
    bekle
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
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, toCache)).catch(() => {});
        }
        if (req.mode === "navigate" && resp.status === 404) return yumusat404(resp);
        return resp;
      })
      .catch(() => (req.mode === "navigate" ? cevrimdisiSayfa(req) : cevrimdisiKaynak(req)))
  );
});

// --- Tembel görünüm betiklerinin çevrimdışı önbelleği (2026-10-15, S-01) -----
// Görünüm betikleri (assets/esma.js, hal.js, ...) sayfa açılışında değil, bölüm
// ilk açıldığında iner (assets/view-loader.js VIEWS). Kabuk önbelleği onları
// içermediği için yalnız ana sayfa görülmüş bir cihazda çevrimdışıyken her
// bölüm "yüklenemedi" diyordu. Sayfa (view-loader.js), yüklendikten ve boşta
// kaldıktan sonra -- kullanıcı veri tasarrufunda değilken ve bağlantı
// yeterliyken -- bu mesajı gönderir. Liste SAYFANIN kendi bildiği
// {src, integrity} çiftleridir:
//  - hangi dosyaların önbelleğe gireceğini sayfa belirler (yeni görünüm
//    eklenince kendiliğinden katılır, burada elle liste tutulmaz);
//  - her dosya sayfanın integrity özetiyle çekilir (fetch integrity): özet
//    tutmayan (eski/yeni sürüm karışması) bir dosya önbelleğe HİÇ girmez --
//    çevrimdışıyken sunulan betik her zaman sayfanın beklediği betiktir
//    (SRI tutarlılığı);
//  - sürüm önbelleğine (CACHE_VERSION) yazılır: yeni sürümde activate eskisini
//    siler, betikler yeni sayfanın boşta anında yeniden iner.
// İstek "no-cache": tazelik doğrulanır, değişmemişse 304.
self.addEventListener("message", (event) => {
  const d = event.data;
  if (d && d.tip === "kabuk-tamamla") { event.waitUntil(kabuguTamamla()); return; }
  if (!d || d.tip !== "goruntu-betikleri" || !Array.isArray(d.liste)) return;
  event.waitUntil(goruntuBetikleriniOnbellegeAl(d.liste));
});

// Çekirdek dışı kabuk dosyaları (SHELL_SONRA): üç işçiyle, zaten önbellekte olanı atlayarak.
function kabuguTamamla() {
  return caches.open(CACHE_VERSION).then((cache) => {
    const kuyruk = SHELL_SONRA.slice();
    function isci() {
      const url = kuyruk.shift();
      if (!url) return Promise.resolve();
      return cache.match(url)
        .then((m) => (m ? undefined : fetch(new Request(url, { cache: "no-cache" })).then((r) => { if (r.ok) return cache.put(url, r); })))
        .catch(() => {})
        .then(isci);
    }
    return Promise.all([isci(), isci(), isci()]);
  });
}

function goruntuBetikleriniOnbellegeAl(liste) {
  const isler = [];
  liste.slice(0, 64).forEach((x) => {
    if (!x || typeof x.src !== "string" || typeof x.integrity !== "string") return;
    if (!/^sha(256|384|512)-[A-Za-z0-9+/]+={0,2}$/.test(x.integrity)) return;
    let u;
    try { u = new URL(x.src, self.location.href); } catch (e) { return; }
    if (u.origin !== self.location.origin || !/\.js$/.test(u.pathname) || u.search || u.hash) return;
    isler.push({ url: u.href, integrity: x.integrity });
  });
  if (!isler.length) return Promise.resolve();
  return caches.open(CACHE_VERSION).then((cache) => {
    let i = 0;
    function isci() {
      if (i >= isler.length) return Promise.resolve();
      const is = isler[i++];
      return cache.match(is.url)
        .then((mevcut) => {
          if (mevcut) return undefined;
          return fetch(new Request(is.url, { cache: "no-cache", integrity: is.integrity }))
            .then((resp) => { if (resp.ok) return cache.put(is.url, resp); });
        })
        .catch(() => {})
        .then(isci);
    }
    return Promise.all([isci(), isci(), isci()]);
  });
}
