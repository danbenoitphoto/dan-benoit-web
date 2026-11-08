/* Dan Benoit Web — ANIMATION PREVIEW v2 (reel-style motion layer, intensified).
   Reel techniques, pushed denser and bigger: an always-alive hero (float loop,
   breathing glow, drifting chips), masked line-by-line headline reveals with
   overshoot, multi-layer parallax, curtain reveals + strong slow zooms with
   inner-image parallax, a giant outlined word drifting + scaling, a scroll-drawn
   process assembly with pulsing step dots, a slice reveal, magnetic buttons and
   a subtle scroll-velocity skew. Transform/opacity/clip-path only.
   Safety: if GSAP is missing or the visitor prefers reduced motion, this file
   does nothing and the page stays fully visible and static. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !window.gsap) return;
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  var ST = window.ScrollTrigger;
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var coarsePointer = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  document.documentElement.classList.add("anim");

  /* ============ masked line splitting ============
     Words are wrapped, grouped by rendered line, and each line gets an
     overflow-hidden mask with a sliding inner block. Runs before any
     hiding happens, so a failure here can never hide a heading. */
  function splitLines(el) {
    var words = [];
    (function collect(node, cls) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { words.push({ t: " " }); return; }
            var s = document.createElement("span");
            s.className = cls; s.textContent = part; s.style.whiteSpace = "nowrap";
            words.push({ el: s });
          });
        } else if (n.nodeType === 1) {
          collect(n, (cls ? cls + " " : "") + n.className);
        }
      });
    })(el, "");
    el.innerHTML = "";
    words.forEach(function (w) {
      el.appendChild(w.el ? w.el : document.createTextNode(" "));
    });
    /* group word spans by offsetTop */
    var lines = [], cur = null, curTop = null;
    words.forEach(function (w) {
      if (!w.el) return;
      var t = w.el.offsetTop;
      if (curTop === null || Math.abs(t - curTop) > 4) { cur = []; lines.push(cur); curTop = t; }
      cur.push(w.el);
    });
    el.innerHTML = "";
    var inners = [];
    lines.forEach(function (lineWords) {
      var lm = document.createElement("span"); lm.className = "lm-line";
      var inner = document.createElement("span"); inner.className = "lm-inner";
      lineWords.forEach(function (wEl, i) {
        if (i > 0) inner.appendChild(document.createTextNode(" "));
        /* unwrap the measuring span, keep its classes on a plain inline span */
        var plain = document.createElement("span");
        plain.className = wEl.className; plain.textContent = wEl.textContent;
        inner.appendChild(plain);
      });
      lm.appendChild(inner); el.appendChild(lm); inners.push(inner);
    });
    return inners;
  }

  function lineReveal(el, opts) {
    opts = opts || {};
    var inners;
    try { inners = splitLines(el); } catch (e) { return; }
    if (!inners || !inners.length) return;
    var vars = {
      yPercent: 125, duration: 1.05, ease: "back.out(1.5)",
      stagger: 0.13, delay: opts.delay || 0
    };
    if (opts.trigger) vars.scrollTrigger = { trigger: opts.trigger, start: "top 88%", once: true };
    gsap.from(inners, vars);
  }

  /* ============ 1 · HERO — always alive ============ */
  var h1 = document.querySelector(".hero h1");
  if (h1) lineReveal(h1, { delay: 0.2 });

  var heroSec = document.querySelector(".hero");
  var heroImg = document.querySelector(".hero-visual img");
  var hvFloat = document.querySelector(".hv-float");
  var hvTilt = document.querySelector(".hv-tilt");

  /* breathing gold glow (injected layer, pulses on top of the base gradients) */
  if (heroSec) {
    var pulse = document.createElement("div");
    pulse.className = "hero-pulse"; pulse.setAttribute("aria-hidden", "true");
    heroSec.insertBefore(pulse, heroSec.firstChild);
    gsap.fromTo(pulse, { scale: 1, opacity: 0.55 }, {
      scale: 1.22, opacity: 1, transformOrigin: "80% 26%",
      duration: 3.4, yoyo: true, repeat: -1, ease: "sine.inOut"
    });
  }

  if (heroImg && ST) {
    /* stronger scroll parallax on the devices visual */
    gsap.to(heroImg, {
      y: 72, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.3 }
    });
    /* gold glow layers drift as the hero scrolls away (background layers are
       clipped to the hero box, so this can never cause page overflow) */
    gsap.fromTo(".hero",
      { backgroundPosition: "0px 0px, 0px 0px" },
      { backgroundPosition: "110px 52px, -64px 28px", ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.3 } });
  }

  /* continuous float loop on the devices (independent wrapper, so it never
     fights the scroll parallax on the img or the mouse tilt wrapper) */
  if (hvFloat) {
    gsap.to(hvFloat, { y: -14, rotation: 0.7, duration: 3.0, yoyo: true, repeat: -1, ease: "sine.inOut" });
    gsap.to(hvFloat, { x: 6, duration: 4.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  /* mouse parallax + tilt on its own wrapper, real pointers only */
  if (hvTilt && finePointer && heroSec) {
    gsap.set(hvTilt, { transformPerspective: 1000 });
    var tx = gsap.quickTo(hvTilt, "x", { duration: 0.7, ease: "power3.out" });
    var tRx = gsap.quickTo(hvTilt, "rotationX", { duration: 0.7, ease: "power3.out" });
    var tRy = gsap.quickTo(hvTilt, "rotationY", { duration: 0.7, ease: "power3.out" });
    var tSc = gsap.quickTo(hvTilt, "scale", { duration: 0.7, ease: "power3.out" });
    heroSec.addEventListener("mousemove", function (e) {
      var r = heroSec.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      tx(dx * 16); tRy(dx * 5); tRx(-dy * 4); tSc(1.02);
    });
    heroSec.addEventListener("mouseleave", function () { tx(0); tRx(0); tRy(0); tSc(1); });
  }

  /* floating accent chips: pop in, then drift on offset loops forever */
  document.querySelectorAll(".hero-chip").forEach(function (chip, i) {
    gsap.from(chip, {
      scale: 0.5, opacity: 0, duration: 0.8, ease: "back.out(2.2)", delay: 0.9 + i * 0.16
    });
    gsap.to(chip, {
      y: 10 + i * 3, rotation: i % 2 ? 2.4 : -2.4,
      duration: 2.6 + i * 0.7, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.5
    });
    gsap.to(chip, {
      x: i % 2 ? -7 : 7, duration: 3.4 + i * 0.6,
      yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.35
    });
  });

  /* ============ 2 · SECTION HEADINGS ============ */
  if (ST) {
    document.querySelectorAll("main section h2").forEach(function (h) {
      if (h.closest(".callout")) return; /* the callout gets the slice reveal */
      lineReveal(h, { trigger: h });
    });
  }

  /* ============ 3 · MULTI-LAYER PARALLAX ============
     Injected glow layer drifts behind the content while the content grid
     drifts the other way — foreground/background at different rates. */
  if (ST) {
    ["#features", "#upgrades", "#contact"].forEach(function (sel) {
      var sec = document.querySelector(sel);
      if (!sec) return;
      var glow = document.createElement("div");
      glow.className = "px-glow"; glow.setAttribute("aria-hidden", "true");
      sec.insertBefore(glow, sec.firstChild);
      var trig = { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.5 };
      gsap.fromTo(glow, { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: trig });
      gsap.fromTo(glow,
        { backgroundPosition: "0px 0px, 0px 0px" },
        { backgroundPosition: "60px 30px, -50px -24px", ease: "none", scrollTrigger: trig });
      var grid = sec.querySelector(".grid, .contact-grid");
      if (grid) gsap.fromTo(grid, { y: 14 }, { y: -14, ease: "none", scrollTrigger: trig });
    });
  }

  /* ============ 4 · IMAGERY: curtain reveal + strong zoom + inner parallax ============ */
  if (ST) {
    document.querySelectorAll(".sample img").forEach(function (img) {
      var tl = gsap.timeline({
        scrollTrigger: { trigger: img, start: "top 96%", end: "bottom 12%", scrub: 0.3 }
      });
      tl.fromTo(img,
        { clipPath: "inset(0 0 100% 0)", scale: 1.24 },
        { clipPath: "inset(0 0 0% 0)", scale: 1.08, duration: 0.3, ease: "power2.out" })
        .to(img, { scale: 1.16, duration: 0.7, ease: "none" });
      /* the photo itself slides inside its frame while scrolling */
      gsap.fromTo(img, { yPercent: -2.2 }, {
        yPercent: 2.2, ease: "none",
        scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: 0.4 }
      });
    });
    /* slider imagery: strong zoom + inner parallax (living-room panels) */
    document.querySelectorAll(".ba img.fill").forEach(function (img) {
      gsap.fromTo(img, { scale: 1.14, yPercent: -3.5 }, {
        scale: 1.14, yPercent: 3.5, ease: "none",
        scrollTrigger: { trigger: img.closest(".ba"), start: "top bottom", end: "bottom top", scrub: 0.4 }
      });
    });
    /* mock-site imagery inside the template slider: zoom only */
    document.querySelectorAll(".mock-new .new-hero img").forEach(function (img) {
      gsap.fromTo(img, { scale: 1 }, {
        scale: 1.1, ease: "none",
        scrollTrigger: { trigger: img.closest(".ba"), start: "top bottom", end: "bottom top", scrub: 0.4 }
      });
    });
  }

  /* ============ 5 · GIANT OUTLINE WORD — drifts farther + scales ============ */
  var ow = document.querySelector(".outline-word");
  if (ow && ST) {
    gsap.fromTo(ow, { xPercent: 6, scale: 0.94 }, {
      xPercent: -22, scale: 1.06, ease: "none",
      scrollTrigger: { trigger: "#samples", start: "top bottom", end: "bottom top", scrub: 0.3 }
    });
  }

  /* ============ 6 · PROCESS ASSEMBLY — bigger entrances + pulsing dots ============ */
  var stepsBox = document.querySelector(".steps");
  if (stepsBox && ST) {
    var steps = stepsBox.querySelectorAll(".step");
    var tlP = gsap.timeline({
      scrollTrigger: { trigger: stepsBox, start: "top 88%", end: "bottom 55%", scrub: 0.4 }
    });
    var svg = stepsBox.querySelector(".process-line");
    if (svg) {
      /* The line draws itself via a clip wipe on the SVG, scrubbed by the
         same timeline. (stroke-dashoffset was tried three ways in v1:
         on this non-uniformly stretched SVG, Chromium dashes in device
         space and renders segments instead of a draw.) */
      tlP.fromTo(svg,
        { clipPath: "inset(-6px 100% -6px 0)" },
        { clipPath: "inset(-6px 0% -6px 0)", duration: 4, ease: "none" }, 0);
    }
    steps.forEach(function (step, i) {
      tlP.fromTo(step,
        { y: 84, scale: 0.88, rotation: i % 2 ? 1.6 : -1.6, opacity: 0 },
        { y: 0, scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.6)" },
        0.35 + i * 1.0);
    });
    /* each step's number dot pulses once as the line reaches it */
    var total = tlP.duration();
    var pulsed = [];
    tlP.eventCallback("onUpdate", function () {
      var p = tlP.progress();
      steps.forEach(function (step, i) {
        var th = (0.35 + i * 1.0 + 0.45) / total;
        var num = step.querySelector(".num");
        if (!num) return;
        if (p >= th && !pulsed[i]) {
          pulsed[i] = true;
          num.classList.remove("pulse"); void num.offsetWidth; num.classList.add("pulse");
        } else if (p < th - 0.06) { pulsed[i] = false; }
      });
    });
  }

  /* ============ 7 · SLICE REVEAL (callout heading) — wider split ============ */
  var callH = document.querySelector(".callout h2");
  if (callH && ST) {
    var original = callH.innerHTML;
    callH.setAttribute("aria-label", callH.textContent.replace(/\s+/g, " ").trim());
    callH.innerHTML =
      '<span class="slice-wrap" aria-hidden="true">' +
      '<span class="slice-ghost">' + original + "</span>" +
      '<span class="slice-half slice-top">' + original + "</span>" +
      '<span class="slice-half slice-bot">' + original + "</span></span>";
    var halves = callH.querySelectorAll(".slice-half");
    gsap.from(halves[0], {
      x: -72, opacity: 0, duration: 1.1, ease: "back.out(1.2)",
      scrollTrigger: { trigger: callH, start: "top 86%", once: true }
    });
    gsap.from(halves[1], {
      x: 72, opacity: 0, duration: 1.1, ease: "back.out(1.2)",
      scrollTrigger: { trigger: callH, start: "top 86%", once: true }
    });
  }

  /* ============ 8 · SHELF CARD TILT — stronger, with lift ============ */
  if (finePointer && ST) {
    document.querySelectorAll(".sample").forEach(function (card) {
      gsap.set(card, { transformPerspective: 900 });
      var rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      var ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
      var cy = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3.out" });
      var cs = gsap.quickTo(card, "scale", { duration: 0.5, ease: "power3.out" });
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - r.left) / r.width - 0.5;
        var dy = (e.clientY - r.top) / r.height - 0.5;
        ry(dx * 11); rx(-dy * 11); cy(-6); cs(1.02); /* ≈5.5deg max per axis */
      });
      card.addEventListener("mouseleave", function () { rx(0); ry(0); cy(0); cs(1); });
    });
  }

  /* ============ 9 · MAGNETIC BUTTONS (desktop pointers; shine is CSS) ============ */
  if (finePointer) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      if (btn.closest(".callbar")) return; /* the fixed call bar stays put */
      var bx = gsap.quickTo(btn, "x", { duration: 0.4, ease: "power3.out" });
      var by = gsap.quickTo(btn, "y", { duration: 0.4, ease: "power3.out" });
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        bx(((e.clientX - r.left) / r.width - 0.5) * 10);
        by(((e.clientY - r.top) / r.height - 0.5) * 7);
      });
      btn.addEventListener("mouseleave", function () { bx(0); by(0); });
    });
  }

  /* ============ 10 · SCROLL-VELOCITY SKEW (desktop feel; off on touch) ============ */
  if (ST && !coarsePointer) {
    var mainEl = document.querySelector("main");
    if (mainEl) {
      gsap.set(mainEl, { transformOrigin: "50% 0%" });
      var skewTo = gsap.quickTo(mainEl, "skewY", { duration: 0.5, ease: "power3.out" });
      var proxy = { v: 0 };
      ScrollTrigger.create({
        onUpdate: function (self) {
          var v = gsap.utils.clamp(-1.2, 1.2, self.getVelocity() / -300);
          if (Math.abs(v) > Math.abs(proxy.v)) {
            proxy.v = v;
            gsap.to(proxy, {
              v: 0, duration: 0.65, ease: "power3.out", overwrite: true,
              onUpdate: function () { skewTo(proxy.v); }
            });
          }
        }
      });
    }
  }
})();
