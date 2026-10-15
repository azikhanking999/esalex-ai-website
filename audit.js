/* eSalex ai: "Book a free audit" pop-up. No dependencies.
   Every link or button whose text is "Book a free audit" opens the form. */
(function () {
  'use strict';

  /* ---------- where the form goes: set ONE of these when you are ready ----------
     endpoint  A form service URL, for example Formspree: 'https://formspree.io/f/xxxxxxx'.
               The form sends the answers as JSON.
     email     Opens the visitor's email app with the answers filled in, addressed to you.
     With neither set the form runs in TEST MODE: nothing is sent, and the thank-you screen says so. */
  var CONFIG = { endpoint: '', email: '' };

  if (!window.HTMLDialogElement || !document.querySelector) return;

  var UPWORK = 'https://www.upwork.com/agencies/1002230983337877504/';
  var DRAFT_KEY = 'esalex-audit-draft';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  /* ---------- 7 x 7 pixel icons (# = ink, o = orange accent) ---------- */
  var ICONS = {
    person: ['..###..', '..#o#..', '..###..', '.......', '.#####.', '#######', '#######'],
    store: ['#######', '#.#.#.#', '#######', '.#...#.', '.#.o.#.', '.#...#.', '.#####.'],
    spark: ['...#...', '...#...', '...#...', '###o###', '...#...', '...#...', '...#...'],
    check: ['.......', '......#', '.....#.', '#...#..', '.#.#...', '..o....', '.......']
  };
  function bits(rows, ch) {
    var d = '';
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) { if (rows[y].charAt(x) === ch) d += 'M' + x + ' ' + y + 'h1v1h-1z'; }
    }
    return d;
  }
  function icon(name, size, cls) {
    var r = ICONS[name];
    return '<svg class="' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true">' +
      '<path class="ii" d="' + bits(r, '#') + '"></path><path class="ia" d="' + bits(r, 'o') + '"></path></svg>';
  }
  /* the big thank-you check, drawn one pixel at a time */
  function pixelCheck() {
    var rows = ICONS.check, out = '', n = 0;
    for (var x = 0; x < 7; x++) {
      for (var y = 0; y < 7; y++) {
        var c = rows[y].charAt(x);
        if (c === '#' || c === 'o') {
          out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" class="' + (c === 'o' ? 'ia' : 'ii') + '" style="--n: ' + n + '"></rect>';
          n++;
        }
      }
    }
    return '<svg width="96" height="96" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true">' + out + '</svg>';
  }

  var ARROW = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path></svg>';

  /* ---------- the form rules ---------- */
  var RULES = {
    name: { test: function (v) { return v.trim().length >= 2; }, msg: 'Please add your name.' },
    email: { test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email does not look right. Try name@company.com.' },
    phone: { test: function (v) { var d = v.replace(/\D/g, ''); return d.length >= 7 && d.length <= 15 && /^[+\d\s().-]+$/.test(v.trim()); }, msg: 'Add a phone number we can reach, with your country code.' },
    store: { test: function (v) { return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v.trim()); }, msg: 'Add a link to your store or website, like yourstore.com.' },
    about: { test: function (v) { return v.trim().length >= 10; }, msg: 'Tell us a little about what you sell. One sentence is enough.' }
  };
  var KEYS = ['name', 'email', 'phone', 'store', 'social', 'about', 'notes'];
  var GOALS = ['Listings', 'Product images and A+', 'Ads and PPC', 'Orders and inventory', 'Customer replies', 'Reports', 'Not sure yet'];
  var SOCIALS = [['Instagram', 'instagram.com/'], ['Facebook', 'facebook.com/'], ['TikTok', 'tiktok.com/@'], ['LinkedIn', 'linkedin.com/company/'], ['YouTube', 'youtube.com/@']];

  var dlg, form, btn, btnWrap, btnLbl, segs, pct, steps, stepsEl, doneEl, built = false, busy = false, lastFocus = null, closing = false;

  function q(sel, root) { return (root || dlg).querySelector(sel); }
  function qa(sel, root) { return Array.prototype.slice.call((root || dlg).querySelectorAll(sel)); }
  function val(k) { var e = q('[name="' + k + '"]'); return e ? e.value : ''; }
  function fld(k) { return q('[data-f="' + k + '"]'); }
  function isOk(k) { return RULES[k].test(val(k)); }
  function checkedGoals() { return qa('input[name="goal"]:checked').map(function (c) { return c.value; }); }

  /* ---------- build the dialog once ---------- */
  function build() {
    if (built) return;
    built = true;

    var host = document.querySelector('.es') || document.body;
    dlg = document.createElement('dialog');
    dlg.className = 'audit';
    dlg.id = 'audit';
    dlg.setAttribute('aria-labelledby', 'audit-h');
    dlg.setAttribute('aria-describedby', 'audit-sub');

    var goals = GOALS.map(function (g) {
      return '<label class="a-chip"><input type="checkbox" name="goal" value="' + g + '"><span>' + g + '</span></label>';
    }).join('');
    var socials = SOCIALS.map(function (s) {
      return '<button type="button" class="a-soc" data-prefix="' + s[1] + '">+ ' + s[0] + '</button>';
    }).join('');
    var segsHtml = '';
    for (var i = 0; i < 10; i++) segsHtml += '<i></i>';

    dlg.innerHTML =
      '<div class="audit-wrap">' +
      '<div class="audit-card" role="document">' +
      '<button type="button" class="audit-x" aria-label="Close the form"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg></button>' +

      '<aside class="audit-side">' +
        '<div class="a-brand"><svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true"><path class="ii" d="M25.6 0 H51.2 V12.8 H64 V38.4 H51.2 V25.6 H38.4 V38.4 H25.6 V51.2 H12.8 L0 64 V51.2 H12.8 V38.4 H25.6 V25.6 H38.4 V12.8 H25.6 Z"></path><path class="ia" d="M51.2 0 H64 V12.8 Z"></path></svg><span>eSalex ai</span></div>' +
        '<div class="a-pitch"><span class="a-eyebrow">Free store audit</span>' +
        '<p class="a-big">Let’s find what to <em>automate</em> first.</p>' +
        '<p class="a-small">Share a few details and we will look at your store before the call.</p></div>' +
        '<ol class="a-steps" aria-label="Form progress">' +
          '<li class="a-step" data-step="1"><span class="itile">' + icon('person', 28, 'ic-main') + icon('check', 28, 'ic-done') + '</span><div><b>About you</b><span>Name, email and phone</span></div></li>' +
          '<li class="a-step" data-step="2"><span class="itile">' + icon('store', 28, 'ic-main') + icon('check', 28, 'ic-done') + '</span><div><b>Your business</b><span>Store, links and what you sell</span></div></li>' +
          '<li class="a-step" data-step="3"><span class="itile">' + icon('spark', 28, 'ic-main') + icon('check', 28, 'ic-done') + '</span><div><b>Your goals</b><span>What to automate (optional)</span></div></li>' +
        '</ol>' +
        '<p class="a-fine"><i></i>Free audit. No payment details needed.</p>' +
        '<span class="a-px" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
      '</aside>' +

      '<div class="audit-main">' +
        '<form class="audit-form" novalidate>' +
          '<div class="audit-head">' +
            '<h2 id="audit-h">Book your free audit</h2>' +
            '<p id="audit-sub">Tell us about your store. It takes about two minutes.</p>' +
            '<div class="audit-prog"><div class="audit-seg" aria-hidden="true">' + segsHtml + '</div><span class="audit-pct" role="status" aria-live="polite">0 of 5 done</span></div>' +
          '</div>' +

          '<div class="audit-scroll">' +
            '<div class="audit-row">' +
              field('name', 0, 'Your name', '<input id="a-name" name="name" type="text" autocomplete="name" placeholder="Jane Cooper" maxlength="80" aria-describedby="a-name-e">', '') +
              field('email', 1, 'Email', '<input id="a-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="jane@yourstore.com" maxlength="120" aria-describedby="a-email-e">', 'We will send your audit details here.') +
            '</div>' +
            '<div class="audit-row">' +
              field('phone', 2, 'Phone number', '<input id="a-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+1 555 123 4567" maxlength="30" aria-describedby="a-phone-e">', 'Include your country code. Used only to book the call.') +
              field('store', 3, 'Your store or website link', '<input id="a-store" name="store" type="text" autocomplete="url" inputmode="url" autocapitalize="off" spellcheck="false" placeholder="yourstore.com or Amazon store link" maxlength="200" aria-describedby="a-store-e">', 'A website, Shopify store or Amazon storefront.') +
            '</div>' +
            '<div class="fld a-opt" data-f="social" style="--i: 4">' +
              '<label for="a-social">Social media links <em>optional</em></label>' +
              '<div class="inp"><textarea id="a-social" name="social" rows="2" placeholder="Paste any profile links, one per line" maxlength="400" aria-describedby="a-social-t"></textarea></div>' +
              '<div class="a-socs" id="a-social-t">' + socials + '</div>' +
            '</div>' +
            field('about', 5, 'Short business description', '<textarea id="a-about" name="about" rows="3" placeholder="What you sell, where you sell it and roughly how big the catalog is." maxlength="300" aria-describedby="a-about-e"></textarea><span class="a-count" aria-hidden="true"><b>0</b>/300</span>', '') +
            '<fieldset class="fld a-opt" data-f="goal" style="--i: 6">' +
              '<legend>What do you want to automate? <em>optional</em></legend>' +
              '<div class="a-chips">' + goals + '</div>' +
              '<div class="inp"><textarea id="a-notes" name="notes" rows="2" placeholder="Anything else on your mind? Add it here." maxlength="400" aria-label="Anything else you want to automate"></textarea></div>' +
            '</fieldset>' +
            '<input type="text" name="company_url" class="a-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
          '</div>' +

          '<div class="audit-foot">' +
            '<p class="a-fail" role="alert" hidden>Something went wrong and your request was not sent. Please try again, or message us on <a href="' + UPWORK + '" target="_blank" rel="noopener">Upwork</a>.</p>' +
            '<span class="abtn-w"><button type="submit" class="abtn"><span class="a-lbl">Book a free audit</span><span class="a-arr" aria-hidden="true">' + ARROW + '<i class="a-dots"><u></u><u></u><u></u></i></span></button></span>' +
            '<p class="a-note">Your details are only used to prepare your audit and book your call.</p>' +
          '</div>' +
        '</form>' +

        '<div class="audit-done" hidden tabindex="-1">' +
          '<div class="a-burst" aria-hidden="true"></div>' +
          '<div class="a-bigcheck">' + pixelCheck() + '</div>' +
          '<h2 id="audit-done-h"></h2>' +
          '<p class="a-done-p"></p>' +
          '<p class="a-test" hidden><i></i>Test mode: this form is not connected yet, so nothing was sent.</p>' +
          '<div class="a-done-btns"><button type="button" class="btn a-close">Back to the site</button><a class="btn btn-ghost" href="' + UPWORK + '" target="_blank" rel="noopener">Message us on Upwork</a></div>' +
        '</div>' +
      '</div>' +
      '</div></div>';

    host.appendChild(dlg);

    form = q('.audit-form');
    btn = q('.abtn');
    btnWrap = q('.abtn-w');
    btnLbl = q('.a-lbl');
    segs = qa('.audit-seg i');
    pct = q('.audit-pct');
    stepsEl = q('.a-steps');
    steps = qa('.a-step');
    doneEl = q('.audit-done');

    bind();
    restoreDraft();
    update();
  }

  function field(k, i, label, control, tip) {
    return '<div class="fld" data-f="' + k + '" style="--i: ' + i + '">' +
      '<label for="a-' + k + '">' + label + '</label>' +
      '<div class="inp">' + control + '<span class="ck" aria-hidden="true"></span></div>' +
      (tip ? '<p class="a-tip">' + tip + '</p>' : '') +
      '<p class="a-err" id="a-' + k + '-e"></p></div>';
  }

  /* ---------- behaviour ---------- */
  function bind() {
    q('.audit-x').addEventListener('click', closeAudit);
    q('.a-close').addEventListener('click', closeAudit);
    q('.audit-wrap').addEventListener('mousedown', function (e) { if (e.target === this) closeAudit(); });
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeAudit(); });
    dlg.addEventListener('close', cleanup);

    form.addEventListener('input', function (e) {
      var t = e.target, k = t.name;
      if (RULES[k]) {
        var good = isOk(k), f = fld(k);
        f.classList.toggle('is-ok', good);
        if (good) { f.classList.remove('bad'); setErr(k, ''); }
        else if (f.classList.contains('bad')) validate(k, true);
      }
      if (k === 'about') q('.a-count b').textContent = t.value.length;
      if (k === 'social') qa('.a-soc').forEach(function (b) { b.classList.toggle('used', t.value.indexOf(b.getAttribute('data-prefix')) > -1); });
      saveDraft();
      update();
    });
    form.addEventListener('change', function () { saveDraft(); update(); });
    form.addEventListener('focusout', function (e) {
      var k = e.target.name;
      if (RULES[k] && e.target.value.trim()) validate(k, true);
    });
    form.addEventListener('focusin', function (e) {
      var f = e.target.closest ? e.target.closest('[data-f]') : null;
      var map = { name: 1, email: 1, phone: 1, store: 2, social: 2, about: 2, goal: 3 };
      var s = f ? map[f.getAttribute('data-f')] : 0;
      steps.forEach(function (el) { el.classList.toggle('active', Number(el.getAttribute('data-step')) === s); });
    });

    qa('.a-soc').forEach(function (b) {
      b.addEventListener('click', function () {
        var t = q('#a-social'), p = b.getAttribute('data-prefix');
        t.value = (t.value.trim() ? t.value.replace(/\s+$/, '') + '\n' : '') + p;
        t.focus();
        t.setSelectionRange(t.value.length, t.value.length);
        b.classList.add('used');
        saveDraft(); update();
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;
      var first = null;
      Object.keys(RULES).forEach(function (k) { if (!validate(k, true) && !first) first = k; });
      if (first) {
        var el = q('[name="' + first + '"]');
        el.focus();
        btnWrap.classList.remove('a-shake'); void btnWrap.offsetWidth; btnWrap.classList.add('a-shake');
        qa('.fld.bad').forEach(function (f) { f.classList.remove('a-shake'); void f.offsetWidth; f.classList.add('a-shake'); });
        pct.textContent = 'Please check the highlighted fields';
        return;
      }
      if (q('.a-hp').value) { showDone('test', true); return; }
      send(collect());
    });
  }

  function setErr(k, msg) {
    var e = q('#a-' + k + '-e'), inp = q('[name="' + k + '"]');
    if (e) e.textContent = msg;
    if (inp) { if (msg) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); }
  }
  function validate(k, show) {
    var f = fld(k), good = isOk(k);
    f.classList.toggle('is-ok', good);
    if (good) { f.classList.remove('bad'); setErr(k, ''); }
    else if (show) { f.classList.add('bad'); setErr(k, RULES[k].msg); }
    return good;
  }

  function update() {
    var total = Object.keys(RULES).length, done = 0;
    Object.keys(RULES).forEach(function (k) { if (isOk(k)) done++; });
    var p = done / total;
    btn.style.setProperty('--p', p.toFixed(3));
    btnWrap.classList.toggle('ready', done === total);
    var lit = Math.round(p * 10);
    segs.forEach(function (s, i) { s.classList.toggle('on', i < lit); });
    pct.textContent = done === total ? 'All set. Ready to book' : done + ' of ' + total + ' done';

    var s1 = isOk('name') && isOk('email') && isOk('phone');
    var s2 = isOk('store') && isOk('about');
    var s3 = checkedGoals().length > 0 || val('notes').trim().length > 0;
    [s1, s2, s3].forEach(function (d, i) { steps[i].classList.toggle('done', d); });
    stepsEl.style.setProperty('--f', ((s1 ? 0.5 : 0) + (s1 && s2 ? 0.5 : 0)).toString());
  }

  function collect() {
    var d = {
      name: val('name').trim(), email: val('email').trim(), phone: val('phone').trim(), store: val('store').trim(),
      social: val('social').trim(), description: val('about').trim(), automate: checkedGoals().join(', '),
      notes: val('notes').trim(), page: location.href, source: 'Book a free audit pop-up'
    };
    return d;
  }

  function send(data) {
    setBusy(true);
    if (CONFIG.endpoint) {
      fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error('status ' + r.status); showDone('sent'); })
        .catch(function () { setBusy(false); q('.a-fail').hidden = false; });
    } else if (CONFIG.email) {
      var body = ['Name: ' + data.name, 'Email: ' + data.email, 'Phone: ' + data.phone, 'Store or website: ' + data.store,
        'Social links: ' + (data.social || '-'), 'About the business: ' + data.description,
        'Wants to automate: ' + (data.automate || '-'), 'Notes: ' + (data.notes || '-')].join('\n');
      location.href = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent('Free audit request from ' + data.name) + '&body=' + encodeURIComponent(body);
      setTimeout(function () { showDone('email'); }, 700);
    } else {
      setTimeout(function () { showDone('test'); }, 1100);
    }
  }

  function setBusy(on) {
    busy = on;
    btnWrap.classList.toggle('busy', on);
    btn.disabled = on;
    btnLbl.textContent = on ? 'Sending' : 'Book a free audit';
    q('.a-fail').hidden = true;
  }

  function showDone(mode, quiet) {
    setBusy(false);
    try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
    var first = (val('name').trim().split(/\s+/)[0]) || 'there';
    q('#audit-done-h').textContent = 'Thanks, ' + first + '. We have your details.';
    var p = q('.a-done-p');
    if (mode === 'email') p.textContent = 'Your email app should now be open with everything filled in. Press send and we will take it from there.';
    else p.textContent = 'We will look at ' + val('store').trim() + ' and email ' + val('email').trim() + ' with a time for a short call.';
    q('.a-test').hidden = mode !== 'test' || !!quiet;
    form.hidden = true;
    doneEl.hidden = false;
    dlg.classList.add('is-done');
    burst();
    doneEl.focus({ preventScroll: true });
  }

  function burst() {
    var b = q('.a-burst');
    b.innerHTML = '';
    if (reduce) return;
    for (var i = 0; i < 18; i++) {
      var s = document.createElement('i'), a = (Math.PI * 2 * i) / 18 + Math.random() * 0.3, d = 90 + Math.random() * 90;
      s.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
      s.style.setProperty('--dy', Math.round(Math.sin(a) * d) + 'px');
      s.style.setProperty('--r', Math.round(Math.random() * 180) + 'deg');
      s.style.setProperty('--w', (6 + Math.round(Math.random() * 6)) + 'px');
      if (i % 3 === 0) s.className = 'p';
      b.appendChild(s);
    }
  }

  /* ---------- keep what people typed if they close by accident ---------- */
  function saveDraft() {
    try {
      var d = {};
      KEYS.forEach(function (k) { d[k] = val(k); });
      d.goal = checkedGoals();
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch (e) {}
  }
  function restoreDraft() {
    try {
      var d = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (!d) return;
      KEYS.forEach(function (k) { var e = q('[name="' + k + '"]'); if (e && d[k]) e.value = d[k]; });
      (d.goal || []).forEach(function (g) { var c = qa('input[name="goal"]').filter(function (x) { return x.value === g; })[0]; if (c) c.checked = true; });
      q('.a-count b').textContent = val('about').length;
      Object.keys(RULES).forEach(function (k) { if (isOk(k)) fld(k).classList.add('is-ok'); });
    } catch (e) {}
  }

  /* ---------- open and close ---------- */
  function openAudit(trigger) {
    build();
    if (dlg.open) return;
    closing = false;
    lastFocus = trigger || document.activeElement;
    var sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', sbw + 'px');
    document.documentElement.classList.add('audit-open');
    form.hidden = false; doneEl.hidden = true; dlg.classList.remove('is-done');
    dlg.showModal();
    requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-open'); }); });
    if (!coarse) setTimeout(function () { var el = q('[name="name"]'); if (el && dlg.open && !form.hidden) el.focus({ preventScroll: true }); }, reduce ? 0 : 520);
    try { if (history.replaceState && location.hash === '#audit') history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  function closeAudit() {
    if (!dlg || !dlg.open || closing) return;
    closing = true;
    dlg.classList.remove('is-open');
    setTimeout(function () { if (dlg.open) dlg.close(); }, reduce ? 0 : 340);
  }
  function resetForm() {
    form.reset();
    qa('.fld').forEach(function (f) { f.classList.remove('is-ok', 'bad', 'a-shake'); });
    qa('.a-err').forEach(function (e) { e.textContent = ''; });
    qa('[aria-invalid]').forEach(function (e) { e.removeAttribute('aria-invalid'); });
    qa('.a-soc').forEach(function (b) { b.classList.remove('used'); });
    q('.a-count b').textContent = '0';
    q('.a-fail').hidden = true;
    form.hidden = false; doneEl.hidden = true; dlg.classList.remove('is-done');
    update();
  }
  function cleanup() {
    document.documentElement.classList.remove('audit-open');
    if (dlg.classList.contains('is-done')) resetForm();
    closing = false;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
  }

  /* ---------- every "Book a free audit" link opens it ---------- */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!a || a.closest('.audit')) return;
    if (!/book a free audit/i.test(a.textContent) && !a.hasAttribute('data-audit')) return;
    e.preventDefault();
    var menu = a.closest('details');
    if (menu) menu.removeAttribute('open');
    openAudit(a);
  });
  function markTriggers() {
    qa('a', document).forEach(function (a) {
      if (/book a free audit/i.test(a.textContent)) a.setAttribute('aria-haspopup', 'dialog');
    });
  }
  markTriggers();
  if (location.hash === '#audit') openAudit(null);
  window.addEventListener('hashchange', function () { if (location.hash === '#audit') openAudit(null); });

  /* warm up in the background so the first open is instant */
  var warm = window.requestIdleCallback || function (f) { return setTimeout(f, 1500); };
  warm(function () { build(); });
})();
