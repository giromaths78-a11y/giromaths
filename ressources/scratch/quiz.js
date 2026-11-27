/* Quiz Scratch GiroMaths : « Que fait ce programme ? »
   Chaque programme est décrit par une petite structure (arbre) qui sert à la fois
   à dessiner les blocs (syntaxe scratchblocks) ET à calculer la bonne réponse :
   l'énoncé et le corrigé ne peuvent donc pas se contredire. */
(function (root) {
'use strict';
var R = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
var pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = R(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
var rnd = function (v) { return Math.round(v * 1e9) / 1e9; };
function fmt(v) { return String(rnd(v)).replace('.', ',').replace('-', '−'); }
function pf(v) { return v < 0 ? '(' + fmt(v) + ')' : fmt(v); }
function lit(v) { return String(rnd(v)); }
function uniq(a) { var s = {}, o = []; a.forEach(function (x) { if (!s[x]) { s[x] = 1; o.push(x); } }); return o; }

/* ---------- expressions ---------- */
function ex(e) {
  if (typeof e === 'number') return '(' + lit(e) + ')';
  if (typeof e === 'string') return '(' + e + ')';
  var op = e[0] === 'mod' ? 'modulo' : e[0];
  return '(' + ex(e[1]) + ' ' + op + ' ' + ex(e[2]) + ')';
}
function cx(c) {
  if (c[0] === 'and') return '<' + cx(c[1]) + ' et ' + cx(c[2]) + '>';
  return '<' + ex(c[1]) + ' ' + c[0] + ' ' + ex(c[2]) + '>';
}
function ev(e, env) {
  if (typeof e === 'number') return e;
  if (typeof e === 'string') { var v = e === 'réponse' ? env.ans : env.v[e]; if (v === undefined) throw new Error('variable ' + e); return v; }
  var a = ev(e[1], env), b = ev(e[2], env);
  switch (e[0]) {
    case '+': return rnd(a + b); case '-': return rnd(a - b); case '*': return rnd(a * b);
    case '/': return rnd(a / b); case 'mod': return ((a % b) + b) % b;
  }
  throw new Error('op');
}
function cv(c, env) {
  if (c[0] === 'and') return cv(c[1], env) && cv(c[2], env);
  var a = ev(c[1], env), b = ev(c[2], env);
  return c[0] === '<' ? a < b : c[0] === '>' ? a > b : a === b;
}

/* ---------- rendu en blocs ---------- */
function rs(list) {
  var o = [];
  list.forEach(function (s) {
    switch (s[0]) {
      case 'ask': o.push('demander [' + s[1] + '] et attendre'); break;
      case 'set': o.push('mettre [' + s[1] + ' v] à ' + ex(s[2])); break;
      case 'add': o.push('ajouter ' + ex(s[2]) + ' à [' + s[1] + ' v]'); break;
      case 'say': o.push('dire ' + ex(s[1])); break;
      case 'sayf': o.push('dire ' + ex(s[1]) + ' pendant (1) secondes'); break;
      case 'sayt': o.push('dire [' + s[1] + ']'); break;
      case 'rep': o.push('répéter ' + ex(s[1]) + ' fois'); o = o.concat(rs(s[2])); o.push('fin'); break;
      case 'until': o.push("répéter jusqu'à ce que " + cx(s[1])); o = o.concat(rs(s[2])); o.push('fin'); break;
      case 'if': o.push('si ' + cx(s[1]) + ' alors'); o = o.concat(rs(s[2]));
        if (s[3]) { o.push('sinon'); o = o.concat(rs(s[3])); } o.push('fin'); break;
      case 'clear': o.push('effacer tout'); break;
      case 'goto': o.push('aller à x: ' + ex(s[1]) + ' y: ' + ex(s[2])); break;
      case 'pt': o.push("s'orienter à " + ex(s[1])); break;
      case 'pd': o.push("stylo en position d'écriture"); break;
      case 'pu': o.push('relever le stylo'); break;
      case 'mv': o.push('avancer de ' + ex(s[1]) + ' pas'); break;
      case 'tr': o.push('tourner @turnRight de ' + ex(s[1]) + ' degrés'); break;
      case 'tl': o.push('tourner @turnLeft de ' + ex(s[1]) + ' degrés'); break;
      default: throw new Error('stmt ' + s[0]);
    }
  });
  return o;
}
function text(prog) { return ['quand @greenFlag est cliqué'].concat(rs(prog)).join('\n'); }

/* ---------- exécution ---------- */
function snap(env) { return Object.keys(env.v).map(function (k) { return k + ' = ' + fmt(env.v[k]); }).join(' ; '); }
function exec(list, env) {
  list.forEach(function (s) {
    if (++env.steps > 4000) throw new Error('trop long');
    switch (s[0]) {
      case 'ask': if (!env.inp.length) throw new Error('entrée manquante'); env.ans = env.inp.shift(); break;
      case 'set': env.v[s[1]] = ev(s[2], env); break;
      case 'add': env.v[s[1]] = rnd(env.v[s[1]] + ev(s[2], env)); break;
      case 'say': case 'sayf': env.says.push(ev(s[1], env)); break;
      case 'sayt': env.says.push(s[1]); break;
      case 'rep': var n = ev(s[1], env); for (var i = 0; i < n; i++) { exec(s[2], env); env.trace.push(snap(env)); } break;
      case 'until': while (!cv(s[1], env)) { exec(s[2], env); env.trace.push(snap(env)); } break;
      case 'if': if (cv(s[1], env)) exec(s[2], env); else if (s[3]) exec(s[3], env); break;
      case 'clear': env.segs = []; break;
      case 'goto': var nx = ev(s[1], env), ny = ev(s[2], env); if (env.pen) env.segs.push([env.x, env.y, nx, ny]); env.x = nx; env.y = ny; break;
      case 'pt': env.dir = ev(s[1], env); break;
      case 'pd': env.pen = true; break;
      case 'pu': env.pen = false; break;
      case 'mv': var d = ev(s[1], env), r = env.dir * Math.PI / 180;
        var px = rnd(env.x + d * Math.sin(r)), py = rnd(env.y + d * Math.cos(r));
        if (env.pen) env.segs.push([env.x, env.y, px, py]); env.x = px; env.y = py; break;
      case 'tr': env.dir += ev(s[1], env); break;
      case 'tl': env.dir -= ev(s[1], env); break;
    }
  });
}
function run(prog, inputs) {
  var env = { v: {}, ans: 0, says: [], inp: (inputs || []).slice(), x: 0, y: 0, dir: 90, pen: false, segs: [], trace: [], steps: 0 };
  exec(prog, env); return env;
}
function lastSay(prog, inputs) { var e = run(prog, inputs); return e.says[e.says.length - 1]; }

/* ---------- figures ---------- */
function bbox(segs) {
  var a = [1e9, 1e9, -1e9, -1e9];
  segs.forEach(function (s) { [[s[0], s[1]], [s[2], s[3]]].forEach(function (p) { a[0] = Math.min(a[0], p[0]); a[1] = Math.min(a[1], p[1]); a[2] = Math.max(a[2], p[0]); a[3] = Math.max(a[3], p[1]); }); });
  return a;
}
function svg(segs) {
  if (!segs.length) return '';
  var b = bbox(segs), w = b[2] - b[0] || 1, h = b[3] - b[1] || 1, k = Math.min(240 / w, 150 / h), P = 16;
  var W = w * k + 2 * P, H = h * k + 2 * P;
  var X = function (x) { return (P + (x - b[0]) * k).toFixed(1); }, Y = function (y) { return (P + (b[3] - y) * k).toFixed(1); };
  var d = segs.map(function (s) { return 'M' + X(s[0]) + ' ' + Y(s[1]) + 'L' + X(s[2]) + ' ' + Y(s[3]); }).join('');
  return '<svg class="qz-fig" viewBox="0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0) + '" width="' + W.toFixed(0) + '" role="img" aria-label="Dessin du lutin"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + X(segs[0][0]) + '" cy="' + Y(segs[0][1]) + '" r="5" fill="#16a34a"/></svg>';
}
/* classe la figure tracée (utilisé par les tests et pour contrôler les énoncés) */
function analyse(segs) {
  var pts = [[segs[0][0], segs[0][1]]];
  segs.forEach(function (s) { pts.push([s[2], s[3]]); });
  var same = function (p, q) { return Math.abs(p[0] - q[0]) < 1e-6 && Math.abs(p[1] - q[1]) < 1e-6; };
  if (!same(pts[0], pts[pts.length - 1])) return { closed: false };
  pts.pop();
  var out = [];
  for (var i = 0; i < pts.length; i++) {
    var p = pts[(i + pts.length - 1) % pts.length], c = pts[i], n = pts[(i + 1) % pts.length];
    if (same(p, c)) continue;
    var cr = (c[0] - p[0]) * (n[1] - c[1]) - (c[1] - p[1]) * (n[0] - c[0]);
    if (Math.abs(cr) > 1e-6) out.push(c);
  }
  var m = out.length, L = [], A = [];
  for (var j = 0; j < m; j++) {
    var a = out[j], b = out[(j + 1) % m], z = out[(j + 2) % m];
    L.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
    var u = [a[0] - b[0], a[1] - b[1]], v = [z[0] - b[0], z[1] - b[1]];
    A.push(Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * 180 / Math.PI);
  }
  var eq = function (x, y) { return Math.abs(x - y) < 1e-4; };
  var allL = L.every(function (x) { return eq(x, L[0]); }), allA = A.every(function (x) { return eq(x, A[0]); });
  var r = { closed: true, n: m, L: L, A: A, name: '' };
  if (m === 3) {
    if (allL) r.name = 'triangle équilatéral';
    else if (A.some(function (x) { return eq(x, 90); })) r.name = 'triangle rectangle';
    else r.name = 'triangle';
  } else if (m === 4) {
    var right = A.every(function (x) { return eq(x, 90); });
    if (right && allL) r.name = 'carré';
    else if (right) r.name = 'rectangle';
    else if (allL) r.name = 'losange';
    else if (eq(L[0], L[2]) && eq(L[1], L[3])) r.name = 'parallélogramme';
    else r.name = 'quadrilatère';
  } else if (allL && allA) r.name = 'polygone régulier à ' + m + ' côtés';
  else r.name = 'polygone';
  var s2 = 0;
  for (var q = 0; q < m; q++) { var P1 = out[q], P2 = out[(q + 1) % m]; s2 += P1[0] * P2[1] - P2[0] * P1[1]; }
  r.aire = Math.abs(s2) / 2; r.perim = L.reduce(function (x, y) { return x + y; }, 0);
  return r;
}
/* recentre le dessin sur la scène (le lutin part du point (x0 ; y0) choisi ici) */
function place(prog) {
  var gs = []; (function walk(l) { l.forEach(function (s) { if (s[0] === 'goto') gs.push(s); if (s[0] === 'rep') walk(s[2]); }); })(prog);
  gs.forEach(function (g) { g[1] = 0; g[2] = 0; });
  var b = bbox(run(prog, []).segs);
  var cx0 = Math.round(-(b[0] + b[2]) / 2 / 5) * 5, cy0 = Math.round(-(b[1] + b[3]) / 2 / 5) * 5;
  gs.forEach(function (g) { g[1] = cx0; g[2] = cy0; });
  var c = bbox(run(prog, []).segs);
  return Math.max(Math.abs(c[0]), Math.abs(c[2])) <= 200 && Math.max(Math.abs(c[1]), Math.abs(c[3])) <= 140;
}

/* ---------- aides pour construire les questions ---------- */
function qcm(correct, wrongs, n) {
  var w = shuffle(uniq(wrongs.filter(function (x) { return x !== correct; }))).slice(0, n || 3);
  var all = shuffle([correct].concat(w));
  return { choices: all, correct: all.indexOf(correct) };
}
function mk(o) { var q = o; q.prog = text(o.progAst); return q; }
function askPre() { return [['ask', 'Choisis un nombre.']]; }
function listTrace(env, max) {
  var t = env.trace.slice(0, max || 8);
  return '<ol class="qz-tr">' + t.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' + (env.trace.length > t.length ? '<p>… et ainsi de suite.</p>' : '');
}
var NOMS = { 3: 'triangle équilatéral', 4: 'carré', 5: 'pentagone régulier', 6: 'hexagone régulier', 8: 'octogone régulier', 9: 'ennéagone régulier', 10: 'décagone régulier', 12: 'dodécagone régulier' };
function article(nom) { return (nom === 'octogone régulier' || nom === 'ennéagone régulier') ? "un " + nom : 'un ' + nom; }
var DIV = '<span class="qz-op">';

/* ===================== PROGRAMMES DE CALCUL SANS BOUCLE ===================== */
function stepTxt(s) { return s.o === '+' ? 'ajoute ' + fmt(s.k) : s.o === '-' ? 'retire ' + fmt(s.k) : s.o === '*' ? 'multiplie par ' + fmt(s.k) : 'élève au carré'; }
function applyStep(s, v) { return s.o === '+' ? rnd(v + s.k) : s.o === '-' ? rnd(v - s.k) : s.o === '*' ? rnd(v * s.k) : rnd(v * v); }
function fch(ch, x) { return ch.reduce(function (v, s) { return applyStep(s, v); }, x); }
function descr(ch) { return 'Il ' + ch.map(stepTxt).join(', puis ') + '.'; }
function opSign(o) { return o === '+' ? '+' : o === '-' ? '−' : '×'; }
function chainTrace(ch, x) {
  var v = x, out = [];
  ch.forEach(function (s) {
    var n = applyStep(s, v);
    out.push(s.o === 'sq' ? pf(v) + ' × ' + pf(v) + ' = ' + fmt(n) : pf(v) + ' ' + opSign(s.o) + ' ' + pf(s.k) + ' = ' + fmt(n));
    v = n;
  });
  return '<ol class="qz-tr"><li>On part de <b>' + fmt(x) + '</b>.</li>' + out.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>';
}
function genChain(L) {
  for (var t = 0; t < 400; t++) {
    var len = L === 0 ? R(2, 3) : R(2, 4), ch = [], prev = '';
    for (var i = 0; i < len; i++) {
      var pool = L === 0 ? ['+', '-', '*'] : L === 1 ? ['+', '-', '*'] : L === 2 ? ['+', '-', '*', 'sq'] : ['+', '-', '*', '*', 'sq'];
      var o = pick(pool); if (o === prev && o !== '*') o = '*'; if (o === 'sq' && prev === 'sq') o = '+';
      var k = o === '+' ? R(2, 12) : o === '-' ? R(2, 9) : o === '*' ? (L >= 2 ? pick([2, 3, 4, 5, 6, -2, -3, -4]) : R(2, L === 0 ? 9 : 6)) : 0;
      if (L === 3 && o === '*' && Math.random() < .2) k = 0.5;
      ch.push({ o: o, k: k }); prev = o;
    }
    if (ch.filter(function (s) { return s.o === 'sq'; }).length > 1) continue;
    var x = L === 0 ? R(3, 12) : L === 1 ? R(2, 10) : R(-8, 9);
    if (L === 1 && Math.random() < .4 && !ch.some(function (s) { return s.o === '*'; })) x = R(-9, -2);
    if (L >= 2 && x === 0) x = 4;
    if (L === 3 && ch.some(function (s) { return s.k === 0.5; }) && x % 2) x += 1;
    var v = x, ok = true;
    ch.forEach(function (s) {
      if (s.o === '*' && L <= 1 && v < 0) ok = false;
      v = applyStep(s, v);
      if (L === 0 && (v < 0 || v > 200)) ok = false;
      if (Math.abs(v) > 600 || (L <= 2 && v % 1 !== 0)) ok = false;
    });
    if (ok) return { ch: ch, x: x };
  }
  return { ch: [{ o: '+', k: 5 }, { o: '*', k: 3 }], x: 4 };
}
function chainAst(ch, form, nm) {
  var p = askPre();
  if (form === 'B' && !ch.some(function (s) { return s.o === 'sq'; })) {
    var e = 'réponse';
    ch.forEach(function (s) { e = [s.o, e, s.k]; });
    return p.concat([['say', e]]);
  }
  p.push(['set', nm, 'réponse']);
  ch.forEach(function (s) {
    p.push(['set', nm, s.o === 'sq' ? ['*', nm, nm] : [s.o, nm, s.k]]);
  });
  p.push(['say', nm]);
  return p;
}
function chainDistract(ch) {
  var tests = [2, 3, 5, 7, -4], same = function (a, b) { return tests.every(function (t) { return fch(a, t) === fch(b, t); }); };
  var cands = [];
  for (var i = 0; i + 1 < ch.length; i++) { var c = ch.slice(); var t = c[i]; c[i] = c[i + 1]; c[i + 1] = t; cands.push(c); }
  ch.forEach(function (s, i) {
    if (s.o === 'sq') return;
    [1, -1, 2].forEach(function (dk) { var k2 = s.k + dk; if (k2 > 0 && k2 !== s.k) { var c = ch.slice(); c[i] = { o: s.o, k: k2 }; cands.push(c); } });
    var alt = s.o === '+' ? '-' : s.o === '-' ? '+' : '+';
    var c2 = ch.slice(); c2[i] = { o: alt, k: s.k > 0 ? s.k : -s.k }; cands.push(c2);
    if (s.o !== '*') { var c3 = ch.slice(); c3[i] = { o: '*', k: s.k }; cands.push(c3); }
  });
  var out = [], seen = {}; seen[descr(ch)] = 1;
  shuffle(cands).forEach(function (c) { var d = descr(c); if (!seen[d] && !same(c, ch)) { seen[d] = 1; out.push(d); } });
  return out;
}
var CALC0 = [
  { id: 'chaine', niv: [0, 1, 2, 3], gen: function (L) {
    var g = genChain(L), ch = g.ch, x = g.x, nm = pick(['n', 'x', 'nombre', 'total']);
    var form = Math.random() < .5 ? 'A' : 'B', ast = chainAst(ch, form, nm);
    var linear = !ch.some(function (s) { return s.o === 'sq'; });
    var kind = pick(L === 0 ? ['num', 'num', 'desc'] : linear && L >= 2 ? ['num', 'desc', 'inv'] : ['num', 'desc']);
    if (kind === 'inv') {
      var y = fch(ch, x);
      var rev = ch.slice().reverse(), v = y, lines = ['<li>Le lutin a dit <b>' + fmt(y) + '</b>. On remonte le programme à l’envers, avec les opérations contraires :</li>'];
      rev.forEach(function (s) {
        var n = s.o === '+' ? rnd(v - s.k) : s.o === '-' ? rnd(v + s.k) : rnd(v / s.k);
        lines.push('<li>' + pf(v) + ' ' + (s.o === '+' ? '−' : s.o === '-' ? '+' : '÷') + ' ' + pf(s.k) + ' = ' + fmt(n) + '</li>'); v = n;
      });
      if (v !== x) throw new Error('inverse');
      return mk({ type: 'num', progAst: ast, answer: x, q: 'Le lutin a dit <b>' + fmt(y) + '</b> à la fin. Quel nombre a-t-on tapé au départ ?',
        corrige: '<ol class="qz-tr">' + lines.join('') + '</ol><p>On avait tapé <b>' + fmt(x) + '</b>. Vérification : ' + chainTrace(ch, x).replace('<ol class="qz-tr">', '<ol class="qz-tr qz-small">') + '</p>',
        meta: { kind: 'inv', inputs: [x], say: y } });
    }
    if (kind === 'desc') {
      var cor = descr(ch), wr = chainDistract(ch);
      if (wr.length < 3) kind = 'num';
      else { var c = qcm(cor, wr);
        return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: cor, q: 'Que fait ce programme ?',
          corrige: '<p>Le programme met le nombre tapé dans « ' + nm + ' » (ou le calcule directement), puis applique les opérations dans l’ordre des blocs. <b>' + cor + '</b></p><p>Exemple avec ' + fmt(x) + ' :</p>' + chainTrace(ch, x),
          meta: { kind: 'desc', chain: ch, form: form } }); }
    }
    return mk({ type: 'num', progAst: ast, answer: fch(ch, x), q: 'Le lutin demande un nombre : on tape <b>' + fmt(x) + '</b>. Que dit-il à la fin ?',
      corrige: '<p>On suit les blocs dans l’ordre :</p>' + chainTrace(ch, x) + '<p>Le lutin dit <b>' + fmt(fch(ch, x)) + '</b>.</p>', meta: { kind: 'say', inputs: [x] } });
  } },
  { id: 'constant', niv: [3], gen: function () {
    var a = R(2, 9), b = R(2, 9), ast = askPre().concat([['set', 'n', 'réponse'], ['add', 'n', a], ['set', 'n', ['*', 'n', b]], ['set', 'n', ['-', 'n', ['*', b, 'réponse']]], ['say', 'n']]);
    var C = a * b, xs = [1, 4, -3, 10];
    xs.forEach(function (x) { if (lastSay(ast, [x]) !== C) throw new Error('constante'); });
    var good = 'Le lutin dit toujours ' + C + ', quel que soit le nombre tapé.';
    var c = qcm(good, ['Le lutin dit le nombre tapé multiplié par ' + b + '.', 'Le lutin dit toujours 0.', 'Le lutin dit un nombre différent à chaque essai.', 'Le lutin dit le nombre tapé plus ' + a + '.']);
    return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: good, q: 'On essaie avec plusieurs nombres : 1, puis 4, puis −3, puis 10. Que remarque-t-on ?',
      corrige: '<p>Notons <i>x</i> le nombre tapé. Le programme calcule (<i>x</i> + ' + a + ') × ' + b + ' − ' + b + ' × <i>x</i> = ' + b + '<i>x</i> + ' + C + ' − ' + b + '<i>x</i> = <b>' + C + '</b>.</p><p>Les <i>x</i> disparaissent : le résultat ne dépend pas du nombre choisi.</p><p>Vérification avec 4 : (4 + ' + a + ') × ' + b + ' = ' + ((4 + a) * b) + ', puis ' + ((4 + a) * b) + ' − ' + b + ' × 4 = ' + C + '.</p>',
      meta: { kind: 'const', inputs: [4], say: C } });
  } }
];

