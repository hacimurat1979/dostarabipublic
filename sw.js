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

const CACHE_VERSION = "dost-sw-de315cbb932b";  // scripts/sri-guncelle.py yazar (içerik özeti) -- elle değiştirme
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
  "./assets/kabuk.373a8da18c.js",
  "./assets/welcome.js",
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
  "./assets/olcum.js",
  "./assets/seyr.js",
  "./assets/vendor/d3-custom.min.js",
  "./assets/seyr-bolgeler.js",
  "./assets/seyr-esik.js",
  "./assets/seyr-menu.js",
  "./assets/seyr-kadran.js",
  "./assets/seyr-kademe.js",
  "./assets/seyr-okuma.js",
  "./assets/seyr-zaten.js",
  "./assets/seyr-dizin.js",
  "./assets/seyr-harita.js",
  "./assets/graph-hint.js",
  "./assets/ipucu-yerlestir.js",
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
  "./assets/css/daphne.css",
  "./assets/css/duzenle.css",
  "./assets/css/elestiri.css",
  "./assets/css/eser-agi.css",
  "./assets/css/esik.css",
  "./assets/css/esma.css",
  "./assets/css/fusus.css",
  "./assets/css/futuhat.css",
  "./assets/css/hadis.css",
  "./assets/css/hakkinda.css",
  "./assets/css/hal.css",
  "./assets/css/helix.css",
  "./assets/css/hocalar.css",
  "./assets/css/kavram.css",
  "./assets/css/kuran-dokusu.css",
  "./assets/css/kuran.css",
  "./assets/css/menziller.css",
  "./assets/css/miskat.css",
  "./assets/css/okuma-yolum.css",
  "./assets/css/okuma.css",
  "./assets/css/ortak.css",
  "./assets/css/paralel.css",
  "./assets/css/semalar-cizim.css",
  "./assets/css/semalar.css",
  "./assets/css/seyr.css",
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
// Tarama 3 tasarımı (T3B1-002/003/010/011, T3B2-007/022/024, T3F2-001/023): üç önbellek.
//  - CACHE_VERSION: kabuk + betik + stil + kabuk sayfaları (sürüme bağlı; SRI tutarlılığı için yeni sürümde silinir).
//  - GEZILEN (sürümsüz): okurun gezerek biriktirdiği veri (/data/) ve düz sayfalar (Kur'an, Hadis, Yan Yana...). Yayın silmez;
//    girdi tavanlı (veri 120, sayfa 60). Yanıtlar yazıldığı sürümün damgasını taşır (SURUM_BASLIGI): damga güncel sürümle
//    aynı değilse veri önbellekten HEMEN verilmez, önce ağ denenir (yeni kod eski veriyle çalışmasın).
//  - ICERIK_CACHE: "indir" ile gelen paket (sürümden bağımsız).
const GEZILEN = "dost-gezilen";
const SURUM_BASLIGI = "X-Dost-Sw-Surum";
const TAVAN = { veri: 120, sayfa: 60 };
// scripts/sri-guncelle.py yazar: kökteki düz (uygulama kabuğu taşımayan) bölümler -- çevrimdışıyken kabuk (index.html) verilmez.
const DUZ_BOLUMLER = ["akademik-kaynaklar", "arastirma", "berzah-ve-otesi", "cizimler", "dizin", "gizlilik", "hadis", "iletisim", "kuran", "nasil-okunur", "seyahat-atlasi", "vahdet-ilkeleri", "yan-yana", "yenilikler"];
const DUZ_RE = new RegExp("^/(?:" + DUZ_BOLUMLER.concat(["gonul", "arastirma", ".well-known"]).map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")(/|$)");
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
    caches.keys().then((keys) => {
      const eskiler = keys.filter((k) => k !== CACHE_VERSION && k !== ICERIK_CACHE && k !== GEZILEN);
      return tasiEskiGezilenler(keys.filter((k) => /^dost-sw-/.test(k)))
        .catch(() => {})
        .then(() => Promise.all(eskiler.map((k) => caches.delete(k))));
    })
  );
  self.clients.claim();
});

