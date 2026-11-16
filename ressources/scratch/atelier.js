/* Atelier de briques GiroMaths : éditeur de blocs façon Scratch intégré à la page Scratch.
   - Blockly (Apache-2.0, Google) chargé à la demande : blockly_compressed.js + blockly-fr.js
   - Les briques de chaque mission sont données « en vrac » (voir SC_DATA, généré par scratch.py)
   - Scène 480 × 360 comme Scratch (x de -240 à 240, y de -180 à 180, direction 90 = droite)
   Rien n'est envoyé : l'assemblage est gardé dans le navigateur (localStorage). */
(function () {
  'use strict';
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/[^\/]*$/, '');
  var DATA = JSON.parse(document.getElementById('sc-data').textContent);
  var C = { motion: '#4C97FF', looks: '#9966FF', events: '#FFBF00', control: '#FFAB19', sensing: '#5CB1D6',
            operators: '#59C059', variables: '#FF8C1A', lists: '#FF661A', custom: '#FF6680', pen: '#0FBD8C' };
  var FLAG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 2v20" stroke="#45993d" stroke-width="2.5" stroke-linecap="round"/><path d="M6 3c4-2 7 2 13 0v10c-6 2-9-2-13 0z" fill="#4cbf56" stroke="#45993d" stroke-width="1.5" stroke-linejoin="round"/></svg>');
  var COULEURS = [['bleu', '#2563eb'], ['rouge', '#dc2626'], ['vert', '#16a34a'], ['orange', '#ea580c'], ['violet', '#9333ea'], ['noir', '#111827']];

  function num(id, v) { return { shadow: { type: 'sc_num', fields: { NUM: v } } }; }
  function txt(v) { return { shadow: { type: 'sc_text', fields: { TEXT: v } } }; }

  // ------------------------------------------------------------------ définitions des blocs
  var ROND = { type: 'input_value' }, HEX = { type: 'input_value', check: 'Boolean' };
  var R = ['Number', 'String'];
  function arg(n) { return Object.assign({ name: n }, ROND); }
  var DEFS = [
    { type: 'sc_num', message0: '%1', args0: [{ type: 'field_number', name: 'NUM', value: 0 }], output: null, colour: '#ffffff' },
    { type: 'sc_text', message0: '%1', args0: [{ type: 'field_input', name: 'TEXT', text: '' }], output: null, colour: '#ffffff' },
    // Événements
    { type: 'sc_flag', message0: 'quand %1 est cliqué', args0: [{ type: 'field_image', src: FLAG, width: 22, height: 22, alt: 'drapeau vert' }], nextStatement: null, colour: C.events, hat: 1 },
    // Mouvement
    { type: 'sc_move', message0: 'avancer de %1 pas', args0: [arg('N')], previousStatement: null, nextStatement: null, colour: C.motion, inputsInline: true },
    { type: 'sc_right', message0: 'tourner ↻ de %1 degrés', args0: [arg('N')], previousStatement: null, nextStatement: null, colour: C.motion, inputsInline: true },
    { type: 'sc_left', message0: 'tourner ↺ de %1 degrés', args0: [arg('N')], previousStatement: null, nextStatement: null, colour: C.motion, inputsInline: true },
    { type: 'sc_goto', message0: 'aller à x: %1 y: %2', args0: [arg('X'), arg('Y')], previousStatement: null, nextStatement: null, colour: C.motion, inputsInline: true },
    { type: 'sc_point', message0: "s'orienter à %1", args0: [arg('DIR')], previousStatement: null, nextStatement: null, colour: C.motion, inputsInline: true },
    { type: 'sc_glide', message0: 'glisser en %1 secondes à x: %2 y: %3', args0: [arg('S'), arg('X'), arg('Y')], previousStatement: null, nextStatement: null, colour: C.motion, inputsInline: true },
    // Apparence
    { type: 'sc_sayfor', message0: 'dire %1 pendant %2 secondes', args0: [arg('MSG'), arg('S')], previousStatement: null, nextStatement: null, colour: C.looks, inputsInline: true },
    { type: 'sc_say', message0: 'dire %1', args0: [arg('MSG')], previousStatement: null, nextStatement: null, colour: C.looks, inputsInline: true },
    { type: 'sc_hide', message0: 'cacher', previousStatement: null, nextStatement: null, colour: C.looks },
    { type: 'sc_show', message0: 'montrer', previousStatement: null, nextStatement: null, colour: C.looks },
    // Stylo
    { type: 'sc_clear', message0: 'effacer tout', previousStatement: null, nextStatement: null, colour: C.pen },
    { type: 'sc_pendown', message0: "stylo en position d'écriture", previousStatement: null, nextStatement: null, colour: C.pen },
    { type: 'sc_penup', message0: 'relever le stylo', previousStatement: null, nextStatement: null, colour: C.pen },
    { type: 'sc_pencolor', message0: 'mettre la couleur du stylo à %1', args0: [{ type: 'field_dropdown', name: 'COL', options: COULEURS.map(function (c) { return [c[0], c[1]]; }) }], previousStatement: null, nextStatement: null, colour: C.pen },
    // Contrôle
    { type: 'sc_wait', message0: 'attendre %1 secondes', args0: [arg('S')], previousStatement: null, nextStatement: null, colour: C.control, inputsInline: true },
    { type: 'sc_repeat', message0: 'répéter %1 fois %2 %3', args0: [arg('N'), { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, colour: C.control, inputsInline: true },
    { type: 'sc_until', message0: "répéter jusqu'à ce que %1 %2 %3", args0: [Object.assign({ name: 'COND' }, HEX), { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, colour: C.control, inputsInline: true },
    { type: 'sc_if', message0: 'si %1 alors %2 %3', args0: [Object.assign({ name: 'COND' }, HEX), { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }], previousStatement: null, nextStatement: null, colour: C.control, inputsInline: true },
    { type: 'sc_ifelse', message0: 'si %1 alors %2 %3 sinon %4 %5', args0: [Object.assign({ name: 'COND' }, HEX), { type: 'input_dummy' }, { type: 'input_statement', name: 'DO' }, { type: 'input_dummy' }, { type: 'input_statement', name: 'ELSE' }], previousStatement: null, nextStatement: null, colour: C.control, inputsInline: true },
    // Capteurs
    { type: 'sc_ask', message0: 'demander %1 et attendre', args0: [arg('Q')], previousStatement: null, nextStatement: null, colour: C.sensing, inputsInline: true },
    { type: 'sc_answer', message0: 'réponse', output: R, colour: C.sensing },
    // Opérateurs
    { type: 'sc_add', message0: '%1 + %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_sub', message0: '%1 - %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_mul', message0: '%1 * %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_div', message0: '%1 / %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_mod', message0: '%1 modulo %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_random', message0: 'nombre aléatoire entre %1 et %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_mathop', message0: '%1 de %2', args0: [{ type: 'field_dropdown', name: 'OP', options: [['plancher', 'plancher'], ['plafond', 'plafond'], ['racine', 'racine'], ['abs', 'abs']] }, arg('N')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_join', message0: 'regrouper %1 et %2', args0: [arg('A'), arg('B')], output: R, colour: C.operators, inputsInline: true },
    { type: 'sc_eq', message0: '%1 = %2', args0: [arg('A'), arg('B')], output: 'Boolean', colour: C.operators, inputsInline: true },
    { type: 'sc_lt', message0: '%1 < %2', args0: [arg('A'), arg('B')], output: 'Boolean', colour: C.operators, inputsInline: true },
    { type: 'sc_gt', message0: '%1 > %2', args0: [arg('A'), arg('B')], output: 'Boolean', colour: C.operators, inputsInline: true },
    { type: 'sc_and', message0: '%1 et %2', args0: [Object.assign({ name: 'A' }, HEX), Object.assign({ name: 'B' }, HEX)], output: 'Boolean', colour: C.operators, inputsInline: true },
    { type: 'sc_or', message0: '%1 ou %2', args0: [Object.assign({ name: 'A' }, HEX), Object.assign({ name: 'B' }, HEX)], output: 'Boolean', colour: C.operators, inputsInline: true },
    { type: 'sc_not', message0: 'non %1', args0: [Object.assign({ name: 'A' }, HEX)], output: 'Boolean', colour: C.operators, inputsInline: true },
    // Variables et listes
    { type: 'sc_var', message0: '%1', args0: [{ type: 'field_variable', name: 'VAR', variable: 'x' }], output: R, colour: C.variables },
    { type: 'sc_set', message0: 'mettre %1 à %2', args0: [{ type: 'field_variable', name: 'VAR', variable: 'x' }, arg('V')], previousStatement: null, nextStatement: null, colour: C.variables, inputsInline: true },
    { type: 'sc_change', message0: 'ajouter %1 à %2', args0: [arg('V'), { type: 'field_variable', name: 'VAR', variable: 'x' }], previousStatement: null, nextStatement: null, colour: C.variables, inputsInline: true },
    { type: 'sc_listadd', message0: 'ajouter %1 à la liste %2', args0: [arg('V'), { type: 'field_variable', name: 'LIST', variable: 'liste', variableTypes: ['list'], defaultType: 'list' }], previousStatement: null, nextStatement: null, colour: C.lists, inputsInline: true },
    { type: 'sc_listclear', message0: 'supprimer tous les éléments de la liste %1', args0: [{ type: 'field_variable', name: 'LIST', variable: 'liste', variableTypes: ['list'], defaultType: 'list' }], previousStatement: null, nextStatement: null, colour: C.lists },
    { type: 'sc_listlen', message0: 'longueur de %1', args0: [{ type: 'field_variable', name: 'LIST', variable: 'liste', variableTypes: ['list'], defaultType: 'list' }], output: R, colour: C.lists },
    // Mes blocs
    { type: 'sc_def0', message0: 'définir %1', args0: [{ type: 'field_label_serializable', name: 'NAME', text: 'bloc' }], nextStatement: null, colour: C.custom, hat: 1 },
    { type: 'sc_def1', message0: 'définir %1 ( %2 )', args0: [{ type: 'field_label_serializable', name: 'NAME', text: 'bloc' }, { type: 'field_label_serializable', name: 'PARAM', text: 'k' }], nextStatement: null, colour: C.custom, hat: 1 },
    { type: 'sc_call0', message0: '%1', args0: [{ type: 'field_label_serializable', name: 'NAME', text: 'bloc' }], previousStatement: null, nextStatement: null, colour: C.custom },
    { type: 'sc_call1', message0: '%1 %2', args0: [{ type: 'field_label_serializable', name: 'NAME', text: 'bloc' }, arg('V')], previousStatement: null, nextStatement: null, colour: C.custom, inputsInline: true },
    { type: 'sc_param', message0: '%1', args0: [{ type: 'field_label_serializable', name: 'NAME', text: 'k' }], output: R, colour: C.custom }
  ];
  // entrées vides par défaut quand on prend un bloc dans la palette
  var OMBRES = {
    sc_move: { N: num(0, 10) }, sc_right: { N: num(0, 15) }, sc_left: { N: num(0, 15) }, sc_goto: { X: num(0, 0), Y: num(0, 0) },
    sc_point: { DIR: num(0, 90) }, sc_glide: { S: num(0, 1), X: num(0, 0), Y: num(0, 0) }, sc_sayfor: { MSG: txt('Bonjour !'), S: num(0, 2) },
    sc_say: { MSG: txt('Bonjour !') }, sc_wait: { S: num(0, 1) }, sc_repeat: { N: num(0, 10) }, sc_ask: { Q: txt('Quel est ton nom ?') },
    sc_add: { A: num(0, ''), B: num(0, '') }, sc_sub: { A: num(0, ''), B: num(0, '') }, sc_mul: { A: num(0, ''), B: num(0, '') },
    sc_div: { A: num(0, ''), B: num(0, '') }, sc_mod: { A: num(0, ''), B: num(0, '') }, sc_random: { A: num(0, 1), B: num(0, 10) },
    sc_mathop: { N: num(0, '') }, sc_join: { A: txt('pomme '), B: txt('banane') }, sc_eq: { A: num(0, ''), B: num(0, 50) },
    sc_lt: { A: num(0, ''), B: num(0, 50) }, sc_gt: { A: num(0, ''), B: num(0, 50) }, sc_set: { V: txt('0') }, sc_change: { V: num(0, 1) },
    sc_listadd: { V: txt('chose') }, sc_call1: { V: num(0, 1) }
  };

  // ------------------------------------------------------------------ chargement de Blockly
  var pret = null;
  function charge(src) { return new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.appendChild(s); }); }
  function chargeBlockly() {
    if (pret) return pret;
    pret = charge(BASE + 'blockly_compressed.js').then(function () { return charge(BASE + 'blockly-fr.js'); }).then(function () {
      DEFS.forEach(function (d) {
        var def = Object.assign({}, d), hat = def.hat; delete def.hat;
        Blockly.Blocks[d.type] = { init: function () { this.jsonInit(def); if (hat) this.hat = 'cap'; } };
      });
    });
    return pret;
  }

  // ------------------------------------------------------------------ fenêtre de l'atelier
  var ws = null, mission = null, el = {};
  function construitFenetre() {
    var d = document.createElement('div');
    d.className = 'at'; d.hidden = true;
    d.innerHTML = '<div class="at-top"><span class="at-num"></span><b class="at-titre"></b>' +
      '<button type="button" class="at-btn at-vrac" title="Redonner toutes les briques en vrac">Briques en vrac</button>' +
      '<button type="button" class="at-x" aria-label="Fermer l\'atelier">×</button></div>' +
      '<div class="at-main"><div class="at-ws"></div><div class="at-side">' +
      '<div class="at-ctrl"><button type="button" class="at-go" title="Drapeau vert : lancer le programme"><img alt="" src="' + FLAG + '"> Lancer</button>' +
      '<button type="button" class="at-stop" title="Arrêter">■ Stop</button><span class="at-etat"></span></div>' +
      '<div class="at-stage"><canvas class="at-c at-ghost" width="960" height="720"></canvas><canvas class="at-c at-pen" width="960" height="720"></canvas>' +
      '<canvas class="at-c at-spr" width="960" height="720"></canvas><div class="at-mon"></div><div class="at-bulle" hidden></div>' +
      '<form class="at-ask" hidden><input type="text" autocomplete="off" aria-label="Ta réponse"><button type="submit">✓</button></form></div>' +
      '<p class="at-aide">Assemble les briques à gauche (glisse-les pour les emboîter), puis clique sur <b>Lancer</b>. Les pointillés gris montrent la figure attendue.</p>' +
      '<div class="at-mission"></div></div></div>';
    document.body.appendChild(d);
    el.root = d; el.ws = d.querySelector('.at-ws'); el.titre = d.querySelector('.at-titre'); el.num = d.querySelector('.at-num');
    el.ghost = d.querySelector('.at-ghost'); el.pen = d.querySelector('.at-pen'); el.spr = d.querySelector('.at-spr');
    el.mon = d.querySelector('.at-mon'); el.bulle = d.querySelector('.at-bulle'); el.ask = d.querySelector('.at-ask');
    el.input = el.ask.querySelector('input'); el.mission = d.querySelector('.at-mission'); el.etat = d.querySelector('.at-etat');
    el.aide = d.querySelector('.at-aide');
    d.querySelector('.at-x').onclick = ferme;
    d.querySelector('.at-go').onclick = function () { lance(); };
    d.querySelector('.at-stop').onclick = arrete;
    d.querySelector('.at-vrac').onclick = function () { if (confirmeVrac()) enVrac(); };
    el.ask.onsubmit = function (e) { e.preventDefault(); if (attenteReponse) { var f = attenteReponse; attenteReponse = null; f(el.input.value); } };
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !d.hidden && !attenteReponse) ferme(); });
    [el.ghost, el.pen, el.spr].forEach(function (c) { c.getContext('2d').setTransform(2, 0, 0, 2, 480, 360); });
  }
  function confirmeVrac() {
    // pas de boîte de dialogue bloquante : un deuxième clic dans les 3 s confirme
    var b = el.root.querySelector('.at-vrac');
    if (b.dataset.ok) { delete b.dataset.ok; b.textContent = 'Briques en vrac'; return true; }
    b.dataset.ok = 1; b.textContent = 'Sûr ? Clique encore'; setTimeout(function () { delete b.dataset.ok; b.textContent = 'Briques en vrac'; }, 3000);
    return false;
  }

  function boite() {
    var m = mission, cats = [];
    function bl(type, extra) { var o = { kind: 'block', type: type }; if (OMBRES[type]) o.inputs = OMBRES[type]; return Object.assign(o, extra || {}); }
    cats.push({ kind: 'category', name: 'Mouvement', colour: C.motion, contents: ['sc_move', 'sc_right', 'sc_left', 'sc_goto', 'sc_point', 'sc_glide'].map(function (t) { return bl(t); }) });
    cats.push({ kind: 'category', name: 'Apparence', colour: C.looks, contents: ['sc_sayfor', 'sc_say', 'sc_hide', 'sc_show'].map(function (t) { return bl(t); }) });
    cats.push({ kind: 'category', name: 'Stylo', colour: C.pen, contents: ['sc_clear', 'sc_pendown', 'sc_penup', 'sc_pencolor'].map(function (t) { return bl(t); }) });
    cats.push({ kind: 'category', name: 'Événements', colour: C.events, contents: [bl('sc_flag')] });
    cats.push({ kind: 'category', name: 'Contrôle', colour: C.control, contents: ['sc_wait', 'sc_repeat', 'sc_until', 'sc_if', 'sc_ifelse'].map(function (t) { return bl(t); }) });
    cats.push({ kind: 'category', name: 'Capteurs', colour: C.sensing, contents: [bl('sc_ask'), bl('sc_answer')] });
    cats.push({ kind: 'category', name: 'Opérateurs', colour: C.operators, contents: ['sc_add', 'sc_sub', 'sc_mul', 'sc_div', 'sc_random', 'sc_gt', 'sc_lt', 'sc_eq', 'sc_and', 'sc_or', 'sc_not', 'sc_join', 'sc_mod', 'sc_mathop'].map(function (t) { return bl(t); }) });
    cats.push({ kind: 'category', name: 'Variables', colour: C.variables, custom: 'SC_VARS' });
    var perso = [];
    m.defs.forEach(function (d) {
      perso.push(d.param ? { kind: 'block', type: 'sc_call1', fields: { NAME: d.nom }, inputs: OMBRES.sc_call1 } : { kind: 'block', type: 'sc_call0', fields: { NAME: d.nom } });
      if (d.param) perso.push({ kind: 'block', type: 'sc_param', fields: { NAME: d.param } });
    });
    if (perso.length) cats.push({ kind: 'category', name: 'Mes blocs', colour: C.custom, contents: perso });
    return { kind: 'categoryToolbox', contents: cats };
  }
  function categorieVariables(w) {
    var out = [{ kind: 'button', text: 'Créer une variable', callbackKey: 'SC_NEWVAR' }];
    var vs = w.getVariablesOfType('');
    vs.forEach(function (v) { out.push({ kind: 'block', type: 'sc_var', fields: { VAR: { id: v.getId() } } }); });
    if (vs.length) {
      out.push({ kind: 'block', type: 'sc_set', fields: { VAR: { id: vs[0].getId() } }, inputs: OMBRES.sc_set });
      out.push({ kind: 'block', type: 'sc_change', fields: { VAR: { id: vs[0].getId() } }, inputs: OMBRES.sc_change });
    }
    var ls = w.getVariablesOfType('list');
    ls.forEach(function (l) {
      out.push({ kind: 'block', type: 'sc_listadd', fields: { LIST: { id: l.getId() } }, inputs: OMBRES.sc_listadd });
      out.push({ kind: 'block', type: 'sc_listclear', fields: { LIST: { id: l.getId() } } });
      out.push({ kind: 'block', type: 'sc_listlen', fields: { LIST: { id: l.getId() } } });
    });
    return out;
  }

  function creeEspace() {
    var theme = Blockly.Theme.defineTheme('giromaths', { base: Blockly.Themes.Classic, fontStyle: { family: 'Inter, system-ui, sans-serif', weight: '600', size: 11 },
      componentStyles: { workspaceBackgroundColour: '#f9f9fb', toolboxBackgroundColour: '#ffffff', flyoutBackgroundColour: '#f1f3f8', flyoutOpacity: 1, scrollbarColour: '#ced4e0' } });
    ws = Blockly.inject(el.ws, { toolbox: boite(), renderer: 'zelos', theme: theme, media: BASE + 'blockly-media/', sounds: false, trashcan: true,
      zoom: { controls: true, wheel: false, startScale: 0.8, maxScale: 2, minScale: 0.4 }, move: { scrollbars: true, drag: true, wheel: true },
      grid: { spacing: 40, length: 2, colour: '#e3e6ee', snap: false } });
    ws.registerToolboxCategoryCallback('SC_VARS', categorieVariables);
    ws.registerButtonCallback('SC_NEWVAR', function () { Blockly.Variables.createVariableButtonHandler(ws, null, ''); });
    var t = null;
    ws.addChangeListener(function (e) { if (e.isUiEvent || !mission || chargement) return; clearTimeout(t); t = setTimeout(sauve, 400); });
  }
  var chargement = false;
  function cle() { return 'giromaths-atelier-' + mission.id; }
  function sauve() { try { localStorage.setItem(cle(), JSON.stringify(Blockly.serialization.workspaces.save(ws))); } catch (e) {} }

  function variables() {
    return mission.vars.map(function (n) { return { name: n, id: 'v_' + n, type: '' }; })
      .concat(mission.lists.map(function (n) { return { name: n, id: 'l_' + n, type: 'list' }; }));
  }
  // découpe les scripts solutions en briques : chaque instruction seule, les blocs C vides,
  // les calculs (blocs ronds et hexagonaux) restent dans leur brique.
  function morceaux() {
    var out = [];
    function prend(b) {
      while (b) {
        var c = JSON.parse(JSON.stringify(b)); delete c.next;
        ['DO', 'ELSE'].forEach(function (k) { if (c.inputs && c.inputs[k]) { prend(c.inputs[k].block); delete c.inputs[k]; } });
        out.push(c);
        b = b.next && b.next.block;
      }
    }
    mission.scripts.forEach(prend);
    var tetes = out.filter(function (b) { return /^sc_(flag|def)/.test(b.type); }), reste = out.filter(function (b) { return !/^sc_(flag|def)/.test(b.type); });
    for (var i = reste.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = reste[i]; reste[i] = reste[j]; reste[j] = x; }
    return tetes.concat(reste);
  }
  function charge_(blocs) {
    chargement = true;
    ws.clear();
    Blockly.serialization.workspaces.load({ variables: variables(), blocks: { languageVersion: 0, blocks: blocs } }, ws);
    chargement = false;
  }
  function range() {
    var tops = ws.getTopBlocks(false).sort(function (a, b) { return a.__ordre - b.__ordre; });
    var h = el.ws.clientHeight / ws.scale - 40, x = 20, y = 20, col = 0;
    tops.forEach(function (b) {
      var s = b.getHeightWidth();
      if (y > 20 && y + s.height > h) { x += col + 30; y = 20; col = 0; }
      b.moveTo(new Blockly.utils.Coordinate(x, y));
      y += s.height + 18; col = Math.max(col, s.width);
    });
    ws.scrollCenter(); ws.scroll(0, 0);
  }
  function enVrac() {
    var m = morceaux();
    charge_(m);
    ws.getTopBlocks(true).forEach(function (b, i) { b.__ordre = i; });
    // getTopBlocks(true) trie par position : on garde l'ordre de chargement
    var tops = ws.getTopBlocks(false); tops.forEach(function (b, i) { b.__ordre = i; });
    range(); sauve();
  }
  function chargeSolution() { charge_(JSON.parse(JSON.stringify(mission.scripts))); ws.getTopBlocks(false).forEach(function (b, i) { b.moveBy(20 + i * 420, 20); }); }

  function ouvre(id) {
    mission = DATA[id];
    if (!el.root) construitFenetre();
    el.root.hidden = false; document.body.classList.add('at-ouvert');
    el.root.style.setProperty('--at', mission.col);
    el.titre.textContent = mission.titre; el.num.textContent = mission.niveau + ' · mission ' + mission.n;
    var carte = document.getElementById('m-' + id);
    el.mission.innerHTML = '';
    if (carte) ['.sc-but', '.sc-tests'].forEach(function (s) { var n = carte.querySelector(s); if (n) el.mission.appendChild(n.cloneNode(true)); });
    el.aide.innerHTML = 'Assemble les briques à gauche (glisse-les pour les emboîter), puis clique sur <b>Lancer</b>.' + (mission.ghost ? ' Les pointillés gris montrent la figure attendue.' : '');
    return chargeBlockly().then(function () {
      if (!ws) creeEspace(); else ws.updateToolbox(boite());
      Blockly.svgResize(ws);
      var sauvé = null; try { sauvé = JSON.parse(localStorage.getItem(cle())); } catch (e) {}
      if (sauvé) { chargement = true; ws.clear(); Blockly.serialization.workspaces.load(sauvé, ws); chargement = false; variables().forEach(function (v) { if (!ws.getVariableById(v.id)) ws.createVariable(v.name, v.type, v.id); }); }
      else enVrac();
      reinitScene(); dessineFantome(); el.etat.textContent = '';
    });
  }
  function ferme() { arrete(); el.root.hidden = true; document.body.classList.remove('at-ouvert'); }

  // ------------------------------------------------------------------ scène et exécution
  var S = null, stop = false, enCours = false, attenteReponse = null, redessine = false;
  function reinitScene() {
    S = { x: 0, y: 0, dir: 90, stylo: false, couleur: '#2563eb', visible: true, vars: {}, listes: {}, reponse: '', bulle: '' };
    el.pen.getContext('2d').clearRect(-240, -180, 480, 360);
    el.bulle.hidden = true; el.ask.hidden = true; dessineLutin(); dessineMoniteurs();
    window.scAtelier.traits = [];
  }
  function dessineFantome() {
    var g = el.ghost.getContext('2d'); g.clearRect(-240, -180, 480, 360);
    g.strokeStyle = '#e5e7eb'; g.lineWidth = 1;
    for (var x = -200; x <= 240; x += 40) { g.beginPath(); g.moveTo(x, -180); g.lineTo(x, 180); g.stroke(); }
    for (var y = -160; y <= 180; y += 40) { g.beginPath(); g.moveTo(-240, y); g.lineTo(240, y); g.stroke(); }
    g.strokeStyle = '#9ca3af'; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(-240, 0); g.lineTo(240, 0); g.moveTo(0, -180); g.lineTo(0, 180); g.stroke();
    if (mission.ghost) {
      g.strokeStyle = 'rgba(100,116,139,.55)'; g.lineWidth = 5; g.setLineDash([3, 7]); g.lineCap = 'round';
      mission.ghost.traits.forEach(function (t) { g.beginPath(); t.forEach(function (p, i) { if (i) g.lineTo(p[0], -p[1]); else g.moveTo(p[0], -p[1]); }); g.stroke(); });
      g.setLineDash([]); g.fillStyle = '#334155'; g.font = '700 15px system-ui';
      mission.ghost.points.forEach(function (p) { g.beginPath(); g.arc(p[1], -p[2], 4, 0, 7); g.fill(); g.fillText(p[0], p[1] + 7, -p[2] - 7); });
    }
    g.setLineDash([]);
  }
  function dessineLutin() {
    var c = el.spr.getContext('2d'); c.clearRect(-240, -180, 480, 360);
    if (!S.visible) return;
    c.save(); c.translate(S.x, -S.y); c.rotate((S.dir - 90) * Math.PI / 180);
    c.fillStyle = mission ? mission.col : '#4d7c0f'; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(16, 0); c.lineTo(-10, -11); c.lineTo(-5, 0); c.lineTo(-10, 11); c.closePath(); c.fill(); c.stroke();
    c.restore();
    // bulle
    if (S.bulle !== '') {
      el.bulle.hidden = false; el.bulle.textContent = S.bulle;
      el.bulle.style.left = Math.min(78, Math.max(2, (S.x + 240) / 4.8 + 3)) + '%';
      el.bulle.style.bottom = Math.min(80, Math.max(2, (S.y + 180) / 3.6 + 5)) + '%';
    } else el.bulle.hidden = true;
  }
  function dessineMoniteurs() {
    var h = '';
    Object.keys(S.vars).forEach(function (k) { h += '<div class="at-v"><span>' + esc(k) + '</span><b>' + esc(String(S.vars[k])) + '</b></div>'; });
    Object.keys(S.listes).forEach(function (k) { h += '<div class="at-l"><span>' + esc(k) + '</span><ol>' + S.listes[k].map(function (v) { return '<li>' + esc(String(v)) + '</li>'; }).join('') + '</ol><small>longueur ' + S.listes[k].length + '</small></div>'; });
    el.mon.innerHTML = h;
  }
  function esc(s) { return s.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function image() { return new Promise(function (ok) { requestAnimationFrame(function () { dessineLutin(); dessineMoniteurs(); ok(); }); }); }
  function pause(ms) {
    if (window.scAtelier.rapide) return image();
    return new Promise(function (ok) { var t0 = performance.now(); (function f() { if (stop || performance.now() - t0 >= ms) ok(); else requestAnimationFrame(function () { dessineLutin(); dessineMoniteurs(); f(); }); })(); });
  }

  // valeurs à la manière de Scratch
  function nb(v) { if (typeof v === 'number') return isNaN(v) ? 0 : v; if (typeof v === 'boolean') return v ? 1 : 0; var s = String(v).trim(); if (s === '') return 0; var n = Number(s); return isNaN(n) ? 0 : n; }
  function compare(a, b) {
    var na = Number(a), nbb = Number(b);
    var vide = function (v) { return typeof v === 'string' && v.trim() === ''; };
    if (isNaN(na) || isNaN(nbb) || vide(a) || vide(b)) { var sa = String(a).toLowerCase(), sb = String(b).toLowerCase(); return sa < sb ? -1 : sa > sb ? 1 : 0; }
    return na < nbb ? -1 : na > nbb ? 1 : 0;
  }
  function texte(v) { return String(v); }

  function nomVar(b, f) { var v = b.getField(f).getVariable(); return v ? v.name : ''; }
  function val(b, nom, ctx) { var t = b.getInputTargetBlock(nom); return t ? evalue(t, ctx) : ''; }
  function evalue(b, ctx) {
    switch (b.type) {
      case 'sc_num': var n = b.getFieldValue('NUM'); return n === '' ? '' : Number(n);
      case 'sc_text': return b.getFieldValue('TEXT');
      case 'sc_answer': return S.reponse;
      case 'sc_var': var k = nomVar(b, 'VAR'); return k in S.vars ? S.vars[k] : 0;
      case 'sc_param': return ctx.params && b.getFieldValue('NAME') in ctx.params ? ctx.params[b.getFieldValue('NAME')] : '';
      case 'sc_add': return nb(val(b, 'A', ctx)) + nb(val(b, 'B', ctx));
      case 'sc_sub': return nb(val(b, 'A', ctx)) - nb(val(b, 'B', ctx));
      case 'sc_mul': return nb(val(b, 'A', ctx)) * nb(val(b, 'B', ctx));
      case 'sc_div': return nb(val(b, 'A', ctx)) / nb(val(b, 'B', ctx));
      case 'sc_mod': var a = nb(val(b, 'A', ctx)), m = nb(val(b, 'B', ctx)), r = a % m; if (r / m < 0) r += m; return r;
      case 'sc_random':
        var lo = nb(val(b, 'A', ctx)), hi = nb(val(b, 'B', ctx)); if (lo > hi) { var t = lo; lo = hi; hi = t; }
        if (Number.isInteger(lo) && Number.isInteger(hi)) return lo + Math.floor(Math.random() * (hi - lo + 1));
        return lo + Math.random() * (hi - lo);
      case 'sc_mathop':
        var x = nb(val(b, 'N', ctx)), op = b.getFieldValue('OP');
        return op === 'plancher' ? Math.floor(x) : op === 'plafond' ? Math.ceil(x) : op === 'racine' ? Math.sqrt(x) : Math.abs(x);
      case 'sc_join': return texte(val(b, 'A', ctx)) + texte(val(b, 'B', ctx));
      case 'sc_eq': return compare(val(b, 'A', ctx), val(b, 'B', ctx)) === 0;
      case 'sc_lt': return compare(val(b, 'A', ctx), val(b, 'B', ctx)) < 0;
      case 'sc_gt': return compare(val(b, 'A', ctx), val(b, 'B', ctx)) > 0;
      case 'sc_and': return !!val(b, 'A', ctx) && !!val(b, 'B', ctx);
      case 'sc_or': return !!val(b, 'A', ctx) || !!val(b, 'B', ctx);
      case 'sc_not': return !val(b, 'A', ctx);
      case 'sc_listlen': var l = S.listes[nomVar(b, 'LIST')]; return l ? l.length : 0;
    }
    return '';
  }
  function va(x, y) {
    if (S.stylo) {
      var c = el.pen.getContext('2d'); c.strokeStyle = S.couleur; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(S.x, -S.y); c.lineTo(x, -y); c.stroke();
      window.scAtelier.traits.push([S.x, S.y, x, y]);
    }
    S.x = x; S.y = y; redessine = true;
  }
  var compteur = 0;
  async function boucle() { if (redessine) { redessine = false; await image(); } else if (++compteur % 3000 === 0) await image(); }
  async function pile(b, ctx) { while (b && !stop) { await instr(b, ctx); b = b.getNextBlock(); } }
  async function instr(b, ctx) {
    var a;
    switch (b.type) {
      case 'sc_move': a = (S.dir - 90) * Math.PI / 180; var n = nb(val(b, 'N', ctx)); va(S.x + n * Math.cos(a), S.y - n * Math.sin(a)); return;
      case 'sc_right': S.dir = norm(S.dir + nb(val(b, 'N', ctx))); redessine = true; return;
      case 'sc_left': S.dir = norm(S.dir - nb(val(b, 'N', ctx))); redessine = true; return;
      case 'sc_goto': va(nb(val(b, 'X', ctx)), nb(val(b, 'Y', ctx))); return;
      case 'sc_point': S.dir = norm(nb(val(b, 'DIR', ctx))); redessine = true; return;
      case 'sc_glide':
        var s = nb(val(b, 'S', ctx)), x1 = nb(val(b, 'X', ctx)), y1 = nb(val(b, 'Y', ctx)), x0 = S.x, y0 = S.y, t0 = performance.now();
        if (!window.scAtelier.rapide) while (!stop) { var k = Math.min(1, (performance.now() - t0) / (s * 1000 || 1)); va(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); await image(); if (k >= 1) break; }
        va(x1, y1); return;
      case 'sc_sayfor': S.bulle = texte(val(b, 'MSG', ctx)); journal(S.bulle); dessineLutin(); await pause(nb(val(b, 'S', ctx)) * 1000); S.bulle = ''; dessineLutin(); return;
      case 'sc_say': S.bulle = texte(val(b, 'MSG', ctx)); journal(S.bulle); redessine = true; return;
      case 'sc_hide': S.visible = false; redessine = true; return;
      case 'sc_show': S.visible = true; redessine = true; return;
      case 'sc_clear': el.pen.getContext('2d').clearRect(-240, -180, 480, 360); window.scAtelier.traits = []; return;
      case 'sc_pendown': S.stylo = true; return;
      case 'sc_penup': S.stylo = false; return;
      case 'sc_pencolor': S.couleur = b.getFieldValue('COL'); return;
      case 'sc_wait': await pause(nb(val(b, 'S', ctx)) * 1000); return;
      case 'sc_repeat':
        var fois = Math.round(nb(val(b, 'N', ctx)));
        for (var i = 0; i < fois && !stop; i++) { await pile(b.getInputTargetBlock('DO'), ctx); await boucle(); }
        return;
      case 'sc_until': while (!stop && !val(b, 'COND', ctx)) { await pile(b.getInputTargetBlock('DO'), ctx); await boucle(); } return;
      case 'sc_if': if (val(b, 'COND', ctx)) await pile(b.getInputTargetBlock('DO'), ctx); return;
      case 'sc_ifelse': await pile(b.getInputTargetBlock(val(b, 'COND', ctx) ? 'DO' : 'ELSE'), ctx); return;
      case 'sc_ask':
        var q = texte(val(b, 'Q', ctx)); journal('? ' + q);
        if (window.scAtelier.reponses.length) { S.reponse = String(window.scAtelier.reponses.shift()); return; }
        S.bulle = q; dessineLutin(); el.ask.hidden = false; el.input.value = ''; el.input.focus();
        S.reponse = await new Promise(function (ok) { attenteReponse = ok; });
        el.ask.hidden = true; S.bulle = ''; dessineLutin(); return;
      case 'sc_set': S.vars[nomVar(b, 'VAR')] = val(b, 'V', ctx); redessine = true; return;
      case 'sc_change': var kv = nomVar(b, 'VAR'); S.vars[kv] = nb(S.vars[kv]) + nb(val(b, 'V', ctx)); redessine = true; return;
      case 'sc_listadd': var kl = nomVar(b, 'LIST'); (S.listes[kl] = S.listes[kl] || []).push(val(b, 'V', ctx)); redessine = true; return;
      case 'sc_listclear': S.listes[nomVar(b, 'LIST')] = []; redessine = true; return;
      case 'sc_call0': case 'sc_call1':
        var nom = b.getFieldValue('NAME'), def = ws.getTopBlocks(false).filter(function (d) { return /^sc_def/.test(d.type) && d.getFieldValue('NAME') === nom; })[0];
        if (!def) return;
        var p = {}; if (def.type === 'sc_def1') p[def.getFieldValue('PARAM')] = b.type === 'sc_call1' ? val(b, 'V', ctx) : '';
        await pile(def.getNextBlock(), { params: p }); return;
    }
  }
  function norm(d) { d = ((d + 179) % 360 + 360) % 360 - 179; return d; }
  function journal(t) { window.scAtelier.journal.push(t); }

  async function lance() {
    if (enCours) { arrete(); await new Promise(function (r) { setTimeout(r, 50); }); }
    var hats = ws.getTopBlocks(true).filter(function (b) { return b.type === 'sc_flag'; });
    if (!hats.length) { el.etat.textContent = 'Il manque la brique « quand le drapeau vert est cliqué » en haut du programme.'; return; }
    stop = false; enCours = true; el.root.classList.add('at-run'); el.etat.textContent = 'Le programme tourne…';
    window.scAtelier.journal = [];
    S.bulle = ''; el.bulle.hidden = true;
    try { await Promise.all(hats.map(function (h) { return pile(h.getNextBlock(), {}); })); }
    catch (e) { el.etat.textContent = 'Erreur : ' + e.message; }
    enCours = false; el.root.classList.remove('at-run'); dessineLutin(); dessineMoniteurs();
    if (!/Erreur|Il manque/.test(el.etat.textContent)) el.etat.textContent = stop ? 'Arrêté.' : 'Terminé. Compare avec ce que tu dois obtenir.';
  }
  function arrete() { stop = true; if (attenteReponse) { var f = attenteReponse; attenteReponse = null; f(''); } if (el.ask) el.ask.hidden = true; }

  window.scAtelier = { ouvre: ouvre, ferme: ferme, lance: lance, arrete: arrete, chargeSolution: chargeSolution, enVrac: enVrac,
    reponses: [], journal: [], traits: [], rapide: false, etat: function () { return { S: S, enCours: enCours }; }, ws: function () { return ws; } };
  document.querySelectorAll('.sc-assembler').forEach(function (b) { b.addEventListener('click', function () { ouvre(b.dataset.id); }); });
})();