/* ===================== PROGRAMMES DE CALCUL AVEC BOUCLE ===================== */
var CALC1 = [
  { id: 'cumul', niv: [0, 1, 2, 3], gen: function (L) {
    var s0 = L === 0 ? pick([0, 0, 5, 10]) : L === 1 ? pick([0, 20, 30, 40, 50]) : R(-10, 10);
    var k = L === 0 ? R(2, 9) : L === 1 ? pick([-2, -3, -4, -5, 3, 4, 5, 6]) : pick([-7, -5, -4, -3, -2, 0.5, 1.5, 2.5, 4]);
    var n = L === 0 ? R(3, 8) : R(4, 8); if (Math.abs(k % 1) > 0 && n % 2) n += 1;
    var nm = pick(['s', 'total', 'n']), ast = [['set', nm, s0], ['rep', n, [['add', nm, k]]], ['say', nm]];
    var env = run(ast, []), ans = env.says[0];
    if (ans !== rnd(s0 + n * k)) throw new Error('cumul');
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'Que dit le lutin à la fin ?',
      corrige: '<p>Au départ, « ' + nm + ' » vaut ' + fmt(s0) + '. À chaque tour, on ajoute ' + pf(k) + ' :</p>' + listTrace(env) + '<p>Raccourci : ' + fmt(s0) + ' + ' + n + ' × ' + pf(k) + ' = ' + fmt(s0) + ' + ' + fmt(n * k) + ' = <b>' + fmt(ans) + '</b>.</p>', meta: { kind: 'say', inputs: [] } });
  } },
  { id: 'fois', niv: [0, 1, 2, 3], gen: function (L) {
    var k = L === 0 ? 2 : L === 1 ? R(2, 3) : L === 2 ? pick([2, 3, -2, -3]) : pick([2, 3, -2, 0.5, 5]);
    var m = L === 0 ? R(2, 3) : L === 1 ? R(2, 3) : R(2, 4), x = L === 0 ? R(1, 6) : L === 1 ? R(2, 9) : pick([-5, -4, -3, -2, 2, 3, 4, 5, 6]);
    if (k === 0.5) { m = R(2, 3); x = pick([2, 4, 8]) * Math.pow(2, m - 1); }
    var ast = askPre().concat([['set', 'n', 'réponse'], ['rep', m, [['set', 'n', ['*', 'n', k]]]], ['say', 'n']]);
    var env = run(ast, [x]), ans = env.says[0];
    if (ans !== rnd(x * Math.pow(k, m))) throw new Error('fois');
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'Le lutin demande un nombre : on tape <b>' + fmt(x) + '</b>. Que dit-il à la fin ?',
      corrige: '<p>Le nombre est multiplié par ' + pf(k) + ', ' + m + ' fois de suite :</p><ol class="qz-tr"><li>On part de ' + fmt(x) + '.</li>' + env.trace.map(function (t, i) { return '<li>tour ' + (i + 1) + ' : ' + t + '</li>'; }).join('') + '</ol><p>Autrement dit ' + fmt(x) + ' × ' + pf(k) + ' × … (' + m + ' fois) = <b>' + fmt(ans) + '</b>.</p>', meta: { kind: 'say', inputs: [x] } });
  } },
  { id: 'somme', niv: [0, 1, 2, 3], gen: function (L) {
    var n = L === 0 ? R(4, 6) : L === 1 ? R(5, 8) : R(6, 12);
    var ast = [['set', 'i', 1], ['set', 's', 0], ['rep', n, [['add', 's', 'i'], ['add', 'i', 1]]], ['say', 's']];
    var env = run(ast, []), ans = env.says[0];
    if (ans !== n * (n + 1) / 2) throw new Error('somme');
    var sm = []; for (var j = 1; j <= n; j++) sm.push(j);
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'Que dit le lutin à la fin ?',
      corrige: '<p>« i » prend les valeurs 1, 2, 3, … et « s » les additionne :</p>' + listTrace(env, 12) + '<p>Le programme calcule <b>' + sm.join(' + ') + ' = ' + ans + '</b>.</p>', meta: { kind: 'say', inputs: [] } });
  } },
  { id: 'euclide', niv: [0, 1, 2], gen: function (L) {
    var d = L === 0 ? R(3, 9) : R(4, 12), x = L === 0 ? R(15, 60) : R(30, 150), dir = Math.random() < .5 ? 'q' : 'r';
    var ast = askPre().concat([['set', 'r', 'réponse'], ['set', 'q', 0], ['until', ['<', 'r', d], [['set', 'r', ['-', 'r', d]], ['add', 'q', 1]]], ['say', dir]]);
    var env = run(ast, [x]), q = Math.floor(x / d), r = x % d;
    if (env.says[0] !== (dir === 'q' ? q : r)) throw new Error('euclide');
    return mk({ type: 'num', progAst: ast, answer: dir === 'q' ? q : r, q: 'Le lutin demande un nombre : on tape <b>' + x + '</b>. Que dit-il à la fin ?',
      corrige: '<p>Le lutin retire ' + d + ' tant que le reste « r » est au moins égal à ' + d + ', et compte les retraits dans « q ». C’est la <b>division euclidienne</b> de ' + x + ' par ' + d + ' :</p><p>' + x + ' = ' + d + ' × ' + q + ' + ' + r + ' avec ' + r + ' &lt; ' + d + '.</p><p>« q » vaut <b>' + q + '</b> (quotient) et « r » vaut <b>' + r + '</b> (reste). Le lutin dit ' + (dir === 'q' ? 'q' : 'r') + ' : <b>' + (dir === 'q' ? q : r) + '</b>.</p>', meta: { kind: 'say', inputs: [x] } });
  } },
  { id: 'puissance', niv: [2, 3], gen: function (L) {
    var perc = L === 3 && Math.random() < .5;
    if (!perc) {
      var a = L === 2 ? pick([2, 3, -2, 5]) : pick([2, 3, 5, 10, -3]), n = a === 10 ? R(3, 5) : a === 5 ? 3 : R(3, 5);
      var ast = [['set', 'p', 1], ['rep', n, [['set', 'p', ['*', 'p', a]]]], ['say', 'p']];
      var env = run(ast, []), ans = env.says[0];
      if (ans !== rnd(Math.pow(a, n))) throw new Error('puissance');
      return mk({ type: 'num', progAst: ast, answer: ans, q: 'Que dit le lutin à la fin ?',
        corrige: '<p>« p » est multiplié par ' + pf(a) + ' à chaque tour :</p><ol class="qz-tr"><li>au départ : p = 1</li>' + env.trace.map(function (t, i) { return '<li>tour ' + (i + 1) + ' : ' + t + '</li>'; }).join('') + '</ol><p>C’est la puissance ' + pf(a) + '<sup>' + n + '</sup> = <b>' + fmt(ans) + '</b>.</p>', meta: { kind: 'say', inputs: [] } });
    }
    var c = pick([1.1, 1.2, 1.5, 0.9, 0.5]), S = pick([100, 200, 1000, 400, 500]), n2 = R(2, 3);
    var ast2 = [['set', 'p', S], ['rep', n2, [['set', 'p', ['*', 'p', c]]]], ['say', 'p']];
    var env2 = run(ast2, []), ans2 = env2.says[0];
    if (ans2 !== rnd(S * Math.pow(c, n2))) throw new Error('pourcentage');
    var com = { 1.1: 'augmenter de 10 %', 1.2: 'augmenter de 20 %', 1.5: 'augmenter de 50 %', 0.9: 'diminuer de 10 %', 0.5: 'diviser par 2 (diminuer de 50 %)' }[c];
    return mk({ type: 'num', progAst: ast2, answer: ans2, q: 'Que dit le lutin à la fin ?',
      corrige: '<p>Multiplier par ' + fmt(c) + ' revient à ' + com + '. Le lutin le fait ' + n2 + ' fois :</p><ol class="qz-tr"><li>au départ : p = ' + S + '</li>' + env2.trace.map(function (t, i) { return '<li>tour ' + (i + 1) + ' : ' + t + '</li>'; }).join('') + '</ol><p>Résultat : ' + S + ' × ' + fmt(c) + (n2 === 2 ? ' × ' + fmt(c) : ' × ' + fmt(c) + ' × ' + fmt(c)) + ' = <b>' + fmt(ans2) + '</b>.</p>', meta: { kind: 'say', inputs: [] } });
  } },
  { id: 'suite', niv: [0, 1, 2, 3], gen: function (L) {
    var mult = L >= 2 ? Math.random() < .5 : (L === 1 ? Math.random() < .25 : false), a, k, m = R(4, 5);
    if (mult) { k = L === 1 ? 2 : pick([2, 3, -2]); a = R(1, 4); } else { k = L === 0 ? R(2, 6) : pick([-4, -3, -2, 2, 3, 5, 7]); a = L === 0 ? R(1, 10) : R(-5, 12); }
    var op = mult ? '*' : '+';
    var mkp = function (a0, op0, k0, m0, afterFirst) {
      var body = afterFirst ? [(op0 === '*' ? ['set', 'n', ['*', 'n', k0]] : ['add', 'n', k0]), ['sayf', 'n']] : [['sayf', 'n'], (op0 === '*' ? ['set', 'n', ['*', 'n', k0]] : ['add', 'n', k0])];
      return [['set', 'n', a0], ['rep', m0, body]];
    };
    var ast = mkp(a, op, k, m), seq = function (p) { return run(p, []).says.map(fmt).join(' ; '); };
    var good = seq(ast);
    var wr = [seq(mkp(a, op, k, m, true)), seq(mkp(a, mult ? '+' : '*', k, m)), seq(mkp(a, op, k + (k > 2 || k < -2 ? 1 : 2), m)), seq(mkp(a + 1, op, k, m)), seq(mkp(a, op, -k, m))];
    var c = qcm(good, wr);
    if (c.choices.length < 4) return CALC1[0].gen(L);
    var env = run(ast, []);
    return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: good, q: 'Quels nombres le lutin dit-il, dans l’ordre ?',
      corrige: '<p>« n » vaut d’abord ' + fmt(a) + '. À chaque tour, le lutin <b>dit d’abord</b> n, <b>puis</b> ' + (mult ? 'multiplie n par ' + pf(k) : 'ajoute ' + pf(k) + ' à n') + '.</p><p>Il dit donc : <b>' + good + '</b>.</p>', meta: { kind: 'suite', says: env.says } });
  } },
  { id: 'jusqua', niv: [1, 2, 3], gen: function (L) {
    var minus = L === 1 || (L === 2 && Math.random() < .5), a0, f, T, ast;
    if (minus) { a0 = pick([60, 80, 100, 120]); f = pick([10, 15, 20, 25]); T = pick([0, 10, 20]);
      ast = [['set', 'a', a0], ['set', 'n', 0], ['until', ['<', 'a', T], [['set', 'a', ['-', 'a', f]], ['add', 'n', 1]]], ['say', 'n']]; }
    else { a0 = pick([1, 2, 5, 10]); f = pick([2, 2, 3]); T = pick([50, 100, 200, 500]);
      ast = [['set', 'a', a0], ['set', 'n', 0], ['until', ['>', 'a', T], [['set', 'a', ['*', 'a', f]], ['add', 'n', 1]]], ['say', 'n']]; }
    var env = run(ast, []), ans = env.says[0];
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'Que dit le lutin à la fin ?',
      corrige: '<p>Le lutin recommence <b>jusqu’à ce que</b> la condition devienne vraie. Après chaque tour :</p><ol class="qz-tr"><li>au départ : ' + snapA(a0) + '</li>' + env.trace.map(function (t, i) { return '<li>tour ' + (i + 1) + ' : ' + t + '</li>'; }).join('') + '</ol><p>La condition « ' + (minus ? 'a &lt; ' : 'a &gt; ') + T + ' » devient vraie après <b>' + ans + '</b> tours : le lutin dit ' + ans + '.</p>', meta: { kind: 'say', inputs: [] } });
  } }
];
function snapA(a0) { return 'a = ' + fmt(a0) + ' ; n = 0'; }

