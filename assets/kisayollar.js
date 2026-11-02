/* Klavye ve dokunuş kısayolları (2026-10-30, fikir E2): `?` tuşuyla açılan, siteye ait hareketlerin listesi.
 * view-loader.js `?` tuşunda (metin kutusu dışında) ve Defterim/Daha sayfasındaki bağlantıda indirir.
 * İçerik ETKILESIM_DILI.md'deki beş fiilin kısayollarıdır; gizli kelimeler listede YOKTUR. */
(function () {
  "use strict";
  if (window.DostKisayollar) return;
  var I18n = window.DostI18n, GU = window.DostGraphUtils;
  function t(o) { return I18n && I18n.pick3 ? I18n.pick3(o) : o.tr; }
  var BASLIK = { tr: "Kısayollar", en: "Shortcuts", pt: "Atalhos" };
  var KAPAT = { tr: "Kapat", en: "Close", pt: "Fechar" };
  var KLAVYE = { tr: "Klavye", en: "Keyboard", pt: "Teclado" };
  var DOKUNUS = { tr: "Dokunuş", en: "Touch", pt: "Toque" };
  var SATIRLAR = [
    ["k", ["/"], { tr: "Aramayı aç", en: "Open search", pt: "Abrir a busca" }],
    ["k", ["Esc"], { tr: "Bir adım geri: açık panel, sonra seçili öğe, sonra görünümün giriş hâli", en: "One step back: open panel, then selected item, then the view's starting state", pt: "Um passo atrás: painel aberto, depois item selecionado, depois o estado inicial da visão" }],
    ["k", ["Tab"], { tr: "Düğümler, düğmeler ve bağlantılar arasında gez", en: "Move between nodes, buttons and links", pt: "Navegar entre nós, botões e links" }],
    ["k", ["Enter"], { tr: "Odaktaki öğeyi seç; paneli açılır", en: "Select the focused item; its panel opens", pt: "Selecionar o item em foco; o painel dele abre" }],
    ["k", ["Ctrl", "tekerlek"], { tr: "Haritada yaklaş (⌘ ile de); yalın tekerlek sayfayı kaydırır", en: "Zoom the map (⌘ works too); the plain wheel scrolls the page", pt: "Aproximar o mapa (⌘ também); a roda simples rola a página" }],
    ["k", ["?"], { tr: "Bu liste", en: "This list", pt: "Esta lista" }],
    ["d", [], { tr: "İki parmakla aç/kapa: haritada yaklaş", en: "Two-finger pinch: zoom the map", pt: "Pinça com dois dedos: aproximar o mapa" }],
    ["d", [], { tr: "Haritada bir düğüme dokun: ayrıntı paneli yarım açılır", en: "Tap a node on the map: its panel opens halfway", pt: "Toque em um nó do mapa: o painel abre pela metade" }],
    ["d", [], { tr: "Haritada boşluğa dokun: bir adım geri (telefon)", en: "Tap empty space on the map: one step back (phone)", pt: "Toque no espaço vazio do mapa: um passo atrás (celular)" }],
    ["d", [], { tr: "Haritada boşluğa basılı tut: hedeflenen düğüm halkalanır", en: "Press and hold empty space on the map: the targeted node is ringed", pt: "Mantenha pressionado o espaço vazio do mapa: o nó alvo é circulado" }],
    ["d", [], { tr: "Okuma sayfasında kenar çubuğundaki daire: Dinle, okuma kipi, not, vurgu, bağlantı", en: "The circle on a reading page: listen, reading mode, note, highlight, link", pt: "O círculo na página de leitura: ouvir, modo de leitura, nota, destaque, link" }],
  ];
  var kutu = null, onceki = null, katman = null;
  function kur() {
    kutu = document.createElement("div");
    kutu.className = "kisayol-perde";
    kutu.hidden = true;
    var h = '<div class="kisayol" role="dialog" aria-modal="true" aria-labelledby="kisayol-baslik"><header><h2 id="kisayol-baslik"></h2><button type="button" class="kisayol__kapat"></button></header><div class="kisayol__govde"></div></div>';
    kutu.innerHTML = h;
    kutu.addEventListener("click", function (e) { if (e.target === kutu || e.target.closest(".kisayol__kapat")) kapat(); });
    kutu.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var f = kutu.querySelectorAll("button");
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    document.body.appendChild(kutu);
    if (GU && GU.yuzeyKatmani) katman = GU.yuzeyKatmani("kisayollar", function () { kapat(true); });
  }
  function yaz() {
    kutu.querySelector("h2").textContent = t(BASLIK);
    var b = kutu.querySelector(".kisayol__kapat"); b.textContent = "✕"; b.setAttribute("aria-label", t(KAPAT)); b.title = t(KAPAT);
    var g = kutu.querySelector(".kisayol__govde"); g.innerHTML = "";
    [["k", KLAVYE], ["d", DOKUNUS]].forEach(function (grup) {
      var h3 = document.createElement("h3"); h3.textContent = t(grup[1]); g.appendChild(h3);
      var dl = document.createElement(grup[0] === "k" ? "dl" : "ul");
      SATIRLAR.filter(function (s) { return s[0] === grup[0]; }).forEach(function (s) {
        if (grup[0] === "d") { var li = document.createElement("li"); li.textContent = t(s[2]); dl.appendChild(li); return; }
        var dt = document.createElement("dt");
        s[1].forEach(function (k, i) { if (i) dt.appendChild(document.createTextNode(" + ")); var kb = document.createElement("kbd"); kb.textContent = k === "tekerlek" ? t({ tr: "tekerlek", en: "wheel", pt: "roda" }) : k; dt.appendChild(kb); });
        var dd = document.createElement("dd"); dd.textContent = t(s[2]);
        dl.appendChild(dt); dl.appendChild(dd);
      });
      g.appendChild(dl);
    });
  }
  function ac() {
    if (!kutu) kur();
    yaz();
    onceki = document.activeElement;
    kutu.hidden = false;
    if (katman) katman.ac();
    var b = kutu.querySelector(".kisayol__kapat"); if (b) b.focus();
  }
  function kapat(katmandan) {
    if (!kutu || kutu.hidden) return false;
    kutu.hidden = true;
    if (katman && !katmandan) katman.bitti();
    if (onceki && onceki.focus) { try { onceki.focus(); } catch (e) { /* odak yok */ } }
    return true;
  }
  if (GU && GU.registerStepBack) GU.registerStepBack(null, function () { return kapat(); }, { oncelikli: true });
  window.DostKisayollar = { ac: ac, kapat: function () { return kapat(); }, acikMi: function () { return !!kutu && !kutu.hidden; } };
})();
