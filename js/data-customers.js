/**
 * TechOps Budapest — Customers.
 *
 * There is no globally correct part. There is only the part that suits
 * THIS person's work, THIS person's money and THIS person's deadline.
 * The use-case profile is what turns "which SSD" into a real question.
 */
(function (window) {
  'use strict';

  /**
   * ramIdeal / storageIdeal — what this person actually benefits from.
   * ramWaste / storageWaste — the point past which you are selling them air.
   * priceSensitivity — 1.0 means every forint hurts; 0.2 means they want it right.
   * speedSensitivity — 1.0 means a three-week delivery is a disaster.
   */
  var USE_CASES = {
    email: {
      id: 'email', label: 'Email, news and video calls',
      ramIdeal: 8, ramWaste: 16,
      storageIdeal: 250, storageWaste: 1000,
      needsSsd: true, needsFastNvme: false,
      screenTier: 'any',
      priceSensitivity: 0.9, speedSensitivity: 0.4, durabilitySensitivity: 0.9,
      blurb: 'Browser, mail, a video call with the grandchildren. Any SSD feels instant; anything beyond that is invisible to them.'
    },
    student: {
      id: 'student', label: 'Schoolwork, Classroom, a bit of everything',
      ramIdeal: 16, ramWaste: 32,
      storageIdeal: 500, storageWaste: 2000,
      needsSsd: true, needsFastNvme: false,
      screenTier: 'good',
      priceSensitivity: 1.0, speedSensitivity: 0.9, durabilitySensitivity: 0.7,
      blurb: 'Docs, Slides, thirty tabs, and a deadline. Money is genuinely tight and the deadline is genuinely real.'
    },
    gamer: {
      id: 'gamer', label: 'Gaming',
      ramIdeal: 16, ramWaste: 64,
      storageIdeal: 1000, storageWaste: 2000,
      needsSsd: true, needsFastNvme: true,
      screenTier: 'good',
      priceSensitivity: 0.6, speedSensitivity: 0.8, durabilitySensitivity: 0.6,
      blurb: 'Frame rates and load times. Notices thermal throttling immediately and will tell you about it.'
    },
    video: {
      id: 'video', label: '4K video editing',
      ramIdeal: 32, ramWaste: 128,
      storageIdeal: 2000, storageWaste: 4000,
      needsSsd: true, needsFastNvme: true,
      screenTier: 'exact',
      priceSensitivity: 0.3, speedSensitivity: 0.7, durabilitySensitivity: 0.4,
      blurb: 'Moves 80 GB of footage a week. This is the one person for whom the expensive Gen4 drive is genuinely the right call.'
    },
    office: {
      id: 'office', label: 'Office work, spreadsheets, admin',
      ramIdeal: 16, ramWaste: 32,
      storageIdeal: 500, storageWaste: 2000,
      needsSsd: true, needsFastNvme: false,
      screenTier: 'good',
      priceSensitivity: 0.5, speedSensitivity: 1.0, durabilitySensitivity: 0.9,
      blurb: 'Cannot be without the machine. Reliability and turnaround matter far more than benchmarks.'
    },
    reseller: {
      id: 'reseller', label: 'Fixing it up to sell on',
      ramIdeal: 8, ramWaste: 16,
      storageIdeal: 500, storageWaste: 1000,
      needsSsd: true, needsFastNvme: false,
      screenTier: 'any',
      priceSensitivity: 1.0, speedSensitivity: 0.5, durabilitySensitivity: 0.3,
      blurb: 'Every forint spent comes straight off their margin. They want the cheapest repair that honestly passes as working.'
    }
  };

  var CUSTOMERS = [
    {
      id: 'dora', archetype: 'artsy', name: 'Dóra', age: 16, avatar: '🎧',
      tag: 'school film club',
      useCase: 'video',
      machines: ['thinkpad_t480', 'tower_pc', 'mbp13_2012'],
      budgetFt: [55000, 95000], urgencyDays: [4, 8],
      voice: 'precise',
      lines: {
        greet: 'Hi. I edit the school film club\'s stuff — 4K off a Sony, usually about eighty gigs a week.',
        budget: 'I saved up from the summer job, so I have real money for once. I would rather do it properly than do it twice.'
      }
    },
    {
      id: 'marika', archetype: 'elder',  name: 'Marika néni', age: 71, avatar: '👵',
      tag: 'retired · Zugló',
      useCase: 'email',
      machines: ['mbp13_2012', 'inspiron15'],
      budgetFt: [20000, 40000], urgencyDays: [7, 14],
      voice: 'gentle',
      lines: {
        greet: 'My grandson set this up for me years ago. I only use it for the emails and to see the little ones on the video.',
        budget: 'I have a pension, dear. Tell me honestly what it needs and I will pay for that, but not for extras.'
      }
    },
    {
      id: 'david', archetype: 'eboy', name: 'Dávid', age: 15, avatar: '🎮',
      tag: 'plays far too much',
      useCase: 'gamer',
      machines: ['tower_pc', 'thinkpad_t480', 'steamdeck', 'switch2'],
      budgetFt: [35000, 70000], urgencyDays: [2, 5],
      voice: 'impatient',
      lines: {
        greet: 'It thermal throttles in the middle of ranked and I lose. That is the whole problem.',
        budget: 'I have this much. My mum does not know about this much.'
      }
    },
    {
      id: 'eszter', archetype: 'professional', name: 'Eszter tanárnő', age: 38, avatar: '👩‍🏫',
      tag: 'maths teacher',
      useCase: 'office',
      machines: ['mba_m1', 'inspiron15', 'iphone12'],
      budgetFt: [30000, 60000], urgencyDays: [1, 3],
      voice: 'busy',
      lines: {
        greet: 'I have got report cards due Friday and everything is on this. I genuinely cannot be without it for a week.',
        budget: 'The school will reimburse me up to a point. Just tell me when I can have it back.'
      }
    },
    {
      id: 'balint', archetype: 'normie', name: 'Bálint', age: 17, avatar: '🛹',
      tag: 'sells refurbs on HardverApró',
      useCase: 'reseller',
      machines: ['mbp13_2012', 'inspiron15', 'iphone12'],
      budgetFt: [12000, 28000], urgencyDays: [5, 12],
      voice: 'sharp',
      lines: {
        greet: 'Bought this broken for fifteen thousand. I want to flip it. Make it work, do not make it beautiful.',
        budget: 'Every forint you spend comes off my profit, so — cheapest thing that honestly works.'
      }
    },
    {
      id: 'lili', archetype: 'egirl', name: 'Lili', age: 14, avatar: '📸',
      tag: 'the whole year\'s photos are on it',
      useCase: 'student',
      machines: ['iphone12', 'inspiron15', 'mba_m1'],
      budgetFt: [18000, 45000], urgencyDays: [2, 6],
      voice: 'anxious',
      lines: {
        greet: 'Please do not wipe it. The ballagás photos are on here and I never backed them up. Please.',
        budget: 'I have my birthday money. Is that enough? Is it enough?'
      }
    },
    {
      id: 'zsolt', archetype: 'normie', name: 'Zsolt', age: 44, avatar: '🧰',
      tag: 'plumber · drops things',
      useCase: 'office',
      machines: ['iphone12', 'inspiron15'],
      budgetFt: [25000, 55000], urgencyDays: [1, 4],
      voice: 'blunt',
      lines: {
        greet: 'It went on the floor of the van. I run my whole business off it — quotes, invoices, the lot.',
        budget: 'I do not care what it costs within reason, I care that it does not happen again in three months.'
      }
    },
    {
      id: 'nora', archetype: 'normie', name: 'Nóra', age: 19, avatar: '📚',
      tag: 'first-year · thesis on Friday',
      useCase: 'student',
      machines: ['mbp13_2012', 'thinkpad_t480', 'inspiron15'],
      budgetFt: [15000, 35000], urgencyDays: [1, 2],
      voice: 'panicked',
      lines: {
        greet: 'I have a deadline on Friday at noon and this thing takes six minutes to open a Word document.',
        budget: 'I have very little money and very little time and I know that is the worst combination.'
      }
    },
    {
      id: 'tamas', archetype: 'normie', name: 'Tamás', age: 29, avatar: '🧑‍💻',
      tag: 'junior dev · reads the spec sheet',
      useCase: 'gamer',
      machines: ['tower_pc', 'thinkpad_t480'],
      budgetFt: [45000, 90000], urgencyDays: [3, 7],
      voice: 'precise',
      lines: {
        greet: 'I have a theory about what is wrong but I would rather you measured it than took my word for it.',
        budget: 'I will pay for good parts. I will not pay for parts this machine cannot actually use, so please check the bus width.'
      }
    },
    {
      id: 'agi', archetype: 'professional', name: 'Ági', age: 52, avatar: '🌻',
      tag: 'florist · one laptop, all the orders',
      useCase: 'email',
      machines: ['inspiron15', 'mbp13_2012'],
      budgetFt: [22000, 42000], urgencyDays: [2, 5],
      voice: 'gentle',
      lines: {
        greet: 'All my orders are in a folder on here. It has got slower every year and now it barely starts.',
        budget: 'I would rather spend a bit more once than keep bringing it back to you, if that makes sense.'
      }
    },
    {
      id: 'peti', archetype: 'kid', name: 'Peti', age: 13, avatar: '🧃',
      tag: 'his dad is waiting outside',
      useCase: 'student',
      machines: ['iphone12', 'inspiron15', 'switch2'],
      budgetFt: [14000, 30000], urgencyDays: [1, 3],
      voice: 'shy',
      lines: {
        greet: 'My dad says if it costs more than the phone is worth then I have to just use the old one.',
        budget: 'He is in the car. He said fifteen minutes.'
      }
    },
    {
      id: 'reka', archetype: 'artsy', name: 'Réka', age: 34, avatar: '🎬',
      tag: 'freelance videographer',
      useCase: 'video',
      machines: ['tower_pc', 'thinkpad_t480', 'mbp13_2012'],
      budgetFt: [70000, 130000], urgencyDays: [3, 6],
      voice: 'precise',
      lines: {
        greet: 'This is what I earn with. If it stalls mid-export on a client job, that costs me more than any part you can name.',
        budget: 'Spend what it needs. But I will notice if you sell me something the machine cannot use.'
      }
    }
  ];

  window.TechOpsCustomers = {
    useCases: USE_CASES,
    all: CUSTOMERS,
    get: function (id) {
      for (var i = 0; i < CUSTOMERS.length; i++) if (CUSTOMERS[i].id === id) return CUSTOMERS[i];
      return null;
    },
    useCase: function (id) { return USE_CASES[id]; }
  };
})(window);
