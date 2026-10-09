// Bilmiyoruz — görüşün sisli kenarı.
//
// NEDEN BU BİÇİM (GORSEL_DIL.md: "kavramı resmetme, davranışını resmet";
// 2026-08-19 yeniden tasarım -- eski yay-boşluk idiomu acik-sorular.js ile
// ayırt edilemiyordu). Burada ölçülen şey bizim iz sayımız değil, maddenin
// KENDİ doğasının ne kadar bilinebilir olduğu. Bu yüzden her madde,
// görüş dairemizin SINIRINDA duran bir ışık: `durum`una göre sisin daha
// derinine gömülü (tartismali en derin/en bulanık, bizim_sinirimiz sınıra
// en yakın/en az bulanık). Bulanıklık = bilgisizlik eşleşmesi (GORSEL_DIL)
// burada ilk kez bir graf görünümünün ana kodlaması. Değinince ışık bir
// nebze toparlanır ama HİÇBİR ZAMAN tam netleşmez -- "kaçan merkez"
// davranışı: bu maddeler hover'la çözülecek şeyler değil.
//
// Görüş dairesi (net iç alan + sise geçen kenar) CLAUDE.md'nin
// daire/merkez ilkesini koruyor; merkezde yine bir cevap değil bir sayı.
//
// ETKILESIM_DILI.md sözleşmesi: değinmek (hover) = ipucu; seçmek
// (tıklama) = panel; bir adım geri (ESC) = panelden halkaya. Bağlanmamış
// düğme yok -- #bilmiyoruz-recenter GU.wireRecenter ile gerçekten bağlı.
window.__bilmiyoruzApp = (function () {
  "use strict";

  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const svg = d3.select("#bilmiyoruz-graph");
  const svgNode = svg.node();
  const wrapEl = document.getElementById("bilmiyoruz-wrap");
  const tooltip = document.getElementById("bilmiyoruz-tooltip");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");

  if (!svgNode || !wrapEl) return { activate() {}, onLangChange() {}, goToNode() {} };

  const tt = I18n.pick3;  // window.DostI18n.pick3 zaten (!obj) koruması yapıyor (2026-08-15: 26 dosyadaki tekrar buraya toplandı)

  // Sitede üç ayrı "soru" görünümü var (Sorular/Bilmiyoruz/Açık Sorular) --
  // isim benzerliği kafa karıştırabiliyor (kullanıcı bulgusu, 2026-08-09).
  // sorular.js'teki AYNI fonksiyon (görünümler birbirinden bağımsız tembel
  // yükleniyor, paylaşılamaz -- tt() de aynı sebeple her dosyada ayrı).
  function soruAilesiNavHtml(buradaki) {
    const base = window.__dostRouteBase || "";
    const AILE = {
      sorular: { view: "sorular", href: "/sorular", baslik: { tr: "Sorular", en: "Questions", pt: "Perguntas" }, aciklama: { tr: "okuyucuya cevap veren bir SSS", en: "an FAQ that answers the reader", pt: "um FAQ que responde ao leitor" } },
      bilmiyoruz: { view: "bilmiyoruz", href: "/bilmiyoruz", baslik: { tr: "Bilmiyoruz", en: "We Don't Know", pt: "Não Sabemos" }, aciklama: { tr: "metnin kendi çözülmemiş noktaları — biz sormuyoruz, sınırı o gösteriyor", en: "the text's own unresolved points — not our question, its own limit", pt: "os próprios pontos não resolvidos do texto" } },
    };
    const digerleri = Object.keys(AILE).filter((k) => k !== buradaki);
    const linkler = digerleri.map((k) => {
      const a = AILE[k];
      return `<a class="soru-ailesi-nav__link" href="${base}${a.href}" data-view="${a.view}">
        <strong>${tt(a.baslik)}</strong><span>${tt(a.aciklama)}</span>
      </a>`;
    }).join("");
    return `<div class="soru-ailesi-nav">
      <p class="soru-ailesi-nav__baslik">${tt({ tr: "Sitede iki ayrı “soru” görünümü var, birbirinin yerine geçmiyor:", en: "The site has two separate “question” views, not interchangeable:", pt: "O site tem duas vistas de “pergunta” diferentes, não intercambiáveis:" })}</p>
      ${linkler}
    </div>`;
  }

  // Durumun görsel kodlaması (2026-10-09, gorsel-gramer dalgası).
  // Veride ayrımı taşıyan alan `durum`. Sayfanın kendi manifestosu iki türü
  // ayırıyor -- "alanın kendisi anlaşamıyor" (tartismali) ve "bizim
  // doğrulayabildiğimiz burada bitiyor" (bizim_sinirimiz). GORSEL_DIL'in
  // sabit eşleşmeleri buna birebir oturuyor:
  //   - tartismali      -> DERİN GÖLGE (gölge = gizlilik): mesele nesnenin
  //                        kendisinde örtülü; ortada bir cisim yok, gölge var.
  //   - bizim_sinirimiz -> BULANIKLIK (bulanıklık = bilgisizlik): cisim
  //                        orada, gözümüz onu çözemiyor.
  //   - belirsiz        -> ikisinin arası: yarı gölge + hafif bulanıklık
  //                        ("sınırları henüz net değil").
  // Eskiden merkezde sıcak altın bir ışıma vardı (ışık = zuhûr; bilinmeyeni
  // ışıkla merkezlemek eşleşmeyi tersine çeviriyordu) ve maddeler renkli
  // ışık noktalarıydı; ikisi de kalktı. Her madde artık nötr bir sisin
  // içinde duruyor.
  // derinlik: görüş yarıçapının ÜSTÜNE binen pay (tartışmalı en derinde).
  // golge: 0..1 gölge yoğunluğu. blur: cismin bulanıklığı, kullanıcı
  // biriminde -- yakınlaşınca sahneyle birlikte ölçeklenir, yani etiket
  // büyüyüp okunurken cisim yakından da aynı ölçüde çözülmez kalır
  // (perde-zinciri'ndeki blurCore mantığı: ışık artar, çözünürlük artmaz).
  const KODLAMA = {
    tartismali:      { derinlik: 0.30, golge: 1.0, blur: 0,
      ad: { tr: "Derin gölge", en: "Deep shadow", pt: "Sombra profunda" } },
    belirsiz:        { derinlik: 0.18, golge: 0.45, blur: 1.8,
      ad: { tr: "Yarı gölge, bulanık", en: "Half shadow, blurred", pt: "Meia sombra, desfocado" } },
    bizim_sinirimiz: { derinlik: 0.08, golge: 0, blur: 3.4,
      ad: { tr: "Bulanıklık", en: "Blur", pt: "Desfocado" } },
  };
  const DURUM_SIRASI = ["tartismali", "belirsiz", "bizim_sinirimiz"];
  const kodAdi = (d) => (KODLAMA[d.durum] ? d.durum : "belirsiz");
  const kod = (d) => KODLAMA[kodAdi(d)];

  let data = null;
  let nodes = [];
  let zoom = null;
  let g = null;
  let focusId = null;

  // 2026-08-10 denetim (G41): sitenin duruş beyanı olan bu sayfa görsel olarak
  // neredeyse boş kalıyor, manifesto metni yalnız ipucu/panel arkasında
  // duruyordu. Şimdi bilmiyoruz.json'daki `not` alanı (üç dilli) sayfanın
  // başına DOĞRUDAN yazılıyor -- ana ilkenin en görünür sözü.
  function renderManifest() {
    const el = document.getElementById("bilmiyoruz-manifest");
    if (!el || !data) return;
    const metin = tt(data.not);
    if (!metin) { el.hidden = true; return; }
    el.innerHTML = `<p class="bilmiyoruz-manifest__p">${metin}</p>`;
    el.hidden = false;
  }

  // SVG'nin KENDİ kutusu ölçülür. Eskiden sarmalayıcı (manifesto metni
  // dahil) ölçülüyordu; viewBox gerçek alandan uzun kalınca tarayıcı
  // sahneyi küçültüyor, etiketler masaüstünde ~10px, mobilde 7-8px
  // görünüyordu (2026-10-09 görsel değerlendirmesi). Artık 1 kullanıcı
  // birimi = 1 CSS pikseli; yazı boyutları gerçek boyutlardır.
  function boyut() {
    const r = svgNode.getBoundingClientRect();
    return { w: Math.max(300, r.width), h: Math.max(320, r.height) };
  }
  function dar() { return boyut().w < 560; }

  // Görüş yarıçapı: maddeler bunun DIŞINA, durumlarının sis derinliğine
  // göre yerleşiyor.
  function gorusYaricapi() {
    const { w, h } = boyut();
    return Math.min(w, h) * 0.24;
  }

  const NESNE_R = 22; // bir maddenin sis yarıçapı (etiket mesafesi buna göre)

  // Etiket ölçüleri: masaüstü 13px, dar ekran 12px (okunur alt sınır).
  // Etiket artık kısaltılmıyor ("…" yok) -- satırlara bölünüyor.
  function etiketOlcu() {
    return dar() ? { fs: 12, satir: 14.5, gen: 132 } : { fs: 13, satir: 16.5, gen: 220 };
  }
  function satirBol(metin, gen, fs) {
    const enFazla = Math.max(10, Math.floor(gen / (fs * 0.58)));
    const out = [];
    let cur = "";
    String(metin || "").split(/\s+/).forEach((k) => {
      if (!k) return;
      if (!cur) cur = k;
      else if ((cur + " " + k).length <= enFazla) cur += " " + k;
      else { out.push(cur); cur = k; }
    });
    if (cur) out.push(cur);
    return out;
  }

  // Yerleşim: geniş ekranda daire, etiket dışa doğru (sağda sola yaslı,
  // solda sağa yaslı). Dar ekranda yanlara yer yok -- maddeler dikey bir
  // elips üzerinde, etiket maddenin altında/üstünde ortalı; sonra üst üste
  // binen etiket kutuları dikeyde birbirinden itilir.
  function yerlestir() {
    const n = nodes.length;
    if (!n) return;
    const { w } = boyut();
    const E = etiketOlcu();
    const R = NESNE_R;
    nodes.forEach((d) => { d.__satirlar = satirBol(tt(d.baslik), E.gen, E.fs); });
    sinir = null;
    if (!dar()) {
      const R0 = gorusYaricapi();
      nodes.forEach((d, i) => {
        const Rr = R0 * (1 + kod(d).derinlik + 0.16);
        const a = (-Math.PI / 2) + (i / n) * Math.PI * 2;
        d.x = Math.cos(a) * Rr;
        d.y = Math.sin(a) * Rr;
        const lh = d.__satirlar.length * E.satir;
        if (d.x > 6) { d.__anchor = "start"; d.__lx = R + 6; d.__ly = -lh / 2 + E.fs * 0.85; }
        else if (d.x < -6) { d.__anchor = "end"; d.__lx = -(R + 6); d.__ly = -lh / 2 + E.fs * 0.85; }
        else { d.__anchor = "middle"; d.__lx = 0; d.__ly = d.y >= 0 ? R + 6 + E.fs : -(R + 6) - lh + E.fs; }
      });
      return;
    }
    // Dar ekran: sahne yüksekliği içerikten hesaplanır (aşağıda sinir), yani
    // elipsin dikey yarıçapı sabit bir başlangıç; çakışmalar itildikten
    // sonra SVG içeriğe göre uzar (sayfa kaydırması kullanıcınındır).
    const rx = Math.max(60, w / 2 - E.gen / 2 - 4);
    const ry = 230;
    nodes.forEach((d, i) => {
      const a = (-Math.PI / 2) + (i / n) * Math.PI * 2;
      const f = 0.84 + kod(d).derinlik * 0.5;
      d.x = Math.cos(a) * rx * Math.min(1, f);
      d.y = Math.sin(a) * ry * f;
      const lh = d.__satirlar.length * E.satir;
      d.__anchor = "middle"; d.__lx = 0;
      d.__ly = d.y >= 0 ? R + 2 + E.fs : -(R + 4) - lh + E.fs;
    });
    // Madde + etiketinin birleşik kutusu; çakışanlar dikeyde itilir.
    const kutu = (d) => {
      const top = d.y + d.__ly - E.fs;
      const bot = top + d.__satirlar.length * E.satir;
      return { l: d.x - E.gen / 2, r: d.x + E.gen / 2, t: Math.min(top, d.y - R), b: Math.max(bot, d.y + R) };
    };
    for (let tur = 0; tur < 80; tur++) {
      let degisti = false;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const A = kutu(nodes[i]), B = kutu(nodes[j]);
          if (A.r <= B.l || B.r <= A.l || A.b <= B.t || B.b <= A.t) continue;
          const ustI = A.t <= B.t;
          const ust = ustI ? nodes[i] : nodes[j];
          const alt = ustI ? nodes[j] : nodes[i];
          const binme = (ustI ? A.b - B.t : B.b - A.t) + 6;
          ust.y -= binme / 2; alt.y += binme / 2;
          degisti = true;
        }
      }
      if (!degisti) break;
    }
    const kutular = nodes.map(kutu);
    sinir = { t: Math.min(...kutular.map((k) => k.t), -40), b: Math.max(...kutular.map((k) => k.b), 40) };
  }

  // Dar ekranda yerleşimin dikey sınırı (geniş ekranda null: sahne SVG'ye
  // ortalanır).
  let sinir = null;

  function ciz() {
    svg.selectAll("*").remove();
    let { w, h } = boyut();
    let cy = h / 2;
    if (sinir) {
      h = Math.ceil(sinir.b - sinir.t + 32);
      cy = 16 - sinir.t;
      svgNode.style.height = h + "px";
    } else {
      svgNode.style.height = "";
    }
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    const defs = svg.append("defs");
    g = svg.append("g").attr("class", "bilmiyoruz-scene");
    const kok = g.append("g").attr("transform", `translate(${w / 2}, ${cy})`);
    const E = etiketOlcu();
    const R = NESNE_R;

    // Filtreler durum başına değil KATMAN başına (sayı sabit kalsın):
    // sis (her maddenin etrafındaki nötr pus), gölgenin yarı gölgesi ve
    // her bulanıklık derecesi için bir blur. Değinmek bulanıklığı
    // DEĞİŞTİRMEZ -- yalnız etiket öne çıkar (bkz. vurgula()).
    const filtre = (id, sd) => defs.append("filter").attr("id", id)
      .attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%")
      .append("feGaussianBlur").attr("stdDeviation", sd);
    filtre("bilmiyoruz-sis", 9);
    filtre("bilmiyoruz-yarigolge", 4.2);
    DURUM_SIRASI.forEach((k) => { if (KODLAMA[k].blur) filtre("bilmiyoruz-bulanik-" + k, KODLAMA[k].blur); });

    // Merkez: bir cevap değil, bir sayı -- "kaç sınır işaretlendi". Arkasında
    // ışık yok (eski altın ışıma kaldırıldı): bilmediğimizin ortası
    // aydınlık değil, sessiz.
    const merkez = kok.append("g").attr("class", "bilmiyoruz-merkez");
    merkez.append("text").attr("class", "bilmiyoruz-merkez__sayi")
      .attr("text-anchor", "middle").attr("dy", "-0.05em").text(nodes.length);
    merkez.append("text").attr("class", "bilmiyoruz-merkez__etiket")
      .attr("text-anchor", "middle").attr("dy", "1.5em")
      .text(tt({ tr: "sınır işaretli", en: "limits marked", pt: "limites marcados" }));

    const sel = kok.selectAll("g.bilmiyoruz-madde").data(nodes, (d) => d.id).join("g")
      .attr("class", (d) => "bilmiyoruz-madde bilmiyoruz-madde--" + kodAdi(d))
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => tt(d.baslik) + " — " + tt(data.durumlar[d.durum] || {}));

    sel.append("circle")
      .attr("class", "bilmiyoruz-madde__vurus")
      .attr("r", R + 6)
      .attr("fill", "transparent");

    // 1) Sis: her maddenin etrafında nötr bir pus -- madde görüşün
    //    kenarında, sisin içinde duruyor.
    sel.append("circle").attr("class", "bilmiyoruz-madde__sis")
      .attr("r", R + 4).attr("filter", "url(#bilmiyoruz-sis)");
    // 2) Gölge (gizlilik): tartışmalı maddede derin, belirsizde yarım.
    //    Bir cisim değil, kenarı yumuşak bir karanlık.
    sel.filter((d) => kod(d).golge > 0).append("circle")
      .attr("class", "bilmiyoruz-madde__golge")
      .attr("r", 15)
      .attr("filter", "url(#bilmiyoruz-yarigolge)")
      .style("opacity", (d) => (0.92 * kod(d).golge).toFixed(2));
    // 3) Cisim (bulanık): orada olan ama gözümüzün çözemediği şey.
    //    Tartışmalı maddede cisim çizilmez -- yalnız gölgesi var.
    sel.filter((d) => kod(d).blur > 0).append("circle")
      .attr("class", "bilmiyoruz-madde__nesne")
      .attr("r", 9)
      .attr("filter", (d) => "url(#bilmiyoruz-bulanik-" + kodAdi(d) + ")");

    sel.append("text").attr("class", "bilmiyoruz-madde__ikon")
      .attr("text-anchor", "middle").attr("dy", "0.36em").text("?");

    // Etiket: tam başlık, satırlara bölünmüş (yerleşimi yerlestir() kurdu).
    const etiketSel = sel.append("text").attr("class", "bilmiyoruz-madde__etiket")
      .attr("text-anchor", (d) => d.__anchor)
      .style("font-size", E.fs + "px");
    etiketSel.each(function (d) {
      const t = d3.select(this);
      (d.__satirlar || []).forEach((satir, i) => {
        t.append("tspan").attr("x", d.__lx).attr("y", d.__ly + i * E.satir).text(satir);
      });
    });

    sel.on("mouseenter", function (ev, d) { vurgula(d.id, true); ipucu(ev, d); })
      .on("mousemove", (ev) => GU.moveTooltip(tooltip, wrapEl, ev))
      .on("mouseleave", function (ev, d) { vurgula(d.id, false); GU.hideTooltip(tooltip); })
      .on("focus", function (ev, d) { vurgula(d.id, true); })
      .on("blur", function (ev, d) { vurgula(d.id, false); })
      .on("click", (ev, d) => panelGoster(d))
      .on("keydown", function (ev, d) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); panelGoster(d); }
      });

    zoom = GU.createZoomBehavior(svg, g, [0.5, 3]);
    ortala(false);
  }

  // Değinmek: etiket öne çıkar (okunur), cisim NETLEŞMEZ -- bulanıklık ve
  // gölge aynen kalır. Eskiden değinince blur yarıya iniyordu; bu,
  // bilinmeyenin bir hover'la "biraz çözüldüğünü" söylüyordu.
  function vurgula(id, on) {
    if (!g) return;
    g.selectAll("g.bilmiyoruz-madde").classed("bilmiyoruz-madde--deginiliyor", (d) => on && d.id === id);
  }

  // Lejant: iki kodlamanın (gölge / bulanıklık) ne dediği, verideki durum
  // adlarıyla. JS'le kuruluyor ki statik rota kopyalarına bağlı kalmasın.
  function lejantKur() {
    let el = document.getElementById("bilmiyoruz-legend");
    if (!el) {
      // Sabit (absolute değil) bir satır, manifestonun hemen altında: grafiğin
      // üstüne binmesin, SVG kalan alanı ölçsün.
      el = document.createElement("div");
      el.className = "bilmiyoruz-legend";
      el.id = "bilmiyoruz-legend";
      wrapEl.insertBefore(el, svgNode);
    }
    const ornek = (k) => `<svg class="bilmiyoruz-legend__ornek bilmiyoruz-madde--${k}" viewBox="-14 -14 28 28" width="28" height="28" aria-hidden="true">
        <circle class="bilmiyoruz-madde__sis" r="12" filter="url(#bilmiyoruz-lj-sis)"></circle>
        ${KODLAMA[k].golge ? `<circle class="bilmiyoruz-madde__golge" r="8" filter="url(#bilmiyoruz-lj-golge)" style="opacity:${(0.92 * KODLAMA[k].golge).toFixed(2)}"></circle>` : ""}
        ${KODLAMA[k].blur ? `<circle class="bilmiyoruz-madde__nesne" r="5" filter="url(#bilmiyoruz-lj-${k})"></circle>` : ""}
      </svg>`;
    const satirlar = DURUM_SIRASI.map((k) =>
      `<span class="bilmiyoruz-legend__item">${ornek(k)}<span><strong>${tt(KODLAMA[k].ad)}</strong> — ${tt((data && data.durumlar[k]) || {})}</span></span>`).join("");
    el.innerHTML = `
      <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
        <filter id="bilmiyoruz-lj-sis" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
        <filter id="bilmiyoruz-lj-golge" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="2.2"/></filter>
        ${DURUM_SIRASI.filter((k) => KODLAMA[k].blur).map((k) => `<filter id="bilmiyoruz-lj-${k}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${(KODLAMA[k].blur * 0.6).toFixed(2)}"/></filter>`).join("")}
      </defs></svg>${satirlar}`;
  }

  function ipucu(ev, d) {
    const durum = data.durumlar[d.durum] || {};
    const kategori = data.kategoriler[d.kategori] || {};
    tooltip.innerHTML =
      `<strong>${tt(d.baslik)}</strong>` +
      `<span class="node-hover-tip__meta">${tt(kategori)} · ${tt(durum)}</span>`;
    tooltip.hidden = false;
    GU.moveTooltip(tooltip, wrapEl, ev);
  }

  function kaynaklarHtml(d) {
    if (!d.kaynaklar || !d.kaynaklar.length) return "";
    const rows = d.kaynaklar.map((k) => {
      const yil = k.yil ? ", " + k.yil : "";
      const not = k.not ? ` <span class="bilmiyoruz-madde__kaynak-not">— ${k.not}</span>` : "";
      return `<li class="bilmiyoruz-madde__kaynak">${k.yazar}, <em>${k.eser}</em>${yil}${not}</li>`;
    }).join("");
    return `<p class="detail-eyebrow detail-eyebrow--section">${tt({ tr: "Kaynaklar", en: "Sources", pt: "Fontes" })}</p>
            <ul class="bilmiyoruz-madde__kaynaklar">${rows}</ul>`;
  }

  // docs/icerik-uretim-plani.md Bölüm G / ADIM 5'in önerdiği "taraflar"
  // fikri mevcut sayfaya EKLENDİ (2026-08-06, kullanıcı kararı) -- ayrı bir
  // şemaya geçmek yerine. "kaynaklar" bir isim listesiyken, "taraflar" o
  // isimlerden her birinin NE dediğini ayrı ayrı yapılandırıyor.
  function taraflarHtml(d) {
    if (!d.taraflar || !d.taraflar.length) return "";
    const rows = d.taraflar.map((t) =>
      `<div class="bilmiyoruz-madde__taraf">
         <p class="bilmiyoruz-madde__taraf-kim">${t.kim}</p>
         <p class="bilmiyoruz-madde__taraf-ne">${tt(t.ne_diyor)}</p>
       </div>`).join("");
    return `<p class="detail-eyebrow detail-eyebrow--section">${tt({ tr: "Taraflar", en: "Positions", pt: "Posições" })}</p>
            <div class="bilmiyoruz-madde__taraflar">${rows}</div>`;
  }

  function baglarHtml(d) {
    if (!d.baglar || !d.baglar.length) return "";
    // 2026-08-06 denetiminde bulundu: acik-sorular.js'teki aynı hatanın
    // kopyası -- `<a href="#/view/id">` site hash tabanlı değil History
    // API tabanlı yönlendirme kullandığı için hiçbir yere gitmiyordu.
    const rows = d.baglar.map((b) =>
      `<button type="button" class="acik-soru__bag" data-view="${b.view}" data-id="${b.id}">${b.id.replace(/-/g, " ")}</button>`).join("");
    return `<p class="detail-eyebrow detail-eyebrow--section">${tt({ tr: "Nereye dokunuyor", en: "What it touches", pt: "O que toca" })}</p>
            <div class="acik-soru__baglar">${rows}</div>`;
  }
  function wireBaglar() {
    detailContent.querySelectorAll(".acik-soru__bag").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.__dostNav && window.__dostNav.goTo(btn.dataset.view, btn.dataset.id);
      });
    });
  }

  function panelGoster(d) {
    // Seçim adrese yazılır (/bilmiyoruz/<id>): Paylaş düğmesi location.href'i
    // paylaşıyor ve seçili kayıt yerine görünümün kökünü veriyordu
    // (2026-10-08 taraması). Derin bağlantı goToNode ile zaten çalışıyordu.
    if (window.__dostNav) window.__dostNav.setHash("bilmiyoruz", String(d.id));
    focusId = d.id;
    const durum = data.durumlar[d.durum] || {};
    const kategori = data.kategoriler[d.kategori] || {};
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt(kategori)}
        <span class="bilmiyoruz-madde__durum bilmiyoruz-madde__durum--${d.durum}">${tt(durum)}</span></p>
      <h2 class="detail-title">${tt(d.baslik)}</h2>
      <div class="detail-block detail-block--soru"><p>${tt(d.aciklama)}</p></div>
      ${taraflarHtml(d)}
      ${kaynaklarHtml(d)}
      ${baglarHtml(d)}`;
    wireBaglar();
    detailPanel.hidden = false;
    vurgula(d.id, true);
  }

  function girisPaneli() {
    focusId = null;
    const satirlar = nodes.map((d) => {
      const durum = data.durumlar[d.durum] || {};
      return `<button class="acik-soru-satir" type="button" data-id="${d.id}">
         <span class="bilmiyoruz-madde__durum bilmiyoruz-madde__durum--${d.durum}">${tt(durum)}</span>
         <span>${tt(d.baslik)}</span>
       </button>`;
    }).join("");
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({ tr: "Bilmiyoruz", en: "We Don't Know", pt: "Não Sabemos" })}</p>
      <h2 class="detail-title">${nodes.length} ${tt({ tr: "sınır işaretlendi", en: "limits marked", pt: "limites marcados" })}</h2>
      <div class="detail-block detail-block--soru"><p>${tt(data.not)}</p></div>
      ${soruAilesiNavHtml("bilmiyoruz")}
      <div class="acik-soru-liste">${satirlar}</div>`;
    detailContent.querySelectorAll(".acik-soru-satir").forEach((btn) => {
      btn.addEventListener("click", () => {
        const d = nodes.find((x) => x.id === btn.dataset.id);
        if (d) panelGoster(d);
      });
    });
    detailPanel.hidden = false;
  }

  function ortala(animate) {
    if (!zoom) return;
    const hedef = animate && !reduceMotion
      ? svg.transition().duration(420)
      : svg;
    hedef.call(zoom.transform, d3.zoomIdentity);
  }

  let yuklendi = false;
  function yukle() {
    if (yuklendi) return Promise.resolve();
    const base = window.__dostRouteBase || "";
    const url = (base ? base + "/" : "") + "data/ibn-arabi/bilmiyoruz.json";
    return GU.fetchJson(url).then((d) => {
      data = d;
      nodes = (d.maddeler || []).map((s) => Object.assign({}, s));
      yuklendi = true;
    });
  }

  let baglandi = false;
  function baglaBirKez() {
    if (baglandi) return;
    baglandi = true;
    GU.wireRecenter("bilmiyoruz-recenter", () => ortala(true));
    if (GU.setupDetailPanelFocus) GU.setupDetailPanelFocus();
    GU.registerStepBack("bilmiyoruz-wrap", () => {
      if (focusId) {
        // Esc sözleşmesi: önce açık panel kapanır (ETKILESIM_DILI.md).
        // Eskiden kaydın paneli kullanıcının hiç görmediği giriş paneliyle
        // değişiyor, ancak ikinci Esc kapatıyordu (2026-10-08 taraması).
        girisPaneli();
        detailPanel.hidden = true;
        if (window.__dostNav) window.__dostNav.setHash("bilmiyoruz");
        return true;
      }
      return false;
    });
    window.addEventListener("resize", GU.debounceResize(() => {
      if (!yuklendi || wrapEl.hidden) return;
      yerlestir(); ciz();
    }));
  }

  return {
    activate() {
      // 2026-08-06 kullanıcı bulgusu: girisPaneli() burada çağrılıp panel
      // her açılışta otomatik gösteriliyordu -- artık yalnız bir madde
      // seçildiğinde açılıyor (bkz. hocalar.js'teki aynı düzeltme).
      baglaBirKez();
      yukle().then(() => {
        renderManifest(); lejantKur(); yerlestir(); ciz();
      }).catch(() => {
        if (window.DostViewStatus) window.DostViewStatus.showError("bilmiyoruz-wrap", () => window.__bilmiyoruzApp.activate());
      });
    },
    onLangChange() {
      if (!yuklendi) return;
      renderManifest();
      lejantKur(); yerlestir(); ciz();
      if (focusId) {
        const d = nodes.find((x) => x.id === focusId);
        if (d) panelGoster(d); else if (!detailPanel.hidden) girisPaneli();
      } else if (!detailPanel.hidden) girisPaneli();
    },
    goToNode(id) {
      this.activate();
      yukle().then(() => {
        const d = nodes.find((x) => x.id === id);
        if (d) panelGoster(d);
        // Bulunamayan kimlik adres çubuğunda kalmasın (2026-10-08 taraması).
        else if (id && window.__dostNav) window.__dostNav.setHash("bilmiyoruz");
      });
    },
  };
})();
