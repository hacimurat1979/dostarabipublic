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
 *
 * 2026-10-15 (mobil kabuk taraması K01-K20, kullanıcı onayı):
 *  - Okuma sayfası: her metnin yanında "Kaldığın yer" + "Devam" (K09).
 *  - Okurken üst çubukta arama yerine "Aa" dairesi: yazı boyutu hapı (K10).
 *  - Ara tam sayfa, Defterim alttan sayfa; açıkken alt çubukta onların
 *    sekmesi yanar (K11/K13). Açık katman varken yer adı katmanın adıdır,
 *    geri dairesi ✕ olur (K07).
 *  - Daha: Bölümler akordeon (K16). Yatay okurken üst/alt çubuk kayar gider
 *    (K05). Klavye açılınca Ara klavyenin üstünde kalır (K12). Yeni sürüm
 *    hazırsa sessiz bir "Yenile" çubuğu (K18).
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
    kapat: '<path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    sag: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  function svg(ad, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 22) + '" height="' + (w || 22) + '" aria-hidden="true">' + S[ad] + "</svg>"; }

  var ETIKET = {
    harita: { tr: "Harita", en: "Map", pt: "Mapa" },
    okuma: { tr: "Okuma", en: "Reading", pt: "Leitura" },
    ara: { tr: "Ara", en: "Search", pt: "Buscar" },
    defter: { tr: "Defterim", en: "Notebook", pt: "Caderno" },
    daha: { tr: "Daha", en: "More", pt: "Mais" },
    geri: { tr: "Geri", en: "Back", pt: "Voltar" },
    harita0: { tr: "Harita", en: "Map", pt: "Mapa" },
    panelBuyut: { tr: "Paneli büyüt", en: "Expand the panel", pt: "Expandir o painel" },
    panelKucult: { tr: "Paneli küçült, haritayı göster", en: "Shrink the panel, show the map", pt: "Reduzir o painel, mostrar o mapa" },
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
    kapat: { tr: "Kapat", en: "Close", pt: "Fechar" },
    bumetin: { tr: "Bu metinde", en: "In this text", pt: "Neste texto" },
    kaldigin: { tr: "Kaldığın yer", en: "Where you left off", pt: "Onde parou" },
    devam: { tr: "Devam", en: "Continue", pt: "Continuar" },
    kabukGoster: { tr: "Gezinmeyi göster", en: "Show navigation", pt: "Mostrar navegação" },
    sasirtAlt: { tr: "Rastgele bir yere götürür", en: "Takes you somewhere at random", pt: "Leva-o a um lugar ao acaso" },
    gizlilik: { tr: "Gizlilik", en: "Privacy", pt: "Privacidade" },
    yeniSurum: { tr: "Yeni sürüm hazır", en: "A new version is ready", pt: "Há uma nova versão" },
    yenile: { tr: "Yenile", en: "Reload", pt: "Recarregar" },
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
  // "Kaldığın yer" (K09): üç görünümün kendi yazdığı son kayıt (yalnız bu
  // cihazın localStorage'ı; futuhat.js / fusus.js / miskat.js) -- kabuk
  // yalnız okur, yeni bir durum tutmaz. Etiket kayıt numarasından kurulur
  // (künye biçimi görünümlerin kendi başlıklarıyla aynı: Cilt I · Kısım X,
  // Fass 3 / Bezel 3 / Engaste 3); kayıt yoksa ya da tanınmazsa satırda yalnız
  // kitabın adı kalır.
  var SON_ANAHTAR = { "futuhat-btn": "dost-futuhat-last-part", "fusus-btn": "dost-fusus-last-fass", "miskat-btn": "dost-miskat-last-hadis" };
  var ROMEN = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  function romen(n) {
    var out = "", kalan = Number(n);
    ROMEN.forEach(function (r) { while (kalan >= r[0]) { out += r[1]; kalan -= r[0]; } });
    return out;
  }
  function sonYer(kapi) {
    var id = null, m;
    try { id = localStorage.getItem(SON_ANAHTAR[kapi]); } catch (e) { /* özel pencere */ }
    if (!id) return "";
    if (kapi === "futuhat-btn" && (m = /^c(\d+)k(\d+)$/.exec(id))) {
      return t({ tr: "Cilt " + romen(m[1]) + " · Kısım " + romen(m[2]), en: "Volume " + romen(m[1]) + " · Part " + romen(m[2]), pt: "Volume " + romen(m[1]) + " · Parte " + romen(m[2]) });
    }
    if (kapi === "fusus-btn" && (m = /^fs(\d+)$/.exec(id))) return t({ tr: "Fass " + m[1], en: "Bezel " + m[1], pt: "Engaste " + m[1] });
    if (kapi === "miskat-btn" && (m = /^h(\d+)$/.exec(id))) return t({ tr: "Metin " + m[1], en: "Text " + m[1], pt: "Texto " + m[1] });
    return "";
  }
  function kitaplariCiz() {
    $(".uyg-kitaplar", okuma).innerHTML = KITAPLAR.map(function (k) {
      var a = document.getElementById(k[0]);
      if (!a) return "";
      var yer = sonYer(k[0]);
      return '<button type="button" class="uyg-kitap" data-kapi="' + k[0] + '"><span class="uyg-kitap__daire">' + k[1] + "</span>"
        + '<span class="uyg-kitap__metin"><span class="uyg-kitap__ad">' + a.textContent.trim() + "</span>"
        + (yer ? '<span class="uyg-kitap__yer">' + t(ETIKET.kaldigin) + ": " + yer + "</span>" : "") + "</span>"
        + (yer ? '<span class="uyg-kitap__devam"><i aria-hidden="true"></i>' + t(ETIKET.devam) + "</span>" : "") + "</button>";
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

  // Bölümler akordeon (K16, 2026-10-15): çekmecenin gruplarıyla aynı model --
  // etkin bölümün grubu açık, ötekiler kapalı (başlıkta kaç bölüm olduğu
  // yazar). Açık/kapalı durumu sayfa her açılışta etkin gruptan yeniden
  // kurulur; sayfa açıkken dil/tema değişince yeniden çizim onu korur.
  var grupAcik = null;
  function dahaCiz() {
    var gruplar = Array.prototype.map.call(document.querySelectorAll("#nav-drawer .nav-drawer__group"), function (g) {
      var bas = g.querySelector(".nav-drawer__heading");
      var oge = Array.prototype.slice.call(g.querySelectorAll("a.btn-ghost[id]"));
      return { ad: bas ? bas.textContent.trim() : "", oge: oge, etkin: oge.some(function (a) { return a.classList.contains("btn-ghost--active"); }) };
    });
    if (!grupAcik) { grupAcik = {}; gruplar.forEach(function (g, i) { grupAcik[i] = g.etkin; }); }
    dahaBolum.innerHTML = '<h2 class="uyg-sayfa__baslik">' + t(ETIKET.bolumler) + "</h2>"
      + gruplar.map(function (g, i) {
        var ac = !!grupAcik[i];
        var ogeler = g.oge.map(function (a) {
          return '<button type="button" class="uyg-bolum' + (a.classList.contains("btn-ghost--active") ? " is-aktif" : "") + '" data-kapi="' + a.id + '">' + a.textContent.trim() + "</button>";
        }).join("");
        return '<div class="uyg-grup"><button type="button" class="uyg-grup__bas" data-grup="' + i + '" aria-expanded="' + ac + '" aria-controls="uyg-grup-' + i + '">'
          + '<span class="uyg-grup__ad">' + g.ad + "<small>" + g.oge.length + "</small></span>" + svg("sag", 18) + "</button>"
          + '<div class="uyg-grup__ogeler" id="uyg-grup-' + i + '"' + (ac ? "" : " hidden") + ">" + ogeler + "</div></div>";
      }).join("");
    var gizlilik = document.querySelector(".app-footer__gizlilik a");
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
      + (su ? '<div class="uyg-ayar"><span class="uyg-ayar__ad">' + t(ETIKET.sasirt) + '<small class="uyg-ayar__alt">' + t(ETIKET.sasirtAlt) + '</small></span><span class="uyg-ayar__denetim"><button type="button" class="uyg-daire" data-eylem="sasirt" aria-label="' + t(ETIKET.sasirt) + '">' + su.innerHTML + "</button></span></div>" : "");
    if (gizlilik) dahaBolum.insertAdjacentHTML("beforeend", '<a class="uyg-baglanti" href="' + gizlilik.getAttribute("href") + '"><span>' + t(ETIKET.gizlilik) + "</span>" + svg("sag", 18) + "</a>");
    if (window.DostFontScale) window.DostFontScale.bindFontScaleButtons($('[data-eylem="kucult"]', daha), $('[data-eylem="buyut"]', daha));
  }

  // --- Dış katmanlar: çekmece, Ara, Defterim (2026-10-11, grafik gezinme
  // denetimi K1) -------------------------------------------------------------
  // Daha/Okuma sayfası gibi tarihte kendi girdisini açarlar (dostKatman:
  // "dis-<ad>", adres aynı): Android'in geri tuşu YALNIZ en üstteki katmanı
  // kapatır. Eskiden girdileri yoktu; geri tuşu altındaki kaydı kapatıyor,
  // çekmeceyle birlikte iki adım atıyor, Ara'yı açık bırakıyordu.
  // Katmanın kendi kapanışı (Esc, ✕, dışarı dokunuş, kapı) girdisinden
  // sessizce çıkar; kapıyla gidilirse yeni adres girdinin yerine yazılır
  // (graph-utils.js tarih kaydı). Katmanın davranışı kendi dosyasında
  // kalır: kabuk yalnız görünürlüğünü izler, kapatmak için katmanın kendi
  // düğmesine basar.
  var DIS = [
    { ad: "cekmece", id: "nav-drawer", dugme: "nav-toggle" },
    { ad: "ara", id: "search-panel", dugme: "search-toggle" },
    { ad: "defter", id: "defter-panel", dugme: "defter-toggle" },
    // Okurken "Aa" yazı boyutu hapı (K10): küçük bir katman -- yer adını
    // değiştirmez (kucuk), ama geri tuşu / Esc onu bir adımda kapatır.
    { ad: "aa", id: "uyg-aa-pop", dugme: "uyg-aa", kucuk: true },
  ];
  var disYigin = [], disYut = 0, disSessiz = null;
  function disGirdi(ad) { return "dis-" + ad; }
  function disBul(ad) { for (var i = 0; i < DIS.length; i++) if (DIS[i].ad === ad) return DIS[i]; return null; }
  function disSimdi() { var k = GU && GU.tarihKatmani ? GU.tarihKatmani() : null; return k && k.indexOf("dis-") === 0 ? k.slice(4) : null; }
  function disDegisti(d) {
    var acik = !d.el.hidden;
    var i = disYigin.indexOf(d.ad);
    if (acik && i < 0) {
      if (!acikMi()) return;
      disYigin.push(d.ad);
      if (disSessiz === d.ad) { disSessiz = null; guncelle(); return; } // ileri tuşuyla yeniden açıldı
      try {
        // Alt çubukta bir sekmeden ötekine geçilince (Ara -> Defterim) önceki
        // katman aynı anda kapanmıştır: girdisi yerinde kalıp ölü bir adım
        // bırakmasın diye yeni katman onun YERİNE yazılır.
        // Aynı şey Daha/Okuma sayfasından Ara/Defterim'e geçerken: sayfa az
        // önce kapandı, girdisi yeni katmanın yerine yazılır (eskiden geri
        // adımı Ara'yı hemen kapatıyordu -- sayfadan Ara'ya geçilemiyordu).
        var yeni = { dostKatman: disGirdi(d.ad) };
        if (oluGirdi(d.ad)) history.replaceState(yeni, "");
        else history.pushState(yeni, "");
      } catch (e) { /* eski tarayıcı */ }
      guncelle();
    } else if (!acik && disSessiz === d.ad) {
      disSessiz = null; // geri tuşu kapattı (disKapat)
      guncelle();
    } else if (!acik && i >= 0) {
      disYigin.splice(i, 1);
      // Tıklamanın öteki dinleyicileri (kapı) önce bitsin: bir yere
      // gidildiyse girdi zaten yeni adresle değişmiştir.
      setTimeout(function () {
        if (disSimdi() === d.ad) { disYut++; history.back(); }
      }, 0);
      guncelle();
    }
  }
  // Alt çubukta başka bir sekmeye dokunulunca açık dış katmanlar (Ara,
  // Defterim, çekmece, Aa hapı) kapanır; hedef katman hariç. Eskiden Ara
  // bir perdeydi ve alt çubuk altında kalıyordu -- artık tam sayfa.
  function digerKatmanlariKapat(hedef) {
    disYigin.slice().forEach(function (ad) {
      var d = disBul(ad);
      if (ad !== hedef && d && d.el && !d.el.hidden) tikla(d.dugme);
    });
  }
  // Tarihin üstündeki girdi kapanmış bir dış katmanınsa (ölü girdi adayı).
  function disOlu(ad) { var d = disBul(ad); return !!(d && d.el && d.el.hidden); }
  // Tarihin üstündeki girdi az önce kapanmış bir katmanın mı: kabuğun dış katmanı
  // (Ara/Defterim/...), Daha/Okuma sayfası ya da okuma yüzeyinin "Bu metinde"
  // sayfası (GU.yuzeyKatmani). Öyleyse yeni katman onun YERİNE yazılır, ölü adım
  // kalmaz. kendi: açılmakta olan dış katman (kendi girdisi sayılmaz).
  function oluGirdi(kendi) {
    var k = GU && GU.tarihKatmani ? GU.tarihKatmani() : null;
    if (!k) return false;
    if (k.indexOf("dis-") === 0) return k.slice(4) !== kendi && disOlu(k.slice(4));
    if (k.indexOf("yuzey-") === 0) return !document.querySelector(".okuma-sayfa");
    return !!(sayfaKatmani() && !acikSayfa);
  }
  function disBagla() {
    DIS.forEach(function (d) {
      if (d.el) return;
      d.el = document.getElementById(d.id);
      if (d.el) new MutationObserver(function () { disDegisti(d); }).observe(d.el, { attributes: true, attributeFilter: ["hidden"] });
    });
  }
  // Geri tuşunun kapattığı katman: yığından hemen düşer (gözcü eşzamansız),
  // gözcü de onu "kendi kapanışı" saymaz (disSessiz).
  function disKapat(ad) {
    var i = disYigin.indexOf(ad);
    if (i >= 0) disYigin.splice(i, 1);
    var d = disBul(ad);
    if (!d || !d.el || d.el.hidden) return;
    disSessiz = ad;
    tikla(d.dugme);
    if (!d.el.hidden) d.el.hidden = true;
  }
  // Ölü girdi: altındaki katman kendi yoluyla kapanmıştı -- geri tuşu onu atlar.
  function disOluAtla() {
    var k = disSimdi();
    if (k && disYigin.indexOf(k) < 0) history.back();
  }
  function disPopstate(e) {
    if (disYut) { disYut--; e.stopImmediatePropagation(); guncelle(); return true; }
    var k = disSimdi();
    var ust = disYigin.length ? disYigin[disYigin.length - 1] : null;
    if (ust && k !== ust && !acikSayfa) {
      // Geri tuşu üstteki katmanın girdisinden çıktı: yalnız o kapanır.
      while (disYigin.length && disYigin[disYigin.length - 1] !== k) disKapat(disYigin[disYigin.length - 1]);
      e.stopImmediatePropagation();
      guncelle();
      if (k && disYigin.indexOf(k) < 0) setTimeout(disOluAtla, 0);
      return true;
    }
    if (k && disYigin.indexOf(k) < 0 && !acikSayfa) {
      // İleri tuşu bir katman girdisine geldi: katman yeniden açılır.
      var d = disBul(k);
      e.stopImmediatePropagation();
      if (d && acikMi()) { disSessiz = k; tikla(d.dugme); if (d.el && d.el.hidden) disSessiz = null; }
      return true;
    }
    return false;
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
  function sayfaKatmani() { var k = GU && GU.tarihKatmani ? GU.tarihKatmani() : null; return k === "daha" || k === "okuma" ? k : null; }
  function katmanGirdisiBizim() { return !!sayfaKatmani(); }
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
    if (el === daha) { if (acikSayfa !== daha) grupAcik = null; dahaCiz(); cevrimTasi(true); }
    if (el === okuma) kitaplariCiz();
    if (!acikSayfa) { oncekiOdak = document.activeElement; katmanY = window.scrollY; }
    el.hidden = false;
    el.style.transform = "";
    acikSayfa = el;
    if (!tarihsiz) {
      try {
        // Önceki girdi az önce kapanan bir dış katmansa (Ara -> Okuma) onun yerine yazılır.
        if (katmanGirdisiBizim()) history.replaceState({ dostKatman: katmanAdi(el) }, "");
        else {
          katmanAltYolu = simdikiYol();
          if (oluGirdi(null)) history.replaceState({ dostKatman: katmanAdi(el) }, "");
          else history.pushState({ dostKatman: katmanAdi(el) }, "");
        }
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
    // Gözcüler (Ara/Defterim girdisi yazmak) bitsin diye bir tur sonra: eylem
    // bir dış katman açtıysa girdi onun yerine yazılmıştır, geri adımı gerekmez.
    setTimeout(katmanGirdisiniBirak, 0);
  }
  function panel() { return document.getElementById("detail-panel"); }
  function panelAcik() { var p = panel(); return !!(p && !p.hidden); }
  function paneliKapat() { var c = document.getElementById("detail-close"); if (c) c.click(); }
  // Yarım panel (2026-10-10, telefonda harita taslağı; GU.telefonHaritasi):
  // grafik kipindeki bir haritada panel ekranın alt yarısını alır, harita
  // üstte dokunulabilir kalır. Tutamak (ya da yukarı çekmek) tam boya
  // büyütür; tutamak yeniden küçültür. Panel kapanınca yarım hâle döner.
  var panelTam = false;
  function haritaAcik() { return !!document.querySelector("main > section.graph-wrap.mg-telefon.grafik-acik:not([hidden])"); }
  function yarimMi() { return acikMi() && panelAcik() && haritaAcik() && !panelTam; }
  function tikla(id) { var a = document.getElementById(id); if (a) a.click(); }
  function kapiAc(id) { eylemleKapat(function () { tikla(id); }); }

  // Bu dinleyici ontology.js'inkinden ÖNCE kurulur (betik sırası).
  window.addEventListener("popstate", function (e) {
    if (disPopstate(e)) return;
    var k = sayfaKatmani();
    if (katmanGeriBekleniyor) {
      katmanGeriBekleniyor = false;
      clearTimeout(katmanGeriZaman);
      if (katmaninAltindaMi()) { e.stopImmediatePropagation(); yerindeKal(); guncelle(); return; }
    }
    if (acikSayfa && !k && katmaninAltindaMi()) {
      setTimeout(disOluAtla, 0);
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
    // Okuma yüzeyinin "Bu metinde" sayfası (okuma-yuzeyi.js) da bir katman: sekme
    // değişirken o da kapanır (aksi hâlde Ara onun altında kalırdı).
    if (window.DostOkuma && window.DostOkuma.sayfaKapat && document.querySelector(".okuma-sayfa")) window.DostOkuma.sayfaKapat();
    digerKatmanlariKapat(k === "ara" || k === "defter" ? k : null);
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
    if (b.dataset.grup !== undefined) {
      // Akordeon: yalnız bu grup açılır/kapanır, sayfa yeniden çizilmez.
      var acik = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", String(acik));
      var kutu = document.getElementById(b.getAttribute("aria-controls"));
      if (kutu) kutu.hidden = !acik;
      if (grupAcik) grupAcik[b.dataset.grup] = acik;
      return;
    }
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
    if (disYigin.length && disSimdi()) { history.back(); return; } // Defterim sayfası: perdeye dokunmak geri dairesiyle aynı adım
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

  // --- "Aa" yazı boyutu hapı (K10) -----------------------------------------------
  // Okuma metinlerinde üst çubuğun sağındaki arama (alt çubuktaki Ara'nın
  // yinelenişi, başparmaktan uzak) yerine "Aa": dokununca başlığın altında
  // A− / A+ hapı açılır; metin arkada görünür kalır, boyut deneme yanılmayla
  // ayarlanır. Düğmeler font-scale.js'in ortak ölçeğine bağlıdır (Daha'daki
  // satırla aynı ölçek, aynı depo); Esc ve geri tuşu hapı bir adımda kapatır
  // (DIS: "aa"), alt çubuktaki sekmeler ve dışarı dokunuş da.
  var aa = document.createElement("button");
  aa.type = "button";
  aa.id = "uyg-aa";
  aa.className = "uyg-aa";
  aa.setAttribute("aria-expanded", "false");
  aa.setAttribute("aria-controls", "uyg-aa-pop");
  aa.innerHTML = '<span aria-hidden="true">A<small>a</small></span>';
  if (controls) controls.insertBefore(aa, halka);
  var aaPop = document.createElement("div");
  aaPop.id = "uyg-aa-pop";
  aaPop.className = "uyg-aa-pop";
  aaPop.hidden = true;
  aaPop.setAttribute("role", "group");
  aaPop.innerHTML = '<button type="button" class="uyg-daire" data-aa="kucult">A−</button><span class="uyg-aa-pop__ad"></span><button type="button" class="uyg-daire" data-aa="buyut">A+</button>';
  document.body.appendChild(aaPop);
  var aaBagli = false;
  function aaOlcek() { return parseFloat(HTML.style.getPropertyValue("--detail-font-scale")) || 1; }
  function aaSinir() {
    var o = aaOlcek();
    var k = $('[data-aa="kucult"]', aaPop), b = $('[data-aa="buyut"]', aaPop);
    k.setAttribute("aria-disabled", String(o <= 0.8 + 1e-6));
    b.setAttribute("aria-disabled", String(o >= 1.8 - 1e-6));
  }
  function aaBagla() {
    if (aaBagli || !window.DostFontScale) return;
    aaBagli = true;
    var k = $('[data-aa="kucult"]', aaPop), b = $('[data-aa="buyut"]', aaPop);
    window.DostFontScale.bindFontScaleButtons(k, b);
    [k, b].forEach(function (x) { x.addEventListener("click", aaSinir); });
  }
  aa.addEventListener("click", function () {
    aaPop.hidden = !aaPop.hidden;
    if (!aaPop.hidden) { aaBagla(); aaSinir(); }
    aa.setAttribute("aria-expanded", String(!aaPop.hidden));
  });
  document.addEventListener("pointerdown", function (e) {
    if (!aaPop.hidden && !aaPop.contains(e.target) && !aa.contains(e.target)) tikla("uyg-aa");
  }, true);
  function aaYaz() {
    if (!aaPop.hidden && !(acikMi() && HTML.classList.contains("uyg-okuyor"))) aaPop.hidden = true;
    aa.setAttribute("aria-expanded", String(!aaPop.hidden));
    aa.setAttribute("aria-label", t(ETIKET.yazi));
    aa.title = t(ETIKET.yazi);
    $(".uyg-aa-pop__ad", aaPop).textContent = t(ETIKET.yazi);
    aaPop.setAttribute("aria-label", t(ETIKET.yazi));
    $('[data-aa="kucult"]', aaPop).setAttribute("aria-label", t(ETIKET.kucult));
    $('[data-aa="buyut"]', aaPop).setAttribute("aria-label", t(ETIKET.buyut));
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () {
    if (aaPop.hidden) return false;
    tikla("uyg-aa");
    return true;
  }, { oncelikli: true });

  // --- Yatay okurken kabuk kendini çeker (K05) ------------------------------------
  // Yatay telefonda üst çubuk + alt gezinme ekranın dörtte birini yer (412 px
  // yükseklikte 107 px). Okuma metinlerinde aşağı kaydırırken ikisi de kayar
  // gider; yukarı kaydırınca, metnin başına/sonuna gelince, bir katman açılınca
  // ya da alt kenardaki tutamağa dokununca geri gelir. Yön algısı yeniden
  // yazılmadı: okuma-yuzeyi.js (YT-04) html.okuma-cekik sınıfını her yönelimde
  // koyar/kaldırır, dikeyde onun CSS'i, yatayda style.css'teki K05 kuralı uygular.
  // Burada yalnız: çekilen çubuklar odaklanılamaz (inert) ve tutamak -- gerçek bir
  // düğme -- çubukları geri getirir. Dikeyde ve haritalarda çubuklar sabit kalır.
  var yatayMq = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
  var baslik = $(".app-header");
  var nokta = document.createElement("button");
  nokta.type = "button";
  nokta.className = "uyg-nokta";
  nokta.hidden = true;
  nokta.innerHTML = "<span aria-hidden=\"true\"></span>";
  document.body.appendChild(nokta);
  var kabukGizli = false;
  function kabukDenetle() {
    var gizli = acikMi() && yatayMq.matches && HTML.classList.contains("okuma-cekik");
    if (gizli === kabukGizli) return;
    kabukGizli = gizli;
    alt.inert = gizli;
    if (baslik) baslik.inert = gizli;
    nokta.hidden = !gizli;
  }
  nokta.addEventListener("click", function () {
    if (window.DostOkuma && window.DostOkuma.cubuklariGetir) window.DostOkuma.cubuklariGetir();
    else HTML.classList.remove("okuma-cekik");
    kabukDenetle();
  });
  new MutationObserver(kabukDenetle).observe(HTML, { attributes: true, attributeFilter: ["class"] });
  (yatayMq.addEventListener ? yatayMq.addEventListener("change", kabukDenetle) : yatayMq.addListener(kabukDenetle));

  // --- Ekran klavyesi (K12) --------------------------------------------------------
  // Ara tam sayfa; klavye açılınca sayfanın alt kenarı klavyenin üstüne çekilir
  // (vh birimi klavyeyi hesaba katmıyordu: son sonuçlar klavyenin altında
  // kalıyordu). Görsel görüş alanı küçülmüşse (yakınlaştırma yokken) aradaki
  // fark klavyenin boyudur.
  var vv = window.visualViewport;
  function klavye() {
    var kb = 0;
    if (vv && acikMi() && vv.scale <= 1.01) kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    if (kb < 120) kb = 0;
    HTML.style.setProperty("--uyg-klavye", kb + "px");
  }
  if (vv) { vv.addEventListener("resize", klavye); vv.addEventListener("scroll", klavye); }
  // Uygulama içi adım: graph-utils.js'in tarih kaydı (dostAdim). Geri dairesi
  // yalnız geri gidilecek bir şey varken görünür (bağlanmamış düğme olmasın):
  // açık sayfa, açık panel ya da uygulama içinde açılmış bir adres.
  function derinlik() { return GU && GU.tarihAdimi ? GU.tarihAdimi() : 0; }

  // --- Geri: <ad> (2026-10-11, O4) ----------------------------------------------
  // Yer adının altında tek satır: geri tuşunun / dairesinin götüreceği yerin
  // adı, tarihin kendisinden (Navigation API; yoksa graph-utils.js'in
  // dostOnceki kaydı). Panelin iz satırının (#detail-breadcrumb) yerine
  // geçer -- o görünüm değişince sıfırlanıyor, geri tuşunda ileriye doğru
  // büyüyordu ve dokununca yeni bir adım açıyordu.
  var ADLAR = {};
  var donus = document.createElement("span");
  donus.className = "uyg-donus";
  donus.hidden = true;
  donus.setAttribute("aria-hidden", "true");
  // Uzun yer adı (K20): tek satıra sığmıyorsa (dar telefon, "A Linha do Tempo
  // das Obras") iki satıra açılır, "Geri:" satırı düşer. Ölçüm tek satır
  // hâlinde yapılır: sınıf önce kaldırılır.
  var yerEtiketi = document.getElementById("nav-toggle-label");
  function uzunAdDenetle() {
    var nt = document.getElementById("nav-toggle");
    if (!nt || !yerEtiketi) return;
    nt.classList.remove("uyg-uzun-ad");
    var uzun = acikMi() && !!yerEtiketi.offsetParent && yerEtiketi.scrollWidth > yerEtiketi.clientWidth + 1;
    if (uzun) nt.classList.add("uyg-uzun-ad");
  }
  if (yerEtiketi) new MutationObserver(uzunAdDenetle).observe(yerEtiketi, { childList: true, characterData: true, subtree: true });
  window.addEventListener("resize", uzunAdDenetle);
  // Açık katmanın adı (K07): yer adının yerine geçer; nav-drawer.js'in yazdığı
  // etiketle (#nav-toggle-label) yarışmasın diye ayrı bir öğe.
  var katmanAd = document.createElement("span");
  katmanAd.className = "uyg-katman-ad";
  katmanAd.setAttribute("aria-hidden", "true");
  function yolAnahtari(u) { try { return new URL(u, location.href).pathname; } catch (e) { return u; } }
  function parcalar(yol) { return yol.split("/").filter(function (x) { return x && !/^(en|pt)$/.test(x); }); }
  function bolumAdi(v) {
    if (!v || v === "ontoloji") return t(ETIKET.harita0);
    var a = document.getElementById(v + "-btn");
    return a ? a.textContent.trim() : "";
  }
  function adiKaydet() {
    var yol = location.pathname, p = parcalar(yol), ad = "";
    var pn = panel();
    if (p.length > 1 && pn && !pn.hidden) {
      var ti = pn.querySelector(".detail-title");
      if (ti) { var c = ti.cloneNode(true); c.querySelectorAll(".pole-badge, [class*='badge'], .mg-komsu").forEach(function (b) { b.remove(); }); ad = c.textContent.trim(); }
    }
    if (!ad && p.length <= 1) ad = bolumAdi(p[0]);
    if (ad) ADLAR[yol] = ad.replace(/\s+/g, " ");
  }
  function oncekiYol() {
    var n = window.navigation;
    if (n && n.currentEntry && n.entries) {
      var i = n.currentEntry.index, es = n.entries();
      return i > 0 && es[i - 1] ? yolAnahtari(es[i - 1].url) : null;
    }
    return GU && GU.tarihOncekiYol ? GU.tarihOncekiYol() : null;
  }
  // Adı olan en üstteki katman (K07): Daha, Okuma, Ara, Defterim, çekmece.
  // Açıkken yer adı onun adıdır, geri dairesi ✕ (kapat) olur, "Geri: <ad>"
  // satırı yazılmaz -- eskiden Harita'nın üstünde bile "Geri: Harita" diyordu;
  // oysa dairenin yaptığı katmanı kapatmaktır. Aa hapı küçük bir katman:
  // yer adına dokunmaz.
  function ustKatman() {
    for (var i = disYigin.length - 1; i >= 0; i--) { var d = disBul(disYigin[i]); if (d && !d.kucuk) return d.ad; }
    if (document.querySelector(".okuma-sayfa")) return "bumetin"; // okuma-yuzeyi.js'in "Bu metinde" sayfası
    return acikSayfa ? (acikSayfa === daha ? "daha" : "okuma") : null;
  }
  // "Bu metinde" sayfası kabuğun dışında (body'ye) eklenir/kaldırılır: yer adı ve ✕ onu izler.
  new MutationObserver(function (kayitlar) {
    for (var i = 0; i < kayitlar.length; i++) {
      var dugumler = Array.prototype.slice.call(kayitlar[i].addedNodes).concat(Array.prototype.slice.call(kayitlar[i].removedNodes));
      for (var j = 0; j < dugumler.length; j++) if (dugumler[j].classList && dugumler[j].classList.contains("okuma-sayfa")) { guncelle(); return; }
    }
  }).observe(document.body, { childList: true });
  function donusAdi() {
    if (derinlik() === 0 && !acikSayfa) return null;
    var y = oncekiYol();
    if (!y) return null;
    var p = parcalar(y);
    return ADLAR[y] || (p.length <= 1 ? bolumAdi(p[0]) : bolumAdi(p[0])) || null;
  }
  function donusYaz() {
    adiKaydet();
    var kat = acikMi() ? ustKatman() : null;
    var ad = acikMi() && !geri.hidden && !kat ? donusAdi() : null;
    donus.hidden = !ad;
    donus.textContent = ad ? t(ETIKET.geri) + ": " + ad : "";
    var etiket = kat ? t(ETIKET.kapat) + ": " + t(ETIKET[kat === "cekmece" ? "bolumler" : kat]) : ad ? t(ETIKET.geri) + ": " + ad : t(ETIKET.geri);
    geri.setAttribute("aria-label", etiket);
    geri.title = etiket;
    var kip = kat ? "kapat" : "geri";
    if (geri.dataset.kip !== kip) { geri.dataset.kip = kip; geri.innerHTML = svg(kip, 20); }
    HTML.classList.toggle("uyg-katman-acik", !!kat);
    katmanAd.textContent = kat ? t(ETIKET[kat === "cekmece" ? "bolumler" : kat]) : "";
    var nt = document.getElementById("nav-toggle");
    if (nt && donus.parentNode !== nt) nt.appendChild(donus);
    if (nt && katmanAd.parentNode !== nt) nt.appendChild(katmanAd);
    if (nt) nt.classList.toggle("uyg-donuslu", !!ad);
    uzunAdDenetle();
  }

  // --- Bölüm rozeti (2026-10-11, O6) -------------------------------------------
  // Panel metninde başka bir bölüme götüren bağlantı adı konmuş bir kapıdır:
  // yanında hedef bölümün adı küçük bir rozetle yazar (dokunmatikte hover
  // önizlemesi yok). Aynı bölümdeki bağlantılara dokunulmaz.
  function rozetle() {
    var ic = document.getElementById("detail-content");
    if (!ic) return;
    var cur = parcalar(location.pathname)[0] || "ontoloji";
    ic.querySelectorAll("a.cross-link[data-view]").forEach(function (a) {
      var v = a.dataset.view;
      var ad = acikMi() && v && v !== cur ? bolumAdi(v) : "";
      if (ad) a.setAttribute("data-bolum", ad); else a.removeAttribute("data-bolum");
    });
  }
  geri.addEventListener("click", function () {
    if (sayfaKapat()) return;
    if (disYigin.length && disSimdi()) { history.back(); return; }
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
    guncellemeYaz();
    // Dil değişti: "Geri: <ad>" ve bölüm rozetleri yeni dilde yeniden yazılır.
    if (typeof ADLAR === "object" && ADLAR) { for (var k in ADLAR) delete ADLAR[k]; setTimeout(function () { rozetle(); donusYaz(); }, 0); }
  }

  function guncelle() {
    var acikUyg = acikMi();
    alt.hidden = !acikUyg;
    var v = (document.querySelector("main > section:not([hidden]):not(.detail-panel)") || {}).id || "";
    // Açık katman sekmesini yakar (K11/K13: Ara ve Defterim açıkken eskiden
    // alttaki Harita yanık kalıyordu).
    var kat = ustKatman();
    var etkin = kat === "ara" || kat === "defter" ? kat : acikSayfa === daha ? "daha" : acikSayfa === okuma ? "okuma"
      : /^(futuhat|fusus|miskat)-wrap$/.test(v) ? "okuma" : v === "ontology-wrap" ? "harita" : "";
    alt.querySelectorAll(".uyg-alt__oge").forEach(function (b) {
      var on = b.dataset.uyg === etkin;
      b.classList.toggle("is-aktif", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
      if (b.dataset.uyg === "okuma" || b.dataset.uyg === "daha") b.setAttribute("aria-expanded", String(acikSayfa === (b.dataset.uyg === "okuma" ? okuma : daha)));
    });
    geri.hidden = !(acikSayfa || disYigin.length || derinlik() > 0 || panelAcik());
    if (!panelAcik()) panelTam = false;
    else boyKaydet();
    var yarim = yarimMi();
    HTML.classList.toggle("uyg-panel-yarim", yarim);
    var defterAcik = disYigin.indexOf("defter") >= 0;
    HTML.classList.toggle("uyg-defter-acik", defterAcik);
    HTML.classList.toggle("uyg-dis-katman", disYigin.length > 0);
    perde.hidden = !(acikSayfa || defterAcik || (acikUyg && panelAcik() && !yarim));
    tutamakYaz();
    ilerleme();
    donusYaz();
    aaYaz();
    kabukDenetle();
  }
  // Tutamak yalnız haritadaki panelde bir düğmedir (büyüt / küçült); başka
  // yerde süs olarak kalır, odaklanmaz (bağlanmamış düğme olmasın).
  function tutamakYaz() {
    var tu = document.querySelector(".uyg-tutamak--panel");
    if (!tu) return;
    var dugme = acikMi() && panelAcik() && haritaAcik();
    tu.classList.toggle("uyg-tutamak--dugme", dugme);
    HTML.classList.toggle("uyg-panel-harita", dugme);
    if (dugme) {
      tu.removeAttribute("aria-hidden");
      tu.setAttribute("role", "button");
      tu.setAttribute("tabindex", "0");
      tu.setAttribute("aria-expanded", String(panelTam));
      tu.setAttribute("aria-label", t(panelTam ? ETIKET.panelKucult : ETIKET.panelBuyut));
    } else {
      tu.setAttribute("aria-hidden", "true");
      tu.removeAttribute("role");
      tu.removeAttribute("tabindex");
      tu.removeAttribute("aria-expanded");
      tu.removeAttribute("aria-label");
    }
  }
  function panelBoyu(tam) {
    if (!(acikMi() && panelAcik() && haritaAcik())) return;
    panelTam = tam;
    guncelle();
  }
  // Panel boyu (yarım / tam) her tarih girdisinde hatırlanır: geri tuşuyla
  // dönülen kayıt bırakıldığı boyda açılır (eskiden hep yarıma düşüyordu).
  var BOYLAR = {};
  function girdiAnahtari() {
    var n = window.navigation;
    return n && n.currentEntry ? n.currentEntry.key : location.pathname + "#" + derinlik();
  }
  var boyBekleyen = null;
  function boyKaydet() { if (boyBekleyen == null && haritaAcik()) BOYLAR[girdiAnahtari()] = panelTam; }
  window.addEventListener("popstate", function () {
    var k = girdiAnahtari();
    if (!(k in BOYLAR)) return;
    boyBekleyen = BOYLAR[k];
    var dene = function (n) {
      if (panelAcik() && haritaAcik()) { var b = boyBekleyen; boyBekleyen = null; if (b !== panelTam) panelBoyu(b); return; }
      if (n > 0) setTimeout(function () { dene(n - 1); }, 120); else boyBekleyen = null;
    };
    setTimeout(function () { dene(8); }, 60);
  });
  document.querySelectorAll("main > section").forEach(function (s) { new MutationObserver(guncelle).observe(s, { attributes: true, attributeFilter: ["hidden"] }); });
  var pnl = panel();
  if (pnl) new MutationObserver(function () { if (pnl.hidden) pnl.style.transform = ""; guncelle(); }).observe(pnl, { attributes: true, attributeFilter: ["hidden"] });
  var icerik = document.getElementById("detail-content");
  if (icerik) new MutationObserver(function () { rozetle(); donusYaz(); }).observe(icerik, { childList: true });
  window.addEventListener("popstate", function () { setTimeout(function () { rozetle(); donusYaz(); }, 0); });
  ["pushState", "replaceState"].forEach(function (m) {
    var f = history[m];
    history[m] = function () { var r = f.apply(this, arguments); if (panelAcik()) boyKaydet(); setTimeout(function () { rozetle(); donusYaz(); }, 0); return r; };
  });
  disBagla();
  document.addEventListener("DOMContentLoaded", disBagla);
  window.addEventListener("load", disBagla);
  new MutationObserver(etiketle).observe(HTML, { attributes: true, attributeFilter: ["lang"] });

  // Panelin tutamağı (çekme yeri) -- yalnız kabukta görünür.
  if (pnl) {
    var tut = document.createElement("div");
    tut.className = "uyg-tutamak uyg-tutamak--panel";
    tut.setAttribute("aria-hidden", "true");
    pnl.insertBefore(tut, pnl.firstChild);
    tut.addEventListener("click", function () { panelBoyu(!panelTam); });
    tut.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); panelBoyu(!panelTam); }
    });
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

  function tiklamayiYut(el) {
    function yut(e) { e.stopPropagation(); e.preventDefault(); }
    el.addEventListener("click", yut, { capture: true, once: true });
    setTimeout(function () { el.removeEventListener("click", yut, { capture: true }); }, 350);
  }

  function hareketleriBagla(DragGesture) {
    // 1) Aşağı çekince kapanan sayfalar: ayrıntı paneli, Okuma, Daha.
    // kaynak (ops.): hareketi dinleyen öğe, el'den başkaysa -- panelin
    // düğmeleri (kapat, paylaş, yazdır...) panelin çocuğu değil, sabit
    // konumlu kardeşleri; parmak onların üstünde başlayınca da panel çekilir.
    function cekipKapat(el, acikmi, kapat, kaynak) {
      if (!el) return;
      var dinleyen = kaynak || el;
      new DragGesture(dinleyen, function (s) {
        if (!acikMi() || !acikmi()) return;
        if (s.first && el.scrollTop > 0) { s.cancel(); return; }
        // Yarım panel yukarı çekilince tam boya büyür (haritadaki panel).
        if (el === panel() && !s.active && s.movement[1] < -50 && yarimMi()) { tiklamayiYut(dinleyen); panelBoyu(true); return; }
        // İçerik kaydırılmışsa (yukarı itip geri gelindiyse) çekme sayılmaz.
        var dy = el.scrollTop > 0 ? 0 : Math.max(0, s.movement[1]);
        if (s.active) {
          el.style.transition = "none";
          el.style.transform = dy ? "translateY(" + dy + "px)" : "";
          return;
        }
        el.style.transition = "";
        el.style.transform = "";
        // Sürükleme bir dokunuş değil: parmak bir düğmenin üstünde başlayıp
        // orada bittiyse o düğmeye basılmış sayılmaz.
        if (Math.abs(s.movement[1]) > 10) tiklamayiYut(dinleyen);
        if (dy > KAPAT_ESIK || (s.swipe[1] === 1 && dy > SAVURMA_ESIK)) kapat();
      }, secenek({ axis: "y" }));
    }
    cekipKapat(panel(), panelAcik, paneliKapat);
    ["detail-close", "detail-print", "detail-share", "detail-notebook-toggle", "detail-share-visual"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b && b !== panel() && !panel().contains(b)) cekipKapat(panel(), panelAcik, paneliKapat, b);
    });
    cekipKapat(okuma, function () { return acikSayfa === okuma; }, function () { sayfaKapat(); });
    cekipKapat(daha, function () { return acikSayfa === daha; }, function () { sayfaKapat(); });
    // Defterim (K13) da alttan açılan sayfa: aşağı çekmek ✕ ile aynı adımdır.
    var defterEl = document.getElementById("defter-panel");
    if (defterEl) cekipKapat(defterEl, function () { return !defterEl.hidden; }, function () { tikla("defter-toggle"); });

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

  // --- Yeni sürüm hazır (K18) ----------------------------------------------------
  // sw.js yeni sürümde hemen devralır (skipWaiting + clients.claim); uzun
  // yaşayan bir uygulama oturumunda açık kalan eski kabuk ile yeni betikler
  // uyuşmayabilir. Devralma görülünce okumayı bölmeden sessiz bir çubuk çıkar:
  // "Yeni sürüm hazır · Yenile". Kendiliğinden yenileme yok (okuyan yeri kaybetmesin);
  // ✕ ile kapatılır. İlk kurulumda (önceden denetleyici yokken) çıkmaz.
  var yeniSurumEl = null, yeniSurumKapali = false;
  function guncellemeYaz() {
    if (!yeniSurumEl) return;
    $(".uyg-guncelleme__ad", yeniSurumEl).textContent = t(ETIKET.yeniSurum);
    $(".uyg-guncelleme__yenile", yeniSurumEl).textContent = t(ETIKET.yenile);
    $(".uyg-guncelleme__kapat", yeniSurumEl).setAttribute("aria-label", t(ETIKET.kapat));
  }
  function yeniSurum() {
    if (yeniSurumEl || yeniSurumKapali || !acikMi()) return;
    yeniSurumEl = document.createElement("div");
    yeniSurumEl.className = "uyg-guncelleme";
    yeniSurumEl.setAttribute("role", "status");
    yeniSurumEl.innerHTML = '<span class="uyg-guncelleme__ad"></span><button type="button" class="uyg-guncelleme__yenile"></button>'
      + '<button type="button" class="uyg-daire uyg-guncelleme__kapat">' + svg("kapat", 18) + "</button>";
    document.body.appendChild(yeniSurumEl);
    $(".uyg-guncelleme__yenile", yeniSurumEl).addEventListener("click", function () { location.reload(); });
    $(".uyg-guncelleme__kapat", yeniSurumEl).addEventListener("click", function () {
      yeniSurumKapali = true;
      yeniSurumEl.remove();
      yeniSurumEl = null;
    });
    guncellemeYaz();
  }
  try {
    if ("serviceWorker" in navigator) {
      var denetleyiciVardi = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        if (denetleyiciVardi) yeniSurum();
        denetleyiciVardi = true;
      });
    }
  } catch (e) { /* Service Worker yok / engelli */ }

  (mq.addEventListener ? mq.addEventListener("change", uygula) : mq.addListener(uygula));
  etiketle();
  uygula();
})();
