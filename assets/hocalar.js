window.__hocalarApp=(function(){"use strict";const I=window.DostI18n,m=window.DostGraphUtils,A=document.getElementById("hocalar-wrap"),v=document.getElementById("hocalar-list"),$=document.getElementById("hocalar-diger"),p=document.getElementById("detail-panel"),M=document.getElementById("detail-content");if(!A||!v)return{activate(){},onLangChange(){},goToNode(){}};const e=I.pick3;let u=null,h=[],_=null;function S(a){const t=a.baglam?`<p class="hoca-alinti__baglam">${e(a.baglam)}</p>`:"";return`<blockquote class="hoca-alinti">
      <p class="hoca-alinti__metin">${e(a.metin)}</p>
      ${t}
      <cite class="hoca-alinti__kaynak">${k(a.kaynak.eser)}, ${e({tr:"s.",en:"p.",pt:"p."})} ${w(a.kaynak.sayfa)}</cite>
    </blockquote>`}function k(a){return String(a).replace(/çev\./,e({tr:"\xE7ev.",en:"transl.",pt:"trad."}))}function w(a){return k(String(a).replace(/^giriş, ~s\. (\d+)$/,(t,i)=>e({tr:t,en:"introduction, c. p. "+i,pt:"introdu\xE7\xE3o, c. p. "+i})))}function D(a){return a.map(t=>{const i=t.yil?", "+t.yil:"",s=t.not?e({tr:t.not,en:t.not_en||t.not,pt:t.not_pt||t.not}):"",l=s?` <span class="bilmiyoruz-madde__kaynak-not">\u2014 ${s}</span>`:"";return`<li class="bilmiyoruz-madde__kaynak">${k(t.yazar)}, <em>${t.eser}</em>${i}${l}</li>`}).join("")}function g(a){window.__dostNav&&window.__dostNav.setHash("hocalar",String(a.id)),_=a.id,M.innerHTML=`
      <p class="detail-eyebrow">${e(a.konum)}
        <span class="hoca-sira-rozet">${a.sira}</span></p>
      <h2 class="detail-title">${e(a.ad)}</h2>
      <p class="hoca-kimlik">${e(a.kimlik)}</p>
      <div class="detail-block detail-block--soru"><p>${e(a.ozet)}</p></div>
      <p class="hoca-sozler-baslik">${e({tr:"Kendi a\u011Fz\u0131ndan",en:"In his own words",pt:"Nas suas pr\xF3prias palavras"})}</p>
      <div class="hoca-sozler">${a.alintilar.map(S).join("")}</div>
      <details class="eser-agi-kaynak-detay hoca-kaynak-detay">
        <summary>${e({tr:"Kaynaklar",en:"Sources",pt:"Fontes"})}</summary>
        <ul class="bilmiyoruz-madde__kaynaklar">${D(a.kaynaklar)}</ul>
      </details>`,p.hidden=!1}function j(){const a=`<div class="hocalar-giris">
        <h2 class="hocalar-giris__baslik">${e({tr:"Hocalar",en:"Teachers",pt:"Mestres"})}</h2>
        <p class="hocalar-giris__not">${e(u.not)}</p>
      </div>`;v.innerHTML=a+h.map(t=>`<button class="hoca-satir" type="button" data-id="${t.id}">
        <span class="hoca-satir__sira">${t.sira}</span>
        <span class="hoca-satir__govde">
          <span class="hoca-satir__ad">${e(t.ad)}</span>
          <span class="hoca-satir__konum">${e(t.konum)}</span>
        </span>
      </button>`).join(""),v.querySelectorAll(".hoca-satir").forEach(t=>{t.addEventListener("click",()=>{const i=h.find(s=>s.id===t.dataset.id);i&&g(i)})})}function P(a){if(!a||!a.kisiler||!a.kisiler.length)return"";const t=h.slice(0,2).concat(a.kisiler),i=t.length,s=160,l=148,o=112,r=t.map((n,f)=>{const c=i===1?.5:f/(i-1),b=Math.PI*(.08+c*.84),H=s+o*Math.cos(b),N=l-o*Math.sin(b);return{ad:e(n.ad),id:n.id,x:H,y:N,tiklanabilir:f<2}}),z=r.map(n=>`<line class="hoca-vuslat__cizgi" x1="${n.x.toFixed(1)}" y1="${n.y.toFixed(1)}" x2="${s}" y2="${l}" />`).join(""),E=r.map((n,f)=>{const c=[""];n.ad.split(/\s+/).forEach(d=>{const y=c[c.length-1];y?(y+" "+d).length<=16||c.length>=2?c[c.length-1]=y+" "+d:c.push(d):c[c.length-1]=d});const b=c.map((d,y)=>{const G=d.length>24?d.slice(0,23)+"\u2026":d;return`<tspan x="@X@" dy="${y===0?0:11}">${G}</tspan>`}).join(" "),H=f%2===0?10:24,N=n.y<l-10?n.y-H:n.y+18,q=n.tiklanabilir?` data-id="${n.id}" tabindex="0" role="button" aria-label="${n.ad}"`:"",Y=n.tiklanabilir?"":`<title>${n.ad}</title>`;return`<g class="hoca-vuslat__nokta${n.tiklanabilir?" hoca-vuslat__nokta--tiklanabilir":""}"${q}>
        ${Y}<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="5"></circle>
        <text x="${n.x.toFixed(1)}" y="${(N-(c.length>1&&n.y<l-10?11:0)).toFixed(1)}" text-anchor="middle">${b.replace(/@X@/g,n.x.toFixed(1))}</text>
      </g>`}).join("");return`<svg class="hoca-vuslat" viewBox="0 -12 320 202" aria-label="${e({tr:"Alt\u0131s\u0131 da F\xFCt\xFBh\xE2t-\u0131 Mekkiyye'nin ayn\u0131 b\xF6l\xFCm\xFCnde (s. 335) bir arada an\u0131l\u0131yor",en:"All six are named together in the same chapter of the al-Futuhat al-Makkiyya (p. 335)",pt:"Todos os seis s\xE3o nomeados juntos no mesmo cap\xEDtulo do al-Futuhat al-Makkiyya (p. 335)"})}">
      ${z}
      <circle class="hoca-vuslat__merkez" cx="${s}" cy="${l}" r="7"></circle>
      <text class="hoca-vuslat__merkez-etiket" x="${s}" y="${l+24}" text-anchor="middle">${e({tr:"F\xFCt\xFBh\xE2t, s. 335",en:"Futuhat, p. 335",pt:"Futuhat, p. 335"})}</text>
      ${E}
    </svg>`}function C(){$&&$.querySelectorAll(".hoca-vuslat__nokta--tiklanabilir").forEach(a=>{const t=()=>{const i=h.find(s=>s.id===a.dataset.id);i&&g(i)};a.addEventListener("click",t),a.addEventListener("keydown",i=>{(i.key==="Enter"||i.key===" ")&&(i.preventDefault(),t())})})}function L(){if(!$)return;let a="";const t=u.digerVeraEhli;if(t){const l=t.kisiler.map(o=>`<li class="hocalar-diger__satir"><strong>${e(o.ad)}</strong> \u2014 ${e(o.konum)}</li>`).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"F\xFCt\xFBh\xE2t'ta da ad\u0131 ge\xE7en di\u011Ferleri",en:"Others also named in the Futuhat",pt:"Outros tamb\xE9m nomeados nas Futuhat"})}</p>
        <p class="hocalar-diger__not">${e(t.not)}</p>
        ${P(t)}
        <ul class="hocalar-diger__liste">${l}</ul>
        ${S(t.paylasilanNot)}`}const i=u.digerBolumlerdeAnilanlar;if(i&&i.length){const l=i.map(o=>`<div class="hocalar-diger__satir">
           <strong>${e(o.ad)}</strong>
           <p class="hoca-alinti__baglam">${e(o.not)}</p>
           <cite class="hoca-alinti__kaynak">${k(o.kaynak.eser)}, ${e({tr:"s.",en:"p.",pt:"p."})} ${w(o.kaynak.sayfa)}</cite>
         </div>`).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"F\xFCt\xFBh\xE2t'\u0131n ba\u015Fka b\xF6l\xFCmlerinde ge\xE7en izler",en:"Traces in other chapters of the Futuhat",pt:"Vest\xEDgios em outros cap\xEDtulos das Futuhat"})}</p>
        <div class="hocalar-diger__liste">${l}</div>`}const s=u.hirkaSilsilesi;if(s&&s.kisiler&&s.kisiler.length){const l={"hirka-veren":{tr:"h\u0131rka veren",en:"gave the robe",pt:"deu o manto"},"hirka-alan":{tr:"h\u0131rka alan",en:"received the robe",pt:"recebeu o manto"}},o=s.kisiler.map(r=>{const z=l[r.rol]||l["hirka-veren"],E=(r.yil_hicri?"h."+r.yil_hicri+", ":"")+e(r.yer);return`<div class="hocalar-diger__satir">
          <strong>${e(r.ad)}</strong>
          <span class="hocalar-diger__rozet hocalar-diger__rozet--${r.rol}">${e(z)}</span>
          <span class="hocalar-diger__meta"> \u2014 ${E}</span>
          <p class="hoca-alinti__baglam">${e(r.not)}</p>
          <cite class="hoca-alinti__kaynak">${k(r.kaynak.eser)}, ${w(r.kaynak.sayfa)}</cite>
        </div>`}).join("");a+=`
        <p class="detail-eyebrow detail-eyebrow--section">${e({tr:"H\u0131rka silsilesi (Neseb\xFC'l-H\u0131rka'dan)",en:"Chain of the robe (from Neseb\xFC'l-H\u0131rka)",pt:"Cadeia do manto (do Neseb\xFC'l-H\u0131rka)"})}</p>
        <p class="hocalar-diger__not">${e(s.not)}</p>
        <div class="hocalar-diger__liste">${o}</div>`}$.innerHTML=a,C()}function x(){_=null,M.innerHTML=`
      <p class="detail-eyebrow">${e({tr:"Hocalar",en:"Teachers",pt:"Mestres"})}</p>
      <h2 class="detail-title">${e({tr:"Listenin sonundaki iki isim",en:"The last two names on the list",pt:"Os dois \xFAltimos nomes da lista"})}</h2>
      <div class="detail-block detail-block--soru"><p>${e(u.not)}</p></div>`,p.hidden=!1}let F=!1;function T(){if(F)return Promise.resolve();const a=window.__dostRouteBase||"",t=(a?a+"/":"")+"data/ibn-arabi/hocalar.json";return m.fetchJson(t).then(i=>{u=i,h=i.hocalar||[],F=!0,j(),L()})}let B=!1;function V(){B||(B=!0,m.setupDetailPanelFocus&&m.setupDetailPanelFocus(),m.registerStepBack("hocalar-wrap",()=>_?(x(),p.hidden=!0,window.__dostNav&&window.__dostNav.setHash("hocalar"),!0):!1))}return{activate(){V(),T().catch(()=>{window.DostViewStatus&&window.DostViewStatus.showError("hocalar-wrap",()=>window.__hocalarApp.activate())})},onLangChange(){if(F)if(j(),L(),_){const a=h.find(t=>t.id===_);a?g(a):p.hidden||x()}else p.hidden||x()},goToNode(a){this.activate(),T().then(()=>{const t=h.find(i=>i.id===a);t?g(t):a&&window.__dostNav&&window.__dostNav.setHash("hocalar")})}}})();
