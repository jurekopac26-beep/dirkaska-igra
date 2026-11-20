/* =========================================================================
   COMM — English race commentator: browser speech synthesis + captions.
   Lines are chosen at random from pools (never the same line twice in a row).
   Only one line plays at a time; while busy, only the most important pending
   line is kept, and urgent news (lead change, finish) cuts in.
   The run from the police has no commentator: the police radio speaks instead
   (radio(): its lines' English twins; game.js directs them). The team's engineer
   on the radio (teamRadio(): Nastavitve · Glas inženirja). Every voice speaks
   English, whatever the page's language (only the captions follow it).
   ========================================================================= */
const Comm = (() => {
  const synth = (typeof window !== 'undefined' && window.speechSynthesis) || null;
  let on = true, speech = true, voice = null, speaking = false, cur = null, lastEnd = 0, queue = null, notesOn = true, voice2 = null;
  let radioMode = false, engOn = true;   // (radioMode: the commentator and the co-driver silent; engOn: the engineer's voice)
  const log = [], lastPick = {};
  const GAP = 500;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth', 'twenty-first'];
  const ordinal = (n) => ORD[n] || n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');   // (22nd, 23rd, 31st, 100th: the big fields)
  // a number of cars or rivals in words, for the lines that say how many ({cars}, {rivals}: twenty-two, a hundred)
  const ONES = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const words = (n) => n >= 0 && n < 20 ? ONES[n] : n < 100 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : n === 100 ? 'a hundred' : n < 200 ? 'a hundred and ' + words(n - 100) : String(n);   // (101: the menu's hundred rivals and the player)

  const LINES = {
    intro: ['Welcome to {track}! {laps} laps, {cars} cars, and you line up {grid} on the grid.', 'Good day and welcome to {track}. {laps} laps ahead, and you start from {grid}.', 'Here we are at {track}! {cars} cars, {laps} laps, and you start {grid}.'],
    introAlone: ['Welcome to {track}! An empty grid today: {run}, just you and the clock.', 'Here we are at {track}. No rivals this time: {run} against the clock.'],   // (a race without rivals: the menu's Opponents 0; {run}: one lap, three laps)
    introNet: ['Welcome to {track}! Just two cars today, {laps}: you and {name}, side by side on the front row.', 'Here we are at {track} for a duel with {name} over {laps}. May the better driver win!', 'Good day and welcome to {track}! You against {name}, {laps}. Let\'s see who takes it.'],
    introNetN: ['Welcome to {track}! {n} friends on the grid today, {laps}, and no one else. Let the best driver win!', 'Here we are at {track}: {n} of you over {laps}. Friends now, rivals for a while!', 'Good day and welcome to {track}! {n} players, {laps}. Who takes this one?'],
    // the open road (Vršič, Los Caracoles: traffic both ways): the duel with one rival, the run from the police (on Vršič the police radio instead, game.js)
    introTraffic: ['Welcome to {track}, and the road is open today: traffic both ways, cyclists and people on foot. Just you and {rival}, first to the pass wins!', 'Here we are in Kranjska Gora, at the foot of {track}. A duel with {rival} through the everyday traffic. Mind the walkers in the village!', 'Welcome to {track}! No closed road this time: cars, buses and bikes coming both ways. Beat {rival} to the top!'],
    goTraffic: ["And they're off! Watch the traffic!", 'Go! Two cars racing up an open road, what could possibly go wrong?', 'Away they go! Keep your eyes on the oncoming cars!'],
    introPolice: ['Welcome to {track}! The police want a word with you, and they are right behind. Get over the pass without getting caught!', 'Here we are in Kranjska Gora, and the blue lights are already flashing. Twelve kilometres to the pass. Do not stop!', 'Welcome to {track}! A patrol car on your tail, spike strips and roadblocks up the mountain. Run for the top!'],
    goPolice: ['Go, go, go! The police are coming!', 'Foot down! Here come the blue lights!', 'Away you go! Do not let them box you in!'],
    policeJoin: ['Another patrol car has joined the chase!', 'More police coming up behind you!', 'They are calling in reinforcements!'],
    spikes: ['Spike strip ahead! Find the gap!', 'The police have laid a stinger across the road! Look for the gap at the edge!', 'Spikes on the road! Aim for the gap!'],
    roadblock: ['Roadblock ahead! Two patrol cars across the road!', 'They have blocked the road up ahead! There is a gap at one edge!', 'Roadblock coming up! Squeeze through or go round on the verge!'],
    flat: ['A tyre has gone! That will cost you grip.', 'Puncture! The car is going to be a handful now.', 'The spikes got you! Careful in the bends now.'],
    policeWreck: ['That patrol car is out of the chase!', 'One police car down!', 'The police car is finished, but they will send another!'],
    busted: ['Busted! That is the end of the road.', 'The police have got you! Game over.', 'Caught! No escape this time.'],
    escaped: ['You made it over the pass! The police will have to wait for another day!', 'Escaped! Over the top and away!', 'What a getaway! Right over the Vrshich pass!'],
    pedHit: ['Watch out for the people!', 'Oh no, mind the pedestrians!', 'Careful! There are people on the road!'],
    bikeHit: ['A cyclist down! Careful out there!', 'Oh, that cyclist did not see you coming!', 'Mind the cyclists on the edge of the road!'],
    trafficCrash: ['Contact with the traffic!', 'Ouch, that car will need a garage.', 'Straight into the traffic! That hurt.'],
    // a race up an open road (Vršič, the north side: 24 cobbled hairpins up to the pass)
    introPass: ['Welcome to {track}! {cars} cars, twelve kilometres and twenty-four hairpins up to the top, and you start {grid}.', 'Here we are in Kranjska Gora, at the foot of {track}. A race all the way up the mountain, and you line up {grid}.', 'Welcome to {track}, the Russian Road! {cars} cars heading for the pass, and you start {grid}.'],
    // the flying start of a race up an open road (game.js flyStep): only the countdown to the start line, then the race is on
    flyThree: ['Three!'], flyTwo: ['Two!'], flyOne: ['One!'], flyGo: ['The race has started!'],
    goPass: ['Lights out, and away they go, up the mountain!', "And they're off! {cars} cars heading for the pass!", 'Green light! The pack charges up the valley!', 'Go, go, go! Next stop, the top of the pass!'],
    introOne: ['Welcome to {track}, deep in the forests of the Eifel! One lap of more than twenty kilometres, and you start {grid}.', 'Here we are at {track}. One lap, a full field, and you line up {grid} on the grid.', 'Welcome to {track}! Twenty kilometres of forest, crests and jumps. One lap, and you start {grid}.'],
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
    finishAlone: ['Chequered flag! A clean run to the line, just you and the clock.', "That's the flag. Let's see what the clock says."],   // (no rivals: no place to call)
    finish: ['Chequered flag. You finish {pos}.', 'Across the line in {pos}. Better luck next time!', "That's the flag. {pos} place today."],
    wrong: ['Wrong way! Turn it around!', "You're going the wrong way!"],
    damage: ["That car's taking a real beating!", 'The bodywork is looking battered now!', "There's some serious damage there!"],
    partLost: ['There goes the {part}!', 'The {part} has come clean off!', 'Bits flying everywhere, that was the {part}!'],
    heavyDamage: ["Smoke pouring from the engine! That doesn't look good!", 'Heavy damage! Nurse it home!', 'That car is badly hurt now!'],
    // destruction (game.js commWreck): the player's car losing a wheel ({wheel}), still going on three, destroyed, on fire, retired; the
    // rivals near the player ({a}: the driver) losing a wheel, out of the race with the car destroyed, on fire
    wheelLost: ['There goes a wheel! The {wheel} is bouncing away down the road!', 'The {wheel} has come clean off!', 'Oh no, you have lost the {wheel}!'],
    threeWheels: ['Still going on three wheels! What a sight!', 'Three wheels and a shower of sparks, but you are still moving!', 'Limping on three wheels, the hub scraping along the tarmac!'],
    wreck: ['That car is destroyed! There is hardly anything left of it!', 'The car is a wreck! It is held together by hope alone.', 'Totally destroyed! Can it even make it to the flag?'],
    fireMe: ['Your car is on fire! Flames from the engine bay!', 'Fire! The engine is burning!', 'Flames pouring out of your car!'],
    retired: ['And that is the end of your race. The car is retired.', 'You pull off and retire. A painful end to the race.', 'Out of the race! That car could not go on.'],
    rivalWheel: ['{a} has lost a wheel!', "A wheel comes off {a}'s car!", 'Look at that, {a} is down to three wheels!'],
    rivalWreck: ['{a} is out, that car is destroyed!', '{a} pulls off, that car is finished!', 'That is the end of the race for {a}, the car is wrecked!'],
    fire: ["{a}'s car is on fire!", "Flames from {a}'s car!", 'Smoke and flames, {a} is in big trouble!'],
    pitIn: ['Into the pit lane!', 'Coming in for repairs!', 'He dives into the pits!'],
    pitAdvice: ['That car is damaged! Box, box: the pit lane is on the right, just after the last corner, and the mechanics will fix it.', 'Heavy damage there! Bring it into the pits after the final corner, the crew are ready.', 'Time to pit! The entry is on the right after the last corner, the mechanics will put it right.'],
    // flags: a yellow flag, the safety car, overtaking under them
    yellow: ['Yellow flags! A car has stopped on the track.', 'Yellow flag waving, careful through there!', 'Yellow flags, a stranded car ahead!'],
    sc: ['The safety car is out! No overtaking!', 'Safety car deployed! The field will bunch up behind it.', 'Here comes the safety car! Everyone slows down.'],
    scIn: ['The safety car is coming in! Get ready for the restart!', 'Safety car in this lap! Warm up those tyres!', 'The lights are off on the safety car, restart coming!'],
    green: ['Green flag! We are racing again!', 'And we are green! Back to racing!', 'Green, green, green! Racing resumes!'],
    red: ['Red flag! The race has been stopped!', 'Red flag, red flag! They are stopping the race after that crash!', 'The red flag is out! Everyone slows right down and lines up.'],   // (game.js flagEvent: the red flag, Core Race._redOut)
    redGo: ['The restart is on! They follow the safety car away.', 'And we are going again, behind the safety car!', 'Restart! The queue is moving again.'],
    passWarn: ['Overtaking under the flag! Give that place back!', 'That was a pass under yellow! Let him back through!', 'No overtaking under the flag! Give the position back!'],
    penalty: ['A five second penalty!', 'That will cost you: five seconds added!', 'Penalty! Five seconds on your race time!'],
    // a changing weather (the rain starts or stops during the race) and the tyres
    rainStart: ['And here comes the rain! The track is getting wet!', 'Spots of rain on the visors! Slicks or rain tyres now?', 'It is starting to rain! The grip is going away!'],
    // fuel (a race with fuel on) and an endurance race's evening and night
    fuelLow: ['Running low on fuel! Box for fuel this lap.', 'The fuel light is on! Time to come in and fill up.', 'Not much fuel left in that tank, pit now!'],
    fuelOut: ['Oh no, out of fuel! Spluttering along on the last drops!', 'Dry tank! That car is limping back to the pits now.'],
    batteryLow: ['The battery is running low! Box this lap for a charge.', 'Not much charge left in that battery, pit now!'],   // (an electric car)
    batteryOut: ['The battery is flat! Crawling along on the last of the charge!', 'Flat battery! That car is creeping back to the pits now.'],
    puncture: ['Puncture! That tyre is going down!', 'That knock has cut a tyre! A puncture!', 'A slow puncture, the car is pulling to one side now!'],
    // worn tyres (a race with tyres): worn out, the cliff ahead; driven on, a tyre bursts
    tyresWorn: ['Those tyres are worn out! The grip is about to fall away.', 'The tyres are finished, time to come in for a fresh set!', 'Look at those tyres, worn right down! Box now or pay the price.'],
    tyreBurst: ['Bang! A tyre has burst! Those tyres were finished!', 'The tyre has given up! That is what happens when you stay out too long!', 'A blowout! The worn tyre could not take any more!'],
    // a friend's challenge (the challenge link): the run, beaten or not
    chalIntro: ["A challenge from {name}! The time to beat: {time}.", "{name} has set the bar at {time}. Let us see if you can beat it!"],
    chalWon: ["You beat {name}'s time! Challenge done!", "Faster than {name}, by {delta}! Send that one back!"],
    chalLost: ["Not quite, {name} is still faster, by {delta}.", "{name}'s time stands, {delta} quicker. Try again!"],
    // the team's engineer on the radio (teamRadio(): the co-driver's voice; Nastavitve · Glas inženirja)
    radioBox: ['Box, box, box this lap!', 'Box this lap, box this lap.', 'Box this lap, we are ready for you.'],
    radioBoxWet: ['It is wet out there, box this lap for wets!', 'Box this lap for rain tyres!'],
    radioBoxDry: ['The line is dry, box this lap for slicks.', 'Box this lap, slicks are ready.'],
    radioBoxFix: ['Box this lap, we will fix the car.', 'Box this lap, box this lap, we have new parts ready.'],
    radioBoxTyre: ['Puncture! Box this lap, we have a new tyre ready.', 'Box this lap for a new tyre!'],
    radioBoxWorn: ['The tyres are gone, box this lap!', 'Tyres are finished. Box, box, box!'],
    radioWindow: ['Pit window opens on lap {from}.', 'We are planning the stop between laps {from} and {to}.'],
    radioRain: ['Rain on the radar, about a minute away.', 'We expect rain in about a minute.'],
    radioRainStop: ['The rain should stop soon.', 'The radar says the rain is moving away.'],
    // the weather forecast at the way in to a stop (a changing weather, game.js fcRadio): {when} 'within a lap' or 'in 2 to 3 laps', {p} the chance
    radioFcRain: ['Forecast: rain {when}, {p} percent chance.', 'The radar has rain coming {when}, {p} percent.'],
    radioFcStop: ['Forecast: the rain stops {when}, {p} percent chance.', 'The rain should ease off {when}, {p} percent.'],
    radioFcDry: ['Forecast: dry to the finish.', 'No rain on the radar, dry to the end.'],
    radioFcWet: ['Forecast: rain to the finish.', 'It stays wet to the end.'],
    radioSC: ['Safety car! Box now, it is a cheap stop.', 'Safety car, safety car. Box this lap, the stop is cheap.'],
    radioRedPit: ['Red flag, red flag. Slowly into the pit lane, stay behind the car ahead.', 'Red flag. Into the pits, no overtaking, line up behind the car ahead.'],   // (the red flag, game.js flagEvent: the queue in the pit lane, or on the grid)
    radioRedGrid: ['Red flag, red flag. Slowly to the grid, stay behind the car ahead.', 'Red flag. Back to the start straight, no overtaking, line up behind the car ahead.'],
    radioRedGo: ['Restart behind the safety car. Get some heat in those tyres.', 'We are restarting behind the safety car. Warm the tyres up.'],
    radioGood: ['Good stop. You are P{pos}.', 'Nice stop, P{pos} now.'],
    radioAhead: ['Car ahead boxing this lap.', 'The car ahead is boxing this lap.'],   // (the car right ahead in for its stop, game.js aheadRadio)
    radioAheadOver: ['Car ahead boxing this lap. Stay out, the overcut should work.', 'Car ahead is boxing. Stay out one more lap for the overcut.'],
    radioAheadUnder: ['Car ahead boxing next lap. Box this lap for the undercut.', 'They are boxing next lap. Box now, we go for the undercut.'],
    radioGo: ['Go, go, go!', 'Go, go, go! All yours.', 'Go, go, go! Push now!'],   // (the hand-back after a stop: VOZIŠ TI!, game.js pitFree)
    radioGain: ['Great stop, you gained {n} {pl}. P{pos} now.', 'The stop worked, up {n} {pl} to P{pos}.'],   // (the places a stop gained or lost, game.js swingRadio)
    radioLose: ['We lost {n} {pl} in the stop. P{pos} now.', 'Down {n} {pl} after the stop, P{pos}. Keep pushing.'],
    radioSame: ['No change after the stop, still P{pos}.', 'Same place after the stop, P{pos}.'],
    radioLast: ['Last lap, bring it home!', 'Final lap, keep it clean.', 'Last lap, push now!'],
    brakesHot: ['The brakes are overheating! They will not stop the car as well now.', 'Smoking hot brakes! Brake a little earlier for a while.'],
    engineHot: ['The engine is running hot! Losing power now.', 'Temperature warning, that engine is overheating!'],
    fuelIn: ['Fuel in, and back out onto the track!', 'Tank full again, off it goes!'],
    batteryIn: ['Battery charged, and back out onto the track!', 'Fully charged again, off it goes!'],
    // the rivals' characters: a duel with the player, the standing rival, a mistake under pressure
    duel: ['A proper duel with {name} now! Nose to tail, lap after lap.', 'You and {name}, this is a real fight!', 'This battle with {name} is getting intense!'],
    duelRival: ['Here we go again: you and your old rival {name}, wheel to wheel!', 'The rivalry continues! {name} will not give you an inch.', '{name} again! These two just cannot stay away from each other.'],
    duelWon: ['And you have shaken off {name}! Duel won.', 'That is the end of the fight with {name}, and you came out on top!'],
    duelLost: ['{name} has got away from you this time.', 'The duel goes to {name}, for now.'],
    aiMistake: ['{name} has run wide under the pressure!', 'A mistake from {name}! Locked up into the corner!', 'Oh, {name} cracks under pressure and goes wide!'],
    dusk: ['The sun is going down, the shadows are getting long.', 'Evening now, the light is fading over the circuit.'],
    nightFall: ['Night has fallen! Headlights on, the floodlights are blazing.', 'It is dark now, racing under the lights!'],
    rainStop: ['The rain has stopped! The track will start to dry.', 'No more rain! Watch for a dry line appearing.', 'The rain has eased off. A drying track now!'],
    dryLine: ['A dry line is appearing! Those rain tyres are overheating!', 'The racing line is dry now. Time for slicks?', 'Dry line! The rain tyres will not last on this.'],
    drs: ['DRS open down the straight!', 'The rear wing opens, DRS is on!', 'Within a second at the line, DRS for the chase!'],
    secPurple: ['Purple sector!', 'Fastest sector {n} of the race so far!', 'That is a purple sector {n}!', 'Nobody has been quicker through sector {n}!'],
    // qualifying: one flying lap alone, the rivals' times make the grid
    qualiIntro: ['Welcome to {track}! Qualifying first: one flying lap, and your time decides where you start.', 'Here we are at {track} for qualifying. One lap on your own, give it everything!', 'Qualifying at {track}! Just you and the clock for one lap.'],
    qualiGo: ['Build up the speed, the clock starts at the line!', 'Here we go! The lap starts when you cross the line.', 'Out onto the straight, the flying lap begins at the line!'],
    qualiLap: ['The clock is running! Push!', 'Across the line, the flying lap is on!', 'And the lap begins! Every hundredth counts!'],
    qualiEnd: ['Lap complete, {time}! Let us see where that puts you.', 'Across the line in {time}. How does that compare?', '{time} on the clock. Now we wait for the order.'],
    pole: ['Pole position! Nobody was faster!', 'Fastest of all! You start from pole!', 'Pole position! What a lap!'],
    qualiGrid: ['You will start {grid} on the grid.', 'That puts you {grid} on the grid.', 'Starting position: {grid}.'],
    pitWork: ['The crew get to work!', 'Mechanics all over the car!', 'Quick work needed here from the crew!'],
    pitOut: ['Back out, good as new!', 'Great stop from the crew!', 'Repaired and rejoining the race!'],
    propCone: ['Cone down!', 'There goes a cone!', 'Sending the cones flying!'],
    propTyre: ['Straight through the tyres!', 'Tyres flying everywhere!', 'He has scattered the tyre stack!'],
    propBale: ['Right through the hay bales!', 'Straw everywhere!', 'The bales go flying!'],
    propPylon: ['Took the marker post with him!', 'That marker post is history!'],
    propPost: ["He's clipped a marker post!", 'Roadside post down!', 'That post never stood a chance!', 'Flattened a post there!'],
    propCrate: ['Smashed straight into the crate!', 'There goes the crate!'],
    propSignal: ['The traffic light is down!', "He's flattened the traffic signal!", 'That light will be red for a while now!'],
    propStreet: ['Into the street furniture!', 'He has wiped out a bit of the city there!', 'That will need a repair crew!'],
    propBoard: ['Down goes the braking board!', 'He has flattened a distance board!', 'That board will not be telling anyone where to brake now!'],
    // time trial (hill climb against the clock, no opponents): the hill climb is Pikes Peak, so the commentator speaks as its race announcer on the
    // start line (short lines: the welcome, said as the countdown begins, ends before the green flag; the green flag call leaves room for the first place line)
    introTT: ['Welcome to Pikes Peak, the climb to the clouds!', 'Twelve point four miles and a hundred and fifty-six turns to the summit!', 'Welcome to the mountain! Fourteen thousand one hundred and fifteen feet, here we come!'],
    // the same hill climb on its historic gravel road (Pikes Peak (makadam): the Highway as it was until 2011)
    introTTg: ['Welcome to Pikes Peak, the old way! Gravel all the way to the summit, as it was before the road was paved!', 'Up to the clouds on the historic gravel road! Loose granite, ruts and dust, a hundred and fifty-six turns of it!', 'Back to the gravel days on Pikes Peak! No tarmac up here, just dirt, stones and the clock!'],
    goTT: ['Green flag at the start line... the car is away!', 'The green flag drops, and the car is away!', 'Green flag! The car is away, next stop, the clouds!'],
    // the time trial up a mountain pass (Vršič: the hairpins, the clock)
    introPassTT: ['Welcome to {track}! Twenty-four hairpins, most of them cobbled, and just you and the clock.', 'Here we are in Kranjska Gora, at the foot of {track}. {cps} checkpoints between you and the top of the pass.', 'Welcome to {track}! No rivals this time, only the clock. Get to the pass as fast as you can.'],
    goPassTT: ['Green light! The clock is running!', 'Go! Attack the pass!', "And you're away! Up the hairpins!"],
    cpFirst: ['Checkpoint {cp}, {time}.', 'Through checkpoint {cp}. Keep climbing!', 'Checkpoint {cp}. Up we go!'],
    cpFast: ['Checkpoint {cp}, {delta} seconds up on your best!', 'Green split at checkpoint {cp}! {delta} seconds faster!', 'Checkpoint {cp}. You are {delta} seconds ahead of your record pace!'],
    cpEven: ['Checkpoint {cp}, dead level with your best split!', 'Checkpoint {cp}. Right on your record pace, not a hair in it!'],
    cpSlow: ['Checkpoint {cp}, {delta} seconds down on your best.', 'Split {cp}: {delta} seconds slower. Push on!', 'Checkpoint {cp}. Down by {delta}, find that time!'],
    summitRecord: ['At the summit! A new personal best, {time}!', 'Record run! {time} to the top of {track}!', 'What a climb! New personal best, {time}!'],
    summitEven: ['At the summit in {time}. That is your record to the thousandth!', '{time} at the top, dead level with your best!'],
    // Pikes Peak: the TV helicopter (its fly-over after Glen Cove, and the escort to the finish)
    heliFly: ['The TV chopper is overhead!', 'Here comes the helicopter, catching the action!', 'Look up! The TV helicopter sweeps across the road!'],
    // the highlights after the race (Najboljši trenutki in the replay)
    rpStart: ['Here are the highlights! The start, and the whole field goes for turn one.', "Let's look back at the race. Here is the start: everybody wants the inside line!", 'Time for the highlights! Lights out, and into the first corner they go.'],
    rpPass: ['{a} goes past {b}, and that is {pos} place.', 'A great move by {a} on {b}, for {pos}!', 'Watch {a} here, through on {b}!'],
    rpPassMe: ['And here is your move on {b}, up to {pos}!', 'Look at this! You go past {b} for {pos}.'],
    rpPassOnMe: ['{a} gets past you here, into {pos}.', 'Here {a} comes through on you, for {pos}.'],
    rpCrash: ['A big moment for {a}!', 'Ouch! {a} hits hard here.', 'Look at this crash for {a}!'],
    rpCrashMe: ['And here is your big moment. Ouch!', 'Your crash, from the TV cameras. That must have hurt!'],
    rpFinish: ['And {a} takes the chequered flag!', 'The finish, and the win goes to {a}!'],
    rpFinishMe: ['And you take the chequered flag! What a race!', 'Across the line, and the win is yours!'],
    podiumRb: ['{name} on the top step of the podium, and the champagne is flying!', 'The podium ceremony in Spielberg: {name} lifts the cup!', 'Champagne on the podium! {name} is the winner in Styria!'],
    podiumMe: ['You are on the top step! Enjoy the champagne!', 'The cup is yours! What a drive in Spielberg!', 'Champagne for the winner: that is you!'],
    heliRb: ['The TV helicopter sweeps across the main straight!', 'There goes the helicopter over the start and finish straight!', 'The chopper cameras catch you coming down the straight!'],
    heliFin: ['And the helicopter is back, escorting you to the summit!', 'The TV chopper picks you up for the final run to the line!', 'Here comes the helicopter again, the cameras follow you home!'],
    summit: ['At the summit in {time}, {delta} seconds off your best.', 'Across the line at the top. {time}, just {delta} short of the record.', "That's the summit. {time}. {delta} seconds to find next time."],
    // time trial on a rally special stage (Ouninpohja): gravel, crests and jumps, a flying finish
    introStage: ['Welcome to {track}, the most famous stage of the Rally of Finland! Just you, the gravel and the clock.', 'Here we are at the start of {track}. {cps} splits, crest after crest, and nobody to race but the clock.', 'Welcome to {track}! Fast gravel, blind crests and big jumps. Keep it flat!'],
    // the famous jump (def.jumpRec: Ouninpohja's Yellow House, the record of 57 m; by: an invented driver, never a real one)
    jumpRec: ['{m} metres at {place}! The record there is {rec}, by {by}.', 'Over {place}, {m} metres! {by} flew {rec} here.', '{m} metres through the air at {place}!'],
    jumpPB: ['{m} metres at {place}, your longest jump there!', 'A new personal best at {place}, {m} metres!'],
    jumpBeat: ['{m} metres at {place}! Longer than {by}!', "Unbelievable! {m} metres, beyond {by}'s {rec}!"],
    medal: ['That is a {medal} medal time!', 'And that is worth a {medal} medal!', 'A {medal} medal on this stage!'],
    // the city stage (def.cityStage: Harju): tarmac, gravel and cobbles through the town, the whole of Jyvaskyla watching
    introCity: ['Welcome to {track}, the city stage of the Rally of Finland, right in the heart of Jyvaskyla!', 'Here we are at {track}. Tarmac, gravel and cobbles, and the whole town is watching!', 'Welcome to {track}! Up the ridge, round the water tower and back into town. {cps} splits, just you and the clock.'],
    goCity: ['Go! Down the boulevard!', "And you're away! Flat out down the university street!", 'Green light! Listen to that crowd!'],
    goStage: ['Go! Flat out into the forest!', "And you're away! Keep it flat over the crests!", 'Green light! The clock is running!'],
    cpFirstStage: ['Split {cp}, {time}.', 'Through split {cp}. Keep it flat!', 'Split {cp}, {time}. Hold on tight!'],
    stageRecord: ['Flying finish! A new personal best, {time}!', 'Record run through {track}! {time}!', 'What a stage! A new personal best, {time}!'],
    stageEven: ['Through the flying finish in {time}. That is your record to the thousandth!', '{time} at the finish, dead level with your best!'],
    // Pikes Peak: the announcer at the summit finish line (say() swaps the summit* keys for these: the time read out in full, then a new record by how
    // much, the first time on the board, level, or how far off the best)
    pkFinRec: ['Across the line at the summit! The official time, {time}! That is a new record, {delta} seconds faster than the old best!', 'At the top of the mountain in {time}! A new record, ladies and gentlemen, by {delta} seconds!', 'The clock stops at {time}! A brand new record on Pikes Peak, {delta} seconds under the old mark!'],
    pkFinFirst: ['Across the line at the summit! The official time, {time}! That is the record to beat on the mountain!', 'At the top in {time}! The first time on the board, and the new record!', 'The clock stops at {time}! A record at the summit, now go and beat it!'],
    pkFinEven: ['Across the line at the summit! {time}, and that equals the record, to the thousandth!', 'The clock stops at {time}, dead level with the best time on the mountain!'],
    pkFinOff: ['Across the line at the summit! The official time, {time}. That is {delta} seconds off the record.', 'At the top in {time}, {delta} seconds short of the best time on the mountain.', 'The clock stops at {time}. {delta} seconds away from the record.'],
    stageEnd: ['Flying finish in {time}, {delta} seconds off your best.', 'Across the line. {time}, just {delta} short of the record.', "That's the end of the stage. {time}. {delta} seconds to find next time."],
    // time trial down a mountain road (def.descent: Katu-Yaryk, from the Ulagan plateau down the canyon's face to the Chulyshman)
    introDescTT: ['Welcome to {track}! Seven hairpins and over five hundred metres down to the river, just you and the clock.', 'Here we are on the Ulagan plateau, at the top of {track}. {cps} checkpoints between you and the valley floor.', 'Welcome to {track}, the famous descent in the Altai mountains! No rivals, only the clock. Brake early!'],
    goDescTT: ['Green light! Over the edge we go!', "Go! And it's all downhill from here!", "And you're away! Down into the canyon!"],
    cpFirstDesc: ['Checkpoint {cp}, {time}.', 'Through checkpoint {cp}. Keep it on the road!', 'Checkpoint {cp}. Still a long way down!'],
    descRecord: ['Down in the valley! A new personal best, {time}!', 'Record run! {time} down {track}!', 'What a descent! New personal best, {time}!'],
    descEven: ['At the bottom in {time}. That is your record to the thousandth!', '{time} at the finish, dead level with your best!'],
    descEnd: ['Down in the valley in {time}, {delta} seconds off your best.', 'Across the line at the bottom. {time}, just {delta} short of the record.', "That's the descent. {time}. {delta} seconds to find next time."]
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
    voice2 = b2;   // (also the engineer's on the team radio, and the police dispatcher's and the player's driver's)
    if (typeof onVoice === 'function') onVoice(voiceInfo());
  }
  let onVoice = null;
  const voiceInfo = () => ({ name: voice ? voice.name : '', lang: voice ? voice.lang : 'en-GB', male: voiceMale, any: !!synth, codrv: voice2 ? voice2.name : '', rec: typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext) });
  if (synth) { pickVoice(); try { synth.addEventListener('voiceschanged', pickVoice); } catch (_) { synth.onvoiceschanged = pickVoice; } }

  /* the co-driver's recorded voice (docs/sovoznik.md, Glas): his words in one sheet (js/data/sovoznik-en.js, window.SOVOZNIK_EN: an MP3 in
     base64 and each word's [from, to] s in it, made by tools/sovoznik-glas.py), loaded when he is to speak (recLoad: game.js codrvInit, a
     call before it is decoded) and decoded once at its own rate (an offline context: half the memory of the game's 48 kHz). A call (the
     tokens of Track.paceNotes) is read word by word, recGap apart, in the game's audio (Sfx.audio) through a light helmet (150 Hz high-pass,
     +3 dB at 3 kHz), past the duck that lowers the rest under the voice. Not decoded yet, no Web Audio: the browser's English voice reads it */
  const REC = { D: null, buf: null, at: null, ctx: null, out: null, src: [], load: false, dec: false };
  const recGap = (a, b) => a === 'caution' ? 0.17 : /^d\d+$/.test(b) ? 0.13 : 0.06;   // (s: a comma after 'caution', before the distance; the tool's samples the same)
  function recLoad() {
    if (!speech || typeof document === 'undefined') return;
    if (window.SOVOZNIK_EN) { recDecode(); return; }
    if (REC.load) return;
    REC.load = true;
    const tag = document.querySelector('link[data-lazy="sovoznik-en"]'), sc = document.createElement('script');
    sc.src = tag ? tag.getAttribute('href') : 'js/data/sovoznik-en.js';
    sc.onload = recDecode; sc.onerror = () => { REC.load = false; };   // (no sheet: the browser's voice, again at the next race)
    document.head.appendChild(sc);
  }
  function recDecode() {
    const D = window.SOVOZNIK_EN, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!D || REC.buf || REC.dec || !OAC) return;
    REC.dec = true;
    try {
      const bin = atob(D.mp3), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const fail = () => { REC.dec = false; };
      const p = new OAC(1, 1, D.rate).decodeAudioData(u8.buffer, (buf) => { if (!REC.buf) { REC.D = D; REC.buf = buf; REC.at = recTrim(buf, D.clips); } }, fail);   // (old Safari: the callbacks only)
      if (p && p.catch) p.catch(fail);
    } catch (_) { REC.dec = false; }
  }
  // each word's own [offset, length] s in the decoded sheet: its [from, to] widened (a decoder that keeps the MP3's ~50 ms delay) and cut to
  // where it is heard (the first and the last sample over 1/50 of its loudest; 12 ms before, 25 ms after)
  function recTrim(buf, clips) {
    const x = buf.getChannelData(0), sr = buf.sampleRate, at = {};
    for (const k of Object.keys(clips)) {
      const a = Math.max(0, Math.floor((clips[k][0] - 0.03) * sr)), b = Math.min(x.length, Math.ceil((clips[k][1] + 0.08) * sr));
      let pk = 0, i0 = a, i1 = b - 1;
      for (let i = a; i < b; i++) pk = Math.max(pk, Math.abs(x[i]));
      if (!pk) continue;
      while (i0 < i1 && Math.abs(x[i0]) < pk * 0.02) i0++;
      while (i1 > i0 && Math.abs(x[i1]) < pk * 0.02) i1--;
      i0 = Math.max(a, i0 - Math.round(0.012 * sr)); i1 = Math.min(b, i1 + Math.round(0.025 * sr));
      at[k] = [i0 / sr, (i1 - i0) / sr];
    }
    return at;
  }
  const recAudio = () => { const ctx = typeof Sfx !== 'undefined' && Sfx.audio ? Sfx.audio() : null; return ctx && ctx.state === 'running' ? ctx : null; };
  const recCan = (toks) => !!(REC.at && toks && toks.length && toks.every(w => REC.at[w]) && recAudio());
  // how long a call takes (s): its words from the sheet (as decoded, else as the sheet has them), ~0.4 s a word before it is here
  function noteLen(toks) {
    const D = REC.D || (typeof window !== 'undefined' && window.SOVOZNIK_EN) || null;
    let T = 0;
    (toks || []).forEach((w, i) => { if (i) T += recGap(toks[i - 1], w); T += REC.at && REC.at[w] ? REC.at[w][1] : D && D.clips[w] ? D.clips[w][1] - D.clips[w][0] : 0.4; });
    return T;
  }
  // a call read now from the sheet: its length in s (0: it cannot be, the browser's voice then)
  function recPlay(toks) {
    const ctx = recAudio(); if (!ctx || !recCan(toks)) return 0;
    if (!REC.out || REC.ctx !== ctx) {
      const hp = ctx.createBiquadFilter(), pk = ctx.createBiquadFilter(), g = ctx.createGain();
      hp.type = 'highpass'; hp.frequency.value = 150; hp.Q.value = 0.707;
      pk.type = 'peaking'; pk.frequency.value = 3000; pk.Q.value = 1; pk.gain.value = 3;
      g.gain.value = 1; hp.connect(pk); pk.connect(g); g.connect(ctx.destination);
      REC.ctx = ctx; REC.out = hp;
    }
    recStop();
    const t0 = ctx.currentTime + 0.02;
    let t = t0;
    toks.forEach((w, i) => {
      if (i) t += recGap(toks[i - 1], w);
      const s = ctx.createBufferSource(), a = REC.at[w];
      s.buffer = REC.buf; s.connect(REC.out); s.start(t, a[0], a[1]); REC.src.push(s); t += a[1];
    });
    return t - t0 + 0.02;
  }
  function recStop() { for (const s of REC.src) { try { s.stop(); s.disconnect(); } catch (_) { } } REC.src = []; }

  function speakNow(item) {
    const maxT = 2000 + item.text.length * 95;          // safety net if the engine never reports the end
    const me = cur = { prio: item.prio, t: now(), maxT, item }; lastIt = item;
    if (item.toks && speech) {   // the co-driver's call: from the sheet (its end: its length; busy() lets it go)
      const len = recPlay(item.toks);
      if (len) { me.maxT = len * 1000; item.rec = true; speaking = true; item.spoken = true; return; }
    }
    if (!synth || !speech) { speaking = false; return; }
    try {
      const u = new SpeechSynthesisUtterance(item.text), v = item.radio ? item.voice : item.note || item.eng ? voice2 || voice : voice;
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'en-GB'; u.volume = 1;
      if (item.radio) { u.rate = item.rate; u.pitch = item.pitch; }   // (the police radio: each speaker pitched apart)
      else if (item.note) { u.rate = 1.22; u.pitch = voice2 ? 1 : 1.3; }   // the co-driver: brisk (in the commentator's voice, higher)
      else if (item.eng) { u.rate = 1.1; u.pitch = voice2 ? 0.95 : voiceMale ? 1.15 : 0.9; }   // the engineer: clipped (in the commentator's voice, pitched apart)
      else { u.rate = 1.08; u.pitch = voiceMale ? 0.95 : 0.72; }   // deeper tone when no male voice exists
      // only the line that is still current may end it (a cancelled line reports its end/error later, after the next one started)
      u.onend = u.onerror = () => { item.done = true; if (cur !== me) return; speaking = false; lastEnd = now(); cur = null; };
      if (typeof SfxOkolje !== 'undefined') SfxOkolje.hush();   // (the announcer and the shouts by the road give way: js/sfx-okolje.js)
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
    if (!on || !speech || !synth || radioMode) return null;   // audio-only commentary: silent when sound is off (and in the run from the police on Vršič: the radio)
    const kb = key.split('@')[0];   // (a road's own pool: key@track, see game.js ownLine)
    if (kb === 'summitRecord' || kb === 'summitEven' || kb === 'summit') {   // Pikes Peak's finish: its announcer (minutes read out as minutes and seconds); a road's own lines keep theirs
      const t = vars && String(vars.time || ''), m = /^(\d+) minutes? ([\d.]+)$/.exec(t);
      vars = Object.assign({}, vars, { time: m ? m[1] + (m[1] === '1' ? ' minute and ' : ' minutes and ') + m[2] + ' seconds' : t });
      if (kb === key) key = key === 'summitEven' ? 'pkFinEven' : key === 'summit' ? 'pkFinOff' : vars.delta ? 'pkFinRec' : 'pkFinFirst';
    }
    const pool = LINES[key]; if (!pool) return null;
    let k = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && k === lastPick[key]) k = (k + 1) % pool.length;
    lastPick[key] = k;
    let text = pool[k].replace(/\{(\w+)\}/g, (_, n, at, src) => { const v = vars && vars[n] != null ? String(vars[n]) : ''; return /[.!?]\s+$/.test(src.slice(0, at)) ? v.charAt(0).toUpperCase() + v.slice(1) : v; });   // (a value that begins a sentence with a capital: {cars} cars ...)
    text = text.charAt(0).toUpperCase() + text.slice(1);
    const item = { key, text, prio: prio == null ? 1 : prio, t: now() };
    if (opt && opt.ttl > 0) item.ttl = opt.ttl;
    log.push(item); if (log.length > 200) log.shift();
    if (!busy()) { speakNow(item); return item; }
    if (cur && item.prio >= cur.prio + 2) { cancelSpeech(); speakNow(item); return item; }   // urgent news cuts in
    if (!queue || item.prio >= queue.prio) queue = item;                               // keep only the most important pending line
    return item;
  }

  // the co-driver's pace notes (game.js reads them ahead of the car; toks: Track.paceNotes' tokens, the recorded voice reads them, else the
  // browser's voice the text): said at once (0.2 s after his last call: noteFree). The commentator's line is cut off; the co-driver's own call
  // is not: the next one waits in line (before any chatter) and is dropped if it cannot start in 1.5 s
  const NOTE_GAP = 200;
  function note(text, toks) {
    if (!notesOn || !speech || !text || radioMode) return null;
    if (toks && !REC.at) recLoad();   // (the sheet not here yet: the browser's voice this time)
    if (!synth && !recCan(toks)) return null;
    const item = { key: 'note', text, prio: 4, t: now(), note: true, ttl: 1500, toks: toks || null };
    log.push(item); if (log.length > 200) log.shift();
    if (!busy()) { speakNow(item); return item; }
    if (speaking && cur && !cur.item.note) { cancelSpeech(); speakNow(item); return item; }   // (the commentator cut off)
    if (noteFree()) { speakNow(item); return item; }   // (the pause after a line)
    queue = item;
    return item;
  }
  // the co-driver free for his next call (game.js waits for it with the voice on): none of his being read, 0.2 s after his last
  function noteFree() { busy(); return !(speaking && cur && cur.item.note) && !(lastIt && lastIt.note && now() < lastEnd + NOTE_GAP); }
  // his voice can be heard now: the sound on, the co-driver's voice on (setNotes), not the police radio's run; the sheet or the browser's voice
  const noteCan = () => notesOn && speech && !radioMode && (!!synth || !!REC.at);

  // the team's engineer on the radio (game.js teamRadioShow, Nastavitve · Glas inženirja; not the commentator's switch, silent with the sound
  // off): a line of LINES in the co-driver's voice, said at once (the commentator's line is cut off), else next in line for a few seconds.
  // Returns the item (item.spoken once it starts, item.done once said, item.cut if cut off: game.js opens and closes the radio round it), or null
  function teamRadio(key, vars) {
    if (!engOn || !speech || !synth) return null;
    const pool = LINES[key]; if (!pool) return null;
    let k = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && k === lastPick[key]) k = (k + 1) % pool.length;
    lastPick[key] = k;
    const text = pool[k].replace(/\{(\w+)\}/g, (_, n) => (vars && vars[n] != null ? String(vars[n]) : ''));
    const item = { key, text, prio: 3, t: now(), eng: true, ttl: 4000 };
    log.push(item); if (log.length > 200) log.shift();
    if (!busy()) { speakNow(item); return item; }
    if (cur && !cur.item.note && !cur.item.eng) { cancelSpeech(); speakNow(item); return item; }
    queue = item;
    return item;
  }
  // a line of the police radio, said at once (game.js's radio director keeps the lines in turn): o.who 'okc' (the dispatcher), 'u' (a unit;
  // o.u its number: each a little different), 'heli', 'bov' (the station across the pass), in person 'cop' (the officer) and 'drv' (the
  // player's driver); text the line's English twin with the places spelt for an English voice (the captions stay in the page's language),
  // in the commentator's voice (the dispatcher and the driver in the co-driver's). Returns the item (item.done once said, item.cut if cut
  // off), or null: no English voice (captions only). Not the commentator: heard with the sound on even when the commentator is switched off
  function radio(text, o) {
    o = o || {};
    if (!speech || !synth || !text) return null;
    const w = o.who, two = w === 'okc' || w === 'drv', v = two && voice2 ? voice2 : voice;
    if (!v) return null;
    const own = two && !!voice2, low = !voiceMale && !own ? 0.82 : 1;   // (its own voice: hardly pitched; a woman's voice: lower)
    const pitch = low * (own ? (w === 'drv' ? 1.06 : 1) : w === 'okc' ? 1.1 : w === 'drv' ? 1.2 : w === 'cop' ? 0.86 : w === 'heli' ? 0.92 : w === 'bov' ? 1.0 : 0.8 + 0.1 * ((o.u || 0) % 3));
    const rate = w === 'cop' || w === 'drv' ? 1.02 : w === 'okc' ? 1.06 : 1.13;
    cancelSpeech(); queue = null;
    const item = { key: 'radio', text, prio: 9, t: now(), radio: true, voice: v, pitch, rate, who: w, lang: v.lang };
    log.push(item); if (log.length > 200) log.shift();
    speakNow(item);
    return item;
  }
  function radioStop() { if (cur && cur.item && cur.item.radio) cancelSpeech(); }
  // the run from the police: only the radio speaks (say() and note() silent)
  function setRadioMode(v) { radioMode = !!v; if (radioMode) { queue = null; if (cur && cur.item && !cur.item.radio) cancelSpeech(); } }
  const radioVoice = () => voice ? { name: voice.name, lang: voice.lang, two: !!voice2 } : null;   // (tests: the police radio's voice)

  // news from the world: the Pikes Peak TV helicopter shows up (World's dyn.pk.news: { key, n }, each said once)
  let heliSeen = null;
  function heliNews() {
    const w = typeof Render !== 'undefined' && Render.world, pk = w && w.dyn && (w.dyn.pk || w.dyn.air), nw = pk && pk.news;   // (the Red Bull Ring's: dyn.air)
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

  function cancelSpeech() { if (speaking && cur && cur.item) cur.item.cut = true; recStop(); if (synth) { try { synth.cancel(); } catch (_) { } } speaking = false; lastEnd = 0; cur = null; }
  function stop() { cancelSpeech(); queue = null; }
  // call from a tap handler: some browsers only allow speech after a user gesture
  function unlock() { if (!synth || !speech) return; try {   // (also with the commentator off: the police radio speaks then, and iOS wants the first line from a tap)
    const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (_) { } }
  // Preizkusi glas: the commentator; k 'eng': the engineer (Glas inženirja)
  function test(k) { cancelSpeech(); queue = null; speakNow(k === 'eng' ? { key: 'test', text: 'Radio check. Box this lap, box this lap.', prio: 9, t: now(), eng: true } : { key: 'test', text: "Hello and welcome! I'm your commentator for today's race.", prio: 9, t: now() }); }
  function setOnVoice(fn) { onVoice = fn; fn(voiceInfo()); }
  // the commentator switched off: its own lines silent (not the co-driver's, the engineer's, the police radio's)
  const ownLine = (it) => !!it && !it.note && !it.eng && !it.radio;
  function setEnabled(v) { on = !!v; if (!on) { if (ownLine(queue)) queue = null; if (cur && ownLine(cur.item)) cancelSpeech(); } }
  function setSpeech(v) { speech = !!v; if (!speech) cancelSpeech(); }
  function setNotes(v) { notesOn = !!v; if (!notesOn && cur && cur.item.note) cancelSpeech(); }
  function setEngineer(v) { engOn = !!v; if (!engOn) { if (queue && queue.eng) queue = null; if (cur && cur.item.eng) cancelSpeech(); } }
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
  // the commentator (the co-driver, the engineer) speaking or in the pause after a line: the game lowers its other sounds under the voice
  // (Sfx.setDuck; the browser's speech cannot be louder than full volume). Not the police radio: its static and its voices go together
  let lastIt = null;   // (the line spoken last: its pause after it counts too, so the duck holds between two lines)
  function talking() { const it = cur ? cur.item : lastIt; return !radioMode && busy() && !!(it && !it.radio); }

  return { say, note, noteFree, noteCan, noteLen, recLoad, get recReady() { return !!REC.at; }, teamRadio, update, stop, unlock, setEnabled, setSpeech, setNotes, setEngineer, ordinal, words, available, log, test, voiceInfo, setOnVoice, addLines, state, talking, radio, radioStop, setRadioMode, radioVoice, get radioMode() { return radioMode; } };
})();
if (typeof module !== 'undefined') module.exports = Comm;

