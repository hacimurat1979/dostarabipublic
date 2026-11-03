// Yan Yana sayfaları çerçeve içinde (paralel okuma masası) ya da ?ic=1 ile açılırsa üst çubuk ve alt gezinme gizlenir (2026-11-02).
(function () { try { if (window.self !== window.top || /[?&]ic=1/.test(location.search)) document.documentElement.classList.add("yy-ic"); } catch (e) { document.documentElement.classList.add("yy-ic"); } })();
try { if (localStorage.getItem("dost-vurgu") === "kapali") document.documentElement.classList.add("vurgu-kapali"); } catch (e) {}
// Bölümler menüsü: dışarı dokunma ve Esc kapatır.
document.addEventListener("click", function (e) { var d = document.querySelector("details.bolumler[open]"); if (d && !d.contains(e.target)) d.removeAttribute("open"); });
document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var d = document.querySelector("details.bolumler[open]"); if (d) { d.removeAttribute("open"); var s = d.querySelector("summary"); if (s) s.focus(); } } });
