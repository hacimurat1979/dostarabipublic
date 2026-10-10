/* Uygulama kabuğu (2026-10-10, mobil kaşif dalgası; kullanıcı onayı:
 * "hepsi uygulansın").
 *
 * Kullanıcının gözlemi: "mobil bir web sitesinin telefonda açılmış hâli gibi,
 * uygulama gibi durmuyor." Bu dosya YALNIZ telefonda (≤640px) ya da Android
 * uygulamasında (TWA: index.html'deki window.__dostUygulama -- ?kaynak=twa /
 * android-app:// yönlendireni, oturum boyunca sessionStorage -- ya da
 * display-mode: standalone) <html>'e `dost-uygulama` sınıfını koyar; bütün
 * görünüş style.css'teki `html.dost-uygulama` kurallarındadır. Masaüstünde
 * hiçbir şey değişmez (sınıf yok, öğeler gizli). Sınıf ilk boyamadan önce
 * index.html'in gövde başındaki satır-içi betikte de konur (sıçrama olmasın);
 * burada ekran yönü / genişlik değişince yeniden hesaplanır.
 *
 * Parçalar:
 *  - Alt gezinme: Harita · Okuma · Ara · Defterim · Daha. Her biri sitenin
 *    VAR OLAN bir denetimine bağlı (çekmece bağlantısı, arama düğmesi, defter
 *    düğmesi) -- yeni bir davranış icat edilmedi, yeri değişti.
 *  - Üst çubuk: geri dairesi (uygulama içinde geri gidilecek bir adım ya da
 *    açık bir sayfa/panel varsa) + yer adı (çekmeceyi açan ☰ düğmesinin
 *    kendisi) + arama + okuma ilerlemesi halkası (yalnız okuma metinlerinde).
 *  - "Daha" sayfası: ayarlar (dil, tema, yazı boyutu, sessiz mod, şaşırt,
 *    çevrimdışı okuma -- çekmecedeki gerçek satır buraya taşınır, aynı düğme
 *    aynı işi yapar) ve bölümler (çekmecenin bağlantıları).
 *  - Ayrıntı paneli alttan açılan sayfa; aşağı çekince kapanır, arkadaki
 *    perdeye dokununca da. Okuma/Daha sayfaları da aşağı çekince kapanır.
 *  - Fütûhât/Füsûs/Mişkât'ta yana kaydırarak önceki/sonraki (metnin sonundaki
 *    gerçek önceki/sonraki düğmelerine bağlı).
 *
 * Hareketler @use-gesture/vanilla'nın DragGesture'ıyla (eksen kilidi, eşik,
 * hız): assets/vendor/use-gesture.min.js, view-loader.js'in VENDOR
 * haritasından yalnız kabuk açıkken tembel iner. İnmezse hareketler yok ama
 * her birinin düğme/klavye karşılığı yerinde: Esc (bir adım), kapat düğmesi,
 * perde, geri dairesi, metnin sonundaki önceki/sonraki düğmeleri.
 * Tekerleğe hiç dokunulmaz (yalın tekerlek yakınlaştırmaz; ETKILESIM_DILI).
 *
 * Esc bir adım: önce açık sayfa (Daha / Okuma), sonra panel (ortak zincir).
 */
