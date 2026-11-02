/* Ontoloji mobil alternatif liste (2026-08-10, denetim raporu 16-A).
 * Grafik mobilde okunmuyor (G57 CONFIRMED); bu liste veriyi aynı sırada
 * gösterir ve her satır düğüm paneline gider. Grafiği açma seçeneği
 * korunuyor -- "Bu bir kimlik değil, bir kolaylık" duruşu: harita
 * sitenin görsel kimliği ama okunmayan kimlik yüktür (EK A.2).
 * Masaüstünde liste hep gizli (CSS media query); JS yalnız içeriği doldurur.
 *
 * 2026-08-16 (uzman paneli denetimi, O-01/F4): bu dosyanın kurduğu desen
 * GU.createMobileListFallback'e taşındı ki Esmâ/Sırlar aynı çözümü tekrar
 * yazmadan kullanabilsin (bkz. assets/esma.js, assets/sirlar-graph.js).
 * Bu dosya artık yalnız Ontoloji'ye özel veri şekli (OMURGA/YAN gruplaması,
 * pip renkleri) ile o ortak yardımcıyı çağırıyor.
 */
(function () {
  "use strict";

  const GU = window.DostGraphUtils;
  const wrap = document.getElementById("ontology-wrap");
  const listeEl = document.getElementById("ontoloji-mobil-liste");
  if (!wrap || !listeEl || !GU) return;

  // Aşağıdaki sıra ontology.json'daki iniş omurgasını izliyor:
  // Zât → Esmâ → A'yân → Tecellî → 3 âlem → İnsan-ı Kâmil → Kalp → Zât'a dönüş.
  // Halîfe/Velî/Perde/Kazâ/Teceddüd/Bilinen-Bilinmeyen "yan" kavramlar; ana
  // omurga altında ayrı bir grupta.
  // 2026-10-09: masaüstü grafiği de aynı omurgayı çemberin çevresine diziyor;
  // sıra tek yerde (ontology.js OMURGA -> window.DostOntolojiOmurga) dursun
  // diye oradan okunuyor. ontology.js bu dosyadan önce yüklenir (index.html);
  // yine de yoksa aynı sıra burada yedek olarak duruyor.
  const OMURGA = (window.DostOntolojiOmurga && window.DostOntolojiOmurga.length)
    ? window.DostOntolojiOmurga.slice()
    : [
      "dhat", "sifat-asma", "ayan-sabite", "tecelli",
      "alem-ervah", "alem-misal", "alem-ecsam",
      "insan-i-kamil", "kalp",
    ];
  const YAN = [
    "kaza-kader", "perde", "teceddud",
    "veli", "halife", "bilinen-bilinmeyen",
  ];

  function pipCls(node) {
    if (node.id === "dhat") return "mobil-liste__pip--zat";
    if (node.id === "kalp") return "mobil-liste__pip--return";
    if (node.id === "teceddud") return "mobil-liste__pip--paradox";
    return "";
  }

  function goToNode(id) {
    if (window.__dostNav && typeof window.__dostNav.goTo === "function") {
      window.__dostNav.goTo("ontoloji", id);
    } else {
      const base = window.__dostRouteBase || "";
      history.pushState(null, "", base + "/ontoloji/" + id + "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }

  const base = (document.querySelector("base") && document.querySelector("base").getAttribute("href")) || "/";
  const url = base.replace(/\/+$/, "") + "/data/ibn-arabi/ontology.json";

  window.__ontolojiMobilListeApp = GU.createMobileListFallback({
    wrapEl: wrap,
    listEl: listeEl,
    fetchUrl: url,
    extractNodes: (d) => d.nodes || [],
    groups: [
      { title: null, ids: OMURGA },
      {
        title: { tr: "Yan Kavramlar", en: "Adjacent Concepts", pt: "Conceitos Adjacentes" },
        ids: YAN,
      },
    ],
    pipClass: pipCls,
    title: { tr: "Varlık Mertebeleri", en: "The Ranks of Being", pt: "As Hierarquias do Ser" },
    graphButtonLabel: {
      tr: "Haritayı aç (grafiği göster)",
      en: "Open the map (show the graph)",
      pt: "Abrir o mapa (mostrar o grafo)",
    },
    goTo: goToNode,
  }) || { onLangChange: () => {} };

  // Telefonda harita (2026-10-10, taslak): telefonda grafik önce açılır,
  // liste hapın ikinci kipi. Kamera ontology.js'in d3-zoom'u
  // (window.__ontologyZoom); adlar ekranda 12 px, çakışan gizlenir --
  // öncelik Zât, sonra omurga, sonra yan kavramlar.
  if (GU.telefonHaritasi) {
    const omurgaSira = new Map(OMURGA.map((id, i) => [id, i]));
    GU.telefonHaritasi({
      wrapEl: wrap,
      liste: window.__ontolojiMobilListeApp,
      dugumSecici: "g.node",
      isaret: "circle.node-govde",
      kaydir(dx, dy) {
        const z = window.__ontologyZoom;
        if (!z) return;
        const k = d3.zoomTransform(z.svg.node()).k;
        const az = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        (az ? z.svg : z.svg.transition().duration(420)).call(z.zoom.translateBy, dx / k, dy / k);
      },
      etiket: {
        secici: "text.node-label",
        px: 12,
        oncelik(el) {
          const d = el.__data__ || {};
          if (d.id === "dhat") return 100;
          if (omurgaSira.has(d.id)) return 50 - omurgaSira.get(d.id);
          return 10;
        },
      },
    });
  }
})();
