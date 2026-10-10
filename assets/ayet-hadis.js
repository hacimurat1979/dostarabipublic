/**
 * "Âyet & Hadis İndeksi" -- sitenin Fütûhât/Füsûs okuması boyunca alıntılanan
 * âyet ve hadislerin, TEKRARLADIKLARI yere göre sıralanmış tek bir liste
 * hâlinde toplandığı görünüm. Veri: data/ibn-arabi/kuran.json (Arapça asıl +
 * meal), data/ibn-arabi/ayet-dizini.json ve hadis-dizini.json (hangi âyet/
 * ifadenin sitede nerelerde geçtiği -- bkz. assets/ayet-onizleme.js'in aynı
 * kaynakları hover künyeleri için kullanması). Bu görünüm o hover mekanizmasının
 * TERSİ: künyeyi metnin içinde tek tek bulmak yerine, hepsini tek sayfada
 * gezilebilir kılıyor.
 *
 * 2026-10-10: dördüncü kaynak data/ibn-arabi/ham-metin-gecisleri.json --
 * aynı âyet/hadisin Fütûhât'ın KENDİ metninde (Demirli çevirisinin taranmış
 * metni) hangi cilt/sayfada, hangi cümleyle anıldığı. Dizinlerle
 * KARIŞTIRILMIYOR: dizin "sitede şu kısımda alıntılanıyor" der, bu liste
 * "Dost şu sayfada şöyle anıyor" der. Kartın altında katlanır liste olarak
 * duruyor; satırlar ilk açılışta çiziliyor (33:4'te 362 satır var). Sitede
 * yalnız dar sayım (dar:true, guvensiz değil) gösteriliyor.
 */
