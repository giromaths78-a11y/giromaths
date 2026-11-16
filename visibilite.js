/* GiroMaths – visibilité des séquences (généré par visibilite.py). Ne pas modifier ici. */
(function () {
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbxaz5HAwC7yorN33ElYyYnHAIzmEdQgwhEmymQOGLgGKtFY89wGFdNzicSGHrDkmOiQgg/exec";
  var CACHE = 'giro-vis', ADMIN = 'giro-admin', TTL = 3 * 60 * 1000, ATTENTE = 3500;
  var d = document.documentElement, admin = false, cache = null;
  function lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  admin = lire(ADMIN) === '1';
  try { cache = JSON.parse(lire(CACHE) || 'null'); } catch (e) { cache = null; }
  if (admin) d.className += ' vis-admin';
  var style = document.createElement('style');
  document.head.appendChild(style);
  function valide(id) { return /^[0-9a-z]+-[0-9]{2}$/.test(id); }
  function sel(liste, suffixe) {
    return liste.map(function (id) { return suffixe.split('|').map(function (x) { return x.replace(/@/g, '[data-seq="' + id + '"]'); }).join(','); }).join(',');
  }
  var BADGE = 'font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:6px;';
  function appliquer(tout) {
    tout = (tout || []).filter(valide);
    window.GIRO_MASQUEES = tout;
    // "cor3eme-05" = corrigés PDF de la séquence 3eme-05 masqués ; les autres ids = séquences masquées
    var liste = tout.filter(function (id) { return id.indexOf('cor') !== 0; });
    var cor = tout.filter(function (id) { return id.indexOf('cor') === 0; }).map(function (id) { return id.slice(3); });
    var css = '';
    if (cor.length) css = admin
      ? sel(cor, 'body@ .res-list a.cor') + '{border-style:dashed!important;opacity:.6}' +
        sel(cor, 'body@ .res-list a.cor::after') + '{content:" · masqué"}' +
        sel(cor, 'body@ .vis-admin-cor') + '{display:block!important}'
      : sel(cor, 'body@ .res-list a.cor') + '{display:none!important}';
    if (!liste.length) { style.textContent = css; return; }
    if (admin) {   // le professeur voit tout, avec un repère « masquée aux élèves »
      style.textContent = sel(liste, '.seq@|li@ a') + '{border-style:dashed!important}' +
        sel(liste, '.seq@ .tags::after') + '{content:"Masquée aux élèves";' + BADGE + 'background:#151831;color:#fff}' +
        sel(liste, 'li@ .kind::before') + '{content:"Masquée · "}' +
        sel(liste, 'body@ .vis-admin-bar') + '{display:block!important}' + css;
    } else {       // l'élève voit la carte et l'histoire, mais pas les ressources
      style.textContent = sel(liste, '.seq@ .tag.ok') + '{display:none!important}' +
        sel(liste, '.seq@ .tags::after') + '{content:"Bientôt disponible";' + BADGE + 'background:#eef0f4;color:#62677f}' +
        sel(liste, 'li@ a') + '{pointer-events:none;opacity:.5}' +
        sel(liste, 'li@ .kind') + '{font-size:0!important}' +
        sel(liste, 'li@ .kind::after') + '{content:"Bientôt disponible";font-size:.72rem}' +
        sel(liste, 'body@ .toc|body@ .res-grid|body@ .vis-cache') + '{display:none!important}' +
        sel(liste, 'body@ .vis-locked') + '{display:block!important}' + css;
    }
  }
  function fini() { d.className = d.className.replace(/\s*vis-attente/g, ''); }
  window.GiroVisibilite = { appliquer: appliquer, endpoint: ENDPOINT };
  if (cache && cache.l) appliquer(cache.l);
  var frais = cache && cache.t && (Date.now() - cache.t < TTL);
  if (frais || !ENDPOINT || /[?&]vis=hors-ligne/.test(location.search)) return;
  if (!cache) d.className += ' vis-attente';   // 1re visite : on attend la liste avant d'afficher les séquences
  var cb = 'giroVis' + Date.now(), s = document.createElement('script'), fait = false;
  function arreter() { if (fait) return; fait = true; fini(); try { delete window[cb]; } catch (e) { window[cb] = undefined; } if (s.parentNode) s.parentNode.removeChild(s); }
  window[cb] = function (rep) {
    if (rep && rep.ok && rep.masquees) {
      appliquer(rep.masquees);
      ecrire(CACHE, JSON.stringify({ t: Date.now(), l: window.GIRO_MASQUEES }));
    }
    arreter();
  };
  s.src = ENDPOINT + (ENDPOINT.indexOf('?') < 0 ? '?' : '&') + 'action=visibilite&callback=' + cb + '&_=' + Date.now();
  s.onerror = arreter;
  setTimeout(arreter, ATTENTE);
  document.head.appendChild(s);
})();
