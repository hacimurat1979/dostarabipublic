/* Okuma işaretleri (2026-10-30, fikir D2 + D1 + R3): okuma araçları panelinden tembel iner.
 *
 *  - Renkli vurgulayıcı: okurken metin seçip altın/mavi/yeşil işaretlersin. Vurgu yalnız bu cihazın
 *    localStorage'ında durur (`dost-vurgular`); sunucuya gitmez, siteye yazılmaz. Sayfada CSS Custom
 *    Highlight API ile çizilir (DOM'a dokunmaz; API yoksa vurgu çizilmez, kayıt yine Defterim'de listelenir).
 *    Kayıt: { id, yol, baslik, alinti (paragrafın ilk 90 harfi: notlarla aynı anahtar), bas, son, metin,
 *    renk, t }. bas/son paragrafın ham metnindeki konumlardır.
 *  - Paragraf bağlantısı: `#pN` adresini kopyalar/paylaşır (numara okuma-yuzeyi.js'te hesaplanır).
 *
 * Renkler anlam taşımaz; sitenin görsel gramerindeki "ışık/gölge" eşleşmelerine karışmaz, okuyucunun kendi
 * işaretidir. Etiketler Defterim panelinde (kavram-defteri.js).
 */
(function () {
  "use strict";
  if (window.DostOkumaIsaret) return;
  var I18n = window.DostI18n;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  function gk(fn, yedek) { try { return fn(); } catch (e) { return yedek; } }

  var DEPO = "dost-vurgular";
  var RENKLER = ["altin", "mavi", "yesil"];
  var Y = {
    baslik: { tr: "Vurgula", en: "Highlight", pt: "Destacar" },
    renk: { altin: { tr: "Altın", en: "Gold", pt: "Dourado" }, mavi: { tr: "Mavi", en: "Blue", pt: "Azul" }, yesil: { tr: "Yeşil", en: "Green", pt: "Verde" } },
    ipucu: { tr: "Önce bir paragraf içinde metin seç, sonra bir renge dokun. Yalnız bu cihazda kalır.", en: "First select text inside a paragraph, then tap a colour. It stays on this device only.", pt: "Primeiro selecione texto dentro de um parágrafo e toque em uma cor. Fica apenas neste dispositivo." },
    tekParagraf: { tr: "Seçim tek paragraf içinde olmalı.", en: "The selection must be inside a single paragraph.", pt: "A seleção deve estar dentro de um único parágrafo." },
    eklendi: { tr: "Vurgu eklendi; Defterim'de listelenir.", en: "Highlight added; it is listed in My Notebook.", pt: "Destaque adicionado; aparece em Meu Caderno." },
    sayfada: { tr: "Bu sayfadaki vurgularım", en: "My highlights on this page", pt: "Meus destaques nesta página" },
    sil: { tr: "Vurguyu sil", en: "Delete highlight", pt: "Excluir destaque" },
    silindi: { tr: "Vurgu silindi.", en: "Highlight deleted.", pt: "Destaque excluído." },
    destekYok: { tr: "Bu tarayıcı vurguyu sayfada çizemiyor; kayıt yine Defterim'de listelenir.", en: "This browser cannot draw highlights on the page; the entry is still listed in My Notebook.", pt: "Este navegador não desenha destaques na página; o item continua listado em Meu Caderno." },
    capaBaslik: { tr: "Paragraf bağlantısı", en: "Paragraph link", pt: "Link do parágrafo" },
    capaKopyala: { tr: "Bu paragrafın bağlantısını kopyala", en: "Copy the link to this paragraph", pt: "Copiar o link deste parágrafo" },
    capaPaylas: { tr: "Paylaş…", en: "Share…", pt: "Compartilhar…" },
    capaKopyalandi: { tr: "Bağlantı kopyalandı: ", en: "Link copied: ", pt: "Link copiado: " },
    capaYok: { tr: "Bu ekranda paragraf bulunamadı.", en: "No paragraph was found on this screen.", pt: "Nenhum parágrafo foi encontrado nesta tela." },
    capaKopyalanamadi: { tr: "Kopyalanamadı; bağlantı: ", en: "Could not copy; link: ", pt: "Não foi possível copiar; link: " },
  };

  var ctx = null;          // { makale(), notAdayi(), baslik(), alintiAl(e) } -- okuma-kipi.js verir
  var kutu = null, durumEl = null, sonSecim = null;

  function oku() { var a = gk(function () { return JSON.parse(localStorage.getItem(DEPO) || "[]"); }, []); return Array.isArray(a) ? a : []; }
  function yaz(a) { gk(function () { localStorage.setItem(DEPO, JSON.stringify(a)); }); gk(function () { window.dispatchEvent(new Event("dost-notlar")); }); }
  function alintiAl(e) { return (e.innerText || e.textContent || "").replace(/\[\d+\]/g, "").replace(/\s+/g, " ").trim().slice(0, 90); }

  // ── Ham metin konumu <-> Range ──────────────────────────────────────────
  function konum(blok, dugum, ofs) {
    var w = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT), n, say = 0;
    while ((n = w.nextNode())) {
      if (n === dugum) return say + ofs;
      say += n.nodeValue.length;
    }
    return -1;
  }
  function aralik(blok, bas, son) {
    var w = document.createTreeWalker(blok, NodeFilter.SHOW_TEXT), n, say = 0, r = document.createRange(), b = false;
    while ((n = w.nextNode())) {
      var u = n.nodeValue.length;
      if (!b && bas <= say + u) { r.setStart(n, Math.max(0, bas - say)); b = true; }
      if (b && son <= say + u) { r.setEnd(n, Math.max(0, son - say)); return r; }
      say += u;
    }
    return null;
  }
  function blokBul(alinti) {
    var m = ctx && ctx.makale && ctx.makale();
    if (!m) return null;
    var l = m.querySelectorAll("p, li, blockquote, h2, h3, h4");
    for (var i = 0; i < l.length; i++) if (alintiAl(l[i]) === alinti) return l[i];
    return null;
  }

  // ── Çizim (CSS Custom Highlight API) ────────────────────────────────────
  var DESTEK = !!(window.CSS && CSS.highlights && typeof Highlight === "function");
  function cizGuvenli() {
    if (!DESTEK) return;
    var yol = location.pathname, gruplar = { altin: [], mavi: [], yesil: [] };
    oku().forEach(function (v) {
      if (v.yol !== yol || !gruplar[v.renk]) return;
      var b = blokBul(v.alinti);
      if (!b) return;
      var r = aralik(b, v.bas, v.son);
      if (r) gruplar[v.renk].push(r);
    });
    RENKLER.forEach(function (c) {
      CSS.highlights.delete("dost-vurgu-" + c);
      if (!gruplar[c].length) return;
      var h = new Highlight();
      gruplar[c].forEach(function (r) { h.add(r); });
      CSS.highlights.set("dost-vurgu-" + c, h);
    });
  }

  // ── Seçimi izle ─────────────────────────────────────────────────────────
  // Düğmeye basmak seçimi bazı tarayıcılarda siler; son geçerli seçim saklanır.
  function secimiOku() {
    var s = window.getSelection && window.getSelection();
    if (!s || s.rangeCount === 0 || s.isCollapsed) return;
    var m = ctx && ctx.makale && ctx.makale();
    if (!m) return;
    var r = s.getRangeAt(0);
    if (!m.contains(r.commonAncestorContainer)) return;
    var a = r.startContainer.nodeType === 3 ? r.startContainer.parentElement : r.startContainer;
    var z = r.endContainer.nodeType === 3 ? r.endContainer.parentElement : r.endContainer;
    var ba = a && a.closest && a.closest("p, li, blockquote, h2, h3, h4");
    var bz = z && z.closest && z.closest("p, li, blockquote, h2, h3, h4");
    if (!ba || ba !== bz) { sonSecim = { hata: "tek" }; return; }
    var bas = konum(ba, r.startContainer, r.startOffset), son = konum(ba, r.endContainer, r.endOffset);
    var metin = s.toString().replace(/\s+/g, " ").trim();
    if (bas < 0 || son <= bas || !metin) return;
    sonSecim = { blok: ba, bas: bas, son: son, metin: metin.slice(0, 300) };
  }
  document.addEventListener("selectionchange", secimiOku);

  function durumYaz(m) { if (durumEl) durumEl.textContent = m || ""; }
  function vurguEkle(renk) {
    var s = sonSecim;
    if (!s || s.hata) { durumYaz(t(s && s.hata ? Y.tekParagraf : Y.ipucu)); return; }
    var liste = oku();
    liste.unshift({ id: "v" + Date.now().toString(36), yol: location.pathname, baslik: ctx.baslik ? ctx.baslik() : document.title, alinti: alintiAl(s.blok), bas: s.bas, son: s.son, metin: s.metin, renk: renk, t: Date.now() });
    yaz(liste);
    sonSecim = null;
    gk(function () { window.getSelection().removeAllRanges(); });
    cizGuvenli();
    panelYaz(kutu, ctx);
    durumYaz(t(Y.eklendi) + (DESTEK ? "" : " " + t(Y.destekYok)));
  }

  // ── Panel bölümü ────────────────────────────────────────────────────────
  function panelYaz(k, c) {
    if (!k) return;
    kutu = k; ctx = c || ctx;
    k.innerHTML = "";
    var h = document.createElement("h3"); h.className = "okuma-arac__alt"; h.textContent = t(Y.baslik); k.appendChild(h);
    var sat = document.createElement("div"); sat.className = "okuma-arac__kontrol okuma-arac__vurgu-renkler"; sat.setAttribute("role", "group"); sat.setAttribute("aria-label", t(Y.baslik));
    RENKLER.forEach(function (c2) {
      var b = document.createElement("button"); b.type = "button"; b.className = "okuma-arac__chip okuma-arac__vurgu okuma-arac__vurgu--" + c2; b.dataset.vurgu = c2;
      b.innerHTML = '<i aria-hidden="true"></i>'; b.appendChild(document.createTextNode(t(Y.renk[c2])));
      // Seçim düğmeye basınca silinmesin.
      b.addEventListener("pointerdown", function (e) { e.preventDefault(); });
      sat.appendChild(b);
    });
    k.appendChild(sat);
    var yol = location.pathname, bu = oku().filter(function (v) { return v.yol === yol; });
    durumEl = document.createElement("p"); durumEl.className = "okuma-arac__not"; durumEl.setAttribute("role", "status"); durumEl.textContent = bu.length ? "" : t(Y.ipucu);
    k.appendChild(durumEl);
    if (bu.length) {
      var l = document.createElement("div"); l.className = "okuma-arac__vurgu-liste";
      var lh = document.createElement("p"); lh.className = "okuma-arac__not"; lh.textContent = t(Y.sayfada) + " · " + bu.length; l.appendChild(lh);
      bu.slice(0, 12).forEach(function (v) {
        var satir = document.createElement("div"); satir.className = "okuma-arac__vurgu-satir";
        var d = document.createElement("i"); d.className = "okuma-arac__vurgu-nokta okuma-arac__vurgu-nokta--" + v.renk; d.setAttribute("aria-hidden", "true");
        var q = document.createElement("span"); q.textContent = "“" + v.metin + "”";
        var x = document.createElement("button"); x.type = "button"; x.className = "okuma-arac__vurgu-sil"; x.dataset.vsil = v.id; x.textContent = "×"; x.setAttribute("aria-label", t(Y.sil)); x.title = t(Y.sil);
        satir.appendChild(d); satir.appendChild(q); satir.appendChild(x); l.appendChild(satir);
      });
      k.appendChild(l);
    }
    k.onclick = function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.dataset.vurgu) vurguEkle(b.dataset.vurgu);
      else if (b.dataset.vsil) { yaz(oku().filter(function (v) { return v.id !== b.dataset.vsil; })); cizGuvenli(); panelYaz(kutu, ctx); durumYaz(t(Y.silindi)); }
    };
  }

  function capaYaz(k, c) {
    if (!k) return;
    ctx = c || ctx;
    k.innerHTML = "";
    var h = document.createElement("h3"); h.className = "okuma-arac__alt"; h.textContent = t(Y.capaBaslik); k.appendChild(h);
    var b = document.createElement("button"); b.type = "button"; b.className = "okuma-arac__cal okuma-arac__not-ac"; b.dataset.capa = "kopyala"; b.textContent = t(Y.capaKopyala); k.appendChild(b);
    if (navigator.share) {
      var p = document.createElement("button"); p.type = "button"; p.className = "okuma-arac__chip"; p.dataset.capa = "paylas"; p.textContent = t(Y.capaPaylas); k.appendChild(p);
    }
    var d = document.createElement("p"); d.className = "okuma-arac__not"; d.setAttribute("role", "status"); k.appendChild(d);
    k.onclick = function (e) {
      var x = e.target.closest("button");
      if (!x || !x.dataset.capa) return;
      var el = ctx && ctx.notAdayi && ctx.notAdayi();
      var no = el && window.DostOkuma && window.DostOkuma.paragrafNo ? window.DostOkuma.paragrafNo(el) : 0;
      if (!no) { d.textContent = t(Y.capaYok); return; }
      var url = location.origin + location.pathname + location.search + "#p" + no;
      if (x.dataset.capa === "paylas") { gk(function () { navigator.share({ title: ctx.baslik ? ctx.baslik() : document.title, url: url }); }); return; }
      var tamam = function (ok) { d.textContent = ok ? t(Y.capaKopyalandi) + "#p" + no : t(Y.capaKopyalanamadi) + url; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { tamam(true); }, function () { tamam(false); });
      else tamam(false);
    };
  }

  window.DostOkumaIsaret = {
    baglan: function (c) { ctx = c; },
    panelYaz: panelYaz,
    capaYaz: capaYaz,
    tazele: function () { cizGuvenli(); },
    secimiAl: secimiOku,
    vurgula: vurguEkle,   // seçim çubuğu (2026-10-31): son geçerli seçimi verilen renkle vurgular
    destek: DESTEK,
  };
  window.addEventListener("dost-notlar", function () { cizGuvenli(); });
})();
