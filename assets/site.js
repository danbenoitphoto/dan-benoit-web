/* Dan Benoit Web — v2 interactions: before/after sliders, GSAP motion, form.
   Everything degrades gracefully: no GSAP or reduced motion = fully visible, static page. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Before / After sliders ---------- */
  document.querySelectorAll("[data-ba]").forEach(function (ba) {
    var range = ba.querySelector("input[type=range]");
    function setPos(pct) {
      pct = Math.max(0, Math.min(100, pct));
      ba.style.setProperty("--pos", pct + "%");
      if (range) range.value = pct;
    }
    if (range) range.addEventListener("input", function () { setPos(parseFloat(range.value)); });
    function fromEvent(e) {
      var r = ba.getBoundingClientRect();
      var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
      setPos(((x - r.left) / r.width) * 100);
    }
    ba.addEventListener("pointerdown", function (e) { fromEvent(e); });
    /* gentle intro wiggle once visible, so visitors notice it drags */
    if (!reduced && "IntersectionObserver" in window) {
      var seen = false;
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting && !seen) {
          seen = true;
          var t0 = null;
          function wiggle(ts) {
            if (!t0) t0 = ts;
            var t = (ts - t0) / 1400;
            if (t >= 1) { setPos(50); return; }
            setPos(50 + Math.sin(t * Math.PI * 2) * 14 * (1 - t));
            requestAnimationFrame(wiggle);
          }
          requestAnimationFrame(wiggle);
          io.disconnect();
        }
      }, { threshold: 0.45 });
      io.observe(ba);
    }
  });

  /* ---------- GSAP motion ---------- */
  if (!reduced && window.gsap) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    /* hero entrance */
    gsap.from(".hero .rv-hero", { y: 36, opacity: 0, duration: 1.0, ease: "power3.out", stagger: 0.12, delay: 0.1 });
    gsap.to(".hero-bg", { scale: 1.14, duration: 14, ease: "none", repeat: -1, yoyo: true });
    if (window.ScrollTrigger) {
      gsap.utils.toArray("section .rv").forEach(function (el) {
        gsap.from(el, {
          y: 34, opacity: 0, duration: 0.85, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        });
      });
      gsap.utils.toArray(".ba").forEach(function (el) {
        gsap.from(el, {
          scale: 0.965, opacity: 0, duration: 0.9, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%" }
        });
      });
    }
  }

  /* ---------- Contact form ---------- */
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/danbeaner@gmail.com"; /* swapped for Web3Forms endpoint when the key is ready */
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
      new FormData(f).forEach(function (v, k) { data[k] = v; });
      fetch(FORM_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw 0; f.reset(); s.textContent = L.ok; })
        .catch(function () { b.disabled = false; s.textContent = L.err; });
    });
  }
})();
