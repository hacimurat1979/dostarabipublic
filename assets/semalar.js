// Şemalar Arşivi — sitedeki şemaların tek yerde, KÖKENİYLE toplandığı bölüm
// (2026-10-31, kullanıcı onayı).
//
// Arşiv yeni şema ÜRETMEZ; var olanı toplar ve her birinin yanına kimin çizdiğini
// söyleyen bir halka koyar (veri: scripts/semalar-uret.py -> semalar-arsivi.json):
//   altın  = Dost'un eli (Çizimler'deki şekiller)
//   mürekkep = kısmın bölümlerinden bizim çizdiğimiz şema
//   mavi   = bizim okuma çerçevemiz (metnin kendisi böyle sıralamıyor)
// Köken yoksa (sayı 0) süzgeçte ve rehberde hiç görünmez. Berzah ve Hayal'in iki özel
// şeması (Boynuz, halka ağı) ilk açılışta assets/semalar-berzah.js'ten iner.
//
// Aynı #detail-panel'i kullanır (Hocalar gibi): kayıt adresi /semalar/<id>/.
window.__semalarApp = (function () {
  "use strict";

  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;

  const wrapEl = document.getElementById("semalar-wrap");
  const listEl = document.getElementById("semalar-list");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");

  if (!wrapEl || !listEl) return { activate() {}, onLangChange() {}, goToNode() {} };

  const tt = I18n.pick3;
  const t3 = (tr, en, pt) => tt({ tr, en, pt });
  const ROMEN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];
  const KOKLER = ["el", "bizim", "cerceve"];
  const SAYFA = 24;

  let data = null;
  let fetchPromise = null;
  let suzgec = "hepsi";
  let sorgu = "";
  let gosterilen = SAYFA;
  let odak = null;

  function fetchData() {
    if (data) return Promise.resolve(data);
    if (fetchPromise) return fetchPromise;
    if (window.DostViewStatus) window.DostViewStatus.showLoading("semalar-wrap");
    fetchPromise = GU.fetchJson("data/ibn-arabi/semalar-arsivi.json")
      .then((d) => {
        data = d;
        if (window.DostViewStatus) window.DostViewStatus.hide("semalar-wrap");
        return d;
      })
      .catch((err) => {
        console.error("Şemalar Arşivi yüklenemedi / Failed to load the Diagrams Archive", err);
        fetchPromise = null;
        if (window.DostViewStatus) window.DostViewStatus.showError("semalar-wrap", () => window.__semalarApp.activate());
        return null;
      });
    return fetchPromise;
  }

  // Dost'un eli şekilleri arşivde de kendi çizimleriyle görünür (Çizimler görünümünün çizicisi, tembel iner).
  const cizimOnbellek = new Map();
  function cizimSvg(id) {
    if (!window.__cizimlerApp || !window.__cizimlerApp.cizimSvg) return Promise.resolve("");
    if (!cizimOnbellek.has(id)) cizimOnbellek.set(id, Promise.resolve(window.__cizimlerApp.cizimSvg(id)).then((x) => x || "").catch(() => ""));
    return cizimOnbellek.get(id);
  }
  function cizimleriDoldur(kok) {
    kok.querySelectorAll("[data-cizim]:not([data-hazir])").forEach((el) => {
      cizimSvg(el.dataset.cizim).then((svg) => {
        if (!svg || !el.isConnected) return;
        el.innerHTML = svg;
        el.setAttribute("data-hazir", "1");
        const sv = el.querySelector("svg.cizim-card__svg");
        if (sv) { sv.setAttribute("aria-hidden", "true"); sv.setAttribute("focusable", "false"); }
      });
    });
  }

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const halka = (k) => `<span class="sema-halka sema-halka--${k}" aria-hidden="true"></span>`;
  const href = (view, id) => (window.__dostNav ? window.__dostNav.href(view, id) : `/${view}/${id ? id + "/" : ""}`);

  function kisimEtiket(o) {
    if (!o.cilt) return "";
    return `${t3("Cilt", "Vol.", "Vol.")} ${ROMEN[o.cilt]} · ${t3("Kısım", "Part", "Parte")} ${o.kisim}`;
  }

  function aramaMetni(o) {
    if (!o._q) {
      o._q = norm([tt(o.ad), o.ad.tr, o.ad.en, o.ad.pt, o.alt ? [o.alt.tr, o.alt.en, o.alt.pt].join(" ") : "",
        o.cilt ? `cilt ${ROMEN[o.cilt]} kisim ${o.kisim} ${o.id}` : o.id].join(" "));
    }
    return o._q;
  }

  // ---- küçük resimler -------------------------------------------------
  // Ağaç şeması (kısmın ana şeması): kök ortada, dallar halkada, alt dallar dışta (yalnız çizgi/nokta).
  function radyal(o, buyuk) {
    const W = buyuk ? 300 : 150, H = buyuk ? 200 : 100, cx = W / 2, cy = H / 2;
    const r1 = buyuk ? 52 : 26, r2 = buyuk ? 86 : 42;
    const a = o.agac || {};
    const dallar = a.c || [];
    let g = "";
    const n = dallar.length;
    dallar.forEach((d, i) => {
      const ang = -Math.PI / 2 + (i / n) * 2 * Math.PI;
      const x = cx + r1 * Math.cos(ang), y = cy + r1 * Math.sin(ang);
      g += `<line class="sema-th__cizgi" x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`;
      const alt = d.c || [];
      const m = alt.length;
      alt.forEach((_, j) => {
        const da = m > 1 ? (j / (m - 1) - 0.5) * Math.min(0.9, (2 * Math.PI) / n * 0.8) : 0;
        const x2 = cx + r2 * Math.cos(ang + da), y2 = cy + r2 * Math.sin(ang + da);
        g += `<line class="sema-th__cizgi sema-th__cizgi--ince" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/><circle class="sema-th__nokta" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${buyuk ? 3 : 1.7}"/>`;
      });
      g += `<circle class="sema-th__dugum" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${buyuk ? 7 : 3.6}"/>`;
    });
    g += `<circle class="sema-th__kok" cx="${cx}" cy="${cy}" r="${n ? (buyuk ? 11 : 5.5) : (buyuk ? 20 : 10)}"/>`;
    return `<svg class="sema-th" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${g}</svg>`;
  }

  function simge(o) {
    if (o.ozel === "berzah-boynuz") {
      return `<svg class="sema-th" viewBox="0 0 150 100" aria-hidden="true" focusable="false"><path class="sema-th__dolgu" d="M70 14 C71 38 58 62 40 92 L110 92 C92 62 79 38 80 14 Z"/><circle class="sema-th__kok" cx="75" cy="8" r="4" style="fill:none"/></svg>`;
    }
    if (o.ozel === "berzah-halka") {
      let g = '<circle class="sema-th__halka" cx="75" cy="50" r="34"/>';
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 2 * Math.PI;
        g += `<circle class="sema-th__nokta" cx="${(75 + 34 * Math.cos(a)).toFixed(1)}" cy="${(50 + 34 * Math.sin(a)).toFixed(1)}" r="${2 + (i % 3)}"/>`;
      }
      return `<svg class="sema-th" viewBox="0 0 150 100" aria-hidden="true" focusable="false">${g}</svg>`;
    }
    if (o.agac) return radyal(o, false);
    // Dost'un eli: yalnız tek daire ve merkez (kaynağın kendi çizimi burada yeniden çizilmez; Çizimler'de).
    return `<svg class="sema-th" viewBox="0 0 150 100" aria-hidden="true" focusable="false"><circle class="sema-th__halka" cx="75" cy="50" r="30"/><circle class="sema-th__kok" cx="75" cy="50" r="4"/></svg>`;
  }

  // ---- liste ------------------------------------------------------------
  function gorunenler() {
    const q = norm(sorgu).trim();
    return data.ogeler.filter((o) => (suzgec === "hepsi" || o.kok === suzgec) && (!q || aramaMetni(o).includes(q)));
  }

  function kokSayilari() {
    const s = { hepsi: data.ogeler.length };
    KOKLER.forEach((k) => { s[k] = data.ogeler.filter((o) => o.kok === k).length; });
    return s;
  }

  function rehberHtml(sayi) {
    const satir = KOKLER.filter((k) => sayi[k]).map((k) => `<li class="semalar-rehber__madde">${halka(k)}<div><strong>${esc(tt(data.kokenler[k].ad))}</strong><p>${esc(tt(data.kokenler[k].aciklama))}</p></div></li>`).join("");
    return `<details class="semalar-rehber"><summary>${esc(t3("Köken rehberi", "Guide to the rings", "Guia dos anéis"))}</summary><ul class="semalar-rehber__liste">${satir}</ul></details>`;
  }

  function kartHtml(o) {
    const meta = o.cilt ? kisimEtiket(o) : (o.kok === "el" ? t3("Çizimler", "Diagrams", "Diagramas") : tt(o.alt || { tr: "", en: "", pt: "" }));
    return `<button class="sema-kart" type="button" data-id="${esc(o.id)}" aria-label="${esc(tt(o.ad))}, ${esc(tt(data.kokenler[o.kok].ad))}">
      <span class="sema-kart__resim"${o.kok === "el" ? ` data-cizim="${esc(o.cizim)}"` : ""}>${simge(o)}</span>
      <span class="sema-kart__ad">${halka(o.kok)}<span>${esc(tt(o.ad))}</span></span>
      <span class="sema-kart__meta">${esc(meta)}</span>
    </button>`;
  }

  function izgaraYaz() {
    const liste = gorunenler();
    const kutu = listEl.querySelector(".semalar-izgara");
    const sayac = listEl.querySelector(".semalar-sayac");
    const daha = listEl.querySelector(".semalar-daha");
    if (!kutu) return;
    kutu.innerHTML = liste.slice(0, gosterilen).map(kartHtml).join("");
    cizimleriDoldur(kutu);
    if (sayac) sayac.textContent = liste.length ? t3(`${liste.length} şema`, `${liste.length} diagrams`, `${liste.length} diagramas`) : t3("Eşleşen şema yok.", "No matching diagram.", "Nenhum diagrama correspondente.");
    if (daha) {
      const kalan = liste.length - gosterilen;
      daha.hidden = kalan <= 0;
      daha.textContent = t3(`Daha fazlasını göster (${kalan})`, `Show more (${kalan})`, `Mostrar mais (${kalan})`);
    }
  }

  function render() {
    if (!data) return;
    const sayi = kokSayilari();
    const etiketler = { hepsi: t3("Hepsi", "All", "Todos") };
    KOKLER.forEach((k) => { etiketler[k] = tt(data.kokenler[k].ad); });
    const dugmeler = ["hepsi"].concat(KOKLER.filter((k) => sayi[k])).map((k) => `<button class="semalar-suzgec__dugme" type="button" data-kok="${k}" aria-pressed="${suzgec === k}">${k === "hepsi" ? "" : halka(k)}<span>${esc(etiketler[k])}</span><span class="semalar-suzgec__sayi">${sayi[k]}</span></button>`).join("");
    // Yön bulma (2026-10-31, kullanıcı notu: "nerden geldik, nereye gidebiliriz, ana sayfaya nasıl döneriz belli değil"):
    // konum satırı + (siteden gelindiyse) Geri + komşu bölümlere bağlar. Yeni metin değil, gezinme.
    // Geri yalnız site İÇİNDE bir adım atıldıysa (uygulamanın tarih sayacı) çıkar: doğrudan açılışta geri başka siteye/boş sayfaya götürürdü.
    const geriVar = !!(GU.tarihAdimi && GU.tarihAdimi() > 0);
    const komsu = [["ontoloji", "", t3("Ana sayfa", "Home", "Início")], ["cizimler", "", t3("Çizimler", "Diagrams", "Diagramas")], ["futuhat", "", t3("Fütûhât", "Futuhat", "Futuhat")], ["terimler", "", t3("Terimler", "Terms", "Termos")]]
      .map(([v, id, ad]) => `<a class="semalar-konum__bag" href="${href(v, id)}" data-view="${v}">${esc(ad)}</a>`).join("");
    listEl.innerHTML = `<nav class="semalar-konum" aria-label="${esc(t3("Konum", "Where you are", "Onde você está"))}">
        ${geriVar ? `<button class="semalar-konum__geri" type="button">← ${esc(t3("Geri", "Back", "Voltar"))}</button>` : ""}
        ${komsu}
      </nav>
      <div class="semalar-giris">
        <h2 class="semalar-giris__baslik">${esc(tt(data.baslik))}</h2>
        <p class="semalar-giris__not">${esc(tt(data.giris))}</p>
        ${rehberHtml(sayi)}
      </div>
      <div class="semalar-arac">
        <div class="semalar-suzgec" role="group" aria-label="${esc(t3("Köken süzgeci", "Filter by origin", "Filtro por origem"))}">${dugmeler}</div>
        <input class="semalar-ara" type="search" value="${esc(sorgu)}" placeholder="${esc(t3("Şema ara…", "Search diagrams…", "Buscar diagramas…"))}" aria-label="${esc(t3("Şemalarda ara", "Search the diagrams", "Buscar nos diagramas"))}" autocomplete="off">
        <p class="semalar-sayac" aria-live="polite"></p>
      </div>
      <div class="semalar-izgara"></div>
      <button class="semalar-daha" type="button" hidden></button>`;
    izgaraYaz();
    const geriDugme = listEl.querySelector(".semalar-konum__geri");
    if (geriDugme) geriDugme.addEventListener("click", () => history.back());
    listEl.querySelectorAll(".semalar-suzgec__dugme").forEach((b) => b.addEventListener("click", () => {
      suzgec = b.dataset.kok;
      gosterilen = SAYFA;
      listEl.querySelectorAll(".semalar-suzgec__dugme").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      izgaraYaz();
    }));
    const ara = listEl.querySelector(".semalar-ara");
    ara.addEventListener("input", () => { sorgu = ara.value; gosterilen = SAYFA; izgaraYaz(); });
    listEl.querySelector(".semalar-daha").addEventListener("click", () => { gosterilen += SAYFA; izgaraYaz(); });
    listEl.querySelector(".semalar-izgara").addEventListener("click", (ev) => {
      const b = ev.target.closest(".sema-kart");
      if (!b) return;
      const o = data.ogeler.find((x) => x.id === b.dataset.id);
      if (o) panelGoster(o);
    });
  }

  // ---- ayrıntı paneli ---------------------------------------------------
  function dallarHtml(a) {
    const ic = (liste) => `<ul>${liste.map((d) => `<li>${esc(tt(d.a))}${d.c ? ic(d.c) : ""}</li>`).join("")}</ul>`;
    return a && a.c && a.c.length ? `<p class="sema-baslik">${esc(t3("Dallar", "Branches", "Ramos"))}</p><div class="sema-dallar">${ic(a.c)}</div>` : "";
  }

  function panelGoster(o) {
    if (window.__dostNav) window.__dostNav.setHash("semalar", String(o.id));
    odak = o.id;
    const k = data.kokenler[o.kok];
    let govde = "";
    if (o.ozel) {
      govde = `<div class="sema-ozel" data-ozel="${esc(o.ozel)}"><p class="sema-yukleniyor">${esc(t3("Yükleniyor…", "Loading…", "Carregando…"))}</p></div>`;
    } else if (o.kok === "el") {
      const kisimlar = (o.kisimlar || []).map((id) => {
        const m = /^c(\d+)k(\d+)$/.exec(id);
        return `<a class="sema-bag" href="${href("futuhat", id)}" data-view="futuhat" data-id="${id}">${t3("Cilt", "Vol.", "Vol.")} ${ROMEN[+m[1]]} · ${t3("Kısım", "Part", "Parte")} ${m[2]}</a>`;
      }).join("");
      const cz = (o.kisimlar && o.kisimlar[0]) ? `${href("cizimler")}?kisim=${o.kisimlar[0]}` : href("cizimler");
      govde = `<div class="sema-figur" data-cizim="${esc(o.cizim)}">${simge(o)}</div>
        <p class="sema-kaynak">${esc(tt(o.kaynak))}</p>
        <p class="sema-eylem"><a class="sema-dugme" href="${cz}">${esc(t3("Çizimler'de aç", "Open in Diagrams", "Abrir em Diagramas"))}</a>${kisimlar}</p>`;
    } else {
      govde = `<div class="sema-figur">${radyal(o, true)}</div>
        <p class="sema-kaynak">${esc(tt(o.alt))}<br>${esc(kisimEtiket(o))}${o.sayfa ? ` · ${esc(t3("s.", "pp.", "pp."))} ${esc(o.sayfa)}` : ""}</p>
        ${dallarHtml(o.agac)}
        <p class="sema-eylem"><a class="sema-dugme" href="${href("futuhat", o.id)}" data-view="futuhat" data-id="${esc(o.id)}">${esc(t3("Kısımda aç", "Open in the part", "Abrir na parte"))}</a></p>`;
    }
    detailContent.innerHTML = `<p class="detail-eyebrow">${halka(o.kok)} ${esc(tt(k.ad))}</p>
      <h2 class="detail-title">${esc(tt(o.ad))}</h2>
      <p class="sema-kunye">${esc(tt(k.aciklama))}</p>
      ${govde}`;
    detailPanel.hidden = false;
    cizimleriDoldur(detailContent);
    if (o.ozel) {
      const mount = detailContent.querySelector(".sema-ozel");
      const hata = () => { mount.innerHTML = `<p class="sema-yukleniyor">${esc(t3("Bu şema yüklenemedi.", "This diagram could not be loaded.", "Este diagrama não pôde ser carregado."))}</p>`; };
      (window.__dostOnceYukle ? window.__dostOnceYukle("semalar-berzah") : Promise.reject(new Error("ön betik yok")))
        .then(() => window.DostSemalarBerzah.ciz(o.ozel, mount))
        .catch((e) => { console.warn(e); hata(); });
    }
  }

  // ---- dış çağrılar -----------------------------------------------------
  function activate() {
    return fetchData().then((d) => { if (d) render(); });
  }

  function goToNode(id) {
    return fetchData().then((d) => {
      if (!d) return;
      render();
      const o = d.ogeler.find((x) => x.id === id);
      if (o) panelGoster(o);
      else if (window.__dostNav && window.__dostNav.kayitYok) window.__dostNav.kayitYok("semalar", id);
    });
  }

  function onLangChange() {
    if (!data) return;
    data.ogeler.forEach((o) => { delete o._q; });
    render();
    const o = odak && data.ogeler.find((x) => x.id === odak);
    if (o && !detailPanel.hidden) panelGoster(o);
  }

  return { activate, onLangChange, goToNode };
})();
