/* Geri bildirim (2026-10-17): "Sorun bildir" -- geliştirici modunda, telefondaki
 * (özellikle Android uygulamasındaki) gözlemlerin doğrudan Claude'a iletilmesi.
 *
 * SUNUCUSUZ: hiçbir veri bizim sunucumuza gitmez. Rapor cihazda bir metne
 * dökülür; kullanıcı "Gönder"e basınca tarayıcının paylaşma sayfası
 * (navigator.share) açılır -- metnin nereye gideceğini kullanıcı seçer
 * (Claude uygulaması dahil). Paylaşma yoksa / iptal / hata olursa metin
 * panoya kopyalanır. Üçüncü yol: "GitHub'a not olarak aç" -- GitHub'ın
 * yeni-issue ön-doldurma adresi (etiket telefon-notu), yeni sekmede; token /
 * sunucu yok, formu oturumu açık kullanıcı kendisi gönderir.
 * Biçim: docs/rapor-bicimi.md ("DOST-RAPOR v1").
 *
 * KAPSAM: bu dosya yalnız geliştirici modu açıkken iner
 * (localStorage["dost-gelistirici"] === "1"; view-loader.js KIPLER). Mod
 * kapalıyken bu dosyanın kodu hiç çalışmaz, hiçbir dinleyici eklenmez.
 *
 * Toplanan (hepsi cihazda, son 40 olaylık halka tampon):
 *  - sayfa geçişleri (yalnız yol, sorgu/parça yok),
 *  - kabuk düğmelerine dokunmalar (yalnız data-* / id / aria-label ADI;
 *    metin İÇERİĞİ yok; ayrıntı panelinde yalnız id),
 *  - window.onerror + unhandledrejection (mesaj + kaynak:satır),
 *  - yüklenemeyen kaynaklar (img/script/link hatası, başarısız fetch: yalnız yol),
 *  - >= 200 ms uzun görevler (sayı + en uzunu), uzun kareler (long-animation-frame),
 *  - çevrimdışı / çevrimiçi geçişleri.
 * Bağlam (sabit alanlar): zaman, yol, sürüm, kabuk, kaynak, dil, tema, yazı
 * ölçeği, ekran, katman adları, çevrimdışı mı, Android/Chrome sürümü, bellek,
 * çekirdek, bağlantı. KİŞİSEL VERİ, okunan metin, konum, kimlik YOK.
 *
 * Rapor sayfası kabuğun dış katmanıdır (window.__dostKabukDisKatman): Ara ve
 * Defterim gibi tarihte kendi girdisini açar; geri tuşu, Esc ve ✕ aynı TEK
 * adımdır. Telefon kabuğu yoksa (masaüstü) Esc / ✕ ile kapanır.
 */
