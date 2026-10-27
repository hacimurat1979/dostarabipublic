(function () {
  "use strict";
  // Daphne verisinin parola kapısı (2026-10-21, kullanıcı kararı: "daphne sayfasına
  // erişim açık olmamalı, sadece benim bildiğim kısa yol ile ben girebileceğim").
  //
  // GitHub Pages statik barındırır; sunucuda parola denetlenemez. Canlıda Daphne
  // verisi AES-GCM ile şifreli durur (data/gizli/*.enc, bkz. scripts/daphne-sifrele.py);
  // bu betik parolayı sorar, PBKDF2 ile anahtarı türetir, dosyaları çözer.
  // Parola ve anahtar depoya yazılmaz; anahtar yalnız bu cihazın tarayıcı deposunda
  // ("bu cihazda hatırla" seçiliyse localStorage, değilse sessionStorage) durur.
  //
  // Özel repoda (geliştirme) data/gizli/manifest.json YOKTUR: kapı açılmaz, veri düz
  // metin okunur -- testler ve düzenleme bu yoldan çalışır. Canlıda manifest vardır
  // ve düz metin dosyalar yoktur.
  //
  // Biçim scripts/daphne-sifrele.py ile birebir aynı:
  //   anahtar = PBKDF2-SHA256(parola, tuz, tur) 256 bit; dosya = iv(12) || AES-GCM(gzip(json), aad=yol)
  const GIZLI = [
    "data/daphne-profile.json",
    "data/daphne-dost-baglari.json",
    "data/daphne-eksen-seyri.json",
    "data/themes.json",
    "data/daphne-kenar.json",
  ];
  const RESIM_ON = "data/daphne-kenar-img/";   // şifreli resimler (ikili): cozBlob
  const ANAHTAR = "dost-daphne-anahtar";
  const enc = new TextEncoder();
  let manifestSozu = null, anahtarSozu = null;

  function kok() { return window.__dostRouteBase || ""; }
  function b64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function b64Yaz(u) { let s = ""; for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }

  // Manifest: yok (404) -> null (kapı yok); bozuksa kapı kapalı kalır (null DEĞİL, hata).
  function manifest() {
    if (manifestSozu) return manifestSozu;
    manifestSozu = fetch(kok() + "/data/gizli/manifest.json", { cache: "no-cache" }).then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("gizli manifest HTTP " + r.status);
      return r.json();
    });
    return manifestSozu;
  }

  function yolu(url) {
    let p;
    try { p = new URL(url, document.baseURI).pathname; } catch (e) { return null; }
    const b = kok();
    if (b && p.indexOf(b) === 0) p = p.slice(b.length);
    p = p.replace(/^\/+/, "");
    return GIZLI.indexOf(p) >= 0 || p.indexOf(RESIM_ON) === 0 ? p : null;
  }

  function depodanAnahtar() {
    try { return sessionStorage.getItem(ANAHTAR) || localStorage.getItem(ANAHTAR); } catch (e) { return null; }
  }

  async function anahtarIceAl(raw) {
    return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
  }

  async function dogrulaAnahtar(m, key) {
    try {
      const ham = b64(m.dogrula);
      const d = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ham.slice(0, 12), additionalData: enc.encode("dogrula") }, key, ham.slice(12));
      return new TextDecoder().decode(d) === "dost-daphne-v1";
    } catch (e) { return false; }
  }

  // Geçerli bir anahtar var mı (depodaki)? Varsa CryptoKey döner.
  function anahtar() {
    if (anahtarSozu) return anahtarSozu;
    anahtarSozu = (async () => {
      const m = await manifest();
      if (!m) return null;
      const s = depodanAnahtar();
      if (!s) return null;
      try {
        const key = await anahtarIceAl(b64(s));
        if (await dogrulaAnahtar(m, key)) return key;
      } catch (e) { /* bozuk kayıt */ }
      kapat();
      return null;
    })();
    return anahtarSozu;
  }

  async function ac(parola, hatirla) {
    const m = await manifest();
    if (!m) return true;
    const temel = await crypto.subtle.importKey("raw", enc.encode(parola), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: b64(m.tuz), iterations: m.tur }, temel, 256);
    const key = await anahtarIceAl(bits);
    if (!(await dogrulaAnahtar(m, key))) return false;
    const raw = b64Yaz(new Uint8Array(bits));
    try {
      sessionStorage.setItem(ANAHTAR, raw);
      if (hatirla) localStorage.setItem(ANAHTAR, raw); else localStorage.removeItem(ANAHTAR);
    } catch (e) { /* depo yoksa bu sekmede çalışır (anahtarSozu) */ }
    anahtarSozu = Promise.resolve(key);
    return true;
  }

  function kapat() {
    try { sessionStorage.removeItem(ANAHTAR); localStorage.removeItem(ANAHTAR); } catch (e) {}
    anahtarSozu = null;
  }

  async function cozJson(url) {
    const yol = yolu(url);
    const m = await manifest();
    if (!m || !yol || !m.dosyalar[yol]) return null;     // kapı yok -> normal yol
    const key = await anahtar();
    // Kilitliyken istek hiç sonuçlanmaz: kapı sayfayı örter, doğru parolada sayfa yenilenir;
    // uygulamalar kapının arkasında hata günlüğü üretmesin diye reddetmiyoruz.
    // (Kapı arayüzü olmayan sayfada -- ör. sahibin araçları -- bekletmek yerine reddedilir.)
    if (!key) return window.__dostGizliKapi ? new Promise(() => {}) : Promise.reject(new Error("gizli: kilitli"));
    const r = await fetch(kok() + "/" + m.dosyalar[yol].enc);
    if (!r.ok) throw new Error("gizli: " + m.dosyalar[yol].enc + " HTTP " + r.status);
    const ham = new Uint8Array(await r.arrayBuffer());
    const gz = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ham.slice(0, 12), additionalData: enc.encode(yol) }, key, ham.slice(12));
    const akis = new Blob([gz]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(akis).text());
  }

  // Şifreli resim: çözülmüş webp için blob adresi (kapı yoksa düz adres). Kilitliyse null.
  async function cozBlob(url) {
    const yol = yolu(url);
    const m = await manifest();
    if (!yol) return null;
    if (!m) return kok() + "/" + yol;                      // özel repo: düz dosya
    if (!m.dosyalar[yol]) return null;
    const key = await anahtar();
    if (!key) return null;
    const r = await fetch(kok() + "/" + m.dosyalar[yol].enc);
    if (!r.ok) throw new Error("gizli: " + m.dosyalar[yol].enc + " HTTP " + r.status);
    const ham = new Uint8Array(await r.arrayBuffer());
    const dz = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ham.slice(0, 12), additionalData: enc.encode(yol) }, key, ham.slice(12));
    return URL.createObjectURL(new Blob([dz], { type: "image/webp" }));
  }

  window.DostGizli = {
    cozBlob,
    kapsar: (url) => !!yolu(url),
    // Kapı var mı? (manifest 404 -> false)
    gerekli: () => manifest().then((m) => !!m).catch(() => true),
    acikMi: () => anahtar().then((k) => !!k),
    ac, kapat, cozJson,
  };
})();