(function () {
  "use strict";
  if (window.__uygulamaKabugu) return;
  window.__uygulamaKabugu = true;
  var HTML = document.documentElement;
  var I18n = window.DostI18n;
  var GU = window.DostGraphUtils;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function $(s, k) { return (k || document).querySelector(s); }
  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");

  // --- Ne zaman? ------------------------------------------------------------
  // Telefon: dar ekran, ya da yatay tutulmuş telefon (dokunmatik + alçak ekran;
  // tablet yatayda 520 px'ten yüksek kalır, masaüstü kabuğunu korur).
  var mq = window.matchMedia("(max-width: 640px), (pointer: coarse) and (max-height: 520px)");
  var twa = window.__dostUygulama === true;
  try { twa = twa || window.matchMedia("(display-mode: standalone)").matches; } catch (e) { /* eski tarayıcı */ }
  function acikMi() { return HTML.classList.contains("dost-uygulama"); }
  function uygula() {
    HTML.classList.toggle("dost-uygulama", twa || mq.matches);
    if (!acikMi()) sayfaKapat();
    guncelle();
    if (acikMi()) hareketleriKur();
  }

  // --- Simgeler (hepsi daire temelli) ----------------------------------------
  var S = {
    harita: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="4" r="2" fill="var(--page-plane)" stroke="currentColor" stroke-width="1.6"/>',
    okuma: '<path d="M12 6.5C10 5.2 7.4 4.8 4.5 5.2v12.6c2.9-.4 5.5 0 7.5 1.3 2-1.3 4.6-1.7 7.5-1.3V5.2c-2.9-.4-5.5 0-7.5 1.3Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><line x1="12" y1="6.5" x2="12" y2="19" stroke="currentColor" stroke-width="1.5"/>',
    ara: '<circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><line x1="15" y1="15" x2="20" y2="20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    defter: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 7.6l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>',
    daha: '<circle cx="6" cy="14" r="1.8" fill="currentColor"/><circle cx="12" cy="10" r="1.8" fill="currentColor"/><circle cx="18" cy="14" r="1.8" fill="currentColor"/>',
    geri: '<path d="M14.5 6.5 9 12l5.5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  function svg(ad, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 22) + '" height="' + (w || 22) + '" aria-hidden="true">' + S[ad] + "</svg>"; }

  var ETIKET = {
    harita: { tr: "Harita", en: "Map", pt: "Mapa" },
    okuma: { tr: "Okuma", en: "Reading", pt: "Leitura" },
    ara: { tr: "Ara", en: "Search", pt: "Buscar" },
    defter: { tr: "Defterim", en: "Notebook", pt: "Caderno" },
    daha: { tr: "Daha", en: "More", pt: "Mais" },
    geri: { tr: "Geri", en: "Back", pt: "Voltar" },
    gezinti: { tr: "Uygulama gezintisi", en: "App navigation", pt: "Navegação do app" },
    bolumler: { tr: "Bölümler", en: "Sections", pt: "Seções" },
    ayarlar: { tr: "Ayarlar", en: "Settings", pt: "Configurações" },
    dil: { tr: "Dil", en: "Language", pt: "Idioma" },
    tema: { tr: "Tema", en: "Theme", pt: "Tema" },
    acik: { tr: "Aydınlık", en: "Light", pt: "Claro" },
    koyu: { tr: "Karanlık", en: "Dark", pt: "Escuro" },
    yazi: { tr: "Yazı boyutu", en: "Text size", pt: "Tamanho do texto" },
    kucult: { tr: "Yazıyı küçült", en: "Smaller text", pt: "Texto menor" },
    buyut: { tr: "Yazıyı büyüt", en: "Larger text", pt: "Texto maior" },
    sessiz: { tr: "Sessiz mod", en: "Quiet mode", pt: "Modo silencioso" },
    sasirt: { tr: "Beni şaşırt", en: "Surprise me", pt: "Surpreenda-me" },
    cevrim: { tr: "Çevrimdışı okuma", en: "Offline reading", pt: "Leitura offline" },
    kitaplar: { tr: "Okunan metinler", en: "Texts we read", pt: "Textos lidos" },
    ilerleme: { tr: "Okuma ilerlemesi", en: "Reading progress", pt: "Progresso de leitura" },
  };

  // --- Alt gezinme -----------------------------------------------------------
  var alt = document.createElement("nav");
  alt.className = "uyg-alt";
  alt.innerHTML = ["harita", "okuma", "ara", "defter", "daha"].map(function (k) {
    return '<button type="button" class="uyg-alt__oge" data-uyg="' + k + '">' + svg(k) + '<span class="uyg-alt__ad" data-etiket="' + k + '"></span></button>';
  }).join("");
  document.body.appendChild(alt);

  // Perde: açık sayfanın arkasındaki içerik perdelenir (matlık = perdelenme).
  var perde = document.createElement("div");
  perde.className = "uyg-perde";
  perde.hidden = true;
  document.body.appendChild(perde);

  // --- Okuma sayfası (üç metin) ----------------------------------------------
  var okuma = document.createElement("section");
  okuma.className = "uyg-sayfa uyg-sayfa--okuma";
  okuma.hidden = true;
  okuma.setAttribute("role", "dialog");
  okuma.innerHTML = '<div class="uyg-tutamak" aria-hidden="true"></div><h2 class="uyg-sayfa__baslik" data-etiket="kitaplar"></h2><div class="uyg-kitaplar"></div>';
  document.body.appendChild(okuma);
  var KITAPLAR = [["futuhat-btn", "F"], ["fusus-btn", "Fs"], ["miskat-btn", "M"]];
  function kitaplariCiz() {
    $(".uyg-kitaplar", okuma).innerHTML = KITAPLAR.map(function (k) {
      var a = document.getElementById(k[0]);
      if (!a) return "";
      return '<button type="button" class="uyg-kitap" data-kapi="' + k[0] + '"><span class="uyg-kitap__daire">' + k[1] + '</span><span class="uyg-kitap__ad">' + a.textContent.trim() + "</span></button>";
    }).join("");
  }

  // --- Daha sayfası (ayarlar + çevrimdışı + bölümler) ------------------------
  var daha = document.createElement("section");
  daha.className = "uyg-sayfa uyg-sayfa--daha";
  daha.hidden = true;
  daha.setAttribute("role", "dialog");
  daha.innerHTML = '<div class="uyg-tutamak" aria-hidden="true"></div><div class="uyg-daha__ayar"></div>'
    + '<div class="uyg-ayar uyg-ayar--cevrim" hidden><span class="uyg-ayar__ad" data-etiket="cevrim"></span><div class="uyg-cevrim-yuva"></div></div>'
    + '<div class="uyg-daha__bolum"></div>';
  document.body.appendChild(daha);
  var dahaAyar = $(".uyg-daha__ayar", daha);
  var dahaBolum = $(".uyg-daha__bolum", daha);
  var cevrimSatir = $(".uyg-ayar--cevrim", daha);
  var cevrimYuva = $(".uyg-cevrim-yuva", daha);
  // Çevrimdışı satırı (assets/cevrimdisi.js) tek: Daha açıkken buraya taşınır,
  // kapanınca çekmecedeki yerine döner. Düğme, halka ve "Kaldır" aynı
  // dinleyicilerle çalışır -- ikinci bir kopya (ve bağlanmamış düğme) yok.
  var cevrim = document.getElementById("cevrimdisi");
  var cevrimEv = cevrim && cevrim.parentNode, cevrimSonraki = cevrim && cevrim.nextSibling;
  function cevrimTasi(iceri) {
    if (!cevrim || !cevrimEv) return;
    if (iceri) {
      cevrimSatir.hidden = cevrim.hidden; // tarayıcı desteklemiyorsa satır yok
      if (cevrim.parentNode !== cevrimYuva) cevrimYuva.appendChild(cevrim);
      if (window.DostCevrimdisi && window.DostCevrimdisi.hazirla) window.DostCevrimdisi.hazirla();
    } else if (cevrim.parentNode !== cevrimEv) {
      cevrimEv.insertBefore(cevrim, cevrimSonraki && cevrimSonraki.parentNode === cevrimEv ? cevrimSonraki : null);
    }
  }

  function dahaCiz() {
    dahaBolum.innerHTML = '<h2 class="uyg-sayfa__baslik">' + t(ETIKET.bolumler) + "</h2>"
      + Array.prototype.map.call(document.querySelectorAll("#nav-drawer .nav-drawer__group"), function (g) {
        var bas = g.querySelector(".nav-drawer__heading");
        var ogeler = Array.prototype.map.call(g.querySelectorAll("a.btn-ghost[id]"), function (a) {
          return '<button type="button" class="uyg-bolum' + (a.classList.contains("btn-ghost--active") ? " is-aktif" : "") + '" data-kapi="' + a.id + '">' + a.textContent.trim() + "</button>";
        }).join("");
        return '<div class="uyg-grup"><h3 class="uyg-grup__ad">' + (bas ? bas.textContent.trim() : "") + '</h3><div class="uyg-grup__ogeler">' + ogeler + "</div></div>";
      }).join("");
    var dil = (I18n && I18n.getLang && I18n.getLang()) || "tr";
    var koyu = document.body.getAttribute("data-theme") === "dark";
    var sm = document.getElementById("sessiz-mod-toggle");
    var su = document.getElementById("surprise-toggle");
    dahaAyar.innerHTML = '<h2 class="uyg-sayfa__baslik">' + t(ETIKET.ayarlar) + "</h2>"
      + '<div class="uyg-ayar"><span class="uyg-ayar__ad">' + t(ETIKET.dil) + '</span><span class="uyg-ayar__denetim">'
      + ["tr", "en", "pt"].map(function (l) { return '<button type="button" class="uyg-daire' + (l === dil ? " is-aktif" : "") + '" data-dil="' + l + '" aria-pressed="' + (l === dil) + '">' + l.toUpperCase() + "</button>"; }).join("")
      + "</span></div>"
      + '<div class="uyg-ayar"><span class="uyg-ayar__ad">' + t(ETIKET.tema) + '</span><span class="uyg-ayar__denetim"><button type="button" class="uyg-anahtar" data-eylem="tema" aria-pressed="' + koyu + '"><span class="uyg-anahtar__iz"><span class="uyg-anahtar__top"></span></span><span>' + t(koyu ? ETIKET.koyu : ETIKET.acik) + "</span></button></span></div>"
      + '<div class="uyg-ayar"><span class="uyg-ayar__ad">' + t(ETIKET.yazi) + '</span><span class="uyg-ayar__denetim"><button type="button" class="uyg-daire" data-eylem="kucult" aria-label="' + t(ETIKET.kucult) + '">A−</button><button type="button" class="uyg-daire" data-eylem="buyut" aria-label="' + t(ETIKET.buyut) + '">A+</button></span></div>'
      + (sm ? '<div class="uyg-ayar"><span class="uyg-ayar__ad">' + t(ETIKET.sessiz) + '</span><span class="uyg-ayar__denetim"><button type="button" class="uyg-anahtar" data-eylem="sessiz" aria-label="' + t(ETIKET.sessiz) + '" aria-pressed="' + (sm.getAttribute("aria-pressed") === "true") + '"><span class="uyg-anahtar__iz"><span class="uyg-anahtar__top"></span></span></button></span></div>' : "")
      + (su ? '<div class="uyg-ayar"><span class="uyg-ayar__ad">' + t(ETIKET.sasirt) + '</span><span class="uyg-ayar__denetim"><button type="button" class="uyg-daire" data-eylem="sasirt" aria-label="' + t(ETIKET.sasirt) + '">' + su.innerHTML + "</button></span></div>" : "");
    if (window.DostFontScale) window.DostFontScale.bindFontScaleButtons($('[data-eylem="kucult"]', daha), $('[data-eylem="buyut"]', daha));
  }

  // --- Sayfa aç/kapa ---------------------------------------------------------
  // Okuma/Daha sayfası açılınca tarihte kendi girdisi olur (adres aynı,
  // durum dostKatman): Android'in geri tuşu YALNIZ sayfayı kapatır; Esc,
  // perde, aşağı çekme, alt çubuktaki aynı düğme ve geri dairesi de aynı
  // yoldan (history.back()) kapatır -- geri tuşu ile Esc aynı tek adımdır,
  // ölü adım kalmaz. İleri tuşu o girdiye gelirse sayfa yeniden açılır.
  // Sayfadan başka bir yere gidilirse (bölüm kapısı, şaşırt) yeni adres
  // katman girdisinin YERİNE yazılır (graph-utils.js tarih kaydı). Bu
  // girdilerin popstate'i görünümün yönlendiricisine (ontology.js) hiç
  // ulaşmaz: bu dinleyici ondan önce kurulur ve olayı durdurur.
  var acikSayfa = null;
  var oncekiOdak = null;
  var katmanYolu = null;          // katman girdisinin adresi
  var katmanAltYolu = null;       // girdinin altındaki sayfanın adresi (açılıştaki)
  // Sayfa açıkken kaydırma yeri (dil değişimi okunan yeri korumak için
  // kaydırabilir). Katman girdisinden çıkarken tarayıcı alttaki girdinin
  // ESKİ kaydırma yerini geri yükler; okur yerinden oynamasın diye bu yere
  // dönülür.
  var katmanY = 0;
  window.addEventListener("scroll", function () { if (acikSayfa) katmanY = window.scrollY; }, { passive: true });
  function yerindeKal() {
    var y = katmanY;
    window.scrollTo({ top: y, behavior: "instant" });
    requestAnimationFrame(function () { if (Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: "instant" }); });
  }
  var katmanGeriBekleniyor = false, katmanGeriZaman = null;
  function katmanAdi(el) { return el === daha ? "daha" : "okuma"; }
  function katmanGirdisiBizim() { return !!(GU && GU.tarihKatmani && GU.tarihKatmani()); }
  function simdikiYol() { return location.pathname + location.search; }
  function buradaMi() { return simdikiYol() === katmanYolu; }
  // Sayfa açıkken dil değiştiyse (/esma/ -> /en/esma/) yalnız katman girdisinin
  // adresi değişti; altındaki girdiye dönünce o da yeni dilin adresine çekilir.
  function katmaninAltindaMi() {
    if (buradaMi()) return true;
    if (simdikiYol() !== katmanAltYolu) return false;
    try { history.replaceState(history.state, "", katmanYolu); } catch (e) { /* eski tarayıcı */ }
    return true;
  }
  function sayfaAc(el, tarihsiz) {
    if (acikSayfa && acikSayfa !== el) gizle(acikSayfa, true);
    if (el === daha) { dahaCiz(); cevrimTasi(true); }
    if (el === okuma) kitaplariCiz();
    if (!acikSayfa) { oncekiOdak = document.activeElement; katmanY = window.scrollY; }
    el.hidden = false;
    el.style.transform = "";
    acikSayfa = el;
    if (!tarihsiz) {
      try {
        if (katmanGirdisiBizim()) history.replaceState({ dostKatman: katmanAdi(el) }, "");
        else { katmanAltYolu = simdikiYol(); history.pushState({ dostKatman: katmanAdi(el) }, ""); }
      } catch (e) { /* eski tarayıcı: katman tarihsiz açılır */ }
    }
    katmanYolu = location.pathname + location.search;
    guncelle();
    var ilk = el.querySelector("button");
    if (ilk) ilk.focus({ preventScroll: true });
  }
  // Yalnız görünüş: sayfayı gizler. sessiz: odak geri verilmez (yerine başka
  // bir şey açılıyor).
  function gizle(el, sessiz) {
    el.hidden = true;
    el.style.transform = "";
    if (el === daha) cevrimTasi(false);
    if (acikSayfa === el) acikSayfa = null;
    guncelle();
    if (!sessiz && oncekiOdak && oncekiOdak.isConnected && el.contains(document.activeElement)) {
      try { oncekiOdak.focus({ preventScroll: true }); } catch (e) { /* odaklanamaz */ }
    }
  }
  // Katman girdisi hâlâ duruyorsa ondan bir adım geri (popstate'i bu dosya yutar).
  function katmanGirdisiniBirak() {
    if (!katmanGirdisiBizim() || katmanGeriBekleniyor) return;
    katmanGeriBekleniyor = true;
    clearTimeout(katmanGeriZaman);
    katmanGeriZaman = setTimeout(function () { katmanGeriBekleniyor = false; }, 1500);
    history.back();
  }
  // Bir adım geri: Esc, perde, aşağı çekme, alt çubuktaki aynı düğme, geri dairesi.
  function sayfaKapat(sessiz) {
    if (!acikSayfa) return false;
    gizle(acikSayfa, sessiz);
    katmanGirdisiniBirak();
    return true;
  }
  // Sayfadaki bir eylemle kapanış: eylem yeni bir adres açtıysa o adres
  // katman girdisinin yerine geçmiştir; açmadıysa katman girdisinden çıkılır.
  function eylemleKapat(fn) {
    if (acikSayfa) gizle(acikSayfa, true);
    fn();
    katmanGirdisiniBirak();
  }
  function panel() { return document.getElementById("detail-panel"); }
  function panelAcik() { var p = panel(); return !!(p && !p.hidden); }
  function paneliKapat() { var c = document.getElementById("detail-close"); if (c) c.click(); }
  function tikla(id) { var a = document.getElementById(id); if (a) a.click(); }
  function kapiAc(id) { eylemleKapat(function () { tikla(id); }); }

  // Bu dinleyici ontology.js'inkinden ÖNCE kurulur (betik sırası).
  window.addEventListener("popstate", function (e) {
    var k = GU && GU.tarihKatmani ? GU.tarihKatmani() : null;
    if (katmanGeriBekleniyor) {
      katmanGeriBekleniyor = false;
      clearTimeout(katmanGeriZaman);
      if (katmaninAltindaMi()) { e.stopImmediatePropagation(); yerindeKal(); guncelle(); return; }
    }
    if (acikSayfa && !k && katmaninAltindaMi()) {
      // Geri tuşu açık sayfanın girdisinden çıktı: yalnız sayfa kapanır.
      gizle(acikSayfa);
      e.stopImmediatePropagation();
      yerindeKal();
      return;
    }
    if (k && katmanYolu && buradaMi()) {
      // İleri tuşu bir katman girdisine geldi: aynı adreste sayfa yeniden açılır.
      e.stopImmediatePropagation();
      if (acikMi()) sayfaAc(k === "daha" ? daha : okuma, true);
      return;
    }
    // Başka bir adrese gidildi: açık sayfa onun üstünde asılı kalmaz.
    if (acikSayfa) gizle(acikSayfa, true);
    setTimeout(guncelle, 0);
  });
  // Sayfa, katman girdisi açıkken yenilendiyse: sayfa yeniden açılır.
  document.addEventListener("DOMContentLoaded", function () {
    var k = katmanGirdisiBizim() && GU.tarihKatmani();
    if (k && acikMi() && !acikSayfa) sayfaAc(k === "daha" ? daha : okuma, true);
  });

  alt.addEventListener("click", function (e) {
    var b = e.target.closest(".uyg-alt__oge");
    if (!b) return;
    var k = b.dataset.uyg;
    if (k === "harita") kapiAc("ontology-btn");
    else if (k === "okuma") { if (acikSayfa === okuma) sayfaKapat(); else sayfaAc(okuma); }
    else if (k === "daha") { if (acikSayfa === daha) sayfaKapat(); else sayfaAc(daha); }
    else if (k === "ara") eylemleKapat(function () { tikla("search-toggle"); });
    else if (k === "defter") eylemleKapat(function () { tikla("defter-toggle"); });
  });
  okuma.addEventListener("click", function (e) { var b = e.target.closest("[data-kapi]"); if (b) kapiAc(b.dataset.kapi); });
  daha.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || cevrimYuva.contains(b)) return; // çevrimdışı satırı kendi dinleyicileriyle
    if (b.dataset.kapi) { kapiAc(b.dataset.kapi); return; }
    if (b.dataset.dil) {
      var gercek = Array.prototype.find.call(document.querySelectorAll("#lang-switch .lang-btn"), function (x) { return x.textContent.trim().toLowerCase() === b.dataset.dil; });
      if (gercek) gercek.click();
      katmanYolu = location.pathname + location.search; // dil öneki adresi değiştirebilir
      dahaCiz();
      var yeni = $('[data-dil="' + b.dataset.dil + '"]', daha);
      if (yeni) yeni.focus({ preventScroll: true });
      return;
    }
    var e2 = b.dataset.eylem;
    if (e2 === "tema") {
      tikla("theme-toggle");
      dahaCiz();
      var tb = $('[data-eylem="tema"]', daha);
      if (tb) tb.focus({ preventScroll: true });
    }
    else if (e2 === "sessiz") kapiAc("sessiz-mod-toggle");
    else if (e2 === "sasirt") kapiAc("surprise-toggle");
  });
  perde.addEventListener("click", function () {
    if (sayfaKapat()) return;
    if (panelAcik()) paneliKapat();
  });
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return sayfaKapat(); }, { oncelikli: true });

  // --- Üst çubuk: geri dairesi + okuma ilerlemesi ----------------------------
  var controls = $(".app-header__controls");
  var geri = document.createElement("button");
  geri.type = "button";
  geri.className = "uyg-geri";
  geri.innerHTML = svg("geri", 20);
  if (controls) controls.insertBefore(geri, controls.firstChild);
  var halka = document.createElement("div");
  halka.className = "uyg-ilerleme";
  halka.setAttribute("role", "progressbar");
  halka.setAttribute("aria-valuemin", "0");
  halka.setAttribute("aria-valuemax", "100");
  halka.innerHTML = '<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><circle class="uyg-ilerleme__iz" cx="14" cy="14" r="11"/><circle class="uyg-ilerleme__dolu" cx="14" cy="14" r="11"/></svg>';
  if (controls) controls.appendChild(halka);
  // Uygulama içi adım: graph-utils.js'in tarih kaydı (dostAdim). Geri dairesi
  // yalnız geri gidilecek bir şey varken görünür (bağlanmamış düğme olmasın):
  // açık sayfa, açık panel ya da uygulama içinde açılmış bir adres.
  function derinlik() { return GU && GU.tarihAdimi ? GU.tarihAdimi() : 0; }
  geri.addEventListener("click", function () {
    if (sayfaKapat()) return;
    if (panelAcik() && derinlik() === 0) { paneliKapat(); return; }
    if (derinlik() > 0) history.back();
  });

  var OKUMA_MAKALE = ["futuhat-article", "fusus-article", "miskat-article"];
  function makale() {
    for (var i = 0; i < OKUMA_MAKALE.length; i++) {
      var a = document.getElementById(OKUMA_MAKALE[i]);
      if (a && a.offsetParent && a.closest("section:not([hidden])")) return a;
    }
    return null;
  }
  function ilerleme() {
    var a = acikMi() ? makale() : null;
    HTML.classList.toggle("uyg-okuyor", !!a);
    if (!a) return;
    var hb = ($(".app-header") || {}).offsetHeight || 0;
    var r = a.getBoundingClientRect();
    var toplam = Math.max(1, r.height - (innerHeight - hb));
    var p = Math.max(0, Math.min(1, (hb - r.top) / toplam));
    var c = $(".uyg-ilerleme__dolu", halka);
    c.style.strokeDashoffset = String(2 * Math.PI * 11 * (1 - p));
    halka.setAttribute("aria-valuenow", String(Math.round(p * 100)));
  }
  window.addEventListener("scroll", ilerleme, { passive: true });

  function etiketle() {
    document.querySelectorAll(".uyg-alt [data-etiket], .uyg-sayfa [data-etiket]").forEach(function (s) { if (ETIKET[s.dataset.etiket]) s.textContent = t(ETIKET[s.dataset.etiket]); });
    alt.setAttribute("aria-label", t(ETIKET.gezinti));
    geri.setAttribute("aria-label", t(ETIKET.geri));
    geri.title = t(ETIKET.geri);
    halka.setAttribute("aria-label", t(ETIKET.ilerleme));
    okuma.setAttribute("aria-label", t(ETIKET.kitaplar));
    daha.setAttribute("aria-label", t(ETIKET.daha));
    if (acikSayfa === daha) dahaCiz();
    if (acikSayfa === okuma) kitaplariCiz();
  }

  function guncelle() {
    var acikUyg = acikMi();
    alt.hidden = !acikUyg;
    var v = (document.querySelector("main > section:not([hidden]):not(.detail-panel)") || {}).id || "";
    var etkin = acikSayfa === daha ? "daha" : acikSayfa === okuma ? "okuma"
      : /^(futuhat|fusus|miskat)-wrap$/.test(v) ? "okuma" : v === "ontology-wrap" ? "harita" : "";
    alt.querySelectorAll(".uyg-alt__oge").forEach(function (b) {
      var on = b.dataset.uyg === etkin;
      b.classList.toggle("is-aktif", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      if (b.dataset.uyg === "okuma" || b.dataset.uyg === "daha") b.setAttribute("aria-expanded", String(acikSayfa === (b.dataset.uyg === "okuma" ? okuma : daha)));
    });
    geri.hidden = !(acikSayfa || derinlik() > 0 || panelAcik());
    perde.hidden = !(acikSayfa || (acikUyg && panelAcik()));
    ilerleme();
  }
  document.querySelectorAll("main > section").forEach(function (s) { new MutationObserver(guncelle).observe(s, { attributes: true, attributeFilter: ["hidden"] }); });
  var pnl = panel();
  if (pnl) new MutationObserver(function () { if (pnl.hidden) pnl.style.transform = ""; guncelle(); }).observe(pnl, { attributes: true, attributeFilter: ["hidden"] });
  new MutationObserver(etiketle).observe(HTML, { attributes: true, attributeFilter: ["lang"] });

  // Panelin tutamağı (çekme yeri) -- yalnız kabukta görünür.
  if (pnl) {
    var tut = document.createElement("div");
    tut.className = "uyg-tutamak uyg-tutamak--panel";
    tut.setAttribute("aria-hidden", "true");
    pnl.insertBefore(tut, pnl.firstChild);
  }

  // --- Hareketler (use-gesture) -----------------------------------------------
  // Dokunma olayları (pointer.touch): tarayıcının kendi dikey kaydırması
  // sürerken de hareket izlenir -- pointer olaylarında kaydırma başlayınca
  // pointercancel gelir. Dinleyiciler pasif; sayfanın kaydırması
  // kullanıcınındır, hiçbiri engellenmez.
  var hareketDurumu = null; // null: denenmedi, "iniyor", "hazir", "yok"
  function hareketleriKur() {
    if (hareketDurumu) return;
    var yukle = window.__dostVendorYukle;
    if (!yukle) {
      // view-loader.js henüz çalışmadı (bu betik ondan önce yükleniyor).
      if (document.readyState !== "complete") {
        hareketDurumu = "bekliyor";
        var sonra = function () {
          if (hareketDurumu !== "bekliyor") return;
          hareketDurumu = window.__dostVendorYukle ? null : "yok";
          if (!hareketDurumu && acikMi()) hareketleriKur();
        };
        document.addEventListener("DOMContentLoaded", sonra, { once: true });
        window.addEventListener("load", sonra, { once: true });
      } else hareketDurumu = "yok";
      return;
    }
    hareketDurumu = "iniyor";
    yukle("use-gesture").then(function () {
      if (!window.DostUseGesture || !window.DostUseGesture.DragGesture) throw new Error("DragGesture yok");
      hareketDurumu = "hazir";
      hareketleriBagla(window.DostUseGesture.DragGesture);
    }).catch(function (e) {
      hareketDurumu = "yok";
      console.warn("uygulama-kabugu: hareket kitaplığı yüklenemedi; düğme ve Esc karşılıkları yerinde", e);
    });
  }

  var KAPAT_ESIK = 110;   // px: bu kadar aşağı çekilen sayfa kapanır
  var GECIS_ESIK = 90;    // px: bu kadar yana kaydırılan metin geçer
  var SAVURMA_ESIK = 40;  // px: hızlı bir savurmada (swipe) yeter
  // filterTaps BİLEREK yok: açıkken kitaplık hedefin içindeki her tıklamayı
  // yakalama evresinde durduruyor (dokunma olayları izlenirken fare/klavye
  // tıklaması "tap" sayılmıyor) -- panel ve metin içindeki düğme ve
  // bağlantılar ölürdü. Eşikleri burada kendimiz sınıyoruz (≥40 px).
  var ORTAK = { pointer: { touch: true }, threshold: 10, axisThreshold: { touch: 8 }, swipe: { velocity: 0.45, distance: 40, duration: 260 } };
  function secenek(ek) { var o = {}; for (var k in ORTAK) o[k] = ORTAK[k]; for (var j in ek) o[j] = ek[j]; return o; }

  function hareketleriBagla(DragGesture) {
    // 1) Aşağı çekince kapanan sayfalar: ayrıntı paneli, Okuma, Daha.
    function cekipKapat(el, acikmi, kapat) {
      if (!el) return;
      new DragGesture(el, function (s) {
        if (!acikMi() || !acikmi()) return;
        if (s.first && el.scrollTop > 0) { s.cancel(); return; }
        // İçerik kaydırılmışsa (yukarı itip geri gelindiyse) çekme sayılmaz.
        var dy = el.scrollTop > 0 ? 0 : Math.max(0, s.movement[1]);
        if (s.active) {
          el.style.transition = "none";
          el.style.transform = dy ? "translateY(" + dy + "px)" : "";
          return;
        }
        el.style.transition = "";
        el.style.transform = "";
        if (dy > KAPAT_ESIK || (s.swipe[1] === 1 && dy > SAVURMA_ESIK)) kapat();
      }, secenek({ axis: "y" }));
    }
    cekipKapat(panel(), panelAcik, paneliKapat);
    cekipKapat(okuma, function () { return acikSayfa === okuma; }, function () { sayfaKapat(); });
    cekipKapat(daha, function () { return acikSayfa === daha; }, function () { sayfaKapat(); });

    // 2) Okuma metinlerinde yana kaydırarak önceki / sonraki.
    var ipucu = document.createElement("div");
    ipucu.className = "uyg-kaydir-ipucu";
    ipucu.hidden = true;
    ipucu.setAttribute("aria-hidden", "true");
    document.body.appendChild(ipucu);
    function yatayKaydirici(el) {
      for (var e = el; e && e !== document.body; e = e.parentElement) {
        if (e.tagName === "svg" || e.tagName === "INPUT" || e.tagName === "TEXTAREA" || e.isContentEditable) return true;
        var cs = getComputedStyle(e);
        if ((cs.overflowX === "auto" || cs.overflowX === "scroll") && e.scrollWidth > e.clientWidth + 2) return true;
      }
      return false;
    }
    OKUMA_MAKALE.forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      new DragGesture(a, function (s) {
        if (s.first && (!acikMi() || makale() !== a || acikSayfa || panelAcik() || yatayKaydirici(s.event && s.event.target))) { s.cancel(); return; }
        var dx = s.movement[0];
        var yon = dx < 0 ? "sonraki" : "onceki";
        var btn = a.querySelector(".okuma-gezinti__btn--" + yon);
        if (s.active) {
          if (!azHareket.matches) a.style.transform = "translateX(" + (dx * 0.3) + "px)";
          if (btn && Math.abs(dx) > 14) {
            ipucu.hidden = false;
            ipucu.className = "uyg-kaydir-ipucu uyg-kaydir-ipucu--" + yon + (Math.abs(dx) > GECIS_ESIK ? " is-hazir" : "");
            ipucu.textContent = (btn.querySelector(".okuma-gezinti__yon") || btn).textContent.trim();
          } else ipucu.hidden = true;
          return;
        }
        a.style.transform = "";
        ipucu.hidden = true;
        if (btn && (Math.abs(dx) > GECIS_ESIK || (s.swipe[0] !== 0 && Math.abs(dx) > SAVURMA_ESIK && (s.swipe[0] < 0) === (dx < 0)))) btn.click();
      }, secenek({ axis: "x" }));
    });
  }

  (mq.addEventListener ? mq.addEventListener("change", uygula) : mq.addListener(uygula));
  etiketle();
  uygula();
})();
