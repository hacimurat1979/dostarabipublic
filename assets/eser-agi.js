// Eser Ağı — Dost'un eserlerinin kronolojik zaman çizelgesi (docs/icerik-
// yol-haritasi.md D7). Roadmap'in "gerçek kenarları olan ilk graf" isteği:
// düğümler (eserler) MIAS'ın kendi tarih/şehir verisinden, kenarlar (aynı
// şehirde art arda yazılan eserler) yine o veriden -- hiçbiri uydurma değil.
//
// NEDEN ZAMAN ÇİZELGESİ (2026-08-06, kullanıcı bulgusu -- sarmal karışık
// görünüyordu). Görünüm bir sarmaldı: yarıçap = yıl, açı = sıra. CLAUDE.md'nin
// daire/merkez ilkesine uyuyordu ama 28 eserlik seyrek, kümelenmiş bir
// veride (dört yılda üçer eser birden var) okunması zorlaşıyordu. Kullanıcı
// doğrudan "modern bir timeline" istedi -- CLAUDE.md'nin kendisi de
// "bir öğe doğası gereği dairesel değilse zorla daireye sokma" diyor, ve
// bir kronoloji doğası gereği DOĞRUSAL.
//
// YATAY YIL EKSENİ (2026-08-09, kullanıcı iki referans görsel paylaştı --
// biri gerçek elyazması sayfaları üstünde çalışıyordu, bizde öyle bir
// kaynak yok; öbürü YATAY bir eksende, kartların üstte yüzdüğü ve
// üst üste geldiklerinde KATLARA (lane) ayrıldığı bir düzendi. Bu ikinciyi
// kurduk). Önceki sürüm (dikey liste, SIRAYA göre eşit satır) yıl
// bilgisini yalnız metinde taşıyordu -- iki eserin 2 ay mı 23 yıl mı ara
// verdiği görsel olarak AYNI satır aralığıydı (bkz. tercumanul-esvak →
// futuhatul-mekkiyye kenarının kendi notu: "aralarında yirmi üç yıl var").
// Şimdi x ekseni GERÇEK yıla orantılı -- yakın tarihli eserler görsel
// olarak da yakın duruyor. Kümelenme sorunu (aynı yılda 3-4 eser) bu kez
// eksen sıkıştırılarak değil, KART YIĞMA (laneAta) ile çözülüyor: bir
// kartın x'i bir öncekiyle çakışıyorsa bir üst kata çıkıyor, kat boşalınca
// (kronolojik olarak yeterince ileri gidilince) yeniden kullanılıyor --
// klasik takvim/genom-tarayıcı yığma algoritması.
//
// DİKEY TELEFONDA DİKEY EKSEN (2026-10-11, kullanıcı kararı; taslak:
// scratchpad/mobil-grafik/eser-agi-dikey/karsilastirma.html). Dikey tutulan
// telefonda yatay şerit ekranın üçte ikisini boş bırakıyor, aynı anda iki
// kart gösteriyordu. Orada eksen döner: yıl yukarıdan aşağı akar (70 px/yıl,
// yine gerçek yıla orantılı), her eser eksende kendi yılının noktasıdır,
// kartı sağdaki iki sütundan birinde durur. İki sütun da doluysa kart aşağı
// kayar ve sapıyla noktasına bağlı kalır (yıl noktada, kart okunabilir
// yerde). Kart boyları ekran pikseliyle kurulur (yazı 13/12 px, kart 48 px
// -- parmak boyunda) ve ekran genişliğinden hesaplanır. Yatay telefonda ve
// masaüstünde düzen değişmez (cizDikey yalnız dikeyMi() iken çalışır).
window.__eserAgiApp = (function () {
  "use strict";

  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = d3.select("#eser-agi-graph");
  const svgNode = svg.node();
  const wrapEl = document.getElementById("eser-agi-wrap");
  const tooltip = document.getElementById("eser-agi-tooltip");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");

  if (!svgNode || !wrapEl) return { activate() {}, onLangChange() {}, goToNode() {} };

  const tt = I18n.pick3;  // window.DostI18n.pick3 zaten (!obj) koruması yapıyor (2026-08-15: 26 dosyadaki tekrar buraya toplandı)

  // 2026-08-09 kullanıcı geri bildirimi: liste bir "liste" gibi okunuyordu,
  // bir "yolculuk" gibi değil. window.__dostCrossLink zaten ontology.js'te
  // kurulu, glossary'deki bilinen terimleri metin içinde otomatik tanıyıp
  // tıklanabilir linke çeviren paylaşılan bir yardımcı (hal.js/esma.js/
  // terimler.js'in hepsi aynı deseni kullanıyor) -- burada YENİ bir içerik
  // yazmadan, var olan aciklama/neden metinlerindeki geçen kavramları
  // "eser → kavram → başka eser" gezintisine açıyor.
  function linkify(text) {
    return window.__dostCrossLink ? window.__dostCrossLink.linkify(text) : text;
  }

  const PX_PER_YIL = 90;
  const SOL_PAD = 60;
  const KART_W = 148;
  const KART_H = 40;
  const SAP_TABAN = 16;   // eksenden ilk katın kart altına kadar
  const KAT_ADIM = KART_H + 10;
  const AXIS_ALT_PAD = 44; // yıl etiketleri için eksenin altında bırakılan yer
  const R = 4;             // eksen üstündeki nokta -- artık asıl tıklama hedefi kart

  let data = null;
  let eserler = [];
  let baglar = [];
  let eserById = new Map();
  let zoom = null;
  let g = null;
  let focusId = null;
  let focusEdge = null;
  let axisY = 0;
  let minYil = 0;
  let contentH = 0;
  let contentW = 0;
  let contentX0 = 0;

  function boyut() {
    const r = wrapEl.getBoundingClientRect();
    // Telefonda harita: tuval alt gezinmenin üstünde biter; yatay telefonda
    // 305 px'tir, 360'lık alt sınır svg'yi alt gezinmenin arkasına taşırıyordu.
    const alt = GU.telefonMu && GU.telefonMu() && wrapEl.classList.contains("mg-telefon") ? 200 : 360;
    return { w: Math.max(alt, r.width), h: Math.max(alt, r.height) };
  }

  function xOfYil(yil) {
    return SOL_PAD + (yil - minYil) * PX_PER_YIL;
  }

  // Klasik takvim/genom-tarayıcı yığma algoritması: x'e göre sıralı liste
  // üzerinde ilerler, bir kartın x'i mevcut kattaki son kartla (KART_W +
  // boşluk kadar) çakışıyorsa bir üst kata geçer; kat, önceki kart yeterince
  // gerideyse yeniden kullanılır -- yükseklik sınırsız büyümez.
  function katAta(list) {
    const katSonX = [];
    list.forEach((d) => {
      let kat = 0;
      while (kat < katSonX.length && d.x - katSonX[kat] < KART_W + 14) kat++;
      katSonX[kat] = d.x;
      d.kat = kat;
    });
  }

  function yerlestir() {
    const { w, h } = boyut();
    minYil = eserler.length ? eserler[0].yil.miladi : 0;
    eserler.forEach((d) => { d.x = xOfYil(d.yil.miladi); });
    katAta(eserler);
    const maxKat = eserler.reduce((m, d) => Math.max(m, d.kat), 0);
    axisY = SAP_TABAN + (maxKat + 1) * KAT_ADIM;
    eserler.forEach((d) => { d.y = axisY; });
    contentH = axisY + AXIS_ALT_PAD;
    return { w, h };
  }

  // Yıl ekseni: 5'in katlarında düzgün tikler + her iki uçta gerçek
  // ilk/son yıl (veri hangi yıldan başlayıp bittiğini görünür kılmak için).
  // basla/bitis BİLEREK [minYil, maxYil] ARALIĞINA sıkıştırılıyor -- floor/
  // ceil ile dışarı taşan bir tik (örn. minYil=1193 iken 1190) veri
  // başlamadan/bittikten SONRA boşlukta asılı kalır ve eksenin gerçek
  // sınırlarını (getBBox ile ölçülen contentW/contentX0) yanlış genişletir.
  function yilTikleri() {
    if (!eserler.length) return [];
    const maxYil = eserler[eserler.length - 1].yil.miladi;
    const basla = Math.ceil(minYil / 5) * 5;
    const bitis = Math.floor(maxYil / 5) * 5;
    const tikler = [];
    for (let y = basla; y <= bitis; y += 5) tikler.push(y);
    if (!tikler.includes(minYil)) tikler.unshift(minYil);
    if (!tikler.includes(maxYil)) tikler.push(maxYil);
    return tikler;
  }

  // ---- Dikey telefon: dikey zaman ekseni (bkz. dosya başı) --------------
  // Ölçüler ekran pikseli (sahne k=1'de açılır). Sütun genişliği ekrandan:
  // 360 px'lik telefonda 139, Pixel 7'de 165 px.
  const D_PX = 70;      // yıl başına
  const D_KH = 48;      // kart yüksekliği (dokunma hedefi >= 44 px)
  const D_AX = 54;      // eksenin x'i (solunda yıl yazıları)
  const D_SAP = 12;     // eksenden ilk sütuna
  const D_ARA = 8;      // sütunlar ve alt alta kartlar arası
  const D_SAG = 8;      // sağ kenar payı
  const D_UST = 30;     // ilk yılın sahnedeki y'si
  function telefondaMi() {
    // GU.telefonOdakAlani: telefon katmanı ayrı iner; inmeden çizilirse
    // masaüstü düzeni çizilir, katman inince yeniden çizilir.
    return !!(GU.telefonMu && GU.telefonMu() && GU.telefonOdakAlani && wrapEl.classList.contains("mg-telefon"));
  }
  function dikeyMi() {
    return telefondaMi() && window.innerHeight > window.innerWidth;
  }
  // Yazıyı ölçerek kısaltır (karakter sayısıyla kısaltmak dar sütunda
  // taşıyor, geniş sütunda boşuna kesiyordu). Ölçülemiyorsa (gizli tuval)
  // karakter tahminine düşer; kip değişince resize zaten yeniden çizer.
  function sigdir(textEl, metin, maxW, pxBasina) {
    const n = textEl.node();
    n.textContent = metin;
    let w = n.getComputedTextLength();
    if (!w) { n.textContent = kisalt(metin, Math.max(6, Math.floor(maxW / pxBasina))); return; }
    if (w <= maxW) return;
    let s = metin.slice(0, Math.max(1, Math.floor(metin.length * maxW / w)));
    for (;;) {
      n.textContent = s.replace(/[\s,;:–—(/-]+$/, "") + "…";
      if (s.length <= 1 || n.getComputedTextLength() <= maxW) return;
      s = s.slice(0, -1);
    }
  }
  function cizDikey() {
    const { w, h } = boyut();
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`).classed("eser-agi--dikey", true);
    g = svg.append("g").attr("class", "eser-agi-scene");
    const kok = g.append("g");
    const kw = Math.max(110, Math.min(220, Math.floor((w - D_AX - D_SAP - D_ARA - D_SAG) / 2)));
    minYil = eserler.length ? eserler[0].yil.miladi : 0;
    const maxYil = eserler.length ? eserler[eserler.length - 1].yil.miladi : 0;
    const yOf = (yil) => D_UST + (yil - minYil) * D_PX;
    const sutunX = [D_AX + D_SAP, D_AX + D_SAP + kw + D_ARA];
    // İki sütunlu yığma: kart noktasının hizasında durmak ister; seçilen
    // sütun doluysa öteki denenir, ikisi de doluysa kart aşağı kayar.
    const sonY = [-1e9, -1e9];
    eserler.forEach((d) => {
      d.x = D_AX; d.y = yOf(d.yil.miladi);
      let s = sonY[0] <= sonY[1] ? 0 : 1;
      let ky = d.y - D_KH / 2;
      if (ky < sonY[s] + D_ARA) {
        if (ky >= sonY[1 - s] + D_ARA) s = 1 - s;
        else ky = sonY[s] + D_ARA;
      }
      d.__kx = sutunX[s] - D_AX; d.__ky = ky - d.y; sonY[s] = ky + D_KH;
    });
    const yEnd = Math.max(yOf(maxYil), ...eserler.map((d) => d.y + d.__ky + D_KH));
    contentH = yEnd + 24;
    contentX0 = 0; contentW = w;

    kok.append("line").attr("class", "eser-agi-eksen")
      .attr("x1", D_AX).attr("x2", D_AX).attr("y1", D_UST - 20).attr("y2", yEnd + 10);
    const tikSel = kok.append("g").attr("class", "eser-agi-tikler").selectAll("g.eser-agi-tik").data(yilTikleri()).join("g")
      .attr("class", "eser-agi-tik").attr("transform", (y) => `translate(${D_AX}, ${yOf(y)})`);
    tikSel.append("line").attr("x1", -7).attr("x2", 0);
    tikSel.append("text").attr("x", -11).attr("dy", "0.32em").attr("text-anchor", "end").text((y) => y);

    // Aynı şehir zinciri eksenin üstünde, noktadan noktaya (masaüstündeki
    // yatay parçanın dikey karşılığı; boyu yine gerçek zaman farkı).
    kok.append("g").attr("class", "eser-agi-kenarler").selectAll("line.eser-agi-kenar")
      .data(baglar, (d, i) => d.kaynak_id + "|" + i).join("line")
      .attr("class", "eser-agi-kenar").attr("pointer-events", "none")
      .attr("x1", D_AX).attr("x2", D_AX)
      .attr("y1", (d) => eserById.get(d.kaynak_id).y).attr("y2", (d) => eserById.get(d.hedef_id).y);

    // Saplar ayrı katmanda, kartların altında: ikinci sütunun sapı ilk
    // sütundaki kartın üstünden geçmesin.
    kok.append("g").attr("class", "eser-agi-saplar").selectAll("line").data(eserler, (d) => d.id).join("line")
      .attr("class", "eser-agi-eser__sap")
      .attr("x1", D_AX).attr("y1", (d) => d.y)
      .attr("x2", (d) => D_AX + d.__kx).attr("y2", (d) => d.y + d.__ky + D_KH / 2);

    const sel = kok.append("g").attr("class", "eser-agi-dugumler").selectAll("g.eser-agi-eser").data(eserler, (d) => d.id).join("g")
      .attr("class", (d) => "eser-agi-eser" + (d.ozel === "katalog" ? " eser-agi-eser--katalog" : ""))
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .attr("tabindex", 0).attr("role", "button").attr("aria-label", (d) => d.eser);
    // Dokunma alanı yalnız kartın kendisi (+4 px): sapı da kaplayan geniş
    // alan aşağı kaymış kartlarda komşu kartların üstüne taşıyordu.
    sel.append("rect").attr("class", "eser-agi-eser__vurus")
      .attr("x", (d) => d.__kx - 4).attr("width", kw + 8)
      .attr("y", (d) => d.__ky - 4).attr("height", D_KH + 8)
      .attr("fill", "transparent");
    sel.each(function (d) {
      const node = d3.select(this);
      const cls = "eser-agi-eser__nokta" + (d.yil.kesin ? "" : " eser-agi-eser__nokta--yaklasik");
      if (d.ozel === "katalog") node.append("path").attr("class", cls).attr("d", `M0,${-R * 1.4} L${R * 1.4},0 L0,${R * 1.4} L${-R * 1.4},0 Z`);
      else node.append("circle").attr("class", cls).attr("r", R + 1);
    });
    sel.append("rect").attr("class", (d) => "eser-agi-eser__govde" + (d.yil.kesin ? "" : " eser-agi-eser__govde--yaklasik"))
      .attr("x", (d) => d.__kx).attr("width", kw).attr("y", (d) => d.__ky).attr("height", D_KH).attr("rx", 8);
    const icW = kw - 16;
    sel.append("text").attr("class", "eser-agi-eser__baslik").attr("text-anchor", "middle")
      .attr("x", (d) => d.__kx + kw / 2).attr("y", (d) => d.__ky + 20)
      .each(function (d) { sigdir(d3.select(this), d.eser, icW, 7.2); });
    sel.append("text").attr("class", "eser-agi-eser__alt-satir").attr("text-anchor", "middle")
      .attr("x", (d) => d.__kx + kw / 2).attr("y", (d) => d.__ky + 37)
      .each(function (d) { sigdir(d3.select(this), (d.yil.hicri ? d.yil.hicri + "/" : "") + d.yil.miladi + " — " + tt(d.sehir), icW, 6.2); });
    sel.on("click", (ev, d) => eserPaneli(d))
      .on("focus", function (ev, d) { vurgulaEser(d.id, true); })
      .on("blur", function () { vurgulaEser(null, false); })
      .on("keydown", function (ev, d) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); eserPaneli(d); } });

    zoom = GU.createZoomBehavior(svg, g, [0.5, 3], null, { allowSingleTouchPan: true });
    // Bir ekran boyu pay: dokunulan kart (ilki de sonuncusu da) yarım
    // panelin üstündeki alanın ortasına çekilebilsin.
    zoom.translateExtent([[0, -h], [w, contentH + h]]);
    ortala(false);
  }

  function ciz() {
    if (dikeyMi()) return cizDikey();
    const { w, h } = yerlestir();
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${w} ${h}`).classed("eser-agi--dikey", false);
    g = svg.append("g").attr("class", "eser-agi-scene");
    const kok = g.append("g");

    const eksenSonX = eserler.length ? eserler[eserler.length - 1].x + KART_W : SOL_PAD;
    kok.append("line").attr("class", "eser-agi-eksen")
      .attr("x1", SOL_PAD - 12).attr("y1", axisY)
      .attr("x2", eksenSonX + 12).attr("y2", axisY);

    // Yıl tikleri -- eksenin gerçek bir zaman ekseni olduğunu görünür kılan
    // tek görsel öğe; kısa dikey çentik + altında yıl etiketi.
    const tikG = kok.append("g").attr("class", "eser-agi-tikler");
    const tikSel = tikG.selectAll("g.eser-agi-tik").data(yilTikleri()).join("g")
      .attr("class", "eser-agi-tik")
      .attr("transform", (y) => `translate(${xOfYil(y)}, ${axisY})`);
    tikSel.append("line").attr("y1", 0).attr("y2", 7);
    tikSel.append("text").attr("y", 20).attr("text-anchor", "middle").text((y) => y);

    // Kenarlar (aynı şehir zinciri) -- eksenin kendi çizgisi üzerinde,
    // kaynaktan hedefe YATAY bir parça (2026-08-09: eksen artık yıla
    // orantılı, bu yüzden bu parçanın GENİŞLİĞİ de iki eser arasındaki
    // gerçek zaman farkını gösteriyor -- eskiden sabit satır aralığında
    // her bağ aynı uzunluktaydı).
    const kenarG = kok.append("g").attr("class", "eser-agi-kenarler");
    const kenarSel = kenarG.selectAll("line.eser-agi-kenar").data(baglar, (d, i) => d.kaynak_id + "|" + i).join("line")
      .attr("class", "eser-agi-kenar")
      .attr("pointer-events", "none")
      .attr("x1", (d) => eserById.get(d.kaynak_id).x).attr("y1", axisY)
      .attr("x2", (d) => eserById.get(d.hedef_id).x).attr("y2", axisY);

    // İsabet şeridi (K-04/O-02, uzman paneli denetimi 2026-08-17): görünen
    // çizgi çok ince, doğrudan onun üstünde tabindex/click taşımak dokunmatik
    // ekranda tutturulmasını zorlaştırıyordu. ontology.js'teki path.link-hit
    // deseniyle aynı -- görünmez, kalın (bkz. style.css .link-hit),
    // etkileşimi taşıyan asıl şerit bu.
    const hitSel = kenarG.selectAll("line.link-hit").data(baglar, (d, i) => d.kaynak_id + "|" + i).join("line")
      .attr("class", "link-hit")
      .attr("x1", (d) => eserById.get(d.kaynak_id).x).attr("y1", axisY)
      .attr("x2", (d) => eserById.get(d.hedef_id).x).attr("y2", axisY);

    hitSel.on("mouseenter", function (ev, d) { vurgulaKenar(d, true); kenarIpucu(ev, d); })
      .on("mousemove", (ev) => GU.moveTooltip(tooltip, wrapEl, ev))
      .on("mouseleave", function () { vurgulaKenar(null, false); GU.hideTooltip(tooltip); })
      .on("click", (ev, d) => kenarPaneli(d));
    // Ürün denetimi P2-6 (2026-09-02): tabindex/role/aria-label/focus/blur/
    // keydown ortak yardımcıya taşındı (GU.wireEdgeAccessibility).
    GU.wireEdgeAccessibility(hitSel, {
      label: (d) => edgeAriaLabel(d),
      onFocus: (d) => vurgulaKenar(d, true),
      onBlur: () => vurgulaKenar(null, false),
      onActivate: (d) => kenarPaneli(d),
    });

    // Her eser artık eksende bir nokta + o noktadan yükselen bir sap + sapın
    // ucunda yüzen bir kart (2026-08-09, kullanıcının paylaştığı "Collection
    // Timeline" referansı). Çakışan tarihler laneAta()'nın verdiği "kat"a
    // göre üst üste yığılıyor -- her kat kendi sap uzunluğuyla.
    const dugumG = kok.append("g").attr("class", "eser-agi-dugumler");
    const sel = dugumG.selectAll("g.eser-agi-eser").data(eserler, (d) => d.id).join("g")
      .attr("class", (d) => "eser-agi-eser" + (d.ozel === "katalog" ? " eser-agi-eser--katalog" : ""))
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => d.eser);

    function sapUzunlugu(d) { return SAP_TABAN + d.kat * KAT_ADIM; }
    function kartAltY(d) { return -sapUzunlugu(d); }
    function kartUstY(d) { return kartAltY(d) - KART_H; }

    // Görünmez tıklama alanı küçük bir daire değil, kartın kendisi (+ pay)
    // -- asıl etkileşim yüzeyi kart. 2026-10-11: eskiden sapı da kaplayıp
    // eksene iniyordu; aynı yılın üst kattaki kartı alt kattakinin üstünü
    // örtüyor, alttaki karta dokunan üsttekinin panelini açıyordu (yatay
    // telefonda ölçüldü: Mevâki'u'n-nücûm -> Ankâ Mugrib). Görünüm aynı.
    sel.append("rect").attr("class", "eser-agi-eser__vurus")
      .attr("x", -(KART_W / 2 + 6)).attr("width", KART_W + 12)
      .attr("y", (d) => kartUstY(d) - 4).attr("height", KART_H + 8)
      .attr("fill", "transparent");

    sel.append("line").attr("class", "eser-agi-eser__sap")
      .attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", (d) => kartAltY(d));

    // kesin=false (tartışmalı tarih) olan eserler için ayrı bir görsel
    // sınıf ekleniyor -- CSS'te noktayı içi boş + kesikli çevre, kartın
    // kenarını da kesikli yapıyor. /eklem kronoloji ilkesi: "kesin
    // olmayan tarih, zaman ekseninde kesin gibi çizilmez".
    sel.each(function (d) {
      const node = d3.select(this);
      const noktaSinif = "eser-agi-eser__nokta" + (d.yil.kesin ? "" : " eser-agi-eser__nokta--yaklasik");
      if (d.ozel === "katalog") {
        node.append("path").attr("class", noktaSinif)
          .attr("d", `M0,${-R * 1.3} L${R * 1.3},0 L0,${R * 1.3} L${-R * 1.3},0 Z`);
      } else {
        node.append("circle").attr("class", noktaSinif).attr("r", R);
      }
    });

    sel.append("rect").attr("class", (d) => "eser-agi-eser__govde" + (d.yil.kesin ? "" : " eser-agi-eser__govde--yaklasik"))
      .attr("x", -(KART_W / 2)).attr("width", KART_W)
      .attr("y", (d) => kartUstY(d)).attr("height", KART_H)
      .attr("rx", 8);

    sel.append("text").attr("class", "eser-agi-eser__baslik")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", (d) => kartUstY(d) + 16)
      .text((d) => kisalt(d.eser, 20));

    sel.append("text").attr("class", "eser-agi-eser__alt-satir")
      .attr("text-anchor", "middle")
      .attr("x", 0).attr("y", (d) => kartUstY(d) + 31)
      .text((d) => (d.yil.hicri ? d.yil.hicri + "/" : "") + d.yil.miladi + " — " + kisalt(tt(d.sehir), 14));

    sel.on("mouseenter", function (ev, d) { vurgulaEser(d.id, true); ipucu(ev, d); })
      .on("mousemove", (ev) => GU.moveTooltip(tooltip, wrapEl, ev))
      .on("mouseleave", function () { vurgulaEser(null, false); GU.hideTooltip(tooltip); })
      .on("focus", function (ev, d) { vurgulaEser(d.id, true); })
      .on("blur", function () { vurgulaEser(null, false); })
      .on("click", (ev, d) => eserPaneli(d))
      .on("keydown", function (ev, d) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); eserPaneli(d); }
      });

    try {
      const bb = kok.node().getBBox();
      contentW = bb.width;
      contentX0 = bb.x;
    } catch (e) {
      contentW = eksenSonX + 60;
      contentX0 = 0;
    }

    // Eksen artık YATAY ve tipik olarak kapsayıcıdan çok daha geniş (45
    // yıllık bir aralık × 90px/yıl) -- ortala() bu yüzden YÜKSEKLİĞE göre
    // sığdırıp genişlikte kaydırmayı (tekerlek/sürükleme) serbest bırakıyor,
    // eski dikey sürümün tam tersi (bkz. o zamanki not: "sadece 5 düğüm
    // görünüyor" bulgusu -- burada da aynı sınıf bir sorun yaşanmaması için
    // translateExtent ve tekerlek dinleyicisi eksen yönüne göre kuruluyor).
    zoom = GU.createZoomBehavior(svg, g, [0.25, 3.5], null, { allowSingleTouchPan: true });
    const pad = 48;
    // Telefonda harita: dokunulan kart yarım panelin üstüne çekilebilsin
    // diye dikeyde bir ekran boyu pay (yoksa sınır kartı panelin altında
    // tutuyordu).
    const dikeyPay = GU.telefonMu && GU.telefonMu() && wrapEl.classList.contains("mg-telefon") ? Math.max(pad, wrapEl.clientHeight) : pad;
    zoom.translateExtent([
      [contentX0 - pad, -dikeyPay],
      [contentX0 + contentW + pad, contentH + dikeyPay],
    ]);
    ortala(false);
  }

  // Düz tekerlek = bu eksende YATAY kaydırma (esma.js'teki "düz tekerlek =
  // anlamlı bir hareket, Ctrl+tekerlek = klasik yakınlaştırma" kuralıyla
  // aynı ayrım, yön eksene göre değişti). Ctrl/Cmd basılıyken GU'nun kendi
  // "wheel.zoom" dinleyicisi zaten devrede; burada erken çıkılıp ona
  // karışılmıyor.
  function tekerlekleKaydir(e) {
    if (e.ctrlKey || e.metaKey) return;
    if (!zoom) return;
    e.preventDefault();
    const t = d3.zoomTransform(svgNode);
    if (svgNode.classList.contains("eser-agi--dikey")) zoom.translateBy(svg, 0, -e.deltaY / t.k);
    else zoom.translateBy(svg, -e.deltaY / t.k, 0);
  }

  function kisalt(s, n) {
    if (!s) return "";
    if (s.length <= n) return s;
    const kes = s.slice(0, n);
    const i = kes.lastIndexOf(" ");
    return (i > 8 ? kes.slice(0, i) : kes) + "…";
  }

  function vurgulaEser(id, on) {
    if (!g) return;
    g.selectAll("g.eser-agi-eser").classed("eser-agi-eser--deginiliyor", (d) => on && d.id === id);
  }
  function vurgulaKenar(d, on) {
    if (!g) return;
    g.selectAll("line.eser-agi-kenar").classed("eser-agi-kenar--deginiliyor", (l) => on && l === d);
  }

  function ipucu(ev, d) {
    tooltip.innerHTML =
      `<strong>${d.eser}</strong>` +
      `<span class="node-hover-tip__meta">${tt(d.sehir)} · ${d.yil.hicri ? d.yil.hicri + "/" : ""}${d.yil.miladi}</span>`;
    tooltip.hidden = false;
    GU.moveTooltip(tooltip, wrapEl, ev);
  }

  function edgeAriaLabel(d) {
    const a = eserById.get(d.kaynak_id), b = eserById.get(d.hedef_id);
    return (a ? a.eser : d.kaynak_id) + " → " + (b ? b.eser : d.hedef_id) + " — " + tt({ tr: "aynı şehir", en: "same city", pt: "mesma cidade" });
  }

  function kenarIpucu(ev, d) {
    const a = eserById.get(d.kaynak_id), b = eserById.get(d.hedef_id);
    tooltip.innerHTML = GU.edgeReasonHtml({
      title: (a ? a.eser : d.kaynak_id) + " → " + (b ? b.eser : d.hedef_id),
      kindLabel: tt({ tr: "aynı şehir", en: "same city", pt: "mesma cidade" }),
      reason: tt(d.neden),
    });
    tooltip.hidden = false;
    GU.moveTooltip(tooltip, wrapEl, ev);
  }

  // "Bu eser ağın neresinde?" -- kronolojik komşuları göstermek için ayrı
  // bir veri yapısına gerek yok, eserler zaten sıralı (bkz. yukle()); yalnız
  // dizideki komşu iki öğeyi okuyoruz. Süs değil: tıklanınca gerçekten o
  // esere gidiyor (wireIzAdimlari), ETKILESIM_DILI.md'nin "bağlanmamış
  // düğme" yasağına uyuyor.
  function izHtml(d) {
    const idx = eserler.indexOf(d);
    const onceki = idx > 0 ? eserler[idx - 1] : null;
    const sonraki = idx < eserler.length - 1 ? eserler[idx + 1] : null;
    if (!onceki && !sonraki) return "";
    const adim = (yon, hedef) => hedef
      ? `<button type="button" class="eser-agi-iz__adim eser-agi-iz__adim--${yon}" data-id="${hedef.id}">
          <span class="eser-agi-iz__etiket">${tt(yon === "once"
            ? { tr: "Öncesinde", en: "Before", pt: "Antes" }
            : { tr: "Sonrasında", en: "After", pt: "Depois" })}</span>
          <span class="eser-agi-iz__eser">${hedef.eser}</span></button>`
      : "<span></span>";
    return `<nav class="eser-agi-iz" aria-label="${tt({ tr: "Ağdaki komşu eserler", en: "Neighbouring works in the network", pt: "Obras vizinhas na rede" })}">
      ${adim("once", onceki)}${adim("sonra", sonraki)}</nav>`;
  }

  function wireIzAdimlari() {
    detailContent.querySelectorAll(".eser-agi-iz__adim").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hedef = eserById.get(btn.dataset.id);
        if (hedef) { eserPaneli(hedef); panaGetir(hedef); }
      });
    });
  }

  // Telefonda seçilen kart yarım panelin üstündeki alanın ortasına gelir
  // (dikey eksende yalnız dikeyde kayar: kart yana sıçramaz).
  function telefondaOrtala(el, a) {
    if (!zoom || !el || !el.isConnected) return;
    const r = (el.querySelector("rect.eser-agi-eser__govde") || el).getBoundingClientRect();
    if (!r.width) return; // liste kipinde tuval gizli
    const dx = dikeyMi() ? 0 : a.cx - (r.left + r.width / 2);
    const dy = a.cy - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) <= 6) return;
    const k = d3.zoomTransform(svgNode).k;
    (reduceMotion ? svg : svg.transition().duration(380)).call(zoom.translateBy, dx / k, dy / k);
  }
  function telefondaSecileneGit(d) {
    // Panel (ve kabuğun yarım panel sınıfı) yerleştikten sonra.
    setTimeout(() => requestAnimationFrame(() => {
      if (detailPanel.hidden) return;
      const el = g && g.selectAll("g.eser-agi-eser").filter((x) => x === d).node();
      telefondaOrtala(el, GU.telefonOdakAlani(wrapEl, true));
    }), 60);
  }

  function panaGetir(d) {
    if (!zoom) return;
    if (telefondaMi() && GU.telefonOdakAlani) { telefondaSecileneGit(d); return; }
    const hedef = reduceMotion ? svg : svg.transition().duration(360);
    zoom.translateTo(hedef, d.x, contentH / 2);
  }

  function eserPaneli(d) {
    // Seçim adrese yazılır (/eser-agi/<id>): Paylaş düğmesi location.href'i
    // paylaşıyor ve seçili kayıt yerine görünümün kökünü veriyordu
    // (2026-10-08 taraması). Derin bağlantı goToNode ile zaten çalışıyordu.
    if (window.__dostNav) window.__dostNav.setHash("eser-agi", String(d.id));
    focusId = d.id;
    focusEdge = null;
    const katalogRozet = d.ozel === "katalog"
      ? `<span class="eser-agi-rozet">${tt({ tr: "katalog", en: "catalogue", pt: "catálogo" })}</span>` : "";
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Eser", en: "Work", pt: "Obra" })}${katalogRozet}</p>
      <h2 class="detail-title">${d.eser}</h2>
      <p class="eser-agi-kimlik">${d.yil.hicri ? d.yil.hicri + "/" : ""}${d.yil.miladi}${d.yil.kesin ? "" : " " + tt({ tr: "(yaklaşık)", en: "(approximate)", pt: "(aproximado)" })} — ${tt(d.sehir)}${d.sehir_belirsiz ? " " + tt({ tr: "(şehir belirsiz)", en: "(city uncertain)", pt: "(cidade incerta)" }) : ""}</p>
      ${izHtml(d)}
      <div class="detail-block detail-block--soru"><p>${linkify(tt(d.aciklama))}</p></div>
      ${dayanakHtml(d)}
      ${sehirDayanakHtml(d)}
      <details class="eser-agi-kaynak-detay">
        <summary>${tt({ tr: "Kaynak ve yöntem", en: "Source and method", pt: "Fonte e método" })}</summary>
        <p class="elestiri-kaynak-satiri">${data.kaynak.yazar}, <em>${data.kaynak.eser}</em></p>
      </details>`;
    detailPanel.hidden = false;
    vurgulaEser(d.id, true);
    wireIzAdimlari();
  }

  // /eklem kronoloji A4: eser paneline "Tarih dayanağı" bölümü.
  // dayanak alanı data'da varsa gösterilir; yoksa hiç çizilmez (backward
  // compatible). Güven seviyesi (yuksek/orta/dusuk) küçük bir rozet olur.
  function dayanakHtml(d) {
    const dayanaklar = d.yil && d.yil.dayanak;
    if (!Array.isArray(dayanaklar) || !dayanaklar.length) return "";
    const guvenEtiket = { yuksek: { tr: "yüksek güven", en: "high confidence", pt: "confiança alta" },
                          orta: { tr: "orta güven", en: "medium confidence", pt: "confiança média" },
                          dusuk: { tr: "düşük güven", en: "low confidence", pt: "confiança baixa" } };
    const baslik = tt({ tr: "Tarih dayanağı", en: "Date evidence", pt: "Base da datação" });
    const satirlar = dayanaklar.map((r) => {
      const g = guvenEtiket[r.guven] || guvenEtiket.orta;
      return `<li><span class="eser-agi-dayanak__guven eser-agi-dayanak__guven--${r.guven}">${tt(g)}</span> ${r.detay}</li>`;
    }).join("");
    const notu = d.yil.not
      ? `<p class="eser-agi-dayanak__not">${d.yil.not}</p>` : "";
    return `<details class="eser-agi-dayanak" open>
      <summary>${baslik}</summary>
      <ul class="eser-agi-dayanak__liste">${satirlar}</ul>
      ${notu}
    </details>`;
  }

  // /birlestir onkoşul: eser paneline "Şehir dayanağı" bölümü. Tarih
  // dayanağının paraleli -- şehir bilgisi belirsiz ya da çoklu ise
  // (sehir_belirsiz=true, ya da "Mekke → Şam" / "Mekke / Halep" gibi
  // geçişli), dayanağın açıkça belgelenmesi gerekir. Yıl.dayanak ile
  // aynı görsel gramer.
  function sehirDayanakHtml(d) {
    const dayanaklar = d.sehir_dayanak;
    if (!Array.isArray(dayanaklar) || !dayanaklar.length) return "";
    const guvenEtiket = { yuksek: { tr: "yüksek güven", en: "high confidence", pt: "confiança alta" },
                          orta: { tr: "orta güven", en: "medium confidence", pt: "confiança média" },
                          dusuk: { tr: "düşük güven", en: "low confidence", pt: "confiança baixa" } };
    const baslik = tt({ tr: "Şehir dayanağı", en: "City evidence", pt: "Base do local" });
    const satirlar = dayanaklar.map((r) => {
      const g = guvenEtiket[r.guven] || guvenEtiket.orta;
      return `<li><span class="eser-agi-dayanak__guven eser-agi-dayanak__guven--${r.guven}">${tt(g)}</span> ${r.detay}</li>`;
    }).join("");
    return `<details class="eser-agi-dayanak" open>
      <summary>${baslik}</summary>
      <ul class="eser-agi-dayanak__liste">${satirlar}</ul>
    </details>`;
  }

  function kenarPaneli(b) {
    focusEdge = b;
    focusId = null;
    const a = eserById.get(b.kaynak_id), h = eserById.get(b.hedef_id);
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Bağ", en: "Connection", pt: "Ligação" })}
        <span class="eser-agi-rozet">${tt({ tr: "aynı şehir", en: "same city", pt: "mesma cidade" })}</span></p>
      <h2 class="detail-title">${a ? a.eser : b.kaynak_id} → ${h ? h.eser : b.hedef_id}</h2>
      <div class="detail-block detail-block--soru"><p>${linkify(tt(b.neden))}</p></div>`;
    detailPanel.hidden = false;
    vurgulaKenar(b, true);
  }

  function girisPaneli() {
    focusId = null;
    focusEdge = null;
    // Kaç eser tartışmalı tarihe sahip? Bu bir "durum tablosu" değil,
    // eserler yüklendikçe ölçülen bir sayı -- panelin altında da bir kez
    // sayılıyor ki kullanıcı grafik dolu iken de görsün.
    const tartismali = eserler.filter((e) => !e.yil.kesin).length;
    const sehirBelirsiz = eserler.filter((e) => e.sehir_belirsiz).length;
    const yontemNotu = tt({
      tr: "Tarih ve şehir bilgileri MIAS'ın 'Selected Major Works' listesinden (Osman Yahia 1964 tasnifine dayanır) alınıp elle işlendi. Her eserde 'Tarih dayanağı' ve gerektiğinde 'Şehir dayanağı' bölümleri hangi kaynağın ne kadar güvenle konuştuğunu belgeliyor; " + tartismali + "/" + eserler.length + " eserin tarihi kaynaklar arasında tartışmalıdır ve grafikte içi boş, kesikli çevreyle gösterilir. " + sehirBelirsiz + "/" + eserler.length + " eserin ise şehri belirsiz — birleşik grafik yapıldığında mekân eksenine giremezler. Zaten bilinmeyen bir bilgiyi bilinir gibi çizmiyoruz.",
      en: "Dates and cities come from MIAS's 'Selected Major Works' list (itself based on Osman Yahia's 1964 classification), manually curated. Each work carries a 'Date evidence' block and, where needed, a 'City evidence' block documenting how confidently each source speaks; " + tartismali + "/" + eserler.length + " works have contested dates and are shown with hollow, dashed circles. " + sehirBelirsiz + "/" + eserler.length + " works have an uncertain city — when a combined graph is built they cannot enter the spatial axis. We do not draw an unknown as if it were known.",
      pt: "As datas e cidades vêm da lista 'Selected Major Works' da MIAS (baseada na classificação de Osman Yahia de 1964), curadas manualmente. Cada obra traz um bloco 'Base da datação' e, quando necessário, um bloco 'Base do local' que documenta com que confiança cada fonte fala; " + tartismali + "/" + eserler.length + " obras têm datas contestadas e são mostradas com círculos vazios e tracejados. " + sehirBelirsiz + "/" + eserler.length + " obras têm cidade incerta — quando um gráfico combinado for construído não podem entrar no eixo espacial. Não desenhamos o desconhecido como se fosse conhecido.",
    });
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Eser Ağı", en: "The Works Timeline", pt: "A Linha do Tempo das Obras" })}</p>
      <h2 class="detail-title">${eserler.length} ${tt({ tr: "eser", en: "works", pt: "obras" })}, ${baglar.length} ${tt({ tr: "bağ", en: "connections", pt: "ligações" })}</h2>
      <div class="detail-block detail-block--soru"><p>${linkify(tt(data.not))}</p></div>
      <details class="eser-agi-kaynak-detay">
        <summary>${tt({ tr: "Kaynak ve yöntem", en: "Source and method", pt: "Fonte e método" })}</summary>
        <p class="elestiri-kaynak-satiri elestiri-kaynak-satiri--omurga">${data.kaynak.yazar}, <em>${data.kaynak.eser}</em></p>
        <p class="eser-agi-yontem-notu">${yontemNotu}</p>
      </details>`;
    detailPanel.hidden = false;
  }

  // 2026-08-09: eksen artık YATAY ve tipik olarak kapsayıcıdan çok daha
  // geniş (45 yıl × 90px/yıl ≈ 4000px) -- eski dikey sürümün tam tersi.
  // ortala() bu yüzden YÜKSEKLİĞE göre sığdırıyor (tüm katlar+eksen+yıl
  // etiketleri tek bakışta görünsün) ve sahneyi en BAŞA (en erken yıla)
  // yaslıyor -- ortalamak değil, kronolojinin başlangıcından açmak: bir
  // "yolculuk" ilk durağıyla başlar. 68px üst boşluk bilerek sabit:
  // recenter+hint düğmeleri sol üstte top:12/left:12-108 bandını kaplıyor
  // (bkz. style.css .graph-recenter/.graph-hint) -- ilk kart oraya denk
  // gelirse tıklanamaz hâle geliyordu (Playwright'ta ölçüldü, 2026-08-06,
  // aynı ölçüm burada da geçerli).
  function ortala(animate) {
    if (!zoom) return;
    // Dikey eksen: k=1 (ölçüler zaten ekran pikseli), kronoloji en erken
    // eserden açılır -- ilk kart odak alanının tepesinde.
    if (svgNode.classList.contains("eser-agi--dikey")) {
      const a = GU.telefonOdakAlani(wrapEl, false), sr = svgNode.getBoundingClientRect();
      const ilkUst = eserler.length ? Math.min(...eserler.map((d) => d.y + d.__ky)) : 0;
      const t = d3.zoomIdentity.translate(0, a.y - sr.top + 4 - ilkUst);
      (animate && !reduceMotion ? svg.transition().duration(420) : svg).call(zoom.transform, t);
      return;
    }
    // Telefonda harita (taslak): okuma ölçeği. Sığdırmak (k=0,5) kartları
    // 74 px'e, yazıyı 5,4 px'e indiriyordu -- 28 eserin 5'i ekrandaydı ama
    // hiçbiri okunmuyordu (ölçüldü). Telefonda kart yazısı en az ~12 px
    // (k >= 1,1); bütün katlar odak alanına sığıyorsa biraz daha büyür.
    // Kronoloji en erken eserden açılır, tek parmak yatayda gezdirir.
    if (telefondaMi()) {
      const a = GU.telefonOdakAlani(wrapEl, false);
      const sr = svgNode.getBoundingClientRect();
      const k = Math.max(1.1, Math.min(1.5, (a.h - 16) / Math.max(1, contentH)));
      const tx = (a.x - sr.left) + 8 - contentX0 * k;
      const ty = (a.cy - sr.top) - (contentH * k) / 2;
      const t = d3.zoomIdentity.translate(tx, ty).scale(k);
      const hedef = animate && !reduceMotion ? svg.transition().duration(420) : svg;
      hedef.call(zoom.transform, t);
      return;
    }
    const { w, h } = boyut();
    const availH = Math.max(120, h - 96);
    const availW = Math.max(160, w - 48);
    // Salt YÜKSEKLİĞE göre sığdırmak (kısa içerik, geniş kapsayıcıda) aşırı
    // yakınlaştırırdı -- en sık kümede bile birkaç kat olduğundan contentH
    // küçük kalıyor, k=2'ye tırmanıp yalnız birkaç yıl gösterirdi. En az
    // ~12 yıllık bir pencere görünür kalsın diye ikinci bir üst sınır daha:
    // ikisinin küçüğü (daha uzak görünüm) seçiliyor.
    const kYukseklik = availH / Math.max(1, contentH);
    const kYilPenceresi = availW / (12 * PX_PER_YIL);
    const k = Math.max(0.5, Math.min(2, kYukseklik, kYilPenceresi));
    const tx = Math.max(24, 24 - contentX0 * k);
    const ty = Math.max(68, (h - contentH * k) / 2);
    const t = d3.zoomIdentity.translate(tx, ty).scale(k);
    const hedef = animate && !reduceMotion ? svg.transition().duration(420) : svg;
    hedef.call(zoom.transform, t);
  }

  let yuklendi = false;
  function yukle() {
    if (yuklendi) return Promise.resolve();
    const base = window.__dostRouteBase || "";
    const url = (base ? base + "/" : "") + "data/ibn-arabi/eser-agi.json";
    return GU.fetchJson(url).then((d) => {
      data = d;
      // Satır sırası doğrudan yıla dayanıyor artık (bkz. yerlestir()) --
      // veri zaten kronolojik ama sırayı veriye bırakmak yerine burada
      // garanti ediyoruz.
      eserler = (d.eserler || []).map((e) => Object.assign({}, e))
        .sort((a, b) => a.yil.miladi - b.yil.miladi);
      baglar = d.baglar || [];
      eserById = new Map(eserler.map((e) => [e.id, e]));
      yuklendi = true;
      ciz();
    });
  }

  let baglandi = false;
  function baglaBirKez() {
    if (baglandi) return;
    baglandi = true;
    GU.wireRecenter("eser-agi-recenter", () => ortala(true));
    svgNode.addEventListener("wheel", tekerlekleKaydir, { passive: false });
    if (GU.setupDetailPanelFocus) GU.setupDetailPanelFocus();
    GU.registerStepBack("eser-agi-wrap", () => {
      if (focusId || focusEdge) {
        // Esc sözleşmesi: önce açık panel kapanır (ETKILESIM_DILI.md).
        // Eskiden kaydın paneli kullanıcının hiç görmediği giriş paneliyle
        // değişiyor, ancak ikinci Esc kapatıyordu (2026-10-08 taraması).
        girisPaneli();
        detailPanel.hidden = true;
        if (window.__dostNav) window.__dostNav.setHash("eser-agi");
        return true;
      }
      return false;
    });
    window.addEventListener("resize", GU.debounceResize(() => {
      if (!yuklendi || wrapEl.hidden) return;
      ciz();
      // Telefonda yön değişince (ya da katman geç inince) açık paneldeki
      // kart yeniden ekrana gelir; yoksa çizim kronolojinin başından açar.
      if (focusId && !detailPanel.hidden) {
        vurgulaEser(focusId, true);
        if (telefondaMi()) telefondaSecileneGit(eserById.get(focusId));
      }
    }));
  }

  // 2026-08-17 (uzman paneli denetimi, O-01/F4 devamı -- Dalga 2.5): ağ dar
  // ekranda okunmuyor. Eser adı tek dilli bir başlık (özgün eser adı), üç
  // dile aynen taşınıyor; kısa özet mevcut üç dilli açıklamadan.
  const eserAgiMobilListe = GU.createMobileListFallback({
    wrapEl: wrapEl,
    listEl: document.getElementById("eser-agi-mobil-liste"),
    // yukle() ile AYNI url dizesi -- GU.fetchJson url-anahtarlı önbellek
    // kullandığı için fark, önizleme dağıtımında çift indirme olurdu.
    fetchUrl: ((window.__dostRouteBase || "") ? (window.__dostRouteBase + "/") : "") + "data/ibn-arabi/eser-agi.json",
    extractNodes: (d) => (d.eserler || []).map((e) => ({
      id: e.id,
      name: { tr: e.eser, en: e.eser, pt: e.eser },
      short: e.aciklama,
      __katalog: e.ozel === "katalog",
    })),
    // Satır işareti grafikteki rengin aynısı (2026-10-09 görsel taraması).
    pipColor: (n) => (n.__katalog ? "var(--series-theme)" : "var(--series-ibnarabi)"),
    title: { tr: "Eser Ağı", en: "Network of Works", pt: "Rede de Obras" },
    graphButtonLabel: {
      tr: "Haritayı aç (ağı göster)",
      en: "Open the map (show the network)",
      pt: "Abrir o mapa (mostrar a rede)",
    },
    goTo: (id) => window.__eserAgiApp.goToNode(id),
  });

  // Telefonda harita (2026-10-10, taslak): telefonda zaman çizelgesi önce
  // açılır, liste hapın ikinci kipi. Dokunulan kart yarım panelin üstündeki
  // alanda ortalanır.
  if (GU.telefonHaritasi) {
    GU.telefonHaritasi({
      wrapEl: wrapEl,
      liste: eserAgiMobilListe,
      dugumSecici: "g.eser-agi-eser",
      isaret: "rect.eser-agi-eser__govde",
      kaydir(dx, dy) {
        if (!zoom) return;
        const k = d3.zoomTransform(svgNode).k;
        (reduceMotion ? svg : svg.transition().duration(380)).call(zoom.translateBy, dx / k, dy / k);
      },
      // Dikey eksende seçilen kart yalnız dikeyde kayar (style.css: lejant
      // orada sağ üstte, alttaki kartları örtmez).
      merkezle: telefondaOrtala,
    });
  }

  return {
    activate() {
      // 2026-08-06 kullanıcı bulgusu: girisPaneli() burada çağrılıp panel
      // her açılışta otomatik gösteriliyordu -- artık yalnız bir eser/bağ
      // seçildiğinde açılıyor (bkz. hocalar.js'teki aynı düzeltme).
      baglaBirKez();
      yukle().then(() => { ciz(); }).catch(() => {
        if (window.DostViewStatus) window.DostViewStatus.showError("eser-agi-wrap", () => window.__eserAgiApp.activate());
      });
    },
    onLangChange() {
      if (eserAgiMobilListe) eserAgiMobilListe.onLangChange();
      if (!yuklendi) return;
      ciz();
      if (focusId) {
        const d = eserById.get(focusId);
        if (d) eserPaneli(d); else if (!detailPanel.hidden) girisPaneli();
      } else if (focusEdge) {
        kenarPaneli(focusEdge);
      } else if (!detailPanel.hidden) girisPaneli();
    },
    goToNode(id) {
      this.activate();
      yukle().then(() => {
        const d = eserById.get(id);
        if (d) {
          eserPaneli(d);
          // Telefonda doğrudan adresle gelinen kart ekranda olsun (dikey
          // eksende 1240'taki bir eser açılışta ekranın çok altında).
          if (telefondaMi() && GU.telefonOdakAlani) telefondaSecileneGit(d);
        }
        // Bulunamayan kimlik adres çubuğunda kalmasın (2026-10-08 taraması).
        else if (id && window.__dostNav) window.__dostNav.setHash("eser-agi");
      });
    },
  };
})();