(function () {
  "use strict";
  if (window.__dostGeriBildirim) return;
  var HTML = document.documentElement;
  var I18n = window.DostI18n;
  var GU = window.DostGraphUtils;

  var OLAY_SINIRI = 40;      // halka tampon
  var RAPOR_SINIRI = 3000;   // karakter
  var NOT_SINIRI = 1000;     // kullanıcı notu
  var BASLIK = "Dost Arabî hata raporu";

  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function $(s, k) { return (k || document).querySelector(s); }

  var M = {
    baslik: { tr: "Sorun bildir", en: "Report a problem", pt: "Relatar um problema" },
    kapat: { tr: "Kapat", en: "Close", pt: "Fechar" },
    ayrinti: { tr: "Ayrıntılar (gönderilecek özet)", en: "Details (the summary to be sent)", pt: "Detalhes (o resumo a enviar)" },
    ne: { tr: "Ne gördün?", en: "What did you see?", pt: "O que você viu?" },
    neIpucu: { tr: "Ne oldu, nerede, ne bekliyordun? Klavyedeki mikrofonla söyleyebilirsin.", en: "What happened, where, what did you expect? You can dictate with the keyboard microphone.", pt: "O que aconteceu, onde, o que esperava? Pode ditar com o microfone do teclado." },
    gonder: { tr: "Gönder", en: "Send", pt: "Enviar" },
    kopyala: { tr: "Kopyala", en: "Copy", pt: "Copiar" },
    github: { tr: "GitHub'a not olarak aç", en: "Open as a note on GitHub", pt: "Abrir como nota no GitHub" },
    paylasildi: { tr: "Paylaşıldı.", en: "Shared.", pt: "Compartilhado." },
    kopyalandi: { tr: "Panoya kopyalandı; Claude uygulamasına yapıştır", en: "Copied to the clipboard; paste it into the Claude app", pt: "Copiado para a área de transferência; cole no app do Claude" },
    kopyalanamadi: { tr: "Kopyalanamadı. Ayrıntıları açıp metni seçerek kopyala.", en: "Could not copy. Open the details and select the text to copy it.", pt: "Não foi possível copiar. Abra os detalhes e selecione o texto." },
    gizlilik: { tr: "Hiçbir şey sunucumuza gitmez; yalnız sen paylaşırsan gider.", en: "Nothing goes to our server; it leaves your device only if you share it.", pt: "Nada vai para o nosso servidor; só sai do aparelho se você compartilhar." },
    olay: { tr: "olay", en: "events", pt: "eventos" },
    hata: { tr: "hata", en: "errors", pt: "erros" },
  };

  // --- Halka tampon ------------------------------------------------------
  var tampon = [];                 // { z: epoch ms, tip, ayr, n }
  var acik = false;                // toplayıcı çalışıyor mu
  var dinleyiciler = [], gozlemciler = [];
  var uzunSayi = 0, uzunEn = 0, kareSayi = 0, kareEn = 0;
  var sonYol = "";
  var surumDegeri = "";            // hizmet işçisi önbellek adı (async, ac()'ta tazelenir)

  function kes(s, n) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, n || 140); }
  // Adres -> yalnız yol (aynı kökende), başka kökende host + yol. Sorgu/parça atılır.
  function yolDizgisi(u) {
    try {
      var x = new URL(u, location.href);
      return (x.origin === location.origin ? "" : x.host) + x.pathname;
    } catch (e) { return kes(u, 80).replace(/[?#].*$/, ""); }
  }
  function dosyaSatir(f, s) {
    var ad = yolDizgisi(f || "").split("/").pop();
    return (ad || "?") + (s ? ":" + s : "");
  }
  function kaydet(tip, ayr, zaman) {
    if (!acik) return;
    ayr = kes(ayr);
    var son = tampon[tampon.length - 1];
    // Art arda aynı olay tek satırda sayılır (hata fırtınası halkayı doldurmasın).
    if (son && son.tip === tip && son.ayr === ayr && tip !== "yol") { son.n++; son.z = zaman || Date.now(); return; }
    tampon.push({ z: zaman || Date.now(), tip: tip, ayr: ayr, n: 1 });
    if (tampon.length > OLAY_SINIRI) tampon.shift();
  }
  function dinle(hedef, tip, fn, secenek) {
    hedef.addEventListener(tip, fn, secenek);
    dinleyiciler.push([hedef, tip, fn, secenek]);
  }

  // Dokunulan kabuk düğmesinin ADI (metin içeriği değil). Kabuğun kendi
  // denetimleri dışındaki düğmeler (içerik, arama sonuçları) kaydedilmez.
  var KABUK_SECICI = ".app-header, .uyg-alt, .uyg-sayfa, .uyg-aa-pop, #nav-drawer, .uyg-secici, #detail-panel, .mg-kip, #search-panel, #defter-panel, .uyg-halka, .uyg-guncelleme";
  var AD_ANAHTARLARI = ["uyg", "eylem", "kapi", "dil", "grup", "aa"];
  function dugmeAdi(el) {
    if (!el.closest(KABUK_SECICI) || el.closest("#uyg-rapor")) return "";
    var panelde = !!el.closest("#detail-panel, #search-panel, #defter-panel");
    if (el.id) return "#" + kes(el.id, 40);
    if (panelde) return "";
    var d = el.dataset || {};
    for (var i = 0; i < AD_ANAHTARLARI.length; i++) {
      if (d[AD_ANAHTARLARI[i]] != null) return AD_ANAHTARLARI[i] + ":" + kes(d[AD_ANAHTARLARI[i]], 40);
    }
    var a = el.getAttribute("aria-label");
    return a ? "etiket:" + kes(a, 40) : "";
  }

  function yolIzle() {
    var y = location.pathname;
    if (y === sonYol) return;
    sonYol = y;
    kaydet("yol", y);
  }

  var tarihSarildi = false;
  function tarihiSar() {
    if (tarihSarildi) return;
    tarihSarildi = true;
    ["pushState", "replaceState"].forEach(function (m) {
      var f = history[m];
      history[m] = function () {
        var r = f.apply(this, arguments);
        if (acik) yolIzle();
        return r;
      };
    });
  }
  var fetchSarildi = false;
  function fetchiSar() {
    if (fetchSarildi || typeof window.fetch !== "function") return;
    fetchSarildi = true;
    var f0 = window.fetch;
    window.fetch = function (girdi) {
      var p = f0.apply(this, arguments);
      if (!acik) return p;
      var u = "";
      try { u = yolDizgisi(typeof girdi === "string" ? girdi : (girdi && girdi.url) || ""); } catch (e) { /* yoksay */ }
      // Yan dal: asıl vaadin zincirine dokunmaz (reddi çağırana aynen gider).
      p.then(function (r) { if (r && !r.ok) kaydet("kaynak", "fetch " + u + " " + r.status); },
        function (err) { if (!err || err.name !== "AbortError") kaydet("kaynak", "fetch " + u + " " + kes(err && err.message, 40)); });
      return p;
    };
  }

  function baslat() {
    if (acik) return;
    acik = true;
    tarihiSar();
    fetchiSar();
    sonYol = "";
    yolIzle();
    // Sayfa geçişleri.
    dinle(window, "popstate", yolIzle);
    dinle(window, "hashchange", yolIzle);
    // Kabuk düğmelerine dokunmalar.
    dinle(document, "click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("button, [role=button], a") : null;
      if (!el) return;
      var ad = dugmeAdi(el);
      if (ad) kaydet("dokunma", ad);
    }, true);
    // JS hataları ve yüklenemeyen kaynaklar (yakalama evresi: kaynak hataları kabarmaz).
    dinle(window, "error", function (e) {
      var h = e.target;
      if (h && h !== window && h.tagName) {
        kaydet("kaynak", h.tagName.toLowerCase() + " " + yolDizgisi(h.src || h.href || ""));
        return;
      }
      kaydet("hata", kes(e.message) + " @ " + dosyaSatir(e.filename, e.lineno));
    }, true);
    dinle(window, "unhandledrejection", function (e) {
      var r = e.reason;
      kaydet("hata", "reddedilen-soz: " + kes(r && r.message ? r.message : r));
    });
    // Çevrimdışı / çevrimiçi.
    dinle(window, "offline", function () { kaydet("ag", "cevrimdisi"); });
    dinle(window, "online", function () { kaydet("ag", "cevrimici"); });
    // Uzun görevler (>= 200 ms) ve uzun kareler (hedef kare hızının altına düşenler).
    // createFrameLoop kare ölçümü sunmuyor; tarayıcının long-animation-frame
    // gözlemcisi (varsa) aynı işi bedavaya yapar.
    try {
      var po = new PerformanceObserver(function (liste) {
        liste.getEntries().forEach(function (en) {
          if (en.duration < 200) return;
          uzunSayi++;
          if (en.duration > uzunEn) uzunEn = en.duration;
          kaydet("uzun-gorev", Math.round(en.duration) + " ms");
        });
      });
      po.observe({ type: "longtask" });
      gozlemciler.push(po);
    } catch (e) { /* longtask yok */ }
    try {
      var pk = new PerformanceObserver(function (liste) {
        liste.getEntries().forEach(function (en) { kareSayi++; if (en.duration > kareEn) kareEn = en.duration; });
      });
      pk.observe({ type: "long-animation-frame" });
      gozlemciler.push(pk);
    } catch (e) { /* long-animation-frame yok */ }
  }

  function durdur() {
    acik = false;
    dinleyiciler.forEach(function (d) { d[0].removeEventListener(d[1], d[2], d[3]); });
    dinleyiciler = [];
    gozlemciler.forEach(function (g) { try { g.disconnect(); } catch (e) { /* yoksay */ } });
    gozlemciler = [];
    tampon = [];
    uzunSayi = uzunEn = kareSayi = kareEn = 0;
    kapat();
  }

  // --- Bağlam ------------------------------------------------------------
  function katmanlar() {
    var acikMi = function (s) { var el = $(s); return !!(el && !el.hidden); };
    var a = [];
    if (acikMi("#detail-panel")) a.push(HTML.classList.contains("uyg-panel-yarim") ? "panel-yarim" : "panel");
    if (acikMi(".uyg-sayfa--daha")) a.push("ayarlar");
    if (acikMi(".uyg-sayfa--okuma")) a.push("okuma");
    if (acikMi("#search-panel")) a.push("ara");
    if (acikMi("#defter-panel")) a.push("defter");
    if (acikMi("#nav-drawer")) a.push("bolumler");
    if (acikMi("#uyg-aa-pop")) a.push("aa");
    if ($(".okuma-sayfa")) a.push("bu-metinde");
    if (HTML.classList.contains("mg-tam")) a.push("tam-ekran");
    return a.join(", ") || "yok";
  }
  function baglam() {
    var ua = navigator.userAgent || "";
    var an = /Android (\d+(?:\.\d+)?)/.exec(ua), ch = /Chrome\/(\d+)/.exec(ua);
    var c = navigator.connection;
    var wrap = $("main > section:not([hidden]):not(.detail-panel)");
    var olcek = parseFloat(HTML.style.getPropertyValue("--detail-font-scale")) ||
      (window.DostFontScale && window.DostFontScale.getStoredScale()) || 1;
    var standalone = false;
    try { standalone = window.matchMedia("(display-mode: standalone)").matches; } catch (e) { /* eski tarayıcı */ }
    var sw = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    var lang = (I18n && I18n.getLang && I18n.getLang()) || "tr";
    var tema = document.body.getAttribute("data-theme") || "?";
    return [
      ["zaman", new Date().toISOString()],
      ["yol", location.pathname],
      ["gorunum", wrap && wrap.id ? wrap.id : "?"],
      ["surum", surumDegeri || "?"],
      ["sw", sw ? "aktif" : "yok"],
      ["kabuk", HTML.classList.contains("uyg-v2") ? "v2" : HTML.classList.contains("dost-uygulama") ? "eski" : "yok"],
      ["kaynak", window.__dostUygulama === true ? "twa" : standalone ? "standalone" : "tarayici"],
      ["dil", lang],
      ["tema", tema],
      ["yazi-olcegi", String(olcek)],
      ["ekran", innerWidth + "x" + innerHeight + " dpr" + (window.devicePixelRatio || 1).toFixed(1) + " " + (innerWidth > innerHeight ? "yatay" : "dikey")],
      ["katmanlar", katmanlar()],
      ["cevrimdisi", navigator.onLine === false ? "evet" : "hayir"],
      ["cihaz", "Android " + (an ? an[1] : "yok") + "; Chrome " + (ch ? ch[1] : "yok")],
      ["bellek-gb", navigator.deviceMemory != null ? String(navigator.deviceMemory) : "?"],
      ["cekirdek", navigator.hardwareConcurrency != null ? String(navigator.hardwareConcurrency) : "?"],
      ["baglanti", c ? [c.type, c.effectiveType, c.saveData ? "veri-tasarrufu" : ""].filter(Boolean).join(" ") || "?" : "?"],
      ["uzun-gorev", uzunSayi ? uzunSayi + " adet, en uzun " + Math.round(uzunEn) + " ms" : "yok"],
      ["uzun-kare", kareSayi ? kareSayi + " adet, en uzun " + Math.round(kareEn) + " ms" : "yok"],
    ];
  }

  // --- Rapor metni (DOST-RAPOR v1; biçim: docs/rapor-bicimi.md) ----------------
  function olayTemizle(s) { return String(s).replace(/[\u0000-\u001f\u007f]/g, " "); }
  function olayDizisi() {
    var simdi = Date.now();
    return tampon.slice().sort(function (a, b) { return a.z - b.z; }).map(function (o, i) {
      var sn = Math.max(0, Math.round((simdi - o.z) / 1000));
      return "olay-" + (i < 9 ? "0" : "") + (i + 1) + ": -" + sn + "s " + o.tip + (o.ayr ? " " + olayTemizle(o.ayr) : "") + (o.n > 1 ? " x" + o.n : "");
    });
  }
  // sonOlay (ops.): yalnız en yeni bu kadar olay (GitHub adresi için kısaltma).
  function rapor(notMetni, sonOlay) {
    var not = String(notMetni == null ? "" : notMetni).replace(/\r\n?/g, "\n").trim();
    if (not.length > NOT_SINIRI) not = not.slice(0, NOT_SINIRI - 1) + "…";
    var bas = ["DOST-RAPOR v1"].concat(baglam().map(function (k) { return k[0] + ": " + olayTemizle(k[1]); }));
    var olaylar = olayDizisi();
    if (sonOlay != null) olaylar = sonOlay > 0 ? olaylar.slice(-sonOlay) : [];
    var notSatiri = "not: " + not;
    function birlestir() { return bas.concat(olaylar, [notSatiri]).join("\n"); }
    // 3000 karakteri aşarsa önce en eski olaylar düşer (sıralama zaten eskiden yeniye).
    var metin = birlestir();
    while (metin.length > RAPOR_SINIRI && olaylar.length) { olaylar.shift(); metin = birlestir(); }
    if (metin.length > RAPOR_SINIRI) {
      var kalan = RAPOR_SINIRI - (bas.join("\n").length + 1 + 5);
      notSatiri = "not: " + not.slice(0, Math.max(0, kalan - 1)) + "…";
      metin = birlestir();
    }
    return metin;
  }
  function hataSayisi() { return tampon.filter(function (o) { return o.tip === "hata" || o.tip === "kaynak"; }).length; }

  // --- Panoya kopyala ------------------------------------------------------------
  function panoyaKopyala(metin) {
    return new Promise(function (coz) {
      function eski() {
        try {
          var ta = document.createElement("textarea");
          ta.value = metin;
          ta.setAttribute("readonly", "");
          ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
          document.body.appendChild(ta);
          ta.select();
          ta.setSelectionRange(0, metin.length);
          var tamam = document.execCommand("copy");
          ta.remove();
          coz(!!tamam);
        } catch (e) { coz(false); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(function () { coz(true); }, eski);
      else eski();
    });
  }

  // --- Rapor sayfası -------------------------------------------------------------
  var sayfa = null, taslak = "";
  var STIL = ""
    + ".gb-sayfa{position:fixed;left:var(--uyg-ray,0px);right:0;bottom:max(calc(var(--uyg-alt-h,0px) + var(--uyg-guvenli-alt,0px)),var(--uyg-klavye,0px));z-index:65;"
    + "box-sizing:border-box;margin:0 auto;width:min(560px,calc(100% - var(--uyg-ray,0px)));"
    + "max-height:calc(100% - var(--uyg-sayfa-ust,9vh) - var(--uyg-alt-h,0px) - var(--uyg-guvenli-alt,0px));overflow-y:auto;overscroll-behavior:contain;"
    + "padding:10px 18px 22px;background:var(--surface-1);color:var(--text-primary);border-radius:24px 24px 0 0;"
    + "box-shadow:0 -10px 30px rgba(0,0,0,.16);animation:uyg-sayfa-in var(--dur-gecis,.25s) var(--ease-sahne,ease);}"
    + ".gb-sayfa[hidden]{display:none;}"
    + ".gb-ust{display:flex;align-items:center;justify-content:space-between;gap:12px;}"
    + ".gb-baslik{margin:0;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);font-weight:600;}"
    + ".gb-baslik:focus{outline:none;}"
    + ".gb-kapat{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--border);background:transparent;color:var(--text-secondary);display:inline-flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}"
    + ".gb-ozet{margin:6px 0 4px;font-size:.88rem;color:var(--text-secondary);}"
    + ".gb-ayrinti>summary{display:flex;align-items:center;min-height:44px;font-size:.88rem;color:var(--text-primary);cursor:pointer;}"
    + ".gb-onizleme{margin:0 0 8px;padding:10px;max-height:28vh;overflow:auto;white-space:pre-wrap;word-break:break-word;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;"
    + "color:var(--text-primary);background:var(--page-plane);border:1px solid var(--gridline);border-radius:12px;}"
    + ".gb-etiket{display:block;margin:8px 0 6px;font-size:.95rem;font-weight:600;color:var(--text-primary);}"
    + ".gb-not{display:block;box-sizing:border-box;width:100%;min-height:7.5rem;padding:12px;font:inherit;font-size:16px;color:var(--text-primary);"
    + "background:var(--page-plane);border:1px solid var(--border);border-radius:14px;resize:vertical;}"
    + ".gb-dugmeler{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}"
    + ".gb-dugme{flex:1 1 0;min-height:48px;padding:0 18px;border-radius:999px;border:1px solid var(--border);background:var(--page-plane);color:var(--text-primary);font:inherit;font-size:.95rem;font-weight:600;cursor:pointer;}"
    + ".gb-dugme--birincil{background:var(--text-primary);color:var(--surface-1);border-color:var(--text-primary);}"
    + ".gb-dugme--genis{flex:1 1 100%;}"
    + ".gb-durum{min-height:1.4em;margin:10px 0 0;font-size:.88rem;color:var(--text-primary);}"
    + ".gb-gizlilik{margin:6px 0 0;font-size:.78rem;color:var(--text-muted);}"
    + ".gb-kapat:focus-visible,.gb-dugme:focus-visible,.gb-ayrinti>summary:focus-visible,.gb-not:focus-visible{outline:2px solid var(--accent-interactive);outline-offset:2px;}"
    + "@media (prefers-reduced-motion:reduce){.gb-sayfa{animation:none;}}";

  function kur() {
    if (sayfa) return sayfa;
    var st = document.createElement("style");
    st.id = "gb-stil";
    st.textContent = STIL;
    document.head.appendChild(st);
    sayfa = document.createElement("section");
    sayfa.id = "uyg-rapor";
    sayfa.className = "gb-sayfa";
    sayfa.hidden = true;
    sayfa.setAttribute("role", "dialog");
    sayfa.setAttribute("aria-labelledby", "gb-baslik");
    sayfa.innerHTML = '<div class="gb-ust"><h2 class="gb-baslik" id="gb-baslik" tabindex="-1"></h2>'
      + '<button type="button" id="uyg-rapor-kapat" class="gb-kapat"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></button></div>'
      + '<p class="gb-ozet" id="gb-ozet"></p>'
      + '<details class="gb-ayrinti"><summary></summary><pre class="gb-onizleme" tabindex="0"></pre></details>'
      + '<label class="gb-etiket" for="gb-not"></label>'
      + '<textarea id="gb-not" class="gb-not" rows="4" maxlength="' + NOT_SINIRI + '" autocomplete="off" autocapitalize="sentences" enterkeyhint="done"></textarea>'
      + '<div class="gb-dugmeler"><button type="button" id="gb-gonder" class="gb-dugme gb-dugme--birincil"></button><button type="button" id="gb-kopyala" class="gb-dugme"></button>'
      + '<button type="button" id="gb-github" class="gb-dugme gb-dugme--genis"></button></div>'
      + '<p class="gb-durum" id="gb-durum" role="status" aria-live="polite"></p>'
      + '<p class="gb-gizlilik"></p>';
    document.body.appendChild(sayfa);
    $("#uyg-rapor-kapat", sayfa).addEventListener("click", function () { kapat(); });
    $("#gb-gonder", sayfa).addEventListener("click", gonder);
    $("#gb-kopyala", sayfa).addEventListener("click", function () { kopyala(); });
    $("#gb-github", sayfa).addEventListener("click", githubAc);
    var not = $("#gb-not", sayfa);
    not.addEventListener("input", function () { taslak = not.value; onizlemeYaz(); });
    $(".gb-ayrinti", sayfa).addEventListener("toggle", onizlemeYaz);
    // Esc: öteki katmanlardan ÖNCE denenir (bir adım: yalnız bu sayfa kapanır).
    if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return kapat(); }, { oncelikli: true });
    // Telefon kabuğu varsa Ara/Defterim gibi dış katman: tarih girdisi, geri tuşu, ✕.
    if (window.__dostKabukDisKatman) window.__dostKabukDisKatman({ ad: "rapor", id: "uyg-rapor", dugme: "uyg-rapor-kapat" });
    new MutationObserver(etiketle).observe(HTML, { attributes: true, attributeFilter: ["lang"] });
    etiketle();
    return sayfa;
  }
  function etiketle() {
    if (!sayfa) return;
    $(".gb-baslik", sayfa).textContent = t(M.baslik);
    var k = $("#uyg-rapor-kapat", sayfa);
    k.setAttribute("aria-label", t(M.kapat));
    k.title = t(M.kapat);
    $(".gb-ayrinti > summary", sayfa).textContent = t(M.ayrinti);
    $(".gb-etiket", sayfa).textContent = t(M.ne);
    $("#gb-not", sayfa).setAttribute("placeholder", t(M.neIpucu));
    $("#gb-gonder", sayfa).textContent = t(M.gonder);
    $("#gb-kopyala", sayfa).textContent = t(M.kopyala);
    $("#gb-github", sayfa).textContent = t(M.github);
    $(".gb-gizlilik", sayfa).textContent = t(M.gizlilik);
    ozetYaz();
  }
  function ozetYaz() {
    if (!sayfa) return;
    var bag = {};
    baglam().forEach(function (k) { bag[k[0]] = k[1]; });
    var yol = bag.yol, kabuk = bag.kabuk, cihaz = bag.cihaz;
    var h = hataSayisi();
    $("#gb-ozet", sayfa).textContent = [cihaz, yol, kabuk === "yok" ? "" : "kabuk " + kabuk, tampon.length + " " + t(M.olay), h ? h + " " + t(M.hata) : ""].filter(Boolean).join(" · ");
  }
  function onizlemeYaz() {
    if (!sayfa) return;
    var d = $(".gb-ayrinti", sayfa);
    if (d.open) $(".gb-onizleme", sayfa).textContent = rapor(taslak);
    ozetYaz();
  }
  function durum(metin) { if (sayfa) $("#gb-durum", sayfa).textContent = metin || ""; }

  function kopyala() {
    var metin = rapor(taslak);
    return panoyaKopyala(metin).then(function (tamam) {
      if (tamam) { durum(t(M.kopyalandi)); return true; }
      // Pano da yoksa: ayrıntı açılır, metin seçilir -- kullanıcı elle kopyalar.
      var d = $(".gb-ayrinti", sayfa);
      d.open = true;
      var pre = $(".gb-onizleme", sayfa);
      pre.textContent = metin;
      try { var r = document.createRange(); r.selectNodeContents(pre); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* seçilemedi */ }
      durum(t(M.kopyalanamadi));
      return false;
    });
  }
  function gonder() {
    var metin = rapor(taslak);
    if (typeof navigator.share !== "function") { kopyala(); return; }
    var vaat;
    try { vaat = navigator.share({ title: BASLIK, text: metin }); } catch (e) { kopyala(); return; }
    Promise.resolve(vaat).then(function () { durum(t(M.paylasildi)); }, function () { kopyala(); });
  }

  // "GitHub'a not olarak aç": GitHub'ın yeni-issue ön-doldurma adresi. Token / sunucu
  // yok; adres yeni sekmede (Android'de Custom Tab) açılır, formu oturumu açık
  // kullanıcı kendisi gönderir (depo özel). Adres GH_SINIRI'nı aşarsa rapor kısalır:
  // önce olay tamponu (en eskiden), sonra not; gövde "KISALTILDI" ile başlar.
  var GH_ADRES = "https://github.com/hacimurat1979/Dost/issues/new";
  var GH_SINIRI = 7000;
  function githubUrl(notMetni) {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    var tarih = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
    var baslik = "Telefon notu: " + kes(location.pathname, 60) + " " + tarih;
    var onek = GH_ADRES + "?labels=telefon-notu&title=" + encodeURIComponent(baslik) + "&body=";
    var notTam = String(notMetni == null ? "" : notMetni), not = notTam;
    var n = tampon.length;
    for (;;) {
      var kisaldi = n < tampon.length || not.length < notTam.length;
      var url = onek + encodeURIComponent((kisaldi ? "KISALTILDI\n" : "") + rapor(not, n));
      if (url.length <= GH_SINIRI) return url;
      if (n > 0) n = Math.max(0, n - 4);
      else if (not.length > 0) not = not.slice(0, Math.floor(not.length * 0.8));
      else return url.slice(0, GH_SINIRI);
    }
  }
  function githubAc() {
    try { window.open(githubUrl(taslak), "_blank", "noopener"); } catch (e) { /* engellendi */ }
  }

  function surumuOku() {
    try {
      if (!window.caches || !caches.keys) return;
      caches.keys().then(function (adlar) {
        var a = adlar.filter(function (x) { return /^dost-sw-[0-9a-f]+$/.test(x); })[0];
        if (a) { surumDegeri = a; onizlemeYaz(); }
      }).catch(function () { /* önbellek erişilemez */ });
    } catch (e) { /* API yok */ }
  }
  function ac() {
    if (!acik) baslat();
    kur();
    surumuOku();
    var not = $("#gb-not", sayfa);
    not.value = taslak;
    durum("");
    onizlemeYaz();
    etiketle();
    sayfa.hidden = false;
    var b = $(".gb-baslik", sayfa);
    if (b) b.focus({ preventScroll: true });
    return true;
  }
  function kapat() {
    if (!sayfa || sayfa.hidden) return false;
    sayfa.hidden = true;
    var a = document.activeElement;
    if (a && sayfa.contains(a) && a.blur) a.blur();
    return true;
  }

  window.__dostGeriBildirim = {
    baslat: baslat, durdur: durdur, ac: ac, kapat: kapat,
    rapor: rapor, githubUrl: githubUrl, tampon: function () { return tampon.slice(); },
    acikMi: function () { return !!(sayfa && !sayfa.hidden); },
  };
  baslat();
  surumuOku();
})();