// Sürüm önbelleğinde (eski kurulumlarda) duran veri ve düz sayfalar yayınla birlikte silinmesin: GEZILEN'e kopyalanır (en çok 200, damgasız:
// ilk istekte ağdan doğrulanır).
function tasiEskiGezilenler(adlar) {
  if (!adlar.length) return Promise.resolve();
  return caches.open(GEZILEN).then((hedef) => hedef.keys().then((mevcut) => {
    const var_ = new Set(mevcut.map((k) => k.url));
    let kalan = 200;
    return adlar.reduce((p, ad) => p.then(() => caches.open(ad).then((c) => c.keys().then((ks) => Promise.all(ks.map((rq) => {
      let u;
      try { u = new URL(rq.url); } catch (e) { return undefined; }
      const sinif = girdiSinifi(u);
      if (var_.has(rq.url) || kalan <= 0 || !(sinif === "veri" || (sinif === "sayfa" && !uygulamaAdresi(u)))) return undefined;
      kalan--; var_.add(rq.url);
      return c.match(rq).then((r) => r && hedef.put(rq, r)).catch(() => {});
    }))))), Promise.resolve());
  }));
}

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
  return !DUZ_RE.test(p);
}

// Girdi tavanı (Y3 + T3B1-011): her 8. yazımda veri ve sayfa girdileri ayrı ayrı sayılır, tavanı aşan EN ESKİLER silinir; kabuk dosyalarına dokunulmaz.
function girdiSinifi(url) {
  if (url.pathname.includes("/data/")) return "veri";
  if (/\/$|\.html$/.test(url.pathname)) return "sayfa";
  return "diger";
}
const KABUK_YOLLARI = new Set(SHELL_URLS.concat(SHELL_SONRA, [OFFLINE_URL]).map((u) => new URL(u, self.location.href).pathname));
let yazimSayisi = 0;
function tavanUygula(cache) {
  if (++yazimSayisi % 8) return Promise.resolve();
  return cache.keys().then((keys) => {
    const g = { veri: [], sayfa: [] };
    keys.forEach((k) => {
      let u;
      try { u = new URL(k.url); } catch (e) { return; }
      if (KABUK_YOLLARI.has(u.pathname)) return;
      const s = girdiSinifi(u);
      if (g[s]) g[s].push(k);
    });
    return Promise.all(["veri", "sayfa"].map((s) => Promise.all(g[s].slice(0, Math.max(0, g[s].length - TAVAN[s])).map((k) => cache.delete(k)))));
  }).catch(() => {});
}

// Bir yanıtın kopyasını bu sürümün damgasıyla sarar (gövde akışı aynen geçer).
function damgala(resp) {
  const h = new Headers(resp.headers);
  h.set(SURUM_BASLIGI, CACHE_VERSION);
  return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers: h });
}

// Gezinme yanıtının ETag/Last-Modified'ı önbellektekinden farklıysa (yeni yayın ya da sayfa değişti) kısa bir süre veri ağ-önce okunur:
// eski servis çalışanı yeni sayfayı açarken önbellekteki eski veriyi vermesin (T3B2-007).
let veriAgOnceBitis = 0;
function yayinSinyali(req, resp) {
  const imza = (r) => r.headers.get("etag") || r.headers.get("last-modified") || "";
  return caches.match(req).then((onceki) => {
    if (onceki && imza(onceki) && imza(resp) && imza(onceki) !== imza(resp)) veriAgOnceBitis = Date.now() + 60000;
  }).catch(() => {});
}

