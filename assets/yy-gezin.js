/* Yan Yana gezinme araçları (2026-11-03): içindekiler, okudum işareti, terim kutusu, sayfa içi arama, kaynak süzgeci.
 * Yalnız cihazda çalışır; sunucuya bir şey gitmez. Okudum işareti localStorage `dost-yy-okundu`. */
(function () {
  "use strict";
  var L = (document.documentElement.lang || "tr").slice(0, 2);
  var S = {
    tr: { icerik: "Bu sayfada", okudum: "Bu sayfayı okudum", okundu: "Okundu ✓ (kaldırmak için dokunun)", ara: "Bu sayfalarda ara", sonucYok: "Eşleşme yok", sozluk: "Sözlükte aç", kapat: "Kapat", kayAra: "Kaynaklarda ara (yazar, başlık, yıl)", ozet: "Özetleri aç", ozetK: "Özetleri kapat", say: " kaynak", tum: "Tümü", tur: { makale: "Makale", web: "Web", bildiri: "Bildiri", "ikinci-el": "İkinci el", kitap: "Kitap", "kitap bölümü": "Kitap bölümü", "dost-literaturu": "Dost literatürü", "önbaskı": "Önbaskı" } },
    en: { icerik: "On this page", okudum: "I have read this page", okundu: "Read ✓ (tap to undo)", ara: "Search these pages", sonucYok: "No match", sozluk: "Open in glossary", kapat: "Close", kayAra: "Search sources (author, title, year)", ozet: "Open summaries", ozetK: "Close summaries", say: " sources", tum: "All", tur: { makale: "Article", web: "Web", bildiri: "Conference paper", "ikinci-el": "Second-hand", kitap: "Book", "kitap bölümü": "Book chapter", "dost-literaturu": "Dost literature", "önbaskı": "Preprint" } },
    pt: { icerik: "Nesta página", okudum: "Li esta página", okundu: "Lida ✓ (toque para desfazer)", ara: "Buscar nestas páginas", sonucYok: "Nenhum resultado", sozluk: "Abrir no glossário", kapat: "Fechar", kayAra: "Buscar fontes (autor, título, ano)", ozet: "Abrir resumos", ozetK: "Fechar resumos", say: " fontes", tum: "Todas", tur: { makale: "Artigo", web: "Web", bildiri: "Comunicação", "ikinci-el": "Segunda mão", kitap: "Livro", "kitap bölümü": "Capítulo", "dost-literaturu": "Literatura de Dost", "önbaskı": "Pré-publicação" } }
  }[L] || null;

  if (!S) return;
  var KOK = "/yan-yana/" + (L === "tr" ? "" : L + "/");
  function norm(x) { return String(x || "").toLocaleLowerCase("tr").replace(/[âä]/g, "a").replace(/[îı]/g, "i").replace(/[ûü]/g, "u").replace(/ö/g, "o").replace(/ş/g, "s").replace(/ç/g, "c").replace(/ğ/g, "g").replace(/[’'`]/g, ""); }
  function kanon(yol) { return String(yol).replace(/^\/yan-yana\/(en|pt)\//, "/yan-yana/").split("#")[0]; }
  function oku() { try { return JSON.parse(localStorage.getItem("dost-yy-okundu") || "[]"); } catch (e) { return []; } }
  function yaz(l) { try { localStorage.setItem("dost-yy-okundu", JSON.stringify(l)); } catch (e) { /* depolama kapalı */ } }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.textContent = h; return e; }

  // 1 İçindekiler
  var art = document.querySelector("main > article");
  if (art) {
    var bas = [].slice.call(art.querySelectorAll("h2[id], h3[id]")).filter(function (h) { return !h.closest(".yy-yanyana") || true; });
    if (bas.length >= 4) {
      var d = el("details", "icerik"); d.appendChild(el("summary", "", S.icerik));
      var ol = el("ol"); bas.forEach(function (h) { var li = el("li", h.tagName === "H3" ? "alt" : ""); var a = el("a", "", h.textContent.trim().slice(0, 90)); a.href = "#" + h.id; li.appendChild(a); ol.appendChild(li); });
      d.appendChild(ol); d.addEventListener("click", function (e) { if (e.target.closest("a")) d.removeAttribute("open"); });
      art.parentNode.insertBefore(d, art);
    }
  }

  // 2 Okudum işareti
  var yol0 = kanon(location.pathname);
  function isaretle() {
    var okunan = oku();
    [].slice.call(document.querySelectorAll('.bolum-panel a, .kartlar a, nav.onsonra a')).forEach(function (a) {
      var h = a.getAttribute("href"); if (!h || h.charAt(0) !== "/") return;
      a.classList.toggle("okundu-i", okunan.indexOf(kanon(h)) >= 0);
    });
  }
  if (art && yol0 !== "/yan-yana/paralel/") {
    var kap = el("div", "okundu"), dg = el("button", "", ""); dg.type = "button";
    var gunc = function () { var o = oku().indexOf(yol0) >= 0; dg.setAttribute("aria-pressed", o ? "true" : "false"); dg.textContent = o ? S.okundu : S.okudum; };
    dg.addEventListener("click", function () { var l = oku(), i = l.indexOf(yol0); if (i >= 0) l.splice(i, 1); else l.push(yol0); yaz(l); gunc(); isaretle(); });
    kap.appendChild(dg); gunc();
    var on = art.parentNode.querySelector("nav.onsonra"); art.parentNode.insertBefore(kap, on || art.nextSibling);
  }
  isaretle();

  // 3 Terim kutusu: sözlük bağına dokununca tanım sayfa değiştirmeden açılır
  var kutu = null;
  function kutuKapat() { if (kutu) { kutu.remove(); kutu = null; } }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a.terim");
    if (!a) { if (kutu && !kutu.contains(e.target)) kutuKapat(); return; }
    e.preventDefault(); kutuKapat();
    var tanim = a.getAttribute("title") || a.getAttribute("data-tanim") || ""; if (tanim) { a.setAttribute("data-tanim", tanim); a.removeAttribute("title"); }
    kutu = el("div", "terim-kutu"); kutu.setAttribute("role", "dialog");
    kutu.appendChild(el("b", "", a.textContent)); kutu.appendChild(el("span", "", tanim));
    var sl = el("a", "", S.sozluk); sl.href = a.getAttribute("href"); kutu.appendChild(el("br")); kutu.appendChild(sl);
    document.body.appendChild(kutu);
    var r = a.getBoundingClientRect(), x = Math.max(12, Math.min(r.left + scrollX, scrollX + innerWidth - kutu.offsetWidth - 12));
    kutu.style.left = x + "px"; kutu.style.top = (r.bottom + scrollY + 6) + "px";
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") kutuKapat(); });

  // 4 Sayfa içi arama (Bölümler menüsünde)
  var panel = document.querySelector(".bolum-panel");
  if (panel) {
    var kutuA = el("label", "bolum-ara"), inp = el("input"); inp.type = "search"; inp.placeholder = S.ara; inp.setAttribute("aria-label", S.ara); kutuA.appendChild(inp);
    var sonuc = el("ul", "bolum-sonuc"); sonuc.setAttribute("aria-live", "polite");
    panel.insertBefore(sonuc, panel.firstChild); panel.insertBefore(kutuA, panel.firstChild);
    var dizin = null;
    function yukle(cb) { if (dizin) return cb(); fetch(KOK + "arama.json").then(function (r) { return r.json(); }).then(function (j) { dizin = j; cb(); }).catch(function () { dizin = []; cb(); }); }
    inp.addEventListener("focus", function () { yukle(function () {}); });
    inp.addEventListener("input", function () {
      var q = norm(inp.value).trim().split(/\s+/).filter(Boolean); sonuc.innerHTML = "";
      if (!q.length) return;
      yukle(function () {
        var bul = [];
        dizin.forEach(function (s) {
          var tb = norm(s.b), puan = 0;
          if (q.every(function (t) { return tb.indexOf(t) >= 0; })) bul.push({ u: s.u, b: s.b, k: "", p: 0 });
          s.h.forEach(function (h) { var th = norm(h[0]); if (q.every(function (t) { return th.indexOf(t) >= 0; })) bul.push({ u: s.u + "#" + h[1], b: h[0], k: s.b, p: 1 }); });
        });
        bul.sort(function (a, b) { return a.p - b.p; });
        if (!bul.length) { sonuc.appendChild(el("li", "", S.sonucYok)); return; }
        bul.slice(0, 14).forEach(function (b) { var li = el("li"), a = el("a", "", b.b); a.href = b.u; if (b.k) a.appendChild(el("small", "", b.k)); li.appendChild(a); sonuc.appendChild(li); });
      });
    });
    var det = document.querySelector("details.bolumler");
    if (det) det.addEventListener("toggle", function () { if (det.open && window.matchMedia && !matchMedia("(pointer: coarse)").matches) inp.focus(); });
  }

  // 5 Kaynak süzgeci
  var liste = document.querySelector("ul.kaynak-liste");
  if (liste) {
    var ogeler = [].slice.call(liste.children), turler = {};
    ogeler.forEach(function (li) { var t = li.getAttribute("data-tur") || ""; turler[t] = (turler[t] || 0) + 1; });
    var bar = el("div", "kay-ara"), q = el("input"); q.type = "search"; q.placeholder = S.kayAra; q.setAttribute("aria-label", S.kayAra); bar.appendChild(q);
    var seciliTur = "", say = el("span", "kay-say"), chips = [];
    function tazele() {
      var terimler = norm(q.value).trim().split(/\s+/).filter(Boolean), n = 0;
      ogeler.forEach(function (li) { var g = (!seciliTur || li.getAttribute("data-tur") === seciliTur) && terimler.every(function (t) { return norm(li.textContent).indexOf(t) >= 0; }); li.hidden = !g; if (g) n++; });
      say.textContent = n + S.say; chips.forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.t === seciliTur ? "true" : "false"); });
    }
    [""].concat(Object.keys(turler).sort(function (a, b) { return turler[b] - turler[a]; })).forEach(function (t) {
      var c = el("button", "", (t ? (S.tur[t] || t) + " (" + turler[t] + ")" : S.tum)); c.type = "button"; c.dataset.t = t; c.addEventListener("click", function () { seciliTur = t; tazele(); }); chips.push(c); bar.appendChild(c);
    });
    var acik = false, oz = el("button", "", S.ozet); oz.type = "button";
    oz.addEventListener("click", function () { acik = !acik; ogeler.forEach(function (li) { var d = li.querySelector("details"); if (d) d.open = acik; }); oz.textContent = acik ? S.ozetK : S.ozet; oz.setAttribute("aria-pressed", acik ? "true" : "false"); });
    bar.appendChild(oz); bar.appendChild(say); q.addEventListener("input", tazele);
    liste.parentNode.insertBefore(bar, liste); tazele();
  }
})();
