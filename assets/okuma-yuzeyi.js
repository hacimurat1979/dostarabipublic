/* Okuma yüzeyi (2026-10-15, mobil okuma taraması) -- Fütûhât / Füsûs /
 * Mişkât okuma metinlerinin ortak davranışları. view-loader.js bu dosyayı
 * üç görünümden birinin betiğinden ÖNCE indirir (VIEWS[...].once); her görünüm
 * çizimini bitirince window.DostOkuma.cizildi(görünüm, kayıt, makale,
 * otomatik) der. Davranış burada, görünümün metni ve verisi görünümün kendi
 * dosyasında kalır.
 *
 *  - GZ-01 Okuma yeri: kayıt başına kaydırma yeri (blok sırası + ekrandaki
 *    yeri) yalnız bu cihazın localStorage'ında; yeniden açılışta (Android'de
 *    uygulama/sekme yeniden başlayınca, sayfa yenilenince, geri tuşuyla
 *    dönünce) içerik oturunca aynı bloğa dönülür, üstte kısa bir
 *    "Kaldığın yerdesin" + "Baştan" dairesi çıkar. Kullanıcının kendi
 *    seçtiği kayıt (çip, Önceki/Sonraki) eskisi gibi makalenin başından
 *    okunur. history.scrollRestoration okuma görünümü açıkken "manual":
 *    Chrome kısa belgede kaydırmayı kırpıp içerik büyürken "scroll
 *    anchoring" ile metnin sonuna itiyordu (Fütûhât y = 7315–7584).
 *  - GZ-02 Bu metinde: telefon kabuğundaki ilerleme halkası bir düğmedir;
 *    dokununca alttan sayfa -- metnin KENDİ başlıkları, şimdiki işaretli,
 *    satıra dokunmak o başlığa iner -- ve Başa dön / Önceki / Sonraki.
 *    Sayfa tarihte kendi girdisini açar (GU.yuzeyKatmani): geri tuşu, Esc
 *    ve perde aynı tek adım.
 *  - YT-04 Çubuklar çekilir: okurken aşağı kaydırınca üst çubuk ve alt
 *    gezinme çekilir, yukarı kaydırınca geri gelir (html.okuma-cekik; CSS
 *    dikeyde uygular, sınıf yöne göre her yönelimde konur). İlerleme halkası
 *    çekilince de kalır.
 *  - GZ-03 Defterim yıldızı: araç çubuğundaki yıldız dairesi kavram
 *    defterinin var olan deposuna (dost-defter) yazar; yeni veri modeli yok.
 */