/* ===================== PROGRAMMES D'INSTRUCTIONS SANS BOUCLE ===================== */
function head() { return [['clear'], ['goto', 0, 0], ['pt', 90], ['pd']]; }
function figQ(prog, ast, fig, wrongs, extra) {
  var c = qcm('un ' + fig, wrongs.map(function (w) { return 'un ' + w; }));
  return mk(Object.assign({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: 'un ' + fig, q: 'Quelle figure le lutin dessine-t-il ?', meta: { kind: 'fig', fig: fig } }, extra));
}
function rectQuestion(ast, Lg, lg, L, kindWanted) {
  var segs = run(ast, []).segs, sq = Lg === lg, fig = sq ? 'carré' : 'rectangle';
  var kind = kindWanted || pick(L === 0 ? ['fig', 'per', 'aire'] : ['fig', 'per', 'aire', 'aire']);
  if (kind === 'fig') return figQ(null, ast, fig, sq ? ['triangle équilatéral', 'hexagone régulier', 'triangle rectangle'] : ['carré', 'losange', 'triangle rectangle', 'hexagone régulier'],
    { corrige: '<p>Le lutin trace ' + (sq ? 'quatre côtés de ' + Lg + ' pas' : 'deux côtés de ' + Lg + ' pas et deux côtés de ' + lg + ' pas') + ', avec <b>quatre angles droits</b> (il tourne de 90° à chaque coin).</p><p>C’est ' + (sq ? '<b>un carré</b>' : '<b>un rectangle</b> (ses côtés ne sont pas tous égaux, ce n’est pas un carré)') + '.</p>' + svg(segs) });
  if (kind === 'per') { var P = 2 * (Lg + lg);
    return mk({ type: 'num', progAst: ast, answer: P, q: 'Quelle est la longueur totale tracée par le lutin (en pas) ?', corrige: '<p>Le lutin trace 2 × ' + Lg + ' + 2 × ' + lg + ' = ' + 2 * Lg + ' + ' + 2 * lg + ' = <b>' + P + ' pas</b>. C’est le périmètre ' + (sq ? 'du carré' : 'du rectangle') + '.</p>' + svg(segs), meta: { kind: 'per', value: P } }); }
  var A = Lg * lg;
  return mk({ type: 'num', progAst: ast, answer: A, q: 'Quelle est l’aire de la figure dessinée (en pas²) ?', corrige: '<p>La figure est ' + (sq ? 'un carré de côté ' + Lg : 'un rectangle de longueur ' + Lg + ' et de largeur ' + lg) + '.</p><p>Aire = ' + Lg + ' × ' + lg + ' = <b>' + A + ' pas²</b>.</p>' + svg(segs), meta: { kind: 'aire', value: A } });
}
var TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25], [20, 21, 29]];
var GEO0 = [
  { id: 'rect', niv: [0, 1, 2, 3], gen: function (L) {
    for (var t = 0; t < 50; t++) {
      var sq = Math.random() < .25, Lg = R(6, 16) * 10, lg = sq ? Lg : R(3, 12) * 10; if (!sq && lg === Lg) continue;
      var tn = pick(['tr', 'tl']), ast = head().concat([['mv', Lg], [tn, 90], ['mv', lg], [tn, 90], ['mv', Lg], [tn, 90], ['mv', lg]]);
      if (Math.random() < .5) ast.push([tn, 90]);
      if (!place(ast)) continue;
      return rectQuestion(ast, Lg, lg, L);
    }
  } },
  { id: 'equi', niv: [0, 1, 2, 3], gen: function (L) {
    for (var t = 0; t < 50; t++) {
      var d = R(6, 14) * 10, tn = pick(['tr', 'tl']), ast = head().concat([['mv', d], [tn, 120], ['mv', d], [tn, 120], ['mv', d]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs, kind = pick(L === 0 ? ['fig', 'per'] : ['fig', 'per', 'angle']);
      if (kind === 'fig') return figQ(null, ast, 'triangle équilatéral', ['carré', 'triangle rectangle', 'hexagone régulier'], { corrige: '<p>Le lutin trace trois côtés de ' + d + ' pas, et tourne de 120° à chaque coin. Les trois côtés sont égaux : c’est <b>un triangle équilatéral</b>.</p>' + svg(segs) });
      if (kind === 'per') return mk({ type: 'num', progAst: ast, answer: 3 * d, q: 'Quelle est la longueur totale tracée par le lutin (en pas) ?', corrige: '<p>Trois côtés de ' + d + ' pas : 3 × ' + d + ' = <b>' + 3 * d + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: 3 * d } });
      return mk({ type: 'num', progAst: ast, answer: 60, q: 'Quelle est la mesure (en degrés) de chaque angle de la figure dessinée ?', corrige: '<p>La figure est un triangle équilatéral. Le lutin tourne de 120° à chaque coin, donc l’angle de la figure vaut 180° − 120° = <b>60°</b> (on retrouve 3 × 60° = 180°).</p>' + svg(segs), meta: { kind: 'angle', value: 60 } });
    }
  } },
  { id: 'tri-rect', niv: [0, 1, 2, 3], gen: function (L) {
    for (var t = 0; t < 80; t++) {
      var tr = pick(TRIPLES), m = pick([1, 2, 3, 4, 5, 10]), a = tr[0] * m, b = tr[1] * m, c = tr[2] * m;
      if (Math.random() < .5) { var s = a; a = b; b = s; }
      if (Math.max(a, b) > 190 || Math.min(a, b) < 20) continue;
      var ast = head().concat([['mv', a], ['tl', 90], ['mv', b], ['goto', 0, 0]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs, kind = pick(L === 0 ? ['fig'] : L === 1 ? ['fig', 'aire'] : ['fig', 'hyp', 'perim', 'aire']);
      if (kind === 'fig') return figQ(null, ast, 'triangle rectangle', ['triangle équilatéral', 'carré', 'rectangle', 'hexagone régulier'], { corrige: '<p>Le lutin avance de ' + a + ' pas, tourne de 90° (angle droit), avance de ' + b + ' pas, puis retourne à son point de départ : il a tracé <b>un triangle rectangle</b> (avec un angle droit entre les côtés de ' + a + ' et ' + b + ' pas).</p>' + svg(segs) });
      if (kind === 'aire') return mk({ type: 'num', progAst: ast, answer: a * b / 2, q: 'Quelle est l’aire du triangle dessiné (en pas²) ?', corrige: '<p>Le triangle est rectangle ; ses deux côtés de l’angle droit mesurent ' + a + ' et ' + b + '.</p><p>Aire = ' + a + ' × ' + b + ' ÷ 2 = <b>' + a * b / 2 + ' pas²</b>.</p>' + svg(segs), meta: { kind: 'aire', value: a * b / 2 } });
      var py = '<p>Le triangle est rectangle (le lutin tourne de 90°). D’après le théorème de Pythagore : longueur² = ' + a + '² + ' + b + '² = ' + a * a + ' + ' + b * b + ' = ' + (a * a + b * b) + ', donc longueur = √' + (a * a + b * b) + ' = <b>' + c + '</b>.</p>';
      if (kind === 'hyp') return mk({ type: 'num', progAst: ast, answer: c, q: 'Quelle est la longueur (en pas) du dernier côté tracé par le lutin, quand il retourne à son point de départ ?', corrige: py + svg(segs), meta: { kind: 'hyp', value: c } });
      return mk({ type: 'num', progAst: ast, answer: a + b + c, q: 'Quelle est la longueur totale tracée par le lutin (en pas) ?', corrige: py + '<p>Longueur totale : ' + a + ' + ' + b + ' + ' + c + ' = <b>' + (a + b + c) + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: a + b + c } });
    }
  } },
  { id: 'para', niv: [1, 2, 3], gen: function (L) {
    for (var t = 0; t < 80; t++) {
      var d = R(6, 12) * 10, e = Math.random() < .2 ? d : R(4, 10) * 10, al = pick([50, 60, 70, 75, 80, 100, 110, 120]);
      var ast = head().concat([['mv', d], ['tl', al], ['mv', e], ['tl', 180 - al], ['mv', d], ['tl', al], ['mv', e]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs, an = analyse(segs), lo = d === e;
      if (an.name !== (lo ? 'losange' : 'parallélogramme')) throw new Error('para ' + an.name);
      var kind = pick(['fig', 'per', 'angle']);
      if (kind === 'fig') return figQ(null, ast, lo ? 'losange' : 'parallélogramme', lo ? ['carré', 'rectangle', 'triangle équilatéral', 'hexagone régulier'] : ['rectangle', 'losange', 'carré', 'triangle rectangle'],
        { corrige: '<p>Les côtés opposés ont la même longueur (' + d + ' et ' + e + ') et le lutin tourne de ' + al + '° puis de ' + (180 - al) + '° : les côtés opposés sont <b>parallèles</b>' + (lo ? ', et les quatre côtés sont égaux' : '') + '. La figure est <b>un ' + (lo ? 'losange' : 'parallélogramme') + '</b>' + (lo ? '' : ' (ni rectangle, car il n’y a pas d’angle droit, ni losange, car les côtés ne sont pas tous égaux)') + '.</p>' + svg(segs) });
      if (kind === 'per') return mk({ type: 'num', progAst: ast, answer: 2 * (d + e), q: 'Quelle est la longueur totale tracée par le lutin (en pas) ?', corrige: '<p>2 × ' + d + ' + 2 × ' + e + ' = ' + 2 * d + ' + ' + 2 * e + ' = <b>' + 2 * (d + e) + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: 2 * (d + e) } });
      return mk({ type: 'num', progAst: ast, answer: 180 - al, q: 'Au premier coin, le lutin tourne de ' + al + '°. Quelle est la mesure (en degrés) de l’angle intérieur de la figure en ce sommet ?', corrige: '<p>Quand le lutin tourne de ' + al + '°, l’angle de la figure vaut 180° − ' + al + '° = <b>' + (180 - al) + '°</b> (le demi-tour 180° se partage entre le virage et l’angle de la figure).</p>' + svg(segs), meta: { kind: 'angle', value: 180 - al } });
    }
  } },
  { id: 'chemin', niv: [0, 1], gen: function (L) {
    for (var t = 0; t < 50; t++) {
      var a = R(4, 12) * 10, b = R(3, 10) * 10, c = R(4, 12) * 10, ast = head().concat([['mv', a], ['tr', 90], ['mv', b], ['tl', 90], ['mv', c]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs;
      return mk({ type: 'num', progAst: ast, answer: a + b + c, q: 'Quelle est la longueur totale du chemin tracé par le lutin (en pas) ?', corrige: '<p>Le lutin avance de ' + a + ', puis de ' + b + ', puis de ' + c + ' pas (les virages ne comptent pas dans la longueur) : ' + a + ' + ' + b + ' + ' + c + ' = <b>' + (a + b + c) + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: a + b + c } });
    }
  } },
  { id: 'distance', niv: [2, 3], gen: function () {
    for (var t = 0; t < 80; t++) {
      var tr = pick(TRIPLES.slice(0, 6)), m = pick([1, 2, 3, 5, 10]), a = tr[0] * m, b = tr[1] * m, c = tr[2] * m;
      if (Math.random() < .5) { var s = a; a = b; b = s; }
      if (Math.max(a, b) > 190) continue;
      var ast = head().concat([['mv', a], [pick(['tr', 'tl']), 90], ['mv', b]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs;
      return mk({ type: 'num', progAst: ast, answer: c, q: 'À la fin du programme, à quelle distance (en pas) du point de départ le lutin se trouve-t-il ?', corrige: '<p>Le lutin a fait un angle droit : son départ, son virage et son arrivée forment un <b>triangle rectangle</b> de côtés ' + a + ' et ' + b + '. La distance cherchée est l’hypoténuse.</p><p>Pythagore : ' + a + '² + ' + b + '² = ' + a * a + ' + ' + b * b + ' = ' + (a * a + b * b) + ', et √' + (a * a + b * b) + ' = <b>' + c + '</b>.</p>' + svg(segs) + '<p class="qz-small">Attention : le lutin a parcouru ' + (a + b) + ' pas, mais il est à ' + c + ' pas de son départ.</p>', meta: { kind: 'dist', value: c } });
    }
  } }
];

/* ===================== PROGRAMMES D'INSTRUCTIONS AVEC BOUCLE ===================== */
var NS = [[3, 4, 5, 6], [3, 4, 5, 6, 8], [3, 4, 5, 6, 8, 10, 12], [5, 6, 8, 9, 10, 12]];
function polyWrongs(n) { return uniq(Object.keys(NOMS).filter(function (k) { return +k !== n; }).map(function (k) { return NOMS[k]; })); }
var GEO1 = [
  { id: 'polygone', niv: [0, 1, 2, 3], gen: function (L) {
    for (var t = 0; t < 80; t++) {
      var n = pick(NS[L]), d = R(3, 12) * 10, tn = pick(['tr', 'tl']), ang = 360 / n, nom = NOMS[n];
      var angE = L >= 2 && Math.random() < .5 ? ['/', 360, n] : ang;
      var kind = pick(L === 0 ? ['fig', 'fig', 'per'] : L === 1 ? ['fig', 'per', 'turn'] : ['fig', 'per', 'turn', 'int']);
      var turnArg = kind === 'turn' ? '?' : angE;
      var ast = head().concat([['rep', n, [['mv', d], [tn, turnArg]]]]);
      var astPlace = head().concat([['rep', n, [['mv', d], [tn, ang]]]]);
      if (!place(astPlace)) continue; ast[1] = astPlace[1];
      var segs = run(astPlace, []).segs, an = analyse(segs);
      if (an.n !== n) throw new Error('polygone ' + n);
      if (kind === 'fig') return figQ(null, ast, nom, polyWrongs(n).concat(n > 4 ? ['carré'] : ['pentagone régulier']), { corrige: '<p>Le lutin répète ' + n + ' fois « avancer de ' + d + ' pas, puis tourner de ' + fmt(ang) + '° ». Il fait ' + n + ' côtés égaux, et le tour complet est fermé : ' + n + ' × ' + fmt(ang) + '° = 360°.</p><p>C’est <b>un ' + nom + '</b>.</p>' + svg(segs), meta: { kind: 'fig', fig: nom, n: n } });
      if (kind === 'per') return mk({ type: 'num', progAst: ast, answer: n * d, q: 'Quelle est la longueur totale tracée par le lutin (en pas) ?', corrige: '<p>Le lutin répète ' + n + ' fois « avancer de ' + d + ' pas » : ' + n + ' × ' + d + ' = <b>' + n * d + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: n * d } });
      if (kind === 'turn') return mk({ type: 'num', progAst: ast, answer: ang, q: 'Ce programme doit dessiner <b>' + article(nom) + '</b> de côté ' + d + ' pas. Par quel nombre faut-il remplacer « ? » dans le bloc « tourner » ?', corrige: '<p>Pour revenir à son point de départ, le lutin doit faire un tour complet de 360° en ' + n + ' virages égaux : 360 ÷ ' + n + ' = <b>' + fmt(ang) + '</b>.</p>' + svg(segs), meta: { kind: 'turn', value: ang } });
      return mk({ type: 'num', progAst: ast, answer: 180 - ang, q: 'Le lutin dessine un ' + nom + '. Quelle est la mesure (en degrés) d’un angle de cette figure ?', corrige: '<p>À chaque coin le lutin tourne de 360 ÷ ' + n + ' = ' + fmt(ang) + '°. L’angle de la figure vaut donc 180° − ' + fmt(ang) + '° = <b>' + fmt(180 - ang) + '°</b>.</p>' + svg(segs), meta: { kind: 'int', value: 180 - ang } });
    }
  } },
  { id: 'rect-boucle', niv: [0, 1, 2, 3], gen: function (L) {
    for (var t = 0; t < 50; t++) {
      var sq = Math.random() < .2, Lg = R(6, 16) * 10, lg = sq ? Lg : R(3, 12) * 10; if (!sq && lg === Lg) continue;
      var tn = pick(['tr', 'tl']), ast = head().concat([['rep', 2, [['mv', Lg], [tn, 90], ['mv', lg], [tn, 90]]]]);
      if (!place(ast)) continue;
      return rectQuestion(ast, Lg, lg, L);
    }
  } },
  { id: 'etoile', niv: [2, 3], gen: function (L) {
    var F = [
      { n: 5, a: 144, nom: 'étoile à 5 branches', w: ['pentagone régulier', 'hexagone régulier', 'triangle équilatéral'], why: '5 × 144° = 720° = 2 tours complets : le lutin ne tourne pas assez peu pour dessiner un pentagone, il saute un sommet sur deux et dessine <b>une étoile à 5 branches</b> (un pentagramme).', c: 1 },
      { n: 6, a: 120, nom: 'triangle équilatéral (tracé deux fois)', w: ['hexagone régulier', 'carré', 'étoile à 6 branches'], why: 'Un virage de 120° ferme le triangle équilatéral en 3 côtés. Avec 6 répétitions, le lutin repasse deux fois sur le même triangle équilatéral.', c: 2 },
      { n: 8, a: 90, nom: 'carré (tracé deux fois)', w: ['octogone régulier', 'triangle équilatéral', 'étoile à 8 branches'], why: 'Un virage de 90° ferme le carré en 4 côtés. Avec 8 répétitions, le lutin repasse deux fois sur le même carré.', c: 2 }
    ];
    for (var t = 0; t < 50; t++) {
      var f = pick(F), d = R(4, 12) * 10, ast = head().concat([['rep', f.n, [['mv', d], [pick(['tr', 'tl']), f.a]]]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs;
      if (Math.random() < .6) return figQ(null, ast, f.nom, f.w, { corrige: '<p>Le lutin tourne de ' + f.a + '° à chaque fois, ' + f.n + ' fois : ' + f.n + ' × ' + f.a + '° = ' + f.n * f.a + '° = ' + f.n * f.a / 360 + ' tours complets.</p><p>' + f.why + '</p>' + svg(segs), meta: { kind: 'fig', fig: f.nom, n: f.n } });
      return mk({ type: 'num', progAst: ast, answer: f.n * d, q: 'Quelle est la longueur totale <b>parcourue</b> par le lutin (en pas), en comptant les passages répétés ?', corrige: '<p>Le lutin avance de ' + d + ' pas, ' + f.n + ' fois : ' + f.n + ' × ' + d + ' = <b>' + f.n * d + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: f.n * d } });
    }
  } },
  { id: 'spirale', niv: [0, 1, 2, 3], gen: function (L) {
    for (var t = 0; t < 50; t++) {
      var d0 = pick([10, 20]), k = pick([10, 20]), n = L === 0 ? R(4, 5) : R(4, 6), ast = head().concat([['set', 'd', d0], ['rep', n, [['mv', 'd'], [pick(['tr', 'tl']), 90], ['add', 'd', k]]]]);
      if (!place(ast)) continue;
      var segs = run(ast, []).segs, tot = n * d0 + k * n * (n - 1) / 2, ls = []; for (var i = 0; i < n; i++) ls.push(d0 + i * k);
      return mk({ type: 'num', progAst: ast, answer: tot, q: 'Quelle est la longueur totale tracée par le lutin (en pas) ?', corrige: '<p>La longueur du côté augmente de ' + k + ' à chaque tour : ' + ls.join(' ; ') + '.</p><p>Total : ' + ls.join(' + ') + ' = <b>' + tot + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: tot } });
    }
  } },
  { id: 'carre-demande', niv: [0, 1, 2, 3], gen: function (L) {
    var x = R(2, 12) * (L === 0 ? 5 : 10) / (L === 0 ? 1 : 2), kind = pick(L <= 1 ? ['per', 'aire'] : ['per', 'aire', 'aire']);
    var ast = askPre().slice(0, 1); ast[0][1] = 'Longueur du côté ?';
    ast = ast.concat([['clear'], ['pd'], ['rep', 4, [['mv', 'réponse'], [pick(['tr', 'tl']), 90]]]]);
    var segs = run(ast, [x]).segs, ls = fmt(x);
    if (kind === 'per') return mk({ type: 'num', progAst: ast, answer: 4 * x, q: 'Le lutin demande la longueur du côté : on tape <b>' + ls + '</b>. Quelle est la longueur totale tracée (en pas) ?', corrige: '<p>Le lutin trace un carré de côté ' + ls + ' : 4 × ' + ls + ' = <b>' + fmt(4 * x) + ' pas</b>.</p>' + svg(segs), meta: { kind: 'per', value: 4 * x, inputs: [x] } });
    return mk({ type: 'num', progAst: ast, answer: x * x, q: 'Le lutin demande la longueur du côté : on tape <b>' + ls + '</b>. Quelle est l’aire de la figure tracée (en pas²) ?', corrige: '<p>Le lutin trace un carré de côté ' + ls + '.</p><p>Aire = ' + ls + ' × ' + ls + ' = <b>' + fmt(x * x) + ' pas²</b>.</p>' + svg(segs), meta: { kind: 'aire', value: x * x, inputs: [x] } });
  } },
  { id: 'polygone-demande', niv: [1, 2, 3], gen: function (L) {
    var n = pick(NS[L]), d = R(3, 8) * 10, ast = [['ask', 'Combien de côtés ?'], ['clear'], ['pd'], ['rep', 'réponse', [['mv', d], ['tl', ['/', 360, 'réponse']]]]];
    var env = run(ast, [n]), nom = NOMS[n], segs = env.segs;
    if (analyse(segs).n !== n) throw new Error('polygone-demande');
    if (Math.random() < .5) return mk({ type: 'num', progAst: ast, answer: 360 / n, q: 'Le lutin demande un nombre : on tape <b>' + n + '</b>. De combien de degrés le lutin tourne-t-il à chaque fois ?', corrige: '<p>Le bloc « tourner » utilise 360 ÷ réponse = 360 ÷ ' + n + ' = <b>' + fmt(360 / n) + '</b> degrés.</p>' + svg(segs), meta: { kind: 'turn', value: 360 / n, inputs: [n] } });
    var c = qcm('un ' + nom, polyWrongs(n).map(function (w) { return 'un ' + w; }).concat(n > 4 ? ['un carré'] : ['un pentagone régulier']));
    return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: 'un ' + nom, q: 'Le lutin demande un nombre : on tape <b>' + n + '</b>. Quelle figure dessine-t-il ?', corrige: '<p>Le lutin répète ' + n + ' fois « avancer de ' + d + ' pas, tourner de 360 ÷ ' + n + ' = ' + fmt(360 / n) + '° » : ' + n + ' côtés égaux et ' + n + ' angles égaux. C’est <b>un ' + nom + '</b>.</p>' + svg(segs), meta: { kind: 'fig', fig: nom, n: n, inputs: [n] } });
  } }
];

/* ===================== AUTRES PROGRAMMES ===================== */
function twoAsk(p1, p2) { return [['ask', p1], ['set', 'a', 'réponse'], ['ask', p2], ['set', 'b', 'réponse']]; }
var OTH = [
  { id: 'multiple', niv: [0, 1, 2, 3], gen: function (L) {
    var k = pick(L === 0 ? [2, 5, 10] : L === 1 ? [2, 3, 5, 9] : L === 2 ? [3, 4, 6, 9, 11] : [7, 8, 11, 12, 13]), mult = Math.random() < .5;
    var x = mult ? k * R(Math.ceil(12 / k), Math.floor(190 / k)) : R(12, 190); if (!mult && x % k === 0) x += 1;
    var yes = k === 2 ? 'pair' : 'multiple de ' + k, no = k === 2 ? 'impair' : 'pas multiple de ' + k;
    var ast = askPre().concat([['if', ['=', ['mod', 'réponse', k], 0], [['sayt', yes]], [['sayt', no]]]]);
    var say = lastSay(ast, [x]);
    if (Math.random() < .35) {
      var good = k === 2 ? 'Il dit si le nombre tapé est pair ou impair.' : 'Il dit si le nombre tapé est un multiple de ' + k + '.';
      var c = qcm(good, ['Il dit si le nombre tapé est supérieur à ' + k + '.', 'Il dit si le nombre tapé est un diviseur de ' + k + '.', 'Il dit si le nombre tapé est égal à ' + k + '.', 'Il dit le reste de la division de ' + k + ' par le nombre tapé.']);
      return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: good, q: 'Que fait ce programme ?', corrige: '<p>« réponse modulo ' + k + ' » est le <b>reste</b> de la division euclidienne du nombre tapé par ' + k + '. Si ce reste est 0, le nombre est dans la table de ' + k + ' : c’est un multiple de ' + k + '.</p><p>Exemple avec ' + x + ' : ' + x + ' = ' + k + ' × ' + Math.floor(x / k) + ' + ' + (x % k) + ', le reste est ' + (x % k) + ', donc le lutin dit « ' + say + ' ».</p>', meta: { kind: 'desc-oth' } });
    }
    var c2 = qcm(say, [yes, no]);
    return mk({ type: 'qcm', progAst: ast, choices: c2.choices, correct: c2.correct, answerText: say, q: 'Le lutin demande un nombre : on tape <b>' + x + '</b>. Que dit-il ?', corrige: '<p>« réponse modulo ' + k + ' » est le reste de la division de ' + x + ' par ' + k + '.</p><p>' + x + ' = ' + k + ' × ' + Math.floor(x / k) + ' + ' + (x % k) + ' : le reste est <b>' + (x % k) + '</b>, ' + (x % k === 0 ? 'donc la condition est vraie' : 'donc la condition est fausse') + ' et le lutin dit « <b>' + say + '</b> ».</p>', meta: { kind: 'sayt', inputs: [x], say: say } });
  } },
  { id: 'abs', niv: [1, 2, 3], gen: function () {
    var ast = askPre().concat([['if', ['<', 'réponse', 0], [['say', ['-', 0, 'réponse']]], [['say', 'réponse']]]]);
    if (Math.random() < .4) {
      var good = 'Il dit la distance du nombre à zéro (sa valeur absolue).';
      var c = qcm(good, ['Il dit toujours l’opposé du nombre tapé.', 'Il dit toujours un nombre négatif.', 'Il dit toujours le nombre tapé, sans le changer.']);
      return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: good, q: 'Que fait ce programme ?', corrige: '<p>Si le nombre est négatif, le lutin dit son opposé (0 − nombre), qui est positif. Sinon, il dit le nombre lui-même. Le résultat est donc toujours positif : c’est la <b>distance à zéro</b>. Exemples : −7 → 7 ; 4 → 4.</p>', meta: { kind: 'desc-oth' } });
    }
    var x = pick([-1, 1]) * R(2, 15);
    return mk({ type: 'num', progAst: ast, answer: Math.abs(x), q: 'Le lutin demande un nombre : on tape <b>' + fmt(x) + '</b>. Que dit-il ?', corrige: '<p>' + (x < 0 ? fmt(x) + ' &lt; 0, la condition est vraie : le lutin dit 0 − ' + pf(x) + ' = <b>' + fmt(-x) + '</b>.' : fmt(x) + ' n’est pas négatif : le lutin dit le nombre lui-même, <b>' + fmt(x) + '</b>.') + '</p>', meta: { kind: 'say', inputs: [x] } });
  } },
  { id: 'max', niv: [0, 1, 2, 3], gen: function (L) {
    var dec = L === 0 ? Math.random() < .5 : L >= 2, neg = L >= 1 && Math.random() < .6, a, b, mx = Math.random() < .6;
    for (var t = 0; t < 30; t++) {
      a = dec ? R(10, 99) / 10 : R(1, 99); b = dec ? R(10, 99) / 10 : R(1, 99);
      if (neg) { if (Math.random() < .5) a = -a; if (Math.random() < .5) b = -b; }
      if (a !== b) break;
    }
    var ast = twoAsk('Premier nombre ?', 'Deuxième nombre ?').concat([['if', [mx ? '>' : '<', 'a', 'b'], [['say', 'a']], [['say', 'b']]]]);
    var ans = lastSay(ast, [a, b]);
    if (ans !== (mx ? Math.max(a, b) : Math.min(a, b))) throw new Error('max');
    if (Math.random() < .3) {
      var good = mx ? 'Il dit le plus grand des deux nombres tapés.' : 'Il dit le plus petit des deux nombres tapés.';
      var c = qcm(good, [mx ? 'Il dit le plus petit des deux nombres tapés.' : 'Il dit le plus grand des deux nombres tapés.', 'Il dit la somme des deux nombres tapés.', 'Il dit toujours le premier nombre tapé.']);
      return mk({ type: 'qcm', progAst: ast, choices: c.choices, correct: c.correct, answerText: good, q: 'Que fait ce programme ?', corrige: '<p>Le lutin compare a et b avec « ' + (mx ? 'a &gt; b' : 'a &lt; b') + ' ». Si c’est vrai, il dit a, sinon il dit b : il dit donc ' + (mx ? 'le plus grand' : 'le plus petit') + ' des deux. Exemple avec ' + fmt(a) + ' et ' + fmt(b) + ' : il dit ' + fmt(ans) + '.</p>', meta: { kind: 'desc-oth' } });
    }
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'On tape <b>' + fmt(a) + '</b> puis <b>' + fmt(b) + '</b>. Que dit le lutin ?', corrige: '<p>Ici a = ' + fmt(a) + ' et b = ' + fmt(b) + '.</p><p>Test « ' + (mx ? 'a &gt; b' : 'a &lt; b') + ' » : ' + fmt(a) + (mx ? ' &gt; ' : ' &lt; ') + fmt(b) + ' est ' + (cvTest(mx, a, b) ? 'vrai' : 'faux') + ', donc le lutin dit ' + (cvTest(mx, a, b) ? 'a' : 'b') + ' = <b>' + fmt(ans) + '</b>.</p>', meta: { kind: 'say', inputs: [a, b] } });
  } },
  { id: 'triangle', niv: [0, 1], gen: function () {
    var a, b, c, ok = Math.random() < .5;
    for (var t = 0; t < 100; t++) {
      a = R(2, 12); b = R(2, 12); c = R(2, 20);
      var tri = a + b > c && a + c > b && b + c > a, deg = a + b === c || a + c === b || b + c === a;
      if (deg) continue; if (tri === ok) break;
    }
    var cnd = ['and', ['and', ['>', ['+', 'a', 'b'], 'c'], ['>', ['+', 'a', 'c'], 'b']], ['>', ['+', 'b', 'c'], 'a']];
    var ast = [['ask', 'Longueur a ?'], ['set', 'a', 'réponse'], ['ask', 'Longueur b ?'], ['set', 'b', 'réponse'], ['ask', 'Longueur c ?'], ['set', 'c', 'réponse'], ['if', cnd, [['sayt', 'constructible']], [['sayt', 'impossible']]]];
    var say = lastSay(ast, [a, b, c]), mxv = Math.max(a, b, c), sum = a + b + c - mxv;
    var cc = qcm(say, ['constructible', 'impossible']);
    return mk({ type: 'qcm', progAst: ast, choices: cc.choices, correct: cc.correct, answerText: say, q: 'On tape les longueurs <b>' + a + '</b>, <b>' + b + '</b> et <b>' + c + '</b>. Que dit le lutin ?', corrige: '<p>Le programme teste l’<b>inégalité triangulaire</b> : chaque côté doit être strictement plus petit que la somme des deux autres. Il suffit de regarder le plus grand côté : ' + mxv + ' contre ' + (a + b + c - mxv) + ' (somme des deux autres).</p><p>' + mxv + (mxv < sum ? ' &lt; ' : ' &gt; ') + sum + ' : ' + (mxv < sum ? 'le triangle existe, le lutin dit « constructible ».' : 'le triangle n’existe pas, le lutin dit « impossible ».') + '</p>', meta: { kind: 'sayt', inputs: [a, b, c], say: say } });
  } },
  { id: 'pythagore', niv: [2, 3], gen: function () {
    var a, b, c, ok = Math.random() < .5;
    if (ok) { var tr = pick(TRIPLES), m = pick([1, 1, 2, 3]); a = tr[0] * m; b = tr[1] * m; c = tr[2] * m; }
    else for (var t = 0; t < 100; t++) { a = R(3, 15); b = R(3, 15); c = R(Math.max(a, b) + 1, a + b - 1 > Math.max(a, b) ? a + b - 1 : Math.max(a, b) + 1); if (a * a + b * b !== c * c && a + b > c && c > Math.max(a, b)) break; }
    if (Math.random() < .5) { var s = a; a = b; b = s; }
    var ast = [['ask', 'Longueur a ?'], ['set', 'a', 'réponse'], ['ask', 'Longueur b ?'], ['set', 'b', 'réponse'], ['ask', 'Longueur c ?'], ['set', 'c', 'réponse'],
      ['if', ['=', ['+', ['*', 'a', 'a'], ['*', 'b', 'b']], ['*', 'c', 'c']], [['sayt', 'rectangle']], [['sayt', 'pas rectangle']]]];
    var say = lastSay(ast, [a, b, c]), cc = qcm(say, ['rectangle', 'pas rectangle']);
    return mk({ type: 'qcm', progAst: ast, choices: cc.choices, correct: cc.correct, answerText: say, q: 'On tape <b>' + a + '</b>, <b>' + b + '</b> et <b>' + c + '</b> (c est le plus grand côté). Que dit le lutin ?', corrige: '<p>Le programme teste si a² + b² = c² (<b>réciproque du théorème de Pythagore</b>).</p><p>' + a + '² + ' + b + '² = ' + a * a + ' + ' + b * b + ' = ' + (a * a + b * b) + ' et ' + c + '² = ' + c * c + '.</p><p>' + (a * a + b * b === c * c ? 'Les deux résultats sont égaux : le triangle est rectangle, le lutin dit « rectangle ».' : 'Les deux résultats sont différents : le triangle n’est pas rectangle, le lutin dit « pas rectangle ».') + '</p>', meta: { kind: 'sayt', inputs: [a, b, c], say: say } });
  } },
  { id: 'remise', niv: [1, 2, 3], gen: function () {
    var c = pick([[0.9, 10], [0.8, 20], [0.75, 25], [0.5, 50]]), S = pick([50, 100, 200]), hi = Math.random() < .5;
    var x = hi ? S + pick([20, 40, 60, 100, 200]) : S - pick([10, 20, 30, 40]);
    var ast = [['ask', 'Prix ?'], ['if', ['>', 'réponse', S], [['say', ['*', 'réponse', c[0]]]], [['say', 'réponse']]]];
    var ans = lastSay(ast, [x]);
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'Le lutin demande le prix : on tape <b>' + x + '</b>. Que dit-il ?', corrige: '<p>' + x + (hi ? ' &gt; ' : ' &lt; ') + S + ' : la condition est ' + (hi ? 'vraie' : 'fausse') + '.</p><p>' + (hi ? 'Multiplier par ' + fmt(c[0]) + ' revient à faire une remise de ' + c[1] + ' % : ' + x + ' × ' + fmt(c[0]) + ' = <b>' + fmt(ans) + '</b>.' : 'Le lutin dit le prix sans le changer : <b>' + fmt(ans) + '</b>.') + '</p>', meta: { kind: 'say', inputs: [x] } });
  } },
  { id: 'conversion', niv: [0, 1, 2, 3], gen: function (L) {
    var vars = [];
    if (L <= 1) vars.push('h');
    if (L >= 2) vars.push('v', 'f');
    var v = pick(vars), x, ast, ans, cor;
    if (v === 'h') { x = pick([2, 3, 4, 1.5, 2.5, 0.5, 5]); ast = [['ask', 'Durée en heures ?'], ['say', ['*', 'réponse', 60]]]; ans = rnd(x * 60); cor = '<p>Le lutin multiplie par 60 : 1 heure = 60 minutes. ' + fmt(x) + ' × 60 = <b>' + fmt(ans) + '</b>. Il convertit des <b>heures en minutes</b>.</p>'; }
    else if (v === 'v') { x = pick([18, 36, 54, 72, 90, 108, 126]); ast = [['ask', 'Vitesse en km/h ?'], ['say', ['/', 'réponse', 3.6]]]; ans = rnd(x / 3.6); cor = '<p>Le lutin divise par 3,6 : ' + fmt(x) + ' ÷ 3,6 = <b>' + fmt(ans) + '</b>. Il convertit des <b>km/h en m/s</b> (1 km/h = 1 000 m ÷ 3 600 s).</p>'; }
    else { x = pick([0, 10, 20, 25, 30, 40, -10, -5, 100]); ast = [['ask', 'Température en °C ?'], ['say', ['+', ['*', 'réponse', 1.8], 32]]]; ans = rnd(x * 1.8 + 32); cor = '<p>Le lutin calcule ' + pf(x) + ' × 1,8 + 32 = ' + fmt(rnd(x * 1.8)) + ' + 32 = <b>' + fmt(ans) + '</b>. Il convertit des <b>degrés Celsius en degrés Fahrenheit</b>.</p>'; }
    return mk({ type: 'num', progAst: ast, answer: ans, q: 'Le lutin demande un nombre : on tape <b>' + fmt(x) + '</b>. Que dit-il ?', corrige: cor, meta: { kind: 'say', inputs: [x] } });
  } }
];
function cvTest(mx, a, b) { return mx ? a > b : a < b; }

