(function () {
  "use strict";

  // Paylaşım kipi: sayfada (metin kutusunda değilken) "@share" yazınca ya da
  // bir kaydın "görsel kart" düğmesiyle açılır. Sitenin kendi metinlerinden
  // 9:16 (ya da 1:1) bir sahne/kart kurar. Sahne canlı oynar; kart (PNG)
  // ekran yakalamadan, doğrudan bir tuvale çizilerek üretilir (bkz.
  // kartCiz) -- telefonda da çalışsın diye. Video yalnız masaüstünde,
  // sekmenin getDisplayMedia ile yakalanmasıyla iner.
  //
  // KURAL (2026-07-28, kullanıcıyla birlikte konuldu): Karttaki HER cümle
  // sitede zaten o hâliyle yazılı olan bir cümledir. Kart için yeni "vurucu"
  // metin YAZILMAZ. Aşağıdaki bütün şablonlar yalnızca var olan veriyi seçip
  // diziyor; hiçbir yerde metin üretmiyor.
  //
  // KÜNYE (2026-10-09, @share değerlendirmesi): kart artık hiçbir zaman
  // çıplak değil. Her sahne verinin kendisinden kurulan bir künye (eser,
  // cilt/kısım/sayfa, Mişkât bölüm·haber...), bir SES etiketi (Alıntı /
  // Özet / Hadis...) ve kaydın kendi adresini taşır; üçü sahnede, PNG'de ve
  // kopyalanan metinde görünür. Künyesiz kart dışa aktarılamaz. Kendi
  // sesimizle yazılmış (yorum/değerlendirme) cümleler aday olamaz (bkz.
  // yorumVar) -- site yalnız okumaların özetidir (CLAUDE.md, en üst kural).
  const CODE = "@share";
  const GU = window.DostGraphUtils;
  const CILT_ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII"];
  function roman(n) {
    n = parseInt(n, 10);
    if (!n || n < 1) return String(n || "");
    const t = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let s = "";
    t.forEach(function (p) { while (n >= p[0]) { s += p[1]; n -= p[0]; } });
    return s;
  }

  const UI = {
    title: { tr: "Paylaşım sahnesi", en: "Share stage", pt: "Palco de partilha" },
    hint: {
      tr: "Bir kayıt ya da şablon seç. Kart künyesiyle (kaynak, ses, kaydın adresi) birlikte hazırlanır; sahne döngüde oynar.",
      en: "Pick a record or a template. The card is prepared with its reference (source, voice, the record's address); the stage loops.",
      pt: "Escolhe um registo ou um modelo. O cartão é preparado com a sua referência (fonte, voz, endereço do registo); o palco repete.",
    },
    shuffle: { tr: "Başkasını getir", en: "Bring another", pt: "Trazer outro" },
    open: { tr: "Sahneyi aç", en: "Open the stage", pt: "Abrir o palco" },
    close: { tr: "Kapat", en: "Close", pt: "Fechar" },
    guides: { tr: "Güvenli alan", en: "Safe area", pt: "Área segura" },
    rec: { tr: "⏺ Videoyu indir", en: "⏺ Download video", pt: "⏺ Descarregar vídeo" },
    recPick: {
      tr: "Açılan pencerede “Bu sekme”yi seç — gerisi kendiliğinden.",
      en: "In the dialog that opens, choose “This tab” — the rest is automatic.",
      pt: "Na janela que abrir, escolhe “Este separador” — o resto é automático.",
    },
    recYok: {
      tr: "Bu cihazda video indirme yok — kartı paylaşabilir ya da cihazın kendi ekran kaydıyla sahneyi çekebilirsin. Bilgisayarda burada bir “videoyu indir” düğmesi çıkar.",
      en: "Video download is not available on this device — share the card, or record the stage with your device's own screen recorder. On a computer a “download video” button appears here.",
      pt: "O descarregamento de vídeo não está disponível neste dispositivo — partilha o cartão ou grava o palco com o gravador de ecrã do aparelho. Num computador aparece aqui um botão “descarregar vídeo”.",
    },
    recWait: { tr: "Başlıyor…", en: "Starting…", pt: "A começar…" },
    recBusy: { tr: "Kaydediliyor", en: "Recording", pt: "A gravar" },
    recDone: { tr: "İndirildi", en: "Downloaded", pt: "Descarregado" },
    kopyala: { tr: "📋 Metni kopyala", en: "📋 Copy text", pt: "📋 Copiar texto" },
    kopyalandi: { tr: "Kopyalandı", en: "Copied", pt: "Copiado" },
    kopyalaFail: { tr: "Kopyalanamadı.", en: "Could not copy.", pt: "Não foi possível copiar." },
    recFail: {
      tr: "Kayıt başlamadı. Ekran paylaşımına izin verilmedi ya da tarayıcı desteklemiyor.",
      en: "Recording did not start. Screen sharing was denied, or the browser does not support it.",
      pt: "A gravação não começou. A partilha de ecrã foi negada ou o navegador não a suporta.",
    },
    loading: { tr: "Aranıyor…", en: "Searching…", pt: "A procurar…" },
    none: {
      tr: "Bu şablona uygun bir kayıt bulunamadı — başkasını dene.",
      en: "No record fits this template — try another.",
      pt: "Nenhum registo serve para este modelo — tenta outro.",
    },
    sablon: { tr: "Şablon", en: "Template", pt: "Modelo" },
    zemin: { tr: "Zemin", en: "Backdrop", pt: "Fundo" },
    isik: { tr: "Açık zemin", en: "Light backdrop", pt: "Fundo claro" },
    kare: { tr: "Kare (1:1)", en: "Square (1:1)", pt: "Quadrado (1:1)" },
    kart: { tr: "🖼 Kartı paylaş", en: "🖼 Share card", pt: "🖼 Partilhar cartão" },
    paket: { tr: "🗂 TR · EN · PT kartları", en: "🗂 TR · EN · PT cards", pt: "🗂 Cartões TR · EN · PT" },
    kartHazir: { tr: "Kart hazır", en: "Card ready", pt: "Cartão pronto" },
    kartWait: { tr: "Kart hazırlanıyor…", en: "Preparing the card…", pt: "A preparar o cartão…" },
    kartFail: { tr: "Kart üretilemedi.", en: "The card could not be produced.", pt: "Não foi possível produzir o cartão." },
    kunyeYok: {
      tr: "Bu kartın künyesi yok, dışa aktarılamaz. Listeden yeni bir aday aç.",
      en: "This card has no reference, so it cannot be exported. Open a new candidate from the list.",
      pt: "Este cartão não tem referência, por isso não pode ser exportado. Abre um novo candidato da lista.",
    },
    paketEksik: {
      tr: "Şu dilde kart kurulamadı (kayıt o dilde karta sığmıyor): ",
      en: "No card could be built in (the record does not fit a card in that language): ",
      pt: "Não foi possível montar o cartão em (o registo não cabe num cartão nessa língua): ",
    },
    dil: { tr: "Dil", en: "Language", pt: "Idioma" },
    gorunum: { tr: "Görünüm", en: "Appearance", pt: "Aspeto" },
    onizleme: { tr: "Önizleme", en: "Preview", pt: "Pré-visualização" },
    baglam: { tr: "Bu kayıt", en: "This record", pt: "Este registo" },
    baglamBirak: { tr: "Bütün kayıtlar", en: "All records", pt: "Todos os registos" },
    baglamYok: {
      tr: "Bu sayfa için hazır bir kart yok — bir şablon seç.",
      en: "No ready card for this page — pick a template.",
      pt: "Não há cartão pronto para esta página — escolhe um modelo.",
    },
    tpl: {
      soz: { tr: "Bir Cümle", en: "One Sentence", pt: "Uma Frase" },
      ikili: { tr: "İki Kutu", en: "Two Boxes", pt: "Duas Caixas" },
      soru:     { tr: "Bir Soru", en: "A Question",   pt: "Uma Pergunta" },
      hikaye:   { tr: "Hikâye",   en: "Story",        pt: "História" },
      ontoloji: { tr: "Ontoloji", en: "Ontology",     pt: "Ontologia" },
      esma:     { tr: "Esmâ",     en: "Divine Name",  pt: "Nome Divino" },
      gunun:    { tr: "Günün Sözü", en: "Word of the Day", pt: "Palavra do Dia" },
      fusus:    { tr: "Füsûs Halkası", en: "Fusus Ring", pt: "Anel dos Fusus" },
      miskat:   { tr: "Mişkât Sarmalı", en: "Mishkat Spiral", pt: "Espiral do Mishkat" },
      dizi:     { tr: "Dizi", en: "Series", pt: "Série" },
      siir:     { tr: "Şiir", en: "Poem", pt: "Poema" },
      ozelgun:  { tr: "Özel Gün", en: "Special Day", pt: "Dia Especial" },
    },
    // Panelde çipi olmayan, yalnız bir kaydın kendi düğmesinden açılan
    // şablon: Sırlar'daki tek bir kaydın alıntısı.
    tplGizli: {
      sir: { tr: "Sırlar", en: "Mysteries", pt: "Mistérios" },
    },
    filter:      { tr: "Filtre",             en: "Filter",               pt: "Filtro" },
    filterAll:   { tr: "Tümü",              en: "All",                  pt: "Tudo" },
    filterCilt:  { tr: "Bu cilt",           en: "This volume",          pt: "Este volume" },
    filterKisim: { tr: "Bu kısım",          en: "This part",            pt: "Esta parte" },
    openThis:    { tr: "Aç",               en: "Open",                 pt: "Abrir" },
    secThis:     { tr: "Önizlemede göster", en: "Show in preview",     pt: "Mostrar na pré-visualização" },
    favAdd:      { tr: "★",               en: "★",                    pt: "★" },
    favAddLbl:   { tr: "Favorilere ekle",  en: "Add to favourites",    pt: "Adicionar aos favoritos" },
    favRemove:   { tr: "✕",               en: "✕",                    pt: "✕" },
    favRemoveLbl:{ tr: "Favorilerden çıkar", en: "Remove from favourites", pt: "Remover dos favoritos" },
    favList:     { tr: "Favoriler",         en: "Favourites",           pt: "Favoritos" },
    favEmpty:    { tr: "Henüz favori yok.", en: "No favourites yet.",   pt: "Sem favoritos ainda." },
    histList:    { tr: "Son kullanılanlar", en: "Recent",               pt: "Recentes" },
    gunluk:      { tr: "Paylaşım günlüğü",  en: "Share log",            pt: "Registo de partilhas" },
    gunlukBos:   { tr: "Henüz paylaşım yok.", en: "Nothing shared yet.", pt: "Ainda nada partilhado." },
    gunlukDisa:  { tr: "Dışa aktar (JSON)", en: "Export (JSON)",        pt: "Exportar (JSON)" },
    gunlukSil:   { tr: "Günlüğü temizle",   en: "Clear log",            pt: "Limpar registo" },
    gunlukSilOnay: {
      tr: "Bu tarayıcıdaki paylaşım günlüğü silinsin mi?",
      en: "Clear the share log kept in this browser?",
      pt: "Limpar o registo de partilhas guardado neste navegador?",
    },
    eylem: {
      png:   { tr: "kart", en: "card", pt: "cartão" },
      paket: { tr: "üç dilli paket", en: "three-language set", pt: "conjunto em três línguas" },
      metin: { tr: "metin", en: "text", pt: "texto" },
      video: { tr: "video", en: "video", pt: "vídeo" },
    },
    ikiDilli:    { tr: "İki dilli kart", en: "Bilingual card", pt: "Cartão bilíngue" },
    ikinciDil:   { tr: "İkinci dil", en: "Second language", pt: "Segundo idioma" },
    // Füsûs Halkası'nın 27 düğümü "sparse" modda vurgulu+odak adını yazıyor
    // -- bazı paylaşımlarda hiç metin istenmiyor, yalnız halkanın kendisi
    // (kullanıcı isteği, 2026-08-16).
    metinsiz:    { tr: "Düğüm metni yok", en: "No node labels", pt: "Sem legendas dos nós" },
  };

  // Ses etiketi: karttaki metnin KİMİN sesi olduğunu söyler. Özet bizim
  // okumamızın özeti, Alıntı kaynağın kendi cümlesi, Hadis/Haber Mişkât'ın
  // rivayeti, Soru sitenin yayındaki Sorular bölümünün sorusu.
  const SES = {
    alinti: { tr: "Alıntı", en: "Quote", pt: "Citação" },
    ozet:   { tr: "Özet", en: "Summary", pt: "Resumo" },
    hadis:  { tr: "Hadis", en: "Hadith", pt: "Hadith" },
    haber:  { tr: "Haber", en: "Report", pt: "Relato" },
    soru:   { tr: "Soru", en: "Question", pt: "Pergunta" },
  };
  const SITE = "dostarabi.com";

  // Sahnenin dili sitenin genel diline BAĞLI DEĞİL (kullanıcı isteği,
  // 2026-07-30): yalnız bu panele özel bir seçim.
  const DIL_ANAHTAR = "dost-share-lang";
  const DIL_LANGS = (window.DostI18n && window.DostI18n.LANGS) || ["tr", "en", "pt"];
  const DIL_ETIKET = { tr: "TR", en: "EN", pt: "PT" };
  function siteLang() { return (window.DostI18n && window.DostI18n.getLang()) || "tr"; }
  let shareLangId = safeGet(DIL_ANAHTAR);
  if (!DIL_LANGS.includes(shareLangId)) shareLangId = siteLang();

  // Yumuşak çözüm (arayüz metinleri, künye): istenen dil yoksa en/tr'ye düşer.
  function tt(d, l) {
    l = l || shareLangId;
    if (!d) return "";
    if (typeof d === "string") return d;
    return d[l] || d.en || d.tr || "";
  }
  // Katı çözüm (kartın GÖVDE metni): istenen dilde yoksa boş -- başka bir
  // dilin cümlesi o dilin kartına sessizce girmesin.
  function L(d, l) {
    if (!d) return "";
    if (typeof d === "string") return d;
    return d[l] || "";
  }

  // "İki dilli kart" (kullanıcı önerisi, 2026-08-03): kartın satırlarını iki
  // dilde üst üste göstermek. Aynı ref iki dilde ayrı ayrı çiziliyor (bkz.
  // sahneKur), yani ikinci satır her zaman AYNI kaydın aynı parçası.
  const IKIDILLI_ANAHTAR = "dost-share-ikidilli";
  const IKINCIDIL_ANAHTAR = "dost-share-ikincidil";
  let ikiDilliMod = safeGet(IKIDILLI_ANAHTAR) === "1";
  let ikinciDilId = safeGet(IKINCIDIL_ANAHTAR);
  if (!DIL_LANGS.includes(ikinciDilId)) ikinciDilId = DIL_LANGS.find((l) => l !== shareLangId) || DIL_LANGS[0];

  // --- veri ------------------------------------------------------------
  const partCache = new Map();
  // Hem çözülmüş veriyi HEM DE devam eden isteği ayrı önbelleklerde tutar:
  // refresh() aynı anda birkaç aday kurarken aynı JSON tek kez iner.
  const dataCache = {};
  const dataPromises = {};
  function cachedFetch(key, url) {
    if (Object.prototype.hasOwnProperty.call(dataCache, key)) return Promise.resolve(dataCache[key]);
    if (dataPromises[key]) return dataPromises[key];
    const p = GU.fetchJson(url).then((d) => { dataCache[key] = d; delete dataPromises[key]; return d; },
      (e) => { delete dataPromises[key]; throw e; });
    dataPromises[key] = p;
    return p;
  }

  function loadIndex() { return cachedFetch("futuhat-index", "data/ibn-arabi/futuhat-atlas-index.json"); }
  function loadPart(id) {
    if (partCache.has(id)) return Promise.resolve(partCache.get(id));
    return cachedFetch("futuhat-part:" + id, "data/ibn-arabi/futuhat-parts/" + id + ".json").then((d) => {
      partCache.set(id, d);
      return d;
    });
  }
  function loadSorular() { return cachedFetch("sorular", "data/ibn-arabi/sorular.json"); }
  function loadSirlar() { return cachedFetch("sirlar", "data/ibn-arabi/sirlar.json"); }
  function loadBilmiyoruz() { return cachedFetch("bilmiyoruz", "data/ibn-arabi/bilmiyoruz.json"); }
  function loadOntoloji() { return cachedFetch("ontoloji", "data/ibn-arabi/ontology.json"); }
  function loadEsma() { return cachedFetch("esma", "data/ibn-arabi/esma.json"); }
  function loadFususAtlas() { return cachedFetch("fusus-atlas", "data/ibn-arabi/fusus-atlas.json"); }
  function loadMiskatAtlas() { return cachedFetch("miskat-atlas", "data/ibn-arabi/miskat-atlas.json"); }
  function loadSiirler() { return cachedFetch("siirler", "data/ibn-arabi/siirler.json"); }
  // "Karşılaştır" şablonu ve "İki Kutu"nun eleştiri/Dost'un dediği çiftleri
  // 2026-10-09'da kaldırıldı: ikisi de metnin kurmadığı bir yan yana koyma
  // (kullanıcıya bırakılan karar; bkz. @share değerlendirmesi, öneri 7).

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffled(a) {
    const c = a.slice();
    for (let i = c.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return c;
  }

  // --- metin bütünlüğü -------------------------------------------------
  // Kaynak veride <em>/<strong>/<a> gibi etiketler var; kart düz metin taşır.
  function plainText(raw) {
    return String(raw || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }

  // Tırnak izleyici. Türkçede ' hem tırnak hem kesme işareti ("Ebû Bekir'i",
  // "416'da"): iki harf arasındaysa kesme sayılır, boşluk/başlangıçtan sonra
  // açan, harften sonra ve boşluk/noktalama/sondan önce kapayan tırnaktır.
  const HARF = /[\p{L}\p{N}]/u;
  function tirnakTuru(s, i) {
    const c = s[i];
    if (c === "“" || c === "«") return "ac";
    if (c === "”" || c === "»") return "kapa";
    if (c === "'" || c === "‘" || c === "’") {
      const prev = s[i - 1] || "", next = s[i + 1] || "";
      if (HARF.test(prev) && HARF.test(next)) return null;
      if (c === "‘") return "ac";
      if ((!prev || /[\s(\[—–\-“«:]/.test(prev)) && next && !/\s/.test(next)) return "ac";
      if (prev && !/\s/.test(prev) && (!next || /[\s.,;:!?)\]—–\-”»…]/.test(next))) return "kapa";
    }
    return null;
  }
  function tirnakIzle(s, onChar) {
    let derin = 0, cift = false, bozuk = false;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '"') cift = !cift;
      else {
        const tur = tirnakTuru(s, i);
        if (tur === "ac") derin++;
        else if (tur === "kapa") { if (derin > 0) derin--; else bozuk = true; }
      }
      if (onChar) onChar(i, derin === 0 && !cift);
    }
    return !bozuk && derin === 0 && !cift;
  }
  function tirnakDengeli(s) { return tirnakIzle(String(s || "")); }

  // Cümlelere bölme: tırnak içinde ASLA bölmez; kısaltmalarda (s., bkz.,
  // Hz., çev., Vol., pp. ...) ve tek harfli baş harflerde (R. A. Nicholson)
  // bölmez. Cümle sonu: . ! ? … (ve ardından gelen kapayan tırnak/parantez),
  // sonra boşluk ve büyük harf / rakam / açan tırnak.
  const KISALTMA = /(?:^|[\s(])(s|ss|bkz|krş|vb|vs|Hz|hz|çev|yay|haz|ed|no|No|Vol|vol|pp|p|trans|trad|cf|ö|h|m|yak|yakl|Dr|St|Sr|Mr|Ms|bk|vd|age|a\.g\.e|vol)\.$/;
  const BITIS = /[.!?…]/;
  const KAPAYAN = /[”»’'")\]]/;
  function cumleBol(raw) {
    const s = plainText(raw);
    const out = [];
    let bas = 0;
    const serbest = [];
    tirnakIzle(s, (i, dis) => { serbest[i] = dis; });
    for (let i = 0; i < s.length; i++) {
      if (!serbest[i]) continue;
      const c = s[i];
      let son = false;
      if (BITIS.test(c)) son = true;
      else if (KAPAYAN.test(c) && BITIS.test(s[i - 1] || "")) son = true;
      if (!son) continue;
      const next = s[i + 1];
      if (next !== undefined && !/\s/.test(next)) continue;
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (j < s.length && !/[\p{Lu}\p{N}“«'‘"(\[]/u.test(s[j])) continue;
      const parca = s.slice(bas, i + 1);
      if (c === "." && (KISALTMA.test(parca) || /(?:^|\s)\p{Lu}\.$/u.test(parca))) continue;
      const t = parca.trim();
      if (t) out.push(t);
      bas = i + 1;
    }
    const kalan = s.slice(bas).trim();
    if (kalan) out.push(kalan);
    return out;
  }

  // Bir metni karta sığacak uzunlukta, YALNIZ cümle sınırında keser; kesilen
  // yeri açıkça "[…]" ile işaretler. İlk cümle bile sığmıyorsa null (aday
  // düşer). Tırnak dengesi bozuksa yine null.
  function kesCumle(raw, max) {
    const t = plainText(raw);
    if (t.length <= max) return tirnakDengeli(t) ? t : null;
    let out = "";
    const cs = cumleBol(t);
    for (let i = 0; i < cs.length; i++) {
      const aday = out ? out + " " + cs[i] : cs[i];
      if (aday.length > max) break;
      out = aday;
    }
    if (!out || !tirnakDengeli(out)) return null;
    return out + " […]";
  }

  // Bağlamından kopmuş açılış: "416'da bu…", "Bu makam…", "Ardından…",
  // "…sadece" gibi -- kart tek başına okunur, öncesine yaslanan bir cümleyle
  // açılamaz. Küçük harfle başlayan parça da (alıntının ortası) düşer;
  // "el-Cemîl" gibi Arapça harf-i tarifle başlayan adlar hariç.
  const BAGLAMSIZ = /^(?:\d|…|\.\.\.|[-–—,;:]|(?:bu|bunu|bunun|bunda|bundan|buna|bunlar|bunları|bunların|burada|orada|böylece|ardından|sonra|ayrıca|aynı|o|şu|öte yandan|this|these|that|those|then|here|there|thus|also|it|isso|isto|este|esta|estes|estas|aqui|ali|depois|assim|também|ele|ela)(?![\p{L}'’]))/iu;
  function baglamsiz(raw) {
    const t = plainText(raw).replace(/^[\s“"'‘«(\[]+/, "");
    if (!t) return true;
    if (BAGLAMSIZ.test(t)) return true;
    if (/^\p{Ll}/u.test(t) && !/^(?:el|er|es|en|et|ed|ez|eş|ed|ebû|ibn|ibnü|al|ar|as|an|ad|az|ash|ad)-/iu.test(t)) return true;
    return false;
  }

  // Yalnız-özet süzgeci. Kendi sesimizle yazılmış bir değerlendirme/çıkarım
  // cümlesi aday olamaz. Duruş taraması (durus-kontrol.js) yüklüyse onun
  // "kural" düzeyindeki bulguları da düşürür; her durumda aşağıdaki asgari
  // kalıp listesi uygulanır. YALNIZ bizim sesimizdeki metne (özet, soru,
  // başlık) uygulanır -- kaynağın kendi cümlesine (alıntı/hadis) değil.
  const YORUM_KALIP = /\bbize\s+göre\b|\bbizce\b|\bbelki\b|gibi\s+görünüyor|\bçarpıcı|dikkat\s+çekici|\bokuyoruz\b|\bin\s+our\s+(?:view|reading)\b|\bperhaps\b|\bit\s+seems\b|\bseems\s+to\b|\bstriking\b|\bremarkabl|\bwe\s+read\b|\bna\s+nossa\s+(?:opinião|leitura)\b|\btalvez\b|\bparece\b|\bimpressionante\b|\bnotável\b|\blemos\b/iu;
  function yorumVar(raw) {
    const t = plainText(raw);
    if (!t) return false;
    if (YORUM_KALIP.test(t)) return true;
    const D = window.__dostDurus;
    if (D && typeof D.metinTara === "function") {
      try {
        const bulgular = D.metinTara(t) || [];
        if (bulgular.some((b) => b && b.kural && (b.kural.seviye === "kural" || /^s11|yalniz|ozet/i.test(String(b.kural.id || ""))))) return true;
      } catch (e) { /* tarama bozuksa asgari liste yeter */ }
    }
    return false;
  }

  // Kaynağın kendi cümlesi olan bir alıntı adayı mı? Tırnakla açılmalı
  // (<em> bazen yalnız bir terimi vurgular), bağlamsız açılmamalı, tırnakları
  // dengeli olmalı.
  function alintiAdayi(t, min, max) {
    return t.length >= min && t.length <= max && /^[“"'‘«]/.test(t) && !baglamsiz(t) && tirnakDengeli(t);
  }

  // Gövde: sığıyorsa olduğu gibi, sığmıyorsa cümle sınırında "[…]" ile.
  function govde(t, max) { return kesCumle(t, max); }

  // --- künye -----------------------------------------------------------
  function partKunye(p, l) {
    const c = CILT_ROMAN[p.cilt] || p.cilt, k = roman(p.kisim);
    const pr = String((typeof p.pageRange === "string" ? p.pageRange : L(p.pageRange, l)) || "").replace(/^\s*(?:s|ss|pp?)\.\s*/i, "");
    const d = {
      tr: "Fütûhât-ı Mekkiyye · Cilt " + c + ", Kısım " + k + (pr ? " · s. " + pr : ""),
      en: "al-Futuhat al-Makkiyya · Vol. " + c + ", Part " + k + (pr ? " · pp. " + pr : ""),
      pt: "al-Futuhat al-Makkiyya · Vol. " + c + ", Parte " + k + (pr ? " · pp. " + pr : ""),
    };
    return tt(d, l);
  }
  // Kaynak dizgeleri (esma/sırlar/sorular "source") Türkçe künye taşıyor;
  // EN/PT kartta Fütûhât cilt kalıbı yerelleştirilir, gerisi özgün adıyla
  // bırakılır (bir kitap adını çevirmek künyeyi değiştirmek olurdu).
  function kaynakYerel(s, l) {
    s = String(s || "").trim();
    if (!s || l === "tr") return s;
    const m = s.match(/^Fütûhât-ı Mekkiyye,?\s*Cilt\s*([0-9IVXL]+)\s*(?:\(([^)]*?)\s*çev\.\))?/);
    if (m) {
      const c = /^\d+$/.test(m[1]) ? (CILT_ROMAN[parseInt(m[1], 10)] || m[1]) : m[1];
      const cev = m[2] ? (l === "pt" ? " (trad. turca de " + m[2] + ")" : " (Turkish trans. " + m[2] + ")") : "";
      return "al-Futuhat al-Makkiyya, Vol. " + c + cev;
    }
    return s;
  }
  function kunyeKat() {
    return Array.prototype.slice.call(arguments).filter(Boolean).join(" · ");
  }
  const BOLUM = {
    sorular: { tr: "Sorular bölümü", en: "Questions section", pt: "Secção Perguntas" },
    bilmiyoruz: { tr: "Bilmiyoruz bölümü", en: "We Don't Know section", pt: "Secção Não Sabemos" },
    sirlar: { tr: "Sırlar", en: "Mysteries", pt: "Mistérios" },
    ontoloji: { tr: "Ontoloji", en: "Ontology", pt: "Ontologia" },
    esma: { tr: "Esmâü'l-Hüsnâ", en: "The Beautiful Names", pt: "Os Belos Nomes" },
    sema: { tr: "Şema: " + SITE, en: "Diagram: " + SITE, pt: "Esquema: " + SITE },
    fusus: {
      tr: "Füsûsu'l-Hikem (A. Avni Konuk tercüme ve şerhi)",
      en: "Fusus al-Hikam (A. Avni Konuk, translation and commentary)",
      pt: "Fusus al-Hikam (A. Avni Konuk, tradução e comentário)",
    },
    miskat: { tr: "Mişkâtü'l-Envâr", en: "Mishkat al-Anwar", pt: "Mishkat al-Anwar" },
  };
  function ciltKunye(v, l) {
    // Bazı okuma notlarında "volume" bir cilt numarası değil, bir kaynak
    // kimliği ("izutsu-anahtar", "fukuk-konevi"): orada cilt iddia edilmez.
    if (!v || !/^\d+$/.test(String(v))) return "";
    const c = CILT_ROMAN[v] || v;
    return tt({ tr: "Fütûhât-ı Mekkiyye, Cilt " + c, en: "al-Futuhat al-Makkiyya, Vol. " + c, pt: "al-Futuhat al-Makkiyya, Vol. " + c }, l);
  }

  // --- kayıt referansı (ref) → sahne ------------------------------------
  // Bir aday iki adımda kuruluyor: (1) SEÇ: hangi kayıt, kaydın hangi
  // parçası -- düz, JSON'a yazılabilir bir nesne (ref); (2) ÇİZ: ref'i
  // VERİLEN dilde sahneye çevir. Üç dilli paket ve iki dilli kart aynı ref'i
  // birkaç dilde ayrı ayrı çiziyor: aynı kayıt, aynı parça, aynı künye.
  // Sahne: { tpl, ref, lang, lines:[{text,kind}], ses, kunye, url, ad }.
  function refKey(ref) {
    const o = {};
    Object.keys(ref || {}).sort().forEach((k) => { o[k] = ref[k]; });
    return JSON.stringify(o);
  }
  function sahne(ref, l, o) { return Object.assign({ tpl: ref.tpl, ref: ref, lang: l }, o); }
  // Sahnede o an açık olan kart.
  let scene = null;

  // Bir bloğun (Fütûhât kısmı, Füsûs fassı) <em> alıntıları, konumlarıyla:
  // {si, bi, k} -- kısım/bölüm, blok, o bloktaki kaçıncı <em>. Üç dilde
  // bloklardaki <em> sayısı eşit tutuluyor (futuhat.js D1 denetimi), bu
  // yüzden aynı konum öbür dilde aynı alıntıyı verir.
  function emleriTopla(owner, l) {
    const out = [];
    const tara = (html, si, bi) => {
      const re = /<em>([\s\S]*?)<\/em>/g;
      let m, k = 0;
      while ((m = re.exec(html))) { out.push({ si: si, bi: bi, k: k, t: plainText(m[1]) }); k++; }
    };
    if (owner.hero && owner.hero.summary) tara(L(owner.hero.summary, l), -1, -1);
    (owner.sections || []).forEach((s, si) => (s.blocks || []).forEach((b, bi) => {
      if (b.type === "p" && b.text) tara(L(b.text, l), si, bi);
    }));
    return out;
  }
  function emBul(owner, l, pos) {
    return emleriTopla(owner, l).find((e) => e.si === pos.si && e.bi === pos.bi && e.k === pos.k) || null;
  }
  function alintiKonumlari(owner, l, max) {
    return emleriTopla(owner, l).filter((e) => alintiAdayi(e.t, 40, max || 190));
  }
  function pairOf(d) {
    if (!d || !d.pair || !d.pair.left || !d.pair.right) return null;
    const side = (x) => (x && x.label) ? x.label : x;
    return { left: side(d.pair.left), right: side(d.pair.right), source: d.source || null };
  }
  function pairsFromPart(p) {
    const out = [];
    if (pairOf(p.mainDiagram)) out.push({ d: "main" });
    (p.sections || []).forEach((s, si) => (s.blocks || []).forEach((b, bi) => {
      if (b.type === "diagram" && pairOf(b)) out.push({ d: si + "." + bi });
    }));
    return out;
  }
  function pairAt(p, d) {
    if (d === "main") return pairOf(p.mainDiagram);
    const ab = String(d).split(".");
    const s = (p.sections || [])[parseInt(ab[0], 10)];
    return pairOf(s && (s.blocks || [])[parseInt(ab[1], 10)]);
  }

  // Şu an açık olan Fütûhât kısmı varsa onu tercih et; yoksa rastgele.
  function currentPartId() {
    const m = location.pathname.match(/\/futuhat\/(c\d+k\d+)/);
    return m ? m[1] : null;
  }
  function currentCilt() {
    const m = location.pathname.match(/\/futuhat\/c(\d+)k\d+/);
    return m ? parseInt(m[1]) : null;
  }

  function pickPart(kind, minCount) {
    minCount = minCount || 1;
    return loadIndex().then((idx) => {
      let all = idx.parts.filter((p) => p.status === "active");
      if (kaynakId.startsWith("cilt:")) {
        const c = parseInt(kaynakId.slice(5));
        const f = all.filter((p) => p.cilt === c);
        if (f.length) all = f;
      } else if (kaynakId.startsWith("kisim:")) {
        const id = kaynakId.slice(6);
        const f = all.filter((p) => p.id === id);
        if (f.length) all = f;
      }
      const cur = currentPartId();
      const order = cur && kaynakId === "all"
        ? [all.find((p) => p.id === cur)].filter(Boolean).concat(shuffled(all))
        : shuffled(all);
      // Uygun kayıt bulana kadar sırayla dene (en çok 25 kısım).
      let i = 0;
      function step() {
        if (i >= Math.min(order.length, 25)) return null;
        const meta = order[i++];
        return loadPart(meta.id).then((p) => {
          const items = kind === "pair" ? pairsFromPart(p) : alintiKonumlari(p, shareLangId);
          if (items.length < minCount) return step();
          return { part: p, items: items };
        });
      }
      return step();
    });
  }

  function sorularHavuzu(sd) {
    const out = [];
    (sd.categories || []).forEach((c) => (c.questions || []).forEach((q) => out.push(q)));
    return out;
  }
  function hikayeKaynak(src, id) {
    if (src === "soru") return loadSorular().then((sd) => {
      const q = sorularHavuzu(sd).find((x) => x.id === id);
      return q && { hook: q.question, body: q.answer, ses: "ozet", url: "/sorular/" + q.id,
        kunye: (l) => kunyeKat(SITE, tt(BOLUM.sorular, l), kaynakYerel(q.source, l)) };
    });
    if (src === "sir") return loadSirlar().then((d) => {
      const e = ((d && d.entries) || []).find((x) => x.id === id);
      return e && { hook: e.topic, body: e.quote, ses: "alinti", url: "/sirlar/" + e.id,
        kunye: (l) => kunyeKat(kaynakYerel(e.source, l) || ciltKunye(e.volume, l), tt(BOLUM.sirlar, l) + ": " + SITE) };
    });
    if (src === "bil") return loadBilmiyoruz().then((d) => {
      const m = ((d && d.maddeler) || []).find((x) => x.id === id);
      return m && { hook: m.baslik, body: m.aciklama, ses: "ozet", url: "/bilmiyoruz/" + m.id,
        kunye: (l) => kunyeKat(SITE, tt(BOLUM.bilmiyoruz, l)) };
    });
    return Promise.resolve(null);
  }
  function sirKunye(e, l) {
    return kunyeKat(kaynakYerel(e.source, l) || ciltKunye(e.volume, l), tt(BOLUM.sirlar, l) + ": " + SITE);
  }

  // ÇİZ: her şablon ref'i verilen dilde bir sahneye çevirir. null = bu
  // kayıt bu dilde karta kurulamıyor (metin yok, sığmıyor, süzgece takıldı).
  const RENDER = {
    soz: (ref, l) => loadPart(ref.part).then((p) => {
      const e = emBul(p, l, ref);
      const t = e && govde(e.t, 320);
      if (!t) return null;
      return sahne(ref, l, { lines: [{ text: t, kind: "soz" }], ses: "alinti", kunye: partKunye(p, l), url: "/futuhat/" + p.id, ad: L(p.title, l) });
    }),
    dizi: (ref, l) => loadPart(ref.part).then((p) => {
      const lines = [];
      for (const pos of ref.pos) {
        const e = emBul(p, l, pos);
        const t = e && govde(e.t, 220);
        if (!t) return null;
        lines.push({ text: t, kind: "soz" });
      }
      return sahne(ref, l, { lines: lines, ses: "alinti", kunye: partKunye(p, l), url: "/futuhat/" + p.id, ad: L(p.title, l) });
    }),
    // "İki Kutu": bir Fütûhât şemasının iki ucu. Şemayı biz çizdik, kutular
    // metnin kurduğu ilişkinin iki tarafı -- künye ikisini de söyler.
    ikili: (ref, l) => loadPart(ref.part).then((p) => {
      const pr = pairAt(p, ref.d);
      if (!pr) return null;
      const a = L(pr.left, l), b = L(pr.right, l);
      if (!a || !b || yorumVar(a) || yorumVar(b)) return null;
      const kaynak = pr.source ? L(pr.source, l) : partKunye(p, l);
      return sahne(ref, l, {
        lines: [{ text: a, kind: "sol" }, { text: b, kind: "sag" }],
        ses: "ozet", kunye: kunyeKat(tt(BOLUM.sema, l), kaynak), url: "/futuhat/" + p.id, ad: L(p.title, l),
      });
    }),
    soru: (ref, l) => loadSorular().then((sd) => {
      const q = sorularHavuzu(sd).find((x) => x.id === ref.id);
      const t = q && plainText(L(q.question, l));
      if (!t || yorumVar(t)) return null;
      return sahne(ref, l, { lines: [{ text: t, kind: "soru" }], ses: "soru", kunye: kunyeKat(SITE, tt(BOLUM.sorular, l)), url: "/sorular/" + q.id, ad: t });
    }),
    // "Hikâye": kanca (sitenin yayındaki soru/başlığı) + kaynağın kendi
    // gövdesinden ilk iki cümle. Kanca da süzgeçten geçer.
    hikaye: (ref, l) => hikayeKaynak(ref.src, ref.id).then((k) => {
      if (!k) return null;
      const hook = plainText(L(k.hook, l));
      if (!hook || yorumVar(hook) || hook.length > 160) return null;
      const cs = cumleBol(L(k.body, l));
      if (cs.length < 2 || cs[0].length > 220 || cs[1].length > 220 || baglamsiz(cs[0])) return null;
      if (!tirnakDengeli(cs[0]) || !tirnakDengeli(cs[1])) return null;
      if (k.ses === "ozet" && (yorumVar(cs[0]) || yorumVar(cs[1]))) return null;
      const ikinci = cs.length > 2 ? cs[1] + " […]" : cs[1];
      return sahne(ref, l, {
        lines: [{ text: hook, kind: "soru" }, { text: cs[0], kind: "soz" }, { text: ikinci, kind: "soz" }],
        ses: k.ses, kunye: k.kunye(l), url: k.url, ad: hook,
      });
    }),
    gunun: (ref, l) => RENDER.sir(ref, l),
    sir: (ref, l) => loadSirlar().then((d) => {
      const e = ((d && d.entries) || []).find((x) => x.id === ref.id);
      const t = e && govde(L(e.quote, l), 310);
      if (!t) return null;
      return sahne(ref, l, { lines: [{ text: t, kind: "soz" }], ses: "alinti", kunye: sirKunye(e, l), url: "/sirlar/" + e.id, ad: plainText(L(e.topic, l)) });
    }),
    ozelgun: (ref, l) => loadSirlar().then((d) => {
      const gun = OZEL_GUN[ref.gun];
      const e = ((d && d.entries) || []).find((x) => x.id === ref.id);
      const t = gun && e && govde(L(e.quote, l), 310);
      if (!t) return null;
      return sahne(ref, l, {
        lines: [{ text: tt(gun.ad, l), kind: "baslik" }, { text: t, kind: "soz" }],
        ses: "alinti", kunye: sirKunye(e, l), url: "/sirlar/" + e.id, ad: tt(gun.ad, l),
      });
    }),
    ontoloji: (ref, l) => loadOntoloji().then((d) => kavramSahnesi(ref, l, (d.nodes || []).find((n) => n.id === ref.id), "ontoloji")),
    esma: (ref, l) => loadEsma().then((d) => kavramSahnesi(ref, l, (d.nodes || []).find((n) => n.id === ref.id), "esma")),
    fusus: (ref, l) => loadFususAtlas().then((d) => {
      const all = d.fasses || [];
      const f = all.find((x) => x.id === ref.id);
      if (!f) return null;
      let t = null, ses = "alinti";
      if (ref.si != null) { const e = emBul(f, l, ref); t = e && govde(e.t, 300); }
      else {
        t = govde(L(f.hero && f.hero.summary, l), 300);
        ses = "ozet";
        if (t && (baglamsiz(t) || yorumVar(t))) t = null;
      }
      if (!t) return null;
      const idx = all.findIndex((x) => x.id === f.id);
      const nameOf = (x) => ({ tr: x.no + ". " + x.prophet.tr, en: x.no + ". " + x.prophet.en, pt: x.no + ". " + x.prophet.pt });
      return sahne(ref, l, {
        helix: { nodes: all.map((x) => ({ id: x.id, label: nameOf(x), accent: x.status === "active" })), initialFocus: idx < 0 ? 0 : idx },
        lines: [{ text: tt(nameOf(f), l) + (f.hikmet ? " · " + L(f.hikmet, l) : ""), kind: "baslik" }, { text: t, kind: "soz" }],
        ses: ses, kunye: kunyeKat(tt(BOLUM.fusus, l), L(f.pageRange, l)), url: "/fusus/" + f.id, ad: L(f.title, l),
      });
    }),
    // Mişkât kartı hadisin KENDİ metniyle açılır (CLAUDE.md: "her sayfa
    // hadisin kendi Türkçe metniyle açılır"); başlık yok, künye yeri söyler.
    miskat: (ref, l) => loadMiskatAtlas().then((d) => {
      const all = d.hadisler || [];
      const h = all.find((x) => x.id === ref.id);
      if (!h) return null;
      const blok = (h.blocks || []).find((b) => b.type === "hadis" && b.metin && L(b.metin, l));
      if (!blok) return null;
      const metin = L(blok.metin, l).replace(/\n\s*\n/g, " ");
      const t = govde(metin, 420) || govde(metin, 640);
      if (!t) return null;
      const idx = all.findIndex((x) => x.id === h.id);
      const nodeLabel = (x) => (x.etiket === "haber"
        ? { tr: x.no + ". Haber", en: "Report " + x.no, pt: "Relato " + x.no }
        : { tr: x.no + ". Hadis", en: "Hadith " + x.no, pt: "Hadith " + x.no });
      return sahne(ref, l, {
        helix: { nodes: all.map((x) => ({ id: x.id, label: nodeLabel(x), accent: x.status === "active" })), initialFocus: idx < 0 ? 0 : idx },
        lines: [{ text: t, kind: "soz" }],
        ses: h.etiket === "haber" ? "haber" : "hadis",
        kunye: kunyeKat(tt(BOLUM.miskat, l), L(h.pageRange, l)), url: "/miskat/" + h.id, ad: L(h.title, l),
      });
    }),
    // "Şiir": siirler.json'un dizeleri satır satır üç dilde aynı sırada
    // çevrildiği için pencere (start..start+5) her dilde aynı dizeleri verir.
    siir: (ref, l) => loadSiirler().then((d) => {
      const poem = ((d && d.siirler) || []).find((x) => x.id === ref.id);
      if (!poem) return null;
      const satirlar = String(L(poem.metin, l)).split("\n").map((x) => x.trim()).filter(Boolean);
      const parca = satirlar.slice(ref.start, ref.start + ref.count);
      if (parca.length < 2) return null;
      const kaynak = ((d.kaynaklar) || []).find((k) => k.id === poem.kaynak_id);
      const bilgi = plainText(L(poem.kaynak_bilgisi, l)).replace(/^—\s*/, "");
      const kunye = bilgi && bilgi.length <= 200 ? bilgi : kunyeKat(kaynak ? tt(kaynak.isim, l) : "", L(poem.kaynak_ref, l));
      const lines = parca.map((x) => ({ text: x, kind: "soz" }));
      // Pencere şiirin ortasından açılıyor ya da sonundan önce bitiyorsa
      // kesik açıkça işaretlenir.
      if (ref.start > 0) lines[0].text = "[…] " + lines[0].text;
      if (ref.start + ref.count < satirlar.length) lines[lines.length - 1].text += " […]";
      return sahne(ref, l, { lines: lines, ses: "alinti", kunye: kunye, url: "/hakkinda/siirler", ad: L(poem.kaynak_ref, l) });
    }),
  };

  // Esmâ / Ontoloji: kavramın adı + özeti ya da bir okuma notu (insight).
  // ins: -1 = özet (summary), 0.. = insights[ins]. Hepsi bizim okumamızın
  // ÖZETİ -- ses "Özet"; içindeki alıntılar tırnakla kalır.
  function kavramSahnesi(ref, l, node, view) {
    if (!node) return null;
    let dict = null, cilt = null;
    if (ref.ins === -1) dict = node.summary;
    else {
      const ins = (node.insights || [])[ref.ins];
      if (!ins) return null;
      dict = typeof ins === "string" ? { tr: ins } : ins.text;
      cilt = ins && ins.volume;
    }
    const t = govde(L(dict, l), 310);
    if (!t || t.length < 30 || baglamsiz(t) || yorumVar(t)) return null;
    const ad = L(node.name, l);
    if (!ad) return null;
    // Not kendi kaynağını cilt numarasıyla veriyorsa o; özet (ins -1) ise
    // kaydın ilk kaynağı; başka bir kaynak kimliği taşıyorsa (Izutsu,
    // Konevî...) hiçbir eser adı uydurulmaz -- künye bölümü ve adresi söyler.
    const kaynak = ref.ins === -1 ? kaynakYerel((node.sources || [])[0], l) : ciltKunye(cilt, l);
    return sahne(ref, l, {
      lines: [{ text: ad, kind: "baslik" }, { text: t, kind: "soz" }],
      ses: "ozet", kunye: kunyeKat(tt(BOLUM[view], l) + ": " + ad, kaynak || SITE), url: "/" + view + "/" + node.id, ad: ad,
    });
  }

  // SEÇ (rastgele): şablon başına bir ref üretir. { ref, havuz } döner.
  const SEC = {
    soz: () => pickPart("em").then((r) => r && { ref: Object.assign({ tpl: "soz", part: r.part.id }, konum(pick(r.items))) }),
    dizi: () => pickPart("em", 3).then((r) => {
      if (!r) return null;
      const pos = shuffled(r.items).slice(0, Math.min(4, r.items.length)).sort((a, b) => (a.si - b.si) || (a.bi - b.bi) || (a.k - b.k)).map(konum);
      return { ref: { tpl: "dizi", part: r.part.id, pos: pos } };
    }),
    ikili: () => pickPart("pair").then((r) => r && { ref: { tpl: "ikili", part: r.part.id, d: pick(r.items).d } }),
    soru: () => loadSorular().then((sd) => {
      const pool = sorularHavuzu(sd);
      return pool.length ? { ref: { tpl: "soru", id: pick(pool).id }, havuz: pool.length } : null;
    }),
    hikaye: () => Promise.all([loadSorular(), loadSirlar(), loadBilmiyoruz()]).then(([sd, srd, bd]) => {
      const pool = [];
      sorularHavuzu(sd).forEach((q) => pool.push({ src: "soru", id: q.id }));
      ((srd && srd.entries) || []).forEach((e) => pool.push({ src: "sir", id: e.id }));
      ((bd && bd.maddeler) || []).forEach((m) => pool.push({ src: "bil", id: m.id }));
      return pool.length ? { ref: Object.assign({ tpl: "hikaye" }, pick(pool)), havuz: pool.length } : null;
    }),
    // "Bugünün parçası" (welcome.js) ile AYNI gün-endeksi formülü: gün
    // boyunca herkese aynı kayıt.
    gunun: () => loadSirlar().then((d) => {
      const entries = (d && d.entries) || [];
      if (!entries.length) return null;
      const dayIndex = Math.floor(Date.now() / 86400000);
      return { ref: { tpl: "gunun", id: entries[dayIndex % entries.length].id } };
    }),
    // "Özel Gün": yalnız sitede o güne dair GERÇEKTEN bir kayıt bulunan iki
    // gün (bkz. OZEL_GUN). Tarih tarayıcının "islamic-umalqura" takviminden
    // (tablosal hesap) -- kesin bir dinî tarih iddiası değil.
    ozelgun: () => {
      const key = hicriBugun();
      const gun = key && OZEL_GUN[key];
      if (!gun) return Promise.resolve(null);
      return Promise.resolve({ ref: { tpl: "ozelgun", gun: key, id: pick(gun.entryIds) } });
    },
    ontoloji: () => loadOntoloji().then((d) => {
      const nodes = (d.nodes || []).filter((n) => n.insights && n.insights.length);
      if (!nodes.length) return null;
      const n = pick(nodes);
      return { ref: { tpl: "ontoloji", id: n.id, ins: Math.floor(Math.random() * n.insights.length) }, havuz: nodes.length };
    }),
    esma: () => loadEsma().then((d) => {
      const nodes = (d.nodes || []).filter((n) => (n.insights && n.insights.length) || n.summary);
      if (!nodes.length) return null;
      const n = pick(nodes);
      const ins = n.insights && n.insights.length ? Math.floor(Math.random() * n.insights.length) : -1;
      return { ref: { tpl: "esma", id: n.id, ins: ins }, havuz: nodes.length };
    }),
    fusus: () => loadFususAtlas().then((d) => {
      const active = (d.fasses || []).filter((f) => f.status === "active");
      if (!active.length) return null;
      const f = pick(active);
      const ks = alintiKonumlari(f, shareLangId, 260);
      return { ref: Object.assign({ tpl: "fusus", id: f.id }, ks.length ? konum(pick(ks)) : {}), havuz: active.length };
    }),
    miskat: () => loadMiskatAtlas().then((d) => {
      const active = (d.hadisler || []).filter((h) => h.status === "active");
      return active.length ? { ref: { tpl: "miskat", id: pick(active).id }, havuz: active.length } : null;
    }),
    siir: () => loadSiirler().then((d) => {
      const poems = (d && d.siirler) || [];
      if (!poems.length) return null;
      const poem = pick(poems);
      const n = String(L(poem.metin, shareLangId)).split("\n").map((x) => x.trim()).filter(Boolean).length;
      if (n < 2) return null;
      const MAX = 5;
      const start = n > MAX ? Math.floor(Math.random() * (n - MAX + 1)) : 0;
      return { ref: { tpl: "siir", id: poem.id, start: start, count: Math.min(MAX, n) }, havuz: poems.length };
    }),
  };
  function konum(e) { return { si: e.si, bi: e.bi, k: e.k }; }

  // Bir ref'i çizip doğrular; iki dilli kipte ikinci dili aynı ref'ten
  // çizip satır satır eşler. Künyesi ya da sesi olmayan sahne aday olamaz.
  function renderRef(ref, l) {
    const R = RENDER[ref && ref.tpl];
    if (!R) return Promise.resolve(null);
    return Promise.resolve().then(() => R(ref, l)).then((s) => {
      if (!s || !s.kunye || !s.ses || !s.url || !s.lines || !s.lines.length) return null;
      if (!s.lines.every((x) => x.text && String(x.text).trim())) return null;
      return s;
    }, () => null);
  }
  function sahneKur(ref) {
    return renderRef(ref, shareLangId).then((s) => {
      if (!s || !ikiDilliMod || ikinciDilId === shareLangId) return s;
      return renderRef(ref, ikinciDilId).then((s2) => {
        if (s2 && s2.lines.length === s.lines.length) {
          s.lines.forEach((x, i) => { if (s2.lines[i].text !== x.text) x.text2 = s2.lines[i].text; });
          s.lang2 = ikinciDilId;
        }
        return s;
      });
    });
  }

  // --- bağlamlı giriş: "bu kaydı paylaş" --------------------------------
  // Bir kaydın kendi düğmesinden gelen {view, id} için o kaydın ref'leri.
  // Hiçbir zaman başka bir kayda "habersiz" gitmez: kayıt eşlenmiyorsa
  // panel bunu açıkça söyler (UI.baglamYok).
  function baglamRefleri(view, id) {
    if (!view || !id) return Promise.resolve(null);
    if (view === "esma" || view === "ontoloji") {
      const yukle = view === "esma" ? loadEsma : loadOntoloji;
      return yukle().then((d) => {
        const n = (d.nodes || []).find((x) => x.id === id);
        if (!n) return null;
        const refs = [{ tpl: view, id: n.id, ins: -1 }];
        (n.insights || []).forEach((_, i) => refs.push({ tpl: view, id: n.id, ins: i }));
        return { tpl: view, refs: refs };
      });
    }
    if (view === "futuhat") {
      return loadIndex().then((idx) => {
        if (!idx.parts.some((p) => p.id === id)) return null;
        return loadPart(id).then((p) => {
          const ks = shuffled(alintiKonumlari(p, shareLangId));
          return ks.length ? { tpl: "soz", refs: ks.map((e) => Object.assign({ tpl: "soz", part: p.id }, konum(e))), karisik: true, part: p.id } : null;
        });
      });
    }
    if (view === "miskat") {
      return loadMiskatAtlas().then((d) => ((d.hadisler || []).some((h) => h.id === id) ? { tpl: "miskat", refs: [{ tpl: "miskat", id: id }] } : null));
    }
    if (view === "fusus") {
      return loadFususAtlas().then((d) => {
        const f = (d.fasses || []).find((x) => x.id === id);
        if (!f) return null;
        const ks = shuffled(alintiKonumlari(f, shareLangId, 260));
        const refs = ks.map((e) => Object.assign({ tpl: "fusus", id: f.id }, konum(e)));
        refs.push({ tpl: "fusus", id: f.id });
        return { tpl: "fusus", refs: refs, karisik: true };
      });
    }
    if (view === "sorular") return Promise.resolve({ tpl: "soru", refs: [{ tpl: "soru", id: id }, { tpl: "hikaye", src: "soru", id: id }] });
    if (view === "sirlar") return Promise.resolve({ tpl: "sir", refs: [{ tpl: "sir", id: id }, { tpl: "hikaye", src: "sir", id: id }] });
    if (view === "bilmiyoruz") return Promise.resolve({ tpl: "hikaye", refs: [{ tpl: "hikaye", src: "bil", id: id }] });
    return Promise.resolve(null);
  }

  // Hicri (Kameri) takvimde bugünün ay/gün'ü ("7-27" biçiminde) --
  // tablosal hesap; desteklenmeyen tarayıcıda null.
  function hicriBugun() {
    try {
      const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric" }).formatToParts(new Date());
      const day = parts.find((p) => p.type === "day");
      const month = parts.find((p) => p.type === "month");
      if (!day || !month) return null;
      return month.value + "-" + day.value;
    } catch (e) {
      return null;
    }
  }
  const OZEL_GUN = {
    "7-27": {
      ad: { tr: "Miraç Kandili", en: "Night of the Ascension (Mi'raj)", pt: "Noite da Ascensão (Miraj)" },
      entryIds: ["mirac-in-en-yakin-aninda-ne", "sarabi-icmedim-sirri-aciklamaktan-korktum", "miracta-verilen-ifade-edilemeyen-bilgi"],
    },
    "12-10": {
      ad: { tr: "Kurban Bayramı", en: "Feast of Sacrifice (Eid al-Adha)", pt: "Festa do Sacrifício (Eid al-Adha)" },
      entryIds: ["yaratani-yaratilmis-yaratilmisi-yaratan-gormek-ibrahim"],
    },
  };
  // Desteklenmeyen bir günde boş kalmak yerine sıradaki desteklenen günü
  // söyler (panelin arayüz metni; kartın içeriği değil).
  function nextOzelGun() {
    try {
      const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { day: "numeric", month: "numeric" });
      for (let i = 0; i <= 366; i++) {
        const parts = fmt.formatToParts(new Date(Date.now() + i * 86400000));
        const day = parts.find((p) => p.type === "day");
        const month = parts.find((p) => p.type === "month");
        const key = day && month ? month.value + "-" + day.value : null;
        if (key && OZEL_GUN[key]) return { gun: OZEL_GUN[key], days: i };
      }
    } catch (e) { /* Intl desteklenmiyor -- UI.none'a düşülür */ }
    return null;
  }
  function ozelgunEmptyText() {
    const info = nextOzelGun();
    if (!info) return tt(UI.none);
    const n = info.days;
    const dict = {
      tr: "Bugün için kayıt yok — sıradaki: " + tt(info.gun.ad, "tr") + (n > 0 ? (", " + n + " gün sonra.") : "."),
      en: "No record for today — next: " + tt(info.gun.ad, "en") + (n > 0 ? (", in " + n + " day" + (n === 1 ? "" : "s") + ".") : "."),
      pt: "Sem registo para hoje — a seguir: " + tt(info.gun.ad, "pt") + (n > 0 ? (", daqui a " + n + " dia" + (n === 1 ? "" : "s") + ".") : "."),
    };
    return tt(dict);
  }

  // Havuz büyüklüğü (ucuz ve kesin hesaplanabilen şablonlarda) -- tahmini
  // bir sayı göstermek "olduğundan farklı gösterme" ilkesine aykırı olurdu.
  function havuzText(n) {
    return tt({
      tr: n + " kayıt arasından",
      en: "from " + n + (n === 1 ? " record" : " records"),
      pt: "entre " + n + (n === 1 ? " registo" : " registos"),
    });
  }

  // --- sahne çizimi ----------------------------------------------------
  let stageEl = null, rafId = 0, tilt = null, startTs = 0, chromeTimer = 0, helixHandle = null;
  // frame()/drawAmbient() saniyede 60 kez çalışıyor -- her karede aynı
  // düğümleri querySelector(All) ile yeniden aramak yerine, sahne AÇILIRKEN
  // (bir kez) önbelleğe alınıyor. DOM stageMarkup() tarafından yalnız
  // openStage()'de kuruluyor, döngü boyunca değişmiyor -- bu yüzden güvenli.
  let cacheFrame = null, cacheSvg = null, cacheSpiral = null, cacheHalo = null, cacheZatHalo = null, cacheDots = null, cacheLines = null, cacheRule = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Şablon başına döngü uzunluğu (ms) ve metin vuruşları. Vuruşlar
  // [giriş, çıkış] biçiminde, döngü içindeki oranlar.
  const TIMING = {
    soz:      { loop: 9000,  beats: [[0.09, 0.94]] },
    gunun:    { loop: 9000,  beats: [[0.09, 0.94]] },
    ikili:    { loop: 8500,  beats: [[0.09, 0.94], [0.22, 0.94]] },
    soru:     { loop: 8500,  beats: [[0.09, 0.94]] },
    // Üç vuruşlu, daha uzun bir döngü: soru en başta girip ekranda kalıyor
    // ("kanca" burada), iki cevap cümlesi ardından sırayla altına ekleniyor.
    // 15000 -> 20000 (2026-08-02 kullanıcı bildirimi): metin derin anlamlar
    // taşıyor ve okuyucu tam hazmetmeye başlarken kayboluyordu -- vuruş
    // ORANLARI aynı kaldı (sadece döngü uzadı), yani her satırın giriş/çıkış
    // sırası aynı hissi veriyor, sadece hepsi orantılı olarak yavaşladı.
    hikaye:   { loop: 20000, beats: [[0.04, 0.97], [0.24, 0.97], [0.52, 0.97]] },
    ontoloji: { loop: 9500,  beats: [[0.07, 0.75], [0.22, 0.94]] },
    esma:     { loop: 9500,  beats: [[0.07, 0.75], [0.22, 0.94]] },
    fusus:    { loop: 9500,  beats: [[0.07, 0.75], [0.22, 0.94]] },
    // Mişkât kartı tek satır: hadisin kendi metni (künye ayrı ve sabit).
    miskat:   { loop: 9500,  beats: [[0.07, 0.94]] },
    sir:      { loop: 9000,  beats: [[0.09, 0.94]] },
    ozelgun:  { loop: 9500,  beats: [[0.07, 0.75], [0.22, 0.94]] },
  };

  // "Dizi" satır sayısı 4-5 arasında değişebildiği için (1 kaynak başlığı +
  // 3-4 alıntı) TIMING'deki sabit vuruş dizileri yetmiyor -- satır sayısına
  // göre kendi vuruşlarını üreten bir taban hesaplıyoruz: giriş zamanları
  // eşit aralıklarla yayılır, hepsi sona doğru birlikte söner.
  function diziBase(n) {
    const loop = 10600 + Math.max(0, n - 1) * 4700;
    const beats = [];
    for (let i = 0; i < n; i++) {
      const from = n > 1 ? 0.04 + i * (0.50 / (n - 1)) : 0.04;
      beats.push([from, 0.94]);
    }
    return { loop: loop, beats: beats };
  }

  // Bazı kayıtların cümlesi uzun olduğunda TIMING'deki sabit döngü kısa
  // kalıyor -- kullanıcı bildirimi (2026-08-03): "son cümlenin de görünür
  // olmasından sonra ekranda kalma süresi biraz kısa". Kelime sayısına göre
  // bir "ek tutma" payı hesaplayıp yalnız EKRANDA KALMA (sönmeye başlama)
  // anını öteliyoruz; belirme (fade-in) zamanlaması mutlak ms cinsinden
  // aynı kalıyor ki uzun metinde sahnenin girişi de yavaşlamış hissettirmesin.
  const HOLD_BASE_WORDS = 16;
  const HOLD_MS_PER_WORD = 140;
  const HOLD_MAX_MS = 7000;
  function wordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length; }
  // "ikili" şablonundaki bölme çizgisinin (.share-rule)
  // sabit vuruşu -- frame()'in RULE_BEAT_DEFAULT'u kullanabilmesi için, ve
  // aşağıda extra süre eklendiğinde SATIRLARLA AYNI ORANDA rescale edilsin
  // diye burada tanımlı.
  const RULE_BEAT_DEFAULT = [0.30, 0.94];
  function computeTiming(s) {
    // "Şiir" de "Dizi" gibi değişken satır sayısı taşıyor (1 kaynak + 2-5
    // dize) -- aynı diziBase(n) motorunu paylaşıyor.
    const base = (s.tpl === "dizi" || s.tpl === "siir") ? diziBase(s.lines.length) : (TIMING[s.tpl] || TIMING.soz);
    const words = s.lines.reduce((n, l) => n + wordCount(l.text) + (l.text2 ? wordCount(l.text2) : 0), 0);
    const extra = Math.min(HOLD_MAX_MS, Math.max(0, words - HOLD_BASE_WORDS) * HOLD_MS_PER_WORD);
    if (!extra) return Object.assign({ ruleBeat: RULE_BEAT_DEFAULT }, base);
    const loop = base.loop + extra;
    const beats = base.beats.map((b) => [(b[0] * base.loop) / loop, (b[1] * base.loop + extra) / loop]);
    // Çizgi de satırlarla aynı rescale'i alıyor -- aksi hâlde döngü uzarken
    // sabit 0.30 oranı çizgiyi ikinci satırdan giderek geç göstermeye
    // başlıyordu (bkz. teknik inceleme, bulgu #4).
    const ruleBeat = [(RULE_BEAT_DEFAULT[0] * base.loop) / loop, (RULE_BEAT_DEFAULT[1] * base.loop + extra) / loop];
    return { loop: loop, beats: beats, ruleBeat: ruleBeat };
  }

  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }

  // --- ÇEKİM planı (kayıt kipi) -----------------------------------------
  // Sahne ekranda dönerken bir DÖNGÜ oynuyor: metin belirir, durur, söner,
  // baştan başlar. Bu, sayfada bakarken doğru; ama kaydedilen video için
  // yanlış -- kullanıcı notu (2026-07-28): "ekranda göründüğü haliyle değil,
  // en başından sonuna kadar rahatça her şeyin izlenebileceği bir kayıt".
  // Kayıtta bu yüzden ayrı bir zaman çizgisi kuruyoruz: karartıdan açılır,
  // satırlar sırayla girer, metin RAHATÇA OKUNACAK kadar durur, sonra
  // bütün kare karartıya kapanır. Süre metnin uzunluğundan hesaplanıyor --
  // sabit bir süre kısa alıntıda boş, uzun alıntıda yetersiz kalıyordu.
  const READ_WPS = 2.1;   // saniyede kelime; ekrandan rahat okuma hızı
  // "Hikâye" iki kuruluş cümlesi + bir soru taşıdığı için tek cümlelik
  // şablonlardan (soz/soru/ikili/ontoloji/esma) fazla kelime biriktiriyor;
  // onlara uygulanan 11 sn okuma / 22 sn toplam tavanı burada erken keserdi.
  // Ekrandaki döngü 15000 -> 20000ms'ye uzatıldığı için (2026-08-02),
  // kayıt tavanları da aynı oranda büyütüldü -- indirilen video ekranda
  // görülenden daha aceleci hissetmesin diye.
  const READ_CAP = { hikaye: 28, dizi: 34, siir: 24 };
  const TOTAL_CAP = { hikaye: 46, dizi: 52, siir: 40 };
  function takePlan(s) {
    const fadeIn = 0.7, fadeOut = 1.2, lineIn = 1.15;
    const cues = [];
    let t = fadeIn + 0.2;
    s.lines.forEach(() => { cues.push(t); t += lineIn; });
    const ruleAt = s.tpl === "ikili" ? t : null;
    if (ruleAt != null) t += 0.9;
    const words = s.lines.reduce((n, l) => n + wordCount(l.text) + (l.text2 ? wordCount(l.text2) : 0), 0);
    const read = Math.min(READ_CAP[s.tpl] || 11, Math.max(3.2, words / READ_WPS));
    return {
      fadeIn: fadeIn, fadeOut: fadeOut, lineIn: lineIn, cues: cues, ruleAt: ruleAt,
      // 8 sn'nin altı TikTok'ta göz kırpması gibi geçiyor, tavanın üstü
      // (şablona göre 22 ya da 40 sn) tek bir sahne için uzun.
      total: Math.min(TOTAL_CAP[s.tpl] || 22, Math.max(8, t + read + fadeOut)),
    };
  }

  let takeMode = false, takeStart = 0, plan = null;
  // Kart (PNG) yakalanırken frame()'in satır opaklığını üzerine yazmasını
  // durduran bayrak -- eski ekran-yakalamalı kart yolundan kalma; kart artık tuvale çiziliyor (bkz. kartCiz).
  let cardCapturing = false;

  function drawTake(el, ts) {
    const t = (ts - takeStart) / 1000;
    const fade = el.querySelector(".share-stage__fade");
    let fv = 0;
    // t < 0: kayıt başlamadan önceki "siyahta bekleme" payı. getDisplayMedia
    // akışı sayfadan birkaç kare geride olduğu için bu pay olmadan videonun
    // ilk kareleri kararmayı hiç görmüyor, parlak başlıyordu (ölçüldü).
    if (t < 0) fv = 1;
    else if (t < plan.fadeIn) fv = 1 - ease(t / plan.fadeIn);
    else if (t > plan.total - plan.fadeOut) fv = ease(clamp01((t - (plan.total - plan.fadeOut)) / plan.fadeOut));
    fade.style.opacity = fv.toFixed(3);
    el.querySelectorAll(".share-line").forEach((node) => {
      // İki dilli kartta bir logic satır İKİ .share-line üretebiliyor
      // (primary+secondary) -- data-li, ikisinin de AYNI vuruşu paylaşmasını
      // sağlıyor (DOM sırasına göre indekslemek ikinci dilde kayardı).
      const li = parseInt(node.dataset.li, 10) || 0;
      const v = ease(clamp01((t - (plan.cues[li] != null ? plan.cues[li] : 0)) / plan.lineIn));
      node.style.opacity = v.toFixed(3);
      node.style.transform = "translateY(" + ((1 - v) * 16).toFixed(1) + "px)";
    });
    const rule = el.querySelector(".share-rule");
    if (rule) {
      const v = plan.ruleAt == null ? 0 : ease(clamp01((t - plan.ruleAt) / 0.9));
      rule.style.opacity = (v * 0.55).toFixed(3);
      rule.style.transform = "scaleX(" + v.toFixed(3) + ")";
    }
  }
  // Bir vuruşun o andaki görünürlüğü: kısa bir belirme, uzun bir duruş,
  // kısa bir sönme. Döngü başa sardığında sert bir kesme olmasın diye.
  function beat(t, from, to) {
    if (t < from || t > to) return 0;
    const span = to - from, p = (t - from) / span;
    const fade = Math.min(0.22, span * 0.35) / span;
    if (p < fade) return ease(p / fade);
    if (p > 1 - fade) return ease((1 - p) / fade);
    return 1;
  }


  // --- zeminler ---------------------------------------------------------
  // Paylaşım sahnesinin arka planı. Hepsi aynı biçimde: sakin dönen,
  // üç boyutlu, dairesel/sarmal bir form (bkz. CLAUDE.md "Dairenin üçüncü
  // boyutu: sarmal"). Tek motor, farklı ayarlar -- ayrı çizim kodları
  // yazmak yerine tek bir sarmal üreteci parametreleniyor, böylece yeni
  // bir zemin eklemek bir satırlık bir iş.
  //
  // `fusus` bilerek Füsûs bölümünün sol sütunundaki uzun sarmalın aynısı
  // (kullanıcı isteği, 2026-07-29): çok düğüm, iki buçuk tur, yüksek
  // yükseliş.
  const ZEMIN = [
    { id: "sarmal", ad: { tr: "Sarmal", en: "Spiral", pt: "Espiral" },
      n: 30, tur: 1, yari: 0.30, yuk: 2.1, ac: 0.34, nokta: 3.4, hale: 0.30, halka: 0 },
    { id: "fusus", ad: { tr: "Uzun sarmal", en: "Long coil", pt: "Espiral longa" },
      n: 27, tur: 2.4, yari: 0.26, yuk: 3.0, ac: 0.30, nokta: 3.0, hale: 0.16, halka: 0 },
    { id: "halka", ad: { tr: "İç içe halka", en: "Nested rings", pt: "Anéis concêntricos" },
      n: 34, tur: 1, yari: 0.32, yuk: 0.5, ac: 0.02, nokta: 3.2, hale: 0.24, halka: 3 },
    { id: "nefes", ad: { tr: "Nefes", en: "Breath", pt: "Sopro" },
      n: 22, tur: 1, yari: 0.28, yuk: 1.2, ac: 0.10, nokta: 4.2, hale: 0.52, halka: 0, nefes: true },
    { id: "sade", ad: { tr: "Sade", en: "Plain", pt: "Simples" },
      n: 14, tur: 1, yari: 0.34, yuk: 1.6, ac: 0.20, nokta: 2.6, hale: 0.20, halka: 0, cizgisiz: true },
    // İki yeni zemin (kullanıcı isteği, 2026-07-30): "daha fazla arka plan
    // seçeneği, metafizik anlamı kuvvetli, düğümler farklı/canlı renklerle;
    // video gibi canlı hissi de olsun."  Süsleyici renk çarkı yerine hepsi
    // sitenin gerçek kavramlarını kodluyor:
    //  - "feyz": nefes-i Rahmânî'nin feyz/taşması -- bir dalga sarmalı
    //    boyunca aşağı akar; "video-benzeri" canlı his tam burada.
    //  - "esma": yedi Ümmehât-ı Esmâ'nın yedi rengi -- Hayy/Alîm/Mürîd/
    //    Kadîr/Semî'/Basîr/Mütekellim, her düğüm kendi isminin renginde.
    // ("Celâl-Cemâl" ve "Eşik" zeminleri 2026-09-13'te kaldırıldı --
    // kullanıcı isteği.)
    { id: "feyz", ad: { tr: "Feyz", en: "Emanation", pt: "Emanação" },
      n: 36, tur: 1.8, yari: 0.29, yuk: 2.8, ac: 0.28, nokta: 3.0, hale: 0.36, halka: 0, renk: "feyz" },
    { id: "esma", ad: { tr: "Esmâ", en: "Divine Names", pt: "Nomes Divinos" },
      n: 35, tur: 2.0, yari: 0.28, yuk: 2.6, ac: 0.26, nokta: 3.2, hale: 0.22, halka: 0, renk: "esma" },
    // Dört yeni pastel zemin (kullanıcı isteği, 2026-08-03): "değişik pastel
    // renkli canlı tasavvufi manevi havası olan arka plan seçenekleri" --
    // yine sitenin kendi imgelerine bağlı, süsleyici değil:
    //  - "seher": seherin/teheccüdün sakin uyanışı -- lavanta'dan şeftaliye
    //    yumuşak bir geçiş, sarmal boyunca kayan.
    //  - "gul": gül bahçesi -- pembe/yeşil dönüşümlü, düğüm başına
    //    değişen iki renk.
    //  - "deniz": vahdet-i vücûd'un sık kullanılan okyanus metaforu --
    //    "feyz"le aynı dalga mekaniği, turkuaz-lacivert.
    //  - "ney": ney'in inlemesi -- sıcak bakır tek ton, az düğüm (ney'in
    //    az sayıdaki deliği gibi), sade ve durağan bir sıcaklık.
    { id: "seher", ad: { tr: "Seherin İlk Işığı", en: "First Light of Dawn", pt: "Primeira Luz da Alva" },
      n: 26, tur: 1.3, yari: 0.29, yuk: 1.8, ac: 0.24, nokta: 3.2, hale: 0.34, halka: 0, renk: "seher" },
    { id: "gul", ad: { tr: "Gül Bahçesi", en: "Rose Garden", pt: "Jardim de Rosas" },
      n: 24, tur: 1.4, yari: 0.30, yuk: 2.0, ac: 0.26, nokta: 3.6, hale: 0.26, halka: 0, renk: "gul" },
    { id: "deniz", ad: { tr: "Deniz-i Muhît", en: "Encompassing Ocean", pt: "Oceano Circundante" },
      n: 32, tur: 1.6, yari: 0.30, yuk: 2.2, ac: 0.28, nokta: 3.4, hale: 0.30, halka: 0, renk: "deniz" },
    { id: "ney", ad: { tr: "Ney İnlemesi", en: "The Reed's Lament", pt: "O Lamento do Ney" },
      n: 18, tur: 1, yari: 0.32, yuk: 1.4, ac: 0.18, nokta: 3.8, hale: 0.30, halka: 0, renk: "ney" },
  ];
  // Renkli zeminlerin sabit tonları -- hem koyu hem açık zeminde okunaklı
  // kalacak şekilde seçildi (dekoratif öğeler oldukları için metin
  // kontrastı ölçütü uygulanmıyor, ama yine de göz önünde tutuldu).
  const RENK = {
    // Feyz: sıcak altın (tepe) → derin turuncu (dip); hem koyu hem açık zeminde okunabilir.
    feyzA: "#fdb347", feyzB: "#c04a0f",
    // Yedi Ümmehât: Hayy·Alîm·Mürîd·Kadîr·Semî'·Basîr·Mütekellim sırasıyla.
    esma: ["#3fb87a", "#4a9eff", "#a855f7", "#e2632b", "#06b6d4", "#eab308", "#ec4899"],
    // Dört yeni pastel zemin (2026-08-03).
    seherA: "#d9c9ff", seherB: "#ffd2b3",
    gulPembe: "#f2a6c4", gulYesil: "#8fbf7f",
    denizA: "#3fd6c8", denizB: "#1a3f6b",
    ney: "#cf9a5c",
  };
  function hexRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function renkGecis(a, b, t) {
    const A = hexRgb(a), B = hexRgb(b);
    const r = Math.round(A[0] + (B[0] - A[0]) * t);
    const g = Math.round(A[1] + (B[1] - A[1]) * t);
    const bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  // Panelde zemin seçenekleri düz metin etiketiydi -- kullanıcı hangisini
  // seçtiğinde neyle karşılaşacağını göremiyordu (2026-09-13 isteği: "arka
  // plan seçeneklerini görsel olarak görebilmemize imkan ver"). Sahnenin
  // GERÇEK boyama mantığını (aynı renk fonksiyonları, aynı sarmal açısı)
  // küçük dairesel bir örnekte tekrarlıyoruz -- ayrı, süsleyici bir ikon
  // DEĞİL, o zeminin sahnede alacağı biçimin/renginin ölçekli bir örneği
  // (bkz. CLAUDE.md "kavramı değil davranışını resmet"). Tilt/3B'yi
  // (yalnız sahnede anlamlı) atlıyoruz; düz üstten bakışlı bir sarmal
  // yeterli bir örnek.
  function zeminThumbSvg(z) {
    const n = Math.min(z.n, 22);
    const size = 34, cx = size / 2, cy = size / 2, R = size * 0.40;
    let d = "", dots = "";
    for (let i = 0; i < n; i++) {
      const t = i / Math.max(1, n - 1);
      const a = -Math.PI / 2 + t * Math.PI * 2 * z.tur;
      const adim = z.halka ? Math.floor(t * z.halka) / Math.max(1, z.halka - 1) : t;
      const rr = R * (0.20 + 0.80 * adim);
      const x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
      d += (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      // Zât ucu (i = 0) ışımasız bir boşluk -- bkz. drawZeminFrame notu.
      if (i === 0) {
        dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="#05060a" stroke="#eda100" stroke-opacity="0.45" stroke-width="0.8"/>';
        continue;
      }
      const fill = dotFill(z, i) || "#eda100";
      const r = 1.5;
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + fill + '"/>';
    }
    const path = z.cizgisiz ? "" : '<path d="' + d + '" fill="none" stroke="#eda100" stroke-opacity="0.32" stroke-width="1"/>';
    return '<svg class="share-zemin-thumb" viewBox="0 0 ' + size + " " + size + '" aria-hidden="true" focusable="false">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R * 0.95).toFixed(1) + '" fill="#05060a"/>' +
      path + dots + "</svg>";
  }
  // Aynı gerekçe, şablon seçenekleri için: her ikon o şablonun kartta
  // GERÇEKTEN alacağı satır sayısını/sırasını (başlık/söz/soru/çizgi)
  // küçük çubuklarla gösteriyor -- soyut bir sembol değil, kartın kendi
  // iskeletinin ölçekli bir örneği. Füsûs/Mişkât tek bir halka taşıyor
  // (o ikisi zaten kendi bölümünün halka görselini ödünç alıyor).
  const TPL_THUMB_ROWS = {
    soz: [["soz", 0.62]],
    gunun: [["soz", 0.62]],
    soru: [["soru", 0.7]],
    hikaye: [["soru", 0.68], ["soz", 0.5], ["soz", 0.58]],
    ikili: [["soz", 0.55], ["rule", 0], ["soz", 0.6]],
    ontoloji: [["baslik", 0.4], ["soz", 0.68]],
    esma: [["baslik", 0.4], ["soz", 0.68]],
    ozelgun: [["baslik", 0.4], ["soz", 0.68]],
    dizi: [["baslik", 0.36], ["soz", 0.5], ["soz", 0.62], ["soz", 0.44]],
    siir: [["baslik", 0.36], ["soz", 0.42], ["soz", 0.54], ["soz", 0.38]],
    fusus: [["baslik", 0.4], ["soz", 0.5]],
    miskat: [["soz", 0.6]],
  };
  const TPL_THUMB_RING = { fusus: true, miskat: true };
  function tplThumbSvg(key) {
    const rows = TPL_THUMB_ROWS[key] || TPL_THUMB_ROWS.soz;
    const w = 26, h = 42, barH = 2.4, gap = 5;
    const x0 = w * 0.16;
    let out = '<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="3" fill="#05060a"/>';
    let y;
    if (TPL_THUMB_RING[key]) {
      out += '<circle cx="' + (w / 2) + '" cy="' + (h * 0.36).toFixed(1) + '" r="' + (w * 0.26).toFixed(1) +
        '" fill="none" stroke="#eda100" stroke-opacity="0.55" stroke-width="1.1"/>';
      y = h * 0.66;
    } else {
      const totalH = rows.length * barH + (rows.length - 1) * gap;
      y = (h - totalH) / 2;
    }
    rows.forEach(function (row) {
      if (row[0] === "rule") {
        out += '<rect x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (w * 0.68).toFixed(1) +
          '" height="0.7" fill="#eda100" fill-opacity="0.32"/>';
        y += gap;
        return;
      }
      const bw = w * 0.68 * row[1];
      const vurgu = row[0] === "baslik" || row[0] === "soru";
      out += '<rect x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + barH +
        '" rx="1.3" fill="' + (vurgu ? "#eda100" : "#cfcabd") + '" fill-opacity="' + (vurgu ? 0.9 : 0.72) + '"/>';
      y += barH + gap;
    });
    return '<svg class="share-tpl-thumb" viewBox="0 0 ' + w + " " + h + '" aria-hidden="true" focusable="false">' + out + "</svg>";
  }
  const ZEMIN_ANAHTAR  = "dost-share-zemin";
  const ISIK_ANAHTAR   = "dost-share-isik";
  const KARE_ANAHTAR   = "dost-share-kare";
  const METINSIZ_ANAHTAR = "dost-share-metinsiz";
  const FAV_ANAHTAR    = "dost-share-fav";
  const KAYNAK_ANAHTAR = "dost-share-kaynak";
  const TARIH_ANAHTAR  = "dost-share-tarih";
  const MAX_FAV = 20, MAX_TARIH = 5;
  let zeminId  = safeGet(ZEMIN_ANAHTAR) || "sarmal";
  let acikMod  = safeGet(ISIK_ANAHTAR) === "1";
  // Kullanıcı isteği (2026-08-02): kare (1:1) format seçeneği -- feed
  // paylaşımı için 9:16 dikey gereksiz uzun kalıyordu.
  let kareMod  = safeGet(KARE_ANAHTAR) === "1";
  // Füsûs Halkası şablonu için düğüm-metinsiz seçenek (2026-08-16).
  let metinsizMod = safeGet(METINSIZ_ANAHTAR) === "1";
  let kaynakId = safeGet(KAYNAK_ANAHTAR) || "all";

  function safeGet(k) {
    // localStorage gizli kipte ya da üçüncü-taraf çerezleri kapalıyken
    // erişimde hata fırlatabiliyor; zemin tercihi uğruna sahne açılmasın
    // diye sarmalanıyor.
    try { return localStorage.getItem(k); } catch (e) { return null; }
  }
  function safeSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* yoksay */ }
  }
  function zemin() {
    return ZEMIN.find((z) => z.id === zeminId) || ZEMIN[0];
  }

  // En kalabalık zemin kadar düğüm önceden hazırlanıyor; zemin değişince
  // yalnız kaçının çizileceği değişiyor, DOM yeniden kurulmuyor.
  const NODE_COUNT = Math.max.apply(null, ZEMIN.map((z) => z.n));
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({ phase: Math.random() * 6.28 });
  }


  // Renkli zeminlerde düğüm rengi -- sahne SVG'si, zemin önizlemesi ve kart
  // tuvali aynı kuralı paylaşsın diye tek yerde. null = varsayılan mürekkep.
  function dotFill(z, i) {
    const t = i / Math.max(1, z.n - 1);
    if (z.renk === "feyz") return renkGecis(RENK.feyzA, RENK.feyzB, t);
    if (z.renk === "esma") return RENK.esma[i % RENK.esma.length];
    if (z.renk === "seher") return renkGecis(RENK.seherA, RENK.seherB, t);
    if (z.renk === "gul") return i % 2 === 0 ? RENK.gulPembe : RENK.gulYesil;
    if (z.renk === "deniz") return renkGecis(RENK.denizA, RENK.denizB, t);
    if (z.renk === "ney") return RENK.ney;
    return null;
  }
  // Merkezdeki nefes alan hâlenin rengi (renkli zeminlerde zeminin tonu).
  function haleFill(z) {
    if (z.renk === "feyz") return RENK.feyzA;
    if (z.renk === "esma") return RENK.esma[3]; // Kadîr -- merkezde
    if (z.renk === "seher") return renkGecis(RENK.seherA, RENK.seherB, 0.5);
    if (z.renk === "gul") return RENK.gulPembe;
    if (z.renk === "deniz") return RENK.denizA;
    if (z.renk === "ney") return RENK.ney;
    return null;
  }

  // Sarmal: hal.js/menziller ile aynı motor (GU.createTilt'in project'i).
  // Hem gerçek sahne (drawAmbient) hem panelde zemin çipine değinince
  // beliren küçük canlı önizleme (mountZeminPreview) bu fonksiyonu kendi
  // ayrı SVG'si ve tilt örneğiyle çağırıyor.
  //
  // Zât düğümü (sarmalın i = 0 ucu, ekranda tepede): 2026-10-09'a kadar
  // ontoloji'deki kök düğümün aynısı -- bembeyaz bir gövde + altın, nefes
  // alan bir hâle -- olarak çiziliyordu. GORSEL_DIL "Zât'ı parlak bir cisim
  // olarak çizme" der: onun en gizli sıfatı gizliliğidir. Artık zeminin
  // kendi rengiyle dolu, ışımasız bir BOŞLUK (.share-dot--zat): sarmal
  // oradan açılıyor, ama orada parlayan bir şey yok. Hâlesi de kalktı.
  function drawZeminFrame(refs, z, tiltInst, w, h, ts, hide) {
    // "Füsûs Halkası"/"Mişkât Sarmalı" İÇERİK şablonları kendi DostHelix
    // sahnesini taşıyor; genel sarmal bu şablonlarda hiç çizilmiyor
    // (satır-içi stil CSS'in gizlemesini ezdiği için erken çıkış).
    if (hide) {
      if (refs.spiral) refs.spiral.setAttribute("d", "");
      if (refs.halo) refs.halo.style.opacity = "0";
      if (refs.zatHalo) refs.zatHalo.style.display = "none";
      if (refs.dots) refs.dots.forEach((c) => { c.style.opacity = "0"; });
      return;
    }
    const cx = w / 2, cy = h * 0.5;
    const R = Math.min(w, h) * z.yari;
    const H = R * z.yuk;
    // "nefes" zemininde halkanın kendisi de açılıp kapanıyor: nefes-i
    // Rahmânî'nin sitedeki karşılığı hep bu altı saniyelik ritim.
    const nfs = z.nefes && !reduceMotion
      ? 1 + 0.10 * Math.sin((ts / 6000) * 2 * Math.PI) : 1;
    let d = "";
    const pts = [];
    for (let i = 0; i < z.n; i++) {
      const n = nodes[i];
      const t = i / Math.max(1, z.n - 1);
      const a = -Math.PI / 2 + t * Math.PI * 2 * z.tur;
      // `halka` zemininde yarıçap basamak basamak sıçrıyor.
      const adim = z.halka ? Math.floor(t * z.halka) / Math.max(1, z.halka - 1) : t;
      const rr = R * (0.72 + z.ac * adim) * nfs;
      const px = rr * Math.cos(a), py = rr * Math.sin(a);
      const vert = -H / 2 + H * t;
      const p = tiltInst ? tiltInst.project(px, py, vert) : { x: px, y: py, depth: 1 };
      const X = cx + p.x, Y = cy + p.y;
      pts.push({ x: X, y: Y, depth: p.depth == null ? 1 : p.depth, phase: n.phase });
      d += (i === 0 ? "M" : "L") + X.toFixed(1) + "," + Y.toFixed(1);
    }
    refs.spiral.setAttribute("d", z.cizgisiz ? "" : d);
    refs.dots.forEach((c, i) => {
      const p = pts[i];
      if (!p) { c.style.opacity = "0"; return; }
      const br = reduceMotion ? 1 : 1 + 0.14 * Math.sin(ts / 3400 + p.phase);
      c.setAttribute("cx", p.x.toFixed(1));
      c.setAttribute("cy", p.y.toFixed(1));
      if (i === 0) {
        c.classList.add("share-dot--zat");
        c.style.fill = "";
        c.setAttribute("r", (z.nokta * p.depth * 2.6).toFixed(2));
        c.style.opacity = "1";
        return;
      }
      c.classList.remove("share-dot--zat");
      c.setAttribute("r", (z.nokta * p.depth * br).toFixed(2));
      c.style.opacity = (0.30 + 0.42 * p.depth).toFixed(2);
      c.style.fill = dotFill(z, i) || "";
      // Feyz/Deniz: dalga sarmal boyunca aşağı akar.
      if (!reduceMotion && (z.renk === "feyz" || z.renk === "deniz")) {
        const pos = i / Math.max(1, z.n - 1);
        const wave = (1 - Math.cos(ts / (z.renk === "feyz" ? 1200 : 1500) - pos * Math.PI * 4)) / 2;
        c.style.opacity = (z.renk === "feyz" ? 0.05 + 0.88 * wave : 0.15 + 0.75 * wave).toFixed(2);
      }
    });
    if (refs.zatHalo) refs.zatHalo.style.display = "none";
    // Merkezdeki nefes alan hâle: 6 saniyelik ritim.
    const halo = refs.halo;
    halo.style.fill = haleFill(z) || "";
    const ph = reduceMotion ? 0.5 : (1 - Math.cos((ts / 6000) * 2 * Math.PI)) / 2;
    halo.setAttribute("cx", cx); halo.setAttribute("cy", cy);
    halo.setAttribute("r", (R * z.hale * (1 + 0.4 * ph)).toFixed(1));
    halo.style.opacity = (0.14 + 0.20 * ph).toFixed(3);
  }
  function drawAmbient(w, h, ts) {
    const hide = !!(scene && (scene.tpl === "fusus" || scene.tpl === "miskat"));
    drawZeminFrame({ spiral: cacheSpiral, halo: cacheHalo, zatHalo: cacheZatHalo, dots: cacheDots }, zemin(), tilt, w, h, ts, hide);
  }

  // --- zemin (backdrop) canlı önizlemesi ---------------------------------
  // Panelde bir zemin çipine değinince (hover/focus) beliren, sahnenin
  // GERÇEK motoruyla (drawZeminFrame) çizilen küçük dairesel önizleme.
  // `reduceMotion` tercih edilmişse hiç mount etmiyoruz -- statik rozet
  // (zeminThumbSvg) zaten şeklin/rengin sabit bir örneğini veriyor, hareket
  // dayatmıyoruz.
  let zeminPreviewEl = null, zeminPreviewRaf = 0, zeminPreviewTilt = null, zeminPreviewStart = 0, zeminPreviewRefs = null;
  function mountZeminPreview(z, anchorEl) {
    if (reduceMotion) return;
    teardownZeminPreview();
    const el = document.createElement("div");
    el.className = "share-zemin-preview";
    el.setAttribute("aria-hidden", "true");
    const size = 200;
    el.innerHTML =
      '<svg viewBox="0 0 ' + size + " " + size + '">' +
      '<circle class="share-halo"></circle>' +
      '<path class="share-spiral" fill="none"></path>' +
      '<circle class="share-zat-halo"></circle>' +
      new Array(NODE_COUNT).fill('<circle class="share-dot"></circle>').join("") +
      "</svg>";
    document.body.appendChild(el);
    const r = anchorEl.getBoundingClientRect();
    let left = r.left + r.width / 2 - size / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - size - 8));
    let top = r.top - size - 12;
    if (top < 8) top = r.bottom + 12; // üstte yer yoksa çipin altına düşer.
    el.style.left = left + "px";
    el.style.top = top + "px";
    zeminPreviewEl = el;
    zeminPreviewRefs = {
      spiral: el.querySelector(".share-spiral"),
      halo: el.querySelector(".share-halo"),
      zatHalo: el.querySelector(".share-zat-halo"),
      dots: el.querySelectorAll(".share-dot"),
    };
    zeminPreviewTilt = GU.createTilt ? GU.createTilt({ pitch: 0.20, spinRate: 0.000035 }) : null;
    if (zeminPreviewTilt) zeminPreviewTilt.set(1, true);
    zeminPreviewStart = 0;
    const step = (ts) => {
      if (!zeminPreviewEl) return;
      if (!zeminPreviewStart) zeminPreviewStart = ts;
      if (zeminPreviewTilt) zeminPreviewTilt.step(ts, 16, true);
      drawZeminFrame(zeminPreviewRefs, z, zeminPreviewTilt, size, size, ts, false);
      zeminPreviewRaf = requestAnimationFrame(step);
    };
    zeminPreviewRaf = requestAnimationFrame(step);
  }
  function teardownZeminPreview() {
    if (zeminPreviewRaf) { cancelAnimationFrame(zeminPreviewRaf); zeminPreviewRaf = 0; }
    if (zeminPreviewEl) { zeminPreviewEl.remove(); zeminPreviewEl = null; }
    zeminPreviewRefs = null;
    zeminPreviewTilt = null;
    zeminPreviewStart = 0;
  }

  function frame(ts) {
    if (!stageEl) return;
    if (!startTs) startTs = ts;
    const el = stageEl;
    const box = cacheFrame, svg = cacheSvg;
    const w = box.clientWidth, h = box.clientHeight;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    if (tilt) tilt.step(ts, 16, true);
    drawAmbient(w, h, ts);

    if (takeMode) { drawTake(el, ts); rafId = requestAnimationFrame(frame); return; }
    if (cardCapturing) { rafId = requestAnimationFrame(frame); return; }

    const cfg = scene._timing || TIMING[scene.tpl] || TIMING.soz;
    const t = ((ts - startTs) % cfg.loop) / cfg.loop;
    cacheLines.forEach((node) => {
      // bkz. drawTake'teki aynı not: data-li, iki dilli bir satırın iki
      // .share-line'ının da AYNI vuruşu paylaşmasını sağlıyor.
      const li = parseInt(node.dataset.li, 10) || 0;
      const b = cfg.beats[li] || cfg.beats[cfg.beats.length - 1];
      const v = beat(t, b[0], b[1]);
      node.style.opacity = v.toFixed(3);
      node.style.transform = "translateY(" + ((1 - v) * 14).toFixed(1) + "px)";
    });
    const rule = cacheRule;
    if (rule) {
      const rb = cfg.ruleBeat || RULE_BEAT_DEFAULT;
      const v = beat(t, rb[0], rb[1]);
      rule.style.opacity = (v * 0.55).toFixed(3);
      rule.style.transform = "scaleX(" + v.toFixed(3) + ")";
    }
    rafId = requestAnimationFrame(frame);
  }
  // --- masaüstünde doğrudan video indirme --------------------------------
  // Telefonda ekran kaydı doğal yol; bilgisayarda değil (kullanıcı notu,
  // 2026-07-28). Burada sekmeyi getDisplayMedia ile yakalayıp SADECE 9:16
  // çerçeveyi bir tuvale kırpıyoruz, sonra MediaRecorder'a veriyoruz.
  // Kırpma sayesinde çıktı tam 1080x1920 oluyor ve masaüstündeki siyah
  // kenarlar ile arayüz düğmeleri videoya hiç girmiyor.
  const canRecord = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia &&
    window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
  // mp4 önce denenir: TikTok webm'i çoğu zaman reddediyor. Chrome 130+ ve
  // Safari MediaRecorder'da mp4 üretebiliyor; üretemeyen tarayıcıda webm'e
  // düşüyoruz (o dosya da yüklenebiliyor ama garantisi yok).
  // "avc1.4D401F" (Main profile) baseline'dan (avc1.42E01E) AYNI bitrate'te
  // daha iyi sıkıştırıyor -- kullanıcı bildirimi (2026-09-14: "indirdiğim
  // videoların kalitesi çok düşük") üzerine önce bunu deniyoruz, cihaz
  // desteklemiyorsa isTypeSupported() zaten sessizce baseline'a düşüyor.
  const MIMES = [
    "video/mp4;codecs=avc1.4D401F",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  // Aynı bildirim: MediaRecorder önceden BİTRATE HİÇ BELİRTMİYORDU --
  // tarayıcı 1080x1920 gibi yüksek bir çözünürlük için kendi varsayılanını
  // (genelde birkaç Mbps'in altında) seçiyor, bu da özellikle keskin kenarlı
  // METİN üzerinde bloklaşmaya/bulanıklığa yol açıyor. TikTok/Instagram
  // kendi tarafında yeniden kodluyor zaten -- yüksek bir sabit bitrate
  // vererek ilk kopyayı olabildiğince temiz tutuyoruz.
  const VIDEO_BITRATE = 12000000;
  function pickMime() {
    for (const m of MIMES) {
      try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {}
    }
    return "";
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function recStatus(text, busy) {
    const el = stageEl && stageEl.querySelector(".share-stage__rec");
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.toggle("is-busy", !!busy);
  }

  // `preferCurrentTab` yalnız tarayıcının kendi seçim ekranında "Bu sekme"yi
  // ÖN SEÇİLİ getirir -- kullanıcı yine de "Bütün ekran" ya da başka bir
  // pencere seçebilir. O durumda aşağıdaki sabit kırpma matematiği (sx/sy,
  // frameEl.getBoundingClientRect()) yanlış bölgeyi keser ve sessizce
  // bozuk bir görüntü/video iner. displaySurface "browser" değilse akışı
  // hemen durdurup recFail göstererek bu sessiz hatayı önlüyoruz.
  function yanlisYuzeySecildi(stream) {
    const track = stream.getVideoTracks()[0];
    const settings = track && track.getSettings && track.getSettings();
    const surface = settings && settings.displaySurface;
    return !!surface && surface !== "browser";
  }

  // İSTENEN çözünürlük belirtilmezse tarayıcı sekmeyi kendi varsayılanında
  // (genelde ekranın gerçek fiziksel piksel sayısından DÜŞÜK) yakalıyor --
  // biz sonra bunu 1080x1920'lik tuvale BÜYÜTÜNCE metin bulanıklaşıyordu
  // (kullanıcı bildirimi, 2026-09-14: "indirdiğim videoların kalitesi çok
  // düşük"). devicePixelRatio dahil gerçek fiziksel piksel sayısını "ideal"
  // olarak istemek tarayıcıyı olabildiğince yüksek çözünürlükte yakalamaya
  // zorluyor -- bir üst sınır değil, yalnızca bir tercih (ideal), o yüzden
  // düşük çözünürlüklü bir ekranda hâlâ güvenli.
  function captureVideoConstraints(fps) {
    const dpr = window.devicePixelRatio || 1;
    return {
      frameRate: fps,
      preferCurrentTab: true,
      width: { ideal: Math.round(window.innerWidth * dpr) },
      height: { ideal: Math.round(window.innerHeight * dpr) },
    };
  }

  // getDisplayMedia'nın video()'su play() çözüldüğünde bazen HENÜZ
  // videoWidth/videoHeight=0 (ilk kare kararmamış) ya da bir önceki
  // sekmenin karesini taşıyor olabiliyor -- eski kart yakalaması bunun için
  // sabit bir 250ms bekleme ekliyordu (2026-08-03 notu, "akışın ilk
  // karesi bazen bir önceki sekmenin görüntüsünü taşıyor"), ama
  // recordToFile aynı riski taşıdığı hâlde HİÇ beklemiyordu -- crop
  // koordinatları (sx/sy/crop.w/crop.h) videoWidth henüz 0 iken
  // hesaplanınca crop.w/h de 0 çıkıyor, bu da bozuk/siyah bir video
  // indirmesine yol açıyordu (kullanıcı bildirimi, 2026-08-04: "video
  // kayıtta sorun var"). Boyut gerçekten hazır olana kadar bekleyip
  // ardından aynı 250ms'lik "önceki kare" payını her iki fonksiyonda da
  // ortaklaştırıyoruz.
  function videoHazirBekle(video) {
    return new Promise((resolve) => {
      function check() {
        if (video.videoWidth && video.videoHeight) resolve();
        else requestAnimationFrame(check);
      }
      check();
    }).then(() => new Promise((resolve) => setTimeout(resolve, 250)));
  }

  async function recordToFile() {
    if (!stageEl || recording) return;
    if (!disaAktarilabilir(scene)) { durumGoster(tt(UI.kunyeYok), 5000); return; }
    const frameEl = stageEl.querySelector(".share-stage__frame");
    recStatus(tt(UI.recPick), false);
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: captureVideoConstraints(30),
        preferCurrentTab: true,
        audio: false,
      });
    } catch (e) {
      recStatus(tt(UI.recFail), false);
      setTimeout(() => recStatus("", false), 4000);
      return;
    }
    if (yanlisYuzeySecildi(stream)) {
      stream.getTracks().forEach((t) => t.stop());
      recStatus(tt(UI.recFail), false);
      setTimeout(() => recStatus("", false), 4000);
      return;
    }
    recording = true;
    stageEl.classList.add("is-recording");
    recStatus(tt(UI.recWait), true);

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    // bkz. videoHazirBekle -- crop hesabı videoWidth henüz 0 iken ya da
    // önceki sekmenin karesiyle yapılırsa bozuk bir video iner.
    await videoHazirBekle(video);

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = kareMod ? 1080 : 1920;
    const ctx = canvas.getContext("2d");

    // Yakalanan görüntü sekmenin görünen alanı; CSS pikselinden yakalama
    // pikseline ölçek buradan çıkıyor. Kullanıcı "bu sekme" yerine bütün
    // ekranı seçerse bu eşleme kayar -- düğmenin yanındaki metin bu yüzden
    // açıkça "Bu sekme"yi söylüyor.
    const sx = video.videoWidth / window.innerWidth;
    const sy = video.videoHeight / window.innerHeight;
    const r = frameEl.getBoundingClientRect();
    const crop = {
      x: Math.round(r.left * sx), y: Math.round(r.top * sy),
      w: Math.round(r.width * sx), h: Math.round(r.height * sy),
    };

    let drawing = true;
    (function drawLoop() {
      if (!drawing) return;
      ctx.drawImage(video, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
      requestAnimationFrame(drawLoop);
    })();

    const mime = pickMime();
    const chunks = [];
    const recOpts = Object.assign({ videoBitsPerSecond: VIDEO_BITRATE }, mime ? { mimeType: mime } : null);
    const rec = new MediaRecorder(canvas.captureStream(30), recOpts);
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      drawing = false;
      // Çekim bitti: sahne kendi döngüsüne dönsün ki kullanıcı bir sonraki
      // kayıt için aynı yerden devam edebilsin.
      takeMode = false;
      startTs = 0;
      const fadeEl = stageEl && stageEl.querySelector(".share-stage__fade");
      if (fadeEl) fadeEl.style.opacity = "0";
      stream.getTracks().forEach((t) => t.stop());
      const ext = (mime || "video/webm").indexOf("mp4") !== -1 ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: mime || "video/webm" });
      const cekilen = scene;
      paylasVeyaIndir([{ blob: blob, name: dosyaAdi(cekilen, ext), mime: mime || "video/webm" }]).then((yol) => { if (yol) gunlukEkle(cekilen, "video", yol); });
      recording = false;
      stageEl && stageEl.classList.remove("is-recording");
      recStatus(tt(UI.recDone) + " · " + ext, false);
      setTimeout(() => recStatus("", false), 4000);
    };
    // Döngüyü kesip ÇEKİM kipine geç: video karartıdan açılıp baştan sona
    // kendi başına izlenebilen bir parça oluyor (bkz. takePlan).
    plan = takePlan(scene);
    // LEAD: sahne siyaha kapanıp yakalama akışının onu görmesi için beklenen
    // süre. REC_AT: kaydın bu payın neresinde başlayacağı -- videonun ilk
    // ~0,25 sn'si siyah olsun, sonra açılış başlasın.
    const LEAD = 550, REC_AT = 300;
    takeMode = true;
    takeStart = performance.now() + LEAD;
    setTimeout(() => {
      if (!recording) return;
      rec.start();
      recStatus(tt(UI.recBusy) + " · " + plan.total.toFixed(1) + "s", true);
      // Kapanış karartısı tamamlansın diye küçük bir pay.
      setTimeout(() => { if (rec.state !== "inactive") rec.stop(); },
        (LEAD - REC_AT) + plan.total * 1000 + 250);
    }, REC_AT);
  }
  let recording = false;

  // --- künye satırı ------------------------------------------------------
  function disaAktarilabilir(s) { return !!(s && s.kunye && s.ses && s.url); }
  function adresKisa(s) { return SITE + (s.url || ""); }
  function adresTam(s) { return "https://" + SITE + (s.url || ""); }
  function sesEtiket(s) { return tt(SES[s.ses] || {}, s.lang); }
  function kunyeHtml(s) {
    if (!disaAktarilabilir(s)) {
      return '<div class="share-stage__kunye share-stage__kunye--yok">' + escapeHtml(tt(UI.kunyeYok)) + "</div>";
    }
    return '<div class="share-stage__kunye">' +
      '<span class="share-kunye__ses">' + escapeHtml(sesEtiket(s)) + "</span>" +
      '<span class="share-kunye__kaynak">' + escapeHtml(s.kunye) + "</span>" +
      '<span class="share-kunye__adres">' + escapeHtml(adresKisa(s)) + "</span>" +
      "</div>";
  }

  // Uzun metin (ör. Mişkât'ta hadisin kendi metni) sahneden taşmasın diye
  // yazı boyu metin uzunluğuna göre küçülür -- metin kesilmez.
  function uzunlukSinifi(s) {
    const n = s.lines.reduce((a, l) => a + String(l.text || "").length + String(l.text2 || "").length, 0);
    return n > 420 ? " share-stage__text--cokuzun" : n > 240 ? " share-stage__text--uzun" : "";
  }
  function stageMarkup(s) {
    const lines = s.lines.map((l, li) => {
      const primary = '<p class="share-line share-line--' + l.kind + '" data-li="' + li + '">' + escapeHtml(plainText(l.text)) + "</p>";
      const secondary = l.text2
        ? '<p class="share-line share-line--' + l.kind + ' share-line--secondary" data-li="' + li + '">' + escapeHtml(plainText(l.text2)) + "</p>"
        : "";
      return '<div class="share-line-group">' + primary + secondary + "</div>";
    }).join(s.tpl === "ikili" ? '<span class="share-rule" aria-hidden="true"></span>' : "");
    const helixMarkup = (s.tpl === "fusus" || s.tpl === "miskat") ? '<div class="share-stage__helix" aria-hidden="true"></div>' : "";
    const ok = disaAktarilabilir(s);
    const dis = ok ? "" : " disabled";
    return (
      '<div class="share-stage__frame share-stage__frame--' + s.tpl + '">' +
      '<svg class="share-stage__svg" aria-hidden="true">' +
      '<circle class="share-halo"></circle>' +
      '<path class="share-spiral" fill="none"></path>' +
      '<circle class="share-zat-halo"></circle>' +
      new Array(NODE_COUNT).fill('<circle class="share-dot"></circle>').join("") +
      "</svg>" +
      helixMarkup +
      // Künye metnin altında, aynı yarı saydam zeminin içinde: TikTok'un
      // alt %20'sine (güvenli alan dışı) düşmesin, sarmal noktaları da
      // metnin üstüne binmesin diye.
      '<div class="share-stage__text' + uzunlukSinifi(s) + '">' + lines + kunyeHtml(s) + "</div>" +
      '<div class="share-stage__guides" hidden></div>' +
      // Kayıt kipinde açılış/kapanış karartısı. Sahne döngüsünde hep saydam.
      '<div class="share-stage__fade" style="opacity:0"></div>' +
      "</div>" +
      // Krom ÇERÇEVENİN DIŞINDA: masaüstünde kayıt çerçeveye kırpıldığı için
      // buradaki hiçbir şey videoya girmiyor.
      '<div class="share-stage__chrome">' +
      '<button type="button" data-action="kopyala"' + dis + ">" + escapeHtml(tt(UI.kopyala)) + "</button>" +
      '<button type="button" data-action="kart"' + dis + ">" + escapeHtml(tt(UI.kart)) + "</button>" +
      '<button type="button" data-action="paket"' + (ok && s.ref ? "" : " disabled") + ">" + escapeHtml(tt(UI.paket)) + "</button>" +
      (canRecord
        ? '<button type="button" data-action="rec"' + dis + ">" + escapeHtml(tt(UI.rec)) + "</button>"
        : '<button type="button" data-action="recyok" aria-label="' + escapeHtml(tt(UI.recYok)) + '">?</button>') +
      '<button type="button" data-action="guides">' + escapeHtml(tt(UI.guides)) + "</button>" +
      '<button type="button" data-action="close" aria-label="' + escapeHtml(tt(UI.close)) + '">✕</button>' +
      "</div>" +
      '<p class="share-stage__rec" role="status" aria-live="polite"' + (ok ? " hidden" : "") + ">" + (ok ? "" : escapeHtml(tt(UI.kunyeYok))) + "</p>"
    );
  }

  // --- kart: ekran yakalamasız, doğrudan tuvale -------------------------
  // 2026-10-09'a kadar PNG kart getDisplayMedia ile sekmenin ekran görüntüsü
  // alınarak üretiliyordu: izin penceresi, "Bu sekme" seçimi ve telefonda
  // hiç çalışmaması. Artık kart, sahnenin aynı kurallarıyla (zemin, renk,
  // satır türleri, künye) doğrudan bir <canvas>'a çiziliyor; fontlar sitenin
  // kendi assets/fonts dosyalarından FontFace ile yükleniyor. Yeni bağımlılık
  // yok. Paylaşma eylemi yine kullanıcının elinde: navigator.share({files})
  // varsa işletim sisteminin paylaşım sayfası, yoksa indirme.
  const KART_SERIF = '"Dost Kart Serif", "Fraunces Dost", Georgia, serif';
  const KART_SANS = '"Dost Kart Sans", "Source Sans Dost", system-ui, sans-serif';
  let kartFontSozu = null;
  function kartFontlari() {
    if (kartFontSozu) return kartFontSozu;
    if (!window.FontFace || !document.fonts) return (kartFontSozu = Promise.resolve(false));
    let taban;
    try { taban = new URL("assets/fonts/", document.baseURI).href; } catch (e) { taban = "assets/fonts/"; }
    const tanim = [
      ["Dost Kart Serif", "Fraunces-Regular-static.woff2", { weight: "400" }],
      ["Dost Kart Serif", "Fraunces-SemiBold-static.woff2", { weight: "600" }],
      ["Dost Kart Serif", "Fraunces-Italic-static.woff2", { weight: "400", style: "italic" }],
      ["Dost Kart Sans", "SourceSans3-Regular-static.woff2", { weight: "400" }],
      ["Dost Kart Sans", "SourceSans3-SemiBold-static.woff2", { weight: "600" }],
    ];
    kartFontSozu = Promise.all(tanim.map((t) => {
      try {
        const ff = new FontFace(t[0], "url(" + taban + t[1] + ")", t[2]);
        return ff.load().then((f) => { document.fonts.add(f); return true; }, () => false);
      } catch (e) { return Promise.resolve(false); }
    })).then((r) => r.every(Boolean));
    return kartFontSozu;
  }
  function paletOf(acik) {
    return acik
      ? { bg0: "#fdfcf8", bg1: "#eae7dc", ink: "#8a6100", hale: "#d99a12", metin: "#1a1a19", vurgu: "#8a6100", perde: "#fbfaf6" }
      : { bg0: "#12161f", bg1: "#05060a", ink: "#eda100", hale: "#ffc44d", metin: "#f4f1ea", vurgu: "#ffc44d", perde: "#05060a" };
  }
  function renkAlfa(c, a) {
    let r = 0, g = 0, b = 0;
    if (c && c[0] === "#") { const x = hexRgb(c); r = x[0]; g = x[1]; b = x[2]; }
    else { const m = String(c || "").match(/\d+/g) || [0, 0, 0]; r = +m[0]; g = +m[1]; b = +m[2]; }
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }
  function daire(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); }
  function yuvarlakKutu(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  // Sahnedeki sarmalın durağan bir karesi (yaw 0): aynı geometri, aynı
  // renk kuralı (dotFill/haleFill), Zât ucu ışımasız bir boşluk.
  function ambientCiz(ctx, W, H, z, pal) {
    const k = Math.min(W, H) / 506;
    const tl = GU.createTilt ? GU.createTilt({ pitch: 0.20, spinRate: 0 }) : null;
    if (tl) tl.set(1, true);
    const cx = W / 2, cy = H * 0.5;
    const R = Math.min(W, H) * z.yari, HH = R * z.yuk;
    const pts = [];
    for (let i = 0; i < z.n; i++) {
      const t = i / Math.max(1, z.n - 1);
      const a = -Math.PI / 2 + t * Math.PI * 2 * z.tur;
      const adim = z.halka ? Math.floor(t * z.halka) / Math.max(1, z.halka - 1) : t;
      const rr = R * (0.72 + z.ac * adim);
      const p = tl ? tl.project(rr * Math.cos(a), rr * Math.sin(a), -HH / 2 + HH * t) : { x: rr * Math.cos(a), y: rr * Math.sin(a), depth: 1 };
      pts.push({ x: cx + p.x, y: cy + p.y, depth: p.depth == null ? 1 : p.depth });
    }
    const hc = haleFill(z) || pal.hale;
    const hr = R * z.hale * 1.3 + 36 * k;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr);
    g.addColorStop(0, renkAlfa(hc, 0.26));
    g.addColorStop(1, renkAlfa(hc, 0));
    ctx.fillStyle = g; daire(ctx, cx, cy, hr); ctx.fill();
    if (!z.cizgisiz) {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.strokeStyle = renkAlfa(pal.ink, 0.26);
      ctx.lineWidth = 1.5 * k;
      ctx.stroke();
    }
    pts.forEach((p, i) => {
      if (!i) return;
      ctx.fillStyle = renkAlfa(dotFill(z, i) || pal.ink, 0.30 + 0.42 * p.depth);
      daire(ctx, p.x, p.y, z.nokta * p.depth * k); ctx.fill();
    });
    const p0 = pts[0];
    if (p0) {
      daire(ctx, p0.x, p0.y, z.nokta * p0.depth * 2.6 * k);
      ctx.fillStyle = pal.perde; ctx.fill();
      ctx.strokeStyle = renkAlfa(pal.ink, 0.35); ctx.lineWidth = 1.2 * k; ctx.stroke();
    }
  }
  function sar(ctx, text, maxW) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const out = [];
    let cur = "";
    words.forEach((w) => {
      const t = cur ? cur + " " + w : w;
      if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
    });
    if (cur) out.push(cur);
    return out;
  }
  function satirStil(kind, ikincil, base, tpl) {
    const px = (f) => Math.round(base * f);
    if (ikincil) return { px: px(0.8), font: "italic 400 " + px(0.8) + "px " + KART_SERIF, renk: "metin", alfa: 0.78 };
    if (kind === "soru") return { px: px(1.12), font: "600 " + px(1.12) + "px " + KART_SERIF, renk: "vurgu", alfa: 1 };
    if (kind === "baslik") return { px: px(1), font: "600 " + px(1) + "px " + KART_SERIF, renk: "vurgu", alfa: 1 };
    if (tpl === "siir") return { px: px(1), font: "italic 400 " + px(1) + "px " + KART_SERIF, renk: "metin", alfa: 1 };
    return { px: px(1), font: "400 " + px(1) + "px " + KART_SERIF, renk: "metin", alfa: 1 };
  }
  function kartPlani(ctx, s, base, maxW, W) {
    const ops = [];
    let h = 0;
    const ekle = (o) => { ops.push(o); h += (o.once || 0) + (o.cizgi ? o.h : o.satirlar.length * o.lh); };
    s.lines.forEach((l, i) => {
      if (s.tpl === "ikili" && i === 1) ekle({ cizgi: true, h: Math.round(base * 0.6), once: Math.round(base * 0.45) });
      const st = satirStil(l.kind, false, base, s.tpl);
      ctx.font = st.font;
      ekle({ font: st.font, renk: st.renk, alfa: st.alfa, lh: Math.round(st.px * 1.32), satirlar: sar(ctx, plainText(l.text), maxW), once: i ? Math.round(base * 0.7) : 0 });
      if (l.text2) {
        const s2 = satirStil(l.kind, true, base, s.tpl);
        ctx.font = s2.font;
        ekle({ font: s2.font, renk: s2.renk, alfa: s2.alfa, lh: Math.round(s2.px * 1.32), satirlar: sar(ctx, plainText(l.text2), maxW), once: Math.round(base * 0.22) });
      }
    });
    const f = Math.round(Math.max(W * 0.02, base * 0.5));
    const sesFont = "600 " + f + "px " + KART_SANS;
    const ses = disaAktarilabilir(s) ? sesEtiket(s).toLocaleUpperCase(s.lang === "tr" ? "tr-TR" : undefined) : "";
    if (ses) ekle({ font: sesFont, renk: "vurgu", alfa: 1, lh: Math.round(f * 1.4), satirlar: [ses], once: Math.round(base * 1.1), aralik: true });
    ctx.font = "400 " + f + "px " + KART_SANS;
    ekle({ font: "400 " + f + "px " + KART_SANS, renk: "metin", alfa: 0.8, lh: Math.round(f * 1.38), satirlar: sar(ctx, s.kunye || tt(UI.kunyeYok), maxW), once: ses ? Math.round(f * 0.15) : Math.round(base * 1.1) });
    if (s.url) {
      ctx.font = "600 " + f + "px " + KART_SANS;
      ekle({ font: "600 " + f + "px " + KART_SANS, renk: "metin", alfa: 0.95, lh: Math.round(f * 1.38), satirlar: sar(ctx, adresKisa(s), maxW), once: Math.round(f * 0.25) });
    }
    return { ops: ops, h: h };
  }
  function kartCiz(ctx, W, H, s, ayar) {
    const pal = paletOf(ayar.acik);
    const bg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.72);
    bg.addColorStop(0, pal.bg0);
    bg.addColorStop(1, pal.bg1);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ambientCiz(ctx, W, H, ayar.zemin, pal);
    const pad = Math.round(W * 0.05), boxX = Math.round(W * 0.07), boxW = Math.round(W * 0.86);
    const maxW = boxW - 2 * pad;
    const maxH = (ayar.kare ? H * 0.86 : H * 0.72) - 2 * pad;
    let base = W * 0.06, plan = null;
    for (let i = 0; i < 30; i++) {
      plan = kartPlani(ctx, s, base, maxW, W);
      if (plan.h <= maxH || base < W * 0.018) break;
      base *= 0.94;
    }
    const boxH = plan.h + 2 * pad;
    const cy = ayar.kare ? H * 0.5 : H * 0.48;
    let y = Math.max(W * 0.03, cy - boxH / 2);
    // Okunurluk için yarı saydam zemin -- bulanıklık (blur) DEĞİL: sitenin
    // görsel dilinde bulanıklık "bilgisizlik" demek (GORSEL_DIL).
    ctx.fillStyle = renkAlfa(pal.perde, ayar.acik ? 0.84 : 0.8);
    yuvarlakKutu(ctx, boxX, y, boxW, boxH, Math.round(W * 0.03));
    ctx.fill();
    y += pad;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    plan.ops.forEach((op) => {
      y += op.once || 0;
      if (op.cizgi) {
        ctx.fillStyle = renkAlfa(pal.metin, 0.45);
        ctx.fillRect(boxX + pad, y + op.h / 2, maxW * 0.5, Math.max(1, Math.round(W / 700)));
        y += op.h;
        return;
      }
      ctx.font = op.font;
      ctx.fillStyle = renkAlfa(pal[op.renk], op.alfa);
      const ls = ("letterSpacing" in ctx) && op.aralik;
      if (ls) ctx.letterSpacing = "0.08em";
      op.satirlar.forEach((t) => { ctx.fillText(t, boxX + pad, y); y += op.lh; });
      if (ls) ctx.letterSpacing = "0px";
    });
  }
  function ayarSimdi() { return { acik: acikMod, kare: kareMod, zemin: zemin() }; }
  function kartBlob(s, ayar) {
    ayar = ayar || ayarSimdi();
    return kartFontlari().then(() => new Promise((res) => {
      const W = 1080, H = ayar.kare ? 1080 : 1920;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      try { kartCiz(c.getContext("2d"), W, H, s, ayar); } catch (e) { res(null); return; }
      if (c.toBlob) c.toBlob((b) => res(b), "image/png"); else res(null);
    }));
  }
  function dosyaAdi(s, ext) {
    const slug = String(s.url || "").replace(/^\/+/, "").replace(/[^\w-]+/g, "-") || s.tpl;
    return "dost-" + slug + "-" + s.lang + (s.lang2 ? "-" + s.lang2 : "") + "." + ext;
  }

  // Tek ya da çok dosyayı işletim sisteminin paylaşım sayfasına verir;
  // desteklenmiyorsa indirir. Kullanıcı paylaşımı iptal ederse (AbortError)
  // indirmeyi dayatmaz. "paylasildi" | "indirildi" | null döner.
  function paylasVeyaIndir(items) {
    let files = null;
    try { files = items.map((x) => new File([x.blob], x.name, { type: x.mime })); } catch (e) { files = null; }
    const indir = () => {
      items.forEach((x, i) => setTimeout(() => downloadBlob(x.blob, x.name), i * 450));
      return "indirildi";
    };
    if (files && navigator.canShare && navigator.share) {
      let ok = false;
      try { ok = navigator.canShare({ files: files }); } catch (e) { ok = false; }
      if (ok) {
        return navigator.share({ files: files }).then(() => "paylasildi",
          (e) => ((e && e.name === "AbortError") ? null : indir()));
      }
    }
    return Promise.resolve(indir());
  }

  // Kart ve üç dilli paket sahne açılır açılmaz arka planda hazırlanıyor:
  // iOS Safari navigator.share'i yalnız kullanıcının dokunuşuna yakın
  // kabul ediyor, dokunuştan sonra font yükleyip tuval çizmek o pencereyi
  // kaçırabilirdi.
  let kartOnbellek = null, paketOnbellek = null;
  function onbellekSifirla() { kartOnbellek = null; paketOnbellek = null; }
  function kartHazirla() {
    if (!scene || !disaAktarilabilir(scene)) return Promise.resolve(null);
    if (!kartOnbellek) kartOnbellek = kartBlob(scene);
    return kartOnbellek;
  }
  function paketHazirla() {
    if (!scene || !scene.ref || !disaAktarilabilir(scene)) return Promise.resolve(null);
    if (!paketOnbellek) {
      const ref = scene.ref, ayar = ayarSimdi();
      paketOnbellek = Promise.all(DIL_LANGS.map((l) => renderRef(ref, l))).then((sahneler) => {
        const eksik = [];
        const hazir = [];
        sahneler.forEach((s, i) => { if (s) hazir.push(s); else eksik.push(DIL_ETIKET[DIL_LANGS[i]] || DIL_LANGS[i]); });
        return Promise.all(hazir.map((s) => kartBlob(s, ayar).then((b) => (b ? { blob: b, name: dosyaAdi(s, "png"), mime: "image/png", lang: s.lang } : null))))
          .then((items) => ({ items: items.filter(Boolean), eksik: eksik }));
      });
    }
    return paketOnbellek;
  }
  function durumGoster(text, ms) {
    recStatus(text, false);
    if (ms) setTimeout(() => recStatus("", false), ms);
  }
  function kartPaylas() {
    if (!scene || !disaAktarilabilir(scene) || recording) { durumGoster(tt(UI.kunyeYok), 5000); return; }
    const s = scene;
    durumGoster(tt(UI.kartWait));
    kartHazirla().then((blob) => {
      if (!blob) { durumGoster(tt(UI.kartFail), 4000); return null; }
      return paylasVeyaIndir([{ blob: blob, name: dosyaAdi(s, "png"), mime: "image/png" }]).then((yol) => {
        if (yol) { gunlukEkle(s, "png", yol); durumGoster(tt(UI.kartHazir) + " · png", 3000); }
        else durumGoster("", 0);
      });
    });
  }
  function paketPaylas() {
    if (!scene || !scene.ref || !disaAktarilabilir(scene)) { durumGoster(tt(UI.kunyeYok), 5000); return; }
    const s = scene;
    durumGoster(tt(UI.kartWait));
    paketHazirla().then((p) => {
      if (!p || !p.items.length) { durumGoster(tt(UI.kartFail), 4000); return null; }
      return paylasVeyaIndir(p.items).then((yol) => {
        if (yol) gunlukEkle(s, "paket", yol, p.items.map((x) => x.lang));
        if (p.eksik.length) durumGoster(tt(UI.paketEksik) + p.eksik.join(", "), 7000);
        else if (yol) durumGoster(tt(UI.kartHazir) + " · " + p.items.length + " png", 3000);
        else durumGoster("", 0);
      });
    });
  }

  // Ürün denetimi D1 (2026-09-02): ortak yardımcıya taşındı, bkz.
  // graph-utils.js:escapeHtml.
  const escapeHtml = GU.escapeHtml;

  // Kartın satırlarını düz metne çevirir -- YENİ cümle yazmaz: sahnedeki
  // satırlar + ses etiketi + künye + kaydın tam adresi.
  function sceneText(s) {
    const out = [];
    (s.lines || []).forEach((l) => {
      out.push(plainText(l.text));
      if (l.text2) out.push(plainText(l.text2));
    });
    return out.join("\n") + "\n\n— " + sesEtiket(s) + " · " + s.kunye + "\n" + adresTam(s);
  }
  function copyText() {
    if (!scene) return;
    if (!disaAktarilabilir(scene)) { durumGoster(tt(UI.kunyeYok), 5000); return; }
    const s = scene;
    const text = sceneText(s);
    const fail = () => durumGoster(tt(UI.kopyalaFail), 4000);
    if (!(navigator.clipboard && navigator.clipboard.writeText)) { fail(); return; }
    navigator.clipboard.writeText(text).then(() => {
      gunlukEkle(s, "metin", "pano");
      durumGoster(tt(UI.kopyalandi), 2500);
    }, fail);
  }

  function openStage(s) {
    // Favori/geçmişten açılan sahne kendi zemin/açık-koyu/kare ayarlarını
    // taşıyorsa geri uygulanır (bkz. snapshotSettings).
    applySceneSettings(s);
    scene = s;
    scene._timing = computeTiming(s);
    onbellekSifirla();
    if (disaAktarilabilir(s)) tarihEkle(s);
    closeStage();
    stageEl = document.createElement("div");
    stageEl.className = "share-stage" + (acikMod ? " share-stage--acik" : "") + (kareMod ? " share-stage--kare" : "");
    stageEl.setAttribute("role", "dialog");
    stageEl.setAttribute("aria-modal", "true");
    stageEl.setAttribute("aria-label", tt(UI.title));
    stageEl.innerHTML = stageMarkup(s);
    document.body.appendChild(stageEl);
    document.body.classList.add("share-stage-open");
    cacheFrame = stageEl.querySelector(".share-stage__frame");
    cacheSvg = stageEl.querySelector(".share-stage__svg");
    cacheSpiral = cacheSvg.querySelector(".share-spiral");
    cacheHalo = cacheSvg.querySelector(".share-halo");
    cacheZatHalo = cacheSvg.querySelector(".share-zat-halo");
    cacheDots = cacheSvg.querySelectorAll(".share-dot");
    cacheLines = stageEl.querySelectorAll(".share-line");
    cacheRule = stageEl.querySelector(".share-rule");

    tilt = GU.createTilt ? GU.createTilt({ pitch: 0.20, spinRate: 0.000035 }) : null;
    if (tilt) tilt.set(1, true);
    startTs = 0;
    rafId = requestAnimationFrame(frame);

    if ((s.tpl === "fusus" || s.tpl === "miskat") && s.helix && window.DostHelix) {
      const helixEl = stageEl.querySelector(".share-stage__helix");
      if (helixEl) {
        helixHandle = window.DostHelix.mount(helixEl, {
          id: "share-" + s.tpl,
          nodes: s.helix.nodes,
          turns: 2.4,
          closing: false,
          hRatio: 1.05,
          maxH: 620,
          numbered: false,
          // Mişkât'ın 101 düğümü hepsi "active" -- "sparse" burada "hepsi"
          // anlamına gelip üst üste binerdi; Füsûs'ta "metinsiz" anahtarı.
          labelMode: s.tpl === "miskat" ? "none" : (metinsizMod ? "none" : "sparse"),
          initialFocus: s.helix.initialFocus,
          // Sahne yalnız dekoratif -- düğüme tıklama bir panel açmasın.
          onActivate: function () {},
        });
      }
    }

    const chrome = stageEl.querySelector(".share-stage__chrome");
    // Krom yalnızca ÇERÇEVENİN İÇİNE düştüğünde (telefon) kendiliğinden
    // soluyor -- ekran kaydında düğmeler görünmesin diye.
    const fr = stageEl.querySelector(".share-stage__frame").getBoundingClientRect();
    const cr = chrome.getBoundingClientRect();
    const kromCerceveninIcinde = cr.left < fr.right - 1 && cr.right > fr.left + 1;
    if (kromCerceveninIcinde) {
      const fade = () => chrome.classList.add("is-dim");
      chromeTimer = setTimeout(fade, 2600);
      stageEl.addEventListener("pointerdown", () => {
        chrome.classList.remove("is-dim");
        clearTimeout(chromeTimer);
        chromeTimer = setTimeout(fade, 2600);
      });
      // Klavye karşılığı: krom içinde odak varken solmasın.
      chrome.addEventListener("focusin", () => { chrome.classList.remove("is-dim"); clearTimeout(chromeTimer); });
    }
    const stageCloseBtn = stageEl.querySelector('[data-action="close"]');
    stageCloseBtn.addEventListener("click", () => { closeStage(); odakPanele(); });
    stageCloseBtn.focus();
    stageEl.querySelector('[data-action="guides"]').addEventListener("click", () => {
      const g = stageEl.querySelector(".share-stage__guides");
      g.hidden = !g.hidden;
    });
    stageEl.querySelector('[data-action="kopyala"]').addEventListener("click", copyText);
    stageEl.querySelector('[data-action="kart"]').addEventListener("click", kartPaylas);
    stageEl.querySelector('[data-action="paket"]').addEventListener("click", paketPaylas);
    const recBtn = stageEl.querySelector('[data-action="rec"]');
    if (recBtn) recBtn.addEventListener("click", recordToFile);
    const recYokBtn = stageEl.querySelector('[data-action="recyok"]');
    if (recYokBtn) {
      recYokBtn.addEventListener("click", () => {
        durumGoster(tt(UI.recYok), 0);
        chrome.classList.remove("is-dim");
        clearTimeout(chromeTimer);
      });
    }
    // Kartı ve paketi önceden hazırla (bkz. kartHazirla).
    if (disaAktarilabilir(s)) {
      kartFontlari().then(() => {
        if (scene !== s) return;
        kartHazirla();
        if (s.ref) paketHazirla();
      });
    }
  }

  function closeStage() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    if (chromeTimer) { clearTimeout(chromeTimer); chromeTimer = 0; }
    if (helixHandle) { helixHandle.destroy(); helixHandle = null; }
    if (stageEl) { stageEl.remove(); stageEl = null; }
    cacheFrame = cacheSvg = cacheSpiral = cacheHalo = cacheZatHalo = cacheDots = cacheLines = cacheRule = null;
    document.body.classList.remove("share-stage-open");
  }
  function odakPanele() {
    if (!panel) return;
    const b = panel.querySelector(".share-panel__cand.is-secili .share-panel__cand-open") || panel.querySelector('[data-action="quit"]');
    if (b) b.focus();
  }

  // --- favori ve geçmiş ----------------------------------------------------
  // Sahnenin satırları, künyesi, ref'i ve o anki görsel ayarları birlikte
  // saklanır. Künyesi olmayan eski kayıtlar listede kalır ama açıldığında
  // dışa aktarılamaz (sahnede açıkça söylenir).
  function snapshotSettings(s) {
    const o = Object.assign({}, s, { _zemin: zeminId, _isik: acikMod, _kare: kareMod });
    delete o._timing;
    return o;
  }
  function applySceneSettings(s) {
    if (s._zemin != null && s._zemin !== zeminId) { zeminId = s._zemin; safeSet(ZEMIN_ANAHTAR, zeminId); }
    if (s._isik != null && s._isik !== acikMod) { acikMod = s._isik; safeSet(ISIK_ANAHTAR, acikMod ? "1" : "0"); }
    if (s._kare != null && s._kare !== kareMod) { kareMod = s._kare; safeSet(KARE_ANAHTAR, kareMod ? "1" : "0"); }
  }
  function sahneAnahtari(s) { return s.ref ? refKey(s.ref) + "|" + (s.lang || "") + "|" + (s.lang2 || "") : (s.lines && s.lines[0] ? s.lines[0].text : ""); }
  function listeOku(k) {
    try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v.filter((x) => x && x.lines && x.lines.length) : []; } catch (e) { return []; }
  }
  function favLoad() { return listeOku(FAV_ANAHTAR); }
  function favSave(list) { safeSet(FAV_ANAHTAR, JSON.stringify(list)); }
  function favAdd(s) {
    const list = favLoad();
    const key = sahneAnahtari(s);
    if (list.some((x) => sahneAnahtari(x) === key)) return;
    list.unshift(snapshotSettings(s));
    if (list.length > MAX_FAV) list.length = MAX_FAV;
    favSave(list);
  }
  function favRemove(idx) {
    const list = favLoad();
    list.splice(idx, 1);
    favSave(list);
  }
  function tarihLoad() { return listeOku(TARIH_ANAHTAR); }
  function tarihEkle(s) {
    const list = tarihLoad();
    const key = sahneAnahtari(s);
    const i = list.findIndex((x) => sahneAnahtari(x) === key);
    if (i !== -1) list.splice(i, 1);
    list.unshift(snapshotSettings(s));
    if (list.length > MAX_TARIH) list.length = MAX_TARIH;
    safeSet(TARIH_ANAHTAR, JSON.stringify(list));
  }

  // --- paylaşım günlüğü ---------------------------------------------------
  // Hangi kaydı, hangi dilde, ne zaman, ne olarak (kart / üç dilli paket /
  // metin / video) dışa verdiğin -- yalnız bu tarayıcıda (localStorage),
  // hiçbir yere gönderilmez; JSON olarak dışa aktarılabilir. Aynı kaydı
  // tekrar paylaşmadan önce bakılabilsin diye.
  const GUNLUK_ANAHTAR = "dost-share-gunluk";
  const MAX_GUNLUK = 500;
  function gunlukLoad() {
    try { const v = JSON.parse(localStorage.getItem(GUNLUK_ANAHTAR) || "[]"); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }
  function gunlukEkle(s, eylem, yol, diller) {
    const list = gunlukLoad();
    list.unshift({
      kayit: s.url || "",
      adres: adresTam(s),
      sablon: s.tpl,
      ad: plainText(s.ad || ""),
      dil: diller || [s.lang].concat(s.lang2 ? [s.lang2] : []),
      eylem: eylem,
      yol: yol || "",
      tarih: new Date().toISOString(),
    });
    if (list.length > MAX_GUNLUK) list.length = MAX_GUNLUK;
    safeSet(GUNLUK_ANAHTAR, JSON.stringify(list));
    renderGunluk();
  }
  function gunlukDisaAktar() {
    const veri = { kaynak: SITE, surum: 1, uretildi: new Date().toISOString(), kayitlar: gunlukLoad() };
    downloadBlob(new Blob([JSON.stringify(veri, null, 2)], { type: "application/json" }),
      "dost-paylasim-gunlugu-" + new Date().toISOString().slice(0, 10) + ".json");
  }
  function renderGunluk() {
    if (!panel) return;
    const box = panel.querySelector(".share-panel__gunluk");
    const sum = panel.querySelector(".share-panel__gunluk-sayi");
    if (!box) return;
    const list = gunlukLoad();
    if (sum) sum.textContent = list.length ? " (" + list.length + ")" : "";
    const satirlar = list.slice(0, 8).map((g) => (
      '<li><span class="share-panel__gunluk-tarih">' + escapeHtml(String(g.tarih || "").slice(0, 10)) + "</span> " +
      escapeHtml((g.dil || []).map((l) => (DIL_ETIKET[l] || l)).join("+")) + " · " +
      escapeHtml(tt((UI.eylem[g.eylem] || {}))) + " · " +
      '<span class="share-panel__gunluk-ad">' + escapeHtml(g.ad || g.kayit || "") + "</span></li>"
    )).join("");
    box.innerHTML = (list.length
      ? '<ul class="share-panel__gunluk-liste">' + satirlar + "</ul>"
      : '<p class="share-panel__cand-empty">' + escapeHtml(tt(UI.gunlukBos)) + "</p>") +
      '<div class="share-panel__gunluk-btns">' +
      '<button type="button" data-action="gunluk-disa"' + (list.length ? "" : " disabled") + ">" + escapeHtml(tt(UI.gunlukDisa)) + "</button>" +
      '<button type="button" data-action="gunluk-sil"' + (list.length ? "" : " disabled") + ">" + escapeHtml(tt(UI.gunlukSil)) + "</button>" +
      "</div>";
    box.querySelector('[data-action="gunluk-disa"]').addEventListener("click", gunlukDisaAktar);
    box.querySelector('[data-action="gunluk-sil"]').addEventListener("click", () => {
      if (!window.confirm(tt(UI.gunlukSilOnay))) return;
      safeSet(GUNLUK_ANAHTAR, "[]");
      renderGunluk();
    });
  }

  // --- panel -----------------------------------------------------------
  // Mobilde önce sonuç: adaylar ve canlı mini önizleme en üstte; şablonlar
  // tek satırlık kayan bir şerit; görsel ayarlar (dil, zemin, açık/kare,
  // iki dilli) katlanır "Görünüm" bölümünde. Masaüstünde iki sütun: solda
  // kurulum, sağda sonuç.
  let panel = null, currentTpl = "soz", candidates = [], seciliAday = 0, baglam = null, opener = null, gorunumAcik = null;

  function candidateSnippet(s) {
    const parcalar = (s.lines || []).map((l) => plainText(l.text)).filter(Boolean);
    const full = parcalar.join(s.tpl === "hikaye" ? "  →  " : "  ·  ");
    if (full.length <= 150) return full;
    const cut = full.lastIndexOf(" ", 150);
    return full.slice(0, cut > 0 ? cut : 150) + "…";
  }
  function adayKunyeMetni(s) {
    return disaAktarilabilir(s) ? sesEtiket(s) + " · " + s.kunye : tt(UI.kunyeYok);
  }

  function onizlemeCiz() {
    if (!panel) return;
    const fig = panel.querySelector(".share-panel__onizleme");
    if (!fig) return;
    const s = candidates[seciliAday];
    if (!s) { fig.hidden = true; return; }
    fig.hidden = false;
    const c = fig.querySelector("canvas");
    const W = 360, H = kareMod ? 360 : 640;
    c.width = W; c.height = H;
    c.classList.toggle("is-kare", kareMod);
    c.setAttribute("aria-label", tt(UI.onizleme) + ": " + candidateSnippet(s) + " — " + adayKunyeMetni(s));
    const ayar = ayarSimdi();
    kartFontlari().then(() => {
      if (!panel || candidates[seciliAday] !== s) return;
      try { kartCiz(c.getContext("2d"), W, H, s, ayar); } catch (e) { /* önizleme isteğe bağlı */ }
    });
  }

  function adaySatiri(s, i, tur) {
    const secili = tur === "aday" && i === seciliAday;
    const metin = escapeHtml(candidateSnippet(s));
    const kunye = '<span class="share-panel__cand-kunye">' + escapeHtml(adayKunyeMetni(s)) + "</span>";
    const govdeHtml = tur === "aday"
      ? '<button type="button" class="share-panel__cand-text" data-action="sec" data-ci="' + i + '" aria-pressed="' + secili + '" title="' + escapeHtml(tt(UI.secThis)) + '">' + metin + kunye + "</button>"
      : '<span class="share-panel__cand-text">' + metin + kunye + "</span>";
    let btns = "";
    if (tur === "aday") {
      btns = '<button type="button" class="share-panel__cand-fav" data-action="fav-add" data-ci="' + i + '" title="' + escapeHtml(tt(UI.favAddLbl)) + '" aria-label="' + escapeHtml(tt(UI.favAddLbl)) + '">' + escapeHtml(tt(UI.favAdd)) + "</button>" +
        '<button type="button" class="share-panel__go share-panel__cand-open" data-action="open-cand" data-ci="' + i + '">' + escapeHtml(tt(UI.openThis)) + "</button>";
    } else if (tur === "fav") {
      btns = '<button type="button" class="share-panel__cand-fav" data-action="fav-rm" data-fi="' + i + '" title="' + escapeHtml(tt(UI.favRemoveLbl)) + '" aria-label="' + escapeHtml(tt(UI.favRemoveLbl)) + '">' + escapeHtml(tt(UI.favRemove)) + "</button>" +
        '<button type="button" class="share-panel__go share-panel__cand-open" data-action="open-fav" data-fi="' + i + '">' + escapeHtml(tt(UI.openThis)) + "</button>";
    } else {
      btns = '<button type="button" class="share-panel__go share-panel__cand-open" data-action="open-hist" data-hi="' + i + '">' + escapeHtml(tt(UI.openThis)) + "</button>";
    }
    return '<div class="share-panel__cand' + (secili ? " is-secili" : "") + '">' + govdeHtml + '<div class="share-panel__cand-btns">' + btns + "</div></div>";
  }

  function renderCandidateList(bosMesaj) {
    if (!panel) return;
    const box = panel.querySelector(".share-panel__candidates");
    if (!box) return;
    if (!candidates.length) {
      box.innerHTML = '<p class="share-panel__cand-empty">' + escapeHtml(bosMesaj || tt(UI.loading)) + "</p>";
      onizlemeCiz();
      return;
    }
    const havuzHint = !baglam && typeof candidates[0].havuz === "number"
      ? '<p class="share-panel__havuz">' + escapeHtml(havuzText(candidates[0].havuz)) + "</p>"
      : "";
    box.innerHTML = havuzHint + candidates.map((s, i) => adaySatiri(s, i, "aday")).join("");
    box.querySelectorAll("[data-action='sec']").forEach((b) => {
      b.addEventListener("click", () => {
        seciliAday = parseInt(b.dataset.ci, 10) || 0;
        renderCandidateList();
        const yeni = panel && panel.querySelector('[data-action="sec"][data-ci="' + seciliAday + '"]');
        if (yeni) yeni.focus();
      });
    });
    box.querySelectorAll("[data-action='fav-add']").forEach((b) => {
      b.addEventListener("click", () => {
        const i = parseInt(b.dataset.ci, 10);
        if (candidates[i]) { favAdd(candidates[i]); renderSavedLists(); }
      });
    });
    box.querySelectorAll("[data-action='open-cand']").forEach((b) => {
      b.addEventListener("click", () => {
        const i = parseInt(b.dataset.ci, 10);
        if (candidates[i]) { seciliAday = i; openStage(candidates[i]); }
      });
    });
    onizlemeCiz();
    const adEl = panel.querySelector(".share-panel__baglam-ad");
    if (adEl && baglam && !baglam.yok) adEl.textContent = plainText(candidates[0].ad || "");
  }

  function renderSavedLists() {
    if (!panel) return;
    const favBox = panel.querySelector(".share-panel__favlist");
    const favSum = panel.querySelector(".share-panel__fav-sayi");
    if (favBox) {
      const list = favLoad();
      if (favSum) favSum.textContent = list.length ? " (" + list.length + ")" : "";
      favBox.innerHTML = list.length
        ? list.map((s, i) => adaySatiri(s, i, "fav")).join("")
        : '<p class="share-panel__cand-empty">' + escapeHtml(tt(UI.favEmpty)) + "</p>";
      favBox.querySelectorAll("[data-action='fav-rm']").forEach((b) => {
        b.addEventListener("click", () => { favRemove(parseInt(b.dataset.fi, 10)); renderSavedLists(); });
      });
      favBox.querySelectorAll("[data-action='open-fav']").forEach((b) => {
        b.addEventListener("click", () => { const s = favLoad()[parseInt(b.dataset.fi, 10)]; if (s) openStage(s); });
      });
    }
    const histBox = panel.querySelector(".share-panel__histlist");
    if (histBox) {
      const list = tarihLoad();
      histBox.innerHTML = list.map((s, i) => adaySatiri(s, i, "hist")).join("");
      histBox.querySelectorAll("[data-action='open-hist']").forEach((b) => {
        b.addEventListener("click", () => { const s = tarihLoad()[parseInt(b.dataset.hi, 10)]; if (s) openStage(s); });
      });
    }
  }

  // Adayları sırayla dener: aynı ref'i (ve aynı ilk satırı) iki kez almaz,
  // N tekil sahneye ulaşınca durur.
  function topla(uretecler, N) {
    const out = [], gorulen = new Set(), metinler = new Set();
    let i = 0;
    function adim() {
      if (out.length >= N || i >= uretecler.length) return Promise.resolve(out);
      const u = uretecler[i++];
      return Promise.resolve().then(u).then((r) => {
        if (!r || !r.ref) return null;
        const key = refKey(r.ref);
        if (gorulen.has(key)) return null;
        gorulen.add(key);
        return sahneKur(r.ref).then((s) => {
          if (!s) return;
          const m = s.lines.map((x) => x.text).join("|");
          if (metinler.has(m)) return;
          metinler.add(m);
          if (r.havuz) s.havuz = r.havuz;
          out.push(s);
        });
      }).catch(() => null).then(adim);
    }
    return adim();
  }

  // Panel açılışında, dil/şablon/filtre değişiminde çağrılır -- yalnız EN
  // SON çağrının sonucu uygulanır (hızlı tıklamada eski sonuç sızmasın).
  let refreshSeq = 0;
  function refresh() {
    candidates = [];
    seciliAday = 0;
    renderCandidateList();
    const seq = ++refreshSeq;
    if (baglam && baglam.bekliyor) return;
    let is;
    if (baglam && baglam.refs) {
      const refs = baglam.karisik ? shuffled(baglam.refs) : baglam.refs.slice();
      is = topla(refs.map((r) => () => ({ ref: r })), 3);
    } else {
      // "Günün Sözü" gün-endeksli: herkese aynı kayıt -- tek aday yeter.
      const N = currentTpl === "gunun" ? 1 : 3;
      const sec = SEC[currentTpl];
      const denemeler = [];
      for (let i = 0; i < N * 4; i++) denemeler.push(() => (sec ? sec() : null));
      is = topla(denemeler, N);
    }
    is.then((list) => {
      if (!panel || seq !== refreshSeq) return;
      candidates = list;
      if (!candidates.length) {
        renderCandidateList(!baglam && currentTpl === "ozelgun" ? ozelgunEmptyText() : tt(UI.none));
        return;
      }
      renderCandidateList();
    });
  }

  function yenidenKur(focusAfter) {
    const old = panel;
    buildPanel(focusAfter);
    if (old) old.remove();
  }

  // `focusAfter`: panel bir iç seçimle (şablon/dil/iki dilli) yeniden
  // kurulduğunda odak o seçimi yapan denetime döner; yalnız ilk açılışta
  // kapat düğmesine gider (2026-09-13 tespiti: habersiz odak sıçraması).
  function buildPanel(focusAfter) {
    teardownZeminPreview();
    panel = document.createElement("div");
    panel.className = "share-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", tt(UI.title));
    document.body.classList.add("share-panel-open");

    const chips = Object.keys(UI.tpl).map(function (k) {
      const on = !baglam && k === currentTpl;
      return '<button type="button" class="share-panel__chip share-panel__chip--tpl' + (on ? " is-on" : "") +
        '" data-tpl="' + k + '" aria-pressed="' + on + '">' + tplThumbSvg(k) +
        "<span>" + escapeHtml(tt(UI.tpl[k])) + "</span></button>";
    }).join("");
    const dilChips = DIL_LANGS.map(function (l) {
      return '<button type="button" class="share-panel__chip share-panel__chip--sm' +
        (l === shareLangId ? " is-on" : "") + '" data-dil="' + l + '" aria-pressed="' + (l === shareLangId) + '">' +
        escapeHtml(DIL_ETIKET[l] || l.toUpperCase()) + "</button>";
    }).join("");
    const ikinciDilChips = DIL_LANGS.map(function (l) {
      return '<button type="button" class="share-panel__chip share-panel__chip--sm' +
        (l === ikinciDilId ? " is-on" : "") + '" data-ikincidil="' + l + '" aria-pressed="' + (l === ikinciDilId) + '">' +
        escapeHtml(DIL_ETIKET[l] || l.toUpperCase()) + "</button>";
    }).join("");
    const zeminChips = ZEMIN.map(function (z) {
      return '<button type="button" class="share-panel__chip share-panel__chip--sm share-panel__chip--zemin' +
        (z.id === zeminId ? " is-on" : "") + '" data-zemin="' + z.id + '" aria-pressed="' + (z.id === zeminId) + '">' +
        zeminThumbSvg(z) + "<span>" + escapeHtml(tt(z.ad)) + "</span></button>";
    }).join("");

    // Filtre satırı yalnız Fütûhât kısmındayken ve bağlamsız kipte.
    const cilt = currentCilt(), kisimId = currentPartId();
    let kaynak_chips = "";
    if (cilt && kisimId && !baglam) {
      const opts = [
        { id: "all",         label: tt(UI.filterAll) },
        { id: "cilt:" + cilt, label: tt(UI.filterCilt) },
        { id: "kisim:" + kisimId, label: tt(UI.filterKisim) },
      ];
      kaynak_chips = opts.map(function (o) {
        return '<button type="button" class="share-panel__chip share-panel__chip--sm' +
          (o.id === kaynakId ? " is-on" : "") + '" data-kaynak="' + o.id + '" aria-pressed="' + (o.id === kaynakId) + '">' +
          escapeHtml(o.label) + "</button>";
      }).join("");
    }

    const tarih = tarihLoad();
    if (gorunumAcik === null) gorunumAcik = window.matchMedia("(min-width: 760px)").matches;

    let baglamHtml = "";
    if (baglam) {
      baglamHtml = '<div class="share-panel__baglam">' +
        (baglam.yok
          ? '<span class="share-panel__baglam-not">' + escapeHtml(tt(UI.baglamYok)) + "</span>"
          : '<span class="share-panel__baglam-etiket">' + escapeHtml(tt(UI.baglam)) + ':</span> <span class="share-panel__baglam-ad">' + escapeHtml(baglam.bekliyor ? tt(UI.loading) : "") + "</span>") +
        '<button type="button" data-action="baglam-birak">' + escapeHtml(tt(UI.baglamBirak)) + "</button>" +
        "</div>";
    }

    panel.innerHTML =
      '<div class="share-panel__head">' + escapeHtml(tt(UI.title)) +
      '<button type="button" data-action="quit" aria-label="' + escapeHtml(tt(UI.close)) + '">✕</button></div>' +
      '<p class="share-panel__hint">' + escapeHtml(tt(UI.hint)) + "</p>" +
      baglamHtml +
      '<div class="share-panel__body">' +
      '<div class="share-panel__col share-panel__col--sonuc">' +
      '<div class="share-panel__sonuc">' +
      '<figure class="share-panel__onizleme" hidden><canvas role="img"></canvas>' +
      '<figcaption>' + escapeHtml(tt(UI.onizleme)) + "</figcaption></figure>" +
      '<div class="share-panel__candidates"></div>' +
      "</div>" +
      '<div class="share-panel__actions">' +
      '<button type="button" data-action="shuffle">' + escapeHtml(tt(UI.shuffle)) + "</button>" +
      "</div>" +
      '<details class="share-panel__details"' + (favLoad().length ? " open" : "") + ">" +
      "<summary>" + escapeHtml(tt(UI.favList)) + '<span class="share-panel__fav-sayi"></span></summary>' +
      '<div class="share-panel__favlist"></div>' +
      "</details>" +
      (tarih.length
        ? '<details class="share-panel__details"><summary>' + escapeHtml(tt(UI.histList)) + "</summary>" +
          '<div class="share-panel__histlist"></div></details>'
        : "") +
      '<details class="share-panel__details"><summary>' + escapeHtml(tt(UI.gunluk)) + '<span class="share-panel__gunluk-sayi"></span></summary>' +
      '<div class="share-panel__gunluk"></div></details>' +
      "</div>" +
      '<div class="share-panel__col share-panel__col--setup">' +
      '<p class="share-panel__label">' + escapeHtml(tt(UI.sablon)) + "</p>" +
      '<div class="share-panel__chips share-panel__chips--tpl">' + chips + "</div>" +
      (kaynak_chips
        ? '<p class="share-panel__label">' + escapeHtml(tt(UI.filter)) + "</p>" +
          '<div class="share-panel__chips share-panel__chips--zemin" id="share-kaynak-chips">' + kaynak_chips + "</div>"
        : "") +
      '<details class="share-panel__gorunum"' + (gorunumAcik ? " open" : "") + ">" +
      '<summary>' + escapeHtml(tt(UI.gorunum)) + "</summary>" +
      '<p class="share-panel__label">' + escapeHtml(tt(UI.dil)) + "</p>" +
      '<div class="share-panel__chips share-panel__chips--zemin">' + dilChips + "</div>" +
      '<p class="share-panel__label">' + escapeHtml(tt(UI.zemin)) + "</p>" +
      '<div class="share-panel__chips share-panel__chips--zemin">' + zeminChips + "</div>" +
      '<label class="share-panel__switch">' +
      '<input type="checkbox" data-action="isik"' + (acikMod ? " checked" : "") + ">" +
      "<span>" + escapeHtml(tt(UI.isik)) + "</span></label>" +
      '<label class="share-panel__switch">' +
      '<input type="checkbox" data-action="kare"' + (kareMod ? " checked" : "") + ">" +
      "<span>" + escapeHtml(tt(UI.kare)) + "</span></label>" +
      '<label class="share-panel__switch">' +
      '<input type="checkbox" data-action="ikidilli"' + (ikiDilliMod ? " checked" : "") + ">" +
      "<span>" + escapeHtml(tt(UI.ikiDilli)) + "</span></label>" +
      (currentTpl === "fusus"
        ? '<label class="share-panel__switch">' +
          '<input type="checkbox" data-action="metinsiz"' + (metinsizMod ? " checked" : "") + ">" +
          "<span>" + escapeHtml(tt(UI.metinsiz)) + "</span></label>"
        : "") +
      (ikiDilliMod
        ? '<p class="share-panel__label">' + escapeHtml(tt(UI.ikinciDil)) + "</p>" +
          '<div class="share-panel__chips share-panel__chips--zemin">' + ikinciDilChips + "</div>"
        : "") +
      "</details>" +
      "</div>" +
      "</div>";

    document.body.appendChild(panel);

    const gorunum = panel.querySelector(".share-panel__gorunum");
    gorunum.addEventListener("toggle", () => { gorunumAcik = gorunum.open; });

    const birak = panel.querySelector('[data-action="baglam-birak"]');
    if (birak) birak.addEventListener("click", () => { baglam = null; yenidenKur('[data-tpl="' + currentTpl + '"]'); });

    panel.querySelectorAll("[data-tpl]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.tpl === currentTpl && !baglam) return;
        currentTpl = b.dataset.tpl;
        baglam = null;
        yenidenKur('[data-tpl="' + currentTpl + '"]');
      });
    });

    panel.querySelectorAll("[data-dil]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.dil === shareLangId) return;
        shareLangId = b.dataset.dil;
        safeSet(DIL_ANAHTAR, shareLangId);
        if (ikinciDilId === shareLangId) {
          ikinciDilId = DIL_LANGS.find((l) => l !== shareLangId) || ikinciDilId;
          safeSet(IKINCIDIL_ANAHTAR, ikinciDilId);
        }
        // Bağlamdaki Fütûhât/Füsûs alıntı konumları dile göre süzüldüğü
        // için bağlam yeni dilde yeniden kuruluyor.
        if (baglam && baglam.view && !baglam.yok) { open({ view: baglam.view, id: baglam.id }, '[data-dil="' + shareLangId + '"]'); return; }
        yenidenKur('[data-dil="' + shareLangId + '"]');
      });
    });

    const ikidilliBox = panel.querySelector('[data-action="ikidilli"]');
    ikidilliBox.addEventListener("change", function (e) {
      ikiDilliMod = e.target.checked;
      safeSet(IKIDILLI_ANAHTAR, ikiDilliMod ? "1" : "0");
      yenidenKur('[data-action="ikidilli"]');
    });

    panel.querySelectorAll("[data-ikincidil]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.ikincidil === ikinciDilId) return;
        ikinciDilId = b.dataset.ikincidil;
        safeSet(IKINCIDIL_ANAHTAR, ikinciDilId);
        panel.querySelectorAll("[data-ikincidil]").forEach(function (x) {
          x.classList.toggle("is-on", x === b);
          x.setAttribute("aria-pressed", String(x === b));
        });
        refresh();
      });
    });

    panel.querySelectorAll("[data-zemin]").forEach(function (b) {
      b.addEventListener("click", function () {
        zeminId = b.dataset.zemin;
        safeSet(ZEMIN_ANAHTAR, zeminId);
        onbellekSifirla();
        panel.querySelectorAll("[data-zemin]").forEach(function (x) {
          x.classList.toggle("is-on", x === b);
          x.setAttribute("aria-pressed", String(x === b));
        });
        onizlemeCiz();
      });
      // Canlı önizleme: "değinmek" (hover) ve klavye karşılığı (focus).
      const z = ZEMIN.find(function (zz) { return zz.id === b.dataset.zemin; });
      if (z) {
        b.addEventListener("mouseenter", function () { mountZeminPreview(z, b); });
        b.addEventListener("mouseleave", teardownZeminPreview);
        b.addEventListener("focus", function () { mountZeminPreview(z, b); });
        b.addEventListener("blur", teardownZeminPreview);
      }
    });

    const kaynakBox = panel.querySelector("#share-kaynak-chips");
    if (kaynakBox) {
      kaynakBox.querySelectorAll("[data-kaynak]").forEach(function (b) {
        b.addEventListener("click", function () {
          kaynakId = b.dataset.kaynak;
          safeSet(KAYNAK_ANAHTAR, kaynakId);
          kaynakBox.querySelectorAll("[data-kaynak]").forEach(function (x) {
            x.classList.toggle("is-on", x === b);
            x.setAttribute("aria-pressed", String(x === b));
          });
          refresh();
        });
      });
    }

    panel.querySelector('[data-action="isik"]').addEventListener("change", function (e) {
      acikMod = e.target.checked;
      safeSet(ISIK_ANAHTAR, acikMod ? "1" : "0");
      onbellekSifirla();
      if (stageEl) stageEl.classList.toggle("share-stage--acik", acikMod);
      onizlemeCiz();
    });
    panel.querySelector('[data-action="kare"]').addEventListener("change", function (e) {
      kareMod = e.target.checked;
      safeSet(KARE_ANAHTAR, kareMod ? "1" : "0");
      onbellekSifirla();
      if (stageEl) stageEl.classList.toggle("share-stage--kare", kareMod);
      onizlemeCiz();
    });
    const metinsizBox = panel.querySelector('[data-action="metinsiz"]');
    if (metinsizBox) {
      metinsizBox.addEventListener("change", function (e) {
        metinsizMod = e.target.checked;
        safeSet(METINSIZ_ANAHTAR, metinsizMod ? "1" : "0");
      });
    }

    panel.querySelector('[data-action="shuffle"]').addEventListener("click", refresh);
    const panelCloseBtn = panel.querySelector('[data-action="quit"]');
    panelCloseBtn.addEventListener("click", closePanel);
    const focusTarget = (focusAfter && panel.querySelector(focusAfter)) || panelCloseBtn;
    focusTarget.focus();

    renderSavedLists();
    renderGunluk();
    refresh();
  }

  function closePanel() {
    closeStage();
    teardownZeminPreview();
    if (panel) { panel.remove(); panel = null; }
    document.body.classList.remove("share-panel-open");
    refreshSeq++;
    baglam = null;
    const o = opener;
    opener = null;
    if (o && o.isConnected && typeof o.focus === "function") o.focus();
  }

  // open(): seçeneksiz -> şablonlarla açılır. open({view, id}) -> "bu kaydı
  // paylaş": o kaydın kartları kendiliğinden hazırlanır (Esmâ -> o isim,
  // Fütûhât kısmı -> o kısmın alıntıları, Mişkât -> hadisin kendi metni...).
  // Eşlenmeyen bir kayıtta panel bunu açıkça söyler; habersiz başka bir
  // kayda gitmez.
  function open(opts, focusAfter) {
    const ilkAcilis = !panel;
    if (ilkAcilis) opener = document.activeElement;
    const eskiOpener = opener;
    if (panel) { panel.remove(); panel = null; }
    closeStage();
    opener = eskiOpener;
    baglam = null;
    if (opts && opts.view) {
      const view = opts.view, id = opts.id || null;
      baglam = { view: view, id: id, bekliyor: true };
      buildPanel(focusAfter);
      const bu = baglam;
      baglamRefleri(view, id).catch(() => null).then((b) => {
        if (!panel || baglam !== bu) return;
        if (b && b.refs && b.refs.length) {
          baglam = Object.assign({ view: view, id: id }, b);
          if (b.tpl && UI.tpl[b.tpl]) currentTpl = b.tpl;
        } else baglam = { view: view, id: id, yok: true };
        yenidenKur(focusAfter);
      });
      return;
    }
    buildPanel(focusAfter);
  }

  function toggle() {
    if (panel) closePanel();
    else open();
  }

  window.__dostShare = { open: function (opts) { open(opts); }, close: closePanel, toggle: toggle };

  // --- Esc: bir adım geri ---------------------------------------------------
  // Sahne panelin üstünde açılır: Esc önce sahneyi, sonra paneli kapatır --
  // her basışta BİR katman. Ortak zincire (GU.registerStepBack) öncelikli
  // kaydoluyor ki altındaki detay panelini aynı basışta kapatmasın
  // (2026-10-09 ölçümü: paylaşım paneli ve detay paneli birlikte kapanıyordu).
  function adimGeri() {
    if (stageEl) { closeStage(); odakPanele(); return true; }
    if (panel) { closePanel(); return true; }
    return false;
  }
  if (GU && typeof GU.registerStepBack === "function") {
    GU.registerStepBack(null, adimGeri, { oncelikli: true });
  } else {
    window.addEventListener("keydown", (e) => { if (e.key === "Escape" && adimGeri()) e.preventDefault(); });
  }

  // --- gizli kelime ----------------------------------------------------
  let buffer = "";
  window.addEventListener("keydown", (e) => {
    if (!e.key || e.key.length !== 1) return;
    if (e.metaKey) return;
    // AltGr (Ctrl+Alt) Türkçe klavyede "@" üretiyor -- bkz. edit-mode.js.
    if ((e.ctrlKey || e.altKey) && !(e.ctrlKey && e.altKey)) return;
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    buffer = (buffer + e.key.toLowerCase()).slice(-CODE.length);
    if (buffer === CODE) { buffer = ""; toggle(); }
  });
})();
