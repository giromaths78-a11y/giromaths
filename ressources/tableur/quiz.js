/* Quiz Tableur GiroMaths : « Que donne cette formule ? »
   Chaque question est calculée DEUX fois : (1) par un mini-tableur qui lit vraiment la formule affichée
   (références, $, recopie, SOMME, MOYENNE, MEDIANE…) ; (2) par un calcul direct écrit dans le modèle de question.
   Si les deux résultats diffèrent, la question est abandonnée et une autre est tirée. */
(function (root) {
'use strict';
var R = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = R(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
var rnd = function (v) { return Math.round(v * 1e9) / 1e9; };
function fmt(v) { return String(rnd(v)).replace('.', ',').replace('-', '−'); }
function pf(v) { return v < 0 ? '(' + fmt(v) + ')' : fmt(v); }
function same(a, b) { return Math.abs(a - b) < 1e-7; }
function colL(n) { return String.fromCharCode(64 + n); }
function colN(s) { return s.charCodeAt(0) - 64; }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

/* ================= mini-tableur ================= */
function parseRef(s) { var m = /^(\$?)([A-Z])(\$?)(\d+)$/.exec(s); return { cf: !!m[1], c: colN(m[2]), rf: !!m[3], r: +m[4] }; }
function refStr(o) { return (o.cf ? '$' : '') + colL(o.c) + (o.rf ? '$' : '') + o.r; }
/* recopie d'une formule de dr lignes et dc colonnes : les références sans $ bougent */
function shift(f, dr, dc) {
  return f.replace(/\$?[A-Z]\$?\d+/g, function (t) {
    var o = parseRef(t); if (!o.cf) o.c += dc; if (!o.rf) o.r += dr;
    if (o.c < 1 || o.r < 1) throw new Error('hors feuille'); return refStr(o);
  });
}
function tokens(s) {
  var t = [], re = /\s*(\d+(?:\.\d+)?|\$?[A-Z]\$?\d+|[A-ZÉ.]+|[-+*\/^();:])/y, m; re.lastIndex = 0;
  while (re.lastIndex < s.length) { m = re.exec(s); if (!m) throw new Error('syntaxe : ' + s); t.push(m[1]); }
  return t;
}
function stripD(r) { return r.replace(/\$/g, ''); }
function evalCell(cells, ref, memo, stack) {
  ref = stripD(ref);
  if (memo[ref] !== undefined) return memo[ref];
  var v = cells[ref]; if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v;
  if (v.charAt(0) !== '=') throw new Error('texte dans ' + ref);
  if (stack.indexOf(ref) >= 0) throw new Error('circulaire');
  var r = evalF(cells, v.slice(1), memo, stack.concat(ref)); memo[ref] = r; return r;
}
function rangeVals(cells, a, b, memo, stack) {
  a = parseRef(a); b = parseRef(b); var o = [];
  for (var r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r); r++) for (var c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) {
    var k = colL(c) + r, v = cells[k]; if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.charAt(0) !== '=') continue;
    o.push(evalCell(cells, k, memo, stack));
  }
  return o;
}
var FN = {
  SOMME: function (a) { return a.reduce(function (s, x) { return s + x; }, 0); },
  MOYENNE: function (a) { if (!a.length) throw new Error('div0'); return FN.SOMME(a) / a.length; },
  MIN: function (a) { return Math.min.apply(null, a); },
  MAX: function (a) { return Math.max.apply(null, a); },
  NB: function (a) { return a.length; },
  MEDIANE: function (a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
};
function evalF(cells, src, memo, stack) {
  var T = tokens(src), p = 0;
  function peek() { return T[p]; }
  function eat(x) { if (T[p] !== x) throw new Error('attendu ' + x + ' dans ' + src); p++; }
  var isRef = function (x) { return x && /^\$?[A-Z]\$?\d+$/.test(x); };
  function expr() { var v = term(); while (peek() === '+' || peek() === '-') { var o = T[p++], w = term(); v = o === '+' ? v + w : v - w; } return v; }
  function term() { var v = pw(); while (peek() === '*' || peek() === '/') { var o = T[p++], w = pw(); if (o === '/' && w === 0) throw new Error('div0'); v = o === '*' ? v * w : v / w; } return v; }
  function pw() { var v = un(); while (peek() === '^') { p++; v = Math.pow(v, un()); } return v; }
  function un() { if (peek() === '-') { p++; return -un(); } if (peek() === '+') { p++; return un(); } return prim(); }
  function prim() {
    var t = T[p++];
    if (t === undefined) throw new Error('fin inattendue');
    if (t === '(') { var v = expr(); eat(')'); return v; }
    if (/^\d/.test(t)) return parseFloat(t);
    if (isRef(t)) return evalCell(cells, t, memo, stack);
    if (FN[t] && peek() === '(') {
      p++; var args = [];
      while (true) {
        var a = T[p];
        if (isRef(a) && T[p + 1] === ':') { var b = T[p + 2]; if (!isRef(b)) throw new Error('plage'); p += 3; args = args.concat(rangeVals(cells, a, b, memo, stack)); }
        else args.push(expr());
        if (peek() === ';') { p++; continue; } break;
      }
      eat(')'); return FN[t](args);
    }
    throw new Error('jeton inconnu ' + t);
  }
  var v = expr(); if (p < T.length) throw new Error('reste ' + T.slice(p).join(' ')); return rnd(v);
}
/* valeur d'une cellule ; copy = [origine, [cibles…]] : on recopie la formule de l'origine vers les cibles */
function value(cells, ref, copy) {
  var c = {}; Object.keys(cells).forEach(function (k) { c[k] = cells[k]; });
  if (copy) { var o = parseRef(copy[0]); copy[1].forEach(function (t) { var q = parseRef(t); c[t] = shift(cells[copy[0]], q.r - o.r, q.c - o.c); }); }
  return evalCell(c, ref, {}, []);
}
function tryValue(cells, ref, copy) { try { return value(cells, ref, copy); } catch (e) { return null; } }

/* ================= affichage de la feuille ================= */
/* o : {cols, rows, cells:{ref:{t,c}}} ; c : classe (in = valeur, f = formule, t = cellule demandée, g = zone, h = titre) */
function grid(o) {
  var h = '<table class="tq-grid" aria-label="Feuille de calcul"><thead><tr><th></th>';
  for (var c = 1; c <= o.cols; c++) h += '<th>' + colL(c) + '</th>';
  h += '</tr></thead><tbody>';
  for (var r = 1; r <= o.rows; r++) {
    h += '<tr><th>' + r + '</th>';
    for (c = 1; c <= o.cols; c++) { var x = o.cells[colL(c) + r]; h += x ? '<td class="tq-' + (x.c || 'in') + '">' + esc(x.t) + '</td>' : '<td></td>'; }
    h += '</tr>';
  }
  return h + '</tbody></table>';
}
function bar(ref, f) { return '<div class="tq-bar"><b>' + ref + '</b><span class="tq-fx">fx</span><code>' + esc(f) + '</code></div>'; }
function num(v) { return { t: fmt(v), c: 'in' }; }
function fcell(f) { return { t: f, c: 'f' }; }
var QM = { t: '?', c: 't' };
function sym(f) { return f.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−'); }

/* ================= modèles de questions ================= */
/* chaque gen(L) renvoie {grid, bar, q, answer | choices+correct, corrige, chk} ou lève une exception (alors on tire autre chose) */
function numQ(o, cells, ref, copy, direct) {
  var e = value(cells, ref, copy);
  if (!same(e, direct)) throw new Error('désaccord ' + e + ' / ' + direct);
  o.type = 'num'; o.answer = direct; o.chk = { cells: cells, ref: ref, copy: copy, ans: direct }; return o;
}

/* --- Formules et cellules --- */
function F1(L) {
  var dec = L <= 4 && R(0, 2) === 0, ops = L === 6 ? ['+', '-', '*'] : ['+', '-', '*', '/'];
  var op = pick(ops), cells = {}, shown = {}, nums = [], a, b;
  for (var r = 1; r <= 3; r++) for (var c = 1; c <= 3; c++) nums.push(colL(c) + r);
  var ps = shuffle(nums), P = ps[0], Q = ps[1];
  nums.forEach(function (k) { cells[k] = L === 6 ? R(2, 15) : L === 5 ? R(-9, 15) : (dec ? R(11, 99) / 10 : R(-12, 15)); });
  if (L === 6) { a = R(3, 15); b = R(2, 9); if (op === '-' && a < b) { var t = a; a = b; b = t; } }
  else if (op === '/') { b = pick([2, 4, 5, 10, -2, -5, 3]); a = b * R(-9, 9); }
  else if (dec && op !== '*') { a = R(11, 99) / 10; b = R(11, 99) / 10; }
  else { a = R(-9, 15); b = R(-9, 12); if (op === '*') { a = R(-9, 9); b = R(-6, 9); } }
  if (a === 0) a = 4; if (b === 0) b = 3;
  cells[P] = a; cells[Q] = b;
  var fr = R(1, 3), F = '=' + P + op + Q; cells['D' + fr] = F;
  nums.forEach(function (k) { shown[k] = num(cells[k]); }); shown['D' + fr] = QM;
  var res = op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b;
  var s = pf(a) + ' ' + sym(op) + ' ' + pf(b) + ' = ' + fmt(res);
  var o = { theme: 'formules', grid: grid({ cols: 4, rows: 3, cells: shown }), bar: bar('D' + fr, F),
    q: 'Quelle valeur s’affiche dans la cellule <b>D' + fr + '</b> ?',
    corrige: '<p>La formule <b>' + esc(F) + '</b> prend le contenu de <b>' + P + '</b> (c’est ' + pf(a) + ') et celui de <b>' + Q + '</b> (c’est ' + pf(b) + ').</p><p>Calcul : ' + s + '.</p><p class="qz-small">Les autres cellules ne servent pas dans cette formule.</p>' };
  return numQ(o, cells, 'D' + fr, null, res);
}
function F2(L) {
  var v = pick(L === 6 ? [0, 3] : [0, 1, 2, 3]), a, b, c, F, res, expl;
  var neg = L <= 5;
  if (v === 0) { a = R(2, 12); b = R(2, 9); c = R(2, 9); if (neg && R(0, 1)) b = -b; F = '=A1+B1*C1'; res = a + b * c; expl = '<p>La multiplication est prioritaire sur l’addition : on calcule d’abord <b>B1 × C1</b> = ' + pf(b) + ' × ' + pf(c) + ' = ' + fmt(b * c) + ', puis on ajoute <b>A1</b> : ' + fmt(a) + ' + ' + pf(b * c) + ' = ' + fmt(res) + '.</p>'; }
  else if (v === 1) { a = R(2, 9); b = R(2, 9); c = R(2, 9); if (neg && R(0, 1)) a = -a; F = '=(A1+B1)*C1'; res = (a + b) * c; expl = '<p>Les parenthèses sont prioritaires : on calcule d’abord <b>A1 + B1</b> = ' + fmt(a) + ' + ' + pf(b) + ' = ' + fmt(a + b) + ', puis on multiplie par <b>C1</b> : ' + pf(a + b) + ' × ' + pf(c) + ' = ' + fmt(res) + '.</p>'; }
  else if (v === 2) { c = pick([2, 3, 4, 5]); b = c * R(1, 9); a = R(2, 20); if (neg) { a = R(-9, 20); if (R(0, 1)) b = -b; } F = '=A1-B1/C1'; res = a - b / c; expl = '<p>La division est prioritaire sur la soustraction : on calcule d’abord <b>B1 ÷ C1</b> = ' + pf(b) + ' ÷ ' + c + ' = ' + fmt(b / c) + ', puis on le retranche à <b>A1</b> : ' + fmt(a) + ' − ' + pf(b / c) + ' = ' + fmt(res) + '.</p>'; }
  else { b = R(2, 9); c = R(2, 9); a = L === 6 ? R(2, 9) : R(-9, 9); if (L === 6) { while (a * b <= c) a++; } F = '=A1*B1-C1'; res = a * b - c; expl = '<p>La multiplication est prioritaire : on calcule d’abord <b>A1 × B1</b> = ' + pf(a) + ' × ' + pf(b) + ' = ' + fmt(a * b) + ', puis on retranche <b>C1</b> : ' + fmt(a * b) + ' − ' + pf(c) + ' = ' + fmt(res) + '.</p>'; }
  if (a === 0) a = 5;
  var cells = { A1: a, B1: b, C1: c, D1: F };
  var o = { theme: 'formules', grid: grid({ cols: 4, rows: 1, cells: { A1: num(a), B1: num(b), C1: num(c), D1: QM } }), bar: bar('D1', F),
    q: 'Quelle valeur s’affiche dans la cellule <b>D1</b> ? <span class="qz-small">(attention aux priorités)</span>', corrige: expl };
  return numQ(o, cells, 'D1', null, res);
}
function F3(L) {
  var v = pick(L === 4 ? [0, 1] : [0, 1, 2, 3]), a = R(-6, 6), b = R(2, 9), F, res, expl;
  if (a === 0) a = 4;
  if (v === 0) { F = '=A1^2+B1'; res = a * a + b; expl = '<p>La puissance est prioritaire : <b>A1^2</b> est le carré de A1 : ' + pf(a) + '² = ' + fmt(a * a) + ', puis on ajoute <b>B1</b> : ' + fmt(a * a) + ' + ' + b + ' = ' + fmt(res) + '.</p>'; }
  else if (v === 1) { F = '=B1*A1^2'; res = b * a * a; expl = '<p>Le carré est calculé avant la multiplication : <b>A1^2</b> = ' + pf(a) + '² = ' + fmt(a * a) + ', puis ' + b + ' × ' + fmt(a * a) + ' = ' + fmt(res) + '.</p>'; }
  else if (v === 2) { F = '=(B1*A1)^2'; res = Math.pow(b * a, 2); expl = '<p>Les parenthèses d’abord : <b>B1 × A1</b> = ' + b + ' × ' + pf(a) + ' = ' + fmt(b * a) + ', puis on élève au carré : ' + pf(b * a) + '² = ' + fmt(res) + '.</p>'; }
  else { F = '=A1^2-B1^2'; res = a * a - b * b; expl = '<p>On calcule les deux carrés : <b>A1^2</b> = ' + pf(a) + '² = ' + fmt(a * a) + ' et <b>B1^2</b> = ' + b + '² = ' + fmt(b * b) + ', puis on soustrait : ' + fmt(a * a) + ' − ' + fmt(b * b) + ' = ' + fmt(res) + '.</p>'; }
  if (a < 0) expl += '<p class="qz-small">Le carré d’un nombre négatif est positif : ' + pf(a) + '² = ' + fmt(a * a) + '.</p>';
  var o = { theme: 'formules', grid: grid({ cols: 3, rows: 1, cells: { A1: num(a), B1: num(b), C1: QM } }), bar: bar('C1', F),
    q: 'Quelle valeur s’affiche dans la cellule <b>C1</b> ? <span class="qz-small">(« ^2 » veut dire « au carré »)</span>', corrige: expl };
  return numQ(o, { A1: a, B1: b, C1: F }, 'C1', null, res);
}
function F4(L) {
  var a = pick([40, 50, 60, 80, 120, 150, 200, 250]), b = pick([5, 10, 20, 25, 50]);
  var v = L === 5 ? 0 : pick([0, 1, 2]), F, res, expl;
  if (v === 0) { F = '=A1*B1/100'; res = a * b / 100; expl = '<p><b>A1 × B1</b> = ' + a + ' × ' + b + ' = ' + (a * b) + ', puis on divise par 100 : ' + (a * b) + ' ÷ 100 = ' + fmt(res) + '.</p><p class="qz-small">C’est « ' + b + ' % de ' + a + ' ».</p>'; }
  else if (v === 1) { F = '=A1*(1+B1/100)'; res = a * (100 + b) / 100; expl = '<p>Dans la parenthèse : <b>B1/100</b> = ' + b + ' ÷ 100 = ' + fmt(b / 100) + ', puis <b>1 + ' + fmt(b / 100) + '</b> = ' + fmt(1 + b / 100) + ' (le coefficient multiplicateur). Enfin ' + a + ' × ' + fmt(1 + b / 100) + ' = ' + fmt(res) + '.</p><p class="qz-small">Augmenter de ' + b + ' %, c’est multiplier par ' + fmt(1 + b / 100) + '.</p>'; }
  else { F = '=A1*(1-B1/100)'; res = a * (100 - b) / 100; expl = '<p>Dans la parenthèse : <b>B1/100</b> = ' + b + ' ÷ 100 = ' + fmt(b / 100) + ', puis <b>1 − ' + fmt(b / 100) + '</b> = ' + fmt(1 - b / 100) + ' (le coefficient multiplicateur). Enfin ' + a + ' × ' + fmt(1 - b / 100) + ' = ' + fmt(res) + '.</p><p class="qz-small">Diminuer de ' + b + ' %, c’est multiplier par ' + fmt(1 - b / 100) + '.</p>'; }
  var o = { theme: 'formules', grid: grid({ cols: 3, rows: 1, cells: { A1: num(a), B1: num(b), C1: QM } }), bar: bar('C1', F),
    q: 'A1 est un prix en euros et B1 un pourcentage. Quelle valeur s’affiche dans <b>C1</b> ?', corrige: expl };
  return numQ(o, { A1: a, B1: b, C1: F }, 'C1', null, res);
}
function C1(L) { /* nom d'une cellule */
  var c = R(1, 5), r = R(1, 6), good = colL(c) + r, cells = {};
  cells[good] = { t: '', c: 't' };
  var bad = [colL(c === 5 ? c - 1 : c + 1) + r, colL(c) + (r === 6 ? r - 1 : r + 1), r + colL(c), colL(r > 5 ? 5 : r) + c];
  var ch = shuffle([good].concat(bad.filter(function (x, i, a) { return x !== good && a.indexOf(x) === i; })).slice(0, 4));
  if (ch.indexOf(good) < 0) throw new Error('choix');
  return { theme: 'formules', type: 'qcm', grid: grid({ cols: 5, rows: 6, cells: cells }), bar: '',
    q: 'Quel est le nom de la cellule <b>colorée</b> ?', choices: ch, correct: ch.indexOf(good),
    corrige: '<p>La colonne s’écrit avec la <b>lettre</b> du haut : <b>' + colL(c) + '</b>. La ligne s’écrit avec le <b>numéro</b> de gauche : <b>' + r + '</b>.</p><p>Le nom d’une cellule commence par la colonne puis la ligne : <b>' + good + '</b>.</p>' };
}
function C2(L) { /* nombre de cellules d'une plage */
  var c1 = R(1, 3), r1 = R(1, 4), nc = R(2, 4), nr = R(2, 4), c2 = c1 + nc - 1, r2 = r1 + nr - 1;
  var ref = colL(c1) + r1 + ':' + colL(c2) + r2, cells = {}, ct = 0;
  for (var r = r1; r <= r2; r++) for (var c = c1; c <= c2; c++) { cells[colL(c) + r] = { t: '', c: 'g' }; ct++; }
  if (ct !== nc * nr) throw new Error('compte');
  return { theme: 'formules', type: 'num', answer: nc * nr, chk: null, grid: grid({ cols: c2 + 1, rows: r2 + 1, cells: cells }), bar: '',
    q: 'La plage <b>' + ref + '</b> est coloriée. Combien de cellules contient-elle ?',
    corrige: '<p><b>' + ref + '</b> veut dire « de ' + colL(c1) + r1 + ' à ' + colL(c2) + r2 + ' ». Elle couvre les colonnes ' + colL(c1) + ' à ' + colL(c2) + ' (<b>' + nc + '</b> colonnes) et les lignes ' + r1 + ' à ' + r2 + ' (<b>' + nr + '</b> lignes).</p><p>' + nc + ' × ' + nr + ' = <b>' + (nc * nr) + '</b> cellules.</p>' };
}

/* --- Recopier une formule --- */
/* fonctions de x utilisées en recopie et en tableau de valeurs */
function sg(n) { return n < 0 ? '-' + (-n) : '+' + n; }
function lin(k, m, ref) { return (k < 0 ? '-' : '') + (Math.abs(k) === 1 ? ref : Math.abs(k) + '*' + ref) + (m ? sg(m) : ''); }
function funcs(L) {
  var k = R(2, 9), m = R(1, 9), kk = pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]), mm = pick([-9, -7, -5, -3, -2, -1, 2, 3, 4, 6, 8]), p = pick([-4, -2, 2, 4]), q = pick([-5, -3, -1, 1, 3]);
  var o = [];
  if (L === 6) { o.push({ f: function (a) { return a + k; }, txt: function (r) { return r + '+' + k; }, step: function (a) { return pf(a) + ' + ' + k; } });
    o.push({ f: function (a) { return a * k; }, txt: function (r) { return k + '*' + r; }, step: function (a) { return k + ' × ' + pf(a); } }); }
  else if (L === 5) { o.push({ f: function (a) { return k * a + m; }, txt: function (r) { return k + '*' + r + '+' + m; }, step: function (a) { return k + ' × ' + pf(a) + ' + ' + m; } });
    o.push({ f: function (a) { return a - k; }, txt: function (r) { return r + '-' + k; }, step: function (a) { return pf(a) + ' − ' + k; } });
    o.push({ f: function (a) { return a * k; }, txt: function (r) { return r + '*' + k; }, step: function (a) { return pf(a) + ' × ' + k; } }); }
  else {
    o.push({ f: function (a) { return kk * a + mm; }, txt: function (r) { return lin(kk, mm, r); }, step: function (a) { return pf(kk) + ' × ' + pf(a) + ' ' + (mm < 0 ? '−' : '+') + ' ' + Math.abs(mm); } });
    o.push({ f: function (a) { return k * a - m; }, txt: function (r) { return k + '*' + r + '-' + m; }, step: function (a) { return k + ' × ' + pf(a) + ' − ' + m; } });
    if (L === 4) o.push({ f: function (a) { return a * a; }, txt: function (r) { return r + '^2'; }, step: function (a) { return pf(a) + '²'; } });
    if (L === 3) {
      o.push({ f: function (a) { return a * a - m; }, txt: function (r) { return r + '^2-' + m; }, step: function (a) { return pf(a) + '² − ' + m; } });
      o.push({ f: function (a) { return k * a * a; }, txt: function (r) { return k + '*' + r + '^2'; }, step: function (a) { return k + ' × ' + pf(a) + '²'; } });
      o.push({ f: function (a) { return a * a + p * a + q; }, txt: function (r) { return r + '^2' + (p < 0 ? '-' : '+') + Math.abs(p) + '*' + r + sg(q); }, step: function (a) { return pf(a) + '² ' + (p < 0 ? '−' : '+') + ' ' + Math.abs(p) + ' × ' + pf(a) + ' ' + (q < 0 ? '−' : '+') + ' ' + Math.abs(q); } });
      o.push({ f: function (a) { return k * (a + m) + mm; }, txt: function (r) { return k + '*(' + r + '+' + m + ')' + sg(mm); }, step: function (a) { return k + ' × (' + pf(a) + ' + ' + m + ') ' + (mm < 0 ? '−' : '+') + ' ' + Math.abs(mm); } });
    }
  }
  return pick(o);
}
function R1(L) { /* recopie vers le bas, valeur d'une cellule */
  var fn = funcs(L), n = R(3, 5), A = [], cells = {}, shown = {}, i;
  var lo = L <= 4 ? -6 : 1, hi = L <= 4 ? 10 : 20;
  for (i = 1; i <= 5; i++) { var v; do { v = R(lo, hi); } while (A.indexOf(v) >= 0); A.push(v); cells['A' + i] = v; shown['A' + i] = num(v); }
  var F = '=' + fn.txt('A1'); cells.B1 = F; shown.B1 = num(fn.f(A[0])); shown['B' + n] = QM;
  var tg = []; for (i = 2; i <= 5; i++) tg.push('B' + i);
  var res = fn.f(A[n - 1]), want = '=' + fn.txt('A' + n);
  if (shift(F, n - 1, 0) !== want) throw new Error('recopie ' + shift(F, n - 1, 0) + ' / ' + want);
  var o = { theme: 'recopie', grid: grid({ cols: 2, rows: 5, cells: shown }), bar: bar('B1', F),
    q: 'On écrit la formule ci-dessus en <b>B1</b>, puis on la <b>recopie vers le bas</b> jusqu’en B5. Quelle valeur s’affiche en <b>B' + n + '</b> ?',
    corrige: '<p>En descendant de ' + (n - 1) + ' ligne' + (n > 2 ? 's' : '') + ', chaque <b>A1</b> devient <b>A' + n + '</b>. La formule en B' + n + ' est donc <b>' + esc(want) + '</b>.</p><p>A' + n + ' contient ' + pf(A[n - 1]) + ', donc : ' + fn.step(A[n - 1]) + ' = <b>' + fmt(res) + '</b>.</p>' };
  return numQ(o, cells, 'B' + n, ['B1', tg], res);
}
function R2(L) { /* recopie avec deux colonnes */
  var v = pick(L === 5 ? [0, 1, 2] : [0, 1, 2, 3]), n = R(2, 4), A = [], B = [], cells = {}, shown = {}, F, f, expl, i;
  for (i = 1; i <= 4; i++) { A.push(L === 5 ? R(2, 12) : R(-5, 12)); B.push(R(2, 9)); }
  if (v === 3) { for (i = 0; i < 4; i++) { if ((A[i] + B[i]) % 2) A[i]++; } }
  for (i = 1; i <= 4; i++) { cells['A' + i] = A[i - 1]; cells['B' + i] = B[i - 1]; shown['A' + i] = num(A[i - 1]); shown['B' + i] = num(B[i - 1]); }
  if (v === 0) { F = '=A1*B1'; f = function (a, b) { return a * b; }; expl = function (a, b) { return pf(a) + ' × ' + pf(b); }; }
  else if (v === 1) { F = '=A1+B1*2'; f = function (a, b) { return a + b * 2; }; expl = function (a, b) { return pf(a) + ' + ' + pf(b) + ' × 2'; }; }
  else if (v === 2) { F = '=A1-B1'; f = function (a, b) { return a - b; }; expl = function (a, b) { return pf(a) + ' − ' + pf(b); }; }
  else { F = '=(A1+B1)/2'; f = function (a, b) { return (a + b) / 2; }; expl = function (a, b) { return '(' + pf(a) + ' + ' + pf(b) + ') ÷ 2'; }; }
  cells.C1 = F; shown.C1 = num(f(A[0], B[0])); shown['C' + n] = QM;
  var tg = []; for (i = 2; i <= 4; i++) tg.push('C' + i);
  var res = f(A[n - 1], B[n - 1]);
  var o = { theme: 'recopie', grid: grid({ cols: 3, rows: 4, cells: shown }), bar: bar('C1', F),
    q: 'On écrit cette formule en <b>C1</b> puis on la <b>recopie vers le bas</b> jusqu’en C4. Quelle valeur s’affiche en <b>C' + n + '</b> ?',
    corrige: '<p>Vers le bas, les numéros de ligne augmentent : en C' + n + ', la formule devient <b>' + esc(F.replace(/1/g, String(n))) + '</b> (elle lit A' + n + ' et B' + n + ').</p><p>A' + n + ' = ' + pf(A[n - 1]) + ' et B' + n + ' = ' + pf(B[n - 1]) + ', donc : ' + expl(A[n - 1], B[n - 1]) + ' = <b>' + fmt(res) + '</b>.</p>' };
  if (F.replace(/1/g, String(n)) !== shift(F, n - 1, 0)) throw new Error('recopie');
  return numQ(o, cells, 'C' + n, ['C1', tg], res);
}
function R3(L) { /* QCM : quelle formule après recopie ? */
  var v = L === 6 ? 0 : pick(L <= 4 ? [0, 1, 2] : [0, 1]), k = R(2, 9), F, want, dr, dc, ref, where, bad, cells = {}, rows, cols, from, tag;
  if (v === 0) { var n = R(3, 6); F = '=A1*' + k; dr = n - 1; dc = 0; ref = 'B' + n; want = '=A' + n + '*' + k; from = 'B1';
    where = 'On écrit <b>' + F + '</b> en <b>B1</b> puis on la <b>recopie vers le bas</b>. Quelle formule trouve-t-on en <b>' + ref + '</b> ?';
    bad = ['=A1*' + k, '=A' + (n - 1) + '*' + k, '=A' + (n + 1) + '*' + k, '=A' + n + '*' + (k + n - 1)]; rows = n; cols = 2; tag = 'ligne'; }
  else if (v === 1) { var d = R(2, 4), cc = colL(1 + d + 1); F = '=A1+' + k; dr = 0; dc = d; ref = cc + '1'; from = 'B1'; want = '=' + colL(1 + d) + '1+' + k;
    where = 'On écrit <b>' + F + '</b> en <b>B1</b> puis on la <b>recopie vers la droite</b>. Quelle formule trouve-t-on en <b>' + ref + '</b> ?';
    bad = ['=A1+' + k, '=' + colL(2 + d) + '1+' + k, '=' + colL(d) + '1+' + k, '=A1+' + (k + d)]; rows = 1; cols = d + 2; tag = 'colonne'; }
  else { var d2 = R(1, 3), e = R(1, 3); F = '=A1*' + k; dr = e; dc = d2; from = 'B2'; F = '=A1*' + k; ref = colL(2 + d2) + (2 + e);
    want = '=' + colL(1 + d2) + (1 + e) + '*' + k;
    where = 'On écrit <b>' + F + '</b> en <b>B2</b> puis on la recopie vers le bas <b>et</b> vers la droite, jusqu’en <b>' + ref + '</b>. Quelle formule trouve-t-on en <b>' + ref + '</b> ?';
    bad = ['=A1*' + k, '=' + colL(1 + d2) + '1*' + k, '=A' + (1 + e) + '*' + k, '=' + colL(2 + d2) + (2 + e) + '*' + k]; rows = 2 + e; cols = 2 + d2; tag = 'les deux'; }
  var got = shift(F, dr, dc); if (got !== want) throw new Error('recopie ' + got + ' / ' + want);
  var ch = shuffle([want].concat(bad.filter(function (x, i, a) { return x !== want && a.indexOf(x) === i; })).slice(0, 4));
  if (ch.indexOf(want) < 0 || ch.length < 3) throw new Error('choix');
  ch[ch.findIndex(function (x) { return x !== want; })] = want.slice(1); /* oubli du « = » */
  var shown = {}; shown[from] = fcell(F); shown[ref] = QM;
  var expl;
  if (v === 0) expl = '<p>Vers le bas, la <b>ligne</b> de chaque référence augmente de ' + dr + ' : <b>A1</b> devient <b>A' + (1 + dr) + '</b>. Le nombre ' + k + ' ne change pas.</p>';
  else if (v === 1) expl = '<p>Vers la droite, la <b>colonne</b> de chaque référence avance de ' + dc + ' lettre' + (dc > 1 ? 's' : '') + ' : <b>A1</b> devient <b>' + colL(1 + dc) + '1</b>. Le nombre ' + k + ' ne change pas.</p>';
  else expl = '<p>On descend de ' + dr + ' ligne' + (dr > 1 ? 's' : '') + ' et on avance de ' + dc + ' colonne' + (dc > 1 ? 's' : '') + ' : <b>A1</b> devient <b>' + colL(1 + dc) + (1 + dr) + '</b>. Le nombre ' + k + ' ne change pas.</p>';
  return { theme: 'recopie', type: 'qcm', grid: grid({ cols: cols, rows: rows, cells: shown }), bar: '', q: where, choices: ch, correct: ch.indexOf(want),
    corrige: expl + '<p>En ' + ref + ', on trouve donc <b>' + esc(want) + '</b>.</p><p class="qz-small">Une formule commence toujours par <b>=</b> : sans ce signe, le tableur prend la saisie pour du texte et ne calcule rien.</p>' };
}
function R4(L) { /* référence absolue : valeur après recopie */
  var rate = pick([2, 3, 4, 5, 10, 1.5, 2.5]), n = R(2, 4), A = [], cells = { D1: rate }, shown = { D1: num(rate) }, i, forget = R(0, 1) === 1;
  for (i = 1; i <= 4; i++) { A.push(R(2, 20) * 2); cells['A' + i] = A[i - 1]; shown['A' + i] = num(A[i - 1]); }
  shown.A5 = null; delete shown.A5;
  var F = forget ? '=A1*D1' : '=A1*$D$1'; cells.B1 = F; shown.B1 = num(A[0] * rate); shown['B' + n] = QM;
  var tg = []; for (i = 2; i <= 4; i++) tg.push('B' + i);
  var res = forget ? A[n - 1] * 0 : A[n - 1] * rate, expl;
  if (forget) expl = '<p>Sans <b>$</b>, la référence <b>D1</b> « descend » avec la recopie : en B' + n + ' la formule devient <b>=A' + n + '*D' + n + '</b>.</p><p>La cellule <b>D' + n + '</b> est vide : un tableur la lit comme 0, donc ' + fmt(A[n - 1]) + ' × 0 = <b>0</b>.</p><p class="qz-small">Pour garder D1, il faut écrire <b>$D$1</b>.</p>';
  else expl = '<p>Avec <b>$D$1</b>, la référence est <b>bloquée</b> : elle ne bouge pas à la recopie. En B' + n + ' la formule devient <b>=A' + n + '*$D$1</b>.</p><p>A' + n + ' = ' + fmt(A[n - 1]) + ' et D1 = ' + fmt(rate) + ', donc ' + fmt(A[n - 1]) + ' × ' + fmt(rate) + ' = <b>' + fmt(res) + '</b>.</p>';
  var o = { theme: 'recopie', grid: grid({ cols: 4, rows: 4, cells: shown }), bar: bar('B1', F),
    q: 'D1 contient un coefficient. On écrit la formule en <b>B1</b> puis on la <b>recopie vers le bas</b> jusqu’en B4. Quelle valeur s’affiche en <b>B' + n + '</b> ?', corrige: expl };
  return numQ(o, cells, 'B' + n, ['B1', tg], res);
}
function R5(L) { /* QCM : quelle formule écrire pour pouvoir recopier ? */
  var rate = pick([2, 3, 5, 10]), A = [R(2, 9), R(2, 9), R(2, 9), R(2, 9)], cells = { D1: rate }, shown = { D1: num(rate) }, i;
  for (i = 1; i <= 4; i++) { cells['A' + i] = A[i - 1]; shown['A' + i] = num(A[i - 1]); }
  var good = '=A1*$D$1', ch = ['=A1*$D$1', '=A1*D1', '=$A$1*D1', '=$A$1*$D$1'];
  var tg = ['B2', 'B3', 'B4'], okc = ch.map(function (f) {
    var c = {}; Object.keys(cells).forEach(function (k) { c[k] = cells[k]; }); c.B1 = f;
    return [1, 2, 3, 4].every(function (r) { return tryValue(c, 'B' + r, ['B1', tg]) !== null && same(tryValue(c, 'B' + r, ['B1', tg]), A[r - 1] * rate); });
  });
  if (okc.filter(Boolean).length !== 1 || !okc[0]) throw new Error('unicité');
  ch[ch.findIndex(function (x) { return x !== good; })] = good.slice(1); /* oubli du « = » */
  ch = shuffle(ch); shown.B1 = QM;
  return { theme: 'recopie', type: 'qcm', grid: grid({ cols: 4, rows: 4, cells: shown }), bar: '',
    q: 'On veut calculer en colonne B le produit de chaque nombre de la colonne A par le coefficient de <b>D1</b>. On écrit une formule en <b>B1</b> puis on la recopie vers le bas. Laquelle faut-il écrire ?',
    choices: ch, correct: ch.indexOf(good),
    corrige: '<p>Il faut que <b>A1</b> devienne A2, A3, A4… (elle doit <b>descendre</b>) mais que <b>D1</b> reste <b>D1</b> (elle doit être <b>bloquée</b> avec des $ : <b>$D$1</b>).</p><p>La bonne formule est <b>=A1*$D$1</b>.</p><p class="qz-small">Avec =A1*D1, la ligne de D change : D2, D3… sont vides. Avec $A$1, c’est A1 qui est bloquée : on ne calcule que le premier nombre.</p><p class="qz-small">Une formule commence toujours par <b>=</b> : sans ce signe, le tableur prend la saisie pour du texte et ne calcule rien.</p>' };
}

/* --- SOMME, MOYENNE, MEDIANE… --- */
function vals(n, lo, hi, distinct) { var a = []; while (a.length < n) { var v = R(lo, hi); if (distinct && a.indexOf(v) >= 0) continue; a.push(v); } return a; }
function colCells(a, extra) { var s = {}; a.forEach(function (v, i) { s['A' + (i + 1)] = num(v); }); Object.keys(extra || {}).forEach(function (k) { s[k] = extra[k]; }); return s; }
function colData(a) { var c = {}; a.forEach(function (v, i) { c['A' + (i + 1)] = v; }); return c; }
function S1(L) {
  var n = R(5, 6), a = vals(n, L <= 4 ? -9 : 1, L <= 4 ? 15 : 20), lo = R(1, 2), hi = R(n - 1, n), full = R(0, 1) === 1;
  if (full) { lo = 1; hi = n; } if (hi - lo < 2) { lo = 1; hi = n; }
  var rg = 'A' + lo + ':A' + hi, F = '=SOMME(' + rg + ')', sel = a.slice(lo - 1, hi), res = sel.reduce(function (s, x) { return s + x; }, 0);
  var cells = colData(a); cells['A' + (n + 1)] = F;
  var sh = colCells(a, {}); for (var i = lo; i <= hi; i++) sh['A' + i] = { t: fmt(a[i - 1]), c: 'g' }; sh['A' + (n + 1)] = QM;
  var o = { theme: 'fonctions', grid: grid({ cols: 1, rows: n + 1, cells: sh }), bar: bar('A' + (n + 1), F),
    q: 'Quelle valeur s’affiche dans la cellule <b>A' + (n + 1) + '</b> ?',
    corrige: '<p><b>' + rg + '</b> veut dire « de A' + lo + ' à A' + hi + ' » : ' + sel.length + ' cellules (colorées). <b>SOMME</b> les additionne.</p><p>' + sel.map(pf).join(' + ') + ' = <b>' + fmt(res) + '</b>.</p>' };
  return numQ(o, cells, 'A' + (n + 1), null, res);
}
function S2(L) {
  var n = R(4, 6), a = vals(n - 1, L <= 4 ? -5 : 2, 20), m = pick([3, 4, 5, 6, 7, 8, 10, 12, 15]), s = a.reduce(function (x, y) { return x + y; }, 0), last = m * n - s;
  if (last < (L <= 4 ? -9 : 0)) throw new Error('dernier'); a.push(last); a = shuffle(a);
  var F = '=MOYENNE(A1:A' + n + ')', cells = colData(a); cells['A' + (n + 1)] = F;
  var o = { theme: 'fonctions', grid: grid({ cols: 1, rows: n + 1, cells: colCells(a, { ['A' + (n + 1)]: QM }) }), bar: bar('A' + (n + 1), F),
    q: 'Quelle valeur s’affiche dans la cellule <b>A' + (n + 1) + '</b> ?',
    corrige: '<p><b>MOYENNE</b> additionne les ' + n + ' valeurs puis divise par ' + n + '.</p><p>Somme : ' + a.map(pf).join(' + ') + ' = ' + fmt(m * n) + '.</p><p>Moyenne : ' + fmt(m * n) + ' ÷ ' + n + ' = <b>' + fmt(m) + '</b>.</p>' };
  return numQ(o, cells, 'A' + (n + 1), null, m);
}
function S3(L) {
  var n = L === 4 ? pick([5, 7]) : pick([5, 6, 7, 8]), a = vals(n, 1, 30, true), F = '=MEDIANE(A1:A' + n + ')', s = a.slice().sort(function (x, y) { return x - y; });
  var cells = colData(a); cells['A' + (n + 1)] = F;
  /* calcul direct : la médiane est la valeur qui a autant de valeurs en dessous qu'au-dessus (n impair) ; sinon la moitié de la somme des deux centrales */
  var res, expl;
  var rank = function (v) { return a.filter(function (x) { return x < v; }).length; };
  if (n % 2) { res = a.filter(function (v) { return rank(v) === (n - 1) / 2; })[0]; expl = '<p>On range les valeurs dans l’ordre croissant : ' + s.join(' ; ') + '.</p><p>Il y a ' + n + ' valeurs (nombre impair) : la médiane est la valeur du milieu, la <b>' + ((n + 1) / 2) + 'ᵉ</b> : <b>' + fmt(res) + '</b>.</p><p class="qz-small">' + (n - 1) / 2 + ' valeurs sont avant, ' + (n - 1) / 2 + ' après.</p>'; }
  else { var lo = a.filter(function (v) { return rank(v) === n / 2 - 1; })[0], hi = a.filter(function (v) { return rank(v) === n / 2; })[0]; res = (lo + hi) / 2; expl = '<p>On range les valeurs dans l’ordre croissant : ' + s.join(' ; ') + '.</p><p>Il y a ' + n + ' valeurs (nombre pair) : la médiane est la <b>moyenne des deux valeurs du milieu</b> (la ' + (n / 2) + 'ᵉ et la ' + (n / 2 + 1) + 'ᵉ) : (' + fmt(lo) + ' + ' + fmt(hi) + ') ÷ 2 = <b>' + fmt(res) + '</b>.</p>'; }
  var o = { theme: 'fonctions', grid: grid({ cols: 1, rows: n + 1, cells: colCells(a, { ['A' + (n + 1)]: QM }) }), bar: bar('A' + (n + 1), F),
    q: 'Les valeurs ne sont pas rangées. Quelle valeur s’affiche dans la cellule <b>A' + (n + 1) + '</b> ?', corrige: expl };
  return numQ(o, cells, 'A' + (n + 1), null, res);
}
function S4(L) {
  var n = R(5, 6), a = vals(n, L <= 4 ? -9 : 1, L <= 4 ? 25 : 30, true), v = L <= 4 ? R(0, 2) : R(0, 1), F, res, expl, cells = colData(a), z = 'A' + (n + 1);
  var mx = Math.max.apply(null, a), mn = Math.min.apply(null, a);
  if (v === 0) { F = '=MAX(A1:A' + n + ')'; res = mx; expl = '<p><b>MAX</b> donne la plus grande valeur de la plage A1:A' + n + ' : parmi ' + a.map(pf).join(' ; ') + ', c’est <b>' + fmt(res) + '</b>.</p>'; }
  else if (v === 1) { F = '=MIN(A1:A' + n + ')'; res = mn; expl = '<p><b>MIN</b> donne la plus petite valeur de la plage A1:A' + n + ' : parmi ' + a.map(pf).join(' ; ') + ', c’est <b>' + fmt(res) + '</b>.</p>'; }
  else { F = '=MAX(A1:A' + n + ')-MIN(A1:A' + n + ')'; res = mx - mn; expl = '<p>Le plus grand nombre (<b>MAX</b>) est ' + fmt(mx) + ' et le plus petit (<b>MIN</b>) est ' + pf(mn) + '.</p><p>La formule les soustrait : ' + fmt(mx) + ' − ' + pf(mn) + ' = <b>' + fmt(res) + '</b>.</p><p class="qz-small">C’est l’étendue de la série.</p>'; }
  cells[z] = F;
  var o = { theme: 'fonctions', grid: grid({ cols: 1, rows: n + 1, cells: colCells(a, { [z]: QM }) }), bar: bar(z, F), q: 'Quelle valeur s’affiche dans la cellule <b>' + z + '</b> ?', corrige: expl };
  return numQ(o, cells, z, null, res);
}
function S5(L) { /* « ; » ou « : » */
  var n = 6, a = vals(n, 2, 25), fn = L === 6 ? 'SOMME' : pick(['SOMME', 'MOYENNE']), v = pick(L <= 4 ? [0, 1, 2] : [0, 1]), F, idx, expl, cells = colData(a), z = 'C1', sh = colCells(a, {});
  var ps = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 3).sort(function (x, y) { return x - y; });
  if (v === 0) { idx = ps; F = '=' + fn + '(' + ps.map(function (i) { return 'A' + i; }).join(';') + ')'; }
  else if (v === 1) { var s = R(1, 4), e = s + R(1, 2); idx = []; for (var i = s; i <= e; i++) idx.push(i); F = '=' + fn + '(A' + s + ':A' + e + ')'; }
  else { var s2 = R(1, 3), e2 = s2 + 1; idx = [s2, e2, 6]; if (e2 >= 5) throw new Error('chevauche'); F = '=' + fn + '(A' + s2 + ':A' + e2 + ';A6)'; }
  var sel = idx.map(function (i) { return a[i - 1]; }), tot = sel.reduce(function (x, y) { return x + y; }, 0), res = fn === 'SOMME' ? tot : tot / sel.length;
  if (fn === 'MOYENNE') { if (Math.round(res * 10) / 10 !== res) { /* on veut un résultat simple */ var adj = sel.length - (tot % sel.length); throw new Error('moyenne non simple'); } }
  cells[z] = F; idx.forEach(function (i) { sh['A' + i] = { t: fmt(a[i - 1]), c: 'g' }; }); sh[z] = QM;
  var lisible = v === 0 ? 'le point-virgule « ; » sépare des cellules <b>isolées</b> : ' + idx.map(function (i) { return 'A' + i; }).join(', ') + ' (seulement ces ' + idx.length + ' cellules)'
    : v === 1 ? 'les deux-points « : » désignent <b>toutes</b> les cellules <b>de A' + idx[0] + ' à A' + idx[idx.length - 1] + '</b> (' + idx.length + ' cellules)'
    : '« A' + idx[0] + ':A' + idx[1] + ' » désigne les cellules de A' + idx[0] + ' à A' + idx[1] + ', et le « ; » ajoute la cellule isolée A6 : ' + idx.length + ' cellules en tout';
  expl = '<p>Dans cette formule, ' + lisible + ' (en couleur sur la feuille).</p><p>Valeurs : ' + sel.map(pf).join(' ; ') + '.</p>' + (fn === 'SOMME' ? '<p>' + sel.map(pf).join(' + ') + ' = <b>' + fmt(res) + '</b>.</p>' : '<p>Somme : ' + sel.map(pf).join(' + ') + ' = ' + fmt(tot) + ', puis ' + fmt(tot) + ' ÷ ' + sel.length + ' = <b>' + fmt(res) + '</b>.</p>');
  var o = { theme: 'fonctions', grid: grid({ cols: 3, rows: n, cells: sh }), bar: bar(z, F), q: 'Quelle valeur s’affiche dans la cellule <b>C1</b> ?', corrige: expl };
  return numQ(o, cells, z, null, res);
}

