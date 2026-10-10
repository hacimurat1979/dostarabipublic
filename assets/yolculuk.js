// Yolculuk — /birlestir'in ilk dilimi. Eser Ağı + Seyahat Atlası'nın
// birleşik görünümü, iki kip:
//
//  - ATLAS: her durak coğrafi konumunda, her eser o durakta yazıldığı için
//    durağın yakınında küçük bir işaret olarak.
//  - ZAMAN ("yolcunun ışığı", 2026-10-10, görsel taraması madde 6): aynı
//    harita, ama yıl sürgüsüyle açılıyor. Kullanıcı yıl üzerinde sürükledikçe
//    (ya da ←/→ ile) tek bir ışık şehirden şehre ilerler; geçilen yol
//    soğuyan bir iz olarak kalır (iz KESİK DEĞİL -- kesik çizgi sitede
//    yalnız "yaklaşık" demek); o şehirde yazılan eserler, yazıldıkları yıl
//    gelince orada küçük yansımalar olarak belirir; tarihi yaklaşık olan
//    eserler bulanıktır (bulanıklık = bilgisizlik). Eskiden burada boylam ×
//    yıl çizgi grafiği vardı (dik açılı, lejantsız) -- "davranışı resmet"
//    kuralına göre yerini yolculuğun kendisine bıraktı.
//
// Güzergâh, Seyahat Atlası'yla aynı sırada: duraklar varış yılına göre
// (aynı yıla düşenler veri sırasıyla). Bir durağın bilinen yılları
// (yil_baslangic–yil_bitis) bittikten sonra, bir sonraki varışa kadar
// veride kayıt yok: ışık o yıllarda olduğu yerde BULANIK durur -- "orada
// kaldı" demek değil, "bu yıllar için elimizde durak yok" demek.
//
// KIYI_SERITLERI seyahat-atlasi.js'de de var; bilinçli kopya (statik
// coğrafya, sonraki turda ortak modüle taşınacak).
window.__yolculukApp = (function () {
  "use strict";

  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;
  const deconflictLabels = GU.createLabelDeconflictor();

  const svg = d3.select("#yolculuk-graph");
  const svgNode = svg.node();
  const wrapEl = document.getElementById("yolculuk-wrap");
  const tooltip = document.getElementById("yolculuk-tooltip");
  const detailPanel = document.getElementById("detail-panel");
  const detailContent = document.getElementById("detail-content");

  if (!svgNode || !wrapEl) return { activate() {}, onLangChange() {}, goToNode() {} };

  const tt = I18n.pick3;  // window.DostI18n.pick3 zaten (!obj) koruması yapıyor (2026-08-15: 26 dosyadaki tekrar buraya toplandı)
  function linkify(text) { return window.__dostCrossLink ? window.__dostCrossLink.linkify(text) : text; }
  const azHareket = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let duraklar = [];
  let eserler = [];
  let durakById = new Map();
  let eserById = new Map();
  let eserlerByDurakId = new Map(); // durak.id -> [eser, ...]
  let sehirBelirsizEserler = []; // mekân eksenine giremeyenler
  let zoom = null;
  let g = null;
  let focusId = null;
  let focusKind = null; // 'durak' | 'eser'
  // Kip anahtarı. Varsayılan: atlas. Kullanıcı geri geldiğinde son kipi ve
  // zaman kipindeki son yılı hatırlar (sessionStorage, kalıcı değil).
  let currentProjection = "atlas"; // "atlas" | "zaman"
  const YIL_MIN = 1165, YIL_MAX = 1240;
  let yil = YIL_MIN;
  try {
    const s = sessionStorage.getItem("yolculuk-projection");
    if (s === "atlas" || s === "zaman") currentProjection = s;
    const y = Number(sessionStorage.getItem("yolculuk-yil"));
    if (y >= YIL_MIN && y <= YIL_MAX) yil = Math.round(y);
  } catch (_) { /* sessionStorage yasak/dolu olabilir */ }

  // --- Güzergâh: varış yılına göre sıralı duraklar ve anahtar zamanlar ---
  let rota = [];
  let rotaT = [];
  function rotaKur() {
    rota = duraklar.slice().sort((a, b) => a.yil_baslangic - b.yil_baslangic);
    rotaT = [];
    let onceki = -Infinity;
    // Aynı yıla düşen iki varış (Fas/Tunus 1194, Musul/Konya 1205) yarım yıl
    // aralıkla sıralanır -- ışık ikisinden de geçsin, biri atlanmasın.
    rota.forEach((d) => {
      let t = d.yil_baslangic;
      if (t <= onceki) t = onceki + 0.5;
      rotaT.push(t);
      onceki = t;
    });
  }
  // Yıl -> güzergâh parametresi s (0..n-1; tamsayı = bir durakta, kesir =
  // iki durak arasında yolda). Yolculuk varış yılından önceki son yılda
  // (ya da yarım yıllık aralıkta) yapılır; öncesinde ışık durakta bekler.
  function sHesapla(Y) {
    const n = rota.length;
    if (!n || Y <= rotaT[0]) return 0;
    for (let i = 0; i < n - 1; i++) {
      const t1 = rotaT[i + 1];
      if (Y < t1) {
        const yolSuresi = Math.min(1, (t1 - rotaT[i]) * 0.5);
        const kalkis = t1 - yolSuresi;
        return Y <= kalkis ? i : i + (Y - kalkis) / yolSuresi;
      }
    }
    return n - 1;
  }

  function boyut() {
    const r = wrapEl.getBoundingClientRect();
    return { w: Math.max(320, r.width), h: Math.max(320, r.height) };
  }

  // Coğrafi yerleşim -- iki kipte de aynı (zaman kipi haritayı değiştirmez,
  // yalnız yıl yıl açar). Zaman kipinde altta yıl çubuğu olduğu için alt
  // pay daha geniş.
  function olcekler() {
    const { w, h } = boyut();
    const dar = w < 640;
    const PAD = dar ? 24 : 50;
    const padAlt = currentProjection === "zaman" ? (dar ? 150 : 92) : PAD;
    const padUst = currentProjection === "zaman" && dar ? 190 : PAD;
    const lons = duraklar.map((d) => d.lon), lats = duraklar.map((d) => d.lat);
    const lon0 = Math.min(...lons) - 3, lon1 = Math.max(...lons) + 3;
    const lat0 = Math.min(...lats) - 3, lat1 = Math.max(...lats) + 3;
    // Tek ölçek (derece başına aynı piksel): eskiden iki eksen ayrı
    // geriliyordu ve dar ekranda harita dikine uzuyordu (2026-10-10).
    const genislik = w - 2 * PAD, yukseklik = h - padUst - padAlt;
    const k = Math.min(genislik / (lon1 - lon0), yukseklik / (lat1 - lat0));
    const ox = PAD + (genislik - k * (lon1 - lon0)) / 2;
    const oy = padUst + (yukseklik - k * (lat1 - lat0)) / 2;
    const xScale = d3.scaleLinear().domain([lon0, lon1]).range([ox, ox + k * (lon1 - lon0)]);
    const yScale = d3.scaleLinear().domain([lat1, lat0]).range([oy, oy + k * (lat1 - lat0)]);
    return { w, h, xScale, yScale };
  }

  function yerlestir() {
    const o = olcekler();
    duraklar.forEach((d) => { d.x = o.xScale(d.lon); d.y = o.yScale(d.lat); });
    // Her eseri kendi durağının etrafına küçük bir yay üzerine dizeriz.
    // Aynı durakta N eser varsa, bir yay üzerinde N eşit noktaya
    // dağıtılırlar; yay durağın üstünden başlar.
    const R = 22, ADIM = Math.PI / 6;
    for (const [durakId, list] of eserlerByDurakId.entries()) {
      const dur = durakById.get(durakId);
      if (!dur) continue;
      const n = list.length;
      for (let i = 0; i < n; i++) {
        let a;
        if (n === 1) a = -Math.PI / 2;
        else if (n === 2) a = -Math.PI / 2 + (i - 0.5) * ADIM * 2;
        else a = -Math.PI / 2 + (i - (n - 1) / 2) * ADIM;
        list[i].x = dur.x + R * Math.cos(a);
        list[i].y = dur.y + R * Math.sin(a);
      }
    }
    return o;
  }

  // KIYI_SERITLERI seyahat-atlasi.js'den bilinçli kopya (statik coğrafya)
  const KIYI_SERITLERI = [
    // İber Yarımadası
    [[-9.3, 43.1], [-8.8, 41.5], [-9.5, 38.7], [-8.9, 37.0], [-7.5, 36.7],
     [-5.4, 36.1], [-2.5, 36.7], [-0.5, 37.9], [0.3, 39.5], [1.2, 41.0],
     [2.2, 41.4], [3.2, 42.4], [1.5, 43.4], [-1.8, 43.4], [-6.5, 43.6]],
    // Mağrib kıyısı
    [[-9.3, 35.7], [-6.0, 35.4], [-2.9, 35.2], [-0.6, 35.7], [3.0, 36.8],
     [7.0, 37.0], [9.5, 37.2], [10.5, 34.5], [8.5, 32.3], [3.0, 32.0],
     [-2.0, 33.2], [-4.5, 34.3], [-7.5, 34.0]],
    // Anadolu + Şam + Mezopotamya + Arabistan
    [[26.0, 40.4], [28.5, 41.2], [31.5, 41.3], [35.0, 41.5], [37.5, 41.0],
     [41.0, 41.5], [44.0, 40.5], [46.0, 39.0], [48.0, 37.0], [48.5, 30.0],
     [48.0, 25.0], [50.5, 22.0], [54.0, 17.0], [51.0, 12.5], [43.5, 12.7],
     [42.5, 15.0], [39.5, 21.0], [37.5, 24.5], [35.5, 27.5], [33.0, 30.5],
     [32.5, 31.5], [34.5, 31.5], [35.5, 33.0], [36.0, 36.0], [35.5, 37.5],
     [32.5, 36.5], [29.5, 36.5], [27.0, 37.5], [26.0, 40.4]],
  ];

  function karaLekeleri(xScale, yScale) {
    const line = d3.line().x((d) => xScale(d[0])).y((d) => yScale(d[1])).curve(d3.curveCatmullRom.alpha(0.6));
    return KIYI_SERITLERI.map((seri) => line(seri));
  }

  // --- Zaman kipi: iz geometrisi ---
  // Her ayak (iki ardışık durak arası) hafifçe kavisli bir ikinci derece
  // Bézier: kavis hep yolcunun soluna doğru, böylece gidiş ve dönüş
  // ayakları üst üste binmez. Kısmi ayak (ışık yoldayken) de Casteljau ile
  // kesilir -- iz, ışığın tam arkasında biter.
  function ayakNoktalari(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    const k = Math.min(0.16 * L, 60);
    return [[a.x, a.y], [(a.x + b.x) / 2 + (dy / L) * k, (a.y + b.y) / 2 - (dx / L) * k], [b.x, b.y]];
  }
  const lerp = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
  function ayakYolu(P, f) {
    if (f >= 1) return `M${P[0][0]},${P[0][1]} Q${P[1][0]},${P[1][1]} ${P[2][0]},${P[2][1]}`;
    const q1 = lerp(P[0], P[1], f);
    const son = lerp(q1, lerp(P[1], P[2], f), f);
    return `M${P[0][0]},${P[0][1]} Q${q1[0]},${q1[1]} ${son[0]},${son[1]}`;
  }
  function ayakNoktasi(P, f) {
    return lerp(lerp(P[0], P[1], f), lerp(P[1], P[2], f), f);
  }

  let gosterilenS = 0;     // ekrandaki ışığın güzergâh parametresi
  let gosterilenYil = yil; // ekrandaki izin "şimdi"si (soğuma bundan ölçülür)
  let gecisZamanlayici = null;

  // Soğuma: bir ayak geçildikten sonra yirmi beş yılda sıcak ışık renginden
  // sönük bir mürekkebe döner; kalınlığı ve matlığı da azalır. Hep düz
  // çizgi -- kesik çizgi "yaklaşık" demektir, bu iz yaklaşık değil.
  const SOGUMA_YIL = 25;

  function zamanCiz(s, Y) {
    if (!g || currentProjection !== "zaman" || !rota.length) return;
    const sicak = d3.color(GU.getVar("--helix-gold-rim") || "#d99a12");
    const soguk = d3.color(GU.getVar("--text-muted") || "#888");
    const renk = d3.interpolateRgb(sicak, soguk);
    const i0 = Math.min(Math.floor(s + 1e-6), rota.length - 1);
    const f = s - i0;
    const ayaklar = [];
    for (let k = 0; k < rota.length - 1; k++) {
      if (k < i0) ayaklar.push({ k, f: 1, yas: Math.max(0, Y - rotaT[k + 1]) });
      else if (k === i0 && f > 1e-3) ayaklar.push({ k, f, yas: 0 });
    }
    g.select("g.yolculuk-iz-g").selectAll("path.yolculuk-iz")
      .data(ayaklar, (d) => d.k)
      .join("path")
      .attr("class", "yolculuk-iz")
      .attr("d", (d) => ayakYolu(rota[d.k]._P, d.f))
      .attr("stroke", (d) => renk(Math.min(1, d.yas / SOGUMA_YIL)))
      .attr("stroke-width", (d) => (2.6 - 1.4 * Math.min(1, d.yas / SOGUMA_YIL)).toFixed(2))
      .attr("stroke-opacity", (d) => (0.95 - 0.5 * Math.min(1, d.yas / SOGUMA_YIL)).toFixed(2));

    // Işık
    const nokta = f > 1e-3 && i0 < rota.length - 1 ? ayakNoktasi(rota[i0]._P, f) : [rota[i0].x, rota[i0].y];
    const bekliyor = f <= 1e-3;
    // Bilinen yılları bitmiş bir durakta bekliyorsa: bu yıllar için veride
    // durak yok -- ışık bulanık (bilgisizlik), "orada kaldı" demiyor.
    const belirsiz = bekliyor && Y > (rota[i0].yil_bitis || rota[i0].yil_baslangic) + 0.01 && i0 < rota.length - 1;
    g.select("g.yolculuk-isik")
      .attr("transform", `translate(${nokta[0].toFixed(1)}, ${nokta[1].toFixed(1)})`)
      .classed("yolculuk-isik--belirsiz", belirsiz);

    // Duraklar: varılmış / şu an / henüz varılmamış
    const varilan = new Set(rota.slice(0, i0 + 1).map((d) => d.id));
    const simdiki = bekliyor ? rota[i0].id : null;
    g.selectAll("g.yolculuk-durak")
      .classed("yolculuk-durak--gelecek", (d) => !varilan.has(d.id))
      .classed("yolculuk-durak--simdi", (d) => d.id === simdiki);
    // Eserler: yazıldıkları yıl geldiyse görünür
    g.selectAll("g.yolculuk-eser").each(function (d) {
      const gorunur = d.yil && d.yil.miladi <= Y + 1e-6;
      const el = d3.select(this);
      el.classed("yolculuk-eser--gizli", !gorunur);
      el.attr("tabindex", gorunur ? 0 : -1).attr("aria-hidden", gorunur ? null : "true");
    });
  }

  function yilEtiketi(Y) {
    const s = sHesapla(Y);
    const i0 = Math.min(Math.floor(s + 1e-6), rota.length - 1);
    const d = rota[i0];
    if (!d) return { kisa: String(Y), uzun: String(Y) };
    const bekliyor = s - i0 <= 1e-3;
    const ad = tt(d.sehir);
    if (!bekliyor) {
      const sonraki = rota[i0 + 1];
      const yolda = tt({ tr: "yolda: ", en: "on the road: ", pt: "a caminho: " });
      return { kisa: `${Y} · ${yolda}${tt(sonraki.sehir)}`, uzun: `${Y}, ${yolda}${ad} – ${tt(sonraki.sehir)}` };
    }
    const belirsiz = Y > (d.yil_bitis || d.yil_baslangic) && i0 < rota.length - 1;
    if (belirsiz) {
      const sonra = tt({ tr: ad + " sonrası", en: "after " + ad, pt: "depois de " + ad });
      return {
        kisa: `${Y} · ${sonra}`,
        uzun: `${Y}, ${sonra} — ${tt({ tr: "bu yıl için veride durak yok", en: "no stop recorded for this year", pt: "nenhuma paragem registada para este ano" })}`,
      };
    }
    return { kisa: `${Y} · ${ad}`, uzun: `${Y}, ${ad}` };
  }

  function zamanCubuguGuncelle() {
    const input = document.getElementById("yolculuk-yil");
    const cikti = document.getElementById("yolculuk-yil-deger");
    if (!input) return;
    input.value = String(yil);
    const e = yilEtiketi(yil);
    input.setAttribute("aria-valuetext", e.uzun);
    if (cikti) cikti.textContent = e.kisa;
  }

  // Yıl değişimi: ışık eski konumdan yenisine güzergâh BOYUNCA yürür
  // (atlanan duraklardan da geçer). Az hareket tercihinde anlık.
  function yilAyarla(yeni, opts) {
    yeni = Math.max(YIL_MIN, Math.min(YIL_MAX, Math.round(yeni)));
    yil = yeni;
    try { sessionStorage.setItem("yolculuk-yil", String(yil)); } catch (_) {}
    zamanCubuguGuncelle();
    if (!g || currentProjection !== "zaman") { gosterilenS = sHesapla(yil); gosterilenYil = yil; return; }
    const s0 = gosterilenS, y0 = gosterilenYil;
    const s1 = sHesapla(yil), y1 = yil;
    if (gecisZamanlayici) { gecisZamanlayici.stop(); gecisZamanlayici = null; }
    if ((opts && opts.anlik) || azHareket() || (Math.abs(s1 - s0) < 1e-6 && y0 === y1)) {
      gosterilenS = s1; gosterilenYil = y1;
      zamanCiz(s1, y1);
      return;
    }
    const sure = Math.min(1400, 260 + 110 * Math.abs(s1 - s0));
    const yumusak = d3.easeCubicInOut;
    gecisZamanlayici = d3.timer((gecen) => {
      const u = Math.min(1, gecen / sure);
      const e = yumusak(u);
      gosterilenS = s0 + (s1 - s0) * e;
      gosterilenYil = y0 + (y1 - y0) * e;
      zamanCiz(gosterilenS, gosterilenYil);
      if (u >= 1) { gecisZamanlayici.stop(); gecisZamanlayici = null; }
    });
  }

  // Oynat: yıl yıl kendiliğinden ilerler; sona gelince durur.
  let oynatici = null;
  const OYNAT_IKON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z" fill="currentColor"/></svg>';
  const DURAKLAT_IKON = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M7 5 H10 V19 H7 Z M14 5 H17 V19 H14 Z" fill="currentColor"/></svg>';
  function oynatDugmesiGuncelle() {
    const btn = document.getElementById("yolculuk-oynat");
    if (!btn) return;
    const oynuyor = !!oynatici;
    btn.setAttribute("aria-pressed", String(oynuyor));
    const ad = oynuyor ? tt({ tr: "Duraklat", en: "Pause", pt: "Pausar" }) : tt({ tr: "Oynat", en: "Play", pt: "Reproduzir" });
    btn.setAttribute("aria-label", ad);
    btn.title = ad;
    btn.innerHTML = oynuyor ? DURAKLAT_IKON : OYNAT_IKON;
  }
  function oynatDurdur() {
    if (!oynatici) return false;
    clearInterval(oynatici);
    oynatici = null;
    oynatDugmesiGuncelle();
    return true;
  }
  function oynatBaslat() {
    if (oynatici) return;
    if (yil >= YIL_MAX) yilAyarla(YIL_MIN, { anlik: true });
    oynatici = setInterval(() => {
      if (yil >= YIL_MAX || wrapEl.hidden || currentProjection !== "zaman") { oynatDurdur(); return; }
      yilAyarla(yil + 1);
    }, 420);
    oynatDugmesiGuncelle();
  }

  function zamanCubuguKur() {
    let bar = document.getElementById("yolculuk-zaman");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "yolculuk-zaman";
      bar.className = "yolculuk-zaman";
      bar.innerHTML = `
        <button class="yolculuk-zaman__oynat" id="yolculuk-oynat" type="button" aria-pressed="false"></button>
        <label class="yolculuk-zaman__etiket" for="yolculuk-yil"></label>
        <input type="range" id="yolculuk-yil" min="${YIL_MIN}" max="${YIL_MAX}" step="1" value="${yil}">
        <output class="yolculuk-zaman__deger" id="yolculuk-yil-deger" for="yolculuk-yil" aria-hidden="true"></output>`;
      wrapEl.appendChild(bar);
      const input = bar.querySelector("#yolculuk-yil");
      input.addEventListener("input", () => { oynatDurdur(); yilAyarla(Number(input.value)); });
      bar.querySelector("#yolculuk-oynat").addEventListener("click", () => { if (!oynatDurdur()) oynatBaslat(); });
    }
    bar.querySelector(".yolculuk-zaman__etiket").textContent = tt({ tr: "Yıl", en: "Year", pt: "Ano" });
    bar.hidden = currentProjection !== "zaman";
    oynatDugmesiGuncelle();
    if (rota.length) zamanCubuguGuncelle();
  }

  function ciz() {
    if (!duraklar.length) return;
    svg.selectAll("*").remove();
    const { w, h, xScale, yScale } = yerlestir();
    const zamanda = currentProjection === "zaman";

    svg.attr("viewBox", `0 0 ${w} ${h}`);
    g = svg.append("g").attr("class", "yolculuk-scene yolculuk-scene--" + currentProjection);

    // Kara lekeleri (kıyı çizgisi)
    g.append("g").attr("class", "yolculuk-kara").selectAll("path")
      .data(karaLekeleri(xScale, yScale)).join("path").attr("d", (d) => d);

    if (zamanda) {
      // Işığın kendi parıltısı: radyal bir hâle (renk CSS'te --helix-gold-rim).
      const defs = svg.append("defs");
      const rg = defs.append("radialGradient").attr("id", "yolculuk-isik-hale");
      rg.append("stop").attr("offset", "0%").attr("class", "yolculuk-isik__dur yolculuk-isik__dur--ic");
      rg.append("stop").attr("offset", "45%").attr("class", "yolculuk-isik__dur yolculuk-isik__dur--orta");
      rg.append("stop").attr("offset", "100%").attr("class", "yolculuk-isik__dur yolculuk-isik__dur--dis");
      rota.forEach((d, i) => { if (i < rota.length - 1) d._P = ayakNoktalari(d, rota[i + 1]); });
      g.append("g").attr("class", "yolculuk-iz-g");
    } else {
      // Duraklar arası rota (kronolojik zincir)
      const line = d3.line().x((d) => d.x).y((d) => d.y).curve(d3.curveCatmullRom.alpha(0.6));
      g.append("g").attr("class", "yolculuk-rota-g").selectAll("path.yolculuk-rota-parca")
        .data(duraklar.slice(1).map((d, i) => ({ a: duraklar[i], b: d })))
        .join("path")
        .attr("class", "yolculuk-rota-parca")
        .attr("d", (d) => line([d.a, d.b]))
        .attr("fill", "none");
    }

    // Duraklar
    const durakSel = g.append("g").attr("class", "yolculuk-durak-g").selectAll("g.yolculuk-durak")
      .data(duraklar, (d) => d.id).join("g")
      .attr("class", "yolculuk-durak")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => tt(d.sehir));
    durakSel.append("circle").attr("class", "yolculuk-durak__vurus").attr("r", 18).attr("fill", "transparent");
    durakSel.append("circle").attr("class", "yolculuk-durak__nokta").attr("r", 6);

    // Eserler: atlas kipinde küçük işaret; zaman kipinde aynı işaret bir
    // yansıma olarak (altında soluk aksi) ve yalnız yılı gelince.
    const eserSel = g.append("g").attr("class", "yolculuk-eser-g").selectAll("g.yolculuk-eser")
      .data(eserler.filter((e) => typeof e.x === "number"), (d) => d.id).join("g")
      .attr("class", (d) => "yolculuk-eser"
        + (d.yil && !d.yil.kesin ? " yolculuk-eser--yaklasik" : "")
        + (d.ozel === "katalog" ? " yolculuk-eser--katalog" : ""))
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => d.eser);
    eserSel.each(function (d) {
      const node = d3.select(this);
      // K-04/O-02 (uzman paneli denetimi 2026-08-17): 10px yarıçap
      // durağın kendi isabet dairesinden (18px) belirgin küçüktü.
      node.append("circle").attr("class", "yolculuk-eser__vurus").attr("r", 13).attr("fill", "transparent");
      const govde = node.append("g").attr("class", "yolculuk-eser__govde");
      if (zamanda) govde.append("ellipse").attr("class", "yolculuk-eser__aksi").attr("cy", 6.5).attr("rx", 3.2).attr("ry", 1.2);
      if (d.ozel === "katalog") {
        govde.append("path").attr("class", "yolculuk-eser__isaret")
          .attr("d", "M0,-5 L5,0 L0,5 L-5,0 Z");
      } else {
        govde.append("circle").attr("class", "yolculuk-eser__isaret").attr("r", 3.5);
      }
    });

    // Işık (yalnız zaman kipinde): eserlerin ve durakların üstünde.
    if (zamanda) {
      const isik = g.append("g").attr("class", "yolculuk-isik").attr("aria-hidden", "true");
      isik.append("circle").attr("class", "yolculuk-isik__hale").attr("r", 22).attr("fill", "url(#yolculuk-isik-hale)");
      isik.append("circle").attr("class", "yolculuk-isik__oz").attr("r", 4.2);
    }

    // Etiketler: duraklara ait ad
    const etiketSel = durakSel.append("text").attr("class", "yolculuk-durak__etiket")
      .attr("text-anchor", (d) => (d.x > w * 0.7 ? "end" : "start"))
      .attr("x", (d) => (d.x > w * 0.7 ? -12 : 12))
      .attr("y", 4)
      .text((d) => tt(d.sehir));

    // Dar ekranda zaman kipinde yalnız o anki durağın adı yazılır (ötekiler
    // değinince): on beş ad 300 px'lik bir haritada üst üste biniyordu;
    // durağın adı zaten yıl çubuğunda da yazıyor.
    const yalnizSimdi = zamanda && w < 640;
    etiketSel.classed("yolculuk-durak__etiket--yalniz-simdi", yalnizSimdi);

    // Çakışma çözümü
    const pendingLabels = [];
    etiketSel.each(function (d) {
      const offsetX = d.x > w * 0.7 ? -12 : 12;
      pendingLabels.push({ lbl: d3.select(this), txt: tt(d.sehir), x: d.x + offsetX, y: d.y + 4, baseY: 4 });
    });
    const obstacles = [
      ...duraklar.map((d) => ({ x: d.x, y: d.y, half: 7, h: 14 })),
      ...eserler.filter((e) => typeof e.x === "number").map((e) => ({ x: e.x, y: e.y, half: 5, h: 10 })),
    ];
    if (!yalnizSimdi) {
      deconflictLabels(pendingLabels, obstacles);
      GU.attachLeaderLines(pendingLabels, { className: "yolculuk-durak__leader", threshold: 6, gap: 6 });
    }

    // Etkileşim: durak
    durakSel.on("mouseenter", function (ev, d) { vurgula(d.id, "durak"); ipucuDurak(ev, d); })
      .on("mousemove", (ev) => GU.moveTooltip(tooltip, wrapEl, ev))
      .on("mouseleave", function () { vurgula(null, null); GU.hideTooltip(tooltip); })
      .on("focus", function (ev, d) { vurgula(d.id, "durak"); })
      .on("blur", function () { vurgula(null, null); })
      .on("click", (ev, d) => durakPaneli(d))
      .on("keydown", function (ev, d) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); durakPaneli(d); }
      });

    // Etkileşim: eser
    eserSel.on("mouseenter", function (ev, d) { vurgula(d.id, "eser"); ipucuEser(ev, d); })
      .on("mousemove", (ev) => GU.moveTooltip(tooltip, wrapEl, ev))
      .on("mouseleave", function () { vurgula(null, null); GU.hideTooltip(tooltip); })
      .on("focus", function (ev, d) { vurgula(d.id, "eser"); })
      .on("blur", function () { vurgula(null, null); })
      .on("click", (ev, d) => { ev.stopPropagation(); eserPaneli(d); })
      .on("keydown", function (ev, d) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); eserPaneli(d); }
      });

    zoom = GU.createZoomBehavior(svg, g, [0.7, 4]);
    ortala(false);
    if (zamanda) {
      if (gecisZamanlayici) { gecisZamanlayici.stop(); gecisZamanlayici = null; }
      gosterilenS = sHesapla(yil);
      gosterilenYil = yil;
      zamanCiz(gosterilenS, gosterilenYil);
    }
  }

  // Geri çekilmek: başlangıçtaki bakışa (kaydırma/yakınlaştırma) döner;
  // kullanıcının seçtiği kip ve yıl korunur (ETKILESIM_DILI.md, 2. fiil).
  function ortala(animate) {
    if (!zoom || !g) return;
    const { w, h } = boyut();
    const dar = w < 640;
    // Zaman kipinde bakış durakların kendisine oturur (kıyı lekeleri
    // güzergâhın çok dışına taşıyor); atlas kipi bütün haritayı gösterir.
    const zamanda = currentProjection === "zaman";
    // Kutu zaman kipinde verinin kendisinden (durak konumları + ad payı)
    // hesaplanır, DOM'dan değil: değinilen bir durağın büyümesi ya da kalın
    // yazılan ad bakışı kaydırmasın -- ortala her seferinde aynı yere döner.
    let box;
    if (zamanda && duraklar.length) {
      const xs = duraklar.map((d) => d.x), ys = duraklar.map((d) => d.y);
      const x0 = Math.min(...xs) - 20, x1 = Math.max(...xs) + (dar ? 20 : 70);
      const y0 = Math.min(...ys) - 34, y1 = Math.max(...ys) + 24;
      box = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    } else {
      box = g.node().getBBox();
    }
    const altPay = currentProjection === "zaman" ? (dar ? 130 : 70) : 0;
    const ustPay = currentProjection === "zaman" && dar ? 170 : 0;
    const kullan = h - altPay - ustPay;
    const scale = Math.min(w / (box.width + (dar ? 48 : 80)), kullan / (box.height + 60), zamanda ? 2.4 : 1.4);
    const tx = w / 2 - (box.x + box.width / 2) * scale;
    const ty = ustPay + kullan / 2 - (box.y + box.height / 2) * scale;
    const t = d3.zoomIdentity.translate(tx, ty).scale(scale);
    (animate && !azHareket() ? svg.transition().duration(600) : svg).call(zoom.transform, t);
  }

  function vurgula(id, kind) {
    if (!g) return;
    g.selectAll("g.yolculuk-durak").classed("yolculuk-durak--deginiliyor", (d) => kind === "durak" && d.id === id);
    g.selectAll("g.yolculuk-eser").classed("yolculuk-eser--deginiliyor", (d) => kind === "eser" && d.id === id);
  }

  function ipucuDurak(ev, d) {
    const eserSayisi = (eserlerByDurakId.get(d.id) || []).length;
    tooltip.innerHTML = `<strong>${tt(d.sehir)}</strong><span class="node-hover-tip__meta">${d.yil_baslangic}${d.yil_bitis !== d.yil_baslangic ? "–" + d.yil_bitis : ""} · ${eserSayisi} ${tt({tr:"eser",en:"work"+(eserSayisi===1?"":"s"),pt:"obra"+(eserSayisi===1?"":"s")})}</span>`;
    tooltip.hidden = false;
    GU.moveTooltip(tooltip, wrapEl, ev);
  }

  function ipucuEser(ev, d) {
    const yilStr = (d.yil.hicri ? d.yil.hicri + "/" : "") + d.yil.miladi + (d.yil.kesin ? "" : " " + tt({tr:"(yaklaşık)",en:"(approx.)",pt:"(aprox.)"}));
    tooltip.innerHTML = `<strong>${d.eser}</strong><span class="node-hover-tip__meta">${yilStr} · ${tt(d.sehir)}</span>`;
    tooltip.hidden = false;
    GU.moveTooltip(tooltip, wrapEl, ev);
  }

  function durakPaneli(d) {
    focusId = d.id; focusKind = "durak";
    const eserlerBurada = eserlerByDurakId.get(d.id) || [];
    const eserSatirlari = eserlerBurada.map((e) =>
      `<li><button class="yolculuk-panel__eser-btn" data-eser-id="${e.id}">${e.eser}</button> <span class="yolculuk-panel__meta">${e.yil.miladi}${e.yil.kesin ? "" : " " + tt({tr:"(yaklaşık)",en:"(approx.)",pt:"(aprox.)"})}</span></li>`
    ).join("");
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({tr:"Durak",en:"Stop",pt:"Paragem"})}</p>
      <h2 class="detail-title">${tt(d.sehir)}</h2>
      <p class="yolculuk-panel__meta">${d.yil_baslangic}${d.yil_bitis !== d.yil_baslangic ? "–" + d.yil_bitis : ""}</p>
      <div class="detail-block detail-block--soru"><p>${linkify(tt(d.ozet))}</p></div>
      ${eserlerBurada.length ? `<p class="detail-eyebrow detail-eyebrow--section">${tt({tr:"Burada yazılan eserler",en:"Works written here",pt:"Obras escritas aqui"})}</p><ul class="yolculuk-panel__eser-listesi">${eserSatirlari}</ul>` : ""}`;
    detailPanel.hidden = false;
    vurgula(d.id, "durak");
    detailContent.querySelectorAll(".yolculuk-panel__eser-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const e = eserById.get(btn.dataset.eserId);
        if (e) eserPaneli(e);
      });
    });
  }

  function eserPaneli(e) {
    focusId = e.id; focusKind = "eser";
    const katalogRozet = e.ozel === "katalog"
      ? `<span class="eser-agi-rozet">${tt({tr:"katalog",en:"catalogue",pt:"catálogo"})}</span>` : "";
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({tr:"Eser",en:"Work",pt:"Obra"})}${katalogRozet}</p>
      <h2 class="detail-title">${e.eser}</h2>
      <p class="eser-agi-kimlik">${e.yil.hicri ? e.yil.hicri + "/" : ""}${e.yil.miladi}${e.yil.kesin ? "" : " " + tt({tr:"(yaklaşık)",en:"(approximate)",pt:"(aproximado)"})} — ${tt(e.sehir)}${e.sehir_belirsiz ? " " + tt({tr:"(şehir belirsiz)",en:"(city uncertain)",pt:"(cidade incerta)"}) : ""}</p>
      <div class="detail-block detail-block--soru"><p>${linkify(tt(e.aciklama))}</p></div>
      ${dayanakHtml(e)}
      ${sehirDayanakHtml(e)}`;
    detailPanel.hidden = false;
    vurgula(e.id, "eser");
  }

  const GUVEN_ETIKET = {
    yuksek: { tr: "yüksek güven", en: "high confidence", pt: "confiança alta" },
    orta: { tr: "orta güven", en: "medium confidence", pt: "confiança média" },
    dusuk: { tr: "düşük güven", en: "low confidence", pt: "confiança baixa" },
  };
  function dayanakListesi(dayanaklar, baslik) {
    if (!Array.isArray(dayanaklar) || !dayanaklar.length) return "";
    const satirlar = dayanaklar.map((r) => {
      const gg = GUVEN_ETIKET[r.guven] || GUVEN_ETIKET.orta;
      return `<li><span class="eser-agi-dayanak__guven eser-agi-dayanak__guven--${r.guven}">${tt(gg)}</span> ${r.detay}</li>`;
    }).join("");
    return `<details class="eser-agi-dayanak" open><summary>${tt(baslik)}</summary><ul class="eser-agi-dayanak__liste">${satirlar}</ul></details>`;
  }
  function dayanakHtml(d) {
    return dayanakListesi(d.yil && d.yil.dayanak, { tr: "Tarih dayanağı", en: "Date evidence", pt: "Base da datação" });
  }
  function sehirDayanakHtml(d) {
    return dayanakListesi(d.sehir_dayanak, { tr: "Şehir dayanağı", en: "City evidence", pt: "Base do local" });
  }

  function girisPaneli() {
    focusId = null; focusKind = null;
    const belirsizSayisi = sehirBelirsizEserler.length;
    const belirsizListe = belirsizSayisi
      ? `<p class="yolculuk-belirsiz">${tt({
          tr: "Bu haritada yer alamayan " + belirsizSayisi + " eser var (şehri belirsiz — mekân eksenine giremez): ",
          en: belirsizSayisi + " work" + (belirsizSayisi > 1 ? "s" : "") + " cannot appear on this map (city uncertain — outside the spatial axis): ",
          pt: belirsizSayisi + " obra" + (belirsizSayisi > 1 ? "s" : "") + " não pode" + (belirsizSayisi > 1 ? "m" : "") + " aparecer neste mapa (cidade incerta — fora do eixo espacial): "
        })}${sehirBelirsizEserler.map((e) => `<button class="yolculuk-belirsiz__btn" data-eser-id="${e.id}">${e.eser}</button>`).join(", ")}.</p>`
      : "";
    detailContent.innerHTML = `
      <p class="detail-eyebrow">${tt({tr:"Yolculuk",en:"The Journey",pt:"A Jornada"})}</p>
      <h2 class="detail-title">${duraklar.length} ${tt({tr:"durak",en:"stops",pt:"paragens"})}, ${eserler.length} ${tt({tr:"eser",en:"works",pt:"obras"})}</h2>
      <div class="detail-block detail-block--soru"><p>${tt({
        tr: "Eser Ağı ile Seyahat Atlası bir arada, iki kipte. <strong>Atlas</strong> kipinde her durak coğrafi konumunda, her eser yazıldığı durağın yanında. <strong>Zaman</strong> kipinde aynı harita yıl yıl açılır: alttaki sürgüyü sürükledikçe (ya da ← / → ile) bir ışık şehirden şehre ilerler, geçilen yol soğuyan bir iz olarak kalır; bir eser, yazıldığı yıl gelince o durakta küçük bir yansıma olarak belirir. Tarihi yaklaşık olan eserler bulanık. Güzergâh durakların varış yılına göre sıralı; bir durağın bilinen yılları bitip sonraki varış gelmeden önceki yıllarda ışık bulanıklaşır — o yıllar için veride durak yok.",
        en: "The Works Timeline and the Travel Atlas together, in two modes. In <strong>Atlas</strong> each stop sits at its geographic position, each work beside the stop where it was written. In <strong>Time</strong> the same map opens year by year: as you drag the slider below (or use ← / →) a light moves from city to city and the road travelled stays behind as a cooling trace; a work appears at its stop as a small reflection when the year it was written arrives. Works with an approximate date are blurred. The route follows the stops' years of arrival; in the years after a stop's known span and before the next arrival the light blurs — the data has no stop for those years.",
        pt: "A Linha do Tempo das Obras e o Atlas de Viagem juntos, em dois modos. No <strong>Atlas</strong> cada paragem está na sua posição geográfica, cada obra junto à paragem onde foi escrita. Em <strong>Tempo</strong> o mesmo mapa abre-se ano a ano: ao arrastar o controlo em baixo (ou com ← / →) uma luz avança de cidade em cidade e o caminho percorrido fica como um rasto que arrefece; uma obra surge na sua paragem como um pequeno reflexo quando chega o ano em que foi escrita. As obras de data aproximada aparecem desfocadas. O percurso segue os anos de chegada às paragens; nos anos depois do período conhecido de uma paragem e antes da chegada seguinte a luz desfoca-se — os dados não têm paragem para esses anos."
      })}</p></div>
      ${belirsizListe}`;
    detailPanel.hidden = false;
    detailContent.querySelectorAll(".yolculuk-belirsiz__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const e = eserById.get(btn.dataset.eserId);
        if (e) eserPaneli(e);
      });
    });
  }

  let yuklendi = false;
  function yukle() {
    if (yuklendi) return Promise.resolve();
    const base = window.__dostRouteBase || "";
    const p = (base ? base + "/" : "") + "data/ibn-arabi/";
    return Promise.all([GU.fetchJson(p + "seyahat-atlasi.json"), GU.fetchJson(p + "eser-agi.json")]).then(([a, e]) => {
      duraklar = a.duraklar || [];
      eserler = e.eserler || [];
      durakById = new Map(duraklar.map((d) => [d.id, d]));
      eserById = new Map(eserler.map((x) => [x.id, x]));
      // Eserleri duraklara eşle: durak.eserler[] ya da eser.sehir.tr ile substring.
      eserlerByDurakId = new Map(duraklar.map((d) => [d.id, []]));
      sehirBelirsizEserler = [];
      for (const eser of eserler) {
        if (eser.sehir_belirsiz) { sehirBelirsizEserler.push(eser); continue; }
        // 1) Atlas duraklarında zaten eserler[] backref varsa onu kullan
        let atandiId = null;
        for (const dur of duraklar) {
          if (Array.isArray(dur.eserler) && dur.eserler.includes(eser.id)) {
            atandiId = dur.id; break;
          }
        }
        // 2) Yoksa sehir.tr üzerinden substring eşleme (yedek)
        if (!atandiId) {
          for (const dur of duraklar) {
            if (tt(dur.sehir).includes(tt(eser.sehir)) || tt(eser.sehir).includes(tt(dur.sehir))) {
              atandiId = dur.id; break;
            }
          }
        }
        if (atandiId) {
          eserlerByDurakId.get(atandiId).push(eser);
        } else {
          // Ne backref ne isim eşleşti -- sehir_belirsiz gibi davran (harita dışı)
          sehirBelirsizEserler.push(eser);
        }
      }
      rotaKur();
      yuklendi = true;
      zamanCubuguKur();
      ciz();
    });
  }

  function setProjection(next) {
    if (next !== "atlas" && next !== "zaman") return;
    if (next === currentProjection) return;
    oynatDurdur();
    currentProjection = next;
    try { sessionStorage.setItem("yolculuk-projection", next); } catch (_) {}
    updateToggleUI();
    lejantCiz();
    zamanCubuguKur();
    if (yuklendi) ciz();
    // Kimlik korunur: aynı düğüm seçiliyse yeniden çizimden sonra vurgu da
    // aynı kayda dönsün.
    if (focusId) vurgula(focusId, focusKind);
  }

  // Lejant: işaretler sahnedeki sınıfların aynısı; metin dil değişince
  // yeniden yazılır. Zaman kipinin kendi satırları var (ışık, iz, yansıma).
  function lejantCiz() {
    let el = document.getElementById("yolculuk-lejant");
    if (!el) {
      el = document.createElement("div");
      el.id = "yolculuk-lejant";
      el.className = "legend yolculuk-lejant";
      wrapEl.appendChild(el);
    }
    const isaret = (ic, sinif) => `<svg class="yolculuk-lejant__isaret${sinif ? " " + sinif : ""}" viewBox="-7 -7 14 14" aria-hidden="true">${ic}</svg>`;
    const eserIsaret = (ek, zaman) => isaret(`<g class="yolculuk-eser${ek}">${zaman ? '<ellipse class="yolculuk-eser__aksi" cy="5" rx="3" ry="1.1"></ellipse>' : ""}${ek.includes("katalog") ? '<path class="yolculuk-eser__isaret" d="M0,-5 L5,0 L0,5 L-5,0 Z"></path>' : '<circle class="yolculuk-eser__isaret" r="3.5"></circle>'}</g>`, zaman ? "yolculuk-scene--zaman" : "");
    const satirlar = currentProjection === "zaman" ? [
      [isaret('<circle class="yolculuk-isik__hale yolculuk-isik__hale--lejant" r="6.5"></circle><circle class="yolculuk-isik__oz" r="2.6"></circle>'),
        { tr: "Işık — o yıl bulunduğu durak", en: "Light — where he was that year", pt: "Luz — onde estava nesse ano" }],
      [isaret('<g class="yolculuk-isik yolculuk-isik--belirsiz"><circle class="yolculuk-isik__hale yolculuk-isik__hale--lejant" r="6.5"></circle><circle class="yolculuk-isik__oz" r="2.6"></circle></g>'),
        { tr: "Bulanık ışık — o yıl için veride durak yok", en: "Blurred light — no stop recorded that year", pt: "Luz desfocada — sem paragem registada nesse ano" }],
      [isaret('<path class="yolculuk-lejant__iz yolculuk-lejant__iz--sicak" d="M-7,3 Q-3,-4 1,-1"></path><path class="yolculuk-lejant__iz yolculuk-lejant__iz--soguk" d="M1,-1 Q5,2 7,-3"></path>'),
        { tr: "Geçilen yol — eskidikçe soğur", en: "Road travelled — cools as it ages", pt: "Caminho percorrido — arrefece com o tempo" }],
      [eserIsaret("", true),
        { tr: "Eser — yazıldığı yıl belirir", en: "Work — appears in the year it was written", pt: "Obra — surge no ano em que foi escrita" }],
      [eserIsaret(" yolculuk-eser--yaklasik", true),
        { tr: "Eser — tarihi yaklaşık (bulanık)", en: "Work — date approximate (blurred)", pt: "Obra — data aproximada (desfocada)" }],
      [eserIsaret(" yolculuk-eser--katalog", true),
        { tr: "Eserlerinin kataloğu", en: "Catalogue of his works", pt: "Catálogo das suas obras" }],
      [isaret('<g class="yolculuk-durak yolculuk-durak--gelecek"><circle class="yolculuk-durak__nokta" r="5"></circle></g>'),
        { tr: "Henüz varılmamış durak", en: "Stop not yet reached", pt: "Paragem ainda não alcançada" }],
    ] : [
      [isaret('<circle class="yolculuk-durak__nokta" r="5"></circle>'),
        { tr: "Durak (şehir)", en: "Stop (city)", pt: "Paragem (cidade)" }],
      [eserIsaret("", false),
        { tr: "Eser — o durakta yazıldı", en: "Work — written at that stop", pt: "Obra — escrita nessa paragem" }],
      [eserIsaret(" yolculuk-eser--yaklasik", false),
        { tr: "Eser — tarihi yaklaşık", en: "Work — date approximate", pt: "Obra — data aproximada" }],
      [eserIsaret(" yolculuk-eser--katalog", false),
        { tr: "Eserlerinin kataloğu", en: "Catalogue of his works", pt: "Catálogo das suas obras" }],
    ];
    el.setAttribute("aria-label", tt({ tr: "Lejant", en: "Legend", pt: "Legenda" }));
    el.setAttribute("role", "note");
    el.classList.toggle("yolculuk-lejant--zaman", currentProjection === "zaman");
    el.innerHTML = satirlar.map(([ik, metin]) => `<div class="legend__item">${ik}<span>${tt(metin)}</span></div>`).join("");
  }

  function updateToggleUI() {
    const atlasBtn = document.getElementById("yolculuk-toggle-atlas");
    const zamanBtn = document.getElementById("yolculuk-toggle-zaman");
    if (atlasBtn) atlasBtn.setAttribute("aria-pressed", String(currentProjection === "atlas"));
    if (zamanBtn) zamanBtn.setAttribute("aria-pressed", String(currentProjection === "zaman"));
  }

  let baglandi = false;
  function baglaBirKez() {
    if (baglandi) return;
    baglandi = true;
    GU.wireRecenter("yolculuk-recenter", () => ortala(true));
    if (GU.setupDetailPanelFocus) GU.setupDetailPanelFocus();
    // Bir adım geri: önce kendiliğinden ilerleyen zaman durur, sonra açık
    // kayıt giriş paneline döner.
    GU.registerStepBack("yolculuk-wrap", () => {
      if (oynatDurdur()) return true;
      if (focusId) { girisPaneli(); return true; }
      return false;
    });
    window.addEventListener("resize", GU.debounceResize(() => {
      if (!yuklendi || wrapEl.hidden) return;
      ciz();
    }));
    // Zaman kipinde sahnenin içindeyken (bir durak/eser odaktayken) de ←/→
    // yılı bir adım oynatır; sürgünün kendisi bunu zaten yerleşik yapıyor.
    wrapEl.addEventListener("keydown", (ev) => {
      if (currentProjection !== "zaman" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      if (ev.key !== "ArrowLeft" && ev.key !== "ArrowRight") return;
      if (!svgNode.contains(ev.target)) return;
      ev.preventDefault();
      oynatDurdur();
      yilAyarla(yil + (ev.key === "ArrowRight" ? 1 : -1));
    });
    // Toggle butonları: atlas ⇄ zaman
    const atlasBtn = document.getElementById("yolculuk-toggle-atlas");
    const zamanBtn = document.getElementById("yolculuk-toggle-zaman");
    if (atlasBtn) atlasBtn.addEventListener("click", () => setProjection("atlas"));
    if (zamanBtn) zamanBtn.addEventListener("click", () => setProjection("zaman"));
    updateToggleUI();
    lejantCiz();
    zamanCubuguKur();
  }

  return {
    activate() {
      baglaBirKez();
      yukle().catch(() => {
        if (window.DostViewStatus) window.DostViewStatus.showError("yolculuk-wrap", () => window.__yolculukApp.activate());
      });
    },
    onLangChange() {
      if (document.getElementById("yolculuk-lejant")) lejantCiz();
      if (document.getElementById("yolculuk-zaman")) zamanCubuguKur();
      if (!yuklendi) return;
      ciz();
      if (focusId) {
        if (focusKind === "durak") {
          const d = durakById.get(focusId);
          if (d) durakPaneli(d);
        } else if (focusKind === "eser") {
          const e = eserById.get(focusId);
          if (e) eserPaneli(e);
        }
      } else if (!detailPanel.hidden) {
        girisPaneli();
      }
    },
    goToNode(id) {
      this.activate();
      yukle().then(() => {
        const d = durakById.get(id);
        if (d) { durakPaneli(d); return; }
        const e = eserById.get(id);
        if (e) eserPaneli(e);
      });
    },
  };
})();
