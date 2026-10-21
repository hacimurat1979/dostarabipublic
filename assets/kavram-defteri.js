/* Kişisel Kavram Defteri — okuyucunun bir terimi ya da bölümü kendi tarayıcısında
 * (yalnız bu cihazda, sunucuya gitmeyen) bir listeye eklemesi. Paylaşılan
 * detail-panel'in yıldız düğmesiyle eklenir/çıkarılır; sol üstteki dairesel
 * düğme kayıtlı listeyi bir çekmecede gösterir. Veri sitenin kendisine değil
 * yalnız okuyucunun localStorage'ına yazılır.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "dost-defter";
  var toggleBtn = null;
  var starBtn = null;
  var panel = null;
  var listEl = null;

  function loadEntries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function saveEntries(arr) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); } catch (e) {}
  }

  function currentEntryCandidate() {
    var content = document.getElementById("detail-content");
    if (!content) return null;
    var titleEl = content.querySelector(".detail-title");
    if (!titleEl) return null;
    var eyebrowEl = content.querySelector(".detail-eyebrow");
    return {
      href: window.location.href,
      title: titleEl.textContent.trim(),
      eyebrow: eyebrowEl ? eyebrowEl.textContent.trim() : "",
    };
  }

  function findIndex(entries, href) {
    for (var i = 0; i < entries.length; i++) if (entries[i].href === href) return i;
    return -1;
  }

  function refreshStarState() {
    if (!starBtn) return;
    var panelEl = document.getElementById("detail-panel");
    var open = panelEl && !panelEl.hidden;
    var cand = open ? currentEntryCandidate() : null;
    if (!cand) { starBtn.setAttribute("aria-pressed", "false"); return; }
    var entries = loadEntries();
    starBtn.setAttribute("aria-pressed", String(findIndex(entries, cand.href) !== -1));
  }

  function toggleCurrent() {
    var cand = currentEntryCandidate();
    if (!cand) return;
    var entries = loadEntries();
    var idx = findIndex(entries, cand.href);
    if (idx !== -1) {
      entries.splice(idx, 1);
    } else {
      cand.addedAt = Date.now();
      entries.unshift(cand);
    }
    saveEntries(entries);
    refreshStarState();
    renderPanelList();
  }

  function tr3(tr, en, pt) {
    var I18n = window.DostI18n;
    return I18n ? I18n.pick3({ tr: tr, en: en, pt: pt }) : tr;
  }

  // "Geri al" (2026-10-15, mobil kabuk taraması K13): çıkarma anında
  // uygulanır ama panelin altında 6 saniye boyunca tek dokunuşla geri alınır;
  // süre dolunca ya da panel kapanınca kalıcı olur. Yalnız bu cihazın listesi.
  var undoKaydi = null;   // { entry, index }
  var undoZaman = null;
  var undoEl = null;
  function undoBitir() {
    clearTimeout(undoZaman);
    undoKaydi = null;
    undoYaz();
  }
  function undoYaz() {
    if (!undoEl) return;
    undoEl.hidden = !undoKaydi;
    if (!undoKaydi) return;
    undoEl.querySelector(".defter-panel__geri-al-ad").textContent = tr3("Çıkarıldı: ", "Removed: ", "Removido: ") + undoKaydi.entry.title;
    undoEl.querySelector(".defter-panel__geri-al-dugme").textContent = tr3("Geri al", "Undo", "Desfazer");
  }
  function undoBaslat(entry, index) {
    clearTimeout(undoZaman);
    undoKaydi = { entry: entry, index: index };
    undoZaman = setTimeout(undoBitir, 6000);
    undoYaz();
  }
  function undoUygula() {
    if (!undoKaydi) return;
    var arr = loadEntries();
    if (findIndex(arr, undoKaydi.entry.href) === -1) arr.splice(Math.min(undoKaydi.index, arr.length), 0, undoKaydi.entry);
    saveEntries(arr);
    undoBitir();
    refreshStarState();
    renderPanelList();
  }

  function renderPanelList() {
    if (!listEl) return;
    var entries = loadEntries();
    undoYaz();
    if (!entries.length) {
      // Y3 (2026-10-21, kullanıcı onayı): boş durumda yalnız metin değil, merkezde yıldız ve çevresinde
      // üç bölüm dairesi (yıldız düğmesinin bulunduğu yerler); dairelere dokununca o bölüm açılır.
      var bol = [["terimler", tr3("Terimler", "Terms", "Termos")], ["esma", tr3("Esmâ", "Names", "Nomes")], ["kavram", tr3("Kavramlar", "Concepts", "Conceitos")]];
      var dairel = bol.map(function (b, i) {
        var a = (i / bol.length) * Math.PI * 2 - Math.PI / 2;
        var href = window.__dostNav ? window.__dostNav.href(b[0]) : "/" + b[0] + "/";
        return '<a class="uyg-halka-bos__daire uyg-halka-bos__daire--defter" href="' + href + '" data-view="' + b[0] + '" style="left:' + (50 + 34 * Math.cos(a)).toFixed(1) + '%;top:' + (50 + 34 * Math.sin(a)).toFixed(1) + '%">' + b[1] + "</a>";
      }).join("");
      listEl.innerHTML = '<div class="uyg-halka-bos"><div class="uyg-halka-bos__halka">' + dairel
        + '<span class="uyg-halka-bos__merkez uyg-halka-bos__merkez--yildiz" aria-hidden="true">★</span></div>'
        + '<p class="defter-panel__empty">' + tr3(
          "Defterin şimdilik boş. Bir terime, bir bölüme ya da okuduğun bir metne bakarken yıldız düğmesine basarak buraya ekleyebilirsin.",
          "Your notebook is empty for now. While viewing a term, a section or a text you are reading, tap the star button to add it here.",
          "Seu caderno está vazio por enquanto. Ao ver um termo, uma seção ou um texto que está lendo, toque no botão de estrela para adicioná-lo aqui."
        ) + "</p></div>";
      listEl.querySelectorAll(".uyg-halka-bos__daire").forEach(function (el) {
        el.addEventListener("click", function (ev) {
          if (window.__dostNav && window.__dostNav.goTo) { ev.preventDefault(); window.__dostNav.goTo(el.dataset.view); }
        });
      });
      return;
    }
    listEl.innerHTML = "";
    entries.forEach(function (entry, i) {
      var item = document.createElement("div");
      item.className = "defter-panel__item";
      var a = document.createElement("a");
      a.className = "defter-panel__item-link";
      a.href = entry.href;
      if (entry.eyebrow) {
        var eb = document.createElement("span");
        eb.className = "defter-panel__item-eyebrow";
        eb.textContent = entry.eyebrow;
        a.appendChild(eb);
      }
      var t = document.createElement("span");
      t.className = "defter-panel__item-title";
      t.textContent = entry.title;
      a.appendChild(t);
      item.appendChild(a);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "defter-panel__item-remove";
      rm.setAttribute("aria-label", tr3("Defterden çıkar", "Remove from notebook", "Remover do caderno"));
      rm.textContent = "×";
      rm.addEventListener("click", function () {
        var arr = loadEntries();
        var cikan = arr.splice(i, 1)[0];
        saveEntries(arr);
        refreshStarState();
        if (cikan) undoBaslat(cikan, i);
        renderPanelList();
      });
      item.appendChild(rm);
      listEl.appendChild(item);
    });
  }

  function setPanelOpen(open) {
    panel.hidden = !open;
    toggleBtn.setAttribute("aria-expanded", String(open));
    if (open) renderPanelList(); else undoBitir();
  }

  function buildToggle() {
    var b = document.createElement("button");
    b.type = "button";
    b.id = "defter-toggle";
    b.className = "defter-toggle";
    b.title = "Kavram Defterim — My Concept Notebook — Meu Caderno de Conceitos";
    b.setAttribute("aria-label", "Kavram Defterim / My Concept Notebook / Meu Caderno de Conceitos");
    b.setAttribute("aria-expanded", "false");
    b.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">' +
      '<path d="M12 5.2C10.2 4 7.8 3.6 5 4v14.4c2.8-.4 5.2 0 7 1.2 1.8-1.2 4.2-1.6 7-1.2V4c-2.8-.4-5.2 0-7 1.2Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<line x1="12" y1="5.2" x2="12" y2="19.6" stroke="currentColor" stroke-width="1.5"/>' +
      "</svg>";
    b.addEventListener("click", function () { setPanelOpen(panel.hidden); });
    document.body.appendChild(b);
    return b;
  }

  function buildPanel() {
    var p = document.createElement("div");
    p.id = "defter-panel";
    p.className = "defter-panel";
    p.hidden = true;
    p.setAttribute("role", "dialog");
    p.setAttribute("aria-label", "Kavram Defterim / My Concept Notebook / Meu Caderno de Conceitos");
    p.innerHTML =
      '<div class="uyg-tutamak" aria-hidden="true"></div>' +
      '<div class="defter-panel__head">' +
      '<p class="defter-panel__heading">' + tr3("Kavram Defterim", "My Concept Notebook", "Meu Caderno de Conceitos") + "</p>" +
      '<button type="button" class="defter-panel__close" aria-label="Kapat / Close / Fechar">×</button>' +
      "</div>" +
      '<p class="defter-panel__note">' + tr3(
        "Bu liste yalnız bu tarayıcıda, senin cihazında tutuluyor — başka kimseyle paylaşılmıyor.",
        "This list is kept only in this browser, on your device — it is not shared with anyone.",
        "Esta lista é mantida apenas neste navegador, no seu dispositivo — não é partilhada com ninguém."
      ) + "</p>" +
      '<div class="defter-panel__list" id="defter-panel-list"></div>' +
      '<div class="defter-panel__geri-al" role="status" hidden><span class="defter-panel__geri-al-ad"></span><button type="button" class="defter-panel__geri-al-dugme"></button></div>';
    document.body.appendChild(p);
    undoEl = p.querySelector(".defter-panel__geri-al");
    undoEl.querySelector("button").addEventListener("click", undoUygula);
    p.querySelector(".defter-panel__close").addEventListener("click", function () { setPanelOpen(false); });
    return p;
  }

  function init() {
    toggleBtn = buildToggle();
    panel = buildPanel();
    listEl = document.getElementById("defter-panel-list");
    starBtn = document.getElementById("detail-notebook-toggle");
    if (starBtn) starBtn.addEventListener("click", toggleCurrent);

    var detailPanel = document.getElementById("detail-panel");
    if (detailPanel && window.MutationObserver) {
      var mo = new MutationObserver(refreshStarState);
      mo.observe(detailPanel, { attributes: true, attributeFilter: ["hidden"], childList: true, subtree: true });
    }
    // Escape artık burada değil, GU.registerStepBack'in merkezi sırasında --
    // iki katman aynı anda açıkken tek Escape'in hepsini kapatmaması için.
    if (window.DostGraphUtils) {
      window.DostGraphUtils.registerStepBack("defter-panel", function () { setPanelOpen(false); return true; });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