/* --- Listes et fonctions --- */
function L1(L) { /* liste obtenue par incrémentation */
  var v = L === 6 ? 0 : pick(L === 5 ? [0, 1, 2] : [0, 1, 2, 3]), a0, k, F, n = R(5, 8), f, cells, expl, res, name;
  if (v === 0) { a0 = R(0, 20); k = R(2, 9); F = '=A1+' + k; res = a0 + k * (n - 1); expl = 'Chaque cellule vaut la précédente <b>+ ' + k + '</b> : on ajoute ' + k + ' à chaque ligne.<br>Pour passer de A1 à A' + n + ', on ajoute ' + (n - 1) + ' fois ' + k + ' : ' + a0 + ' + ' + (n - 1) + ' × ' + k + ' = <b>' + fmt(res) + '</b>.'; }
  else if (v === 1) { a0 = R(60, 120); k = R(3, 9); F = '=A1-' + k; res = a0 - k * (n - 1); expl = 'Chaque cellule vaut la précédente <b>− ' + k + '</b>.<br>De A1 à A' + n + ', on retranche ' + (n - 1) + ' fois ' + k + ' : ' + a0 + ' − ' + (n - 1) + ' × ' + k + ' = <b>' + fmt(res) + '</b>.'; }
  else if (v === 2) { a0 = R(1, 5); k = pick([2, 3]); n = R(4, 6); F = '=A1*' + k; res = a0 * Math.pow(k, n - 1); expl = 'Chaque cellule vaut la précédente <b>× ' + k + '</b>.<br>On multiplie ' + (n - 1) + ' fois par ' + k + ' : ' + a0 + (new Array(n).join(' × ' + k)) + ' = <b>' + fmt(res) + '</b>.'; }
  else { a0 = R(-9, 0); k = R(2, 6); F = '=A1+' + k; res = a0 + k * (n - 1); expl = 'Chaque cellule vaut la précédente <b>+ ' + k + '</b>.<br>De A1 à A' + n + ', on ajoute ' + (n - 1) + ' fois ' + k + ' : ' + fmt(a0) + ' + ' + (n - 1) + ' × ' + k + ' = <b>' + fmt(res) + '</b>.'; }
  cells = { A1: a0, A2: F.replace('A1', 'A1') }; /* la formule est écrite en A2 */
  var tg = []; for (var i = 3; i <= n; i++) tg.push('A' + i);
  var sh = { A1: num(a0), A2: num(v === 2 ? a0 * k : v === 1 ? a0 - k : a0 + k) }; sh['A' + n] = QM;
  var o = { theme: 'listes', grid: grid({ cols: 1, rows: n, cells: sh }), bar: bar('A2', F),
    q: 'On écrit <b>' + F + '</b> en <b>A2</b> puis on la recopie vers le bas jusqu’en A' + n + '. Quelle valeur s’affiche en <b>A' + n + '</b> ?', corrige: '<p>' + expl + '</p>' };
  return numQ(o, cells, 'A' + n, ['A2', tg], res);
}
function L2(L) { /* tableau de valeurs d'une fonction */
  var fn = funcs(L), x0 = L <= 4 ? -3 : (L === 5 ? 0 : 1), cells = { A1: 'x', B1: 'f(x)' }, sh = { A1: { t: 'x', c: 'h' }, B1: { t: 'f(x)', c: 'h' } }, i;
  var X = []; for (i = 0; i < 6; i++) X.push(x0 + i);
  X.forEach(function (x, j) { cells['A' + (j + 2)] = x; sh['A' + (j + 2)] = num(x); });
  var F = '=' + fn.txt('A2'); cells.B2 = F; sh.B2 = num(fn.f(X[0]));
  var n = R(3, 7); sh['B' + n] = QM; var tg = []; for (i = 3; i <= 7; i++) tg.push('B' + i);
  var want = '=' + fn.txt('A' + n); if (shift(F, n - 2, 0) !== want) throw new Error('recopie');
  var x = X[n - 2], res = fn.f(x);
  var o = { theme: 'listes', grid: grid({ cols: 2, rows: 7, cells: sh }), bar: bar('B2', F),
    q: 'La colonne A contient des valeurs de <b>x</b>. On écrit la formule en <b>B2</b> puis on la recopie vers le bas jusqu’en B7. Quelle valeur s’affiche en <b>B' + n + '</b> ?',
    corrige: '<p>En B' + n + ', la formule recopiée est <b>' + esc(want) + '</b> : elle lit la cellule A' + n + ', qui contient x = ' + pf(x) + '.</p><p>' + fn.step(x) + ' = <b>' + fmt(res) + '</b>.</p>' };
  /* les cellules texte A1, B1 ne sont pas dans les formules */
  var c2 = {}; Object.keys(cells).forEach(function (k) { if (k !== 'A1' && k !== 'B1') c2[k] = cells[k]; });
  return numQ(o, c2, 'B' + n, ['B2', tg], res);
}
function L3(L) { /* QCM : quelle formule calcule f(x) ? */
  var kinds = L === 5 ? [0] : L === 4 ? [0, 1] : [0, 1, 2], v = pick(kinds), fx, txt, ch, good, f, k, m;
  if (v === 0) { k = R(2, 9); m = pick(L === 5 ? [2, 3, 4, 5, 7] : [-7, -5, -3, -2, 2, 4, 6]); f = function (x) { return k * x + m; };
    txt = 'f(x) = ' + k + 'x ' + (m < 0 ? '−' : '+') + ' ' + Math.abs(m); good = '=' + k + '*A2' + sg(m);
    ch = [good, '=' + k + 'A2' + sg(m), '=' + k + '*A2' + sg(-m), '=' + k + '*(A2' + sg(m) + ')']; }
  else if (v === 1) { m = R(2, 9); k = pick([2, 3, 4]); f = function (x) { return x * x - k * x - m; }; txt = 'f(x) = x² − ' + k + 'x − ' + m;
    good = '=A2^2-' + k + '*A2-' + m; ch = [good, '=A2^2-' + k + 'A2-' + m, '=A2*2-' + k + '*A2-' + m, '=2^A2-' + k + '*A2-' + m]; }
  else { k = R(2, 5); m = R(1, 6); var p = R(1, 5); f = function (x) { return k * (x + m) - p; }; txt = 'f(x) = ' + k + '(x + ' + m + ') − ' + p;
    good = '=' + k + '*(A2+' + m + ')-' + p; ch = [good, '=' + k + '(A2+' + m + ')-' + p, '=' + k + '*A2+' + m + '-' + p, '=(' + k + '*A2+' + m + ')-' + p]; }
  var oks = ch.map(function (F) { return [-3, -1, 0, 2, 5, 7].every(function (x) { var r = tryValue({ A2: x, B2: F }, 'B2'); return r !== null && same(r, f(x)); }); });
  if (oks.filter(Boolean).length !== 1 || !oks[0]) throw new Error('unicité');
  var chk2 = v === 0 ? k + ' × 2 ' + (m < 0 ? '−' : '+') + ' ' + Math.abs(m) : v === 1 ? '2² − ' + k + ' × 2 − ' + m : k + ' × (2 + ' + m + ') − ' + p;
  ch[ch.findIndex(function (x) { return x !== good; })] = good.slice(1); /* oubli du « = » */
  var shuf = shuffle(ch);
  var bads = '<p class="qz-small">' + (v === 0 ? 'Un tableur ne comprend pas « ' + k + 'A2 » : il faut écrire le signe × avec <b>*</b>. Changer le signe de ' + Math.abs(m) + ' ou mettre le ' + Math.abs(m) + ' dans une parenthèse donne une autre fonction.' : v === 1 ? 'Il faut écrire <b>*</b> pour multiplier, et « ^2 » pour le carré : A2*2 est le double de x, pas son carré.' : 'Pour multiplier ' + k + ' par la parenthèse il faut écrire <b>*</b> devant, et la parenthèse doit contenir x + ' + m + ' : distribuer ou non change le résultat.') + '</p>';
  return { theme: 'listes', type: 'qcm', grid: grid({ cols: 2, rows: 3, cells: { A1: { t: 'x', c: 'h' }, B1: { t: 'f(x)', c: 'h' }, A2: num(2), B2: QM } }), bar: '',
    q: 'On veut calculer <b>' + txt + '</b>. La cellule <b>A2</b> contient la valeur de x. Quelle formule faut-il écrire en <b>B2</b> ?', choices: shuf, correct: shuf.indexOf(good),
    corrige: '<p>La bonne formule est <b>' + esc(good) + '</b>.</p><p>Vérification avec x = 2 : ' + chk2 + ' = ' + fmt(f(2)) + ', et la formule donne la même valeur.</p>' + bads + '<p class="qz-small">Une formule commence toujours par <b>=</b> : sans ce signe, le tableur prend la saisie pour du texte et ne calcule rien.</p>' };
}

