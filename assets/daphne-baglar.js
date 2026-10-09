(function () {
  "use strict";

  // Eksen İplikleri (2026-10-09; eski adı "Bağlar Haritası").
  //
  // Bu sekme 2026-08-28'de Daphne'nin yazılarıyla Dost'un kavramları
  // arasında elle kurduğumuz bağları gösteriyordu. 2026-10-05 ayıklamasında
  // o bağların hepsi kaldırıldı (YALNIZ okumaların özeti kuralı: Dost'la
  // Daphne arasındaki köprüleri biz kurmuştuk) ve harita boş kaldı (görsel
  // taraması madde 16: "68 yazı, 0 bağ"). Kullanıcı kararı: Dost'la HİÇBİR
  // bağ kurulmaz; harita Daphne'nin kendi yazıları arasında kalır.
  //
  // Ne gösteriyor: taranan yazılar yayın tarihine göre bir sarmala dizili
  // (CLAUDE.md, "Sarmal -- üçüncü boyut"). Her yazının `eksenler` alanı
  // (Daphne'nin Profili sekmesindeki eksenler; hangi yazının hangi ekseni
  // taşıdığını biz işaretledik, gerekçeleri yazının kartında alıntıyla
  // duruyor) yazılar arasından geçen renkli bir iplik olur: bir eksenin
  // ipliği, o ekseni taşıyan yazıları tarih sırasıyla birleştirir. Bu bir
  // SAYIM, bir yorum değil: neyin tekrar ettiğini gösteriyor, ne anlama
  // geldiğini değil.
  //
  // Tek görsel içgörü: bir eksen yazıların arasından geçerken bazı
  // turlarda sık, bazılarında seyrek dolanıyor -- tekrarın zamandaki
  // dağılımı gözle görülür.
  //
  // Gramer (GORSEL_DIL.md): iplikler sarmalın İÇİNDEN, her eksen kendi
  // derinliğinde dolanır (kablo telleri gibi; iki yazı arasında yalnız o
  // yazılara değer, aradakilere değmez). Derinlik atmosferik: arkadaki
  // yazılar küçük ve soluk. Değinilen eksenin yazıları ışıkla belirir
  // (ışık = zuhûr), öbürleri perdelenir (matlık). Ok yok, eşmerkezli
  // halka yok.
  //
  // Etkileşim (ETKILESIM_DILI.md):
  //   değinmek -- eksen düğmesi ya da iplik (hover / odak): o iplik ve
  //     yazıları belirir; yazı düğümü (hover / odak): o yazının iplikleri
  //     belirir, alttaki ipucu satırı başlığı ve tarihi söyler.
  //   seçmek -- eksen: eksenin paneli (yazıları ve gerekçeleri); yazı:
  //     yazının kartı (özet, eksenleri ve gerekçeleri, kaynak). Seçim
  //     vurgusu panel kapansa da kalır.
  //   Esc -- önce panel (compare.js), sonra seçim, sonra sayfadan çıkış.
  //   Ortala -- başlangıç bakışı (kaydırma/yakınlaştırma geri alınır,
  //     seçim korunur). Yaklaşmak Ctrl/⌘ + tekerlek (createZoomBehavior).

  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;
  const svg = d3.select("#baglar-graph");
  if (!svg.node()) return;

  const tt = I18n.pick3;
  const esc = GU.escapeHtml;
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");
  const olcuEl = document.getElementById("baglar-olcu");
  const listeEl = document.getElementById("baglar-eksen-listesi");
  const ipucuEl = document.getElementById("baglar-ipucu");
  const EKSEN_SAYISI_RENK = 11;   // style.css'teki .eksen-renk-0..10

  let pageData = null;
  let yazilar = [];   // tarihe göre artan: {a, i, eksen: Set(id)}
  let eksenler = [];  // [{id, label, note, k, yazilar:[i...]}]
  let eksenById = new Map();
  let secEksen = null, secYazi = null;      // seçim (panel kapansa da kalır)
  let zoomBehavior = null, zoomLayer = null;
  let ipliklerSel = null, yaziSel = null;

  // ------------------------------------------------------------------
  // Veri
  // ------------------------------------------------------------------
  function veriKur(data) {
    yazilar = (data.articles || [])
      .slice()
      .sort((x, y) => (x.date || "").localeCompare(y.date || ""))
      .map((a, i) => ({ a, i, eksen: new Set((a.eksenler || []).map((e) => e.id)) }));
    const params = data.core_parameters || [];
    eksenler = params.map((p, k) => ({
      id: p.id, label: p.label, note: p.note, k: k % EKSEN_SAYISI_RENK,
      yazilar: yazilar.filter((y) => y.eksen.has(p.id)).map((y) => y.i),
    })).filter((e) => e.yazilar.length);
    eksenById = new Map(eksenler.map((e) => [e.id, e]));
  }

  function isaretSayisi() {
    return yazilar.reduce((n, y) => n + y.eksen.size, 0);
  }

  function olcuyuYaz() {
    if (!olcuEl || !pageData) return;
    const n = yazilar.length, k = eksenler.length, m = isaretSayisi();
    olcuEl.textContent = tt({
      tr: `Şimdiye kadar: ${n} yazı, ${k} eksen, ${m} eksen işareti.`,
      en: `So far: ${n} pieces, ${k} axes, ${m} axis marks.`,
      pt: `Até agora: ${n} textos, ${k} eixos, ${m} marcas de eixo.`,
    });
  }

  // Boş durum: işaretli eksen yoksa tuval, ortala ve lejant gizlenir;
  // yerine olgusal tek cümle (bağlanmamış düğme olmasın).
  function bosDurumuUygula() {
    const bos = !!pageData && isaretSayisi() === 0;
    const wrap = document.getElementById("baglar-wrap");
    const not = document.getElementById("baglar-bos");
    if (wrap) wrap.classList.toggle("baglar-wrap--bos", bos);
    ["baglar-graph", "baglar-recenter", "baglar-legend", "baglar-ipucu"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = bos ? "none" : "";
    });
    if (not) {
      not.hidden = !bos;
      not.textContent = bos ? tt({
        tr: "Taranan yazılarda şu an işaretli bir eksen yok; harita bu yüzden boş.",
        en: "The surveyed pieces currently carry no marked axis, so the map is empty.",
        pt: "Os textos analisados não têm, por ora, nenhum eixo marcado; por isso o mapa está vazio.",
      }) : "";
    }
    return bos;
  }

  function loadData() {
    if (window.DostViewStatus) window.DostViewStatus.showLoading("baglar-wrap");
    GU.fetchJson("data/daphne-profile.json")
      .then((daphne) => {
        pageData = daphne;
        veriKur(daphne);
        if (window.DostViewStatus) window.DostViewStatus.hide("baglar-wrap");
        olcuyuYaz();
        lejantiYaz();
        if (bosDurumuUygula()) return;
        grafiKur();
      })
      .catch((err) => {
        console.error("Eksen iplikleri verisi yüklenemedi / Failed to load axis threads data", err);
        if (window.DostViewStatus) window.DostViewStatus.showError("baglar-wrap", loadData);
      });
  }

  let started = false, grafKuruldu = false, sonOlcu = "", gozlemci = null;
  function kurulabilirMi() {
    const s = svg.node();
    return !!(s && s.clientWidth > 0 && s.clientHeight > 0);
  }
  function grafiKur() {
    if (grafKuruldu || !pageData || !kurulabilirMi() || !isaretSayisi()) return;
    grafKuruldu = true;
    sonOlcu = svg.node().clientWidth + "x" + svg.node().clientHeight;
    buildGraph();
  }
  function yenidenKur() {
    if (!grafKuruldu || !pageData || !kurulabilirMi()) return;
    const s = svg.node();
    const olcu = s.clientWidth + "x" + s.clientHeight;
    if (olcu === sonOlcu) return;
    sonOlcu = olcu;
    svg.selectAll("*").remove();
    buildGraph();
  }
  function olcuyuIzle() {
    if (gozlemci || typeof ResizeObserver === "undefined" || !svg.node()) return;
    gozlemci = new ResizeObserver(() => { if (!grafKuruldu) grafiKur(); else yenidenKur(); });
    gozlemci.observe(svg.node());
  }

  window.__dostDaphneBaglarApp = {
    activate: function () {
      olcuyuIzle();
      if (started) { grafiKur(); return; }
      started = true;
      loadData();
    },
    render: function () {
      if (!pageData) return;
      olcuyuYaz();
      lejantiYaz();
      if (bosDurumuUygula()) return;
      if (grafKuruldu) { svg.selectAll("*").remove(); buildGraph(); }
      if (!detailPanel.hidden) {
        if (secYazi != null) yaziKartiAc(secYazi);
        else if (secEksen) eksenPaneliAc(secEksen);
      }
    },
  };

  // Esc zinciri: compare.js'in adımı (önce panel, sonra sayfadan çıkış)
  // bu dosyadan SONRA kaydoluyor; zincir sırayla sorduğu için burada önce
  // panelin açık olup olmadığına bakılıyor -- açıksa adım ona bırakılır.
  GU.registerStepBack("baglar-wrap", () => {
    if (!detailPanel.hidden) return false;
    if (secYazi != null || secEksen) {
      secYazi = null; secEksen = null;
      vurgula();
      return true;
    }
    return false;
  });

  // ------------------------------------------------------------------
  // Geometri: zaman ekseni boyunca uzanan sarmal
  // ------------------------------------------------------------------
  let geo = null;
  // Geniş tuvalde eksen lejantı solda sabit bir sütun (style.css
  // .baglar-eksenler); sarmal onun sağında kalan alana yerleşir ki
  // lejant yazıların üstüne binmesin.
  const LEJANT_SUTUNU = 262;
  function geometriKur(W, H) {
    const sol = W >= 760 ? LEJANT_SUTUNU : 0;
    const Wk = W - sol;
    const yatay = Wk >= H * 1.05;
    const uzun = yatay ? Wk : H, kisa = yatay ? H : Wk;
    const n = Math.max(2, yazilar.length);
    // Dikeyde (dar tuval) üstte ortala düğmesi + kapalı lejant, altta ipucu
    // satırı için pay bırakılır; tur sayısı uzunluğa göre (bir tur ~ 200 px
    // yatayda, ~150 px dikeyde) ki turlar birbirine yığılmasın.
    const ust = yatay ? 0 : 112, alt = yatay ? 0 : 56;
    const L = yatay ? uzun * 0.86 : Math.max(160, H - ust - alt);
    const tur = Math.max(1.5, Math.min(n / 12, L / (yatay ? 200 : 150)));
    const R = Math.max(34, Math.min(kisa * 0.27, 150));
    geo = { yatay, L, R, tur, n, cx: sol + Wk / 2, cy: yatay ? H / 2 - 14 : ust + L / 2 };
  }
  // t ∈ [0,1] zaman konumu; rho yarıçap (iplikler içeride, yazılar kabukta).
  function nokta(t, rho) {
    const th = 2 * Math.PI * geo.tur * t - Math.PI / 2;
    const u = -geo.L / 2 + geo.L * t;
    const boy = u + 0.06 * rho * Math.sin(th);   // çok hafif eğik bakış
    const en = rho * Math.cos(th);
    const derin = (1 + Math.sin(th)) / 2;         // 1 önde, 0 arkada
    return geo.yatay
      ? { x: geo.cx + boy, y: geo.cy + en, d: derin }
      : { x: geo.cx + en, y: geo.cy + boy, d: derin };
  }
  function tYazi(i) { return geo.n > 1 ? i / (geo.n - 1) : 0.5; }

  // Her eksenin ipliği kendi derinliğinde: iki yazı arasında yarıçap
  // içeri doğru büküklenir (beta), uçlarda kabuğa, yani yazıya değer.
  function eksenBeta(e) {
    const K = Math.max(1, eksenler.length - 1);
    return 0.22 + 0.62 * (eksenler.indexOf(e) / K);
  }
  function iplikYolu(e) {
    const beta = eksenBeta(e);
    let d = "";
    for (let j = 0; j < e.yazilar.length - 1; j++) {
      const i0 = e.yazilar[j], i1 = e.yazilar[j + 1];
      const t0 = tYazi(i0), t1 = tYazi(i1);
      const adim = Math.max(8, Math.ceil((i1 - i0) * 6));
      for (let s = 0; s <= adim; s++) {
        const f = s / adim;
        const p = nokta(t0 + (t1 - t0) * f, geo.R * (1 - beta * Math.sin(Math.PI * f)));
        d += (s === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1);
      }
    }
    return d;
  }

  // ------------------------------------------------------------------
  // Çizim
  // ------------------------------------------------------------------
  function buildGraph() {
    const W = svg.node().clientWidth, H = svg.node().clientHeight;
    geometriKur(W, H);
    zoomLayer = svg.append("g").attr("class", "compare-zoom-layer");

    const defs = svg.append("defs");
    const g = defs.append("radialGradient").attr("id", "baglar-isik-hale");
    [["0%", 0.7], ["45%", 0.25], ["100%", 0]].forEach(([o, a]) => g.append("stop")
      .attr("offset", o).attr("style", `stop-color:var(--helix-gold, #e8b33a);stop-opacity:${a}`));

    // Omurga: yazıların dizildiği sarmal (arka ve ön yarısı ayrı çizilir;
    // arkadaki soluk -- atmosferik derinlik).
    let on = "", arka = "", onceki = null;
    for (let s = 0; s <= 900; s++) {
      const p = nokta(s / 900, geo.R);
      const onde = p.d >= 0.5;
      const seg = p.x.toFixed(1) + "," + p.y.toFixed(1);
      if (onde) on += (onceki === true ? "L" : "M") + seg;
      else arka += (onceki === false ? "L" : "M") + seg;
      onceki = onde;
    }
    zoomLayer.append("path").attr("class", "baglar-omurga baglar-omurga--arka").attr("d", arka);

    // Ay işaretleri: zaman ekseninin yanında, ayın ilk yazısı hizasında.
    const ayFmt = (() => {
      try { return new Intl.DateTimeFormat(I18n.getLang() === "tr" ? "tr-TR" : I18n.getLang() === "pt" ? "pt-BR" : "en-GB", { month: "short", year: "numeric" }); }
      catch (e) { return null; }
    })();
    const aylar = [];
    let sonAy = "";
    yazilar.forEach((y) => {
      const ay = (y.a.date || "").slice(0, 7);
      if (ay && ay !== sonAy) { aylar.push({ ay, i: y.i }); sonAy = ay; }
    });
    const ayG = zoomLayer.append("g").attr("class", "baglar-aylar").attr("aria-hidden", "true");
    // Az yazılı aylar sarmalda birbirine çok yakın düşüyor (Ağustos-Ekim):
    // birbirine 56 px'ten yakın etiketlerden yalnız biri yazılır; sonuncusu
    // (en yeni ay) her zaman kalır, ondan önceki çakışan düşer.
    const ARALIK = geo.yatay ? 56 : 22;
    const konum = (i) => -geo.L / 2 + geo.L * tYazi(i);
    const yazilacak = [];
    aylar.forEach((m, j) => {
      const son = j === aylar.length - 1;
      while (yazilacak.length && konum(m.i) - konum(yazilacak[yazilacak.length - 1].i) < ARALIK) {
        if (!son) return;
        yazilacak.pop();
      }
      yazilacak.push(m);
    });
    yazilacak.forEach(({ ay, i }) => {
      const u = konum(i);
      const etiket = ayFmt ? ayFmt.format(new Date(ay + "-15T12:00:00")) : ay;
      if (geo.yatay) {
        const x = geo.cx + u, y = geo.cy + geo.R + 30;
        ayG.append("line").attr("x1", x).attr("x2", x).attr("y1", y - 12).attr("y2", y - 6);
        ayG.append("text").attr("x", x).attr("y", y + 6).attr("text-anchor", "middle").text(etiket);
      } else {
        const x = geo.cx - geo.R - 22, y = geo.cy + u;
        ayG.append("line").attr("x1", x + 6).attr("x2", x + 12).attr("y1", y).attr("y2", y);
        ayG.append("text").attr("x", x).attr("y", y + 4).attr("text-anchor", "end").text(etiket);
      }
    });

    // İplikler: her eksen tek bir yol (alt yolları yazı çiftleri) + geniş,
    // görünmez bir isabet yolu (ince çizgiye nişan almak zor).
    const iplikG = zoomLayer.append("g").attr("class", "baglar-iplikler");
    ipliklerSel = iplikG.selectAll("g.baglar-iplik").data(eksenler).join("g")
      .attr("class", (e) => "baglar-iplik eksen-renk-" + e.k)
      .attr("data-eksen", (e) => e.id);
    ipliklerSel.append("path").attr("class", "baglar-iplik__yol").attr("d", (e) => iplikYolu(e));
    ipliklerSel.append("path").attr("class", "baglar-iplik__isabet").attr("d", (e) => iplikYolu(e))
      .on("mouseenter", (ev, e) => degin({ eksen: e.id }))
      .on("mouseleave", () => degin(null))
      .on("click", (ev, e) => { ev.stopPropagation(); eksenSec(e.id); });

    zoomLayer.append("path").attr("class", "baglar-omurga").attr("d", on);

    // Yazılar: arkadakiler önce çizilir.
    const sirali = yazilar.slice().sort((p, q) => nokta(tYazi(p.i), geo.R).d - nokta(tYazi(q.i), geo.R).d);
    yaziSel = zoomLayer.append("g").attr("class", "baglar-yazilar")
      .selectAll("g.node").data(sirali, (y) => y.i).join("g")
      .attr("class", "node baglar-yazi")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (y) => y.a.title + " — " + (y.a.date || ""))
      .attr("transform", (y) => { const p = nokta(tYazi(y.i), geo.R); return `translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`; })
      .on("mouseenter", (ev, y) => degin({ yazi: y.i }))
      .on("mouseleave", () => degin(null))
      .on("focus", (ev, y) => degin({ yazi: y.i }))
      .on("blur", () => degin(null))
      .on("click", (ev, y) => yaziSec(y.i))
      .on("keydown", (ev, y) => {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); yaziSec(y.i); }
      });
    yaziSel.append("circle").attr("class", "baglar-yazi__hale").attr("r", 16).attr("fill", "url(#baglar-isik-hale)");
    yaziSel.append("circle").attr("class", "baglar-yazi__govde")
      .attr("r", (y) => { const d = nokta(tYazi(y.i), geo.R).d; return (3.2 + 3.4 * d).toFixed(2); })
      .style("opacity", (y) => { const d = nokta(tYazi(y.i), geo.R).d; return (0.45 + 0.55 * d).toFixed(2); });

    zoomBehavior = GU.createZoomBehavior(svg, zoomLayer, [0.5, 4]);
    GU.wireRecenter("baglar-recenter", () => {
      svg.transition().duration(420).call(zoomBehavior.transform, d3.zoomIdentity);
    });
    vurgula();
  }

  // ------------------------------------------------------------------
  // Lejant: eksen düğmeleri
  // ------------------------------------------------------------------
  function lejantiYaz() {
    if (!listeEl) return;
    listeEl.innerHTML = eksenler.map((e) => `<button type="button" class="baglar-eksen eksen-renk-${e.k}" data-eksen="${esc(e.id)}" aria-pressed="false">
        <span class="baglar-eksen__iplik" aria-hidden="true"></span>
        <span class="baglar-eksen__ad">${esc(tt(e.label))}</span>
        <span class="baglar-eksen__sayi">${e.yazilar.length}</span>
      </button>`).join("");
    listeEl.querySelectorAll(".baglar-eksen").forEach((b) => {
      const id = b.dataset.eksen;
      b.addEventListener("mouseenter", () => degin({ eksen: id }));
      b.addEventListener("mouseleave", () => degin(null));
      b.addEventListener("focus", () => degin({ eksen: id }));
      b.addEventListener("blur", () => degin(null));
      // compare.js/daphne-profil.js belgeye bağlı "dışarı tıklanınca paneli
      // kapat" dinleyicisi taşıyor; az önce açılan paneli aynı tıklama
      // kapatmasın.
      b.addEventListener("click", (ev) => { ev.stopPropagation(); eksenSec(id); });
    });
    vurgula();
  }

  // ------------------------------------------------------------------
  // Değinmek / seçmek
  // ------------------------------------------------------------------
  let deginilen = null;   // {eksen} | {yazi}
  function degin(h) {
    deginilen = h;
    vurgula();
  }

  // Görünür durum: önce değinilen, yoksa seçili.
  function vurgula() {
    const h = deginilen || (secYazi != null ? { yazi: secYazi } : (secEksen ? { eksen: secEksen } : null));
    const wrap = document.getElementById("baglar-wrap");
    if (wrap) wrap.classList.toggle("baglar--odak", !!h);
    let isikliYazi = null, isikliEksen = null;
    if (h && h.eksen && eksenById.has(h.eksen)) {
      isikliEksen = new Set([h.eksen]);
      isikliYazi = new Set(eksenById.get(h.eksen).yazilar);
    } else if (h && h.yazi != null && yazilar[h.yazi]) {
      isikliYazi = new Set([h.yazi]);
      isikliEksen = yazilar[h.yazi].eksen;
    }
    if (ipliklerSel) ipliklerSel.classed("is-isik", (e) => !!isikliEksen && isikliEksen.has(e.id))
      .classed("is-perde", (e) => !!isikliEksen && !isikliEksen.has(e.id));
    if (yaziSel) yaziSel.classed("is-isik", (y) => !!isikliYazi && isikliYazi.has(y.i))
      .classed("is-perde", (y) => !!isikliYazi && !isikliYazi.has(y.i))
      .classed("is-secili", (y) => y.i === secYazi);
    if (listeEl) listeEl.querySelectorAll(".baglar-eksen").forEach((b) => {
      const id = b.dataset.eksen;
      b.classList.toggle("is-isik", !!isikliEksen && isikliEksen.has(id));
      b.classList.toggle("is-perde", !!isikliEksen && !isikliEksen.has(id));
      b.setAttribute("aria-pressed", String(id === secEksen));
    });
    ipucuYaz(h);
  }

  function ipucuYaz(h) {
    if (!ipucuEl) return;
    if (h && h.yazi != null && yazilar[h.yazi]) {
      const y = yazilar[h.yazi];
      const adlar = Array.from(y.eksen).map((id) => eksenById.get(id)).filter(Boolean).map((e) => tt(e.label));
      ipucuEl.innerHTML = `<strong>${esc(y.a.title)}</strong> <span class="baglar-ipucu__tarih">${esc(y.a.date || "")}</span>`
        + (adlar.length ? `<span class="baglar-ipucu__eksenler">${esc(adlar.join(" · "))}</span>` : "");
    } else if (h && h.eksen && eksenById.has(h.eksen)) {
      const e = eksenById.get(h.eksen);
      const n = e.yazilar.length;
      ipucuEl.innerHTML = `<strong>${esc(tt(e.label))}</strong> <span class="baglar-ipucu__tarih">${esc(tt({
        tr: `${n} yazıdan geçiyor`, en: `runs through ${n} ${n === 1 ? "piece" : "pieces"}`, pt: `passa por ${n} ${n === 1 ? "texto" : "textos"}`,
      }))}</span>`;
    } else {
      ipucuEl.textContent = tt({
        tr: "Bir eksene ya da yazıya değinin; seçince kartı açılır.",
        en: "Touch an axis or a piece; select it to open its card.",
        pt: "Toque num eixo ou num texto; selecione-o para abrir o seu cartão.",
      });
    }
  }

  function eksenSec(id) {
    secEksen = id; secYazi = null;
    vurgula();
    eksenPaneliAc(id);
  }
  function yaziSec(i) {
    secYazi = i; secEksen = null;
    vurgula();
    yaziKartiAc(i);
  }

  function eksenPaneliAc(id) {
    const e = eksenById.get(id);
    if (!e) return;
    const satirlar = e.yazilar.slice().reverse().map((i) => {
      const y = yazilar[i];
      const kayit = (y.a.eksenler || []).find((x) => x.id === id);
      return `<li class="daphne-bag">
        <button type="button" class="daphne-bag__ad baglar-yazi-ac" data-yazi="${i}">${esc(y.a.title)}</button>
        <span class="baglar-panel__tarih">${esc(y.a.date || "")}</span>
        ${kayit && kayit.neden ? `<span class="daphne-bag__neden">${esc(tt(kayit.neden))}</span>` : ""}</li>`;
    }).join("");
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${esc(tt({ tr: "Eksen", en: "Axis", pt: "Eixo" }))}</p>
      <h2 class="detail-title"><span class="baglar-eksen__iplik eksen-renk-${e.k}" aria-hidden="true"></span> ${esc(tt(e.label))}</h2>
      ${e.note ? `<div class="detail-block detail-block--daphne"><p>${esc(tt(e.note))}</p></div>` : ""}
      <p class="detail-eyebrow detail-eyebrow--section">${esc(tt({
        tr: `Bu eksenin geçtiği yazılar (${e.yazilar.length})`,
        en: `Pieces this axis runs through (${e.yazilar.length})`,
        pt: `Textos por onde este eixo passa (${e.yazilar.length})`,
      }))}</p>
      <ul class="daphne-bag-liste">${satirlar}</ul>`;
    detailContent.querySelectorAll(".baglar-yazi-ac").forEach((b) => {
      b.addEventListener("click", (ev) => { ev.stopPropagation(); yaziSec(Number(b.dataset.yazi)); });
    });
    detailPanel.hidden = false;
  }

  function yaziKartiAc(i) {
    const y = yazilar[i];
    if (!y) return;
    const a = y.a;
    const eks = (a.eksenler || []).map((x) => {
      const e = eksenById.get(x.id);
      if (!e) return "";
      return `<li class="daphne-bag">
        <button type="button" class="daphne-bag__ad baglar-eksen-ac" data-eksen="${esc(e.id)}"><span class="baglar-eksen__iplik eksen-renk-${e.k}" aria-hidden="true"></span> ${esc(tt(e.label))}</button>
        ${x.neden ? `<span class="daphne-bag__neden">${esc(tt(x.neden))}</span>` : ""}</li>`;
    }).join("");
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${esc(tt({ tr: "Yazı", en: "Piece", pt: "Texto" }))} · ${esc(a.date || "")}</p>
      <h2 class="detail-title">${esc(a.title)}</h2>
      ${a.ozet ? `<div class="detail-block detail-block--daphne"><p>${esc(tt(a.ozet))}</p></div>` : ""}
      ${eks ? `<p class="detail-eyebrow detail-eyebrow--section">${esc(tt({
        tr: "Bu yazının taşıdığı eksenler", en: "Axes this piece carries", pt: "Eixos que este texto traz",
      }))}</p><ul class="daphne-bag-liste">${eks}</ul>` : ""}
      <p><a class="bookmap-concept-tag bookmap-concept-tag--group" href="${esc(a.url)}" target="_blank" rel="noopener">${esc(tt({
        tr: "kaynağı aç", en: "open source", pt: "abrir a fonte",
      }))} ↗</a></p>`;
    detailContent.querySelectorAll(".baglar-eksen-ac").forEach((b) => {
      b.addEventListener("click", (ev) => { ev.stopPropagation(); eksenSec(b.dataset.eksen); });
    });
    detailPanel.hidden = false;
  }

  window.addEventListener("resize", GU.debounceResize(yenidenKur, 200));
})();
