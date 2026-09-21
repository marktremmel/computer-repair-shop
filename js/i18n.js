/**
 * TechOps Budapest — Hungarian / English Localization Scaffolding.
 *
 * Keeps the zero-build promise: a lightweight in-browser dictionary with
 * persistence in localStorage and fallback to English.
 */
(function (window) {
  'use strict';

  var STORAGE_KEY = 'techops-lang';
  var currentLang = 'en';
  try {
    currentLang = localStorage.getItem(STORAGE_KEY) ||
      (typeof navigator !== 'undefined' && navigator.language && navigator.language.slice(0, 2) === 'hu' ? 'hu' : 'en');
  } catch (e) {
    currentLang = 'en';
  }

  var DICT = {
    en: {
      'nav.counter': 'Counter',
      'nav.intake': 'The sit-down',
      'nav.bench': 'Workbench',
      'nav.market': 'Parts market',
      'nav.handover': 'Handover',
      'nav.dossier': 'Dossier',

      'axis.fit': 'Right part for this person',
      'axis.budget': 'Respected their money',
      'axis.speed': 'Turnaround against deadline',
      'axis.durability': 'Durability & parts quality',
      'axis.safety': 'Workmanship & safety',

      'hud.day': 'Day',
      'hud.till': 'Till',
      'hud.jobs': 'Jobs done',
      'hud.rep': 'Reputation',

      'title.open': 'OPEN',
      'title.comein': 'gyere be',
      'title.build_tech': 'Build technician',
      'title.setup_shop': 'Set up shop',
      'title.tour': 'Show me around',
      'title.training': 'Training ticket',
      'title.how': 'How the shop works',

      'bench.clean_port': 'Clean port lint / contacts',
      'bench.thermal_paste': 'Reapply thermal paste',
      'bench.replace_fan': 'Replace cooling fan',
      'bench.battery_isolate': 'Disconnect battery connector',
      'bench.screw_match': 'Match screwdriver bit',

      'status.on_bench': 'On the bench',
      'status.ready_pickup': 'Ready for pickup',
      'status.waiting_parts': 'Waiting for parts'
    },
    hu: {
      'nav.counter': 'Pult',
      'nav.intake': 'Kérdezz-felelek',
      'nav.bench': 'Munkaasztal',
      'nav.market': 'Alkatrész piac',
      'nav.handover': 'Átadás',
      'nav.dossier': 'Dosszié',

      'axis.fit': 'Megfelelő alkatrész a célnak',
      'axis.budget': 'Tiszteletben tartott büdzsé',
      'axis.speed': 'Határidő betartása',
      'axis.durability': 'Tartósság és minőség',
      'axis.safety': 'Biztonságos, tiszta munka',

      'hud.day': 'Nap',
      'hud.till': 'Kassza',
      'hud.jobs': 'Elvégzett munka',
      'hud.rep': 'Hírnév',

      'title.open': 'NYITVA',
      'title.comein': 'gyere be',
      'title.build_tech': 'Technikus készítése',
      'title.setup_shop': 'Szerviz beállítása',
      'title.tour': 'Körbevezetés',
      'title.training': 'Gyakorló feladat',
      'title.how': 'Hogyan működik a bolt',

      'bench.clean_port': 'Csatlakozó és érintkező tisztítás',
      'bench.thermal_paste': 'Hővezető paszta újrahúzása',
      'bench.replace_fan': 'Hűtőventilátor csere',
      'bench.battery_isolate': 'Akkumulátor lecsatlakoztatása',
      'bench.screw_match': 'Csavarhúzófej kiválasztása',

      'status.on_bench': 'A munkaasztalon',
      'status.ready_pickup': 'Átadásra kész',
      'status.waiting_parts': 'Alkatrészre vár'
    }
  };

  window.TechOpsI18n = {
    lang: function (l) {
      if (l && (l === 'en' || l === 'hu')) {
        currentLang = l;
        try { localStorage.setItem(STORAGE_KEY, l); } catch (e) {}
      }
      return currentLang;
    },
    t: function (k, fallback) {
      var d = DICT[currentLang] || DICT.en;
      return d[k] || DICT.en[k] || fallback || k;
    },
    dict: function () {
      return DICT[currentLang] || DICT.en;
    }
  };
})(window);