(function () {
  "use strict";
  if (window.DostOkuma) return;
  var HTML = document.documentElement;
  var I18n = window.DostI18n;
  var GU = window.DostGraphUtils;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function $(s, k) { return (k || document).querySelector(s); }
  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");

  var ETIKET = {
    bumetin: { tr: "Bu metinde", en: "In this text", pt: "Neste texto" },
    basa: { tr: "Başa dön", en: "Back to top", pt: "Voltar ao topo" },
    kisimSec: { tr: "Başka kısım seç", en: "Choose another part", pt: "Escolher outra parte" },
    bolum: { tr: "bölüm", en: "sections", pt: "seções" },
    kaldin: { tr: "Kaldığın yerdesin", en: "You are where you left off", pt: "Você está onde parou" },
    bastan: { tr: "Baştan", en: "From the start", pt: "Do início" },
    defterEkle: { tr: "Defterim'e ekle", en: "Add to Notebook", pt: "Adicionar ao Caderno" },
    defterCikar: { tr: "Defterim'den çıkar", en: "Remove from Notebook", pt: "Remover do Caderno" },
    defterEklendi: { tr: "Defterim'e eklendi", en: "Added to Notebook", pt: "Adicionado ao Caderno" },
    defterCikti: { tr: "Defterim'den çıkarıldı", en: "Removed from Notebook", pt: "Removido do Caderno" },
    kapat: { tr: "Kapat", en: "Close", pt: "Fechar" },
    onceki: { tr: "Önceki yerim", en: "Where I was", pt: "Onde eu estava" },
    baslikAd: { tr: "başlık", en: "heading", pt: "título" },
    ayarlar: { tr: "Ayarlar", en: "Settings", pt: "Configurações" },
    kitapta: { tr: "Kitapta", en: "In the book", pt: "No livro" },
    kitapLejant: {
      tr: "Her tur bir cilt. Işık: açık kısım · bulanık: henüz okunmadı · kuşak: sifr",
      en: "Each turn is a volume. Light: open part · blurred: not yet read · band: sifr",
      pt: "Cada volta é um volume. Luz: parte aberta · desfocado: ainda não lido · faixa: sifr",
    },
  };

  var GORUNUMLER = {
    futuhat: { wrap: "futuhat-wrap", article: "futuhat-article", baslik: ".futuhat-section__heading", hero: ".futuhat-hero__title", eyebrow: ".futuhat-hero__eyebrow", arac: ".futuhat-toolbar" },
    fusus: { wrap: "fusus-wrap", article: "fusus-article", baslik: ".fusus-section h3", hero: ".fusus-article__title", eyebrow: ".fusus-article__eyebrow", arac: ".fusus-article__head" },
    miskat: { wrap: "miskat-wrap", article: "miskat-article", baslik: null, hero: ".fusus-article__title", eyebrow: ".fusus-article__eyebrow", arac: ".fusus-article__head" },
  };
  var BLOK = "p, h1, h2, h3, h4, li, blockquote, figure";

  function gk(fn, yedek) { try { return fn(); } catch (e) { return yedek; } }

  // --- Ölçüler -------------------------------------------------------------
  function ustYukseklik() {
    var h = parseFloat(getComputedStyle(HTML).getPropertyValue("--app-header-height")) || 0;
    var serit = $(".fusus-serit");
    if (serit && serit.offsetParent && getComputedStyle(serit).position === "sticky") h += serit.offsetHeight;
    return h;
  }
  function aktifGorunum() {
    for (var g in GORUNUMLER) {
      var w = document.getElementById(GORUNUMLER[g].wrap);
      if (w && !w.hidden) return g;
    }
    return null;
  }

  // =========================================================================
  // GZ-01 Okuma yeri
  // =========================================================================
  var YER_ANAHTAR = "dost-okuma-yeri";
  var YER_SINIR = 80;
  function yerOku() {
    return gk(function () { var o = JSON.parse(localStorage.getItem(YER_ANAHTAR) || "{}"); return o && typeof o === "object" ? o : {}; }, {});
  }
  function yerYaz(o) {
    var anahtarlar = Object.keys(o);
    if (anahtarlar.length > YER_SINIR) {
      anahtarlar.sort(function (a, b) { return (o[a].t || 0) - (o[b].t || 0); });
      anahtarlar.slice(0, anahtarlar.length - YER_SINIR).forEach(function (k) { delete o[k]; });
    }
    gk(function () { localStorage.setItem(YER_ANAHTAR, JSON.stringify(o)); });
  }

  var durum = { gorunum: null, kayit: null, makale: null, hazir: false, geriYukle: false };
  var bekleyen = {};      // görünüm -> son geçerlilik zamanı: o zamana dek gelen ilk çizim eski yere dönebilir
  var BEKLE_ACILIS = 20000, BEKLE_GERI = 4000;
  function bekle(g, ms) { bekleyen[g] = Date.now() + ms; }
  var geriKur = false;
  var kullaniciDokundu = false;
  var yukleniyor = false; // dönüş denemeleri sürerken kayıt yazılmaz
  Object.keys(GORUNUMLER).forEach(function (g) { bekle(g, BEKLE_ACILIS); });

  function blokListesi() {
    return durum.makale ? Array.prototype.slice.call(durum.makale.querySelectorAll(BLOK)).filter(function (e) { return e.offsetParent !== null && !e.closest(".okuma-yeri-hap"); }) : [];
  }
  function simdikiYer() {
    var a = durum.makale;
    if (!a || !a.isConnected) return null;
    var ust = ustYukseklik();
    var ar = a.getBoundingClientRect();
    var docH = HTML.scrollHeight;
    // Başlangıçta ya da sonda saklanacak bir yer yok: kayıt silinir.
    if (ar.top > ust - 60) return { sil: true };
    if (window.scrollY + innerHeight >= docH - 140) return { sil: true };
    var bloklar = blokListesi();
    var secili = null, secTop = Infinity;
    for (var i = 0; i < bloklar.length; i++) {
      var r = bloklar[i].getBoundingClientRect();
      if (r.height && r.bottom > ust + 4 && r.top < secTop) { secili = bloklar[i]; secTop = r.top; if (r.top >= ust) break; }
    }
    if (!secili) return null;
    return { i: bloklar.indexOf(secili), ofs: Math.round(secTop - ust), n: bloklar.length, r: Math.round((window.scrollY / Math.max(1, docH - innerHeight)) * 1000) / 1000, t: Date.now() };
  }
  var kaydetZaman = null;
  function kaydet() {
    clearTimeout(kaydetZaman);
    kaydetZaman = null;
    if (!durum.hazir || yukleniyor || !durum.kayit || !durum.gorunum) return;
    // Makale başka bir kayıtla yeniden çizildiyse (kullanıcı kısım seçti) eski
    // kaydın anahtarına yeni metnin yeri yazılmaz.
    if (durum.makale && durum.makale.dataset.dostKaynak && durum.makale.dataset.dostKaynak !== String(durum.kayit)) return;
    var g = GORUNUMLER[durum.gorunum];
    var w = document.getElementById(g.wrap);
    if (!w || w.hidden) return;
    var yer = simdikiYer();
    if (!yer) return;
    var o = yerOku();
    var k = durum.gorunum + ":" + durum.kayit;
    if (yer.sil) { if (o[k]) { delete o[k]; yerYaz(o); } return; }
    o[k] = yer;
    yerYaz(o);
  }
  function kaydetPlanla() {
    if (kaydetZaman) return;
    kaydetZaman = setTimeout(kaydet, 350);
  }

  function yereDon(yer, bitince) {
    var iptal = false;
    yukleniyor = true;
    var birak = function () { iptal = true; kullaniciDokundu = true; };
    ["touchstart", "wheel", "keydown", "pointerdown"].forEach(function (e) { window.addEventListener(e, birak, { once: true, passive: true }); });
    var son = false;
    function uygula(sonDeneme) {
      if (iptal || !durum.makale || !durum.makale.isConnected) { if (sonDeneme) yukleniyor = false; return; }
      var bloklar = blokListesi();
      var hedef = null;
      if (bloklar.length && Math.abs(bloklar.length - yer.n) <= 2 && bloklar[yer.i]) {
        var ust = ustYukseklik();
        hedef = bloklar[yer.i].getBoundingClientRect().top + window.scrollY - ust - yer.ofs;
      } else if (typeof yer.r === "number") {
        hedef = yer.r * Math.max(0, HTML.scrollHeight - innerHeight);
      }
      if (hedef != null) {
        hedef = Math.max(0, hedef);
        if (Math.abs(hedef - window.scrollY) > 2) window.scrollTo({ top: hedef, behavior: "instant" });
        if (!son && hedef > 40) { son = true; if (bitince) bitince(); }
      }
      if (sonDeneme) yukleniyor = false;
    }
    // İlk karede (boyamadan önce) ve sonra: yazı tipi/ağ yüzünden boy değişebilir.
    requestAnimationFrame(function () { uygula(false); requestAnimationFrame(function () { uygula(false); }); });
    setTimeout(function () { uygula(false); }, 350);
    setTimeout(function () { uygula(false); }, 1000);
    setTimeout(function () { uygula(true); }, 2000);
  }

  // "Kaldığın yerdesin" + Baştan
  var hap = null, hapZaman = null;
  function hapKapat() {
    clearTimeout(hapZaman);
    if (hap) { hap.remove(); hap = null; }
  }
  function hapGoster() {
    hapKapat();
    hap = document.createElement("div");
    hap.className = "okuma-yeri-hap";
    hap.setAttribute("role", "status");
    hap.innerHTML = '<span class="okuma-yeri-hap__nokta" aria-hidden="true"></span><span class="okuma-yeri-hap__ad"></span>'
      + '<button type="button" class="okuma-yeri-hap__bastan"></button>';
    $(".okuma-yeri-hap__ad", hap).textContent = t(ETIKET.kaldin);
    $(".okuma-yeri-hap__bastan", hap).textContent = t(ETIKET.bastan);
    $(".okuma-yeri-hap__bastan", hap).addEventListener("click", function () {
      basaDon(true);
      hapKapat();
    });
    document.body.appendChild(hap);
    hapZaman = setTimeout(hapKapat, 6500);
  }
  // "Önceki yerim" (F07b, 2026-10-21, kullanıcı onayı): "Bu metinde" sayfasından bir başlığa,
  // başa ya da başka kısma sıçrayınca 6 sn boyunca eski yer bir daire olarak durur;
  // dokununca eski kaydırma yerine dönülür. Esc dairenin söner (bir adım).
  var oncekiYer = null, oncekiZaman = null;
  function oncekiKapat() {
    clearTimeout(oncekiZaman);
    if (oncekiYer) { oncekiYer.remove(); oncekiYer = null; }
  }
  function oncekiGoster(y, baslikNo) {
    oncekiKapat();
    if (Math.abs(window.scrollY - y) < 120) return;
    oncekiYer = document.createElement("button");
    oncekiYer.type = "button";
    oncekiYer.className = "okuma-yeri-hap okuma-yeri-hap--onceki";
    oncekiYer.innerHTML = '<span class="okuma-yeri-hap__nokta" aria-hidden="true"></span><span class="okuma-yeri-hap__ad"></span>';
    $(".okuma-yeri-hap__ad", oncekiYer).textContent = t(ETIKET.onceki) + (baslikNo > 0 ? " · " + baslikNo + ". " + t(ETIKET.baslikAd) : "");
    oncekiYer.addEventListener("click", function () {
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
      oncekiKapat();
    });
    document.body.appendChild(oncekiYer);
    oncekiZaman = setTimeout(oncekiKapat, 6000);
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { if (!oncekiYer) return false; oncekiKapat(); return true; });
  function makaleBasi(anlik) {
    var a = durum.makale;
    if (!a) return;
    var ust = ustYukseklik();
    var top = a.getBoundingClientRect().top + window.scrollY - ust - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  }
  function basaDon(kayitSil) {
    makaleBasi();
    if (kayitSil && durum.gorunum && durum.kayit) {
      var o = yerOku();
      delete o[durum.gorunum + ":" + durum.kayit];
      yerYaz(o);
    }
  }

  // history.scrollRestoration: okuma görünümü açıkken elle, başka yerde otomatik.
  function geriYuklemeAyarla() {
    var oku = !!aktifGorunum();
    gk(function () { if ("scrollRestoration" in history) history.scrollRestoration = oku ? "manual" : "auto"; });
  }
  Object.keys(GORUNUMLER).forEach(function (g) {
    var w = document.getElementById(GORUNUMLER[g].wrap);
    if (!w || !window.MutationObserver) return;
    new MutationObserver(function () {
      if (w.hidden) { bekle(g, BEKLE_ACILIS); if (durum.gorunum === g) durum.hazir = false; }
      geriYuklemeAyarla();
      cekikGuncelle();
    }).observe(w, { attributes: true, attributeFilter: ["hidden"] });
  });
  geriYuklemeAyarla();
  // Geri/ileri tuşuyla bir kayda dönülünce (yüzey girdileri hariç: onlar
  // popstate'i durdurur) o kaydın saklanan yeri geri verilir.
  window.addEventListener("popstate", function () {
    var g = aktifGorunum();
    if (g) bekle(g, BEKLE_GERI);
  });
  window.addEventListener("scroll", kaydetPlanla, { passive: true });
  window.addEventListener("pagehide", kaydet);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") kaydet(); });

  // =========================================================================
  // GZ-03 Defterim yıldızı
  // =========================================================================
  var DEFTER = "dost-defter";
  function defterOku() {
    return gk(function () { var a = JSON.parse(localStorage.getItem(DEFTER) || "[]"); return Array.isArray(a) ? a : []; }, []);
  }
  function defterYaz(a) { gk(function () { localStorage.setItem(DEFTER, JSON.stringify(a)); }); }
  function defterHref() { return location.origin + location.pathname; }
  function defterIndeks(a) {
    var h = defterHref();
    for (var i = 0; i < a.length; i++) {
      if (a[i].href === h || a[i].href === location.href) return i;
    }
    return -1;
  }
  var YILDIZ = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path d="M12 5.4l1.9 4 4.4.6-3.2 3 .8 4.4-3.9-2.1-3.9 2.1.8-4.4-3.2-3 4.4-.6Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  function yildizYaz(b) {
    var basili = defterIndeks(defterOku()) >= 0;
    b.setAttribute("aria-pressed", String(basili));
    var ad = t(basili ? ETIKET.defterCikar : ETIKET.defterEkle);
    b.setAttribute("aria-label", ad);
    b.title = ad;
  }
  function yildizlariTazele() {
    document.querySelectorAll(".okuma-yerimi").forEach(yildizYaz);
  }
  var toastEl = null, toastZaman = null;
  function toast(metin) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "futuhat-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = metin;
    toastEl.classList.add("futuhat-toast--visible");
    clearTimeout(toastZaman);
    toastZaman = setTimeout(function () { toastEl.classList.remove("futuhat-toast--visible"); }, 1800);
  }
  function yildizKoy(g, makale) {
    var cfg = GORUNUMLER[g];
    var arac = $(cfg.arac, makale);
    if (!arac || $(".okuma-yerimi", arac)) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = (g === "futuhat" ? "futuhat-toolbar__btn futuhat-toolbar__btn--icon " : "") + "okuma-yerimi";
    b.innerHTML = YILDIZ;
    yildizYaz(b);
    b.addEventListener("click", function () {
      var a = defterOku();
      var i = defterIndeks(a);
      if (i >= 0) a.splice(i, 1);
      else {
        var bas = $(cfg.hero, makale), ey = $(cfg.eyebrow, makale);
        a.unshift({ href: defterHref(), title: bas ? bas.textContent.trim() : document.title, eyebrow: ey ? ey.textContent.trim() : "", addedAt: Date.now() });
      }
      defterYaz(a);
      yildizYaz(b);
      toast(t(i >= 0 ? ETIKET.defterCikti : ETIKET.defterEklendi));
    });
    arac.appendChild(b);
  }
  window.addEventListener("storage", function (e) { if (e.key === DEFTER) yildizlariTazele(); });
  window.addEventListener("focus", yildizlariTazele);
  var dp = document.getElementById("defter-panel");
  if (dp && window.MutationObserver) new MutationObserver(yildizlariTazele).observe(dp, { attributes: true, attributeFilter: ["hidden"] });

  // =========================================================================
  // GZ-02 Bu metinde
  // =========================================================================
  var halka = null;
  function halkaKur() {
    var h = $(".uyg-ilerleme");
    if (!h || h.dataset.okumaBagli) { halka = h && h.dataset.okumaBagli ? h : halka; return; }
    halka = h;
    h.dataset.okumaBagli = "1";
    h.setAttribute("role", "button");
    h.setAttribute("tabindex", "0");
    h.setAttribute("aria-haspopup", "dialog");
    function etiket() {
      var p = h.getAttribute("aria-valuenow");
      if (p != null) { h.dataset.yuzde = p; }
      ["aria-valuenow", "aria-valuemin", "aria-valuemax"].forEach(function (a) { h.removeAttribute(a); });
      var ad = t(ETIKET.bumetin) + (h.dataset.yuzde ? " · %" + h.dataset.yuzde : "");
      if (h.getAttribute("aria-label") !== ad) h.setAttribute("aria-label", ad);
      if (h.title !== ad) h.title = ad;
    }
    etiket();
    if (window.MutationObserver) new MutationObserver(etiket).observe(h, { attributes: true, attributeFilter: ["aria-valuenow", "aria-label", "role"] });
    h.addEventListener("click", function () { sayfaAc(); });
    h.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sayfaAc(); } });
  }

  var sayfa = null, perde = null, katman = null, oncekiOdak = null;
  var kitapSarmal = null;
  function sayfaKapatGorunum() {
    if (kitapSarmal) { try { kitapSarmal.destroy(); } catch (e) { /* zaten yok */ } kitapSarmal = null; }
    if (sayfa) { sayfa.remove(); sayfa = null; }
    if (perde) { perde.remove(); perde = null; }
    if (oncekiOdak && oncekiOdak.isConnected) { try { oncekiOdak.focus({ preventScroll: true }); } catch (e) { /* odaklanamaz */ } }
    oncekiOdak = null;
  }
  // Kullanıcının kendi kapatışı (perde, Esc, eylem): görünüm kapanır, tarih girdisinden çıkılır.
  function sayfaKapat() {
    if (!sayfa) return false;
    sayfaKapatGorunum();
    if (katman) katman.bitti();
    return true;
  }
  function baslikHedef(el) {
    var top = el.getBoundingClientRect().top + window.scrollY - ustYukseklik() - 8;
    window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  }
  function sayfaAc() {
    if (sayfa || !durum.makale) return;
    var g = durum.gorunum && GORUNUMLER[durum.gorunum];
    if (!g) return;
    var a = durum.makale;
    var basliklar = g.baslik ? Array.prototype.slice.call(a.querySelectorAll(g.baslik)).filter(function (e) { return e.offsetParent !== null; }) : [];
    var ust = ustYukseklik();
    var simdi = -1;
    basliklar.forEach(function (h, i) { if (h.getBoundingClientRect().top - ust - 40 <= 0) simdi = i; });
    var yuzde = halka && halka.dataset.yuzde ? halka.dataset.yuzde : "0";
    oncekiOdak = document.activeElement;
    perde = document.createElement("div");
    perde.className = "okuma-perde";
    sayfa = document.createElement("section");
    sayfa.className = "okuma-sayfa";
    sayfa.setAttribute("role", "dialog");
    sayfa.setAttribute("aria-modal", "true");
    sayfa.setAttribute("aria-label", t(ETIKET.bumetin));
    var onceki = $(".okuma-gezinti__btn--onceki", a), sonraki = $(".okuma-gezinti__btn--sonraki", a);
    var ayarDugmesi = document.querySelector(".uyg-ayar-dugme");
    var parcalar = $("#futuhat-parts") && durum.gorunum === "futuhat" ? $("#futuhat-parts") : null;
    var h = '<div class="okuma-sayfa__tutamak" aria-hidden="true"></div>'
      + '<header class="okuma-sayfa__bas"><h2 class="okuma-sayfa__baslik"></h2><span class="okuma-sayfa__yuzde"></span></header>';
    // F02 (2026-10-21, kullanıcı onayı): Fütûhât'ta sayfa iki bölmeli -- "Bu metinde | Kitapta".
    // "Kitapta" kitabın kısım sarmalıdır (futuhat.js sarmalKur); çip listesi yedek olarak
    // "Başka kısım seç" ile durur.
    var seritVar = window.matchMedia && window.matchMedia("(min-width: 640px) and (max-width: 900px) and (min-height: 600px)").matches;   // F08: tablette sarmal zaten yan şeritte
    var kitapVar = !!(durum.gorunum === "futuhat" && window.DostFutuhatSarmal && !seritVar);
    if (kitapVar) h += '<div class="okuma-sekmeler" role="tablist">'
      + '<button type="button" role="tab" class="okuma-sekme is-simdi" id="okuma-sekme-metin" aria-selected="true" aria-controls="okuma-panel-metin" data-sekme="metin"></button>'
      + '<button type="button" role="tab" class="okuma-sekme" id="okuma-sekme-kitap" aria-selected="false" aria-controls="okuma-panel-kitap" tabindex="-1" data-sekme="kitap"></button></div>'
      + '<div id="okuma-panel-metin" role="tabpanel" aria-labelledby="okuma-sekme-metin">';
    if (basliklar.length) h += '<ol class="okuma-sayfa__liste">' + basliklar.map(function (_, i) {
      return '<li><button type="button" class="okuma-sat' + (i === simdi ? " is-simdi" : i < simdi ? " is-oku" : "") + '" data-i="' + i + '"'
        + (i === simdi ? ' aria-current="location"' : "") + '><span class="okuma-sat__d">' + (i + 1) + '</span><span class="okuma-sat__ad"></span></button></li>';
    }).join("") + "</ol>";
    h += '<div class="okuma-sayfa__eylemler">'
      + '<button type="button" class="okuma-eylem" data-e="basa"><span class="okuma-eylem__d" aria-hidden="true"></span><span class="okuma-eylem__ad"></span></button>'
      + (parcalar ? '<button type="button" class="okuma-eylem" data-e="kisim"><span class="okuma-eylem__d" aria-hidden="true"></span><span class="okuma-eylem__ad"></span></button>' : "")
      + (onceki ? '<button type="button" class="okuma-eylem" data-e="onceki"><span class="okuma-eylem__d" aria-hidden="true"></span><span class="okuma-eylem__ad"></span></button>' : "")
      + (sonraki ? '<button type="button" class="okuma-eylem" data-e="sonraki"><span class="okuma-eylem__d" aria-hidden="true"></span><span class="okuma-eylem__ad"></span></button>' : "")
      + (ayarDugmesi ? '<button type="button" class="okuma-eylem" data-e="ayarlar"><span class="okuma-eylem__d" aria-hidden="true"></span><span class="okuma-eylem__ad"></span></button>' : "")
      + "</div>";
    if (kitapVar) h += '</div><div id="okuma-panel-kitap" role="tabpanel" aria-labelledby="okuma-sekme-kitap" hidden></div>';
    sayfa.innerHTML = h;
    $(".okuma-sayfa__baslik", sayfa).textContent = t(ETIKET.bumetin);
    $(".okuma-sayfa__yuzde", sayfa).textContent = "%" + yuzde + (basliklar.length ? " · " + basliklar.length + " " + t(ETIKET.bolum) : "");
    if (kitapVar) {
      $("#okuma-sekme-metin", sayfa).textContent = t(ETIKET.bumetin);
      $("#okuma-sekme-kitap", sayfa).textContent = t(ETIKET.kitapta);
    }
    sayfa.querySelectorAll(".okuma-sat").forEach(function (b) { $(".okuma-sat__ad", b).textContent = basliklar[+b.dataset.i].textContent.trim(); });
    function eylemAd(e, metin) { var b = $('[data-e="' + e + '"] .okuma-eylem__ad', sayfa); if (b) b.textContent = metin; }
    eylemAd("basa", t(ETIKET.basa));
    eylemAd("kisim", t(ETIKET.kisimSec));
    eylemAd("ayarlar", t(ETIKET.ayarlar));
    function nav(b) { var y = $(".okuma-gezinti__yon", b), ti = $(".okuma-gezinti__baslik", b); return (y ? y.textContent.trim() : "") + (ti && ti.textContent.trim() ? " — " + ti.textContent.trim() : ""); }
    if (onceki) eylemAd("onceki", nav(onceki));
    if (sonraki) eylemAd("sonraki", nav(sonraki));
    document.body.appendChild(perde);
    document.body.appendChild(sayfa);
    perde.addEventListener("click", sayfaKapat);
    function sekmeSec(ad, odakla) {
      if (!kitapVar) return;
      var kitap = ad === "kitap";
      $("#okuma-panel-metin", sayfa).hidden = kitap;
      $("#okuma-panel-kitap", sayfa).hidden = !kitap;
      ["metin", "kitap"].forEach(function (x) {
        var d = $("#okuma-sekme-" + x, sayfa), ac = x === ad;
        d.setAttribute("aria-selected", ac ? "true" : "false");
        d.tabIndex = ac ? 0 : -1;
        d.classList.toggle("is-simdi", ac);
        if (ac && odakla) { try { d.focus({ preventScroll: true }); } catch (er) { /* odaklanamaz */ } }
      });
      if (kitap && !kitapSarmal) {
        var kap = $("#okuma-panel-kitap", sayfa);
        kap.innerHTML = '<div class="okuma-kitap__sarmal"></div><p class="okuma-kitap__lejant"></p>';
        $(".okuma-kitap__lejant", kap).textContent = t(ETIKET.kitapLejant);
        kitapSarmal = window.DostFutuhatSarmal.kur($(".okuma-kitap__sarmal", kap), function () {
          // Seçilen kısım kısım sarmalının kendi onSec'i ile açılır; sayfa kapanır.
          sayfaKapat();
        });
        if (!kitapSarmal) { kap.hidden = true; sekmeSec("metin"); }
      }
      if (sayfa.scrollHeight > sayfa.clientHeight) sayfa.scrollTop = 0;
    }
    $(".okuma-sekmeler", sayfa) && $(".okuma-sekmeler", sayfa).addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      sekmeSec(e.target.dataset.sekme === "metin" ? "kitap" : "metin", true);
    });
    // Basit odak tuzağı: Tab sayfanın dışına (arkadaki metne) kaçmasın.
    sayfa.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(sayfa.querySelectorAll('button, [tabindex="0"]'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var ilkB = f[0], sonB = f[f.length - 1];
      if (e.shiftKey && document.activeElement === ilkB) { e.preventDefault(); sonB.focus(); }
      else if (!e.shiftKey && document.activeElement === sonB) { e.preventDefault(); ilkB.focus(); }
    });
    sayfa.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.sekme) { sekmeSec(b.dataset.sekme, true); return; }
      var y0 = window.scrollY;
      if (b.dataset.i != null) {
        var hedef = basliklar[+b.dataset.i];
        sayfaKapat();
        if (hedef) { baslikHedef(hedef); oncekiGoster(y0, simdi + 1); }
        return;
      }
      var ey = b.dataset.e;
      sayfaKapat();
      if (ey === "basa") { makaleBasi(); oncekiGoster(y0, simdi + 1); }
      else if (ey === "kisim" && parcalar) { baslikHedef(parcalar); oncekiGoster(y0, simdi + 1); }
      else if (ey === "onceki" && onceki) onceki.click();
      else if (ey === "sonraki" && sonraki) sonraki.click();
      else if (ey === "ayarlar" && ayarDugmesi) ayarDugmesi.click();
    });
    if (!katman && GU && GU.yuzeyKatmani) katman = GU.yuzeyKatmani("bu-metinde", sayfaKapatGorunum);
    if (katman) katman.ac();
    var ilk = $(".okuma-sat.is-simdi", sayfa) || $("button", sayfa);
    if (ilk) {
      try { ilk.focus({ preventScroll: true }); } catch (e) { /* odaklanamaz */ }
      // Şimdiki başlık sayfanın üst üçte birine gelir (yalnız sayfanın kendi kaydırması).
      if (sayfa.scrollHeight > sayfa.clientHeight) sayfa.scrollTop = Math.max(0, ilk.offsetTop - sayfa.clientHeight / 3);
    }
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return sayfaKapat(); }, { oncelikli: true });

  // =========================================================================
  // YT-04 Çubuklar çekilir
  // =========================================================================
  var sonY = window.scrollY, birikim = 0, cekik = false, cekikZaman = null;
  function cekikUygun() {
    // Kabuk V2'de (2026-10-16) çubuk çekme HER kaydırılan görünüme genellendi ve
    // mantığı kabukta (uygulama-kabugu.js cekikKur): bu dosya yalnız okuma
    // metinlerinde yüklendiği için tek yer orası. Burada V2'de devre dışı;
    // eski kabukta (?kabuk=eski) aynen çalışır.
    if (HTML.classList.contains("uyg-v2")) return false;
    if (!HTML.classList.contains("dost-uygulama") || !HTML.classList.contains("uyg-okuyor")) return false;
    if (sayfa) return false;
    if ($(".uyg-sayfa:not([hidden])") || $(".uyg-perde:not([hidden])")) return false;
    // Kabuğun dış katmanları (Ara, Defterim, çekmece, Aa hapı) açıkken çubuklar yerinde
    // (uygulama-kabugu.js uyg-dis-katman sınıfını koyar; mobil kabuk taraması K05/K10/K11).
    if (HTML.classList.contains("uyg-dis-katman")) return false;
    return true;
  }
  function cekikAyarla(ac) {
    if (cekik === ac) return;
    cekik = ac;
    HTML.classList.toggle("okuma-cekik", ac);
  }
  function cekikGuncelle() {
    if (!cekikUygun()) cekikAyarla(false);
  }
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    var d = y - sonY;
    sonY = y;
    if (!cekikUygun()) { cekikAyarla(false); birikim = 0; return; }
    if (y < 80) { cekikAyarla(false); birikim = 0; return; }
    // Metnin sonuna gelindi: Önceki/Sonraki ve alt gezinme erişilsin diye çubuklar döner.
    if (y + innerHeight >= HTML.scrollHeight - 200) { cekikAyarla(false); birikim = 0; return; }
    // Yön değişince birikim sıfırlanır; küçük titremeler çubuğu oynatmaz.
    if ((d > 0) !== (birikim > 0)) birikim = 0;
    birikim += d;
    if (birikim > 24) cekikAyarla(true);
    else if (birikim < -10) cekikAyarla(false);
  }, { passive: true });
  // Odak çubukların içine gelirse (klavye, ekran okuyucu) çubuklar geri gelir.
  document.addEventListener("focusin", function (e) {
    if (cekik && e.target.closest && e.target.closest(".app-header, .uyg-alt")) cekikAyarla(false);
  });
  new MutationObserver(cekikGuncelle).observe(HTML, { attributes: true, attributeFilter: ["class"] });

  // =========================================================================
  // Görünümlerin çağırdığı tek kapı
  // =========================================================================
  window.DostOkuma = {
    // otomatik: bu çizim kullanıcının bir kısım seçmesinden değil, görünümün
    // kendi açılışından (adres, kaldığın yer, yeniden çizim) geliyor.
    cizildi: function (gorunum, kayit, makale, otomatik) {
      if (!GORUNUMLER[gorunum] || !makale) return;
      durum.gorunum = gorunum;
      durum.kayit = kayit;
      durum.makale = makale;
      durum.hazir = true;
      halkaKur();
      yildizKoy(gorunum, makale);
      var sira = (bekleyen[gorunum] || 0) > Date.now();
      bekleyen[gorunum] = 0;
      if (!sira) return;
      if (!otomatik) return; // kullanıcının seçtiği kayıt makalenin başından okunur
      var yer = yerOku()[gorunum + ":" + kayit];
      if (!yer || yer.sil) return;
      yereDon(yer, hapGoster);
    },
    sayfaAc: sayfaAc,
    sayfaKapat: sayfaKapat,
    // Yatayda alt kenardaki tutamak (uygulama-kabugu.js, K05) çekilen çubukları geri getirir.
    cubuklariGetir: function () { cekikAyarla(false); birikim = 0; },
  };
  // Dil değişince (görünümler yeniden çizer) yıldız etiketleri yeni dilde yazılır.
  if (window.MutationObserver) new MutationObserver(function () { yildizlariTazele(); }).observe(HTML, { attributes: true, attributeFilter: ["lang"] });
  // Baskıdan önce katlanan "Kaynaklar ve ilgili" blokları açılır (Fütûhât, telefon düzeni).
  window.addEventListener("beforeprint", function () {
    document.querySelectorAll("details.futuhat-ek").forEach(function (d) { d.dataset.baskiOncesi = d.open ? "1" : "0"; d.open = true; });
  });
  window.addEventListener("afterprint", function () {
    document.querySelectorAll("details.futuhat-ek").forEach(function (d) { d.open = d.dataset.baskiOncesi === "1"; });
  });
})();
