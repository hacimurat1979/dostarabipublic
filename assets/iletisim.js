(function(){"use strict";var e="bW9jLmxpYW1nQG5hbWFyYWsudGFydW1pY2Fo";function r(){try{return atob(e).split("").reverse().join("")}catch{return""}}function i(t){var n=/Android\s+([0-9.]+)/.exec(navigator.userAgent||"");return"dil: "+t+" \xB7 site"+(n?" \xB7 Android "+n[1]:"")}function a(t){var n=r();if(n){var o=t.getAttribute("data-dil")||"tr",d=t.getAttribute("data-konu")||"Dost Arab\xEE";location.href="mailto:"+n+"?subject="+encodeURIComponent(d)+"&body="+encodeURIComponent(`


--
`+i(o))}}document.addEventListener("click",function(t){var n=t.target.closest&&t.target.closest("[data-iletisim]");n&&(t.preventDefault(),a(n))})})();
