/* =========================================================================
   COMM — English race commentator: browser speech synthesis + captions.
   Lines are chosen at random from pools (never the same line twice in a row).
   Only one line plays at a time; while busy, only the most important pending
   line is kept, and urgent news (lead change, finish) cuts in.
   ========================================================================= */
const Comm = (() => {
  const synth = (typeof window !== 'undefined' && window.speechSynthesis) || null;
  let on = true, speech = true, voice = null, speaking = false, cur = null, lastEnd = 0, queue = null, notesOn = true, voice2 = null;
  const log = [], lastPick = {};
  const GAP = 500;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first'];
  const ordinal = (n) => ORD[n] || n + 'th';

  const LINES = {
    intro: ['Welcome to {track}! {laps} laps, thirteen cars, and you line up {grid} on the grid.', 'Good day and welcome to {track}. {laps} laps ahead, and you start from {grid}.', 'Here we are at {track}! Thirteen cars, {laps} laps, and you start {grid}.'],
    introNet: ['Welcome to {track}! Just two cars today, {laps}: you and {name}, side by side on the front row.', 'Here we are at {track} for a duel with {name} over {laps}. May the better driver win!', 'Good day and welcome to {track}! You against {name}, {laps}. Let\'s see who takes it.'],
    introOne: ['Welcome to {track}, the Green Hell! One lap of more than twenty kilometres, and you start {grid}.', 'Here we are at {track}. One lap, a full field, and you line up {grid} on the grid.', 'Welcome to {track}! Twenty kilometres of forest, crests and jumps. One lap, and you start {grid}.'],
    // the Nordschleife's famous places
    nrFlug: ['Over the Flugplatz, and the car goes light!', 'Flugplatz! Airborne over the crest!'],
    nrFuchs: ['Down into the Foxhole, flat out!', 'The Fuchsröhre, the fastest part of the lap!'],
    nrBreid: ['Down to Breidscheid, the lowest point of the lap.', 'Breidscheid, and now the long climb begins.'],
    nrKar: ['Into the Karussell! Dive into the concrete!', 'Round the famous Karussell!'],
    nrHohe: ['Hohe Acht, the highest point of the circuit!', 'Up at Hohe Acht, over six hundred metres high.'],
    nrPflanz: ['Pflanzgarten! Hold on for the jump!', 'Over the Pflanzgarten jump!'],
    nrDott: ['Onto the Döttinger Höhe, the long straight home!', 'Flat out down the Döttinger Höhe!'],
    // the end of a championship (at the results of its last round)
    champWin: ['And that makes you the champion! What a season!', 'Champion! The title is yours!', 'You have won the championship! Brilliant driving all season!'],
    champEnd: ['That is the end of the championship. You finish {pos} overall.', 'The season is over, and you are {pos} in the final standings.'],
    // the weather (after the welcome, in a wet race)
    rain: ["And it's raining! A wet track today, so brake early and go easy on the throttle.", 'Rain is falling, and the track is wet. Watch out for the spray!', 'The heavens have opened! Grip will be hard to find today.'],
    rainSpa: ["Typical Spa weather, it's raining in the Ardennes! Brake early today.", "It's wet at Spa! Eau Rouge in the rain, that takes courage.", 'Rain at Spa, of course! Spray everywhere, and grip will be hard to find.'],
    goNet: ['Lights out, and away they go!', "And they're off!", 'Green light! Side by side into turn one!', 'Go, go, go! The duel is on!'],
    go: ['Lights out, and away we go!', "And they're off!", 'Green light! The pack charges into turn one!', 'Go, go, go! The race is on!'],
    gain: ["What a move! Up to {pos}!", "Brilliant overtake, you're now {pos}!", "Straight past! That's {pos} place!", "Another one bites the dust. You're up to {pos}!", 'Clean pass, into {pos}!'],
    lose: ["Oh, you've lost a place. Down to {pos}.", 'Overtaken! You drop to {pos}.', "They come through, you're now {pos}."],
    lead: ['And you take the lead!', "You're leading the race!", 'Into first place! Now hold on to it!'],
    lostLead: ["You've lost the lead!", 'Out of first place. Fight back!'],
    lap: ['Lap {lap} of {laps}.', 'Into lap {lap}. Keep it clean.', "That's lap {lap}. Let's go."],
    best: ['Fastest lap! {time} seconds!', 'Quickest lap of the race, {time}!', 'Superb lap, {time} seconds!'],
    record: ['New track record! {time} seconds!', "That's a new lap record! {time}!"],
    final: ['Final lap! Give it everything!', 'Last lap! This is where it counts!', 'One lap to go!'],
    drift: ['Look at that drift!', 'Sideways and loving it!', 'Beautiful slide through there!', 'Full opposite lock, what a drift!'],
    jump: ['Big air!', 'Airborne! What a jump!', 'Flying over the crest!', 'Look at that car fly!'],
    land: ['Ooh, heavy landing!', 'That landing rattled some teeth!', 'Hard touchdown, but still going!'],
    crash: ['Into the barrier!', "Ouch, that's going to leave a mark!", 'Big hit on the wall!', 'Straight into the fence!'],
    contact: ['Contact! Bumper to bumper!', 'A bit of paint trading there!', 'They touched! Rubbing is racing!'],
    offtrack: ['Off the track, that costs time!', 'Wide, and off the road!', 'Running wide there!'],
    gapLead: ['You lead by {gap} seconds.', 'A {gap} second lead. Keep pushing!', 'The gap to second place is {gap} seconds.'],
    gapBehind: ['The leader is {gap} seconds up the road.', '{gap} seconds to the lead. Keep chipping away!', "You're {pos}, {gap} seconds behind the leader."],
    pressure: ["Watch your mirrors, there's a car right behind you!", "Under pressure! Someone's all over your rear bumper!"],
    win: ['Chequered flag! Victory! What a drive!', 'And you win it! Absolutely brilliant!', 'Winner! Take a bow!'],
    podium: ['Chequered flag! {pos} place, a podium finish!', 'Across the line in {pos}! On the podium!'],
    finish: ['Chequered flag. You finish {pos}.', 'Across the line in {pos}. Better luck next time!', "That's the flag. {pos} place today."],
    wrong: ['Wrong way! Turn it around!', "You're going the wrong way!"],
    damage: ["That car's taking a real beating!", 'The bodywork is looking battered now!', "There's some serious damage there!"],
    partLost: ['There goes the {part}!', 'The {part} has come clean off!', 'Bits flying everywhere, that was the {part}!'],
    heavyDamage: ["Smoke pouring from the engine! That doesn't look good!", 'Heavy damage! Nurse it home!', 'That car is badly hurt now!'],
    pitIn: ['Into the pit lane!', 'Coming in for repairs!', 'He dives into the pits!'],
    drs: ['DRS open down the straight!', 'The rear wing opens, DRS is on!', 'Within a second at the line, DRS for the chase!'],
    pitWork: ['The crew get to work!', 'Mechanics all over the car!', 'Quick work needed here from the crew!'],
    pitOut: ['Back out, good as new!', 'Great stop from the crew!', 'Repaired and rejoining the race!'],
    aiPitIn: ['{name} is coming into the pits, that car was badly damaged!', 'And {name} dives into the pit lane for repairs.', 'Pit stop for {name}! The crew are waiting.', '{name}, running {pos}, heads for the pits!'],
    aiPitOut: ['{name} is back out after the repairs.', 'Good stop for {name}, back in the race in {pos}!', 'And {name} rejoins, the car fixed up by the crew.'],
    crossUnder: ['And {name} flashes across the bridge right above you!', 'Look up! {name} goes over the top as you go under!', 'Under the bridge, with {name} right above you!'],
    crossOver: ['Over the bridge, and {name} passes right underneath!', '{name} goes under the bridge just as you cross over the top!', 'You go over, {name} goes under! Only in a figure of eight!'],
    propCone: ['Cone down!', 'There goes a cone!', 'Sending the cones flying!'],
    propTyre: ['Straight through the tyres!', 'Tyres flying everywhere!', 'He has scattered the tyre stack!'],
    propBale: ['Right through the hay bales!', 'Straw everywhere!', 'The bales go flying!'],
    propPylon: ['Took the marker post with him!', 'That marker post is history!'],
    propPost: ["He's clipped a marker post!", 'Roadside post down!', 'That post never stood a chance!', 'Flattened a post there!'],
    propCrate: ['Smashed straight into the crate!', 'There goes the crate!'],
    // time trial (hill climb against the clock, no opponents)
    introTT: ['Welcome to {track}, the race to the clouds! Just you, the mountain and the clock.', 'Here we are at the foot of {track}. {cps} checkpoints between you and the summit.', 'Welcome to {track}! No opponents today, only the clock. Get to the top as fast as you can.'],
    goTT: ['Green light! The clock is running!', 'Go! Attack the mountain!', "And you're away! Up the hill!"],
    cpFirst: ['Checkpoint {cp}, {time}.', 'Through checkpoint {cp}. Keep climbing!', 'Checkpoint {cp}. Up we go!'],
    cpFast: ['Checkpoint {cp}, {delta} seconds up on your best!', 'Green split at checkpoint {cp}! {delta} seconds faster!', 'Checkpoint {cp}. You are {delta} seconds ahead of your record pace!'],
    cpEven: ['Checkpoint {cp}, dead level with your best split!', 'Checkpoint {cp}. Right on your record pace, not a hair in it!'],
    cpSlow: ['Checkpoint {cp}, {delta} seconds down on your best.', 'Split {cp}: {delta} seconds slower. Push on!', 'Checkpoint {cp}. Down by {delta}, find that time!'],
    summitRecord: ['At the summit! A new personal best, {time}!', 'Record run! {time} to the top of {track}!', 'What a climb! New personal best, {time}!'],
    summitEven: ['At the summit in {time}. That is your record to the thousandth!', '{time} at the top, dead level with your best!'],
    // Pikes Peak: the TV helicopter (its fly-over after Glen Cove, and the escort to the finish)
    heliFly: ['The TV chopper is overhead!', 'Here comes the helicopter, catching the action!', 'Look up! The TV helicopter sweeps across the road!'],
    heliFin: ['And the helicopter is back, escorting you to the summit!', 'The TV chopper picks you up for the final run to the line!', 'Here comes the helicopter again, the cameras follow you home!'],
    summit: ['At the summit in {time}, {delta} seconds off your best.', 'Across the line at the top. {time}, just {delta} short of the record.', "That's the summit. {time}. {delta} seconds to find next time."],
    // time trial on a rally special stage (Ouninpohja): gravel, crests and jumps, a flying finish
    introStage: ['Welcome to {track}, the most famous stage of the Rally of Finland! Just you, the gravel and the clock.', 'Here we are at the start of {track}. {cps} splits, crest after crest, and nobody to race but the clock.', 'Welcome to {track}! Fast gravel, blind crests and big jumps. Keep it flat!'],
    // the famous jump (def.jumpRec: Ouninpohja's Yellow House, Markko Märtin's 57 m)
    jumpRec: ['{m} metres at {place}! The record there is {rec}, by {by}.', 'Over {place}, {m} metres! {by} flew {rec} here.', '{m} metres through the air at {place}!'],
    jumpPB: ['{m} metres at {place}, your longest jump there!', 'A new personal best at {place}, {m} metres!'],
    jumpBeat: ['{m} metres at {place}! Longer than {by}!', "Unbelievable! {m} metres, beyond {by}'s {rec}!"],
    medal: ['That is a {medal} medal time!', 'And that is worth a {medal} medal!', 'A {medal} medal on this stage!'],
    goStage: ['Go! Flat out into the forest!', "And you're away! Keep it flat over the crests!", 'Green light! The clock is running!'],
    cpFirstStage: ['Split {cp}, {time}.', 'Through split {cp}. Keep it flat!', 'Split {cp}, {time}. Hold on tight!'],
    stageRecord: ['Flying finish! A new personal best, {time}!', 'Record run through {track}! {time}!', 'What a stage! A new personal best, {time}!'],
    stageEven: ['Through the flying finish in {time}. That is your record to the thousandth!', '{time} at the finish, dead level with your best!'],
    stageEnd: ['Flying finish in {time}, {delta} seconds off your best.', 'Across the line. {time}, just {delta} short of the record.', "That's the end of the stage. {time}. {delta} seconds to find next time."]
  };

  // Speech engines don't report gender, so voices are scored by known name/URI markers.
  // Android Google TTS variants (en-gb-x-gbd, -rjs, en-us-x-iol ...), Samsung (SMTm = male),
  // Microsoft/Apple voice names. Without an identifiable male voice, a lower pitch is used.
  const MALE = /\bmale\b|\bman\b|daniel|george|arthur|oliver|harry|ryan|thomas|james|\bguy\b|davis|eric|christopher|roger|aaron|\bfred\b|\balex\b|rishi|gordon|\blee\b|\btom\b|x-gbd|x-rjs|x-iol|x-iom|x-tpd|x-aub|x-aud|smtm/i;
  const FEMALE = /female|woman|samantha|karen|moira|tessa|serena|\bkate\b|susan|hazel|libby|sonia|zira|\baria\b|jenny|fiona|victoria|allison|\bava\b|martha|stephanie|catherine|emily|\bamy\b|x-gba|x-gbb|x-gbc|x-gbg|x-fis|x-iob|x-iog|x-sfg|x-tpc|x-tpf|smtf|smtl/i;
  let voiceMale = false;
  function pickVoice() {
    if (!synth) return;
    let vs = []; try { vs = synth.getVoices() || []; } catch (_) { vs = []; }
    const en = vs.filter(v => /^en([-_]|$)/i.test(v.lang || ''));
    let best = null, bs = -1e9;
    for (const v of en) {
      const id = (v.name || '') + ' ' + (v.voiceURI || '');
      let sc = 0;
      if (MALE.test(id)) sc += 10; else if (FEMALE.test(id)) sc -= 10;
      sc += /GB/i.test(v.lang) ? 3 : /AU/i.test(v.lang) ? 2 : /US/i.test(v.lang) ? 1 : 0.5;
      if (v.localService) sc += 0.5;
      if (sc > bs) { bs = sc; best = v; }
    }
    voice = best;
    voiceMale = !!best && MALE.test((best.name || '') + ' ' + (best.voiceURI || ''));
    // the co-driver (pace notes on a rally stage): another English voice, the other sex first; none: the commentator's, higher and faster
    let b2 = null, s2 = -1e9;
    for (const v of en) {
      if (v === best) continue;
      const id = (v.name || '') + ' ' + (v.voiceURI || '');
      let sc = (voiceMale ? FEMALE.test(id) : MALE.test(id)) ? 6 : 0;
      sc += /GB/i.test(v.lang) ? 2 : /AU|IE/i.test(v.lang) ? 1.5 : /US/i.test(v.lang) ? 1 : 0.5;
      if (v.localService) sc += 0.5;
      if (sc > s2) { s2 = sc; b2 = v; }
    }
    voice2 = b2;
    if (typeof onVoice === 'function') onVoice(voiceInfo());
  }
  let onVoice = null;
  const voiceInfo = () => ({ name: voice ? voice.name : '', lang: voice ? voice.lang : 'en-GB', male: voiceMale, any: !!synth, codrv: voice2 ? voice2.name : '' });
  if (synth) { pickVoice(); try { synth.addEventListener('voiceschanged', pickVoice); } catch (_) { synth.onvoiceschanged = pickVoice; } }

  function speakNow(item) {
    const maxT = 2000 + item.text.length * 95;          // safety net if the engine never reports the end
    const me = cur = { prio: item.prio, t: now(), maxT, item };
    if (!synth || !speech) { speaking = false; return; }
    try {
      const u = new SpeechSynthesisUtterance(item.text), v = item.note ? voice2 || voice : voice;
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-GB'; u.volume = 1;
      if (item.note) { u.rate = 1.22; u.pitch = voice2 ? 1 : 1.3; }   // the co-driver: brisk (in the commentator's voice, higher)
      else { u.rate = 1.08; u.pitch = voiceMale ? 0.95 : 0.72; }   // deeper tone when no male voice exists
      // only the line that is still current may end it (a cancelled line reports its end/error later, after the next one started)
      u.onend = u.onerror = () => { if (cur !== me) return; speaking = false; lastEnd = now(); cur = null; };
      speaking = true; synth.speak(u); item.spoken = true;
    } catch (_) { speaking = false; lastEnd = now() + item.text.length * 60; }
  }

  function busy() {
    const t = now();
    if (speaking && cur && t - cur.t > cur.maxT) { speaking = false; lastEnd = t; }
    return speaking || t < lastEnd + GAP;
  }

  // prio: 0 = ambient (named places: anything from prio 2 cuts in, it only waits in an empty queue), 1 = chatter ... 5 = finish.
  // opt.ttl = how long (ms) the line may wait in the queue. Returns the logged item (item.spoken / item.cut are set later), or null.
  function say(key, vars, prio, opt) {
    if (!on || !speech || !synth) return null;   // audio-only commentary: silent when sound is off
    const pool = LINES[key]; if (!pool) return null;
    let k = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && k === lastPick[key]) k = (k + 1) % pool.length;
    lastPick[key] = k;
    let text = pool[k].replace(/\{(\w+)\}/g, (_, n) => (vars && vars[n] != null ? String(vars[n]) : ''));
    text = text.charAt(0).toUpperCase() + text.slice(1);
    const item = { key, text, prio: prio == null ? 1 : prio, t: now() };
    if (opt && opt.ttl > 0) item.ttl = opt.ttl;
    log.push(item); if (log.length > 200) log.shift();
    if (!busy()) { speakNow(item); return item; }
    if (cur && item.prio >= cur.prio + 2) { cancelSpeech(); speakNow(item); return item; }   // urgent news cuts in
    if (!queue || item.prio >= queue.prio) queue = item;                               // keep only the most important pending line
    return item;
  }

  // the co-driver's pace notes (a rally stage, game.js reads them ahead of the car): its own voice, said at once. The commentator's line
  // is cut off; the co-driver's own call is not: the next one waits in line (before any chatter) and is dropped if it cannot start in 1.5 s
  function note(text) {
    if (!notesOn || !speech || !synth || !text) return null;
    const item = { key: 'note', text, prio: 4, t: now(), note: true, ttl: 1500 };
    log.push(item); if (log.length > 200) log.shift();
    if (!busy()) { speakNow(item); return item; }
    if (cur && !cur.item.note) { cancelSpeech(); speakNow(item); return item; }
    queue = item;
    return item;
  }

  // news from the world: the Pikes Peak TV helicopter shows up (World's dyn.pk.news: { key, n }, each said once)
  let heliSeen = null;
  function heliNews() {
    const w = typeof Render !== 'undefined' && Render.world, pk = w && w.dyn && w.dyn.pk, nw = pk && pk.news;
    if (!nw || nw === heliSeen) return;
    heliSeen = nw; say(nw.key, null, 1, { ttl: 4000 });
  }

  function update() {
    try { heliNews(); } catch (_) { }
    const t = now();
    if (queue && !busy()) {
      const fresh = t - queue.t < (queue.ttl || (queue.prio >= 3 ? 7000 : 3500));       // stale chatter is dropped
      const q = queue; queue = null;
      if (fresh) speakNow(q);
    }
  }

  function cancelSpeech() { if (speaking && cur && cur.item) cur.item.cut = true; if (synth) { try { synth.cancel(); } catch (_) { } } speaking = false; lastEnd = 0; cur = null; }
  function stop() { cancelSpeech(); queue = null; }
  // call from a tap handler: some browsers only allow speech after a user gesture
  function unlock() { if (!synth || !speech || !on) return; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (_) { } }
  function test() { cancelSpeech(); queue = null; speakNow({ key: 'test', text: "Hello and welcome! I'm your commentator for today's race.", prio: 9, t: now() }); }
  function setOnVoice(fn) { onVoice = fn; fn(voiceInfo()); }
  function setEnabled(v) { on = !!v; if (!on) stop(); }
  function setSpeech(v) { speech = !!v; if (!speech) cancelSpeech(); }
  function setNotes(v) { notesOn = !!v; if (!notesOn && cur && cur.item.note) cancelSpeech(); }
  const available = () => !!synth;
  // register (or replace) a pool at run time, e.g. a track's place lines; say() ignores keys that have no pool
  function addLines(key, arr) {
    const a = (Array.isArray(arr) ? arr : [arr]).filter(s => typeof s === 'string' && s.trim());
    if (!a.length) return false;
    LINES[key] = a; if (!(lastPick[key] < a.length)) delete lastPick[key];   // keep "never the same line twice in a row" across races
    return true;
  }
  // what the commentator is doing: busy (speaking or in the pause after a line), the priority speaking now and waiting (-1 = none)
  function state() { const b = busy(); return { busy: b, prio: speaking && cur ? cur.prio : -1, queued: queue ? queue.prio : -1 }; }

  return { say, note, update, stop, unlock, setEnabled, setSpeech, setNotes, ordinal, available, log, test, voiceInfo, setOnVoice, addLines, state };
})();
if (typeof module !== 'undefined') module.exports = Comm;

