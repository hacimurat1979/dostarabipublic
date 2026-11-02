/* Okuma araçları (2026-10-29, kullanıcı onayı): Dinleyerek oku + Okuma kipi.
 *
 * okuma-yuzeyi.js okuma görünümlerinde (Fütûhât / Füsûs / Mişkât) sağ alta bir
 * daire düğme koyar; dokununca bu dosya tembel iner (view-loader.js ONCE,
 * window.__dostOnceYukle) ve düğmenin üstünde küçük bir panel açar. Hiçbir şey
 * sunucuya gitmez: ses cihazın kendi konuşma motorundan (speechSynthesis), kip
 * ve hız bu cihazın localStorage'ındadır.
 *
 *  - Dinle: görünür paragraflardan başlayarak metni sırayla okur; okunan paragraf
 *    altın bir şeritle işaretlenir ve ekranda tutulur. Duraklat / önceki / sonraki
 *    paragraf / hız (0,8 · 1 · 1,25 · 1,5). Arapça harfli bloklar (âyet, dua) okunmaz:
 *    Türkçe/İngilizce/Portekizce bir ses onları yanlış telaffuz eder. Cihazda o dilin
 *    sesi yoksa söylenir; konuşma motoru hiç yoksa Dinle bölümü hiç gösterilmez.
 *  - Okuma kipi: Normal · Sepya · Odak · Kontrast. Yalnız okuma görünümlerinde
 *    uygulanır (sitenin geri kalanı değişmez). Odak: okunan/ekranın ortasındaki
 *    paragraf tam, ötekiler soluk. Kontrast: tema açıksa beyaz zemin siyah yazı,
 *    koyuysa siyah zemin beyaz yazı; bağlantılar altı çizili. Sistem "daha yüksek
 *    kontrast" istiyorsa (prefers-contrast: more) ve kullanıcı kip seçmemişse Kontrast
 *    kendiliğinden gelir.
 */
