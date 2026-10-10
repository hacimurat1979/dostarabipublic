(function () {
  "use strict";

  const I18n = window.DostI18n;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = d3.select("#graph");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");
  const detailClose = document.getElementById("detail-close");
  const breadcrumbEl = document.getElementById("detail-breadcrumb");

  // Her görünümün detay şablonu ".detail-eyebrow" + ".detail-title" ile
  // başlıyor; bunları scroll sırasında yazı boyutu kontrollerinin hemen
  // altında sabit kalan tek bir başlık bloğuna sarıyoruz.
  function updateTypoHeightVar() {
    const controls = document.getElementById("typography-controls");
    if (!controls || !controls.offsetHeight) return;
    document.documentElement.style.setProperty("--typo-controls-height", controls.offsetHeight + "px");
  }

  function wrapStickyHead() {
    const eyebrow = detailContent.firstElementChild;
    if (!eyebrow || !eyebrow.classList.contains("detail-eyebrow")) return;
    const title = eyebrow.nextElementSibling;
    if (!title || !title.classList.contains("detail-title")) return;
    const head = document.createElement("div");
    head.className = "detail-sticky-head";
    detailContent.insertBefore(head, eyebrow);
    head.appendChild(eyebrow);
    head.appendChild(title);
    updateTypoHeightVar();
  }
  new MutationObserver(wrapStickyHead).observe(detailContent, { childList: true });
  const tooltip = document.getElementById("ontology-tooltip");
  const wrapEl = document.getElementById("ontology-wrap");

  const tt = I18n.pick3;  // window.DostI18n.pick3 zaten (!obj) koruması yapıyor (2026-08-15: 26 dosyadaki tekrar buraya toplandı)

  // B1: "ne kadar eminiz" katmanı. Etiketler research/anlayis-evrimi/
  // CONFIDENCE_MAP.md'nin sözlüğünden (Yüksek/Orta/Hipotez/Gelecekte-
  // doğrulanmalı/...); ontology.json'daki her kenarın kendi `nature`/
  // `insights` metninde YAZILI temkin diline göre atandı, elle ayrı bir
  // değerlendirme değil. Sözlüğün kendisi (2026-09-13) graph-utils.js'e
  // taşındı -- sorular.js de aynı deseni kullanacağı için, GORSEL_DIL.md'nin
  // "sabit anlam eşleşmeleri" ilkesi gereği tek kaynaktan okunmalı.
  const CONFIDENCE_LABEL = window.DostGraphUtils.CONFIDENCE_LABEL;
  const confSlug = window.DostGraphUtils.confSlug;
  function confidenceNoteHtml(c) {
    if (!c || c === "Yüksek") return "";
    const label = CONFIDENCE_LABEL[c] || { tr: c, en: c, pt: c };
    return `<p class="detail-confidence detail-confidence--${confSlug(c)}">${tt({
      tr: "Güvenimiz: ", en: "Our confidence: ", pt: "Nossa confiança: " })}<strong>${tt(label)}</strong> — ${tt({
      tr: "kenarın kendi metni bu okumayı henüz kesinleşmiş saymıyor.",
      en: "the edge's own text does not yet treat this reading as settled.",
      pt: "o próprio texto da aresta ainda não trata esta leitura como definitiva." })}</p>`;
  }
  // Kompakt biçim: Sırlar<->Sorular köprüsündeki (sirlarSorularHtml) her
  // bağ kendi küçük kartında duruyor -- tam cümleli confidenceNoteHtml
  // orada sığmıyor/ağır kaçıyor. Aynı sözlüğü (CONFIDENCE_LABEL/confSlug)
  // kullanan, yalnız etiketi taşıyan bir <span>; "Yüksek"te (ve etiketsiz
  // durumda) confidenceNoteHtml gibi hiçbir şey göstermiyor.
  function confidenceInlineHtml(c) {
    if (!c || c === "Yüksek") return "";
    const label = CONFIDENCE_LABEL[c] || { tr: c, en: c, pt: c };
    return `<span class="sorular-sir__confidence detail-confidence detail-confidence--${confSlug(c)}">${tt({
      tr: "Güvenimiz: ", en: "Our confidence: ", pt: "Nossa confiança: " })}<strong>${tt(label)}</strong></span>`;
  }

  // "Ne kadar eminiz?" düğmesi yalnız kenarları soluklaştırıp kesikli
  // yapıyordu -- ne olduğunu açıklayan bir not yoktu (kullanıcı notu,
  // 2026-08-01: "görünen ilişki çok net anlaşılmıyor"). Esmâ'nın "saydığımız
  // bağlar" düğmesinde denenmiş aynı geçici altyazı deseni (.graph-toast)
  // burada da kullanılıyor; sayı somut olduğu için "birkaç bağlantı" değil
  // gerçek adet gösteriliyor.
  let confidenceFeedbackEl = null, confidenceFeedbackTimer = null;
  function showConfidenceFeedback(on, dimmedCount, totalCount) {
    if (!ontologyWrap) return;
    if (!confidenceFeedbackEl) {
      confidenceFeedbackEl = document.createElement("p");
      confidenceFeedbackEl.className = "graph-toast";
      ontologyWrap.appendChild(confidenceFeedbackEl);
    }
    confidenceFeedbackEl.textContent = tt(on
      ? { tr: `${dimmedCount}/${totalCount} bağlantı soluklaştırıldı — yalnız "Yüksek" güvenli olanlar tam görünür kalıyor.`,
          en: `${dimmedCount}/${totalCount} links faded — only "High"-confidence ones stay fully visible.`,
          pt: `${dimmedCount}/${totalCount} vínculos esmaecidos — apenas os de confiança "Alta" permanecem totalmente visíveis.` }
      : { tr: "Bütün bağlantılar tekrar tam görünür.", en: "All links are fully visible again.", pt: "Todos os vínculos estão totalmente visíveis novamente." });
    confidenceFeedbackEl.classList.add("is-visible");
    if (confidenceFeedbackTimer) clearTimeout(confidenceFeedbackTimer);
    confidenceFeedbackTimer = setTimeout(() => { confidenceFeedbackEl.classList.remove("is-visible"); }, 4200);
  }

  // GORSEL-01 (uzman paneli denetimi 2026-08-17): bu görünümün mini
  // şemalarındaki üçgen uçlu oklar (odArrowEnd marker'ı) da görsel gramerin
  // "soyut ok kullanma" yasağına giriyordu. terimler.js'in isikCizgisi()
  // deseninin buradaki karşılığı: yön, kaynakta soluk / hedefte parlak bir
  // ışık-yolu gradyanıyla okunur. stop-color style= içinde -- yalnız öyle
  // yazılınca CSS değişkeni çözülüyor (terimler.js'teki ölçülmüş not).
  let odIsikSayaci = 0;
  function odIsik(x1, y1, x2, y2, extraClass) {
    const id = "odIsik" + (odIsikSayaci++);
    const renk = "var(--series-theme)";
    return (
      `<defs><linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="userSpaceOnUse">` +
      `<stop offset="0%" style="stop-color:${renk};stop-opacity:0.12"/>` +
      `<stop offset="100%" style="stop-color:${renk};stop-opacity:0.92"/>` +
      `</linearGradient></defs>` +
      `<line class="term-diagram-isikyolu${extraClass ? " " + extraClass : ""}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="url(#${id})"/>`
    );
  }

  // İki kavram/ilişkinin salt metinle anlatıldığında soyut kalan bağını
  // tek bakışta gösteren küçük SVG şemalar (bkz. CLAUDE.md ikinci ilke).
  const entityDiagramRenderers = {
    "twin-truth": (d) => `
      <svg class="term-diagram__svg" viewBox="0 0 320 180" role="img" aria-label="${tt(d.note)}">
        <circle class="term-diagram-node--venn" cx="125" cy="88" r="68"/>
        <circle class="term-diagram-node--venn" cx="195" cy="88" r="68"/>
        <text class="term-diagram-label" x="68" y="42" text-anchor="middle">${tt(d.left)}</text>
        <text class="term-diagram-note" x="68" y="150" text-anchor="middle">${tt(d.leftNote)}</text>
        <text class="term-diagram-label" x="252" y="42" text-anchor="middle">${tt(d.right)}</text>
        <text class="term-diagram-note" x="252" y="150" text-anchor="middle">${tt(d.rightNote)}</text>
        <text class="term-diagram-label term-diagram-note--accent" x="160" y="93" text-anchor="middle">${tt(d.center)}</text>
      </svg>
    `,
    // Perde = ardışık iki yaratılışın birbirine benzemesi (416). Üç
    // neredeyse özdeş daire: aralarındaki fark o kadar küçük ki
    // yenilenmeyi göremiyoruz -- görmediğimiz şeyin adı perde.
    "veil-likeness": (d) => `
      <svg class="term-diagram__svg" viewBox="0 0 320 190" role="img" aria-label="${tt(d.note)}">
        <circle class="term-diagram-node--venn" cx="92" cy="88" r="52"/>
        <circle class="term-diagram-node--venn" cx="160" cy="88" r="52"/>
        <circle class="term-diagram-node--venn" cx="228" cy="88" r="52"/>
        <text class="term-diagram-label" x="92" y="30" text-anchor="middle">${tt(d.first)}</text>
        <text class="term-diagram-label" x="160" y="30" text-anchor="middle">${tt(d.second)}</text>
        <text class="term-diagram-label" x="228" y="30" text-anchor="middle">${tt(d.third)}</text>
        <text class="term-diagram-label term-diagram-note--accent" x="160" y="93" text-anchor="middle">${tt(d.overlap)}</text>
        <text class="term-diagram-note" x="160" y="168" text-anchor="middle">${tt(d.foot)}</text>
      </svg>
    `,
    "seed-fork": (d) => `
      <svg class="term-diagram__svg" viewBox="0 0 260 240" role="img" aria-label="${tt(d.note)}">
        <line class="term-diagram-tether" x1="114" y1="167" x2="73" y2="197"/>
        ${odIsik(130, 135, 130, 97)}
        ${odIsik(112, 63, 73, 37)}
        ${odIsik(148, 63, 187, 37, "term-diagram-isikyolu--kesik")}
        <circle class="term-diagram-node" cx="130" cy="155" r="20"/>
        <text class="term-diagram-label--small" x="130" y="192" text-anchor="middle">${tt(d.seed)}</text>
        <circle class="term-diagram-node--dashed" cx="55" cy="210" r="22"/>
        <text class="term-diagram-label--small" x="55" y="215" text-anchor="middle">${tt(d.root)}</text>
        <circle class="term-diagram-node" cx="130" cy="75" r="22"/>
        <text class="term-diagram-label--small" x="130" y="80" text-anchor="middle">${tt(d.branch)}</text>
        <circle class="term-diagram-node--accent" cx="55" cy="25" r="22"/>
        <text class="term-diagram-label--small" x="55" y="30" text-anchor="middle">${tt(d.leftLeaf)}</text>
        <circle class="term-diagram-node--faint" cx="205" cy="25" r="22"/>
        <text class="term-diagram-label--small" x="205" y="30" text-anchor="middle">${tt(d.rightLeaf)}</text>
      </svg>
    `,
    // Nokta ve çevre. Cilt XIII'te (372. Bölüm) okuduğumuz cümlenin şekli:
    // "Hak kulunun kalbinde kendisine nazar eder ve dairenin NOKTASI
    // olduğunu görür... insan-ı kâmil dairenin ÇEVRESİ olduğunu görür."
    // Yarıçaplar bilerek eşit uzunlukta: çevrenin her yeri merkeze aynı
    // uzaklıkta, yani hiçbir nokta O'na daha yakın değil.
    // Merkezdeki etiket 2026-08-28'e kadar "Kalp"ti; cümlede noktayı gören
    // de görülen de Hak, kalp ise bunun görüldüğü yer -- düzeltme ve
    // gerekçesi verinin kendi `note` alanında yazılı, gizlenmiş değil.
    "point-circle": (d) => {
      const cx = 150, cy = 96, R = 78;
      const spokes = Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return `<line class="term-diagram-tether" x1="${cx}" y1="${cy}" x2="${(cx + Math.cos(a) * R).toFixed(1)}" y2="${(cy + Math.sin(a) * R).toFixed(1)}"/>`;
      }).join("");
      return `
      <svg class="term-diagram__svg" viewBox="0 0 300 226" role="img" aria-label="${tt(d.note)}">
        ${spokes}
        <circle class="term-diagram-node--venn" cx="${cx}" cy="${cy}" r="${R}"/>
        <circle class="term-diagram-node--accent" cx="${cx}" cy="${cy}" r="13"/>
        <text class="term-diagram-label--small" x="${cx}" y="${cy + 4}" text-anchor="middle">${tt(d.center)}</text>
        <text class="term-diagram-label" x="${cx}" y="200" text-anchor="middle">${tt(d.rim)}</text>
        <text class="term-diagram-note" x="${cx}" y="220" text-anchor="middle">${tt(d.equidistant)}</text>
      </svg>
    `;
    },
    "cascade-seas": (d) => {
      const xs = [45, 145, 245, 345];
      const classes = ["term-diagram-node--accent", "term-diagram-node", "term-diagram-node", "term-diagram-node--faint"];
      const circles = d.stops.map((s, i) => `
        <circle class="${classes[i]}" cx="${xs[i]}" cy="55" r="26"/>
        <text class="term-diagram-label--small" x="${xs[i]}" y="60" text-anchor="middle">${tt(s)}</text>
      `).join("");
      const arrows = [0, 1, 2].map((i) => `
        ${odIsik(xs[i] + 26, 55, xs[i + 1] - 26, 55)}
      `).join("");
      return `
        <svg class="term-diagram__svg" viewBox="0 0 390 110" role="img" aria-label="${tt(d.note)}">
          ${arrows}
          ${circles}
        </svg>
      `;
    },
  };

  function entityDiagramHtml(obj) {
    const renderer = obj.diagram && entityDiagramRenderers[obj.diagram.type];
    if (!renderer) return "";
    return `<div class="term-diagram-row"><div class="term-diagram-card">
      <div class="term-diagram-svg-wrap" data-entity-diagram="1" role="button" tabindex="0"
           aria-label="${tt({ tr: "Büyüt", en: "Enlarge", pt: "Ampliar" })}">${renderer(obj.diagram)}</div>
      <p class="term-diagram-caption">${tt(obj.diagram.note)}</p>
    </div></div>`;
  }

  // terimler.js'nin aynı adı taşıyan çizimleri (groupDiagramHtml) tıklayınca
  // büyüyor (DostLightbox); bu görünümdeki karşılığı (ör. perde düğümünün
  // "veil-likeness" şeması) aynı .term-diagram-card görselini paylaşıyor ama
  // hiçbir yerde büyütme bağlanmamıştı -- düğme görünüyor, tutmuyordu
  // (kullanıcı bildirimi, 2026-08-04). showNodeDetail/showEdgeDetail
  // innerHTML'i yazdıktan hemen sonra çağrılmalı.
  function wireEntityDiagram(obj) {
    if (!obj.diagram || !window.DostLightbox) return;
    const renderer = entityDiagramRenderers[obj.diagram.type];
    if (!renderer) return;
    const wrap = detailContent.querySelector('[data-entity-diagram="1"]');
    if (!wrap) return;
    const open = () => {
      window.dostTrack && window.dostTrack("sema_acildi", { type: obj.diagram.type });
      window.DostLightbox.open({
        closeLabel: tt({ tr: "Kapat", en: "Close", pt: "Fechar" }),
        svgHtml: renderer(obj.diagram),
        caption: tt(obj.diagram.note),
      });
    };
    wrap.addEventListener("click", open);
    wrap.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  function sirlarGestureDiagramHtml() {
    return `<div class="term-diagram-row"><div class="term-diagram-card">
      <svg class="term-diagram__svg" viewBox="0 0 300 150" role="img" aria-label="${tt({ tr: "İşaret eder, açıklamaz", en: "Points, but does not explain", pt: "Aponta, mas não explica" })}">
        <circle class="term-diagram-node--sm" cx="34" cy="75" r="7"/>
        ${odIsik(48, 75, 196, 75, "term-diagram-isikyolu--kesik")}
        <line class="term-diagram-mirror" x1="208" y1="35" x2="208" y2="115"/>
        <circle class="term-diagram-node--barrier" cx="256" cy="75" r="38"/>
        <text class="term-diagram-label" x="256" y="80" text-anchor="middle">?</text>
        <text class="term-diagram-note" x="120" y="100" text-anchor="middle">${tt({ tr: "işaret", en: "gesture", pt: "gesto" })}</text>
        <text class="term-diagram-note term-diagram-note--accent" x="256" y="132" text-anchor="middle">${tt({ tr: "açıklanmaz", en: "not explained", pt: "não explicado" })}</text>
      </svg>
      <p class="term-diagram-caption">${tt({
        tr: "İbn Arabî sırrın yönünü gösterir, ama eşikte durur - içeriğini açıklamaz.",
        en: "Ibn Arabi points toward the secret, but stops at the threshold - he does not disclose its content.",
        pt: "Ibn Arabi aponta a direção do segredo, mas para no limiar - não revela seu conteúdo.",
      })}</p>
    </div></div>`;
  }

  // Dil değişince okurun yeri korunur (2026-10-10, mobil senaryo). Görünümler
  // dil değişiminde kendilerini yeniden çiziyor; Fütûhât'ta makale yeniden
  // yazılınca tarayıcının kaydırma çapası sayfayı ~6.700 px aşağı, metnin
  // dışına atıyordu. Tıklamadan ÖNCE (yakalama evresi, çeviri henüz
  // uygulanmamışken) görünümde ekranın üstündeki blok ve ekrandaki yeri
  // kaydedilir; çizimden sonra aynı sıradaki blok aynı yere getirilir --
  // üç dilde de metnin bölümlenmesi aynı. Okur bu arada kendisi
  // kaydırırsa (dokunma, tekerlek, tuş) dokunulmaz.
  const OKUMA_BLOK = "p, h1, h2, h3, h4, li, blockquote, figure";
  let dilYeri = null;
  function okumaYeriniAl() {
    const wrap = document.querySelector("main > section:not([hidden]):not(.detail-panel)");
    if (!wrap || window.scrollY < 40) return null;
    const ust = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-header-height")) || 0;
    // Ekranda en üstte görünen blok: DOM sırası görsel sırayla aynı değil
    // (mobilde Fütûhât makalesi CSS order ile listenin üstüne çıkıyor).
    let secili = null, secTop = Infinity;
    wrap.querySelectorAll(OKUMA_BLOK).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height && r.bottom > ust + 4 && r.top < secTop) { secili = el; secTop = r.top; }
    });
    if (!secili) return null;
    // Sıra, bloğu taşıyan en yakın kimlikli kaba göre tutulur (ör.
    // #futuhat-article): kabın dışındaki listeler dil değişiminde başka
    // sayıda öğeyle çizilse de sıra kaymaz.
    let kok = secili.parentElement;
    while (kok && kok !== wrap && !kok.id) kok = kok.parentElement;
    if (!kok || !wrap.contains(kok)) kok = wrap;
    const icinde = [...kok.querySelectorAll(OKUMA_BLOK)];
    return { wrap, kokId: kok.id, i: icinde.indexOf(secili), sayi: icinde.length, ofs: secTop - ust };
  }
  function okumaYerineDon(yer) {
    if (!yer) return;
    let birakildi = false;
    const birak = () => { birakildi = true; };
    ["touchstart", "wheel", "keydown"].forEach((t) => window.addEventListener(t, birak, { once: true, passive: true }));
    const uygula = () => {
      if (birakildi || yer.wrap.hidden) return;
      const kok = (yer.kokId && document.getElementById(yer.kokId)) || yer.wrap;
      const bloklar = kok.querySelectorAll(OKUMA_BLOK);
      if (Math.abs(bloklar.length - yer.sayi) > 2) return; // yapı değişti: tahmin etme
      const el = bloklar[yer.i];
      if (!el) return;
      const ust = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-header-height")) || 0;
      const hedef = Math.max(0, el.getBoundingClientRect().top + window.scrollY - ust - yer.ofs);
      if (Math.abs(hedef - window.scrollY) > 2) window.scrollTo({ top: hedef, behavior: "instant" });
    };
    // İlk karede (boyamadan önce) ve bir sonrakinde: çapa sıçraması hiç görünmesin.
    requestAnimationFrame(() => { uygula(); requestAnimationFrame(uygula); });
    // Ağdan gelen yeniden çizimler (Füsûs/Mişkât dil dosyası) için iki kez daha.
    setTimeout(uygula, 350);
    setTimeout(uygula, 1000);
  }
  const langSwitchEl = document.getElementById("lang-switch");
  if (langSwitchEl) langSwitchEl.addEventListener("click", (e) => {
    const b = e.target.closest(".lang-btn");
    dilYeri = b && !b.classList.contains("lang-btn--active") ? okumaYeriniAl() : null;
  }, true);

  I18n.applyStatic();
  I18n.renderLangSwitcher(langSwitchEl, () => {
    const yer = dilYeri;
    dilYeri = null;
    okumaYerineDon(yer);
    render();
    // Sekme başlığı ve açıklama dil değişince eski dilde kalıyordu
    // (2026-10-08 taraması); geçerli rotayla yeniden yazılır. Adres
    // çubuğundaki dil öneki (varsa) i18n.js setLang'de zaten çevrildi;
    // çekmecedeki bağlantıların öneki de onunla birlikte güncellenir.
    try {
      navHrefleriniGuncelle();
      updateMeta(currentRoute.view, currentRoute.id);
    } catch (e) { console.error(e); }
    if (currentMainView === "esma") window.__esmaApp && window.__esmaApp.onLangChange();
    else if (currentMainView === "hal") window.__halApp && window.__halApp.onLangChange();
    else if (currentMainView === "terimler") window.__terimlerApp && window.__terimlerApp.onLangChange();
    else if (currentMainView === "cizimler") window.__cizimlerApp && window.__cizimlerApp.onLangChange();
    else if (currentMainView === "sirlar") window.__sirlarGraphApp && window.__sirlarGraphApp.onLangChange();
    else if (currentMainView === "sorular") window.__sorularApp && window.__sorularApp.onLangChange();
    else if (currentMainView === "aciksorular") window.__acikSorularApp && window.__acikSorularApp.onLangChange();
    else if (currentMainView === "bilmiyoruz") window.__bilmiyoruzApp && window.__bilmiyoruzApp.onLangChange();
    else if (currentMainView === "elestiriArkeolojisi") window.__elestiriArkeolojisiApp && window.__elestiriArkeolojisiApp.onLangChange();
    else if (currentMainView === "hocalar") window.__hocalarApp && window.__hocalarApp.onLangChange();
    else if (currentMainView === "eserAgi") window.__eserAgiApp && window.__eserAgiApp.onLangChange();
    else if (currentMainView === "seyahatAtlasi") window.__seyahatAtlasiApp && window.__seyahatAtlasiApp.onLangChange();
    else if (currentMainView === "kuranDokusu") window.__kuranDokusuApp && window.__kuranDokusuApp.onLangChange();
    else if (currentMainView === "menziller") window.__menzillerApp && window.__menzillerApp.onLangChange();
    else if (currentMainView === "tasiyicilar") window.__tasiyicilarApp && window.__tasiyicilarApp.onLangChange();
    else if (currentMainView === "futuhat") window.__futuhatApp && window.__futuhatApp.onLangChange();
    else if (currentMainView === "fusus") window.__fususApp && window.__fususApp.onLangChange();
    else if (currentMainView === "miskat") window.__miskatApp && window.__miskatApp.onLangChange();
    else if (currentMainView === "hakkinda") {
      window.__siirlerApp && window.__siirlerApp.onLangChange();
      window.__vahdetApp && window.__vahdetApp.onLangChange();
      window.__okumaYollariApp && window.__okumaYollariApp.onLangChange();
      window.__neredenBaslamaliApp && window.__neredenBaslamaliApp.onLangChange();
    }
    else if (currentMainView === "kavram") window.__kavramApp && window.__kavramApp.onLangChange();
    else if (currentMainView === "yolculuk") window.__yolculukApp && window.__yolculukApp.onLangChange();
    else if (currentMainView === "ayethadis") window.__ayetHadisApp && window.__ayetHadisApp.onLangChange();
    // Ontoloji görünümündeki mobil alternatif liste (grafik ekrana sığmazsa).
    // Aynı sayfada yaşadığı için ontoloji dalı gibi else-if içine
    // sıkıştırılmıyor; render() zaten grafiği tazeliyor, mobil liste
    // kendi doldur()'ıyla tazelensin.
    window.__ontolojiMobilListeApp && window.__ontolojiMobilListeApp.onLangChange();
    updateHeaderHeightVar();
  });

  // Sabit (sticky) üst kısmın gerçek yüksekliğini ölçüp detail-panel'in
  // altında başlamasını sağlayan CSS değişkeni.
  function updateHeaderHeightVar() {
    const header = document.querySelector(".app-header");
    if (header) {
      document.documentElement.style.setProperty("--app-header-height", header.offsetHeight + "px");
    }
  }
  updateHeaderHeightVar();
  // Ürün denetimi P1 (2026-09-02): debounce'suzdu -- pencere sürüklenerek
  // yeniden boyutlandırılırken saniyede onlarca kez offsetHeight okuyup
  // style.setProperty yazıyordu (zorunlu senkron layout). 11 diğer görünüm
  // (hal.js/menziller.js vb.) bunu GU.debounceResize ile çoktan çözmüştü;
  // en büyük dosya (ontology.js) atlanmıştı.
  window.addEventListener("resize", window.DostGraphUtils.debounceResize(updateHeaderHeightVar));
  window.addEventListener("resize", window.DostGraphUtils.debounceResize(updateTypoHeightVar));

  detailClose.addEventListener("click", () => {
    detailPanel.hidden = true;
  });

  const detailPrint = document.getElementById("detail-print");
  if (detailPrint) {
    detailPrint.addEventListener("click", () => {
      detailContent.querySelectorAll("details:not([open])").forEach((d) => d.setAttribute("open", ""));
      window.print();
    });
  }

  // Yazdır düğmesinin yanına paylaş düğmesi (kullanıcı isteği, 2026-08-16):
  // futuhat.js'teki sharePart/showToast ile aynı desen. URL için location.href
  // yeterli -- updateHash() zaten her kavram açıldığında history.replaceState
  // ile pathname'i o kavrama göre güncelliyor (yukarıda, satır ~998).
  const detailShare = document.getElementById("detail-share");
  let detailShareToastEl = null, detailShareToastTimer = null;
  function showDetailShareToast(message) {
    if (!detailShareToastEl) {
      detailShareToastEl = document.createElement("div");
      detailShareToastEl.className = "futuhat-toast";
      detailShareToastEl.setAttribute("role", "status");
      detailShareToastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(detailShareToastEl);
    }
    detailShareToastEl.textContent = message;
    detailShareToastEl.classList.add("futuhat-toast--visible");
    if (detailShareToastTimer) clearTimeout(detailShareToastTimer);
    detailShareToastTimer = setTimeout(() => { detailShareToastEl.classList.remove("futuhat-toast--visible"); }, 2400);
  }
  if (detailShare) {
    detailShare.addEventListener("click", () => {
      const titleEl = detailContent.querySelector(".detail-title");
      const concept = titleEl ? titleEl.textContent.trim() : "";
      const title = I18n.pick3({ tr: "Dost Arabî", en: "Dost Arabi", pt: "Dost Arabi" }) + (concept ? " — " + concept : "");
      const url = location.href;
      if (navigator.share) {
        navigator.share({ title, url }).catch(() => {});
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => showDetailShareToast(
          I18n.pick3({ tr: "Bağlantı kopyalandı", en: "Link copied", pt: "Link copiado" })
        ));
      }
    });
  }

  // Görsel kart (P0-3, 2026-09-02; "bu kaydı paylaş" 2026-10-09): düğme
  // açık olan kaydı ({view, id} -- updateHash'in yazdığı /<view>/<id>
  // yolundan) share-mode'a verir; panel o kaydın kartını kendiliğinden
  // hazırlar. Eskiden seçeneksiz açılıyor, el-Cemîl açıkken rastgele bir
  // Fütûhât alıntısı getiriyordu (seçimin habersiz başka yere gitmesi).
  const detailShareVisual = document.getElementById("detail-share-visual");
  if (detailShareVisual) {
    detailShareVisual.addEventListener("click", () => {
      if (!(window.__dostShare && window.__dostShare.open)) return;
      const yol = location.pathname.slice(ROUTE_BASE.length).split("/").filter(Boolean);
      const view = yol[0] || null;
      const id = yol.length > 1 ? decodeURIComponent(yol.slice(1).join("/")) : null;
      window.__dostShare.open(view ? { view: view, id: id } : undefined);
    });
  }

  // ESC ("bir adım geri") artık burada değil: ortak zincir graph-utils.js'te
  // (registerStepBack), açık panelin kapanması da onun genel son adımı.
  // Sırlar'ın tema odağını geri alan dal buradan KALDIRILDI ve kendi
  // dosyasına taşındı -- bir görünümün davranışı başka bir dosyada
  // yaşamamalı (bkz. ETKILESIM_DILI.md'nin son yasağı).

  // Lejant kutuları (Ontoloji/Esmâ/Hâller/Sırlar), özellikle dokunmatik/
  // tablet ekranlarda kısa viewport yüksekliğinde grafiğin üstüne düşüp
  // düğümleri kapatabiliyor -- varsayılan olarak kısık/dokunmatik
  // ekranlarda katlanmış başlasın, kullanıcı isterse açsın.
  // Etiket çakışması çözücüsü; ölçüm tabanlı, motor graph-utils.js'te.
  const deconflictLabels = window.DostGraphUtils.createLabelDeconflictor();
  window.DostGraphUtils.setupLegendToggles();
  window.DostGraphUtils.setupDetailPanelFocus();

  // Düzen: tek bir çember (2026-10-09, görsel değerlendirme raporu madde 1).
  //
  // Düzenin geçmişi, çünkü bu tablo üç kez değişti:
  //  * En eski hâl yukarıdan aşağıya düz bir merdivendi (2026-07-25'e kadar).
  //  * Sonra sekiz mertebe bir çemberin üstündeydi, merkezde Kalp.
  //  * 2026-08-28: merkezde Zât, ondan dışa açılıp ona kapanan bir sarmal;
  //    açılış 3B eğimli. Ölçüldü (2026-10-09 görsel değerlendirme): ilk
  //    ziyaret ipucu "bu harita iki uçlu bir çember" diyordu ama ekranda
  //    kesişen uzun çizgilerden bir yumak vardı, hiçbir çember görünmüyordu;
  //    yerleşim de kuvvet simülasyonu yüzünden her yüklemede biraz
  //    kayıyordu.
  //
  // Şimdiki hâl: omurga (ontoloji-mobil-liste.js'teki iniş sırasının
  // aynısı -- bkz. window.DostOntolojiOmurga) bir çemberin çevresine
  // dizilir. Zât tepede (-90°). İniş sağ yarıda saat yönünde aşağı iner;
  // en çok kesret olan Âlem-i Ecsâm en altta, Zât'tan en uzakta (90°).
  // Dönüş sol yarıdan yukarı çıkar: İnsan-ı Kâmil, Kalp ve Kalp'ten Zât'a
  // kapanan yay. Ardışık iki omurga düğümünü bağlayan kenarlar (iniş,
  // cem', rücû) çemberin kendi yayı olarak çizilir -- yani çember ayrı bir
  // süs değil, verideki kenarların ta kendisi.
  //
  // Konumlar sabit (kuvvet simülasyonu yalnız sürüklenen düğümü yerine
  // geri çekmek için var): her yüklemede aynı resim.
  //
  // Yan kavramlar (Perde, Kazâ, Teceddüd, Velî, Halîfe, ...) çemberin
  // DIŞINDA, veride bağlı oldukları omurga düğümünün yanında küçük uydular.
  // Bu bir YERLEŞİM kararı, yeni bir bağ değil: hiçbir kenar eklenmedi.
  // Ebeveyn şöyle bulunur (uyduEbeveyni): omurgadan o düğüme inen kenar;
  // yoksa en çok kenarı olduğu omurga düğümü; o da yoksa omurgaya bağlı
  // başka bir uydu (o zaman onun bir adım dışında durur).
  //
  // Görsel gramer uyarısı: Zât PARLAK BİR CİSİM değil -- dolgusu beyaz
  // (graph-utils.js ZAT_FILL, kullanıcının 2026-08-27 istisnası) ama
  // 2026-10-09'dan beri bu sahnede ışıması/hâlesi yok.
  //
  // Biçim: omurga düğümü -> açı° (-90 tepe, saat yönünde artar).
  const OMURGA = ["dhat", "sifat-asma", "ayan-sabite", "tecelli",
    "alem-ervah", "alem-misal", "alem-ecsam", "insan-i-kamil", "kalp"];
  window.DostOntolojiOmurga = OMURGA.slice();
  const CEMBER_ACI = {
    // İNİŞ: sağ yarı, tepeden dibe, 30°'lik eşit adımlarla.
    "dhat": -90, "sifat-asma": -60, "ayan-sabite": -30, "tecelli": 0,
    "alem-ervah": 30, "alem-misal": 60, "alem-ecsam": 90,
    // DÖNÜŞ: sol yarı, dipten tepeye; Kalp'ten Zât'a kalan yay rücûdur.
    "insan-i-kamil": 150, "kalp": 210,
  };
  // Uydular: halkanın dışında, ebeveynin ışınında. k = yarıçap çarpanı.
  const UYDU_K = [1.34, 1.64];      // bir adım dışarı, iki adım dışarı
  const UYDU_YELPAZE = 22;          // aynı ebeveyndeki uydular arası açı (°)
  const UYDU_KAYMA = 12;            // ikinci adımdaki uydunun açısal kayması (°)

  // /hakkinda'daki statik şemalar (şu an "Üç Sefer") de sitenin geri
  // kalanındaki çizimler gibi tıklanıp büyütülebilsin: aynı paylaşılan
  // lightbox, aynı ESC/odak-tuzağı davranışı.
  function wireHakkindaDiagrams() {
    if (!hakkindaWrap || !window.DostLightbox) return;
    hakkindaWrap.querySelectorAll(".hakkinda-diagram").forEach((svg) => {
      if (svg.dataset.wiredZoom) return;
      svg.dataset.wiredZoom = "1";
      svg.classList.add("hakkinda-diagram--zoomable");
      svg.setAttribute("tabindex", "0");
      svg.setAttribute("role", "button");
      const openIt = () => {
        const capEl = svg.parentElement && svg.parentElement.querySelector(".hakkinda-diagram__caption");
        const head = svg.closest(".hakkinda-content__section");
        window.DostLightbox.open({
          closeLabel: tt({ tr: "Kapat", en: "Close", pt: "Fechar" }),
          svgHtml: svg.outerHTML,
          name: head && head.querySelector("h3") ? head.querySelector("h3").textContent : "",
          caption: capEl ? capEl.textContent : "",
        });
      };
      svg.addEventListener("click", openIt);
      svg.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openIt(); }
      });
    });
  }

  // Sayfa başına dönme kısayolu (2026-08-06 kullanıcı bulgusu): /hakkinda
  // uzun bir sayfa, başa dönmek için çokça kaydırma gerekiyordu. Düğme
  // hakkindaWrap'ın İÇİNDE yaşıyor -- görünüm değişince section'ın kendi
  // `hidden`'ı düğmeyi de otomatik gizliyor, ayrı bir görünüm-kontrolüne
  // gerek yok.
  let hakkindaScrollTopWired = false;
  function wireHakkindaScrollTop() {
    const btn = document.getElementById("hakkinda-scroll-top");
    if (!btn || hakkindaScrollTopWired) return;
    hakkindaScrollTopWired = true;
    btn.hidden = false;
    const onScroll = () => {
      if (hakkindaWrap.hidden) return;
      const gorunur = window.scrollY > 480;
      btn.classList.toggle("is-visible", gorunur);
      // Görünmezken (opacity 0, pointer-events none) Tab sırasında
      // kalmasın -- klavye görünmeyen bir düğmeye düşüyordu (2026-10-08).
      btn.tabIndex = gorunur ? 0 : -1;
      btn.setAttribute("aria-hidden", String(!gorunur));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    onScroll();
  }

  // 2026-10-09 (dalga-web): rota çözümü artık ontology.json'u BEKLEMİYOR
  // (ilkRota, DOMContentLoaded'da). Eskiden /futuhat/c1k10/'a gelen biri
  // bile önce ontoloji verisinin inip grafiğin kurulmasını bekliyordu.
  // Grafik de yalnız ontoloji görünümü gerçekten açıkken kuruluyor: gizli
  // bir <svg> 0x0 ölçülür ve sarmal 800x600 yedeğine göre dizilirdi.
  let ontolojiVerisi = null;
  let ontolojiKuruldu = false;
  let bekleyenOntolojiId = null;
  function ensureOntologyGraph() {
    if (ontolojiKuruldu || !ontolojiVerisi || currentMainView !== "ontology") return false;
    ontolojiKuruldu = true;
    buildGraph(ontolojiVerisi);
    if (bekleyenOntolojiId) {
      const d = nodeById && nodeById.get(bekleyenOntolojiId);
      bekleyenOntolojiId = null;
      if (d) onNodeClick(d);
    }
    return true;
  }

  function loadOntologyData() {
    if (window.DostViewStatus) window.DostViewStatus.showLoading("ontology-wrap");
    window.DostGraphUtils.fetchJson("data/ibn-arabi/ontology.json")
      .then((data) => {
        ontolojiVerisi = data;
        registerOntologyCrossLinks(data);
        ensureOntologyGraph();
        if (window.DostViewStatus) window.DostViewStatus.hide("ontology-wrap");
        // Doğuş (FAZ 1): yalnız gerçekten ana ekrandaysak — bir deep-link
        // başka görünüme ya da bir düğüme götürdüyse araya girmeyiz.
        // Karşılama ekranı hâlâ görünüyorsa onun açılışını bekler (welcome.js
        // halka açılırken "dost:welcome-left" yayar); daha önce görülmüşse
        // kısa bir nefesle başlar.
        //
        // Karşılamada iki uçtan biri (Zât / Kalp) seçildiyse (2026-10-09)
        // seçim doğuş BİTİNCE açılır: önce çember kurulur, sonra o ucun
        // paneli ve kendi davranışı (Zât'tan yayılan ışık, Kalp'ten rücû).
        // Seçim kullanıcının kendi tıklaması -- adres yeni bir adım açar
        // (pushState), geri tuşu seçimsiz çembere döner.
        function karsilamaSecimi() {
          const s = window.__dostKarsilamaSecimi || null;
          window.__dostKarsilamaSecimi = null;
          return s;
        }
        function secimiAc(secim) {
          if (secim && window.__dostNav) window.__dostNav.goTo("ontoloji", secim);
        }
        function maybeBirth() {
          const secim = karsilamaSecimi();
          if (!birthFn) { secimiAc(secim); return; }
          if (currentMainView !== "ontology" || currentDetailNode || currentDetailEdge) { birthFn = null; secimiAc(secim); return; }
          const f = birthFn;
          birthFn = null;
          if (!f(() => secimiAc(secim))) secimiAc(secim);
        }
        const welcomeEl = document.getElementById("welcome-screen");
        if (welcomeEl && !welcomeEl.hidden && !window.__dostKarsilamaGitti) {
          document.addEventListener("dost:welcome-left", maybeBirth, { once: true });
        } else {
          setTimeout(maybeBirth, 150);
        }
      })
      .catch((err) => {
        console.error("Ontoloji verisi yüklenemedi / Failed to load ontology data", err);
        if (window.DostViewStatus) window.DostViewStatus.showError("ontology-wrap", loadOntologyData);
      });
  }
  loadOntologyData();

  const deferFetch = window.requestIdleCallback || ((cb) => setTimeout(cb, 200));

  // ÇAPRAZ-BAĞLANTI İNDEKSİ (2026-08-03). Buraya kadar esma.json (415KB),
  // hal.json (93KB) ve (terimler.js'te) felsefi-terimler.json (409KB)
  // AÇILIŞTA iniyordu -- yalnızca her kavramın ADINI ve KISA ÖZETİNİ almak
  // için. Yani 917KB indirip ~115KB'lık bir sözlük kuruyorduk, üstelik
  // sitenin HER sayfasında. Artık o sözlük derleme zamanında üretiliyor
  // (scripts/capraz-indeks-uret.py) ve tam dosyalar ancak o görünüm
  // gerçekten açıldığında geliyor.
  deferFetch(() => {
    window.DostGraphUtils.fetchJson("data/ibn-arabi/capraz-baglanti-indeksi.json")
      .then((data) => {
        (data.kayitlar || []).forEach((k) => {
          // Ontoloji kayıtları zaten ontology.json'dan kaydedildi; indeksten
          // tekrar kaydetmek zararsız ama gereksiz iş.
          if (k.view === "ontoloji") return;
          registerCrossLinkTerm(k.name, k.view, k.id, k.short);
        });
        notifyCrossLinkReady();
        render();
      })
      .catch((err) => console.error("Çapraz-bağlantı indeksi yüklenemedi / Failed to load cross-link index", err));
  });

  // Sırlar verisi (345KB) da açılışta iniyordu, oysa YALNIZ Sırlar görünümü
  // açıldığında gerekiyor (goToSirlar, showSirlarEntry, merkez paneli).
  // Artık talep üzerine; ortak fetchJson önbelleği sayesinde sirlar-graph.js
  // ile aynı indirmeyi paylaşıyor.
  let sirlarData = null;
  let sirlarPromise = null;
  function ensureSirlarData() {
    if (sirlarData) return Promise.resolve(sirlarData);
    if (sirlarPromise) return sirlarPromise;
    sirlarPromise = window.DostGraphUtils.fetchJson("data/ibn-arabi/sirlar.json")
      .then((data) => {
        sirlarData = data;
        render();
        return data;
      })
      .catch((err) => {
        sirlarPromise = null;
        console.error("Sırlar verisi yüklenemedi / Failed to load mysteries data", err);
        return null;
      });
    return sirlarPromise;
  }

  deferFetch(() => {
    window.DostGraphUtils.fetchJson("data/ibn-arabi/sozluk-ipuclari.json")
      .then((data) => {
        (data.terms || []).forEach((t) => registerGlossaryTerm(t.id, t.term, t.definition));
        render();
      })
      .catch((err) => console.error("Sözlük ipuçları yüklenemedi / Failed to load glossary hints", err));
  });

  let currentMainView = "ontology";
  const ontologyBtn = document.getElementById("ontology-btn");
  const esmaBtn = document.getElementById("esma-btn");
  const halBtn = document.getElementById("hal-btn");
  const terimlerBtn = document.getElementById("terimler-btn");
  const cizimlerBtn = document.getElementById("cizimler-btn");
  const sirlarBtn = document.getElementById("sirlar-btn");
  const sorularBtn = document.getElementById("sorular-btn");
  const acikSorularBtn = document.getElementById("acik-sorular-btn");
  const bilmiyoruzBtn = document.getElementById("bilmiyoruz-btn");
  const elestiriArkeolojisiBtn = document.getElementById("elestiri-arkeolojisi-btn");
  const hocalarBtn = document.getElementById("hocalar-btn");
  const eserAgiBtn = document.getElementById("eser-agi-btn");
  const seyahatAtlasiBtn = document.getElementById("seyahat-atlasi-btn");
  const kuranDokusuBtn = document.getElementById("kuran-dokusu-btn");
  const menzillerBtn = document.getElementById("menziller-btn");
  const tasiyicilarBtn = document.getElementById("tasiyicilar-btn");
  const futuhatBtn = document.getElementById("futuhat-btn");
  const fususBtn = document.getElementById("fusus-btn");
  const miskatBtn = document.getElementById("miskat-btn");
  const hakkindaBtn = document.getElementById("hakkinda-btn");
  const hakkindaSubSiirlerBtn = document.getElementById("hakkinda-sub-siirler-btn");
  const hakkindaSubVahdetBtn = document.getElementById("hakkinda-sub-vahdet-btn");
  const hakkindaSubOkumaYollariBtn = document.getElementById("hakkinda-sub-okuma-yollari-btn");
  const hakkindaSubNeredenBaslamaliBtn = document.getElementById("hakkinda-sub-nereden-baslamali-btn");
  const okumaYollariBtn = document.getElementById("okuma-yollari-btn");
  const kavramBtn = document.getElementById("kavram-btn");
  const ayethadisBtn = document.getElementById("ayethadis-btn");
  const ontologyWrap = document.getElementById("ontology-wrap");
  const esmaWrap = document.getElementById("esma-wrap");
  const halWrap = document.getElementById("hal-wrap");
  const terimlerWrap = document.getElementById("terimler-wrap");
  const cizimlerWrap = document.getElementById("cizimler-wrap");
  const sirlarWrap = document.getElementById("sirlar-wrap");
  const sorularWrap = document.getElementById("sorular-wrap");
  const acikSorularWrap = document.getElementById("acik-sorular-wrap");
  const bilmiyoruzWrap = document.getElementById("bilmiyoruz-wrap");
  const elestiriArkeolojisiWrap = document.getElementById("elestiri-arkeolojisi-wrap");
  const hocalarWrap = document.getElementById("hocalar-wrap");
  const eserAgiWrap = document.getElementById("eser-agi-wrap");
  const seyahatAtlasiWrap = document.getElementById("seyahat-atlasi-wrap");
  const yolculukWrap = document.getElementById("yolculuk-wrap");
  const kuranDokusuWrap = document.getElementById("kuran-dokusu-wrap");
  const menzillerWrap = document.getElementById("menziller-wrap");
  const tasiyicilarWrap = document.getElementById("tasiyicilar-wrap");
  const futuhatWrap = document.getElementById("futuhat-wrap");
  const fususWrap = document.getElementById("fusus-wrap");
  const miskatWrap = document.getElementById("miskat-wrap");
  const hakkindaWrap = document.getElementById("hakkinda-wrap");
  const kavramWrap = document.getElementById("kavram-wrap");
  const ayethadisWrap = document.getElementById("ayethadis-wrap");

  // Görsel olarak aktif sekmeyi işaretlemek (.btn-ghost--active) ekran
  // okuyucuya hiçbir şey söylemiyordu -- dil seçicideki aria-pressed'in
  // aksine. aria-current="page", 9 sekmeden hangisinin şu an gösterildiğini
  // ekran okuyucuya da bildiriyor.
  function markActiveNavButton(btn, isActive) {
    if (!btn) return;
    btn.classList.toggle("btn-ghost--active", isActive);
    if (isActive) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }

  // Yeni eklenen bölümlere (Kavramlar/Âyet-Hadis) nav'da küçük bir
  // rozet koyup, kullanıcı o bölümü bir kere ziyaret edince kaldırıyoruz
  // -- "kaldığın yer" özelliğindeki localStorage deseninin aynısı.
  //
  // 2026-08-05'te temizlendi: harita bir zamanlar on bir görünüm
  // taşıyordu (kuantum, elestiriArkeolojisi, hocalar, eserAgi,
  // seyahatAtlasi, kuranDokusu, futuhatMimarisi de dahil) -- yani
  // drawer'daki 22 girdinin YARISI "yeni" rozeti taşıyordu, ki bu
  // ayırt ediciliği sıfırlıyordu (11/22'nin hepsi "yeni" olamaz).
  // Nav konsolidasyonu (Fütûhât/Hayat/Bilinmeyenler akraba-sekmeleri)
  // o yedisini zaten gruplarken rozetsiz bıraktı; kuantum ayrıca
  // gerçekten eski bir dalgaydı (Dalga 2, D3) ve rozeti bilerek
  // kaldırıldı. Harita şimdi yalnız gerçekten güncel iki girdiyi
  // (Dalga 3'ün kendi dalgası: Kavramlar/D9, Âyet-Hadis) izliyor.
  const NAV_YENI_KEY = "dost-nav-yeni-gorulmus";
  function markNavYeniSeen(view) {
    const btn = { kavram: kavramBtn, ayethadis: ayethadisBtn, miskat: miskatBtn }[view];
    if (!btn || !btn.classList.contains("btn-ghost--yeni")) return;
    btn.classList.remove("btn-ghost--yeni");
    try {
      const seen = JSON.parse(localStorage.getItem(NAV_YENI_KEY) || "[]");
      if (!seen.includes(view)) {
        seen.push(view);
        localStorage.setItem(NAV_YENI_KEY, JSON.stringify(seen));
      }
    } catch (e) { /* localStorage kapalıysa sessizce geç */ }
  }
  try {
    const seenAtLoad = JSON.parse(localStorage.getItem(NAV_YENI_KEY) || "[]");
    seenAtLoad.forEach((v) => {
      const btn = { kavram: kavramBtn, ayethadis: ayethadisBtn, miskat: miskatBtn }[v];
      if (btn) btn.classList.remove("btn-ghost--yeni");
    });
  } catch (e) { /* yoksay */ }

  function setMainView(view) {
    if (currentMainView === view) return;
    if (view === "kavram" || view === "ayethadis" || view === "miskat") markNavYeniSeen(view);
    currentMainView = view;
    // Yeni görünüm başından açılır (2026-10-10, mobil senaryo): önceki
    // görünümde aşağı kaydırılmışken çekmeceden girilen görünüm aynı
    // kaydırma konumunda, başlığı ekranın üstünde kalmış açılıyordu
    // (Fütûhât'ta 12.000 px aşağıda). Görünüm kendi kaydını açıyorsa
    // (kısım, makale başı) kendi kaydırmasını bundan sonra yapar.
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
    markActiveNavButton(ontologyBtn, view === "ontology");
    markActiveNavButton(esmaBtn, view === "esma");
    markActiveNavButton(halBtn, view === "hal");
    markActiveNavButton(terimlerBtn, view === "terimler");
    markActiveNavButton(cizimlerBtn, view === "cizimler");
    markActiveNavButton(sirlarBtn, view === "sirlar");
    markActiveNavButton(sorularBtn, view === "sorular");
    markActiveNavButton(acikSorularBtn, view === "aciksorular");
    markActiveNavButton(bilmiyoruzBtn, view === "bilmiyoruz");
    markActiveNavButton(elestiriArkeolojisiBtn, view === "elestiriArkeolojisi");
    markActiveNavButton(hocalarBtn, view === "hocalar");
    markActiveNavButton(eserAgiBtn, view === "eserAgi");
    markActiveNavButton(seyahatAtlasiBtn, view === "seyahatAtlasi");
    markActiveNavButton(kuranDokusuBtn, view === "kuranDokusu");
    markActiveNavButton(menzillerBtn, view === "menziller");
    markActiveNavButton(tasiyicilarBtn, view === "tasiyicilar");
    markActiveNavButton(futuhatBtn, view === "futuhat");
    markActiveNavButton(fususBtn, view === "fusus");
    markActiveNavButton(miskatBtn, view === "miskat");
    markActiveNavButton(hakkindaBtn, view === "hakkinda");
    markActiveNavButton(kavramBtn, view === "kavram");
    markActiveNavButton(ayethadisBtn, view === "ayethadis");
    if (ontologyWrap) ontologyWrap.hidden = view !== "ontology";
    if (esmaWrap) esmaWrap.hidden = view !== "esma";
    if (halWrap) halWrap.hidden = view !== "hal";
    if (terimlerWrap) terimlerWrap.hidden = view !== "terimler";
    if (cizimlerWrap) cizimlerWrap.hidden = view !== "cizimler";
    if (sirlarWrap) sirlarWrap.hidden = view !== "sirlar";
    if (sorularWrap) sorularWrap.hidden = view !== "sorular";
    if (acikSorularWrap) acikSorularWrap.hidden = view !== "aciksorular";
    if (bilmiyoruzWrap) bilmiyoruzWrap.hidden = view !== "bilmiyoruz";
    if (elestiriArkeolojisiWrap) elestiriArkeolojisiWrap.hidden = view !== "elestiriArkeolojisi";
    if (hocalarWrap) hocalarWrap.hidden = view !== "hocalar";
    if (eserAgiWrap) eserAgiWrap.hidden = view !== "eserAgi";
    if (seyahatAtlasiWrap) seyahatAtlasiWrap.hidden = view !== "seyahatAtlasi";
    if (yolculukWrap) yolculukWrap.hidden = view !== "yolculuk";
    if (kuranDokusuWrap) kuranDokusuWrap.hidden = view !== "kuranDokusu";
    if (menzillerWrap) menzillerWrap.hidden = view !== "menziller";
    if (tasiyicilarWrap) tasiyicilarWrap.hidden = view !== "tasiyicilar";
    if (futuhatWrap) futuhatWrap.hidden = view !== "futuhat";
    if (fususWrap) fususWrap.hidden = view !== "fusus";
    if (miskatWrap) miskatWrap.hidden = view !== "miskat";
    if (hakkindaWrap) hakkindaWrap.hidden = view !== "hakkinda";
    if (kavramWrap) kavramWrap.hidden = view !== "kavram";
    if (ayethadisWrap) ayethadisWrap.hidden = view !== "ayethadis";
    if (view === "hakkinda") {
      wireHakkindaDiagrams();
      wireHakkindaScrollTop();
      window.__siirlerApp && window.__siirlerApp.wireTabs();
    }
    currentDetailNode = null;
    currentDetailEdge = null;
    detailPanel.hidden = true;
    if (view === "esma") {
      currentDetailView = "esma";
      window.__esmaApp && window.__esmaApp.activate();
    } else if (view === "hal") {
      currentDetailView = "hal";
      window.__halApp && window.__halApp.activate();
    } else if (view === "terimler") {
      currentDetailView = "terimler";
      window.__terimlerApp && window.__terimlerApp.activate();
    } else if (view === "cizimler") {
      currentDetailView = "cizimler";
      window.__cizimlerApp && window.__cizimlerApp.activate();
    } else if (view === "sirlar") {
      currentDetailView = null;
      currentDetailSirlarId = null;
      window.__sirlarGraphApp && window.__sirlarGraphApp.activate();
    } else if (view === "sorular") {
      currentDetailView = "sorular";
      window.__sorularApp && window.__sorularApp.activate();
    } else if (view === "aciksorular") {
      currentDetailView = null;
      window.__acikSorularApp && window.__acikSorularApp.activate();
    } else if (view === "bilmiyoruz") {
      currentDetailView = null;
      window.__bilmiyoruzApp && window.__bilmiyoruzApp.activate();
    } else if (view === "elestiriArkeolojisi") {
      currentDetailView = null;
      window.__elestiriArkeolojisiApp && window.__elestiriArkeolojisiApp.activate();
    } else if (view === "hocalar") {
      currentDetailView = null;
      window.__hocalarApp && window.__hocalarApp.activate();
    } else if (view === "eserAgi") {
      currentDetailView = null;
      window.__eserAgiApp && window.__eserAgiApp.activate();
    } else if (view === "seyahatAtlasi") {
      currentDetailView = null;
      window.__seyahatAtlasiApp && window.__seyahatAtlasiApp.activate();
    } else if (view === "yolculuk") {
      currentDetailView = null;
      window.__yolculukApp && window.__yolculukApp.activate();
    } else if (view === "kuranDokusu") {
      currentDetailView = null;
      window.__kuranDokusuApp && window.__kuranDokusuApp.activate();
    } else if (view === "menziller") {
      currentDetailView = "menziller";
      window.__menzillerApp && window.__menzillerApp.activate();
    } else if (view === "tasiyicilar") {
      currentDetailView = null;
      window.__tasiyicilarApp && window.__tasiyicilarApp.activate();
    } else if (view === "futuhat") {
      currentDetailView = null;
      window.__futuhatApp && window.__futuhatApp.activate();
    } else if (view === "fusus") {
      currentDetailView = null;
      window.__fususApp && window.__fususApp.activate();
    } else if (view === "miskat") {
      currentDetailView = null;
      window.__miskatApp && window.__miskatApp.activate();
    } else if (view === "kavram") {
      currentDetailView = "kavram";
      window.__kavramApp && window.__kavramApp.activate();
    } else if (view === "ayethadis") {
      currentDetailView = null;
      window.__ayetHadisApp && window.__ayetHadisApp.activate();
    } else {
      currentDetailView = null;
      if (view === "ontology") ensureOntologyGraph();
    }
  }

  // Çekmecedeki görünüm kapıları (2026-10-09, dalga-web): artık gerçek
  // <a href="/view/"> -- orta tık / yeni sekmede aç / bağlantıyı kopyala
  // çalışıyor. Yalın sol tık yakalanır ve SPA içinde açılır: ÖNCE adres
  // (pushState -- geri tuşu bir önceki görünüme döner), SONRA görünüm; böylece
  // görünümün kendiliğinden seçtiği kayıt (Fütûhât'ta kaldığın kısım gibi)
  // yeni bir tarih girdisi değil, bu girdinin düzeltmesi olur (bkz. updateHash).
  // [düğme, rota görünümü, alt-sekme]
  const NAV_KAPILARI = [
    [ontologyBtn, "ontoloji"], [esmaBtn, "esma"], [halBtn, "hal"], [terimlerBtn, "terimler"],
    [cizimlerBtn, "cizimler"], [sirlarBtn, "sirlar"], [sorularBtn, "sorular"], [bilmiyoruzBtn, "bilmiyoruz"],
    [elestiriArkeolojisiBtn, "elestiri-arkeolojisi"], [hocalarBtn, "hocalar"], [eserAgiBtn, "eser-agi"],
    [seyahatAtlasiBtn, "seyahat-atlasi"], [kuranDokusuBtn, "kuran-dokusu"], [menzillerBtn, "menziller"],
    [tasiyicilarBtn, "tasiyicilar"], [futuhatBtn, "futuhat"], [fususBtn, "fusus"], [miskatBtn, "miskat"],
    [hakkindaBtn, "hakkinda"], [kavramBtn, "kavram"], [ayethadisBtn, "ayethadis"],
    // Okuma Yolları çekmece kapısı (2026-08-10, G50) ve Hakkında'nın dört
    // alt-sekmesi (2026-08-15 @revise): görünüm hakkinda, alt-sekme id.
    [okumaYollariBtn, "hakkinda", "okuma-yollari"],
    [hakkindaSubSiirlerBtn, "hakkinda", "siirler"],
    [hakkindaSubVahdetBtn, "hakkinda", "vahdet"],
    [hakkindaSubOkumaYollariBtn, "hakkinda", "okuma-yollari"],
    [hakkindaSubNeredenBaslamaliBtn, "hakkinda", "nereden-baslamali"],
  ];
  // Rota adı -> setMainView'in iç adı (ikisi çoğunlukla aynı).
  const IC_GORUNUM = {
    ontoloji: "ontology", "elestiri-arkeolojisi": "elestiriArkeolojisi", "eser-agi": "eserAgi",
    "seyahat-atlasi": "seyahatAtlasi", "kuran-dokusu": "kuranDokusu",
  };
  function navGit(view, sub) {
    updateHash(view, sub);
    if (sub) goToHakkinda(sub);
    else if (view === "sirlar") goToSirlar();
    else setMainView(IC_GORUNUM[view] || view);
  }
  function navHrefleriniGuncelle() {
    NAV_KAPILARI.forEach(([el, view, sub]) => {
      if (el && el.tagName === "A") el.setAttribute("href", window.__dostNav.href(view, sub));
    });
  }
  NAV_KAPILARI.forEach(([el, view, sub]) => {
    if (!el) return;
    el.addEventListener("click", (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navGit(view, sub);
    });
  });

  // --- Deep linking & cross-view navigation ---
  let pendingSirlarId = null;

  // dostarabi.com'da site kökten servis ediliyor, ama önizleme kopyası
  // hacimurat1979.github.io/dost-onizleme/ altında bir alt path'te duruyor
  // (bkz. scripts/sync-to-preview.py, index.html <base>). Adres çubuğuna
  // yazdığımız/okuduğumuz her path bu kökü hesaba katmalı; <base>'in kendi
  // href'inden okuyoruz ki iki dağıtım da aynı kodu kullanabilsin.
  const ROUTE_BASE = (function () {
    const baseEl = document.querySelector("base");
    if (!baseEl) return "";
    try {
      const u = new URL(baseEl.getAttribute("href"), location.origin);
      return u.pathname.replace(/\/+$/, "");
    } catch (e) {
      return "";
    }
  })();
  window.__dostRouteBase = ROUTE_BASE;

  const VIEW_META = {
    ontoloji: {
      title: { tr: "Ontoloji", en: "Ontology", pt: "Ontologia" },
      desc: {
        tr: "Muhyiddîn İbnü'l-Arabî'nin varlık felsefesine (vahdet-i vücûd) dair, eserlerinden yaptığımız okumaların özetinden kurulan etkileşimli bir harita.",
        en: "An interactive map of Ibn Arabi's philosophy of Being (wahdat al-wujud), built from summaries of our readings of his works.",
        pt: "Um mapa interativo da filosofia do Ser de Ibn Arabi (wahdat al-wujud), construído a partir dos resumos das nossas leituras das suas obras.",
      },
    },
    esma: {
      title: { tr: "Esmâü'l-Hüsnâ", en: "The Beautiful Names", pt: "Os Belos Nomes" },
      desc: {
        tr: "Allah'ın güzel isimlerinin İbn Arabî'deki hiyerarşisini ve isimler arası ilişkileri gösteren bir harita.",
        en: "A map of the hierarchy of, and relations between, God's Beautiful Names in Ibn Arabi's thought.",
        pt: "Um mapa da hierarquia e das relações entre os Belos Nomes de Deus no pensamento de Ibn Arabi.",
      },
    },
    hal: {
      title: { tr: "Hâller", en: "States", pt: "Estados" },
      desc: {
        tr: "Tasavvuftaki hâl ve makamların (nefs, hayret, fenâ-bekâ...) İbn Arabî'deki seyrini izleyen bir harita.",
        en: "A map that follows the course of Sufi states and stations (the self, bewilderment, annihilation and subsistence...) in Ibn Arabi.",
        pt: "Um mapa que acompanha o percurso dos estados e estações sufis (o ego, o assombro, a aniquilação e subsistência...) em Ibn Arabi.",
      },
    },
    terimler: {
      title: { tr: "Terimler", en: "Terms", pt: "Termos" },
      desc: {
        tr: "İbn Arabî'nin temel terimlerinin (a'yân-ı sâbite, berzah, tecellî...) anlamlarını ve aralarındaki bağları derleyen bir sözlük.",
        en: "A glossary gathering the meanings of, and connections between, Ibn Arabi's core terms.",
        pt: "Um glossário que reúne o sentido e as conexões entre os termos fundamentais de Ibn Arabi.",
      },
    },
    cizimler: {
      title: { tr: "Çizimler", en: "Diagrams", pt: "Diagramas" },
      desc: {
        tr: "İbn Arabî'nin kendi elinden çıkan şemaların bir araya toplandığı bölüm.",
        en: "A section gathering the diagrams Ibn Arabi himself drew.",
        pt: "Uma seção que reúne os diagramas que o próprio Ibn Arabi desenhou.",
      },
    },
    sirlar: {
      title: { tr: "Sırlar", en: "Mysteries", pt: "Mistérios" },
      desc: {
        tr: "İbn Arabî'nin işaret edip açıklamadığı yerlerin külliyat boyunca izini süren bir derleme.",
        en: "A compilation tracing, across the corpus, the places Ibn Arabi points to but leaves unexplained.",
        pt: "Uma coletânea que rastreia, por toda a obra, os lugares que Ibn Arabi aponta mas deixa sem explicação.",
      },
    },
    menziller: {
      title: { tr: "Menziller", en: "Mansions", pt: "Mansões" },
      desc: {
        tr: "Fütûhât'ın 198. Bölümü'ndeki yirmi sekiz faslı tek bir halkada toplayan harita: her menzilin harfi, ilahi ismi ve o menzilden zuhur eden mertebe.",
        en: "A map gathering the twenty-eight sections of Chapter 198 of the Futuhat into one ring: each mansion's letter, divine name, and the level that appears from it.",
        pt: "Um mapa que reúne as vinte e oito secções do Capítulo 198 das Futuhat num só anel: a letra de cada mansão, o nome divino e o grau que dela aparece.",
      },
    },
    tasiyicilar: {
      title: { tr: "Taşıyanlar", en: "The Bearers", pt: "Os Portadores" },
      desc: {
        tr: "Fütûhât'ın 13. ve 476. bölümlerini yan yana koyan bir şema: Arş'ı taşıyan dört esas ile kalbi taşıyan dört esas, iki iç içe sarmal olarak.",
        en: "A diagram placing Chapters 13 and 476 of the Futuhat side by side: the four supports that bear the Throne and the four that bear the heart, as two nested spirals.",
        pt: "Um diagrama que junta os Capítulos 13 e 476 das Futuhat: os quatro suportes que sustentam o Trono e os quatro que sustentam o coração, como duas espirais entrelaçadas.",
      },
    },
    bilmiyoruz: {
      title: { tr: "Bilmiyoruz", en: "We Don't Know", pt: "Não Sabemos" },
      desc: {
        tr: "Sitenin açıkça bilmediğini ya da tartışmalı olduğunu ilan ettiği maddeler — nüsha tarihinden yorum mirasına, eser tasnifinden modern benzetmelere.",
        en: "Items the site openly declares unknown or contested — from manuscript history to a reading's inheritance, from classification of works to modern analogies.",
        pt: "Itens que o site declara abertamente desconhecidos ou contestados — da história do manuscrito à herança de uma leitura, da classificação das obras às analogias modernas.",
      },
    },
    "elestiri-arkeolojisi": {
      title: { tr: "Eleştiri Arkeolojisi", en: "Archaeology of Criticism", pt: "Arqueologia da Crítica" },
      desc: {
        tr: "Dost'a yöneltilen eleştiri ve savunmaları cevaplamadan önce haritalıyoruz: kim, ne zaman, hangi şehirde, kimin himayesinde, neyi okuyarak yazdı.",
        en: "We map the criticisms and defenses aimed at Dost before answering them: who wrote what, when, in which city, under whose patronage, reading what.",
        pt: "Mapeamos as críticas e defesas dirigidas a Dost antes de lhes responder: quem escreveu o quê, quando, em que cidade, sob que patrocínio, lendo o quê.",
      },
    },
    hocalar: {
      title: { tr: "Hocalar", en: "Teachers", pt: "Mestres" },
      desc: {
        tr: "Rûhu'l-kuds'ta andığı 55 hocadan son ikisi, ikisi de kadın — kendi ağzından iki portre.",
        en: "The last two of the 55 teachers named in the Ruh al-quds, both women — two portraits in his own words.",
        pt: "Os dois últimos dos 55 mestres nomeados no Ruh al-quds, ambas mulheres — dois retratos nas suas próprias palavras.",
      },
    },
    "eser-agi": {
      title: { tr: "Eser Ağı", en: "The Works Timeline", pt: "A Linha do Tempo das Obras" },
      desc: {
        tr: "Eserlerinin kronolojik zaman çizelgesi — en erken eser üstte, aşağıya doğru zaman; kenarlar aynı şehirde art arda yazılan eserleri bağlıyor.",
        en: "A chronological timeline of his works — the earliest at the top, time moving downward; connections link works written in the same city back to back.",
        pt: "Uma linha do tempo cronológica das suas obras — a mais antiga no topo, o tempo avançando para baixo; as ligações unem obras escritas na mesma cidade em sequência.",
      },
    },
    "seyahat-atlasi": {
      title: { tr: "Seyahat Atlası", en: "Travel Atlas", pt: "Atlas de Viagem" },
      desc: {
        tr: "Mürsiye'den Şam'a, her durakta yazdığı eserlerle birlikte.",
        en: "From Murcia to Damascus, together with the works he wrote at each stop.",
        pt: "De Múrcia a Damasco, juntamente com as obras que escreveu em cada paragem.",
      },
    },
    yolculuk: {
      title: { tr: "Yolculuk", en: "The Journey", pt: "A Jornada" },
      desc: {
        tr: "Eser Ağı ve Seyahat Atlası'nın birleşik atlas görünümü — her durak coğrafi konumunda, her eser o durakta yazıldığı için durağın yakınında.",
        en: "The combined atlas view of the Works Timeline and the Travel Atlas — each stop at its geographic position, each work next to the stop where it was written.",
        pt: "A vista atlas combinada da Linha do Tempo das Obras e do Atlas de Viagem — cada paragem na sua posição geográfica, cada obra ao lado da paragem onde foi escrita.",
      },
    },
    "kuran-dokusu": {
      title: { tr: "Kur'ân Dokusu", en: "The Qur'ânic Weave", pt: "A Trama Alcorânica" },
      desc: {
        tr: "Fütûhât ve Füsûs özetlerimizde işaretlediğimiz âyet atıflarının sûre↔bap grafı — kısmi bir iz, tam bir tarama değil.",
        en: "A sûrah↔chapter graph of the verse citations we've marked in our Futûhât and Fusûs summaries — a partial trace, not a full scan.",
        pt: "Um grafo surata↔capítulo das citações de versículos que marcámos nos nossos resumos das Futûhât e Fusûs — um traço parcial, não uma varredura completa.",
      },
    },
    sorular: {
      title: { tr: "Sorular", en: "Questions", pt: "Perguntas" },
      desc: {
        tr: "İbn Arabî'yi okurken biriken, henüz kapanmamış soruların toplandığı bölüm.",
        en: "A section gathering the still-open questions that accumulate while reading Ibn Arabi.",
        pt: "Uma seção que reúne as perguntas ainda em aberto que se acumulam ao ler Ibn Arabi.",
      },
    },
    futuhat: {
      title: { tr: "Fütûhât-ı Mekkiyye", en: "Futuhat al-Makkiyya", pt: "Futuhat al-Makkiyya" },
      desc: {
        tr: "Fütûhât-ı Mekkiyye'nin cilt cilt, kısım kısım okunup özetlendiği bölüm.",
        en: "A section reading and summarising Futuhat al-Makkiyya volume by volume, part by part.",
        pt: "Uma seção que lê e resume o Futuhat al-Makkiyya volume a volume, parte a parte.",
      },
    },
    fusus: {
      title: { tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" },
      desc: {
        tr: "İbn Arabî'nin Füsûsu'l-Hikem'ini (Ahmed Avni Konuk şerhi) fass fass okuma denemesi; her fassın kendi sarmal şemalarıyla.",
        en: "An attempt to read Ibn Arabi's Fusus al-Hikam (with Ahmed Avni Konuk's commentary) bezel by bezel, each with its own spiral diagrams.",
        pt: "Uma tentativa de ler os Fusus al-Hikam de Ibn Arabi (com o comentário de Ahmed Avni Konuk) engaste a engaste, cada um com os seus próprios esquemas em espiral.",
      },
    },
    miskat: {
      title: { tr: "Mişkâtü'l-Envâr", en: "Mishkat al-Anwar", pt: "Mishkat al-Anwar" },
      desc: {
        tr: "İbn Arabî'nin kendi seçip bir araya getirdiği 101 hadîs-i kudsînin, hadis hadis okunduğu bölüm.",
        en: "A section reading, hadith by hadith, the 101 hadith qudsi that Ibn Arabi himself selected and gathered.",
        pt: "Uma seção que lê, hadith a hadith, os 101 hadith qudsi que o próprio Ibn Arabi selecionou e reuniu.",
      },
    },
    hakkinda: {
      title: { tr: "Dost Arabî Hakkında", en: "About Dost Arabi", pt: "Sobre Dost Arabi" },
      desc: {
        tr: "Dost Arabî projesinin ve Muhyiddîn İbnü'l-Arabî'nin kısaca tanıtıldığı sayfa.",
        en: "A page briefly introducing the Dost Arabi project and Muhyiddin Ibn Arabi.",
        pt: "Uma página que apresenta brevemente o projeto Dost Arabi e Muhyiddin Ibn Arabi.",
      },
    },
    kavram: {
      title: { tr: "Kavramlar", en: "Concepts", pt: "Conceitos" },
      desc: {
        tr: "Her kavramın Fütûhât ve Füsûs boyunca izini süren, veriden türetilmiş bir hayat özeti.",
        en: "A data-derived life summary tracing each concept through the Futuhat and the Fusus.",
        pt: "Um resumo de vida derivado de dados que traça cada conceito através do Futuhat e do Fusus.",
      },
    },
    ayethadis: {
      title: { tr: "Âyet & Hadis İndeksi", en: "Verse & Hadith Index", pt: "Índice de Versículos e Hadith" },
      desc: {
        tr: "Sitede alıntılanan âyet ve hadislerin, en çok tekrarladıkları yerden başlayarak sıralandığı bir dizin.",
        en: "An index of the verses and hadiths quoted across the site, ordered by how often each recurs.",
        pt: "Um índice dos versículos e hadiths citados no site, ordenados por quantas vezes cada um recorre.",
      },
    },
  };

  // Ev sayfası (view === "ontoloji") kendi SEO/paylaşım başlığını
  // VIEW_META.ontoloji.title'dan almaz -- o kısa bir SEKME etiketi
  // ("Ontoloji"/"Ontology"/"Ontologia", nav çiplerinde kullanılır), ev
  // sayfasının kendisi değil. Önceden document.title bu ayrımı yalnız
  // TÜRKÇE için yapıyordu (satır aşağıda sabit bir TR dizesiydi) -- EN/PT
  // kullanıcıda bile view "ontoloji"ye dönünce başlık sessizce Türkçeye
  // dönüyordu (tespit, 2026-09-14). manifest.json'daki tam adla aynı,
  // üç dilde.
  const HOME_TITLE = {
    tr: "Muhyiddîn İbnü'l-Arabî'nin Varlık Haritası",
    en: "Ibn Arabi's Map of Being",
    pt: "O Mapa do Ser de Ibn Arabi",
  };

  // Meta artık tek kapıdan (graph-utils.js DostMeta): canonical/og:url
  // statik rotanın (build-static-routes.py) yazdığıyla birebir aynı --
  // kayıt sayfası kendi adresini, dil kopyası kendi önekini, sondaki "/"
  // dahil. Kayıtta (id varsa) başlık "zayıf" yazılır: görünüm modülü
  // (Fütûhât kısmı gibi) kayda özel başlığı yazdıysa ezilmez.
  // Hakkında'nın kendi statik rotası olan iki alt sekmesi -- başlık ve
  // açıklama build-static-routes.py'deki set_meta() çağrılarıyla aynı (TR).
  const HAKKINDA_ALT_META = {
    "okuma-yollari": {
      title: { tr: "Okuma Yolları", en: "Reading Paths", pt: "Caminhos de Leitura" },
      desc: {
        tr: "Konu konu, kaynak kartlarına bağlı okuma yolları: nereden başlamalı, hangi sırayla.",
        en: "Topic-by-topic reading paths tied to source cards: where to start, in what order.",
        pt: "Caminhos de leitura por tema, ligados aos cartões de fontes: por onde começar, em que ordem.",
      },
    },
    "nereden-baslamali": {
      title: { tr: "Nereden Başlamalı", en: "Where to Begin", pt: "Por Onde Começar" },
      desc: {
        tr: "Sitenin kendi haritası: birkaç duraklı yollar. Hangi kapıdan girilirse ne görülür.",
        en: "The site's own map: paths of a few stops. Which door leads to what.",
        pt: "O mapa do próprio site: caminhos de poucas paragens. Que porta leva a quê.",
      },
    },
  };

  function updateMeta(view, id) {
    const meta = (view === "hakkinda" && id && HAKKINDA_ALT_META[id]) || VIEW_META[view];
    if (!meta) return;
    const r = window.DostMeta.route(view, id);
    window.DostMeta.set({
      fullTitle: "Dost Arabî — " + I18n.pick3(view === "ontoloji" ? HOME_TITLE : meta.title),
      description: I18n.pick3(meta.desc),
      canonical: r.canonical,
      alternates: r.alternates,
      weak: !!id,
    });
  }

  let currentRoute = { view: "ontoloji", id: undefined };

  // Adres biçimi (2026-10-09): dil öneki korunur (/en/esma/), sondaki "/"
  // statik rotalarla aynı; ev görünümü kökün kendisi (/ ya da /en/).
  function routePath(view, id) {
    const onek = ROUTE_BASE + window.DostMeta.langPrefix();
    if (view === "ontoloji" && !id) return onek + "/";
    return onek + "/" + view + "/" + (id ? id + "/" : "");
  }

  // Geçmiş (2026-10-09, dalga-web; ETKILESIM_DILI.md "Geri tuşu"): yol
  // değişiyorsa pushState, aynı yolda yalnız meta güncellenir. İstisna
  // OTOMATİK yol değişimleri: kullanıcı bir şeye dokunmadan gelen yol
  // düzeltmeleri (sayfa açılışı, geri/ileri tuşunun çözümü, bir görünüme
  // girer girmez modülün kendiliğinden seçtiği kayıt) replaceState olur --
  // yoksa geri tuşu kullanıcının hiç seçmediği ara adımlara takılırdı.
  // "Otomatik" = son kullanıcı girdisinden (pointerdown/keydown) beri
  // bir sayfa açılışı / popstate / görünüm düzeyinde push olmuşsa.
  let navOtomatik = true;
  ["pointerdown", "keydown"].forEach((t) =>
    document.addEventListener(t, () => { navOtomatik = false; }, true));

  function updateHash(view, id) {
    if (view === "acik-sorular") { view = "ontoloji"; id = undefined; }
    const path = routePath(view, id);
    if (location.pathname !== path) {
      const replace = navOtomatik;
      try {
        if (replace) history.replaceState(null, "", path);
        else history.pushState(null, "", path);
      } catch (e) { /* eski tarayıcı */ }
      if (!replace && !id) navOtomatik = true;
    }
    currentRoute = { view, id };
    updateMeta(view, id);
    if (id) pushBreadcrumb(view, id);
  }

  let breadcrumbTrail = [];

  function pushBreadcrumb(view, id) {
    requestAnimationFrame(() => {
      const titleEl = detailContent.querySelector(".detail-title");
      let label = "";
      if (titleEl) {
        const clone = titleEl.cloneNode(true);
        clone.querySelectorAll(".pole-badge").forEach((b) => b.remove());
        label = clone.textContent.trim();
      }
      if (!label) return;
      const last = breadcrumbTrail[breadcrumbTrail.length - 1];
      if (last && last.view === view && last.id === id) {
        last.label = label;
        renderBreadcrumb();
        return;
      }
      if (!last || last.view !== view) breadcrumbTrail = [];
      breadcrumbTrail.push({ view, id, label });
      if (breadcrumbTrail.length > 4) breadcrumbTrail.shift();
      renderBreadcrumb();
    });
  }

  function renderBreadcrumb() {
    if (!breadcrumbEl) return;
    if (breadcrumbTrail.length < 2) {
      breadcrumbEl.hidden = true;
      breadcrumbEl.innerHTML = "";
      return;
    }
    breadcrumbEl.hidden = false;
    breadcrumbEl.innerHTML = breadcrumbTrail
      .map((c, i) => {
        if (i === breadcrumbTrail.length - 1) {
          return `<span class="detail-breadcrumb__item detail-breadcrumb__item--current">${c.label}</span>`;
        }
        return `<button type="button" class="detail-breadcrumb__item" data-view="${c.view}" data-id="${c.id}">${c.label}</button>`;
      })
      .join('<span class="detail-breadcrumb__sep">›</span>');
    breadcrumbEl.querySelectorAll("button.detail-breadcrumb__item").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.view;
        const id = btn.dataset.id;
        const idx = breadcrumbTrail.findIndex((c) => c.view === view && c.id === id);
        if (idx !== -1) breadcrumbTrail = breadcrumbTrail.slice(0, idx + 1);
        window.__dostNav.goTo(view, id);
      });
    });
  }

  function goToOntologyNode(id) {
    setMainView("ontology");
    if (!ontolojiKuruldu) { bekleyenOntolojiId = id || null; return; }
    const d = id && nodeById && nodeById.get(id);
    if (d) onNodeClick(d);
    // Kayıtsız giriş hâli (geri tuşuyla köke dönmek gibi): seçim katmanı
    // eski düğümde asılı kalmasın.
    else if (nodeSel) nodeSel.classed("node--active", false);
  }

  function goToEsma(id) {
    setMainView("esma");
    if (id) window.__esmaApp && window.__esmaApp.goToNode(id);
  }

  function goToHal(id) {
    setMainView("hal");
    if (id) window.__halApp && window.__halApp.goToNode(id);
  }

  function goToTerimler(id) {
    setMainView("terimler");
    window.__terimlerApp && window.__terimlerApp.goToNode(id);
  }

  function goToCizimler() {
    setMainView("cizimler");
    window.__cizimlerApp && window.__cizimlerApp.activate();
  }

  function goToSirlar(id) {
    setMainView("sirlar");
    currentDetailNode = null;
    currentDetailEdge = null;
    if (!sirlarData) {
      // Veri artık talep üzerine geliyor; istenen kaydı bekletip veri
      // gelince açıyoruz (eskiden veri açılışta indiği için burada
      // yalnızca beklemek yetiyordu).
      pendingSirlarId = id || null;
      ensureSirlarData().then((d) => {
        if (!d || currentMainView !== "sirlar") return;
        const bekleyen = pendingSirlarId;
        pendingSirlarId = null;
        // 2026-08-06 kullanıcı bulgusu: id yoksa (yalnız nav'dan açılış)
        // showSirlarOverview() paneli otomatik açıyordu -- artık yalnız
        // bir kayıt seçildiğinde açılıyor (bkz. hocalar.js'teki aynı
        // düzeltme).
        if (bekleyen) showSirlarEntry(bekleyen);
      });
      return;
    }
    pendingSirlarId = null;
    if (!id) return;
    showSirlarEntry(id);
  }

  function goToMenziller(id) {
    setMainView("menziller");
    currentDetailNode = null;
    currentDetailEdge = null;
    window.__menzillerApp && window.__menzillerApp.goToNode(id);
  }

  function goToSorular(id) {
    setMainView("sorular");
    window.__sorularApp && window.__sorularApp.goToNode(id);
  }

  // Açık Sorular 2026-10-07'de yayından kaldırıldı (içeriği bizim
  // sorularımızdı -- CLAUDE.md "YALNIZ okumaların özeti"). Eski bağlantılar
  // kırılmasın diye /acik-sorular ana sayfaya düşüyor.
  function goToAcikSorular() {
    setMainView("ontology");
    try { history.replaceState(null, "", routePath("ontoloji")); } catch (e) { /* eski tarayıcı */ }
  }

  function goToBilmiyoruz(id) {
    setMainView("bilmiyoruz");
    if (id) window.__bilmiyoruzApp && window.__bilmiyoruzApp.goToNode(id);
  }

  function goToElestiriArkeolojisi(id) {
    setMainView("elestiriArkeolojisi");
    if (id) window.__elestiriArkeolojisiApp && window.__elestiriArkeolojisiApp.goToNode(id);
  }

  function goToHocalar(id) {
    setMainView("hocalar");
    if (id) window.__hocalarApp && window.__hocalarApp.goToNode(id);
  }

  function goToEserAgi(id) {
    setMainView("eserAgi");
    if (id) window.__eserAgiApp && window.__eserAgiApp.goToNode(id);
  }

  function goToSeyahatAtlasi(id) {
    setMainView("seyahatAtlasi");
    if (id) window.__seyahatAtlasiApp && window.__seyahatAtlasiApp.goToNode(id);
  }

  function goToYolculuk(id) {
    setMainView("yolculuk");
    if (id) window.__yolculukApp && window.__yolculukApp.goToNode(id);
  }

  function goToKuranDokusu(id) {
    setMainView("kuranDokusu");
    if (id) window.__kuranDokusuApp && window.__kuranDokusuApp.goToNode(id);
  }

  // Taşıyanlar tek bir şemadan ibaret; derin bağlantı için ayrı bir id'si
  // yok, o yüzden setMainView zaten sahneyi kuruyorsa ikinci kez
  // activate() çağırmaya gerek yok -- ama başka bir görünümden gelindiğinde
  // (setMainView erken dönerse) sahne kurulmamış olabiliyor.
  function goToTasiyicilar() {
    setMainView("tasiyicilar");
    window.__tasiyicilarApp && window.__tasiyicilarApp.activate();
  }

  function goToFutuhat(id) {
    setMainView("futuhat");
    // 2026-08 kod taraması: id yokken burada da activate() çağırmak,
    // setMainView'in kendi iç dalının (view değişince tetiklenen)
    // activate()'iyle art arda iki kez çalışıyordu -- ikinci çağrı,
    // BİRİNCİ çağrının render()->activatePart() içinde henüz yazdığı
    // "kaldığın yer" localStorage değerini geri okuyup ilk kez gelen bir
    // okuyucuyu yanlışlıkla "zaten bir yeri var" sanıyordu (bkz.
    // isDefaultLanding / futuhat-start-hint). Kavram'daki gibi yalnız id
    // doluyken tekrar çağırıyoruz.
    if (id) window.__futuhatApp && window.__futuhatApp.activate(id);
  }

  function goToFusus(id) {
    setMainView("fusus");
    if (id) window.__fususApp && window.__fususApp.activate(id);
  }

  function goToMiskat(id) {
    setMainView("miskat");
    if (id) window.__miskatApp && window.__miskatApp.activate(id);
  }

  function goToHakkinda(sub) {
    setMainView("hakkinda");
    // "hakkinda"nın kendi id'si yok (view içi üç alt-sekme var); goTo'nun
    // ikinci argümanı köprü bağlantılarının (2026-08-06, vahdet-elestiri
    // köprüsü) hangi alt-sekmeye açılacağını taşıması için kullanılıyor.
    if (sub) window.__siirlerApp && window.__siirlerApp.switchTo(sub);
    // Alt sekme de başından açılır: görünüm aynı (hakkinda) kaldığı için
    // setMainView'in kaydırması burada çalışmıyordu (2026-10-10, mobil
    // senaryo: çekmeceden Eleştiriler'e geçince sayfa 188 px aşağıda açılıyordu).
    if (sub && window.scrollY > 0) window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goToKavram(id) {
    setMainView("kavram");
    if (id) window.__kavramApp && window.__kavramApp.goToNode(id);
  }

  function goToAyetHadis() {
    setMainView("ayethadis");
  }

  // Rota adı -> görünümün sarmalayıcısı (geri tuşu aynı görünümün giriş
  // hâline dönerken o görünümün kendi "bir adım geri" zinciri için).
  function wrapIdFor(view) {
    if (view === "ontoloji") return "ontology-wrap";
    return view + "-wrap";
  }

  // fromPop: geri/ileri tuşu. Aynı görünümde kalınıp kayıt adresten
  // düşmüşse (/esma/cemil/ -> /esma/) açık panel/seçim görünümün KENDİ
  // geri adımıyla kapatılır.
  function parseHashAndGo(fromPop) {
    let rawPath = location.pathname.slice(ROUTE_BASE.length) || "/";
    // SEO-03/04 (uzman paneli denetimi 2026-08-17): /en/ ve /pt/ önekli
    // statik kopyalar aynı uygulamayı taşıyor -- yönlendirici dil önekini
    // soyup rotayı aynen çözer (dili i18n.js, <html data-dost-lang>
    // üzerinden okuyor). Sonraki gezinmeler öneksiz (TR-kanonik) URL'lere
    // gider; dil, kullanıcı seçimi olarak zaten yanında taşınır.
    rawPath = rawPath.replace(/^\/(en|pt)(?=\/|$)/, "") || "/";
    // Kök (/ ya da /en/) ev görünümüdür: geri tuşuyla başka bir görünümden
    // köke dönülünce ontoloji açılmalı (eskiden yalnız "yok sayılıyordu").
    if (rawPath === "/" || rawPath === "/index.html") rawPath = "/ontoloji";
    const m = /^\/(ontoloji|esma|sirlar|hal|terimler|cizimler|sorular|acik-sorular|bilmiyoruz|elestiri-arkeolojisi|hocalar|eser-agi|seyahat-atlasi|yolculuk|kuran-dokusu|menziller|tasiyicilar|futuhat|fusus|miskat|hakkinda|kavram|ayethadis)(\/.*)?$/.exec(rawPath);
    if (!m) {
      // Tanınmayan bir yol (/blabla) sessizce ana haritaya düşüyordu ama
      // bozuk adres çubukta kalıyordu (2026-10-08 taraması) -- köke çekilir.
      if (rawPath !== "/" && rawPath !== "/index.html") {
        try { history.replaceState(null, "", ROUTE_BASE + "/"); } catch (e) { /* eski tarayıcı */ }
      }
      return;
    }
    const [, view, restRaw] = m;
    // id kısmı bir sonraki segment'e kadar bağıl-slaş içerebilir (örn.
    // "edge/nodeA-nodeB"), üstelik gerçek statik dosyalar (futuhat/c1k5/
    // index.html gibi) "/futuhat/c1k5/" biçiminde sondaki "/" ile de
    // istenebiliyor, hatta id'siz bir görünüm de ("/esma/") aynı şekilde
    // sondaki slaş'la gelebiliyor -- baştaki/sondaki slaş'ları ayıklayıp
    // geriye boş kalırsa id'yi undefined yap.
    let id = restRaw ? (restRaw.replace(/^\//, "").replace(/\/$/, "") || undefined) : undefined;
    // XSS-01/02 (uzman paneli denetimi, 2026-08-17): id buradan yaklaşık
    // kırk ayrı görünümün "data-id"/"data-view" içeren şablon dizesine
    // (escape'lenmeden) akıyor. Normalde bu veri dosyalarından (güvenilir)
    // geliyor, ama BURADAKİ id tarayıcı adres çubuğundan geliyor --
    // 404.html'in ?p= yeniden yazması + history.replaceState ile
    // saldırganın kurduğu bir bağlantı, gerçek bir veri kaydına hiç
    // uğramadan buraya rastgele metin taşıyabilir. Güven sınırı burası:
    // sitedeki gerçek id'lerin hepsi bu kalıba uyuyor (harf/rakam/tire/alt
    // çizgi, "edge/nodeA-nodeB" gibi tek düzey iç eğik çizgiyle) --
    // uymayan her şey (tırnak, açı ayracı, & vb. taşıyan) id'siz görünüm
    // durumuna düşürülüyor, hiçbir render fonksiyonuna ulaşmıyor.
    if (id && !/^[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)?$/.test(id)) id = undefined;
    const oncekiGorunum = currentRoute.view;
    currentRoute = { view, id };
    updateMeta(view, id);
    if (fromPop && !id && view === oncekiGorunum) {
      window.DostGraphUtils.stepBackView(wrapIdFor(view));
      if (view === "hakkinda" && window.__siirlerApp) window.__siirlerApp.switchTo("hakkinda");
      detailPanel.hidden = true;
    }
    if (view === "ontoloji") goToOntologyNode(id);
    else if (view === "esma") goToEsma(id);
    else if (view === "sirlar") goToSirlar(id);
    else if (view === "hal") goToHal(id);
    else if (view === "terimler") goToTerimler(id);
    else if (view === "cizimler") goToCizimler();
    else if (view === "sorular") goToSorular(id);
    else if (view === "acik-sorular") goToAcikSorular(id);
    else if (view === "bilmiyoruz") goToBilmiyoruz(id);
    else if (view === "elestiri-arkeolojisi") goToElestiriArkeolojisi(id);
    else if (view === "hocalar") goToHocalar(id);
    else if (view === "eser-agi") goToEserAgi(id);
    else if (view === "seyahat-atlasi") goToSeyahatAtlasi(id);
    else if (view === "yolculuk") goToYolculuk(id);
    else if (view === "kuran-dokusu") goToKuranDokusu(id);
    else if (view === "menziller") goToMenziller(id);
    else if (view === "tasiyicilar") goToTasiyicilar();
    else if (view === "futuhat") goToFutuhat(id);
    else if (view === "fusus") goToFusus(id);
    else if (view === "miskat") goToMiskat(id);
    else if (view === "hakkinda") goToHakkinda(id);
    else if (view === "kavram") goToKavram(id);
    else if (view === "ayethadis") goToAyetHadis();
  }

  window.addEventListener("popstate", () => {
    navOtomatik = true;
    parseHashAndGo(true);
  });

  // Site içi tüm gezinme #/view yerine gerçek /view yollarını kullanıyor
  // (bkz. 404.html) — bu yüzden linkify()'ın ürettiği <a class="cross-link">
  // etiketleri artık gerçek path'lere işaret ediyor. Tıklama tam sayfa
  // yenilemesi tetiklemesin diye burada yakalayıp SPA içi yönlendirmeye
  // çeviriyoruz; yeni sekmede aç / orta tık gibi tarayıcı varsayılanlarını
  // bozmamak için değiştirici tuş basılıysa dokunmuyoruz.
  // Seçici bilerek "a.cross-link" DEĞİL "a[data-view]": Sırlar↔Sorular
  // köprüsü gibi kart tarzı linkler (.sorular-sir) .cross-link'in kendi
  // stilini (noktalı alt çizgi/renk) İSTEMİYOR ama SPA yönlendirmesine
  // aynı şekilde ihtiyaç duyuyor -- yalnız .cross-link'e bakmak bu ikisini
  // birbirine bağlıyordu, sınıf eksikse tıklama sessizce tam sayfa
  // yenilemesine düşüyordu (2026-08-07 UI denetimi, 33 bağın tamamı).
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const a = event.target.closest("a[data-view]");
    if (!a) return;
    const view = a.dataset.view;
    if (!view) return;
    event.preventDefault();
    window.__dostNav.goTo(view, a.dataset.id || undefined);
  });

  window.__dostNav = {
    goTo(view, id) {
      // Önce adres (push), sonra görünüm -- bkz. updateHash.
      updateHash(view, id);
      if (view === "ontoloji") goToOntologyNode(id);
      else if (view === "esma") goToEsma(id);
      else if (view === "sirlar") goToSirlar(id);
      else if (view === "hal") goToHal(id);
      else if (view === "terimler") goToTerimler(id);
      else if (view === "cizimler") goToCizimler();
      else if (view === "sorular") goToSorular(id);
    else if (view === "acik-sorular") goToAcikSorular(id);
      else if (view === "bilmiyoruz") goToBilmiyoruz(id);
      else if (view === "elestiri-arkeolojisi") goToElestiriArkeolojisi(id);
      else if (view === "hocalar") goToHocalar(id);
      else if (view === "eser-agi") goToEserAgi(id);
      else if (view === "seyahat-atlasi") goToSeyahatAtlasi(id);
    else if (view === "yolculuk") goToYolculuk(id);
      else if (view === "kuran-dokusu") goToKuranDokusu(id);
      else if (view === "menziller") goToMenziller(id);
      else if (view === "tasiyicilar") goToTasiyicilar();
      else if (view === "futuhat") goToFutuhat(id);
      else if (view === "fusus") goToFusus(id);
      else if (view === "miskat") goToMiskat(id);
      else if (view === "hakkinda") goToHakkinda(id);
      else if (view === "kavram") goToKavram(id);
      else if (view === "ayethadis") goToAyetHadis();
    },
    setHash: updateHash,
    // Modüller kendi <a class="cross-link"> etiketlerini kurarken gerçek
    // bir href'e ihtiyaç duyuyor (yeni sekmede aç / bağlantıyı kopyala
    // çalışsın diye); ROUTE_BASE burada olduğu için helper da burada.
    // Dil öneki ve sondaki "/" adres çubuğuyla aynı (routePath).
    href(view, id) {
      return routePath(view, id);
    },
  };
  navHrefleriniGuncelle();

  let simulation, nodeSel, pathSel, hitSel, labelSel, nodeById;
  // buildGraph çember/sarmal geometrisini bilen kenar yolunu buraya koyar.
  let kenarYoluFn = null;
  // FAZ 1 (grafik-önce, 2026-08-03): buildGraph doğuş animasyonunu bu
  // değişkene bırakır; loadOntologyData rota çözüldükten sonra (yalnız
  // gerçekten ontoloji ana ekranındaysak) çağırır. Bkz. runBirth.
  let birthFn = null;

  function buildGraph(data) {
    // Dar ekranda (mobil-liste kipi, bkz. ontoloji-mobil-liste.js) SVG
    // "haritayı aç" düğmesine kadar CSS ile gizli -- clientWidth/Height 0
    // döner. buildGraph yine de sayfa yüklenirken koşulsuz çağrıldığı için
    // (bkz. loadOntologyData) TÜM düğümler n.x=n.y=0'a çöküyordu; aynı
    // noktadan başlayan forceCollide/forceManyBody sıfır-vektörü
    // normalize etmeye çalışıp NaN üretiyor, bu da her karede konsola
    // "translate(NaN,NaN) scale(NaN)" olarak taşıyordu (kod taraması,
    // 2026-08-27). panToNode() zaten aynı 0 durumuna karşı || 800/600
    // yedeğini kullanıyor (bkz. altta) -- burada da aynı yedek.
    const width = svg.node().clientWidth || 800;
    const height = svg.node().clientHeight || 600;

    // --- 3B durumu (Hâller/Menziller ile aynı model) ---
    // pitch 0.26: Menziller'de yerleşen değer. Sarmalın okunur (monoton)
    // olması için gereken eşik dropH > 2π·tan(pitch)·r ≈ 1.67·r; aşağıda
    // 2.2·r veriyoruz, rahat payla geçiyor. FOCAL uzun tutuldu: dokuz
    // düğüm tek bir tura yayıldığı için güçlü perspektif etiketleri
    // birbirine bindiriyordu.
    const FOCAL3D = 2600;
    const TILT_DUR_3D = 1050;
    // Halkanın merkezi ve yarıçapı tek yerde: hem 2B düzen (CEMBER_ACI),
    // hem çizilen çember ve yaylar, hem 3B sahnenin dönme/salınım merkezi
    // buradan okur. Yarıçap dikeyle sınırlanır (manzara oranındaki tuvalde yükseklik
    // dar kenardır); yanlarda kalan boşluk dalların ve uzun etiketlerin yeri.
    const ringCx = width / 2, ringCy = height / 2;
    const ringR = Math.max(90, Math.min(height * 0.40, width * 0.27));
    const cx3d = ringCx, cy3d = ringCy;
    // Sarmalın iki ölçüsü ayrı sınırlardan okur (2026-08-28). Eskiden ikisi
    // de tek sayıdan türüyordu -- `min(width, height)/2 - 110`, yani manzara
    // oranındaki bir tuvalde HEP yükseklikten; sonra `dropH = ringR3d * 2.2`
    // o dar sayıyı 2.2 ile çarpıyordu. Sonuç ölçüldü: sahne tuvalin yatayda
    // yalnız %33'ünü kaplıyor, dikeyde ise çerçeveden TAŞIYORDU (Kalp ve
    // "Allah Katında Bilinen" alt kenarda kırpılıyordu). Yani sarmal, boş
    // duran yanlara değil, zaten dolu olan dikeye büyüyordu.
    //
    // Artık halkanın yarıçapı genişlikten, inişin boyu yükseklikten okuyor:
    // sarmal enine açılıp boyuna sığıyor. Alt sınırlar dar/mobil ekran için.
    // Sayılar tarayıcıda taranarak seçildi (36 birleşim, 1440x900). Ölçülen
    // gerilim şu: sarmalın boyu uzadıkça katmanlar dikeyde ayrışıyor ve
    // etiketler kendi düğümlerinin altında kalabiliyor, ama sahne
    // daralıyor; kısaldıkça sahne genişliyor ama etiketler birbirini itip
    // düğümlerinden uzaklaşıyor. Taramanın dirseği (etiket ortancası hâlâ
    // ~29 px iken en geniş sahne) burası:
    //   dh 0.44 -> tuvalin %75'i, etiket ortancası 62 px
    //   dh 0.54 -> %64, 29 px      <- seçilen
    //   dh 0.60 -> %59, 27 px
    // Etiketin düğümünün altında durması, tuvali doldurmaktan önce geliyor.
    const ringR3d = Math.max(120, Math.min(width * 0.40, height * 0.95));
    const dropH = Math.max(240, height * 0.54);
    let tilt = 0, tiltTarget = 0, tiltFrom = 0, tiltAnimStart = 0;
    // Sahnenin yavaş salınımı (bkz. aşağıdaki spinFrame/SWAY_DEG) burada da
    // biliniyor olmalı: yerleşim hep salınımın ortasında (0°) hesaplanırsa,
    // ucunda sınırdaki etiket çiftleri yeniden çakışıyordu (2026-08-06
    // ölçüldü). cx3d/cy3d, spinFrame'in döndürdüğü aynı merkez (0.5·width,
    // 0.52·height) -- iki ayrı sabit tutmaya gerek yok.
    let swayRad = 0;
    function swayRotate(x, y) {
      if (!swayRad) return { x, y };
      const dx = x - cx3d, dy = y - cy3d;
      const c = Math.cos(swayRad), sn = Math.sin(swayRad);
      return { x: cx3d + dx * c - dy * sn, y: cy3d + dx * sn + dy * c };
    }
    // pitch 0.26: halkayı neredeyse kenardan görüyoruz. 2026-08-28'de daha
    // açık açılar denendi -- 0.42 ve 0.58'de halka gerçekten halka gibi
    // okunuyor ama Zât tepeden ayrılıp yığının içine giriyor, iniş de
    // yukarıdan aşağıya okunmaz oluyordu (Zât'ın etiketi bir düğümün
    // üstüne, Kalp'inki İnsan-ı Kâmil'inkine biniyordu). Bu görünümün ilk
    // söylediği şey "Zât'tan iniş"; halkanın açıklığı ondan sonra gelir.
    let yaw = 0, pitch = 0.26, rotating = false;
    // spinFrame()'in 3B yaw-döngü kolunun kendi tazeleme eşiği için --
    // bkz. spinFrame içindeki kullanım ve aynı kusurun ölçüldüğü not.
    let yawPainted = 0;

    const defs = svg.append("defs");

    const nodes = data.nodes.map((n) => Object.assign({}, n));
    nodeById = new Map(nodes.map((n) => [n.id, n]));

    const links = data.edges.map((e) => Object.assign({}, e));

    // GORSEL-01 (uzman paneli denetimi 2026-08-17): kenar uçlarındaki üçgen
    // ok başları (marker-end) görsel gramerin "soyut ok kullanma" yasağını
    // en görünür grafikte çiğniyordu. Yön artık kenar başına bir ışık-yolu
    // gradyanıyla okunuyor (terimler.js isikCizgisi deseninin D3 karşılığı):
    //   - descent/gather: kaynakta soluk, hedefe yaklaştıkça beliren ışık
    //     (zuhûr); renk kenarın alışılmış sakin tonu (--text-muted, 2026-08-06
    //     kullanıcı kararı: "göze batmayan soluk renkler" korunuyor).
    //   - return: hedefe yaklaştıkça SÖNEN altın ışık ("iade, kaynağına
    //     dönerken sönen bir ışıktır") -- lejanttaki rücû rengi
    //     (--series-theme) ilk kez çizginin kendisiyle eşleşiyor.
    //   - paradox: iki uçta soluk, ortada parlak (terimler.js'in "mutual"
    //     kalıbı) -- tenzîh-teşbîh tek yönlü bir akış değil, iki ucu birden
    //     tutan bir gerilim; lejant rengi --series-daphne yine ilk kez
    //     çizgiye taşınıyor.
    // stop-color style= içinde: yalnız öyle yazılınca CSS değişkeni
    // çözülüyor (bkz. terimler.js'teki ölçülmüş not). Uç koordinatları her
    // karede paintPositions() içinde tazelenir (sahne dönüyor/sallanıyor).
    const EDGE_STOPS = {
      descent: [["0%", "var(--text-muted)", "0.18"], ["100%", "var(--text-muted)", "0.95"]],
      gather: [["0%", "var(--text-muted)", "0.18"], ["100%", "var(--text-muted)", "0.95"]],
      return: [["0%", "var(--series-theme)", "0.95"], ["78%", "var(--series-theme)", "0.35"], ["100%", "var(--series-theme)", "0.06"]],
      paradox: [["0%", "var(--series-daphne)", "0.15"], ["50%", "var(--series-daphne)", "0.9"], ["100%", "var(--series-daphne)", "0.15"]],
    };
    links.forEach((d, i) => {
      d.__gradId = "onto-isik-" + i;
      const g = defs.append("linearGradient")
        .attr("id", d.__gradId)
        .attr("gradientUnits", "userSpaceOnUse");
      (EDGE_STOPS[d.kind] || EDGE_STOPS.descent).forEach(([off, renk, op]) => {
        g.append("stop").attr("offset", off)
          .attr("style", `stop-color:${renk};stop-opacity:${op}`);
      });
    });

    // Çember yerleşimi (bkz. OMURGA/CEMBER_ACI'nin üstündeki not). Her
    // düğüm: __aci (radyan), __k (yarıçap çarpanı; omurga 1), __sira (doğuş
    // sırası: çemberin çevresinde Zât'tan saat yönünde), __pus (atmosferik
    // puslanma 0..1 -- çemberde aşağı indikçe artar: uzaklık = kesret).
    const omurgaSet = new Set(OMURGA);
    const komsuSayisi = new Map();
    links.forEach((l) => {
      [[l.source, l.target], [l.target, l.source]].forEach(([a, b]) => {
        if (!komsuSayisi.has(a)) komsuSayisi.set(a, new Map());
        const m = komsuSayisi.get(a);
        m.set(b, (m.get(b) || 0) + 1);
      });
    });
    // Ebeveyn: (1) omurgadan bu düğüme İNEN kenarın kaynağı; (2) yoksa en
    // çok kenarı olduğu omurga düğümü; (3) o da yoksa omurgaya bağlı bir
    // komşu uydu (zincir). Kenar EKLENMİYOR -- yalnız nereye konacağı.
    function uyduEbeveyni(id, ugrak) {
      const inen = links.find((l) => l.target === id && omurgaSet.has(l.source) && l.kind === "descent");
      if (inen) return { ebeveyn: inen.source, adim: 0 };
      const m = komsuSayisi.get(id) || new Map();
      let enIyi = null, enCok = 0;
      m.forEach((sayi, kom) => {
        if (omurgaSet.has(kom) && sayi > enCok) { enIyi = kom; enCok = sayi; }
      });
      if (enIyi) return { ebeveyn: enIyi, adim: 0 };
      ugrak = ugrak || new Set([id]);
      for (const kom of m.keys()) {
        if (ugrak.has(kom)) continue;
        ugrak.add(kom);
        const ust = uyduEbeveyni(kom, ugrak);
        if (ust) return { ebeveyn: kom, adim: ust.adim + 1 };
      }
      return null;
    }
    const uyduBilgi = new Map();
    nodes.forEach((n) => { if (!omurgaSet.has(n.id)) uyduBilgi.set(n.id, uyduEbeveyni(n.id)); });
    // Aynı omurga düğümündeki ilk adım uyduları ebeveynin ışını etrafında
    // yelpaze gibi açılır (veri sırasıyla, saat yönünde).
    const ilkAdim = new Map();
    nodes.forEach((n) => {
      const b = uyduBilgi.get(n.id);
      if (!b || b.adim !== 0) return;
      if (!ilkAdim.has(b.ebeveyn)) ilkAdim.set(b.ebeveyn, []);
      ilkAdim.get(b.ebeveyn).push(n.id);
    });
    const derece = (d) => (d * Math.PI) / 180;
    const yer = new Map();   // id -> {aci (°), k, sira}
    OMURGA.forEach((id, i) => {
      if (CEMBER_ACI[id] != null) yer.set(id, { aci: CEMBER_ACI[id], k: 1, sira: i });
    });
    // Kendi uydusu olan (zincirin devam ettiği) uydu yelpazenin saat
    // yönündeki ucuna konur: zincirin ikinci halkası komşusunun üstüne
    // değil, boş kalan yana açılsın (Velî -> Bilinen-Bilinmeyen).
    const cocukSayisi = (id) => nodes.filter((m) => {
      const b = uyduBilgi.get(m.id);
      return b && b.adim > 0 && b.ebeveyn === id;
    }).length;
    ilkAdim.forEach((ids, ebeveyn) => {
      const e = yer.get(ebeveyn);
      if (!e) return;
      ids = ids.slice().sort((a, b) => cocukSayisi(a) - cocukSayisi(b));
      ids.forEach((id, i) => {
        yer.set(id, { aci: e.aci + (i - (ids.length - 1) / 2) * UYDU_YELPAZE, k: UYDU_K[0], sira: e.sira + 0.5 });
      });
    });
    // Sonraki adımlar (uydunun uydusu): ebeveyn uydunun ışınında bir adım
    // daha dışarıda, saat yönünde hafif kaymış.
    for (let tur = 0; tur < 3; tur += 1) {
      nodes.forEach((n) => {
        if (yer.has(n.id)) return;
        const b = uyduBilgi.get(n.id);
        const e = b && yer.get(b.ebeveyn);
        if (!e) return;
        yer.set(n.id, { aci: e.aci + UYDU_KAYMA, k: UYDU_K[1], sira: e.sira + 0.5 });
      });
    }
    let bilinmeyen = 0;
    nodes.forEach((n) => {
      let y = yer.get(n.id);
      if (!y) {
        // Hiçbir yere bağlanamayan düğüm: sessizce bir yere yığılmasın,
        // görünür ama ayrı bir yere (en dışa) açılsın.
        y = { aci: (bilinmeyen * 47) % 360, k: 1.9, sira: OMURGA.length + bilinmeyen };
        bilinmeyen += 1;
        if (window.console && console.warn) {
          console.warn("[ontoloji] çember yerleşiminde yeri yok, geçici konum: " + n.id);
        }
      }
      const a = derece(y.aci);
      n.__aci = a;
      n.__k = y.k;
      n.__sira = y.sira;
      n.__pus = (1 + Math.sin(a)) / 2;
      // x ve y AYNI yarıçapla çarpılır -- ezilmiş elips değil, daire.
      n.tx = ringCx + ringR * y.k * Math.cos(a);
      n.ty = ringCy + ringR * y.k * Math.sin(a);
      n.x = n.tx;
      n.y = n.ty;
    });

    // Çemberin kendi yayları: ardışık iki omurga düğümünü bağlayan kenar
    // (Kalp -> Zât dahil: turu kapatan rücû yayı). Uydunun ebeveynine
    // giden kenar ise kısa, düz bir ışın; geri kalanlar çemberin içinden
    // geçen kirişler.
    links.forEach((l) => {
      const i = OMURGA.indexOf(l.source), j = OMURGA.indexOf(l.target);
      const sn = nodeById.get(l.source), tn = nodeById.get(l.target);
      if (!sn || !tn) return;
      if (i >= 0 && j >= 0 && (j === i + 1 || (i === OMURGA.length - 1 && j === 0))) {
        let a1 = tn.__aci;
        while (a1 <= sn.__aci) a1 += Math.PI * 2;
        l.__yay = { a0: sn.__aci, a1: a1 };
      } else {
        const bt = uyduBilgi.get(l.target), bs = uyduBilgi.get(l.source);
        l.__isin = !!((bt && bt.ebeveyn === l.source) || (bs && bs.ebeveyn === l.target));
      }
    });
    // Kenar uçları kimlikten düğüm nesnesine (eskiden d3.forceLink bunu
    // yapıyordu; artık bağ kuvveti yok). Kodun geri kalanı l.source.id okur.
    links.forEach((l) => {
      l.source = nodeById.get(l.source) || l.source;
      l.target = nodeById.get(l.target) || l.target;
    });

    // ------------------------------------------------------------------
    // Mertebe ekseni (3B): "Mertebe eksenine eğ" düğmesi çemberi sarmala
    // açar. Açı aynı kalır (çemberdeki yer), yükseklik düğümün `layer`ından
    // gelir (0 Zât .. 6 Kalp): sarmal, çemberin mertebe ekseni boyunca
    // gerilmiş hâli. İniş yayları sarmalın ipliği olur; Kalp'ten Zât'a
    // kapanan rücû yayı dipten tepeye yükselir. Motor Hâller/Menziller ile
    // aynı (hal.js helixPoint/project deseni: elle yazılmış yaw/pitch/
    // perspektif, Three.js yok). tilt=0'da konumlar çemberin BİREBİR aynısı.
    const layers = Array.from(new Set(nodes.map((n) => n.layer))).sort((a, b) => a - b);
    const maxLayer = layers[layers.length - 1] || 1;
    const R3D_OLCU = 0.82;
    function sarmalKonum(aci, k, f) {
      const r = ringR3d * R3D_OLCU * k;
      return { x: r * Math.cos(aci), y: r * Math.sin(aci), z: 0, drop: -dropH / 2 + dropH * f };
    }
    function helixPoint(n) {
      return sarmalKonum(n.__aci, n.__k, n.layer / maxLayer);
    }
    // Hâller'deki projeksiyonun aynısı: yaw (Y ekseni) → pitch (X ekseni) →
    // perspektif bölme. Her ikisi de yalnız tilt ile devreye girer.
    function project3d(p) {
      const yy = yaw * tilt, pp = pitch * tilt;
      const cyw = Math.cos(yy), syw = Math.sin(yy);
      const x1 = p.x * cyw + p.z * syw;
      const z1 = -p.x * syw + p.z * cyw;
      const cpt = Math.cos(pp), spt = Math.sin(pp);
      const y2 = p.y * cpt - z1 * spt;
      const z2 = p.y * spt + z1 * cpt;
      const zc = Math.max(z2, -FOCAL3D * 0.85);
      const depth = FOCAL3D / (FOCAL3D + zc);
      return { x: x1 * depth, y: y2 * depth, depth: depth, z: z2 };
    }
    // Bir noktanın ekran (spinGroup yerel) konumu, tilt ile harmanlı:
    // tilt=0'da çemberin noktası, tilt=1'de sarmalın izdüşümü.
    function harmanla(x2, y2, h) {
      const p = project3d({ x: h.x, y: h.y * (1 - tilt) + h.drop * tilt, z: h.y * tilt });
      return {
        x: x2 * (1 - tilt) + (cx3d + p.x) * tilt,
        y: y2 * (1 - tilt) + (cy3d + p.y) * tilt,
        depth: 1 + (p.depth - 1) * tilt,
        z: p.z * tilt,
      };
    }

    // Her karede ekran konumlarını tazeler. tilt=0 iken px/py simülasyonun
    // x/y'sinin ta kendisidir (sürüklenen düğüm dahil) -- 2B hiç bozulmaz.
    function positionNodes() {
      nodes.forEach((n) => {
        if (tilt < 0.001) {
          n.px = n.x; n.py = n.y; n.__depth = 1; n.__z = 0;
          return;
        }
        const q = harmanla(n.x, n.y, helixPoint(n));
        n.px = q.x; n.py = q.y; n.__depth = q.depth; n.__z = q.z;
      });
    }

    // Kenar yolu (modül düzeyindeki edgePath buna devreder: yaylar çemberin
    // ve sarmalın geometrisini bilmek zorunda).
    kenarYoluFn = function (d) {
      const s = d.source, t = d.target;
      const sx = s.px != null ? s.px : s.x, sy = s.py != null ? s.py : s.y;
      const txp = t.px != null ? t.px : t.x, typ = t.py != null ? t.py : t.y;
      const pad = radiusFor(t) + 2;
      if (d.__yay) {
        // Bitiş, hedef düğümün kenarında: açı olarak geri çekilir.
        const del = pad / ringR;
        if (tilt < 0.02) {
          // 2B: gerçek çember yayı, düğümlerin GÜNCEL konumları arasında
          // (sürüklenen düğümü de izler). Hedef, merkez etrafında del kadar
          // geri döndürülür.
          const dx = txp - ringCx, dy = typ - ringCy;
          const c = Math.cos(-del), sn = Math.sin(-del);
          const ex = ringCx + dx * c - dy * sn, ey = ringCy + dx * sn + dy * c;
          return "M" + sx + "," + sy + "A" + ringR + "," + ringR + " 0 0,1 " + ex + "," + ey;
        }
        // Eğimde: sarmalın ipliğini izleyen örneklenmiş yol. Yükseklik iki
        // ucun mertebesi arasında doğrusal -- rücû yayı dipten tepeye çıkar.
        const f0 = s.layer / maxLayer, f1 = t.layer / maxLayer;
        const a0 = d.__yay.a0, a1 = d.__yay.a1 - del;
        const ADIM = 22;
        let yol = "";
        for (let i = 0; i <= ADIM; i += 1) {
          const u = i / ADIM;
          const aci = a0 + (a1 - a0) * u;
          const q = harmanla(ringCx + ringR * Math.cos(aci), ringCy + ringR * Math.sin(aci),
            sarmalKonum(aci, 1, f0 + (f1 - f0) * u));
          yol += (i ? "L" : "M") + q.x.toFixed(1) + "," + q.y.toFixed(1);
        }
        return yol;
      }
      if (d.__isin) {
        const e = pullBack(sx, sy, txp, typ, pad);
        return "M" + sx + "," + sy + "L" + e.x + "," + e.y;
      }
      // Kiriş: çemberin içinden geçen bağ. 2B'de denetim noktası merkeze
      // doğru çekilir (kiriş çemberin İÇİNDE kalır, boşlukta bitmez);
      // eğimde eski yay (rücû sağa, tenzîh-teşbîh sola bükülür).
      const mx0 = (sx + txp) / 2, my0 = (sy + typ) / 2;
      const c2x = mx0 + (ringCx - mx0) * 0.4, c2y = my0 + (ringCy - my0) * 0.4;
      const dx = txp - sx, dy = typ - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const bow = d.kind === "return" ? 90 : d.kind === "paradox" ? -70 : 0;
      const c3x = mx0 + (-dy / dist) * bow, c3y = my0 + (dx / dist) * bow;
      const mx = c2x * (1 - tilt) + c3x * tilt, my = c2y * (1 - tilt) + c3y * tilt;
      const e = pullBack(mx, my, txp, typ, pad);
      return "M" + sx + "," + sy + "Q" + mx + "," + my + " " + e.x + "," + e.y;
    };

    // Konumlar sabit. Simülasyonda yalnız "yerine dön" kuvveti var: hiçbir
    // düğüm kendiliğinden kıpırdamaz (başlangıç konumu = hedef); yalnız
    // sürüklenip bırakılan düğüm yerine geri çekilir. Eskiden çekim/itme/
    // çarpışma kuvvetleri de vardı ve yerleşim her yüklemede biraz farklı
    // çıkıyordu (2026-10-09 görsel değerlendirme).
    simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX((d) => d.tx).strength(0.3))
      .force("y", d3.forceY((d) => d.ty).strength(0.3))
      .stop()
      .alpha(0);

    const zoomLayer = svg.append("g").attr("class", "zoom-layer");

    const zoom = window.DostGraphUtils.createZoomBehavior(svg, zoomLayer, [0.5, 4], (event) => !event.target.closest(".node"));
    // `fit`: bütün haritayı çerçeveye sığdırır. Yayılma davranışları (#2)
    // buna ihtiyaç duyuyor -- ışığın Zât'tan bütün mertebelere gitmesi,
    // ancak bütün mertebeler ekrandayken görülebilir. Tıklamanın olağan
    // panToNode'u o sahneyi ekran dışında bırakıyordu (ölçüldü).
    window.__ontologyZoom = {
      svg, zoom,
      fit(animate) {
        // Mobil liste kipinde SVG gizli (0 genişlik): d3-zoom'un geçişi
        // DOM'dan 0 okuyup NaN üretiyor (bkz. runBirth'teki not).
        if (!svg.node().clientWidth) return;
        const sel = (animate && !reduceMotion) ? svg.transition().duration(520) : svg;
        sel.call(zoom.transform, computeFitTransform());
      },
    };

    // Kart açılınca/kapanınca kullanılabilir alan değişiyor -- sahne
    // yeniden sığar. (Kart kapanınca aşağıdaki boşluk geri kazanılır;
    // yeniden sığdırmasaydık sahne sebepsiz yere yukarıda asılı kalırdı.)
    document.addEventListener("dost:start-hint", () => {
      // Mobilde harita "Haritayı aç"a kadar display:none -- 0 genişlikte
      // sığdırma translate(NaN,NaN) üretiyordu (2026-10-07 taraması).
      if (ontologyWrap.hidden || !svg.node().clientWidth) return;
      const sel = reduceMotion ? svg : svg.transition().duration(520);
      sel.call(zoom.transform, computeFitTransform());
    });

    // Ortala ("geri çekilmek", ETKILESIM_DILI.md): başlangıçtaki bakışa
    // dönmeli. Eskiden her basışta çerçeve o anki konumlardan YENİDEN
    // hesaplanıyordu -- 3B dönüş ve etiket yerleşimi yüzünden her seferinde
    // biraz farklı çıkıyor, ölçekle birlikte kayıyordu (2026-10-08 taraması:
    // Hâller'de Nefs/Tövbe alt kenarda kesiliyordu). İlk sığdırmanın dönüşümü
    // pencere boyutu + 2B/3B kipi başına saklanır; Ortala ona döner (kip
    // korunur), boyut değiştiyse yeniden hesaplanır.
    const ilkBakis = new Map();
    // Görünür tuvalin GÜNCEL boyu. Sahnenin kendi koordinatları kurulduğu
    // andaki boya göre (width/height) kalır; sığdırma ise ekrandaki gerçek
    // tuvale yapılır. Mobilde grafik "Haritayı aç"a kadar gizli (0x0) kurulup
    // 800x600 yedeğine göre sığdırılıyordu; açılınca dar tuvalde çemberin
    // yalnız bir parçası görünüyordu (2026-10-09, 390 px'te ölçüldü).
    function tuval() {
      const el = svg.node();
      return { w: el.clientWidth || width, h: el.clientHeight || height };
    }
    function bakisAnahtari() { const t = tuval(); return t.w + "x" + t.h + ":" + (tiltTarget > 0.5 ? 3 : 2); }
    function ilkBakisKaydet(t) {
      if (width > 0 && height > 0 && t && isFinite(t.k) && !ilkBakis.has(bakisAnahtari())) ilkBakis.set(bakisAnahtari(), t);
      return t;
    }
    // Tuval boyu değişince (pencere, mobilde "Haritayı aç") o boyun ilk
    // bakışına otur. Boy aynıysa dokunulmaz: kullanıcının kaydırması kalır.
    let sonTuval = tuval().w + "x" + tuval().h;
    window.addEventListener("resize", window.DostGraphUtils.debounceResize(() => {
      const t = tuval();
      if (ontologyWrap.hidden || !svg.node().clientWidth || t.w + "x" + t.h === sonTuval) return;
      sonTuval = t.w + "x" + t.h;
      paintPositions();
      svg.call(zoom.transform, ilkBakis.get(bakisAnahtari()) || ilkBakisKaydet(computeFitTransform()));
    }));
    window.DostGraphUtils.wireRecenter("ontology-recenter", () => {
      // Seçim burada kamerayı taşımıyor (düğüme tıklamak yalnız paneli
      // açıyor), o yüzden yalnız çerçeve sıfırlanıyor -- seçili düğüm kalır.
      // Serbest döndürme (3B'de boş alanı sürüklemek) de kaymış bakıştır --
      // ETKILESIM_DILI "geri çekilmek"; eğim (kullanıcının seçtiği kip) kalır.
      // Eskiden yalnız çerçeve sıfırlanıyor, sarmal döndürülmüş kalıyordu
      // (2026-10-09, etkilesim-testi.js).
      yaw = 0; pitch = 0.26;
      paintPositions();
      const sel = reduceMotion ? svg : svg.transition().duration(400);
      sel.call(zoom.transform, ilkBakis.get(bakisAnahtari()) || computeFitTransform());
    });

    // Etiket genişlikleri metne göre değişir (bkz. labelFor); ölçüm ucuz
    // olsun diye metin başına önbelleğe alınır.
    const fitLabelWidthCache = new Map();
    function labelHalfWidth(d) {
      const txt = labelFor(d);
      let w = fitLabelWidthCache.get(txt);
      if (w == null) {
        w = 0;
        if (labelSel) {
          const el = labelSel.filter((n) => n.id === d.id).node();
          if (el) { try { w = el.getComputedTextLength(); } catch (e) {} }
        }
        if (!w) w = txt.length * 6.4;
        fitLabelWidthCache.set(txt, w);
      }
      return w / 2;
    }
    // "İlk kez mi buradasın?" kartı (start-hint.js) grafiğin ÜSTÜNE, tam
    // sahnenin en kalabalık yerine biniyor. Etiket yerleştirme onu
    // 2026-08-27'de engel saymaya başlamıştı; sığdırma ise hâlâ bilmiyordu
    // -- kartın altında yer kalmadığı için aşağı itilen etiketler
    // çerçevenin dışına düşüyordu. Kart açıkken sahne onun ÜSTÜNDEKİ alana
    // sığar; kapanınca (dost:start-hint) yeniden sığdırılır.
    function altPay() {
      const el = document.getElementById("start-hint");
      if (!el || el.hidden) return 0;
      const hr = el.getBoundingClientRect();
      const sr = svg.node().getBoundingClientRect();
      if (!hr.height || !sr.height) return 0;
      // Üst sınır dar tutuluyor. 2026-08-28'de ölçüldü: 1024x700'de kart
      // kendi düzen kusuru yüzünden 260 px'e uzuyordu (CSS'te ayrıca
      // düzeltildi) ve cömert bir pay sahneyi pul büyüklüğüne indiriyordu.
      // Kart ne kadar büyürse büyüsün grafik yüksekliğinin en çok beşte
      // birini verir; gerisini çakışma çözücüsü zaten engel olarak biliyor.
      return Math.max(0, Math.min(tuval().h * 0.2, sr.bottom - hr.top + 12));
    }
    function computeFitTransform() {
      const pad = 48;
      const alt = altPay();
      const { w: tw, h: th } = tuval();
      const useH = Math.max(th * 0.5, th - alt);
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      nodes.forEach((n) => {
        const r = radiusFor(n);
        // 3B'de sarmal düz halkadan belirgin biçimde uzun; sığdırma o
        // yüzden hedef (tx/ty) yerine güncel ekran konumuna bakmalı.
        const bx = tiltTarget > 0.5 && n.px != null ? n.px : n.tx;
        const by = tiltTarget > 0.5 && n.py != null ? n.py : n.ty;
        // Sığdırma yalnız düğüm DAİRESİNE bakıyordu, altındaki yazıya değil
        // -- uzun etiketler (ör. "Self-Disclosure and the Breath of the
        // All-Merciful") dairenin çok dışına taşıyor, dar (mobil) ekranda
        // iki kenardan birden kırpılıyordu (2026-08-06 ölçüldü). Yazı
        // düğümün altında ORTALANMIŞ ve YATAYDA yarı genişliği kadar
        // dışarı taşıyor; dikeyde de düğümün altına (baseY + satır
        // yüksekliği kadar) sarkıyor.
        const half = Math.max(r, labelHalfWidth(n));
        minX = Math.min(minX, bx - half);
        maxX = Math.max(maxX, bx + half);
        // Aşağıdaki pay eskiden sabitti (r + 14 + 16), yani etiketin HEP
        // düğümün hemen altında durduğunu varsayıyordu. Çakışma çözücüsü
        // kalabalıkta etiketleri 100 pikselden fazla aşağı itebiliyor;
        // 2026-08-28'de ölçüldü, alttaki iki etiket ("Halîfe", "Allah
        // Katında Bilinen, Âlemde Bilinmeyen") çerçevenin altına taşıyordu.
        // Artık etiketin gerçek konumu okunuyor -- ve o konum artık
        // düğümün ÜSTÜ de olabildiği için (dışa bakan taraf kuralı) aynı
        // ölçü yukarı taşma için de kullanılıyor.
        const lo = labelOffsetY(n);
        minY = Math.min(minY, by - r, by + lo - 16);
        maxY = Math.max(maxY, by + r, by + lo + 16);
      });
      const bboxW = Math.max(maxX - minX, 1);
      const bboxH = Math.max(maxY - minY, 1);
      const scale = Math.min(
        4,
        Math.max(0.22, Math.min((tw - pad * 2) / bboxW, (useH - pad * 2) / bboxH))
      );
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      return d3.zoomIdentity
        .translate(tw / 2 - scale * cx, useH / 2 - scale * cy)
        .scale(scale);
    }

    // Sakin dönüş için ara grup: bütün sahne dairenin merkezi etrafında
    // yavaşça döner; etiketler ayrıca ters çevrilip dik ve yerinde tutulur.
    const spinGroup = zoomLayer.append("g").attr("class", "onto-spin");

    // 2B'nin zemin çizgisi: düğümlerin üstünde durduğu çember. Çok soluk,
    // tek bir halka (iç içe değil) -- çemberi asıl çizen, üstündeki
    // kenarların yaylarıdır; bu yalnız aralarındaki boşluğu tutar. Yalnız
    // 2B'de görünür: eğimde yerini sarmalın ipliği (helixLayer) alır.
    const ringLayer = spinGroup.append("g").attr("class", "onto-ring-layer");
    // Doğuş animasyonu (runBirth) çemberi de kademeli belirtir; animasyon
    // dışında hep 1 (paintPositions her karede kullanıyor).
    let birthRing = 1;
    const ringEl = ringLayer
      .append("path")
      .attr("class", "onto-ring")
      .attr("d", "M" + ringCx + "," + (ringCy - ringR) +
        "A" + ringR + "," + ringR + " 0 1,1 " + ringCx + "," + (ringCy + ringR) +
        "A" + ringR + "," + ringR + " 0 1,1 " + ringCx + "," + (ringCy - ringR));

    // Sarmalın ipliği: eğimde düğümlerin üstünde durduğu eğri. Yeni bir
    // iddia DEĞİL: helixPoint'in sürekli hâli (omurga boyunca, Zât'tan
    // Kalp'e; açı ve mertebe düğümler arasında doğrusal).
    //
    // Kısa parçalara bölünüyor çünkü derinlik eğri boyunca değişiyor:
    // arkaya geçen yarı puslanıp siliniyor, öne gelen yarı beliriyor
    // (GORSEL_DIL: "sahte 3B yapma; derinlik atmosferik puslanmayla
    // kurulur").
    const IPLIK_PARCA = 96;
    const helixLayer = spinGroup.append("g").attr("class", "onto-helix-layer");
    const helixSegs = helixLayer
      .selectAll("line")
      .data(d3.range(IPLIK_PARCA))
      .join("line")
      .attr("class", "onto-helix");
    const iplikDugumleri = OMURGA.map((id) => nodeById.get(id)).filter(Boolean);
    function helixCurvePoint(t) {
      const son = iplikDugumleri.length - 1;
      const yerT = Math.max(0, Math.min(son, t * son));
      const i = Math.min(son - 1, Math.floor(yerT)), u = yerT - i;
      const A = iplikDugumleri[i], B = iplikDugumleri[i + 1];
      let a1 = B.__aci;
      while (a1 < A.__aci) a1 += Math.PI * 2;
      const aci = A.__aci + (a1 - A.__aci) * u;
      const f = (A.layer + (B.layer - A.layer) * u) / maxLayer;
      // Salınım UYGULANMIYOR: iplik spinGroup'un içinde, sahnenin dönüşünü
      // zaten o grup taşıyor (düğümlerde de öyle).
      return harmanla(ringCx + ringR * Math.cos(aci), ringCy + ringR * Math.sin(aci), sarmalKonum(aci, 1, f));
    }
    function paintHelix() {
      if (tilt < 0.02) { helixLayer.style("opacity", 0); return; }
      // Çember eğim arttıkça sönüyor (ringEl), iplik beliriyor: ikisi aynı
      // anda değil.
      helixLayer.style("opacity", tilt * birthRing * 0.6);
      let onceki = helixCurvePoint(0);
      helixSegs.each(function (i) {
        const simdi = helixCurvePoint((i + 1) / IPLIK_PARCA);
        const d = (onceki.depth + simdi.depth) / 2;
        d3.select(this)
          .attr("x1", onceki.x).attr("y1", onceki.y)
          .attr("x2", simdi.x).attr("y2", simdi.y)
          // Derinlik aralığı (yaklaşık 0.84-1.24, FOCAL3D=2600): arkadaki
          // neredeyse görünmez, öndeki tam.
          .style("opacity", Math.max(0.07, Math.min(1, (d - 0.84) / 0.36)));
        onceki = simdi;
      });
    }

    const linkGroup = spinGroup.append("g").attr("class", "links");

    // GÖRÜNEN çizgi: yalnız çizim. 1,6px'lik bir çizgiyi fareyle tutturmak
    // zordu (kullanıcı notu 2026-08-03) -- etkileşim bu yüzden ayrı,
    // GÖRÜNMEZ ve kalın bir "isabet şeridine" taşındı (aşağıda). Şerit
    // çizginin altında duruyor ki okları/çizgiyi örtmesin; saydam olduğu
    // için görünüşe hiç karışmıyor.
    pathSel = linkGroup
      .selectAll("path.link")
      .data(links)
      .join("path")
      .attr("class", (d) => "link link--" + d.kind + " link--conf-" + confSlug(d.confidence))
      .style("stroke", (d) => "url(#" + d.__gradId + ")")
      .attr("fill", "none")
      .attr("pointer-events", "none");

    // İsabet şeridi: "değinmek" fiilinin gerçekten mümkün olması için
    // (#10 + ETKILESIM_DILI.md'nin dördüncü fiili). Klavye karşılığı da
    // burada -- odaklanabilir olan bu şerit, çünkü tıklanabilir olan da o.
    hitSel = linkGroup
      .selectAll("path.link-hit")
      .data(links)
      .join("path")
      .attr("class", "link-hit")
      .attr("fill", "none")
      .on("mouseenter", (event, d) => { highlightEdge(d); showEdgeTooltip(d, event); })
      .on("mousemove", (event) => moveTooltip(event))
      .on("mouseleave", () => { highlight(null); hideTooltip(); })
      .on("click", (event, d) => onEdgeClick(d));
    // Ürün denetimi P2-6 (2026-09-02): tabindex/role/aria-label/focus/blur/
    // keydown burada elle yazılmıştı; hal.js/sirlar-graph.js/sorular.js'in
    // zaten kullandığı ortak yardımcıya taşındı (GU.wireEdgeAccessibility) --
    // davranış aynı, yalnız dördüncü kopya kapandı.
    window.DostGraphUtils.wireEdgeAccessibility(hitSel, {
      label: (d) => edgeAriaLabel(d),
      onFocus: (d, event) => { highlightEdge(d); showEdgeTooltip(d, event); },
      onBlur: () => { highlight(null); hideTooltip(); },
      onActivate: (d) => onEdgeClick(d),
    });

    // Ok tuşuyla gezinme: verilen yön vektörüne (dx,dy) en çok hizalı VE en
    // yakın düğümü bulur -- yalnız açının 90°'den dar olduğu (aynı yarım
    // düzlemdeki) adaylar arasından, açı+mesafe birleşik bir skorla seçiyor
    // ki hem "sağdaki en yakın" hem "gerçekten sağda olan" tutarlı olsun.
    function nearestNodeInDirection(current, dx, dy) {
      let best = null, bestScore = Infinity;
      nodes.forEach((n) => {
        if (n.id === current.id) return;
        const vx = n.x - current.x, vy = n.y - current.y;
        const dist = Math.hypot(vx, vy);
        if (dist < 1) return;
        const dot = (vx * dx + vy * dy) / dist;
        if (dot <= 0.3) return; // ~72°'den geniş sapmaları ele
        const score = dist / dot;
        if (score < bestScore) { bestScore = score; best = n; }
      });
      return best;
    }

    const nodeGroup = spinGroup.append("g").attr("class", "nodes");

    nodeSel = nodeGroup
      .selectAll("g.node")
      .data(nodes)
      .join("g")
      .attr("class", "node ontology-node")
      .classed("node--root", (d) => d.id === "dhat")
      .attr("tabindex", "0")
      .attr("role", "button")
      .attr("aria-label", (d) => labelFor(d))
      .call(drag(simulation))
      .on("click", (event, d) => onNodeClick(d))
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onNodeClick(d);
        } else if (event.key.startsWith("Arrow")) {
          // B2 "klavye-only graf gezintisi": bir düğüme Tab ile gelindikten
          // sonra ok tuşlarıyla en yakın komşu düğüme geçilebilir -- fare
          // olmadan da grafın gezilebilmesi için.
          const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
          if (!dir) return;
          const next = nearestNodeInDirection(d, dir[0], dir[1]);
          if (next) {
            event.preventDefault();
            const el = nodeSel.filter((n) => n.id === next.id).node();
            if (el) el.focus();
          }
        }
      })
      .on("mouseenter", (event, d) => { highlight(d); showTooltip(d, event); })
      .on("mousemove", (event) => moveTooltip(event))
      .on("mouseleave", () => { highlight(null); hideTooltip(); })
      .on("focus", (event, d) => { highlight(d); showTooltip(d, event); })
      .on("blur", () => { highlight(null); hideTooltip(); });

    // Seçim/değinme katmanı: düğümün arkasında TEK, kenarsız, merkezden
    // dışa sönen bir ışık lekesi (bkz. style.css "Ontoloji çemberi").
    // Opaklığı CSS yönetir (hover/odak/seçim); burada yalnız biçimi.
    const secimGrad = defs.append("radialGradient").attr("id", "onto-secim-katmani");
    [["0%", "0.55"], ["55%", "0.32"], ["100%", "0"]].forEach(([off, op]) => {
      secimGrad.append("stop").attr("offset", off)
        .attr("style", "stop-color:var(--series-hal-hayret);stop-opacity:" + op);
    });
    nodeSel
      .append("circle")
      .attr("class", "node-halo")
      .attr("r", (d) => radiusFor(d) * 2.1);

    nodeSel
      .append("circle")
      .attr("class", "node-govde")
      .attr("r", (d) => radiusFor(d))
      .attr("fill", (d) => colorFor(d));

    nodeSel
      .append("circle")
      .attr("class", "node-sheen")
      .attr("r", (d) => radiusFor(d));

    labelSel = nodeSel
      .append("text")
      .attr("class", "node-label")
      .attr("y", (d) => radiusFor(d) + 14)
      .attr("text-anchor", "middle")
      .text((d) => labelFor(d));

    // 3B derinlik eğiminde her düğüm kendi grubuna translate+scale(s)
    // alıyor -- s, düğümün dairesini VE altındaki etiketi birlikte
    // küçültüp büyütüyor. Hem çizim hem çakışma-önleme AYNI s'i kullanmalı.
    function nodeScale(d) {
      return Math.max(0.55, 1 + (d.__depth - 1) * tilt);
    }

    // Etiket bu kadar (yerel birim) ötelenmişse kendi düğümüne ince bir
    // kılavuz çizgiyle bağlanır. Altında çizgi gereksiz: yazı zaten
    // düğümün hemen altında duruyor.
    const LEADER_ESIK = 16;
    // Etiketin düğüm merkezine göre GÜNCEL dikey konumu. Çerçeveye
    // sığdırma bunu bilmek zorunda: sabit bir pay (yarıçap + 14) çakışma
    // çözücüsünün ittiği etiketleri hesaba katmıyordu.
    function labelOffsetY(d) {
      const varsayilan = radiusFor(d) + 14;
      if (!labelSel) return varsayilan;
      const el = labelSel.filter((n) => n.id === d.id).node();
      const y = el ? parseFloat(el.getAttribute("y")) : NaN;
      return isFinite(y) ? y : varsayilan;
    }

    function paintPositions() {
      positionNodes();
      pathSel.attr("d", (d) => edgePath(d));
      // Işık-yolu gradyanlarının uçları kenarla birlikte hareket etmeli --
      // userSpaceOnUse, spinGroup'un yerel koordinatlarında (px/py ile aynı
      // uzay) çalışıyor, sahne döndükçe/sallandıkça burada tazeleniyor.
      links.forEach((d) => {
        const s = d.source, t = d.target;
        defs.select("#" + d.__gradId)
          .attr("x1", s.px != null ? s.px : s.x).attr("y1", s.py != null ? s.py : s.y)
          .attr("x2", t.px != null ? t.px : t.x).attr("y2", t.py != null ? t.py : t.y);
      });
      // İsabet şeridi görünen çizgiyle AYNI yolu izlemeli, yoksa
      // kullanıcı gördüğü çizgiye değil başka bir yere değinir.
      if (hitSel) hitSel.attr("d", (d) => edgePath(d));
      // 3B'de uzaktakiler önce çizilsin ki örtüşme doğru olsun.
      if (tilt > 0.02) window.DostGraphUtils.sortKeepFocus(nodeSel, (a, b) => (b.__z || 0) - (a.__z || 0));
      nodeSel
        .attr("transform", (d) => `translate(${d.px},${d.py}) scale(${nodeScale(d).toFixed(3)})`)
        // Atmosfer: uzaktaki düğüm soluklaşır (Hâller'deki aynı ölçü).
        // __birth: doğuş animasyonu sırasında katman katman belirme çarpanı
        // (runBirth); animasyon bitince alan siliniyor, çarpan 1'e düşüyor.
        .style("opacity", (d) => {
          const base = tilt > 0.02 ? Math.max(0.62, Math.min(1, d.__depth * 1.02)) : 1;
          return d.__birth == null ? base : base * d.__birth;
        })
        // Atmosferik puslanma (2B): çemberde aşağı indikçe düğüm solar ve
        // doygunluğunu yitirir -- uzaklık = kesret (GORSEL_DIL). Dönüş
        // yayında yukarı çıktıkça açılır. CSS --pus'u okur (style.css,
        // .ontology-node); eğimde derinlik atmosferi devralır.
        .style("--pus", (d) => ((d.__pus || 0) * (1 - tilt)).toFixed(3));
      ringEl.style("opacity", (1 - tilt) * birthRing);
      paintHelix();
      // Etiket çakışması: kuvvet düzeni düğümleri yaklaştırdığında yazılar
      // üst üste biniyordu (ölçüldü 2026-07-31: masaüstü 2, mobil 8).
      // Düğüm yerinde kalır, yalnız yazı dikeyde yer açar; motor
      // graph-utils.js'te ortak (aynısı /hal/ ve /sorular/'da da çalışıyor).
      const pend = [];
      // Etiket, düğümün merkezden DIŞA bakan tarafına yazılır -- sitenin
      // başka sahnelerinde zaten böyle (sorular.js, helix.js). Bu sahnede
      // etiket hep AŞAĞI iniyordu; merkez Zât olunca bu, merkeze yakın
      // düğümlerin (özellikle Kalp'in) yazısını Zât'ın hâlesinin içine
      // sokuyordu: çakışma çözücüsü onu uzağa itiyor, ad kendi düğümünden
      // 200 piksel ötede, ince bir kılavuz çizginin ucunda kalıyordu
      // (1342x820'de ölçüldü).
      //
      // Sahne yavaşça döndüğü için yatay eksene yakın bir düğüm her karede
      // yön değiştirip titreyebilirdi: HISTEREZIS_PAY bunu engelliyor --
      // yön ancak düğüm merkezden bu kadar ayrıldığında değişiyor, aradaki
      // bantta en son verilen karar korunuyor.
      const HISTEREZIS_PAY = 26;
      // "Dışarısı" çemberin merkezine göre: üst yarıdaki düğümün adı üstte,
      // alt yarıdakinin altta -- yazılar çemberin içine, kirişlerin arasına
      // düşmez. Eğimde (sarmal) merkez Zât'ın kendisi: sarmal ondan aşağı
      // iner, adlar düğümlerin altında kalır (eski 3B davranışı).
      const zatDugum = nodes.find((n) => n.id === "dhat");
      const merkez = tilt > 0.5
        ? (zatDugum ? swayRotate(zatDugum.px, zatDugum.py) : { x: 0, y: 0 })
        : { x: ringCx, y: ringCy };
      labelSel.each(function (d) {
        const anc0 = swayRotate(d.px, d.py);
        const fark = anc0.y - merkez.y;
        if (fark < -HISTEREZIS_PAY) d.__labelUst = true;
        else if (fark > HISTEREZIS_PAY) d.__labelUst = false;
        // Zât tepede: adı hep üstünde, çemberin dışında.
        if (d.id === "dhat") d.__labelUst = true;
        const baseY = d.__labelUst ? -(radiusFor(d) + 8) : radiusFor(d) + 14;
        const s = nodeScale(d);
        // Etiket kendi grubu içinde ters döndürülüp dik tutuluyor (bkz.
        // spinFrame), yani salınımdan yalnız ANKRAJ noktası (px,py) etkileniyor
        // -- dikey ofset (baseY) hep ekranda düz iniyor/çıkıyor.
        const anchor = anc0;
        pend.push({
          lbl: d3.select(this), txt: labelFor(d),
          x: anchor.x, y: anchor.y + baseY * s, baseY, scale: s,
          dir: d.__labelUst ? -1 : 1,
          priority: d.id === "dhat" ? 2 : (d.kind === "hub" ? 1 : 0),
        });
      });
      // Etiketler yalnız birbirini değil, komşu düğümlerin DAİRELERİNİ de
      // engel saymalı -- bkz. graph-utils.js'teki not. Daireler de kendi
      // düğümünün s'iyle küçülüp büyüyor; dairenin kendisi dönse de
      // biçimi (çember) değişmediği için ankraj noktasını döndürmek yeter.
      const nodeObstacles = nodes.map((d) => {
        const s = nodeScale(d);
        const anchor = swayRotate(d.px, d.py);
        return { x: anchor.x, y: anchor.y, half: radiusFor(d) * s, h: radiusFor(d) * 2 * s };
      });
      // "İlk kez mi buradasın?" kartı (start-hint.js, #start-hint) grafiğin
      // ÜSTÜNE sabit bir HTML panel olarak biniyor -- etiket yerleştirme bunu
      // hiç bilmiyordu, kart açılınca altındaki düğüm etiketlerinin üstüne
      // biniyordu (kod taraması, 2026-08-27; desktop ekran görüntüsüyle
      // doğrulandı). Kartın ekran dikdörtgeni burada da bir engel: SVG'nin
      // kendi (zoom-layer'ın transform'undan ÖNCEKİ, ham) uzayına
      // d3.zoomTransform().invert ile çevriliyor -- kart döngü her tazelendiğinde
      // (yaklaşık 2,5 saniyede bir, sway eşiği) canlı ölçülüyor, ayrı bir
      // olay dinleyicisi gerekmiyor.
      const startHintEl = document.getElementById("start-hint");
      if (startHintEl && !startHintEl.hidden) {
        const hr = startHintEl.getBoundingClientRect();
        const sr = svg.node().getBoundingClientRect();
        if (hr.width && hr.height) {
          const t = d3.zoomTransform(svg.node());
          const x0 = t.invertX(hr.left - sr.left), x1 = t.invertX(hr.right - sr.left);
          const y0 = t.invertY(hr.top - sr.top), y1 = t.invertY(hr.bottom - sr.top);
          nodeObstacles.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, half: (x1 - x0) / 2, h: y1 - y0 });
        }
      }
      // Ekstra pay: bu sahne yavaşça yaw ile dönüyor (varsayılan 3B eğim),
      // yani her karede biraz farklı bir projeksiyon -- tam sınırda kalan
      // çiftler bir sonraki karede yeniden çakışabiliyordu (2026-08-06
      // ölçüldü). Küçük bir tampon bunu azaltıyor (garanti değil, çünkü
      // sürekli dönen bir 3B sahnede HER açıda çakışmasızlık matematiksel
      // olarak garanti edilemez -- bkz. graph-utils.js'teki not).
      deconflictLabels(pend, nodeObstacles, { y: 10, x: 10 });
      // Kılavuz çizgi. Çakışma çözücüsü bir etiketi düğümünün altından
      // uzağa ittiğinde hangi adın hangi noktaya ait olduğu okunmuyordu:
      // 2026-08-28'de varsayılan açılışta ölçüldü, etiketlerin ortancası
      // düğümünden 95 piksel uzaktaydı ve dördü ("Tecellî ve Nefesü'r-
      // Rahmân", "Âlem-i Ervâh", "Âlem-i Misâl", "Esmâ ve Sıfat") boş
      // alanda, yakınında hiçbir düğüm olmadan duruyordu. Motor
      // graph-utils.js'te; kalıbı Eleştiri Arkeolojisi doğurdu, Seyahat
      // Atlası ve Yolculuk da kullanıyor -- bu sahne en kalabalık olanı
      // olduğu hâlde dışarıda kalmıştı.
      //
      // Bu bir OK değil (bkz. GORSEL_DIL.md yasağı): yönü olmayan, uçsuz,
      // saç teli inceliğinde bir bağ -- "şu yazı şu noktaya ait" demekten
      // başka bir şey söylemiyor.
      window.DostGraphUtils.attachLeaderLines(pend, {
        className: "onto-label__leader", threshold: LEADER_ESIK, gap: 5,
      });
      // Öteki kullanıcıların sahnesi bir kez çiziliyor, bu sahne ise her
      // karede yeniden. Bir etiket eşiğin altına geri döndüğünde
      // attachLeaderLines onu atlıyor; eski çizgi de hiçbir yere işaret
      // ederek asılı kalıyordu. Geri dönen etiketin çizgisi siliniyor.
      pend.forEach((it) => {
        if (Math.abs((+it.lbl.attr("y")) - it.baseY) >= LEADER_ESIK) return;
        const par = it.lbl.node() && it.lbl.node().parentNode;
        if (par) d3.select(par).select(".onto-label__leader").remove();
      });
    }

    simulation.on("tick", paintPositions);

    // ------------------------------------------------------------------
    // Doğuş (FAZ 1, 2026-08-03; çember, 2026-10-09). Karşılama ekranının
    // halkası açılıp bu çemberin yerine oturur (welcome.js, halkaEkrani'yi
    // okuyup oraya büyür); halka varınca çember belirir, düğümler onun
    // üstünde Zât'tan saat yönünde sırayla doğar, kenarlar en sonda
    // bağlanır. Kamera hiç kıpırdamaz: halkanın vardığı yer, çemberin
    // ilk bakıştaki yeridir. reduced-motion'da hiç çalışmaz.
    // Dönüş: doğuş gerçekten başladıysa true; bitince bitti() çağrılır.
    birthFn = function runBirth(bitti) {
      if (reduceMotion) return false;
      // Dar ekranda (mobil-liste kipi) SVG "haritayı aç"a kadar CSS ile
      // gizli -- clientWidth 0. Gizliyken doğuş zaten görünmez; d3-zoom'un
      // geçişi de 0 genişlikte NaN üretiyordu (kod taraması, 2026-08-27).
      if (svg.node().clientWidth === 0) return false;
      svg.call(zoom.transform, ilkBakis.get(bakisAnahtari()) || ilkBakisKaydet(computeFitTransform()));

      nodes.forEach((n) => { n.__birth = 0; });
      birthRing = 0;
      const linksG = svg.select("g.links").attr("opacity", 0);
      linksG.transition().delay(1150).duration(700).attr("opacity", 1);

      const HALKA = 520, STAG = 105, DUR = 460, start = performance.now();
      function step(now) {
        const t = now - start;
        let done = true;
        birthRing = Math.max(0, Math.min(1, t / HALKA));
        if (birthRing < 1) done = false;
        nodes.forEach((n) => {
          const v = Math.max(0, Math.min(1, (t - HALKA * 0.6 - n.__sira * STAG) / DUR));
          n.__birth = v * v * (3 - 2 * v);
          if (v < 1) done = false;
        });
        paintPositions();
        if (!done) {
          requestAnimationFrame(step);
        } else {
          nodes.forEach((n) => { delete n.__birth; });
          birthRing = 1;
          paintPositions();
          if (bitti) setTimeout(bitti, 380);
        }
      }
      requestAnimationFrame(step);
      return true;
    };

    // Karşılama halkasının açılıp oturacağı yer: çemberin ilk bakıştaki
    // ekran konumu ve yarıçapı (istemci koordinatları). Görünmüyorsa null.
    window.__ontolojiHalkaEkrani = function () {
      const el = svg.node();
      if (!el.clientWidth || ontologyWrap.hidden || tiltTarget > 0.5) return null;
      const t = ilkBakis.get(bakisAnahtari()) || ilkBakisKaydet(computeFitTransform());
      const r = el.getBoundingClientRect();
      return { x: r.left + t.applyX(ringCx), y: r.top + t.applyY(ringCy), r: t.k * ringR };
    };
    // ---- Sakin, huzurlu salınım ----
    // Burada bilerek TAM DÖNÜŞ yapmıyoruz. Hâller ve Sırlar'da dönüş
    // zararsız: Sırlar merkezden ışıyan bir demet (yukarısı-aşağısı yok),
    // Hâller'de ise dönüş 3B'de dikey eksen etrafında olduğu için sarmal dik
    // kalıyor. Ontolojide ise DİKEY EKSEN ANLAM TAŞIYOR: Zât en üstte, en
    // yoğun mertebe (cisimler) en altta. Sahneyi tam döndürmek, bir dakika
    // sonra cisimler âlemini Zât'ın üstüne çıkarır -- yani şekil, anlattığı
    // metafiziğin tersini söylemeye başlar.
    //
    // Onun yerine çok yavaş, birkaç derecelik bir SALINIM: harita canlı ve
    // nefes alıyor gibi durur, ama "yukarısı" hep yukarıda kalır. Bir düğümün
    // detayı açıkken ve simülasyon hareketliyken (ilk yerleşme, sürükleme)
    // durur.
    const spinCenter = { x: cx3d, y: cy3d };
    let swayT = 0, spinRaf = null, spinLast = 0;
    const SWAY_PERIOD = 46000;   // bir gidiş-geliş ~46 sn
    const SWAY_DEG = 2.6;        // genlik: ±2.6 derece
    function spinFrame(ts) {
      spinRaf = null;
      if (!window.DostGraphUtils.isViewActive(ontologyWrap)) { spinLast = 0; return; }
      const dt = spinLast ? Math.min(64, ts - spinLast) : 16; spinLast = ts;

      // 2B ↔ 3B eğim animasyonu.
      if (tilt !== tiltTarget) {
        if (reduceMotion) tilt = tiltTarget;
        else {
          const p = Math.min(1, (ts - tiltAnimStart) / TILT_DUR_3D);
          const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          tilt = tiltFrom + (tiltTarget - tiltFrom) * e;
          if (p >= 1) tilt = tiltTarget;
        }
        paintPositions();
      }
      // 3B'de sahne kendiliğinden çok yavaş döner. Dönüş DİKEY eksen
      // etrafında olduğu için "yukarısı" hep yukarıda kalır -- yani mertebe
      // iddiası bozulmaz (bu, aşağıdaki salınımın var oluş sebebiydi).
      if (tilt > 0.5) {
        if (!rotating && !reduceMotion && detailPanel.hidden) {
          yaw += dt * 0.00005;
          // Aynı kusur sway kolunda da vardı (bkz. aşağıdaki not): burada
          // hiç eşik YOKTU, paintPositions() (deconflictLabels dahil) her
          // karede koşulsuz çağrılıyordu -- sahnenin VARSAYILAN 3B açılış
          // durumunda, sonsuza dek. Tablette "sürekli titriyor" bildirimiyle
          // 2026-08-07'de ölçülüp yakalandı.
          if (Math.abs(yaw - yawPainted) > 0.3 * Math.PI / 180) {
            yawPainted = yaw;
            paintPositions();
          }
        }
        spinGroup.attr("transform", null);
        labelSel.attr("transform", null);
        nodeSel.selectAll(".onto-label__leader").attr("transform", null);
        spinRaf = requestAnimationFrame(spinFrame);
        return;
      }

      const busy = !detailPanel.hidden || (simulation && simulation.alpha() > 0.05);
      if (!reduceMotion && !busy) swayT += dt;
      const deg = reduceMotion ? 0 : SWAY_DEG * Math.sin((swayT / SWAY_PERIOD) * Math.PI * 2);
      spinGroup.attr("transform", `rotate(${deg.toFixed(3)},${spinCenter.x.toFixed(1)},${spinCenter.y.toFixed(1)})`);
      // Kılavuz çizgi etiketle AYNI ters dönüşü alır: ikisi tek parça gibi
      // durur, yoksa salınımın ucunda çizginin ucu yazının altından
      // kayardı (±2.6°, uzun bir kaymada birkaç piksel).
      const dikTut = function (d) {
        const ly = radiusFor(d) + 14;
        return `rotate(${(-deg).toFixed(3)},0,${ly.toFixed(1)})`;
      };
      labelSel.attr("transform", dikTut);
      nodeSel.selectAll(".onto-label__leader").attr("transform", dikTut);
      // Etiket çakışma-önleme salınımın ORTASINDA (0°) hesaplanıyordu --
      // yerleşim ucunda sınırdaki çiftler yeniden çakışıyordu (2026-08-06
      // ölçüldü). swayRad'ı güncel açıya taşıyıp yerleşimi tazeliyoruz.
      // Eşik ÖNEMLİ: `deg` her karede sürekli değişen bir sinüs değeri,
      // yani "!==" neredeyse HER karede doğruydu -- paintPositions() (tüm
      // düğümler için deconflictLabels dahil) saniyede 60 kez çalışıyordu,
      // sürekli açık kalan görünümde sonsuza dek. Tablette "sürekli
      // titriyor" bildirimiyle 2026-08-07'de ölçülüp yakalandı. 0.3°'lik
      // eşik, yerleşimi hâlâ tazeliyor (yaklaşık 2,5 saniyede bir, salınımın
      // ~46 sn'lik yarı periyoduna göre) ama her kareyi tüketmiyor.
      if (Math.abs(deg - swayRad * 180 / Math.PI) > 0.3) {
        swayRad = deg * Math.PI / 180;
        paintPositions();
      }
      spinRaf = requestAnimationFrame(spinFrame);
    }
    function ensureSpin() { if (spinRaf == null) spinRaf = requestAnimationFrame(spinFrame); }
    ensureSpin();
    window.DostGraphUtils.onViewWake(ensureSpin);
    window.__ontologyEnsureSpin = ensureSpin;

    // ---- 2B ↔ 3B ----
    function setTilt(target) {
      tiltFrom = tilt; tiltTarget = target; tiltAnimStart = performance.now();
      if (target < 0.5) yaw = 0;
      // Eğim bitince çerçeveyi yeniden sığdır: sarmal düz elipsten uzun.
      setTimeout(() => {
        if (ontologyWrap.hidden) return;
        const sel = reduceMotion ? svg : svg.transition().duration(400);
        ilkBakis.delete(bakisAnahtari());   // Kipe geçildiği anki çerçeve o kipin yeni "başlangıç bakışı"dır.
        sel.call(zoom.transform, ilkBakisKaydet(computeFitTransform()));
      }, reduceMotion ? 30 : TILT_DUR_3D + 60);
      ensureSpin();
    }
    // "Bir adım geri" (ETKILESIM_DILI): açık panel → seçili düğüm → giriş
    // hâli. Paneli ortak zincir kapatır (panel açıkken burası karışmaz);
    // panel kapandıktan sonraki Esc seçim katmanını söndürür. Eskiden seçim
    // panel kapansa da düğümde asılı kalıyordu.
    window.DostGraphUtils.registerStepBack("ontology-wrap", () => {
      if (!detailPanel.hidden || !nodeSel) return false;
      if (nodeSel.filter(".node--active").empty()) return false;
      nodeSel.classed("node--active", false);
      currentDetailNode = null;
      return true;
    });

    const tiltBtn = document.getElementById("ontology-3d-toggle");
    if (tiltBtn && !tiltBtn.dataset.wiredOnto3d) {
      tiltBtn.dataset.wiredOnto3d = "1";
      tiltBtn.setAttribute("aria-pressed", "false");
      tiltBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const to = tiltTarget > 0.5 ? 0 : 1;
        setTilt(to);
        tiltBtn.classList.toggle("is-on", to > 0.5);
        tiltBtn.setAttribute("aria-pressed", to > 0.5 ? "true" : "false");
      });
    }

    const confidenceBtn = document.getElementById("ontology-confidence-toggle");
    if (confidenceBtn && !confidenceBtn.dataset.wiredOntoConf) {
      confidenceBtn.dataset.wiredOntoConf = "1";
      // Varsayılan artık AÇIK (2026-08-14 karar): ilk bakışta yalnız
      // yüksek-güvenli bağlantılar tam görünür kalsın, düşükler kullanıcı
      // isterse açılsın -- index.html'deki ontology-wrap zaten
      // "confidence-on" sınıfıyla ve bu düğme "is-on"/aria-pressed=true
      // ile başlıyor, burada onu YANLIŞLIKLA sıfırlamıyoruz.
      confidenceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const on = !ontologyWrap.classList.contains("confidence-on");
        ontologyWrap.classList.toggle("confidence-on", on);
        confidenceBtn.classList.toggle("is-on", on);
        confidenceBtn.setAttribute("aria-pressed", on ? "true" : "false");
        const dimmed = links.filter((l) => l.confidence && l.confidence !== "Yüksek").length;
        showConfidenceFeedback(on, dimmed, links.length);
      });
    }

    // 3B'de boş alanı sürükleyerek döndürme (2B'de pan/zoom'a dokunmaz).
    (function wireRotateDrag() {
      const el = svg.node();
      let lastX = 0, lastY = 0;
      let dragRepaintQueued = false;
      el.addEventListener("pointerdown", (e) => {
        if (tiltTarget < 0.5) return;
        if (e.target.closest && e.target.closest(".node")) return;
        rotating = true; lastX = e.clientX; lastY = e.clientY;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
      });
      el.addEventListener("pointermove", (e) => {
        if (!rotating) return;
        yaw += (e.clientX - lastX) * 0.006;
        pitch = Math.max(0.02, Math.min(1.1, pitch + (e.clientY - lastY) * 0.004));
        lastX = e.clientX; lastY = e.clientY;
        // Aşağıdaki idle-spin kolunda (bkz. spinFrame, ~satır 1776) zaten
        // düzeltilmiş AYNI kusur -- paintPositions() (deconflictLabels
        // dahil) burada da koşulsuz çağrılıyordu. Touch'ta pointermove
        // fare hareketinden çok daha sık ve küçük artışlarla ateşleniyor;
        // her birinde çakışma-önleme yeniden koşunca eşik-yakını etiketler
        // sıçrıyordu (tablette "sürüklerken titriyor" bildirimi). rAF ile
        // tekilleştirip kare başına en fazla bir kez boyuyoruz.
        if (!dragRepaintQueued) {
          dragRepaintQueued = true;
          requestAnimationFrame(() => { dragRepaintQueued = false; paintPositions(); });
        }
      });
      const stop = (e) => {
        if (!rotating) return;
        rotating = false;
        try { el.releasePointerCapture(e.pointerId); } catch (_) {}
      };
      el.addEventListener("pointerup", stop);
      el.addEventListener("pointercancel", stop);
    })();

    paintPositions();
    // Açılış 2B çember (2026-10-09). 2026-07-26'dan beri görünüm 3B eğimli
    // açılıyordu (kullanıcı isteği); görsel değerlendirme bu açılışın
    // ilk ziyaret ipucunun ("iki uçlu bir çember") söylediğini göstermediğini
    // ölçtü. Sarmal kaybolmadı: "Mertebe eksenine eğ" düğmesi çemberi
    // sarmala açar.
    svg.call(zoom.transform, ilkBakisKaydet(computeFitTransform()));
    ensureSpin();

    window.__ontologyApp = { nodes, links, nodeById, is3d: () => tiltTarget > 0.5 };

    // İlk boya @font-face yüklenmeden önce olabilir; deconflictLabels'ın
    // ölçüm önbelleği (graph-utils.js) fontlar hazır olunca kendini
    // temizliyor ama BURADA yeniden çizdirecek biri gerekiyor -- yukarıdaki
    // yaw/sway eşikleri (satır ~1775/1804) sürekli dönüşte gereksiz
    // tekrar-boyamayı önlemek için var, fakat varsayılan 3B açılışta
    // sonraki eşiği aşan kareye kadar (dakikalar sürebilir) etiketler eski
    // (fontsuz ölçülmüş) konumunda kalırdı (2026-08-07 UI denetimi: sayfa
    // ilk açıldığında hiç tıklamadan çakışan etiketler). Eşiği bir kere
    // bypass edip zorla tazeliyoruz.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => paintPositions());
    }
  }

  function pullBack(fromX, fromY, toX, toY, dist) {
    const dx = toX - fromX, dy = toY - fromY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: toX - (dx / len) * dist, y: toY - (dy / len) * dist };
  }

  // Kenarlar düğümlerin EKRAN konumunu (px/py) kullanır; 2B'de bu zaten
  // x/y'nin aynısıdır, 3B'de ise projeksiyondan gelir.
  function edgePath(d) {
    const s = d.source, t = d.target;
    const sx = s.px != null ? s.px : s.x, sy = s.py != null ? s.py : s.y;
    const txp = t.px != null ? t.px : t.x, typ = t.py != null ? t.py : t.y;
    if (kenarYoluFn) return kenarYoluFn(d);
    const e = pullBack(sx, sy, txp, typ, radiusFor(t) + 2);
    return "M" + sx + "," + sy + "L" + e.x + "," + e.y;
  }

  function render() {
    if (currentDetailView === "sirlar") {
      if (currentDetailSirlarId) showSirlarEntry(currentDetailSirlarId);
      else if (currentDetailSirlarMerkez) showSirlarMerkez();
      else showSirlarOverview();
    }
    if (!labelSel) return;
    labelSel.text((d) => labelFor(d));
    if (currentDetailNode) showNodeDetail(currentDetailNode);
    else if (currentDetailEdge) showEdgeDetail(currentDetailEdge);
  }

  function registerOntologyCrossLinks(data) {
    data.nodes.forEach((n) => {
      registerCrossLinkTerm(n.name, "ontoloji", n.id, n.short);
    });
    notifyCrossLinkReady();
  }

  // registerEsmaCrossLinks / registerHalCrossLinks kaldırıldı (2026-08-05):
  // hiçbir yerden çağrılmıyorlardı -- cross-link kaydı artık tümüyle
  // capraz-baglanti-indeksi.json'dan geliyor. Ölü hâlleri, kaydın hâlâ
  // görünüm verilerinden beslendiği izlenimini veriyordu.

  // --- Cross-linking between insights ---
  const crossLinkTermsByLang = { tr: [], en: [], pt: [] };
  const crossLinkSummaries = new Map();
  const crossLinkListeners = [];
  const registeredVariantKeys = new Set();

  // --- Inline glossary hints: general vocabulary (e.g. "Meşşâî") that has
  // no node of its own on the site's concept map, so it can't become a real
  // cross-link -- just a dotted-underline span with a short definition on
  // hover/focus. Data-driven (data/ibn-arabi/sozluk-ipuclari.json) so new
  // terms can be added without touching this code.
  const glossaryTermsByLang = { tr: [], en: [], pt: [] };

  function registerGlossaryTerm(id, termDict, defDict) {
    let eklendi = false;
    ["tr", "en", "pt"].forEach((lang) => {
      const term = termDict && termDict[lang];
      const def = defDict && defDict[lang];
      if (!term || !def) return;
      const list = glossaryTermsByLang[lang];
      const i = list.findIndex((t) => t.id === id);
      const entry = { id, term, def, folded: foldForLang(lang, term) };
      if (i >= 0) {
        if (list[i].term === term && list[i].def === def) return;   // aynı kayıt: önbellek geçerli
        list[i] = entry;
      } else list.push(entry);
      eklendi = true;
    });
    if (eklendi) invalidateGlossifyCache();
  }

  // glossify()/linkify() render on essentially every paragraph on the site
  // (see call sites in futuhat.js, and every detail-panel field elsewhere).
  // The term lists only grow over the project's lifetime ("biriken parçalar"
  // -- see CLAUDE.md), so rebuilding the sorted array + compiled regex + a
  // linear .find() per match on EVERY call would get measurably slower as
  // the corpus grows. Cache the compiled regex + a term-lookup Map per
  // language, invalidated only when new terms register or the language
  // changes (I18n.getLang() picks the current cache bucket).
  let glossifyCacheByLang = {};
  function invalidateGlossifyCache() {
    glossifyCacheByLang = {};
  }
  function buildGlossifyCache(lang) {
    const terms = glossaryTermsByLang[lang];
    if (!terms || !terms.length) return { regex: null, byFoldedLower: new Map() };
    const sorted = terms.slice().sort((a, b) => b.folded.length - a.folded.length);
    const byFoldedLower = new Map();
    sorted.forEach((t) => {
      const key = t.folded.toLowerCase();
      if (!byFoldedLower.has(key)) byFoldedLower.set(key, t);
    });
    // Bakışlar alternasyonun dışında -- gerekçe buildLinkifyCache'te.
    const pattern = `(?<![\\p{L}])(?:${sorted.map((t) => escapeRegExp(t.folded)).join("|")})(?![\\p{L}])`;
    return { regex: new RegExp(pattern, "giu"), byFoldedLower };
  }
  function getGlossifyCache(lang) {
    if (!glossifyCacheByLang[lang]) glossifyCacheByLang[lang] = buildGlossifyCache(lang);
    return glossifyCacheByLang[lang];
  }

  // Ortak kaçış (2026-10-09): graph-utils.js escapeHtml aynı dört karakteri
  // kaçırıyor; yerel kopya kaldırıldı.
  function escapeHtmlAttr(s) { return window.DostGraphUtils.escapeHtml(s); }

  // Runs after linkify(), on its HTML output -- splits on existing tags so
  // it only ever touches plain-text segments, never a cross-link's own
  // content or attributes.
  function glossify(html) {
    if (!html) return html;
    const lang = I18n.getLang();
    const cache = getGlossifyCache(lang);
    if (!cache.regex) return html;
    const re = cache.regex;
    const parts = html.split(/(<[^>]+>)/);
    return parts
      .map((part) => {
        if (part.startsWith("<")) return part;
        const foldedPart = foldForLang(lang, part);
        let result = "";
        let lastIndex = 0;
        let m;
        re.lastIndex = 0;
        while ((m = re.exec(foldedPart))) {
          const start = m.index;
          const end = start + m[0].length;
          const matchLower = m[0].toLowerCase();
          const hit = cache.byFoldedLower.get(matchLower);
          if (!hit) continue;
          const original = part.slice(start, end);
          result += part.slice(lastIndex, start);
          result += `<span class="glossary-hint" tabindex="0" data-glossary-def="${escapeHtmlAttr(hit.def)}">${original}</span>`;
          lastIndex = end;
        }
        result += part.slice(lastIndex);
        return result;
      })
      .join("");
  }

  function onCrossLinkReady(fn) {
    crossLinkListeners.push(fn);
  }

  // Registration happens across several independently-loading datasets
  // (ontoloji/esma/hal here, terimler in its own module); consumers like
  // the Fütûhât Atlas may render before all of them have arrived, so we
  // let them subscribe and re-linkify once more terms become available.
  function notifyCrossLinkReady() {
    crossLinkListeners.slice().forEach((fn) => {
      try { fn(); } catch (e) {}
    });
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Turkish sentence-case lowercases ordinary nouns ("velâyet", "akıl") even
  // when they name a registered concept ("Velâyet", "Akıl") — a plain
  // case-insensitive regex still misses these because JS's default (non-
  // Turkish-locale) casing folds İ/I to i/ı differently than Turkish does.
  // Fold both sides through the same Turkish-specific rule before matching.
  // EN/PT keep exact-case matching -- folding those too would turn ordinary
  // lowercase words (many registered term names are plain English/Portuguese
  // nouns, e.g. "Patience", "Certainty") into unwanted auto-links wherever
  // they appear in running prose, not just where they name the concept.
  function foldForLang(lang, s) {
    return lang === "tr"
      ? s.replace(/İ/g, "i").replace(/I/g, "ı").toLowerCase()
      : s;
  }

  // Now that linkify() matches case-insensitively (see below), a handful of
  // older glossary titles are themselves plain, everyday English/Portuguese
  // words/phrases used as a gloss ("Reason", "Cause", "Species", "The Heart",
  // "Certainty", "The Essence", "The First", "The Last") rather than a
  // distinctive technical name. Registered as-is, these would auto-link
  // every ordinary occurrence of that common word throughout running prose,
  // regardless of whether that occurrence has anything to do with the
  // concept.
  //
  // 2026-07-28: bunlar önce TAMAMEN kayıt dışı bırakılıyordu; o da ters
  // yönde bir kayıp üretiyordu -- Türkçede "Akıl"/"zât" çapraz-link olurken
  // İngilizce sayfada aynı yerde hiç link olmuyordu (kullanıcı notu:
  // "türkçede olan bir çapraz link ingilizce sayfada ... linki unutulmuş").
  // Artık kayıttan düşürmek yerine `strict` işaretleniyor: EN/PT'de bu
  // adlar YALNIZCA kayıtlı hâliyle birebir yazıldığında ("The Light")
  // linklenir, cümle içinde sıradan kelime olarak geçtiğinde ("the light
  // of faith") linklenmez. Böylece hem yanlış-pozitifler kalkıyor hem de
  // metin gerçekten kavramı adlandırdığında link geri geliyor.
  const GENERIC_VARIANT_BLOCKLIST = new Set([
    "reason", "cause", "causa", "razão", "species", "espécie",
    "the one", "o um", "a um", "o único",
    "the first", "o primeiro", "a primeira",
    "the last", "o último", "a última",
    "the heart", "o coração",
    "certainty", "certeza",
    "the essence", "a essência",
    "difference", "diferença",
    "effect", "efeito",
    "the soul", "a alma",
    "the visible", "o visível",
    "struggle", "esforço",
    "majesty", "majestade",
    // "The Outward (al-Zahir)" ailesi: burada parantez içi TERİMİN KENDİSİ
    // (transliterasyon), çıplak hâli ise sıradan İngilizce/Portekizce. Yani
    // aşağıdaki parantez kuralının tersi bir şekil; elle listelemek gerekti.
    // Ölçülen zarar: "he stands in the outward of a good work" → al-Zahir.
    "the outward", "o exterior",
    "the inward", "o interior",
    "the limit", "o limite",
    "the rising-place", "o lugar do nascer",
  ]);

  // Esmâ adlarının parantez içi açıklamaları ("er-Rahmân" → "Ar-Rahman (The
  // All-Merciful)") ayrı bir eşleşme varyantı olarak kaydediliyor ve bunlar
  // EN/PT'de artikelle başlayan sıradan ifadeler oluyor ("The Light",
  // "O Senhor", "The Living"). Ölçtüğümüz somut zarar: bir kısımda EN
  // cross-link'lerin TAMAMI bu türden yanlış-pozitifti -- "the light of
  // faith" en-Nûr'a, "the great" el-Kebîr'e linkleniyordu.
  //
  // Kural bilerek DAR tutuldu: yalnız *parantez içinden gelen* ve artikelle
  // başlayan varyantlar strict. Bütün artikelli adları strict yapmayı
  // denedik ve fazla geniş çıktı -- "the veil"/"o véu" gibi bu külliyatta
  // gerçekten kavramı adlandıran, istenen linkler de sustu (ölçüldü:
  // beş kısımda EN link sayısı 3→0'a düştü).
  const ARTICLE_PREFIX_RE = /^(the|os|as|um|uma|o|a) /i;
  function isStrictVariant(lang, v, fromParen) {
    if (lang === "tr") return false;
    if (GENERIC_VARIANT_BLOCKLIST.has(v.toLowerCase())) return true;
    return !!fromParen && ARTICLE_PREFIX_RE.test(v);
  }

  // The >=4-char rule below exists to keep short, ordinary words from
  // becoming accidental links (see GENERIC_VARIANT_BLOCKLIST above for the
  // opposite problem). A few short titles are genuinely distinctive
  // technical/religious terms with no everyday-word collision risk in any
  // of the three languages -- without this allowlist they'd be unlinkable
  // from prose no matter how often they're used (confirmed zero cross-links
  // for "Amâ"/"Arş" across all 22 Fütûhât parts despite heavy use). "Zât"
  // joins them for the same reason -- its EN/PT names ("The Essence"/"A
  // Essência") are already generic-blocked above, so only the TR form needs
  // the allowlist to become linkable.
  const SHORT_TERM_ALLOWLIST = new Set(["amâ", "arş", "zât"]);

  function registerCrossLinkTerm(nameDict, view, id, summaryDict) {
    if (!nameDict) return;
    let eklendi = false;
    ["tr", "en", "pt"].forEach((lang) => {
      const term = nameDict[lang];
      if (!term) return;
      const variants = new Set();
      const parenVariants = new Set();   // hangi varyant parantez içinden geldi (bkz. isStrictVariant)
      if (term.length >= 4 || SHORT_TERM_ALLOWLIST.has(term.toLowerCase())) variants.add(term);
      // Many titles carry a parenthetical gloss ("Vâcib (Vâcibü'l-Vücûd)",
      // "Bedel (Ebdal)") or an Arabic article prefix ("el-Kâdir", "es-Semî'");
      // register the bare form AND the parenthetical's own content as
      // separate variants, so ordinary running prose using either name
      // ("Vâcib" or "Vâcibü'l-Vücûd", "Bedel" or "Ebdal") still resolves to
      // the same concept.
      const parenMatch = term.match(/^(.*?)\s*\((.*)\)\s*$/);
      const noParen = (parenMatch ? parenMatch[1] : term).trim();
      if (noParen.length >= 4 || SHORT_TERM_ALLOWLIST.has(noParen.toLowerCase())) variants.add(noParen);
      if (parenMatch) {
        const parenContent = parenMatch[2].trim();
        if (parenContent.length >= 4) { variants.add(parenContent); parenVariants.add(parenContent); }
      }
      const noPrefix = noParen.replace(/^(el|er|es)-/i, "").trim();
      if (noPrefix.length >= 4 || SHORT_TERM_ALLOWLIST.has(noPrefix.toLowerCase())) variants.add(noPrefix);
      variants.forEach((v) => {
        const strict = isStrictVariant(lang, v, parenVariants.has(v));
        // The same concept sometimes exists as a near-identical entry in two
        // datasets (e.g. "Zât"/"The Essence" is both ontology.json's "dhat"
        // and esma.json's "zat"). Registering both under the same name
        // would silently make one shadow the other with no clear winner
        // documented anywhere; keep only the first registration for a given
        // name so the choice is explicit and doesn't grow the match list
        // with an entry that could never actually be reached.
        const dedupeKey = lang + ":" + v.toLowerCase();
        if (registeredVariantKeys.has(dedupeKey)) return;
        registeredVariantKeys.add(dedupeKey);
        crossLinkTermsByLang[lang].push({ term: v, view, id, strict });
        eklendi = true;
      });
    });
    if (summaryDict) crossLinkSummaries.set(view + ":" + id, summaryDict);
    // Yalnız yeni bir varyant eklendiyse: aynı terimleri yeniden kaydetmek
    // (ör. Terimler her açılışta) önbelleği boşuna silip bir sonraki
    // linkify'da dev regex'i yeniden derletiyordu (2026-10-07: ~2 sn).
    if (eklendi) invalidateLinkifyCache();
  }

  // Same rationale/cache shape as glossify()'s cache above -- see comment there.
  let linkifyCacheByLang = {};
  function invalidateLinkifyCache() {
    linkifyCacheByLang = {};
  }
  function buildLinkifyCache(lang) {
    const terms = crossLinkTermsByLang[lang].map((t) => ({ ...t, folded: foldForLang(lang, t.term) }));
    terms.sort((a, b) => b.folded.length - a.folded.length);
    if (!terms.length) return { regex: null, byFoldedLower: new Map() };
    const byFoldedLower = new Map();
    terms.forEach((t) => {
      const key = t.folded.toLowerCase();
      if (!byFoldedLower.has(key)) byFoldedLower.set(key, t);
    });
    // Bakışlar alternasyonun DIŞINDA: her alternatife ayrı (?<!…)/(?!…)
    // koymak V8'de ilk exec'te ~1,5 sn (4x CPU'da ~9 sn) derleme demekti;
    // tek dış bakışla ~13 ms. Anlam aynı -- bir alternatif sonraki bakışta
    // düşerse motor sıradaki alternatifi dener, eskisi gibi.
    const pattern = `(?<![\\p{L}])(?:${terms.map((t) => escapeRegExp(t.folded)).join("|")})(?![\\p{L}])`;
    return { regex: new RegExp(pattern, "giu"), byFoldedLower };
  }
  function getLinkifyCache(lang) {
    if (!linkifyCacheByLang[lang]) linkifyCacheByLang[lang] = buildLinkifyCache(lang);
    return linkifyCacheByLang[lang];
  }

  function getCrossLinkSummary(view, id) {
    const dict = crossLinkSummaries.get(view + ":" + id);
    return dict ? I18n.pick3(dict) : null;
  }

  function linkify(text, excludeView, excludeId) {
    if (!text) return text;
    const lang = I18n.getLang();
    const cache = getLinkifyCache(lang);
    if (!cache.regex) return glossify(text);
    // Case-insensitive ("i" flag) for every language, not just Turkish's own
    // fold: English/Portuguese running prose commonly lowercases a technical
    // term mid-sentence ("the pole of the age") even though the glossary
    // registers it title-case ("Pole") for display -- without this, those
    // terms would only ever link when capitalized exactly as registered.
    const re = cache.regex;
    re.lastIndex = 0;
    const foldedText = foldForLang(lang, text);
    const seen = new Set();
    let result = "";
    let lastIndex = 0;
    let m;
    while ((m = re.exec(foldedText))) {
      const start = m.index;
      const end = start + m[0].length;
      const matchLower = m[0].toLowerCase();
      const hit = cache.byFoldedLower.get(matchLower);
      if (!hit) continue;
      const original = text.slice(start, end);
      // `strict` varyantlar (EN/PT'de artikelle başlayan ya da sıradan
      // kelime olan adlar) yalnız birebir yazıldığında linklenir --
      // "The Light" evet, "the light of faith" hayır. Bkz. isStrictVariant().
      if (hit.strict && original !== hit.term) {
        result += text.slice(lastIndex, start) + original;
        lastIndex = end;
        continue;
      }
      // excludeView/excludeId used to be filtered out of the term list
      // before building the regex (a node never links to its own detail
      // page); the shared cache now matches against ALL terms and skips
      // creating the link here instead. Equivalent in every case except one
      // rare corner: if the excluded term is itself a longer match that
      // fully contains a shorter, different registered term at the same
      // starting position, that inner term is no longer picked up (the
      // longer alternative wins and gets suppressed, rather than the
      // shorter one being tried) -- accepted as negligible given how rare a
      // self-referencing name containing another exact term is in practice.
      const isSelf = hit.view === excludeView && hit.id === excludeId;
      result += text.slice(lastIndex, start);
      if (isSelf) {
        result += original;
      } else {
        const key = hit.view + ":" + hit.id;
        if (seen.has(key)) {
          result += original;
        } else {
          seen.add(key);
          result += `<a href="${ROUTE_BASE}/${hit.view}/${hit.id}" class="cross-link" data-view="${hit.view}" data-id="${hit.id}">${original}</a>`;
        }
      }
      lastIndex = end;
    }
    result += text.slice(lastIndex);
    return glossify(result);
  }

  window.__dostCrossLink = {
    linkify,
    register: registerCrossLinkTerm,
    getSummary: getCrossLinkSummary,
    onReady: onCrossLinkReady,
    notifyReady: notifyCrossLinkReady,
  };

  const SIRLAR_THEME_LABELS = {
    "suskunluk": { tr: "Suskunluk ve Perdeleme", en: "Silence and Veiling", pt: "Silêncio e Velamento" },
    "peygamber-kissalari": { tr: "Peygamber Kıssalarındaki Sırlar", en: "Secrets in the Prophets' Stories", pt: "Segredos nas Histórias dos Profetas" },
    "kader-tevhid": { tr: "Kader, Tevhid, Tenzih-Teşbih", en: "Destiny, Divine Unity, Tanzih-Tashbih", pt: "Destino, Unidade Divina, Tanzih-Tashbih" },
    "dil-ve-kelime": { tr: "Dilde ve Kelimede Gizlenen Sırlar", en: "Secrets Hidden in Language and Words", pt: "Segredos Ocultos na Língua e nas Palavras" },
    "insan-i-kamil": { tr: "İnsan-ı Kâmil ve Velâyet", en: "The Perfect Human and Sainthood", pt: "O Ser Humano Perfeito e a Santidade" },
  };

  // Sırlar grafiğinin merkez düğümüne (kök) tıklanınca, tek bir sırra değil,
  // bölümün "işaret eder, açıklamaz" duruşuna dair bir genel bakış gösterilir
  // -- Sorular'ın kategori özetine, Terimler'in "Tümü" görünümüne benzer şekilde.
  function showSirlarOverview() {
    currentDetailView = "sirlar";
    currentDetailSirlarId = null;
    currentDetailSirlarMerkez = false;
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "İşaret Edilen, Açıklanmayan", en: "Pointed To, Not Explained", pt: "Apontado, Não Explicado" })}</p>
      <h2 class="detail-title">${tt({ tr: "Sırlar", en: "Mysteries", pt: "Mistérios" })}</h2>
      <p class="detail-resonance">${sirlarData ? I18n.pick3(sirlarData.intro) : ""}</p>
      ${sirlarGestureDiagramHtml()}
    `;
    detailPanel.hidden = false;
  }
  window.__sirlarShowOverview = showSirlarOverview;

  // Bir sır düğümüne tıklanınca (grafikten veya deep-link'ten), diğer bütün
  // görünümlerle (Ontoloji/Esmâ/Hâller/Sorular) tutarlı şekilde tek, odaklı
  // bir kart gösterilir -- eski, bütün sırları tek accordion listesinde
  // döken görünüm yerine.
  // Bir sır kaydı, kısım-kısım okuma turlarımızın birinden çıktıysa, o
  // kısma geri götüren bir bağ veriyoruz -- kayıt böylece havada durmuyor,
  // hangi okumada karşımıza çıktığı görülebiliyor.
  function sirlarOkumaHtml(entry) {
    if (!entry.okuma || !entry.okuma.view || !entry.okuma.id) return "";
    const href = `${ROUTE_BASE}/${entry.okuma.view}/${entry.okuma.id}`;
    const label = tt({
      tr: "Bu satırları hangi okumada bulduk",
      en: "The reading round where we found these lines",
      pt: "A ronda de leitura em que encontrámos estas linhas",
    });
    return `<a class="cross-link" href="${href}" data-view="${entry.okuma.view}" data-id="${entry.okuma.id}">${label} →</a>`;
  }

  // "Bağımsız kaynak" rozeti (2026-08-02). `iliskiliKayitlar`, aynı motifin
  // başka kitaplarda bağımsız olarak tekrar ettiğini gösteren sirlar
  // kayıtlarının id'lerini taşır -- ilke 3'ün ("parçaları biriktir, bütüne
  // dair fikir üret") somut bir eşiği: iddia değil, SAYI (kaç bağımsız
  // kaynakta göründüğü). "Kanıtlandı" demiyoruz, yalnız kaç kez bağımsız
  // olarak karşımıza çıktığını gösteriyoruz.
  function bagimsizKaynakBadgeHtml(entry) {
    const ids = entry.iliskiliKayitlar;
    if (!ids || !ids.length || !sirlarData) return "";
    const siblings = ids.map((id) => sirlarData.entries.find((e) => e.id === id)).filter(Boolean);
    if (!siblings.length) return "";
    const total = siblings.length + 1;
    const title = tt({
      tr: `Bu motifi ${total} bağımsız kaynakta bağımsız olarak buluyoruz`,
      en: `We find this motif independently in ${total} independent sources`,
      pt: `Encontramos este motivo de forma independente em ${total} fontes independentes`,
    });
    const links = siblings.map((s) => {
      const href = `${ROUTE_BASE}/sirlar/${s.id}`;
      return `<a class="cross-link cross-link--kucuk" href="${href}" data-view="sirlar" data-id="${s.id}">${volumeLabel(s.volume)}</a>`;
    }).join("");
    return `<div class="detail-block detail-block--bagimsiz-kaynak">
      <p class="detail-eyebrow">${title}</p>
      <div class="bagimsiz-kaynak__list">${links}</div>
      ${confidenceNoteHtml(entry.confidence)}
    </div>`;
  }

  // Sırlar grafiğinin merkezi artık bölümün adını değil, okumalarımızın
  // bizi getirdiği "sırların sırrı" önerisini taşıyor. Panelde bilerek bir
  // sonuç gibi değil, gerekçesi ve çekinceleriyle birlikte duruyor.
  // "Perde nedir?" halkası: merkez panelinin altında duran, üç iç içe
  // halkadan oluşan bir şema. Kayıtlar dıştan içe doğru okunur -- dışta
  // perde araya giren başka bir şey, ortada iki taraftan birinin kendisi,
  // merkezde örten ile örtülen aynı. Sıra bir zaman sırası DEĞİL; bunu
  // veri tarafındaki `caption`/`cekince` metinleri de açıkça söylüyor.
  //
  // Neden yalnız 16 kayıt: 2026-07-28 denetiminde (research/anlayis-evrimi/
  // PERDE_DENETIM.md) sayfadaki 30 perde kaydının üç ayrı soruya cevap
  // verdiği görüldü. Tek eksene dizilebilen yalnız "perde nedir" grubu.
  const HALKA_R = [148, 96, 46];   // dış / orta / merkez yarıçapları
  const HALKA_VB = 340;            // çizim alanının kenarı (kare)
  const HALKA_BUYUK = 1.85;        // lightbox'taki büyütme katsayısı
  // Etiket payı (2026-07-29). Dış halkanın etiketi merkezden 168 birim
  // uzağa yazılıyor; 340'lık kare viewBox'ta bu tam kenara denk geliyordu
  // ve en sağdaki etiket (`text-anchor:start`) kutunun DIŞINA taşıyordu.
  // Eskiden bu `overflow: visible` ile "çözülmüştü" -- yani etiket
  // kırpılmıyordu ama lightbox'ta yanındaki anahtar listesinin üstüne
  // biniyordu (kullanıcı bildirimi: 417 ile 418 iç içe girmiş görünüyor).
  // Doğru çözümü viewBox'a pay eklemek: etiketler kutunun İÇİNDE kalıyor,
  // hiçbir şeyin üstüne binemiyor.
  const HALKA_PAD_X = 46;
  const HALKA_PAD_Y = 12;

  // buyuk=true: lightbox sürümü. Yalnız ölçek değişiyor -- etiketler yine
  // sadece bölüm numarası. Kayıt adlarını halkanın üstüne radyal olarak
  // yazmayı denedik: TR/EN/PT'de uzunluklar çok farklı ve PT'de etiketler
  // komşu halkanın çizgisini kesiyordu. Onun yerine büyük sürümün altına
  // tam bir anahtar listesi konuyor (halkaLightbox).
  function halkaSvg(halka, buyuk) {
    const k = buyuk ? HALKA_BUYUK : 1;
    const VBW = (HALKA_VB + 2 * HALKA_PAD_X) * k;
    const VBH = (HALKA_VB + 2 * HALKA_PAD_Y) * k;
    const cx = VBW / 2;
    const cy = VBH / 2;
    const rings = halka.rings || [];
    let out = "";

    // Halkalar: dıştan içe, en dıştaki kesik çizgili (sınırı en belirsiz olan).
    rings.forEach((ring, ri) => {
      const cls = ri === 0 ? "sir-halka__ring sir-halka__ring--dashed" : "sir-halka__ring";
      out += `<circle class="${cls}" cx="${cx}" cy="${cy}" r="${(HALKA_R[ri] * k).toFixed(1)}"/>`;
    });

    // Merkez dolgusu -- Zât/kök ile aynı ailede dursun diye vurgulu.
    out += `<circle class="sir-halka__core" cx="${cx}" cy="${cy}" r="${((HALKA_R[2] - 6) * k).toFixed(1)}"/>`;

    rings.forEach((ring, ri) => {
      const r = HALKA_R[ri] * k;
      const n = ring.entries.length;
      ring.entries.forEach((e, i) => {
        // -90°'den başlayıp saat yönünde: okuma üstten başlasın.
        const a = (-Math.PI / 2) + (i * 2 * Math.PI) / n;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        const label = I18n.pick3(e.label);
        const bolumAdi = tt({ tr: `${e.bolum}. Bölüm`, en: `Chapter ${e.bolum}`, pt: `Capítulo ${e.bolum}` });
        const title = `${bolumAdi} — ${label}\n${I18n.pick3(e.quote)}`;
        // Etiket, düğümün merkezden dışa doğru olan tarafına yazılır ki
        // iç halkaların etiketleri dış halkanın üstüne binmesin.
        const off = (ri === 0 ? 20 : 17) * k;
        const lx = cx + (r + off) * Math.cos(a);
        const ly = cy + (r + off) * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.25 ? "middle" : (Math.cos(a) > 0 ? "start" : "end");
        // Küçük sürüm bir <button> içinde duruyor; düğümleri de odaklanabilir
        // yapmak butonun içine etkileşimli içerik koymak olurdu (geçersiz HTML
        // ve klavyede tuzak). Orada odak butonun kendisinde, düğümler yalnız
        // ipucu taşıyor; büyük sürümde ise tek tek gezilebiliyorlar.
        out += `<g class="sir-halka__node sir-halka__node--r${ri}"${buyuk ? ' tabindex="0" role="listitem"' : ""}
                   aria-label="${escapeHtmlAttr(title.replace(/\n/g, " — "))}">
            <title>${escapeHtmlAttr(title)}</title>
            <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${((ri === 2 ? 9 : 7) * k).toFixed(1)}"/>
            <text x="${lx.toFixed(1)}" y="${(ly + 3.5 * k).toFixed(1)}" text-anchor="${anchor}"
                  style="font-size:${(10 * k).toFixed(1)}px">${escapeHtmlAttr(e.bolum)}</text>
          </g>`;
      });
    });

    const merkezLabel = rings[2] ? I18n.pick3(rings[2].label) : "";
    return `<svg class="sir-halka__svg${buyuk ? " sir-halka__svg--buyuk" : ""}" viewBox="0 0 ${VBW} ${VBH}" role="list"
                 aria-label="${escapeHtmlAttr(merkezLabel)}">${out}</svg>`;
  }

  // Lightbox: büyük halka + altında tam anahtar listesi. Küçük sürümde
  // düğümlerin yanında yalnız bölüm numarası var; burada her numaranın
  // karşılığı ve alıntısı da okunabiliyor.
  function halkaLightboxHtml(halka) {
    const key = halka.rings.map((ring, ri) => `
      <div class="sir-halka__key-group sir-halka__key-group--r${ri}">
        <h4>${escapeHtmlAttr(I18n.pick3(ring.label))}
          <span class="sir-halka__legend-count">${ring.entries.length}</span></h4>
        <ul>${ring.entries.map((e) => `
          <li><span class="sir-halka__key-no">${escapeHtmlAttr(e.bolum)}</span>
            <span class="sir-halka__key-label">${escapeHtmlAttr(I18n.pick3(e.label))}</span>
            <em>${escapeHtmlAttr(I18n.pick3(e.quote))}</em></li>`).join("")}</ul>
      </div>`).join("");
    // Kendi sarmalayıcısı şart: `.cizim-lightbox__svg-wrap` bir flex SATIRI
    // ve iki kardeşi (svg + anahtar listesi) yan yana diziyordu -- tablet
    // genişliğinde liste sıkışıp metni kırpılıyordu (2026-07-29). Bu
    // sarmalayıcı onları tasarlandığı gibi alt alta koyuyor.
    return `<div class="sir-halka__lightbox">${halkaSvg(halka, true)}
        <div class="sir-halka__key">${key}</div></div>`;
  }

  function openHalkaLightbox() {
    const halka = sirlarData && sirlarData.merkez && sirlarData.merkez.halka;
    if (!halka || !window.DostLightbox) return;
    window.dostTrack && window.dostTrack("sema_acildi", { type: "perde-halkasi" });
    window.DostLightbox.open({
      closeLabel: tt({ tr: "Kapat", en: "Close", pt: "Fechar" }),
      name: tt({ tr: "Perde nedir? — on yedi kayıt", en: "What is the veil? — seventeen records", pt: "O que é o véu? — dezassete registos" }),
      svgHtml: halkaLightboxHtml(halka),
      caption: tt({
        tr: "Halkalar dıştan içe okunur. Sıra bir zaman sırası değil.",
        en: "The rings are read from the outside in. The order is not chronological.",
        pt: "Os anéis leem-se de fora para dentro. A ordem não é cronológica.",
      }),
    });
  }

  // Küçük halkaya tıklama/Enter: büyük sürümü aç. Düğümlerin kendi
  // odaklanabilirliği korunuyor -- oradan Enter da lightbox'ı açıyor,
  // çünkü asıl istenen şey büyük görüntü.
  document.addEventListener("click", (e) => {
    if (e.target.closest && e.target.closest(".sir-halka__figure")) openHalkaLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const fig = e.target.closest && e.target.closest(".sir-halka__figure");
    if (!fig) return;
    e.preventDefault();
    openHalkaLightbox();
  });

  function halkaHtml(halka) {
    if (!halka || !halka.rings || halka.rings.length !== 3) return "";
    const legend = halka.rings.map((ring, ri) => `
      <li class="sir-halka__legend-item sir-halka__legend-item--r${ri}">
        <strong>${I18n.pick3(ring.label)}</strong>
        <span class="sir-halka__legend-count">${ring.entries.length}</span>
        <p>${linkify(I18n.pick3(ring.note), null, null)}</p>
      </li>`).join("");
    return `
      <div class="detail-block sir-halka">
        <p class="detail-eyebrow">${tt({ tr: "Perde nedir? — on yedi kaydın halkası", en: "What is the veil? — a ring of seventeen records", pt: "O que é o véu? — um anel de dezassete registos" })}</p>
        <p class="sir-halka__caption">${linkify(I18n.pick3(halka.caption), null, null)}</p>
        <button type="button" class="sir-halka__figure"
                aria-label="${escapeHtmlAttr(tt({ tr: "Halkayı büyüt", en: "Enlarge the ring", pt: "Ampliar o anel" }))}">
          ${halkaSvg(halka)}
          <span class="sir-halka__zoom-hint">${tt({ tr: "Büyütmek için dokun", en: "Tap to enlarge", pt: "Toque para ampliar" })}</span>
        </button>
        <ul class="sir-halka__legend">${legend}</ul>
        <p class="sir-halka__cekince">${linkify(I18n.pick3(halka.cekince), null, null)}</p>
      </div>`;
  }

  function showSirlarMerkez() {
    if (!sirlarData || !sirlarData.merkez) return;
    const m = sirlarData.merkez;
    currentDetailView = "sirlar";
    currentDetailSirlarId = null;
    currentDetailSirlarMerkez = true;
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Sırların sırrı", en: "The secret of the secrets", pt: "O segredo dos segredos" })}</p>
      <h2 class="detail-title">${I18n.pick3(m.topic)}</h2>
      <div class="detail-block detail-block--sir">
        <blockquote>${I18n.pick3(m.quote)}</blockquote>
        <p>${linkify(I18n.pick3(m.note), null, null)}</p>
        <cite>${m.source}</cite>
      </div>
      ${halkaHtml(m.halka)}
    `;
    detailPanel.hidden = false;
  }
  window.__sirlarShowMerkez = showSirlarMerkez;

  function showSirlarEntry(id) {
    if (!sirlarData) return;
    const entry = sirlarData.entries.find((e) => e.id === id);
    if (!entry) return;
    currentDetailView = "sirlar";
    currentDetailSirlarId = id;
    currentDetailSirlarMerkez = false;
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt(SIRLAR_THEME_LABELS[entry.theme] || { tr: "Sırlar", en: "Mysteries", pt: "Mistérios" })}</p>
      <h2 class="detail-title">${volumeLabel(entry.volume)} — ${I18n.pick3(entry.topic)}</h2>
      <div class="detail-block detail-block--sir">
        <blockquote>${I18n.pick3(entry.quote)}</blockquote>
        <p>${linkify(I18n.pick3(entry.note), null, null)}</p>
        <cite>${entry.source}</cite>
      </div>
      ${bagimsizKaynakBadgeHtml(entry)}
      <div id="sir-derin-icerik"></div>
      ${sirlarSorularHtml(entry)}
      ${sirlarOkumaHtml(entry)}
    `;
    detailPanel.hidden = false;
    derinIcerikCiz(id);
    // Köprü verisi geç gelirse paneli tazele.
    if (!sirlarSorularVeri) sirlarSorularYukle().then((k) => {
      if (k && currentDetailSirlarId === id) showSirlarEntry(id);
    });
  }

  // KADEMELİ AÇILIM (G15). data/icerik/<id>.json bir sır kaydının DERİN
  // katmanı: aynı sırrın üç yoğunlukta yazılmış hâli (ozet/giris/govde).
  // Her sır için yok -- şu an yalnız üçünde var, gerisi elle yazılacak.
  //
  // Önce _index.json okunuyor: onsuz tek seçenek her sır tıklamasında bir
  // fetch deneyip 404 yutmak olurdu (99 kayıt, konsol dolusu 404).
  let derinIndeks = null;
  let derinIndeksSozu = null;
  const derinOnbellek = new Map();

  function derinIndeksYukle() {
    if (derinIndeks) return Promise.resolve(derinIndeks);
    if (!derinIndeksSozu) {
      derinIndeksSozu = window.DostGraphUtils.fetchJson("data/icerik/_index.json")
        .then((d) => { derinIndeks = new Set((d && d.idler) || []); return derinIndeks; })
        .catch(() => { derinIndeks = new Set(); return derinIndeks; });
    }
    return derinIndeksSozu;
  }

  function derinIcerikCiz(id) {
    derinIndeksYukle().then((indeks) => {
      if (!indeks.has(id) || currentDetailSirlarId !== id) return;
      const yerlestir = (kayit) => {
        // Panel bu arada başka bir kayda geçmiş olabilir.
        if (!kayit || currentDetailSirlarId !== id) return;
        const kap = document.getElementById("sir-derin-icerik");
        if (!kap || !window.__dostKademe) return;
        kap.innerHTML = `<p class="detail-eyebrow detail-eyebrow--section">${tt({
          tr: "Daha yakından", en: "A closer look", pt: "Mais de perto" })}</p>`;
        window.__dostKademe.kur(kap, { ozet: kayit.ozet, giris: kayit.giris, govde: kayit.govde });
      };
      if (derinOnbellek.has(id)) { yerlestir(derinOnbellek.get(id)); return; }
      window.DostGraphUtils.fetchJson(`data/icerik/${id}.json`)
        .then((kayit) => { derinOnbellek.set(id, kayit); yerlestir(kayit); })
        .catch(() => { /* kayıt okunamadıysa panel eskisi gibi kalsın */ });
    });
  }

  // SIRLAR -> SORULAR köprüsü (2026-08-03). sorular.js'teki aynı bağların
  // ters yönü: bir sır kaydının hangi açık soruya dokunduğu. Bağlar ELLE
  // kuruldu ve gerekçesiyle birlikte duruyor -- bkz.
  // data/ibn-arabi/sirlar-sorular.json'un `not` alanı.
  let sirlarSorularVeri = null;
  const soruBaslik = new Map();
  function sirlarSorularYukle() {
    if (sirlarSorularVeri) return Promise.resolve(sirlarSorularVeri);
    return Promise.all([
      window.DostGraphUtils.fetchJson("data/ibn-arabi/sirlar-sorular.json"),
      window.DostGraphUtils.fetchJson("data/ibn-arabi/sorular.json"),
    ]).then(([k, sor]) => {
      sirlarSorularVeri = k;
      (sor.categories || []).forEach((c) =>
        (c.questions || []).forEach((q) => soruBaslik.set(q.id, q.question)));
      return k;
    }).catch(() => null);
  }
  function sirlarSorularHtml(entry) {
    if (!sirlarSorularVeri) return "";
    const bag = (sirlarSorularVeri.baglar || []).filter((b) => b.sir === entry.id);
    if (!bag.length) return "";
    const base = window.__dostRouteBase || "";
    const satir = bag.map((b) => {
      const q = soruBaslik.get(b.soru);
      if (!q) return "";
      return `<a class="sorular-sir" href="${base}/sorular/${b.soru}" data-view="sorular" data-id="${b.soru}">
        <span class="sorular-sir__baslik">${I18n.pick3(q)}</span>
        <span class="sorular-sir__neden">${I18n.pick3(b.neden)}</span>${confidenceInlineHtml(b.confidence)}</a>`;
    }).join("");
    if (!satir) return "";
    return `<div class="sorular-sirlar">
      <p class="detail-eyebrow detail-eyebrow--section">${tt({
        tr: "Bu sırrın dokunduğu açık sorular",
        en: "Open questions this mystery touches",
        pt: "Perguntas abertas que este mistério toca" })}</p>
      <p class="sorular-sirlar__not">${tt({
        tr: "Bu bağları biz kurduk.",
        en: "We made these links ourselves.",
        pt: "Fizemos estes vínculos nós mesmos." })}</p>
      ${satir}</div>`;
  }

  const RADIUS_BY_ID = {
    // Bu grafiğin kendi otomatik-yakınlaştırma ölçeği (~0.96) esma.js'in
    // ölçeğinden (~0.61) farklı olduğu için, esma.js/esma-3d.js'teki Zât
    // düğümünün ham r değeri kasıtlı olarak burada değil (54/65) --
    // ekranda EŞİT piksel boyutu getBoundingClientRect ile ampirik olarak
    // eşitlendi, ham değerler eşit olduğu için değil (bkz. esma.js
    // radiusFor()'daki not).
    "dhat": 34,
    "sifat-asma": 15,
    "ayan-sabite": 14,
    "tecelli": 14,
    "insan-i-kamil": 18,
    "kalp": 16,
  };

  function radiusFor(d) {
    return RADIUS_BY_ID[d.id] || 13;
  }

  const LAYER_COLOR = window.DostGraphUtils.LAYER_COLOR;
  const LAYER_COLOR_DARK = window.DostGraphUtils.LAYER_COLOR_DARK;

  function isDark() {
    return window.DostGraphUtils.isDark();
  }

  function colorFor(d) {
    if (d.id === "dhat") return window.DostGraphUtils.ZAT_FILL;
    if (d.id === "insan-i-kamil") return getVar("--series-daphne");
    if (d.id === "kalp") return getVar("--series-theme");
    const ramp = isDark() ? LAYER_COLOR_DARK : LAYER_COLOR;
    return ramp[Math.min(d.layer, ramp.length - 1)];
  }

  function getVar(name) {
    return window.DostGraphUtils.getVar(name);
  }

  function labelFor(d) {
    return I18n.pick3(d.name);
  }

  function highlight(d) {
    if (!d) {
      pathSel.classed("link--highlight", false);
      nodeSel.style("opacity", 1);
      return;
    }
    const connected = new Set([d.id]);
    pathSel.each((l) => {
      if (l.source.id === d.id) connected.add(l.target.id);
      if (l.target.id === d.id) connected.add(l.source.id);
    });
    pathSel.classed("link--highlight", (l) => l.source.id === d.id || l.target.id === d.id);
    nodeSel.style("opacity", (n) => (connected.has(n.id) ? 1 : 0.3));
  }

  function highlightEdge(d) {
    pathSel.classed("link--highlight", (l) => l === d);
    nodeSel.style("opacity", (n) => (n.id === d.source.id || n.id === d.target.id ? 1 : 0.3));
  }

  function showTooltip(d, event) {
    if (!tooltip) return;
    const short = I18n.pick3(d.short);
    tooltip.innerHTML = `
      <div class="node-hover-tip__title">${I18n.pick3(d.name)}</div>
      ${short ? `<div class="node-hover-tip__short">${short}</div>` : ""}
    `;
    tooltip.hidden = false;
    moveTooltip(event);
  }

  // Kenar önizlemesi (#10): tıklamayla açılan kenar panelinin küçültülmüş
  // hâli -- ilişkinin adı, iki ucu, gerekçesinin ilk cümlesi ve (kesin
  // saymadığımız yerlerde) güven etiketimiz. Odakla da açılıyor.
  function edgeConfidenceText(c) {
    if (!c || c === "Yüksek") return "";
    const label = CONFIDENCE_LABEL[c] || { tr: c, en: c, pt: c };
    return tt({ tr: "Güvenimiz: ", en: "Our confidence: ", pt: "Nossa confiança: " }) + tt(label);
  }

  function showEdgeTooltip(l, event) {
    if (!tooltip) return;
    tooltip.innerHTML = window.DostGraphUtils.edgeReasonHtml({
      title: I18n.pick3(l.source.name) + " → " + I18n.pick3(l.target.name),
      kindLabel: I18n.pick3(l.relation),
      reason: I18n.pick3(l.nature),
      confidence: edgeConfidenceText(l.confidence),
    });
    tooltip.hidden = false;
    if (event && typeof event.clientX === "number") moveTooltip(event);
    else positionTooltipOnEdge(l);
  }

  // Klavyeyle gelindiğinde imleç konumu yok; ipucu kenarın orta noktasına
  // konuyor (SVG koordinatı -> ekran koordinatı, zoom/eğim dahil).
  function positionTooltipOnEdge(l) {
    const pathNode = pathSel && pathSel.nodes().find((n) => d3.select(n).datum() === l);
    if (!pathNode) return;
    const box = pathNode.getBoundingClientRect();
    moveTooltip({ clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 });
  }

  function edgeAriaLabel(l) {
    return I18n.pick3(l.source.name) + " → " + I18n.pick3(l.target.name)
      + " — " + I18n.pick3(l.relation);
  }

  function moveTooltip(event) {
    window.DostGraphUtils.moveTooltip(tooltip, wrapEl, event);
  }

  function hideTooltip() {
    window.DostGraphUtils.hideTooltip(tooltip);
  }

  let currentDetailNode = null;
  let currentDetailEdge = null;
  let currentDetailView = null;
  let currentDetailSirlarId = null;
  // Merkez paneli açıkken dil değişirse yeniden çizilebilsin diye.
  let currentDetailSirlarMerkez = false;

  // Esmâ/Hâller/Sorular/Sırlar'ın hepsi bir düğüme gidildiğinde ekranı
  // ona doğru yumuşakça kaydırıyor (reduceMotion'a duyarlı); Ontoloji --
  // sitenin en çok kullanılan görünümü -- bu tutarlılıktan yoksundu,
  // düğüme tıklamak sadece detay panelini açıyordu. Mevcut yakınlaştırma
  // seviyesini koruyarak sadece merkezi düğüme kaydırıyor (diğer
  // görünümlerin "bir kutuya sığdır" davranışının aksine, burada tek bir
  // nokta var, sığdırılacak bir kutu değil).
  function panToNode(d) {
    const oz = window.__ontologyZoom;
    if (!oz || typeof d.tx !== "number" || typeof d.ty !== "number") return;
    const svgEl = oz.svg.node();
    // Gizli (mobil liste kipi) SVG'de kamera taşınmaz: 0 genişlikte
    // d3-zoom geçişi NaN üretiyordu (karşılamadan bir uç seçilince ölçüldü).
    if (!svgEl.clientWidth) return;
    const width = svgEl.clientWidth || 800;
    const height = svgEl.clientHeight || 600;
    const currentScale = d3.zoomTransform(svgEl).k;
    // 3B'de düğüm hedef konumunda (tx/ty) değil, projeksiyonun verdiği
    // ekran konumundadır -- oraya odaklan.
    const in3d = window.__ontologyApp && window.__ontologyApp.is3d && window.__ontologyApp.is3d();
    const fx = in3d && typeof d.px === "number" ? d.px : d.tx;
    const fy = in3d && typeof d.py === "number" ? d.py : d.ty;
    const transform = d3.zoomIdentity
      .translate(width / 2 - currentScale * fx, height / 2 - currentScale * fy)
      .scale(currentScale);
    const sel = reduceMotion ? oz.svg : oz.svg.transition().duration(400);
    sel.call(oz.zoom.transform, transform);
  }

  function onNodeClick(d) {
    window.dostTrack && window.dostTrack("bilgi_grafi_node_tiklandi", { id: d.id });
    currentDetailNode = d;
    currentDetailEdge = null;
    currentDetailView = null;
    showNodeDetail(d);
    updateHash("ontoloji", d.id);
    panToNode(d);
    dugumDavranisi(d);
  }

  // ---------------------------------------------------------------------
  // ANLAM TAŞIYAN ANİMASYON (#2, 2026-08-03)
  //
  // GORSEL_DIL.md: "kavramı resmetme, onun davranışını resmet." Bu ilke
  // bugüne kadar tek tek sahnelerde (ayna, perde, iki mertebe) uygulanmıştı;
  // ana grafiğin KENDİ etkileşiminde uygulanmamıştı: her düğüme tıklamak
  // aynı şeyi yapıyordu (panel açılır, kamera kayar), oysa bu düğümlerin
  // hepsi FARKLI şeyler yapan kavramlar.
  //
  // Aşağıdaki beş davranışın hiçbiri süs değil; her biri o düğümün kendi
  // tanımından çıkıyor ve sitede zaten yazılı olan bir kenar/ilişki türünü
  // hareket olarak gösteriyor:
  //   dhat          -> tecellî: ışık Zât'tan bütün mertebelere yayılıyor
  //                   (descent kenarları, tenezzül sırasıyla)
  //   kalp          -> rücû: aynı yol TERS yönde, kalpten Zât'a
  //                   (ontology.json'daki `return` kenarı: kalp -> dhat)
  //   insan-i-kamil -> cem': üç âlemin ışığı onda toplanıyor
  //                   (üç `gather` kenarı)
  //   teceddud      -> halk-ı cedîd: bütün düğümler bir an sönüp yeniden
  //                   yanıyor -- âlem her an yeniden yaratılıyor
  //   perde         -> perdelenme: sahne bir an bulanıp açılıyor
  //
  // reduced-motion'da HİÇBİRİ çalışmaz (taklit de edilmez).
  const DUGUM_DAVRANISI = {
    dhat: "yayil",
    kalp: "rucu",
    "insan-i-kamil": "topla",
    teceddud: "teceddud",
    perde: "perde",
  };
  let davranisTimer = null;

  function dugumDavranisi(d) {
    if (reduceMotion || !pathSel || !nodeSel) return;
    const tur = DUGUM_DAVRANISI[d.id];
    if (!tur) return;
    if (davranisTimer) { clearTimeout(davranisTimer); davranisTimer = null; }
    if (tur === "teceddud") return teceddudEt();
    if (tur === "perde") return perdelen();
    // Yayılmanın görülebilmesi için bütün harita ekranda olmalı; tıklamanın
    // olağan yakınlaşması (panToNode) sahneyi ekran dışında bırakıyordu.
    // Kamera oturduktan SONRA ışık yola çıkıyor.
    if (window.__ontologyZoom && window.__ontologyZoom.fit) window.__ontologyZoom.fit(true);
    davranisTimer = setTimeout(() => yayilimEt(d.id, tur), reduceMotion ? 0 : 540);
  }

  // Kenar boyunca ilerleyen bir ışık. Yolun kendi geometrisini
  // (getPointAtLength) izliyor -- düz bir çizgi değil, kenarın gerçek yayı.
  function kivilcim(pathNode, gecikme, sure, ters) {
    const uzunluk = pathNode.getTotalLength ? pathNode.getTotalLength() : 0;
    if (!uzunluk) return;
    const parent = pathNode.parentNode;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("class", "onto-kivilcim");
    c.setAttribute("r", "4.5");
    c.setAttribute("opacity", "0");
    parent.appendChild(c);
    const bas = performance.now() + gecikme;
    function adim(t) {
      const p = (t - bas) / sure;
      if (p < 0) { requestAnimationFrame(adim); return; }
      if (p >= 1) { c.remove(); return; }
      const nokta = pathNode.getPointAtLength((ters ? 1 - p : p) * uzunluk);
      c.setAttribute("cx", nokta.x);
      c.setAttribute("cy", nokta.y);
      // Uçlarda sönük, ortada parlak: bir geçiş, bir varış değil.
      c.setAttribute("opacity", Math.sin(p * Math.PI).toFixed(3));
      requestAnimationFrame(adim);
    }
    requestAnimationFrame(adim);
  }

  function komsuluk() {
    const ileri = new Map(), geri = new Map();
    (window.__ontologyApp.links || []).forEach((l) => {
      const s = l.source.id, t = l.target.id;
      if (!ileri.has(s)) ileri.set(s, []);
      if (!geri.has(t)) geri.set(t, []);
      ileri.get(s).push(l);
      geri.get(t).push(l);
    });
    return { ileri, geri };
  }

  function pathFor(l) {
    return pathSel.nodes().find((n) => d3.select(n).datum() === l);
  }

  // Kaynaktan dalga dalga yayılma. `tur`:
  //   yayil -> kenarların kendi yönünde (tenezzül)
  //   rucu  -> ters yönde, kaynağa doğru (dönüş)
  //   topla -> kaynağa GİREN kenarlar boyunca içeri (cem')
  function yayilimEt(kaynakId, tur) {
    const { ileri, geri } = komsuluk();
    const ADIM = 320, SURE = 620;
    const gorulen = new Set([kaynakId]);
    let kat = [kaynakId], derinlik = 0;
    while (kat.length && derinlik < 8) {
      const sonraki = [];
      kat.forEach((id) => {
        const kenarlar = (tur === "yayil" ? (ileri.get(id) || []) : (geri.get(id) || []));
        kenarlar.forEach((l) => {
          const p = pathFor(l);
          if (p) kivilcim(p, derinlik * ADIM, SURE, tur !== "yayil");
          const oteki = tur === "yayil" ? l.target.id : l.source.id;
          if (!gorulen.has(oteki)) { gorulen.add(oteki); sonraki.push(oteki); }
        });
      });
      // "topla" tek adımlık: üç âlemin ışığı doğrudan İnsân-ı Kâmil'e girer,
      // zincirleme bir yayılma değil.
      if (tur === "topla") break;
      kat = sonraki;
      derinlik++;
    }
    // Işık geçerken düğümler sırayla parlıyor -- yalnız çizgi değil, varış
    // da görünsün.
    let i = 0;
    gorulen.forEach((id) => {
      const el = nodeSel.nodes().find((n) => d3.select(n).datum().id === id);
      if (!el) return;
      const gecikme = i * 90;
      i++;
      setTimeout(() => {
        el.classList.add("node--isik");
        setTimeout(() => el.classList.remove("node--isik"), 700);
      }, gecikme);
    });
  }

  // Halk-ı cedîd: âlem her an yeniden yaratılıyor. Bütün düğümler kısa bir
  // an sönüp yeniden yanıyor -- aynı düğümler, yeni bir yaratılışta.
  function teceddudEt() {
    nodeSel.nodes().forEach((el, i) => {
      setTimeout(() => {
        el.classList.add("node--teceddud");
        setTimeout(() => el.classList.remove("node--teceddud"), 620);
      }, (i % 6) * 70);
    });
  }

  // Perdelenme: sahne bir an bulanıp açılıyor. Perde bir halka değil, bir
  // süreçtir (GORSEL_DIL.md).
  function perdelen() {
    const kat = document.querySelector("#graph g.zoom-layer");
    if (!kat) return;
    kat.classList.add("onto-perdeli");
    davranisTimer = setTimeout(() => kat.classList.remove("onto-perdeli"), 1150);
  }

  function onEdgeClick(l) {
    currentDetailNode = null;
    currentDetailEdge = l;
    currentDetailView = null;
    showEdgeDetail(l);
    updateHash("ontoloji", "edge/" + l.source.id + "-" + l.target.id);
  }

  const VOLUME_LABEL_OVERRIDE = {
    "fusus-konuk": { tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" },
    "fukuk-konevi": { tr: "Fusûsu'l-Hikem'in Sırları (Konevî)", en: "The Secrets of the Fusus (Qunawi)", pt: "Os Segredos do Fusus (Qunawi)" },
    "izutsu-anahtar": { tr: "Anahtar-Kavramlar (İzutsu)", en: "Key Concepts (Izutsu)", pt: "Conceitos-Chave (Izutsu)" },
    "affifi-tasavvuf": { tr: "Tasavvuf Felsefesi (Affifi)", en: "The Mystical Philosophy (Affifi)", pt: "A Filosofia Mística (Affifi)" },
    "varlik-agaci": { tr: "Varlık Ağacı (Şeceretü'l-Kevn)", en: "The Tree of Being (Shajarat al-Kawn)", pt: "A Árvore do Ser (Shajarat al-Kawn)" },
    "ozun-ozu": { tr: "Özün Özü (Lübbü'l-Lübb)", en: "The Kernel of the Kernel (Lubb al-Lubb)", pt: "O Cerne do Cerne (Lubb al-Lubb)" },
    "tedbirat-konuk": { tr: "et-Tedbîrâtü'l-İlâhiyye (Konuk)", en: "et-Tadbirat al-Ilahiyya (Konuk)", pt: "et-Tadbirat al-Ilahiyya (Konuk)" },
    "risaleler-1": { tr: "İbn Arabî'nin Risaleleri, 1. Cild", en: "The Epistles of Ibn Arabi, Vol. 1", pt: "As Epístolas de Ibn Arabi, Vol. 1" },
    "risaleler-2": { tr: "İbn Arabî'nin Risaleleri, 2. Cild", en: "The Epistles of Ibn Arabi, Vol. 2", pt: "As Epístolas de Ibn Arabi, Vol. 2" },
    "el-bulga": { tr: "El-Bülga fi'l-Hikme", en: "Al-Bulgha fi'l-Hikma", pt: "Al-Bulgha fi'l-Hikma" },
  };

  function volumeLabel(n) {
    if (VOLUME_LABEL_OVERRIDE[n]) return tt(VOLUME_LABEL_OVERRIDE[n]);
    return tt({ tr: `Cilt ${n}`, en: `Volume ${n}`, pt: `Volume ${n}` });
  }

  const VOLUME_SOURCE_MATCH = {
    "fusus-konuk": "Fusûsu'l-Hikem Tercüme ve Şerhi (Ahmed Avni Konuk)",
    "fukuk-konevi": "El-Fükük fi Esrâr-ı Müstenidât-ı Hikemi'l-Fusûs (Sadreddin Konevî",
    "izutsu-anahtar": "İbn Arabî'nin Fusûsu'ndaki Anahtar-Kavramlar (Toshihiko İzutsu",
    "affifi-tasavvuf": "Muhyiddîn İbnü'l-Arabî'nin Tasavvuf Felsefesi (A. E. Affifi",
    "varlik-agaci": "Şeceretü'l-Kevn / Varlık Ağacı",
    "tedbirat-konuk": "et-Tedbîrâtü'l-İlâhiyye",
    "ozun-ozu": "Özün Özü / Lübbü'l-Lübb",
    "risaleler-1": "İbn Arabî'nin Risaleleri, 1. Cild",
    "risaleler-2": "İbn Arabî'nin Risaleleri, 2. Cild",
    "el-bulga": "El-Bülga fi'l-Hikme",
  };

  function sourcesForInsight(ins, sources) {
    // ins.source iki biçimde geliyor: düz metin ya da {tr,en,pt}. İkincisi
    // pick3'ten geçirilmezse kaynakça satırında "[object Object]" basıyordu
    // (2026-07-29'da sifat-asma düğümünde görüldü). Kenar içgörülerinde
    // `sources` dizisi hiç verilmediği için tek kaynak yolu burasıdır.
    if (ins.source) {
      return [typeof ins.source === "string" ? ins.source : I18n.pick3(ins.source)];
    }
    if (!sources || !sources.length) return [];
    const v = ins.volume;
    if (typeof v === "number") {
      const re = new RegExp(`Cilt ${v}\\b`);
      return sources.filter((s) => re.test(s));
    }
    if (VOLUME_SOURCE_MATCH[v]) {
      return sources.filter((s) => s.includes(VOLUME_SOURCE_MATCH[v]));
    }
    return [];
  }

  // @revise adresi (2026-10-09): her düzenlenebilir alan kendi
  // dosya/kayıt/alan üçlüsünü taşır; kenarların kaydı "kaynak→hedef".
  const ONT_DOSYA = "data/ibn-arabi/ontology.json";
  function adres(kayit, alan) {
    return kayit ? ` data-dost-dosya="${ONT_DOSYA}" data-dost-kaynak="${kayit}" data-dost-alan="${alan}"` : "";
  }
  const kenarKayit = (l) => (l.source && l.source.id ? l.source.id : l.source) + "→" + (l.target && l.target.id ? l.target.id : l.target);

  function insightsHtml(insights, sources, excludeView, excludeId, kayit) {
    // Metni ayıklamada boşalan içgörüler yalnız künye taşıyan boş bir
    // <details> olarak çiziliyordu (2026-10-07 taraması).
    const tum = insights || [];
    insights = tum.filter((ins) => window.DostGraphUtils.has3(ins.text));
    if (!insights.length) return "";
    return `<div class="insight-group">${insights.map((ins, i) => {
      const cite = sourcesForInsight(ins, sources);
      return `
      <details class="insight" ${i === 0 ? "open" : ""}>
        <summary>${volumeLabel(ins.volume)}</summary>
        <p${adres(kayit, `insights[${tum.indexOf(ins)}].text`)}>${linkify(I18n.pick3(ins.text), excludeView, excludeId)}</p>
        ${cite.length ? `<cite>${cite.join(" · ")}</cite>` : ""}
      </details>
    `;
    }).join("")}</div>`;
  }

  // Ortak: graph-utils.js (dört görünümde kopyalanmıştı).
  const analogyHtml = (a) => window.DostGraphUtils.analogyHtml(a);

  function showNodeDetail(d) {
    // 2026-10-07: panelin başındaki "kategori + anlam" satırı
    // (assets/graph-enhancement.js) kaldırıldı -- kaynaksız, bizim yazdığımız
    // bir tanımdı; düğümün kendi özeti (short/summary) okumadan geliyor.
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Varlık Mertebesi", en: "Level of Being", pt: "Nível do Ser" })}</p>
      <h2 class="detail-title">${I18n.pick3(d.name)}</h2>
      <div class="detail-block detail-block--ibnarabi">
        <h3>${I18n.pick3(d.short)}</h3>
        <p${adres(d.id, "summary")}>${linkify(I18n.pick3(d.summary), "ontoloji", d.id)}</p>
      </div>
      ${analogyHtml(d.analogy)}
      ${entityDiagramHtml(d)}
      ${insightsHtml(d.insights, d.sources, "ontoloji", d.id, d.id)}
      ${gateHtml(d)}
      ${relatedEdgesHtml(d)}
    `;
    detailPanel.hidden = false;
    wireGate(d);
    wireEntityDiagram(d);
    if (nodeSel) nodeSel.classed("node--active", (n) => n.id === d.id);
  }

  // KAPILAR (FAZ 2b) — bkz. ETKILESIM_DILI.md: "geçiş dekor değil,
  // dönüşümdür." Ontoloji'nin bazı düğümlerinin sitede kendi haritası var;
  // "Esmâ-i Hüsnâ ve Sıfat" düğümü ile Esmâ görünümü aynı şeyin iki
  // çözünürlüğü. Tıklama sözleşme gereği yalnız paneli açıyor (habersiz
  // gezinme yok); geçiş buradaki ADI KONMUŞ kapıdan oluyor.
  const GATES = {
    "sifat-asma": {
      view: "esma",
      // Esmâ görünümünün tek bir "kendi" rengi yok -- celâl/cemâl kutupları
      // ayrı ayrı renklenir. --series-kemal ikisini birleştiren isimlerin
      // rengi (bkz. style.css), yani görünümün BÜTÜNÜNE en yakın kimlik;
      // varış halkası bunu taşıyor.
      ringVar: "--series-kemal",
      label: {
        tr: "Yüz bir ismin haritasına gir",
        en: "Enter the map of the hundred and one Names",
        pt: "Entre no mapa dos cento e um Nomes",
      },
      note: {
        tr: "Bu düğüm bir liste değil, bir kapı: isimler orada tek tek açılıyor.",
        en: "This node is not a list but a door: the Names open there one by one.",
        pt: "Este nó não é uma lista, mas uma porta: ali os Nomes se abrem um a um.",
      },
    },
  };

  function gateHtml(d) {
    const g = GATES[d.id];
    if (!g) return "";
    return `<div class="detail-gate">
      <p class="detail-gate__note">${tt(g.note)}</p>
      <button class="detail-gate__btn" type="button" data-gate="${d.id}">${tt(g.label)}
        <span class="detail-gate__arrow" aria-hidden="true">→</span></button>
    </div>`;
  }

  function wireGate(d) {
    const btn = detailContent.querySelector(".detail-gate__btn");
    if (!btn) return;
    const g = GATES[btn.dataset.gate];
    if (!g) return;
    btn.addEventListener("click", () => {
      // Kapı düğümünün ekrandaki dairesi: dönüşüm oradan başlıyor.
      let rect = null, renk = null;
      if (nodeSel) {
        const el = nodeSel.nodes().find((n) => d3.select(n).datum().id === d.id);
        const circle = el && el.querySelector("circle");
        if (circle) {
          rect = circle.getBoundingClientRect();
          renk = getComputedStyle(circle).fill;
        }
      }
      window.DostGraphUtils.gateTransition(
        {
          fromRect: rect,
          color: renk,
          targetColor: g.ringVar ? getVar(g.ringVar) : null,
          targetEl: document.getElementById(g.view + "-wrap"),
        },
        () => { updateHash(g.view); setMainView(g.view); }
      );
    });
  }

  function relatedEdgesHtml(d) {
    const outgoing = window.__ontologyApp.links.filter((l) => l.source.id === d.id);
    const incoming = window.__ontologyApp.links.filter((l) => l.target.id === d.id);
    const rows = [...outgoing.map((l) => ({ l, dir: "out" })), ...incoming.map((l) => ({ l, dir: "in" }))];
    if (!rows.length) return "";
    const items = rows.map(({ l, dir }) => {
      const other = dir === "out" ? l.target : l.source;
      const arrow = dir === "out" ? "→" : "←";
      return `<div class="detail-block detail-block--edge">
        <h3>${arrow} ${I18n.pick3(other.name)} — <em>${I18n.pick3(l.relation)}</em></h3>
        ${confidenceNoteHtml(l.confidence)}
        <p${adres(kenarKayit(l), "nature")}>${linkify(I18n.pick3(l.nature), null, null)}</p>
        ${insightsHtml(l.insights, null, null, null, kenarKayit(l))}
      </div>`;
    }).join("");
    return `<p class="detail-eyebrow detail-eyebrow--section">${tt({ tr: "İlişkiler", en: "Relations", pt: "Relações" })}</p>${items}`;
  }

  function showEdgeDetail(l) {
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${I18n.pick3(l.relation)}</p>
      <h2 class="detail-title">${I18n.pick3(l.source.name)} → ${I18n.pick3(l.target.name)}</h2>
      ${confidenceNoteHtml(l.confidence)}
      ${entityDiagramHtml(l)}
      <div class="detail-block detail-block--ibnarabi">
        <p${adres(kenarKayit(l), "nature")}>${linkify(I18n.pick3(l.nature), null, null)}</p>
        ${insightsHtml(l.insights, null, null, null, kenarKayit(l))}
      </div>
    `;
    detailPanel.hidden = false;
    wireEntityDiagram(l);
    if (nodeSel) nodeSel.classed("node--active", false);
  }

  function drag(sim) {
    return window.DostGraphUtils.createDragBehavior(sim);
  }

  // İlk rota (2026-10-09): ontology.json'u beklemeden. DOMContentLoaded,
  // bu dosyadan SONRA gelen defer betiklerinin (mobil liste, ipuçları...)
  // de çalışmış olmasını garanti ediyor -- eski düzende rota zaten bir
  // fetch'in arkasında olduğu için hep onlardan sonra çözülüyordu.
  function ilkRota() {
    parseHashAndGo(false);
    window.__dostAppReady = true;
  }
  if (document.readyState === "loading" || document.readyState === "interactive") {
    document.addEventListener("DOMContentLoaded", ilkRota, { once: true });
  } else ilkRota();
})();