/* ===================== API ===================== */
var THEMES = [
  { id: 'calc1', nom: 'Programme de calcul avec boucle', tpl: CALC1 },
  { id: 'calc0', nom: 'Programme de calcul sans boucle', tpl: CALC0 },
  { id: 'geo1', nom: 'Programme d’instructions (géométrie) avec boucle', tpl: GEO1 },
  { id: 'geo0', nom: 'Programme d’instructions (géométrie) sans boucle', tpl: GEO0 },
  { id: 'oth', nom: 'Autres programmes', tpl: OTH }
];
function one(theme, L, last) {
  var th = THEMES.filter(function (t) { return t.id === theme; })[0];
  var ok = th.tpl.filter(function (t) { return t.niv.indexOf(L) >= 0; });
  var cand = ok.filter(function (t) { return t.id !== last; }); if (!cand.length) cand = ok;
  var t = pick(cand), q = t.gen(L);
  if (!q) q = ok[0].gen(L);
  q.theme = theme; q.tpl = t.id; q.niveau = L;
  return q;
}
function generate(L, themes, n) {
  n = n || 10;
  var order = [], pool = [];
  while (order.length < n) { if (!pool.length) pool = shuffle(themes); order.push(pool.pop()); }
  var out = [], seen = {}, lastTpl = {};
  order.forEach(function (th) {
    for (var t = 0; t < 40; t++) {
      var q = one(th, L, lastTpl[th]), key = q.prog + '|' + q.q;
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
var API = { generate: generate, THEMES: THEMES, verify: verify, parseNum: parseNum, run: run, analyse: analyse, text: text, fmt: fmt, templates: { CALC0: CALC0, CALC1: CALC1, GEO0: GEO0, GEO1: GEO1, OTH: OTH }, one: one };
if (typeof module !== 'undefined' && module.exports) module.exports = API; else root.GiroQuiz = API;
})(typeof window !== 'undefined' ? window : this);
