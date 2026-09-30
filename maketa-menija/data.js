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

  /* ---------- today's race: first in Single race, a new one every day at midnight ----------
     The track, car and weather are picked from these lists by the date. Everyone drives the same car, so the
     world ranking of the day is fair. The free version gets one run a day. */
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
  trophyPlaces: { gold: 1, silver: 3, bronze: 5 },                                    // career: gold for a win, silver for the podium, bronze for the top 5
  singleReward: 800,                                                                  // CR for winning a single race
  multiReward: [500, 200],                                                            // CR for winning / losing a duel
  friendName: 'Ana',

  /* ---------- cars (the 3D model file is assets/cars/<model>.json) ---------- */
  colors: [
    { name: 'Red', hex: '#d81f2a' }, { name: 'White', hex: '#f5f5f0' }, { name: 'Blue', hex: '#1c5fd6' }, { name: 'Yellow', hex: '#f2c230' },
    { name: 'Black', hex: '#1a1a1f' }, { name: 'Green', hex: '#2fa84f' }, { name: 'Orange', hex: '#ff7a1a' }, { name: 'Purple', hex: '#8e3bd6' },
  ],
  cars: [
    { id: 'pico', model: 'pico', name: 'PICO TURBO', tag: 'FWD', desc: 'Light front-wheel-drive hatchback. Easy to drive and quick through tight corners.',
      hp: 291, kg: 1040, drive: 'FWD', gears: 6, stats: { power: 8, grip: 12, light: 14, drift: 7 }, free: true },
    { id: 'kaze', model: 'kaze', name: 'KAZE RS', tag: 'RWD', desc: 'Rear-wheel-drive coupé, born to drift. Loves long, open corners.',
      hp: 356, kg: 1240, drive: 'RWD', gears: 6, stats: { power: 11, grip: 10, light: 10, drift: 15 }, free: true },
    { id: 'rally', model: 'rally', name: 'BURJA R7', tag: 'AWD', desc: 'An 80s rally car with all-wheel drive and huge power. At home on gravel and in the air.',
      hp: 394, kg: 1150, drive: 'AWD', gears: 6, stats: { power: 13, grip: 13, light: 12, drift: 14 }, free: true },
    { id: 'vortex', model: 'vortex', name: 'VORTEX 4WD', tag: 'AWD', desc: 'All-wheel-drive saloon, stable and fast in every weather.',
      hp: 404, kg: 1400, drive: 'AWD', gears: 6, stats: { power: 13, grip: 13, light: 7, drift: 9 } },
    { id: 'strega', model: 'strega', name: 'STREGA MR', tag: 'MID', desc: 'Mid-engined and sharp. Turns in instantly, punishes a lazy exit.',
      hp: 385, kg: 1180, drive: 'MID', gears: 6, stats: { power: 12, grip: 13, light: 11, drift: 12 } },
    { id: 'vihra', model: 'pico', name: 'VIHRA S', tag: 'FWD', desc: 'Front-wheel-drive hot hatch with a rear wing. Still in the workshop.',
      hp: 340, kg: 1080, drive: 'FWD', gears: 6, stats: { power: 11, grip: 13, light: 13, drift: 9 }, soon: true },
    { id: 'formula', model: 'formula', name: 'FORMULA ORKAN', tag: 'OPEN', desc: 'Open-wheel formula car with front and rear wings. Brutal grip, no forgiveness.',
      hp: 1000, kg: 798, drive: 'RWD', gears: 8, stats: { power: 16, grip: 16, light: 16, drift: 5 } },
  ],

  /* ---------- tracks (hero image: assets/tracks/<id>.webp). A real place shows as "name, country". ---------- */
  tracks: [
    { id: 'jezero', name: 'Jezero Ring', tag: 'CIRCUIT', desc: 'A lakeside circuit with an island church, forest and grandstands. Fast and flowing.',
      km: 1.77, corners: 11, laps: 3, rec: ['M. Kovač', '0:51.84'], bars: { speed: 12, tech: 8, drift: 11, grip: 12 }, free: true },
    { id: 'riviera', name: 'Riviera', tag: 'STREET', desc: 'A seaside street circuit past palms and the promenade. Short and technical, full of hairpins.',
      km: 1.26, corners: 9, laps: 4, rec: ['J. Novak', '0:39.20'], bars: { speed: 8, tech: 13, drift: 12, grip: 11 }, free: true },
    { id: 'gora', name: 'Mountain Rally', tag: 'GRAVEL', desc: 'Gravel climbs and descents with jumps over the crests, between forest and rocks.',
      km: 1.64, corners: 6, laps: 2, rec: ['R. Horvat', '0:58.30'], bars: { speed: 10, tech: 10, drift: 15, grip: 6 }, free: true },
    { id: 'ljubljana', country: 'Slovenia', name: 'Ljubljana', tag: 'SLOVENIA', desc: 'A city circuit along the river: bridges, the market and the old town, with the castle above.',
      km: 1.87, corners: 7, laps: 3, rec: ['N. Petek', '0:55.12'], bars: { speed: 9, tech: 12, drift: 11, grip: 12 } },
    { id: 'monaco', country: 'Monaco', name: 'La Condamine', tag: 'MONACO', desc: 'A harbour street circuit: up the hill, round a tight hairpin, through the tunnel and along the water.',
      km: 3.34, corners: 9, laps: 2, rec: ['D. Zupan', '1:34.60'], bars: { speed: 9, tech: 15, drift: 8, grip: 13 } },
    { id: 'rbring', country: 'Austria', name: 'Styria', tag: 'AUSTRIA', desc: 'Short and fast in the green hills: a steep climb to the top hairpin and long runs back down.',
      km: 4.31, corners: 10, laps: 2, rec: ['B. Kranjc', '1:31.90'], bars: { speed: 14, tech: 9, drift: 9, grip: 13 } },
    { id: 'suzuka', country: 'Japan', name: 'Mie', tag: 'JAPAN', desc: 'A figure-of-eight circuit: uphill esses, a hairpin, fast sweepers and a last chicane.',
      km: 5.80, corners: 17, laps: 2, rec: ['H. Kimura', '2:02.10'], bars: { speed: 13, tech: 14, drift: 10, grip: 13 } },
    { id: 'spa', country: 'Belgium', name: 'Ardennes', tag: 'BELGIUM', desc: 'Seven kilometres through the forests: a steep climb after the first corner, long straights and fast sweepers.',
      km: 7.00, corners: 13, laps: 2, rec: ['P. Dubois', '2:31.40'], bars: { speed: 15, tech: 11, drift: 9, grip: 12 } },
    { id: 'nring', country: 'Germany', name: 'Eifel', tag: 'GERMANY', desc: 'One lap of almost 21 km through the forest: crests, jumps, banked corners and 300 m of climbing.',
      km: 20.69, corners: 48, laps: 1, rec: ['E. Lindqvist', '7:58.30'], bars: { speed: 14, tech: 16, drift: 11, grip: 12 } },
    { id: 'pikes', country: 'USA', name: 'Colorado', tag: 'USA', desc: 'A hill climb against the clock, from 2,862 m to the summit at 4,301 m. Hairpins, forest and snow at the top.',
      km: 6.26, corners: 36, laps: 1, trial: true, rec: ['O. Nieminen', '5:12.40'], bars: { speed: 11, tech: 15, drift: 12, grip: 9 } },
    { id: 'ouninpohja', country: 'Finland', name: 'Ouninpohja', tag: 'FINLAND', desc: 'A gravel special stage against the clock: crest after crest, big jumps and a long lakeside right.',
      km: 10.02, corners: 19, laps: 1, trial: true, rec: ['T. Hayashi', '4:48.90'], bars: { speed: 16, tech: 12, drift: 13, grip: 7 } },
  ],

  /* ---------- career: every race gives up to three trophies ---------- */
  trophyRules: { race: ['Bronze: top 5', 'Silver: podium', 'Gold: win'], trial: ['Bronze time', 'Silver time', 'Gold time'] },
  series: [
    { id: 'rookie', name: 'Rookie Cup', level: 'EASY', lv: 1, races: ['jezero', 'riviera', 'gora'], reward: '5,000 CR', free: true },
    { id: 'home', name: 'Home Cup', level: 'MEDIUM', lv: 2, races: ['jezero', 'ljubljana', 'gora', 'riviera'], reward: 'Gold paint + 8,000 CR' },
    { id: 'attack', name: 'Time Attack', level: 'MEDIUM', lv: 2, races: ['pikes', 'ouninpohja'], trial: true, reward: '12,000 CR' },
    { id: 'legends', name: 'Legends', level: 'HARD', lv: 3, races: ['monaco', 'rbring', 'suzuka', 'spa', 'nring'], reward: 'Chrome paint + 20,000 CR' },
    { id: 'grand', name: 'Grand Championship', level: 'FINAL', lv: 4, races: ['jezero', 'riviera', 'gora', 'ljubljana', 'monaco', 'rbring', 'suzuka', 'spa', 'nring'], reward: 'Champion title + 50,000 CR' },
  ],
  unlockAt: 50,   // % of the previous series that opens the next one

  /* ---------- the three states of the mockup ---------- */
  states: {
    free: {
      label: 'Free', player: 'Player', money: 10000, owned: false,
      car: 0, color: 2, track: 1,
      trophies: {},
      upgrades: {},
      myRecords: {},
    },
    full: {
      label: 'Full game', player: 'Player', money: 10000, owned: true,
      car: 0, color: 2, track: 1,
      trophies: {},
      upgrades: {},
      myRecords: {},
    },
    veteran: {
      label: 'Veteran', player: 'Luka', money: 58400, owned: true, titles: 2,
      car: 2, color: 0, track: 1,
      trophies: { rookie: [3, 3, 3], home: [3, 3, 2, 3], attack: [2, 3], legends: [3, 2, 3, 1, 0], grand: [3, 1, 2, 0, 0, 0, 0, 0, 0] },
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
    items: ['All 11 tracks (8 more)', 'All cars (4 more)', 'All 5 career series', 'Unlimited runs in today\'s race', 'Race a friend on every track'],
  },
};
