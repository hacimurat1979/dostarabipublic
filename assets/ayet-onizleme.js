// Âyet künyesi önizlemesi.
//
// Metinde geçen alıntıların ardına küçük bir künye koyuyoruz:
//     <span class="ayet-ref" data-ayet="7:143">A'râf 7:143</span>
// 2026-07-31 taraması şunu ölçtü: `kuran.json` sitede HİÇBİR yerden
// çağrılmıyordu, yani `data-ayet` özniteliği tamamen atıldı ve künye yalnız
// bir metin etiketiydi. Okuyucu "A'râf 7:143" görüp o âyetin ne dediğini
// bilmiyorsa hiçbir şey kazanmıyor.
//
// Bu modül ikisini birleştiriyor: künyeye gelince (ya da dokununca) âyetin
// Arapça aslı ve meali çıkıyor. Veri TEMBEL yükleniyor — sayfada hiç künye
// yoksa ya da kimse künyeye dokunmadıysa `kuran.json` hiç indirilmiyor.
// Dosya 408 KB (423 âyet; 2026-10-20'de 65'ten büyüdü); site açılışına
// eklenmemesi için bu şart. Kutu önce yalnız bu dosyayla açılır; "burada da
// geçiyor" dizini (ayet-dizini.json) arkadan gelip kutuyu tamamlar.
//
// DURUŞ NOTU: kutuda gösterilen şey Kur'ân'ın kendisi ve bir meal; bizim
// yorumumuz değil. O yüzden kutuda hiçbir açıklama/çıkarım yok, yalnız metin
// ve kaynağı. TR/EN meal quran-json'dan geliyor; PT meali ise (2026-09-13'ten
// beri, 65 âyetin tümünde) risan/quran-json'da PORTEKİZCE OLMADIĞI için
// TR/EN meal ve Arapça asıl metin referans alınarak elle üretildi (bkz.
// kuran.json'daki üst düzey 'kaynak' alanı). Aşağıdaki düşme (fallback)
// mekanizması artık normal PT gösteriminde devreye girmiyor; yalnız ileride
// pt'si eksik yeni bir âyet eklenirse sessizce başka bir dile kaydırmak
// yerine bunu açıkça söylesin diye bırakıldı ("yaptığımız işi olduğundan
// farklı göstermemek" kuralı).
//
// A1 (2026-07-31): künye artık TERS yönde de çalışıyor — aynı âyetin başka
// hangi kısımlarda geçtiğini gösteriyor (data/ibn-arabi/ayet-dizini.json,
// bkz. scripts/ayet-dizini-uret.py). Bu, kutuya ilk tıklanabilir içeriği
// getirdi; bu yüzden eski "fareyi künyeden ayırınca hemen kapat" davranışı
// artık yanlış -- kullanıcı fareyi kutuya taşırken künyeden ayrılmak
// ZORUNDA, ve o an tetiklenen mouseout kutuyu o kişi linke ulaşamadan
// kapatıyordu. gizlemeyiErtele() bunu kısa bir gecikmeyle çözüyor.
//
// A2 (2026-07-31): aynı kutu artık tekrarlayan kutsî hadisler için de
// çalışıyor (<span class="hadis-ref" data-hadis="kalb">), ama BİLEREK
// daha az iddia ediyor -- kuran.json gibi doğrulanmış bir kaynağımız
// hadis için yok, bu hadisin senedi de hadis usulünde tartışmalıdır.
// Kutu yalnız "bu ifade sitede şu kısımlarda da geçiyor" diyor; Arapça
// asıl ya da sahihlik iddiası YOK. Bkz. data/ibn-arabi/hadis-dizini.json.
(function () {
  "use strict";

  const I18n = window.DostI18n;
  let veri = null, sozu = null, tip = null, acikRef = null, acikTur = null;
  let dizin = null, dizinSozu = null;
  let hadisDizin = null, hadisDizinSozu = null;
  // 2026-10-20 taraması (mobil M-01..03, kod #4/#5, masaüstü F40/F02):
  //  - dokunmatik: tarayıcının dokunuştan ürettiği taklit `mouseover` kutuyu
  //    açıp hemen ardından gelen `click` kapatıyordu -> son dokunuştan sonraki
  //    1,2 sn'de mouseover yok sayılır; click'in kapatması da kutu yeni
  //    açıldıysa (450 ms) engellenir;
  //  - Android geri tuşu kutuyu kapatır (GU.yuzeyKatmani), sayfadan çıkarmaz;
  //  - klavye: künyeler odaklanabilir (tabindex=0 + role=button), kutu
  //    role=tooltip ve aria-describedby ile bağlanır, ↓ kutudaki bağlantıya
  //    geçer, Esc yalnız kutuyu kapatıp odağı künyeye döndürür.
  let sonDokunma = 0, sonPointer = 0, acilisT = 0, acanEl = null, goster0 = 0;
  const katman = window.DostGraphUtils && window.DostGraphUtils.yuzeyKatmani
    ? window.DostGraphUtils.yuzeyKatmani("ayet-tip", () => gizle())
    : null;

  // 2026-10-21 (tasarım önerisi 1, kullanıcı onayı): dar ekranda (telefon, APK)
  // künye kutusu metnin üstüne yüzen bir balon yerine alt sayfa olarak açılır:
  // Arapça büyür, uzun meal kutuya sığar, metin arkada solar (matlık =
  // perdelenme). Tutamak düğmesi, Esc ve Android geri tuşu kapatır. Geniş
  // ekranda yüzen kutu aynen kalır.
  const darMq = window.matchMedia ? window.matchMedia("(max-width: 640px)") : null;
  function altSayfa() { return !!(darMq && darMq.matches); }
  let perde = null, surukle = null;

  function base() { return window.__dostRouteBase || ""; }
  // graph-utils.js script sırasında bu dosyadan hep önce geliyor (index.html),
  // yani window.DostGraphUtils burada her zaman tanımlı -- eskiden buradaki
  // "yoksa kendi fetch'ini kur" fallback'i pratikte hiç tetiklenmiyordu ve
  // tetiklense de GU.fetchJson'ın yaptığı HTTP-durum kontrolünü yapmıyordu
  // (2026-08-15 tespiti).
  const fetcher = window.DostGraphUtils.fetchJson;

  function yukle() {
    if (sozu) return sozu;
    sozu = fetcher(base() + "/data/ibn-arabi/kuran.json")
      .then((d) => { veri = d; return d; })
      .catch((e) => { console.warn("Âyet verisi yüklenemedi", e); sozu = null; return null; });
    return sozu;
  }

  // Ters dizin (A1, 2026-07-31): aynı âyetin başka hangi kısımlarda
  // geçtiğini gösteriyor. Dost'un yöntemi tam olarak bu -- aynı âyeti
  // farklı bölümlerde farklı mertebeden yeniden okumak (bkz. CLAUDE.md
  // üçüncü ilke). Ayrı dosya, ayrı tembel yükleme: künyelerin çoğu (51'in
  // 48'i) tek yerde geçiyor ve bu durumda dizine hiç ihtiyaç yok.
  function yukleDizin() {
    if (dizinSozu) return dizinSozu;
    dizinSozu = fetcher(base() + "/data/ibn-arabi/ayet-dizini.json")
      .then((d) => { dizin = (d && d.dizin) || {}; return dizin; })
      .catch((e) => { console.warn("Âyet dizini yüklenemedi", e); dizinSozu = null; return {}; });
    return dizinSozu;
  }

  function yukleHadisDizin() {
    if (hadisDizinSozu) return hadisDizinSozu;
    hadisDizinSozu = fetcher(base() + "/data/ibn-arabi/hadis-dizini.json")
      .then((d) => { hadisDizin = (d && d.dizin) || {}; return hadisDizin; })
      .catch((e) => { console.warn("Hadis dizini yüklenemedi", e); hadisDizinSozu = null; return {}; });
    return hadisDizinSozu;
  }

  // Şu an açık künyenin hangi kısımda olduğunu URL'den çıkarır (örn.
  // "futuhat/c1k9"), kendi kısmına bağlantı vermemek için.
  function currentPartKey() {
    const b = base();
    let path = location.pathname;
    if (b && path.startsWith(b)) path = path.slice(b.length);
    // Dil öneki (/en/, /pt/) adreste korunuyor (2026-10-09) -- kısım
    // anahtarına dahil değil.
    path = path.replace(/^\/(en|pt)(?=\/|$)/, "");
    return path.replace(/^\/+|\/+$/g, "");
  }

  function digerYerlerHtml(liste, baslikDict) {
    const burada = currentPartKey();
    const diger = (liste || []).filter((e) => `${e.view}/${e.id}` !== burada);
    if (!diger.length) return "";
    const lang = I18n ? I18n.getLang() : "tr";
    const baslik = I18n.pick3(baslikDict);
    const linkler = diger.map((e) => {
      const ad = (e.title && (e.title[lang] || e.title.tr)) || e.id;
      const href = window.__dostNav ? window.__dostNav.href(e.view, e.id) : (base() + e.route);
      return `<a class="cross-link ayet-tip__digeri" href="${esc(href)}" data-view="${esc(e.view)}" data-id="${esc(e.id)}">${esc(ad)}</a>`;
    }).join("");
    return `<p class="ayet-tip__digerleri-baslik">${esc(baslik)}</p>${linkler}`;
  }

  function ensurePerde() {
    if (perde) return perde;
    perde = document.createElement("div");
    perde.className = "ayet-perde";
    perde.setAttribute("aria-hidden", "true");
    document.body.appendChild(perde);
    return perde;
  }

  // İçeriği yazar; alt sayfa kipinde başa tutamak düğmesi ekler.
  function icerigiYaz(t, html) {
    const sheet = altSayfa();
    t.classList.toggle("ayet-tip--sheet", sheet);
    t.style.transform = "";
    const kapat = I18n ? I18n.pick3({ tr: "Kapat", en: "Close", pt: "Fechar" }) : "Kapat";
    t.innerHTML = (sheet ? `<button type="button" class="ayet-tip__tutamak" aria-label="${esc(kapat)}"></button>` : "") + html;
  }

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement("div");
    tip.className = "node-hover-tip node-hover-tip--fixed ayet-tip";
    tip.id = "ayet-tip";
    tip.setAttribute("role", "tooltip");
    tip.hidden = true;
    document.body.appendChild(tip);
    // Tutamak: dokununca kapatır; aşağı çekilince alt sayfa kayarak kapanır.
    tip.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest(".ayet-tip__tutamak")) { e.stopPropagation(); const geri = acanEl; gizle(); if (geri && geri.focus) geri.focus(); }
    });
    tip.addEventListener("pointerdown", (e) => {
      const tut = e.target.closest && e.target.closest(".ayet-tip__tutamak");
      if (!tut || !tip.classList.contains("ayet-tip--sheet")) return;
      surukle = { y0: e.clientY, dy: 0, id: e.pointerId };
      try { tut.setPointerCapture(e.pointerId); } catch (_) {}
      tip.style.transition = "none";
    });
    tip.addEventListener("pointermove", (e) => {
      if (!surukle || e.pointerId !== surukle.id) return;
      surukle.dy = Math.max(0, e.clientY - surukle.y0);
      tip.style.transform = `translateY(${surukle.dy}px)`;
    });
    const biraktir = (e) => {
      if (!surukle || (e && e.pointerId !== surukle.id)) return;
      const dy = surukle.dy; surukle = null;
      tip.style.transition = "";
      if (dy > 70) { const geri = acanEl; gizle(); if (geri && geri.focus) geri.focus(); }
      else tip.style.transform = "";
    };
    tip.addEventListener("pointerup", biraktir);
    tip.addEventListener("pointercancel", biraktir);
    return tip;
  }

  function konumla(el) {
    if (!tip || tip.hidden) return;
    if (tip.classList.contains("ayet-tip--sheet")) {
      // Alt sayfa CSS ile yerleşir (sol/sağ/alt 0); yüzen kutudan kalan satır içi değerler temizlenir.
      tip.style.left = ""; tip.style.top = ""; tip.style.maxHeight = "";
      return;
    }
    const r = el.getBoundingClientRect();
    tip.style.maxHeight = "";
    let k = tip.getBoundingClientRect();
    // Künyenin ÜSTÜNE koyuyoruz; üstte yer yoksa altına düşüyor. İkisi de
    // dikeyde ekran dışına taşabiliyordu (2026-08-02 kullanıcı bildirimi);
    // şimdi hem üst hem alt kenara clamp uygulanıyor. 2026-10-20: yer yetmeyen
    // yönde kutu o yöndeki boşlukla sınırlanır (iç kaydırma) -- uzun kutu
    // künyenin ÜSTÜNE binip dokunmayı yutmasın (mobil taraması M-03).
    const ust = r.top - 12, alt = window.innerHeight - r.bottom - 12;
    const yon = ust >= k.height ? "ust" : (alt >= k.height ? "alt" : (ust > alt ? "ust" : "alt"));
    const bos = Math.max(96, yon === "ust" ? ust : alt);
    if (k.height > bos) { tip.style.maxHeight = bos + "px"; k = tip.getBoundingClientRect(); }
    let x = Math.min(Math.max(8, r.left + r.width / 2 - k.width / 2), window.innerWidth - k.width - 8);
    let y = yon === "ust" ? r.top - k.height - 8 : r.bottom + 8;
    y = Math.min(y, window.innerHeight - k.height - 8);
    y = Math.max(y, 8);
    tip.style.left = x + "px";
    tip.style.top = y + "px";
  }

  // Ortak kaçış (2026-10-09): graph-utils.js escapeHtml ile birebir aynı
  // davranıştaki yerel kopyanın yerine (& < > " ; null -> "").
  function esc(s) { return window.DostGraphUtils.escapeHtml(s); }

  // Kur'ân Dokusu'ndaki sûre düğümüne bağlantı (yalnız o sûre dokuda varsa; dizin gelince eklenir).
  function dokusuHtml(sureNo) {
    if (!dizin) return "";
    const var_ = Object.keys(dizin).some((k) => parseInt(k.split(":")[0], 10) === sureNo);
    if (!var_) return "";
    const href = window.__dostNav ? window.__dostNav.href("kuran-dokusu", String(sureNo)) : (base() + "/kuran-dokusu/" + sureNo + "/");
    const ad = I18n.pick3({ tr: "Kur'ân Dokusu'nda gör", en: "See in Quran Weave", pt: "Ver na Trama do Alcorão" });
    return `<p class="ayet-tip__dokusu-sar"><a class="cross-link ayet-tip__dokusu ayet-tip__digeri" href="${esc(href)}" data-view="kuran-dokusu" data-id="${sureNo}">${esc(ad)}</a></p>`;
  }

  function icerik(ref) {
    const a = veri && veri.ayetler && veri.ayetler[ref];
    if (!a) return null;
    const lang = I18n ? I18n.getLang() : "tr";
    const meal = a.meal || {};
    // 2026-09-13'ten beri meal.pt var (65 âyetin tümünde) -- bu düşme artık
    // normalde devreye girmiyor, yalnız ileride pt'si eksik yeni bir âyet
    // için güvenlik ağı. Yedek sıra lang -> en -> tr. NOT gerçekten
    // kullanılan dili söyler (ilk sürümde yedek tr'ye düşüp not "İngilizce"
    // diyordu — kendi kendine yalan söyleyen bir uyarıydı, düzeltildi).
    const mealDili = meal[lang] ? lang : (meal.en ? "en" : (meal.tr ? "tr" : null));
    const govde = mealDili ? meal[mealDili] : "";
    const DIL_ADI = {
      tr: { tr: "Türkçe", en: "Turkish", pt: "turco" },
      en: { tr: "İngilizce", en: "English", pt: "inglês" },
    };
    const not = (mealDili && mealDili !== lang)
      ? I18n.pick3({
          tr: `(meal ${DIL_ADI[mealDili].tr} — bu dilde meal elimizde yok)`,
          en: `(translation in ${DIL_ADI[mealDili].en} — we have none in this language)`,
          pt: `(tradução em ${DIL_ADI[mealDili].pt} — não temos nenhuma neste idioma)`,
        })
      : "";
    const sureNo = parseInt(ref.split(":")[0], 10);
    const sure = (veri.sureler || []).find((s) => s.no === sureNo);
    const ad = sure ? (sure.ad && (sure.ad[lang] || sure.ad.tr)) : "";
    return `
      <p class="ayet-tip__ar" dir="rtl" lang="ar">${esc(a.ar || "")}</p>
      <p class="ayet-tip__meal">${esc(govde)}</p>
      <p class="ayet-tip__kaynak">${esc(ad)} ${esc(ref)}${not ? " " + esc(not) : ""}</p>
      ${dokusuHtml(sureNo)}
      ${digerYerlerHtml((dizin && dizin[ref]) || [], {
        tr: "Bu âyet burada da geçiyor", en: "This verse also appears here", pt: "Este versículo também aparece aqui",
      })}`;
  }

  // Hadis kutusu âyet kutusundan BİLEREK daha az söylüyor: Arapça asıl
  // yok, sahihlik iddiası yok -- yalnız tekrar eden yerleri gösteriyor.
  function hadisIcerik(anahtar) {
    const liste = (hadisDizin && hadisDizin[anahtar]) || [];
    if (!liste.length) return null;
    const baslik = I18n.pick3({
      tr: "Tekrarlayan bir kutsî hadis", en: "A recurring sacred saying", pt: "Um dito sagrado recorrente",
    });
    const digerHtml = digerYerlerHtml(liste, {
      tr: "Bu ifade sitede şurada da geçiyor", en: "This wording also appears here", pt: "Esta formulação também aparece aqui",
    });
    if (!digerHtml) return null;   // yalnız kendi kısmındaysa gösterecek bir şey yok
    return `<p class="hadis-tip__baslik">${esc(baslik)}</p>${digerHtml}`;
  }

  function ac(t, html, el) {
    icerigiYaz(t, html);
    t.hidden = false;
    if (t.classList.contains("ayet-tip--sheet")) { ensurePerde().classList.add("ayet-perde--acik"); }
    acilisT = Date.now();
    acanEl = el;
    el.setAttribute("aria-describedby", "ayet-tip");
    konumla(el);
    if (katman) katman.ac();
  }

  function goster(el) {
    goster0 = Date.now();
    const ref = el.getAttribute("data-ayet");
    const hadis = el.getAttribute("data-hadis");
    if (ref) {
      acikRef = ref; acikTur = "ayet";
      // Önce yalnız kuran.json (Arapça + meal); "burada da geçiyor" dizini
      // arkadan gelip kutuyu tamamlar (zayıf bağlantıda ilk dokunuş boş kalmasın).
      yukle().then(() => {
        if (acikRef !== ref || acikTur !== "ayet") return;   // bu arada başka bir künyeye geçildi
        const html = icerik(ref);
        if (!html) return;
        ac(ensureTip(), html, el);
        if (!dizin) yukleDizin().then(() => {
          if (acikRef !== ref || acikTur !== "ayet" || !tip || tip.hidden) return;
          const yeni = icerik(ref);
          if (yeni) { icerigiYaz(tip, yeni); konumla(el); }
        });
      });
    } else if (hadis) {
      acikRef = hadis; acikTur = "hadis";
      yukleHadisDizin().then(() => {
        if (acikRef !== hadis || acikTur !== "hadis") return;
        const html = hadisIcerik(hadis);
        if (!html) return;
        ac(ensureTip(), html, el);
      });
    }
  }

  function isaretEl(target) {
    return target.closest && (target.closest(".ayet-ref") || target.closest(".hadis-ref"));
  }
  function isaretAnahtari(el) {
    return el.getAttribute("data-ayet") || el.getAttribute("data-hadis");
  }

  let gizleZamanlayici = null;
  function gizle() {
    if (gizleZamanlayici) { clearTimeout(gizleZamanlayici); gizleZamanlayici = null; }
    acikRef = null; acikTur = null;
    if (acanEl) { acanEl.removeAttribute("aria-describedby"); }
    if (tip) { tip.hidden = true; tip.style.transform = ""; }
    if (perde) perde.classList.remove("ayet-perde--acik");
    surukle = null;
    if (katman) katman.bitti();
  }
  // Kutu artık tıklanabilir bağlantı taşıyabiliyor (A1: "burada da geçiyor").
  // Fareyi künyeden kutuya doğru hareket ettirirken önce künyeden AYRILMAK
  // gerekiyor -- anında gizle() çağıran eski davranış kutuyu kullanıcı daha
  // ulaşamadan kapatıyordu. Kısa bir gecikmeyle erteleniyor; kutunun
  // kendisine girilirse iptal ediliyor.
  function gizlemeyiErtele() {
    if (gizleZamanlayici) clearTimeout(gizleZamanlayici);
    gizleZamanlayici = setTimeout(gizle, 220);
  }

  // Fare + klavye + dokunma. Künyeler/işaretler metin akışının içinde
  // olduğu için delegasyonla bağlanıyor: yeni bir kısım render edildiğinde
  // tekrar bağlanmaya gerek kalmıyor.
  document.addEventListener("touchstart", () => { sonDokunma = Date.now(); }, { passive: true, capture: true });
  document.addEventListener("mouseover", (e) => {
    // Dokunuştan sonra tarayıcının ürettiği taklit mouseover'ı yok say: aksi
    // hâlde kutu açılıp hemen ardından gelen click'le kapanıyor (M-01).
    if (Date.now() - sonDokunma < 1200) return;
    const el = isaretEl(e.target);
    if (el) { if (gizleZamanlayici) { clearTimeout(gizleZamanlayici); gizleZamanlayici = null; } goster(el); }
    else if (tip && e.target.closest && e.target.closest(".ayet-tip")) {
      if (gizleZamanlayici) { clearTimeout(gizleZamanlayici); gizleZamanlayici = null; }
    }
  });
  document.addEventListener("mouseout", (e) => {
    if (Date.now() - sonDokunma < 1200) return;
    const el = isaretEl(e.target);
    const kutu = e.target.closest && e.target.closest(".ayet-tip");
    if (el || kutu) gizlemeyiErtele();
  });
  document.addEventListener("click", (e) => {
    const el = isaretEl(e.target);
    if (el) {
      e.preventDefault();
      // Fare/dokunma tıklaması önce focusin'i tetikler (el odaklanılabilir), o
      // da goster()'ı çağırıp kutuyu açar. Yalnız kutu GERÇEKTEN görünürse VE
      // az önce açılmadıysa "kapat" sayılır: yeni açılan kutuyu aynı
      // dokunuşun click'i kapatmasın (dokunmatikte özellik hiç çalışmıyordu).
      const acik = tip && !tip.hidden && acikRef === isaretAnahtari(el) && Date.now() - acilisT > 450;
      acik ? gizle() : goster(el);
    }
    else if (!(e.target.closest && e.target.closest(".ayet-tip")) || e.target.closest("a")) gizle();
  });
  // Esc: kutu açıksa YALNIZ kutuyu kapatır (bir adım geri); odak kutunun
  // içindeyse künyeye döner. Capture: arkadaki panel/okuma ayrıca kapanmasın.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (tip && !tip.hidden) {
        const iceride = tip.contains(document.activeElement);
        const geri = acanEl;
        gizle();
        if (iceride && geri && geri.focus) geri.focus();
        e.stopPropagation();
      } else gizle();
      return;
    }
    // ←/→/Home/End: aynı paragraftaki künyeler arasında gezin (tek Tab durağı).
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const k = e.target.closest && (e.target.closest(".ayet-ref") || e.target.closest(".hadis-ref"));
      if (k && k === e.target && k.getAttribute("role") === "button") {
        const grup = kunyeGrubu(k);
        const uyeler = grup ? kunyeUyeleri(grup) : [];
        if (uyeler.length > 1) {
          const i = uyeler.indexOf(k);
          const yeni = e.key === "ArrowRight" ? Math.min(i + 1, uyeler.length - 1)
            : e.key === "ArrowLeft" ? Math.max(i - 1, 0) : e.key === "Home" ? 0 : uyeler.length - 1;
          e.preventDefault();
          if (yeni !== i) { durakYaz(grup, uyeler[yeni]); uyeler[yeni].focus(); }
          return;
        }
      }
    }
    // Künye klavyeyle: Enter/Boşluk kutuyu açar/kapatır, ↓ açar (açıksa ilk bağlantıya geçer).
    // 2026-10-21 revizyon taraması: odakla kutu AÇILMAZ (←/→ gezinmesinde her adımda kutu
    // paragrafı örtüyordu; Esc sonrası da yeniden açılıyordu); açma açık bir eylemdir.
    const kun = e.target.closest && e.target.closest(".ayet-ref, .hadis-ref");
    if (kun && kun === e.target && kun.getAttribute("role") === "button") {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const acik = tip && !tip.hidden && acikRef === isaretAnahtari(kun);
        acik ? gizle() : goster(kun);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const acik = tip && !tip.hidden && acikRef === isaretAnahtari(kun);
        if (!acik) { goster(kun); return; }
        const ilk = tip.querySelector(".ayet-tip__digeri");
        if (ilk) ilk.focus();
        return;
      }
      // Kutu açıkken Tab odağı kutudaki ilk bağlantıya taşır (kutu DOM'un sonunda).
      if (e.key === "Tab" && !e.shiftKey && tip && !tip.hidden && acikRef === isaretAnahtari(kun)) {
        const ilk = tip.querySelector(".ayet-tip__digeri");
        if (ilk) { e.preventDefault(); ilk.focus(); return; }
      }
    }
    // Kutunun içinden Tab ile çıkış: son bağlantıdan ileri / ilkinden geri → odak künyeye döner
    // ve kutu kapanır (eskiden odak BODY'ye düşüyordu).
    if (e.key === "Tab" && tip && !tip.hidden && tip.contains(document.activeElement)) {
      const lis = [...tip.querySelectorAll("a[href], button")].filter((x) => x.getClientRects().length);
      const son = lis[lis.length - 1], ilk0 = lis[0];
      if ((!e.shiftKey && document.activeElement === son) || (e.shiftKey && document.activeElement === ilk0)) {
        const geri = acanEl;
        if (geri && geri.focus) { e.preventDefault(); gizle(); geri.focus(); }
      }
    }
  }, true);
  document.addEventListener("mousedown", () => { sonPointer = Date.now(); }, true);
  document.addEventListener("focusin", (e) => {
    if (e.target.closest && e.target.closest(".ayet-tip")) return;   // kutunun içinde gezinirken kapatma
    const el = isaretEl(e.target);
    if (el && el.getAttribute("role") === "button") { const g = kunyeGrubu(el); if (g && kgAktif.get(g) !== el) durakYaz(g, el); }
    if (el) {
      // Odak kutuyu AÇMAZ (2026-10-21): fare/dokunuşta click, klavyede Enter/Boşluk/↓ açar.
      // Başka bir künyeye geçilirse önceki kutu kapanır.
      if (tip && !tip.hidden && acanEl && acanEl !== el) gizle();
      return;
    } else gizle();
  });
  // Kaydırma kutuyu kapatır; ama kutunun KENDİ iç kaydırması kapatmaz (kutu artık
  // max-height + overflow taşıyor). Capture: iç kaydırma kapları da yakalanır.
  window.addEventListener("scroll", (e) => {
    if (tip && e.target && e.target.nodeType === 1 && tip.contains(e.target)) return;
    // Klavye odağı künyeyi görünüme kaydırır (scroll olayı odaktan SONRA gelir):
    // yeni açılan kutuyu o kaydırma kapatmasın, yalnız yeniden konumlansın.
    if (Date.now() - goster0 < 400) {
      if (tip && !tip.hidden && acanEl) konumla(acanEl);
      return;
    }
    gizle();
  }, { passive: true, capture: true });

  // Künyeleri klavyeyle ulaşılabilir yap (2026-10-20: Füsûs/Mişkât'ta ~1.800
  // künye tabindex'siz geliyordu; Fütûhât'ta zaten vardı). Veri değişmez:
  // çalışma anında, render edilen künyelere tabindex=0 + role=button eklenir.
  //
  // 2026-10-21 (tasarım önerisi 7, kullanıcı onayı) KÜNYE GEZGİNİ: Füsûs
  // kısımlarında 100'den fazla künye var; hepsi ayrı Tab durağı olunca sayfayı
  // klavyeyle geçmek yüzlerce Tab demekti. Artık aynı paragraftaki künyeler TEK
  // durak: içinde ←/→ (Home/End) gezinir, Tab paragraftan çıkar (roving tabindex).
  let hazirlaZamanlayici = null;
  const kgAktif = new WeakMap();   // grup öğesi -> o gruptaki durak künye
  function kunyeGrubu(el) {
    return el.closest("p, li, blockquote, td, dd, figcaption") || el.parentElement;
  }
  function kunyeUyeleri(grup) {
    return [...grup.querySelectorAll(".ayet-ref[role='button'], .hadis-ref[role='button'], .ayet-ref[tabindex], .hadis-ref[tabindex]")]
      .filter((x) => kunyeGrubu(x) === grup);
  }
  function durakYaz(grup, aktif) {
    const uyeler = kunyeUyeleri(grup);
    if (!uyeler.length) return;
    const hedef = uyeler.includes(aktif) ? aktif : (uyeler.includes(kgAktif.get(grup)) ? kgAktif.get(grup) : uyeler[0]);
    kgAktif.set(grup, hedef);
    uyeler.forEach((u) => u.setAttribute("tabindex", u === hedef ? "0" : "-1"));
  }
  function kunyeleriHazirla() {
    hazirlaZamanlayici = null;
    const gruplar = new Set();
    document.querySelectorAll(".ayet-ref, .hadis-ref").forEach((el) => {
      // İçinde bağlantı/düğme olan künye iç içe etkileşimli öğe olurdu (axe
      // nested-interactive): odak içerideki bağlantıda kalır, künye fareyle açılır.
      if (el.querySelector("a, button, [tabindex]")) return;
      if (!el.hasAttribute("role")) el.setAttribute("role", "button");
      el.setAttribute("aria-haspopup", "true");
      el.setAttribute("aria-keyshortcuts", "Enter ArrowDown");
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
      gruplar.add(kunyeGrubu(el));
    });
    gruplar.forEach((g) => { if (g) durakYaz(g, null); });
  }
  function hazirlaPlanla() {
    if (hazirlaZamanlayici) return;
    hazirlaZamanlayici = setTimeout(kunyeleriHazirla, 150);
  }
  if (typeof MutationObserver !== "undefined") {
    new MutationObserver((kayitlar) => {
      for (const k of kayitlar) {
        for (const n of k.addedNodes) {
          if (n.nodeType === 1 && (n.matches && (n.matches(".ayet-ref, .hadis-ref") || n.querySelector(".ayet-ref, .hadis-ref")))) { hazirlaPlanla(); return; }
        }
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", hazirlaPlanla);
  else hazirlaPlanla();
})();
