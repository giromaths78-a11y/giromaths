/* GiroMaths – ouverture des évaluations chiffrées (généré par evaluations.py). Ne pas modifier ici. */
(function () {
  var MDP = 'giro-eval-mdp', cleCache = null, mdpCache = null;
  function lire(s, k) { try { return s.getItem(k); } catch (e) { return null; } }
  function ecrire(s, k, v) { try { if (v === null) s.removeItem(k); else s.setItem(k, v); } catch (e) {} }
  function u8(b) { var s = atob(b), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function racine() { var s = document.querySelector('script[src$="evaluations.js"]'); return s ? s.src.replace(/evaluations\.js.*$/, '') : ''; }
  async function clePrivee(mdp) {
    if (cleCache && mdpCache === mdp) return cleCache;
    var r = await fetch(racine() + 'evaluations/cle.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('reseau');
    var d = await r.json(), C = crypto.subtle;
    var base = await C.importKey('raw', new TextEncoder().encode(mdp), 'PBKDF2', false, ['deriveKey']);
    var k = await C.deriveKey({ name: 'PBKDF2', salt: u8(d.sel), iterations: d.iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var der;
    try { der = await C.decrypt({ name: 'AES-GCM', iv: u8(d.iv) }, k, u8(d.ct)); } catch (e) { throw new Error('mdp'); }
    cleCache = await C.importKey('pkcs8', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
    mdpCache = mdp;
    return cleCache;
  }
  async function dechiffrer(url, mdp) {
    var priv = await clePrivee(mdp);
    var r = await fetch(url);
    if (!r.ok) throw new Error('reseau');
    var b = new Uint8Array(await r.arrayBuffer()), C = crypto.subtle;
    if (String.fromCharCode.apply(null, b.subarray(0, 5)) !== 'GIRO2') throw new Error('format');
    var n = (b[5] << 8) | b[6], env = b.subarray(7, 7 + n), iv = b.subarray(7 + n, 19 + n), ct = b.subarray(19 + n);
    var brut = await C.decrypt({ name: 'RSA-OAEP' }, priv, env);
    var k = await C.importKey('raw', brut, 'AES-GCM', false, ['decrypt']);
    return new Blob([await C.decrypt({ name: 'AES-GCM', iv: iv }, k, ct)], { type: 'application/pdf' });
  }
  function message(e) {
    if (!window.crypto || !crypto.subtle) return "Ce navigateur ne peut pas déchiffrer ici : ouvre le site en ligne (adresse en https).";
    if (e && e.message === 'mdp') return 'Mot de passe incorrect.';
    if (location.protocol === 'file:') return "Les évaluations s'ouvrent depuis le site en ligne, pas depuis le dossier du zip.";
    return "Impossible d'ouvrir le fichier (connexion ?).";
  }
  async function ouvrir(a, mdp, fen, form) {
    var msg = form.querySelector('.eval-msg');
    msg.textContent = 'Déchiffrement…';
    try {
      var blob = await dechiffrer(a.href, mdp), url = URL.createObjectURL(blob);
      if (fen && !fen.closed) fen.location.href = url;
      else { var l = document.createElement('a'); l.href = url; l.download = a.getAttribute('data-eval'); document.body.appendChild(l); l.click(); l.remove(); }
      msg.textContent = '';
      form.hidden = true;
      ecrire(sessionStorage, MDP, mdp);
      setTimeout(function () { URL.revokeObjectURL(url); }, 120000);
      return true;
    } catch (e) {
      if (fen && !fen.closed) fen.close();
      if (e && e.message === 'mdp') { ecrire(sessionStorage, MDP, null); ecrire(localStorage, MDP, null); }
      msg.textContent = message(e);
      form.hidden = false;
      return false;
    }
  }
  function fenetre() { var f = window.open('', '_blank'); if (f) { try { f.document.title = 'Évaluation…'; f.document.body.innerHTML = '<p style="font:16px sans-serif;padding:2em">Déchiffrement de l’évaluation…</p>'; } catch (e) {} } return f; }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[data-eval]');
    if (!a) return;
    ev.preventDefault();
    var sec = a.closest('section'), form = sec.querySelector('.eval-mdp');
    form._lien = a;
    var mdp = lire(sessionStorage, MDP) || lire(localStorage, MDP) || lire(sessionStorage, 'giro-code-admin');  // même mot de passe que admin.html
    if (mdp) { ouvrir(a, mdp, fenetre(), form); return; }
    form.hidden = false;
    form.querySelector('.eval-msg').textContent = '';
    form.querySelector('input[type=password]').focus();
  });
  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (!form.classList || !form.classList.contains('eval-mdp')) return;
    ev.preventDefault();
    var mdp = form.querySelector('input[type=password]').value, souv = form.querySelector('.eval-souv input').checked;
    if (!form._lien || !mdp) return;
    ouvrir(form._lien, mdp, fenetre(), form).then(function (ok) { if (ok && souv) ecrire(localStorage, MDP, mdp); });
  });
})();
