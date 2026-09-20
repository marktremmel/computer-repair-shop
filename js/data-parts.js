/**
 * TechOps Budapest — Parts market.
 *
 * The teaching lives here. Every part class has a cheap option, a sensible
 * option and an expensive option, and NONE of them is the right answer on
 * its own. The right answer depends on the machine (does it physically fit,
 * can the bus even use it), the customer (what do they do all day, what can
 * they pay) and the clock (a 22-day delivery is useless to someone whose
 * thesis is due Friday).
 */
(function (window) {
  'use strict';

  /**
   * Vendors are the honest version of "where do parts come from".
   * Cheap is not a trick — cheap really is cheaper. It costs you time,
   * warranty and a chance the thing dies in six months.
   */
  var VENDORS = {
    sz_direct: {
      id: 'sz_direct',
      name: 'SZ-TechParts Direct',
      origin: 'Shenzhen · marketplace seller',
      icon: '📦',
      note: 'Cheapest anywhere. Three weeks on a plane, no warranty, and the spec sheet is a work of fiction.',
      colour: '#f59e0b'
    },
    hardverapro: {
      id: 'hardverapro',
      name: 'HardverApró',
      origin: 'Budapest · used, personal pickup',
      icon: '🤝',
      note: 'Second-hand from a person. Cheap and instant, but you inherit whatever life it already had.',
      colour: '#38bdf8'
    },
    ipon: {
      id: 'ipon',
      name: 'iPon Webshop',
      origin: 'Hungary · retail, new',
      icon: '🏬',
      note: 'Normal shop price, real Hungarian warranty, courier in a day or two.',
      colour: '#34d399'
    },
    oem_service: {
      id: 'oem_service',
      name: 'Authorised Service Parts',
      origin: 'Manufacturer · genuine',
      icon: '🏅',
      note: 'The exact part the factory used. Guaranteed to fit and to behave. You pay for that certainty.',
      colour: '#a78bfa'
    }
  };

  /**
   * cat: storage | ram | battery | screen | thermal | fan | flex
   * risk: rough chance this part causes a comeback within a year.
   */
  var PARTS = [
    // ───────────────────────────── STORAGE ─────────────────────────────
    {
      id: 'hdd_1tb_used', cat: 'storage', vendor: 'hardverapro',
      name: 'Seagate 1TB 5400rpm HDD (used, 4 years)',
      priceFt: 6000, deliveryDays: 0, warrantyMonths: 0, risk: 0.30,
      spec: { tech: 'hdd', capacityGB: 1000, seqMBps: 95, bus: 'sata3', form: '2.5in' },
      pitch: 'A lot of space for almost no money.',
      catch: 'Spinning metal. It is the slowest thing you can put in a computer, and this one is already halfway through its life.'
    },
    {
      id: 'ssd_sata_480_sz', cat: 'storage', vendor: 'sz_direct',
      name: 'KingSpec 480GB SATA SSD (DRAM-less)',
      priceFt: 8500, deliveryDays: 21, warrantyMonths: 0, risk: 0.26,
      spec: { tech: 'ssd', capacityGB: 480, seqMBps: 480, bus: 'sata3', form: '2.5in' },
      pitch: 'Half the price of a real SSD and still 5× faster than any hard drive.',
      catch: 'No DRAM cache, unknown NAND. Fine on day one, sluggish when it fills up, and nobody to complain to when it fails.'
    },
    {
      id: 'ssd_sata_500_ipon', cat: 'storage', vendor: 'ipon',
      name: 'Crucial MX500 500GB SATA SSD',
      priceFt: 17500, deliveryDays: 2, warrantyMonths: 60, risk: 0.03,
      spec: { tech: 'ssd', capacityGB: 500, seqMBps: 560, bus: 'sata3', form: '2.5in' },
      pitch: 'The boring, correct SSD. Five year warranty.',
      catch: 'Costs twice the marketplace one.'
    },
    {
      id: 'ssd_sata_1tb_ipon', cat: 'storage', vendor: 'ipon',
      name: 'Crucial MX500 1TB SATA SSD',
      priceFt: 29000, deliveryDays: 2, warrantyMonths: 60, risk: 0.03,
      spec: { tech: 'ssd', capacityGB: 1000, seqMBps: 560, bus: 'sata3', form: '2.5in' },
      pitch: 'Same drive, double the room. Nobody ever complained about too much space.',
      catch: 'Only worth it if they actually store that much.'
    },
    {
      id: 'nvme_500_g3_ipon', cat: 'storage', vendor: 'ipon',
      name: 'Kingston NV2 500GB NVMe (Gen3)',
      priceFt: 15000, deliveryDays: 2, warrantyMonths: 36, risk: 0.05,
      spec: { tech: 'nvme', capacityGB: 500, seqMBps: 3500, bus: 'nvme3', form: 'm2-2280' },
      pitch: 'Six times faster than SATA, and somehow cheaper than a SATA SSD.',
      catch: 'Needs an M.2 slot. Useless in a machine that only has a SATA bay.'
    },
    {
      id: 'nvme_1tb_g4_ipon', cat: 'storage', vendor: 'ipon',
      name: 'Samsung 990 PRO 1TB NVMe (Gen4)',
      priceFt: 42000, deliveryDays: 2, warrantyMonths: 60, risk: 0.02,
      spec: { tech: 'nvme', capacityGB: 1000, seqMBps: 7000, bus: 'nvme4', form: 'm2-2280' },
      pitch: 'The fastest consumer drive you can buy. 7000 MB/s.',
      catch: 'In a Gen3 slot it runs at Gen3 speed. You paid for 7000 and the socket hands back 3500.'
    },
    {
      id: 'nvme_2tb_g4_ipon', cat: 'storage', vendor: 'ipon',
      name: 'Samsung 990 PRO 2TB NVMe (Gen4)',
      priceFt: 78000, deliveryDays: 3, warrantyMonths: 60, risk: 0.02,
      spec: { tech: 'nvme', capacityGB: 2000, seqMBps: 7000, bus: 'nvme4', form: 'm2-2280' },
      pitch: 'Two terabytes at full Gen4 speed. Scratch disk for 4K footage.',
      catch: 'Serious money. Only defensible if they genuinely move huge files.'
    },

    // ─────────────────────────────── RAM ───────────────────────────────
    {
      id: 'ddr3_8gb_used', cat: 'ram', vendor: 'hardverapro',
      name: '8GB DDR3-1600 SO-DIMM (single, used)',
      priceFt: 4500, deliveryDays: 0, warrantyMonths: 0, risk: 0.10,
      spec: { type: 'ddr3-1600', form: 'sodimm', totalGB: 8, sticks: 1, mhz: 1600 },
      pitch: 'Doubles the memory of an old Mac for the price of a pizza.',
      catch: 'One stick means single channel. And used RAM occasionally has bad cells.'
    },
    {
      id: 'ddr3_2x8_ipon', cat: 'ram', vendor: 'ipon',
      name: '16GB DDR3-1600 SO-DIMM kit (2×8GB)',
      priceFt: 19000, deliveryDays: 2, warrantyMonths: 999, risk: 0.02,
      spec: { type: 'ddr3-1600', form: 'sodimm', totalGB: 16, sticks: 2, mhz: 1600 },
      pitch: 'Matched pair, lifetime warranty, dual channel.',
      catch: 'DDR3 in 2026 is expensive precisely because nobody makes it any more.'
    },
    {
      id: 'ddr4_8gb_so_ipon', cat: 'ram', vendor: 'ipon',
      name: '8GB DDR4-2666 SO-DIMM',
      priceFt: 9500, deliveryDays: 2, warrantyMonths: 999, risk: 0.02,
      spec: { type: 'ddr4-2666', form: 'sodimm', totalGB: 8, sticks: 1, mhz: 2666 },
      pitch: 'The cheap, sane upgrade for a laptop with one free slot.',
      catch: 'Eight more gigabytes is a lot for a browser and not much for Premiere.'
    },
    {
      id: 'ddr4_16gb_so_ipon', cat: 'ram', vendor: 'ipon',
      name: '16GB DDR4-2666 SO-DIMM',
      priceFt: 17000, deliveryDays: 2, warrantyMonths: 999, risk: 0.02,
      spec: { type: 'ddr4-2666', form: 'sodimm', totalGB: 16, sticks: 1, mhz: 2666 },
      pitch: 'Fills the slot properly. Nothing will run out of memory again.',
      catch: 'Twice the price for memory a light user will never touch.'
    },
    {
      id: 'ddr4_16gb_so_sz', cat: 'ram', vendor: 'sz_direct',
      name: '16GB DDR4-2133 SO-DIMM (no-name)',
      priceFt: 7900, deliveryDays: 19, warrantyMonths: 0, risk: 0.22,
      spec: { type: 'ddr4-2133', form: 'sodimm', totalGB: 16, sticks: 1, mhz: 2133 },
      pitch: '16GB for less than half the shop price.',
      catch: 'Slower clock, unbranded chips, and bad RAM is the single most annoying fault to diagnose later.'
    },
    {
      id: 'ddr4_2x8_dimm_ipon', cat: 'ram', vendor: 'ipon',
      name: '16GB DDR4-3200 DIMM kit (2×8GB)',
      priceFt: 21000, deliveryDays: 2, warrantyMonths: 999, risk: 0.02,
      spec: { type: 'ddr4-3200', form: 'dimm', totalGB: 16, sticks: 2, mhz: 3200 },
      pitch: 'Matched dual-channel pair at full speed. The default desktop answer.',
      catch: 'None, really. This is usually just correct.'
    },
    {
      id: 'ddr4_2x16_dimm_ipon', cat: 'ram', vendor: 'ipon',
      name: '32GB DDR4-3200 DIMM kit (2×16GB)',
      priceFt: 39000, deliveryDays: 2, warrantyMonths: 999, risk: 0.02,
      spec: { type: 'ddr4-3200', form: 'dimm', totalGB: 32, sticks: 2, mhz: 3200 },
      pitch: 'Headroom for timelines, virtual machines and 200 browser tabs.',
      catch: 'Selling 32GB to someone who writes essays is how you lose a regular customer.'
    },

    // ───────────────────────────── BATTERY ─────────────────────────────
    /*
     * The middle of the battery market, which did not exist here before.
     *
     * With only a no-name cell and the genuine service part, every battery job
     * had the same answer: buy genuine. A reputable third-party cell with a
     * warranty and honest health reporting, but a little less capacity for a
     * lot less money, turns it back into a question \u2014 and the question is
     * the one the shop is for. For somebody whose laptop never leaves the
     * kitchen table it is plainly the right call; for a student off the mains
     * all day it is the same complaint again by March.
     */
    {
      id: 'batt_a1322_green', cat: 'battery', vendor: 'ipon',
      name: 'GreenCell A1322 (branded, 92%)',
      priceFt: 13500, deliveryDays: 3, warrantyMonths: 12, risk: 0.08,
      fits: ['mbp13_2012'],
      spec: { model: 'A1322', reportsHealth: true, capacityPct: 92 },
      pitch: 'Named brand, two-year cells, reports health properly, half the price of the genuine part.',
      catch: '92% of the original capacity. On a machine that lives on a desk nobody will ever meet that number.'
    },
    {
      id: 'batt_a2389_green', cat: 'battery', vendor: 'ipon',
      name: 'GreenCell MacBook Air M1 (branded, 93%)',
      priceFt: 19500, deliveryDays: 3, warrantyMonths: 12, risk: 0.08,
      fits: ['mba_m1'],
      spec: { model: 'A2389', reportsHealth: true, capacityPct: 93 },
      pitch: 'Warranty, real health reporting, and it is in stock in Budapest.',
      catch: 'Seven per cent down on the original \u2014 roughly forty minutes off a day away from a socket.'
    },
    {
      id: 'batt_t480_green', cat: 'battery', vendor: 'ipon',
      name: 'GreenCell ThinkPad T480 pack (94%)',
      priceFt: 11000, deliveryDays: 2, warrantyMonths: 12, risk: 0.07,
      fits: ['thinkpad_t480'],
      spec: { model: '01AV489', reportsHealth: true, capacityPct: 94 },
      pitch: 'Clips in from the outside in four seconds, warranty, honest health figures.',
      catch: 'Slightly down on the original, and the internal cell is still whatever age it was.'
    },
    {
      id: 'batt_a2471_green', cat: 'battery', vendor: 'ipon',
      name: 'GreenCell iPhone 12 cell (branded, 94%)',
      priceFt: 11500, deliveryDays: 3, warrantyMonths: 12, risk: 0.10,
      fits: ['iphone12'],
      spec: { model: 'A2471', reportsHealth: false, capacityPct: 94 },
      pitch: 'Proper cells and a warranty for a third of what Apple charge.',
      catch: 'Apple pair the battery to the phone, so Battery Health still reads "Unknown Part" however good the cell is. That is Apple\'s doing rather than the cell\'s \u2014 and the customer still has to look at it every day.'
    },
    {
      id: 'batt_deck_green', cat: 'battery', vendor: 'ipon',
      name: 'GreenCell Steam Deck pack (91%)',
      priceFt: 15500, deliveryDays: 4, warrantyMonths: 12, risk: 0.09,
      fits: ['steamdeck'],
      spec: { model: 'deck-40', reportsHealth: true, capacityPct: 91 },
      pitch: 'Warranty and real capacity reporting, well under the official pack.',
      catch: 'Nine per cent down, and a handheld is the one machine that is never plugged in.'
    },
    {
      id: 'batt_a1322_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'A1322 battery (compatible, no cell data)',
      priceFt: 7000, deliveryDays: 20, warrantyMonths: 0, risk: 0.38,
      fits: ['mbp13_2012'],
      spec: { model: 'A1322', reportsHealth: false, capacityPct: 88 },
      pitch: 'A third of the genuine price and it does hold a charge.',
      catch: 'macOS will never show a real health percentage again, capacity is below spec, and cheap pouch cells are the ones that swell.'
    },
    {
      id: 'batt_a1322_oem', cat: 'battery', vendor: 'oem_service',
      name: 'A1322 battery (genuine service part)',
      priceFt: 24000, deliveryDays: 5, warrantyMonths: 12, risk: 0.02,
      fits: ['mbp13_2012'],
      spec: { model: 'A1322', reportsHealth: true, capacityPct: 100 },
      pitch: 'Full rated capacity, proper cycle count reporting, a year of warranty.',
      catch: 'On a fourteen-year-old laptop this is a big fraction of what the machine is worth.'
    },
    {
      id: 'batt_a2471_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'iPhone 12 battery (compatible)',
      priceFt: 6500, deliveryDays: 20, warrantyMonths: 0, risk: 0.34,
      fits: ['iphone12'],
      spec: { model: 'A2471', reportsHealth: false, capacityPct: 92 },
      pitch: 'Cheapest way to get a phone off the charger again.',
      catch: 'Settings will show "Unknown Part" and Battery Health disappears permanently. Customers notice this and they hate it.'
    },
    {
      id: 'batt_a2471_oem', cat: 'battery', vendor: 'oem_service',
      name: 'iPhone 12 battery (genuine, paired)',
      priceFt: 21000, deliveryDays: 5, warrantyMonths: 12, risk: 0.02,
      fits: ['iphone12'],
      spec: { model: 'A2471', reportsHealth: true, capacityPct: 100 },
      pitch: 'Pairs to the phone, keeps Battery Health, no warning banner.',
      catch: 'Three times the marketplace price.'
    },
    {
      id: 'batt_a2389_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'MacBook Air M1 battery (compatible)',
      priceFt: 13000, deliveryDays: 20, warrantyMonths: 0, risk: 0.34,
      fits: ['mba_m1'],
      spec: { model: 'A2389', reportsHealth: false, capacityPct: 89 },
      pitch: 'Bare cell pack at a fraction of the service price.',
      catch: 'Glued into the case, and it reports no cycle count afterwards — macOS will show the battery as an unknown part for good.'
    },
    {
      id: 'batt_a2389_oem', cat: 'battery', vendor: 'oem_service',
      name: 'MacBook Air M1 battery (genuine service part)',
      priceFt: 38000, deliveryDays: 6, warrantyMonths: 12, risk: 0.02,
      fits: ['mba_m1'],
      spec: { model: 'A2389', reportsHealth: true, capacityPct: 100 },
      pitch: 'Correct cells, correct adhesive strips, cycle count reporting intact.',
      catch: 'Expensive — but a swollen pack in a laptop someone sleeps next to is not the place to save money.'
    },
    {
      id: 'batt_deck_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'Steam Deck battery (compatible)',
      priceFt: 14000, deliveryDays: 19, warrantyMonths: 0, risk: 0.33,
      fits: ['steamdeck'],
      spec: { model: 'JCPBT-1', reportsHealth: false, capacityPct: 88 },
      pitch: 'Half the price of the official cell and it does fit the tray.',
      catch: 'No cell data reported, so the battery percentage becomes an estimate rather than a measurement.'
    },
    {
      id: 'batt_deck_oem', cat: 'battery', vendor: 'ipon',
      name: 'Steam Deck battery (Valve service part)',
      priceFt: 32000, deliveryDays: 3, warrantyMonths: 12, risk: 0.03,
      fits: ['steamdeck'],
      spec: { model: 'JCPBT-1', reportsHealth: true, capacityPct: 100 },
      pitch: 'Valve sells these openly, with the manual to go with it.',
      catch: 'Nothing, really. This is the rare case where the manufacturer is on your side.'
    },
    {
      id: 'scr_deck_ipon', cat: 'screen', vendor: 'ipon',
      name: 'Steam Deck LCD assembly',
      priceFt: 36000, deliveryDays: 4, warrantyMonths: 12, risk: 0.05,
      fits: ['steamdeck'],
      spec: { panel: 'IPS', hz: 60, trueTone: false, nits: 400 },
      pitch: 'Complete assembly, and Valve publish the guide for fitting it.',
      catch: 'A big fraction of what a used Deck costs.'
    },
    {
      id: 'batt_switch2_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'Switch 2 battery (compatible)',
      priceFt: 11000, deliveryDays: 20, warrantyMonths: 0, risk: 0.34,
      fits: ['switch2'],
      spec: { model: 'HEG-003', reportsHealth: false, capacityPct: 89 },
      pitch: 'Cheapest way to get a handheld off the dock again.',
      catch: 'Glued down flat. If this one swells the next person has to fight the adhesive all over again.'
    },
    {
      id: 'batt_switch2_oem', cat: 'battery', vendor: 'oem_service',
      name: 'Switch 2 battery (genuine)',
      priceFt: 26000, deliveryDays: 6, warrantyMonths: 12, risk: 0.03,
      fits: ['switch2'],
      spec: { model: 'HEG-003', reportsHealth: true, capacityPct: 100 },
      pitch: 'Correct cell, correct adhesive, correct capacity reporting.',
      catch: 'Over twice the marketplace price.'
    },
    {
      id: 'scr_switch2_sz', cat: 'screen', vendor: 'sz_direct',
      name: 'Switch 2 LCD (aftermarket)',
      priceFt: 28000, deliveryDays: 18, warrantyMonths: 0, risk: 0.24,
      fits: ['switch2'],
      spec: { panel: 'LCD', hz: 60, trueTone: false, nits: 380 },
      pitch: 'Gets a cracked handheld playable again for a reasonable price.',
      catch: 'Only 60 Hz. The original runs at 120, and anyone who plays on it will notice within a minute.'
    },
    {
      id: 'scr_switch2_oem', cat: 'screen', vendor: 'oem_service',
      name: 'Switch 2 display (genuine, 120 Hz)',
      priceFt: 58000, deliveryDays: 6, warrantyMonths: 12, risk: 0.02,
      fits: ['switch2'],
      spec: { panel: 'LCD', hz: 120, trueTone: false, nits: 420 },
      pitch: 'The real panel at the real refresh rate.',
      catch: 'Expensive enough that some customers will choose to live with the crack.'
    },
    {
      id: 'batt_iphone17_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'iPhone 17 battery (compatible)',
      priceFt: 9500, deliveryDays: 20, warrantyMonths: 0, risk: 0.33,
      fits: ['iphone17'],
      spec: { model: 'A3310', reportsHealth: false, capacityPct: 91 },
      pitch: 'Cheap, and the back-glass entry makes fitting it quick.',
      catch: 'Battery Health shows "Unknown Part" for good, and customers on a phone this new absolutely will check.'
    },
    {
      id: 'batt_iphone17_oem', cat: 'battery', vendor: 'oem_service',
      name: 'iPhone 17 battery (genuine, paired)',
      priceFt: 29000, deliveryDays: 5, warrantyMonths: 12, risk: 0.02,
      fits: ['iphone17'],
      spec: { model: 'A3310', reportsHealth: true, capacityPct: 100 },
      pitch: 'Pairs properly, keeps Battery Health, no warning banner.',
      catch: 'Three times the price of the alternative.'
    },
    {
      id: 'scr_iphone17_oled_refurb', cat: 'screen', vendor: 'hardverapro',
      name: 'iPhone 17 display — refurbished OLED',
      priceFt: 52000, deliveryDays: 2, warrantyMonths: 3, risk: 0.11,
      fits: ['iphone17'],
      spec: { panel: 'OLED', hz: 120, trueTone: false, nits: 1000 },
      pitch: 'A genuine panel with new glass on it, at 120 Hz.',
      catch: 'True Tone does not survive the transplant, and refurb lamination can lift at an edge.'
    },
    {
      id: 'scr_iphone17_oem', cat: 'screen', vendor: 'oem_service',
      name: 'iPhone 17 display (genuine assembly)',
      priceFt: 94000, deliveryDays: 6, warrantyMonths: 12, risk: 0.01,
      fits: ['iphone17'],
      spec: { panel: 'OLED', hz: 120, trueTone: true, nits: 1200 },
      pitch: 'Factory part. Everything works, including the things you forget about until they do not.',
      catch: 'Very nearly half the price of the phone.'
    },
    {
      id: 'batt_ipad_sz', cat: 'battery', vendor: 'sz_direct',
      name: 'iPad Air battery (compatible)',
      priceFt: 9500, deliveryDays: 20, warrantyMonths: 0, risk: 0.36,
      fits: ['ipad_air'],
      spec: { model: 'A2779 (iPad Air 5)', reportsHealth: false, capacityPct: 90 },
      pitch: 'A third of the service price for a pack that does hold a charge.',
      catch: 'Glued flat across the whole back. If this one swells, the next person has to get the glass off again — and the glass is the expensive bit.'
    },
    {
      id: 'batt_ipad_oem', cat: 'battery', vendor: 'oem_service',
      name: 'iPad Air battery (genuine service part)',
      priceFt: 28000, deliveryDays: 6, warrantyMonths: 12, risk: 0.02,
      fits: ['ipad_air'],
      spec: { model: 'A2779 (iPad Air 5)', reportsHealth: true, capacityPct: 100 },
      pitch: 'Correct capacity, correct adhesive, a year covered.',
      catch: 'On a tablet this age it is a serious fraction of what the thing is worth.'
    },
    {
      id: 'batt_mbp14_oem', cat: 'battery', vendor: 'oem_service',
      name: 'MacBook Pro 14" battery (genuine, with top case)',
      priceFt: 62000, deliveryDays: 6, warrantyMonths: 12, risk: 0.02,
      fits: ['mbp14_m3'],
      spec: { model: 'A2992 (MBP 14 M3)', reportsHealth: true, capacityPct: 100 },
      pitch: 'Ships bonded to a new top case, which is the only way this one is sold.',
      catch: 'You are buying a keyboard and a trackpad you did not need, because Apple will not sell the cell on its own.'
    },
    {
      id: 'scr_ipad_aftermarket', cat: 'screen', vendor: 'sz_direct',
      name: 'iPad Air digitiser + glass (aftermarket)',
      priceFt: 24000, deliveryDays: 19, warrantyMonths: 0, risk: 0.28,
      fits: ['ipad_air'],
      spec: { panel: 'IPS', hz: 60, trueTone: false, nits: 400 },
      pitch: 'Cheapest way to get a cracked tablet usable again.',
      catch: 'Thicker glass, no lamination, and a visible air gap between the glass and the picture. It reads as a repaired tablet from across a room.'
    },
    {
      id: 'scr_ipad_oem', cat: 'screen', vendor: 'oem_service',
      name: 'iPad Air display (genuine, laminated)',
      priceFt: 71000, deliveryDays: 6, warrantyMonths: 12, risk: 0.02,
      fits: ['ipad_air'],
      spec: { panel: 'IPS', hz: 60, trueTone: true, nits: 500 },
      pitch: 'Laminated as it left the factory, True Tone intact.',
      catch: 'Very nearly the price of a used iPad.'
    },
    {
      id: 'batt_m5y1k_ipon', cat: 'battery', vendor: 'ipon',
      name: 'Dell M5Y1K battery (new, retail)',
      priceFt: 14000, deliveryDays: 2, warrantyMonths: 24, risk: 0.04,
      fits: ['inspiron15'],
      spec: { model: 'M5Y1K', reportsHealth: true, capacityPct: 100 },
      pitch: 'New cell with a Hungarian warranty, here in two days.',
      catch: 'On a budget laptop, half the value of the machine.'
    },
    {
      id: 'batt_t480_ipon', cat: 'battery', vendor: 'ipon',
      name: 'ThinkPad 01AV489 battery (new)',
      priceFt: 18000, deliveryDays: 2, warrantyMonths: 24, risk: 0.03,
      fits: ['thinkpad_t480'],
      spec: { model: '01AV489', reportsHealth: true, capacityPct: 100 },
      pitch: 'Hot-swappable external pack, no teardown needed.',
      catch: 'None worth mentioning.'
    },

    // ───────────────────────────── SCREEN ──────────────────────────────
    {
      id: 'scr_iphone12_lcd_sz', cat: 'screen', vendor: 'sz_direct',
      name: 'iPhone 12 display — aftermarket LCD',
      priceFt: 19000, deliveryDays: 18, warrantyMonths: 0, risk: 0.20,
      fits: ['iphone12'],
      spec: { panel: 'LCD', hz: 60, trueTone: false, nits: 450 },
      pitch: 'Less than a third of the genuine price and the touch works fine.',
      catch: 'It is an LCD replacing an OLED. Blacks go grey, it is visibly dimmer outdoors, and True Tone is gone forever.'
    },
    {
      id: 'scr_iphone12_oled_refurb', cat: 'screen', vendor: 'hardverapro',
      name: 'iPhone 12 display — refurbished original OLED',
      priceFt: 36000, deliveryDays: 1, warrantyMonths: 3, risk: 0.09,
      fits: ['iphone12'],
      spec: { panel: 'OLED', hz: 60, trueTone: false, nits: 625 },
      pitch: 'A real Apple OLED with new glass laminated onto it. Looks right.',
      catch: 'The True Tone chip did not survive the transplant, and refurb lamination sometimes lifts at the edge.'
    },
    {
      id: 'scr_iphone12_oled_oem', cat: 'screen', vendor: 'oem_service',
      name: 'iPhone 12 display — genuine OLED assembly',
      priceFt: 68000, deliveryDays: 5, warrantyMonths: 12, risk: 0.01,
      fits: ['iphone12'],
      spec: { panel: 'OLED', hz: 60, trueTone: true, nits: 625 },
      pitch: 'Factory part. True Tone survives, no warning banner, one year covered.',
      catch: 'More than the phone is worth on the second-hand market.'
    },
    {
      id: 'scr_mbp13_sz', cat: 'screen', vendor: 'sz_direct',
      name: 'MacBook Pro 13" LCD panel (compatible)',
      priceFt: 21000, deliveryDays: 22, warrantyMonths: 0, risk: 0.18,
      fits: ['mbp13_2012'],
      spec: { panel: 'TN', hz: 60, trueTone: false, nits: 280 },
      pitch: 'Bare panel only — cheap if you are willing to do the fiddly work.',
      catch: 'Three weeks of waiting, dimmer than the original, and the colours shift if you look from the side.'
    },
    {
      id: 'scr_mbp13_oem', cat: 'screen', vendor: 'oem_service',
      name: 'MacBook Pro 13" display assembly (genuine)',
      priceFt: 74000, deliveryDays: 5, warrantyMonths: 12, risk: 0.01,
      fits: ['mbp13_2012'],
      spec: { panel: 'TN', hz: 60, trueTone: false, nits: 300 },
      pitch: 'Whole lid, hinges included. Screw it on and it is done.',
      catch: 'Costs more than the entire laptop is worth in 2026.'
    },

    // ───────────────────────────── THERMAL ─────────────────────────────
    {
      id: 'paste_cheap', cat: 'thermal', vendor: 'sz_direct',
      name: 'HY510 grey thermal grease (1.9 W/m·K)',
      priceFt: 600, deliveryDays: 14, warrantyMonths: 0, risk: 0.28,
      spec: { conductivity: 1.9, tempDropC: 11, conductive: false },
      pitch: 'Six hundred forints. It is paste, how different can it be.',
      catch: 'Barely a quarter the conductivity of a decent paste, and it pumps out from under the die in about eight months. The machine comes back just as hot.'
    },
    {
      id: 'paste_mx4', cat: 'thermal', vendor: 'ipon',
      name: 'Arctic MX-4 (8.5 W/m·K)',
      priceFt: 2800, deliveryDays: 2, warrantyMonths: 0, risk: 0.02,
      spec: { conductivity: 8.5, tempDropC: 22, conductive: false },
      pitch: 'The default answer. Non-conductive, does not dry out, lasts years.',
      catch: 'Nothing. This is what you use.'
    },
    {
      id: 'paste_liquid_metal', cat: 'thermal', vendor: 'ipon',
      name: 'Thermal Grizzly Conductonaut liquid metal (73 W/m·K)',
      priceFt: 6500, deliveryDays: 3, warrantyMonths: 0, risk: 0.30,
      spec: { conductivity: 73, tempDropC: 30, conductive: true },
      pitch: 'Eight degrees better than anything else on earth.',
      catch: 'It is liquid metal. It conducts electricity, so one stray drop kills the board, and it eats aluminium heatsinks. Not for a customer machine you are handing back.'
    },

    // ─────────────────────────────── FAN ───────────────────────────────
    {
      id: 'fan_generic_sz', cat: 'fan', vendor: 'sz_direct',
      name: 'Replacement cooling fan (compatible)',
      priceFt: 3200, deliveryDays: 19, warrantyMonths: 0, risk: 0.24,
      spec: { noiseDb: 38, rpm: 5400 },
      pitch: 'Spins, moves air, costs nothing.',
      catch: 'Sleeve bearing. It will start ticking within a year.'
    },
    {
      id: 'fan_oem', cat: 'fan', vendor: 'oem_service',
      name: 'Cooling fan (genuine service part)',
      priceFt: 11000, deliveryDays: 5, warrantyMonths: 12, risk: 0.02,
      spec: { noiseDb: 29, rpm: 5400 },
      pitch: 'Fluid bearing, correct blade profile, actually quiet.',
      catch: 'Three times the marketplace price for a plastic fan.'
    },

    // ────────────────────────────── FLEX ───────────────────────────────
    {
      id: 'flex_usbc_sz', cat: 'flex', vendor: 'sz_direct',
      name: 'iPhone 12 charge port flex (compatible)',
      priceFt: 3900, deliveryDays: 18, warrantyMonths: 0, risk: 0.25,
      fits: ['iphone12'],
      spec: { fastCharge: true },
      pitch: 'Cheap, and the port is a wear item anyway.',
      catch: 'Microphone and antenna traces run through this flex. Bad ones make calls sound underwater.'
    },
    {
      id: 'flex_usbc_oem', cat: 'flex', vendor: 'oem_service',
      name: 'iPhone 12 charge port flex (genuine)',
      priceFt: 12500, deliveryDays: 5, warrantyMonths: 12, risk: 0.02,
      fits: ['iphone12'],
      spec: { fastCharge: true },
      pitch: 'Correct antenna tuning, correct microphone.',
      catch: 'Expensive for a connector.'
    },
    {
      id: 'flex_usbc17_sz', cat: 'flex', vendor: 'sz_direct',
      name: 'iPhone 17 USB-C port flex (compatible)',
      priceFt: 5400, deliveryDays: 17, warrantyMonths: 0, risk: 0.28,
      fits: ['iphone17'],
      spec: { fastCharge: false },
      pitch: 'Half the price of the service part, and a port is a port.',
      catch: 'Most of these negotiate 9 W and stop. The customer plugs in their 30 W charger and wonders why it takes all night.'
    },
    {
      id: 'flex_usbc17_oem', cat: 'flex', vendor: 'oem_service',
      name: 'iPhone 17 USB-C port flex (genuine)',
      priceFt: 16900, deliveryDays: 4, warrantyMonths: 12, risk: 0.02,
      fits: ['iphone17'],
      spec: { fastCharge: true },
      pitch: 'Full charge negotiation and the correct antenna tuning through the flex.',
      catch: 'Expensive for a connector — but it is the connector that broke.'
    },
    {
      id: 'flex_usbc_ipad', cat: 'flex', vendor: 'ipon',
      name: 'iPad Air USB-C port board',
      priceFt: 8900, deliveryDays: 3, warrantyMonths: 12, risk: 0.05,
      fits: ['ipad_air'],
      spec: { fastCharge: true },
      pitch: 'In stock in Budapest, warranty, full charge rate.',
      catch: 'On an iPad the port board sits under the battery, so the labour is the real cost.'
    },
    {
      id: 'flex_usbc_deck', cat: 'flex', vendor: 'hardverapro',
      name: 'Steam Deck USB-C daughterboard (pulled)',
      priceFt: 4200, deliveryDays: 2, warrantyMonths: 0, risk: 0.22,
      fits: ['steamdeck'],
      spec: { fastCharge: true },
      pitch: 'Pulled from a cracked-screen unit, tested working, collect in Zugl\u00f3.',
      catch: 'Pulled from a machine that had already been dropped once. No comeback if it fails.'
    },
    {
      id: 'flex_usbc_switch', cat: 'flex', vendor: 'ipon',
      name: 'Switch 2 USB-C charge port assembly',
      priceFt: 7600, deliveryDays: 3, warrantyMonths: 12, risk: 0.05,
      fits: ['switch2'],
      spec: { fastCharge: true },
      pitch: 'The dock puts real current through this port — worth having the right one.',
      catch: 'Nothing much, other than the price of doing it properly.'
    },

    // ───────────────────── BOARD-LEVEL COMPONENTS ──────────────────────
    {
      id: 'caps_generic', cat: 'caps', vendor: 'sz_direct',
      name: '16 V 1500 \u00b5F electrolytic capacitors (10 pack)',
      priceFt: 1200, deliveryDays: 16, warrantyMonths: 0, risk: 0.30,
      fits: ['tower_pc'],
      spec: { esr: 'unspecified', tempC: 85, hours: 2000 },
      pitch: 'Ten for the price of a coffee.',
      catch: 'No brand, 85 \u00b0C rating and no ESR figure. These are the same class of part that failed in the first place — in a hot case beside a VRM they will dome again in a couple of years.'
    },
    {
      id: 'caps_polymer', cat: 'caps', vendor: 'ipon',
      name: 'Nichicon 16 V 1500 \u00b5F low-ESR, 105 \u00b0C (pair)',
      priceFt: 2400, deliveryDays: 2, warrantyMonths: 6, risk: 0.03,
      fits: ['tower_pc'],
      spec: { esr: 'low', tempC: 105, hours: 10000 },
      pitch: 'Named manufacturer, low ESR, rated to 105 \u00b0C for 10 000 hours.',
      catch: 'Twice the price of the bag of ten, for two of them.'
    }
  ];

  var byId = {};
  PARTS.forEach(function (p) { byId[p.id] = p; });

  /**
   * Can this part physically go into this machine, and if so does the
   * machine actually let it run at its rated speed?
   *
   * Returns { ok, reason, capped, cappedTo, note }
   *   ok      — false means it will not fit at all
   *   capped  — it fits, but the machine throttles it (wasted money)
   */
  function compat(part, machine) {
    if (!part || !machine) return { ok: false, reason: 'No machine selected.' };

    // Explicit model whitelist (batteries, screens, flexes).
    if (part.fits && part.fits.indexOf(machine.id) === -1) {
      return { ok: false, reason: 'This part is shaped for a different model. It does not physically fit a ' + machine.name + '.' };
    }

    if (part.cat === 'storage') {
      if (machine.storageSoldered) {
        return { ok: false, reason: 'The storage in this machine is soldered to the logic board. There is no slot to put a drive in — no drive of any price will fit.' };
      }
      var bus = part.spec.bus;
      var machineBuses = machine.storageBuses || [];
      // NVMe family: any nvme slot accepts any nvme drive, speed is min of the two.
      var isNvme = bus.indexOf('nvme') === 0;
      var machineNvme = machineBuses.filter(function (b) { return b.indexOf('nvme') === 0; });
      if (isNvme) {
        if (!machineNvme.length) {
          return { ok: false, reason: 'This machine has no M.2 slot — only a ' + window.TechOpsMachines.busLabel(machineBuses[0]) + ' bay. An NVMe stick has nowhere to go.' };
        }
        var slotSpeed = Math.max.apply(null, machineNvme.map(function (b) { return window.TechOpsMachines.busCeiling(b); }));
        var partSpeed = part.spec.seqMBps;
        if (partSpeed > slotSpeed) {
          return {
            ok: true, capped: true, cappedTo: slotSpeed,
            note: 'Fits, but the slot is ' + window.TechOpsMachines.busLabel(machineNvme[0]) + '. This drive is rated ' + partSpeed + ' MB/s and will run at about ' + slotSpeed + ' MB/s. You paid for speed the machine cannot use.'
          };
        }
        return { ok: true };
      }
      // SATA drive
      if (machineBuses.indexOf('sata3') === -1) {
        return { ok: false, reason: 'No 2.5" SATA bay in this machine.' };
      }
      return { ok: true };
    }

    if (part.cat === 'ram') {
      if (machine.ramSoldered) {
        return { ok: false, reason: 'The memory is soldered into the package. There are no slots. The only way to get more RAM is a different computer — and saying so is the honest repair.' };
      }
      if (part.spec.form !== machine.ramForm) {
        return { ok: false, reason: 'Wrong physical format: this is a ' + part.spec.form.toUpperCase() + ' module and the machine takes ' + String(machine.ramForm).toUpperCase() + '. The notch does not line up.' };
      }
      var pGen = part.spec.type.split('-')[0];
      var mGen = machine.ramType.split('-')[0];
      if (pGen !== mGen) {
        return { ok: false, reason: 'Wrong generation: ' + pGen.toUpperCase() + ' module in a ' + mGen.toUpperCase() + ' slot. The key notch is in a different place, deliberately, so you cannot force it.' };
      }
      if (part.spec.sticks > machine.ramSlots) {
        return { ok: false, reason: 'This is a ' + part.spec.sticks + '-stick kit and the machine has ' + machine.ramSlots + ' free slot' + (machine.ramSlots === 1 ? '' : 's') + '.' };
      }
      var totalAfter = part.spec.totalGB + (machine.ramSolderedGB || 0);
      if (totalAfter > machine.ramMaxGB) {
        return { ok: false, reason: 'Over the chipset limit. This machine tops out at ' + machine.ramMaxGB + 'GB.' };
      }
      var mSpeed = parseInt(machine.ramType.split('-')[1], 10);
      if (part.spec.mhz > mSpeed) {
        return {
          ok: true, capped: true, cappedTo: mSpeed,
          note: 'Fits, but the memory controller runs at ' + mSpeed + ' MT/s. Faster RAM simply clocks down. You paid for speed nobody will see.'
        };
      }
      return { ok: true };
    }

    if (part.cat === 'thermal') {
      var allowed = (machine.thermal && machine.thermal.pasteAllowed) || [];
      if (part.spec.conductive && allowed.indexOf('liquid_metal') === -1) {
        return { ok: false, reason: 'Liquid metal on this machine is a bad idea — the die is surrounded by exposed components and the heatsink is bare aluminium, which liquid metal corrodes.' };
      }
      return { ok: true };
    }

    return { ok: true };
  }

  window.TechOpsParts = {
    vendors: VENDORS,
    all: PARTS,
    get: function (id) { return byId[id]; },
    byCat: function (cat) { return PARTS.filter(function (p) { return p.cat === cat; }); },
    compat: compat
  };
})(window);
