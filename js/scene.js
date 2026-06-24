/* =====================================================================
   Carleton-NTN Lab — Hero scene (daytime / light sky)
   A live cross-section of the integrated non-terrestrial network:
   ground cellular towers -> drones (aerial) -> HAPS (stratosphere)
   -> LEO satellites (space), linked together with data packets
   climbing from Earth toward orbit. Carleton red + steel blue on a
   bright sky. Pure canvas 2D. Honours prefers-reduced-motion.
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("scene");
  if (!canvas) return;
  var ctx = canvas.getContext("2d", { alpha: true });
  var hero = document.querySelector(".hero");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var W = 0, H = 0, DPR = 1;
  var clouds = [], leos = [], haps = [], drones = [], towers = [], isl = [], downs = [], packets = [];
  var geo = null;
  var scrollProg = 0, running = true, visible = true, startT = 0;

  var C = {
    red: "#e91c24",
    redSoft: "rgba(233,28,36,0.55)",
    steel: "#4f7bae",
    steelSoft: "rgba(79,123,174,0.45)",
    body: "#34404f",
    bodyLight: "#e9eef5",
    cloud: "rgba(255,255,255,0.9)"
  };

  // User-supplied SVG sprites, mixed in with the code-drawn satellites/HAPS
  var satImg = new Image(), hapsImg = new Image();
  var satReady = false, hapsReady = false;
  var SAT_AR = 14.463275 / 19.317129;   // height / width
  var HAPS_AR = 10.238065 / 21.91419;
  satImg.onload = function () { satReady = true; if (reduceMotion) staticFrame(); };
  hapsImg.onload = function () { hapsReady = true; if (reduceMotion) staticFrame(); };
  satImg.src = "assets/satellite.svg";
  hapsImg.src = "assets/haps.svg";

  function rand(a, b) { return a + Math.random() * (b - a); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ----------------------------- build ----------------------------- */
  function build() {
    var rect = canvas.getBoundingClientRect();
    W = Math.max(320, rect.width);
    H = Math.max(480, rect.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    var bandSpace = 0.30, bandStrato = 0.50, bandAir = 0.66, bandGround = 0.90;

    clouds = [];
    var nClouds = W < 700 ? 4 : 6;
    for (var c = 0; c < nClouds; c++) {
      clouds.push({
        x: Math.random() * W,
        y: H * rand(0.30, 0.62),
        s: rand(40, 90),
        sp: rand(3, 8),
        a: rand(0.25, 0.6)
      });
    }

    leos = [];
    var nLeo = W < 700 ? 4 : 6;
    for (var s = 0; s < nLeo; s++) {
      leos.push({ x: (W / nLeo) * s + rand(-30, 30), y: H * (bandSpace * rand(0.35, 1.0)), size: rand(8, 12), vx: rand(11, 20), phase: rand(0, Math.PI * 2), sprite: (s % 2 === 0) });
    }
    leos.sort(function (a, b) { return a.x - b.x; });

    geo = { x: W * 0.85, y: H * 0.11, size: 13, t: 0 };

    haps = [];
    var nHaps = W < 700 ? 2 : 3;
    for (var h = 0; h < nHaps; h++) {
      haps.push({ baseX: (W / (nHaps + 1)) * (h + 1) + rand(-50, 50), x: 0, y: H * bandStrato + rand(-18, 18), size: rand(26, 34), vx: rand(5, 9) * (h % 2 ? -1 : 1), bob: rand(0, Math.PI * 2), sprite: (h % 2 === 0) });
    }

    drones = [];
    var nDr = W < 700 ? 3 : 4;
    for (var d = 0; d < nDr; d++) {
      drones.push({ baseX: (W / (nDr + 1)) * (d + 1) + rand(-40, 40), x: 0, y: H * bandAir + rand(-14, 14), size: rand(9, 13), sway: rand(0, Math.PI * 2), spin: rand(0, Math.PI * 2) });
    }

    towers = [];
    var nTw = W < 700 ? 3 : 4;
    for (var t = 0; t < nTw; t++) {
      towers.push({ x: (W / (nTw + 1)) * (t + 1) + rand(-30, 30), y: H * bandGround, size: rand(34, 46), ring: rand(0, 1) });
    }

    isl = [];
    for (var k = 0; k < leos.length - 1; k++) isl.push({ t: Math.random(), sp: rand(0.18, 0.32) });

    downs = [];
    haps.forEach(function () { downs.push({ t: Math.random(), sp: rand(0.25, 0.4) }); });

    packets = [];
    var nPk = W < 700 ? 5 : 8;
    for (var p = 0; p < nPk; p++) packets.push(newPacket());
  }

  function newPacket() {
    return {
      tw: towers[(Math.random() * towers.length) | 0],
      dr: drones[(Math.random() * drones.length) | 0],
      hp: haps[(Math.random() * haps.length) | 0],
      seg: 0, t: Math.random() * 0.4, sp: rand(0.22, 0.4)
    };
  }

  /* ---------------------------- update ----------------------------- */
  function nearest(list, x, y) {
    var best = null, bd = Infinity;
    for (var i = 0; i < list.length; i++) {
      var dx = list[i].x - x, dy = list[i].y - y, dd = dx * dx + dy * dy;
      if (dd < bd) { bd = dd; best = list[i]; }
    }
    return best;
  }

  function update(dt, time) {
    clouds.forEach(function (cl) { cl.x += cl.sp * dt; if (cl.x - cl.s * 2 > W) cl.x = -cl.s * 2; });
    leos.forEach(function (l) { l.x += l.vx * dt; if (l.x > W + 40) l.x = -40; l.phase += dt; });
    geo.t += dt;
    haps.forEach(function (hp) {
      hp.baseX += hp.vx * dt;
      if (hp.baseX > W + 80) hp.baseX = -80;
      if (hp.baseX < -80) hp.baseX = W + 80;
      hp.x = hp.baseX;
      hp.y += Math.sin(time * 0.6 + hp.bob) * 0.18;
    });
    drones.forEach(function (dr) {
      dr.sway += dt; dr.spin += dt * 22;
      dr.x = dr.baseX + Math.sin(dr.sway * 0.7) * 16;
      dr.y += Math.sin(time * 1.4 + dr.sway) * 0.22;
    });
    isl.forEach(function (p) { p.t += p.sp * dt; if (p.t > 1) p.t -= 1; });
    downs.forEach(function (p) { p.t += p.sp * dt; if (p.t > 1) p.t -= 1; });
    packets.forEach(function (pk) {
      pk.t += pk.sp * dt;
      if (pk.t >= 1) { pk.t = 0; pk.seg++; if (pk.seg > 1) { var np = newPacket(); pk.tw = np.tw; pk.dr = np.dr; pk.hp = np.hp; pk.seg = 0; pk.sp = np.sp; } }
    });
    towers.forEach(function (tw) { tw.ring += dt * 0.32; });
  }

  /* ----------------------------- draw ------------------------------ */
  function clear() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0.00, "#3d72b0");
    g.addColorStop(0.26, "#5d92cb");
    g.addColorStop(0.52, "#8fb9e0");
    g.addColorStop(0.74, "#c2dcf2");
    g.addColorStop(0.90, "#e2eefa");
    g.addColorStop(1.00, "#f4f8fd");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // soft sun glow, upper-right
    var sx = W * 0.82, sy = H * 0.16;
    var sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, H * 0.5);
    sg.addColorStop(0, "rgba(255,250,235,0.85)");
    sg.addColorStop(0.25, "rgba(255,245,220,0.30)");
    sg.addColorStop(1, "rgba(255,245,220,0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H * 0.7);
  }

  function drawClouds() {
    clouds.forEach(function (cl) {
      var y = cl.y - scrollProg * 16;
      var puffs = [[0, 0, 1], [cl.s * 0.7, 6, 0.8], [-cl.s * 0.7, 8, 0.78], [cl.s * 0.3, -6, 0.7], [-cl.s * 0.35, -4, 0.7]];
      puffs.forEach(function (p) {
        var r = cl.s * p[2] * 0.6;
        var rg = ctx.createRadialGradient(cl.x + p[0], y + p[1], 1, cl.x + p[0], y + p[1], r);
        rg.addColorStop(0, "rgba(255,255,255," + cl.a + ")");
        rg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cl.x + p[0], y + p[1], r, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  function dot(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function link(x1, y1, x2, y2, color, w, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = w || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function drawSatellite(x, y, s, accent) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(79,123,174,0.55)";
    ctx.strokeStyle = "rgba(52,64,79,0.65)";
    ctx.lineWidth = 0.8;
    ctx.fillRect(-s * 2.0, -s * 0.32, s * 1.3, s * 0.64);
    ctx.strokeRect(-s * 2.0, -s * 0.32, s * 1.3, s * 0.64);
    ctx.fillRect(s * 0.7, -s * 0.32, s * 1.3, s * 0.64);
    ctx.strokeRect(s * 0.7, -s * 0.32, s * 1.3, s * 0.64);
    ctx.fillStyle = C.body;
    ctx.fillRect(-s * 0.5, -s * 0.42, s, s * 0.84);
    ctx.fillStyle = accent || C.red;
    ctx.fillRect(-s * 0.5, -s * 0.1, s, s * 0.18);
    ctx.restore();
  }

  function drawGeo(x, y, s) {
    drawSatellite(x, y, s, C.red);
    ctx.save();
    var bg = ctx.createLinearGradient(x, y, W * 0.5, H * 0.9);
    bg.addColorStop(0, "rgba(79,123,174,0.16)");
    bg.addColorStop(1, "rgba(79,123,174,0)");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(x, y + s);
    ctx.lineTo(W * 0.31, H * 0.92);
    ctx.lineTo(W * 0.66, H * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHaps(hp) {
    var x = hp.x, y = hp.y, s = hp.size;
    // coverage cone to ground
    ctx.save();
    var cg = ctx.createLinearGradient(x, y, x, H * 0.92);
    cg.addColorStop(0, "rgba(79,123,174,0.18)");
    cg.addColorStop(1, "rgba(79,123,174,0)");
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.2);
    ctx.lineTo(x - s * 2.4, H * 0.92);
    ctx.lineTo(x + s * 2.4, H * 0.92);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // body: user SVG sprite when available, otherwise the code-drawn platform
    if (hp.sprite && hapsReady) {
      var w = s * 3.0, h = w * HAPS_AR;
      ctx.drawImage(hapsImg, x - w / 2, y - h / 2, w, h);
      dot(x, y, 1.5, C.red);
      return;
    }
    // body (slim solar-wing platform)
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = C.bodyLight;
    ctx.strokeStyle = "rgba(52,64,79,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(0, -s * 0.34, s, 0);
    ctx.quadraticCurveTo(0, s * 0.18, -s, 0);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(79,123,174,0.6)";
    ctx.beginPath(); ctx.moveTo(-s * 0.8, -s * 0.04); ctx.lineTo(s * 0.8, -s * 0.04); ctx.stroke();
    ctx.fillStyle = "#9aa6b5";
    ctx.fillRect(-s * 0.55, 0, s * 0.16, s * 0.2);
    ctx.fillRect(s * 0.4, 0, s * 0.16, s * 0.2);
    ctx.fillStyle = C.red;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.1, -s * 0.3); ctx.lineTo(-s * 0.04, 0); ctx.fill();
    ctx.restore();
    dot(x, y, 1.5, C.red);
  }

  function drawDrone(dr) {
    var x = dr.x, y = dr.y, s = dr.size;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(52,64,79,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.5); ctx.lineTo(s, s * 0.5);
    ctx.moveTo(s, -s * 0.5); ctx.lineTo(-s, s * 0.5);
    ctx.stroke();
    var rs = s * 0.5 * (0.8 + 0.2 * Math.sin(dr.spin));
    ctx.strokeStyle = "rgba(79,123,174,0.6)";
    [[-s, -s * 0.5], [s, -s * 0.5], [s, s * 0.5], [-s, s * 0.5]].forEach(function (p) {
      ctx.beginPath(); ctx.ellipse(p[0], p[1], rs, rs * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.fillStyle = C.body;
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.42, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    dot(x, y + 1, 1.1, C.red);
  }

  function drawTower(tw) {
    var x = tw.x, y = tw.y, s = tw.size;
    for (var r = 0; r < 3; r++) {
      var prog = (tw.ring + r / 3) % 1;
      var rad = prog * s * 1.6;
      ctx.globalAlpha = (1 - prog) * 0.45;
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y - s, rad, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(52,64,79,0.85)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - s * 0.16, y);
    ctx.lineTo(x, y - s);
    ctx.lineTo(x + s * 0.16, y);
    ctx.stroke();
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "rgba(52,64,79,0.5)";
    for (var b = 1; b <= 4; b++) {
      var ty = y - (s * b / 5);
      var hw = s * 0.16 * (1 - b / 6);
      ctx.beginPath(); ctx.moveTo(x - hw, ty); ctx.lineTo(x + hw, ty); ctx.stroke();
    }
    dot(x, y - s, 2, C.red);
  }

  function drawSkyline() {
    var base = H * 0.92, bw = 26;
    ctx.fillStyle = "rgba(120,135,155,0.30)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, base);
    for (var x = 0; x <= W; x += bw) {
      var hh = (Math.sin(x * 0.21) * 0.5 + 0.5) * 22 + (Math.sin(x * 0.07 + 1.3) * 0.5 + 0.5) * 30 + 8;
      ctx.lineTo(x, base - hh);
      ctx.lineTo(x + bw, base - hh);
    }
    ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.closePath();
    ctx.fill();
  }

  function draw() {
    clear();

    var pSpace = -scrollProg * 28;
    var pStrato = scrollProg * 16;
    var pAir = scrollProg * 34;
    var pGround = scrollProg * 52;

    drawClouds();

    // SPACE: ISL links + LEO + GEO
    ctx.save();
    ctx.translate(0, pSpace);
    for (var i = 0; i < leos.length - 1; i++) {
      var a = leos[i], b = leos[i + 1];
      if (Math.abs(b.x - a.x) < W * 0.34) {
        link(a.x, a.y, b.x, b.y, "rgba(233,28,36,0.32)", 1.1);
        var pp = isl[i];
        dot(lerp(a.x, b.x, pp.t), lerp(a.y, b.y, pp.t), 2, C.red);
      }
    }
    drawGeo(geo.x + Math.sin(geo.t * 0.2) * 4, geo.y, geo.size);
    leos.forEach(function (l) {
      if (l.sprite && satReady) {
        var w = l.size * 4.0, h = w * SAT_AR;
        ctx.drawImage(satImg, l.x - w / 2, l.y - h / 2, w, h);
      } else {
        drawSatellite(l.x, l.y, l.size, C.red);
      }
    });
    ctx.restore();

    // LEO -> HAPS faint uplinks
    haps.forEach(function (hp) {
      var hx = hp.x, hy = hp.y + pStrato, near = null, bd = Infinity;
      for (var i = 0; i < leos.length; i++) { var dx = leos[i].x - hx; if (dx * dx < bd) { bd = dx * dx; near = leos[i]; } }
      if (near && Math.abs(near.x - hx) < W * 0.4) link(hx, hy, near.x, near.y + pSpace, "rgba(79,123,174,0.28)", 1, [3, 6]);
    });

    // STRATOSPHERE: HAPS + cones + downlink pulses
    ctx.save();
    ctx.translate(0, pStrato);
    haps.forEach(function (hp, idx) {
      drawHaps(hp);
      var dpz = downs[idx];
      if (dpz) dot(hp.x + (dpz.t - 0.5) * hp.size * 3.2, lerp(hp.y, H * 0.9, dpz.t), 1.7, C.steel);
    });
    ctx.restore();

    // AERIAL: drones + uplinks
    ctx.save();
    ctx.translate(0, pAir);
    drones.forEach(function (dr) {
      var hp = nearest(haps.map(function (h) { return { x: h.x, y: h.y + (pStrato - pAir) }; }), dr.x, dr.y);
      if (hp) link(dr.x, dr.y, hp.x, hp.y, "rgba(79,123,174,0.30)", 1, [2, 5]);
      drawDrone(dr);
    });
    ctx.restore();

    // GROUND: skyline + towers + tower->drone links
    drawSkyline();
    ctx.save();
    ctx.translate(0, pGround);
    towers.forEach(function (tw) {
      var dr = nearest(drones.map(function (d) { return { x: d.x, y: d.y + (pAir - pGround) }; }), tw.x, tw.y - tw.size);
      if (dr) link(tw.x, tw.y - tw.size, dr.x, dr.y, "rgba(79,123,174,0.28)", 1, [2, 5]);
      drawTower(tw);
    });
    ctx.restore();

    // PACKETS climbing ground -> drone -> haps
    packets.forEach(function (pk) {
      var p0, p1;
      if (pk.seg === 0) { p0 = { x: pk.tw.x, y: pk.tw.y - pk.tw.size + pGround }; p1 = { x: pk.dr.x, y: pk.dr.y + pAir }; }
      else { p0 = { x: pk.dr.x, y: pk.dr.y + pAir }; p1 = { x: pk.hp.x, y: pk.hp.y + pStrato }; }
      var x = lerp(p0.x, p1.x, pk.t), y = lerp(p0.y, p1.y, pk.t);
      var tx = lerp(p0.x, p1.x, Math.max(0, pk.t - 0.08)), ty = lerp(p0.y, p1.y, Math.max(0, pk.t - 0.08));
      link(tx, ty, x, y, "rgba(233,28,36,0.55)", 1.8);
      dot(x, y, 2.2, C.red);
    });
  }

  /* ----------------------------- loop ------------------------------ */
  var last = 0;
  function frame(now) {
    if (!running) return;
    if (!startT) startT = now;
    var dt = Math.min(0.05, (now - last) / 1000) || 0.016;
    last = now;
    if (visible) { update(dt, now / 1000); draw(); }
    requestAnimationFrame(frame);
  }

  function staticFrame() {
    startT = performance.now();
    for (var i = 0; i < 30; i++) update(0.05, i * 0.05);
    draw();
  }

  function onScroll() {
    if (!hero) return;
    var h = hero.offsetHeight || H;
    scrollProg = Math.max(0, Math.min(1, window.scrollY / h));
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { build(); if (reduceMotion) staticFrame(); }, 160);
  }

  function init() {
    build();
    onScroll();
    if (reduceMotion) { staticFrame(); return; }
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; if (visible) last = performance.now(); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }
          else { running = false; }
        });
      }, { threshold: 0 });
      io.observe(hero || canvas);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
