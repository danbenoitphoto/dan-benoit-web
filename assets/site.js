/* Dan Benoit — gateway + web services. Vanilla JS, no dependencies. */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Before/After sliders ---------- */
  function initSlider(root) {
    var range = root.querySelector('input[type="range"]');
    var top = root.querySelector(".layer.top");
    if (!range || !top) return;
    function setPos(v) {
      v = Math.max(0, Math.min(100, v));
      root.style.setProperty("--pos", v + "%");
      top.style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
      if (document.activeElement !== range) range.value = v;
    }
    setPos(parseFloat(range.value) || 50);
    range.addEventListener("input", function () { setPos(parseFloat(range.value)); });
    var dragging = false;
    function fromEvent(e) {
      var r = root.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setPos((x / r.width) * 100);
    }
    root.addEventListener("pointerdown", function (e) {
      if (e.target === range) return;
      dragging = true; fromEvent(e);
      if (root.setPointerCapture && e.pointerId !== undefined) { try { root.setPointerCapture(e.pointerId); } catch (err) {} }
    });
    root.addEventListener("pointermove", function (e) { if (dragging) fromEvent(e); });
    ["pointerup", "pointercancel"].forEach(function (t) { root.addEventListener(t, function () { dragging = false; }); });
  }
  document.querySelectorAll(".ba").forEach(initSlider);

  /* ---------- Gateway: EN/FR in-page toggle ---------- */
  var toggle = document.querySelector("[data-lang-toggle]");
  if (toggle) {
    var current = document.documentElement.lang || "en";
    function applyLang(lang) {
      current = lang;
      document.documentElement.lang = lang;
      document.querySelectorAll("[data-en]").forEach(function (el) {
        el.textContent = lang === "fr" ? el.getAttribute("data-fr") : el.getAttribute("data-en");
      });
      toggle.textContent = lang === "fr" ? "EN" : "FR";
      toggle.setAttribute("aria-label", lang === "fr" ? "Switch to English" : "Passer au français");
    }
    toggle.addEventListener("click", function () { applyLang(current === "fr" ? "en" : "fr"); });
    if (document.body.classList.contains("gw-fr-first")) applyLang("fr");
  }

  /* ---------- Gateway: remember visitor's choice ---------- */
  var KEY = "danbenoit-choice";
  document.querySelectorAll("[data-remember]").forEach(function (a) {
    a.addEventListener("click", function () {
      try { localStorage.setItem(KEY, a.getAttribute("data-remember")); } catch (e) {}
    });
  });
  var banner = document.querySelector("[data-remember-banner]");
  if (banner) {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (saved) {
      var link = banner.querySelector("[data-remember-link]");
      var label = banner.querySelector("[data-remember-label]");
      var conf = {
        photography: { href: banner.getAttribute("data-href-photo") || "https://danbenoit.com", en: "Photography", fr: "Photographie" },
        web: { href: banner.getAttribute("data-href-web") || "web/", en: "Web Services", fr: "Services web" }
      }[saved];
      if (conf && link) {
        link.href = conf.href;
        if (label) label.textContent = conf.en;
        banner.style.display = "block";
      }
    }
  }

  /* Subtle fade-in only, and never for reduced-motion visitors */
  if (!reduceMotion) {
    document.querySelectorAll(".fade-in").forEach(function (el) { el.style.opacity = ""; });
  }
})();