const SAYFA_YOLU_RE = /^\/(?:[a-z0-9-]+\/)+$/i;
function yedekSayfa() {
  // OFF-02/TD-02 + T3B2-024: bu cihazda önbellekte olan HER sayfa ailesinin (Fütûhât, Füsûs, Mişkât, Kur'an, Hadis, Yan Yana, Kavram...)
  // son 6 sayfası, kendi <title>'ıyla listelenir. Önbelleğin kendisi burada AÇILMAZ (caches.has ile bakılır): indirme hiç yapılmadıysa
  // ICERIK_CACHE oluşmasın (bkz. yukarıdaki not).
  const adlar = [GEZILEN, CACHE_VERSION, ICERIK_CACHE];
  return Promise.all(adlar.map((n) => caches.has(n).then((varMi) => (varMi ? caches.open(n).then((c) => c.keys().then((ks) => ks.map((rq) => ({ c, rq })))) : [])).catch(() => []))).then((listeler) => {
    const gorulen = new Set(), adaylar = [];
    listeler.forEach((ks) => ks.slice().reverse().forEach((a) => {
      try {
        const p = new URL(a.rq.url).pathname;
        if (!SAYFA_YOLU_RE.test(p) || /^\/(assets|data|pagefind)\//.test(p) || gorulen.has(p) || adaylar.length >= 6) return;
        gorulen.add(p);
        adaylar.push({ c: a.c, rq: a.rq, p });
      } catch (e) { /* adres okunamazsa atlanır */ }
    }));
    return Promise.all(adaylar.map((a) => a.c.match(a.rq).then((r) => (r ? r.text() : "")).then((t) => {
      const m = /<title>([^<]*)<\/title>/i.exec(t);
      return { p: a.p, ad: (m ? m[1].replace(/\s*[—-]\s*Dost Arab[îi]\s*$/, "") : a.p).replace(/[<>]/g, "") || a.p };
    }).catch(() => ({ p: a.p, ad: a.p })))).then((liste) => {
      const baglar = liste.map((x) => '<li style="margin:6px 0"><a href="' + x.p + '">' + x.ad + "</a></li>");
      const html = '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8">'
        + '<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Dost Arabî</title></head>'
        + '<body style="font-family:system-ui,sans-serif;max-width:34rem;margin:15vh auto;padding:0 16px;text-align:center">'
        + '<p>Bağlantı yok: bu sayfa bu cihazda kayıtlı değil. · No connection: this page is not saved on this device. · Sem conexão: esta página não está salva neste dispositivo.</p>'
        + (baglar.length ? '<p>Bu cihazda olanlar · Available here · Disponíveis aqui:</p><ul style="list-style:none;padding:0">' + baglar.join("") + "</ul>" : "")
        + '<p><a href="/">Ana sayfa · Home · Início</a></p></body></html>';
      return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
    });
  });
}

// Bir kaynak (JS/CSS/font/veri/arama dizini) ağdan gelmedi: önce tutarlı
// tam indirme (varsa), sonra sürüm önbelleği -- ya da tersi.
function cevrimdisiKaynak(req) {
  return indirmeTamam().then((tam) => {
    const sira = tam ? [ICERIK_CACHE, GEZILEN, CACHE_VERSION] : [GEZILEN, CACHE_VERSION, ICERIK_CACHE];
    return sira.reduce((p, ad) => p.then((r) => r || onbellekte(req, ad)), Promise.resolve(undefined));
  });
}

function cevrimdisiSayfa(req) {
  const url = new URL(req.url);
  const uygulama = uygulamaAdresi(url);
  return indirmeTamam().then((tam) => {
    const adimlar = [];
    if (tam && uygulama) adimlar.push(() => onbellekte("./index.html", ICERIK_CACHE));
    adimlar.push(() => onbellekte(req, CACHE_VERSION));
    adimlar.push(() => onbellekte(req, GEZILEN));
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
        .then((resp) => {
          // T3B1-003: clone() eşzamanlı alınır (then içinde, yanıt verildikten sonra çağrılınca "body already used" ile yazım hiç olmuyordu).
          if (resp.ok) { const kopya = resp.clone(); caches.open(GEZILEN).then((c) => c.put(req, kopya).then(() => tavanUygula(c))).catch(() => {}); }
          return resp;
        })
        .catch(() => caches.open(GEZILEN).then((c) => c.match(req)).then((m) => m || cevrimdisiKaynak(req)))
    );
    return;
  }

  if (isDataRequest(url)) {
    event.respondWith(veriYaniti(event, req));
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
  // K2-038 (tarama 2, 2026-11-18): integrity taşıyan betik isteği (index.html'deki <script integrity>, view-loader'ın tembel
  // betikleri) önbellekteki kopyanın özeti sayfanın istediği özetle AYNIYSA doğrudan önbellekten verilir: içerik bayt bayt
  // sayfanın beklediğidir, ağa sormanın (her açılışta ≈30 koşullu istek) yeni bir şey getirmesi mümkün değil. Özet tutmazsa
  // (yeni yayın: HTML önce ağdan geldiği için yeni özeti taşır) ya da kopya yoksa bugünkü ağ-önce yol aynen işler; tarayıcı
  // eski kopyayı hiç görmez, "Failed to find a valid digest" doğmaz. integrity taşımayan istek (stil dosyaları, CSS içi
  // import) ve sayfa isteği değişmedi: önce ağ.
  if (req.destination === "script" && req.integrity && /sha(256|384|512)-/.test(req.integrity)) {
    event.respondWith(ozetliOnbellek(req).then((r) => r || agOnceYanit(event, req)));
    return;
  }
  event.respondWith(agOnceYanit(event, req));
});

// Veri: stale-while-revalidate, GEZILEN önbelleğinde. Önbellek kopyası bu sürümün damgasını taşıyorsa hemen verilir, arka planda tazelenir.
// Damga eski sürümse (ya da damgasızsa) ya da yeni yayın sinyali varsa (yayinSinyali) önce ağ denenir (3 sn), ağ yoksa önbellek.
function veriYaniti(event, req) {
  return caches.open(GEZILEN).then((cache) =>
    cache.match(req).then((cached) => {
      const network = fetch(req)
        .then((resp) => { if (resp.ok) { const kopya = damgala(resp.clone()); cache.put(req, kopya).then(() => tavanUygula(cache)).catch(() => {}); } return resp; })
        .catch(() => cached || cevrimdisiKaynak(req));
      event.waitUntil(network.catch(() => {}));
      if (cached) {
        const taze = cached.headers.get(SURUM_BASLIGI) === CACHE_VERSION && Date.now() > veriAgOnceBitis;
        if (taze) return cached;
        return Promise.race([network, new Promise((coz) => setTimeout(() => coz(null), 3000))]).then((r) => r || cached);
      }
      // Fikir 15 (2026-11-07): önbellekte yok ve ağ ~10 sn yanıt vermiyorsa (lie-fi) indirilmiş çevrimdışı kopya varsa o verilir;
      // yoksa ağ beklenmeye devam eder (ağ isteği arka planda sürer ve önbelleği tazeler).
      return Promise.race([network, new Promise((coz) => setTimeout(() => coz(null), 10000))]).then((r) => r || cevrimdisiKaynak(req).then((c) => c || network));
    })
  );
}

const SRI_SIRA = { sha256: 1, sha384: 2, sha512: 3 };
const SRI_AD = { sha256: "SHA-256", sha384: "SHA-384", sha512: "SHA-512" };
function ozetliOnbellek(req) {
  // SRI kuralı: yalnız en güçlü algoritmanın özetleri sayılır; biri tutarsa yeter.
  const parca = String(req.integrity).trim().split(/\s+/)
    .map((x) => /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})/.exec(x)).filter(Boolean);
  if (!parca.length || !self.crypto || !self.crypto.subtle) return Promise.resolve(null);
  const enGuclu = Math.max.apply(null, parca.map((p) => SRI_SIRA[p[1]]));
  const aday = parca.filter((p) => SRI_SIRA[p[1]] === enGuclu);
  const alg = aday[0][1];
  return caches.open(CACHE_VERSION)
    .then((cache) => cache.match(req))
    .then((m) => {
      if (!m || !m.ok) return null;
      return m.arrayBuffer().then((buf) => self.crypto.subtle.digest(SRI_AD[alg], buf).then((ozet) => {
        const b = new Uint8Array(ozet);
        let ikili = "";
        for (let i = 0; i < b.length; i++) ikili += String.fromCharCode(b[i]);
        const b64 = btoa(ikili);
        if (!aday.some((p) => p[2] === b64)) return null;
        return new Response(buf, { status: m.status, statusText: m.statusText, headers: m.headers });
      }));
    })
    .catch(() => null);
}

