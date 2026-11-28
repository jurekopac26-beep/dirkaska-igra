/* Track definition 'pikesg'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Pikes Peak on its historic gravel road (makadam): until 2011 most of the Pikes Peak Highway was unpaved. The same road as 'pikes' (js/tracks/pikes.js:
  // the layout, heights, places, turns and theme), only the surface is gravel (core: surface 5, no kerbs, the loose grip). Its own id, so its records,
  // ghosts and class boards are its own. After every older track file (a newer one goes after it), so the other tracks keep their places in the list.
  // The track menu shows it as a choice on the Pikes Peak card (game.js: Cesta asfalt / makadam), not as a card of its own.
  // Its own (docs/proge/pikesg.md, »Kraj«): the roadside plants under the road's dust and the washed-off gravel (js/world-pikesg.js), the rain of the
  // summer afternoon storms (rainP), the commentator's gravel lines (comm, names[].say), the animals and things by the road (zivali).
  const P = TRACK_DEFS.find(d => d.id === 'pikes'); if (!P) return;
  // the commentator's lines at the named places, on the gravel (the places and their distances are the asphalt road's: P.names)
  const SAY = {
    'Crystal Reservoir': ['Past Crystal Reservoir, and the gravel starts to bite!', 'Crystal Reservoir down on the right, the dust already hanging behind us!', 'Along Crystal Reservoir, loose stones on the road!'],
    'Ovinek pri zbiralniku': ['The reservoir bend, the back end stepping out on the gravel!', 'Round the reservoir bend, a spray of pink stones into the pines!'],
    "Engineer's Corner": ["Engineer's Corner, keep it tidy on the loose stuff!", "Into Engineer's Corner, the gravel piled up along the edge!", "Engineer's Corner, sideways past the old stone culvert!"],
    'Halfway Picnic Grounds': ['Halfway Picnic Grounds, flat out over the washboard!', 'Past the picnic grounds, the dust drifting into the trees!', 'Through the picnic grounds, the car skipping over the ripples!'],
    'Brown Bush Corner': ['Brown Bush Corner, brake early on the gravel!', 'Brown Bush Corner, the bushes on the inside grey with dust!', 'Round Brown Bush Corner, loose stones on the exit!'],
    'Ski Area': ['The Ski Area hairpin, a long slide on the loose gravel!', 'Round the Ski Area, dust rising over the old lift line!', 'The Ski Area hairpin, find the grip in the ruts!'],
    'Glen Cove': ['Glen Cove, and the switchbacks on gravel are next!', 'Hard on the brakes by the old inn at Glen Cove, stones flying!', 'Past Glen Cove, the trees are thinning out!', 'Glen Cove, the TV helicopter right above the dust cloud!'],
    "The W's": ["Into the W's on gravel! Hairpin after hairpin!", "The W's, left, right, left, the stones rattling under the car!", "Climbing the W's, nothing but loose granite and a long drop!"],
    'Cove Creek': ['Over Cove Creek, the road washed out here after every storm!', 'Cove Creek, mud in the ruts, out of the switchbacks!', 'Past Cove Creek, the air is getting thin!'],
    "Devil's Playground": ["Devil's Playground! Granite towers and a gravel road to the sky!", "Out across Devil's Playground, flat out on the loose stuff!", "Devil's Playground, lightning country, watch the clouds!"],
    'Bottomless Pit': ["Past the Bottomless Pit, and no guardrail on the gravel, don't look down!", 'The Bottomless Pit, keep it out of the loose stones on the edge!'],
    'Double Cut': ['Through Double Cut, a long drift on the gravel!', 'Double Cut, one wide corner, keep it pinned!'],
    'Boulder Park': ['Boulder Park! Granite boulders and loose grus everywhere!', 'The Boulder Park switchbacks on gravel, over four thousand metres up!', 'Into Boulder Park, the summit is close!'],
    'Olympic': ['Round Olympic, the summit is in sight through the dust!', 'Olympic, one of the last gravel corners before the top!'],
    'Summit': ['The cog railway and the summit in sight, bring it home on the gravel!', 'Up to the summit, the dust drifting over the station!', 'The Summit Visitor Center in sight, bring it home!'],
  };
  TRACK_DEFS.push(Object.assign({}, P, {
    id: 'pikesg', name: 'Pikes Peak (makadam), ZDA', variantOf: 'pikes', roadSurface: 'makadam',
    desc: 'Zgodovinski vzpon na Pikes Peak po makadamu, kot pred letom 2011: ista cesta od 2862 m do vrha na 4301 m, a po rožnato sivem granitnem gramozu s kolesnicami in valovi. Manj oprijema, prah na grmičju ob cesti, kamenje za avtom in popoldanske nevihte.',
    en: { name: 'Pikes Peak (gravel), USA', desc: 'The historic climb up Pikes Peak on gravel, as before 2011: the same road from 2,862 m to the summit at 4,301 m, but on pinkish grey granite gravel with ruts and washboard. Less grip, dust on the bushes by the road, stones behind the car and the afternoon storms.' },   // (the English page: Jezik · Language)
    rainP: 0.45,   // (the summer afternoon storms on the Front Range, nearly every day in July; on asphalt the default 0.35: an assumption, docs/proge/pikesg.md)
    zivali: { a: ['bighorn', 'muleDeer', 'elk', 'coyote'], t: ['signPost', 'picnic', 'logPile', 'stumps'] },   // (the road builders' stumps and log piles by the gravel road)
    comm: {
      introPass: ['Welcome to {track} on gravel! {cars} cars, twelve miles of loose granite to the clouds, and you start {grid}.', 'Here we are at the foot of {track}, the old gravel road. Dust, ruts and a long way up, and you line up {grid}.', "Welcome to America's Mountain the old way, on gravel! {rivals} rivals between you and the summit, and you start {grid}."],
      goPass: ['And away they go, a cloud of pink dust into the forest!', "And they're off! {cars} cars throwing gravel at each other!", 'The race is on! Next stop, the summit, if the gravel lets you!'],
    },
    names: P.names.map(p => Object.assign({}, p, SAY[p.n] ? { say: SAY[p.n] } : null)),
  }));
})();
