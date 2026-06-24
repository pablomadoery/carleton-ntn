/* =====================================================================
   Carleton-NTN Lab — interactions
   nav state · mobile menu · scroll-spy · counters · reveal ·
   publication filters · altitude-layer tabs · telemetry rail
   ===================================================================== */
(function () {
  "use strict";
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ----------------------------- Nav ------------------------------- */
  var nav = $(".nav");
  var toggle = $(".nav__toggle");
  function onScrollNav() { if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24); }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  // close mobile menu on link click
  $$(".nav__links a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ------------------------- Scroll-spy ---------------------------- */
  var sections = $$("section[id]");
  var navLinks = $$(".nav__links a[href^='#']");
  var linkMap = {};
  navLinks.forEach(function (a) { linkMap[a.getAttribute("href").slice(1)] = a; });

  if ("IntersectionObserver" in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove("active"); });
          var id = e.target.id;
          if (linkMap[id]) linkMap[id].classList.add("active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* --------------------------- Reveal ------------------------------ */
  var reveals = $$(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var ro = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { ro.observe(el); });
  }

  /* -------------------------- Counters ----------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var dur = 1500;
    if (prefersReduced) { el.textContent = format(target, dec); return; }
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased, dec);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = format(target, dec);
    }
    requestAnimationFrame(step);
  }
  function format(n, dec) {
    if (dec > 0) return n.toFixed(dec);
    return Math.round(n).toLocaleString("en-US");
  }
  var counters = $$("[data-count]");
  if (counters.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      var co = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) { if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { co.observe(c); });
    }
  }

  /* ----------------------- Publication filters --------------------- */
  var filters = $$(".filter");
  var pubs = $$(".pub");
  filters.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filters.forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      var f = btn.getAttribute("data-filter");
      pubs.forEach(function (p) {
        var topics = p.getAttribute("data-topic") || "";
        var show = f === "all" || topics.indexOf(f) !== -1;
        p.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ----------------------- Altitude layer tabs --------------------- */
  var layerBtns = $$(".layerbtn");
  var layerData = window.__LAYERS__ || {};
  var panelEl = $("#layerpanel");
  function setLayer(key) {
    layerBtns.forEach(function (b) {
      var on = b.getAttribute("data-layer") === key;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    var d = layerData[key];
    if (d && panelEl) {
      panelEl.innerHTML =
        '<span class="pk">' + d.alt + '</span>' +
        '<h3>' + d.title + '</h3>' +
        '<p>' + d.body + '</p>' +
        '<div class="tags">' + d.tags.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join("") + '</div>';
    }
  }
  layerBtns.forEach(function (b) {
    b.addEventListener("click", function () { setLayer(b.getAttribute("data-layer")); });
    b.addEventListener("mouseenter", function () { setLayer(b.getAttribute("data-layer")); });
  });

  /* ------------------------- Telemetry rail ------------------------ */
  var dot = $(".rail__dot");
  var track = $(".rail__track");
  if (dot && track) {
    window.addEventListener("scroll", function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      dot.style.top = (p * 100) + "%";
    }, { passive: true });
  }

  /* ------------------------- Footer year --------------------------- */
  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();
})();
