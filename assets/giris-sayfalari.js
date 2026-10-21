/**
 * Hakkında'nın dört giriş sayfası (2026-10-18): Kapsam ("Neredeyiz"),
 * Kaynakça, Nasıl okunur, Sözlük.
 *
 * Yeni okuyucunun siteye girerken bulamadığı dört OLGU sayfası; yorum
 * taşımazlar. Veri, mevcut kayıtlardan scripts/giris-verisi-uret.py ile
 * türetilir (giris-kapsam / giris-kaynakca / giris-sozluk .json); "Nasıl
 * okunur" ETKILESIM_DILI.md ve GORSEL_DIL.md'nin özetidir.
 *
 * Tek modül, dört sekme: siirler.js sekme değişince activate(which) çağırır.
 * Kurallar (ETKILESIM_DILI.md): bağlanmamış düğme yok -- sayılar, künye
 * bölüm etiketleri ve sözlük girdileri gerçek <a href>; tıklama yalnız o
 * kaydın/bölümün panelini açar (window.__dostNav.goTo).
 */
window.__girisApp = (function () {
  "use strict";
  const I18n = window.DostI18n;
  const GU = window.DostGraphUtils;
  const tt = I18n.pick3;

  const SAYFALAR = ["kapsam", "kaynakca", "nasil-okunur", "sozluk"];
  const DOSYA = {
    kapsam: "data/ibn-arabi/giris-kapsam.json",
    kaynakca: "data/ibn-arabi/giris-kaynakca.json",
    sozluk: "data/ibn-arabi/giris-sozluk.json",
  };
  const veri = {};
  const bekleyen = {};
  const durum = { sozluk: { q: "", v: "hepsi" }, kaynakca: { q: "", t: "hepsi" } };
  let acik = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function lang() { return I18n.getLang(); }
  function loc() { const l = lang(); return l === "tr" ? "tr-TR" : l === "pt" ? "pt-BR" : "en-US"; }
  function sayi(n) { return Number(n).toLocaleString(loc()); }
  function yuzde(p) { return "%" .concat((p * 100).toLocaleString(loc(), { minimumFractionDigits: 1, maximumFractionDigits: 1 })); }
  function s(k) { return tt(S[k]); }

  // ── biçem ─────────────────────────────────────────────────────────────
  // Tembel yüklenen sayfaların biçemi burada: style.css ilk yükte iner ve
  // bütçesi dar (scripts/boyut-butcesi.json "ilk-yuk"); bu sekmeler yalnız
  // istenince açılır. Renkler sitenin kendi değişkenleri; yazı boyutları
  // ortak ölçeğe (--detail-font-scale, A−/A+) bağlı.
  const CSS = `
.gp-sayfa{--gp-terimler:#5f7391;--gp-esma:#b5654a;--gp-hal:#4f8a72;--gp-ontoloji:#8d6bb0;max-width:780px;margin:0 auto;padding:8px 0 56px}
body[data-theme="dark"] .gp-sayfa{--gp-terimler:#9aa9bd;--gp-esma:#d58a6f;--gp-hal:#7fb09a;--gp-ontoloji:#c3a8d8}
.gp-baslik{font-size:calc(1.5rem * var(--detail-font-scale,1));margin:0 0 8px;text-wrap:balance}
.gp-alt{font-size:calc(1.08rem * var(--detail-font-scale,1));margin:34px 0 10px}
.gp-giris{color:var(--text-secondary);line-height:1.65;margin:0 0 22px;max-width:62ch;font-size:calc(1rem * var(--detail-font-scale,1))}
.gp-not,.gp-aralik{color:var(--text-secondary);font-size:calc(.9rem * var(--detail-font-scale,1));line-height:1.6;margin:0 0 14px}
.gp-aralik{text-align:center}
.gp-notlar{margin:0;padding-left:1.15em;color:var(--text-secondary);font-size:calc(.9rem * var(--detail-font-scale,1));line-height:1.65}
.gp-notlar li{margin:0 0 8px}
.gp-halka-kap{max-width:360px;margin:6px auto 4px}
.gp-halka{display:block;width:100%;height:auto}
.gp-halka__daire{fill:var(--series-theme)}
.gp-halka__etiket{font:600 9px/1 inherit;fill:var(--text-muted)}
.gp-halka__buyuk{font:600 17px/1 inherit;fill:var(--text-primary)}
.gp-halka__kucuk{font:400 10px/1 inherit;fill:var(--text-muted)}
.gp-sarmal-kap{max-width:300px;margin:6px auto 4px}
.gp-sarmal{display:block;width:100%;height:auto;overflow:visible}
.gp-sarmal__bag{outline:none}
.gp-sarmal__nokta{fill:var(--series-ibnarabi);transition:transform .18s ease;transform-box:fill-box;transform-origin:center}
.gp-sarmal__bag:hover .gp-sarmal__nokta,.gp-sarmal__bag:focus-visible .gp-sarmal__nokta{transform:scale(1.5);stroke:var(--accent-interactive);stroke-width:2}
.gp-sarmal__bag:focus-visible .gp-sarmal__nokta{filter:drop-shadow(0 0 4px var(--odak-hale,rgba(237,161,0,.6))) drop-shadow(0 0 11px var(--odak-hale,rgba(237,161,0,.6)))}
.gp-sarmal__ad{font:600 11px/1 inherit;fill:var(--text-primary);opacity:0;transition:opacity .15s;pointer-events:none}
.gp-sarmal__bag:hover .gp-sarmal__ad,.gp-sarmal__bag:focus-visible .gp-sarmal__ad{opacity:1}
@media (prefers-reduced-motion:reduce){.gp-sarmal__nokta,.gp-sarmal__ad{transition:none}}
.gp-tablo-kap{overflow-x:auto;background:linear-gradient(to right,var(--surface-1) 30%,transparent) left/36px 100% no-repeat local,linear-gradient(to left,var(--surface-1) 30%,transparent) right/36px 100% no-repeat local,radial-gradient(farthest-side at 0 50%,rgba(0,0,0,.22),transparent) left/12px 100% no-repeat scroll,radial-gradient(farthest-side at 100% 50%,rgba(0,0,0,.22),transparent) right/12px 100% no-repeat scroll}
.gp-tablo{width:100%;border-collapse:collapse;font-size:calc(.86rem * var(--detail-font-scale,1))}
.gp-tablo th,.gp-tablo td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:left;vertical-align:top}
.gp-tablo thead th{color:var(--text-muted);font-weight:600;font-size:calc(.74rem * var(--detail-font-scale,1));letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}
.gp-tablo tbody th{font-weight:600}
.gp-tablo .gp-say{text-align:right;font-variant-numeric:tabular-nums}
.gp-sayim{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.gp-sayim__a{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border:1px solid var(--border);border-radius:12px;background:var(--surface-1);text-decoration:none;color:var(--text-primary)}
.gp-sayim__n{font-size:calc(1.35rem * var(--detail-font-scale,1));font-weight:600;font-variant-numeric:tabular-nums}
.gp-sayim__ad{font-size:calc(.82rem * var(--detail-font-scale,1));color:var(--text-secondary)}
.gp-link{color:var(--accent-interactive)}
.gp-link:focus-visible{outline:2px solid var(--accent-interactive);outline-offset:2px}
@media (hover:hover){.gp-sayim__a:hover,.gp-sz:hover{border-color:var(--accent-interactive);background:color-mix(in srgb,var(--accent-interactive) 7%,var(--surface-1))}}
.gp-arac{display:flex;align-items:center;gap:12px;margin:0 0 10px}
.gp-ara{flex:1 1 auto;min-width:0;font:inherit;font-size:calc(.95rem * var(--detail-font-scale,1));padding:9px 16px;border-radius:999px;border:1px solid var(--border);background:var(--surface-1);color:var(--text-primary)}
.gp-ara:focus-visible{outline:2px solid var(--accent-interactive);outline-offset:1px}
.gp-sonuc-say{flex:0 0 auto;color:var(--text-muted);font-size:calc(.8rem * var(--detail-font-scale,1));font-variant-numeric:tabular-nums}
.gp-hapler{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}
.gp-hap{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:5px 13px;border-radius:999px;border:1px solid var(--border);background:var(--surface-1);color:var(--text-secondary);font:inherit;font-size:calc(.84rem * var(--detail-font-scale,1));cursor:pointer}
.gp-hap--acik{border-color:var(--accent-interactive);color:var(--accent-interactive)}
.gp-hap:focus-visible,.gp-temizle:focus-visible,.gp-az__harf:focus-visible{outline:2px solid var(--accent-interactive);outline-offset:2px}
.gp-ks-liste,.gp-sz-liste{list-style:none;margin:0;padding:0}
.gp-ks{display:flex;flex-direction:column;gap:2px;padding:11px 0;border-bottom:1px solid var(--border)}
.gp-ks__yazar{font-weight:600;font-size:calc(.92rem * var(--detail-font-scale,1))}
.gp-ks__yil{font-weight:400;color:var(--text-muted)}
.gp-ks__baslik{font-size:calc(.9rem * var(--detail-font-scale,1));color:var(--text-primary);line-height:1.5}
.gp-ks__yayinci{font-size:calc(.8rem * var(--detail-font-scale,1));color:var(--text-muted)}
.gp-doi{font-size:calc(.78rem * var(--detail-font-scale,1));margin-left:6px}
.gp-ks__kullanim{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px;font-size:calc(.78rem * var(--detail-font-scale,1));color:var(--text-muted)}
.gp-rozet{display:inline-block;padding:3px 10px;min-height:24px;border:1px solid var(--border);border-radius:999px;text-decoration:none;color:var(--accent-interactive)}
.gp-bos{color:var(--text-secondary);margin:20px 0}
.gp-temizle{font:inherit;font-size:calc(.86rem * var(--detail-font-scale,1));margin-left:8px;padding:5px 12px;border-radius:999px;border:1px solid var(--border);background:var(--surface-1);color:var(--accent-interactive);cursor:pointer}
.gp-hareketler{list-style:none;margin:0 0 18px;padding:0;display:flex;flex-direction:column;gap:14px}
.gp-hareket{display:flex;gap:14px;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid var(--border)}
.gp-hareket__ikon{flex:0 0 38px;color:var(--series-theme)}
.gp-hareket__ad{display:block;font-size:calc(1rem * var(--detail-font-scale,1))}
.gp-hareket__ne{display:block;margin-top:2px;color:var(--text-secondary);font-size:calc(.9rem * var(--detail-font-scale,1));line-height:1.6}
.gp-lejant{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:calc(.84rem * var(--detail-font-scale,1));color:var(--text-secondary)}
.gp-nokta{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:var(--series-theme)}
.gp-nokta--mat{opacity:.3}
.gp-nokta--golge{background:var(--text-muted)}
.gp-ekler{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
.gp-ek{display:flex;flex-direction:column;gap:2px;font-size:calc(.9rem * var(--detail-font-scale,1));line-height:1.6;color:var(--text-secondary)}
.gp-ek b{color:var(--text-primary)}
.gp-az{display:flex;flex-wrap:wrap;gap:2px 4px;margin:0 0 6px}
.gp-az__harf{min-width:30px;min-height:30px;padding:0 4px;border:0;border-radius:8px;background:none;font:inherit;font-size:calc(.84rem * var(--detail-font-scale,1));font-weight:600;color:var(--accent-interactive);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.gp-az__harf--bos{color:var(--text-muted);opacity:.45;font-weight:400;cursor:default}
.gp-harf{font-size:calc(1.1rem * var(--detail-font-scale,1));margin:22px 0 4px;padding-bottom:4px;border-bottom:1px solid var(--border);color:var(--accent-interactive);scroll-margin-top:72px}
.gp-sz{display:flex;gap:12px;align-items:flex-start;padding:9px 8px;border-radius:10px;text-decoration:none;color:var(--text-primary);border:1px solid transparent}
.gp-sz__nokta{flex:0 0 11px;width:11px;height:11px;border-radius:50%;margin-top:6px;display:inline-block;background:var(--gp-terimler)}
.gp-sz__nokta--terimler{background:var(--gp-terimler)}.gp-sz__nokta--esma{background:var(--gp-esma)}.gp-sz__nokta--hal{background:var(--gp-hal)}.gp-sz__nokta--ontoloji{background:var(--gp-ontoloji)}
.gp-hap .gp-sz__nokta{margin-top:0;flex-basis:9px;width:9px;height:9px}
.gp-sz__govde{display:flex;flex-direction:column;gap:1px;min-width:0}
.gp-sz__ust{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 10px}
.gp-sz__ad{font-size:calc(.96rem * var(--detail-font-scale,1))}
.gp-sz__ar{font-size:calc(1rem * var(--detail-font-scale,1));color:var(--text-muted)}
.gp-sz__kisa{font-size:calc(.84rem * var(--detail-font-scale,1));color:var(--text-secondary);line-height:1.5}
.gp-sz__tur{color:var(--text-muted)}
@media (max-width:560px){.gp-sayim{grid-template-columns:repeat(2,1fr)}.gp-arac{flex-wrap:wrap}.gp-sonuc-say{order:3}}
`;
  (function stilEkle() {
    if (document.getElementById("giris-sayfalari-stil")) return;
    const st = document.createElement("style");
    st.id = "giris-sayfalari-stil";
    st.textContent = CSS;
    document.head.appendChild(st);
  })();

  // ── metinler ──────────────────────────────────────────────────────────
  const S = {
    kapsamBaslik: { tr: "Neredeyiz", en: "Where we are", pt: "Onde estamos" },
    kapsamGiris: {
      tr: "Fütûhât'ın 18 cildi bir halkada. Her daire bir cilt; dairenin büyüklüğü ve parlaklığı, o ciltte sitedeki Türkçe metnin kaynak metne oranını gösterir.",
      en: "The 18 volumes of the Futuhat on one ring. Each circle is a volume; its size and brightness show the ratio of the site's Turkish text to the source text in that volume.",
      pt: "Os 18 volumes do Futuhat em um anel. Cada círculo é um volume; seu tamanho e brilho mostram a razão entre o texto turco do site e o texto-fonte daquele volume.",
    },
    halkaAd: { tr: "Fütûhât'ın 18 cildinde özetin kaynak metne oranı", en: "Ratio of summary to source text across the 18 volumes of the Futuhat", pt: "Razão entre resumo e texto-fonte nos 18 volumes do Futuhat" },
    sarmalBaslik: { tr: "Füsûs: yirmi yedi fass", en: "The Fusus: twenty-seven chapters", pt: "O Fusus: vinte e sete capítulos" },
    sarmalGiris: {
      tr: "Kitabın yirmi yedi fassı kendi sırasıyla bir sarmalda. Her düğüm bir fass; yakın olan öndedir, uzak olan solgun. Bir düğüme gelince sıra numarası görünür, açınca o fass okunur.",
      en: "The book's twenty-seven chapters, in the book's own order, on a spiral. Each node is a chapter; the nearer is in front, the farther is faded. Hovering a node shows its number; opening it reads that chapter.",
      pt: "Os vinte e sete capítulos do livro, na ordem do próprio livro, numa espiral. Cada nó é um capítulo; o mais próximo está à frente, o mais distante esmaecido. Ao passar sobre um nó vê-se o seu número; abri-lo leva à leitura do capítulo.",
    },
    sarmalAd: { tr: "Füsûs'un yirmi yedi fassı bir sarmalda", en: "The twenty-seven chapters of the Fusus on a spiral", pt: "Os vinte e sete capítulos do Fusus numa espiral" },
    sarmalFass: { tr: "fass", en: "chapter", pt: "capítulo" },
    merkezOkundu: { tr: "kısım okundu", en: "parts read", pt: "partes lidas" },
    merkezOrtalama: { tr: "ortalama oran", en: "average ratio", pt: "razão média" },
    ciltAralik: {
      tr: (a, b, x, y) => `Oran cilde göre ${a} (Cilt ${x}) ile ${b} (Cilt ${y}) arasında değişiyor.`,
      en: (a, b, x, y) => `The ratio ranges from ${a} (Volume ${x}) to ${b} (Volume ${y}).`,
      pt: (a, b, x, y) => `A razão varia de ${a} (Volume ${x}) a ${b} (Volume ${y}).`,
    },
    tabloCilt: { tr: "Cilt", en: "Volume", pt: "Volume" },
    tabloKisim: { tr: "Kısım", en: "Parts", pt: "Partes" },
    tabloOzet: { tr: "Sitedeki metin (karakter)", en: "Site text (characters)", pt: "Texto do site (caracteres)" },
    tabloHam: { tr: "Kaynak metin (karakter)", en: "Source text (characters)", pt: "Texto-fonte (caracteres)" },
    tabloOran: { tr: "Oran", en: "Ratio", pt: "Razão" },
    eserBaslik: { tr: "Okuma durumu", en: "Reading status", pt: "Estado da leitura" },
    eserEser: { tr: "Eser", en: "Work", pt: "Obra" },
    eserOkunan: { tr: "Okunan", en: "Read", pt: "Lido" },
    eserOlcum: { tr: "Oran ölçümü", en: "Ratio measured", pt: "Razão medida" },
    eserFutuhat: { tr: "Fütûhât-ı Mekkiyye", en: "Meccan Openings (Futuhat)", pt: "Aberturas de Meca (Futuhat)" },
    eserFusus: { tr: "Füsûsu'l-Hikem", en: "Fusus al-Hikam", pt: "Fusus al-Hikam" },
    eserMiskat: { tr: "Mişkâtü'l-Envâr", en: "Mishkat al-Anwar", pt: "Mishkat al-Anwar" },
    birimKisim: { tr: "kısım", en: "parts", pt: "partes" },
    birimFass: { tr: "fass", en: "chapters", pt: "capítulos" },
    birimHadis: { tr: "hadis", en: "hadiths", pt: "hadiths" },
    olcumVar: { tr: "18 cilt", en: "18 volumes", pt: "18 volumes" },
    olcumYok: { tr: "yok", en: "none", pt: "nenhuma" },
    sayimBaslik: { tr: "Sitedeki kayıtlar", en: "Records on the site", pt: "Registros no site" },
    sayimNot: { tr: "Her sayı, o kayıtların bölümünü açar.", en: "Each number opens the section of those records.", pt: "Cada número abre a seção desses registros." },
    notBaslik: { tr: "Nasıl ölçüldü", en: "How it was measured", pt: "Como foi medido" },
    notOkundu: {
      tr: "“Okundu”: kısmın, fassın ya da hadisin sitede kendi sayfası var.",
      en: "“Read”: the part, chapter or hadith has its own page on the site.",
      pt: "“Lido”: a parte, o capítulo ou o hadith tem página própria no site.",
    },
    notOran: {
      tr: "Oran: o ciltteki Fütûhât kısımlarının sitedeki Türkçe düzyazısının karakter sayısı bölü Ekrem Demirli çevirisinin o cildinin taranmış (OCR) metninin karakter sayısı. Alıntılar sayıya dahildir; taranmış metindeki sayfa üst bilgileri, dipnotlar ve tarama hataları paydadadır.",
      en: "Ratio: the character count of the site's Turkish prose for the Futuhat parts in that volume, divided by the character count of the scanned (OCR) text of the same volume of Ekrem Demirli's translation. Quotations are included in the count; page headers, footnotes and scanning errors in the scanned text are in the denominator.",
      pt: "Razão: o número de caracteres da prosa turca do site para as partes do Futuhat naquele volume, dividido pelo número de caracteres do texto digitalizado (OCR) do mesmo volume da tradução de Ekrem Demirli. As citações entram na contagem; cabeçalhos de página, notas de rodapé e erros de digitalização do texto digitalizado estão no denominador.",
    },
    notYayin: {
      tr: "Taranmış metin, satılan bir çevirinin tam metni olduğu için yayımlanmaz; siteye yalnız bu oran gider.",
      en: "The scanned text is the full text of a translation on sale, so it is not published; only this ratio goes to the site.",
      pt: "O texto digitalizado é o texto completo de uma tradução à venda, por isso não é publicado; apenas esta razão vai para o site.",
    },
    notFusus: {
      tr: "Füsûs ve Mişkât için oran ölçülmedi.",
      en: "No ratio was measured for the Fusus and the Mishkat.",
      pt: "Nenhuma razão foi medida para o Fusus e o Mishkat.",
    },
    sayimAdlari: {
      kisim: { tr: "Fütûhât kısmı", en: "Futuhat parts", pt: "Partes do Futuhat" },
      fass: { tr: "Füsûs fassı", en: "Fusus chapters", pt: "Capítulos do Fusus" },
      hadis: { tr: "Mişkât hadisi", en: "Mishkat hadiths", pt: "Hadiths do Mishkat" },
      kavram: { tr: "Kavram sayfası", en: "Concept pages", pt: "Páginas de conceitos" },
      terim: { tr: "Terim", en: "Terms", pt: "Termos" },
      esma: { tr: "Esmâ kaydı", en: "Names entries", pt: "Registros de Nomes" },
      hal: { tr: "Hâl", en: "States", pt: "Estados" },
      ontoloji: { tr: "Ontoloji düğümü", en: "Ontology nodes", pt: "Nós da ontologia" },
      sir: { tr: "Sır", en: "Mysteries", pt: "Mistérios" },
      soru: { tr: "Soru", en: "Questions", pt: "Perguntas" },
      eser: { tr: "Eser", en: "Works", pt: "Obras" },
      durak: { tr: "Seyahat durağı", en: "Travel stops", pt: "Paradas de viagem" },
      menzil: { tr: "Menzil", en: "Stations", pt: "Estações" },
      siir: { tr: "Şiir", en: "Poems", pt: "Poemas" },
      kisi: { tr: "Eleştiri kişisi", en: "People in the criticism map", pt: "Pessoas no mapa de críticas" },
    },

    kaynakcaBaslik: { tr: "Kaynakça", en: "Bibliography", pt: "Bibliografia" },
    kaynakcaGiris: {
      tr: "Sitede adı geçen ve okumada kullanılan kaynakların künyeleri. Bir künyenin altında bölüm adı varsa, o bölümün kaydı bu künyeye kimlikle başvurur.",
      en: "Bibliographic details of the sources named on the site and used in the readings. If a section name appears under an entry, that section's records refer to the entry by identifier.",
      pt: "Dados bibliográficos das fontes citadas no site e usadas nas leituras. Se um nome de seção aparece sob uma entrada, os registros dessa seção remetem à entrada por identificador.",
    },
    ara: { tr: "Yazar ya da başlık ara", en: "Search author or title", pt: "Buscar autor ou título" },
    hepsi: { tr: "Hepsi", en: "All", pt: "Todos" },
    turler: {
      c: { tr: "Çeviri ve basım", en: "Translations and editions", pt: "Traduções e edições" },
      i: { tr: "İnceleme", en: "Studies", pt: "Estudos" },
      m: { tr: "Makale ve bölüm", en: "Articles and chapters", pt: "Artigos e capítulos" },
    },
    kullanildigi: { tr: "Kayıtlarda anıldığı bölüm:", en: "Section whose records cite it:", pt: "Seção cujos registros a citam:" },
    sonucYok: { tr: "Eşleşen kayıt yok.", en: "No matching entries.", pt: "Nenhum registro correspondente." },
    temizle: { tr: "Süzgeci temizle", en: "Clear filter", pt: "Limpar filtro" },
    yilYok: { tr: "y.y.", en: "n.d.", pt: "s.d." },

    nasilBaslik: { tr: "Nasıl okunur", en: "How to read", pt: "Como ler" },
    nasilGiris: {
      tr: "Beş hareket, her görünümde aynı anlamda. Bir hareketi bir kez öğrenmek yeter.",
      en: "Five gestures, with the same meaning in every view. Learning a gesture once is enough.",
      pt: "Cinco gestos, com o mesmo sentido em todas as visões. Aprender um gesto uma vez basta.",
    },
    hareketler: [
      { k: "yaklasmak", ad: { tr: "Yaklaşmak", en: "Drawing near", pt: "Aproximar-se" },
        ne: { tr: "İki parmakla ya da Ctrl/⌘ + tekerlekle. Yalın tekerlek yakınlaştırmaz; sayfayı kaydırır.", en: "With two fingers, or Ctrl/⌘ + wheel. The plain wheel does not zoom; it scrolls the page.", pt: "Com dois dedos, ou Ctrl/⌘ + roda. A roda simples não aproxima; rola a página." } },
      { k: "cekilmek", ad: { tr: "Geri çekilmek", en: "Stepping back", pt: "Recuar" },
        ne: { tr: "Haritadaki ortala düğmesi bakışı başlangıçtaki hâline döndürür; seçili kip korunur. Geri çekilecek bir şey yoksa düğme görünmez.", en: "The recenter button on a map returns the view to where it began; the chosen mode is kept. When there is nothing to step back from, the button is not shown.", pt: "O botão de recentrar de um mapa devolve a visão ao ponto inicial; o modo escolhido é mantido. Quando não há o que recuar, o botão não aparece." } },
      { k: "adim", ad: { tr: "Bir adım geri", en: "One step back", pt: "Um passo atrás" },
        ne: { tr: "Esc ya da telefonda geri tuşu. Her seferinde yalnız bir adım: önce açık panel, sonra seçili öğe, sonra görünümün giriş hâli.", en: "Esc, or the back key on a phone. One step at a time: first the open panel, then the selected item, then the view's opening state.", pt: "Esc, ou a tecla voltar no telefone. Um passo de cada vez: primeiro o painel aberto, depois o item selecionado, depois o estado inicial da visão." } },
      { k: "degmek", ad: { tr: "Değinmek", en: "Touching lightly", pt: "Tocar de leve" },
        ne: { tr: "Üzerine gelmek ya da klavyeyle odaklanmak (Tab). Tıklamanın küçültülmüş bir önizlemesini gösterir.", en: "Hovering, or focusing with the keyboard (Tab). Shows a reduced preview of what a click would open.", pt: "Passar o cursor, ou focar com o teclado (Tab). Mostra uma prévia reduzida do que um clique abriria." } },
      { k: "secmek", ad: { tr: "Seçmek", en: "Choosing", pt: "Escolher" },
        ne: { tr: "Tıklamak, dokunmak ya da Enter. Yalnızca o öğenin paneli açılır; başka bir bölüme habersiz geçilmez.", en: "Click, tap or Enter. Only that item's panel opens; you are never moved to another section without notice.", pt: "Clicar, tocar ou Enter. Só o painel desse item abre; ninguém é levado a outra seção sem aviso." } },
    ],
    nasilIsik: { tr: "ışık = zuhûr", en: "light = manifestation", pt: "luz = manifestação" },
    nasilMatlik: { tr: "matlık = perdelenme", en: "dimness = veiling", pt: "opacidade = velamento" },
    nasilGolge: { tr: "gölge = gizlilik", en: "shadow = hiddenness", pt: "sombra = ocultamento" },
    nasilCizim: {
      tr: "Haritalardaki çizim dili sabittir: aynı görsel, her yerde aynı anlamı taşır.",
      en: "The drawing language of the maps is fixed: the same visual carries the same meaning everywhere.",
      pt: "A linguagem de desenho dos mapas é fixa: o mesmo visual tem o mesmo sentido em toda parte.",
    },
    nasilEkBaslik: { tr: "Ayrıca", en: "Also", pt: "Além disso" },
    nasilEk: [
      { ad: { tr: "Harita ya da liste", en: "Map or list", pt: "Mapa ou lista" },
        ne: { tr: "Telefonda haritalar Grafik · Liste · Tam ekran kipleriyle açılır; seçilen kip bütün haritalarda ortaktır.", en: "On a phone, maps open with Graph · List · Full screen modes; the chosen mode is shared by all maps.", pt: "No telefone, os mapas abrem com os modos Gráfico · Lista · Tela cheia; o modo escolhido é comum a todos os mapas." } },
      { ad: { tr: "Dil", en: "Language", pt: "Idioma" },
        ne: { tr: "Her sayfa Türkçe, İngilizce ve Portekizce okunur. İngilizce ve Portekizce metinler bizim aktarımımızdır.", en: "Every page can be read in Turkish, English and Portuguese. The English and Portuguese texts are our own rendering.", pt: "Cada página pode ser lida em turco, inglês e português. Os textos em inglês e português são nossa própria versão." } },
      { ad: { tr: "Yazı boyutu", en: "Text size", pt: "Tamanho do texto" },
        ne: { tr: "Okuma sayfalarındaki A− / A+ yazıyı küçültür ve büyütür; seçim bütün okuma sayfalarında ortaktır.", en: "A− / A+ on reading pages shrinks and enlarges the text; the choice is shared by all reading pages.", pt: "A− / A+ nas páginas de leitura diminui e aumenta o texto; a escolha vale para todas as páginas de leitura." } },
      { ad: { tr: "Çevrimdışı okuma", en: "Offline reading", pt: "Leitura offline" },
        ne: { tr: "Çekmecedeki “Çevrimdışı okuma” içeriği isteğe bağlı olarak cihaza indirir; dokunmadıkça hiçbir şey inmez.", en: "“Offline reading” in the drawer downloads the content to the device on request; nothing is downloaded unless you tap it.", pt: "“Leitura offline” na gaveta baixa o conteúdo para o dispositivo sob demanda; nada é baixado sem que você toque." } },
    ],

    sozlukBaslik: { tr: "Sözlük", en: "Glossary", pt: "Glossário" },
    sozlukGiris: {
      tr: "Terimler, Esmâ, Hâller ve Ontoloji kayıtları tek A–Z listede. Her girdinin açıklaması, kendi bölümündeki tek satırlık açıklamasıdır; girdiye dokunmak o kaydı açar.",
      en: "The records of Terms, Names, States and Ontology in one A–Z list. Each entry's description is its own one-line description in its section; tapping an entry opens that record.",
      pt: "Os registros de Termos, Nomes, Estados e Ontologia em uma única lista A–Z. A descrição de cada entrada é a sua descrição de uma linha na própria seção; tocar numa entrada abre esse registro.",
    },
    sozlukAra: { tr: "Girdi ara", en: "Search entries", pt: "Buscar entradas" },
    sozlukTur: {
      terimler: { tr: "Terim", en: "Term", pt: "Termo" },
      esma: { tr: "Esmâ", en: "Name", pt: "Nome" },
      hal: { tr: "Hâl", en: "State", pt: "Estado" },
      ontoloji: { tr: "Ontoloji", en: "Ontology", pt: "Ontologia" },
    },
    harfler: { tr: "Harfe git", en: "Jump to letter", pt: "Ir à letra" },
    bolumAdi: {
      "eser-agi": { tr: "Eser Ağı", en: "Works Network", pt: "Rede de Obras" },
      bilmiyoruz: { tr: "Bilmiyoruz", en: "We Don't Know", pt: "Não Sabemos" },
      sirlar: { tr: "Sırlar", en: "Mysteries", pt: "Mistérios" },
      terimler: { tr: "Terimler", en: "Terms", pt: "Termos" },
      ontoloji: { tr: "Ontoloji", en: "Ontology", pt: "Ontologia" },
      "seyahat-atlasi": { tr: "Seyahat Atlası", en: "Travel Atlas", pt: "Atlas de Viagens" },
      hocalar: { tr: "Hocalar", en: "Teachers", pt: "Mestres" },
      "okuma-yollari": { tr: "Okuma Yolları", en: "Reading Paths", pt: "Caminhos de Leitura" },
    },
  };

  // ── ortak ─────────────────────────────────────────────────────────────
  function el(which) { return document.getElementById(which + "-content"); }
  function panelId(which) { return which + "-panel"; }

  function yukle(which) {
    if (veri[which]) return Promise.resolve(veri[which]);
    if (bekleyen[which]) return bekleyen[which];
    if (window.DostViewStatus) window.DostViewStatus.showLoading(panelId(which));
    bekleyen[which] = GU.fetchJson(DOSYA[which]).then((d) => {
      veri[which] = d;
      if (window.DostViewStatus) window.DostViewStatus.hide(panelId(which));
      return d;
    }).catch((err) => {
      console.error("giriş sayfası verisi yüklenemedi / failed to load", which, err);
      bekleyen[which] = null;
      if (window.DostViewStatus) window.DostViewStatus.showError(panelId(which), () => activate(which));
      return null;
    });
    return bekleyen[which];
  }

  function href(view, id) {
    return window.__dostNav ? window.__dostNav.href(view, id) : "/" + view + "/";
  }
  function baglanti(view, id, icerik, sinif, ek) {
    return `<a class="${sinif || "gp-link"}" href="${esc(href(view, id))}" data-gp-view="${esc(view)}"${id ? ` data-gp-id="${esc(id)}"` : ""}${ek || ""}>${icerik}</a>`;
  }
  function baglantilariBagla(kap) {
    if (kap.dataset.gpBagli) return;
    kap.dataset.gpBagli = "1";
    kap.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-gp-view]");
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (window.__dostNav && window.__dostNav.goTo) window.__dostNav.goTo(a.dataset.gpView, a.dataset.gpId || undefined);
      else window.location.href = a.getAttribute("href");
    });
  }

  const ROMEN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];

  // ── Kapsam ────────────────────────────────────────────────────────────
  function halkaHtml(d) {
    const c = d.futuhat.cilt;
    const pays = c.map((x) => x.pay);
    const min = Math.min.apply(null, pays), max = Math.max.apply(null, pays);
    const R = 108, M = 150, n = c.length;
    let g = "";
    c.forEach((x, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const t = max > min ? (x.pay - min) / (max - min) : 1;
      const cx = M + R * Math.cos(a), cy = M + R * Math.sin(a);
      const lx = M + (R + 27) * Math.cos(a), ly = M + (R + 27) * Math.sin(a) + 3;
      g += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(6.8 + 9.2 * t).toFixed(1)}" class="gp-halka__daire" style="opacity:${(0.41 + 0.59 * t).toFixed(2)}"><title>${esc(s("tabloCilt"))} ${ROMEN[x.no]} · ${esc(yuzde(x.pay))}</title></circle>`;
      g += `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" class="gp-halka__etiket">${ROMEN[x.no]}</text>`;
    });
    const f = d.okuma.futuhat;
    return `<svg class="gp-halka" viewBox="0 0 300 300" role="img" aria-label="${esc(s("halkaAd"))}">
      ${g}
      <text x="150" y="146" text-anchor="middle" class="gp-halka__buyuk">${sayi(f.okunan)} / ${sayi(f.toplam)}</text>
      <text x="150" y="163" text-anchor="middle" class="gp-halka__kucuk">${esc(s("merkezOkundu"))}</text>
      <text x="150" y="180" text-anchor="middle" class="gp-halka__kucuk">${esc(s("merkezOrtalama"))} ${esc(yuzde(d.futuhat.ortalama))}</text>
    </svg>`;
  }

  // Tasarım önerisi 8 (2026-10-21, kullanıcı onayı): Füsûs'un fassları bir sarmalda.
  // Sarmal ilkesi (CLAUDE.md): halka yerine üç boyutlu sarmal. Derinlik atmosferik
  // puslanmayla (yakın = dolgun, uzak = soluk) kurulur; sahte 3B yok. Düğümler yalnız
  // sıra numarasını taşır; fass sırası kitabın kendi sırasıdır.
  function sarmalHtml(d) {
    const n = d.okuma.fusus.toplam, okunan = d.okuma.fusus.okunan;
    const dugumler = [];
    for (let i = 0; i < n; i++) {
      const t = (i / Math.max(1, n - 1)) * Math.PI * 4.2;
      const z = Math.cos(t);                       // 1 yakın … -1 uzak
      dugumler.push({
        i, z,
        x: 110 + 62 * Math.sin(t),
        y: 24 + i * (252 / Math.max(1, n - 1)),
        r: 4.4 + (z + 1) * 2.1,
        op: 0.34 + (z + 1) * 0.33,
      });
    }
    // Uzaktan yakına çiz: yakın düğüm üstte kalır.
    const g = dugumler.slice().sort((p, q) => p.z - q.z).map((p) => {
      const ad = `${p.i + 1}. ${s("sarmalFass")}`;
      const tutar = Math.min(Math.max(p.x, 24), 196);
      const yon = p.x > 110 ? "end" : "start";
      const lx = p.x + (p.x > 110 ? -(p.r + 6) : p.r + 6);
      return baglanti("fusus", "fs" + (p.i + 1),
        `<circle class="gp-sarmal__nokta" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" opacity="${(p.i < okunan ? p.op : p.op * 0.4).toFixed(2)}"/>`
        + `<text class="gp-sarmal__ad" x="${lx.toFixed(1)}" y="${(p.y + 4).toFixed(1)}" text-anchor="${yon}">${esc(ad)}</text>`
        + `<title>${esc(ad)}</title>`,
        "gp-sarmal__bag", ` aria-label="${esc(ad)}"`);
    }).join("");
    return `<svg class="gp-sarmal" viewBox="0 0 220 300" role="group" aria-label="${esc(s("sarmalAd"))}">${g}</svg>`;
  }

  const SAYIM_BOLUM = {
    kisim: ["futuhat"], fass: ["fusus"], hadis: ["miskat"], kavram: ["kavram"], terim: ["terimler"],
    esma: ["esma"], hal: ["hal"], ontoloji: ["ontoloji"], sir: ["sirlar"], soru: ["sorular"],
    eser: ["eser-agi"], durak: ["seyahat-atlasi"], menzil: ["menziller"], siir: ["hakkinda", "siirler"],
    kisi: ["elestiri-arkeolojisi"],
  };

  function renderKapsam(d) {
    const c = d.futuhat.cilt;
    const lo = d.futuhat.enDusuk, hi = d.futuhat.enYuksek;
    const satirlar = c.map((x) => `<tr><th scope="row">${ROMEN[x.no]}</th><td class="gp-say">${sayi(x.kisim)}</td><td class="gp-say">${sayi(x.ozet)}</td><td class="gp-say">${sayi(x.ham)}</td><td class="gp-say">${esc(yuzde(x.pay))}</td></tr>`).join("");
    const o = d.okuma;
    const eser = [
      [s("eserFutuhat"), o.futuhat, "birimKisim", true],
      [s("eserFusus"), o.fusus, "birimFass", false],
      [s("eserMiskat"), o.miskat, "birimHadis", false],
    ].map(([ad, r, birim, olcum]) => `<tr><th scope="row">${esc(ad)}</th><td>${sayi(r.okunan)} / ${sayi(r.toplam)} ${esc(s(birim))}</td><td>${esc(s(olcum ? "olcumVar" : "olcumYok"))}</td></tr>`).join("");
    const sayim = Object.keys(SAYIM_BOLUM).filter((k) => d.sayim[k] != null).map((k) => {
      const [v, id] = SAYIM_BOLUM[k];
      return `<li>${baglanti(v, id, `<span class="gp-sayim__n">${sayi(d.sayim[k])}</span><span class="gp-sayim__ad">${esc(tt(S.sayimAdlari[k]))}</span>`, "gp-link gp-sayim__a")}</li>`;
    }).join("");
    el("kapsam").innerHTML = `
      <div class="gp-sayfa">
        <h2 class="gp-baslik">${esc(s("kapsamBaslik"))}</h2>
        <p class="gp-giris">${esc(s("kapsamGiris"))}</p>
        <div class="gp-halka-kap">${halkaHtml(d)}</div>
        <p class="gp-aralik">${esc(S.ciltAralik[lang()](yuzde(lo.pay), yuzde(hi.pay), ROMEN[lo.no], ROMEN[hi.no]))}</p>
        <div class="gp-tablo-kap"><table class="gp-tablo">
          <thead><tr><th scope="col">${esc(s("tabloCilt"))}</th><th scope="col" class="gp-say">${esc(s("tabloKisim"))}</th><th scope="col" class="gp-say">${esc(s("tabloOzet"))}</th><th scope="col" class="gp-say">${esc(s("tabloHam"))}</th><th scope="col" class="gp-say">${esc(s("tabloOran"))}</th></tr></thead>
          <tbody>${satirlar}</tbody></table></div>
        <h3 class="gp-alt">${esc(s("sarmalBaslik"))}</h3>
        <p class="gp-not">${esc(s("sarmalGiris"))}</p>
        <div class="gp-sarmal-kap">${sarmalHtml(d)}</div>
        <h3 class="gp-alt">${esc(s("eserBaslik"))}</h3>
        <div class="gp-tablo-kap"><table class="gp-tablo gp-tablo--eser">
          <thead><tr><th scope="col">${esc(s("eserEser"))}</th><th scope="col">${esc(s("eserOkunan"))}</th><th scope="col">${esc(s("eserOlcum"))}</th></tr></thead>
          <tbody>${eser}</tbody></table></div>
        <h3 class="gp-alt">${esc(s("sayimBaslik"))}</h3>
        <p class="gp-not">${esc(s("sayimNot"))}</p>
        <ul class="gp-sayim">${sayim}</ul>
        <h3 class="gp-alt">${esc(s("notBaslik"))}</h3>
        <ul class="gp-notlar"><li>${esc(s("notOkundu"))}</li><li>${esc(s("notOran"))}</li><li>${esc(s("notYayin"))}</li><li>${esc(s("notFusus"))}</li></ul>
      </div>`;
    baglantilariBagla(el("kapsam"));
  }

  // ── Kaynakça ──────────────────────────────────────────────────────────
  function kaynakcaFiltre(d) {
    const q = durum.kaynakca.q.trim().toLocaleLowerCase(loc());
    return d.kaynaklar.filter((k) => {
      if (durum.kaynakca.t !== "hepsi" && k.tur !== durum.kaynakca.t) return false;
      if (!q) return true;
      return (k.yazar + " " + k.baslik).toLocaleLowerCase(loc()).indexOf(q) >= 0;
    });
  }

  function kaynakSatir(k) {
    const yil = k.yil ? ` <span class="gp-ks__yil">(${esc(k.yil)})</span>` : ` <span class="gp-ks__yil">(${esc(s("yilYok"))})</span>`;
    const doi = k.doi ? ` <a class="gp-doi" href="https://doi.org/${esc(encodeURI(k.doi))}" target="_blank" rel="noopener noreferrer">DOI</a>` : "";
    const bolumler = (k.kullanim || []).map((u) => {
      const ad = tt(S.bolumAdi[u.id || u.v] || { tr: u.v });
      return baglanti(u.v, u.id, esc(ad), "gp-link gp-rozet");
    }).join("");
    return `<li class="gp-ks">
      <span class="gp-ks__yazar">${esc(k.yazar)}${yil}</span>
      <span class="gp-ks__baslik">${esc(k.baslik)}</span>
      ${k.yayinci ? `<span class="gp-ks__yayinci">${esc(k.yayinci)}${doi}</span>` : (doi ? `<span class="gp-ks__yayinci">${doi}</span>` : "")}
      ${bolumler ? `<span class="gp-ks__kullanim"><span class="gp-ks__etiket">${esc(s("kullanildigi"))}</span> ${bolumler}</span>` : ""}
    </li>`;
  }

  function kaynakcaListe(d) {
    const sirali = kaynakcaFiltre(d).slice().sort((a, b) => a.yazar.localeCompare(b.yazar, loc()) || (a.yil || 0) - (b.yil || 0));
    const liste = el("kaynakca").querySelector(".gp-ks-liste");
    const bos = el("kaynakca").querySelector(".gp-bos");
    liste.innerHTML = sirali.map(kaynakSatir).join("");
    bos.hidden = sirali.length > 0;
    const say = el("kaynakca").querySelector(".gp-sonuc-say");
    if (say) say.textContent = sayi(sirali.length) + " / " + sayi(d.kaynaklar.length);
  }

  function renderKaynakca(d) {
    const sayilar = { hepsi: d.kaynaklar.length };
    d.kaynaklar.forEach((k) => { sayilar[k.tur] = (sayilar[k.tur] || 0) + 1; });
    const hap = (kod, ad) => `<button type="button" class="gp-hap${durum.kaynakca.t === kod ? " gp-hap--acik" : ""}" data-gp-tur="${kod}" aria-pressed="${durum.kaynakca.t === kod}">${esc(ad)} · ${sayi(sayilar[kod] || 0)}</button>`;
    el("kaynakca").innerHTML = `
      <div class="gp-sayfa">
        <h2 class="gp-baslik">${esc(s("kaynakcaBaslik"))}</h2>
        <p class="gp-giris">${esc(s("kaynakcaGiris"))}</p>
        <div class="gp-arac">
          <input type="search" class="gp-ara" value="${esc(durum.kaynakca.q)}" placeholder="${esc(s("ara"))}" aria-label="${esc(s("ara"))}">
          <span class="gp-sonuc-say" aria-live="polite"></span>
        </div>
        <div class="gp-hapler" role="group">${hap("hepsi", s("hepsi"))}${["c", "i", "m"].map((t) => hap(t, tt(S.turler[t]))).join("")}</div>
        <ul class="gp-ks-liste"></ul>
        <p class="gp-bos" hidden>${esc(s("sonucYok"))} <button type="button" class="gp-temizle">${esc(s("temizle"))}</button></p>
      </div>`;
    const kap = el("kaynakca");
    kap.querySelector(".gp-ara").addEventListener("input", (e) => { durum.kaynakca.q = e.target.value; kaynakcaListe(d); });
    kap.querySelectorAll(".gp-hap").forEach((b) => b.addEventListener("click", () => {
      durum.kaynakca.t = b.dataset.gpTur;
      kap.querySelectorAll(".gp-hap").forEach((x) => {
        const on = x === b;
        x.classList.toggle("gp-hap--acik", on);
        x.setAttribute("aria-pressed", String(on));
      });
      kaynakcaListe(d);
    }));
    kap.querySelector(".gp-temizle").addEventListener("click", () => {
      durum.kaynakca.q = ""; durum.kaynakca.t = "hepsi";
      renderKaynakca(d);
    });
    baglantilariBagla(kap);
    kaynakcaListe(d);
  }

  // ── Nasıl okunur ──────────────────────────────────────────────────────
  // Her hareketin kendi çizimi (GORSEL_DIL: ışık = altın, matlık = perdelenme).
  const IKON = {
    yaklasmak: '<circle cx="13" cy="19" r="5" fill="currentColor"/><circle cx="27" cy="19" r="5" fill="currentColor"/><circle cx="6" cy="19" r="3" fill="currentColor" opacity=".3"/><circle cx="34" cy="19" r="3" fill="currentColor" opacity=".3"/>',
    cekilmek: '<circle cx="19" cy="19" r="5" fill="currentColor"/><circle cx="29" cy="9" r="3.5" fill="currentColor" opacity=".45"/><circle cx="25" cy="13" r="2.5" fill="currentColor" opacity=".25"/>',
    adim: '<rect x="5" y="10" width="28" height="18" rx="9" fill="none" stroke="currentColor" stroke-width="1.6"/><text x="19" y="23" text-anchor="middle" font-size="9" font-weight="600" fill="currentColor" font-family="inherit">Esc</text>',
    degmek: '<circle cx="19" cy="19" r="5" fill="currentColor" opacity=".55"/><circle cx="19" cy="19" r="9" fill="currentColor" opacity=".16"/>',
    secmek: '<circle cx="19" cy="19" r="10" fill="currentColor"/><path d="M19 9a10 10 0 0 1 0 20z" fill="var(--surface-1)" opacity=".5"/>',
  };

  function renderNasil() {
    const hareket = S.hareketler.map((h) => `<li class="gp-hareket">
      <svg class="gp-hareket__ikon" width="38" height="38" viewBox="0 0 38 38" aria-hidden="true">${IKON[h.k]}</svg>
      <div><b class="gp-hareket__ad">${esc(tt(h.ad))}</b><span class="gp-hareket__ne">${esc(tt(h.ne))}</span></div></li>`).join("");
    const ek = S.nasilEk.map((h) => `<li class="gp-ek"><b>${esc(tt(h.ad))}</b><span>${esc(tt(h.ne))}</span></li>`).join("");
    el("nasil-okunur").innerHTML = `
      <div class="gp-sayfa">
        <h2 class="gp-baslik">${esc(s("nasilBaslik"))}</h2>
        <p class="gp-giris">${esc(s("nasilGiris"))}</p>
        <ol class="gp-hareketler">${hareket}</ol>
        <p class="gp-not">${esc(s("nasilCizim"))}</p>
        <div class="gp-lejant">
          <span><i class="gp-nokta gp-nokta--isik"></i>${esc(s("nasilIsik"))}</span>
          <span><i class="gp-nokta gp-nokta--mat"></i>${esc(s("nasilMatlik"))}</span>
          <span><i class="gp-nokta gp-nokta--golge"></i>${esc(s("nasilGolge"))}</span>
        </div>
        <h3 class="gp-alt">${esc(s("nasilEkBaslik"))}</h3>
        <ul class="gp-ekler">${ek}</ul>
      </div>`;
  }

  // ── Sözlük ────────────────────────────────────────────────────────────
  // Baş harf: Türkçe harfler (Ç Ğ İ Ö Ş Ü) ayrı kalır; düzeltme/uzatma
  // imleri (â î û ā ṣ ...) taban harfe iner.
  function basHarf(ad) {
    const n = String(ad).normalize("NFD").replace(/[̀-ͯ]/g, (m) => (/[̧̆̇̈]/.test(m) ? m : ""));
    const harf = (n.normalize("NFC").match(/[A-Za-zÇĞİÖŞÜçğıöşü]/) || ["#"])[0];
    return harf.toLocaleUpperCase(loc());
  }

  function sozlukHazirla(d) {
    const l = lang();
    const kol = new Intl.Collator(loc());
    return d.girdiler.map((g) => {
      const ad = g.ad[l] || g.ad.tr;
      return { g, ad, kisa: g.k[l] || g.k.tr, harf: basHarf(ad) };
    }).sort((a, b) => kol.compare(a.ad, b.ad));
  }

  function sozlukListe(d, hazir) {
    const q = durum.sozluk.q.trim().toLocaleLowerCase(loc());
    const suz = hazir.filter((x) => (durum.sozluk.v === "hepsi" || x.g.v === durum.sozluk.v)
      && (!q || (x.ad + " " + x.kisa + " " + (x.g.ar || "")).toLocaleLowerCase(loc()).indexOf(q) >= 0));
    let html = "", son = "";
    const var_ = new Set();
    suz.forEach((x) => {
      if (x.harf !== son) {
        if (son) html += "</ul>";
        html += `<h3 class="gp-harf" id="gp-harf-${esc(x.harf)}">${esc(x.harf)}</h3><ul class="gp-sz-liste">`;
        son = x.harf;
      }
      var_.add(x.harf);
      html += `<li>${baglanti(x.g.v, x.g.id,
        `<i class="gp-sz__nokta gp-sz__nokta--${esc(x.g.v)}" aria-hidden="true"></i><span class="gp-sz__govde"><span class="gp-sz__ust"><b class="gp-sz__ad">${esc(x.ad)}</b>${x.g.ar ? `<span class="gp-sz__ar" lang="ar" dir="rtl">${esc(x.g.ar)}</span>` : ""}</span><span class="gp-sz__kisa"><span class="gp-sz__tur">${esc(tt(S.sozlukTur[x.g.v]))}</span> · ${esc(x.kisa)}</span></span>`,
        "gp-link gp-sz")}</li>`;
    });
    if (son) html += "</ul>";
    const kap = el("sozluk");
    kap.querySelector(".gp-sz-icerik").innerHTML = html;
    kap.querySelector(".gp-bos").hidden = suz.length > 0;
    kap.querySelector(".gp-sonuc-say").textContent = sayi(suz.length) + " / " + sayi(hazir.length);
    // Harf şeridi: girdisi olan harf bir düğme (o harfe iner); olmayan sönük metin.
    const tum = Array.from(new Set(hazir.map((x) => x.harf)));
    kap.querySelector(".gp-az").innerHTML = tum.map((h) => (var_.has(h)
      ? `<button type="button" class="gp-az__harf" data-gp-harf="${esc(h)}">${esc(h)}</button>`
      : `<span class="gp-az__harf gp-az__harf--bos" aria-hidden="true">${esc(h)}</span>`)).join("");
  }

  function renderSozluk(d) {
    const hazir = sozlukHazirla(d);
    const sayilar = { hepsi: d.girdiler.length };
    d.girdiler.forEach((g) => { sayilar[g.v] = (sayilar[g.v] || 0) + 1; });
    const hap = (kod, ad) => `<button type="button" class="gp-hap${durum.sozluk.v === kod ? " gp-hap--acik" : ""}" data-gp-tur="${kod}" aria-pressed="${durum.sozluk.v === kod}">${kod !== "hepsi" ? `<i class="gp-sz__nokta gp-sz__nokta--${kod}" aria-hidden="true"></i>` : ""}${esc(ad)} · ${sayi(sayilar[kod] || 0)}</button>`;
    el("sozluk").innerHTML = `
      <div class="gp-sayfa">
        <h2 class="gp-baslik">${esc(s("sozlukBaslik"))}</h2>
        <p class="gp-giris">${esc(s("sozlukGiris"))}</p>
        <div class="gp-arac">
          <input type="search" class="gp-ara" value="${esc(durum.sozluk.q)}" placeholder="${esc(s("sozlukAra"))}" aria-label="${esc(s("sozlukAra"))}">
          <span class="gp-sonuc-say" aria-live="polite"></span>
        </div>
        <div class="gp-hapler" role="group">${hap("hepsi", s("hepsi"))}${["terimler", "esma", "hal", "ontoloji"].map((v) => hap(v, tt(S.sozlukTur[v]))).join("")}</div>
        <div class="gp-az" role="group" aria-label="${esc(s("harfler"))}"></div>
        <div class="gp-sz-icerik"></div>
        <p class="gp-bos" hidden>${esc(s("sonucYok"))} <button type="button" class="gp-temizle">${esc(s("temizle"))}</button></p>
      </div>`;
    const kap = el("sozluk");
    kap.querySelector(".gp-ara").addEventListener("input", (e) => { durum.sozluk.q = e.target.value; sozlukListe(d, hazir); });
    kap.querySelectorAll(".gp-hap").forEach((b) => b.addEventListener("click", () => {
      durum.sozluk.v = b.dataset.gpTur;
      kap.querySelectorAll(".gp-hap").forEach((x) => {
        const on = x === b;
        x.classList.toggle("gp-hap--acik", on);
        x.setAttribute("aria-pressed", String(on));
      });
      sozlukListe(d, hazir);
    }));
    kap.querySelector(".gp-temizle").addEventListener("click", () => {
      durum.sozluk.q = ""; durum.sozluk.v = "hepsi";
      renderSozluk(d);
    });
    kap.querySelector(".gp-az").addEventListener("click", (e) => {
      const b = e.target.closest("[data-gp-harf]");
      if (!b) return;
      const h = kap.querySelector("#gp-harf-" + (window.CSS && CSS.escape ? CSS.escape(b.dataset.gpHarf) : b.dataset.gpHarf));
      if (h) h.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
    baglantilariBagla(kap);
    sozlukListe(d, hazir);
  }

  // ── giriş noktaları ───────────────────────────────────────────────────
  function ciz(which) {
    if (which === "nasil-okunur") return renderNasil();
    const d = veri[which];
    if (!d) return;
    if (which === "kapsam") renderKapsam(d);
    else if (which === "kaynakca") renderKaynakca(d);
    else if (which === "sozluk") renderSozluk(d);
  }

  function activate(which) {
    if (SAYFALAR.indexOf(which) < 0) return;
    acik = which;
    if (which === "nasil-okunur") { ciz(which); return; }
    yukle(which).then((d) => { if (d && acik === which) ciz(which); });
  }

  function onLangChange() {
    SAYFALAR.forEach((w) => {
      if (w === "nasil-okunur" ? el(w) && el(w).firstChild : veri[w]) ciz(w);
    });
  }

  return { activate: activate, onLangChange: onLangChange };
})();
