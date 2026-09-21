/**
 * TechOps Budapest — the intake interview.
 *
 * Before you touch a screwdriver you sit down with the person and ask.
 * Questions cost a fraction of the bench time an instrument costs, so a
 * good interview is the cheapest diagnosis in the shop — ask the right
 * three things and you know which two instruments to reach for, instead
 * of running all ten and losing the customer a day.
 *
 * Customers are not reliable narrators. Some answers are decisive, some
 * are noise, and a few point confidently in the wrong direction.
 */
(function (window) {
  'use strict';

  var QUESTIONS = [
    { id: 'when',      icon: '📅', hours: 0.1, q: 'When did this start?' },
    { id: 'trigger',   icon: '🎬', hours: 0.1, q: 'What were you doing when it happened?' },
    { id: 'drop',      icon: '💥', hours: 0.1, q: 'Has it been dropped, or got wet?' },
    { id: 'noise',     icon: '👂', hours: 0.1, q: 'Is it making any new noises?' },
    { id: 'installed', icon: '📥', hours: 0.1, q: 'Have you installed anything new lately?' },
    { id: 'heat',      icon: '🔥', hours: 0.1, q: 'Does it get hot? When?' },
    { id: 'power',     icon: '🔌', hours: 0.1, q: 'How is it on battery, and while charging?' },
    { id: 'history',   icon: '🧰', hours: 0.1, q: 'Has anyone else worked on it before me?' },
    { id: 'storage',   icon: '🗄️', hours: 0.1, q: 'How full is it? Do you get warnings?' },
    { id: 'usage',     icon: '💼', hours: 0.15, q: 'What do you actually use it for most?' }
  ];

  /**
   * Per fault, only the answers that carry information are written out.
   * `w` — hot (decisive), warm (suggestive), cold (rules things out), red (misleading but honest).
   * `s` — which instruments this answer points at.
   */
  var ANSWERS = {
    dying_hdd: {
      when:    { w: 'warm', t: 'It has been getting slower for months, but the last two weeks it has been unbearable.' },
      noise:   { w: 'hot',  t: 'Now that you mention it — there is a little click. Click… click… and then it goes quiet for a bit. I thought that was normal.', s: ['listen', 'smart'] },
      trigger: { w: 'cold', t: 'Nothing special. Just turning it on. That is the thing — it is everything, all the time.' },
      installed: { w: 'cold', t: 'No. I have not put anything new on it in years.' },
      heat:    { w: 'cold', t: 'No hotter than it ever was.' },
      storage: { w: 'cold', t: 'No warnings. There is plenty of room, I hardly keep anything on it.' },
      history: { w: 'cold', t: 'Never been opened. It is exactly as it came.' }
    },
    disk_full: {
      when:    { w: 'warm', t: 'The warnings started maybe three weeks ago and now it will not save at all.' },
      storage: { w: 'hot',  t: 'It says "Your disk is almost full" every single day. I keep clicking it away.', s: ['storage_used'] },
      trigger: { w: 'warm', t: 'It happens when I try to save. Or export. Anything that writes, really.' },
      noise:   { w: 'cold', t: 'No, it is silent.' },
      usage:   { w: 'hot',  t: 'I export videos for the club. I keep every version in case they want changes. I never delete any of them.', s: ['storage_used'] },
      history: { w: 'cold', t: 'Nobody has touched it.' },
      heat:    { w: 'cold', t: 'It is cool.' }
    },
    ram_starved: {
      when:    { w: 'warm', t: 'Since I started doing bigger projects. Small ones are still fine.' },
      trigger: { w: 'hot',  t: 'Only when I have the editor open with everything else. On its own it is fine. Add a browser and it dies.', s: ['activity'] },
      heat:    { w: 'warm', t: 'The fans get loud when it is struggling, but it does not overheat or switch off.' },
      noise:   { w: 'cold', t: 'Just the fan. No clicking or grinding.' },
      storage: { w: 'cold', t: 'Loads of space free. I checked.' },
      installed: { w: 'cold', t: 'Nothing new, no.' },
      usage:   { w: 'hot',  t: 'Editing, mostly. Big timelines, lots of layers, and I always have a hundred tabs open too.', s: ['activity'] }
    },
    bad_ram_stick: {
      when:    { w: 'warm', t: 'Hard to say. Weeks? It is so random I cannot pin it down.' },
      trigger: { w: 'hot',  t: 'That is what is maddening — nothing. It has crashed while I was reading a page. It has crashed doing nothing at all.', s: ['memtest'] },
      installed: { w: 'hot', t: 'I reinstalled the entire operating system from scratch to fix it. It made no difference whatsoever.', s: ['memtest'] },
      noise:   { w: 'cold', t: 'No, nothing.' },
      heat:    { w: 'cold', t: 'Normal temperature. It is not a heat thing.' },
      history: { w: 'warm', t: 'My cousin put more memory in it a while back. He got it cheap off the internet.', s: ['memtest'] },
      storage: { w: 'cold', t: 'Plenty free.' }
    },
    thermal_paste_dead: {
      when:    { w: 'warm', t: 'Around spring, I think. It used to be silent. Now it is a hairdryer.' },
      trigger: { w: 'hot',  t: 'It is fine for about a minute, then the fan screams and everything goes slow. Then sometimes it just switches off.', s: ['thermal'] },
      heat:    { w: 'hot',  t: 'Very. You cannot rest your hands on it after ten minutes. Underneath it is worse.', s: ['thermal', 'visual'] },
      noise:   { w: 'warm', t: 'The fan, constantly, at full speed. But no grinding — it spins fine, it is just always working.' },
      history: { w: 'cold', t: 'Never been opened.' },
      installed: { w: 'cold', t: 'Nothing new.' },
      storage: { w: 'cold', t: 'Half empty.' }
    },
    fan_seized: {
      when:    { w: 'hot',  t: 'There was a horrible grinding for about a week. Then it went quiet — and that is when it started getting too hot to hold.', s: ['thermal', 'visual'] },
      noise:   { w: 'hot',  t: 'It used to grind. Now — nothing at all. Completely silent. That is better, surely?', s: ['thermal', 'visual'] },
      heat:    { w: 'hot',  t: 'Burning. Straight away, even just sitting on the desk doing nothing.', s: ['thermal'] },
      trigger: { w: 'warm', t: 'It does not need a trigger any more. It is hot from the moment it turns on.' },
      history: { w: 'cold', t: 'Nobody has been inside it.' },
      installed: { w: 'cold', t: 'No.' }
    },
    battery_swollen: {
      when:    { w: 'warm', t: 'The clicking stopped working maybe a month ago. The battery has been bad much longer.' },
      drop:    { w: 'cold', t: 'Never dropped. It lives on a desk.' },
      power:   { w: 'hot',  t: 'Forty minutes if I am lucky, and it used to be all day. It is basically a desktop now.', s: ['battery', 'visual'] },
      trigger: { w: 'hot',  t: 'The trackpad just will not click. It moves the cursor fine — it will not press down. And the bottom is... bulging? It wobbles on the table.', s: ['visual', 'battery'] },
      heat:    { w: 'warm', t: 'Warmer than it was, especially around the middle underneath.' },
      noise:   { w: 'cold', t: 'No noises.' },
      history: { w: 'cold', t: 'Never opened.' }
    },
    port_lint: {
      when:    { w: 'warm', t: 'It has been getting fussier for months. Now it is basically impossible.' },
      power:   { w: 'hot',  t: 'It only charges if I hold the cable at exactly the right angle and weigh it down with a book. Let go and it stops.', s: ['power', 'visual'] },
      trigger: { w: 'hot',  t: 'I have bought three new cables. Three! None of them work properly either.', s: ['power', 'visual'] },
      drop:    { w: 'cold', t: 'No, never dropped. It lives in my pocket.' },
      noise:   { w: 'cold', t: 'No.' },
      heat:    { w: 'cold', t: 'It does not get hot.' },
      history: { w: 'cold', t: 'Nobody has opened it.' }
    },
    cracked_screen: {
      drop:    { w: 'hot',  t: 'Straight out of my pocket onto the tram tracks. I picked the glass out of my thumb afterwards.', s: ['visual'] },
      when:    { w: 'hot',  t: 'Tuesday. Very precisely Tuesday.', s: ['visual'] },
      trigger: { w: 'warm', t: 'The bottom third does not respond to touch at all now. The rest works.' },
      power:   { w: 'cold', t: 'Charges perfectly fine. Battery is as good as it ever was.' },
      noise:   { w: 'cold', t: 'No.' },
      heat:    { w: 'cold', t: 'No.' }
    },
    runaway_process: {
      when:    { w: 'hot',  t: 'Last Tuesday. It was completely fine on Monday.', s: ['activity'] },
      installed: { w: 'hot', t: 'There was a window saying my Mac had three viruses and I needed to install a cleaner. So I did. Was that... was that bad?', s: ['activity'] },
      trigger: { w: 'hot',  t: 'A pop-up keeps appearing telling me to ring a phone number about the viruses.', s: ['activity'] },
      heat:    { w: 'warm', t: 'The fan is on all the time now, even when I am not doing anything.' },
      noise:   { w: 'warm', t: 'Just the fan, constantly.' },
      storage: { w: 'cold', t: 'No warnings about space.' },
      drop:    { w: 'cold', t: 'Never dropped.' }
    },

    bent_socket_pins: {
      history: { w: 'hot',  t: 'We built it ourselves on Saturday. It is the first one I have ever put together. The processor was fiddly — it did not want to sit down, so my cousin held the lever and I pushed.', s: ['visual', 'power'] },
      when:    { w: 'hot',  t: 'It has never worked. Not once, not for a second. Straight out of the box and into this.', s: ['visual'] },
      power:   { w: 'warm', t: 'The fans move. Half a second, maybe less, then a click and everything stops. Over and over if you let it.' },
      trigger: { w: 'warm', t: 'Pressing the power button. That is the whole story.' },
      installed: { w: 'cold', t: 'There is no operating system on it yet. It has never got that far.' },
      heat:    { w: 'cold', t: 'Stone cold. It is never on long enough to warm up.' },
      noise:   { w: 'cold', t: 'Just the half-second of fan and the click.' },
      drop:    { w: 'cold', t: 'No — it has been on the table since we built it.' }
    },

    blown_caps: {
      trigger: { w: 'hot',  t: 'Games. Only games. He starts one and within a couple of minutes it just goes off and comes back on.', s: ['power', 'visual'] },
      when:    { w: 'hot',  t: 'It crept up on us. Once a month, then once a week, and now it is every single time he plays.', s: ['power'] },
      history: { w: 'warm', t: 'I bought a bigger power supply and fitted it myself, because a forum said that was it. It made no difference at all.' },
      heat:    { w: 'cold', t: 'Not especially. It has always run warm under a game, but no more than it used to.' },
      noise:   { w: 'cold', t: 'The fans get louder in a game, but they always did. Nothing grinding.' },
      installed: { w: 'cold', t: 'Nothing new. It does it on old games too.' },
      storage: { w: 'cold', t: 'Half empty. No warnings.' },
      drop:    { w: 'cold', t: 'It lives under the desk and never moves.' }
    },

    kernel_task_panic: {
      heat:    { w: 'hot',  t: 'That is the strange part. It is cold. Properly cold, all over, even after an hour. And it is still crawling.', s: ['thermal', 'activity'] },
      when:    { w: 'hot',  t: 'It started the morning after I had it open to change the battery myself. I thought I had put everything back.', s: ['activity', 'battery'] },
      history: { w: 'hot',  t: 'I did. I watched a video and replaced the battery. There was a little ribbon I had to move and I am not sure it went back properly.', s: ['visual', 'battery'] },
      trigger: { w: 'warm', t: 'Nothing in particular. Typing. Moving the mouse. All of it is slow.' },
      noise:   { w: 'cold', t: 'No. Very quiet, actually. Quieter than it used to be.' },
      installed: { w: 'cold', t: 'Nothing new.' },
      storage: { w: 'cold', t: 'Plenty of space.' },
      drop:    { w: 'cold', t: 'Never dropped, never wet.' }
    },

    browser_push_spam: {
      trigger: { w: 'hot',  t: 'They come in from the top right corner. Same place the real messages come from. "5 SYSTEM THREATS FOUND", and a button that says renew.', s: ['activity'] },
      installed: { w: 'hot',  t: 'No, and I have been very careful. I never clicked the download. Though there was a film site my nephew used, and it asked me something and I pressed the blue one.', s: ['activity'] },
      when:    { w: 'warm', t: 'About two weeks. It was fine before that.' },
      usage:   { w: 'warm', t: 'Email, the news, photographs of the grandchildren. Nothing clever.' },
      heat:    { w: 'cold', t: 'Not hot at all. It behaves perfectly otherwise.' },
      noise:   { w: 'cold', t: 'Silent.' },
      storage: { w: 'cold', t: 'Nearly empty, I should think.' },
      drop:    { w: 'cold', t: 'Never.' }
    },

    captive_portal_loop: {
      trigger: { w: 'hot',  t: 'Only at the caf\u00e9 and only at the hotel. At home it is perfect. Every site gives the same red warning about the connection not being private.', s: ['activity'] },
      when:    { w: 'warm', t: 'Every time I go somewhere with free Wi-Fi, so — always, but only there.' },
      installed: { w: 'cold', t: 'Nothing new on it.' },
      heat:    { w: 'cold', t: 'No, it is fine.' },
      noise:   { w: 'cold', t: 'Nothing.' },
      storage: { w: 'cold', t: 'Plenty free.' },
      drop:    { w: 'cold', t: 'Never dropped.' },
      history: { w: 'cold', t: 'Nobody has ever opened it.' }
    },

    console_full: {
      storage: { w: 'hot',  t: 'It says there is not enough space. It has been saying that for months and he just deletes something and reinstalls it later.', s: ['storage_used'] },
      trigger: { w: 'hot',  t: 'Installing the new game. It downloads the whole thing and then refuses at the very end.', s: ['storage_used'] },
      when:    { w: 'warm', t: 'This has been building up for about a year, if I am honest. It has got worse and worse.' },
      usage:   { w: 'warm', t: 'He plays two games. The rest are from sales, and I do not think he has opened most of them.' },
      heat:    { w: 'cold', t: 'No hotter than it ever was.' },
      noise:   { w: 'cold', t: 'The fan comes on in a game. Always has.' },
      installed: { w: 'cold', t: 'Only games. It will not let him install the new one, which is the whole problem.' },
      drop:    { w: 'cold', t: 'Never moved off the shelf.' }
    },

    charge_port_dead: {
      power:   { w: 'hot',  t: 'You have to hold the cable at exactly the right angle or it does not charge at all. If I nudge the table it stops.', s: ['power', 'visual'] },
      drop:    { w: 'hot',  t: 'Not dropped exactly — it was charging on the table and the dog walked through the cable and pulled the whole thing off. It was fine for a week after that.', s: ['visual', 'power'] },
      when:    { w: 'warm', t: 'A month or so. It has got steadily worse rather than failing all at once.' },
      trigger: { w: 'warm', t: 'Plugging it in. Or rather, plugging it in and it not doing anything.' },
      heat:    { w: 'cold', t: 'Normal. Warm in a game, like always.' },
      noise:   { w: 'cold', t: 'Nothing new.' },
      installed: { w: 'cold', t: 'Nothing new installed.' },
      storage: { w: 'cold', t: 'Loads of room.' }
    }
  };

  ANSWERS.sd_formatted = {
    when:    { w: 'hot',  t: 'Yesterday. I have not put it back in the camera since, I was too scared to.', s: ['storage_used'] },
    trigger: { w: 'hot',  t: 'The camera asked something about formatting and I said yes without reading it.', s: ['storage_used'] },
    storage: { w: 'warm', t: 'It says the card is empty now. Completely empty. That is the whole problem.' },
    drop:    { w: 'cold', t: 'No, nothing happened to it. It has never even been out of the bag.' },
    history: { w: 'cold', t: 'Nobody has touched it but me, and I wish I had not.' }
  };
  ANSWERS.os_wrecked = {
    when:    { w: 'hot',  t: 'It installed an update overnight and in the morning there was a folder with a question mark.', s: ['smart'] },
    trigger: { w: 'hot',  t: 'Nothing. It did it to itself while I was asleep.', s: ['smart'] },
    noise:   { w: 'cold', t: 'No noises at all. It sounds completely normal.' },
    drop:    { w: 'cold', t: 'Never dropped.' },
    installed: { w: 'warm', t: 'Only the update it installed on its own.' },
    storage: { w: 'cold', t: 'It was about two-thirds full. I had not run out of space.' }
  };
  ANSWERS.migration = {
    when:    { w: 'hot',  t: 'I bought it on Saturday. I have not been able to bring myself to open the old one since.', s: ['storage_used'] },
    trigger: { w: 'cold', t: 'Nothing is wrong with it. That is the thing \u2014 it works perfectly, it is just empty.' },
    usage:   { w: 'hot',  t: 'Everything. Photos going back fifteen years, all my letters, the lot. It is all on the old one.', s: ['storage_used'] },
    noise:   { w: 'cold', t: 'Silent.' },
    history: { w: 'cold', t: 'Brand new, out of the box.' }
  };
  ANSWERS.no_backup = {
    noise:   { w: 'hot',  t: 'Just a little tick now and then. Probably nothing, right?', s: ['smart', 'listen'] },
    when:    { w: 'warm', t: 'A couple of weeks. It has got slower too, but everything gets slower.' },
    usage:   { w: 'hot',  t: 'It is my business. Invoices, quotes, photos of every job I have done.', s: ['storage_used'] },
    history: { w: 'cold', t: 'Never been opened.' },
    storage: { w: 'cold', t: 'Plenty of room left on it.' },
    drop:    { w: 'cold', t: 'It lives on a desk. Never been dropped.' }
  };

  ANSWERS.water_damage = {
    // Unless they already confessed at the counter, they deny it. People do:
    // not always to deceive, often because it happened when they were not there.
    drop:    { w: 'red',  t: 'Never! I treat it like a baby. It never leaves my desk.',
               ifComplaint: { has: 'juice', a: { w: 'hot', t: 'Orange juice, about three weeks ago. I dried it with a hairdryer and left it in rice overnight.', s: ['visual'] } } },
    when:    { w: 'warm', t: 'A few weeks now. It was fine, and then it started doing this out of nowhere.',
               ifComplaint: { has: 'juice', a: { w: 'warm', t: 'It was completely fine for two days afterwards. That is why I did not think it mattered.' } } },
    heat:    { w: 'hot',  t: 'It gets warm in one particular corner now. Only that corner.', s: ['visual', 'thermal'] },
    trigger: { w: 'warm', t: 'Keys type by themselves sometimes. Just a letter or two, at random.' },
    noise:   { w: 'cold', t: 'No noises.' },
    history: { w: 'cold', t: 'Only the hairdryer and the rice.' }
  };
  ANSWERS.dead_no_power = {
    when:    { w: 'warm', t: 'Tuesday morning. It was fine when I shut it on Monday night.' },
    power:   { w: 'hot',  t: 'Nothing at all. No charging light, no sound, no warmth. I have tried two chargers and three sockets.', s: ['power', 'battery'] },
    trigger: { w: 'hot',  t: 'Nothing happened. I opened it and it was just dead.', s: ['power'] },
    drop:    { w: 'cold', t: 'Never dropped, never wet.' },
    noise:   { w: 'cold', t: 'Nothing to hear. That is rather the point.' },
    heat:    { w: 'cold', t: 'Stone cold, always.' }
  };

  ANSWERS.no_internet = {
    trigger: { w: 'hot',  t: 'It shows full bars and says connected. Nothing loads. Not one page.', s: ['activity'] },
    when:    { w: 'warm', t: 'Since Thursday. Nothing changed that I know of.' },
    installed: { w: 'cold', t: 'I have not installed anything.' },
    history: { w: 'hot',  t: 'My other devices are fine on the same Wi-Fi. It is only this one.', s: ['activity'] },
    noise:   { w: 'cold', t: 'No noises.' },
    heat:    { w: 'cold', t: 'Normal temperature.' }
  };
  ANSWERS.router_down = {
    trigger: { w: 'hot',  t: 'Nothing in the house works. The telly, my phone, all of it \u2014 unless I use mobile data.', s: ['activity'] },
    when:    { w: 'warm', t: 'This morning. All at once.' },
    history: { w: 'hot',  t: 'Everything went at the same moment, which is what worried me.', s: ['activity'] },
    installed: { w: 'cold', t: 'Nothing installed.' },
    heat:    { w: 'cold', t: 'Cool as anything.' }
  };

  ANSWERS.smc_confused = {
    when:    { w: 'warm', t: 'A few weeks. It started after the battery went completely flat one night.' },
    trigger: { w: 'hot',  t: 'From the second I press the power button. Full speed fans, cold machine, nothing running.', s: ['thermal'] },
    heat:    { w: 'hot',  t: 'That is the strange part \u2014 it is not hot at all. It is cool and screaming.', s: ['thermal'] },
    power:   { w: 'warm', t: 'The charging light does odd things too. Sometimes orange when it should be green.' },
    noise:   { w: 'warm', t: 'Only the fan. No grinding, just relentless.' },
    installed: { w: 'cold', t: 'Nothing new installed.' }
  };
  ANSWERS.nvram_lost = {
    trigger: { w: 'hot',  t: 'Every single start-up. It asks which disk to boot from and the volume is at maximum.', s: ['visual'] },
    when:    { w: 'warm', t: 'A month or so. It has got more insistent.' },
    installed: { w: 'cold', t: 'I have not installed anything.' },
    storage: { w: 'cold', t: 'Loads of space.' },
    history: { w: 'warm', t: 'It is quite an old machine. Does that matter?' },
    noise:   { w: 'cold', t: 'Quiet as anything.' }
  };
  ANSWERS.locked_out = {
    when:    { w: 'hot',  t: 'I changed it in the summer and wrote it somewhere I have since lost.', s: ['storage_used'] },
    trigger: { w: 'warm', t: 'It just will not take the password. I have tried every version of it I can think of.' },
    usage:   { w: 'hot',  t: 'Everything is on there. Twenty years of photographs. Please do not wipe it.', s: ['storage_used'] },
    history: { w: 'warm', t: 'My daughter set it up originally. She does not remember either.' },
    noise:   { w: 'cold', t: 'Nothing wrong with the machine itself.' }
  };
  ANSWERS.sticky_keys = {
    drop:    { w: 'hot',  t: 'A splash of lemonade, weeks ago. I mopped it straight up and thought nothing more of it.', s: ['visual'] },
    when:    { w: 'warm', t: 'Since the lemonade. It has got worse, not better.' },
    trigger: { w: 'hot',  t: 'Three keys need a proper thump to register. The rest are perfect.', s: ['visual'] },
    heat:    { w: 'cold', t: 'Normal temperature.' },
    power:   { w: 'cold', t: 'Charges fine.' }
  };
  ANSWERS.gpu_cable_wrong_port = {
    trigger: { w: 'hot',  t: 'I dusted behind the desk on Sunday and plugged the monitor back in. Web browsing is fine, but as soon as I start a 3D game it drops to 3 frames per second and stutters like a slideshow.', s: ['visual', 'bench'] },
    history: { w: 'warm', t: 'I unplugged and moved the PC to clean behind the desk last weekend.' },
    noise:   { w: 'cold', t: 'Fans spin quietly, no clicking or grinding.' },
    heat:    { w: 'cold', t: 'Stays cool, the graphics card fans do not even turn on.' }
  };
  ANSWERS.keyboard_layout_swap = {
    trigger: { w: 'hot',  t: 'My password fails every time at the login screen, even though I know it by heart! It starts with "Zebra" and ends with "0".', s: ['visual', 'activity'] },
    when:    { w: 'warm', t: 'Started yesterday afternoon right after my classmate borrowed it to write an English essay.' },
    drop:    { w: 'cold', t: 'Never dropped or spilled on. Keys physically press down smoothly.' },
    noise:   { w: 'cold', t: 'Silent and smooth.' }
  };
  ANSWERS.display_brightness_zero = {
    trigger: { w: 'hot',  t: 'The screen looks completely dead and pitch black, but when I shine my phone flashlight right up against the glass, I can faintly see my desktop wallpaper and cursor moving!', s: ['visual', 'power'] },
    when:    { w: 'warm', t: 'Happened while I was adjusting volume and screen settings in the dark during a lecture.' },
    power:   { w: 'warm', t: 'Power LED is solid on and the fans are running normally.' },
    drop:    { w: 'cold', t: 'Never dropped, glass is completely uncracked.' }
  };
  ANSWERS.audio_device_swapped = {
    trigger: { w: 'hot',  t: 'All sound vanished completely. YouTube videos play, games run, but the built-in speakers produce zero sound, not even a click.', s: ['activity', 'visual'] },
    when:    { w: 'warm', t: 'Right after I unplugged my USB headset and external gaming monitor on Sunday.' },
    noise:   { w: 'cold', t: 'Completely quiet.' },
    drop:    { w: 'cold', t: 'No drops, no water.' }
  };
<<<<<<< HEAD

  ANSWERS.ps5_liquid_metal = {
    when:    { w: 'warm', t: 'This last winter. It is four years old and it was silent until about Christmas.' },
    trigger: { w: 'hot',  t: 'Big games, after twenty minutes or so. The fan winds up and up and then the message comes and it just switches off.', s: ['thermal'] },
    heat:    { w: 'hot',  t: 'The air out of the back is scorching. Much hotter than it used to be.', s: ['thermal', 'visual'] },
    noise:   { w: 'warm', t: 'The fan, loud, the whole time. No grinding or rattling \u2014 just loud.' },
    history: { w: 'warm', t: 'I hoovered the dust holes out myself, like the video said. It made no difference.' },
    drop:    { w: 'cold', t: 'Never dropped. It has sat on the same shelf since the day I bought it.' },
    storage: { w: 'cold', t: 'There is room on it.' }
  };
  ANSWERS.ps5_rail_short = {
    when:    { w: 'hot',  t: 'The morning after the big storm. It was fine the night before.', s: ['meter'] },
    power:   { w: 'hot',  t: 'The light comes on, it beeps once, and it goes off again. The plug and the socket are fine \u2014 the lamp works in the same socket.', s: ['meter', 'power'] },
    trigger: { w: 'warm', t: 'Just pressing the button. It does not even get as far as the logo.' },
    noise:   { w: 'warm', t: 'A little click inside when it tries. Then nothing.' },
    drop:    { w: 'cold', t: 'Never dropped, never wet.' },
    heat:    { w: 'cold', t: 'It is not on long enough to get warm.' },
    history: { w: 'cold', t: 'Nobody has opened it.' }
  };
=======
>>>>>>> bd57278033a15074edb8b68a7b0f2c7befb9d5d4

  /** When a fault says nothing about a question, the customer still answers. */
  var DEFAULTS = {
    when:      'A while ago now. I am honestly not sure exactly.',
    trigger:   'Nothing I can put my finger on. It just does it.',
    drop:      'No, never dropped, never wet.',
    noise:     'No unusual noises, no.',
    installed: 'Nothing new that I can think of.',
    heat:      'It gets a bit warm, but nothing alarming.',
    power:     'Battery and charging are both fine as far as I can tell.',
    history:   'No, you are the first person to look at it.',
    storage:   'I have not had any warnings about space.',
    usage:     null   // filled from the customer's use case
  };

  /*
   * Follow-ups. An interview is not ten independent buttons: an answer opens
   * a question you could not have asked before it, and a finding on the bench
   * gives you something to put to them. Each follow-up hangs off either an
   * answer (`from`: a question id, or another follow-up's id) or a finding
   * (`after`: an instrument id). Some offer a choice of how to say it, and
   * how you say it decides what you hear back.
   *
   * `kind` limits one to machines where the story makes sense; `unless`
   * drops it when the counter complaint already said the thing.
   */
  var FOLLOWUPS = {
    water_damage: [
      { id: 'lci', after: 'visual', unless: 'juice', icon: '\ud83d\udca7',
        q: 'Raise the red liquid indicator with them',
        choices: [
          { id: 'blunt', label: '\u201cThe moisture sensor inside has gone red. That only happens with liquid.\u201d',
            tension: 1,
            a: { w: 'red', t: 'Are you calling me a liar? My flat is damp. Everybody says so. It will be the humidity.' },
            why: 'Put like an accusation, the conversation becomes about whether they lied, not about what happened to the machine. You learn nothing, and the humidity story is a dead end.' },
          { id: 'curious', label: '\u201cThe indicator inside shows liquid got in near that corner. Could anyone else have used it, or cleaned near it?\u201d',
            a: { w: 'hot', t: '\u2026Oh. My son had it on the sofa last month with a glass of cola. He swore nothing happened. It was sticky under the corner, now I think of it.', s: ['meter', 'visual'] },
            why: 'Nobody was accused, so they could remember. And "cola" matters: sugar leaves a residue that keeps conducting and keeps corroding, which is why this cannot wait.' }
        ] }
    ],
    dead_no_power: [
      { id: 'charger', from: 'power', kind: ['laptop', 'handheld'], q: 'Which charger was it on, exactly?',
        a: { w: 'warm', t: 'A new one. Fifteen hundred forints at the night market by Keleti \u2014 it said "100 W fast charge" on the wrapper. The original is in a drawer.', s: ['meter', 'power'] } },
      { id: 'spark', from: 'charger', q: 'When you plugged it in \u2014 a spark, a click, a smell?',
        a: { w: 'warm', t: 'A little click, and a smell like a hot hairdryer for a second. Then nothing, ever since.', s: ['meter'] } }
    ],
    charge_port_dead: [
      { id: 'pulled', from: 'drop', q: 'Which way did it get pulled \u2014 straight out, or sideways?',
        a: { w: 'hot', t: 'Sideways, off the edge of the table. The plug stayed in and bent right over before it came out.', s: ['visual'] } }
    ],
    port_lint: [
      { id: 'pocket', from: 'drop', q: 'Which pocket \u2014 and what else lives in it?',
        a: { w: 'hot', t: 'Front jeans pocket, every day for three years. Keys, tissues, the usual fluff.', s: ['visual', 'power'] } }
    ],
    sd_formatted: [
      { id: 'testshot', from: 'when', q: 'Not even one test photo, to see if it still worked?',
        a: { w: 'warm', t: '\u2026Well. Two. Straight afterwards, to check it still worked. Is that bad?', s: ['storage_used'] } }
    ],
    bad_ram_stick: [
      { id: 'cousin', from: 'history', q: 'Do you know what he actually bought?',
        a: { w: 'hot', t: 'The cheapest one on the site. A different make to the one already in there. He said memory is memory.', s: ['memtest'] } }
    ],
    ps5_liquid_metal: [
      { id: 'upright', from: 'history', q: 'Did you ever change where it stands, or how?',
        a: { w: 'warm', t: 'I laid it flat for a month because of that video, then stood it back up. It made no difference either way.', s: ['thermal'] } }
    ],
    ps5_rail_short: [
      { id: 'surge', from: 'when', q: 'Was it on a surge-protected strip, or straight into the wall?',
        a: { w: 'hot', t: 'Straight into the wall. The television was on a strip, and the television is fine.', s: ['meter'] } }
    ]
  };

  function followupsFor(ticket, machine) {
    var c = (ticket && ticket.complaint || '').toLowerCase();
    return (FOLLOWUPS[ticket.faultId] || []).filter(function (fu) {
      if (fu.kind && machine && fu.kind.indexOf(machine.kind) === -1) return false;
      if (fu.unless && c.indexOf(fu.unless) !== -1) return false;
      return true;
    });
  }

  /** The follow-up's reply, resolving the tone the student chose. */
  function followupAnswer(fu, choiceId) {
    if (!fu.choices) return fu.a;
    var ch = fu.choices.filter(function (x) { return x.id === choiceId; })[0];
    return ch ? ch.a : null;
  }

  function answerFor(faultId, questionId, useCase, ticket) {
    var a = (ANSWERS[faultId] || {})[questionId];
    if (a && a.ifComplaint && ticket && String(ticket.complaint || '').toLowerCase().indexOf(a.ifComplaint.has) !== -1) {
      return a.ifComplaint.a;
    }
    if (a) return a;
    if (questionId === 'usage') {
      return { w: 'warm', t: 'Mostly ' + useCase.label.toLowerCase() + '. ' + useCase.blurb.split('.')[0] + '.' };
    }
    return { w: 'cold', t: DEFAULTS[questionId] };
  }

  window.TechOpsInterview = {
    QUESTIONS: QUESTIONS,
    FOLLOWUPS: FOLLOWUPS,
    answerFor: answerFor,
    followupsFor: followupsFor,
    followupAnswer: followupAnswer,
    /** Is this follow-up something you could ask right now? */
    canAsk: function (ticket, fu) {
      var done = ticket.followed || {};
      if (done[fu.id]) return false;
      if (fu.after) return (ticket.testsRun || []).indexOf(fu.after) !== -1;
      return (ticket.asked || []).indexOf(fu.from) !== -1 || !!done[fu.from];
    },
    /** Follow-ups that this instrument has just made askable. */
    unlockedBy: function (ticket, machine, instrumentId) {
      return followupsFor(ticket, machine).filter(function (fu) {
        return fu.after === instrumentId && !(ticket.followed || {})[fu.id];
      });
    },
    /** Instruments the answers heard so far are pointing at. */
    leads: function (ticket, faultId, useCase) {
      var out = {};
      (ticket.asked || []).forEach(function (qid) {
        var a = answerFor(faultId, qid, useCase, ticket);
        (a.s || []).forEach(function (i) { out[i] = true; });
      });
      var done = ticket.followed || {};
      Object.keys(done).forEach(function (id) {
        var fu = (FOLLOWUPS[faultId] || []).filter(function (x) { return x.id === id; })[0];
        var a = fu && followupAnswer(fu, done[id]);
        ((a && a.s) || []).forEach(function (i) { out[i] = true; });
      });
      return Object.keys(out);
    }
  };
})(window);
