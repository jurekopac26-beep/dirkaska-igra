/* =========================================================================
   MENU MOCKUP DATA
   Every text, price, number and percentage of the mockup is here, so the
   menu can be changed without touching the layout (style.css) or the logic
   (app.js). All times, money and progress are examples.
   ========================================================================= */
window.MENU = {
  game: { l1: 'APEX', l2: 'RACING', price: '€3.99', currency: 'CR' },

  /* ---------- main menu: three big buttons with a picture, two small ones, the purchase ---------- */
  menu: {
    single: { title: 'SINGLE RACE', sub: 'Today: {track} · {weather}' },
    multi: { title: 'MULTIPLAYER', sub: 'Race friends online', img: 'assets/menu/multiplayer.webp' },
    career: { title: 'CAREER', img: 'assets/menu/career.webp' },
    settings: 'Settings', board: 'Leaderboard',
    buy: 'Full Game', buySub: '+8 tracks · +4 cars · the whole career · unlimited daily races', owned: 'Full game',
  },

  /* ---------- single race, step 1: the mode (step 2: the track) ---------- */
  modes: [
    { id: 'race', name: 'Circuit race', sub: 'Laps against 12 rivals. Finish as high as you can.', chip: '12 RIVALS', img: 'assets/menu/mode-race.webp' },
    { id: 'chase', name: 'Police chase', sub: 'The police are on your tail. Shake them off.', chip: 'GET AWAY IN 3:00', img: 'assets/menu/mode-chase.webp' },
    { id: 'trial', name: 'Time trial', sub: 'Alone against the clock and your own ghost.', chip: 'GOLD · SILVER · BRONZE', img: 'assets/menu/mode-trial.webp' },
  ],
  chase: { police: 4, limit: '3:00', reward: [1500, 1000, 600, 150] },   // police cars, the time to get away, CR for 3, 2, 1 stars and for being caught

  /* ---------- today's race: first in Single race, a new one every day at midnight ----------
     The track, car and weather are picked from these lists by the date. Everyone drives the same car, so the
     world ranking of the day is fair. The free version gets one run a day. It is in the list of its own mode:
     a circuit race, or a time trial on a hill climb or rally stage. */
  daily: {
    tracks: ['rbring', 'jezero', 'monaco', 'gora', 'suzuka', 'riviera', 'spa', 'ljubljana', 'ouninpohja', 'nring', 'pikes'],
    cars: ['kaze', 'rally', 'strega', 'pico', 'vortex', 'formula'],
    weather: ['Dry', 'Rain', 'Dry', 'Dry', 'Rain', 'Dry', 'Random'],
    playersBase: 9000, playersRange: 8000,   // example: how many played it today (grows during the day)
    freeRuns: 1,
    reward: 2000,                            // CR for 1st place (less for the other places, see prizes)
  },

  /* ---------- race results ---------- */
  prizes: [1, 0.6, 0.45, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1, 0.08, 0.06, 0.05, 0.04],   // share of the winner's reward by finishing place (1st..13th)
  singleReward: 800,                                                                  // CR for winning a single race
  multiReward: [500, 200],                                                            // CR for winning / losing a duel
  friendName: 'Ana',

  /* ---------- cars: the 3D model is assets/cars/<model>.json, the small pictures assets/cars/img/<model>-<paint>.webp;
     color = the paint the car has in today's race (an index in colors) ---------- */
  colors: [
    { name: 'Red', hex: '#d81f2a' }, { name: 'White', hex: '#f5f5f0' }, { name: 'Blue', hex: '#1c5fd6' }, { name: 'Yellow', hex: '#f2c230' },
    { name: 'Black', hex: '#1a1a1f' }, { name: 'Green', hex: '#2fa84f' }, { name: 'Orange', hex: '#ff7a1a' }, { name: 'Purple', hex: '#8e3bd6' },
  ],
  cars: [
    { id: 'pico', model: 'pico', color: 2, name: 'PICO TURBO', tag: 'FWD', desc: 'Light front-wheel-drive hatchback. Easy to drive and quick through tight corners.',
      hp: 291, kg: 1040, drive: 'FWD', gears: 6, stats: { power: 8, grip: 12, light: 14, drift: 7 }, free: true },
    { id: 'kaze', model: 'kaze', color: 0, name: 'KAZE RS', tag: 'RWD', desc: 'Rear-wheel-drive coupé, born to drift. Loves long, open corners.',
      hp: 356, kg: 1240, drive: 'RWD', gears: 6, stats: { power: 11, grip: 10, light: 10, drift: 15 }, free: true },
    { id: 'rally', model: 'rally', color: 0, name: 'BURJA R7', tag: 'AWD', desc: 'An 80s rally car with all-wheel drive and huge power. At home on gravel and in the air.',
      hp: 394, kg: 1150, drive: 'AWD', gears: 6, stats: { power: 13, grip: 13, light: 12, drift: 14 }, free: true },
    { id: 'vortex', model: 'vortex', color: 5, name: 'VORTEX 4WD', tag: 'AWD', desc: 'All-wheel-drive saloon, stable and fast in every weather.',
      hp: 404, kg: 1400, drive: 'AWD', gears: 6, stats: { power: 13, grip: 13, light: 7, drift: 9 } },
    { id: 'strega', model: 'strega', color: 6, name: 'STREGA MR', tag: 'MID', desc: 'Mid-engined and sharp. Turns in instantly, punishes a lazy exit.',
      hp: 385, kg: 1180, drive: 'MID', gears: 6, stats: { power: 12, grip: 13, light: 11, drift: 12 } },
    { id: 'vihra', model: 'pico', color: 3, name: 'VIHRA S', tag: 'FWD', desc: 'Front-wheel-drive hot hatch with a rear wing. Still in the workshop.',
      hp: 340, kg: 1080, drive: 'FWD', gears: 6, stats: { power: 11, grip: 13, light: 13, drift: 9 }, soon: true },
    { id: 'formula', model: 'formula', color: 3, name: 'FORMULA ORKAN', tag: 'OPEN', desc: 'Open-wheel formula car with front and rear wings. Brutal grip, no forgiveness.',
      hp: 1000, kg: 798, drive: 'RWD', gears: 8, stats: { power: 16, grip: 16, light: 16, drift: 5 } },
  ],

  /* ---------- tracks (hero image: assets/tracks/<id>.webp). A real place shows as "name, country".
     group: the tab of the track list: circuit, road (an open road through places) or rally ---------- */
  groups: [{ id: 'circuit', name: 'Circuits' }, { id: 'road', name: 'Open roads' }, { id: 'rally', name: 'Rally' }],
  tracks: [
    { id: 'jezero', group: 'circuit', name: 'Jezero Ring', tag: 'CIRCUIT', desc: 'A lakeside circuit with an island church, forest and grandstands. Fast and flowing.',
      km: 1.77, corners: 11, laps: 3, rec: ['M. Kovač', '0:51.84'], bars: { speed: 12, tech: 8, drift: 11, grip: 12 }, free: true },
    { id: 'riviera', group: 'circuit', name: 'Riviera', tag: 'STREET', desc: 'A seaside street circuit past palms and the promenade. Short and technical, full of hairpins.',
      km: 1.26, corners: 9, laps: 4, rec: ['J. Novak', '0:39.20'], bars: { speed: 8, tech: 13, drift: 12, grip: 11 }, free: true },
    { id: 'gora', group: 'rally', name: 'Mountain Rally', tag: 'GRAVEL', desc: 'Gravel climbs and descents with jumps over the crests, between forest and rocks.',
      km: 1.64, corners: 6, laps: 2, rec: ['R. Horvat', '0:58.30'], bars: { speed: 10, tech: 10, drift: 15, grip: 6 }, free: true },
    { id: 'ljubljana', group: 'circuit', country: 'Slovenia', name: 'Ljubljana', tag: 'SLOVENIA', desc: 'A city circuit along the river: bridges, the market and the old town, with the castle above.',
      km: 1.87, corners: 7, laps: 3, rec: ['N. Petek', '0:55.12'], bars: { speed: 9, tech: 12, drift: 11, grip: 12 } },
    { id: 'monaco', group: 'circuit', country: 'Monaco', name: 'La Condamine', tag: 'MONACO', desc: 'A harbour street circuit: up the hill, round a tight hairpin, through the tunnel and along the water.',
      km: 3.34, corners: 9, laps: 2, rec: ['D. Zupan', '1:34.60'], bars: { speed: 9, tech: 15, drift: 8, grip: 13 } },
    { id: 'rbring', group: 'circuit', country: 'Austria', name: 'Styria', tag: 'AUSTRIA', desc: 'Short and fast in the green hills: a steep climb to the top hairpin and long runs back down.',
      km: 4.31, corners: 10, laps: 2, rec: ['B. Kranjc', '1:31.90'], bars: { speed: 14, tech: 9, drift: 9, grip: 13 } },
    { id: 'suzuka', group: 'circuit', country: 'Japan', name: 'Mie', tag: 'JAPAN', desc: 'A figure-of-eight circuit: uphill esses, a hairpin, fast sweepers and a last chicane.',
      km: 5.80, corners: 17, laps: 2, rec: ['H. Kimura', '2:02.10'], bars: { speed: 13, tech: 14, drift: 10, grip: 13 } },
    { id: 'spa', group: 'circuit', country: 'Belgium', name: 'Ardennes', tag: 'BELGIUM', desc: 'Seven kilometres through the forests: a steep climb after the first corner, long straights and fast sweepers.',
      km: 7.00, corners: 13, laps: 2, rec: ['P. Dubois', '2:31.40'], bars: { speed: 15, tech: 11, drift: 9, grip: 12 } },
    { id: 'nring', group: 'circuit', country: 'Germany', name: 'Eifel', tag: 'GERMANY', desc: 'One lap of almost 21 km through the forest: crests, jumps, banked corners and 300 m of climbing.',
      km: 20.69, corners: 48, laps: 1, rec: ['E. Lindqvist', '7:58.30'], bars: { speed: 14, tech: 16, drift: 11, grip: 12 } },
    { id: 'vrsic', group: 'road', country: 'Slovenia', name: 'Vršič', tag: 'SLOVENIA', desc: 'The road over the pass from Kranjska Gora: past Lake Jasna, through the autumn larches and up 24 cobbled hairpins to 1,611 m.',
      km: 12.30, corners: 24, laps: 1, rec: ['A. Koren', '6:21.80'], bars: { speed: 11, tech: 15, drift: 12, grip: 10 } },
    { id: 'pikes', group: 'road', country: 'USA', name: 'Colorado', tag: 'USA', desc: 'A hill climb against the clock, from 2,862 m to the summit at 4,301 m. Hairpins, forest and snow at the top.',
      km: 6.26, corners: 36, laps: 1, trial: true, rec: ['O. Nieminen', '5:12.40'], bars: { speed: 11, tech: 15, drift: 12, grip: 9 } },
    { id: 'ouninpohja', group: 'rally', country: 'Finland', name: 'Ouninpohja', tag: 'FINLAND', desc: 'A gravel special stage against the clock: crest after crest, big jumps and a long lakeside right.',
      km: 10.02, corners: 19, laps: 1, trial: true, rec: ['T. Hayashi', '4:48.90'], bars: { speed: 16, tech: 12, drift: 13, grip: 7 } },
  ],

  /* ---------- the maps of the tracks (routes.js has the lines, heights and corners, made from the game's worlds) ----------
     start / finish: the names on the map; alt: the real height at the start and at the finish (m), else base: the height at the start
     (about the real one; the rest follows the world's rise and fall); stage, surface: a rally stage; hud: the places along the run
     ([metres from the start, name]: the corner of the flyover shows the one the point has reached; without it, the game's own names) */
  routeMaps: {
    vrsic: { start: 'Kranjska Gora', finish: 'Vršič', alt: [810, 1611],
      hud: [[0, 'Kranjska Gora'], [1700, 'Jasna'], [3006, 'Eriški most'], [6480, 'Mihov dom'], [7000, 'Ruska kapelica'], [8230, 'Koča na Gozdu'], [11200, 'Erjavčeva koča'], [12150, 'Vršič']] },
    pikes: { start: 'Crystal Reservoir', finish: 'Summit', alt: [2862, 4301],
      hud: [[0, 'Crystal Reservoir'], [960, 'Halfway Picnic Grounds'], [1964, 'Ski Area'], [2650, 'Glen Cove'], [4000, "Devil's Playground"], [4440, 'Bottomless Pit'], [5900, 'Summit']] },
    ouninpohja: { start: 'Hämepohja', finish: 'Flying finish', stage: 'SS 4', surface: 'Gravel', base: 130,
      hud: [[0, 'Hämepohja'], [800, 'Naarajärvi'], [1640, 'Ouni'], [2170, 'Keltainen talo'], [2980, 'Mutanen'], [4400, 'Forest crests'], [6040, 'Village'], [7980, 'Amazon'], [8700, 'Kakaristo'], [9550, 'Flying finish']] },
    gora: { start: 'Start', finish: 'Finish', stage: 'SS 1', surface: 'Gravel', base: 640,
      hud: [[0, 'Stage start'], [545, 'Split 1'], [1090, 'Split 2'], [1590, 'Stage finish']] },
    jezero: { base: 475 }, riviera: { base: 4 }, ljubljana: { base: 295 }, monaco: { base: 8 },
    rbring: { base: 677 }, suzuka: { base: 45 }, spa: { base: 400 }, nring: { base: 616 },
  },
  // the two ways to show them, to choose from (the switch over the map)
  mapVersions: [{ n: 1, name: 'Flyover' }, { n: 2, name: 'Map' }],

  /* ---------- before every race: the drone's shots of the track and the commentator ----------
     One line per shot, in the order of the shots (the place of each shot shows in its corner). A line is the words on the screen, or
     [the words on the screen, the same words spelt so an English voice says the names right]. The voice is the phone's own; the
     Sound and Commentary settings switch it off (the words stay). */
  intro: {
    vrsic: [
      ['Welcome to Kranjska Gora. From here the road climbs 800 metres, over the Julian Alps.', 'Welcome to Kranyska Gora. From here the road climbs eight hundred metres, over the Julian Alps.'],
      ['Lake Jasna, and the Goldhorn: the white chamois with golden horns from the old legend.', 'Lake Yasna, and the Goldhorn: the white chamois with golden horns, from the old legend.'],
      'Twenty-four cobbled hairpins to the top, each one numbered, with its height on the sign.',
      ['Prisoners of war built this road in 1915. Their little Russian chapel is just above.', 'Prisoners of war built this road in nineteen fifteen. Their little Russian chapel is just above.'],
      ['Vršič, 1,611 metres: the highest road pass in Slovenia. Over to you.', 'Vrshich, sixteen hundred and eleven metres: the highest road pass in Slovenia. Over to you.'],
    ],
    pikes: [
      ['Colorado. From Crystal Reservoir the road climbs almost 1,500 metres to the summit.', 'Colorado. From Crystal Reservoir, the road climbs almost fifteen hundred metres to the summit.'],
      ["The W's: hairpin stacked on hairpin. Cars have raced up this mountain since 1916.", 'The double-yous: hairpin stacked on hairpin. Cars have raced up this mountain since nineteen sixteen.'],
      "Devil's Playground: in a storm, lightning jumps from rock to rock up here.",
      ['The summit, 4,301 metres. This view inspired the song America the Beautiful.', 'The summit, four thousand three hundred and one metres. This view inspired the song, America the Beautiful.'],
    ],
    ouninpohja: [
      ['Ouninpohja, the most famous stage of the Finnish rally, along Lake Naarajärvi.', 'Ounin-pohya, the most famous stage of the Finnish rally, along Lake Naara-yarvi.'],
      ['The Yellow House jump. In 2003 a rally car flew 57 metres here.', 'The Yellow House jump. In two thousand and three, a rally car flew fifty-seven metres here.'],
      "Crest after crest through the spruce forest. You can't see the road: trust your notes.",
      'Kakaristo: the biggest crowd of the stage. Then flat out to the flying finish.',
    ],
    gora: [
      'Mountain Rally, stage one: gravel, forest and rock, up the hill and down again.',
      'The first split. Over the crests the car takes off: land it straight.',
      'The second split. Downhill now, and the rocks punish a wide line.',
    ],
    jezero: [
      'Jezero Ring: the lake, the island with its little church, and eleven corners.',
      'Turn three, long and fast. Carry the speed through it, the trees are close.',
      'Along the lake. Ring the island church bell, they say, and your wish comes true.',
    ],
    riviera: [
      'The Riviera: palms, the sea, and a street circuit just over a kilometre long.',
      'The promenade: café tables, palm trees and the sea, a metre from the barrier.',
      'The hairpin: full lock and patience. There are two of them on every lap.',
    ],
    ljubljana: [
      ['Ljubljana, the capital of Slovenia. The race starts along the river, past the market.', 'Lyublyana, the capital of Slovenia. The race starts along the river, past the market.'],
      'The old square, under the castle. The Romans built a town here two thousand years ago.',
      "The square by the bridges. Look out for dragons: the dragon is the city's symbol.",
    ],
    monaco: [
      'Casino Square. Monte Carlo means Mount Charles, after the prince who opened the casino.',
      ['The Fairmont hairpin: the slowest corner in racing, about 50 kilometres an hour.', 'The Fairmont hairpin: the slowest corner in racing, about fifty kilometres an hour.'],
      'Into the tunnel under the hotel: dark, then blinding sunlight, at full speed.',
      "Round the swimming pool. The whole country is smaller than New York's Central Park.",
    ],
    rbring: [
      'Styria, the green heart of Austria. After turn one the road climbs at twelve percent.',
      'Turn three: the top of the hill and the slowest corner. The best place to pass.',
      'Turn nine, fast and downhill. Only ten corners on this lap, so every one counts.',
    ],
    suzuka: [
      ['Mie, Japan: a figure of eight. The track crosses over itself on a bridge.', 'Mee-eh, Japan: a figure of eight. The track crosses over itself on a bridge.'],
      ['The hairpin. The circuit opened in 1962, as a test track for new cars.', 'The hairpin. The circuit opened in nineteen sixty-two, as a test track for new cars.'],
      'Spoon: a long double left, named for its shape.',
      ['130R, named for its radius: 130 metres. Flat out, if you dare.', 'One-thirty R, named for its radius, a hundred and thirty metres. Flat out, if you dare.'],
    ],
    spa: [
      'The Belgian Ardennes. Nearby Spa gave its name to every spa in the world.',
      'Eau Rouge: red water, from the iron in the stream that runs under the track.',
      ['Pouhon, the fast double left. In the local dialect, a pouhon is an iron-rich spring.', 'Poo-on, the fast double left. In the local dialect, a poo-on is an iron-rich spring.'],
      ['Blanchimont: one of the fastest corners anywhere, over 300 kilometres an hour.', 'Blanchimont: one of the fastest corners anywhere, over three hundred kilometres an hour.'],
    ],
    nring: [
      ['The Green Hell: almost 21 kilometres through the Eifel forest. Flugplatz means airfield.', 'The Green Hell: almost twenty-one kilometres through the Eifel forest. Flugplatz means airfield.'],
      'Adenauer Forst, named after the nearby town of Adenau: a tight chicane in the trees.',
      'The Karussell: a banked concrete hairpin. Drop the inside wheels in and hold on.',
      ['Pflanzgarten: a jump, then hard on the brakes. This track opened in 1927.', 'Pflanzgarten: a jump, then hard on the brakes. This track opened in nineteen twenty-seven.'],
    ],
  },

  /* ---------- the career: four ways to play it (the Career button opens them in the main menu's frame) ---------- */
  career: {
    cup: {
      name: 'World Cup', sub: 'Rounds of circuits. The points add up.', chip: 'TOP 3 GO THROUGH', img: 'assets/menu/mode-race.webp',
      points: [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], through: 3,   // points for 1st..10th; the top 3 of a round's standings go through
      rounds: [
        { name: 'Round 1', races: ['jezero', 'riviera', 'ljubljana', 'monaco'], reward: '10,000 CR' },
        { name: 'Round 2', races: ['rbring', 'suzuka', 'spa', 'nring', 'monaco', 'ljubljana'], reward: '25,000 CR' },
        { name: 'Final', races: ['jezero', 'riviera', 'ljubljana', 'monaco', 'rbring', 'suzuka', 'spa', 'nring'], reward: 'World Cup trophy + 60,000 CR' },
      ],
      rivals: ['M. Kovač', 'T. Hayashi', 'J. Novak', 'K. Weber', 'A. Silva', 'R. Horvat', 'S. Tanaka', 'N. Petek', 'E. Lindqvist', 'D. Zupan', 'H. Kimura', 'O. Nieminen'],
    },
    chase: {
      name: 'Police chase', sub: 'Escape the police, catch the criminal, outrun the mafia.', chip: '8 MISSIONS', img: 'assets/menu/mode-chase.webp',
      // run: get away from them (a mission done opens the next one); catch: you drive the police car. The first three are on the free tracks
      missions: [
        { role: 'run', foe: 'police', title: 'Escape the police', track: 'riviera', brief: 'A tip-off went wrong. Lose the patrol cars along the seafront.' },
        { role: 'catch', foe: 'robber', title: 'Catch the robber', track: 'jezero', brief: 'You drive the police car now. Stop the getaway car before it reaches the forest.' },
        { role: 'run', foe: 'mafia', title: 'Escape the mafia', track: 'gora', brief: 'You won a race the mafia had bet against. They want their money back.' },
        { role: 'run', foe: 'police', title: 'Run for the pass', track: 'vrsic', brief: 'Roadblocks at Kranjska Gora. Get over the pass through the traffic.' },
        { role: 'catch', foe: 'smugglers', title: 'Catch the smugglers', track: 'ouninpohja', brief: 'A smugglers\' car on the forest roads. Cut it off before the border.' },
        { role: 'run', foe: 'army', title: 'Escape the army', track: 'pikes', brief: 'You drove into a military test area. Get out before the gates close.' },
        { role: 'catch', foe: 'thief', title: 'Catch the car thief', track: 'ljubljana', brief: 'A stolen sports car is loose in the old town. Bring it back in one piece.' },
        { role: 'run', foe: 'all', title: 'Everyone after you', track: 'nring', brief: 'The police, the mafia and the army, all at once. The last run.' },
      ],
    },
    trial: {
      name: 'Time trial', sub: 'Take your time, then make it count.', chip: 'GOLD · SILVER · BRONZE', img: 'assets/menu/mode-trial.webp',
      tracks: ['jezero', 'riviera', 'gora', 'ljubljana', 'monaco', 'rbring', 'ouninpohja', 'suzuka', 'spa', 'pikes', 'vrsic', 'nring'],   // bronze opens the next one
    },
    rally: {
      name: 'Rally & hill climb', sub: 'Stage after stage. The times add up.', chip: '4 STAGES', img: 'assets/cars/img/rally-2.webp',
      stages: [{ track: 'gora', name: 'SS 1' }, { track: 'ouninpohja', name: 'SS 2' }, { track: 'pikes', name: 'SS 3 · hill climb' }, { track: 'vrsic', name: 'SS 4 · hill climb' }],
      rivals: ['O. Nieminen', 'E. Lindqvist', 'K. Weber', 'R. Horvat', 'A. Silva'],
    },
  },

  /* ---------- the three states of the mockup ---------- */
  states: {
    free: {
      label: 'Free', player: 'Player', money: 10000, owned: false,
      car: 0, color: 2, track: 1,
      career: {},
      upgrades: {},
      myRecords: {},
    },
    full: {
      label: 'Full game', player: 'Player', money: 10000, owned: true,
      car: 0, color: 2, track: 1,
      career: {},
      upgrades: {},
      myRecords: {},
    },
    veteran: {
      label: 'Veteran', player: 'Luka', money: 58400, owned: true, titles: 2,
      car: 2, color: 0, track: 1,
      // the career so far: World Cup round 1 done (through to round 2, two races of it raced), four chase missions, nine medals, two rally stages
      career: { cup: { round: 1, res: [2, 4], rounds: [2] }, chase: { stars: [3, 2, 3, 1] }, trial: { medals: { jezero: 'gold', riviera: 'gold', gora: 'silver', ljubljana: 'silver', monaco: 'bronze', rbring: 'gold', ouninpohja: 'silver', suzuka: 'bronze', spa: 'bronze' } }, rally: { res: [2, 1] } },
      upgrades: { rally: [2, 3, 2, 1], kaze: [1, 1, 1, 0] },
      myRecords: { jezero: '0:50.97', riviera: '0:38.84', gora: '0:57.02', ljubljana: '0:54.40', monaco: '1:33.95', rbring: '1:31.42', pikes: '5:09.88', ouninpohja: '4:51.30' },
    },
  },

  /* ---------- other screens ---------- */
  leaderboardNames: ['M. Kovač', 'T. Hayashi', 'J. Novak', 'K. Weber', 'A. Silva', 'R. Horvat', 'S. Tanaka', 'N. Petek', 'E. Lindqvist', 'D. Zupan', 'H. Kimura', 'O. Nieminen'],
  settings: [
    { id: 'sound', label: 'Sound', opts: ['On', 'Off'], sel: 0 },
    { id: 'comm', label: 'Commentary', opts: ['On', 'Off'], sel: 0 },
    { id: 'control', label: 'Controls', opts: ['Buttons', 'Tilt', 'Wheel'], sel: 0 },
    { id: 'camera', label: 'Camera', opts: ['Chase', 'Isometric', 'TV'], sel: 0 },
    { id: 'diff', label: 'Difficulty', opts: ['Easy', 'Normal', 'Hard', 'Pro'], sel: 1 },
    { id: 'gfx', label: 'Graphics', opts: ['Low', 'Medium', 'High'], sel: 2 },
    { id: 'lang', label: 'Language', opts: ['English', 'Slovenščina'], sel: 0 },
  ],
  offer: {
    title: 'FULL GAME', lead: 'One purchase unlocks everything. No ads, no subscription.',
    items: ['All 12 tracks (9 more)', 'All cars (4 more)', 'The whole career: World Cup, chases, time trials, rally', 'Unlimited runs in today\'s race', 'Race a friend on every track'],
  },
};
