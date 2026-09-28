/* Track definition 'monaco'. index.html loads the track files before js/core.js, in the order of the track menu. */
var TRACK_DEFS = TRACK_DEFS || [];
(function () {
  // Circuit de Monaco on the real layout and scale (metres, origin = Sainte-Dévote, x east, z south): Boulevard Albert Ier (start) → Sainte Dévote →
  // Beau Rivage climb → Massenet → Casino → Mirabeau → Fairmont hairpin → Portier → tunnel → Nouvelle Chicane → Tabac → Piscine → Rascasse → Anthony Noghès.
  TRACK_DEFS.push({
    id: 'monaco', name: 'Monako', theme: 'monaco', laps: 2, halfWidth: 5.8,
    desc: 'Prava proga skozi Monako v pravem merilu: Sainte Dévote, vzpon do Casinoja, lasnica pri hotelu Fairmont, predor, šikana ob pristanišču, bazen in Rascasse.',
    points: [[-72,449],[-85,384],[-93,292],[-93,194],[-85,120],[-65,64],[-36,26],[0,3],[36,-6],[105,-6],[203,-6],[301,-2],[399,1],[483,-6],[546,-27],[603,-59],[652,-104],[684,-146],[712,-182],[750,-205],[791,-217],[831,-231],[869,-242],[897,-235],[913,-211],[925,-190],[934,-172],[951,-167],[964,-179],[967,-200],[974,-223],[990,-237],[1013,-244],[1043,-237],[1062,-217],[1055,-191],[1027,-162],[987,-125],[938,-84],[880,-43],[824,-6],[766,21],[693,39],[619,49],[546,54],[505,55],[487,65],[465,66],[444,59],[383,60],[301,64],[219,65],[145,65],[98,70],[72,87],[56,110],[42,132],[33,162],[19,208],[12,256],[3,292],[8,325],[16,361],[28,400],[39,431],[40,454],[23,472],[-5,477],[-35,474],[-59,463]],
    start: [-93,194], runoff: 0.4, inner: 3, side: 3, offSurface: 'paving',
    // named places: [HUD label, x, z, what the commentator may say there] (English lines: Sainte Devote, Noghes without accents for the voice)
    names: [
      ['Sainte Dévote', -1.8, 3.8, ['Into Sainte Devote, turn one!', 'Round Sainte Devote, past the little church!', 'Sainte Devote, and up the hill we go!']],
      ['Beau Rivage', 220.7, -5.5, ['Up the hill along Beau Rivage!', 'Climbing Beau Rivage towards the Casino!', 'Flat out up Beau Rivage!']],
      ['Massenet', 590.7, -50.7, ['Sweeping left through Massenet!', 'Massenet, the long left towards Casino Square!', 'Over the top of the hill at Massenet!']],
      ['Casino', 728.1, -193.8, ['Up into Casino Square!', 'Through Casino Square, past the famous Casino!', 'Casino Square, the heart of Monte Carlo!']],
      ['Mirabeau', 869.5, -242, ['Down the hill to Mirabeau!', 'Hard on the brakes for Mirabeau!', 'Mirabeau, and down towards the hairpin!']],
      ['Lasnica Fairmont', 948.4, -166.7, ['The Fairmont hairpin! Full lock!', 'Round the Fairmont hairpin, the slowest corner of the lap!', 'Crawling round the famous hairpin!']],
      ['Portier', 1050.4, -232, ['Down through Mirabeau Bas to Portier!', 'Portier, and down to the sea!', 'Right at Portier, the tunnel is next!']],
      ['Predor', 995.8, -132.8, ['Into the tunnel! Flat out in the dark!', 'Through the tunnel, under the Fairmont hotel!', 'In the tunnel, the fastest part of the lap!']],
      ['Nouvelle Chicane', 511.1, 53.9, ['Out of the tunnel, hard on the brakes for the chicane!', 'The Nouvelle Chicane! Over the kerbs!', 'Down to the harbour chicane!']],
      ['Tabac', 101.7, 68.8, ['Tabac! Along the harbour!', 'Left at Tabac, yachts all around!', 'Through Tabac, right by the water!']],
      ['Piscine', 21.2, 199.4, ['Into the Swimming Pool section!', 'Round the swimming pool, past the yachts!', 'Flicking through the Piscine!']],
      ['La Rascasse', 41.2, 448.2, ['La Rascasse! Tight right by the famous bar!', 'Round La Rascasse, the lap is nearly done!', 'Slow in, fast out at La Rascasse!']],
      ['Anthony Noghès', -64.8, 458.5, ['Anthony Noghes, and onto the start-finish straight!', 'Through Anthony Noghes, back onto Boulevard Albert the First!', 'Anthony Noghes, named after the founder of this race!']],
    ],
    elev: [[0.0767,3],[0.1167,4.5],[0.1447,6],[0.2067,15],[0.2647,26],[0.3097,33],[0.3647,40],[0.3787,41],[0.4177,38],[0.4387,35],[0.4547,32],[0.4657,27.5],[0.4777,23.5],[0.4917,20],[0.5167,13],[0.5367,10.5],[0.5867,8],[0.6327,5],[0.7177,3],[0.8357,2],[0.8537,1.8],[0.9107,1.5],[0.9607,2],[0.9857,2.5]],
    tunnel: [0.5337, 0.6347],
  });
})();
