/**
 * TechOps Budapest — spending the till.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var UI   = window.TechOpsUI;
  var U    = window.TechOpsUpgrades;
  var fmt  = window.techOpsFmt;
  var esc  = function (s) { return UI.esc(s); };

  function buy(id) {
    var u = U.get(id), S = Shop.state;
    if (!u || U.owned(S, id)) return;
    if (S.cashFt < u.costFt) {
      UI.toast('Not enough in the till', 'You have ' + fmt(S.cashFt) + '. This costs ' + fmt(u.costFt) + '.', 'bad');
      return;
    }
    Shop.spend(u.costFt, u.name);
    S.upgrades = S.upgrades || {};
    S.upgrades[id] = S.day;
    U.rebuildPerks(S);
    if (window.sekAudio) window.sekAudio.playSuccessChime();
    UI.toast(u.name, u.effect, 'good');
    Shop.emit('change');
    render();
  }

  function render() {
    var host = document.getElementById('view-shopfit');
    if (!host) return;
    var S = Shop.state;
    S.upgrades = S.upgrades || {};

    var body = Object.keys(U.CATS).map(function (cat) {
      var c = U.CATS[cat];
      var items = U.all.filter(function (u) { return u.cat === cat; }).map(function (u) {
        var owned = U.owned(S, u.id);
        var afford = S.cashFt >= u.costFt;
        return '<div class="upg' + (owned ? ' owned' : afford ? '' : ' poor') + '">'
          + '<div class="upg-top">' + window.TechOpsIcons.icon(u.icon, 18)
          + '<b>' + esc(u.name) + '</b>'
          + '<span class="upg-cost">' + (owned ? 'installed' : fmt(u.costFt)) + '</span></div>'
          + '<div class="upg-blurb">' + esc(u.blurb) + '</div>'
          + '<div class="upg-effect">' + esc(u.effect) + '</div>'
          + (owned ? '' : '<button class="btn btn-sm' + (afford ? ' btn-primary' : '') + '" data-buy-upg="' + u.id + '"'
              + (afford ? '' : ' disabled') + '>' + (afford ? 'Buy it' : 'Cannot afford it yet') + '</button>')
          + '</div>';
      }).join('');
      return '<div class="upg-group"><div class="card-head">' + esc(c.label) + '</div>'
        + '<p style="font-size:calc(12.5px * var(--a11y-scale, 1));color:var(--ink-2);margin-bottom:11px">' + esc(c.note) + '</p>'
        + '<div class="upg-grid">' + items + '</div></div>';
    }).join('');

    var ownedCount = Object.keys(S.upgrades).length;

    host.innerHTML = '<div class="view-head"><h2>Fitting out the shop</h2>'
      + '<p>Everything you earn beyond the parts bill ends up here. None of it buys a better review — '
      + 'it buys <b>hours</b>, <b>stock</b> and <b>footfall</b>, so that doing the job properly stops being so expensive. '
      + 'You still have to pick the right part.</p></div>'
      + '<div class="note" style="margin-bottom:18px;display:flex;gap:18px;flex-wrap:wrap">'
      + '<span>In the till <b style="color:var(--green)">' + fmt(S.cashFt) + '</b></span>'
      + '<span>Fitted <b>' + ownedCount + ' / ' + U.all.length + '</b></span>'
      + '</div>'
      + body;

    host.querySelectorAll('[data-buy-upg]').forEach(function (b) {
      b.addEventListener('click', function () { buy(b.getAttribute('data-buy-upg')); });
    });
    if (window.TechOpsApp) window.TechOpsApp.paintIcons(host);
  }

  window.TechOpsShopfit = { render: render, buy: buy };
})(window);
