(function(){"use strict";function e(){const n=document.getElementById("detail-panel");if(!n||document.getElementById("typography-controls"))return;const t=document.createElement("div");t.id="typography-controls",t.className="typography-controls",t.innerHTML=`
      <button class="typography-btn" id="font-size-decrease"
              title="Yaz\u0131 boyutunu k\xFC\xE7\xFClt / Decrease font size / Diminuir tamanho da fonte"
              aria-label="A\u2212 / A- / A-">A\u2212</button>
      <button class="typography-btn" id="font-size-increase"
              title="Yaz\u0131 boyutunu b\xFCy\xFClt / Increase font size / Aumentar tamanho da fonte"
              aria-label="A+">A+</button>
    `;const o=document.getElementById("detail-content");n.insertBefore(t,o),window.DostFontScale.bindFontScaleButtons(document.getElementById("font-size-decrease"),document.getElementById("font-size-increase"))}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()})();
