(function () {
  "use strict";
  // Daphne sayfasının parola kapısı arayüzü (gizli-veri.js ile birlikte).
  // Kapı varsa (canlıda data/gizli/manifest.json var) ve geçerli anahtar yoksa: sayfa
  // opak bir kapıyla örtülür, arkasındaki içerik etkisizleştirilir (inert); doğru
  // parolada sayfa yeniden yüklenir. Geliştirmede (manifest yok) hiçbir şey yapmaz.
  const S = {
    tr: { b: "Bu sayfa özeldir", a: "Devam etmek için parolayı girin.", p: "Parola", h: "Bu cihazda hatırla", d: "Aç", e: "Parola doğru değil.", g: "Dost'a dön", y: "Kontrol ediliyor…" },
    en: { b: "This page is private", a: "Enter the passphrase to continue.", p: "Passphrase", h: "Remember on this device", d: "Open", e: "Incorrect passphrase.", g: "Back to Dost", y: "Checking…" },
    pt: { b: "Esta página é privada", a: "Digite a senha para continuar.", p: "Senha", h: "Lembrar neste dispositivo", d: "Abrir", e: "Senha incorreta.", g: "Voltar ao Dost", y: "Verificando…" },
  };
  window.__dostGizliKapi = true;   // gizli-veri.js: kilitliyken bekle (kapı çıkacak), yoksa reddet
  function dil() {
    try { const l = window.DostI18n && window.DostI18n.getLang(); if (S[l]) return l; } catch (e) {}
    return "tr";
  }
  const CSS = ".gizli-kapi{position:fixed;inset:0;z-index:1000;background:var(--page-plane,#f9f9f7);color:var(--text-primary,#1a1a1a);display:flex;align-items:center;justify-content:center;padding:24px;overflow:auto}"
    + ".gizli-kapi__kutu{width:min(360px,100%);display:flex;flex-direction:column;gap:14px}"
    + ".gizli-kapi h1{font-family:var(--font-display,Georgia,serif);font-size:1.5rem;margin:0}"
    + ".gizli-kapi p{margin:0;color:var(--text-secondary,#55544e)}"
    + ".gizli-kapi label{font-size:.9rem;color:var(--text-secondary,#55544e)}"
    + ".gizli-kapi input[type=password]{width:100%;min-height:48px;padding:10px 14px;font:inherit;font-size:1rem;border:1px solid var(--border,#dcdad2);border-radius:12px;background:var(--surface-1,#fff);color:inherit}"
    + ".gizli-kapi input[type=password]:focus-visible,.gizli-kapi button:focus-visible,.gizli-kapi a:focus-visible{outline:2px solid var(--accent-interactive,#8a6100);outline-offset:2px}"
    + ".gizli-kapi__sat{display:flex;align-items:center;gap:8px}"
    + ".gizli-kapi input[type=checkbox]{width:20px;height:20px}"
    + ".gizli-kapi button{min-height:48px;border-radius:24px;border:0;background:var(--accent-interactive,#8a6100);color:#fff;font:inherit;font-weight:600;cursor:pointer}"
    + ".gizli-kapi button[disabled]{opacity:.6;cursor:wait}"
    + ".gizli-kapi__hata{min-height:1.4em;color:var(--series-celal,#a83246)}"
    + ".gizli-kapi a{color:var(--accent-interactive,#8a6100)}";

  async function basla() {
    const G = window.DostGizli;
    if (!G) return;
    let gerekli = false;
    try { gerekli = await G.gerekli(); } catch (e) { gerekli = true; }
    if (!gerekli) return;
    if (await G.acikMi().catch(() => false)) return;

    const t = S[dil()];
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    const kapi = document.createElement("div");
    kapi.className = "gizli-kapi"; kapi.setAttribute("role", "dialog"); kapi.setAttribute("aria-modal", "true"); kapi.setAttribute("aria-labelledby", "gizli-baslik");
    kapi.innerHTML = '<form class="gizli-kapi__kutu" autocomplete="off">'
      + '<h1 id="gizli-baslik"></h1><p></p>'
      + '<div><label for="gizli-parola"></label><input id="gizli-parola" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false" required></div>'
      + '<div class="gizli-kapi__sat"><input id="gizli-hatirla" type="checkbox" checked><label for="gizli-hatirla"></label></div>'
      + '<div class="gizli-kapi__hata" role="alert"></div><button type="submit"></button><a href="/"></a></form>';
    kapi.querySelector("h1").textContent = t.b;
    kapi.querySelector("p").textContent = t.a;
    kapi.querySelector('label[for="gizli-parola"]').textContent = t.p;
    kapi.querySelector('label[for="gizli-hatirla"]').textContent = t.h;
    kapi.querySelector("button").textContent = t.d;
    kapi.querySelector("a").textContent = t.g;
    document.body.appendChild(kapi);
    // Arkadaki sayfa Tab/ekran okuyucu için kapanır.
    const arka = [...document.body.children].filter((e) => e !== kapi && !/^(SCRIPT|STYLE|LINK)$/.test(e.tagName));
    arka.forEach((e) => { e.inert = true; e.setAttribute("aria-hidden", "true"); });
    const inp = kapi.querySelector("#gizli-parola");
    inp.focus();
    const form = kapi.querySelector("form"), hata = kapi.querySelector(".gizli-kapi__hata"), dugme = kapi.querySelector("button");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!inp.value) return;
      dugme.disabled = true; dugme.textContent = t.y; hata.textContent = "";
      let ok = false;
      try { ok = await G.ac(inp.value, kapi.querySelector("#gizli-hatirla").checked); } catch (err) { ok = false; }
      if (ok) { location.reload(); return; }
      dugme.disabled = false; dugme.textContent = t.d; hata.textContent = t.e; inp.select();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", basla); else basla();
})();
