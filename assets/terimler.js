(function(){"use strict";const he=window.DostI18n,v=document.getElementById("terimler-list"),P=document.getElementById("terimler-wrap"),A=document.getElementById("detail-panel"),S=document.getElementById("detail-content");if(!v||!A||!S)return;const ye=window.matchMedia("(prefers-reduced-motion: reduce)").matches;let k=null,E=null,N=[],D=null,L=null;const t=he.pick3;function B(e,a,r){return window.__dostCrossLink?window.__dostCrossLink.linkify(e,a,r):e}function U(e,a){if(!e)return"";if(e.length<=a)return e;const r=e.slice(0,a);return r.slice(0,r.lastIndexOf(" "))+"\u2026"}function pe(e){!window.__dostCrossLink||!window.__dostCrossLink.register||(Object.values(e.terms).forEach(a=>{const r=a.felsefi_tanim||{},i={tr:U(r.tr,160),en:U(r.en,160),pt:U(r.pt,160)};window.__dostCrossLink.register(a.title,"terimler",a.id,i)}),window.__dostCrossLink.notifyReady&&window.__dostCrossLink.notifyReady())}function ae(){return k?Promise.resolve(k):E||(window.DostViewStatus&&window.DostViewStatus.showLoading("terimler-wrap"),E=window.DostGraphUtils.fetchJson("data/ibn-arabi/felsefi-terimler.json").then(e=>(k=e,pe(e),window.DostViewStatus&&window.DostViewStatus.hide("terimler-wrap"),e)).catch(e=>(console.error("Terimler s\xF6zl\xFC\u011F\xFC y\xFCklenemedi / Failed to load glossary",e),E=null,window.DostViewStatus&&window.DostViewStatus.showError("terimler-wrap",()=>window.__terimlerApp.activate()),null)),E)}function $e(){return D||(D=window.DostGraphUtils.fetchJson("data/ibn-arabi/turetilmis-kenarlar-terimler.json").then(e=>(N=e&&e.kenarlar||[],N)).catch(e=>(console.warn("T\xFCretilmi\u015F terim kenarlar\u0131 y\xFCklenemedi",e),D=null,[])),D)}let w=null,I=null;function be(){return I||(I=window.DostGraphUtils.fetchJson("data/ibn-arabi/ceviri-kaybi.json").then(e=>(w=e||null,w)).catch(e=>(console.warn("\xC7eviri kayb\u0131 verisi y\xFCklenemedi",e),I=null,null)),I)}const re={tr:{tr:"T\xFCrk\xE7e",en:"Turkish",pt:"Turco"},en:{tr:"\u0130ngilizce",en:"English",pt:"Ingl\xEAs"},pt:{tr:"Portekizce",en:"Portuguese",pt:"Portugu\xEAs"}};function fe(e){const a=w&&w.terimler&&w.terimler[e];if(!a)return"";const r=a.diller.some(s=>window.DostGraphUtils.has3(s.kayip)),i=a.diller.map((s,o)=>r?`<button class="ceviri-kaybi__dil${o===0?" on":""}" type="button" data-dil="${s.dil}">${t(re[s.dil])}: ${s.kelime}</button>`:`<span class="ceviri-kaybi__dil">${t(re[s.dil])}: ${s.kelime}</span>`).join("");return`<div class="ceviri-kaybi">
      <p class="detail-eyebrow detail-eyebrow--section">${t({tr:"Arap\xE7a k\xF6k ve \xE7eviri kar\u015F\u0131l\u0131klar\u0131",en:"Arabic root and renderings",pt:"Raiz \xE1rabe e tradu\xE7\xF5es"})}</p>
      <p class="ceviri-kaybi__kok"><span class="ceviri-kaybi__harf" dir="rtl" lang="ar">${a.kok.harf}</span>
        <span class="ceviri-kaybi__translit">${a.kok.translit}</span></p>
      ${window.DostGraphUtils.has3(a.kok.anlam)?`<p class="ceviri-kaybi__kok-anlam">${t(a.kok.anlam)}</p>`:""}
      <div class="ceviri-kaybi__diller">${i}</div>
      ${r?`<p class="ceviri-kaybi__kayip" id="ceviri-kaybi-kayip">${t(a.diller[0].kayip)}</p>`:""}
      ${window.DostGraphUtils.has3(w.meta&&w.meta.not)?`<p class="ceviri-kaybi__not">${t(w.meta.not)}</p>`:""}
    </div>`}function ve(e){const a=w&&w.terimler&&w.terimler[e];if(!a)return;const r=S.querySelector(".ceviri-kaybi");r&&r.querySelectorAll(".ceviri-kaybi__dil").forEach(i=>{i.addEventListener("click",()=>{r.querySelectorAll(".ceviri-kaybi__dil").forEach(n=>n.classList.remove("on")),i.classList.add("on");const s=a.diller.find(n=>n.dil===i.dataset.dil),o=r.querySelector("#ceviri-kaybi-kayip");o&&s&&(o.textContent=t(s.kayip))})})}function ke(e){return k.groups.find(a=>a.id===e)}const we={rings:'<circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="2.6"/>',branch:'<path d="M10 3v6M10 9l-5 8M10 9l5 8"/><circle cx="10" cy="3" r="1.6"/><circle cx="5" cy="17" r="1.6"/><circle cx="15" cy="17" r="1.6"/>',bolt:'<path d="M11 2 4 12h5l-1 6 7-10h-5l1-6z"/>',steps:'<path d="M3 17h4v-4h4V9h4V5h2"/>',rays:'<circle cx="10" cy="10" r="2.2"/><path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.5 4.5l2 2M13.5 13.5l2 2M4.5 15.5l2-2M13.5 6.5l2-2"/>',eye:'<path d="M2 10s3-5.5 8-5.5 8 5.5 8 5.5-3 5.5-8 5.5S2 10 2 10z"/><circle cx="10" cy="10" r="2.4"/>',flame:'<path d="M10 2c1 3-3 4-3 7.5a3 3 0 0 0 6 0C13 6.5 10.5 7 10 2z"/><path d="M7.5 12a2.5 4 0 0 0 5 0"/>',"dot-circle":'<circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="1.6"/>',stroke:'<path d="M10 2v11"/><circle cx="10" cy="16" r="1.8"/>',star:'<path d="M10 2l1.9 5.8h6.1l-4.9 3.6 1.9 5.8-5-3.6-5 3.6 1.9-5.8-4.9-3.6h6.1z"/>',wave:'<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 4 0"/><path d="M2 7c2-3 4-3 6 0"/>',"veil-x":'<path d="M3 4c3 8 11 8 14 0" /><path d="M7 15l6-6M13 15L7 9"/>',veil:'<path d="M3 5c2 2 2 4 0 6M8 4c2 2 2 8 0 10M13 4c2 2 2 8 0 10M18 5c-2 2-2 4 0 6"/>',cycle:'<path d="M15.5 6.5A6 6 0 1 0 16 11"/><path d="M15.5 3v4h-4"/>',lamp:'<path d="M10 2a5 5 0 0 0-3 9c0 1 0 2 1 2h4c1 0 1-1 1-2a5 5 0 0 0-3-9z"/><path d="M8.5 16h3M9 18.5h2"/>',beam:'<path d="M10 2v4"/><path d="M6 8l8 0-2 10H8L6 8z"/>',scale:'<path d="M10 2v15M5 6h10M5 6l-2.5 6h5L5 6zM15 6l-2.5 6h5L15 6z"/>',compass:'<circle cx="10" cy="10" r="2"/><circle cx="10" cy="4" r="1.4"/><circle cx="16" cy="10" r="1.4"/><circle cx="10" cy="16" r="1.4"/><circle cx="4" cy="10" r="1.4"/><path d="M10 6v2M14 10h-2M10 14v-2M6 10h2"/>'},_e={"toz-nitelik":"rings",siniflandirma:"branch","sebep-sonuc":"bolt","varlik-mertebesi":"steps","kozmik-hiyerarsi":"rays","kopru-kavram":"eye",firaset:"eye","nefsin-gucleri":"flame","ahad-vahid":"dot-circle","lafza-i-celal":"stroke","velayet-risalet":"star","sahv-sekr":"wave","itibar-edilmez":"veil-x","halvet-perdeleri":"veil","mebde-mead":"cycle","nubuvvetin-zarureti":"lamp","vahyin-mertebeleri":"beam","hayir-ve-ser":"scale","tezkire-i-erbaa":"compass","kutbiyet-hiyerarsisi":"steps","ahval-makamat":"wave","kurani-kozmoloji":"rays","idrak-sureci":"eye","kader-tevhid":"rays"};function Me(e){const a=_e[e]||"dot-circle";return`<svg class="terim-card__icon-svg" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${we[a]}</svg>`}let ie=0;function p(e,a,r,i,s,o){const n="tdIsik"+ie++,l="var(--series-theme)";let c;return s==="mutual"?c=`<stop offset="0%" style="stop-color:${l};stop-opacity:0.12"/><stop offset="50%" style="stop-color:${l};stop-opacity:0.95"/><stop offset="100%" style="stop-color:${l};stop-opacity:0.12"/>`:s==="return"?c=`<stop offset="0%" style="stop-color:${l};stop-opacity:0.9"/><stop offset="100%" style="stop-color:${l};stop-opacity:0.1"/>`:c=`<stop offset="0%" style="stop-color:${l};stop-opacity:0.1"/><stop offset="100%" style="stop-color:${l};stop-opacity:0.9"/>`,`<defs><linearGradient id="${n}" x1="${e}" y1="${a}" x2="${r}" y2="${i}" gradientUnits="userSpaceOnUse">${c}</linearGradient></defs><line class="term-diagram-isikyolu${o?" "+o:""}" data-isikyolu-yon="${s||"oneway"}" x1="${e}" y1="${a}" x2="${r}" y2="${i}" stroke="url(#${n})"/>`}const Fe=7,Le=6.5,ze=7.4;function $(e){return t(e).length*Fe}function u(e){return t(e).length*Le}function M(e){return t(e).length*ze}function F(e,a){const r=e.length>14;return{yari:e.length*7/2,tasma:r?22:0,metin(i,s,o){const n=r?s+(o||a)+17:s+5;return`<text class="term-diagram-label term-diagram-label--small" x="${i.toFixed(0)}" y="${n.toFixed(0)}" text-anchor="middle">${e}</text>`}}}function Y(e,a,r,i){const s=e.getTotalLength?e.getTotalLength():0;if(!s)return;const o=e.parentNode,n=document.createElementNS("http://www.w3.org/2000/svg","circle");n.setAttribute("class","term-diagram-kivilcim"),n.setAttribute("r","4"),n.setAttribute("opacity","0"),o.appendChild(n);const l=performance.now()+a;function c(m){if(!e.isConnected){n.remove();return}const d=(m-l)/r;if(d<0){requestAnimationFrame(c);return}if(d>=1){n.remove();return}const x=e.getPointAtLength((i?1-d:d)*s);n.setAttribute("cx",x.x),n.setAttribute("cy",x.y),n.setAttribute("opacity",Math.sin(d*Math.PI).toFixed(3)),requestAnimationFrame(c)}requestAnimationFrame(c)}function se(e){if(ye||!e)return;e.querySelectorAll(".term-diagram-isikyolu").forEach((r,i)=>{const s=r.dataset.isikyoluYon,o=i*90;s==="mutual"?(Y(r,o,1300,!1),Y(r,o+140,1300,!0)):Y(r,o,1100,s==="return")})}const ne={"mutual-vs-oneway":e=>{const a=Math.max($(e.left),$(e.oneWayFrom))/2,r=Math.max($(e.right),$(e.oneWayTo))/2,i=Math.max(60,a+8),s=Math.max(60,r+8),o=Math.max(340,i+s+200,u(e.mutualLabel)+30,u(e.oneWayLabel)+30),n=o-s,l=o/2;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${o.toFixed(0)} 162" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node" cx="${i.toFixed(0)}" cy="34" r="24"/>
        <text class="term-diagram-label" x="${i.toFixed(0)}" y="39" text-anchor="middle">${t(e.left)}</text>
        <circle class="term-diagram-node" cx="${n.toFixed(0)}" cy="34" r="24"/>
        <text class="term-diagram-label" x="${n.toFixed(0)}" y="39" text-anchor="middle">${t(e.right)}</text>
        ${p(i+26,34,n-26,34,"mutual")}
        <text class="term-diagram-note" x="${l.toFixed(0)}" y="18" text-anchor="middle">${t(e.mutualLabel)}</text>

        <circle class="term-diagram-node term-diagram-node--accent" cx="${i.toFixed(0)}" cy="116" r="24"/>
        <text class="term-diagram-label" x="${i.toFixed(0)}" y="121" text-anchor="middle">${t(e.oneWayFrom)}</text>
        <circle class="term-diagram-node" cx="${n.toFixed(0)}" cy="116" r="24"/>
        <text class="term-diagram-label" x="${n.toFixed(0)}" y="121" text-anchor="middle">${t(e.oneWayTo)}</text>
        ${p(i+26,116,n-26,116,"oneway")}
        <text class="term-diagram-note term-diagram-note--accent" x="${l.toFixed(0)}" y="152" text-anchor="middle">${t(e.oneWayLabel)}</text>
      </svg>
    `},"host-satellite":e=>{const a=Math.max(150,Math.max($(e.host),$(e.satellite))/2+20),r=100,i=32,s=15,o=62,l=[-90,30,150].map(c=>{const m=c*Math.PI/180,d=a+o*Math.cos(m),x=r+o*Math.sin(m);return`
          <line class="term-diagram-tether" x1="${a}" y1="${r}" x2="${d}" y2="${x}"/>
          <circle class="term-diagram-node term-diagram-node--dashed" cx="${d}" cy="${x}" r="${s}"/>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${(a*2).toFixed(0)} 186" role="img" aria-label="${t(e.note)}">
        ${l}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${a}" cy="${r}" r="${i}"/>
        <text class="term-diagram-label term-diagram-label--host" x="${a}" y="${r+5}" text-anchor="middle">${t(e.host)}</text>
        <text class="term-diagram-label term-diagram-label--small" x="${a}" y="${r-o-22}" text-anchor="middle">${t(e.satellite)}</text>
      </svg>
    `},"formula-merge":e=>{const a=t(e.a),r=t(e.b),i=Math.max(300,2*(88+Math.max(a.length,r.length)*3.5)),s=i/2;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} 150" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node--venn" cx="${(s-38).toFixed(0)}" cy="75" r="58"/>
        <circle class="term-diagram-node--venn" cx="${(s+38).toFixed(0)}" cy="75" r="58"/>
        <text class="term-diagram-label--small" x="${(s-82).toFixed(0)}" y="75" text-anchor="middle">${a}</text>
        <text class="term-diagram-label--small" x="${(s+82).toFixed(0)}" y="75" text-anchor="middle">${r}</text>
        <text class="term-diagram-label term-diagram-label--result" x="${s.toFixed(0)}" y="80" text-anchor="middle">${t(e.result)}</text>
      </svg>
    `},spectrum:e=>{const a=c=>t(c).length,r=Math.max(a(e.leftMarker),a(e.rightMarker))*3.1,i=Math.max(a(e.leftLabel)*7.6,a(e.leftNote)*7),s=Math.max(a(e.rightLabel)*7.6,a(e.rightNote)*7),o=Math.max(360,i+s+40,r*2+180),n=Math.max(80,r+14),l=o-n;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${o.toFixed(0)} 120" role="img" aria-label="${t(e.note)}">
        ${p(n-50,55,l+50,55,"mutual")}
        <circle class="term-diagram-node term-diagram-node--sm" cx="${n.toFixed(0)}" cy="55" r="16"/>
        <circle class="term-diagram-node term-diagram-node--accent term-diagram-node--sm" cx="${l.toFixed(0)}" cy="55" r="16"/>
        <text class="term-diagram-note" x="${n.toFixed(0)}" y="90" text-anchor="middle">${t(e.leftMarker)}</text>
        <text class="term-diagram-note" x="${l.toFixed(0)}" y="90" text-anchor="middle">${t(e.rightMarker)}</text>
        <text class="term-diagram-label" x="14" y="20" text-anchor="start">${t(e.leftLabel)}</text>
        <text class="term-diagram-label--small" x="14" y="35" text-anchor="start">${t(e.leftNote)}</text>
        <text class="term-diagram-label" x="${(o-14).toFixed(0)}" y="20" text-anchor="end">${t(e.rightLabel)}</text>
        <text class="term-diagram-label--small" x="${(o-14).toFixed(0)}" y="35" text-anchor="end">${t(e.rightNote)}</text>
      </svg>
    `},cascade:e=>{const a=e.steps.length,r=e.yon==="yukselis",i=e.steps.map(x=>t(x)),s=Math.max.apply(null,i.map(x=>x.length*7)),o=t(e.relationLabel),n=Math.max(66+s+12,o.length*6.2+24),l=(a-1)*64+60+28,c=x=>30+(r?a-1-x:x)*64,m=i.map((x,g)=>{const y=c(g);return`
          <circle class="term-diagram-node${g===0?" term-diagram-node--accent":""}" cx="34" cy="${y}" r="22"/>
          <text class="term-diagram-label--small" x="66" y="${y+5}" text-anchor="start">${x}</text>
        `}).join(""),d=i.slice(1).map((x,g)=>{const y=c(g)+(r?-24:24),b=c(g+1)+(r?24:-24);return p(34,y,34,b,"oneway")}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} ${l}" role="img" aria-label="${t(e.note)}">
        ${d}${m}
        <text class="term-diagram-note" x="${(n/2).toFixed(0)}" y="${l-8}" text-anchor="middle">${o}</text>
      </svg>
    `},mirror:e=>{const a=F(t(e.source),26),r=F(t(e.target),26),i=Math.max(55,a.yari+10),s=Math.max(300,i+Math.max(55,r.yari+10)+190),o=s-Math.max(55,r.yari+10),n=120+Math.max(a.tasma,r.tasma);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} ${n.toFixed(0)}" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--accent" cx="${i.toFixed(0)}" cy="55" r="26"/>
        ${a.metin(i,55,26)}
        <line class="term-diagram-mirror" x1="${(s/2+10).toFixed(0)}" y1="15" x2="${(s/2-10).toFixed(0)}" y2="95"/>
        ${p(i+28,55,o-30,55,"oneway")}
        <circle class="term-diagram-node term-diagram-node--faint" cx="${o.toFixed(0)}" cy="55" r="26"/>
        ${r.metin(o,55,26)}
      </svg>
    `},"seal-wax":e=>`
      <svg class="term-diagram__svg" viewBox="0 0 300 130" role="img" aria-label="${t(e.note)}">
        <ellipse class="term-diagram-node term-diagram-node--faint" cx="150" cy="90" rx="90" ry="30"/>
        <text class="term-diagram-label term-diagram-label--small" x="150" y="95" text-anchor="middle">${t(e.wax)}</text>
        <rect class="term-diagram-node term-diagram-node--accent" x="120" y="15" width="60" height="40" rx="8"/>
        <text class="term-diagram-label term-diagram-label--small" x="150" y="40" text-anchor="middle">${t(e.seal)}</text>
        ${p(150,58,150,68,"oneway")}
      </svg>
    `,"potential-actual":e=>{const a=F(t(e.potential),26),r=F(t(e.actual),26),i=Math.max(60,a.yari+10),s=Math.max(60,r.yari+10),o=Math.max(300,i+s+180),n=o-s,l=100+Math.max(a.tasma,r.tasma);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${o.toFixed(0)} ${l.toFixed(0)}" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--dashed" cx="${i.toFixed(0)}" cy="50" r="26"/>
        ${a.metin(i,50,26)}
        ${p(i+30,50,n-30,50,"oneway")}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${n.toFixed(0)}" cy="50" r="26"/>
        ${r.metin(n,50,26)}
      </svg>
    `},reins:e=>`
      <svg class="term-diagram__svg" viewBox="0 0 300 200" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-node term-diagram-node--accent" cx="150" cy="42" r="32"/>
        <text class="term-diagram-label term-diagram-label--small" x="150" y="47" text-anchor="middle">${t(e.ruler)}</text>
        ${p(126,66,82,132,"oneway")}
        ${p(174,66,218,132,"oneway")}
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
    `,"letter-sequence":e=>{const a=e.letters.length,r=e.letters.map(c=>t(c.anlam)),i=Math.max.apply(null,r.map(c=>c.length*7)),s=Math.max(96,i+10),o=i/2+10,n=o*2+s*(a-1),l=e.letters.map((c,m)=>{const d=o+m*s;return`
          <circle class="term-diagram-node ${c.hidden?"term-diagram-node--dashed":m===0?"term-diagram-node--accent":"term-diagram-node"}" cx="${d.toFixed(0)}" cy="50" r="21"/>
          <text class="term-diagram-label" x="${d.toFixed(0)}" y="55" text-anchor="middle">${t(c.harf)}</text>
          <text class="term-diagram-label--small" x="${d.toFixed(0)}" y="93" text-anchor="middle">${r[m]}</text>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} 115" role="img" aria-label="${t(e.note)}">
        ${l}
      </svg>
    `},"tinted-glass":e=>{const a=t(e.reasonReading),r=t(e.senseReading),i=Math.max(a.length,r.length)*3.1+12,s=Math.max(360,i*4),o=s/2;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} 130" role="img" aria-label="${t(e.note)}">
        ${p(20,65,o-12,65,"oneway")}
        <rect class="term-diagram-node--dashed" x="${(o-12).toFixed(0)}" y="25" width="24" height="80" style="fill:none"/>
        ${p(o+12,65,s-22,65,"oneway")}
        <text class="term-diagram-label--small" x="${o.toFixed(0)}" y="18" text-anchor="middle">${t(e.glassLabel)}</text>
        <text class="term-diagram-note" x="${(o/2).toFixed(0)}" y="45" text-anchor="middle">${a}</text>
        <text class="term-diagram-note--accent" x="${(o+o/2).toFixed(0)}" y="45" text-anchor="middle">${r}</text>
      </svg>
    `},"heart-visitors":e=>{const n=e.visitors.length,l=e.visitors.map((c,m)=>{const x=(-90+360/n*m)*Math.PI/180,g=170+112*Math.cos(x),y=170+112*Math.sin(x),b=c.accent?"term-diagram-node--accent":"term-diagram-node--dashed";return`
          <line class="term-diagram-tether" x1="170" y1="170" x2="${g}" y2="${y}"/>
          <circle class="term-diagram-node ${b}" cx="${g}" cy="${y}" r="26"/>
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
    `,"sarmal-mertebe":e=>{const a=e.ranks.length,r=360/Math.max(a,1),i=56,s=138,o=h=>h===0?0:i+(s-i)*(h-1)/Math.max(a-2,1),n=h=>(-90+r*h)*Math.PI/180,l=h=>{const f=n(h),_=o(h);return{x:_*Math.cos(f),y:_*Math.sin(f),a:f}},c=[];for(let h=0;h<=(a-1)*16;h+=1){const f=l(h/16);c.push([f.x,f.y])}const m=e.ranks.map((h,f)=>{const _=l(f),xe=t(h),Z=f===0||Math.abs(Math.cos(_.a))>=.3,ge=f===0?-1:Math.sign(Math.cos(_.a)),ee=Z?ge>0?"start":"end":"middle",O=Z?_.x+ge*26:_.x,nt=Z?_.y+4:_.y+(Math.sin(_.a)>=0?28:-18),te=xe.length*7,ue=ee==="start"?O:ee==="end"?O-te:O-te/2;return{p:_,i:f,yazi:xe,lx:O,ly:nt,anchor:ee,x0:ue,x1:ue+te}});let d=1/0,x=-1/0,g=1/0,y=-1/0;c.forEach(([h,f])=>{d=Math.min(d,h-14),x=Math.max(x,h+14),g=Math.min(g,f-14),y=Math.max(y,f+14)}),m.forEach(h=>{d=Math.min(d,h.x0),x=Math.max(x,h.x1),g=Math.min(g,h.ly-12),y=Math.max(y,h.ly+6)});const b=t(e.caption),z=b.length*6.2/2,q=(d+x)/2;d=Math.min(d,q-z),x=Math.max(x,q+z);const C=10,rt=d-C,me=g-C,it=x-d+C*2,de=y-g+C*2+26,st=m.map(h=>`
          <circle class="term-diagram-node ${h.i===0?"term-diagram-node--dashed":"term-diagram-node"}"
                  cx="${h.p.x.toFixed(1)}" cy="${h.p.y.toFixed(1)}" r="${h.i===0?15:11}"/>
          <text class="term-diagram-label--small" x="${h.lx.toFixed(1)}" y="${h.ly.toFixed(1)}" text-anchor="${h.anchor}">${h.yazi}</text>
        `).join("");return`
      <svg class="term-diagram__svg" viewBox="${rt.toFixed(1)} ${me.toFixed(1)} ${it.toFixed(1)} ${de.toFixed(1)}" role="img" aria-label="${t(e.note)}">
        <polyline class="term-diagram-tether" fill="none" points="${c.map(([h,f])=>h.toFixed(1)+","+f.toFixed(1)).join(" ")}"/>
        ${st}
        <text class="term-diagram-note" x="${q.toFixed(1)}" y="${(me+de-8).toFixed(1)}" text-anchor="middle">${b}</text>
      </svg>
    `},"kapsayan-secen":e=>{const i=new Set(e.selected||[3,9,12,16]);let s="";for(let o=0;o<3;o+=1)for(let n=0;n<7;n+=1){const l=o*7+n,c=80+n*50,m=52+o*42;s+=`<circle class="term-diagram-node term-diagram-node--sm" cx="${c}" cy="${m}" r="9"/>`,i.has(l)&&(s+=`<circle class="term-diagram-node--accent" cx="${c}" cy="${m}" r="15" style="fill:none"/>`)}return`
      <svg class="term-diagram__svg" viewBox="0 0 460 216" role="img" aria-label="${t(e.note)}">
        ${p(20,24,440,24,"mutual")}
        <text class="term-diagram-note" x="230" y="16" text-anchor="middle">${t(e.allLabel)}</text>
        ${s}
        <text class="term-diagram-note--accent" x="230" y="192" text-anchor="middle">${t(e.someLabel)}</text>
        <text class="term-diagram-note" x="230" y="209" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"cift-okunus":e=>{const s=e.stations.length,o=e.stations.map((n,l)=>{const c=(-90+360/s*l)*Math.PI/180,m=250+96*Math.cos(c),d=150+96*Math.sin(c),x=250+66*Math.cos(c),g=150+66*Math.sin(c),y=250+126*Math.cos(c),b=150+126*Math.sin(c),z=Math.abs(Math.cos(c))<.3?"middle":Math.cos(c)>0?"start":"end";return`
          <circle class="term-diagram-node" cx="${m.toFixed(1)}" cy="${d.toFixed(1)}" r="11"/>
          <text class="term-diagram-label--small" x="${y.toFixed(1)}" y="${(b+4).toFixed(1)}" text-anchor="${z}">${t(n)}</text>
          <text class="term-diagram-note--accent" x="${x.toFixed(1)}" y="${(g+4).toFixed(1)}" text-anchor="middle">${l+1}</text>
          <text class="term-diagram-note" x="${x.toFixed(1)}" y="${(g+18).toFixed(1)}" text-anchor="middle">${s-l}</text>
        `}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 500 330" role="img" aria-label="${t(e.note)}">
        ${o}
        <text class="term-diagram-note--accent" x="250" y="146" text-anchor="middle">${t(e.readingA)}</text>
        <text class="term-diagram-note" x="250" y="162" text-anchor="middle">${t(e.readingB)}</text>
        <text class="term-diagram-note" x="250" y="320" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"ayni-guc":e=>{const a=(l,c)=>{const m=`M ${l-44} 52 A 44 44 0 0 0 ${l+44} 52`;return c?`<path class="term-diagram-kap term-diagram-kap--kirik" d="${m}"/>`:`<path class="term-diagram-kap" d="${m}"/>`},r=l=>[200,235,270,305,340].map(c=>{const m=c*Math.PI/180;return p(l+22*Math.cos(m),60+22*Math.sin(m),l+52*Math.cos(m),60+52*Math.sin(m),"oneway")}).join(""),i=Math.max(56,$(e.solHal)/2,M(e.solSonuc)/2,$(e.sagHal)/2,u(e.sagSonuc)/2)+8,s=Math.max(i*4+40,u(e.caption)+30),o=s/2-i,n=s/2+i;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} 196" role="img" aria-label="${t(e.note)}">
        ${a(o,!1)}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${o}" cy="60" r="22"/>
        <text class="term-diagram-label--small" x="${o}" y="112" text-anchor="middle">${t(e.solHal)}</text>
        <text class="term-diagram-note--accent" x="${o}" y="132" text-anchor="middle">${t(e.solSonuc)}</text>

        ${r(n)}
        ${a(n,!0)}
        <circle class="term-diagram-node" cx="${n}" cy="60" r="22"/>
        <text class="term-diagram-label--small" x="${n}" y="112" text-anchor="middle">${t(e.sagHal)}</text>
        <text class="term-diagram-note" x="${n}" y="132" text-anchor="middle">${t(e.sagSonuc)}</text>

        <text class="term-diagram-note" x="${(s/2).toFixed(0)}" y="168" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-label term-diagram-label--small" x="${(s/2).toFixed(0)}" y="18" text-anchor="middle">${t(e.guc)}</text>
      </svg>
    `},"uc-kapi":e=>{const a=Math.max(150,Math.max.apply(null,e.kapilar.map(s=>Math.max($(s.ad),M(s.hal))))+18),r=Math.max(a*e.kapilar.length,u(e.caption)+30),i=e.kapilar.map((s,o)=>{const n=(r-a*e.kapilar.length)/2+a/2+o*a,l=o===e.vurgu;let c="",m;return s.tur==="gecilmez"?(c=`<rect class="term-diagram-engel" x="${n-36}" y="86" width="72" height="9" rx="2"/>`,m=p(n,30,n,86,"oneway")):s.tur==="zorlanabilir"?(c=`<rect class="term-diagram-engel term-diagram-engel--kesik" x="${n-36}" y="86" width="26" height="9" rx="2"/><rect class="term-diagram-engel term-diagram-engel--kesik" x="${n+10}" y="86" width="26" height="9" rx="2"/>`,m=p(n,30,n,86,"oneway")+p(n,95,n,124,"oneway","term-diagram-isikyolu--kesik")):m=p(n,30,n,130,"oneway"),`${m}${c}
          <text class="term-diagram-label--small${l?"":" term-diagram-solgun"}" x="${n}" y="152" text-anchor="middle">${t(s.ad)}</text>
          <text class="term-diagram-note${l?"--accent":""}" x="${n}" y="170" text-anchor="middle">${t(s.hal)}</text>`}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} 214" role="img" aria-label="${t(e.note)}">
        ${i}
        <text class="term-diagram-note" x="${(r/2).toFixed(0)}" y="206" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"ikili-eslesme":e=>{const a=Math.max.apply(null,e.satirlar.map(m=>Math.max(t(m.sol).length,t(m.sag).length))),r=Math.max(74,a*3.7+10),i=Math.max(r*4+60,u(e.caption)+30,e.satirlar.some(m=>m.perde)?u(e.perdeLabel)+30:0),s=r+14,o=i-r-14,n=i/2,l=e.satirlar.map((m,d)=>{const x=62+d*96,g=m.perde?`<rect class="term-diagram-perde" x="${n-13}" y="${x-26}" width="26" height="52"/>
             <text class="term-diagram-note" x="${n}" y="${x-36}" text-anchor="middle">${t(e.perdeLabel)}</text>`:"",y=d===e.vurgu?" term-diagram-node--accent":"";return`${p(s+30,x,o-30,x,"oneway")}${g}
          <circle class="term-diagram-node${y}" cx="${s}" cy="${x}" r="26"/>
          <text class="term-diagram-label--small" x="${s}" y="${x+45}" text-anchor="middle">${t(m.sol)}</text>
          <circle class="term-diagram-node${y}" cx="${o}" cy="${x}" r="26"/>
          <text class="term-diagram-label--small" x="${o}" y="${x+45}" text-anchor="middle">${t(m.sag)}</text>`}).join(""),c=62+(e.satirlar.length-1)*96+82;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} ${c}" role="img" aria-label="${t(e.note)}">
        ${l}
        <text class="term-diagram-note" x="${n.toFixed(0)}" y="${c-10}" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},bulusma:e=>{const a=e.kaynaklar.length,r=Math.max.apply(null,e.kaynaklar.map($)),i=Math.max(360,(138+r)*2+24,$(e.merkez)+80,u(e.caption)+30),s=i/2,o=178,n=116,l=e.kaynaklar.map((c,m)=>{const x=(-160+140*(a>1?m/(a-1):.5))*Math.PI/180,g=s+n*Math.cos(x),y=o+n*Math.sin(x),b=Math.cos(x),z=Math.abs(b)<.3?"middle":b>0?"start":"end",q=g+b*22,C=y+(Math.abs(b)<.3?-26:4);return`${p(g,y,s,o,"oneway")}
          <circle class="term-diagram-node term-diagram-node--sm" cx="${g.toFixed(1)}" cy="${y.toFixed(1)}" r="13"/>
          <text class="term-diagram-label--small" x="${q.toFixed(1)}" y="${C.toFixed(1)}" text-anchor="${z}">${t(c)}</text>`}).join("");return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} 254" role="img" aria-label="${t(e.note)}">
        ${l}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${s.toFixed(0)}" cy="${o}" r="28"/>
        <text class="term-diagram-label--small" x="${s.toFixed(0)}" y="${o+5}" text-anchor="middle">${t(e.merkez)}</text>
        <text class="term-diagram-note" x="${s.toFixed(0)}" y="244" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"damla-deniz":e=>{const r=Math.max(420,u(e.caption)+30,196+M(e.fenaLabel)/2+20,316+M(e.bekaLabel)/2+20);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} 208" role="img" aria-label="${t(e.note)}">
        <rect class="term-diagram-deniz" x="0" y="92" width="${r.toFixed(0)}" height="72"/>
        <text class="term-diagram-label--small" x="${(r-28).toFixed(0)}" y="136" text-anchor="end">${t(e.deniz)}</text>

        <circle class="term-diagram-node${e.vurgu==="once"?" term-diagram-node--accent":""}" cx="76" cy="46" r="22"/>
        <text class="term-diagram-label--small" x="76" y="51" text-anchor="middle">${t(e.damla)}</text>
        ${p(76,70,172,122,"oneway")}

        <circle class="term-diagram-node--dashed term-diagram-eriyen${e.vurgu==="fena"?" term-diagram-node--accent":""}" cx="196" cy="126" r="22"/>
        <text class="term-diagram-note${e.vurgu==="fena"?"--accent":""}" x="196" y="82" text-anchor="middle">${t(e.fenaLabel)}</text>

        <circle class="term-diagram-eriyen term-diagram-eriyen--soluk${e.vurgu==="beka"?" term-diagram-node--accent":""}" cx="316" cy="126" r="22"/>
        <text class="term-diagram-note${e.vurgu==="beka"?"--accent":""}" x="316" y="82" text-anchor="middle">${t(e.bekaLabel)}</text>

        <text class="term-diagram-note" x="${(r/2).toFixed(0)}" y="198" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"suren-ve-biten":e=>{const a=Math.max(440,$(e.suren)+30,$(e.biten)+30,u(e.caption)+30,u(e.altCaption)+30),r=Math.round(a/2);return`
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
        <text class="term-diagram-label--small${e.vurgu==="suren"?"":" term-diagram-solgun"}" x="${r}" y="40" text-anchor="middle">${t(e.suren)}</text>

        <rect class="term-diagram-node${e.vurgu==="biten"?" term-diagram-node--accent":""} term-diagram-parca" x="${r-68}" y="58" width="136" height="26" rx="6"/>
        <line class="term-diagram-uc" x1="${r-68}" y1="50" x2="${r-68}" y2="92"/>
        <line class="term-diagram-uc" x1="${r+68}" y1="50" x2="${r+68}" y2="92"/>
        <text class="term-diagram-label--small${e.vurgu==="biten"?"":" term-diagram-solgun"}" x="${r}" y="112" text-anchor="middle">${t(e.biten)}</text>
        <text class="term-diagram-note" x="${r}" y="140" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-note" x="${r}" y="158" text-anchor="middle">${t(e.altCaption)}</text>
      </svg>
    `},"odunc-yetki":e=>{const a=Math.max($(e.asil),$(e.vekil),$(e.alan))/2+30,r=Math.max(400,a*6,u(e.caption)+30,u(e.altCaption)+30),i=a,s=r/2,o=r-a;return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} 168" role="img" aria-label="${t(e.note)}">
        ${p(i+30,58,s-26,58,"oneway")}
        ${p(s+26,58,o-30,58,"oneway")}
        <circle class="term-diagram-node term-diagram-node--accent" cx="${i.toFixed(0)}" cy="58" r="30"/>
        ${F(t(e.asil),30).metin(i,58,30)}
        <circle class="term-diagram-node term-diagram-node--faint" cx="${s.toFixed(0)}" cy="58" r="26"/>
        ${F(t(e.vekil),26).metin(s,58,26)}
        <circle class="term-diagram-node term-diagram-node--dashed" cx="${o.toFixed(0)}" cy="58" r="26"/>
        ${F(t(e.alan),26).metin(o,58,26)}
        <text class="term-diagram-note" x="${s.toFixed(0)}" y="136" text-anchor="middle">${t(e.caption)}</text>
        <text class="term-diagram-note" x="${s.toFixed(0)}" y="156" text-anchor="middle">${t(e.altCaption)}</text>
      </svg>
    `},"donen-kulluk":e=>{const i=Math.max($(e.zorunlu),$(e.gonullu),u(e.zorunluNot),u(e.gonulluNot))/2+12,s=Math.max(420,i*2+220,u(e.caption)+30,M(e.donus)+60),o=Math.max(64,i),n=s-Math.max(64,i),l="tdIsik"+ie++,c=n-10,m=74,d=o+10,g=`M ${c.toFixed(0)} ${m} Q ${((o+n)/2).toFixed(0)} 0 ${d.toFixed(0)} 74`,y="var(--series-theme)";return`
      <svg class="term-diagram__svg" viewBox="0 0 ${s.toFixed(0)} 206" role="img" aria-label="${t(e.note)}">
        <defs><linearGradient id="${l}" x1="${c.toFixed(0)}" y1="0" x2="${d.toFixed(0)}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" style="stop-color:${y};stop-opacity:0.1"/><stop offset="100%" style="stop-color:${y};stop-opacity:0.9"/></linearGradient></defs>
        <path class="term-diagram-isikyolu" data-isikyolu-yon="oneway" d="${g}" fill="none" stroke="url(#${l})"/>
        <text class="term-diagram-note term-diagram-note--accent" x="${((o+n)/2).toFixed(0)}" y="24" text-anchor="middle">${t(e.donus)}</text>
        <circle class="term-diagram-node term-diagram-node--accent" cx="${o.toFixed(0)}" cy="100" r="28"/>
        <circle class="term-diagram-node" cx="${n.toFixed(0)}" cy="100" r="28"/>
        <text class="term-diagram-label--small" x="${o.toFixed(0)}" y="148" text-anchor="middle">${t(e.zorunlu)}</text>
        <text class="term-diagram-note" x="${o.toFixed(0)}" y="166" text-anchor="middle">${t(e.zorunluNot)}</text>
        <text class="term-diagram-label--small" x="${n.toFixed(0)}" y="148" text-anchor="middle">${t(e.gonullu)}</text>
        <text class="term-diagram-note" x="${n.toFixed(0)}" y="166" text-anchor="middle">${t(e.gonulluNot)}</text>
        <text class="term-diagram-note" x="${(s/2).toFixed(0)}" y="198" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"kapisiz-ev":e=>{const a=[0,1,2,3,4].map(i=>`<rect class="term-diagram-sutun" x="${92+i*42}" y="66" width="12" height="72"/>`).join(""),r=Math.max(460,410+Math.max($(e.disSutun),u(e.disNot))+14,u(e.caption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${r.toFixed(0)} 210" role="img" aria-label="${t(e.note)}">
        <path class="term-diagram-cati" d="M 62 58 L 200 22 L 338 58"/>
        <rect class="term-diagram-duvar" x="62" y="58" width="276" height="88"/>
        ${a}
        <text class="term-diagram-label--small" x="200" y="164" text-anchor="middle">${t(e.ev)}</text>
        <text class="term-diagram-note" x="200" y="182" text-anchor="middle">${t(e.evNot)}</text>

        <rect class="term-diagram-sutun term-diagram-sutun--dis" x="346" y="66" width="14" height="80"/>
        ${p(360,106,404,106,"return")}
        <text class="term-diagram-label--small" x="410" y="98" text-anchor="start">${t(e.disSutun)}</text>
        <text class="term-diagram-note--accent" x="410" y="118" text-anchor="start">${t(e.disNot)}</text>
        <text class="term-diagram-note" x="${(r/2).toFixed(0)}" y="204" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"yavas-sapma":e=>{const a=e.adimlar.length,r=Math.max.apply(null,e.adimlar.map(u))/2,i=Math.max(40,r+10),s=i+340,o=48,n=d=>{const x=d/Math.max(a-1,1);return{x:i+(s-i)*x,y:o+96*x*x}},l=[];for(let d=0;d<=40;d+=1){const x=d/40;l.push(`${(i+(s-i)*x).toFixed(1)},${(o+96*x*x).toFixed(1)}`)}const c=e.adimlar.map((d,x)=>{const g=n(x);return`<circle class="term-diagram-node term-diagram-node--sm term-diagram-node--accent" cx="${g.x.toFixed(1)}" cy="${g.y.toFixed(1)}" r="7"/>
          <text class="term-diagram-note" x="${g.x.toFixed(1)}" y="${(g.y+22).toFixed(1)}" text-anchor="middle">${t(d)}</text>`}).join(""),m=Math.max(s+r+20,u(e.caption)+30,u(e.altCaption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${m.toFixed(0)} 226" role="img" aria-label="${t(e.note)}">
        <line class="term-diagram-node--barrier term-diagram-dogru-yol" x1="${i}" y1="${o}" x2="${(m-20).toFixed(0)}" y2="${o}"/>
        <text class="term-diagram-label--small" x="${(m-20).toFixed(0)}" y="${o-12}" text-anchor="end">${t(e.dogruYol)}</text>
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
    `},"bir-carpim":e=>{const a=e.satirlar.map((s,o)=>{const n=46+o*76;return`
          <circle class="term-diagram-node term-diagram-node--accent" cx="60" cy="${n}" r="24"/>
          <text class="term-diagram-label" x="60" y="${n+6}" text-anchor="middle">${t(e.bir)}</text>
          <text class="term-diagram-op" x="106" y="${n+6}" text-anchor="middle">\xD7</text>
          <circle class="term-diagram-node" cx="152" cy="${n}" r="24"/>
          <text class="term-diagram-label" x="152" y="${n+6}" text-anchor="middle">${t(s.carpan)}</text>
          <text class="term-diagram-op" x="198" y="${n+6}" text-anchor="middle">=</text>
          <circle class="term-diagram-node${s.ayni?" term-diagram-node--accent":""}" cx="244" cy="${n}" r="24"/>
          <text class="term-diagram-label" x="244" y="${n+6}" text-anchor="middle">${t(s.sonuc)}</text>
          <text class="term-diagram-note" x="300" y="${n+5}" text-anchor="start">${t(s.not)}</text>`}).join(""),r=46+(e.satirlar.length-1)*76+66,i=Math.max(520,300+Math.max.apply(null,e.satirlar.map(s=>u(s.not)))+16,u(e.caption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${i.toFixed(0)} ${r}" role="img" aria-label="${t(e.note)}">
        ${a}
        <text class="term-diagram-note" x="${(i/2).toFixed(0)}" y="${r-12}" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"bes-his":e=>{const a=(l,c,m)=>{const d=c.hisler.map((x,g)=>`
          <circle class="term-diagram-node term-diagram-node--sm" cx="${l}" cy="${58+g*46}" r="14"/>
          <text class="term-diagram-label--small" x="${l}" y="${86+g*46}" text-anchor="middle">${t(x)}</text>`).join("");return`<text class="term-diagram-note${m===2?"--accent":""}" x="${l}" y="26" text-anchor="middle">${t(c.ad)}</text>${d}`},r=Math.max(170,Math.max.apply(null,e.gruplar.map(l=>Math.max(M(l.ad),Math.max.apply(null,l.hisler.map($)))))+16),i=r/2,s=i+r,o=s+r,n=Math.max(r*3,u(e.caption)+30);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${n.toFixed(0)} 200" role="img" aria-label="${t(e.note)}">
        ${p(i+20,58,o-20,58,"oneway")}
        ${p(s+20,58,o-20,58,"oneway")}
        ${a(i,e.gruplar[0],0)}
        ${a(s,e.gruplar[1],1)}
        ${a(o,e.gruplar[2],2)}
        <text class="term-diagram-note" x="${(n/2).toFixed(0)}" y="192" text-anchor="middle">${t(e.caption)}</text>
      </svg>
    `},"gunes-ay":e=>{const a=Math.max(420,u(e.caption)+30,96+Math.max(M(e.kaynakNot),$(e.kaynakAd))/2+20,322+Math.max(u(e.yansitanNot),$(e.yansitanAd))/2+20);return`
      <svg class="term-diagram__svg" viewBox="0 0 ${a.toFixed(0)} 188" role="img" aria-label="${t(e.note)}">
        <circle class="term-diagram-hale" cx="96" cy="66" r="46"/>
        <circle class="term-diagram-node term-diagram-node--accent" cx="96" cy="66" r="30"/>
        ${F(t(e.kaynakAd),30).metin(96,66,30)}
        ${p(142,66,292,66,"oneway")}
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
    `}},Ae=`
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
  `;let V=[];function Se(e,a){const r=e&&e.diagram||[],i=r.filter(l=>l.termId===a.id),s=r.filter(l=>!l.termId);if(V=i.concat(s),!V.length)return"";function o(l,c){return l.map((m,d)=>{const x=ne[m.type];return x?`<div class="term-diagram-card">
            <div class="term-diagram-svg-wrap" data-diagram-index="${d+c}" role="button" tabindex="0"
                 aria-label="${t({tr:"B\xFCy\xFCt",en:"Enlarge",pt:"Ampliar"})}">${x(m)}</div>
            <p class="term-diagram-caption">${t(m.note)}</p>
          </div>`:""}).join("")}function n(l,c,m){const d=o(c,m);return d.trim()?`
        <p class="detail-eyebrow detail-eyebrow--section">${t(l)}</p>
        <div class="term-diagram-row term-diagram-row--panel">${d}</div>
      `:""}return Ae+n(a.id==="berzah"?{tr:"A\xE7\u0131klay\u0131c\u0131 \xE7izim \xB7 Sitenin yorumu",en:"Explanatory diagram \xB7 Site interpretation",pt:"Diagrama explicativo \xB7 Interpreta\xE7\xE3o do site"}:{tr:"\xC7izim",en:"Diagram",pt:"Diagrama"},i,0)+n({tr:"Grup \xC7izimi",en:"Group Diagram",pt:"Diagrama do Grupo"},s,i.length)}function oe(e){const a=V[e];if(!a)return;const r=ne[a.type];r&&(window.dostTrack&&window.dostTrack("sema_acildi",{type:a.type}),window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),svgHtml:r(a),caption:t(a.note)}),se(document.querySelector(".cizim-lightbox__svg-wrap")))}function Be(e){const a=(e.iliskili_kavramlar||[]).map(r=>k.terms[r]).filter(Boolean).slice(0,3);return a.length?`<span class="terim-card__related">${a.map(r=>t(r.title)).join(" \xB7 ")}</span>`:""}const ot=!0;let H=null;function Ce(e){const a=new Map,r=new Map;Object.values(e).forEach(l=>{(l.iliskili_kavramlar||[]).forEach(c=>{const m=typeof c=="string"?c:c&&c.id;m&&r.set(m,(r.get(m)||0)+1)})}),Object.values(e).forEach(l=>{const c=(l.kaynaklar||[]).length+(r.get(l.id)||0)+(l.site_baglantilari||[]).length;a.set(l.id,c)});const i=Array.from(a.values()),s=Math.min(...i),o=Math.max(...i),n=new Map;return a.forEach((l,c)=>n.set(c,o===s?.5:(l-s)/(o-s))),{raw:a,norm:n,lo:s,hi:o}}const T=7.4,R=2*Math.PI*T;function Ee(e,a){const r=Math.max(.06,Math.min(1,e)),i=R*(1-r);return`<svg class="terim-entry__gauge" viewBox="0 0 20 20" aria-hidden="true" style="--tag-hue:${a}">
      <circle class="terim-entry__gauge-track" cx="10" cy="10" r="${T}"></circle>
      <circle class="terim-entry__gauge-arc" cx="10" cy="10" r="${T}"
        stroke-dasharray="${R.toFixed(2)}" stroke-dashoffset="${i.toFixed(2)}"></circle>
    </svg>`}function De(){return`<p class="terimler-intro" data-kisa-satir="3">${t({tr:"Ayn\u0131 kelimenin \u0130bn Arab\xEE'nin farkl\u0131 yerlerinde nas\u0131l kar\u015F\u0131m\u0131za \xE7\u0131kt\u0131\u011F\u0131n\u0131 izleyen bir derleme. Bir terime t\u0131klay\u0131n, kayna\u011F\u0131na ve ili\u015Fkili terimlere oradan ula\u015F\u0131n.",en:"A collection following how the same word turns up in different places in Ibn Arabi's work. Click a term to reach its sources and related terms from there.",pt:"Uma colet\xE2nea que segue como a mesma palavra aparece em lugares diferentes na obra de Ibn Arabi. Clique num termo para chegar \xE0s suas fontes e termos relacionados a partir dali."})}</p>`}function Ie(){return`<div class="terimler-heat">
      <p class="terimler-heat__title">
        ${[.25,.6,1].map(e=>`<svg class="terim-entry__gauge terimler-heat__gauge" viewBox="0 0 20 20" aria-hidden="true">
          <circle class="terim-entry__gauge-track" cx="10" cy="10" r="${T}"></circle>
          <circle class="terim-entry__gauge-arc" cx="10" cy="10" r="${T}"
            stroke-dasharray="${R.toFixed(2)}" stroke-dashoffset="${(R*(1-e)).toFixed(2)}"></circle>
        </svg>`).join("")}
        <span>${t({tr:"D\xF6n\xFC\u015F yo\u011Funlu\u011Fu",en:"Return density",pt:"Densidade de retorno"})}</span>
      </p>
      <p class="terimler-heat__note" data-kisa-satir="2">${t({tr:"Her terimin yan\u0131ndaki halka, ona ka\xE7 kere geri d\xF6nd\xFC\u011F\xFCm\xFCz kadar doluyor \u2014 kaydetti\u011Fimiz kaynak pasajlar\u0131, ba\u015Fka terimlerin ona verdi\u011Fi at\u0131flar ve sitenin \xF6b\xFCr b\xF6l\xFCmlerine kurdu\u011Fumuz ba\u011Flar toplanarak. Bu, Dost'un neye a\u011F\u0131rl\u0131k verdi\u011Fini de\u011Fil, bizim okumam\u0131z\u0131n nerede yo\u011Funla\u015Ft\u0131\u011F\u0131n\u0131 g\xF6steriyor.",en:"The ring beside each term fills in proportion to how often we have had to come back to it \u2014 the source passages we recorded, the references other terms make to it, and the links we built to other parts of the site, added together. This shows not what Dost emphasised but where our own reading has thickened.",pt:"O anel ao lado de cada termo preenche-se na propor\xE7\xE3o de quantas vezes tivemos de voltar a ele \u2014 as passagens-fonte que registramos, as refer\xEAncias que outros termos lhe fazem e os v\xEDnculos que constru\xEDmos com outras partes do site, somados. Isto mostra n\xE3o o que Dost enfatizou, mas onde a nossa pr\xF3pria leitura se adensou."})}</p>
    </div>`}function Te(){const e=k.terms;H||(H=Ce(e));const a=new Map;Object.values(e).forEach(n=>{a.has(n.group)||a.set(n.group,[]),a.get(n.group).push(n)});const r=(k.groups||[]).filter(n=>(a.get(n.id)||[]).length),i=`<nav class="terimler-rail" aria-label="${t({tr:"S\xF6zl\xFCk b\xF6l\xFCmleri",en:"Glossary sections",pt:"Se\xE7\xF5es do gloss\xE1rio"})}">
      <label class="terimler-filter">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="15.8" y1="15.8" x2="20" y2="20" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <input type="search" id="terimler-filter-input" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"
          placeholder="${t({tr:"Terim ara\u2026",en:"Search terms\u2026",pt:"Procurar termos\u2026"})}"
          aria-label="${t({tr:"Terim ara",en:"Search terms",pt:"Procurar termos"})}">
      </label>
      <p class="terimler-rail__count" id="terimler-rail-count"></p>
      <ol class="terimler-rail__list">${r.map(n=>{const l=(a.get(n.id)||[]).length;return`<li><a class="terimler-rail__item" href="#terim-grup-${n.id}" data-group="${n.id}" style="--tag-hue:${Q(n.id)}">
            <span class="terimler-rail__dot" aria-hidden="true"></span>
            <span class="terimler-rail__name">${t(n.name)}</span>
            <span class="terimler-rail__n">${l}</span>
          </a></li>`}).join("")}</ol>
    </nav>`,s=r.map(n=>{const l=a.get(n.id)||[],c=Q(n.id),m=l.map(d=>{const x=d.tier||2,g=H.norm.get(d.id),y=H.raw.get(d.id),b=t({tr:d.ozet_tr,en:d.ozet_en,pt:d.ozet_pt}),z=t({tr:"D\xF6n\xFC\u015F yo\u011Funlu\u011Fu: "+y,en:"Return density: "+y,pt:"Densidade de retorno: "+y});return`<button class="terim-entry terim-entry--tier-${x}" data-id="${d.id}"
                data-search="${(t(d.title)+" "+b).toLowerCase().replace(/"/g,"")}"
                title="${z}">
              ${Ee(g==null?0:g,c)}
              <span class="terim-entry__text">
                <span class="terim-entry__title">${t(d.title)}</span>
                <span class="terim-entry__ozet">${b}</span>
                ${Be(d)}
              </span>
            </button>`}).join("");return`<section class="terimler-group" id="terim-grup-${n.id}" data-group="${n.id}" style="--tag-hue:${c}">
          <header class="terimler-group__header">
            <span class="terimler-group__badge">${Me(n.id)}</span>
            <div>
              <h2 class="terimler-group__title">${t(n.name)}</h2>
              <p class="terimler-group__desc">${t(n.description)}</p>
            </div>
          </header>
          <div class="terimler-group__entries">${m}</div>
          <p class="terimler-group__empty" hidden>${t({tr:"Bu b\xF6l\xFCmde e\u015Fle\u015Fen terim yok.",en:"No matching term in this section.",pt:"Nenhum termo correspondente nesta se\xE7\xE3o."})}</p>
        </section>`}).join(""),o=`<details class="terimler-rehber">
      <summary>${t({tr:"Bu s\xF6zl\xFCk nas\u0131l okunur?",en:"How to read this glossary",pt:"Como ler este gloss\xE1rio"})}</summary>
      ${De()}${Ie()}
      <button class="terimler-fca-btn" id="terimler-fca-btn" type="button"
        title="${t({tr:"Makine k\xFCmelemesi \u2014 grup/mertebe niteliklerinden kurulan bir kavram kafesi",en:"Machine clustering \u2014 a concept lattice built from group/tier attributes",pt:"Agrupamento por m\xE1quina \u2014 uma rede de conceitos constru\xEDda a partir dos atributos grupo/n\xEDvel"})}"
        aria-label="${t({tr:"Makine k\xFCmelemesi (FCA)",en:"Machine clustering (FCA)",pt:"Agrupamento por m\xE1quina (FCA)"})}">
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="8.5" y="14" width="7" height="7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="6.5" y1="10" x2="10.5" y2="14.5" stroke="currentColor" stroke-width="1.3"/><line x1="17.5" y1="10" x2="13.5" y2="14.5" stroke="currentColor" stroke-width="1.3"/></svg>
        <span>${t({tr:"Makine K\xFCmelemesi",en:"Machine Clustering",pt:"Agrupamento por M\xE1quina"})}</span>
      </button>
    </details>`;v.innerHTML=`<div class="terimler-shell">${i}<div class="terimler-body">${o}${s}</div></div>`,v.querySelectorAll(".terim-entry").forEach(n=>{n.addEventListener("click",()=>j(n.dataset.id))}),je(),Xe(),Oe(),L&&K()}function je(){const e=Array.from(v.querySelectorAll(".terimler-rail__item"));if(!e.length||(e.forEach(i=>{i.addEventListener("click",s=>{s.preventDefault();const o=v.querySelector("#terim-grup-"+CSS.escape(i.dataset.group));if(!o)return;const n=window.matchMedia("(prefers-reduced-motion: reduce)").matches;o.scrollIntoView({behavior:n?"auto":"smooth",block:"start"}),qe(o,n)})}),!("IntersectionObserver"in window)))return;const a=new Set,r=new IntersectionObserver(i=>{i.forEach(o=>{const n=o.target.dataset.group;o.isIntersecting?a.add(n):a.delete(n)}),e.forEach(o=>o.classList.remove("is-current"));const s=e.find(o=>a.has(o.dataset.group));s&&(s.classList.add("is-current"),Ne(s))},{rootMargin:"-30% 0px -60% 0px",threshold:0});v.querySelectorAll(".terimler-group").forEach(i=>r.observe(i))}let G=[];function qe(e,a){G.forEach(clearTimeout),G=[],v.querySelectorAll(".terimler-group.is-pulsing").forEach(i=>i.classList.remove("is-pulsing")),v.querySelectorAll(".terimler-group__badge.futuhat-pulse").forEach(i=>i.classList.remove("futuhat-pulse"));const r=e.querySelector(".terimler-group__badge");G.push(setTimeout(()=>{e.classList.add("is-pulsing"),r&&r.classList.add("futuhat-pulse"),G.push(setTimeout(()=>{e.classList.remove("is-pulsing"),r&&r.classList.remove("futuhat-pulse")},1700))},a?0:350))}function Ne(e){const a=e.closest(".terimler-rail__list"),r=e.closest(".terimler-rail"),i=a&&a.scrollWidth-a.clientWidth>1?a:null,s=r&&r.scrollHeight-r.clientHeight>1?r:null;if(i){const o=e.getBoundingClientRect(),n=i.getBoundingClientRect();o.left<n.left?i.scrollLeft+=o.left-n.left-8:o.right>n.right&&(i.scrollLeft+=o.right-n.right+8)}if(s){const o=e.getBoundingClientRect(),n=s.getBoundingClientRect();o.top<n.top?s.scrollTop+=o.top-n.top-8:o.bottom>n.bottom&&(s.scrollTop+=o.bottom-n.bottom+8)}}let X=null;function He(){return X||(X=window.DostGraphUtils.fetchJson("data/ibn-arabi/terimler-fca.json").catch(()=>null)),X}const Re={tr:"Listede vurgula",en:"Highlight in list",pt:"Destacar na lista"};function Ge(e){const a=e.nitelikler.map(i=>t(i.label)).join(", "),r=e.uyeler.map(i=>{const s=k.terms[i],o=s?t(s.title):i;return`<a class="cross-link" href="${window.__dostNav.href("terimler",i)}" data-view="terimler" data-id="${i}">${o}</a>`}).join(", ");return`<div class="esma-fca-cluster">
      <p class="esma-fca-cluster__nitelik">${a}</p>
      <p class="esma-fca-cluster__isimler">${r}</p>
      <button class="esma-fca-cluster__show" type="button" data-cluster-id="${e.id}">${t(Re)}</button>
    </div>`}function We(){He().then(e=>{if(!e||!window.DostLightbox)return;window.dostTrack&&window.dostTrack("sema_acildi",{type:"terimler-fca"});const a=e.kumeler.map(Ge).join("");window.DostLightbox.open({closeLabel:t({tr:"Kapat",en:"Close",pt:"Fechar"}),name:t({tr:"Makine K\xFCmelemesi (FCA)",en:"Machine Clustering (FCA)",pt:"Agrupamento por M\xE1quina (FCA)"}),svgHtml:`<div class="esma-fca-lightbox">
          <p class="esma-fca-lightbox__not">${t(e.not)}</p>
          <div class="esma-fca-lightbox__list">${a}</div>
        </div>`,caption:""});const r=document.querySelector(".cizim-lightbox__svg-wrap");r&&(r.querySelectorAll(".cross-link").forEach(i=>{i.addEventListener("click",()=>{window.DostLightbox.close()})}),r.querySelectorAll(".esma-fca-cluster__show").forEach(i=>{i.addEventListener("click",()=>{const s=e.kumeler.find(o=>String(o.id)===i.dataset.clusterId);s&&(window.DostLightbox.close(),Pe(s))})}))})}function Oe(){const e=document.getElementById("terimler-fca-btn");!e||e.dataset.wiredFcaButton||(e.dataset.wiredFcaButton="1",e.addEventListener("click",We))}function K(){v.classList.toggle("terimler-shell--cluster-active",!!L),v.querySelectorAll(".terim-entry").forEach(e=>{e.classList.toggle("is-cluster-member",!!L&&L.members.has(e.dataset.id))})}function Pe(e){L={id:e.id,members:new Set(e.uyeler),nitelikler:e.nitelikler},K(),Ye(e);const a=k.terms[e.uyeler[0]],r=a?v.querySelector("#terim-grup-"+CSS.escape(a.group)):null;if(r){const i=window.matchMedia("(prefers-reduced-motion: reduce)").matches;r.scrollIntoView({behavior:i?"auto":"smooth",block:"start"})}window.dostTrack&&window.dostTrack("terimler_fca_odak",{id:e.id})}function Ue(){L&&(L=null,K(),Ve())}function Ye(e){const a=document.getElementById("terimler-fca-caption"),r=document.getElementById("terimler-fca-caption-nitelik");!a||!r||(r.textContent=e.nitelikler.map(i=>t(i.label)).join(" \xB7 "),a.hidden=!1)}function Ve(){const e=document.getElementById("terimler-fca-caption");e&&(e.hidden=!0)}window.DostGraphUtils&&window.DostGraphUtils.registerStepBack("terimler-wrap",()=>L?(Ue(),!0):!1);function Xe(){const e=v.querySelector("#terimler-filter-input"),a=v.querySelector("#terimler-rail-count");if(!e)return;const r=Array.from(v.querySelectorAll(".terim-entry")),i=r.length;function s(n){a&&(a.textContent=t(n===i?{tr:i+" terim",en:i+" terms",pt:i+" termos"}:{tr:n+" / "+i+" terim",en:n+" / "+i+" terms",pt:n+" / "+i+" termos"}))}function o(){const n=e.value.trim().toLowerCase();let l=0;r.forEach(c=>{const m=!n||c.dataset.search.indexOf(n)!==-1;c.hidden=!m,m&&l++}),v.querySelectorAll(".terimler-group").forEach(c=>{const m=c.querySelector(".terim-entry:not([hidden])");c.classList.toggle("is-empty",!m);const d=c.querySelector(".terimler-group__empty");d&&(d.hidden=!!m)}),s(l)}e.addEventListener("input",o),e.addEventListener("keydown",n=>{n.key==="Escape"&&e.value&&(n.stopPropagation(),e.value="",o())}),s(i)}function J(){k&&Te()}function Ke(e){if(!e.analogy)return"";const a=t(e.analogy);return!a||!String(a).trim()?"":`<div class="detail-analogy">
      <p class="detail-analogy__label">${t({tr:"Bir benzetmeyle",en:"In one analogy",pt:"Numa analogia"})}</p>
      <p>${B(a,"terimler",e.id)}</p>
    </div>`}function Je(e,a){return!e||!e.length?"":`<div class="insight-group">${e.map((r,i)=>`<details class="insight" ${i===0?"open":""}>
          <summary>${r.kaynak_adi?r.kaynak_adi:t({tr:`Cilt ${r.cilt}`,en:`Volume ${r.cilt}`,pt:`Volume ${r.cilt}`})}</summary>
          <p>${B(t({tr:r.alinti_tr,en:r.alinti_en,pt:r.alinti_pt}),"terimler",a)}</p>
          ${r.not_tr?`<cite>${B(t({tr:r.not_tr,en:r.not_en,pt:r.not_pt}),"terimler",a)}</cite>`:""}
        </details>`).join("")}</div>`}const le={"toz-nitelik":35,siniflandirma:200,"sebep-sonuc":15,"varlik-mertebesi":265,"kozmik-hiyerarsi":225,"kopru-kavram":185,"itibar-edilmez":350,"halvet-perdeleri":300,"sahv-sekr":20,"velayet-risalet":45,"lafza-i-celal":250,"ahad-vahid":210,"nefsin-gucleri":5,"mebde-mead":330,"nubuvvetin-zarureti":40,"vahyin-mertebeleri":190,"hayir-ve-ser":100,"tezkire-i-erbaa":275,firaset:55,"kutbiyet-hiyerarsisi":165,"ahval-makamat":70,"kurani-kozmoloji":235,"idrak-sureci":150,"kader-tevhid":120};function Q(e){return le[e]!==void 0?le[e]:40}function Qe(e){const a=(e.iliskili_kavramlar||[]).map(i=>k.terms[i]).filter(Boolean);if(!a.length)return"";const r=a.map(i=>`<button class="bookmap-concept-tag bookmap-concept-tag--group" data-term="${i.id}" style="--tag-hue:${Q(i.group)}">${t(i.title)}</button>`).join("");return`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"\u0130li\u015Fkili Terimler",en:"Related Terms",pt:"Termos Relacionados"})}</p>
      <div class="bookmap-concept-tags">${r}</div>`}function Ze(e){const a=N.filter(i=>i.from===e.id||i.to===e.id);if(!a.length)return"";const r=a.map(i=>{const s=i.from===e.id?i.to:i.from,o=k.terms[s];return o?`<button class="bookmap-concept-tag bookmap-concept-tag--derived" data-term="${o.id}" title="${t(i.aciklama).replace(/"/g,"&quot;")}">${t(o.title)}</button>`:""}).filter(Boolean).join("");return r?`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"T\xFCretilmi\u015F Ba\u011Flar",en:"Derived Links",pt:"V\xEDnculos Derivados"})}</p>
      <p class="detail-derived-note">${t({tr:"Bu ba\u011Flar\u0131 biz sayd\u0131k (ayn\u0131 b\xF6l\xFCmlerde birlikte ge\xE7me s\u0131kl\u0131\u011F\u0131ndan) \u2014 Dost'un bunlar\u0131 ba\u011Flad\u0131\u011F\u0131 anlam\u0131na gelmez.",en:"We counted these links (from how often the terms occur together in the same chapters) \u2014 it does not mean Ibn Arabi connects them.",pt:"N\xF3s contamos estes v\xEDnculos (pela frequ\xEAncia com que os termos ocorrem juntos nos mesmos cap\xEDtulos) \u2014 n\xE3o significa que Ibn Arabi os conecte."})}</p>
      <div class="bookmap-concept-tags">${r}</div>`:""}function W(e,a){return` data-dost-dosya="data/ibn-arabi/felsefi-terimler.json" data-dost-kaynak="${e}" data-dost-alan="${a}"`}function et(e){const a=e.celisen_yorumlar||[];if(!a.length)return"";const r=a.map((i,s)=>`<div class="divergent-view">
          <p class="divergent-view__kaynak">${i.kaynak}</p>
          <p${W(e.id,`celisen_yorumlar[${s}].gorus`)}>${B(t(i.gorus),"terimler",e.id)}</p>
        </div>`).join("");return`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"\xC7eli\u015Fen Yorumlar",en:"Differing Readings",pt:"Leituras Divergentes"})}</p>
      <div class="divergent-views">${r}</div>
      ${window.DostGraphUtils.has3(e.celisen_yorumlar_not)?`<p class="divergent-views__not"${W(e.id,"celisen_yorumlar_not")}>${B(t(e.celisen_yorumlar_not),"terimler",e.id)}</p>`:""}`}const ce={ontoloji:40,esma:200,hal:265,terimler:15,sorular:225,futuhat:340,sirlar:100,hakkinda:210};function tt(e){const a=e.site_baglantilari||[];if(!a.length)return"";const r={ontoloji:{tr:"Ontoloji",en:"Ontology",pt:"Ontologia"},esma:{tr:"Esm\xE2\xFC'l-H\xFCsn\xE2",en:"The Beautiful Names",pt:"Os Belos Nomes"},hal:{tr:"H\xE2ller",en:"States",pt:"Estados"},terimler:{tr:"Terimler",en:"Terms",pt:"Termos"},sorular:{tr:"Sorular",en:"Questions",pt:"Perguntas"},futuhat:{tr:"F\xFCt\xFBh\xE2t Atlas\u0131",en:"Futuhat Atlas",pt:"Atlas do Futuhat"},sirlar:{tr:"S\u0131rlar",en:"Mysteries",pt:"Mist\xE9rios"},hakkinda:{tr:"Hakk\u0131nda",en:"About",pt:"Sobre"}},i=a.map(s=>`<button class="bookmap-concept-tag bookmap-concept-tag--group" data-view="${s.view}" data-id="${s.id}" style="--tag-hue:${ce[s.view]!==void 0?ce[s.view]:40}">${t(r[s.view]||{})} \u2192 ${s.id}</button>`).join("");return`<p class="detail-eyebrow detail-eyebrow--section">${t({tr:"Haritada G\xF6r",en:"See on the Map",pt:"Ver no Mapa"})}</p>
      <div class="bookmap-concept-tags">${i}</div>`}function at(){const e={tr:"/kuran/23/#a100",en:"/kuran/en/23/#a100",pt:"/kuran/pt/23/#a100"};return`<section class="term-context" aria-label="${t({tr:"Berzah\u0131n ba\u011Flamlar\u0131",en:"Contexts of barzakh",pt:"Contextos de barzakh"})}">
      <h3>${t({tr:"Berzah hangi ba\u011Flamda?",en:"In what context?",pt:"Em qual contexto?"})}</h3>
      <p><strong>${t({tr:"Kur\u2019an \xB7 M\xFC\u2019min\xFBn 23:100",en:"Qur\u2019an \xB7 Al-Mu\u2019minun 23:100",pt:"Alcor\xE3o \xB7 Al-Mu\u2019minun 23:100"})}</strong><br>
      ${t({tr:"\xD6l\xFCm ile yeniden dirili\u015F aras\u0131ndaki ba\u011Flam.",en:"The context between death and resurrection.",pt:"O contexto entre a morte e a ressurrei\xE7\xE3o."})} <a href="${t(e)}">${t({tr:"Ayeti a\xE7",en:"Open the verse",pt:"Abrir o vers\xEDculo"})}</a></p>
      <p><strong>${t({tr:"Bu terim kayd\u0131 \xB7 F\xFCt\xFBh\xE2t okumas\u0131",en:"This glossary entry \xB7 Reading the Futuhat",pt:"Este verbete \xB7 Leitura do Futuhat"})}</strong><br>
      ${t({tr:"Hayal ve r\xFCya \xF6rnekleri \xFCzerinden ara olu\u015F.",en:"In-betweenness through examples of imagination and dreaming.",pt:"O entremeio a partir de exemplos de imagina\xE7\xE3o e sonho."})}</p>
    </section>`}function j(e){const a=k.terms[e];if(!a){window.__dostNav&&window.__dostNav.setHash("terimler");return}window.dostTrack&&window.dostTrack("kavram_sayfasi_goruntulendi",{id:a.id});const r=ke(a.group);A.dataset.currentTerm=e,window.__dostNav&&window.__dostNav.setHash&&window.__dostNav.setHash("terimler",e),S.innerHTML=`
      <p class="detail-eyebrow">${t(r&&r.name||{})}</p>
      <h2 class="detail-title">${t(a.title)}${a.arabic?` <span class="detail-title__arabic">${a.arabic}</span>`:""}</h2>
      ${e==="berzah"?at():""}
      ${window.DostGraphUtils.has3(a.felsefi_tanim)?`<div class="detail-block detail-block--ibnarabi">
        <h3>${t({tr:"Felsefi Tan\u0131m",en:"Philosophical Definition",pt:"Defini\xE7\xE3o Filos\xF3fica"})}</h3>
        <p${W(a.id,"felsefi_tanim")}>${B(t(a.felsefi_tanim),"terimler",a.id)}</p>
      </div>`:""}
      ${window.DostGraphUtils.has3(a.ibn_arabi_yorumu)?`<div class="detail-block">
        <h3>${t({tr:"\u0130bn Arab\xEE'nin Yorumu",en:"Ibn Arabi's Interpretation",pt:"A Interpreta\xE7\xE3o de Ibn Arabi"})}</h3>
        <p${W(a.id,"ibn_arabi_yorumu")}>${B(t(a.ibn_arabi_yorumu),"terimler",a.id)}</p>
      </div>`:""}
      ${fe(a.id)}
      ${Ke(a)}
      ${Se(r,a)}
      ${Je(a.kaynaklar,a.id)}
      ${et(a)}
      ${Qe(a)}
      ${Ze(a)}
      ${tt(a)}
    `,S.querySelectorAll(".bookmap-concept-tag[data-term]").forEach(i=>{i.addEventListener("click",()=>{window.dostTrack&&window.dostTrack("ilgili_kavram_secildi",{from:e,to:i.dataset.term}),j(i.dataset.term)})}),S.querySelectorAll(".bookmap-concept-tag[data-view]").forEach(i=>{i.addEventListener("click",()=>{window.__dostNav&&window.__dostNav.goTo(i.dataset.view,i.dataset.id)})}),S.querySelectorAll(".term-diagram-svg-wrap").forEach(i=>{i.addEventListener("click",()=>oe(Number(i.dataset.diagramIndex))),i.addEventListener("keydown",s=>{(s.key==="Enter"||s.key===" ")&&(s.preventDefault(),oe(Number(i.dataset.diagramIndex)))})}),A.hidden=!1,se(S),N.length||$e().then(()=>{!P.hidden&&!A.hidden&&A.dataset.currentTerm===e&&j(e)}),ve(e),w||be().then(i=>{i&&!P.hidden&&!A.hidden&&A.dataset.currentTerm===e&&j(e)})}window.__terimlerApp={activate(){ae().then(e=>{e&&J()})},goToNode(e){ae().then(a=>{a&&(J(),e&&!P.hidden&&j(e))})},onLangChange(){k&&J()}}})();
