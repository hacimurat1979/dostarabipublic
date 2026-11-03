// Yan Yana sayfaları çerçeve içinde (paralel okuma masası) ya da ?ic=1 ile açılırsa üst çubuk ve alt gezinme gizlenir (2026-11-02).
(function () { try { if (window.self !== window.top || /[?&]ic=1/.test(location.search)) document.documentElement.classList.add("yy-ic"); } catch (e) { document.documentElement.classList.add("yy-ic"); } })();
// Üst menüde geçerli sayfa görünür kalsın (menü yatay kayar).
document.addEventListener("DOMContentLoaded", function () { try { var a = document.querySelector('nav.icin a[aria-current="page"]'); var n = a && a.parentNode; if (n) n.scrollLeft = Math.max(0, a.offsetLeft - (n.clientWidth - a.offsetWidth) / 2); } catch (e) {} });
try { if (localStorage.getItem("dost-vurgu") === "kapali") document.documentElement.classList.add("vurgu-kapali"); } catch (e) {}
