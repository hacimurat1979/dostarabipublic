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

  // Defterim haritada (F05, 2026-10-21, kullanıcı onayı): açık harita Ontoloji, Hâller ya da Esmâ ise
  // ve Defterim'de o haritadan kayıt varsa listenin başında "Haritada göster" hapı çıkar; basınca
  // kayıtlar haritada yıldızlı ışık olur, kalan düğümler perdelenir (GU.defterOdagi). Panel kapanır,
  // altta "Kaldır" hapı kalır; Esc de odağı bir adımda kaldırır. Durum yalnız bellektedir.
  var ODAK_GORUNUM = { ontoloji: 1, hal: 1, esma: 1 };
  function haritaYolu(href) {
    try {
      var seg = new URL(href, location.href).pathname.split("/").filter(Boolean);
      if (seg[0] === "en" || seg[0] === "pt") seg.shift();
      return seg;
    } catch (e) { return []; }
  }
  function acikHarita() {
    var seg = haritaYolu(location.href);
    if (!seg.length) return "ontoloji";
    return ODAK_GORUNUM[seg[0]] ? seg[0] : null;
  }
  function odakKimlikleri(entries, view) {
    var ids = new Set();
    entries.forEach(function (e) {
      var seg = haritaYolu(e.href);
      if (seg[0] === view && seg[1] && seg[1].indexOf("edge") !== 0) ids.add(decodeURIComponent(seg[1]));
    });
    return ids;
  }
  var odakHap = null;
  function odakKaldir() {
    if (window.DostGraphUtils && window.DostGraphUtils.defterOdagi) window.DostGraphUtils.defterOdagi(null, null);
    if (odakHap) { odakHap.remove(); odakHap = null; }
  }
  function odakKur(view, ids, etiket) {
    window.DostGraphUtils.defterOdagi(view, ids);
    setPanelOpen(false);
    if (odakHap) odakHap.remove();
    odakHap = document.createElement("button");
    odakHap.type = "button";
    odakHap.className = "defter-odak-hap";
    odakHap.innerHTML = '<span class="defter-odak-hap__yildiz" aria-hidden="true">★</span><span></span>';
    odakHap.lastChild.textContent = etiket || tr3("Defterim haritada · Kaldır", "Notebook on the map · Remove", "Caderno no mapa · Remover");
    odakHap.addEventListener("click", odakKaldir);
    document.body.appendChild(odakHap);
    var ilk = view;
    var izle = setInterval(function () {
      if (!odakHap) { clearInterval(izle); return; }
      if (acikHarita() !== ilk) { clearInterval(izle); odakKaldir(); }
    }, 600);
  }
  // Arama sonucu haritada (2026-10-30, fikir K4): search.js bir sonucun düğümünü haritada ışık yapar.
  // Aynı odak mekanizması (defterOdagi); yalnız hapın yazısı farklıdır.
  window.__dostHaritadaGoster = function (view, id) {
    if (!ODAK_GORUNUM[view] || !window.DostGraphUtils || !window.DostGraphUtils.defterOdagi) return;
    var git = function () {
      var n = 0, izle = setInterval(function () {
        n++;
        if (acikHarita() === view || n > 40) {
          clearInterval(izle);
          if (acikHarita() === view) odakKur(view, new Set([String(id)]), tr3("Arama sonucu haritada · Kaldır", "Search result on the map · Remove", "Resultado da busca no mapa · Remover"));
        }
      }, 150);
    };
    if (acikHarita() !== view && window.__dostNav && window.__dostNav.goTo) window.__dostNav.goTo(view);
    git();
  };
  function haritadaGoster(entries) {
    var view = acikHarita();
    if (!view || !window.DostGraphUtils || !window.DostGraphUtils.defterOdagi) return;
    var ids = odakKimlikleri(entries, view);
    if (!ids.size) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "defter-panel__haritada";
    b.innerHTML = '<span aria-hidden="true">★</span><span></span>';
    b.lastChild.textContent = tr3("Haritada göster", "Show on the map", "Mostrar no mapa") + " · " + ids.size;
    b.addEventListener("click", function () { odakKur(view, ids); });
    listEl.appendChild(b);
  }

  // Notlarım (2026-10-29, Defterim 2.0): okuma görünümlerinde paragrafa yazılan, yalnız bu cihazdaki notlar
  // (assets/okuma-kipi.js yazar). Burada listelenir; satıra dokunmak o sayfayı açar ve paragrafa kaydırır.
  var NOT_DEPO = "dost-notlarim", NOT_HEDEF = "dost-not-hedef";
  function loadNotes() {
    try { var a = JSON.parse(localStorage.getItem(NOT_DEPO) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  // ── Vurgularım ve etiketler (2026-10-30, fikirler D1 + D2): yalnız bu cihazda ─────────────────────
  var VURGU_DEPO = "dost-vurgular";
  function loadVurgu() {
    try { var a = JSON.parse(localStorage.getItem(VURGU_DEPO) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  var etiketSuzgec = "", etiketAcik = "", defterAra = "", defterSira = "yeni";
  // Defterim'de arama ve sıralama (2026-10-30, fikir D3): yalnız cihazdaki kayıtlar; metin, başlık, etiket üzerinde.
  function aramaGecer(k) {
    if (!defterAra) return true;
    var m = [k.title, k.eyebrow, k.baslik, k.metin, k.alinti, k.href, k.yol].concat(Array.isArray(k.etiketler) ? k.etiketler : []).join(" ").toLocaleLowerCase("tr");
    return defterAra.toLocaleLowerCase("tr").split(/\s+/).filter(Boolean).every(function (w) { return m.indexOf(w) >= 0; });
  }
  function siraliKopya(arr) {
    var c = arr.slice();
    var zaman = function (k) { return k.addedAt || k.t || 0; };
    var ad = function (k) { return String(k.title || k.baslik || k.metin || ""); };
    if (defterSira === "ad") c.sort(function (a, b) { return ad(a).localeCompare(ad(b), "tr"); });
    else c.sort(function (a, b) { return zaman(b) - zaman(a); });
    return c;
  }
  function araSiraCubugu(toplam) {
    if (toplam < 6 && !defterAra) return;
    var kutu = document.createElement("div");
    kutu.className = "defter-panel__ara";
    var g = document.createElement("input");
    g.type = "search"; g.className = "defter-panel__ara-girdi"; g.value = defterAra; g.maxLength = 60;
    g.placeholder = tr3("Defterimde ara", "Search my notebook", "Buscar no meu caderno");
    g.setAttribute("aria-label", g.placeholder);
    g.addEventListener("input", function () {
      defterAra = g.value.trim();
      var pos = g.selectionStart;
      renderPanelList();
      var y = listEl.querySelector(".defter-panel__ara-girdi");
      if (y) { y.focus(); try { y.setSelectionRange(pos, pos); } catch (e) { /* tür desteklemiyor */ } }
    });
    var b = document.createElement("button");
    b.type = "button"; b.className = "defter-panel__etiket";
    b.textContent = defterSira === "ad" ? tr3("A–Z", "A–Z", "A–Z") : tr3("Yeni → eski", "Newest first", "Mais novos primeiro");
    b.setAttribute("aria-label", tr3("Sıralamayı değiştir", "Change the order", "Mudar a ordem"));
    b.addEventListener("click", function () { defterSira = defterSira === "ad" ? "yeni" : "ad"; renderPanelList(); });
    kutu.appendChild(g); kutu.appendChild(b);
    listEl.appendChild(kutu);
  }
  function etiketNorm(x) { return String(x || "").replace(/\s+/g, " ").trim().slice(0, 24); }
  function etiketAnahtar(x) { return x.toLocaleLowerCase("tr"); }
  function etiketVar(k) { return Array.isArray(k.etiketler) ? k.etiketler : []; }
  function suzguGecer(k) { return aramaGecer(k) && (!etiketSuzgec || etiketVar(k).some(function (e) { return etiketAnahtar(e) === etiketAnahtar(etiketSuzgec); })); }
  // Üç depodaki kaydın etiketlerini yazar; tür: "defter" (href), "not" (id), "vurgu" (id)
  function etiketYaz(tur, anahtar, liste) {
    var depo = tur === "defter" ? STORAGE_KEY : tur === "not" ? NOT_DEPO : VURGU_DEPO;
    var arr = tur === "defter" ? loadEntries() : tur === "not" ? loadNotes() : loadVurgu();
    arr.forEach(function (k) {
      var kimlik = tur === "defter" ? k.href : k.id;
      if (kimlik === anahtar) k.etiketler = liste;
    });
    try { localStorage.setItem(depo, JSON.stringify(arr)); } catch (e) { /* depo yok */ }
    if (tur !== "defter") window.dispatchEvent(new Event("dost-notlar"));
    else renderPanelList();
  }
  function etiketSatiri(tur, k, anahtar) {
    var satir = document.createElement("div");
    satir.className = "defter-panel__etiket-satir";
    var liste = etiketVar(k);
    liste.forEach(function (e) {
      var c = document.createElement("button");
      c.type = "button"; c.className = "defter-panel__etiket"; c.textContent = "#" + e;
      c.setAttribute("aria-label", tr3("Etiketi kaldır: ", "Remove tag: ", "Remover etiqueta: ") + e);
      c.addEventListener("click", function () { etiketYaz(tur, anahtar, liste.filter(function (x) { return x !== e; })); });
      satir.appendChild(c);
    });
    if (etiketAcik === tur + ":" + anahtar) {
      var g = document.createElement("input");
      g.type = "text"; g.className = "defter-panel__etiket-girdi"; g.maxLength = 24;
      g.placeholder = tr3("etiket", "tag", "etiqueta");
      g.setAttribute("aria-label", tr3("Yeni etiket", "New tag", "Nova etiqueta"));
      var bitti = false;
      var bitir = function (ekle) {
        if (bitti) return;
        bitti = true;
        var v = etiketNorm(g.value.replace(/^#/, ""));
        etiketAcik = "";
        if (ekle && v && liste.length < 8 && !liste.some(function (x) { return etiketAnahtar(x) === etiketAnahtar(v); })) etiketYaz(tur, anahtar, liste.concat([v]));
        else renderPanelList();
      };
      g.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); bitir(true); } else if (ev.key === "Escape") { ev.stopPropagation(); bitir(false); } });
      g.addEventListener("blur", function () { bitir(true); });
      satir.appendChild(g);
      setTimeout(function () { try { g.focus(); } catch (e) { /* odak yok */ } }, 0);
    } else {
      var ekle = document.createElement("button");
      ekle.type = "button"; ekle.className = "defter-panel__etiket-ekle";
      ekle.textContent = "+ " + tr3("etiket", "tag", "etiqueta");
      ekle.addEventListener("click", function () { etiketAcik = tur + ":" + anahtar; renderPanelList(); });
      satir.appendChild(ekle);
    }
    return satir;
  }
  function etiketSuzgeciCiz(tumu) {
    var sayac = {};
    tumu.forEach(function (k) { etiketVar(k).forEach(function (e) { var a = etiketAnahtar(e); sayac[a] = sayac[a] || { ad: e, n: 0 }; sayac[a].n++; }); });
    var anahtarlar = Object.keys(sayac).sort();
    if (etiketSuzgec && !sayac[etiketAnahtar(etiketSuzgec)]) etiketSuzgec = "";
    if (!anahtarlar.length) return;
    var kutu = document.createElement("div");
    kutu.className = "defter-panel__etiketler";
    kutu.setAttribute("role", "group");
    kutu.setAttribute("aria-label", tr3("Etiketler", "Tags", "Etiquetas"));
    anahtarlar.forEach(function (a) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "defter-panel__etiket";
      b.textContent = "#" + sayac[a].ad + " " + sayac[a].n;
      b.setAttribute("aria-pressed", String(!!etiketSuzgec && etiketAnahtar(etiketSuzgec) === a));
      b.addEventListener("click", function () { etiketSuzgec = (etiketSuzgec && etiketAnahtar(etiketSuzgec) === a) ? "" : sayac[a].ad; renderPanelList(); });
      kutu.appendChild(b);
    });
    listEl.appendChild(kutu);
  }
  var silinecekVurgu = null;
  function vurgulariCiz(liste) {
    liste = siraliKopya(liste.filter(suzguGecer));
    if (!liste.length) return;
    var bas = document.createElement("p");
    bas.className = "defter-panel__grup";
    bas.textContent = tr3("Vurgularım", "My highlights", "Meus destaques") + " · " + liste.length;
    listEl.appendChild(bas);
    liste.forEach(function (v) {
      var item = document.createElement("div");
      item.className = "defter-panel__item defter-panel__item--vurgu";
      var a = document.createElement("a");
      a.className = "defter-panel__item-link";
      a.href = v.yol;
      var eb = document.createElement("span"); eb.className = "defter-panel__item-eyebrow"; eb.textContent = v.baslik || v.yol; a.appendChild(eb);
      var ti = document.createElement("span"); ti.className = "defter-panel__item-title";
      var nokta = document.createElement("i"); nokta.className = "defter-panel__nokta defter-panel__nokta--" + v.renk; nokta.setAttribute("aria-hidden", "true");
      ti.appendChild(nokta); ti.appendChild(document.createTextNode("“" + v.metin + "”")); a.appendChild(ti);
      a.addEventListener("click", function () {
        try { localStorage.setItem(NOT_HEDEF, JSON.stringify({ yol: v.yol, alinti: v.alinti })); } catch (e) { /* depo yok */ }
        setPanelOpen(false);
      });
      item.appendChild(a);
      var rm = document.createElement("button");
      rm.type = "button"; rm.className = "defter-panel__item-remove";
      var ikinci = silinecekVurgu === v.id;
      rm.setAttribute("aria-label", ikinci ? tr3("Vurguyu silmek için bir kez daha dokun", "Tap once more to delete the highlight", "Toque mais uma vez para excluir o destaque") : tr3("Vurguyu sil", "Delete highlight", "Excluir destaque"));
      rm.textContent = ikinci ? tr3("Sil?", "Delete?", "Excluir?") : "×";
      if (ikinci) rm.classList.add("defter-panel__item-remove--onay");
      rm.addEventListener("click", function () {
        if (silinecekVurgu !== v.id) { silinecekVurgu = v.id; renderPanelList(); return; }
        silinecekVurgu = null;
        try { localStorage.setItem(VURGU_DEPO, JSON.stringify(loadVurgu().filter(function (x) { return x.id !== v.id; }))); } catch (e) { /* depo yok */ }
        window.dispatchEvent(new Event("dost-notlar"));
      });
      item.appendChild(rm);
      listEl.appendChild(item);
      listEl.appendChild(etiketSatiri("vurgu", v, v.id));
    });
  }

  // Okuma günlüğüm (2026-10-30, fikir D7): varsayılan kapalı; açılınca okuma görünümleri o günkü yolları cihazda yazar.
  function gunlukOku() { try { var o = JSON.parse(localStorage.getItem("dost-gunluk") || "{}"); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
  function gunlukCiz() {
    var acik = false; try { acik = localStorage.getItem("dost-gunluk-acik") === "1"; } catch (e) { /* depo yok */ }
    var o = gunlukOku(), gunler = Object.keys(o).sort().reverse().slice(0, 14);
    var kap = document.createElement("details");
    kap.className = "defter-panel__gunluk";
    var sum = document.createElement("summary");
    sum.className = "defter-panel__grup";
    sum.textContent = tr3("Okuma günlüğüm", "My reading log", "Meu diário de leitura") + (acik ? " · " + gunler.length : "");
    kap.appendChild(sum);
    var not = document.createElement("p");
    not.className = "defter-panel__gunluk-not";
    not.textContent = acik
      ? tr3("Her gün açtığın okuma sayfaları burada, yalnız bu cihazda tutulur.", "The reading pages you open each day are kept here, on this device only.", "As páginas de leitura que você abre a cada dia ficam aqui, só neste dispositivo.")
      : tr3("Kapalı. Açarsan her gün açtığın okuma sayfaları yalnız bu cihazda listelenir; sunucuya gitmez.", "Off. If you turn it on, the reading pages you open each day are listed on this device only; nothing is sent to a server.", "Desativado. Se ativar, as páginas de leitura que você abre a cada dia são listadas só neste dispositivo; nada vai para um servidor.");
    kap.appendChild(not);
    gunler.forEach(function (g) {
      var h = document.createElement("p"); h.className = "defter-panel__gunluk-gun"; h.textContent = g; kap.appendChild(h);
      o[g].forEach(function (x) {
        var a = document.createElement("a"); a.className = "defter-panel__gunluk-satir"; a.href = x.yol; a.textContent = x.baslik || x.yol;
        a.addEventListener("click", function () { setPanelOpen(false); });
        kap.appendChild(a);
      });
    });
    var sira = document.createElement("div"); sira.className = "defter-panel__gunluk-sira";
    var dugme = function (ad, fn) { var b = document.createElement("button"); b.type = "button"; b.className = "defter-panel__gunluk-dugme"; b.textContent = ad; b.addEventListener("click", fn); sira.appendChild(b); };
    dugme(acik ? tr3("Günlüğü kapat", "Turn log off", "Desativar diário") : tr3("Günlüğü aç", "Turn log on", "Ativar diário"), function () {
      try { localStorage.setItem("dost-gunluk-acik", acik ? "0" : "1"); } catch (e) { /* depo yok */ }
      gunlukAcikTut = true; renderPanelList();
    });
    if (gunler.length) dugme(tr3("Günlüğü sil", "Delete log", "Excluir diário"), function () {
      try { localStorage.removeItem("dost-gunluk"); } catch (e) { /* depo yok */ }
      gunlukAcikTut = true; renderPanelList();
    });
    kap.appendChild(sira);
    if (gunlukAcikTut) { kap.open = true; gunlukAcikTut = false; }
    listEl.appendChild(kap);
  }
  var gunlukAcikTut = false;

  var silinecekNot = null;
  function notlariCiz(notes) {
    notes = siraliKopya(notes.filter(suzguGecer));
    if (!notes.length) return;
    var bas = document.createElement("p");
    bas.className = "defter-panel__grup";
    bas.textContent = tr3("Notlarım", "My notes", "Minhas notas") + " · " + notes.length;
    listEl.appendChild(bas);
    notes.forEach(function (n) {
      var item = document.createElement("div");
      item.className = "defter-panel__item defter-panel__item--not";
      var a = document.createElement("a");
      a.className = "defter-panel__item-link";
      a.href = n.yol;
      var eb = document.createElement("span"); eb.className = "defter-panel__item-eyebrow"; eb.textContent = n.baslik || n.yol; a.appendChild(eb);
      var ti = document.createElement("span"); ti.className = "defter-panel__item-title defter-panel__item-not"; ti.textContent = n.metin; a.appendChild(ti);
      var al = document.createElement("span"); al.className = "defter-panel__item-alinti"; al.textContent = "“" + (n.alinti || "") + "…”"; a.appendChild(al);
      a.addEventListener("click", function () {
        try { localStorage.setItem(NOT_HEDEF, JSON.stringify({ yol: n.yol, alinti: n.alinti })); } catch (e) { /* depo yok */ }
        setPanelOpen(false);
      });
      item.appendChild(a);
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "defter-panel__item-remove";
      var ikinci = silinecekNot === n.id;
      rm.setAttribute("aria-label", ikinci ? tr3("Notu silmek için bir kez daha dokun", "Tap once more to delete the note", "Toque mais uma vez para excluir a nota") : tr3("Notu sil", "Delete note", "Excluir nota"));
      rm.textContent = ikinci ? tr3("Sil?", "Delete?", "Excluir?") : "×";
      if (ikinci) rm.classList.add("defter-panel__item-remove--onay");
      rm.addEventListener("click", function () {
        if (silinecekNot !== n.id) { silinecekNot = n.id; renderPanelList(); return; }
        silinecekNot = null;
        try { localStorage.setItem(NOT_DEPO, JSON.stringify(loadNotes().filter(function (x) { return x.id !== n.id; }))); } catch (e) { /* depo yok */ }
        window.dispatchEvent(new Event("dost-notlar"));
      });
      item.appendChild(rm);
      listEl.appendChild(item);
    });
  }
  function yedekDugmesi(bos) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "defter-panel__yedek";
    // Boş defterde işlev yalnız "almak"tır (tarama 30 Ekim, G2): düğme bunu söyler.
    b.textContent = bos ? tr3("Yedekten ya da kodla al", "Restore from backup or code", "Restaurar de backup ou código") : tr3("Yedek ve taşıma", "Backup and transfer", "Backup e transferência");
    b.addEventListener("click", function () {
      if (!window.__dostOnceYukle) return;
      window.__dostOnceYukle("defter-yedek").then(function () { window.DostDefterYedek.ac(); }).catch(function () {});
    });
    listEl.appendChild(b);
  }

  // Bugünün parçası (assets/bugun.js, tembel): Defterim'in en üstünde tek bir bağlantı.
  function bugunSatiri() {
    if (!window.__dostOnceYukle) return;
    window.__dostOnceYukle("bugun").then(function () { window.DostBugun.satirEkle(listEl); }).catch(function () {});
  }
  // Defterim sekmeleri (2026-10-30, V3 raporu: Kayıtlar · Notlar · Vurgular): birden çok grup doluysa üstte yazılı çipler; yalnız görünümü süzer.
  var defterSekme = "hepsi";
  function sekmeCubugu(sayi) {
    var dolu = ["kayit", "not", "vurgu"].filter(function (k) { return sayi[k] > 0; });
    if (dolu.length < 2) { defterSekme = "hepsi"; return; }
    if (defterSekme !== "hepsi" && !sayi[defterSekme]) defterSekme = "hepsi";
    var ad = { hepsi: tr3("Tümü", "All", "Todos"), kayit: tr3("Kayıtlar", "Saved", "Itens"), not: tr3("Notlar", "Notes", "Notas"), vurgu: tr3("Vurgular", "Highlights", "Destaques") };
    var kap = document.createElement("div");
    kap.className = "search-suzgec defter-panel__sekme";
    kap.setAttribute("role", "group");
    kap.setAttribute("aria-label", tr3("Defterim bölümleri", "Notebook sections", "Seções do caderno"));
    ["hepsi"].concat(dolu).forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "search-suzgec__cip";
      b.setAttribute("aria-pressed", String(defterSekme === k));
      b.appendChild(document.createTextNode(ad[k] + " "));
      var n = document.createElement("span"); n.className = "search-suzgec__n"; n.textContent = k === "hepsi" ? sayi.kayit + sayi.not + sayi.vurgu : sayi[k]; b.appendChild(n);
      b.addEventListener("click", function () { defterSekme = k; renderPanelList(); });
      kap.appendChild(b);
    });
    listEl.appendChild(kap);
  }
  function renderPanelList() {
    if (!listEl) return;
    var entries = loadEntries();
    var notes = loadNotes();
    var vurgular = loadVurgu();
    undoYaz();
    setTimeout(bugunSatiri, 0);   // liste bu çağrıda yeniden yazılır; satır ardından en üste konur
    if (!entries.length && !notes.length && !vurgular.length) {
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
          if (window.__dostNav && window.__dostNav.goTo) {
            ev.preventDefault();
            var gec = function () { window.__dostNav.goTo(el.dataset.view); };
            if (window.DostGraphUtils && window.DostGraphUtils.daireAcilis) window.DostGraphUtils.daireAcilis(el.getBoundingClientRect(), gec);
            else gec();
          }
        });
      });
      gunlukCiz();
      yedekDugmesi(true);   // yeni cihazda boş defterin ilk işi: yedekten ya da kodla almak
      return;
    }
    listEl.innerHTML = "";
    haritadaGoster(entries);
    araSiraCubugu(entries.length + notes.length + vurgular.length);
    etiketSuzgeciCiz(entries.concat(notes, vurgular));
    sekmeCubugu({ kayit: entries.length, not: notes.length, vurgu: vurgular.length });
    if (defterSekme === "kayit") { notes = []; vurgular = []; }
    else if (defterSekme === "not") { entries = []; vurgular = []; }
    else if (defterSekme === "vurgu") { entries = []; notes = []; }
    if (entries.length && (notes.length || vurgular.length)) {
      var kb = document.createElement("p");
      kb.className = "defter-panel__grup";
      kb.textContent = tr3("Kayıtlar", "Saved items", "Itens salvos") + " · " + entries.length;
      listEl.appendChild(kb);
    }
    entries.map(function (e, i) { return { e: e, i: i }; }).sort(function (a, b) { return defterSira === "ad" ? String(a.e.title || "").localeCompare(String(b.e.title || ""), "tr") : (b.e.addedAt || 0) - (a.e.addedAt || 0) || b.i - a.i; }).forEach(function (sira) {
      var entry = sira.e, i = sira.i;
      if (!suzguGecer(entry)) return;
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
      if (entry.href.indexOf("?yanyana=") >= 0) {
        // Kayıtlı yan yana ikilisi (assets/yan-yana.js): bağlantı yerine pencereyi aynı ikiliyle açar.
        a.addEventListener("click", function (ev) {
          if (!window.__dostOnceYukle) return;
          ev.preventDefault();
          var ikili = decodeURIComponent((entry.href.split("?yanyana=")[1] || "")).split(",");
          setPanelOpen(false);
          window.__dostOnceYukle("yan-yana").then(function () { return window.DostYanYana.ac(ikili[0], ikili[1]); }).catch(function () {});
        });
      }
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
      listEl.appendChild(etiketSatiri("defter", entry, entry.href));
    });
    notlariCiz(notes);
    vurgulariCiz(vurgular);
    gunlukCiz();
    yedekDugmesi();
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
      '<p class="defter-panel__heading">' + tr3("Defterim", "My Notebook", "Meu Caderno") + "</p>" +
      '<button type="button" class="defter-panel__close" aria-label="Kapat / Close / Fechar">×</button>' +
      "</div>" +
      '<p class="defter-panel__note">' + tr3(
        "Bu liste yalnız bu tarayıcıda, senin cihazında tutuluyor — başka kimseyle paylaşılmıyor.",
        "This list is kept only in this browser, on your device — it is not shared with anyone.",
        "Esta lista é mantida apenas neste navegador, no seu dispositivo — não é compartilhada com ninguém."
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
    window.addEventListener("dost-notlar", function () { if (panel && !panel.hidden) renderPanelList(); });
    window.addEventListener("storage", function (e) { if (panel && !panel.hidden && (e.key === STORAGE_KEY || e.key === NOT_DEPO || e.key === VURGU_DEPO || !e.key)) renderPanelList(); });
    toggleBtn = buildToggle();
    panel = buildPanel();
    listEl = document.getElementById("defter-panel-list");
    // Kayıtlı yan yana ikilisi /?yanyana=<sol>,<sağ> adresi açılınca pencere aynı ikiliyle açılır (geniş ekran).
    var yp = new URLSearchParams(location.search);
    if (yp.has("yanyana")) {
      var ikili = (yp.get("yanyana") || "").split(",");
      yp.delete("yanyana");
      var kalanY = yp.toString();
      try { history.replaceState(history.state, "", location.pathname + (kalanY ? "?" + kalanY : "") + location.hash); } catch (e) { /* adres temizlenemedi */ }
      var bekleY = 0;
      var acY = setInterval(function () {
        if (window.__dostAppReady || ++bekleY > 60) {
          clearInterval(acY);
          if (window.__dostOnceYukle && /^\/(futuhat|fusus|miskat)\/[a-z0-9]+\/$/.test(ikili[0] || "") && /^\/(futuhat|fusus|miskat)\/[a-z0-9]+\/$/.test(ikili[1] || "")) {
            window.__dostOnceYukle("yan-yana").then(function () { return window.DostYanYana.ac(ikili[0], ikili[1]); }).catch(function () {});
          }
        }
      }, 250);
    }
    // Uygulama kısayolu "Defterim" (manifest.json, 2026-10-29): /?defter=1 paneli açar; adres temizlenir.
    var kp = new URLSearchParams(location.search);
    if (kp.has("defter")) {
      kp.delete("defter");
      var kalanQ = kp.toString();
      try { history.replaceState(history.state, "", location.pathname + (kalanQ ? "?" + kalanQ : "") + location.hash); } catch (e) { /* adres temizlenemedi */ }
      var bekle = 0;
      var acZamani = setInterval(function () {
        if (window.__dostAppReady || ++bekle > 60) { clearInterval(acZamani); setPanelOpen(true); }
      }, 250);
    }
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
      window.DostGraphUtils.registerStepBack(null, function () { if (panel.hidden) return false; setPanelOpen(false); return true; });
      window.DostGraphUtils.registerStepBack(null, function () { if (!odakHap) return false; odakKaldir(); return true; }, { oncelikli: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
