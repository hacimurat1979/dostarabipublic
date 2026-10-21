(function () {
  "use strict";

  // Eksen Seyri (2026-10-19, kullanıcı kararı).
  //
  // Eksen İplikleri grafiğinin sayıya dökülmüş hâli: yazılar yayın tarihine
  // göre dört eşit dilime bölünür, her eksenin her dilimde kaç yazıda
  // geçtiği dilim gülüyle gösterilir; her eksen için üç yazıdan kısa bir
  // alıntı özeti (data/daphne-eksen-seyri.json) ve en sık birlikte geçen
  // eksen çiftleri. Hangi yazının hangi ekseni taşıdığını biz işaretledik;
  // bu sekme o etiketlemenin SAYIMIDIR. Daphne'nin kendi modeli değildir ve
  // yazıların ardındaki hayata, duyguya ya da kişiliğe dair hiçbir çıkarım
  // yapmaz (CLAUDE.md, "Daphne Eksen Seyri" notu). Sayılar çalışma anında
  // data/daphne-profile.json'dan hesaplanır; yeni yazı eklenince sayfa
  // kendiliğinden güncellenir. Grafik değil, okuma sayfası: dilimler
  // yalnız sayıyı gösterir, bağlanmamış düğme yoktur.

  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;
  const kok = document.getElementById("seyir-icerik");
  if (!kok || !I18n || !GU) return;

  const tt = I18n.pick3;
  const esc = GU.escapeHtml;
  const DILIM = 4;
  // PT için pt-BR: pt-PT kısa biçimi "3/02" (ay adı yok, gün/ay belirsiz) veriyordu;
  // sitenin hreflang'ı da pt-BR (2026-10-20 taraması F20).
  const LOCALE = { tr: "tr-TR", en: "en-GB", pt: "pt-BR" };

  let profil = null;
  let parcalar = null;
  let basladi = false;
  let hesap = null;

  function tarihYaz(iso, yil) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00Z");
    const o = { day: "numeric", month: "short", timeZone: "UTC" };
    if (yil) o.year = "numeric";
    return d.toLocaleDateString(LOCALE[I18n.getLang()] || "en-GB", o);
  }

  function doldur(s, v) {
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in v ? v[k] : ""));
  }

  function hesapla() {
    const yazilar = profil.articles.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const n = yazilar.length;
    const dilimDe = (i) => Math.floor((i * DILIM) / n);
    const dilimler = [];
    for (let d = 0; d < DILIM; d++) dilimler.push({ ilk: null, son: null, n: 0 });
    yazilar.forEach((a, i) => {
      const d = dilimler[dilimDe(i)];
      if (!d.ilk) d.ilk = a.date;
      d.son = a.date;
      d.n++;
    });
    const dilimBoyu = Math.max.apply(null, dilimler.map((d) => d.n));
    const eksenler = profil.core_parameters.map((c) => {
      const say = new Array(DILIM).fill(0);
      let ilk = null, son = null, toplam = 0;
      yazilar.forEach((a, i) => {
        if ((a.eksenler || []).some((e) => e.id === c.id)) {
          say[dilimDe(i)]++;
          toplam++;
          if (!ilk) ilk = a.date;
          son = a.date;
        }
      });
      return { id: c.id, label: c.label, say, ilk, son, toplam };
    }).sort((a, b) => b.toplam - a.toplam);
    const etiket = {};
    eksenler.forEach((e) => { etiket[e.id] = e.label; });
    const cift = {};
    yazilar.forEach((a) => {
      const ids = (a.eksenler || []).map((e) => e.id).sort();
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const k = ids[i] + "|" + ids[j];
          cift[k] = (cift[k] || 0) + 1;
        }
      }
    });
    const ciftler = Object.keys(cift).map((k) => ({ ids: k.split("|"), n: cift[k] }))
      .sort((a, b) => b.n - a.n).slice(0, 10);
    const kayma = eksenler.map((e) => ({ e, fark: e.say[DILIM - 1] - e.say[0] }))
      .filter((x) => x.fark !== 0);
    const artan = kayma.filter((x) => x.fark > 0).sort((a, b) => b.fark - a.fark).slice(0, 3);
    const azalan = kayma.filter((x) => x.fark < 0).sort((a, b) => a.fark - b.fark).slice(0, 3);
    const etiketsiz = yazilar.filter((a) => !(a.eksenler || []).length).length;
    return { yazilar, n, dilimler, dilimBoyu, eksenler, etiket, ciftler, artan, azalan, etiketsiz };
  }

  function dilimEtiketleri(h) {
    return `<ul class="seyir-dilim-liste">${h.dilimler.map((d, i) =>
      `<li><b>${i + 1}</b> ${esc(tarihYaz(d.ilk))} – ${esc(tarihYaz(d.son))}</li>`).join("")}</ul>`;
  }

  function cubukHtml(e, h) {
    const alt = doldur(tt({
      tr: "Dilimlere göre yazı sayısı: {liste}",
      en: "Pieces per period: {liste}",
      pt: "Textos por período: {liste}",
    }), { liste: e.say.map((s, i) => `${i + 1}: ${s}`).join(", ") });
    // Tasarım önerisi 2 (2026-10-21, kullanıcı onayı): dört çubuk yerine dilim gülü.
    // Tek daire dört eşit dilime bölünür (1. dilim sağ üst, saat yönünde 4'e); bir
    // dilimin uzaklığı o dilimdeki yazı sayısıdır. Ölçek bütün eksenlerde aynı
    // (h.dilimBoyu), yani gülleri birbiriyle kıyaslamak mümkün. Sayım betimleyicidir.
    const R0 = 9, RMAX = 52, MERKEZ = 0;
    const nokta = (r, a) => `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
    const parcalar = e.say.map((sayi, i) => {
      const a0 = -Math.PI / 2 + i * Math.PI / 2 + 0.05, a1 = a0 + Math.PI / 2 - 0.1, am = (a0 + a1) / 2;
      const r = R0 + (sayi / h.dilimBoyu) * (RMAX - R0);
      const yol = sayi === 0 ? "" :
        `<path class="seyir-gul__dilim" d="M${nokta(R0, a0)} L${nokta(r, a0)} A${r.toFixed(2)},${r.toFixed(2)} 0 0 1 ${nokta(r, a1)} L${nokta(R0, a1)} A${R0},${R0} 0 0 0 ${nokta(R0, a0)}Z">`
        + `<title>${esc(`${i + 1}. ${tt({ tr: "dilim", en: "period", pt: "período" })}: ${sayi}`)}</title></path>`;
      const rt = Math.max(r, R0 + 5) + 8;
      const ty = (rt * Math.sin(am) + 3).toFixed(2);
      return yol + `<text class="seyir-gul__sayi" x="${(rt * Math.cos(am)).toFixed(2)}" y="${ty}" text-anchor="middle">${sayi}</text>`;
    }).join("");
    const gul = `<svg class="seyir-gul" viewBox="-70 -70 140 140" aria-hidden="true" focusable="false">`
      + `<line class="seyir-gul__eksen" x1="${MERKEZ}" y1="-${RMAX + 4}" x2="${MERKEZ}" y2="${RMAX + 4}"/>`
      + `<line class="seyir-gul__eksen" x1="-${RMAX + 4}" y1="${MERKEZ}" x2="${RMAX + 4}" y2="${MERKEZ}"/>`
      + `<circle class="seyir-gul__merkez" r="${R0}"/>${parcalar}</svg>`;
    return `<div class="seyir-cubuklar" role="img" aria-label="${esc(alt)}">${gul}</div>`;
  }

  function parcaHtml(p) {
    const a = profil.articles.find((x) => x.url === p.url);
    if (!a) return "";
    return `<li><span class="seyir-tarih">${esc(tarihYaz(a.date))}</span> `
      + `<a class="seyir-baslik" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)}<span class="sr-only"> ${esc(tt({ tr: "(yeni sekmede açılır)", en: "(opens in a new tab)", pt: "(abre em nova aba)" }))}</span></a>`
      + `<p>${esc(tt(p))}</p></li>`;
  }

  function eksenHtml(e, h) {
    const metaTpl = tt({
      tr: "{n} yazı · ilk {ilk} · son {son}",
      en: "{n} pieces · first {ilk} · last {son}",
      pt: "{n} textos · primeiro {ilk} · último {son}",
    });
    const meta = e.toplam
      ? doldur(metaTpl, { n: e.toplam, ilk: tarihYaz(e.ilk), son: tarihYaz(e.son) })
      : doldur(tt({ tr: "{n} yazı", en: "{n} pieces", pt: "{n} textos" }), { n: 0 });
    const liste = ((parcalar && parcalar[e.id]) || []).map(parcaHtml).join("");
    return `<section class="seyir-eksen"><div class="seyir-eksen__ust"><h3>${esc(tt(e.label))}</h3>`
      + `<div class="seyir-meta">${esc(meta)}</div></div>${cubukHtml(e, h)}`
      + (liste ? `<ul class="seyir-parcalar">${liste}</ul>` : "") + `</section>`;
  }

  function kaymaHtml(h) {
    const satir = (x) => `<li>${esc(tt(x.e.label))}: <b>${x.e.say[0]} → ${x.e.say[DILIM - 1]}</b></li>`;
    if (!h.artan.length && !h.azalan.length) return "";
    const blok = (baslik, liste) => liste.length
      ? `<div><div class="seyir-kayma__baslik">${esc(baslik)}</div><ul>${liste.map(satir).join("")}</ul></div>` : "";
    return `<div class="seyir-kayma">`
      + blok(tt({ tr: "1. dilimden 4. dilime artan", en: "Rising from period 1 to period 4", pt: "Em alta do período 1 ao 4" }), h.artan)
      + blok(tt({ tr: "1. dilimden 4. dilime azalan", en: "Falling from period 1 to period 4", pt: "Em queda do período 1 ao 4" }), h.azalan)
      + `</div>`;
  }

  function ciftHtml(h) {
    return `<ul class="seyir-ciftler">${h.ciftler.map((c) =>
      `<li><b>${c.n}</b> ${esc(tt(h.etiket[c.ids[0]]))} <span>+</span> ${esc(tt(h.etiket[c.ids[1]]))}</li>`).join("")}</ul>`;
  }

  function render() {
    if (!profil) return;
    if (!profil.articles || !profil.articles.length) { kok.innerHTML = ""; return; }
    hesap = hesapla();
    const h = hesap;
    const ilkTarih = h.yazilar[0].date, sonTarih = h.yazilar[h.n - 1].date;
    const enSik = h.ciftler[0];
    const v = {
      n: h.n, k: h.eksenler.length, boy: h.dilimBoyu,
      ilk: tarihYaz(ilkTarih, true), son: tarihYaz(sonTarih, true),
      e: h.etiketsiz,
      a: enSik ? tt(h.etiket[enSik.ids[0]]) : "", b: enSik ? tt(h.etiket[enSik.ids[1]]) : "", c: enSik ? enSik.n : 0,
    };
    const T = (o) => doldur(tt(o), v);

    kok.innerHTML = `
      <div class="seyir-kutu"><b>${esc(tt({ tr: "Önce sınırlar.", en: "Limits first.", pt: "Primeiro, os limites." }))}</b> ${esc(T({
        tr: "Elimizde yalnızca Daphne'nin yayımladığı, seçilmiş ve düzenlenmiş yazılar var; bunlar neyi, hangi çerçeveyle yazmayı seçtiğini gösterir. Yazıların ardındaki hayatı, duyguyu ya da kişiliği göstermez ve bu sayfa onlar hakkında hiçbir çıkarım yapmaz. Eksenleri ve her yazının hangi eksenleri taşıdığını biz işaretledik: aşağıdaki sayılar bizim etiketlememizin sayısıdır, Daphne'nin kendi modeli değildir.",
        en: "All we have are the pieces Daphne chose to publish, selected and edited; they show what she chose to write about and in what frame. They do not show the life, feeling or personality behind the pieces, and this page makes no inference about them. We marked the axes and which axes each piece carries: the numbers below count our labelling; they are not Daphne's own model.",
        pt: "Temos apenas os textos que Daphne escolheu publicar, selecionados e editados; mostram sobre o que e em que enquadramento ela escolheu escrever. Não mostram a vida, o sentimento ou a personalidade por trás deles, e esta página não faz nenhuma inferência sobre isso. Fomos nós que marcámos os eixos e quais eixos cada texto traz: os números abaixo contam a nossa marcação; não são o modelo da própria Daphne.",
      }))}</div>

      <h2>${esc(tt({ tr: "Zaman içinde: dört dilim", en: "Over time: four periods", pt: "Ao longo do tempo: quatro períodos" }))}</h2>
      <p class="seyir-giris">${esc(T({
        tr: "{n} yazı ({ilk} – {son}) yayın tarihine göre dört eşit dilime bölündü (dilim başına yaklaşık {boy} yazı). Her eksen için tek daire dört dilime ayrılır (1. dilim sağ üstte, saat yönünde 4. dilime); bir dilimin uzaklığı o eksenin o dilimdeki yazı sayısıdır. Dilim başına bu kadar yazı küçük bir örneklemdir; 1–3 yazılık farklar bu sayımdan anlamlı sayılamaz.",
        en: "The {n} pieces ({ilk} – {son}) are split by publication date into four equal periods (about {boy} pieces each). For each axis, one circle is divided into four wedges (period 1 at upper right, clockwise to period 4); the length of a wedge is the number of that axis's pieces in that period. About this many pieces per period is a small sample; differences of 1–3 pieces cannot be read as meaningful from this count.",
        pt: "Os {n} textos ({ilk} – {son}) foram divididos pela data de publicação em quatro períodos iguais (cerca de {boy} textos cada). Para cada eixo, um círculo é dividido em quatro fatias (período 1 no canto superior direito, em sentido horário até o 4); o comprimento de uma fatia é o número de textos desse eixo nesse período. Cerca deste número de textos por período é uma amostra pequena; diferenças de 1–3 textos não podem ser lidas como significativas a partir desta contagem.",
      }))}</p>
      ${dilimEtiketleri(h)}
      ${h.eksenler.map((e) => eksenHtml(e, h)).join("")}

      <h2>${esc(tt({ tr: "Hangi eksenler birlikte geçiyor?", en: "Which axes appear together?", pt: "Quais eixos aparecem juntos?" }))}</h2>
      <p class="seyir-giris">${esc(tt({
        tr: "Aynı yazıda birlikte işaretlenen eksen çiftleri (ilk on).",
        en: "Pairs of axes marked together in the same piece (top ten).",
        pt: "Pares de eixos marcados juntos no mesmo texto (os dez primeiros).",
      }))}</p>
      ${ciftHtml(h)}

      <h2>${esc(tt({ tr: "Ne biliyoruz, ne bilmiyoruz", en: "What we know, what we do not", pt: "O que sabemos, o que não sabemos" }))}</h2>
      <ul class="seyir-say">
        <li><b>${esc(tt({ tr: "Biliyoruz:", en: "We know:", pt: "Sabemos:" }))}</b> ${esc(T({
          tr: "hangi yazıyı hangi tarihte yayımladığını; yazılarında hangi temaların tekrarlandığını (bizim etiketlememizle); bazı eksenlerin hangi dönemlerde öne çıkıp seyreldiğini; hangi temaların en sık birlikte geçtiğini. Örneğin “{a}” ile “{b}” {c} yazıda birlikte işaretli.",
          en: "which piece was published on which date; which themes recur in the pieces (under our labelling); in which periods some axes stand out or thin out; which themes appear together most often. For example, “{a}” and “{b}” are marked together in {c} pieces.",
          pt: "qual texto foi publicado em que data; quais temas se repetem nos textos (segundo a nossa marcação); em que períodos alguns eixos se destacam ou rareiam; quais temas aparecem juntos com mais frequência. Por exemplo, “{a}” e “{b}” estão marcados juntos em {c} textos.",
        }))}</li>
        <li><b>${esc(tt({ tr: "Dilimler arası kayma:", en: "Shift between periods:", pt: "Variação entre períodos:" }))}</b> ${esc(tt({
          tr: "Aşağıdaki sayılar, bir eksenin 1. ve 4. dilimdeki yazı sayısıdır. Bu, yazdığı konuların ağırlığındaki değişimdir; sayım nedenini göstermez.",
          en: "The numbers below are an axis's piece counts in period 1 and period 4. This is a change in the weight of the subjects she wrote about; the count does not show why.",
          pt: "Os números abaixo são a contagem de textos de um eixo no período 1 e no período 4. É uma mudança no peso dos assuntos sobre os quais ela escreveu; a contagem não mostra o porquê.",
        }))}${kaymaHtml(h)}</li>
        <li><b>${esc(tt({ tr: "Bilmiyoruz:", en: "We do not know:", pt: "Não sabemos:" }))}</b> ${esc(tt({
          tr: "bu değişimin neden olduğunu; yazılarının dışındaki hayatını; neyi yazmamayı seçtiğini; yayımlanmamış düşüncelerini.",
          en: "why this change happened; her life outside the pieces; what she chose not to write; her unpublished thoughts.",
          pt: "por que essa mudança aconteceu; a vida dela fora dos textos; o que escolheu não escrever; os pensamentos não publicados.",
        }))}</li>
        <li><b>${esc(tt({ tr: "Dost'la örtüştüğü yerler:", en: "Where it overlaps with Dost:", pt: "Onde se sobrepõe a Dost:" }))}</b> ${esc(tt({
          tr: "site bu bağları Bağlar Haritası sekmesinde kendi gerekçeleriyle gösteriyor. Onları da biz kurduk.",
          en: "the site shows these links in the Map of Links tab, with their own reasons. We built those too.",
          pt: "o site mostra esses vínculos no separador Mapa de Vínculos, com as suas próprias razões. Esses também fomos nós que construímos.",
        }))}</li>
      </ul>
      <p class="seyir-son">${esc(T({
        tr: "Kaynak: Daphne'nin yayımladığı {n} yazı, {k} eksen.",
        en: "Source: the {n} pieces Daphne has published, {k} axes.",
        pt: "Fonte: os {n} textos que Daphne publicou, {k} eixos.",
      }))}${h.etiketsiz ? " " + esc(T(h.etiketsiz === 1 ? {
        tr: "{e} yazıda eksen işareti yok, bu yüzden eksen sayılarına girmiyor.",
        en: "{e} of them carries no axis mark, so it is not part of the axis counts.",
        pt: "{e} deles não tem marca de eixo, por isso não entra nas contagens dos eixos.",
      } : {
        tr: "{e} yazıda eksen işareti yok, bu yüzden eksen sayılarına girmiyor.",
        en: "{e} of them carry no axis mark, so they are not part of the axis counts.",
        pt: "{e} deles não têm marca de eixo, por isso não entram nas contagens dos eixos.",
      })) : ""} ${esc(tt({
        tr: "Sayfa, betimleyici sayımdan öteye geçmemek için bilerek yorum içermiyor.",
        en: "The page deliberately carries no interpretation, to stay with descriptive counting.",
        pt: "A página deliberadamente não contém interpretação, para ficar na contagem descritiva.",
      }))}</p>`;
  }

  function yukle() {
    if (window.DostViewStatus) window.DostViewStatus.showLoading("seyir-wrap");
    Promise.all([GU.fetchJson("data/daphne-profile.json"), GU.fetchJson("data/daphne-eksen-seyri.json")])
      .then(([p, s]) => {
        profil = p;
        parcalar = s.parcalar;
        if (window.DostViewStatus) window.DostViewStatus.hide("seyir-wrap");
        render();
      })
      .catch((err) => {
        console.error("Eksen seyri verisi yüklenemedi / Failed to load axis course data", err);
        if (window.DostViewStatus) window.DostViewStatus.showError("seyir-wrap", yukle);
      });
  }

  window.__dostDaphneSeyirApp = {
    activate: function () {
      if (basladi) return;
      basladi = true;
      yukle();
    },
    render: render,
  };
})();
