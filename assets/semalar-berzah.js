// Şemalar Arşivi — "Berzah ve Hayal" iki özel şeması (2026-10-31, kullanıcı onayı):
//   berzah-boynuz  Boynuz (Sûr) + göz halkaları (Fütûhât II, 63. Bölüm s. 426-427 ve çevre ciltler)
//   berzah-halka   Fütûhât'ın kısımları bir halkada; berzah/hayal geçen kısımlar nokta
//
// YORUM YOK: halkalar yalnız aynı terimin geçtiği yerlerdir, her madde o kısmın kendi
// cümlesidir (data/ibn-arabi/berzah-hayal.json, scripts/berzah-hayal-uret.py). Halkaların
// ve göz yapraklarının boynuz üzerindeki yeri çizim düzenidir (künyede yazılı).
// GORSEL_DIL: ok yok, iç içe çember yok, sahte 3B yok, Hak bir lamba değil (boş halka);
// derinlik atmosferik açılma (boynuz altı = kesret = silik).
// semalar.js ilk açılışta window.__dostOnceYukle("semalar-berzah") ile indirir.
(function () {
  "use strict";

  const GU = window.DostGraphUtils;
  const I18n = window.DostI18n;
  const tt = I18n.pick3;
  const t3 = (tr, en, pt) => tt({ tr, en, pt });
  const ROMEN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const href = (view, id) => (window.__dostNav ? window.__dostNav.href(view, id) : `/${view}/${id ? id + "/" : ""}`);
  const kisimParca = (id) => { const m = /^c(\d+)k(\d+)$/.exec(id); return { cilt: +m[1], kisim: +m[2] }; };
  const kisaEtiket = (id, sayfa) => { const k = kisimParca(id); return `${ROMEN[k.cilt]}·${sayfa ? String(sayfa).split(/[-–]/)[0] : k.kisim}`; };
  const uzunEtiket = (id) => { const k = kisimParca(id); return `${t3("Cilt", "Vol.", "Vol.")} ${ROMEN[k.cilt]} · ${t3("Kısım", "Part", "Parte")} ${k.kisim}`; };
  const kisimBag = (id, sayfa) => `<a class="sema-bag" href="${href("futuhat", id)}" data-view="futuhat" data-id="${id}">${esc(uzunEtiket(id))}${sayfa ? esc(` · ${t3("s.", "pp.", "pp.")} ${sayfa}`) : ""}</a>`;

  let veri = null;
  let promise = null;
  function yukle() {
    if (veri) return Promise.resolve(veri);
    if (!promise) {
      promise = GU.fetchJson("data/ibn-arabi/berzah-hayal.json").then((d) => { veri = d; return d; }).catch((e) => { promise = null; throw e; });
    }
    return promise;
  }

  function alintiHtml(m) {
    const metin = tt(m.alinti);
    return `<blockquote class="sema-alinti"><p>${m.tur === "alinti" ? "“" + esc(metin) + "”" : esc(metin)}</p><cite>${kisimBag(m.kisim, m.sayfa)}</cite></blockquote>`;
  }

  // Bilgi alanı: seçili halka/yaprağın başlığı, kısmın kendi cümlesi ve kısıma bağ.
  function bilgiYaz(kutu, baslik, madde, ek) {
    kutu.innerHTML = `<p class="sema-bilgi__baslik">${esc(baslik)}</p>${alintiHtml(madde)}${ek || ""}`;
  }

  function bilgiVarsayilan() {
    return `<p class="sema-bilgi__ipucu">${esc(t3("Bir halkaya ya da göz yaprağına dokun.", "Touch a ring or a petal of the eye.", "Toque em um anel ou em uma pétala do olho."))}</p>`;
  }

  // ---- Boynuz + göz halkaları ----------------------------------------------
  function boynuz(v, mount) {
    const madde = [];
    v.temalar.forEach((t) => t.maddeler.forEach((m) => madde.push({ tema: t, m })));
    // Halkalar boynuzun iki yanında eşit aralıklı (yer anlam taşımaz).
    const sol = madde.filter((_, i) => i % 2 === 0), sag = madde.filter((_, i) => i % 2 === 1);
    const Y0 = 70, DY = 40;
    const kenarX = (y) => { const t = (y - 56) / (400 - 56); const yari = 11 + (122 - 11) * Math.pow(t, 1.7); return yari; };
    const pin = (liste, taraf) => liste.map((o, i) => {
      const y = Y0 + i * DY;
      const x = taraf === "sol" ? 34 : 326;
      const kx = taraf === "sol" ? 180 - kenarX(y) - 8 : 180 + kenarX(y) + 8;
      const id = `${o.tema.id}-${o.m.kisim}-${i}${taraf}`;
      return `<g class="sema-pin" data-ix="${madde.indexOf(o)}" tabindex="0" role="button" aria-label="${esc(tt(o.tema.ad))}: ${esc(uzunEtiket(o.m.kisim))}">
        <line class="sema-pin__cizgi" x1="${x + (taraf === "sol" ? 9 : -9)}" y1="${y}" x2="${kx}" y2="${y}"/>
        <circle class="sema-pin__halka" cx="${x}" cy="${y}" r="10"/>
        <text class="sema-pin__etiket" x="${x}" y="${y + 22}" text-anchor="middle">${esc(kisaEtiket(o.m.kisim, o.m.sayfa))}</text></g>`;
    }).join("");
    // Göz yaprakları (gül): boynuzun gövdesinde, merkez (180, 262)
    const yap = [["duyu", 0], ["kalp", 90], ["onun", 180], ["hayal", 270]];
    const yapraklar = yap.map(([id, a]) => `<ellipse class="sema-goz sema-goz--${id}" data-goz="${id}" tabindex="0" role="button" aria-label="${esc(tt(v.gozler.find((g) => g.id === id).ad))}" cx="180" cy="${262 - 34}" rx="15" ry="34" transform="rotate(${a} 180 262)"/>`).join("");
    const chips = v.gozler.map((g) => `<button class="sema-goz-chip sema-goz-chip--${g.id}" type="button" data-goz="${g.id}"><span class="sema-goz-chip__nokta" aria-hidden="true"></span>${esc(tt(g.ad))}</button>`).join("");
    const sema = v.boynuz.sema;
    const tumu = v.temalar.map((t) => `<section class="sema-tema"><h4>${esc(tt(t.ad))}</h4>${t.maddeler.map(alintiHtml).join("")}</section>`).join("");

    mount.innerHTML = `<figure class="sema-boynuz">
        <svg class="sema-boynuz__svg" viewBox="0 0 360 440" role="group" aria-label="${esc(t3("Boynuz (Sûr) şeması", "The horn (Sūr) diagram", "Diagrama do chifre (Sūr)"))}">
          <defs><linearGradient id="semaBoynuzGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="currentColor" stop-opacity=".88"/><stop offset="1" stop-color="currentColor" stop-opacity=".10"/></linearGradient></defs>
          <path class="sema-boynuz__govde" d="M169 56 C171 150 136 300 58 400 L302 400 C224 300 189 150 191 56 Z" fill="url(#semaBoynuzGrad)"/>
          <ellipse class="sema-boynuz__taban" cx="180" cy="400" rx="122" ry="7"/>
          <g class="sema-hak" tabindex="0" role="button" aria-label="${esc(tt(sema.gordugu.note))}"><circle cx="180" cy="40" r="10"/></g>
          <text class="sema-boynuz__etiket" x="180" y="20" text-anchor="middle">${esc(t3("dar uç", "narrow end", "extremidade estreita"))}</text>
          <text class="sema-boynuz__etiket" x="180" y="424" text-anchor="middle">${esc(t3("geniş uç", "wide end", "extremidade larga"))}</text>
          ${pin(sol, "sol")}${pin(sag, "sag")}
          ${yapraklar}<circle class="sema-goz__merkez" cx="180" cy="262" r="4"/>
        </svg>
        <figcaption class="sema-boynuz__alt">${esc(tt(sema.gordugu.label))}: ${esc(tt(sema.gordugu.note))}.<br>${esc(tt(sema.sandigi.label))}: ${esc(tt(sema.sandigi.note))}.</figcaption>
      </figure>
      <div class="sema-goz-chips" role="group" aria-label="${esc(t3("Göz", "The eye", "O olho"))}">${chips}</div>
      <div class="sema-bilgi" aria-live="polite">${bilgiVarsayilan()}</div>
      <p class="sema-baslik">${esc(t3("Boynuzun yönü", "The horn's direction", "A direção do chifre"))}</p>
      <p class="sema-not">${esc(tt(v.fark))}</p>
      <div class="sema-fark">${alintiHtml(v.boynuz.dar)}${alintiHtml(v.boynuz.karsit)}</div>
      <details class="sema-tumu"><summary>${esc(t3("Bütün maddeler (temalara göre)", "All items (by theme)", "Todos os itens (por tema)"))}</summary>${tumu}</details>
      <p class="sema-not sema-not--kunye">${esc(tt(v.kunye))}</p>`;

    const bilgi = mount.querySelector(".sema-bilgi");
    const gozSec = (id) => {
      mount.querySelectorAll(".sema-goz,.sema-goz-chip").forEach((e) => e.classList.toggle("is-secili", e.dataset.goz === id));
      mount.querySelectorAll(".sema-pin").forEach((e) => e.classList.remove("is-secili"));
      const g = v.gozler.find((x) => x.id === id);
      bilgiYaz(bilgi, tt(g.ad), g.ref);
    };
    const pinSec = (el) => {
      const o = madde[+el.dataset.ix];
      mount.querySelectorAll(".sema-goz,.sema-goz-chip").forEach((e) => e.classList.remove("is-secili"));
      mount.querySelectorAll(".sema-pin").forEach((e) => e.classList.toggle("is-secili", e === el));
      bilgiYaz(bilgi, tt(o.tema.ad), o.m);
    };
    const hakSec = () => {
      mount.querySelectorAll(".sema-goz,.sema-goz-chip,.sema-pin").forEach((e) => e.classList.remove("is-secili"));
      bilgiYaz(bilgi, `${tt(sema.gordugu.label)}: ${tt(sema.gordugu.note)}`, v.boynuz.hak);
    };
    mount.querySelectorAll("[data-goz]").forEach((e) => {
      e.addEventListener("click", () => gozSec(e.dataset.goz));
      e.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); gozSec(e.dataset.goz); } });
    });
    mount.querySelectorAll(".sema-pin").forEach((e) => {
      e.addEventListener("click", () => pinSec(e));
      e.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pinSec(e); } });
    });
    const hak = mount.querySelector(".sema-hak");
    hak.addEventListener("click", hakSec);
    hak.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); hakSec(); } });
  }

  // ---- 226 kısımlık halka ---------------------------------------------------
  function halka(v, mount) {
    const h = v.halka;
    const cx = 180, cy = 190, R = 130;
    const toplam = h.kisimlar.length;
    const enCok = Math.max.apply(null, h.noktalar.map((n) => n.n));
    const aci = (i) => (i / toplam) * 2 * Math.PI - Math.PI / 2;
    const sira = {};
    h.kisimlar.forEach((id, i) => { sira[id] = i; });
    // cilt başlangıç etiketleri
    let etiket = "";
    const goruldu = {};
    h.kisimlar.forEach((id, i) => {
      const c = kisimParca(id).cilt;
      if (goruldu[c] || c === 18) return; // XVIII, I'in yanında üst üste biner; etiketsiz
      
      goruldu[c] = true;
      const a = aci(i);
      etiket += `<text class="sema-halka__cilt" x="${(cx + (R + 22) * Math.cos(a)).toFixed(1)}" y="${(cy + (R + 22) * Math.sin(a) + 3).toFixed(1)}" text-anchor="middle">${ROMEN[c]}</text>`;
    });
    const noktalar = h.noktalar.map((n) => {
      const a = aci(sira[n.id]);
      const r = 3 + (n.n / enCok) * 7;
      const x = cx + R * Math.cos(a), y = cy + R * Math.sin(a);
      const op = (0.38 + (n.n / enCok) * 0.55).toFixed(2);
      return `<circle class="sema-nokta" data-id="${n.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" style="fill-opacity:${op}" tabindex="0" role="button" aria-label="${esc(tt(n.baslik))}: ${n.n}"/>`;
    }).join("");
    const topPar = h.noktalar.reduce((s, n) => s + n.n, 0);
    mount.innerHTML = `<figure class="sema-halka-fig">
        <svg class="sema-halka__svg" viewBox="0 0 360 380" role="group" aria-label="${esc(t3("Berzah ve hayal: kısımlar halkası", "Barzakh and imagination: ring of parts", "Barzakh e imaginação: anel das partes"))}">
          <circle class="sema-halka__cember" cx="${cx}" cy="${cy}" r="${R}"/>
          ${etiket}${noktalar}
          <circle class="sema-halka__merkez" cx="${cx}" cy="${cy}" r="30"/>
          <text class="sema-halka__yazi" x="${cx}" y="${cy - 2}" text-anchor="middle">${esc(t3("berzah", "barzakh", "barzakh"))}</text>
          <text class="sema-halka__yazi" x="${cx}" y="${cy + 12}" text-anchor="middle">${esc(t3("hayal", "imagination", "imaginação"))}</text>
        </svg>
        <figcaption class="sema-boynuz__alt">${esc(t3(`${h.noktalar.length} kısım, ${topPar} paragraf.`, `${h.noktalar.length} parts, ${topPar} paragraphs.`, `${h.noktalar.length} partes, ${topPar} parágrafos.`))} ${esc(tt(h.olcut))}</figcaption>
      </figure>
      <div class="sema-bilgi" aria-live="polite">${bilgiVarsayilan()}</div>
      <p class="sema-not sema-not--kunye">${esc(tt(v.kunye))}</p>`;
    const bilgi = mount.querySelector(".sema-bilgi");
    const sec = (el) => {
      const n = h.noktalar.find((x) => x.id === el.dataset.id);
      mount.querySelectorAll(".sema-nokta").forEach((e) => e.classList.toggle("is-secili", e === el));
      bilgi.innerHTML = `<p class="sema-bilgi__baslik">${esc(tt(n.baslik))}</p>
        <p class="sema-not">${esc(t3(`${n.n} paragrafta berzah ya da hayal sözcüğü geçiyor.`, `The word barzakh or imagination occurs in ${n.n} paragraph${n.n === 1 ? "" : "s"}.`, `A palavra barzakh ou imaginação ocorre em ${n.n} parágrafo${n.n === 1 ? "" : "s"}.`))}</p>
        <p class="sema-eylem">${kisimBag(n.id)}</p>`;
    };
    mount.querySelectorAll(".sema-nokta").forEach((e) => {
      e.addEventListener("click", () => sec(e));
      e.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); sec(e); } });
    });
  }

  window.DostSemalarBerzah = {
    ciz(tur, mount) {
      return yukle().then((v) => (tur === "berzah-boynuz" ? boynuz(v, mount) : halka(v, mount)));
    },
  };
})();