var THEMES = [
  { id: 'formules', nom: 'Cellules et formules', tpl: [
    { id: 'F1', niv: [0, 1, 2, 3], gen: F1 }, { id: 'F2', niv: [0, 1, 2, 3], gen: F2 }, { id: 'F3', niv: [2, 3], gen: F3 },
    { id: 'F4', niv: [1, 2, 3], gen: F4 }, { id: 'C1', niv: [0, 1], gen: C1 }, { id: 'C2', niv: [0, 1, 2], gen: C2 }] },
  { id: 'recopie', nom: 'Recopier une formule', tpl: [
    { id: 'R1', niv: [0, 1, 2, 3], gen: R1 }, { id: 'R2', niv: [1, 2, 3], gen: R2 }, { id: 'R3', niv: [0, 1, 2, 3], gen: R3 },
    { id: 'R4', niv: [2, 3], gen: R4 }, { id: 'R5', niv: [2, 3], gen: R5 }] },
  { id: 'fonctions', nom: 'SOMME, MOYENNE, MEDIANE…', tpl: [
    { id: 'S1', niv: [0, 1, 2, 3], gen: S1 }, { id: 'S2', niv: [1, 2, 3], gen: S2 }, { id: 'S3', niv: [2, 3], gen: S3 },
    { id: 'S4', niv: [0, 1, 2, 3], gen: S4 }, { id: 'S5', niv: [0, 1, 2, 3], gen: S5 }] },
  { id: 'listes', nom: 'Listes et fonctions f(x)', tpl: [
    { id: 'L1', niv: [0, 1, 2, 3], gen: L1 }, { id: 'L2', niv: [0, 1, 2, 3], gen: L2 }, { id: 'L3', niv: [1, 2, 3], gen: L3 }] }
];
/* L : 0 = 6e, 1 = 5e, 2 = 4e, 3 = 3e. Les modèles ci-dessus attendent 6, 5, 4, 3 : on convertit. */
var NIVNUM = [6, 5, 4, 3];
function one(theme, L, last) {
  var th = THEMES.filter(function (t) { return t.id === theme; })[0];
  var ok = th.tpl.filter(function (t) { return t.niv.indexOf(L) >= 0; });
  var cand = ok.filter(function (t) { return t.id !== last; }); if (!cand.length) cand = ok;
  for (var i = 0; i < 200; i++) {
    var t = pick(cand);
    try { var q = t.gen(NIVNUM[L]); q.theme = theme; q.tpl = t.id; q.niveau = L; return q; } catch (e) { /* mauvais tirage : on recommence */ }
  }
  throw new Error('aucune question pour ' + theme);
}
function generate(L, themes, n) {
  n = n || 10;
  var order = [], pool = [];
  while (order.length < n) { if (!pool.length) pool = shuffle(themes); order.push(pool.pop()); }
  var out = [], seen = {}, lastTpl = {};
  order.forEach(function (th) {
    for (var t = 0; t < 40; t++) {
      var q = one(th, L, lastTpl[th]), key = q.grid + '|' + q.bar + '|' + q.q;
      if (!seen[key]) { seen[key] = 1; lastTpl[th] = q.tpl; out.push(q); return; }
    }
    out.push(one(th, L));
  });
  return out;
}
function parseNum(s) {
  s = String(s).trim().replace(/\s/g, '').replace(/[−–]/g, '-').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return parseFloat(s);
}
function verify(q, rep) {
  if (q.type === 'qcm') return rep === q.correct;
  var v = parseNum(rep); return !isNaN(v) && Math.abs(v - q.answer) < 1e-6;
}
var API = { generate: generate, THEMES: THEMES, verify: verify, parseNum: parseNum, fmt: fmt, one: one, value: value, shift: shift, tryValue: tryValue };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.GiroQuizTab = API;
})(typeof window !== 'undefined' ? window : this);
