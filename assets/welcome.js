(function () {
  "use strict";

  const root = document.getElementById("welcome-screen");
  if (!root) return;

  // 2026-08-27 (kullanıcı kararı): karşılama ritüeli ARTIK HER SEFERİNDE
  // gösteriliyor. Daha önce hatırlanıyordu ve kapı iki kez yer değiştirdi:
  // 2026-08-16'da (uzman paneli, G-01/ONBOARDING-01) sessionStorage'dan
  // localStorage'a çevrilmişti -- "ritüel cihaz başına bir kez gösterilsin,
  // her yeni sekmede yeniden oynamasın". Kullanıcının ifadesiyle o karar
  // geri alındı: "bir kez gören ya da görmeyen herkes için her seferinde
  // muhakkak görünmeli."
  //
  // Gerekçe, sitenin kendi diliyle: "O'ndan O'na" bir bilgilendirme değil,
  // bir eşiktir. Eşikten her girişte geçilir; bir kez geçip sonra yandan
  // dolaşılan şey eşik değildir.
  //
  // `dost-welcome-seen` anahtarı artık ne okunuyor ne yazılıyor. Daha önce
  // yazılmış olanlar zararsız biçimde orada kalıyor -- okunmadıkları için
  // bir etkileri yok; kullanıcıların localStorage'ını temizlemek bizim
  // işimiz değil.

  // Derin bir rotaya doğrudan gelindiğinde (paylaşılan link, arama sonucu)
  // ritüel araya girmesin -- gateTransition'ın zaten benimsediği "gelinmemiş
  // bir yerden çıkış animasyonu yalan olurdu" ilkesi karşılama ekranına da
  // uygulanıyor. Kök rotanın kendisi <base href> yüzünden her dağıtımda
  // (canlı "/", önizleme "/dost-onizleme/") farklı olabildiği için ROUTE_BASE
  // buradan hesaplanıyor (bkz. assets/ontology.js'teki aynı desen).
  //
  // Bu, "her seferinde göster" kuralının TEK istisnası ve bir hatırlama
  // değil: kapı, gelinen YERE bakıyor, daha önce görülüp görülmediğine
  // değil. Paylaşılan bir bölüm bağlantısını açan kişi o bölümü istiyor;
  // önüne altı saniyelik bir eşik koymak onu karşılamak değil, geciktirmek
  // olurdu. Aynı kişi köke geldiğinde ritüeli görür -- her seferinde.
  const ROUTE_BASE = (function () {
    const baseEl = document.querySelector("base");
    if (!baseEl) return "";
    try {
      const u = new URL(baseEl.getAttribute("href"), location.origin);
      return u.pathname.replace(/\/+$/, "");
    } catch (e) { return ""; }
  })();
  if (location.pathname.replace(/\/+$/, "") !== ROUTE_BASE) {
    root.hidden = true;
    return;
  }

  // İKİ UÇTAN GİRİŞ (2026-10-09, görsel değerlendirme madde 15). Eskiden
  // ritüel bitince ekranın altında üç katman üst üste biniyordu: "Zât'tan
  // başla / Kalp'ten başla" ipucu kartı, çerez bandı ve lejant. Şimdi:
  //   1. Halka kapanınca üstünde iki giriş noktası belirir: Zât (tepe) ve
  //      Kalp -- Ontoloji çemberindeki yerleriyle aynı yerde.
  //   2. Seçim halkanın üzerinden yapılır (tıklama, ya da Tab + Enter).
  //      Esc, "Geç" ya da boş zemine tıklamak seçimsiz girer; bir süre
  //      hiçbir şey yapılmazsa da seçimsiz girilir (eşik geçilir, kimse
  //      eşikte bekletilmez) -- bir noktaya değinilirken bu süre durur.
  //   3. Halka açılıp Ontoloji çemberinin yerine oturur ve onun çemberine
  //      dönüşür; seçilen ucun paneli çember doğduktan sonra açılır
  //      (ontology.js maybeBirth).
  //   4. Çerez bandı ancak bundan SONRA gelir (html.karsilama-acik iken
  //      CSS onu gizli tutar; satır-içi onam betiğine dokunulmadı).
  const HTML = document.documentElement;
  HTML.classList.add("karsilama-acik");

  const stage = root.querySelector(".welcome-screen__stage");
  const beam = document.getElementById("welcome-beam");
  const spark = document.getElementById("welcome-spark");
  const text = document.getElementById("welcome-text");
  const tagline = document.getElementById("welcome-tagline");
  const glow = document.getElementById("welcome-glow");
  const skipBtn = document.getElementById("welcome-skip");
  const uclar = document.getElementById("welcome-uclar");
  const secimMetni = document.getElementById("welcome-secim");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Seçimsiz girişe kadar bekleme: cümleyi okuyup bir uç seçmeye yetecek
  // kadar. Hareket azaltılmışsa ritüel zaten kısa (halka çizilmiyor).
  const BEKLEME = reduceMotion ? 3500 : 7000;

  let finished = false;
  let gidiyor = false;
  let beklemeTimer = null;

  // 2026-08-26 sağlamlaştırma: dinleyiciler animasyon kurulumundan ÖNCE,
  // kendi null-guard'larıyla bağlanıyor -- bir öğe eksik kalırsa tam ekran
  // siyah perde kalıcı olarak asılı kalmasın.
  skipBtn && skipBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    leave(null);
  });
  if (uclar) {
    uclar.addEventListener("click", (event) => {
      const btn = event.target.closest(".welcome-screen__uc");
      if (!btn) return;
      event.stopPropagation();
      leave(btn.dataset.uc || null);
    });
    // Bir noktaya değinilirken (fare ya da klavye odağı) seçimsiz giriş
    // beklemesi durur; ayrılınca kısa bir payla yeniden başlar.
    uclar.addEventListener("pointerover", beklemeyiDurdur);
    uclar.addEventListener("focusin", beklemeyiDurdur);
    uclar.addEventListener("pointerout", () => beklemeyiKur(3000));
    uclar.addEventListener("focusout", () => beklemeyiKur(3000));
  }
  root.addEventListener("click", () => {
    // Halka çizilirken tıklamak onu tamamlar (seçim noktaları belirir);
    // seçim açıkken boş zemine tıklamak seçimsiz girer.
    if (!finished) finish();
    else leave(null);
  });
  window.addEventListener("keydown", (event) => {
    if (root.hidden || gidiyor) return;
    if (event.key === "Escape") {
      event.preventDefault();
      leave(null);
      return;
    }
    const butonda = event.target && event.target.closest && event.target.closest("#welcome-screen button");
    if (event.key === "Enter" || event.key === " ") {
      if (butonda) return;            // düğmenin kendi tıklaması seçer
      event.preventDefault();
      if (!finished) finish();
      else odakla(0);
      return;
    }
    if (event.key === "Tab") {
      // Karşılama açıkken odak onun içinde dolaşır (arkadaki sayfa henüz
      // görünmüyor): Zât → Kalp → Geç.
      const liste = odaklanabilir();
      if (!liste.length) return;
      event.preventDefault();
      const i = liste.indexOf(document.activeElement);
      const j = i < 0 ? (event.shiftKey ? liste.length - 1 : 0)
        : (i + (event.shiftKey ? -1 : 1) + liste.length) % liste.length;
      liste[j].focus();
    }
  });
  // Halka herhangi bir sebeple tamamlanamazsa seçim yine de açılsın.
  setTimeout(() => { if (!finished) finish(); }, 9000);

  function odaklanabilir() {
    const l = [];
    if (finished && uclar && !uclar.hidden) l.push(...uclar.querySelectorAll(".welcome-screen__uc"));
    if (skipBtn) l.push(skipBtn);
    return l;
  }
  function odakla(i) {
    const l = odaklanabilir();
    if (l[i]) l[i].focus();
  }

  function beklemeyiDurdur() {
    if (beklemeTimer) { clearTimeout(beklemeTimer); beklemeTimer = null; }
  }
  function beklemeyiKur(ms) {
    beklemeyiDurdur();
    if (!finished || gidiyor) return;
    beklemeTimer = setTimeout(() => leave(null), ms);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  const cx = 150;
  const cy = 150;
  const r = 120;
  const len = 2 * Math.PI * r;

  function placeSpark(progress) {
    const angle = -Math.PI / 2 + progress * Math.PI * 2;
    spark.setAttribute("cx", cx + r * Math.cos(angle));
    spark.setAttribute("cy", cy + r * Math.sin(angle));
  }

  // Ontoloji çemberinin ekrandaki yeri (ontology.js __ontolojiHalkaEkrani).
  // Grafik görünmüyorsa (mobilde liste kipi) ya da hareket azaltılmışsa
  // null: o zaman halka yerinde söner.
  function hedefHalka() {
    if (reduceMotion || !stage) return null;
    try {
      const f = window.__ontolojiHalkaEkrani;
      const g = typeof f === "function" ? f() : null;
      if (!g || !isFinite(g.x) || !isFinite(g.y) || !(g.r > 10)) return null;
      return g;
    } catch (e) { return null; }
  }

  function leave(secim) {
    if (gidiyor || root.hidden) return;
    gidiyor = true;
    finished = true;
    beklemeyiDurdur();
    window.__dostKarsilamaSecimi = secim || null;
    // Ontoloji'nin doğuşu (ontology.js runBirth) bu olayla başlar: halka
    // yerine otururken çember belirir, düğümler onun üstünde doğar.
    const haberVer = () => {
      window.__dostKarsilamaGitti = true;
      document.dispatchEvent(new CustomEvent("dost:welcome-left", { detail: { secim: secim || null } }));
    };
    const bitir = (ms) => setTimeout(() => {
      root.hidden = true;
      // Çerez bandı seçimden SONRA: çember doğup yerine oturunca.
      setTimeout(() => HTML.classList.remove("karsilama-acik"), reduceMotion ? 0 : 1200);
    }, ms);

    const g = hedefHalka();
    if (!g) {
      root.classList.add("welcome-screen--leaving");
      haberVer();
      bitir(950);
      return;
    }
    // Halkanın açılışı: sahne (halka) ontoloji çemberinin yerine ve
    // boyuna taşınır; karanlık zemin ve yazılar çekilir. Halka oraya
    // varınca altındaki çember zaten belirmiş olur; halka onun içinde söner.
    const sr = stage.getBoundingClientRect();
    const ringPx = sr.width * (r / 300);
    const olcek = g.r / ringPx;
    const dx = g.x - (sr.left + sr.width / 2);
    const dy = g.y - (sr.top + sr.height / 2);
    beam.style.strokeDashoffset = "0";
    root.classList.add("welcome-screen--donusum");
    stage.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) scale(" + olcek.toFixed(4) + ")";
    setTimeout(haberVer, 300);
    setTimeout(() => root.classList.add("welcome-screen--donusum-son"), 900);
    bitir(1500);
  }

  function finish() {
    if (finished) return;
    finished = true;
    try {
      beam.style.strokeDashoffset = "0";
      beam.classList.add("welcome-screen__beam--complete");
      spark.classList.add("welcome-screen__spark--hidden");
      glow.style.opacity = "0.5";
      setTimeout(() => {
        text.classList.add("welcome-screen__text--visible");
        if (tagline) tagline.classList.add("welcome-screen__tagline--visible");
      }, 260);
      // İki giriş noktası: halka kapandıktan hemen sonra yanar.
      setTimeout(() => {
        if (gidiyor) return;
        if (uclar) {
          uclar.hidden = false;
          // hidden kalkınca bir kare bekle ki geçiş (opacity) görünsün.
          requestAnimationFrame(() => requestAnimationFrame(() => uclar.classList.add("welcome-screen__uclar--acik")));
        }
        if (secimMetni) secimMetni.classList.add("welcome-screen__secim--acik");
        beklemeyiKur(BEKLEME);
      }, reduceMotion ? 0 : 520);
    } catch (e) {
      leave(null);
    }
  }

  function runDraw(durationMs) {
    const start = performance.now();
    function frame(now) {
      if (finished) return;
      const raw = Math.min(1, (now - start) / durationMs);
      const eased = easeInOutCubic(raw);
      const offset = len * (1 - eased);
      beam.style.strokeDashoffset = String(offset);
      placeSpark(eased);
      glow.style.opacity = String(0.18 + eased * 0.22);
      if (raw < 1) {
        requestAnimationFrame(frame);
      } else {
        finish();
      }
    }
    requestAnimationFrame(frame);
  }

  // 2026-08-26: animasyon kurulumu/oynatımı try/catch içinde -- bir öğe
  // eksik ya da SVG API'sinde beklenmeyen bir hata çıkarsa (yukarıdaki
  // dinleyiciler zaten bağlı olduğu için tıklama/Esc her durumda çalışır),
  // perde asılı kalmasın diye seçimsiz girilir.
  try {
    beam.style.strokeDasharray = String(len);
    beam.style.strokeDashoffset = String(len);
    if (reduceMotion) {
      placeSpark(1);
      finish();
    } else {
      runDraw(4500);
    }
  } catch (e) {
    leave(null);
  }
})();
