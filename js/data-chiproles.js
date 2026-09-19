/**
 * TechOps Budapest — what the chips on a board actually do.
 *
 * Chip identifications in chipid-data.json are facts taken from iFixit's
 * public chip-ID teardowns (manufacturer, part number, function). The
 * explanations of what each ROLE means are written here, for this material.
 *
 * The point of the activity: a board is not magic. It is a set of parts,
 * each with one job, and a surprising number of them can be worked out from
 * the maker's name and the shape of the part number.
 */
(function (window) {
  'use strict';

  var ROLES = {
    soc:      { label: 'Main processor (SoC)', colour: '#ff6b6b',
                what: 'The one that does the actual computing. On a phone or a handheld it also contains the graphics and the neural engine — "system on a chip" means nearly everything is inside this one package.',
                tell: 'Physically the biggest chip, usually dead centre, often with the memory stacked on top of it.' },
    memory:   { label: 'Memory (RAM)', colour: '#ffa94d',
                what: 'Working space. Whatever the machine is doing right now lives here, and it all vanishes when the power goes.',
                tell: 'Micron, SK hynix or Samsung, and the part number says LPDDR4X or LPDDR5 somewhere.' },
    storage:  { label: 'Storage (NAND flash)', colour: '#ffd43b',
                what: 'Where things stay when the power is off. Photos, apps, the operating system.',
                tell: 'Kioxia, SK hynix, Samsung, Micron. Look for NAND, UFS or eMMC in the description.' },
    pmic:     { label: 'Power management', colour: '#69db7c',
                what: 'Takes one battery voltage and turns it into the dozen different voltages the rest of the board needs. If this is dead, nothing else gets a chance to work.',
                tell: 'Usually several of them. Apple, Qualcomm, Renesas, Analog Devices.' },
    power:    { label: 'Regulator / power stage', colour: '#38d9a9',
                what: 'The individual converters that step voltage up or down for one specific thing. Small, numerous, and the usual suspects when one part of a board is dead and the rest is fine.',
                tell: 'Monolithic Power Systems, Silergy, Texas Instruments. "Buck converter", "LDO", "power stage".' },
    battery:  { label: 'Charging & fuel gauge', colour: '#4dd4ac',
                what: 'Controls how fast the battery charges and keeps count of how much is left. The percentage you see is this chip\'s opinion.',
                tell: 'Texas Instruments is everywhere here. "Charger", "fuel gauge".' },
    usbc:     { label: 'USB-C port controller', colour: '#3bc9db',
                what: 'Negotiates with whatever you plug in: how many volts, which way round the cable is, whether this is a charger or a screen.',
                tell: 'NXP, Infineon, Texas Instruments. "Type-C port controller".' },
    wireless: { label: 'Wi-Fi & Bluetooth', colour: '#4dabf7',
                what: 'Talks to your router and your headphones. Usually one chip doing both.',
                tell: 'Broadcom, MediaTek, Realtek.' },
    modem:    { label: 'Cellular modem', colour: '#748ffc',
                what: 'The mobile network radio. Only in things with a SIM — and one of the most expensive chips on any phone board.',
                tell: 'Qualcomm, nearly always. "5G Modem".' },
    rf:       { label: 'RF front end', colour: '#9775fa',
                what: 'Everything between the radio and the antenna: amplifies what goes out, filters what comes in, switches between bands.',
                tell: 'Skyworks, Qorvo, Broadcom. "Front-end module", "transceiver", "envelope tracker".' },
    audio:    { label: 'Audio codec / amplifier', colour: '#da77f2',
                what: 'Turns digital sound into something a speaker can move air with, and the microphone\'s wobbles back into numbers.',
                tell: 'Cirrus Logic and Realtek dominate. "Codec", "amplifier".' },
    display:  { label: 'Display & backlight', colour: '#f783ac',
                what: 'Drives the panel and its backlight. A phone that turns on but shows nothing often has a fault here rather than in the screen.',
                tell: 'Texas Instruments, O2Micro. "Backlight driver", "display power".' },
    security: { label: 'Secure element / NFC', colour: '#ffa8a8',
                what: 'Holds the keys that make Face ID, payments and device unlocking work. Deliberately very hard to read from the outside — including by you.',
                tell: 'NXP and Apple. "Secure element", "NFC controller".' },
    ec:       { label: 'Embedded controller', colour: '#ffc9c9',
                what: 'The small always-on brain that watches the power button, the lid, the fans and the keyboard while the main processor is asleep.',
                tell: 'ITE Tech, Nuvoton. "Embedded controller".' },
    sensor:   { label: 'Sensors & converters', colour: '#b2f2bb',
                what: 'Turns physical things — tilt, pressure, temperature, a voltage — into numbers the processor can read.',
                tell: 'Bosch, Goertek, Analog Devices. "ADC", "pressure sensor".' },
    input:    { label: 'Touch & haptics', colour: '#a5d8ff',
                what: 'Reads fingers on glass or a trackpad, and drives the little motor that makes a click feel like a click.',
                tell: 'Broadcom for trackpads. "Touch controller", "Taptic".' },
    reader:   { label: 'Card reader', colour: '#d0bfff',
                what: 'Handles the SD or game card slot: a whole small controller just for a hole in the side of the case.',
                tell: 'O2Micro, and console makers roll their own.' },
    qi:       { label: 'Wireless charging', colour: '#96f2d7',
                what: 'Receives power through a coil instead of a cable, and manages the heat that comes with doing it inefficiently.',
                tell: 'Broadcom. "Wireless charging controller".' },
    camera:   { label: 'Camera & imaging', colour: '#ffe066',
                what: 'Drives the flash, the depth sensor or the image pipeline off the main sensor.',
                tell: '"Camera flash controller", "LiDAR".' },
    signal:   { label: 'Signal routing', colour: '#c5f6fa',
                what: 'Switches and multiplexers that send one signal down one of several paths. Unglamorous and everywhere.',
                tell: '"Analog switch", "multiplexer", "level shifter".' }
  };

  /** Rough difficulty: how guessable the role is from the label alone. */
  var EASY = ['soc', 'memory', 'storage', 'audio', 'wireless', 'modem'];

  window.TechOpsChipRoles = {
    ROLES: ROLES,
    EASY: EASY,
    label: function (r) { return (ROLES[r] || {}).label || r; },
    colour: function (r) { return (ROLES[r] || {}).colour || '#888'; }
  };
})(window);
