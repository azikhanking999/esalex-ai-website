/* eSalex ai: page behaviour. No dependencies.
   - builds the activity feed and the rolling digits
   - lazy-loads the call-to-action video
   - draws the draggable Earth (WebGL), with the video as a fallback */
(function () {
  'use strict';

  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- pixel icons (7 x 7 grid, solid squares, one orange accent) ---------- */
  function bits(rows, ch) {
    var d = '';
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        if (rows[y].charAt(x) === ch) d += 'M' + x + ' ' + y + 'h1v1h-1z';
      }
    }
    return d;
  }
  function icon(rows) { return { ink: bits(rows, '#'), acc: bits(rows, 'o') }; }
  var ic = {
    tag: icon(['..###..', '.#####.', '.#####.', '.#####.', '.#####.', '..#o#..', '...#...']),
    frame: icon(['.......', '#######', '#....o#', '#..#..#', '#.###.#', '#######', '.......']),
    bars: icon(['.....o.', '.....#.', '...#.#.', '...#.#.', '.#.#.#.', '.#.#.#.', '#######']),
    flow: icon(['.....oo', '.....oo', '...##..', '...#...', '###....', '#......', '.......']),
    spark: icon(['...#...', '...#...', '...#...', '###o###', '...#...', '...#...', '...#...']),
    check: icon(['.......', '......#', '.....#.', '#...#..', '.#.#...', '..o....', '.......'])
  };

  /* ---------- rolling digits ---------- */
  var cols = document.querySelectorAll('.reel > span');
  for (var i = 0; i < cols.length; i++) {
    if (cols[i].children.length) continue;
    var digits = '';
    for (var n = 0; n < 20; n++) digits += '<i>' + (n % 10) + '</i>';
    cols[i].innerHTML = digits;
  }

  /* ---------- activity feed ---------- */
  var types = [
    { k: 'tag', t: 'Listing drafted', m: 'Amazon' },
    { k: 'frame', t: 'Product image ready', m: 'A+ content' },
    { k: 'bars', t: 'Bids adjusted', m: 'Amazon PPC' },
    { k: 'flow', t: 'Order synced', m: 'Shopify' },
    { k: 'spark', t: 'Reply sent', m: 'Support inbox' },
    { k: 'check', t: 'Weekly report ready', m: 'Reports' },
    { k: 'tag', t: 'Listing published', m: 'Walmart' },
    { k: 'flow', t: 'Stock updated', m: 'eBay' }
  ];
  function pad(v) { return String(v).length < 2 ? '0' + v : String(v); }
  function lane(shift) {
    var out = [];
    for (var j = 0; j < types.length; j++) {
      var x = types[(j + shift) % types.length];
      var flag = j === 3 + (shift % 2);
      out.push({
        k: x.k, n: j, ink: ic[x.k].ink, acc: ic[x.k].acc,
        title: flag ? 'Odd order flagged' : x.t,
        meta: (flag ? 'Refund over limit' : x.m) + ' · ' + pad(1 + ((j + shift) % 5)) + ':' + pad((j * 19 + shift * 13) % 60),
        chip: flag ? 'Needs a person' : 'Checked',
        cls: flag ? ' flag' : ''
      });
    }
    return out;
  }
  function card(c) {
    return '<div class="tcard' + c.cls + '" style="--n: ' + c.n + '"><span class="itile sm">' +
      '<svg class="ic ic-' + c.k + '" width="28" height="28" viewBox="0 0 7 7" shape-rendering="crispEdges">' +
      '<path class="ii" d="' + c.ink + '"></path><path class="ia" d="' + c.acc + '"></path></svg></span>' +
      '<div><b>' + c.title + '</b><span class="m">' + c.meta + '</span></div><span class="chk">' + c.chip + '</span></div>';
  }
  var shifts = { A: 0, B: 3, C: 5 };
  var groups = document.querySelectorAll('[data-lane]');
  for (var g = 0; g < groups.length; g++) {
    var s = shifts[groups[g].getAttribute('data-lane')] || 0;
    groups[g].innerHTML = lane(s).map(card).join('');
  }

  /* ---------- lazy video (starts when near the viewport; poster only for reduced motion) ---------- */
  function startVideo(v) {
    if (v.getAttribute('data-started')) return;
    v.setAttribute('data-started', '1');
    v.src = v.getAttribute('data-src');
    v.muted = true;
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  }
  var lazy = document.querySelectorAll('video[data-lazy-video]');
  if (!reduce && lazy.length) {
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { startVideo(e.target); vio.unobserve(e.target); }
        });
      }, { rootMargin: '300px' });
      for (var v = 0; v < lazy.length; v++) vio.observe(lazy[v]);
    } else {
      for (var w = 0; w < lazy.length; w++) startVideo(lazy[w]);
    }
  }

  /* ---------- keep the page light: pause animations in sections that are off screen ---------- */
  if ('IntersectionObserver' in window) {
    var pauseTargets = document.querySelectorAll('main > section, .flow, .flowp');
    var pauser = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-off', !e.isIntersecting); });
    }, { rootMargin: '240px 0px' });
    for (var pt = 0; pt < pauseTargets.length; pt++) pauser.observe(pauseTargets[pt]);
  }

  /* ---------- draggable Earth ---------- */
  function initGlobe() {
    var cv = document.getElementById('globe');
    if (!cv) return;
    var wrap = cv.parentNode;

    function fail() {
      wrap.classList.add('nogl');
      wrap.classList.remove('live');
      var vid = wrap.querySelector('video');
      if (vid && vid.getAttribute('data-src') && !reduce) {
        vid.muted = true; vid.loop = true; vid.src = vid.getAttribute('data-src');
        vid.style.opacity = '1';
        var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {});
      }
    }

    var gl = null;
    try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true }); } catch (e) { gl = null; }
    if (!gl) { fail(); return; }

    var vsSrc = 'attribute vec2 p; varying vec2 uv; void main() { uv = p; gl_Position = vec4(p, 0.0, 1.0); }';
    var fsSrc = [
      'precision highp float;',
      'varying vec2 uv;',
      'uniform sampler2D tex;',
      'uniform float yaw;',
      'uniform float pitch;',
      'uniform float R;',
      'uniform vec3 acc;',
      'const float PI = 3.14159265;',
      'void main() {',
      '  vec2 p = uv / R;',
      '  float r2 = dot(p, p);',
      '  float r = sqrt(r2);',
      '  float halo = (1.0 - smoothstep(1.0, 1.3, r)) * 0.5;',
      '  vec3 col = vec3(0.0);',
      '  float a = 0.0;',
      '  if (r2 < 1.0) {',
      '    vec3 n = vec3(p.x, p.y, sqrt(1.0 - r2));',
      '    float cp = cos(pitch); float sp = sin(pitch);',
      '    vec3 q = vec3(n.x, n.y * cp - n.z * sp, n.y * sp + n.z * cp);',
      '    float cy = cos(yaw); float sy = sin(yaw);',
      '    vec3 d = vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);',
      '    float lon = atan(d.x, d.z);',
      '    float lat = asin(clamp(d.y, -1.0, 1.0));',
      '    vec3 c = texture2D(tex, vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI)).rgb;',
      '    float lights = clamp((c.r + c.g * 0.9 - c.b * 0.55) * 1.7, 0.0, 1.0);',
      '    float land = smoothstep(0.10, 0.28, c.b);',
      '    vec3 base = mix(vec3(0.020, 0.024, 0.034), vec3(0.075, 0.082, 0.105), land);',
      '    float diff = clamp(dot(n, normalize(vec3(0.55, 0.45, 0.7))), 0.0, 1.0);',
      '    float fres = pow(1.0 - n.z, 2.6);',
      '    vec3 glow = acc * (lights * 1.45) + vec3(1.0, 0.82, 0.55) * pow(lights, 3.0) * 0.9;',
      '    col = base * (0.55 + diff * 1.5) + glow + acc * fres * 0.8;',
      '    col = min(col, vec3(1.0));',
      '    a = 1.0 - smoothstep(0.985, 1.0, r);',
      '  }',
      '  float oa = clamp(a + halo * (1.0 - a), 0.0, 1.0);',
      '  vec3 oc = col * a + acc * halo * (1.0 - a);',
      '  gl_FragColor = vec4(oc, oa);',
      '}'
    ].join('\n');

    function shader(type, src) {
      var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    }
    var vs = shader(gl.VERTEX_SHADER, vsSrc); var fs = shader(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) { fail(); return; }
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { fail(); return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var ap = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
    var uYaw = gl.getUniformLocation(prog, 'yaw'); var uPitch = gl.getUniformLocation(prog, 'pitch');
    var uR = gl.getUniformLocation(prog, 'R'); var uAcc = gl.getUniformLocation(prog, 'acc'); var uTex = gl.getUniformLocation(prog, 'tex');

    var tex = gl.createTexture();
    var st = { yaw: 0.95, lat: 0.384, lat0: 0.384, vy: 0, drag: false, t: 0, ready: false, used: false, seen: true };
    var img = new Image();
    img.onload = function () {
      try {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        st.ready = true;
      } catch (err) { fail(); }
    };
    img.onerror = function () { fail(); };
    img.src = 'assets/earth-map.jpg';

    var R = 0.755;
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
    function hexToRgb(h) {
      h = (h || '').trim(); if (h.charAt(0) === '#') h = h.slice(1);
      if (h.length === 3) h = h.split('').map(function (x) { return x + x; }).join('');
      var num = parseInt(h, 16);
      if (isNaN(num)) return [0.95, 0.42, 0.13];
      return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
    }
    var acc = [0.95, 0.42, 0.13]; var wire = null; var frameNo = 0;
    var hintEl = document.getElementById('globe-hint');
    function markUsed() { st.used = true; if (hintEl) hintEl.classList.add('used'); }

    var lx = 0; var ly = 0;
    cv.addEventListener('pointerdown', function (e) {
      st.drag = true; st.vy = 0; lx = e.clientX; ly = e.clientY; cv.classList.add('drag'); markUsed();
      try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    });
    cv.addEventListener('pointermove', function (e) {
      if (!st.drag) return;
      var k = Math.PI / (cv.clientWidth * R);
      var dx = e.clientX - lx; var dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      st.yaw -= dx * k; st.vy = -dx * k;
      st.lat = clamp(st.lat + dy * k, -1.25, 1.25);
    });
    function end() { st.drag = false; cv.classList.remove('drag'); }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('lostpointercapture', end);

    /* draw only while the globe is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { st.seen = entries[0].isIntersecting; }, { rootMargin: '120px' }).observe(cv);
    }

    function frame(now) {
      requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - (st.t || now)) / 1000); st.t = now;
      if (!st.seen) return;
      frameNo++;
      if (st.ready && !wrap.classList.contains('live') && !wrap.classList.contains('nogl')) wrap.classList.add('live');
      if (!st.drag) {
        st.yaw += st.vy; st.vy *= Math.pow(0.93, dt * 60);
        if (!reduce) st.yaw -= 0.11 * dt;
        st.lat += (st.lat0 - st.lat) * Math.min(1, dt * 0.9);
      }
      if (frameNo % 30 === 1) acc = hexToRgb(getComputedStyle(cv).getPropertyValue('--accent'));
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      var size = Math.max(2, Math.round(cv.clientWidth * dpr));
      if (cv.width !== size) { cv.width = size; cv.height = size; }
      if (!wire || !wire.isConnected) wire = document.querySelector('.wire');
      if (wire) {
        wire.style.animation = 'none';
        wire.style.transform = 'rotateX(' + (-st.lat * 180 / Math.PI).toFixed(2) + 'deg) rotateY(' + (-st.yaw * 180 / Math.PI).toFixed(2) + 'deg)';
      }
      if (!st.ready) return;
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(uTex, 0);
      gl.uniform1f(uYaw, st.yaw); gl.uniform1f(uPitch, -st.lat); gl.uniform1f(uR, R); gl.uniform3f(uAcc, acc[0], acc[1], acc[2]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    requestAnimationFrame(frame);
  }
  /* ---------- gentle pointer parallax on the service-page hero visual (mouse only) ---------- */
  var vis = document.querySelector('.svc-vis');
  if (vis && !reduce && window.matchMedia && window.matchMedia('(hover: hover)').matches) {
    var pf = 0; var ptx = 0; var pty = 0;
    vis.addEventListener('pointermove', function (e) {
      var r = vis.getBoundingClientRect();
      ptx = ((e.clientX - r.left) / r.width - 0.5) * 18;
      ptx = Math.max(-9, Math.min(9, ptx));
      pty = Math.max(-9, Math.min(9, ((e.clientY - r.top) / r.height - 0.5) * 18));
      if (!pf) pf = requestAnimationFrame(function () {
        pf = 0;
        vis.style.setProperty('--px', ptx.toFixed(1) + 'px');
        vis.style.setProperty('--py', pty.toFixed(1) + 'px');
      });
    });
    vis.addEventListener('pointerleave', function () {
      vis.style.setProperty('--px', '0px');
      vis.style.setProperty('--py', '0px');
    });
  }

  initGlobe();
})();
