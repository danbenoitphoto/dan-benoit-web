/* Dan Benoit Web — v2 interactions: before/after sliders, GSAP motion, form.
   Everything degrades gracefully: no GSAP or reduced motion = fully visible, static page. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Before / After sliders ---------- */
  document.querySelectorAll("[data-ba]").forEach(function (ba) {
    var range = ba.querySelector("input[type=range]");
    var userTouched = false;
    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty("--pos", pct + "%");
      if (range) range.value = pct;
    }
    if (range) range.addEventListener("input", function () { userTouched = true; setPos(parseFloat(range.value)); });
    function fromEvent(e) {
      var r = ba.getBoundingClientRect();
      var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
      setPos(((x - r.left) / r.width) * 100);
    }
    ba.addEventListener("pointerdown", function (e) { userTouched = true; fromEvent(e); });
    /* one full auto-sweep the first time the slider enters the viewport —
       50 → 20 → 80 → 50 — so visitors see that it drags; any touch cancels */
    if (!reduced && "IntersectionObserver" in window) {
      var seen = false;
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !seen) {
          seen = true;
          io.disconnect();
          var pts = [[0, 50], [0.25, 20], [0.62, 80], [1, 50]];
          var DUR = 2600, t0 = null;
          function easeIO(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
          function sweep(ts) {
            if (userTouched) return;
            if (!t0) t0 = ts;
            var t = (ts - t0) / DUR;
            if (t >= 1) { setPos(50); return; }
            for (var i = 0; i < pts.length - 1; i++) {
              if (t >= pts[i][0] && t <= pts[i + 1][0]) {
                var lt = (t - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
                setPos(pts[i][1] + (pts[i + 1][1] - pts[i][1]) * easeIO(lt));
                break;
              }
            }
            requestAnimationFrame(sweep);
          }
          requestAnimationFrame(sweep);
        }
      }, { threshold: 0.4 });
      io.observe(ba);
    }
  });

  /* ---------- GSAP motion ---------- */
  if (!reduced && window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    /* hero entrance — bigger travel + settle */
    gsap.from(".hero .rv-hero", { y: 60, scale: 0.95, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.1, delay: 0.1 });
    gsap.to(".hero-bg", { scale: 1.14, duration: 14, ease: "none", repeat: -1, yoyo: true });
    if (window.ScrollTrigger) {
      /* section blocks: long travel, scale from .93, slight rotate-settle,
         and siblings cascade with an index-based stagger */
      gsap.utils.toArray("section .rv").forEach(function (el) {
        var sibs = Array.prototype.filter.call(el.parentNode.children, function (c) {
          return c.classList && c.classList.contains("rv");
        });
        var idx = Math.max(0, sibs.indexOf(el));
        gsap.from(el, {
          y: 64, scale: 0.93, rotation: idx % 2 ? 1.1 : -1.1, opacity: 0,
          duration: 1.05, ease: "back.out(1.35)", delay: Math.min(idx, 5) * 0.09,
          scrollTrigger: { trigger: el, start: "top 90%" }
        });
      });
      gsap.utils.toArray(".ba").forEach(function (el) {
        gsap.from(el, {
          y: 30, scale: 0.94, opacity: 0, duration: 1.0, ease: "back.out(1.2)",
          scrollTrigger: { trigger: el, start: "top 85%" }
        });
      });
    }
    /* FAQ: springy reveal when an item opens (clip + settle, no layout anim) */
    document.querySelectorAll("details.faq").forEach(function (d) {
      var p = d.querySelector("p");
      if (!p) return;
      d.addEventListener("toggle", function () {
        if (!d.open) return;
        gsap.fromTo(p,
          { y: -10, opacity: 0, clipPath: "inset(0 0 100% 0)" },
          { y: 0, opacity: 1, clipPath: "inset(0 0 0% 0)", duration: 0.55, ease: "back.out(1.8)" });
      });
    });
  }

  /* ---------- Contact form ---------- */
  var FORM_ENDPOINT = "https://api.web3forms.com/submit";
  var f = document.querySelector(".studio-form");
  if (f) {
    var s = f.querySelector(".form-status");
    var L = document.documentElement.lang === "fr"
      ? { sending: "Envoi en cours…", ok: "Merci — votre message est en route. Si vous n'avez pas de réponse d'ici un jour, appelez ou textez le 613-889-2215.", err: "L'envoi n'a pas fonctionné — appelez ou textez le 613-889-2215, ou réessayez." }
      : { sending: "Sending…", ok: "Thanks — your message is on its way. If you have not heard back within a day, please call or text 613-889-2215.", err: "That did not go through — please call or text 613-889-2215, or try again." };
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var b = f.querySelector('button[type="submit"]');
      b.disabled = true; s.hidden = false; s.textContent = L.sending;
      var data = {};
      new FormData(f).forEach(function (v, k) { if (k.charAt(0) !== "_") data[k] = v; });
      fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw 0; f.reset(); s.textContent = L.ok; })
        .catch(function () { b.disabled = false; s.textContent = L.err; });
    });
  }
})();
