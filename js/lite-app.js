/**
 * TechOps Budapest — Lite: boot.
 *
 * Lite and the classic shop are the same shift. They share one save, one
 * shift code, one reputation and one hand-in code, so a student can be moved
 * up a version without losing their morning — but a half-finished job is
 * left in whichever shop it was started in, because a ticket abandoned
 * halfway down Lite's corridor has nowhere sensible to land on the classic
 * bench, and the other way round is worse.
 *
 * So the shift remembers where it is being played. Opening the other version
 * with a job on the mat offers to finish it here or put it back.
 */
(function (window) {
  'use strict';

  var Shop = window.TechOpsShop;
  var Flow = window.TechOpsLiteFlow;

  var Lite = {
    finished: null,

    /** Same trick as the classic app: portrait slots are filled once sprites land. */
    paintFaces: function (root) {
      if (!window.TechOpsPixel) return;
      window.TechOpsPixel.load().then(function () {
        (root || document).querySelectorAll('.pface').forEach(function (n) {
          if (n.dataset.painted) return;
          n.dataset.painted = '1';
          var px = +(n.dataset.size || 44);
          n.style.width = px + 'px'; n.style.height = px + 'px';
          window.TechOpsPixel.mount(n, n.dataset.seed, px * 2, {
            archetype: n.dataset.arch || undefined,
            age: n.dataset.age ? +n.dataset.age : undefined
          });
        });
      });
    },

    boot: function () {
      Shop.init();
      if (window.TechOpsJobs.repairComplaints) window.TechOpsJobs.repairComplaints(Shop);
      Shop.state.mode = 'lite';

      Flow.mount(document.getElementById('lite-stage'), document.getElementById('lite-bar'));

      document.getElementById('lite-classic').addEventListener('click', function (e) {
        if (Shop.state.ticket && !confirm('The job on the mat stays here — the full shop will not know where you got to on it.\n\nOpen the full shop anyway?')) {
          e.preventDefault();
        }
      });

      Shop.on('change', function () { Lite.paintFaces(); });
      Flow.render();
    }
  };

  window.TechOpsLite = Lite;
  document.addEventListener('DOMContentLoaded', Lite.boot);
})(window);
