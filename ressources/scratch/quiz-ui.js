/* Interface du quiz Scratch (voir quiz.js pour les questions) */
(function () {
  var NIV = [
    { id: '6eme', nom: '6ème', c: '#2563eb' }, { id: '5eme', nom: '5ème', c: '#0d9488' },
    { id: '4eme', nom: '4ème', c: '#ea580c' }, { id: '3eme', nom: '3ème', c: '#c026d3' }];
  var $ = function (id) { return document.getElementById(id); }, root = $('qz');
  var L = 0, themes = {}, serie = [], i = 0, score = 0, rep = [], fait = false;
  var opts = { style: 'scratch3', languages: ['fr', 'en'], scale: .8 };
  try { var m = localStorage.getItem('giromaths-quiz'); if (m) { m = JSON.parse(m); L = m.L || 0; themes = m.t || {}; } } catch (e) {}
  var q0 = NIV.map(function (n) { return n.id; }).indexOf(new URLSearchParams(location.search).get('niveau'));
  if (q0 >= 0) L = q0;
  GiroQuiz.THEMES.forEach(function (t) { if (!(t.id in themes)) themes[t.id] = true; });

  function couleur() { root.style.setProperty('--c', NIV[L].c); }
  function chips() {
    $('qz-niv').innerHTML = ''; $('qz-th').innerHTML = '';
    NIV.forEach(function (n, k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = n.nom;
      b.setAttribute('aria-pressed', k === L); b.style.setProperty('--c', n.c);
      b.onclick = function () { L = k; couleur(); chips(); }; $('qz-niv').appendChild(b);
    });
    GiroQuiz.THEMES.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t.nom;
      b.setAttribute('aria-pressed', !!themes[t.id]);
      b.onclick = function () { themes[t.id] = !themes[t.id]; $('qz-warn').textContent = ''; chips(); }; $('qz-th').appendChild(b);
    });
  }
  function show(which) { ['qz-setup', 'qz-play', 'qz-end'].forEach(function (k) { $(k).hidden = k !== which; }); window.scrollTo(0, root.offsetTop - 80); }
  function nomTheme(id) { return GiroQuiz.THEMES.filter(function (t) { return t.id === id; })[0].nom; }

  function start() {
    var ch = GiroQuiz.THEMES.filter(function (t) { return themes[t.id]; }).map(function (t) { return t.id; });
    if (!ch.length) { $('qz-warn').textContent = 'Choisis au moins un thème.'; return; }
    try { localStorage.setItem('giromaths-quiz', JSON.stringify({ L: L, t: themes })); } catch (e) {}
    serie = GiroQuiz.generate(L, ch, 10); i = 0; score = 0; rep = []; show('qz-play'); question();
  }
  function question() {
    var q = serie[i]; fait = false;
    $('qz-n').textContent = 'Question ' + (i + 1) + ' / ' + serie.length; $('qz-sc').textContent = 'Score : ' + score;
    $('qz-pb').style.width = (100 * i / serie.length) + '%'; $('qz-tag').textContent = nomTheme(q.theme);
    var pre = $('qz-blocks'), box = pre.parentNode, fresh = document.createElement('pre'); fresh.className = 'blocks'; fresh.id = 'qz-blocks'; fresh.textContent = q.prog;
    box.replaceChild(fresh, pre); scratchblocks.renderMatching('#qz-blocks', opts);
    $('qz-q').innerHTML = q.q; $('qz-out').innerHTML = '';
    var inn = $('qz-in'); inn.innerHTML = '';
    if (q.type === 'qcm') {
      var w = document.createElement('div'); w.className = 'qz-opts'; w.setAttribute('role', 'radiogroup');
      q.choices.forEach(function (c, k) {
        var l = document.createElement('label'); l.className = 'qz-opt';
        l.innerHTML = '<input type="radio" name="qz-r" value="' + k + '"><span></span>'; l.lastChild.textContent = c; w.appendChild(l);
      }); w.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); valider(); } }); inn.appendChild(w);
    } else {
      inn.innerHTML = '<div class="qz-ans"><input type="text" id="qz-r" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Ta réponse"> <span class="qz-small">Décimaux : virgule ou point</span></div>';
      $('qz-r').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); valider(); } }); $('qz-r').focus();
    }
    var b = document.createElement('button'); b.type = 'button'; b.className = 'go'; b.id = 'qz-ok'; b.textContent = 'Valider'; b.style.marginTop = '12px'; b.onclick = valider; inn.appendChild(b);
  }
  function valider() {
    if (fait) return; var q = serie[i], r;
    if (q.type === 'qcm') { var c = document.querySelector('input[name=qz-r]:checked'); if (!c) { $('qz-out').innerHTML = '<p class="warn">Choisis une réponse.</p>'; return; } r = +c.value; }
    else { r = $('qz-r').value; if (isNaN(GiroQuiz.parseNum(r))) { $('qz-out').innerHTML = '<p class="warn">Écris un nombre (par exemple 12 ou −3,5).</p>'; return; } }
    fait = true; var ok = GiroQuiz.verify(q, r); if (ok) score++;
    rep.push({ ok: ok, r: r });
    var bonne = q.type === 'qcm' ? q.choices[q.correct] : GiroQuiz.fmt(q.answer);
    if (q.type === 'qcm') document.querySelectorAll('.qz-opt').forEach(function (l, k) { if (k === q.correct) l.classList.add('ok'); else if (k === r) l.classList.add('ko'); l.firstChild.disabled = true; });
    else $('qz-r').disabled = true;
    $('qz-ok').remove(); $('qz-sc').textContent = 'Score : ' + score;
    var out = $('qz-out'), esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    out.innerHTML = '<div class="qz-fb ' + (ok ? 'ok' : 'ko') + '"><b>' + (ok ? 'Bravo, c’est juste !' : 'Pas tout à fait.') + '</b> La bonne réponse est : <b class="v">' + esc(bonne) + '</b></div><div class="qz-cor"><b>Corrigé</b>' + q.corrige + '</div>';
    var n = document.createElement('button'); n.type = 'button'; n.className = 'go'; n.style.marginTop = '12px'; n.textContent = i + 1 < serie.length ? 'Question suivante →' : 'Voir mon bilan';
    n.onclick = function () { i++; if (i < serie.length) question(); else fin(); }; out.appendChild(n); n.focus();
  }
  function fin() {
    show('qz-end'); $('qz-total').textContent = score + ' / ' + serie.length;
    $('qz-msg').textContent = score === serie.length ? 'Parfait, tu as tout compris !' : score >= 7 ? 'Très bien ! Relis les corrigés des questions ratées.' : score >= 4 ? 'C’est un bon début : relis les corrigés puis refais une série.' : 'Pas de panique : lis les corrigés ci-dessous et recommence, tu vas progresser.';
    var h = ''; serie.forEach(function (q, k) {
      var bonne = q.type === 'qcm' ? q.choices[q.correct] : GiroQuiz.fmt(q.answer), r = rep[k];
      var ta = q.type === 'qcm' ? q.choices[r.r] : r.r;
      h += '<details class="qz-rev ' + (r.ok ? 'ok' : 'ko') + '"><summary>Question ' + (k + 1) + ' · ' + nomTheme(q.theme) + '</summary><div class="qz-prog-box"><pre class="blocks qz-rb"></pre></div><p class="qz-q">' + q.q + '</p><p>Ta réponse : <b></b> · Bonne réponse : <b></b></p><div class="qz-cor">' + q.corrige + '</div></details>';
    });
    $('qz-rev').innerHTML = h;
    var ds = $('qz-rev').querySelectorAll('details');
    serie.forEach(function (q, k) {
      var d = ds[k], bs = d.querySelectorAll('p b'); d.querySelector('pre').textContent = q.prog;
      bs[0].textContent = q.type === 'qcm' ? q.choices[rep[k].r] : rep[k].r; bs[1].textContent = q.type === 'qcm' ? q.choices[q.correct] : GiroQuiz.fmt(q.answer);
    });
    scratchblocks.renderMatching('pre.qz-rb', opts);
  }
  $('qz-start').onclick = start; $('qz-again').onclick = start;
  $('qz-change').onclick = function () { show('qz-setup'); };
  couleur(); chips();
})();
