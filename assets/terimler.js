(function(){"use strict";const ue=window.DostI18n,f=document.getElementById("terimler-list"),B=document.getElementById("detail-panel"),z=document.getElementById("detail-content");if(!f||!B||!z)return;const he=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let k=null,E=null,N=[],D=null,L=null;const t=ue.pick3;function S(e,a,i){return window.__dostCrossLink?window.__dostCrossLink.linkify(e,a,i):e}function P(e,a){if(!e)return"";if(e.length<=a)return e;const i=e.slice(0,a);return i.slice(0,i.lastIndexOf(" "))+"\u2026"}function ye(e){!window.__dostCrossLink||!window.__dostCrossLink.register||(Object.values(e.terms).forEach(a=>{const i=a.felsefi_tanim||{},r={tr:P(i.tr,160),en:P(i.en,160),pt:P(i.pt,160)};window.__dostCrossLink.register(a.title,"terimler",a.id,r)}),window.__dostCrossLink.notifyReady&&window.__dostCrossLink.notifyReady())}function te(){return k?Promise.resolve(k):E||(window.DostViewStatus&&window.DostViewStatus.showLoading("terimler-wrap"),E=window.DostGraphUtils.fetchJson("data/ibn-arabi/felsefi-terimler.json").then(e=>(k=e,ye(e),window.DostViewStatus&&window.DostViewStatus.hide("terimler-wrap"),e)).catch(e=>(console.error("Terimler s\xF6zl\xFC\u011F\xFC y\xFCklenemedi / Failed to load glossary",e),E=null,window.DostViewStatus&&window.DostViewStatus.showError("terimler-wrap",()=>window.__terimlerApp.activate()),null)),E)}function $e(){return D||(D=window.DostGraphUtils.fetchJson("data/ibn-arabi/turetilmis-kenarlar-terimler.json").then(e=>(N=e&&e.kenarlar||[],N)).catch(e=>(console.warn("T\xFCretilmi\u015F terim kenarlar\u0131 y\xFCklenemedi",e),D=null,[])),D)}let w=null,T=null;function pe(){return T||(T=window.DostGraphUtils.fetchJson("data/ibn-arabi/ceviri-kaybi.json").then(e=>(w=e||null,w)).catch(e=>(console.warn("\xC7eviri kayb\u0131 verisi y\xFCklenemedi",e),T=null,null)),T)}const ae={tr:{tr:"T\xFCrk\xE7e",en:"Turkish",pt:"Turco"},en:{tr:"\u0130ngilizce",en:"English",pt:"Ingl\xEAs"},pt:{tr:"Portekizce",en:"Portuguese",pt:"Portugu\xEAs"}};function be(e){const a=w&&w.terimler&&w.terimler[e];if(!a)return"";const i=a.diller.some(n=>window.DostGraphUtils.has3(n.kayip)),r=a.diller.map((n,s)=>i?`<button class="ceviri-kaybi__dil${s===0?" on":""}" type="button" data-dil="${n.dil}">${t(ae[n.dil])}: ${n.kelime}</button>`:`<span class="ceviri-kaybi__dil">${t(ae[n.dil])}: ${n.kelime}</span>`).join("");return`<div class="ceviri-kaybi">
      <p class="detail-eyebrow detail-eyebrow--section">${t({tr:"Arap\xE7a k\xF6k ve \xE7eviri kar\u015F\u0131l\u0131klar\u0131",en:"Arabic root and renderings",pt:"Raiz \xE1rabe e tradu\xE7\xF5es"})}</p>
      <p class="ceviri-kaybi__kok"><span class="ceviri-kaybi__harf" dir="rtl" lang="ar">${a.kok.harf}</span>
        <span class="ceviri-kaybi__translit">${a.kok.translit}</span></p>
      ${window.DostGraphUtils.has3(a.kok.anlam)?`<p class="ceviri-kaybi__kok-anlam">${t(a.kok.anlam)}</p>`:""}
      <div class="ceviri-kaybi__diller">${r}</div>
      ${i?`<p class="ceviri-kaybi__kayip" id="ceviri-kaybi-kayip">${t(a.diller[0].kayip)}</p>`:""}
      ${window.DostGraphUtils.has3(w.meta&&w.meta.not)?`<p class="ceviri-kaybi__not">${t(w.meta.not)}</p>`:""}
    </div>`}function fe(e){const a=w&&w.terimler&&w.terimler[e];if(!a)return;const i=z.querySelector(".ceviri-kaybi");i&&i.querySelectorAll(".ceviri-kaybi__dil").forEach(r=>{r.addEventListener("click",()=>{i.querySelectorAll(".ceviri-kaybi__dil").forEach(o=>o.classList.remove("on")),r.classList.add("on");const n=a.diller.find(o=>o.dil===r.dataset.dil),s=i.querySelector("#ceviri-kaybi-kayip");s&&n&&(s.textContent=t(n.kayip))})})}function ve(e){return k.groups.find(a=>a.id===e)}const ke={rings:'<circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="2.6"/>',branch:'<path d="M10 3v6M10 9l-5 8M10 9l5 8"/><circle cx="10" cy="3" r="1.6"/><circle cx="5" cy="17" r="1.6"/><circle cx="15" cy="17" r="1.6"/>',bolt:'<path d="M11 2 4 12h5l-1 6 7-10h-5l1-6z"/>',steps:'<path d="M3 17h4v-4h4V9h4V5h2"/>',rays:'<circle cx="10" cy="10" r="2.2"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.5 4.5l2 2M13.5 13.5l2 2M4.5 15.5l2-2M13.5 6.5l2-2"/>',eye:'<path d="M2 10s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5S2 10 2 10z"/><circle cx="10" cy="10" r="2.4"/>',flame:'<path d="M10 2c1 3-3 4-3 7.5a3 3 0 0 0 6 0C13 6.5 10.5 7 10 2z"/><path d="M7.5 12a2.5 4 0 0 0 5 0"/>',"dot-circle":'<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="1.6"/>',stroke:'<path d="M10 2v11"/><circle cx="10" cy="16" r="1.8"/>',star:'<path d="M10 2l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1z"/>',wave:'<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 4 0"/><path d="M2 7c2-3 4-3 6 0"/>',"veil-x":'<path d="M3 4c3 8 11 8 14 0" /><path d="M7 15l6-6M13 15L7 9"/>',veil:'<path d="M3 5c2 2 2 4 0 6M8 4c2 2 2 8 0 10M13 4c2 2 2 8 0 10M18 5c-2 2-2 4 0 6"/>',cycle:'<path d="M15.5 6.5A6 6 0 1 0 16 11"/><path d="M15.5 3v4h-4"/>',lamp:'<path d="M10 2a5 5 0 0 0-3 9c0 1 0 2 1 2h4c1 0 1-1 1-2a5 5 0 0 0-3-9z"/><path d="M8.5 16h3M9 18.5h2"/>',beam:'<path d="M10 2v4"/><path d="M6 8l8 0-2 10H8L6 8z"/>',scale:'<path d="M10 2v15M5 6h10M5 6l-2.5 6h5L5 6zM15 6l-2.5 6h5L15 6z"/>',compass:'<circle cx="10" cy="10" r="2"/><circle cx="10" cy="4" r="1.4"/><circle cx="16" cy="10" r="1.4"/><circle cx="10" cy="16" r="1.4"/><circle cx="4" cy="10" r="1.4"/><path d="M10 6v2M14 10h-2M10 14v-2M6 10h2"/>'},we={"toz-nitelik":"rings",siniflandirma:"branch","sebep-sonuc":"bolt","varlik-mertebesi":"steps","kozmik-hiyerarsi":"rays","kopru-kavram":"eye",firaset:"eye","nefsin-gucleri":"flame","ahad-vahid":"dot-circle","lafza-i-celal":"stroke","velayet-risalet":"star","sahv-sekr":"wave","itibar-edilmez":"veil-x","halvet-perdeleri":"veil","mebde-mead":"cycle","nubuvvetin-zarureti":"lamp","vahyin-mertebeleri":"beam","hayir-ve-ser":"scale","tezkire-i-erbaa":"compass","kutbiyet-hiyerarsisi":"steps","ahval-makamat":"wave","kurani-kozmoloji":"rays","idrak-sureci":"eye","kader-tevhid":"rays"};function _e(e){const a=we[e]||"dot-circle";return`<svg class="terim-card__icon-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ke[a]}</svg>`}let re=0;function $(e,a,i,r,n,s){const o="tdIsik"+re++,l="var(--series-theme)";let c;return n==="mutual"?c=`<stop offset="0%" style="stop-color:${l};stop-opacity:0.12"/><stop offset="50%" style="stop-color:${l};stop-opacity:0.95"/><stop offset="100%" style="stop-color:${l};stop-opacity:0.12"/>`:n==="return"?c=`<stop offset="0%" style="stop-color:${l};stop-opacity:0.9"/><stop offset="100%" style="stop-color:${l};stop-opacity:0.1"/>`:c=`<stop offset="0%" style="stop-color:${l};stop-opacity:0.1"/><stop offset="100%" style="stop-color:${l};stop-opacity:0.9"/>`,`<defs><linearGradient id="${o}" x1="${e}" y1="${a}" x2="${i}" y2="${r}" gradientUnits="userSpaceOnUse">${c}</linearGradient></defs><line class="term-diagram-isikyolu${s?" "+s:""}" data-isikyolu-yon="${n||"oneway"}" x1="${e}" y1="${a}" x2="${i}" y2="${r}" stroke="url(#${o})"/>`}const Me=7,Fe=6.5,Le=7.4;function p(e){return t(e).length*Me}function u(e){return t(e).length*Fe}function M(e){return t(e).length*Le}function F(e,a){const i=e.length>14;return{yari:e.length*7/2,tasma:i?22:0,metin(r,n,s){const o=i?n+(s||a)+17:n+5;return`<text class="term-diagram-label term-diagram-label--small" x="${r.toFixed(0)}" y="${o.toFixed(0)}" text-anchor="middle">${e}</text>`}}}function U(e,a,i,r){const n=e.getTotalLength?e.getTotalLength():0;if(!n)return;const s=e.parentNode,o=document.createElementNS("http://www.w3.org/2000/svg","circle");o.setAttribute("class","term-diagram-kivilcim"),o.setAttribute("r","4"),o.setAttribute("opacity","0"),s.appendChild(o);const l=performance.now()+a;function c(m){if(!e.isConnected){o.remove();return}const x=(m-l)/i;if(x<0){requestAnimationFrame(c);return}if(x>=1){o.remove();return}const d=e.getPointAtLength((r?1-x:x)*n);o.setAttribute("cx",d.x),o.setAttribute("cy",d.y),o.setAttribute("opacity",Math.sin(x*Math.PI).toFixed(3)),requestAnimationFrame(c)}requestAnimationFrame(c)}function ie(e){if(he||!e)return;e.querySelectorAll(".term-diagram-isikyolu").forEach((i,r)=>{const n=i.dataset.isikyoluYon,s=r*90;n==="mutual"?(U(i,s,1300,!1),U(i,s+140,1300,!0)):U(i,s,1100,n==="return")})}const se={"mutual-vs-oneway":e=>{const a=Math.max(p(e.left),p(e.oneWayFrom))/2,i=Math.max(p(e.right),p(e.oneWayTo))/2,r=Math.max(60,a+8),n=Math.max(60,i+8),s=Math.max(340,r+n+200,u(e.mutualLabel)+30,u(e.oneWayLabel)+30),o=s-n,l=s/2;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} 162" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node" cx="${r.toFixed(0)}" cy="34" r="24"/>
        <text class="term-diagram-label" x="${r.toFixed(0)}" y="39" text-anchor="middle">${t(e.left)}</text>
        <circle class="term-diagram-node" cx="${o.toFixed(0)}" cy="34" r="24"/>
        <text class="term-diagram-label" x="${o.toFixed(0)}" y="39" text-anchor="middle">${t(e.right)}</text>
        ${$(r+26,34,o-26,34,"mutual")}
        <text class="term-diagram-note" x="${l.toFixed(0)}" y="18" text-anchor="middle">${t(e.mutualLabel)}</text>

        <circle class="term-diagram-node term-diagram-node--accent" cx="${r.toFixed(0)}" cy="116" r="24"/>
        <text class="term-diagram-label" x="${r.toFixed(0)}" y="121" text-anchor="middle">${t(e.oneWayFrom)}</text>
        <circle class="term-diagram-node" cx="${o.toFixed(0)}" cy="116" r="24"/>
        <text class="term-diagram-label" x="${o.toFixed(0)}" y="121" text-anchor="middle">${t(e.oneWayTo)}</text>
        ${$(r+26,116,o-26,116,"oneway")}
        <text class="term-diagram-note term-diagram-note--accent" x="${l.toFixed(0)}" y="152" text-anchor="middle">${t(e.oneWayLabel)}</text>
      </svg>
    `},"host-satellite":e=>{const a=Math.max(150,Math.max(p(e.host),p(e.satellite))/2+20),i=100,r=32,n=15,s=62,l=[-90,30,150].map(c=>{const m=c*Math.PI/180,x=a+s*Math.cos(m),d=i+s*Math.sin(m);return`
          <line class="term-diagram-tether" x1="${a}" y1="${i}" x2="${x}" y2="${d}"/>
          <circle class="term-diagram-node term-diagram-node--dashed" cx="${x}" cy="${d}" r="${n}"/>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${(a*2).toFixed(0)} 186" role="img" aria-label="${t(e.note)}">
        ${l}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${a}" cy="${i}" r="${r}"/>
        <text class="term-diagram-label term-diagram-label--host" x="${a}" y="${i+5}" text-anchor="middle">${t(e.host)}</text>
        <text class="term-diagram-label term-diagram-label--small" x="${a}" y="${i-s-22}" text-anchor="middle">${t(e.satellite)}</text>
      </svg>
    `},"formula-merge":e=>{const a=t(e.a),i=t(e.b),r=Math.max(300,2*(88+Math.max(a.length,i.length)*3.5)),n=r/2;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} 150" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node--venn" cx="${(n-38).toFixed(0)}" cy="75" r="58"/>
        <circle class="term-diagram-node--venn" cx="${(n+38).toFixed(0)}" cy="75" r="58"/>
        <text class="term-diagram-label--small" x="${(n-82).toFixed(0)}" y="75" text-anchor="middle">${a}</text>
        <text class="term-diagram-label--small" x="${(n+82).toFixed(0)}" y="75" text-anchor="middle">${i}</text>
        <text class="term-diagram-label term-diagram-label--result" x="${n.toFixed(0)}" y="80" text-anchor="middle">${t(e.result)}</text>
      </svg>
    `},spectrum:e=>{const a=c=>t(c).length,i=Math.max(a(e.leftMarker),a(e.rightMarker))*3.1,r=Math.max(a(e.leftLabel)*7.6,a(e.leftNote)*7),n=Math.max(a(e.rightLabel)*7.6,a(e.rightNote)*7),s=Math.max(360,r+n+40,i*2+180),o=Math.max(80,i+14),l=s-o;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} 120" role="img" aria-label="${t(e.note)}">
        ${$(o-50,55,l+50,55,"mutual")}
        <circle class="term-diagram-node term-diagram-node--sm" cx="${o.toFixed(0)}" cy="55" r="16"/>
        <circle class="term-diagram-node term-diagram-node--accent term-diagram-node--sm" cx="${l.toFixed(0)}" cy="55" r="16"/>
        <text class="term-diagram-note" x="${o.toFixed(0)}" y="90" text-anchor="middle">${t(e.leftMarker)}</text>
        <text class="term-diagram-note" x="${l.toFixed(0)}" y="90" text-anchor="middle">${t(e.rightMarker)}</text>
        <text class="term-diagram-label" x="14" y="20" text-anchor="start">${t(e.leftLabel)}</text>
        <text class="term-diagram-label--small" x="14" y="35" text-anchor="start">${t(e.leftNote)}</text>
        <text class="term-diagram-label" x="${(s-14).toFixed(0)}" y="20" text-anchor="end">${t(e.rightLabel)}</text>
        <text class="term-diagram-label--small" x="${(s-14).toFixed(0)}" y="35" text-anchor="end">${t(e.rightNote)}</text>
      </svg>
    `},cascade:e=>{const a=e.steps.length,i=e.yon==="yukselis",r=e.steps.map(d=>t(d)),n=Math.max.apply(null,r.map(d=>d.length*7)),s=t(e.relationLabel),o=Math.max(66+n+12,s.length*6.2+24),l=(a-1)*64+60+28,c=d=>30+(i?a-1-d:d)*64,m=r.map((d,g)=>{const y=c(g);return`
          <circle class="term-diagram-node${g===0?" term-diagram-node--accent":""}" cx="34" cy="${y}" r="22"/>
          <text class="term-diagram-label--small" x="66" y="${y+5}" text-anchor="start">${d}</text>
        `}).join(""),x=r.slice(1).map((d,g)=>{const y=c(g)+(i?-24:24),v=c(g+1)+(i?24:-24);return $(34,y,34,v,"oneway")}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${o.toFixed(0)} ${l}" role="img" aria-label="${t(e.note)}">
        ${x}${m}
        <text class="term-diagram-note" x="${(o/2).toFixed(0)}" y="${l-8}" text-anchor="middle">${s}</text>
      </svg>
    `},mirror:e=>{const a=F(t(e.source),26),i=F(t(e.target),26),r=Math.max(55,a.yari+10),n=Math.max(300,r+Math.max(55,i.yari+10)+190),s=n-Math.max(55,i.yari+10),o=120+Math.max(a.tasma,i.tasma);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} ${o.toFixed(0)}" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--accent" cx="${r.toFixed(0)}" cy="55" r="26"/>
        ${a.metin(r,55,26)}
        <line class="term-diagram-mirror" x1="${(n/2+10).toFixed(0)}" y1="15" x2="${(n/2-10).toFixed(0)}" y2="95"/>
        ${$(r+28,55,s-30,55,"oneway")}
        <circle class="term-diagram-node term-diagram-node--faint" cx="${s.toFixed(0)}" cy="55" r="26"/>
        ${i.metin(s,55,26)}
      </svg>
    `},"seal-wax":e=>`
      <svg class="term-diagram__svg" viewBox="0 0 300 130" role="img" aria-label="${t(e.note)}">
        <ellipse class="term-diagram-node term-diagram-node--faint" cx="150" cy="90" rx="90" ry="30"/>
        <text class="term-diagram-label term-diagram-label--small" x="150" y="95" text-anchor="middle">${t(e.wax)}</text>
        <rect class="term-diagram-node term-diagram-node--accent" x="120" y="15" width="60" height="40" rx="8"/>
        <text class="term-diagram-label term-diagram-label--small" x="150" y="40" text-anchor="middle">${t(e.seal)}</text>
        ${$(150,58,150,68,"oneway")}
      </svg>
    `,"potential-actual":e=>{const a=F(t(e.potential),26),i=F(t(e.actual),26),r=Math.max(60,a.yari+10),n=Math.max(60,i.yari+10),s=Math.max(300,r+n+180),o=s-n,l=100+Math.max(a.tasma,i.tasma);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} ${l.toFixed(0)}" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--dashed" cx="${r.toFixed(0)}" cy="50" r="26"/>
        ${a.metin(r,50,26)}
        ${$(r+30,50,o-30,50,"oneway")}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${o.toFixed(0)}" cy="50" r="26"/>
        ${i.metin(o,50,26)}
      </svg>
    `},reins:e=>`
      <svg class="term-diagram__svg" viewBox="0 0 300 200" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--accent" cx="150" cy="42" r="32"/>
        <text class="term-diagram-label term-diagram-label--small" x="150" y="47" text-anchor="middle">${t(e.ruler)}</text>
        ${$(126,66,82,132,"oneway")}
        ${$(174,66,218,132,"oneway")}
        <circle class="term-diagram-node term-diagram-node--dashed" cx="70" cy="158" r="28"/>
        <text class="term-diagram-label term-diagram-label--small" x="70" y="163" text-anchor="middle">${t(e.left)}</text>
        <circle class="term-diagram-node term-diagram-node--dashed" cx="230" cy="158" r="28"/>
        <text class="term-diagram-label term-diagram-label--small" x="230" y="163" text-anchor="middle">${t(e.right)}</text>
        <text class="term-diagram-note" x="150" y="105" text-anchor="middle">${t(e.rulesLabel)}</text>
      </svg>
    `,eclipse:e=>`
      <svg class="term-diagram__svg" viewBox="0 0 340 160" role="img" aria-label="${t(e.note)}">
        <line class="term-diagram-mirror" x1="170" y1="10" x2="170" y2="150"/>

        <circle class="term-diagram-node term-diagram-node--accent" cx="85" cy="48" r="26"/>
        <text class="term-diagram-label term-diagram-label--small" x="85" y="53" text-anchor="middle">${t(e.sunLabel)}</text>
        <circle class="term-diagram-node term-diagram-node--dashed" cx="85" cy="112" r="18"/>
        <text class="term-diagram-label--small" x="85" y="116" text-anchor="middle">${t(e.moonLabel)}</text>
        <text class="term-diagram-note" x="85" y="145" text-anchor="middle">${t(e.presentCaption)}</text>

        <circle class="term-diagram-node term-diagram-node--faint" cx="255" cy="48" r="26"/>
        <text class="term-diagram-label term-diagram-label--small" x="255" y="53" text-anchor="middle">${t(e.sunLabel)}</text>
        <circle class="term-diagram-node term-diagram-node--accent" cx="255" cy="112" r="18"/>
        <text class="term-diagram-label--small" x="255" y="116" text-anchor="middle">${t(e.moonLabel)}</text>
        <text class="term-diagram-note" x="255" y="145" text-anchor="middle">${t(e.absentCaption)}</text>
      </svg>
    `,"letter-sequence":e=>{const a=e.letters.length,i=e.letters.map(c=>t(c.anlam)),r=Math.max.apply(null,i.map(c=>c.length*7)),n=Math.max(96,r+10),s=r/2+10,o=s*2+n*(a-1),l=e.letters.map((c,m)=>{const x=s+m*n;return`
          <circle class="term-diagram-node ${c.hidden?"term-diagram-node--dashed":m===0?"term-diagram-node--accent":"term-diagram-node"}" cx="${x.toFixed(0)}" cy="50" r="21"/>
          <text class="term-diagram-label" x="${x.toFixed(0)}" y="55" text-anchor="middle">${t(c.harf)}</text>
          <text class="term-diagram-label--small" x="${x.toFixed(0)}" y="93" text-anchor="middle">${i[m]}</text>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${o.toFixed(0)} 115" role="img" aria-label="${t(e.note)}">
        ${l}
      </svg>
    `},"tinted-glass":e=>{const a=t(e.reasonReading),i=t(e.senseReading),r=Math.max(a.length,i.length)*3.1+12,n=Math.max(360,r*4),s=n/2;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} 130" role="img" aria-label="${t(e.note)}">
        ${$(20,65,s-12,65,"oneway")}
        <rect class="term-diagram-node--dashed" x="${(s-12).toFixed(0)}" y="25" width="24" height="80" style="fill:none"/>
        ${$(s+12,65,n-22,65,"oneway")}
        <text class="term-diagram-label--small" x="${s.toFixed(0)}" y="18" text-anchor="middle">${t(e.glassLabel)}</text>
        <text class="term-diagram-note" x="${(s/2).toFixed(0)}" y="45" text-anchor="middle">${a}</text>
        <text class="term-diagram-note--accent" x="${(s+s/2).toFixed(0)}" y="45" text-anchor="middle">${i}</text>
      </svg>
    `},"heart-visitors":e=>{const o=e.visitors.length,l=e.visitors.map((c,m)=>{const d=(-90+360/o*m)*Math.PI/180,g=170+112*Math.cos(d),y=170+112*Math.sin(d),v=c.accent?"term-diagram-node--accent":"term-diagram-node--dashed";return`
          <line class="term-diagram-tether" x1="170" y1="170" x2="${g}" y2="${y}"/>
          <circle class="term-diagram-node ${v}" cx="${g}" cy="${y}" r="26"/>
          <text class="term-diagram-label--small" x="${g}" y="${y+4}" text-anchor="middle">${t(c.label)}</text>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 340 340" role="img" aria-label="${t(e.note)}">
        ${l}
        <circle class="term-diagram-node term-diagram-node--faint" cx="170" cy="170" r="34"/>
        <text class="term-diagram-label" x="170" y="175" text-anchor="middle">${t(e.center)}</text>
      </svg>
    `},"berzah-ara-bolge":e=>`
      <svg class="term-diagram__svg" viewBox="0 0 340 180" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node--venn" cx="122" cy="80" r="72"/>
        <circle class="term-diagram-node--venn" cx="218" cy="80" r="72"/>
        <path class="term-diagram-node--venn" d="M 170 26.33 A 72 72 0 0 1 170 133.67 A 72 72 0 0 1 170 26.33 Z"/>
        <text class="term-diagram-label--small" x="66" y="84" text-anchor="middle">${t(e.left)}</text>
        <text class="term-diagram-label--small" x="274" y="84" text-anchor="middle">${t(e.right)}</text>
        <text class="term-diagram-label term-diagram-label--small" x="170" y="84" text-anchor="middle">${t(e.middle)}</text>
        <text class="term-diagram-note--accent" x="170" y="170" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `,"sarmal-mertebe":e=>{const a=e.ranks.length,i=360/Math.max(a,1),r=56,n=138,s=h=>h===0?0:r+(n-r)*(h-1)/Math.max(a-2,1),o=h=>(-90+i*h)*Math.PI/180,l=h=>{const b=o(h),_=s(h);return{x:_*Math.cos(b),y:_*Math.sin(b),a:b}},c=[];for(let h=0;h<=(a-1)*16;h+=1){const b=l(h/16);c.push([b.x,b.y])}const m=e.ranks.map((h,b)=>{const _=l(b),de=t(h),Q=b===0||Math.abs(Math.cos(_.a))>=.3,xe=b===0?-1:Math.sign(Math.cos(_.a)),Z=Q?xe>0?"start":"end":"middle",O=Q?_.x+xe*26:_.x,it=Q?_.y+4:_.y+(Math.sin(_.a)>=0?28:-18),ee=de.length*7,ge=Z==="start"?O:Z==="end"?O-ee:O-ee/2;return{p:_,i:b,yazi:de,lx:O,ly:it,anchor:Z,x0:ge,x1:ge+ee}});let x=1/0,d=-1/0,g=1/0,y=-1/0;c.forEach(([h,b])=>{x=Math.min(x,h-14),d=Math.max(d,h+14),g=Math.min(g,b-14),y=Math.max(y,b+14)}),m.forEach(h=>{x=Math.min(x,h.x0),d=Math.max(d,h.x1),g=Math.min(g,h.ly-12),y=Math.max(y,h.ly+6)});const v=t(e.caption),A=v.length*6.2/2,q=(x+d)/2;x=Math.min(x,q-A),d=Math.max(d,q+A);const C=10,tt=x-C,ce=g-C,at=d-x+C*2,me=y-g+C*2+26,rt=m.map(h=>`
          <circle class="term-diagram-node ${h.i===0?"term-diagram-node--dashed":"term-diagram-node"}"
                  cx="${h.p.x.toFixed(1)}" cy="${h.p.y.toFixed(1)}" r="${h.i===0?15:11}"/>
          <text class="term-diagram-label--small" x="${h.lx.toFixed(1)}" y="${h.ly.toFixed(1)}" text-anchor="${h.anchor}">${h.yazi}</text>
        `).join("");return`
      <svg class="term-diagram__svg" viewBox="${tt.toFixed(1)} ${ce.toFixed(1)} ${at.toFixed(1)} ${me.toFixed(1)}" role="img" aria-label="${t(e.note)}">
        <polyline class="term-diagram-tether" fill="none" points="${c.map(([h,b])=>h.toFixed(1)+","+b.toFixed(1)).join(" ")}"/>
        ${rt}
        <text class="term-diagram-note" x="${q.toFixed(1)}" y="${(ce+me-8).toFixed(1)}" text-anchor="middle">${v}</text>
      </svg>
    `},"kapsayan-secen":e=>{const r=new Set(e.selected||[3,9,12,16]);let n="";for(let s=0;s<3;s+=1)for(let o=0;o<7;o+=1){const l=s*7+o,c=80+o*50,m=52+s*42;n+=`<circle class="term-diagram-node term-diagram-node--sm" cx="${c}" cy="${m}" r="9"/>`,r.has(l)&&(n+=`<circle class="term-diagram-node--accent" cx="${c}" cy="${m}" r="15" style="fill:none"/>`)}return`
      <svg class="term-diagram__svg" viewBox="0 0 460 216" role="img" aria-label="${t(e.note)}">
        ${$(20,24,440,24,"mutual")}
        <text class="term-diagram-note" x="230" y="16" text-anchor="middle">${t(e.allLabel)}</text>
        ${n}
        <text class="term-diagram-note--accent" x="230" y="192" text-anchor="middle">${t(e.someLabel)}</text>
        <text class="term-diagram-note" x="230" y="209" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"cift-okunus":e=>{const n=e.stations.length,s=e.stations.map((o,l)=>{const c=(-90+360/n*l)*Math.PI/180,m=250+96*Math.cos(c),x=150+96*Math.sin(c),d=250+66*Math.cos(c),g=150+66*Math.sin(c),y=250+126*Math.cos(c),v=150+126*Math.sin(c),A=Math.abs(Math.cos(c))<.3?"middle":Math.cos(c)>0?"start":"end";return`
          <circle class="term-diagram-node" cx="${m.toFixed(1)}" cy="${x.toFixed(1)}" r="11"/>
          <text class="term-diagram-label--small" x="${y.toFixed(1)}" y="${(v+4).toFixed(1)}" text-anchor="${A}">${t(o)}</text>
          <text class="term-diagram-note--accent" x="${d.toFixed(1)}" y="${(g+4).toFixed(1)}" text-anchor="middle">${l+1}</text>
          <text class="term-diagram-note" x="${d.toFixed(1)}" y="${(g+18).toFixed(1)}" text-anchor="middle">${n-l}</text>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 500 330" role="img" aria-label="${t(e.note)}">
        ${s}
        <text class="term-diagram-note--accent" x="250" y="146" text-anchor="middle">${t(e.readingA)}</text>
        <text class="term-diagram-note" x="250" y="162" text-anchor="middle">${t(e.readingB)}</text>
        <text class="term-diagram-note" x="250" y="320" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"ayni-guc":e=>{const a=(l,c)=>{const m=`M ${l-44} 52 A 44 44 0 0 0 ${l+44} 52`;return c?`<path class="term-diagram-kap term-diagram-kap--kirik" d="${m}"/>`:`<path class="term-diagram-kap" d="${m}"/>`},i=l=>[200,235,270,305,340].map(c=>{const m=c*Math.PI/180;return $(l+22*Math.cos(m),60+22*Math.sin(m),l+52*Math.cos(m),60+52*Math.sin(m),"oneway")}).join(""),r=Math.max(56,p(e.solHal)/2,M(e.solSonuc)/2,p(e.sagHal)/2,u(e.sagSonuc)/2)+8,n=Math.max(r*4+40,u(e.caption)+30),s=n/2-r,o=n/2+r;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} 196" role="img" aria-label="${t(e.note)}">
        ${a(s,!1)}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${s}" cy="60" r="22"/>
        <text class="term-diagram-label--small" x="${s}" y="112" text-anchor="middle">${t(e.solHal)}</text>
        <text class="term-diagram-note--accent" x="${s}" y="132" text-anchor="middle">${t(e.solSonuc)}</text>

        ${i(o)}
        ${a(o,!0)}
        <circle class="term-diagram-node" cx="${o}" cy="60" r="22"/>
        <text class="term-diagram-label--small" x="${o}" y="112" text-anchor="middle">${t(e.sagHal)}</text>
        <text class="term-diagram-note" x="${o}" y="132" text-anchor="middle">${t(e.sagSonuc)}</text>

        <text class="term-diagram-note" x="${(n/2).toFixed(0)}" y="168" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-label term-diagram-label--small" x="${(n/2).toFixed(0)}" y="18" text-anchor="middle">${t(e.guc)}</text>
      </svg>
    `},"uc-kapi":e=>{const a=Math.max(150,Math.max.apply(null,e.kapilar.map(n=>Math.max(p(n.ad),M(n.hal))))+18),i=Math.max(a*e.kapilar.length,u(e.caption)+30),r=e.kapilar.map((n,s)=>{const o=(i-a*e.kapilar.length)/2+a/2+s*a,l=s===e.vurgu;let c="",m;return n.tur==="gecilmez"?(c=`<rect class="term-diagram-engel" x="${o-36}" y="86" width="72" height="9" rx="2"/>`,m=$(o,30,o,86,"oneway")):n.tur==="zorlanabilir"?(c=`<rect class="term-diagram-engel term-diagram-engel--kesik" x="${o-36}" y="86" width="26" height="9" rx="2"/><rect class="term-diagram-engel term-diagram-engel--kesik" x="${o+10}" y="86" width="26" height="9" rx="2"/>`,m=$(o,30,o,86,"oneway")+$(o,95,o,124,"oneway","term-diagram-isikyolu--kesik")):m=$(o,30,o,130,"oneway"),`${m}${c}
          <text class="term-diagram-label--small${l?"":" term-diagram-solgun"}" x="${o}" y="152" text-anchor="middle">${t(n.ad)}</text>
          <text class="term-diagram-note${l?"--accent":""}" x="${o}" y="170" text-anchor="middle">${t(n.hal)}</text>`}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} 214" role="img" aria-label="${t(e.note)}">
        ${r}
        <text class="term-diagram-note" x="${(i/2).toFixed(0)}" y="206" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"ikili-eslesme":e=>{const a=Math.max.apply(null,e.satirlar.map(m=>Math.max(t(m.sol).length,t(m.sag).length))),i=Math.max(74,a*3.7+10),r=Math.max(i*4+60,u(e.caption)+30,e.satirlar.some(m=>m.perde)?u(e.perdeLabel)+30:0),n=i+14,s=r-i-14,o=r/2,l=e.satirlar.map((m,x)=>{const d=62+x*96,g=m.perde?`<rect class="term-diagram-perde" x="${o-13}" y="${d-26}" width="26" height="52"/>
             <text class="term-diagram-note" x="${o}" y="${d-36}" text-anchor="middle">${t(e.perdeLabel)}</text>`:"",y=x===e.vurgu?" term-diagram-node--accent":"";return`${$(n+30,d,s-30,d,"oneway")}${g}
          <circle class="term-diagram-node${y}" cx="${n}" cy="${d}" r="26"/>
          <text class="term-diagram-label--small" x="${n}" y="${d+45}" text-anchor="middle">${t(m.sol)}</text>
          <circle class="term-diagram-node${y}" cx="${s}" cy="${d}" r="26"/>
          <text class="term-diagram-label--small" x="${s}" y="${d+45}" text-anchor="middle">${t(m.sag)}</text>`}).join(""),c=62+(e.satirlar.length-1)*96+82;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} ${c}" role="img" aria-label="${t(e.note)}">
        ${l}
        <text class="term-diagram-note" x="${o.toFixed(0)}" y="${c-10}" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},bulusma:e=>{const a=e.kaynaklar.length,i=Math.max.apply(null,e.kaynaklar.map(p)),r=Math.max(360,(138+i)*2+24,p(e.merkez)+80,u(e.caption)+30),n=r/2,s=178,o=116,l=e.kaynaklar.map((c,m)=>{const d=(-160+140*(a>1?m/(a-1):.5))*Math.PI/180,g=n+o*Math.cos(d),y=s+o*Math.sin(d),v=Math.cos(d),A=Math.abs(v)<.3?"middle":v>0?"start":"end",q=g+v*22,C=y+(Math.abs(v)<.3?-26:4);return`${$(g,y,n,s,"oneway")}
          <circle class="term-diagram-node term-diagram-node--sm" cx="${g.toFixed(1)}" cy="${y.toFixed(1)}" r="13"/>
          <text class="term-diagram-label--small" x="${q.toFixed(1)}" y="${C.toFixed(1)}" text-anchor="${A}">${t(c)}</text>`}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} 254" role="img" aria-label="${t(e.note)}">
        ${l}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${n.toFixed(0)}" cy="${s}" r="28"/>
        <text class="term-diagram-label--small" x="${n.toFixed(0)}" y="${s+5}" text-anchor="middle">${t(e.merkez)}</text>
        <text class="term-diagram-note" x="${n.toFixed(0)}" y="244" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"damla-deniz":e=>{const i=Math.max(420,u(e.caption)+30,196+M(e.fenaLabel)/2+20,316+M(e.bekaLabel)/2+20);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} 208" role="img" aria-label="${t(e.note)}">
        <rect class="term-diagram-deniz" x="0" y="92" width="${i.toFixed(0)}" height="72"/>
        <text class="term-diagram-label--small" x="${(i-28).toFixed(0)}" y="136" text-anchor="end">${t(e.deniz)}</text>

        <circle class="term-diagram-node${e.vurgu==="once"?" term-diagram-node--accent":""}" cx="76" cy="46" r="22"/>
        <text class="term-diagram-label--small" x="76" y="51" text-anchor="middle">${t(e.damla)}</text>
        ${$(76,70,172,122,"oneway")}

        <circle class="term-diagram-node--dashed term-diagram-eriyen${e.vurgu==="fena"?" term-diagram-node--accent":""}" cx="196" cy="126" r="22"/>
        <text class="term-diagram-note${e.vurgu==="fena"?"--accent":""}" x="196" y="82" text-anchor="middle">${t(e.fenaLabel)}</text>

        <circle class="term-diagram-eriyen term-diagram-eriyen--soluk${e.vurgu==="beka"?" term-diagram-node--accent":""}" cx="316" cy="126" r="22"/>
        <text class="term-diagram-note${e.vurgu==="beka"?"--accent":""}" x="316" y="82" text-anchor="middle">${t(e.bekaLabel)}</text>

        <text class="term-diagram-note" x="${(i/2).toFixed(0)}" y="198" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"suren-ve-biten":e=>{const a=Math.max(440,p(e.suren)+30,p(e.biten)+30,u(e.caption)+30,u(e.altCaption)+30),i=Math.round(a/2);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${a.toFixed(0)} 168" role="img" aria-label="${t(e.note)}">
        <defs>
          <linearGradient id="tdSurenG" x1="0" y1="0" x2="${a.toFixed(0)}" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" style="stop-color:var(--series-theme);stop-opacity:0"/>
            <stop offset="22%" style="stop-color:var(--series-theme);stop-opacity:0.5"/>
            <stop offset="78%" style="stop-color:var(--series-theme);stop-opacity:0.5"/>
            <stop offset="100%" style="stop-color:var(--series-theme);stop-opacity:0"/>
          </linearGradient>
        </defs>
        <rect x="0" y="54" width="${a.toFixed(0)}" height="34" fill="url(#tdSurenG)"/>
        <text class="term-diagram-label--small${e.vurgu==="suren"?"":" term-diagram-solgun"}" x="${i}" y="40" text-anchor="middle">${t(e.suren)}</text>

        <rect class="term-diagram-node${e.vurgu==="biten"?" term-diagram-node--accent":""} term-diagram-parca" x="${i-68}" y="58" width="136" height="26" rx="6"/>
        <line class="term-diagram-uc" x1="${i-68}" y1="50" x2="${i-68}" y2="92"/>
        <line class="term-diagram-uc" x1="${i+68}" y1="50" x2="${i+68}" y2="92"/>
        <text class="term-diagram-label--small${e.vurgu==="biten"?"":" term-diagram-solgun"}" x="${i}" y="112" text-anchor="middle">${t(e.biten)}</text>
        <text class="term-diagram-note" x="${i}" y="140" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-note" x="${i}" y="158" text-anchor="middle">${t(e.altCaption)}</text>
      </svg>
    `},"odunc-yetki":e=>{const a=Math.max(p(e.asil),p(e.vekil),p(e.alan))/2+30,i=Math.max(400,a*6,u(e.caption)+30,u(e.altCaption)+30),r=a,n=i/2,s=i-a;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} 168" role="img" aria-label="${t(e.note)}">
        ${$(r+30,58,n-26,58,"oneway")}
        ${$(n+26,58,s-30,58,"oneway")}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${r.toFixed(0)}" cy="58" r="30"/>
        ${F(t(e.asil),30).metin(r,58,30)}
        <circle class="term-diagram-node term-diagram-node--faint" cx="${n.toFixed(0)}" cy="58" r="26"/>
        ${F(t(e.vekil),26).metin(n,58,26)}
        <circle class="term-diagram-node term-diagram-node--dashed" cx="${s.toFixed(0)}" cy="58" r="26"/>
        ${F(t(e.alan),26).metin(s,58,26)}
        <text class="term-diagram-note" x="${n.toFixed(0)}" y="136" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-note" x="${n.toFixed(0)}" y="156" text-anchor="middle">${t(e.altCaption)}</text>
      </svg>
    `},"donen-kulluk":e=>{const r=Math.max(p(e.zorunlu),p(e.gonullu),u(e.zorunluNot),u(e.gonulluNot))/2+12,n=Math.max(420,r*2+220,u(e.caption)+30,M(e.donus)+60),s=Math.max(64,r),o=n-Math.max(64,r),l="tdIsik"+re++,c=o-10,m=74,x=s+10,g=`M ${c.toFixed(0)} ${m} Q ${((s+o)/2).toFixed(0)} 0 ${x.toFixed(0)} 74`,y="var(--series-theme)";return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} 206" role="img" aria-label="${t(e.note)}">
        <defs><linearGradient id="${l}" x1="${c.toFixed(0)}" y1="0" x2="${x.toFixed(0)}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" style="stop-color:${y};stop-opacity:0.1"/><stop offset="100%" style="stop-color:${y};stop-opacity:0.9"/></linearGradient></defs>
        <path class="term-diagram-isikyolu" data-isikyolu-yon="oneway" d="${g}" fill="none" stroke="url(#${l})"/>
        <text class="term-diagram-note term-diagram-note--accent" x="${((s+o)/2).toFixed(0)}" y="24" text-anchor="middle">${t(e.donus)}</text>
        <circle class="term-diagram-node term-diagram-node--accent" cx="${s.toFixed(0)}" cy="100" r="28"/>
        <circle class="term-diagram-node" cx="${o.toFixed(0)}" cy="100" r="28"/>
        <text class="term-diagram-label--small" x="${s.toFixed(0)}" y="148" text-anchor="middle">${t(e.zorunlu)}</text>
        <text class="term-diagram-note" x="${s.toFixed(0)}" y="166" text-anchor="middle">${t(e.zorunluNot)}</text>
        <text class="term-diagram-label--small" x="${o.toFixed(0)}" y="148" text-anchor="middle">${t(e.gonullu)}</text>
        <text class="term-diagram-note" x="${o.toFixed(0)}" y="166" text-anchor="middle">${t(e.gonulluNot)}</text>
        <text class="term-diagram-note" x="${(n/2).toFixed(0)}" y="198" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"kapisiz-ev":e=>{const a=[0,1,2,3,4].map(r=>`<rect class="term-diagram-sutun" x="${92+r*42}" y="66" width="12" height="72"/>`).join(""),i=Math.max(460,410+Math.max(p(e.disSutun),u(e.disNot))+14,u(e.caption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} 210" role="img" aria-label="${t(e.note)}">
        <path class="term-diagram-cati" d="M 62 58 L 200 22 L 338 58"/>
        <rect class="term-diagram-duvar" x="62" y="58" width="276" height="88"/>
        ${a}
        <text class="term-diagram-label--small" x="200" y="164" text-anchor="middle">${t(e.ev)}</text>
        <text class="term-diagram-note" x="200" y="182" text-anchor="middle">${t(e.evNot)}</text>

        <rect class="term-diagram-sutun term-diagram-sutun--dis" x="346" y="66" width="14" height="80"/>
        ${$(360,106,404,106,"return")}
        <text class="term-diagram-label--small" x="410" y="98" text-anchor="start">${t(e.disSutun)}</text>
        <text class="term-diagram-note--accent" x="410" y="118" text-anchor="start">${t(e.disNot)}</text>
        <text class="term-diagram-note" x="${(i/2).toFixed(0)}" y="204" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"yavas-sapma":e=>{const a=e.adimlar.length,i=Math.max.apply(null,e.adimlar.map(u))/2,r=Math.max(40,i+10),n=r+340,s=48,o=x=>{const d=x/Math.max(a-1,1);return{x:r+(n-r)*d,y:s+96*d*d}},l=[];for(let x=0;x<=40;x+=1){const d=x/40;l.push(`${(r+(n-r)*d).toFixed(1)},${(s+96*d*d).toFixed(1)}`)}const c=e.adimlar.map((x,d)=>{const g=o(d);return`<circle class="term-diagram-node term-diagram-node--sm term-diagram-node--accent" cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="7"/>
          <text class="term-diagram-note" x="${g.x.toFixed(1)}" y="${(g.y+22).toFixed(1)}" text-anchor="middle">${t(x)}</text>`}).join(""),m=Math.max(n+i+20,u(e.caption)+30,u(e.altCaption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${m.toFixed(0)} 226" role="img" aria-label="${t(e.note)}">
        <line class="term-diagram-node--barrier term-diagram-dogru-yol" x1="${r}" y1="${s}" x2="${(m-20).toFixed(0)}" y2="${s}"/>
        <text class="term-diagram-label--small" x="${(m-20).toFixed(0)}" y="${s-12}" text-anchor="end">${t(e.dogruYol)}</text>
        <polyline class="term-diagram-sapma" fill="none" points="${l.join(" ")}"/>
        ${c}
        <text class="term-diagram-note" x="${(m/2).toFixed(0)}" y="196" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-note" x="${(m/2).toFixed(0)}" y="216" text-anchor="middle">${t(e.altCaption)}</text>
      </svg>
    `},berraklik:e=>{const a=Math.max(420,u(e.caption)+30,112+Math.max(M(e.berrak),u(e.berrakSonuc))/2+20,308+Math.max(u(e.bulanik),u(e.bulanikSonuc))/2+20);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${a.toFixed(0)} 186" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--accent" cx="112" cy="66" r="34"/>
        <text class="term-diagram-label--small" x="112" y="71" text-anchor="middle">${t(e.nesne)}</text>
        <text class="term-diagram-note--accent" x="112" y="126" text-anchor="middle">${t(e.berrak)}</text>
        <text class="term-diagram-note" x="112" y="146" text-anchor="middle">${t(e.berrakSonuc)}</text>

        <g filter="url(#tdBulanik)">
          <circle class="term-diagram-node" cx="308" cy="66" r="34"/>
          <text class="term-diagram-label--small" x="308" y="71" text-anchor="middle">${t(e.nesne)}</text>
        </g>
        <text class="term-diagram-note" x="308" y="126" text-anchor="middle">${t(e.bulanik)}</text>
        <text class="term-diagram-note" x="308" y="146" text-anchor="middle">${t(e.bulanikSonuc)}</text>

        <text class="term-diagram-note" x="${(a/2).toFixed(0)}" y="176" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"bir-carpim":e=>{const a=e.satirlar.map((n,s)=>{const o=46+s*76;return`
          <circle class="term-diagram-node term-diagram-node--accent" cx="60" cy="${o}" r="24"/>
          <text class="term-diagram-label" x="60" y="${o+6}" text-anchor="middle">${t(e.bir)}</text>
          <text class="term-diagram-op" x="106" y="${o+6}" text-anchor="middle">\xD7</text>
          <circle class="term-diagram-node" cx="152" cy="${o}" r="24"/>
          <text class="term-diagram-label" x="152" y="${o+6}" text-anchor="middle">${t(n.carpan)}</text>
          <text class="term-diagram-op" x="198" y="${o+6}" text-anchor="middle">=</text>
          <circle class="term-diagram-node${n.ayni?" term-diagram-node--accent":""}" cx="244" cy="${o}" r="24"/>
          <text class="term-diagram-label" x="244" y="${o+6}" text-anchor="middle">${t(n.sonuc)}</text>
          <text class="term-diagram-note" x="300" y="${o+5}" text-anchor="start">${t(n.not)}</text>`}).join(""),i=46+(e.satirlar.length-1)*76+66,r=Math.max(520,300+Math.max.apply(null,e.satirlar.map(n=>u(n.not)))+16,u(e.caption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} ${i}" role="img" aria-label="${t(e.note)}">
        ${a}
        <text class="term-diagram-note" x="${(r/2).toFixed(0)}" y="${i-12}" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"bes-his":e=>{const a=(l,c,m)=>{const x=c.hisler.map((d,g)=>`
          <circle class="term-diagram-node term-diagram-node--sm" cx="${l}" cy="${58+g*46}" r="14"/>
          <text class="term-diagram-label--small" x="${l}" y="${86+g*46}" text-anchor="middle">${t(d)}</text>`).join("");return`<text class="term-diagram-note${m===2?"--accent":""}" x="${l}" y="26" text-anchor="middle">${t(c.ad)}</text>${x}`},i=Math.max(170,Math.max.apply(null,e.gruplar.map(l=>Math.max(M(l.ad),Math.max.apply(null,l.hisler.map(p)))))+16),r=i/2,n=r+i,s=n+i,o=Math.max(i*3,u(e.caption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${o.toFixed(0)} 200" role="img" aria-label="${t(e.note)}">
        ${$(r+20,58,s-20,58,"oneway")}
        ${$(n+20,58,s-20,58,"oneway")}
        ${a(r,e.gruplar[0],0)}
        ${a(n,e.gruplar[1],1)}
        ${a(s,e.gruplar[2],2)}
        <text class="term-diagram-note" x="${(o/2).toFixed(0)}" y="192" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"gunes-ay":e=>{const a=Math.max(420,u(e.caption)+30,96+Math.max(M(e.kaynakNot),p(e.kaynakAd))/2+20,322+Math.max(u(e.yansitanNot),p(e.yansitanAd))/2+20);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${a.toFixed(0)} 188" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-hale" cx="96" cy="66" r="46"/>
        <circle class="term-diagram-node term-diagram-node--accent" cx="96" cy="66" r="30"/>
        ${F(t(e.kaynakAd),30).metin(96,66,30)}
        ${$(142,66,292,66,"oneway")}
        <circle class="term-diagram-node term-diagram-node--faint" cx="322" cy="66" r="26"/>
        ${F(t(e.yansitanAd),26).metin(322,66,26)}
        <text class="term-diagram-note--accent" x="96" y="142" text-anchor="middle">${t(e.kaynakNot)}</text>
        <text class="term-diagram-note" x="322" y="142" text-anchor="middle">${t(e.yansitanNot)}</text>
        <text class="term-diagram-note" x="${(a/2).toFixed(0)}" y="180" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"kuskulu-orta":e=>{const a=Math.max(460,u(e.caption)+30,M(e.sinirNot)+340,u(e.ortaNot)+230,u(e.solNot)+190);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${a.toFixed(0)} 168" role="img" aria-label="${t(e.note)}">
        <rect class="term-diagram-bolge term-diagram-bolge--acik" x="30" y="56" width="130" height="34"/>
        <rect class="term-diagram-bolge term-diagram-bolge--kusku" x="160" y="56" width="140" height="34"/>
        <rect class="term-diagram-bolge term-diagram-bolge--yasak" x="300" y="56" width="130" height="34"/>
        <text class="term-diagram-label--small" x="95" y="79" text-anchor="middle">${t(e.sol)}</text>
        <text class="term-diagram-label--small" x="230" y="79" text-anchor="middle">${t(e.orta)}</text>
        <text class="term-diagram-label--small" x="365" y="79" text-anchor="middle">${t(e.sag)}</text>
        <line class="term-diagram-sinir" x1="160" y1="42" x2="160" y2="104"/>
        <text class="term-diagram-note--accent" x="160" y="34" text-anchor="middle">${t(e.sinirNot)}</text>
        <text class="term-diagram-note" x="95" y="122" text-anchor="middle">${t(e.solNot)}</text>
        <text class="term-diagram-note" x="230" y="122" text-anchor="middle">${t(e.ortaNot)}</text>
        <text class="term-diagram-note" x="${(a/2).toFixed(0)}" y="156" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `}},ze=`
    <svg width="0" height="0" style="position:absolute">
      <defs>
        <filter id="tdSketchy" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" result="tdNoise"/>
          <feDisplacementMap in="SourceGraphic" in2="tdNoise" scale="2.4" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
        <!-- "berraklik" \xE7izimi i\xE7in: bulan\u0131kl\u0131k burada bir benzetme de\u011Fil,
             resmin kendisi (GORSEL_DIL.md, bulan\u0131kl\u0131k = bilgisizlik). -->
        <filter id="tdBulanik" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="3.2"/>
        </filter>
      </defs>
    </svg>
  `;let Y=[];function Se(e,a){const i=e&&e.diagram||[],r=i.filter(l=>l.termId===a.id),n=i.filter(l=>!l.termId);if(Y=r.concat(n),!Y.length)return"";function s(l,c){return l.map((m,x)=>{const d=se[m.type];return d?`<div class="term-diagram-card">
            <div class="term-diagram-svg-wrap" data-diagram-index="${x+c}" role="button" tabindex="0"
                 aria-label="${t({tr:"B\xFCy\xFCt",en:"Enlarge",pt:"Ampliar"})}">${d(m)}</div>
            <p class="term-diagram-caption">${t(m.note)}</p>
          </div>`:""}).join("")}function o(l,c,m){const x=s(c,m);return x.trim()?`
        <p class="detail-eyebrow detail-eyebrow--section">${t(l)}</p>
        <div class="term-diagram-row term-diagram-row--panel">${x}</div>
      `:""}return ze+o({tr:"\xC7izim",en:"Diagram",pt:"Diagrama"},r,0)+o({tr:"Grup \xC7izimi",en:"Group Diagram",pt:"Diagrama do Grupo"},n,r.length)}function ne(e){const a=Y[e];if(!a)return;const i=se[a.type];i&&(window.dostTrack&&window.dostTrack("sema_acildi",{type:a.type}),window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),svgHtml:i(a),caption:t(a.note)}),ie(document.querySelector(".cizim-lightbox__svg-wrap")))}function Ae(e){const a=(e.iliskili_kavramlar||[]).map(i=>k.terms[i]).filter(Boolean).slice(0,3);return a.length?`<span class="terim-card__related">${a.map(i=>t(i.title)).join(" \xB7 ")}</span>`:""}const st=!0;let H=null;function Ce(e){const a=new Map,i=new Map;Object.values(e).forEach(l=>{(l.iliskili_kavramlar||[]).forEach(c=>{const m=typeof c=="string"?c:c&&c.id;m&&i.set(m,(i.get(m)||0)+1)})}),Object.values(e).forEach(l=>{const c=(l.kaynaklar||[]).length+(i.get(l.id)||0)+(l.site_baglantilari||[]).length;a.set(l.id,c)});const r=Array.from(a.values()),n=Math.min(...r),s=Math.max(...r),o=new Map;return a.forEach((l,c)=>o.set(c,s===n?.5:(l-n)/(s-n))),{raw:a,norm:o,lo:n,hi:s}}const I=7.4,G=2*Math.PI*I;function Be(e,a){const i=Math.max(.06,Math.min(1,e)),r=G*(1-i);return`<svg class="terim-entry__gauge" viewBox="0 0 20 20" aria-hidden="true" style="--tag-hue:${a}">
      <circle class="terim-entry__gauge-track" cx="10" cy="10" r="${I}"></circle>
      <circle class="terim-entry__gauge-arc" cx="10" cy="10" r="${I}"
        stroke-dasharray="${G.toFixed(2)}" stroke-dashoffset="${r.toFixed(2)}"></circle>
    </svg>`}function Ee(){return`<p class="terimler-intro">${t({tr:"Ayn\u0131 kelimenin \u0130bn Arab\xEE'nin farkl\u0131 yerlerinde nas\u0131l kar\u015F\u0131m\u0131za \xE7\u0131kt\u0131\u011F\u0131n\u0131 izleyen bir derleme. Bir terime t\u0131klay\u0131n, kayna\u011F\u0131na ve ili\u015Fkili terimlere oradan ula\u015F\u0131n.",en:"A collection following how the same word turns up in different places in Ibn Arabi's work. Click a term to reach its sources and related terms from there.",pt:"Uma recolha que segue como a mesma palavra aparece em lugares diferentes na obra de Ibn Arabi. Clique num termo para chegar \xE0s suas fontes e termos relacionados a partir dali."})}</p>`}function De(){return`<div class="terimler-heat">
      <p class="terimler-heat__title">
        <svg class="terim-entry__gauge terimler-heat__gauge" viewBox="0 0 20 20" aria-hidden="true">
          <circle class="terim-entry__gauge-track" cx="10" cy="10" r="${I}"></circle>
          <circle class="terim-entry__gauge-arc" cx="10" cy="10" r="${I}"
            stroke-dasharray="${G.toFixed(2)}" stroke-dashoffset="${(G*.32).toFixed(2)}"></circle>
        </svg>
        <span>${t({tr:"D\xF6n\xFC\u015F yo\u011Funlu\u011Fu",en:"Return density",pt:"Densidade de retorno"})}</span>
      </p>
      <p class="terimler-heat__note">${t({tr:"Her terimin yan\u0131ndaki halka, ona ka\xE7 kere geri d\xF6nd\xFC\u011F\xFCm\xFCz kadar doluyor \u2014 kaydetti\u011Fimiz kaynak pasajlar\u0131, ba\u015Fka terimlerin ona verdi\u011Fi at\u0131flar ve sitenin \xF6b\xFCr b\xF6l\xFCmlerine kurdu\u011Fumuz ba\u011Flar toplanarak. Bu, Dost'un neye a\u011F\u0131rl\u0131k verdi\u011Fini de\u011Fil, bizim okumam\u0131z\u0131n nerede yo\u011Funla\u015Ft\u0131\u011F\u0131n\u0131 g\xF6steriyor.",en:"The ring beside each term fills in proportion to how often we have had to come back to it \u2014 the source passages we recorded, the references other terms make to it, and the links we built to other parts of the site, added together. This shows not what Dost emphasised but where our own reading has thickened.",pt:"O anel ao lado de cada termo preenche-se na propor\xE7\xE3o de quantas vezes tivemos de voltar a ele \u2014 as passagens-fonte que regist\xE1mos, as refer\xEAncias que outros termos lhe fazem e os v\xEDnculos que constru\xEDmos com outras partes do site, somados. Isto mostra n\xE3o o que Dost enfatizou, mas onde a nossa pr\xF3pria leitura se adensou."})}</p>
    </div>`}function Te(){const e=k.terms;H||(H=Ce(e));const a=new Map;Object.values(e).forEach(s=>{a.has(s.group)||a.set(s.group,[]),a.get(s.group).push(s)});const i=(k.groups||[]).filter(s=>(a.get(s.id)||[]).length),r=`<nav class="terimler-rail" aria-label="${t({tr:"S\xF6zl\xFCk b\xF6l\xFCmleri",en:"Glossary sections",pt:"Sec\xE7\xF5es do gloss\xE1rio"})}">
      <label class="terimler-filter">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="15.8" y1="15.8" x2="20" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <input type="search" id="terimler-filter-input" autocomplete="off"
          placeholder="${t({tr:"Terim ara\u2026",en:"Search terms\u2026",pt:"Procurar termos\u2026"})}"
          aria-label="${t({tr:"Terim ara",en:"Search terms",pt:"Procurar termos"})}">
      </label>
      <button class="terimler-fca-btn" id="terimler-fca-btn" type="button"
        title="${t({tr:"Makine k\xFCmelemesi \u2014 grup/mertebe niteliklerinden kurulan bir kavram kafesi",en:"Machine clustering \u2014 a concept lattice built from group/tier attributes",pt:"Agrupamento por m\xE1quina \u2014 uma rede de conceitos constru\xEDda a partir dos atributos grupo/n\xEDvel"})}"
        aria-label="${t({tr:"Makine k\xFCmelemesi (FCA)",en:"Machine clustering (FCA)",pt:"Agrupamento por m\xE1quina (FCA)"})}">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="8.5" y="14" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6.5" y1="10" x2="10.5" y2="14.5" stroke="currentColor" stroke-width="1.3"/><line x1="17.5" y1="10" x2="13.5" y2="14.5" stroke="currentColor" stroke-width="1.3"/></svg>
        <span>${t({tr:"Makine K\xFCmelemesi",en:"Machine Clustering",pt:"Agrupamento por M\xE1quina"})}</span>
      </button>
      <p class="terimler-rail__count" id="terimler-rail-count"></p>
      <ol class="terimler-rail__list">${i.map(s=>{const o=(a.get(s.id)||[]).length;return`<li><a class="terimler-rail__item" href="#terim-grup-${s.id}" data-group="${s.id}" style="--tag-hue:${J(s.id)}">
            <span class="terimler-rail__dot" aria-hidden="true"></span>
            <span class="terimler-rail__name">${t(s.name)}</span>
            <span class="terimler-rail__n">${o}</span>
          </a></li>`}).join("")}</ol>
    </nav>`,n=i.map(s=>{const o=a.get(s.id)||[],l=J(s.id),c=o.map(m=>{const x=m.tier||2,d=H.norm.get(m.id),g=H.raw.get(m.id),y=t({tr:m.ozet_tr,en:m.ozet_en,pt:m.ozet_pt}),v=t({tr:"D\xF6n\xFC\u015F yo\u011Funlu\u011Fu: "+g,en:"Return density: "+g,pt:"Densidade de retorno: "+g});return`<button class="terim-entry terim-entry--tier-${x}" data-id="${m.id}"
                data-search="${(t(m.title)+" "+y).toLowerCase().replace(/"/g,"")}"
                title="${v}">
              ${Be(d==null?0:d,l)}
              <span class="terim-entry__text">
                <span class="terim-entry__title">${t(m.title)}</span>
                <span class="terim-entry__ozet">${y}</span>
                ${Ae(m)}
              </span>
            </button>`}).join("");return`<section class="terimler-group" id="terim-grup-${s.id}" data-group="${s.id}" style="--tag-hue:${l}">
          <header class="terimler-group__header">
            <span class="terimler-group__badge">${_e(s.id)}</span>
            <div>
              <h2 class="terimler-group__title">${t(s.name)}</h2>
              <p class="terimler-group__desc">${t(s.description)}</p>
            </div>
          </header>
          <div class="terimler-group__entries">${c}</div>
          <p class="terimler-group__empty" hidden>${t({tr:"Bu b\xF6l\xFCmde e\u015Fle\u015Fen terim yok.",en:"No matching term in this section.",pt:"Nenhum termo correspondente nesta sec\xE7\xE3o."})}</p>
        </section>`}).join("");f.innerHTML=`<div class="terimler-shell">${r}<div class="terimler-body">${Ee()}${De()}${n}</div></div>`,f.querySelectorAll(".terim-entry").forEach(s=>{s.addEventListener("click",()=>j(s.dataset.id))}),Ie(),Ve(),We(),L&&X()}function Ie(){const e=Array.from(f.querySelectorAll(".terimler-rail__item"));if(!e.length||(e.forEach(r=>{r.addEventListener("click",n=>{n.preventDefault();const s=f.querySelector("#terim-grup-"+CSS.escape(r.dataset.group));if(!s)return;const o=window.matchMedia("(prefers-reduced-motion: reduce)").matches;s.scrollIntoView({behavior:o?"auto":"smooth",block:"start"}),je(s,o)})}),!("IntersectionObserver"in window)))return;const a=new Set,i=new IntersectionObserver(r=>{r.forEach(s=>{const o=s.target.dataset.group;s.isIntersecting?a.add(o):a.delete(o)}),e.forEach(s=>s.classList.remove("is-current"));const n=e.find(s=>a.has(s.dataset.group));n&&(n.classList.add("is-current"),qe(n))},{rootMargin:"-30% 0px -60% 0px",threshold:0});f.querySelectorAll(".terimler-group").forEach(r=>i.observe(r))}let R=[];function je(e,a){R.forEach(clearTimeout),R=[],f.querySelectorAll(".terimler-group.is-pulsing").forEach(r=>r.classList.remove("is-pulsing")),f.querySelectorAll(".terimler-group__badge.futuhat-pulse").forEach(r=>r.classList.remove("futuhat-pulse"));const i=e.querySelector(".terimler-group__badge");R.push(setTimeout(()=>{e.classList.add("is-pulsing"),i&&i.classList.add("futuhat-pulse"),R.push(setTimeout(()=>{e.classList.remove("is-pulsing"),i&&i.classList.remove("futuhat-pulse")},1700))},a?0:350))}function qe(e){const a=e.closest(".terimler-rail__list"),i=e.closest(".terimler-rail"),r=a&&a.scrollWidth-a.clientWidth>1?a:null,n=i&&i.scrollHeight-i.clientHeight>1?i:null;if(r){const s=e.getBoundingClientRect(),o=r.getBoundingClientRect();s.left<o.left?r.scrollLeft+=s.left-o.left-8:s.right>o.right&&(r.scrollLeft+=s.right-o.right+8)}if(n){const s=e.getBoundingClientRect(),o=n.getBoundingClientRect();s.top<o.top?n.scrollTop+=s.top-o.top-8:s.bottom>o.bottom&&(n.scrollTop+=s.bottom-o.bottom+8)}}let V=null;function Ne(){return V||(V=window.DostGraphUtils.fetchJson("data/ibn-arabi/terimler-fca.json").catch(()=>null)),V}const He={tr:"Listede vurgula",en:"Highlight in list",pt:"Destacar na lista"};function Ge(e){const a=e.nitelikler.map(r=>t(r.label)).join(", "),i=e.uyeler.map(r=>{const n=k.terms[r],s=n?t(n.title):r;return`<a class="cross-link" href="${window.__dostNav.href("terimler",r)}" data-view="terimler" data-id="${r}">${s}</a>`}).join(", ");return`<div class="esma-fca-cluster">
      <p class="esma-fca-cluster__nitelik">${a}</p>
      <p class="esma-fca-cluster__isimler">${i}</p>
      <button class="esma-fca-cluster__show" type="button" data-cluster-id="${e.id}">${t(He)}</button>
    </div>`}function Re(){Ne().then(e=>{if(!e||!window.DostLightbox)return;window.dostTrack&&window.dostTrack("sema_acildi",{type:"terimler-fca"});const a=e.kumeler.map(Ge).join("");window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),name:t({tr:"Makine K\xFCmelemesi (FCA)",en:"Machine Clustering (FCA)",pt:"Agrupamento por M\xE1quina (FCA)"}),svgHtml:`<div class="esma-fca-lightbox">
          <p class="esma-fca-lightbox__not">${t(e.not)}</p>
          <div class="esma-fca-lightbox__list">${a}</div>
        </div>`,caption:""});const i=document.querySelector(".cizim-lightbox__svg-wrap");i&&(i.querySelectorAll(".cross-link").forEach(r=>{r.addEventListener("click",()=>{window.DostLightbox.close()})}),i.querySelectorAll(".esma-fca-cluster__show").forEach(r=>{r.addEventListener("click",()=>{const n=e.kumeler.find(s=>String(s.id)===r.dataset.clusterId);n&&(window.DostLightbox.close(),Oe(n))})}))})}function We(){const e=document.getElementById("terimler-fca-btn");!e||e.dataset.wiredFcaButton||(e.dataset.wiredFcaButton="1",e.addEventListener("click",Re))}function X(){f.classList.toggle("terimler-shell--cluster-active",!!L),f.querySelectorAll(".terim-entry").forEach(e=>{e.classList.toggle("is-cluster-member",!!L&&L.members.has(e.dataset.id))})}function Oe(e){L={id:e.id,members:new Set(e.uyeler),nitelikler:e.nitelikler},X(),Ue(e);const a=k.terms[e.uyeler[0]],i=a?f.querySelector("#terim-grup-"+CSS.escape(a.group)):null;if(i){const r=window.matchMedia("(prefers-reduced-motion: reduce)").matches;i.scrollIntoView({behavior:r?"auto":"smooth",block:"start"})}window.dostTrack&&window.dostTrack("terimler_fca_odak",{id:e.id})}function Pe(){L&&(L=null,X(),Ye())}function Ue(e){const a=document.getElementById("terimler-fca-caption"),i=document.getElementById("terimler-fca-caption-nitelik");!a||!i||(i.textContent=e.nitelikler.map(r=>t(r.label)).join(" \xB7 "),a.hidden=!1)}function Ye(){const e=document.getElementById("terimler-fca-caption");e&&(e.hidden=!0)}window.DostGraphUtils&&window.DostGraphUtils.registerStepBack("terimler-wrap",()=>L?(Pe(),!0):!1);function Ve(){const e=f.querySelector("#terimler-filter-input"),a=f.querySelector("#terimler-rail-count");if(!e)return;const i=Array.from(f.querySelectorAll(".terim-entry")),r=i.length;function n(o){a&&(a.textContent=t(o===r?{tr:r+" terim",en:r+" terms",pt:r+" termos"}:{tr:o+" / "+r+" terim",en:o+" / "+r+" terms",pt:o+" / "+r+" termos"}))}function s(){const o=e.value.trim().toLowerCase();let l=0;i.forEach(c=>{const m=!o||c.dataset.search.indexOf(o)!==-1;c.hidden=!m,m&&l++}),f.querySelectorAll(".terimler-group").forEach(c=>{const m=c.querySelector(".terim-entry:not([hidden])");c.classList.toggle("is-empty",!m);const x=c.querySelector(".terimler-group__empty");x&&(x.hidden=!!m)}),n(l)}e.addEventListener("input",s),e.addEventListener("keydown",o=>{o.key==="Escape"&&e.value&&(o.stopPropagation(),e.value="",s())}),n(r)}function K(){k&&Te()}function Xe(e){if(!e.analogy)return"";const a=t(e.analogy);return!a||!String(a).trim()?"":`<div class="detail-analogy">
      <p class="detail-analogy__label">${t({tr:"Bir benzetmeyle",en:"In one analogy",pt:"Numa analogia"})}</p>
      <p>${S(a,"terimler",e.id)}</p>
    </div>`}function Ke(e,a){return!e||!e.length?"":`<div class="insight-group">${e.map((i,r)=>`<details class="insight" ${r===0?"open":""}>
          <summary>${i.kaynak_adi?i.kaynak_adi:t({tr:`Cilt ${i.cilt}`,en:`Volume ${i.cilt}`,pt:`Volume ${i.cilt}`})}</summary>
          <p>${S(i.alinti_tr,"terimler",a)}</p>
          ${i.not_tr?`<cite>${S(i.not_tr,"terimler",a)}</cite>`:""}
        </details>`).join("")}</div>`}const oe={"toz-nitelik":35,siniflandirma:200,"sebep-sonuc":15,"varlik-mertebesi":265,"kozmik-hiyerarsi":225,"kopru-kavram":185,"itibar-edilmez":350,"halvet-perdeleri":300,"sahv-sekr":20,"velayet-risalet":45,"lafza-i-celal":250,"ahad-vahid":210,"nefsin-gucleri":5,"mebde-mead":330,"nubuvvetin-zarureti":40,"vahyin-mertebeleri":190,"hayir-ve-ser":100,"tezkire-i-erbaa":275,firaset:55,"kutbiyet-hiyerarsisi":165,"ahval-makamat":70,"kurani-kozmoloji":235,"idrak-sureci":150,"kader-tevhid":120};function J(e){return oe[e]!==void 0?oe[e]:40}function Je(e){const a=(e.iliskili_kavramlar||[]).map(r=>k.terms[r]).filter(Boolean);if(!a.length)return"";const i=a.map(r=>`<button class="bookmap-concept-tag bookmap-concept-tag--group" data-term="${r.id}" style="--tag-hue:${J(r.group)}">${t(r.title)}</button>`).join("");return`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"\u0130li\u015Fkili Terimler",en:"Related Terms",pt:"Termos Relacionados"})}</p>
      <div class="bookmap-concept-tags">${i}</div>`}function Qe(e){const a=N.filter(r=>r.from===e.id||r.to===e.id);if(!a.length)return"";const i=a.map(r=>{const n=r.from===e.id?r.to:r.from,s=k.terms[n];return s?`<button class="bookmap-concept-tag bookmap-concept-tag--derived" data-term="${s.id}" title="${t(r.aciklama).replace(/"/g,"&quot;")}">${t(s.title)}</button>`:""}).filter(Boolean).join("");return i?`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"T\xFCretilmi\u015F Ba\u011Flar",en:"Derived Links",pt:"V\xEDnculos Derivados"})}</p>
      <p class="detail-derived-note">${t({tr:"Bu ba\u011Flar\u0131 biz sayd\u0131k (ayn\u0131 b\xF6l\xFCmlerde birlikte ge\xE7me s\u0131kl\u0131\u011F\u0131ndan) \u2014 Dost'un bunlar\u0131 ba\u011Flad\u0131\u011F\u0131 anlam\u0131na gelmez.",en:"We counted these links (from how often the terms occur together in the same chapters) \u2014 it does not mean Ibn Arabi connects them.",pt:"N\xF3s contamos estes v\xEDnculos (pela frequ\xEAncia com que os termos ocorrem juntos nos mesmos cap\xEDtulos) \u2014 n\xE3o significa que Ibn Arabi os conecte."})}</p>
      <div class="bookmap-concept-tags">${i}</div>`:""}function W(e,a){return` data-dost-dosya="data/ibn-arabi/felsefi-terimler.json" data-dost-kaynak="${e}" data-dost-alan="${a}"`}function Ze(e){const a=e.celisen_yorumlar||[];if(!a.length)return"";const i=a.map((r,n)=>`<div class="divergent-view">
          <p class="divergent-view__kaynak">${r.kaynak}</p>
          <p${W(e.id,`celisen_yorumlar[${n}].gorus`)}>${S(t(r.gorus),"terimler",e.id)}</p>
        </div>`).join("");return`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"\xC7eli\u015Fen Yorumlar",en:"Differing Readings",pt:"Leituras Divergentes"})}</p>
      <div class="divergent-views">${i}</div>
      ${window.DostGraphUtils.has3(e.celisen_yorumlar_not)?`<p class="divergent-views__not"${W(e.id,"celisen_yorumlar_not")}>${S(t(e.celisen_yorumlar_not),"terimler",e.id)}</p>`:""}`}const le={ontoloji:40,esma:200,hal:265,terimler:15,sorular:225,futuhat:340,sirlar:100,cizimler:185};function et(e){const a=e.site_baglantilari||[];if(!a.length)return"";const i={ontoloji:{tr:"Ontoloji",en:"Ontology",pt:"Ontologia"},esma:{tr:"Esm\xE2\xFC'l-H\xFCsn\xE2",en:"The Beautiful Names",pt:"Os Belos Nomes"},hal:{tr:"H\xE2ller",en:"States",pt:"Estados"},terimler:{tr:"Terimler",en:"Terms",pt:"Termos"},sorular:{tr:"Sorular",en:"Questions",pt:"Perguntas"},futuhat:{tr:"F\xFCt\xFBh\xE2t Atlas\u0131",en:"Futuhat Atlas",pt:"Atlas do Futuhat"},sirlar:{tr:"S\u0131rlar",en:"Mysteries",pt:"Mist\xE9rios"},cizimler:{tr:"\xC7izimler",en:"Diagrams",pt:"Diagramas"}},r=a.map(n=>`<button class="bookmap-concept-tag bookmap-concept-tag--group" data-view="${n.view}" data-id="${n.id}" style="--tag-hue:${le[n.view]!==void 0?le[n.view]:40}">${t(i[n.view]||{})} \u2192 ${n.id}</button>`).join("");return`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"Haritada G\xF6r",en:"See on the Map",pt:"Ver no Mapa"})}</p>
      <div class="bookmap-concept-tags">${r}</div>`}function j(e){const a=k.terms[e];if(!a){window.__dostNav&&window.__dostNav.setHash("terimler");return}window.dostTrack&&window.dostTrack("kavram_sayfasi_goruntulendi",{id:a.id});const i=ve(a.group);B.dataset.currentTerm=e,window.__dostNav&&window.__dostNav.setHash&&window.__dostNav.setHash("terimler",e),z.innerHTML=`
      <p class="detail-eyebrow">${t(i&&i.name||{})}</p>
      <h2 class="detail-title">${t(a.title)}${a.arabic?` <span class="detail-title__arabic">${a.arabic}</span>`:""}</h2>
      ${window.DostGraphUtils.has3(a.felsefi_tanim)?`<div class="detail-block detail-block--ibnarabi">
        <h3>${t({tr:"Felsefi Tan\u0131m",en:"Philosophical Definition",pt:"Defini\xE7\xE3o Filos\xF3fica"})}</h3>
        <p${W(a.id,"felsefi_tanim")}>${S(t(a.felsefi_tanim),"terimler",a.id)}</p>
      </div>`:""}
      ${window.DostGraphUtils.has3(a.ibn_arabi_yorumu)?`<div class="detail-block">
        <h3>${t({tr:"\u0130bn Arab\xEE'nin Yorumu",en:"Ibn Arabi's Interpretation",pt:"A Interpreta\xE7\xE3o de Ibn Arabi"})}</h3>
        <p${W(a.id,"ibn_arabi_yorumu")}>${S(t(a.ibn_arabi_yorumu),"terimler",a.id)}</p>
      </div>`:""}
      ${be(a.id)}
      ${Xe(a)}
      ${Se(i,a)}
      ${Ke(a.kaynaklar,a.id)}
      ${Ze(a)}
      ${Je(a)}
      ${Qe(a)}
      ${et(a)}
    `,z.querySelectorAll(".bookmap-concept-tag[data-term]").forEach(r=>{r.addEventListener("click",()=>{window.dostTrack&&window.dostTrack("ilgili_kavram_secildi",{from:e,to:r.dataset.term}),j(r.dataset.term)})}),z.querySelectorAll(".bookmap-concept-tag[data-view]").forEach(r=>{r.addEventListener("click",()=>{window.__dostNav&&window.__dostNav.goTo(r.dataset.view,r.dataset.id)})}),z.querySelectorAll(".term-diagram-svg-wrap").forEach(r=>{r.addEventListener("click",()=>ne(Number(r.dataset.diagramIndex))),r.addEventListener("keydown",n=>{(n.key==="Enter"||n.key===" ")&&(n.preventDefault(),ne(Number(r.dataset.diagramIndex)))})}),B.hidden=!1,ie(z),N.length||$e().then(()=>{B.dataset.currentTerm===e&&j(e)}),fe(e),w||pe().then(r=>{r&&B.dataset.currentTerm===e&&j(e)})}window.__terimlerApp={activate(){te().then(e=>{e&&K()})},goToNode(e){te().then(a=>{a&&(K(),e&&j(e))})},onLangChange(){k&&K()}}})();