window.__ayetHadisApp = (function () {
  "use strict";
  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;

  const wrapEl = document.getElementById("ayethadis-wrap");
  const listEl = document.getElementById("ayethadis-list");

  const tt = I18n.pick3;  // window.DostI18n.pick3 zaten (!obj) koruması yapıyor (2026-08-15: 26 dosyadaki tekrar buraya toplandı)

  let dataPromise = null;
  let kuran = null, ayetDizin = null, hadisDizin = null, hadisMetin = {};
  // Ham metin geçişleri: anahtar -> kayıt (âyet ve hadis ayrı), kısım başlıkları.
  let hamAyet = {}, hamHadis = {}, hamKisim = {};

  // ayet-onizleme.js (künye hover kutusu) da AYNI üç dosyayı indiriyor; onun
  // GU.fetchJson önbelleğiyle gerçekten paylaşabilmemiz için o modülün
  // kullandığı yolu birebir kullanıyoruz -- ROUTE_BASE + kök-göreli yol.
  // Aksi hâlde iki farklı anahtar ("data/..." burada, base()+"/data/..."
  // orada) önbelleği ayırır ve aynı sayfada aynı dosya iki kez iner.
  function base() { return window.__dostRouteBase || ""; }

  function fetchData() {
    if (dataPromise) return dataPromise;
    if (window.DostViewStatus) window.DostViewStatus.showLoading("ayethadis-wrap");
    dataPromise = Promise.all([
      GU.fetchJson(base() + "/data/ibn-arabi/kuran.json"),
      GU.fetchJson(base() + "/data/ibn-arabi/ayet-dizini.json"),
      GU.fetchJson(base() + "/data/ibn-arabi/hadis-dizini.json"),
      // Geçiş listesi ek bilgi: inmezse dizin yine görünür, yalnız katlanır
      // listeler çıkmaz (sessizce değil -- konsola uyarı düşer).
      GU.fetchJson(base() + "/data/ibn-arabi/ham-metin-gecisleri.json").catch((err) => {
        console.warn("Ham metin geçişleri yüklenemedi", err);
        return null;
      }),
    ])
      .then(([k, ad, hd, hm]) => {
        kuran = k;
        ayetDizin = ad.dizin || {};
        hadisDizin = hd.dizin || {};
        hadisMetin = hd.metin || {};
        hamAyet = {}; hamHadis = {}; hamKisim = (hm && hm.kisimlar) || {};
        ((hm && hm.ayetler) || []).forEach((a) => { hamAyet[a.anahtar] = a; });
        ((hm && hm.hadisler) || []).forEach((h) => { hamHadis[h.anahtar] = h; });
        if (window.DostViewStatus) window.DostViewStatus.hide("ayethadis-wrap");
        return true;
      })
      .catch((err) => {
        console.error("Âyet/hadis indeksi yüklenemedi", err);
        dataPromise = null;
        if (window.DostViewStatus) {
          window.DostViewStatus.showError("ayethadis-wrap", () => window.__ayetHadisApp.activate());
        }
        return false;
      });
    return dataPromise;
  }

  // Ortak kaçış (2026-10-09): graph-utils.js escapeHtml ile birebir aynı
  // davranıştaki yerel kopyanın yerine (& < > " ; null -> "").
  function esc(s) { return window.DostGraphUtils.escapeHtml(s); }

  function sureAdi(ref) {
    const no = parseInt(ref.split(":")[0], 10);
    const s = (kuran.sureler || []).find((x) => x.no === no);
    return s ? esc(tt(s.ad)) : "";
  }

  // ayet-onizleme.js'teki (künye hover kutusu) AYNI dosyayı kullanıyor.
  // 2026-09-13'ten beri kuran.json'daki 65 âyetin tümünde meal.pt var
  // (bkz. kuran.json'daki üst düzey 'kaynak' alanı: hazır bir veri seti
  // değil, TR/EN mealden elle üretilmiş çeviri) -- bu yüzden PT modunda
  // artık normalde bu düşme hiç devreye girmiyor. Yine de burada
  // BIRAKILIYOR: gelecekte yeni bir âyet eklenip pt'si henüz yazılmadan
  // yayına girerse (ya da yeni bir dil eklenirse), sessizce yanlış dile
  // düşmek yerine kullanıcıya dürüstçe hangi dilde gösterildiği söylensin
  // diye (CLAUDE.md: "yaptığımız işi olduğundan farklı gösterme").
  const DIL_ADI = {
    tr: { tr: "Türkçe", en: "Turkish", pt: "turco" },
    en: { tr: "İngilizce", en: "English", pt: "inglês" },
  };
  function ayetMeal(ref) {
    const a = kuran.ayetler && kuran.ayetler[ref];
    if (!a) return "";
    const lang = I18n ? I18n.getLang() : "tr";
    const meal = a.meal || {};
    const mealDili = meal[lang] ? lang : (meal.en ? "en" : (meal.tr ? "tr" : null));
    const govde = mealDili ? meal[mealDili] : "";
    const not = (mealDili && mealDili !== lang && DIL_ADI[mealDili])
      ? ` <span class="ayethadis-item__meal-not">${esc(tt({
          tr: `(meal ${DIL_ADI[mealDili].tr} — bu dilde meal elimizde yok)`,
          en: `(translation in ${DIL_ADI[mealDili].en} — we have none in this language)`,
          pt: `(tradução em ${DIL_ADI[mealDili].pt} — não temos nenhuma neste idioma)`,
        }))}</span>`
      : "";
    return esc(govde) + not;
  }

  function locHtml(list) {
    return (list || [])
      .map((e) => {
        const href = window.__dostNav ? window.__dostNav.href(e.view, e.id) : esc(e.route || "");
        return `<a class="cross-link ayethadis-item__loc" href="${esc(href)}" data-view="${esc(e.view)}" data-id="${esc(e.id)}">${esc(tt(e.title))}</a>`;
      })
      .join("");
  }

  // ---------------------------------------------------------------------
  // Fütûhât'ta anıldığı yerler (ham metin geçişleri)
  // ---------------------------------------------------------------------
  const CILT_ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];

  function gorunurGecisler(kayit) {
    return (kayit.gecisler || []).filter((g) => g.dar && !g.guvensiz);
  }

  function kisimLink(id) {
    const href = window.__dostNav ? window.__dostNav.href("futuhat", id) : esc(base() + "/futuhat/" + id + "/");
    const ad = hamKisim[id] ? tt(hamKisim[id]) : id;
    return `<a class="cross-link ayethadis-item__loc" href="${esc(href)}" data-view="futuhat" data-id="${esc(id)}">${esc(ad)}</a>`;
  }

  function konumHtml(g) {
    const sayfa = g.sayfa == null ? "" : (g.sayfaYaklasik ? "≈" : "") + g.sayfa;
    return esc(tt({
      tr: `Cilt ${CILT_ROMAN[g.cilt]} · s. ${sayfa}`,
      en: `Vol. ${CILT_ROMAN[g.cilt]} · p. ${sayfa}`,
      pt: `Vol. ${CILT_ROMAN[g.cilt]} · p. ${sayfa}`,
    }));
  }

  function gecisSatirlari(kayit) {
    const satirlar = gorunurGecisler(kayit).map((g) => {
      const kisimlar = (g.kisimSinirda || [g.kisim]).map(kisimLink).join('<span class="ayethadis-gecis__ayrac"> / </span>');
      return (
        `<li class="ayethadis-gecis__satir">` +
        `<span class="ayethadis-gecis__konum">${konumHtml(g)}</span>` +
        `<span class="ayethadis-gecis__kisim">${kisimlar}</span>` +
        `<span class="ayethadis-gecis__cumle" lang="tr">${esc(g.cumle)}</span>` +
        `</li>`
      );
    }).join("");
    const seffaflik = tt({
      tr: "Demirli çevirisinin taranmış metninde sayıldı; sayfa numaraları ±1 sapabilir, ≈ işaretli sayfalar komşu sayfalardan tahmin edildi. Cümleler o metinden aktarıldı; yalnız bariz tarama hataları düzeltildi.",
      en: "Counted in the scanned text of Demirli's Turkish translation; page numbers may be off by ±1, and pages marked ≈ were estimated from the neighbouring pages. The sentences are quoted in Turkish from that text; only obvious scanning errors were corrected.",
      pt: "Contado no texto digitalizado da tradução turca de Demirli; os números de página podem variar ±1, e as páginas marcadas com ≈ foram estimadas a partir das páginas vizinhas. As frases são citadas em turco a partir desse texto; só foram corrigidos erros evidentes de digitalização.",
    });
    return (
      `<p class="ayethadis-gecis__not">${esc(seffaflik)}</p>` +
      `<p class="ayethadis-gecis__tanim">${esc(tt(kayit.sayim.aciklama))}</p>` +
      `<ol class="ayethadis-gecis__liste">${satirlar}</ol>`
    );
  }

  // Katlanır liste: başlık sayıyı söyler, satırlar ilk açılışta çizilir.
  function gecisHtml(tip, kayit) {
    if (!kayit) return "";
    const s = kayit.sayim;
    const baslik = tt({
      tr: `Fütûhât'ta anıldığı yerler (${s.gecis} geçiş, ${s.cilt} cilt)`,
      en: `Where it is mentioned in the Futuhat (${s.gecis} passages, ${s.cilt} volumes)`,
      pt: `Onde é mencionado no Futuhat (${s.gecis} passagens, ${s.cilt} volumes)`,
    });
    return (
      `<details class="ayethadis-gecis" data-ham-tip="${tip}" data-ham="${esc(kayit.anahtar)}">` +
      `<summary class="ayethadis-gecis__baslik">${esc(baslik)}</summary>` +
      `<div class="ayethadis-gecis__icerik"></div>` +
      `</details>`
    );
  }

  let sonAcilan = null;
  function gecisleriBagla() {
    listEl.querySelectorAll("details.ayethadis-gecis").forEach((d) => {
      d.addEventListener("toggle", () => {
        if (!d.open) { if (sonAcilan === d) sonAcilan = null; return; }
        sonAcilan = d;
        const icerik = d.querySelector(".ayethadis-gecis__icerik");
        if (icerik.dataset.cizildi) return;
        const kayit = (d.dataset.hamTip === "ayet" ? hamAyet : hamHadis)[d.dataset.ham];
        if (!kayit) return;
        icerik.innerHTML = gecisSatirlari(kayit);
        icerik.dataset.cizildi = "1";
      });
    });
  }

  // Esc bir adım geri: en son açılan geçiş listesini kapatır (sonra bir
  // öncekini), odağı kendi başlığına bırakır. Açık liste yoksa zincir sürer.
  GU.registerStepBack("ayethadis-wrap", () => {
    let d = sonAcilan && sonAcilan.open ? sonAcilan : null;
    if (!d) {
      const acik = listEl.querySelectorAll("details.ayethadis-gecis[open]");
      d = acik.length ? acik[acik.length - 1] : null;
    }
    if (!d) return false;
    d.open = false;
    const s = d.querySelector("summary");
    if (s) s.focus();
    return true;
  });

  function ayetKartiHtml(ref, list) {
    const a = kuran.ayetler && kuran.ayetler[ref];
    const ar = a ? esc(a.ar || "") : "";
    return (
      `<article class="ayethadis-item">` +
      `<div class="ayethadis-item__head">` +
      `<span class="ayet-ref ayethadis-item__ref" data-ayet="${esc(ref)}" tabindex="0">${sureAdi(ref)} ${esc(ref)}</span>` +
      (list ? `<span class="ayethadis-item__n">${list.length}</span>` : "") +
      `</div>` +
      (ar ? `<p class="ayethadis-item__ar" dir="rtl" lang="ar">${ar}</p>` : "") +
      `<p class="ayethadis-item__meal">${ayetMeal(ref)}</p>` +
      (list ? `<div class="ayethadis-item__locs">${locHtml(list)}</div>` : "") +
      gecisHtml("ayet", hamAyet[ref]) +
      `</article>`
    );
  }

  function kunyeHtml(n) {
    return esc(tt({
      tr: `Cilt ${CILT_ROMAN[n.cilt]}, s. ${n.sayfa}`,
      en: `Vol. ${CILT_ROMAN[n.cilt]}, p. ${n.sayfa}`,
      pt: `Vol. ${CILT_ROMAN[n.cilt]}, p. ${n.sayfa}`,
    })) + " · " + kisimLink(n.kisim);
  }

  // Yalnız ham metinde sayılan hadis: metin + künye + geçiş listesi.
  function hamHadisKartiHtml(h) {
    const nitelik = h.nitelik === "kudsi"
      ? { tr: "kutsî hadis", en: "sacred saying", pt: "dito sagrado" }
      : { tr: "hadis", en: "hadith", pt: "hadith" };
    const not = h.rivayetNotu
      ? `<div class="ayethadis-item__rivayet">` +
        `<p class="ayethadis-item__rivayet-aktarim">${esc(tt(h.rivayetNotu.aktarim))}</p>` +
        `<blockquote class="ayethadis-item__rivayet-cumle" lang="tr">${esc(h.rivayetNotu.cumle)}</blockquote>` +
        `<p class="ayethadis-item__rivayet-kunye">${kunyeHtml(h.rivayetNotu)}</p>` +
        `</div>`
      : "";
    return (
      `<article class="ayethadis-item ayethadis-item--ham">` +
      `<div class="ayethadis-item__head">` +
      `<span class="ayethadis-item__ref ayethadis-item__ref--hadis">${esc(tt(h.ad))}</span>` +
      `<span class="ayethadis-item__nitelik">${esc(tt(nitelik))}</span>` +
      `</div>` +
      `<p class="ayethadis-item__meal">“${esc(tt(h.metin))}”</p>` +
      `<p class="ayethadis-item__meal-not">${esc(tt({
        tr: "Metin, Demirli'nin Fütûhât'taki ifadesinden.",
        en: "The text follows Demirli's Turkish wording in the Futuhat; the English rendering is ours.",
        pt: "O texto segue a formulação turca de Demirli no Futuhat; a versão portuguesa é nossa.",
      }))}</p>` +
      not +
      gecisHtml("hadis", h) +
      `</article>`
    );
  }

  function render() {
    const ayetItems = Object.keys(ayetDizin).map((ref) => ({ tip: "ayet", ref, list: ayetDizin[ref] }));
    const hadisItems = Object.keys(hadisDizin).map((ref) => ({ tip: "hadis", ref, list: hadisDizin[ref] }));
    const all = ayetItems.concat(hadisItems).sort((a, b) => b.list.length - a.list.length);

    const intro = tt({
      tr: `Fütûhât ve Füsûs okuması boyunca sitede alıntılanan ${ayetItems.length} âyet ve ${hadisItems.length} kutsî hadisin, en çok tekrarladıkları yerden başlayarak sıralanmış bir dizini.`,
      en: `An index of the ${ayetItems.length} verses and ${hadisItems.length} sacred sayings quoted across the site's reading of the Futuhat and the Fusus, ordered by how often each recurs.`,
      pt: `Um índice dos ${ayetItems.length} versículos e ${hadisItems.length} ditos sagrados citados ao longo da leitura do Futuhat e do Fusus no site, ordenados por quantas vezes cada um recorre.`,
    });

    const rows = all
      .map((item) => {
        if (item.tip === "ayet") return ayetKartiHtml(item.ref, item.list);
        return (
          `<article class="ayethadis-item">` +
          `<div class="ayethadis-item__head">` +
          `<span class="hadis-ref ayethadis-item__ref" data-hadis="${esc(item.ref)}" tabindex="0">${esc(
            tt({ tr: "Tekrarlayan bir kutsî hadis", en: "A recurring sacred saying", pt: "Um dito sagrado recorrente" })
          )}</span>` +
          `<span class="ayethadis-item__n">${item.list.length}</span>` +
          `</div>` +
          // Kartta hadisin kendisi yoktu, yalnız genel bir başlık (2026-10-08
          // taraması). Metin, sitede zaten alıntılanan biçimiyle dizinden gelir.
          (hadisMetin[item.ref] ? `<p class="ayethadis-item__meal">“${esc(tt(hadisMetin[item.ref]))}”</p>` : "") +
          `<div class="ayethadis-item__locs">${locHtml(item.list)}</div>` +
          gecisHtml("hadis", hamHadis[item.ref]) +
          `</article>`
        );
      })
      .join("");

    // Dizinde olmayan, yalnız ham metinde sayılan âyet ve hadisler: ayrı
    // bir bölümde, en çok geçenden başlayarak.
    const hamYalniz = Object.keys(hamAyet).filter((r) => !ayetDizin[r]).map((r) => ({ tip: "ayet", k: hamAyet[r] }))
      .concat(Object.keys(hamHadis).filter((h) => !hadisDizin[h]).map((h) => ({ tip: "hadis", k: hamHadis[h] })))
      .sort((a, b) => b.k.sayim.gecis - a.k.sayim.gecis);
    let hamBolum = "";
    if (hamYalniz.length) {
      const nA = hamYalniz.filter((x) => x.tip === "ayet").length;
      const nH = hamYalniz.length - nA;
      hamBolum =
        `<h2 class="ayethadis-bolum">${esc(tt({
          tr: "Fütûhât'ın metninde sayılanlar",
          en: "Counted in the text of the Futuhat",
          pt: "Contados no texto do Futuhat",
        }))}</h2>` +
        `<p class="ayethadis-intro">${esc(tt({
          tr: `Sitede henüz alıntılanmayan ${nA} âyet ve ${nH} hadisin Fütûhât'ta anıldığı yerler, Demirli çevirisinin taranmış metni üzerinde sayıldı.`,
          en: `Where ${nA} verses and ${nH} hadiths not yet quoted on the site are mentioned in the Futuhat, counted in the scanned text of Demirli's Turkish translation.`,
          pt: `Onde ${nA} versículos e ${nH} hadiths ainda não citados no site são mencionados no Futuhat, contados no texto digitalizado da tradução turca de Demirli.`,
        }))}</p>` +
        `<div class="ayethadis-list">${hamYalniz.map((x) => (x.tip === "ayet" ? ayetKartiHtml(x.k.anahtar, null) : hamHadisKartiHtml(x.k))).join("")}</div>`;
    }

    listEl.innerHTML = `<p class="ayethadis-intro">${intro}</p><div class="ayethadis-list">${rows}</div>${hamBolum}`;
    sonAcilan = null;
    gecisleriBagla();
  }

  return {
    activate() {
      fetchData().then((ok) => { if (ok) render(); });
    },
    onLangChange() {
      if (kuran) render();
    },
  };
})();