function agOnceYanit(event, req) {
  const isNavOrAsset = req.destination === "script" || req.destination === "style" || req.mode === "navigate";
  // Y1 (2026-11-07): ağ ~4 sn içinde yanıt vermezse (zayıf bağlantı) ve
  // önbellekte kopya varsa onu ver; ağ isteği arka planda sürer ve önbelleği tazeler.
  const ag = fetch(isNavOrAsset ? new Request(req, { cache: "no-cache" }) : req);
  if (isNavOrAsset) {
    event.waitUntil(ag.then((resp) => {
      if (!resp.ok) return;
      const kopya = resp.clone();
      const hedef = req.mode === "navigate" && !uygulamaAdresi(new URL(req.url)) ? GEZILEN : CACHE_VERSION;
      return caches.open(hedef).then((cache) => cache.put(req, kopya).then(() => tavanUygula(cache)));
    }).catch(() => {}));
  }
  const bekle = isNavOrAsset
    ? Promise.race([
        ag,
        new Promise((coz) => setTimeout(() => coz(null), 4000)),
      ]).then((r) => r || caches.match(req).then((c) => c || ag))
    : ag;
  return (
    bekle
      .then((resp) => {
        if (req.mode === "navigate" && resp.ok) return yayinSinyali(req, resp.clone()).then(() => resp);
        if (req.mode === "navigate" && resp.status === 404) return yumusat404(resp);
        return resp;
      })
      .catch(() => (req.mode === "navigate" ? cevrimdisiSayfa(req) : cevrimdisiKaynak(req)))
  );
}

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