(function () {
  "use strict";
  if (window.DostOkumaKipi) return;
  var HTML = document.documentElement;
  var I18n = window.DostI18n;
  var GU = window.DostGraphUtils;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function lang() { return (I18n && I18n.getLang && I18n.getLang()) || "tr"; }
  function gk(fn, yedek) { try { return fn(); } catch (e) { return yedek; } }
  var azHareket = window.matchMedia("(prefers-reduced-motion: reduce)");

  var KIP_ANAHTAR = "dost-okuma-kipi";
  var HIZ_ANAHTAR = "dost-okuma-hiz";
  var KIPLER = ["normal", "sepya", "odak", "kontrast"];
  var HIZLAR = [0.8, 1, 1.25, 1.5];
  // Yazı ayarları (2026-10-30, fikir R6): satır aralığı, satır uzunluğu, yazı tipi. Yalnız okuma görünümlerinde etkili.
  var YAZI = {
    satir: { anahtar: "dost-okuma-satir", degerler: ["normal", "genis", "cokgenis"] },
    sutun: { anahtar: "dost-okuma-sutun", degerler: ["dar", "normal", "genis"] },
    yazi: { anahtar: "dost-okuma-yazi", degerler: ["normal", "serif", "sans"] },
  };
  var DIL_KODU = { tr: "tr-TR", en: "en-US", pt: "pt-BR" };

  var Y = {
    baslik: { tr: "Okuma araçları", en: "Reading tools", pt: "Ferramentas de leitura" },
    dinle: { tr: "Dinle", en: "Listen", pt: "Ouvir" },
    cal: { tr: "Dinle", en: "Listen", pt: "Ouvir" },
    duraklat: { tr: "Duraklat", en: "Pause", pt: "Pausar" },
    surdur: { tr: "Sürdür", en: "Resume", pt: "Continuar" },
    onceki: { tr: "Önceki paragraf", en: "Previous paragraph", pt: "Parágrafo anterior" },
    sonraki: { tr: "Sonraki paragraf", en: "Next paragraph", pt: "Próximo parágrafo" },
    hiz: { tr: "Okuma hızı", en: "Reading speed", pt: "Velocidade de leitura" },
    sesYok: { tr: "Bu cihazda Türkçe ses bulunamadı; cihazın konuşma ayarlarından bir ses eklenebilir.", en: "No English voice was found on this device; one can be added in the device's speech settings.", pt: "Nenhuma voz em português foi encontrada neste dispositivo; é possível adicionar uma nas configurações de fala." },
    okunacakYok: { tr: "Bu ekranda okunacak metin bulunamadı.", en: "No text to read was found on this screen.", pt: "Nenhum texto para ler foi encontrado nesta tela." },
    bitti: { tr: "Metnin sonuna gelindi.", en: "Reached the end of the text.", pt: "Chegou ao fim do texto." },
    kip: { tr: "Okuma kipi", en: "Reading mode", pt: "Modo de leitura" },
    yaziBaslik: { tr: "Yazı ayarları", en: "Text settings", pt: "Ajustes de texto" },
    yaziGrup: {
      satir: { tr: "Satır aralığı", en: "Line spacing", pt: "Espaçamento entre linhas" },
      sutun: { tr: "Satır uzunluğu", en: "Line length", pt: "Largura da linha" },
      yazi: { tr: "Yazı tipi", en: "Typeface", pt: "Fonte" },
    },
    yaziAd: {
      satir: { normal: { tr: "Normal", en: "Normal", pt: "Normal" }, genis: { tr: "Geniş", en: "Wide", pt: "Amplo" }, cokgenis: { tr: "Çok geniş", en: "Extra wide", pt: "Muito amplo" } },
      sutun: { dar: { tr: "Dar", en: "Narrow", pt: "Estreita" }, normal: { tr: "Normal", en: "Normal", pt: "Normal" }, genis: { tr: "Geniş", en: "Wide", pt: "Larga" } },
      yazi: { normal: { tr: "Sitenin", en: "Site's", pt: "Do site" }, serif: { tr: "Serif", en: "Serif", pt: "Serifada" }, sans: { tr: "Sans", en: "Sans", pt: "Sem serifa" } },
    },
    icinde: { tr: "Bu kısımda", en: "In this part", pt: "Nesta parte" },
    secim: {
      vurgula: { tr: "Vurgula", en: "Highlight", pt: "Destacar" },
      not: { tr: "Not", en: "Note", pt: "Nota" },
      alinti: { tr: "Alıntı", en: "Quote", pt: "Citação" },
      dinle: { tr: "Buradan dinle", en: "Listen from here", pt: "Ouvir daqui" },
      ad: { tr: "Seçili metin için araçlar", en: "Tools for the selected text", pt: "Ferramentas para o texto selecionado" },
    },
    icindeYok: { tr: "Bu ekranda başlık yok.", en: "No headings on this screen.", pt: "Não há títulos nesta tela." },
    yaziSifirla: { tr: "Yazı ayarlarını sıfırla", en: "Reset text settings", pt: "Redefinir ajustes de texto" },
    kipAd: {
      normal: { tr: "Normal", en: "Normal", pt: "Normal" },
      sepya: { tr: "Sepya", en: "Sepia", pt: "Sépia" },
      odak: { tr: "Odak", en: "Focus", pt: "Foco" },
      kontrast: { tr: "Kontrast", en: "Contrast", pt: "Contraste" },
    },
    kipIpucu: {
      normal: { tr: "Sitenin kendi görünümü", en: "The site's own look", pt: "A aparência do site" },
      sepya: { tr: "Sıcak, göz yormayan kâğıt tonu", en: "Warm, easy-on-the-eyes paper tone", pt: "Tom de papel quente e suave" },
      odak: { tr: "Okunan paragraf tam, ötekiler soluk", en: "The current paragraph in full, the rest dimmed", pt: "O parágrafo atual em destaque, os outros esmaecidos" },
      kontrast: { tr: "En yüksek okunaklılık", en: "Highest legibility", pt: "Máxima legibilidade" },
    },
    kapat: { tr: "Kapat", en: "Close", pt: "Fechar" },
    yanBaslik: { tr: "Yan yana oku", en: "Read side by side", pt: "Ler lado a lado" },
    yanAc: { tr: "İkinci bir metinle yan yana aç…", en: "Open beside a second text…", pt: "Abrir ao lado de um segundo texto…" },
    alintiBaslik: { tr: "Alıntı ve atıf", en: "Quote and cite", pt: "Citar e referenciar" },
    alintiAc: { tr: "Alıntıla, atıfla ya da kart yap…", en: "Quote, cite or make a card…", pt: "Citar, referenciar ou criar cartão…" },
    alintiYuklenemedi: { tr: "Alıntı penceresi yüklenemedi.", en: "The quote window could not be loaded.", pt: "Não foi possível carregar a janela de citação." },
    notBaslik: { tr: "Notum", en: "My note", pt: "Minha nota" },
    notYaz: { tr: "Bu paragrafa not yaz", en: "Write a note on this paragraph", pt: "Escrever uma nota neste parágrafo" },
    notDuzenle: { tr: "Bu paragraftaki notumu düzenle", en: "Edit my note on this paragraph", pt: "Editar minha nota neste parágrafo" },
    notAlan: { tr: "Kendi notun (yalnız bu cihazda kalır)", en: "Your own note (stays on this device only)", pt: "Sua própria nota (fica apenas neste dispositivo)" },
    notKaydet: { tr: "Kaydet", en: "Save", pt: "Salvar" },
    notVazgec: { tr: "Vazgeç", en: "Cancel", pt: "Cancelar" },
    notSil: { tr: "Sil", en: "Delete", pt: "Excluir" },
    notKaydedildi: { tr: "Not Defterim'e kaydedildi.", en: "Note saved to My Notebook.", pt: "Nota salva no Meu Caderno." },
    notSilindi: { tr: "Not silindi.", en: "Note deleted.", pt: "Nota excluída." },
    notYok: { tr: "Bu ekranda not yazılacak paragraf bulunamadı.", en: "No paragraph to attach a note to was found on this screen.", pt: "Nenhum parágrafo para anexar uma nota foi encontrado nesta tela." },
    notIsareti: { tr: "Bu paragrafta notun var", en: "You have a note on this paragraph", pt: "Você tem uma nota neste parágrafo" },
  };

  // ── Depo ────────────────────────────────────────────────────────────────
  function oku(k, yedek) { return gk(function () { var v = localStorage.getItem(k); return v == null ? yedek : v; }, yedek); }
  function yaz(k, v) { gk(function () { localStorage.setItem(k, v); }); }

  // ── Yazı ayarları ───────────────────────────────────────────────────────
  var yaziDeger = { satir: "normal", sutun: "normal", yazi: "normal" };
  function yaziUygula(grup, deger, kaydet) {
    var g = YAZI[grup];
    if (!g || g.degerler.indexOf(deger) < 0) deger = "normal";
    yaziDeger[grup] = deger;
    var oznitelik = "data-okuma-" + grup;
    if (deger === "normal") HTML.removeAttribute(oznitelik); else HTML.setAttribute(oznitelik, deger);
    if (kaydet) { if (deger === "normal") gk(function () { localStorage.removeItem(g.anahtar); }); else yaz(g.anahtar, deger); }
  }
  function yaziKayitliUygula() { Object.keys(YAZI).forEach(function (grup) { yaziUygula(grup, oku(YAZI[grup].anahtar, "normal"), false); }); }
  function yaziSifirla() { Object.keys(YAZI).forEach(function (grup) { yaziUygula(grup, "normal", true); }); paneliTazele(); }

  // ── Okuma kipi ──────────────────────────────────────────────────────────
  function kayitliKip() {
    var k = oku(KIP_ANAHTAR, "");
    if (KIPLER.indexOf(k) >= 0) return k;
    if (window.matchMedia && window.matchMedia("(prefers-contrast: more)").matches) return "kontrast";
    return "normal";
  }
  var kip = "normal";
  function kipUygula(k, kaydet) {
    kip = KIPLER.indexOf(k) >= 0 ? k : "normal";
    if (kip === "normal") HTML.removeAttribute("data-okuma-kipi");
    else HTML.setAttribute("data-okuma-kipi", kip);
    if (kaydet) yaz(KIP_ANAHTAR, kip);
    odakKur();
    paneliTazele();
  }

  // ── Okunacak bloklar ────────────────────────────────────────────────────
  var BLOK = "h2, h3, h4, p, li, blockquote";
  var DISARI = ".okuma-gezinti, .futuhat-toolbar, .okuma-yeri-hap, .futuhat-popup, nav, button, .okuma-arac, .okuma-arac-dugme, [aria-hidden='true']";
  var ARAPCA = /[؀-ۿݐ-ݿࢠ-ࣿ]/g;
  var makaleBul = function () { return null; };   // okuma-yuzeyi.js verir

  function arapcaMi(metin) {
    var a = (metin.match(ARAPCA) || []).length;
    var harf = (metin.match(/\p{L}/gu) || []).length;
    return harf > 0 && a / harf > 0.4;
  }
  function bloklar() {
    var m = makaleBul();
    if (!m) return [];
    return Array.prototype.filter.call(m.querySelectorAll(BLOK), function (e) {
      if (e.offsetParent === null) return false;
      if (e.closest(DISARI)) return false;
      if (e.querySelector(BLOK)) return false;               // yalnız en içteki blok
      var d = e.closest("details");
      if (d && !d.open) return false;
      var s = (e.textContent || "").trim();
      return s.length >= 2;
    });
  }
  function duzMetin(e) {
    return (e.innerText || e.textContent || "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
  }
  function ustSinir() {
    var h = document.querySelector(".app-header");
    return h ? h.getBoundingClientRect().bottom : 0;
  }

  // ── Bu kısımda (2026-10-30, fikir R4): makalenin başlıkları, dokununca oraya atlar ───────────────
  function baslikListesi() {
    var a = makaleBul();
    if (!a) return [];
    return Array.prototype.slice.call(a.querySelectorAll("h2, h3, h4")).filter(function (e) {
      return e.offsetParent !== null && !e.closest(DISARI) && e.textContent.trim();
    }).slice(0, 60);
  }
  function icindekilerYaz() {
    var b = panel && panel.querySelector('[data-bol="icinde"]');
    if (!b) return;
    var liste = baslikListesi();
    b.hidden = liste.length < 3;
    if (b.hidden) return;
    var ust = ustSinir(), simdi = 0;
    liste.forEach(function (e, i) { if (e.getBoundingClientRect().top <= ust + 40) simdi = i; });
    b.querySelector(".okuma-arac__alt").textContent = t(Y.icinde);
    var ul = b.querySelector(".okuma-arac__icinde");
    ul.innerHTML = "";
    liste.forEach(function (e, i) {
      var li = document.createElement("li");
      var d = document.createElement("button");
      d.type = "button"; d.className = "okuma-arac__icinde-oge"; d.dataset.baslik = String(i);
      if (e.tagName === "H4") d.classList.add("okuma-arac__icinde-oge--alt");
      if (i === simdi) d.setAttribute("aria-current", "true");
      d.textContent = e.textContent.trim().replace(/\s+/g, " ").slice(0, 90);
      li.appendChild(d); ul.appendChild(li);
    });
  }
  // ── Seçim çubuğu (2026-10-31, fikir D3 + D4, kullanıcı onaylı): telefonda metin seçilince Vurgula · Not · Alıntı · Buradan dinle ──
  // Var olan araçların kısa yolu: vurgu okuma-isaret.js'te, not ve alıntı ve dinleme bu dosyada. Yeni içerik üretilmez.
  var secimEl = null, secimKuruldu = false, secimBlok = null, secimAralik = null, secimGizleZaman = null, secimEtkilesim = false, istenenNot = null;
  function secimBlokuBul() {
    var sl = window.getSelection && window.getSelection();
    var m = makaleBul();
    if (!sl || !sl.rangeCount || sl.isCollapsed || !m) return null;
    var r = sl.getRangeAt(0);
    if (!m.contains(r.commonAncestorContainer)) return null;
    var n = r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer;
    var blok = n && n.closest && n.closest("p, li, blockquote");
    return blok && m.contains(blok) ? { blok: blok, rect: r.getBoundingClientRect(), uzunluk: sl.toString().trim().length, aralik: r.cloneRange() } : null;
  }
  function secimCubugunuKur() {
    secimEl = document.createElement("div");
    secimEl.className = "okuma-secim";
    secimEl.hidden = true;
    secimEl.setAttribute("role", "toolbar");
    var IK = function (d) { return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + "</svg>"; };
    var dugmeler = [
      ["vurgula", IK('<path d="M4 17 17 4l3 3L7 20H4Z"/>')],
      ["not", IK('<path d="M5 5h14v10H9l-4 4Z"/>')],
      ["alinti", IK('<path d="M7 8h4v4H7zM13 8h4v4h-4zM7 12c0 3 1 4 3 4M13 12c0 3 1 4 3 4"/>')],
      ["dinle", IK('<path d="M5 9v6M9 6v12M13 8v8M17 5v14"/>')],
    ];
    secimEl.innerHTML = dugmeler.map(function (d) { return '<button type="button" data-secim="' + d[0] + '">' + d[1] + "<span></span></button>"; }).join("");
    document.body.appendChild(secimEl);
    // Düğmeye dokunmak bazı tarayıcılarda seçimi siler: etkileşim sürerken çubuk saklanmaz; eylemler seçimin kendi kaydını kullanır.
    secimEl.addEventListener("pointerdown", function () { secimEtkilesim = true; setTimeout(function () { secimEtkilesim = false; }, 800); });
    secimEl.addEventListener("mousedown", function (e) { e.preventDefault(); });
    secimEl.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-secim]");
      if (!b) return;
      var e0 = b.dataset.secim, blok = secimBlok;
      if (e0 === "vurgula") {
        var ar = secimAralik;
        window.__dostOnceYukle("okuma-isaret").then(function () {
          // Dokunuş seçimi silmiş olabilir: kayıtlı aralık geri konur, işaret modülü seçimi okur, sonra vurgulanır.
          gk(function () { var sl = window.getSelection(); if (ar && (!sl.rangeCount || sl.isCollapsed)) { sl.removeAllRanges(); sl.addRange(ar); } });
          window.DostOkumaIsaret.baglan(isaretBaglami());
          window.DostOkumaIsaret.secimiAl();
          window.DostOkumaIsaret.vurgula("altin");
        }).catch(function () {});
      } else if (e0 === "not") {
        istenenNot = blok; paneliAc();
      } else if (e0 === "alinti") {
        alintiAc();
      } else if (e0 === "dinle") {
        if (oynuyor || duraklatildi) bitir(false);
        baslat(blok);
      }
      secimCubugunuGizle();
      if (e0 !== "vurgula") gk(function () { window.getSelection().removeAllRanges(); });
    });
  }
  function secimCubugunuYaz() {
    if (!secimEl) return;
    secimEl.setAttribute("aria-label", t(Y.secim.ad));
    Array.prototype.forEach.call(secimEl.querySelectorAll("button"), function (b) { b.querySelector("span").textContent = t(Y.secim[b.dataset.secim]); });
  }
  function secimCubugunuGizle() { if (secimEl) secimEl.hidden = true; secimBlok = null; }
  function secimCubugunuGoster() {
    if (acikMi()) { secimCubugunuGizle(); return; }
    var s = secimBlokuBul();
    if (!s || s.uzunluk < 3) {
      if (!secimEtkilesim) { clearTimeout(secimGizleZaman); secimGizleZaman = setTimeout(function () { if (!secimEtkilesim && !secimBlokuBul()) secimCubugunuGizle(); }, 350); }
      return;
    }
    clearTimeout(secimGizleZaman);
    if (!secimEl) secimCubugunuKur();
    secimBlok = s.blok; secimAralik = s.aralik;
    secimCubugunuYaz();
    secimEl.hidden = false;
    var w = secimEl.offsetWidth, h = secimEl.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    var yAlt = s.rect.bottom + 14;
    var y = yAlt + h > vh - 70 ? Math.max(ustSinir() + 6, s.rect.top - h - 14) : yAlt;   // altta yer yoksa seçimin üstüne
    var x = Math.min(Math.max(8, s.rect.left + s.rect.width / 2 - w / 2), vw - w - 8);
    secimEl.style.left = Math.round(x) + "px";
    secimEl.style.top = Math.round(y) + "px";
  }
  function secimIzle() {
    if (secimKuruldu) return;
    secimKuruldu = true;
    var zaman = null;
    document.addEventListener("selectionchange", function () { clearTimeout(zaman); zaman = setTimeout(secimCubugunuGoster, 220); });
    window.addEventListener("scroll", function () { if (secimEl && !secimEl.hidden && !secimEtkilesim) secimCubugunuGizle(); }, { passive: true });
    window.addEventListener("pagehide", secimCubugunuGizle);
    secimCubugunuGoster();
  }

  function basligaGit(i) {
    var e = baslikListesi()[i];
    if (!e) return;
    window.scrollTo({ top: Math.max(0, e.getBoundingClientRect().top + window.scrollY - ustSinir() - 12), behavior: azHareket.matches ? "instant" : "smooth" });
    paneliKapat();
    if (dugme) dugme.focus({ preventScroll: true });
  }

  // ── Notlarım (2026-10-29, Defterim 2.0): paragrafa yalnız bu cihazda duran kendi notun ──────────
  // Kayıt: { id, yol, baslik, alinti (paragrafın ilk 90 harfi), metin, t }. Paragraf sırası değil alıntı
  // eşleştirir; metin aynı kaldıkça not paragrafını bulur. Notlar Defterim paneli listelenir (kavram-defteri.js),
  // yedek ve taşıma kodu assets/defter-yedek.js'te. Site hiçbir notu sunucuya göndermez.
  var NOT_DEPO = "dost-notlarim", NOT_HEDEF = "dost-not-hedef";
  function notlariOku() { var a = gk(function () { return JSON.parse(localStorage.getItem(NOT_DEPO) || "[]"); }, []); return Array.isArray(a) ? a : []; }
  function notlariYaz(a) { yaz(NOT_DEPO, JSON.stringify(a)); gk(function () { window.dispatchEvent(new Event("dost-notlar")); }); }
  function alintiAl(e) { return duzMetin(e).slice(0, 90); }
  function notBul(alinti) {
    var yol = location.pathname;
    return notlariOku().filter(function (n) { return n.yol === yol && n.alinti === alinti; })[0] || null;
  }
  function notIsaretle() {
    var yol = location.pathname, liste = notlariOku().filter(function (n) { return n.yol === yol; });
    var tum = bloklar();
    tum.forEach(function (e) { e.classList.remove("okuma-notlu"); e.removeAttribute("data-okuma-not"); });
    if (!liste.length) return;
    tum.forEach(function (e) {
      var a = alintiAl(e);
      if (liste.some(function (n) { return n.alinti === a; })) { e.classList.add("okuma-notlu"); e.setAttribute("data-okuma-not", t(Y.notIsareti)); }
    });
  }
  function notHedefineGit() {
    var h = gk(function () { return JSON.parse(localStorage.getItem(NOT_HEDEF) || "null"); }, null);
    if (!h) return;
    gk(function () { localStorage.removeItem(NOT_HEDEF); });
    if (h.yol !== location.pathname) return;
    setTimeout(function () {
      var e = bloklar().filter(function (x) { return alintiAl(x) === h.alinti; })[0];
      if (!e) return;
      e.scrollIntoView({ block: "center", behavior: azHareket.matches ? "auto" : "smooth" });
      e.classList.add("okuma-not-vurgu");
      setTimeout(function () { e.classList.remove("okuma-not-vurgu"); }, 2600);
    }, 700);
  }
  var notHedef = null, notDuzen = false, notDurum = "";
  function notAdayi() {
    if (oynuyor && sesBlok && sesBlok.isConnected) return sesBlok;
    var liste = bloklar().filter(function (e) { return !/^H[1-6]$/.test(e.tagName); });
    var cizgi = ustSinir() + (window.innerHeight - ustSinir()) * 0.38, yakin = null, fark = Infinity;
    liste.forEach(function (e) {
      var r = e.getBoundingClientRect();
      var d = (r.top <= cizgi && r.bottom >= cizgi) ? 0 : Math.min(Math.abs(r.top - cizgi), Math.abs(r.bottom - cizgi));
      if (d < fark) { fark = d; yakin = e; }
    });
    return yakin;
  }
  function notBasligi() {
    var m = makaleBul();
    var b = m && m.querySelector(".futuhat-hero__title, .fusus-article__title");
    return (b ? b.textContent : document.title).replace(/\s+/g, " ").trim();
  }
  function notBolumuYaz() {
    if (!panel) return;
    var k = panel.querySelector('[data-bol="not"]');
    if (!k) return;
    var mevcut = notHedef ? notBul(alintiAl(notHedef)) : null;
    k.innerHTML = '<h3 class="okuma-arac__alt"></h3>';
    k.querySelector(".okuma-arac__alt").textContent = t(Y.notBaslik);
    if (!notDuzen) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "okuma-arac__cal okuma-arac__not-ac"; b.dataset.a = "not-ac";
      b.textContent = t(mevcut ? Y.notDuzenle : Y.notYaz);
      k.appendChild(b);
    } else {
      var alinti = notHedef ? alintiAl(notHedef) : "";
      var q = document.createElement("blockquote"); q.className = "okuma-arac__alinti"; q.textContent = alinti + (alinti.length >= 90 ? "…" : "");
      var etiket = document.createElement("label"); etiket.className = "okuma-arac__not-etiket"; etiket.htmlFor = "okuma-not-metin"; etiket.textContent = t(Y.notAlan);
      var ta = document.createElement("textarea"); ta.id = "okuma-not-metin"; ta.className = "okuma-arac__not-metin"; ta.rows = 4; ta.maxLength = 800; ta.value = mevcut ? mevcut.metin : "";
      var sat = document.createElement("div"); sat.className = "okuma-arac__kontrol okuma-arac__not-eylem";
      [["not-kaydet", Y.notKaydet, "okuma-arac__cal"], ["not-vazgec", Y.notVazgec, "okuma-arac__chip"]].concat(mevcut ? [["not-sil", Y.notSil, "okuma-arac__chip"]] : []).forEach(function (x) {
        var d = document.createElement("button"); d.type = "button"; d.className = x[2]; d.dataset.a = x[0]; d.textContent = t(x[1]); sat.appendChild(d);
      });
      k.appendChild(q); k.appendChild(etiket); k.appendChild(ta); k.appendChild(sat);
      gk(function () { ta.focus({ preventScroll: true }); });
    }
    var n = document.createElement("p"); n.className = "okuma-arac__not"; n.setAttribute("role", "status"); n.textContent = notDurum;
    k.appendChild(n);
  }
  var sonSecim = null;
  document.addEventListener("selectionchange", function () {
    var sl = window.getSelection && window.getSelection();
    var m = makaleBul();
    if (!sl || !sl.rangeCount || sl.isCollapsed || !m) return;
    var r = sl.getRangeAt(0);
    if (!m.contains(r.commonAncestorContainer)) return;
    var metin = sl.toString().replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim();
    if (metin) sonSecim = { metin: metin.slice(0, 700), t: Date.now() };
  });
  function alintiAc() {
    var e = notAdayi(), n = panel && panel.querySelector(".okuma-arac__alinti-not");
    if (!e) { if (n) n.textContent = t(Y.notYok); return; }
    var m = makaleBul();
    var b = m && m.querySelector(".futuhat-hero__title, .fusus-article__title");
    var ey = m && m.querySelector(".futuhat-hero__eyebrow, .fusus-article__eyebrow");
    var bilgi = { baslik: b ? b.textContent.replace(/\s+/g, " ").trim() : document.title, eyebrow: ey ? ey.textContent.replace(/\s+/g, " ").trim() : "", metin: duzMetin(e) };
    // Seçilen metinden kart (2026-10-30, fikir P2): son 3 dakikada makale içinde seçilmiş bir metin varsa o alıntılanır
    // (aynen; paragraf yerine). Künye aynı kalır; metin sitede zaten yazılı olduğu için yeni cümle üretilmez.
    if (sonSecim && Date.now() - sonSecim.t < 180000 && sonSecim.metin.length >= 8) { bilgi.metin = sonSecim.metin; bilgi.secim = true; }
    paneliKapat();
    window.__dostOnceYukle("okuma-alinti").then(function () { window.DostOkumaAlinti.ac(bilgi); })
      .catch(function () { if (dugme) dugme.focus(); });
  }
  function notEylem(a) {
    if (a === "not-ac") {
      notHedef = notAdayi();
      if (!notHedef) { notDurum = t(Y.notYok); notBolumuYaz(); return; }
      notDuzen = true; notDurum = ""; notBolumuYaz();
    } else if (a === "not-vazgec") { notDuzen = false; notDurum = ""; notBolumuYaz(); }
    else if (a === "not-kaydet" || a === "not-sil") {
      var alinti = notHedef ? alintiAl(notHedef) : "";
      var liste = notlariOku().filter(function (n) { return !(n.yol === location.pathname && n.alinti === alinti); });
      var metin = (panel.querySelector("#okuma-not-metin") || {}).value || "";
      metin = metin.trim();
      if (a === "not-kaydet" && metin) liste.unshift({ id: "n" + Date.now().toString(36), yol: location.pathname, baslik: notBasligi(), alinti: alinti, metin: metin, t: Date.now() });
      notlariYaz(liste);
      notDuzen = false;
      notDurum = a === "not-sil" || !metin ? t(Y.notSilindi) : t(Y.notKaydedildi);
      notIsaretle();
      notBolumuYaz();
    }
  }

  // ── Odak kipi ───────────────────────────────────────────────────────────
  var odakAcik = false, odakKare = 0, odakSimdi = null, odakListe = [];
  function odakIsaretle() {
    odakKare = 0;
    if (kip !== "odak") { odakKapat(); return; }
    var m = makaleBul();
    if (!m || m.offsetParent === null) { odakKapat(); return; }
    if (!odakListe.length || !odakListe[0].isConnected) {
      // Başlıklar odağa girmez ve soluklaşmaz: odak paragrafı seçer (başlık kısa, çizgiyi hep o kapardı).
      odakListe = bloklar().filter(function (e) { return !/^H[1-6]$/.test(e.tagName); });
      odakListe.forEach(function (e) { e.classList.add("okuma-odak-blok"); });
    }
    var hedef = (oynuyor && sesBlok && sesBlok.isConnected) ? sesBlok : null;
    if (!hedef) {
      var cizgi = ustSinir() + (window.innerHeight - ustSinir()) * 0.38, enYakin = Infinity;
      odakListe.forEach(function (e) {
        var r = e.getBoundingClientRect();
        var d = (r.top <= cizgi && r.bottom >= cizgi) ? 0 : Math.min(Math.abs(r.top - cizgi), Math.abs(r.bottom - cizgi));
        if (d < enYakin) { enYakin = d; hedef = e; }
      });
    }
    if (hedef !== odakSimdi) {
      if (odakSimdi) odakSimdi.classList.remove("okuma-odak-simdi");
      odakSimdi = hedef;
      if (odakSimdi) odakSimdi.classList.add("okuma-odak-simdi");
    }
  }
  function odakKapat() {
    odakListe.forEach(function (e) { e.classList.remove("okuma-odak-blok", "okuma-odak-simdi"); });
    odakListe = []; odakSimdi = null;
  }
  function odakPlanla() { if (!odakKare) odakKare = requestAnimationFrame(odakIsaretle); }
  function odakKur() {
    var gerek = kip === "odak";
    if (gerek && !odakAcik) {
      odakAcik = true;
      window.addEventListener("scroll", odakPlanla, { passive: true });
      window.addEventListener("resize", odakPlanla, { passive: true });
    } else if (!gerek && odakAcik) {
      odakAcik = false;
      window.removeEventListener("scroll", odakPlanla);
      window.removeEventListener("resize", odakPlanla);
      odakKapat();
    }
    if (gerek) odakPlanla();
  }

  // ── Dinle ───────────────────────────────────────────────────────────────
  var SES_VAR = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  var oynuyor = false, duraklatildi = false, sesBlok = null, sesListe = [], sesSira = 0, parcaSira = 0;
  var parcalar = [], jeton = 0, hiz = (function () { var h = parseFloat(oku(HIZ_ANAHTAR, "1")); return HIZLAR.indexOf(h) >= 0 ? h : 1; })();
  var notMetni = "";

  function sesSec() {
    var kod = DIL_KODU[lang()] || "tr-TR", on = kod.slice(0, 2);
    var v = gk(function () { return window.speechSynthesis.getVoices(); }, []) || [];
    var eslesen = v.filter(function (x) { return (x.lang || "").toLowerCase().replace("_", "-").indexOf(on) === 0; });
    var tam = eslesen.filter(function (x) { return (x.lang || "").toLowerCase().replace("_", "-") === kod.toLowerCase(); });
    var ses = (tam.length ? tam : eslesen);
    ses = ses.filter(function (x) { return x.localService; }).concat(ses)[0] || null;
    return { kod: kod, ses: ses, listeBos: v.length === 0, eslesenYok: v.length > 0 && !eslesen.length };
  }
  function cumleler(metin) {
    var d = metin.match(/[^.!?…]+[.!?…]+["”’)»]*\s*|[^.!?…]+$/g) || [metin];
    var out = [], cur = "";
    d.forEach(function (c) {
      if ((cur + c).length > 220 && cur) { out.push(cur.trim()); cur = c; }
      else cur += c;
    });
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function bloguIsaretle(e) {
    if (sesBlok) sesBlok.classList.remove("okuma-dinle-simdi");
    sesBlok = e;
    if (e) {
      e.classList.add("okuma-dinle-simdi");
      var r = e.getBoundingClientRect(), ust = ustSinir();
      if (r.top < ust + 8 || r.bottom > window.innerHeight - 90) {
        e.scrollIntoView({ block: "center", behavior: azHareket.matches ? "auto" : "smooth" });
      }
    }
    if (kip === "odak") odakPlanla();
  }
  function konus(blokSirasi, parca) {
    if (!SES_VAR) return;
    var jt = ++jeton;
    window.speechSynthesis.cancel();
    sesSira = blokSirasi;
    var e = sesListe[blokSirasi];
    if (!e || !e.isConnected) { bitir(false); return; }
    bloguIsaretle(e);
    parcalar = cumleler(duzMetin(e));
    parcaSira = Math.min(parca || 0, Math.max(0, parcalar.length - 1));
    oynuyor = true; duraklatildi = false;
    paneliTazele();
    var s = sesSec();
    function sonraki(i) {
      if (jt !== jeton) return;
      parcaSira = i;
      if (i >= parcalar.length) { ilerle(1); return; }
      var u = new SpeechSynthesisUtterance(parcalar[i]);
      u.lang = s.kod;
      if (s.ses) u.voice = s.ses;
      u.rate = hiz;
      u.onend = function () { sonraki(i + 1); };
      u.onerror = function (ev) { if (jt === jeton && ev && ev.error && ev.error !== "interrupted" && ev.error !== "canceled") bitir(false); };
      window.speechSynthesis.speak(u);
    }
    sonraki(parcaSira);
  }
  function ilerle(adim) {
    var i = sesSira + adim;
    // Arapça bloklar atlanır
    while (i >= 0 && i < sesListe.length && arapcaMi(duzMetin(sesListe[i]))) i += adim > 0 ? 1 : -1;
    if (i < 0) i = 0;
    if (i >= sesListe.length) { bitir(true); return; }
    konus(i, 0);
  }
  function bitir(sonaGeldi) {
    jeton++;
    gk(function () { window.speechSynthesis.cancel(); });
    oynuyor = false; duraklatildi = false;
    bloguIsaretle(null);
    if (sonaGeldi) notMetni = t(Y.bitti); else notMetni = "";
    paneliTazele();
  }
  // Medya oturumu (2026-10-30, fikir U5): kilit ekranı ve kulaklık düğmeleri Dinle'yi yönetir (cihaz destekliyorsa).
  function medyaOturumu() {
    var ms = window.navigator && navigator.mediaSession;
    if (!ms) return;
    gk(function () {
      if (window.MediaMetadata) ms.metadata = new MediaMetadata({ title: notBasligi(), artist: "Dost Arabî" });
      ms.setActionHandler("play", function () { if (duraklatildi) surdur(); else if (!oynuyor) baslat(); });
      ms.setActionHandler("pause", function () { if (oynuyor && !duraklatildi) duraklat(); });
      ms.setActionHandler("nexttrack", function () { if (sesListe.length) ilerle(1); });
      ms.setActionHandler("previoustrack", function () { if (sesListe.length) ilerle(-1); });
      ms.setActionHandler("stop", function () { bitir(false); });
    });
  }
  function baslat(hedef) {
    medyaOturumu();
    var s = sesSec();
    if (s.eslesenYok) { notMetni = t(Y.sesYok).replace(/Türkçe|English|português/, function () { return ({ tr: "Türkçe", en: "English", pt: "português" })[lang()]; }); paneliTazele(); }
    else notMetni = "";
    sesListe = bloklar();
    if (!sesListe.length) { notMetni = t(Y.okunacakYok); paneliTazele(); return; }
    var ust = ustSinir(), i = 0;
    // "Buradan dinle" (2026-10-31, fikir D4): seçilen paragraf verilmişse oradan başlanır; yoksa ekranın üstündeki paragraftan.
    var hi = hedef ? sesListe.indexOf(hedef) : -1;
    if (hi >= 0) i = hi;
    else {
      for (; i < sesListe.length; i++) if (sesListe[i].getBoundingClientRect().bottom > ust + 12) break;
      if (i >= sesListe.length) i = 0;
    }
    while (i < sesListe.length && arapcaMi(duzMetin(sesListe[i]))) i++;
    if (i >= sesListe.length) { notMetni = t(Y.okunacakYok); paneliTazele(); return; }
    konus(i, 0);
  }
  function duraklat() {
    jeton++;
    gk(function () { window.speechSynthesis.cancel(); });
    duraklatildi = true;
    paneliTazele();
  }
  function surdur() { konus(sesSira, parcaSira); }
  function hizSec(h) {
    hiz = h; yaz(HIZ_ANAHTAR, String(h));
    if (oynuyor && !duraklatildi) konus(sesSira, parcaSira);   // yeni hızla, aynı cümleden
    else paneliTazele();
  }
  if (SES_VAR) {
    window.addEventListener("pagehide", function () { gk(function () { window.speechSynthesis.cancel(); }); });
    // Makale değişirse (başka kısım) ya da dil değişirse okuma durur.
    new MutationObserver(function () { if (oynuyor || duraklatildi) bitir(false); }).observe(HTML, { attributes: true, attributeFilter: ["lang"] });
  }

  // ── Panel ───────────────────────────────────────────────────────────────
  var panel = null, dugme = null, katman = null;
  function acikMi() { return !!panel && !panel.hidden; }
  function kurPanel() {
    panel = document.createElement("section");
    panel.className = "okuma-arac";
    panel.id = "okuma-arac";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", t(Y.baslik));
    var h = '<header class="okuma-arac__bas"><h2 class="okuma-arac__baslik"></h2><button type="button" class="okuma-arac__kapat" data-a="kapat"></button></header>';
    if (SES_VAR) h += '<div class="okuma-arac__bol" data-bol="dinle"><h3 class="okuma-arac__alt"></h3>'
      + '<div class="okuma-arac__kontrol"><button type="button" class="okuma-arac__oge" data-a="onceki"><span aria-hidden="true">‹</span></button>'
      + '<button type="button" class="okuma-arac__cal" data-a="cal"><span class="okuma-arac__cal-i" aria-hidden="true"></span><span class="okuma-arac__cal-a"></span></button>'
      + '<button type="button" class="okuma-arac__oge" data-a="sonraki"><span aria-hidden="true">›</span></button></div>'
      + '<div class="okuma-arac__hiz" role="group"></div><p class="okuma-arac__not" role="status" aria-live="polite"></p></div>';
    h += '<div class="okuma-arac__bol" data-bol="icinde" hidden><details class="okuma-arac__ac"><summary class="okuma-arac__alt"></summary><ul class="okuma-arac__icinde"></ul></details></div>';
    h += '<div class="okuma-arac__bol" data-bol="not"></div>';
    h += '<div class="okuma-arac__bol" data-bol="isaret"></div><div class="okuma-arac__bol" data-bol="capa"></div>';
    if (window.matchMedia && window.matchMedia("(min-width: 1000px)").matches) h += '<div class="okuma-arac__bol" data-bol="yan"><h3 class="okuma-arac__alt"></h3><button type="button" class="okuma-arac__cal okuma-arac__not-ac" data-a="yan"></button></div>';
    h += '<div class="okuma-arac__bol" data-bol="alinti"><h3 class="okuma-arac__alt"></h3><button type="button" class="okuma-arac__cal okuma-arac__not-ac" data-a="alinti"></button><p class="okuma-arac__not okuma-arac__alinti-not" role="status"></p></div>';
    h += '<div class="okuma-arac__bol" data-bol="kip"><h3 class="okuma-arac__alt"></h3><div class="okuma-arac__kipler" role="group"></div><p class="okuma-arac__not okuma-arac__kip-not"></p></div>';
    h += '<div class="okuma-arac__bol" data-bol="yazi"><details class="okuma-arac__ac"><summary class="okuma-arac__alt"></summary><div class="okuma-arac__yazi-gruplar"></div><button type="button" class="okuma-arac__oge okuma-arac__sifirla" data-a="yazi-sifirla"></button></details></div>';
    panel.innerHTML = h;
    panel.querySelector(".okuma-arac__baslik").textContent = t(Y.baslik);
    panel.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.dataset.a;
      if (a === "kapat") { paneliKapat(); if (dugme) dugme.focus(); }
      else if (a === "cal") { if (!oynuyor) baslat(); else if (duraklatildi) surdur(); else duraklat(); }
      else if (a === "onceki") { if (!sesListe.length) baslat(); else ilerle(-1); }
      else if (a === "sonraki") { if (!sesListe.length) baslat(); else ilerle(1); }
      else if (a && a.indexOf("not-") === 0) notEylem(a);
      else if (a === "alinti") alintiAc();
      else if (a === "yan") {
        paneliKapat();
        window.__dostOnceYukle("yan-yana").then(function () { return window.DostYanYana.ac(location.pathname); }).catch(function () { if (dugme) dugme.focus(); });
      }
      else if (b.dataset.hiz) hizSec(parseFloat(b.dataset.hiz));
      else if (b.dataset.kip) kipUygula(b.dataset.kip, true);
      else if (a === "yazi-sifirla") yaziSifirla();
      else if (b.dataset.baslik != null) basligaGit(parseInt(b.dataset.baslik, 10));
      else if (b.dataset.yz) { var yp = b.dataset.yz.split(":"); yaziUygula(yp[0], yp[1], true); paneliTazele(); }
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = Array.prototype.filter.call(panel.querySelectorAll("button"), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    document.body.appendChild(panel);
    document.addEventListener("pointerdown", function (e) {
      if (acikMi() && !panel.contains(e.target) && !(dugme && dugme.contains(e.target))) paneliKapat();
    });
    if (GU && GU.yuzeyKatmani) katman = GU.yuzeyKatmani("okuma-arac", function () { paneliKapat(true); });
  }
  function paneliTazele() {
    if (!panel) return;
    panel.setAttribute("aria-label", t(Y.baslik));
    panel.querySelector(".okuma-arac__baslik").textContent = t(Y.baslik);
    var kb = panel.querySelector(".okuma-arac__kapat");
    kb.textContent = "✕"; kb.setAttribute("aria-label", t(Y.kapat)); kb.title = t(Y.kapat);
    var d = panel.querySelector('[data-bol="dinle"]');
    if (d) {
      d.querySelector(".okuma-arac__alt").textContent = t(Y.dinle);
      var cal = d.querySelector(".okuma-arac__cal");
      var calisiyor = oynuyor && !duraklatildi;
      cal.querySelector(".okuma-arac__cal-i").textContent = calisiyor ? "❚❚" : "▶";
      var ad = calisiyor ? t(Y.duraklat) : (duraklatildi ? t(Y.surdur) : t(Y.cal));
      cal.querySelector(".okuma-arac__cal-a").textContent = ad;
      cal.setAttribute("aria-pressed", calisiyor ? "true" : "false");
      d.querySelector('[data-a="onceki"]').setAttribute("aria-label", t(Y.onceki));
      d.querySelector('[data-a="onceki"]').title = t(Y.onceki);
      d.querySelector('[data-a="sonraki"]').setAttribute("aria-label", t(Y.sonraki));
      d.querySelector('[data-a="sonraki"]').title = t(Y.sonraki);
      var hg = d.querySelector(".okuma-arac__hiz");
      hg.setAttribute("aria-label", t(Y.hiz));
      hg.innerHTML = HIZLAR.map(function (h) {
        return '<button type="button" class="okuma-arac__chip" data-hiz="' + h + '" aria-pressed="' + (h === hiz) + '">' + String(h).replace(".", lang() === "en" ? "." : ",") + "×</button>";
      }).join("");
      var n = d.querySelector(".okuma-arac__not");
      n.textContent = notMetni || (oynuyor && sesListe.length ? (sesSira + 1) + " / " + sesListe.length : "");
    }
    var yn = panel.querySelector('[data-bol="yan"]');
    if (yn) { yn.querySelector(".okuma-arac__alt").textContent = t(Y.yanBaslik); yn.querySelector('[data-a="yan"]').textContent = t(Y.yanAc); }
    var al = panel.querySelector('[data-bol="alinti"]');
    if (al) { al.querySelector(".okuma-arac__alt").textContent = t(Y.alintiBaslik); al.querySelector('[data-a="alinti"]').textContent = t(Y.alintiAc); }
    var k = panel.querySelector('[data-bol="kip"]');
    k.querySelector(".okuma-arac__alt").textContent = t(Y.kip);
    var kg = k.querySelector(".okuma-arac__kipler");
    kg.setAttribute("aria-label", t(Y.kip));
    kg.innerHTML = KIPLER.map(function (x) {
      return '<button type="button" class="okuma-arac__chip okuma-arac__chip--kip okuma-arac__chip--' + x + '" data-kip="' + x + '" aria-pressed="' + (x === kip) + '">' + t(Y.kipAd[x]) + "</button>";
    }).join("");
    k.querySelector(".okuma-arac__kip-not").textContent = t(Y.kipIpucu[kip]);
    var yb = panel.querySelector('[data-bol="yazi"]');
    if (yb) {
      yb.querySelector(".okuma-arac__alt").textContent = t(Y.yaziBaslik);
      yb.querySelector(".okuma-arac__yazi-gruplar").innerHTML = Object.keys(YAZI).map(function (grup) {
        return '<div class="okuma-arac__yazi-grup" role="group" aria-label="' + t(Y.yaziGrup[grup]) + '"><span class="okuma-arac__yazi-ad">' + t(Y.yaziGrup[grup]) + "</span>"
          + YAZI[grup].degerler.map(function (d) {
            return '<button type="button" class="okuma-arac__chip" data-yz="' + grup + ":" + d + '" aria-pressed="' + (yaziDeger[grup] === d) + '">' + t(Y.yaziAd[grup][d]) + "</button>";
          }).join("") + "</div>";
      }).join("");
      yb.querySelector(".okuma-arac__sifirla").textContent = t(Y.yaziSifirla);
    }
  }
  // Vurgulayıcı ve paragraf bağlantısı (2026-10-30): okuma-isaret.js ilk açılışta iner.
  function isaretBaglami() {
    return { makale: function () { return makaleBul(); }, notAdayi: notAdayi, baslik: notBasligi };
  }
  function isaretBolumleri() {
    if (!panel || !window.__dostOnceYukle) return;
    window.__dostOnceYukle("okuma-isaret").then(function () {
      var c = isaretBaglami();
      window.DostOkumaIsaret.baglan(c);
      window.DostOkumaIsaret.panelYaz(panel.querySelector('[data-bol="isaret"]'), c);
      window.DostOkumaIsaret.capaYaz(panel.querySelector('[data-bol="capa"]'), c);
    }).catch(function () { /* araç yüklenemedi: panelin geri kalanı çalışır */ });
  }
  function paneliAc() {
    if (!panel) kurPanel();
    paneliTazele();
    icindekilerYaz();
    notDuzen = false; notDurum = ""; notHedef = null;
    if (istenenNot && istenenNot.isConnected) { notHedef = istenenNot; notDuzen = true; }   // seçim çubuğundaki "Not": düzenleyici açık gelir
    istenenNot = null;
    notBolumuYaz();
    isaretBolumleri();
    panel.hidden = false;
    // Kabuk V3 alt araç çubuğu ("Bu metinde"): ilgili bölüm açık gelir ve görünür alana kaydırılır.
    if (window.__dostOkumaBolum) {
      var hb = panel.querySelector('[data-bol="' + window.__dostOkumaBolum + '"] details');
      window.__dostOkumaBolum = null;
      if (hb) { hb.open = true; try { hb.scrollIntoView({ block: "nearest" }); } catch (e) { /* kaydırılamaz */ } }
    }
    if (dugme) { dugme.setAttribute("aria-expanded", "true"); dugme.setAttribute("aria-controls", "okuma-arac"); }
    if (katman) katman.ac();
    var ilk = panel.querySelector(".okuma-arac__cal") || panel.querySelector(".okuma-arac__chip");
    if (ilk) gk(function () { ilk.focus({ preventScroll: true }); });
  }
  function paneliKapat(katmandan) {
    if (!acikMi()) return false;
    panel.hidden = true;
    if (dugme) dugme.setAttribute("aria-expanded", "false");
    if (katman && !katmandan) katman.bitti();
    return true;
  }
  if (GU && GU.registerStepBack) {
    // Esc: önce açık panel, sonra çalan ses (bir adım geri).
    GU.registerStepBack(null, function () {
      if (paneliKapat()) { if (dugme) dugme.focus(); return true; }
      if (oynuyor || duraklatildi) { bitir(false); return true; }
      return false;
    }, { oncelikli: true });
  }

  window.DostOkumaKipi = {
    // okuma-yuzeyi.js: hangi makalenin okunacağı, düğme ve ilk açılışta kayıtlı kipin uygulanması.
    baglan: function (makaleFn, dugmeEl) {
      makaleBul = makaleFn;
      dugme = dugmeEl || dugme;
      if (!kayitliKipUygulandi) { kayitliKipUygulandi = true; kipUygula(kayitliKip(), false); yaziKayitliUygula(); }
    },
    panelAc: paneliAc,
    secimIzle: secimIzle,
    panelKapat: function () { return paneliKapat(); },
    acikMi: acikMi,
    sesVar: SES_VAR,
    tazele: function () {
      odakListe.forEach(function (e) { e.classList.remove("okuma-odak-blok", "okuma-odak-simdi"); }); odakListe = []; odakSimdi = null;
      if (kip === "odak") odakPlanla();
      notIsaretle();
      notHedefineGit();
      vurguVarsaCiz();
    },
  };
  var kayitliKipUygulandi = false;
  function vurguVarsaCiz() {
    var var_ = gk(function () { return JSON.parse(localStorage.getItem("dost-vurgular") || "[]").some(function (v) { return v.yol === location.pathname; }); }, false);
    if (!var_ || !window.__dostOnceYukle) return;
    window.__dostOnceYukle("okuma-isaret").then(function () { window.DostOkumaIsaret.baglan(isaretBaglami()); window.DostOkumaIsaret.tazele(); }).catch(function () {});
  }
})();
