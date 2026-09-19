/**
 * TechOps Budapest — people.
 *
 * The player builds a character from the same vocabulary the shop uses to
 * generate customers, so the walk-ins belong to the same world rather than
 * being a separate hand-written cast. The twelve written regulars still
 * appear; everyone else is assembled here.
 */
(function (window) {
  'use strict';

  /** Player faces are the same generator, seeded by a preset id. */
  var FACE_PRESETS = ['ava-1','ava-2','ava-3','ava-4','ava-5','ava-6','ava-7','ava-8','ava-9',
                      'ava-10','ava-11','ava-12','ava-13','ava-14','ava-15','ava-16','ava-17','ava-18'];
  var AVATARS = FACE_PRESETS;

  var BACKGROUNDS = [
    { id: 'family_fixer', icon: '🏠', name: 'The one the family calls',
      blurb: 'You have been fixing your relatives\' machines since you were ten. Nobody has ever paid you.',
      effect: 'Start with 30.000 Ft more in the till — years of saved-up favours finally cashed in.',
      apply: function (S) { S.cashFt += 30000; } },
    { id: 'saturday_job', icon: '📱', name: 'Saturdays in a phone shop',
      blurb: 'You did screen swaps on Saturdays for a shop on Rákóczi út. Fast hands, no theory.',
      effect: 'Start with a better reputation — some of those customers followed you here.',
      apply: function (S) { S.reputation = Math.min(100, S.reputation + 14); } },
    { id: 'teardown_videos', icon: '🔧', name: 'Self-taught from teardowns',
      blurb: 'Four hundred hours of repair videos. You know the theory cold and have opened almost nothing.',
      effect: 'You start with a tube of decent thermal compound already on the shelf.',
      apply: function (S) { S.shelf.push({ partId: 'paste_mx4', paidFt: 0 }); } },
    { id: 'uncle_shop', icon: '🗝️', name: 'You took over your uncle\'s shop',
      blurb: 'He retired to Balaton and left you the bench, the sign, and his customer list.',
      effect: 'A good name to start from — and one of his old jobs is about to walk back in.',
      apply: function (S) {
        S.reputation = Math.min(100, S.reputation + 20);
        S.pendingComebacks = S.pendingComebacks || [];
        S.pendingComebacks.push({ dueDay: 2, customerId: 'balint', machineId: 'inspiron15',
          faultId: 'thermal_paste_dead', originJobId: 'uncle', reason: 'Your uncle repasted it with whatever was on the bench.' });
      } }
  ];

  // ── generator vocabulary ────────────────────────────────────────────
  var FIRST = ['Bence','Zsófi','Levente','Hanna','Máté','Luca','Gergő','Panna','Ádám','Boglárka',
               'Kristóf','Emma','Botond','Sára','Zalán','Lilla','Marcell','Jázmin','Bálint','Réka',
               'Attila','Ildikó','Sándor','Erzsi','Gábor','Katalin','Tibor','Piroska','Zoltán','Márta'];

  var ROLES = [
    { tag: 'kertvárosi nyugdíjas · Óbuda',        use: 'email',   ages: [64, 79], arch: 'elder',        budget: [18000, 42000], urgency: [6, 14] },
    { tag: 'secondary school, lower years',                    use: 'student', ages: [14, 16], arch: 'kid',          budget: [12000, 30000], urgency: [2, 6] },
    { tag: 'secondary school, final years',                   use: 'student', ages: [16, 18], arch: 'egirl',        budget: [16000, 38000], urgency: [2, 5] },
    { tag: 'egyetemista · ELTE',                  use: 'student', ages: [19, 23], arch: 'normie',       budget: [15000, 40000], urgency: [1, 4] },
    { tag: 'irodai ügyintéző · Váci út',          use: 'office',  ages: [26, 52], arch: 'professional', budget: [28000, 62000], urgency: [1, 3] },
    { tag: 'tanár · általános iskola',            use: 'office',  ages: [30, 58], arch: 'professional', budget: [25000, 55000], urgency: [1, 4] },
    { tag: 'grafikus · szabadúszó',               use: 'video',   ages: [24, 44], arch: 'artsy',        budget: [55000, 120000], urgency: [2, 6] },
    { tag: 'vágó · produkciós cég',               use: 'video',   ages: [26, 46], arch: 'artsy',        budget: [65000, 130000], urgency: [2, 5] },
    { tag: 'streamer · esténként',                use: 'gamer',   ages: [17, 27], arch: 'eboy',         budget: [35000, 80000], urgency: [2, 5] },
    { tag: 'on a school e-sports team',         use: 'gamer',   ages: [15, 18], arch: 'eboy',         budget: [25000, 60000], urgency: [1, 4] },
    { tag: 'használtcikk-kereskedő · Jófogás',    use: 'reseller',ages: [20, 48], arch: 'normie',       budget: [10000, 28000], urgency: [5, 14] },
    { tag: 'fodrász · saját szalon',              use: 'office',  ages: [28, 50], arch: 'artsy',        budget: [24000, 52000], urgency: [1, 4] }
  ];

  /** Opening lines that colour a walk-in without claiming anything about the fault. */
  var QUIRKS = [
    'I have been putting this off for weeks, honestly.',
    'My son said I should just buy a new one. I do not want to buy a new one.',
    'I looked it up online and now I am more confused than before.',
    'Please be honest with me. I would rather hear it is not worth fixing.',
    'I have absolutely no idea how any of this works, I just need it to work.',
    'I brought it in the box it came in. Is that helpful?',
    'Someone at work said it is probably a virus. Is it a virus?',
    'I am not in a rush, but I am also a bit in a rush.',
    'It is the only computer in the house, so.',
    'If it is expensive just tell me now and I will stop you there.'
  ];

  var MONEY_LINES = {
    email:    'I am on a pension, so tell me what it needs and I will pay for that — not for extras.',
    student:  'I have birthday money and that is genuinely all of it.',
    gamer:    'I have this much saved. Do not ask where from.',
    video:    'This is what I earn with, so spend what it needs — but do not sell me something the machine cannot use.',
    office:   'I can cover it within reason. What I actually need is it back quickly.',
    reseller: 'Every forint you spend comes off my margin. Cheapest thing that honestly works.'
  };

  var MACHINES_FOR = {
    email:    ['mbp13_2012', 'inspiron15', 'imac_m1'],
    student:  ['inspiron15', 'mba_m1', 'iphone12', 'ipad_air', 'mbp13_2012', 'switch2', 'iphone17'],
    gamer:    ['tower_pc', 'thinkpad_t480', 'steamdeck', 'switch2', 'ps5pro'],
    video:    ['tower_pc', 'thinkpad_t480', 'imac_m1', 'mbp14_m3'],
    office:   ['mba_m1', 'inspiron15', 'iphone12', 'imac_m1', 'ipad_air'],
    reseller: ['mbp13_2012', 'inspiron15', 'iphone12', 'ipad_air']
  };

  /** Build a walk-in from the same vocabulary the player built themselves from. */
  function generate(shop) {
    var role = shop.pick(ROLES);
    var first = shop.pick(FIRST);
    var age = shop.range(role.ages[0], role.ages[1]);
    var known = window.TechOpsMachines.all;
    var pool = (MACHINES_FOR[role.use] || []).filter(function (id) { return !!known[id]; });
    if (!pool.length) pool = Object.keys(known);

    return {
      id: 'gen_' + first + '_' + age,
      generated: true,
      name: first,
      age: age,
      archetype: role.arch,
      tag: role.tag,
      useCase: role.use,
      machines: pool,
      budgetFt: role.budget,
      urgencyDays: role.urgency,
      voice: shop.pick(['gentle', 'blunt', 'precise', 'busy', 'shy', 'sharp', 'anxious']),
      lines: {
        greet: shop.pick(QUIRKS),
        budget: MONEY_LINES[role.use]
      }
    };
  }

  window.TechOpsPeople = {
    AVATARS: AVATARS,
    FACE_PRESETS: FACE_PRESETS,
    BACKGROUNDS: BACKGROUNDS,
    ROLES: ROLES,
    generate: generate,
    background: function (id) {
      for (var i = 0; i < BACKGROUNDS.length; i++) if (BACKGROUNDS[i].id === id) return BACKGROUNDS[i];
      return null;
    }
  };
})(window);
