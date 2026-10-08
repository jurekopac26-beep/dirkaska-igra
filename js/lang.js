/* =========================================================================
   LANG — the words of the menus and the HUD: Slovenian (as written in the code) or English (the setting Jezik · Language)
   ========================================================================= */
(function () {
  'use strict';
  // tr(sl, ...args): the text in the chosen language. The Slovenian text is the key into EN; {0}, {1} ... take the args.
  // A text EN does not know stays as it is (a name, a number). The commentator speaks English in both languages.
  const EN = {
    /* ---- the page (index.html): buttons, labels, the HUD ---- */
    '● POSNETEK': '● REPLAY', 'Foto': 'Photo', 'Končaj': 'Done', 'MESTO': 'POS', 'NAJ': 'BEST', 'ZAVORA': 'BRAKE', 'ROČNA': 'HANDBRAKE', 'PLIN': 'GAS', 'NAGIB': 'TILT',
    '↺ Na progo': '↺ Back on track', 'Dirkaj': 'Race', 'Prvenstvo': 'Championship', 'Kariera': 'Career', 'Dirka s prijateljem': 'Race a friend',
    'Lestvica': 'Leaderboard', 'Nastavitve': 'Settings', 'Celoten zaslon': 'Full screen', 'Namesti igro': 'Install the game', 'Nadgradnje': 'Upgrades',
    'Barva': 'Colour', 'Upravljanje': 'Controls', 'Tipke': 'Buttons', 'Volan': 'Wheel', 'Nagib': 'Tilt', 'Nazaj': 'Back', 'Naprej': 'Next',
    'Nova kariera': 'New career', 'Začni kariero': 'Start career', 'Serijsko': 'Stock', 'Izberi progo': 'Choose a track', 'Za izbris · samo za testiranje': 'For deletion · testing only', 'Vreme': 'Weather',
    'Suho': 'Dry', 'Dež': 'Rain', 'Naključno': 'Random', 'Menljivo': 'Changing', 'Kvalifikacije': 'Qualifying', 'Vklop': 'On', 'Izklop': 'Off',
    'Letni čas': 'Season', 'Poletje': 'Summer', 'Jesen': 'Autumn', 'Zima': 'Winter', 'Čas dneva': 'Time of day', 'Dan': 'Day', 'Večer': 'Evening', 'Noč': 'Night',
    'Krilo': 'Wing', 'Malo': 'Low', 'Srednje': 'Medium', 'Veliko': 'High', 'Prestave': 'Gears', 'Kratke': 'Short', 'Dolge': 'Long',
    'Ime voznika': 'Driver name', 'Občutljivost nagiba': 'Tilt sensitivity', 'Nastavi sredino': 'Set centre', 'Obrni smer': 'Invert', 'Kamera': 'Camera',
    'Izometrična · ležeče': 'Isometric · sideways', 'Za avtom · pokončno': 'Chase · upright',
    'Oddaljenost': 'Distance', 'Blizu': 'Near', 'Daleč': 'Far', 'Pomoč pri driftu': 'Drift assist',
    'Nagib kamere': 'Camera tilt', 'Kamera za avtom gleda bolj naprej po cesti (razdalja kamere ostane enaka)': 'The chase camera looks further ahead along the road (camera distance stays the same)', 'Položaj avta (nižje)': 'Car position (lower)', 'Običajno': 'Normal',
    'Avto je v sliki bolj zadaj in nižje, da vidiš več ceste pred seboj (velja za kameri za avtom in izometrično)': 'The car sits further back and lower in the frame, so you see more road ahead (applies to the chase and isometric cameras)',
    'Nizka': 'Low', 'Srednja': 'Medium', 'Visoka': 'High', 'Težavnost': 'Difficulty', 'Lahka': 'Easy', 'Težka': 'Hard', 'Samodejni plin': 'Auto throttle',
    'Opozorila za ovinke': 'Corner warnings', 'Duh najboljše vožnje': 'Ghost of the best run', 'Komentator (angleščina)': 'Commentator (English)',
    '▶ Preizkusi glas': '▶ Test the voice', 'Sovoznik na reliju (angleščina)': 'Rally co-driver (English)', 'Poškodbe avtov': 'Car damage', 'Samo videz': 'Looks only',
    'Grafika': 'Graphics', 'Normalno': 'Normal', 'Visoko': 'High', 'Podrobnosti': 'Detail', 'Detajli avtov': 'Car detail', 'Normalni': 'Normal', 'Visoki': 'High', 'Drobni detajli tvojega avta in avta v garaži (znaki, kljuke, letvice, reže med paneli, okrogle gume). Visoki je za računalnik, Normalni za telefon.': 'Small details of your car and the car in the garage (badges, handles, trims, panel gaps, round tyres). High is for a computer, Normal for a phone.', 'Koliko podrobnosti ob progi (gledalci, drevesa, čeri, props …). Samodejno izbere glede na napravo in sproti prilagaja, da igra teče gladko; Nizka je za šibkejše telefone.': 'How much trackside detail (spectators, trees, cliffs, props …). Auto picks it from your device and adjusts on the fly to keep the game smooth; Low is for weaker phones.', 'Sence': 'Shadows', 'Zvok': 'Sound', 'Vibracija': 'Vibration', 'Končano': 'Done',
    'Varčevanje z baterijo': 'Battery saver', 'Samodejno': 'Auto', 'Baterija je skoraj prazna: varčni način (30 sličic na sekundo, nižja ločljivost).': 'The battery is nearly empty: battery saver on (30 frames a second, a lower resolution).',
    'Časovna tabela': 'Timing tower', 'TI': 'YOU', 'VODI': 'LEADER', 'BOKSI': 'PIT', 'Krogi vseh voznikov': 'Every driver\u2019s laps', 'K{0}': 'L{0}', 'Postanki': 'Stops',
    'Dosežki': 'Achievements', 'Nov dosežek: {0}': 'New achievement: {0}', ' Novi dosežki: {0}.': ' New achievements: {0}.', 'Dosežki {0}/{1}': 'Achievements {0}/{1}', '{0} h {1} min': '{0} h {1} min', '{0} min': '{0} min',
    'Prevoženo': 'Driven', 'Čas vožnje': 'Time driving', 'Dirke': 'Races', 'Stopničke': 'Podiums', 'Prva štartna mesta': 'Pole positions', 'Najhitrejši krogi': 'Fastest laps', 'Kronometri': 'Time trials', 'Medalje': 'Medals',
    'Naslovi prvaka': 'Titles', 'Pobegi policiji': 'Police escapes', 'Dirke s prijatelji': 'Races with friends', 'Najvišja hitrost': 'Top speed', 'Najdaljši skok': 'Longest jump', 'Najdaljše drsenje': 'Longest drift', 'Proge': 'Tracks',
    'Prvi cilj': 'First finish', 'Pripelji do cilja prve dirke.': 'Finish your first race.', 'Prva zmaga': 'First win', 'Zmagaj na dirki.': 'Win a race.', 'Z zadnjega na prvo': 'Last to first',
    'Zmagaj na dirki z zadnjega štartnega mesta (vsaj deset avtov).': 'Win a race from the back of the grid (ten cars or more).', 'Čist krog': 'Clean lap', 'Odpelji krog brez dotika ograje.': 'Drive a lap without touching a wall.',
    'Brez praske': 'Not a scratch', 'Pripelji dirko do cilja brez dotika ograje in drugih avtov.': 'Finish a race without touching a wall or another car.', 'Prvi na štartu': 'Pole sitter', 'Osvoji prvo štartno mesto v kvalifikacijah.': 'Take pole position in qualifying.',
    'Najhitrejši krog': 'Fastest lap', 'Odpelji najhitrejši krog dirke.': 'Set the fastest lap of a race.', 'Hat-trick': 'Hat-trick', 'Prvo štartno mesto, zmaga in najhitrejši krog na isti dirki.': 'Pole position, the win and the fastest lap in the same race.',
    'Napadalec': 'Charger', 'Na eni dirki pridobi osem mest.': 'Gain eight places in one race.', 'Deset stopničk': 'Ten podiums', 'Stopi na stopničke desetkrat.': 'Finish on the podium ten times.', 'Deset zmag': 'Ten wins', 'Zmagaj desetkrat.': 'Win ten times.',
    '100 kilometrov': '100 kilometres', 'Prevozi 100 km.': 'Drive 100 km.', '1000 kilometrov': '1000 kilometres', 'Prevozi 1000 km.': 'Drive 1000 km.', 'Popotnik': 'Globetrotter', 'Pripelji do cilja na vsaki progi.': 'Finish on every track.',
    'Zeleni pekel': 'Green Hell', 'Pripelji do cilja na Nordschleife.': 'Finish a race on the Nordschleife.', 'Prvak': 'Champion', 'Osvoji prvenstvo.': 'Win a championship.', 'Legenda': 'Legend', 'Osvoji prvenstvo Legende.': 'Win the Legends championship.',
    'Zlata medalja': 'Gold medal', 'Osvoji zlato medaljo v kronometru.': 'Win a gold medal in a time trial.', 'Zlata zbirka': 'Gold collection', 'Osvoji zlato na vseh kronometrih.': 'Win gold in every time trial.',
    'Neulovljiv': 'Untouchable', 'Pobegni policiji čez prelaz.': 'Escape the police over the pass.', 'Mojster dežja': 'Rain master', 'Zmagaj v dežju.': 'Win in the rain.', 'Nočna ptica': 'Night owl', 'Zmagaj ponoči.': 'Win at night.',
    'Kralj drsenja': 'Drift king', 'Drsi tri sekunde brez prekinitve.': 'Drift for three seconds in one go.', 'Letalec': 'Flyer', 'Skoči 40 m daleč.': 'Jump 40 m.', 'Pelji 300 km/h.': 'Reach 300 km/h.',
    'Bogataš': 'Tycoon', 'V karieri zasluži 100.000 €.': 'Earn €100,000 in the career.', 'S prijateljem': 'With a friend', 'Pripelji do cilja dirke s prijateljem.': 'Finish a race against a friend.',
    'Profil': 'Profile', 'Izvozi v datoteko': 'Export to a file', 'Uvozi iz datoteke': 'Import from a file', 'Datoteka je prevelika.': 'The file is too big.', 'Datoteke ni bilo mogoče prebrati.': 'The file could not be read.',
    'Profil je pripravljen za deljenje.': 'The profile is ready to share.', 'Profil je shranjen v datoteko {0}.': 'The profile is saved to the file {0}.', 'To ni profil igre APEX Racing.': 'This is not an APEX Racing profile.',
    'Uvozim profil {0} z dne {1}? Tvoj trenutni profil (nastavitve, rekordi, kariera, dosežki in duhovi) se zamenja.': 'Import the profile of {0} from {1}? Your current profile (settings, records, career, achievements and ghosts) will be replaced.',
    'Profila ni bilo mogoče shraniti (premalo prostora).': 'The profile could not be saved (not enough space).', 'Duh · {0} · {1}': 'Ghost · {0} · {1}', 'Povezava do duha je kopirana: pošlji jo prijatelju.': 'The ghost\u2019s link is copied: send it to your friend.',
    'Povezave ni bilo mogoče kopirati: duh je shranjen v datoteko.': 'The link could not be copied: the ghost is saved to a file.',
    'Duh je za povezavo predolg: shranjen je v datoteko.': 'The ghost is too long for a link: it is saved to a file.', 'Duh je shranjen v datoteko {0}.': 'The ghost is saved to the file {0}.', 'To ni duh igre APEX Racing.': 'This is not an APEX Racing ghost.',
    'Duha ni bilo mogoče shraniti (premalo prostora).': 'The ghost could not be saved (not enough space).', 'Duh igralca {0} na progi {1} ({2}): dirkaj proti njemu na letečem krogu.': 'The ghost of {0} on {1} ({2}): race it on a flying lap.',
    'Duh igralca {0} na progi {1} ({2}): dirkaj proti njemu v kronometru.': 'The ghost of {0} on {1} ({2}): race it in the time trial.', 'Povezava do duha ni veljavna.': 'The ghost\u2019s link is not valid.', 'Duh': 'Ghost',
    'Tvoj duh: {0} ({1}).': 'Your ghost: {0} ({1}).', 'leteči krog': 'flying lap', 'kronometer': 'time trial', 'Na tej progi še nimaš duha (odpelji kronometer ali leteči krog).': 'You have no ghost on this track yet (drive the time trial or a flying lap).',
    'Deli povezavo': 'Share a link', 'Shrani v datoteko': 'Save to a file', 'Duh prijatelja: {0} · {1}': 'Friend\u2019s ghost: {0} · {1}', 'Izbriši prijateljevega': 'Delete the friend\u2019s', 'Uvozi duha': 'Import a ghost',
    'Nevihta': 'Storm', 'Jutro': 'Morning', ' · nevihta': ' · storm', ' · jutro': ' · morning',
    'Dolžina dirke': 'Race length', 'Kratka': 'Short', 'Običajna': 'Normal', 'Dolga': 'Long', 'Vzdržljivostna': 'Endurance', 'Gorivo': 'Fuel', ' · vzdržljivostna': ' · endurance', ' · gorivo': ' · fuel',
    /* ---- slick compounds, the highlights of a race, the newer cars ---- */
    'Mehke': 'Soft', 'Trde': 'Hard', 'Gume v boksih': 'Pit tyres', 'Gume za suho na progah z boksi (za dež jih mehaniki dajo sami)': 'Dry tyres on the tracks with pits (the mechanics fit the rain tyres themselves)',
    'Gume za suho pri naslednjem postanku (za dež jih mehaniki dajo sami)': 'Dry tyres at the next pit stop (the mechanics fit the rain tyres themselves)', 'MEHKE': 'SOFT', 'SREDNJE': 'MEDIUM', 'TRDE': 'HARD', 'DEŽNE': 'WET', 'SUHE': 'DRY', '{0} GUME': '{0} TYRES',
    'Najboljši trenutki': 'Highlights', '★ Trenutki': '★ Highlights', 'ŠTART': 'START', 'PREHITEVANJE': 'OVERTAKE', 'NESREČA': 'CRASH', '{0} mesto': '{0} place', 'Tvoja zmaga!': 'Your win!', 'Zmaga: {0}': 'Winner: {0}', 'Najboljših trenutkov ni.': 'No highlights in this race.',
    'Poškodbe in vreme: tvoje nastavitve veljajo za vse.': 'Damage and weather: your settings apply to everyone.', 'Poškodbe in vreme: tvoje nastavitve veljajo za oba.': 'Damage and weather: your settings apply to both of you.', 'Poškodbe in vreme: po nastavitvah gostitelja.': 'Damage and weather: as the host has set them.',
    'Prototip za 24 ur Le Mansa: zaprta kabina, veliko zadnje krilo. Na ravninah najhitrejši avto v igri, v hitrih ovinkih ga krila držijo ob cesti. Z njim dirkaš proti samim prototipom.': 'A Le Mans 24 Hours prototype: a closed cockpit, a big rear wing. The fastest car in the game down the straights, its wings hold it on the road through fast bends. In it you race against prototypes only.',
    'Ameriški »muscle car« iz 70-ih z velikim V8. Na ravnini ga je težko ujeti, v ovinkih pa rad obrne rep: kralj drifta.': 'An American muscle car from the 70s with a big V8. Hard to catch on a straight, happy to swing its tail in the corners: the king of drift.',
    'Električni hiperšportnik s štirimi motorji: najhitrejši pospešek med cestnimi avti in skoraj brez zvoka, a težek.': 'An electric hypercar with four motors: the quickest launch of the road cars and almost silent, but heavy.',
    'Terenski dirkalni tovornjak z velikimi kolesi. Na asfaltu počasen, na makadamu in travi pa ima največ oprijema in najhitreje pospeši; po skokih mehko pristane.': 'An off-road racing truck on big wheels. Slow on tarmac, but on gravel and grass it has the most grip and the quickest pull; it lands softly after jumps.',
    /* ---- Pikes Peak: corner warnings, medals per class, the legend ghost, the course flyover ---- */
    'tvoja najboljša {0}': 'your best {0}', 'še brez medalje': 'no medal yet', ' · tvoja {0}': ' · yours {0}', ' (nova najboljša)': ' (a new best)', 'Brez medalje v razredu {0}': 'No medal in the {0} class',
    'nova najboljša v razredu': 'a new best in the class', 'Do brona {0} še {1}': 'Bronze at {0}, {1} to go', 'DESNA LASNICA': 'RIGHT HAIRPIN', 'LEVA LASNICA': 'LEFT HAIRPIN', 'DESNI {0}': 'RIGHT {0}', 'LEVI {0}': 'LEFT {0}',
    'PRELET PROGE': 'COURSE FLYOVER', 'Tapni ali pritisni tipko za preskok': 'Tap or press a key to skip', 'Moj najboljši': 'My best', 'Brez': 'None', 'Opozorila na ovinke': 'Corner warnings', 'Pikes Peak': 'Pikes Peak',
    /* ---- Pikes Peak on its historic gravel road (the road a choice on its card) ---- */
    'Cesta': 'Road', 'Asfalt': 'Tarmac', 'Makadam': 'Gravel', 'Današnja asfaltna cesta': 'Today\u2019s paved road', 'Zgodovinska makadamska cesta (do 2011)': 'The historic gravel road (until 2011)',
    'Cesta: makadam (zgodovinska, do 2011)': 'Road: gravel (historic, until 2011)',
    'Prelet proge pred startom (Pikes Peak, Katu-Jaryk)': 'Course flyover before the start (Pikes Peak, Katu-Yaryk)', 'Pikes Peak: proti komu voziš (legenda: avtopilot z najhitrejšim avtom razreda, na zlati čas)': 'Pikes Peak: who you race against (the legend: the autopilot in the fastest car of the class, on the gold time)',
    'GORIVO {0}%': 'FUEL {0}%', 'BATERIJA {0}%': 'BATTERY {0}%', 'Baterija je skoraj prazna: zapelji v bokse, mehaniki jo napolnijo.': 'The battery is nearly flat: come into the pits, the mechanics will charge it.', 'PRAZNA BATERIJA!': 'BATTERY FLAT!', 'Malo goriva: zapelji v bokse, mehaniki natočijo gorivo.': 'Low on fuel: come into the pits, the mechanics will fill the tank.', 'BREZ GORIVA!': 'OUT OF FUEL!', 'VEČER': 'EVENING', 'PADA NOČ': 'NIGHT FALLS',
    'POLNO': 'TANK FULL', ' · POLNO': ' · TANK FULL', 'BATERIJA POLNA': 'BATTERY FULL', ' · BATERIJA POLNA': ' · BATTERY FULL',
    'Baterija ne bo zdržala do cilja.': 'The battery will not last to the finish.', 'Baterija za {0} kroga.': 'Battery for {0} laps.',
    'agresivna vožnja': 'aggressive driving', 'previdna vožnja': 'careful driving', 'uravnotežena vožnja': 'balanced driving', 'popušča pod pritiskom': 'cracks under pressure', 'mirna kri': 'cool under pressure',
    'Šola vožnje': 'Driving school', 'Štart': 'Start', 'Zaviranje do oznake': 'Braking to a mark', 'Idealna linija': 'Racing line',
    'Ko ugasnejo luči, čim hitreje prevozi 100 m. Plin pritisni šele, ko ugasnejo: prej je prehiter štart.': 'When the lights go out, cover 100 m as quickly as you can. Press the throttle only once they are out: earlier is a jump start.',
    'Pospeši po ravnini in se ustavi čim bližje črti STOP, a ne čeznjo. Mimo table 100 m pelji vsaj 120 km/h.': 'Speed down the straight and stop as close to the STOP line as you can, but not over it. Pass the 100 m board at 120 km/h at least.',
    'Odpelji krog po idealni liniji, ki jo riše pomoč (zeleno: plin, rumeno: ovinek, rdeče: zaviraj, belo: točka zaviranja). Čim več kroga na njej, v omejenem času.': 'Drive a lap on the racing line the helper draws (green: throttle, yellow: corner, red: brake, white: the braking point). As much of the lap on it as you can, within the time limit.',
    'V 40 sekundah zberi čim več točk drsenja: bočno, hitro in brez udarcev (udarec izbriše verigo).': 'Collect as many drift points as you can in 40 seconds: sideways, fast and without knocks (a knock wipes out the chain).',
    'Štiri vaje z medaljami, vse z avtom KAZE RS (serijski, na suhem). Medalje za štart in drift ter časovna omejitev idealne linije so merjene ob vožnji avtopilota z istim avtom in fiziko.': 'Four lessons with medals, all in the KAZE RS (stock, in the dry). The medals of the start and the drift and the racing line\u2019s time limit are measured against the autopilot driving the same car with the same physics.',
    'Idealna linija na cesti pred avtom: zeleno plin, rumeno ovinek, rdeče zaviranje': 'The racing line on the road ahead: green throttle, yellow corner, red braking',
    'Tvoj najboljši: {0}': 'Your best: {0}', ' točk': ' points',
    'Prehiter štart: plin je bil pritisnjen, preden so ugasnile luči.': 'Jump start: the throttle was pressed before the lights went out.', '100 m v {0} s po tem, ko so ugasnile luči.': '100 m in {0} s after the lights went out.',
    'Prepočasi: mimo table 100 m je avto peljal {0} km/h, potrebnih je vsaj 120.': 'Too slow: the car passed the 100 m board at {0} km/h, 120 at least is needed.', 'Čez črto STOP: zaviraj prej.': 'Over the STOP line: brake earlier.',
    'Avto se je ustavil {0} m pred črto STOP (mimo table 100 m s {1} km/h).': 'The car stopped {0} m short of the STOP line (past the 100 m board at {1} km/h).',
    'Prepočasi: krog v {0}, v omejenem času {1} (na idealni liniji {2} %).': 'Too slow: a lap in {0}, the time limit {1} ({2} % on the racing line).', 'Na idealni liniji {0} % kroga, krog v {1} (omejitev {2}).': '{0} % of the lap on the racing line, a lap in {1} (limit {2}).',
    'UDAREC: VERIGA IZGUBLJENA': 'KNOCK: CHAIN LOST', '{0} točk drsenja v {1} s (najdaljša veriga {2}, izgubljenih verig {3}).': '{0} drift points in {1} s (longest chain {2}, chains lost {3}).',
    'ŠTART · {0} s · {1} m': 'START · {0} s · {1} m', 'ŠTART · plin šele, ko ugasnejo luči': 'START · throttle only when the lights go out', 'ZAVIRANJE · do črte STOP {0} m': 'BRAKING · {0} m to the STOP line', 'LINIJA · na liniji {0} %': 'LINE · {0} % on the line', 'DRIFT · {0} točk · {1} s': 'DRIFT · {0} points · {1} s',
    'ZLATO!': 'GOLD!', 'SREBRO!': 'SILVER!', 'BRON!': 'BRONZE!', 'NEUSPEŠNO': 'FAILED', 'BREZ MEDALJE': 'NO MEDAL', 'Zlata medalja!': 'Gold medal!', 'Srebrna medalja!': 'Silver medal!', 'Bronasta medalja!': 'Bronze medal!', 'Neuspešno': 'Failed',
    ' Nov osebni rekord!': ' A new personal best!', 'Medalja': 'Medal', 'Zlato': 'Gold', 'Srebro': 'Silver', 'Bron': 'Bronze', 'Tvoj rezultat': 'Your result', 'Tvoj najboljši': 'Your best', 'Ponovi vajo': 'Repeat the lesson',
    'Učenec': 'Pupil', 'Osvoji zlato medaljo v šoli vožnje.': 'Win a gold medal in the driving school.', 'Diplomant': 'Graduate', 'Osvoji zlato v vseh vajah šole vožnje.': 'Win gold in every lesson of the driving school.',
    'DVOBOJ: {0}': 'DUEL: {0}', 'DVOBOJ S STALNIM TEKMECEM': 'DUEL WITH YOUR RIVAL', 'DVOBOJ DOBLJEN': 'DUEL WON', 'NAPAKA: {0}': 'MISTAKE: {0}',
    'Stalni tekmec: {0} ({1}) · ti {2}, tekmec {3}.': 'Your rival: {0} ({1}) · you {2}, rival {3}.', 'Stalni tekmec: izbran bo po prvi dirki v karieri.': 'Your rival: chosen after your first race in the career.',
    ' Stalni tekmec {0}: {1} mesto (skupaj ti {2}, tekmec {3}).': ' Your rival {0}: {1} place (overall you {2}, rival {3}).', ' {0} ({1}) je zdaj tvoj stalni tekmec.': ' {0} ({1}) is your rival from now on.',
    'Jezik · Language': 'Language · Jezik', 'FOTO': 'PHOTO', 'Povleci: kamera okoli avta · dva prsta ali kolešček: bližje, dlje': 'Drag: the camera round the car · two fingers or the wheel: nearer, farther',
    'Objektiv': 'Lens', 'Ostrina': 'Focus', 'Skrij gumbe': 'Hide buttons', 'Shrani sliko': 'Save picture', 'Pavza': 'Pause', 'Nadaljuj': 'Resume',
    'Ponovi dirko': 'Restart race', 'Preskoči kvalifikacije': 'Skip qualifying', 'Glavni meni': 'Main menu',
    'Dirkaj proti prijatelju na drugem telefonu. Vpiši ime in tapni': 'Race a friend on another phone. Enter your name and tap', 'Počakaj prijatelja': 'Wait for a friend',
    ': ko prijatelj (ali kdorkoli drug) tapne isto, sta takoj povezana. Za dirko treh ali štirih ustvari zasebno sobo s kodo. Vsi potrebujejo internetno povezavo.': ': as soon as your friend (or anyone else) taps the same, the two of you are connected. For a race of three or four, create a private room with a code. Everyone needs an internet connection.',
    'Tvoje ime': 'Your name', 'Zasebna soba s kodo': 'Private room with a code', 'Ustvari sobo in kodo pošlji prijateljem (v sobi so lahko štirje), ali vpiši kodo, ki si jo dobil.': 'Create a room and send the code to your friends (up to four in a room), or enter the code you got.',
    'Ustvari sobo': 'Create room', 'Pridruži se': 'Join', 'Koda sobe': 'Room code', 'Moj avto': 'My car', 'Proga': 'Track', 'Krogi': 'Laps', 'Začni dirko': 'Start race',
    'Zmaga!': 'Victory!', 'Voznik': 'Driver', 'Avto': 'Car', 'Čas': 'Time', 'Naj. krog': 'Best lap', 'Posnetek': 'Replay', 'Opusti': 'Give up', 'Začni': 'Start',
    'Obrni telefon v ležeči položaj': 'Turn your phone sideways', 'Obrni telefon v pokončni položaj': 'Turn your phone upright', 'Nalagam progo…': 'Loading the track…',
    'Na začetek': 'To the start', 'Predvajaj ali ustavi': 'Play or pause', 'Prejšnji avto': 'Previous car', 'Naslednji avto': 'Next car', 'Poškodbe avta': 'Car damage',
    'Gume': 'Tyres', 'Zastave': 'Flags', 'Policija': 'Police', 'Nastavitev avta za izbrano progo': 'Car setup for the chosen track', 'Ime voznika za lestvico': 'Driver name for the leaderboard',
    'Dlje': 'Farther', 'Bližje': 'Nearer', 'KODA': 'CODE', 'Število krogov': 'Number of laps',

    /* ---- names and words the game puts together ---- */
    'Igralec': 'Player', 'Prijatelj': 'Friend', 'Ti': 'You', ' (ti)': ' (you)',
    'Zadnji pogon': 'Rear-wheel drive', 'Štirikolesni pogon': 'Four-wheel drive', 'Prednji pogon': 'Front-wheel drive', 'Motor na sredini': 'Mid-engined',
    'Levi palec: levo in desno, desni: plin in zavora. Drift: drži smer v ovinek – avto se zavrti postrani in ga zagon nese skozi ovinek, velik kot močno zavira. Ko spustiš, se poravna, protismer ga hitro ujame, plin ga vleče ven iz ovinka.':
      'Left thumb: left and right, right thumb: throttle and brake. Drift: hold the turn into the corner – the car swings sideways and its momentum carries it through; a big angle brakes hard. Let go and it straightens, countersteer catches it quickly, the throttle pulls it out of the corner.',
    'Primi volan spodaj levo in ga vrti kot pravi volan – bolj ko ga zavrtiš, bolj avto drifta. Ko ga spustiš, se sam poravna. Desno sta plin in zavora.':
      'Grab the wheel at the bottom left and turn it like a real steering wheel – the more you turn it, the more the car drifts. Let go and it straightens by itself. Throttle and brake are on the right.',
    'Telefon drži kot volan in ga nagibaj levo ali desno – močnejši nagib pomeni večji drift. Leva polovica zaslona je zavora, desna plin.':
      'Hold the phone like a steering wheel and tilt it left or right – a stronger tilt means a bigger drift. The left half of the screen brakes, the right half is the throttle.',
    'Levi palec: levo in desno, desni: plin in zavora. Drži smer – avto sam zadrsa z nosom v ovinek in se na izhodu sam poravna; zavora v ovinku ga zavrti.':
      'Left thumb: left and right, right thumb: throttle and brake. Hold the turn – the car slides its nose into the corner by itself and straightens at the exit; braking in the corner spins it.',
    'Rad obrne rep, rojen za drift.': 'Loves to swing its tail, born to drift.', 'Veliko oprijema, stabilen tudi na robu.': 'Lots of grip, stable even at the limit.',
    'Lahek in okreten, rad podvija.': 'Light and nimble, tends to understeer.', 'Oster in živahen, hitro zavrti.': 'Sharp and lively, quick to spin.',
    'Relijski dirkač iz 80-ih, ogromno moči, rojen za drift.': 'An 80s rally car, huge power, born to drift.',
    'Odprta kolesa in krila, ki ga pri hitrosti pritisnejo ob cesto. Zavira izjemno, na travi in makadamu pa drsi. Z njim dirkaš proti samim formulam.':
      'Open wheels and wings that press it onto the road at speed. It brakes brilliantly but slides on grass and gravel. In it you race against formula cars only.',
    'Dirka': 'Race', 'Kronometer': 'Time trial', 'Promet': 'Traffic',
    'Srebrna medalja': 'Silver medal', 'Bronasta medalja': 'Bronze medal', 'Brez medalje': 'No medal',
    ' · do brona {0} ({1})': ' · bronze at {0} ({1})', ' · do srebra {0} ({1})': ' · silver at {0} ({1})', ' · do zlata {0} ({1})': ' · gold at {0} ({1})',
    'Ponovi vzpon': 'Climb again', 'Ponovi preizkušnjo': 'Run the stage again', 'Ponovi spust': 'Descend again', 'Ponovi krog': 'Drive the lap again', 'Ponovi beg': 'Run again',
    'Višina': 'Altitude', 'Razdalja': 'Distance',
    ' · dež': ' · rain', ' · morda dež': ' · maybe rain', ' · menljivo vreme': ' · changing weather', ' · jesen': ' · autumn', ' · zima': ' · winter', ' · večer': ' · evening', ' · noč': ' · night',
    'Proga: {0}': 'Track: {0}', ' (osebni rekord {0})': ' (personal best {0})', ' (še brez časa)': ' (no time yet)', ' · kronometer · brez nasprotnikov': ' · time trial · no rivals',
    ' (najhitrejši pobeg {0})': ' (fastest escape {0})', ' (najboljši čas {0})': ' (best time {0})', ' · beg pred policijo · odprta cesta': ' · police chase · open road',
    ' · dvoboj z enim tekmecem · promet na cesti': ' · duel with one rival · traffic on the road', ' (najboljša dirka {0})': ' (best race {0})', ' · dirka na vrh · {0} nasprotnikov': ' · race to the top · {0} rivals',
    ' (rekord kroga {0})': ' (lap record {0})', ' · {0} nasprotnikov': ' · {0} rivals', ' Upravljanje: {0}, kamera: {1}. Spremeniš v nastavitvah.': ' Controls: {0}, camera: {1}. Change them in the settings.',
    'za avtom (telefon pokončno)': 'behind the car (phone upright)',
    'izometrična (telefon ležeče)': 'isometric (phone sideways)', ' Rekord kroga: {0}.': ' Lap record: {0}.',
    'Ta brskalnik ne podpira govora – komentatorja ne bo slišati.': 'This browser does not support speech – the commentator will not be heard.', 'Glas: {0} ({1})': 'Voice: {0} ({1})',
    'privzeti angleški': 'default English', ' – moški': ' – male', ' – nižji ton': ' – lower pitch', ' · sovoznik: {0}': ' · co-driver: {0}',
    'malo krila': 'low wing', 'srednje krilo': 'medium wing', 'veliko krila': 'high wing', 'kratke prestave': 'short gears', 'srednje prestave': 'medium gears', 'dolge prestave': 'long gears',
    'Nastavitev za {0}: {1}, {2}.': 'Setup for {0}: {1}, {2}.',
    'izometrična': 'isometric', 'za avtom': 'behind the car', 'Kamera: {0}': 'Camera: {0}',
    'Dostop do senzorja nagiba je zavrnjen. Uporabi tipke ali volan.': 'Access to the tilt sensor was denied. Use the buttons or the wheel.',
    'Ta naprava ne podpira nagiba. Uporabi tipke ali volan.': 'This device does not support tilt. Use the buttons or the wheel.',
    'Senzor nagiba ne pošilja podatkov. Odpri igro v celotnem brskalniku ali izberi tipke/volan.': 'The tilt sensor sends no data. Open the game in the full browser or choose buttons or the wheel.',
    '{0} KM': '{0} hp', ' (nadgrajen)': ' (upgraded)', 'V tvoji garaži · imaš {0}': 'In your garage · you have {0}', 'Cena {0} · imaš {1}': 'Price {0} · you have {1}',
    'Kupi · {0}': 'Buy · {0}', 'Barva {0}': 'Colour {0}', 'Moč': 'Power', 'Oprijem': 'Grip', 'Lahkost': 'Lightness',
    'Več moči: hitrejši pospešek in višja končna hitrost.': 'More power: quicker acceleration and a higher top speed.', 'Več oprijema v ovinkih in boljše speljevanje.': 'More grip in corners and better starts.',
    'Močnejše zaviranje, krajša zavorna pot.': 'Stronger braking, shorter stopping distances.', 'Pritisk na cesto: več oprijema v hitrih ovinkih, a malo več zračnega upora.': 'Downforce: more grip in fast corners, but a little more drag.',
    'serijsko': 'stock', '{0} moči': '{0} power', '{0} oprijema': '{0} grip', '{0} zavorne moči': '{0} braking power', '+{0}\u00a0% oprijema pri 150\u00a0km/h, {1}\u00a0upora': '+{0}\u00a0% grip at 150\u00a0km/h, {1}\u00a0drag',
    ' (serijsko {0} KM)': ' (stock {0} hp)', 'Motor': 'Engine', 'Zavore': 'Brakes', 'Aerodinamika': 'Aerodynamics',
    'Serijski': 'Stock', 'Stopnja 1': 'Stage 1', 'Stopnja 2': 'Stage 2', 'Dirkalni': 'Racing', 'Serijske': 'Stock', 'Športne': 'Sport', 'Polslick': 'Semi-slick',
    'Dirkalne': 'Racing', 'Keramične': 'Ceramic', 'Serijska': 'Stock', 'Spojler': 'Spoiler', 'Paket GT': 'GT pack',
    'V karieri kupljenih delov ne moreš prodati.': 'In the career you cannot sell the parts you bought.', 'Premalo denarja: {0} {1} stane {2}, imaš {3}.': 'Not enough money: {0} {1} costs {2}, you have {3}.',
    'Kupljeno: {0} – {1} za {2}. Ostane {3}.': 'Bought: {0} – {1} for {2}. {3} left.',
    'Posnetka ni.': 'There is no replay.', 'Za avtom': 'Chase', 'Od zgoraj': 'From above', 'Kokpit': 'Cockpit', 'Kino': 'Cinema',
    'Objektiv {0} mm': 'Lens {0} mm', 'Filter: {0}': 'Filter: {0}', 'brez': 'none', 'živo': 'vivid', 'črno-belo': 'black and white', 'sepija': 'sepia', 'film': 'film',
    'Ostrina: {0}': 'Focus: {0}', 'avto': 'the car', 'vse': 'everything', 'Slike ni bilo mogoče narediti.': 'The picture could not be made.',
    'Slika je pripravljena za deljenje.': 'The picture is ready to share.', 'Slika shranjena: {0}': 'Picture saved: {0}', 'Slike ni bilo mogoče shraniti.': 'The picture could not be saved.', 'Dirka · {0}': 'Race · {0}',
    'Dirk: {0}, zmag: {1}, zasluženo skupaj {2}. ': 'Races: {0}, wins: {1}, earned in total {2}. ',
    'V karieri z dirkami, prvenstvi in kronometri služiš denar: več za boljše mesto, daljšo dirko in težje nasprotnike, še več za najhitrejši krog, prvo štartno mesto, naslov prvaka in medalje. ':
      'In the career you earn money with races, championships and time trials: more for a better place, a longer race and tougher rivals, even more for the fastest lap, pole position, the title and medals. ',
    'Z denarjem kupuješ avte in nadgradnje. Začneš z {0} in avtom {1}.': 'With the money you buy cars and upgrades. You start with {0} and the {1}.',
    ' Kariera je zdaj izklopljena: voziš prosto, z vsemi avti.': ' The career is switched off now: you drive freely, with all the cars.', 'v garaži': 'in the garage',
    'Izklopi kariero': 'Switch the career off', 'Nadaljuj kariero': 'Continue the career', 'Kariera: {0} na računu.': 'Career: {0} in the bank.', 'Kariera je izklopljena, voziš prosto.': 'The career is switched off, you drive freely.',
    ' {0}: +{1} (imaš {2}).': ' {0}: +{1} (you have {2}).', 'Premalo denarja: {0} stane {1}, imaš {2}. Zasluži ga z dirkami.': 'Not enough money: the {0} costs {1}, you have {2}. Earn it by racing.',
    'Kupil si {0} za {1}. Ostane {2}.': 'You bought the {0} for {1}. {2} left.',
    ' (pravih {0} km)': ' (real {0} km)', ' · vzpon {0} m': ' · climb {0} m', ' · spust {0} m': ' · descent {0} m', ' · dvoboj z enim tekmecem v prometu': ' · duel with one rival in traffic', ' · rekord {0}': ' · record {0}',
    ' · beg pred policijo': ' · police chase', ' · najhitrejši pobeg {0}': ' · fastest escape {0}', ' · dirka z {0} tekmeci': ' · race with {0} rivals', ' · kronometer': ' · time trial',
    ' · kronometer v dežju': ' · time trial in the rain', '{0} ovinkov': '{0} corners', 'Način vožnje': 'Driving mode', 'Nalagam progo {0}…': 'Loading {0}…',
    'Zaostanek': 'Gap', 'Najboljši štartni položaj!': 'Pole position!', 'Tvoj krog {0}': 'Your lap {0}', ' (nov rekord proge)': ' (new track record)',
    '. Na štartu boš {0} od {1}.': '. You will start {0} of {1}.', ' {0}, dirka {1}/{2}.': ' {0}, race {1}/{2}.', 'Na štart': 'To the grid', 'Za prvo štartno mesto': 'For pole position',
    'ČASI TEKMECEV …': 'RIVALS’ TIMES …', 'POLICIJA': 'POLICE', ' · DEŽ': ' · RAIN', 'POLNI PLIN!': 'FLAT OUT!', 'VZPON NA VRH!': 'CLIMB TO THE TOP!', 'SPUST V DOLINO!': 'DOWN TO THE VALLEY!',
    'DIRKA {0}/{1} · ': 'RACE {0}/{1} · ', 'KVALIFIKACIJE': 'QUALIFYING', 'POLICIJA TE LOVI!': 'THE POLICE ARE AFTER YOU!', 'DVOBOJ V PROMETU!': 'DUEL IN TRAFFIC!', 'DIRKA NA VRH!': 'RACE TO THE TOP!',
    'CILJ': 'FINISH', 'Datum': 'Date', 'Povprečno': 'Average', 'Točke': 'Points', 'Nov osebni rekord!': 'New personal best!', 'Cilj': 'Finish',
    'Prejšnji rekord {0} ({1}).': 'Previous record {0} ({1}).', 'Prvi čas na tej progi.': 'The first time on this track.', '{0} za rekordom (rekord {1}).': '{0} behind the record (record {1}).',
    ' v dežju': ' in the rain', '{0} mesto na lestvici.': '{0} on the leaderboard.', 'izven prvih 10.': 'outside the top 10.',
    'Nagrada za medaljo': 'Medal prize', 'Nagrada za osebni rekord': 'Prize for a personal best', 'Nagrada': 'Prize', 'Vmesni časi': 'Split times', 'Točka': 'Point', 'Rekord': 'Record',
    'Lestvica · {0}': 'Leaderboard · {0}', 'Na tej progi še ni časov. Odpelji vzpon in postavi prvi rekord!': 'No times on this track yet. Drive the climb and set the first record!',
    'Na tej progi še ni časov. Odpelji preizkušnjo in postavi prvi rekord!': 'No times on this track yet. Drive the stage and set the first record!',
    'Najboljših 10 · {0} · kronometer': 'Top 10 · {0} · time trial', 'Osebni rekord {0} · vmesni časi': 'Personal best {0} · split times', 'Rekordi · {0} · {1}': 'Records · {0} · {1}',
    'dirka na vrh': 'race to the top', 'Najboljši krog': 'Best lap', 'Najboljša dirka': 'Best race', 'Najboljše mesto': 'Best place',
    'Lestvica najboljših časov se vodi za kronometre ({0}).': 'The leaderboard of best times is kept for the time trials ({0}).', ' v načinu Kronometer': ' in Time trial mode',
    '{0}: tvoj najdaljši skok {1} · {2} {3} m': '{0}: your longest jump {1} · {2} {3} m',
    'Razred {0} {1}': 'Class {0} {1}', ' · rekord razreda {0}': ' · class record {0}', ' · v razredu še ni časa': ' · no time in the class yet',
    '{0} v razredu {1}': '{0} in class {1}', 'Izven prvih 5 v razredu {0}': 'Outside the top 5 in class {0}', 'Prvi čas v razredu': 'The first time in the class',
    '{0} pod prejšnjim rekordom razreda ({1})': '{0} under the previous class record ({1})', '{0} za rekordom razreda ({1})': '{0} behind the class record ({1})',
    'VRH': 'SUMMIT', 'NOV REKORD RAZREDA': 'NEW CLASS RECORD', 'PRVI REKORD RAZREDA': 'FIRST CLASS RECORD', 'NOV OSEBNI REKORD': 'NEW PERSONAL BEST',
    'Razred {0} · najboljših 5': 'Class {0} · top 5', '{0} najboljših 5': '{0} top 5', 'V tem razredu še ni časov ({0}).': 'No times in this class yet ({0}).',
    'Na stopničkah!': 'On the podium!', 'Čas dirke {0}': 'Race time {0}', ' (s {0} s kazni)': ' (with {0} s of penalties)', ', najboljši krog {0}': ', best lap {0}',
    '. Štartal si z {0} mesta.': '. You started {0}.', ' Zbiti pešci: {0}, kolesarji: {1}': ' Pedestrians hit: {0}, cyclists: {1}', ' (5 s kazni za vsakega)': ' (5 s penalty for each)',
    'Nagrada (z najhitrejšim krogom)': 'Prize (with the fastest lap)', ' {0}: +{1} {2}, skupaj {3} in {4} mesto': ' {0}: +{1} {2}, {3} in total and {4} place',
    ' v končni razvrstitvi.': ' in the final standings.', ' po {0} dirki.': ' after the {0} race.', 'Za naslov prvaka': 'For the title', 'Za {0} mesto v prvenstvu': 'For {0} place in the championship',
    'Končna razvrstitev': 'Final standings', 'Lestvica prvenstva': 'Championship standings',
    'Pobegnil si!': 'You escaped!', 'Ulovljen!': 'Busted!', 'Čez prelaz v {0}': 'Over the pass in {0}', '{0} v {1}': '{0} in {1}', ' (najhitrejši pobeg).': ' (fastest escape).',
    'Policija te je ujela po {0} km, v {1}.': 'The police caught you after {0} km, in {1}.', 'Prevožena pot': 'Distance driven', 'Najvišja stopnja pregona': 'Highest heat level',
    'Izločene patrulje': 'Patrol cars wrecked', 'Prebite gume': 'Flat tyres', 'Zbiti pešci in kolesarji': 'Pedestrians and cyclists hit', 'Pobegi / aretacije': 'Escapes / arrests',
    'Beg pred policijo': 'Police chase', 'Nagrada za pobeg': 'Escape prize', 'SKOK {0} m': 'JUMP {0} m', 'REKORD SKOKA! ': 'JUMP RECORD! ', 'Najdaljši skok {0} m': 'Longest jump {0} m',
    ' · {0} {1} (tvoj rekord {2}, {3} {4} m)': ' · {0} {1} (your record {2}, {3} {4} m)',
    'lahka': 'easy', 'srednja': 'medium', 'težka': 'hard', 'točke kot v F1': 'points as in F1', 'Težavnost: {0} (spremeniš v Nastavitvah)': 'Difficulty: {0} (change it in the Settings)',
    'Prvak {0}×': 'Champion {0}×', 'Najboljše: {0} mesto': 'Best: {0} place', 'Začni prvenstvo': 'Start the championship', 'končano': 'finished', 'dirka {0}/{1}': 'race {0}/{1}',
    'Težavnost: {0}': 'Difficulty: {0}', ' (dež)': ' (rain)', 'Prvak!': 'Champion!', 'Na stopničkah prvenstva!': 'On the championship podium!', 'Konec prvenstva': 'The championship is over',
    '{0} {1}, {2}. Zmagovalec {3} ({4}).': '{0} {1}, {2}. Winner: {3} ({4}).', 'Zmage': 'Wins', 'Zadnja': 'Last', 'Novo prvenstvo': 'New championship', 'Naslednja dirka: {0}': 'Next race: {0}',
    'Idealna linija je suha: dežne gume se na suhem hitro obrabijo. Zapelji v bokse po suhe gume.': 'The racing line is dry: wet tyres wear quickly on a dry road. Pit for dry tyres.',
    'ZBIL SI PEŠCA!': 'YOU HIT A PEDESTRIAN!', 'ZBIL SI KOLESARJA!': 'YOU HIT A CYCLIST!', 'TEKMEC JE ZBIL PEŠCA': 'YOUR RIVAL HIT A PEDESTRIAN', 'TEKMEC JE ZBIL KOLESARJA': 'YOUR RIVAL HIT A CYCLIST',
    'BODIČASTI TRAK!': 'SPIKE STRIP!', 'ZAPORA NAPREJ!': 'ROADBLOCK AHEAD!', 'PREBITA GUMA!': 'FLAT TYRE!', 'PATRULJA JE IZLOČENA!': 'PATROL CAR WRECKED!',
    'RUMENA ZASTAVA': 'YELLOW FLAG', 'Rumena zastava: pred tabo je ustavljen avto. Upočasni in ne prehitevaj, dokler je ne prevoziš.': 'Yellow flag: a car has stopped ahead. Slow down and do not overtake until you are past it.',
    'VARNOSTNI AVTO': 'SAFETY CAR', 'Varnostni avto: ne prehitevaj in se drži avta pred sabo. Ko gre s proge, se dirka nadaljuje na ciljni črti.': 'Safety car: do not overtake and stay behind the car ahead. When it leaves the track, the race goes on from the finish line.',
    'VARNOSTNI AVTO GRE V BOKSE': 'SAFETY CAR INTO THE PITS', 'VARNOSTNI AVTO GRE S PROGE': 'SAFETY CAR LEAVING THE TRACK', 'NE PREHITEVAJ DO CILJNE ČRTE': 'NO OVERTAKING UNTIL THE LINE', 'ZELENA ZASTAVA!': 'GREEN FLAG!',
    'VRNI MESTO!': 'GIVE THE PLACE BACK!', 'Prehitel si pod rumeno zastavo ali za varnostnim avtom. Spusti ga nazaj pred sabo v 10 sekundah, sicer dobiš 5 sekund kazni.': 'You overtook under a yellow flag or behind the safety car. Let the car back ahead within 10 seconds, or you get a 5 second penalty.',
    'MESTO VRNJENO': 'PLACE GIVEN BACK', 'KAZEN +5 s': 'PENALTY +5 s', 'VRNI MESTO · {0}': 'GIVE IT BACK · {0}', 'SC GRE S PROGE': 'SC LEAVING', 'NE PREHITEVAJ': 'NO OVERTAKING',
    'DEŽ': 'RAIN', 'Začelo je deževati: proga bo kmalu mokra. Zapelji v bokse po dežne gume (desno takoj za zadnjim ovinkom pred ciljno ravnino).': 'It has started to rain: the track will soon be wet. Pit for wet tyres (on the right just after the last corner before the finish straight).',
    'DEŽ JE PONEHAL': 'THE RAIN HAS STOPPED', 'Dež je ponehal: proga se suši, najprej na idealni liniji.': 'The rain has stopped: the track is drying, the racing line first.',
    'SEKTOR {0}  {1}': 'SECTOR {0}  {1}', 'BOKSI · 80 km/h': 'PITS · 80 km/h', 'ZAVETRJE': 'SLIPSTREAM',
    'PREDRTA GUMA': 'PUNCTURE', 'VROČE ZAVORE': 'HOT BRAKES', 'VROČ MOTOR': 'HOT ENGINE', 'PREDRTA GUMA!': 'PUNCTURE!', 'ZAVORE SE PREGREVAJO': 'BRAKES OVERHEATING', 'MOTOR SE PREGREVA': 'ENGINE OVERHEATING',
    'Predrta guma: avto vleče na stran in slabše prime. Zapelji v bokse, mehaniki jo zamenjajo.': 'A puncture: the car pulls to one side and grips less. Come into the pits, the mechanics change the tyre.',
    'Predrta guma: avto vleče na stran in slabše prime. Previdno do cilja.': 'A puncture: the car pulls to one side and grips less. Take it carefully to the line.',
    'Vroče zavore slabše zavirajo: zaviraj prej in nežneje, na ravnini se ohladijo.': 'Hot brakes stop the car less well: brake earlier and more gently, they cool down on the straights.',
    'Vroč motor ima manj moči: popusti plin, v hitri vožnji se ohladi.': 'A hot engine has less power: ease off the throttle, it cools down at speed.',
    'Okvare': 'Failures', 'Okvare (predrta guma, vroče zavore in motor)': 'Failures (punctures, hot brakes and engine)',
    // Kontrole: the keys, the gamepad and the wheel
    'Kontrole': 'Controls', 'Tipke, plošček in volan': 'Keys, gamepad and wheel', 'Tipkovnica': 'Keyboard', 'Plošček in volan': 'Gamepad and wheel', 'Ponastavi': 'Reset',
    'Levo': 'Left', 'Desno': 'Right', 'Plin': 'Throttle', 'Zavora': 'Brake', 'Drift': 'Drift', 'Nazaj na progo': 'Back on the track', 'Plošček': 'Gamepad', 'Zamenjaj': 'Switch',
    'Pritisni tipko …': 'Press a key …', 'Tapni polje in pritisni tipko. Esc prekliče, Backspace izbriše.': 'Tap a box and press a key. Esc cancels, Backspace clears it.',
    'Ni povezanega ploščka ali volana. Poveži ga in pritisni gumb na njem.': 'No gamepad or wheel connected. Connect one and press a button on it.',
    'Krmiljenje': 'Steering', 'Zavrti v desno …': 'Turn right …', 'Os {0}': 'Axis {0}', 'Gumb {0}': 'Button {0}', 'Mrtvo območje': 'Dead zone', 'Poln zavoj pri': 'Full lock at', '{0} % osi': '{0} % of the axis',
    'Odziv': 'Response', 'Enakomeren': 'Linear', 'Nežen v sredini': 'Gentle in the middle', 'Pritisni gumb ali pedal …': 'Press a button or pedal …', 'Pritisni gumb …': 'Press a button …',
    'Volan: tapni Krmiljenje in zavrti volan v desno; nato tapni Plin (ali Zavora), pritisni pedal do konca in ga spusti.': 'Wheel: tap Steering and turn the wheel right; then tap Throttle (or Brake), press the pedal all the way down and let it go.',
    'Tapni polje in pritisni gumb (ali premakni os).': 'Tap a box and press a button (or move an axis).', 'Nič ni bilo pritisnjeno.': 'Nothing was pressed.', 'Krmiljenje: os {0}.': 'Steering: axis {0}.', '{0}: {1}.': '{0}: {1}.',
    'Preslednica': 'Space', 'Desni Shift': 'Right Shift', 'Desni Ctrl': 'Right Ctrl', 'Privzete tipke.': 'Default keys.', 'Privzeta nastavitev: {0}.': 'Default settings: {0}.',
    'Volan je povezan.': 'Wheel connected.', 'Volan je povezan. Pedale nastaviš v Nastavitvah: Kontrole.': 'Wheel connected. Set up its pedals in Settings: Controls.',
    // the best moment as a video after a race
    'Video najboljšega trenutka po dirki': 'Video of the best moment after a race', 'Najboljši trenutek': 'Best moment', 'NAJBOLJŠI TRENUTEK': 'BEST MOMENT', 'ZMAGA': 'WIN',
    'Ti · {0} mesto': 'You · {0} place', 'Preskoči': 'Skip', 'Deli': 'Share', 'Moj najboljši trenutek · {0}': 'My best moment · {0}', 'Video shranjen: {0}': 'Video saved: {0}',
    // a championship over the internet (the room)
    'Prvenstvo · končno stanje · prvak: {0}': 'Championship · final standings · champion: {0}', 'Prvenstvo · po {0}. dirki od {1}': 'Championship · after race {0} of {1}', 'Začni dirko {0}/{1}': 'Start race {0}/{1}',
    'Odstrani': 'Remove', 'Dodaj izbrano progo': 'Add the chosen track', 'PRVENSTVO · DIRKA {0}/{1}': 'CHAMPIONSHIP · RACE {0}/{1}',
    // a challenge from a friend (the challenge link)
    'Izziv': 'Challenge', 'Zavrni': 'Decline', 'Kasneje': 'Later', 'Sprejmi izziv': 'Accept the challenge', 'Izzovi prijatelja': 'Challenge a friend', 'Pošlji odgovor': 'Send your reply', 'Pošlji izziv': 'Send a challenge',
    'Leteči krog': 'Flying lap', 'Način': 'Mode', 'Poskusi znova': 'Try again', 'ti: {0}': 'you: {0}', 'Izziv: {0} · {1}': 'Challenge: {0} · {1}', 'Izziv · {0} · {1}': 'Challenge · {0} · {1}',
    'IZZIV: {0} · {1}': 'CHALLENGE: {0} · {1}', 'IZZIV {0}  {1}': 'CHALLENGE {0}  {1}', 'IZZIV PREMAGAN!': 'CHALLENGE BEATEN!', 'Izziv premagan!': 'Challenge beaten!', 'Izziv ni premagan': 'Challenge not beaten',
    '{0} te izziva: premagaj čas na progi {1}.': '{0} challenges you: beat the time on {1}.', 'Premagaj moj čas {0} na progi {1}!': 'Beat my time of {0} on {1}!',
    'Povezava do izziva je kopirana: pošlji jo prijatelju.': 'The challenge link is copied: send it to a friend.', 'Povezave ni bilo mogoče kopirati.': 'The link could not be copied.',
    'Izziva ni bilo mogoče pripraviti.': 'The challenge could not be made.', 'priložen': 'included', 'ni priložen (vožnja je predolga za povezavo)': 'not included (the run is too long for a link)', 'Povezava do izziva ni veljavna.': 'The challenge link is not valid.', 'Izziva ni bilo mogoče shraniti (premalo prostora).': 'The challenge could not be saved (not enough space).',
    'Izziv sprejet': 'Challenge accepted', 'Premagaj prijateljev čas v izzivu.': 'Beat the time of a friend in a challenge.',
    // the team radio and the strategy
    'Radio ekipe (razlike, postanki, vreme)': 'Team radio (gaps, pit stops, weather)', 'Gume za postanek': 'Tyres for the stop', 'Gume za postanek: {0}': 'Tyres for the stop: {0}',
    'Gorivo ne bo zdržalo do cilja.': 'The fuel will not last to the finish.', 'Gume ne bodo zdržale do cilja.': 'The tyres will not last to the finish.',
    'Proga je mokra, potrebuješ dežne gume.': 'The track is wet, you need rain tyres.', 'Idealna linija je suha, potrebuješ suhe gume.': 'The racing line is dry, you need slicks.',
    'Imaš predrto gumo.': 'You have a puncture.', 'Avto je močno poškodovan.': 'The car is badly damaged.', 'Boksi v tem krogu!': 'Box this lap!', 'BOKSI V TEM KROGU': 'BOX THIS LAP',
    'Po postanku boš {0}., {1} bo {2} s pred tabo.': 'After the stop you will be P{0}, {1} {2} s ahead of you.', 'Po postanku boš še vedno prvi.': 'After the stop you will still be leading.',
    'Dobiš {0} gume.': 'You get {0} tyres.', 'mehke': 'soft', 'srednje': 'medium', 'trde': 'hard',
    'Vodiš, {0} je {1} s za tabo.': 'You are leading, {0} is {1} s behind you.', 'Vodiš.': 'You are leading.',
    '{0} je {1} s pred tabo, {2} {3} s za tabo.': '{0} is {1} s ahead of you, {2} {3} s behind you.', '{0} je {1} s pred tabo.': '{0} is {1} s ahead of you.',
    'Na radarju je dež: začel bo čez približno minuto.': 'Rain on the radar: it will start in about a minute.', 'Na radarju se dež umika: kmalu bo ponehal.': 'The rain is moving away on the radar: it will stop soon.',
    'Varnostni avto! Pridi zdaj v bokse, postanek stane le okoli {0} s.': 'Safety car! Box now, the stop costs only about {0} s.',
    'Dober postanek.': 'Good stop.', 'Si {0}., {1} je {2} s pred tabo.': 'You are P{0}, {1} is {2} s ahead of you.', 'Si {0}.': 'You are P{0}.',
    'Postanek bo v {0}. krogu.': 'The stop will be on lap {0}.', 'Okno za postanek: od {0}. do {1}. kroga.': 'Pit window: laps {0} to {1}.', 'Zadnji krog!': 'Last lap!',
    'Gorivo za {0} kroga.': 'Fuel for {0} laps.', 'Gume: {0} %.': 'Tyres: {0} %.', 'Postanek zdaj stane okoli {0} s, po njem bi bil {1}.': 'A stop now costs about {0} s, after it you would be P{1}.',
    ' · POPRAVLJENO': ' · REPAIRED', 'POPRAVLJENO!': 'REPAIRED!', 'še {0} km': '{0} km to go', 'OVINEK {0}/{1}': 'TURN {0}/{1}', 'LETEČI KROG': 'FLYING LAP', 'LETEČI KROG!': 'FLYING LAP!',
    'KROG {0}/{1}': 'LAP {0}/{1}', 'KROG {0}: {1}': 'LAP {0}: {1}', '  NAJHITREJŠI': '  FASTEST', 'ZADNJI KROG!': 'FINAL LAP!', 'NAPAČNA SMER!': 'WRONG WAY!', 'POPRAVILO {0} %': 'REPAIR {0} %',
    'PREBITE GUME: {0}': 'FLAT TYRES: {0}', 'TEKMEC {0} s PRED TABO': 'RIVAL {0} s AHEAD', 'TEKMEC {0} s ZA TABO': 'RIVAL {0} s BEHIND',
    'ČAS SE ZAČNE NA ČRTI': 'THE CLOCK STARTS AT THE LINE', 'START!': 'GO!', 'CILJ!': 'FINISH!', 'Cilj!': 'Finish!', 'ZMAGA!': 'VICTORY!', 'CILJ! {0} MESTO': 'FINISH! {0} PLACE', 'KROG {0}': 'LAP {0}',
    'REKORD {0}  {1}': 'RECORD {0}  {1}', 'CILJ  {0}': 'FINISH  {0}', 'NOV REKORD!': 'NEW RECORD!', 'CILJ! {0}': 'FINISH! {0}', 'ULOVLJEN!': 'BUSTED!', 'POBEGNIL SI!': 'YOU ESCAPED!',
    'Sobe s to kodo ni. Preveri kodo (prijatelj mora imeti sobo odprto).': 'There is no room with this code. Check the code (your friend must keep the room open).',
    'Ta brskalnik ne podpira dirke s prijateljem. Odpri igro v Chromu ali Safariju.': 'This browser cannot race a friend. Open the game in Chrome or Safari.',
    'Povezava ni uspela. Preveri kodo in internetno povezavo.': 'The connection failed. Check the code and the internet connection.', 'Ta soba je polna (v njej so že štirje).': 'This room is full (four are in it already).',
    'Na telefonih sta različni različici igre. Na obeh igro zapri in znova odpri, nato poskusi znova.': 'The phones have different versions of the game. Close and open the game again on both, then try again.',
    'Gostitelj je zaprl sobo.': 'The host closed the room.', 'Povezava z gostiteljem je prekinjena.': 'The connection to the host is lost.',
    'Trenutno ni mogoče najti prijatelja (vsa čakalna mesta so zasedena ali ne odgovarjajo). Poskusi znova.': 'No friend can be found right now (all the waiting places are taken or do not answer). Try again.',
    'Prijatelj je odšel. Za novo dirko znova tapni Počakaj prijatelja.': 'Your friend has left. For a new race tap Wait for a friend again.',
    'Povezava s strežnikom ni uspela. Preveri internetno povezavo in poskusi znova.': 'Could not reach the server. Check the internet connection and try again.',
    'Vpiši kodo sobe (4 znaki), ki ti jo je poslal prijatelj.': 'Enter the room code (4 characters) your friend sent you.',
    'Prijatelj je zapustil dirko.': 'Your friend left the race.', 'Prijatelj je zapustil sobo.': 'Your friend left the room.', 'Povezava s prijateljem je prekinjena.': 'The connection to your friend is lost.',
    'Prekliči': 'Cancel', 'Nalagam progo …': 'Loading the track …', 'Povezujem se …': 'Connecting …', 'Čakam, da se kdo pridruži (prijatelj mora tapniti Počakaj prijatelja) …': 'Waiting for someone to join (your friend must tap Wait for a friend) …',
    'Ustvarjam sobo …': 'Creating the room …', 'Pošlji to kodo prijateljem (v sobi so lahko štirje). Čakam, da se kdo pridruži …': 'Send this code to your friends (up to four in a room). Waiting for someone to join …',
    'Čakam, da se prijatelji vrnejo v sobo …': 'Waiting for your friends to come back to the room …', 'Prijatelji so v sobi. Izberi progo in začni dirko.': 'Your friends are in the room. Pick a track and start the race.',
    'Nekateri prijatelji se ne odzivajo. Poskusi znova.': 'Some of your friends do not answer. Try again.',
    'Igralec {0} je odšel.': '{0} has left.', 'Povezava z igralcem {0} je prekinjena.': 'The connection to {0} is lost.', ' Čakam, da prijatelji pripeljejo v cilj …': ' Waiting for your friends to finish …', ' Zaostanek za zmagovalcem {0}.': ' {0} behind the winner.',
    'Tretji': 'Third', 'Četrti': 'Fourth',
    'Čakam, da se prijatelj vrne v sobo …': 'Waiting for your friend to come back to the room …', 'Prijatelj je v sobi. Izberi progo in začni dirko.': 'Your friend is in the room. Choose the track and start the race.',
    'Povezujem se s sobo {0} …': 'Connecting to room {0} …', 'Povezan. Gostitelj izbere progo in začne dirko.': 'Connected. The host chooses the track and starts the race.',
    '{0}. čakam …': '{0}. waiting …',
    'Prijatelj se ne odziva. Poskusi znova.': 'Your friend does not answer. Try again.',
    'Drugi': 'Second', ' Čakam, da prijatelj pripelje v cilj …': ' Waiting for your friend to finish …', ' Prijatelj je dirko zapustil.': ' Your friend left the race.', ' Razlika {0}.': ' Gap {0}.',
    'odšel': 'left', 'vozi …': 'driving …', 'Nazaj v sobo': 'Back to the room',
    'Igra na tej napravi teče počasi: od naslednjega premora ali dirke bo brez senc (vklopiš jih v Nastavitvah).': 'The game runs slowly on this device: from the next pause or race it goes without shadows (switch them on in the Settings).',
    'Nova kariera: {0}.': 'New career: {0}.', 'Res začnem znova?': 'Really start again?', 'Tapni še enkrat, če res želiš začeti novo kariero (denar, avti in nadgradnje se izgubijo).': 'Tap again if you really want a new career (the money, cars and upgrades are lost).',
    'Ta avto še ni tvoj: izberi avto iz garaže ali ga kupi.': 'This car is not yours yet: choose a car from your garage or buy it.', 'Prvenstvo je opuščeno.': 'The championship is given up.',
    'Res opustim?': 'Really give up?', 'Tapni še enkrat, če res želiš opustiti prvenstvo.': 'Tap again if you really want to give the championship up.', 'Ta avto še ni tvoj: kupi ga v izbiri avta.': 'This car is not yours yet: buy it in the car choice.',
    'Sredina nagiba je nastavljena.': 'The tilt centre is set.', 'Izhod iz celotnega zaslona': 'Exit full screen',
    'Na iPhonu: Deli → Dodaj na začetni zaslon. Igra se nato z ikone odpre čez cel zaslon.': 'On the iPhone: Share → Add to Home Screen. The game then opens full screen from the icon.',
    'Celoten zaslon tukaj ni na voljo. Odpri igro v Chromu ali jo dodaj na začetni zaslon.': 'Full screen is not available here. Open the game in Chrome or add it to the home screen.',
    'Igra je nameščena: odpreš jo z ikono APEX Racing na začetnem zaslonu.': 'The game is installed: open it with the APEX Racing icon on your home screen.', 'Nova različica igre: nalagam …': 'A new version of the game: loading …',
    'Knjižnice za 3D grafiko ni bilo mogoče naložiti. Preveri povezavo in osveži stran.': 'The 3D graphics library could not be loaded. Check the connection and reload the page.',
    'Igralni plošček je povezan: leva palica krmili, RT plin, LT zavora, B drift, Start pavza. V menijih izbiraš s palico in A, B je nazaj.': 'Gamepad connected: the left stick steers, RT throttle, LT brake, B drift, Start pause. In the menus choose with the stick and A, B goes back.',
    'Napaka pri zagonu: {0}': 'Error at start-up: {0}',

    /* ---- the championships (Core.CHAMPS keep their own English in .en) and place names on the HUD ---- */
    'Razgledišče Kurokamidaira': 'Kurokamidaira lookout', 'Ovinek は (3)': 'Curve は (3)', 'Ovinek に (4)': 'Curve に (4)', 'Ovinek ほ (5)': 'Curve ほ (5)', 'Ovinek へ (6)': 'Curve へ (6)', 'Ovinek と (7)': 'Curve と (7)', 'Ovinek ち (8)': 'Curve ち (8)', 'Ovinek り (9)': 'Curve り (9)', 'Ovinek ぬ (10)': 'Curve ぬ (10)', 'Ovinek る (11)': 'Curve る (11)', 'Ovinek を (12)': 'Curve を (12)', 'Ovinek わ (13)': 'Curve わ (13)', 'Ovinek か (14)': 'Curve か (14)', 'Ovinek よ (15)': 'Curve よ (15)', 'Ovinek た (16)': 'Curve た (16)', 'Ovinek れ (17)': 'Curve れ (17)', 'Ovinek そ (18)': 'Curve そ (18)', 'Ovinek つ (19)': 'Curve つ (19)', 'Ovinek ね (20)': 'Curve ね (20)',   // (Irohazaka: the lookout, the curves by their signs)
    'Ruski križ': 'Russian Cross', 'Ruska kapelica': 'Russian Chapel', 'Ajdovska deklica': 'Heathen Maiden', 'Lasnica Fairmont': 'Fairmont Hairpin', 'Predor': 'Tunnel',
    'Most Rocky Creek': 'Rocky Creek Bridge', 'Razgledišče Castle Rock': 'Castle Rock Viewpoint', 'Most Bixby Creek': 'Bixby Creek Bridge',   // (Big Sur)
    'Prvi ovinek': 'First Curve', 'Zanka': 'The Loop', 'Tianmenska jama': 'Tianmen Cave', 'S-zavoji': 'S Curves', 'Pod mostom': 'Under the Bridge', 'Lasnica': 'Hairpin', 'Zadnja ravnina': 'Back Straight', 'Zadnji ovinek': 'Final Corner',
    'Soteska Uncompahgre': 'Uncompahgre Gorge', 'Slap Bear Creek': 'Bear Creek Falls', 'Plaz Mother Cline': 'Mother Cline Slide', 'Galerija Riverside': 'Riverside Snow Shed', 'ZGRMEL SI V PREPAD!': 'OVER THE EDGE!',   // (Uncompahgre)
    'Lesoto': 'Lesotho',   // (Sani Pass: the top; Mkhomazana, Drakensberg and Twelve Apostles stay as they are)
    'Prelaz Katu-Jaryk': 'Katu-Yaryk Pass', 'Sedem serpentin': 'Seven Hairpins', 'Prečka nad Čulišmanom': 'Traverse above the Chulyshman', 'Dolina Čulišmana': 'Chulyshman Valley',   // (Katu-Jaryk: the HUD, the flyover)
    'Postajališče': 'Turnout',   // (Palomar Mountain: the turnout; Serpentina N and the heights by the rules of Lang.place)
    'Razgledišče': 'Viewpoint', 'Cestninska postaja': 'Toll Plaza',   // (the viewpoints and the toll plaza above Hout Bay; the viewpoint of Mulholland Highway)
    'Dolina Rock Creek': 'Rock Creek Valley', 'Vrh serpentin': 'Top of the Switchbacks',   // (Beartooth: Serpentina N and the heights by the rules of Lang.place)
    'Serpentine': 'Switchbacks', 'Žičnica': 'Chairlift', 'Do žičnice': 'To the chairlift',   // (Mount Baldy: the hairpins and the chairlift at the top on the HUD, the results of an escape)
    'Mirante': 'Viewpoint', 'Cascata Rio do Rastro': 'Rio do Rastro Falls', 'Alto da Serra': 'Top of the Serra',   // (Serra do Rio do Rastro)
    'Konec asfalta': 'Pavement Ends', 'Konec makadama': 'Back on Asphalt',   // (the Moki Dugway; Razgledisce is in the dictionary already, from the Mulholland Highway)
    'Plaža Newcastle': 'Newcastle Beach',   // (Newcastle: the turns are numbers)
    'Vodni stolp': 'Water Tower', 'Viadukt': 'Viaduct', 'Most čez South Esk': 'South Esk Bridge', 'Nivojski prehod': 'Level Crossing', 'Ravnina pri strojarni': 'Tannery Straight',
    'Ovinek pri strojarni': 'Tannery Corner', 'Dolgi most': 'Long Bridge', 'Leteča milja': 'Flying Mile',   // (Longford: the HUD)
    'Krožišče': 'Roundabout', 'Zbiljski gaj': 'Zbilje Grove', 'Zbiljsko jezero': 'Lake Zbilje', 'Most čez Savo': 'Sava Bridge', 'Smledniški hrib': 'Smlednik Hill', 'Stari grad': 'Old Castle',   // (Medvode: the HUD; the streets and the villages keep their names)
    /* ---- the run from the police (Vršič): the checkpoint, the hideout, the HUD, the rap sheet, the call signs on the radio; the screen to turn the phone ---- */
    'Kamera »{0}« je za pokončni položaj.': 'The camera “{0}” is for holding the phone upright.', 'Kamera »{0}« je za ležeči položaj.': 'The camera “{0}” is for holding the phone sideways.',
    'Lahko pa igraš pokončno s kamero za avtom.': 'Or play upright with the chase camera.', 'Lahko pa igraš ležeče z izometrično kamero.': 'Or play sideways with the isometric camera.',
    'Igraj pokončno': 'Play upright', 'Igraj ležeče': 'Play sideways', ' · policijski radio: {0} ({1})': ' · police radio: {0} ({1})',
    ' · policijski radio: ni glasu za slovenščino, govori angleško': ' · police radio: no Slovenian voice, it speaks English',
    'Misija: pripelji avto do garaže na vrhu Vršiča (desno ob cesti, takoj za prelazom).': 'Mission: get the car into the garage at the top of the pass (on the right of the road, just past the summit).',
    ' Povoženi pešci: {0}, kolesarji: {1}': ' People run over: {0}, cyclists: {1}', 'Misija opravljena!': 'Mission accomplished!', 'Aretiran na kontroli': 'Arrested at the checkpoint',
    'Skril si se v garažo na vrhu Vršiča v {0}': 'You hid in the garage at the top of the pass in {0}',
    'Brez dokumentov si parkiral ob cesti in s policistom odšel na postajo ({0}).': 'With no papers you parked at the roadside and went to the police station with the officer ({0}).',
    'prehitra vožnja v naselju {0}': 'speeding in the village {0}', 'vožnja po pločniku {0}': 'driving on the pavement {0}', 'trki s prometom {0}×': 'crashes into the traffic {0}×',
    'povoženi pešci in kolesarji {0}×': 'people on foot and cyclists run over {0}×', 'zbiti policisti na motorju {0}×': 'police motorcyclists knocked off {0}×',
    'brez dokumentov, aretiran': 'no papers, arrested', 'zbil si policista in pobegnil': 'you knocked the officer down and fled', 'nisi ustavil, pobegnil': 'you did not stop, fled',
    'brez dokumentov, pobegnil': 'no papers, fled', 'ustavil, nato pobegnil': 'you stopped, then fled',
    '{0}× so izgubili sled<br>najdlje {1} izven pogleda': 'they lost you {0}×<br>at most {1} out of sight', 'nikoli jim nisi ušel izpred oči': 'they never lost sight of you',
    ' (patrulje na hlodih: {0}×)': ' (patrol cars on the logs: {0}×)', 'Kartoteka': 'Rap sheet', 'Kontrola prometa': 'Traffic checkpoint', 'Prekrški': 'Offences',
    'Zapore / trakovi za tabo': 'Roadblocks / strips behind you', 'Skrivanje': 'Hiding', 'Helikopter nad tabo': 'Helicopter above you', 'Zasede': 'Ambushes', 'Pasti s hlodi': 'Log traps',
    'Škoda': 'Damage', 'super težka': 'super hard',
    'Težavnost: {0} (super težka je samo za beg pred policijo; spremeniš v Nastavitvah)': 'Difficulty: {0} (super hard is for the police chase only; change it in the Settings)',
    'POVOZIL SI PEŠCA!': 'YOU RAN OVER SOMEONE ON FOOT!', 'POVOZIL SI KOLESARJA!': 'YOU RAN OVER A CYCLIST!', 'TEKMEC JE POVOZIL PEŠCA': 'YOUR RIVAL RAN OVER SOMEONE ON FOOT',
    'TEKMEC JE POVOZIL KOLESARJA': 'YOUR RIVAL RAN OVER A CYCLIST', 'ZBIL SI POLICISTA!': 'YOU KNOCKED DOWN A POLICEMAN!', 'TEŽKA ZAPORA NAPREJ!': 'HEAVY ROADBLOCK AHEAD!',
    'HELIKOPTER!': 'HELICOPTER!', 'ZASEDA!': 'AMBUSH!', 'NEOZNAČENA PATRULJA!': 'UNMARKED POLICE CAR!', 'IZGUBILI SO SLED!': 'THEY LOST YOU!', 'SPET TE VIDIJO!': 'THEY HAVE SEEN YOU AGAIN!',
    'HLODI NA CESTI!': 'LOGS ON THE ROAD!', 'IZGUBILI SO SLED': 'THEY LOST YOU', 'SKRIVANJE': 'HIDING', 'HELIKOPTER NAD TABO': 'HELICOPTER ABOVE YOU', 'VOZI PROTI VRŠIČU': 'DRIVE UP TO THE PASS',
    'MISIJA OPRAVLJENA!': 'MISSION ACCOMPLISHED!', 'ARETIRAN!': 'ARRESTED!', 'KONTROLA PROMETA · {0} m': 'TRAFFIC CHECKPOINT · {0} m', 'POLICIJSKA KONTROLA': 'POLICE CHECKPOINT',
    'Ustavi pri policistu (ali pobegni)': 'Stop by the officer (or flee)', 'Policist prihaja k oknu (ali pobegni)': 'The officer is coming to your window (or flee)',
    'Policist hoče dokumente (ali pobegni)': 'The officer wants your papers (or flee)', 'ZAPELJI OB ROB VOZIŠČA': 'PULL OVER TO THE ROADSIDE', 'Parkiraj v označeno polje': 'Park in the marked box',
    ' (ali pobegni)': ' (or flee)', 'Greš s policistom na postajo': 'You go to the station with the officer', 'SKRIVALIŠČE · {0} m': 'HIDEOUT · {0} m',
    'Garaža desno ob cesti: zapelji noter': 'The garage on the right of the road: drive in', 'Garaža levo ob cesti: zapelji noter': 'The garage on the left of the road: drive in',
    'Super težka': 'Super hard', 'Beg pred policijo: najhujši pregon; dirke kot Težka': 'The police chase: the toughest pursuit; races as Hard', 'MOTORIST {0}': 'BIKE {0}', 'CIVILNA {0}': 'UNMARKED {0}', 'KOMBI': 'VAN', 'POLICIST': 'OFFICER',
    /* ---- the vehicle fleet (js/cars): the car screen, a destroyed car, a wheel off, retiring (Odstopi), the rivals of a championship ---- */
    'Motor zadaj': 'Rear-engined', 'Izberi': 'Choose', 'Izberi avto': 'Choose a car', 'Kategorije vozil': 'Vehicle categories', 'Vozila v kategoriji': 'Vehicles in the category',
    'VOZILO UNIČENO': 'VEHICLE DESTROYED', 'Odstopi': 'Retire', 'Odstop': 'Retired', 'odstop': 'retired', 'Ogled vozila': 'View the car',
    'Odstop po {0} km': 'Retired after {0} km', 'Odstop v {0} krogu': 'Retired on the {0} lap', ' Brez nagrade.': ' No prize money.',
    ' {0}: brez točk, skupaj {1} in {2} mesto': ' {0}: no points, {1} in total and {2} place', ' in še {0}': ' and {0} more', 'različni avti': 'various cars', ' · tekmeci: {0}': ' · rivals: {0}',
    '\u21ba Namesti kolo': '\u21ba Fit a wheel', 'KOLO JE ODPADLO!': 'WHEEL OFF!', 'Izgubil si kolo: v boksih ti namestijo novo.': 'You lost a wheel: the crew fits a new one in the pits.',
    'Izgubil si kolo: tapni Namesti kolo (6 s) ali vozi naprej na treh.': 'You lost a wheel: tap Fit a wheel (6 s) or drive on, on three.', 'NOVO KOLO \u00b7 {0} s': 'NEW WHEEL \u00b7 {0} s',
    'ODSTOP': 'OUT', 'TEKMEC JE ODSTOPIL': 'RIVAL RETIRED', ' Stalni tekmec {0}: odstop (skupaj ti {1}, tekmec {2}).': ' Your rival {0}: retired (overall you {1}, rival {2}).',
    'KOLO JE ODPADLO': 'WHEEL OFF', 'Res odstopiš?': 'Really retire?', 'Tapni še enkrat, če res odstopiš: dirka je zate končana.': 'Tap again if you really want to retire: the race is over for you.',
    // the categories (Core.CATS; Dirkalni is above: Racing)
    'Mali avti': 'Small cars', 'Športni': 'Sports cars', 'Superšportni': 'Supercars', 'Klasika': 'Classics', 'Reli': 'Rally', 'Terenski': 'Off-road', 'Tovornjaki': 'Trucks', 'Električni': 'Electric', 'Posebni': 'Specials',
    // the descriptions of the vehicles (def.desc in js/cars; their names stay as they are)
    'Italijanski mestni malček iz 60-ih, predelan za dirke: pokrov motorja vedno priprt.': 'A tiny Italian city car from the 60s, tuned for racing: its engine lid always propped open.',
    'Japonski žepni hot hatch iz 90-ih: škatlast, lahek in živahen, s strešnim spojlerjem.': 'A Japanese pocket hot hatch from the 90s: boxy, light and lively, with a roof spoiler.',
    'Oglat hot hatch iz 80-ih: štirje okrogli žarometi, rdeča črta na odbijačih in pragovih.': 'A square-cut 80s hot hatch: four round headlamps, a red stripe along the bumpers and sills.',
    'Retro električni mestni avto z LED pasovi: tih, takoj pospeši, a je težak.': 'A retro electric city car with LED strips: silent and quick off the mark, but heavy.',
    'Japonski kupe z dvojnim turbo rotacijskim motorjem, dvižnimi žarometi in račjim repom.': 'A Japanese coupé with a twin-turbo rotary engine, pop-up headlamps and a ducktail.',
    'Športni kupe z motorjem zadaj: okrogla žarometa, poševna zadnjica in kitov rep.': 'A rear-engined sports coupé: round headlamps, a sloping tail and a whale-tail spoiler.',
    'Gran turismo z V12 spredaj: dolg pokrov motorja, hiter in miren na dolgih ravninah.': 'A front-engined V12 grand tourer: a long bonnet, fast and calm on long straights.',
    'Lahek roadster iz leta 1990 z dvižnimi žarometi, odprto streho in varnostnim lokom.': 'A light roadster from 1990 with pop-up headlamps, an open top and a roll hoop.',
    'Klinast superšportnik iz 80-ih s škarjastimi vrati, dovodi NACA in ogromnim krilom.': 'An 80s wedge-shaped supercar with scissor doors, NACA ducts and a huge wing.',
    'Hibridni hiperšportnik: izpuha na vrhu, nizka kabina, krila ga držijo ob cesti.': 'A hybrid hypercar: exhausts on top, a low cabin, wings that hold it to the road.',
    'Sodoben superšportnik z V10 na sredini in ostrimi šesterokotnimi linijami.': 'A modern mid-engined V10 supercar with sharp hexagonal lines.',
    'Britanski GT iz 60-ih: dolg pokrov motorja, ovalna maska in žična platišča.': 'A British GT from the 60s: a long bonnet, an oval grille and wire wheels.',
    'Ameriški roadster iz 60-ih z velikim V8, stranskimi izpuhi in razširjenimi blatniki.': 'An American roadster from the 60s with a big V8, side exhausts and flared wheel arches.',
    'Dirkalnik za veliko nagrado iz 30-ih: ovalna maska, žična kolesa in čolnast rep.': 'A Grand Prix car from the 30s: an oval grille, wire wheels and a boat tail.',
    'Relijski dirkač za svetovno prvenstvo: široki blatniki, veliko krilo, zajemalka na strehi.': 'A world championship rally car: wide arches, a big wing, a scoop on the roof.',
    'Relijska pošast skupine B iz leta 1985: kratka medosna razdalja in ogromna krila.': 'A Group B rally monster from 1985: a short wheelbase and huge wings.',
    'Puščavski buggy za maratonske relije: cevni okvir, rezervni kolesi in dihalka.': 'A desert buggy for marathon rallies: a tube frame, two spare wheels and a snorkel.',
    'Škatlast luksuzni terenec z rezervnim kolesom na zadnjih vratih in strešnim nosilcem.': 'A boxy luxury off-roader with a spare wheel on the tailgate and a roof rack.',
    'Puščavski skakač z motorjem zadaj: dolg hod vzmetenja, zunanja kletka in luči na strehi.': 'A rear-engined desert jumper: long-travel suspension, an outside roll cage and lamps on the roof.',
    'Dirkalni poltovornjak za kratke terenske steze z velikim krilom na kesonu.': 'A short-course off-road racing pickup with a big wing over its load bed.',
    'Turistični dirkalnik: široki blatniki, spojler spredaj in krilo zadaj.': 'A touring car: wide arches, a front spoiler and a rear wing.',
    'Dirkalnik GT z dolgim pokrovom motorja, velikim krilom in difuzorjem.': 'A GT racer with a long bonnet, a big wing and a diffuser.',
    'Ameriški dirkalnik za ovale z velikimi številkami in mrežami na oknih.': 'An American oval racer with big numbers and window nets.',
    'Cigarast dirkalnik formule iz zgodnjih 60-ih: odprta kolesa in izpušne cevi.': 'A cigar-shaped formula car from the early 60s: open wheels and exhaust stacks.',
    'Dirkalni kart: voznik na očeh, stranska oklepa in sprednji spojler.': 'A racing kart: the driver in plain view, side pods and a front spoiler.',
    'Odprt dirkalnik iz leta 1970 z velikim motorjem in visokim krilom na nosilcih.': 'An open sports racer from 1970 with a big engine and a high wing on struts.',
    'Dirkalni tovornjak: kabina nad motorjem, strešni deflektor in omejilnik pri 160 km/h.': 'A racing truck: the cab over the engine, a roof deflector and a limiter at 160 km/h.',
    'Puščavski relijski tovornjak s kabino za motorjem, velikimi kolesi in rezervnimi kolesi.': 'A desert rally truck with the cab behind the engine, big wheels and spare wheels.',
    'Dirkalni kombi iz 80-ih in 90-ih z dirkalnim motorjem na sredini.': 'A racing van from the 80s and 90s with a race engine in the middle.',
    'Raztegnjena limuzina z zastavicama na blatnikih in obilo kroma.': 'A stretched limousine with two flags on the front wings and plenty of chrome.',
    'Pošastni tovornjak: lupina poltovornjaka na cevni šasiji in ogromna kolesa.': 'A monster truck: a pickup body on a tube chassis and huge wheels.',
    'Lahek trivratni hatchback z velikimi mandljastimi žarometi, živahen v ovinkih.': 'A light three-door hatchback with big almond-shaped headlamps, lively in the corners.',
    'Kabriolet družine LEV: kovinska streha zložena v prtljažnik, dva sedeža in roll bar.': 'The LEV family\u2019s convertible: a metal roof folded into the boot, two seats and a roll bar.',
    /* ---- the menu (js/menu.js is in English only): its settings in the page ---- */
    'Uvod pred dirko (globus in helikopter)': 'Race intro (globe and helicopter)', 'Polni': 'Full', 'Kratki': 'Short', 'Glasba v uvodu': 'Music in the intro',
  };
  // words that read the same in both languages (the page check in tests/lang.test.js lets them be)
  const SAME = new Set(['APEX', 'RACING', 'APEX RACING', 'TV', 'DRS', 'KM/H', 'Circuit Superstars', 'Retro', 'Filter', 'Start', 'Slick', 'Drift', 'Slovenščina', 'English', 'RADIO', '2 m', '5 m', '7 m', '10 m', '15 m', '20 m']);

  const has = Object.prototype.hasOwnProperty;
  let cur = 'sl', REV = null;   // (REV: English -> Slovenian, for the page: a text the game wrote in English goes back)
  function tr(s, ...a) {
    const t = cur === 'en' && has.call(EN, s) ? EN[s] : s;
    return a.length ? t.replace(/\{(\d+)\}/g, (m, k) => (a[+k] != null ? String(a[+k]) : '')) : t;
  }
  // a definition's own English (a track, a championship, a famous jump: o.en = { name, desc, ... }), else its Slovenian
  const of = (o, k) => (o ? (cur === 'en' && o.en && o.en[k] != null ? o.en[k] : o[k]) : '');
  // numbers: thousands (3.048 / 3,048), a decimal point (1,9 / 1.9), money (12.300 € / €12,300), places (3. / 3rd)
  const thou = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, cur === 'en' ? ',' : '.');
  const dec = (s) => (cur === 'en' ? String(s) : String(s).replace('.', ','));
  const eur = (x) => (cur === 'en' ? '€' + thou(x) : thou(x) + '\u00a0€');
  const ord = (n) => { if (cur !== 'en') return n + '.'; const a = n % 100, b = n % 10; return n + (a >= 11 && a <= 13 ? 'th' : b === 1 ? 'st' : b === 2 ? 'nd' : b === 3 ? 'rd' : 'th'); };
  // a place name on the HUD: the numbered turns and hairpins, the heights on them (Serpentina 4 · 1.060 m -> Hairpin 4 · 1,060 m), a few known names
  function place(n) {
    if (cur !== 'en') return n;
    return String(n).split(' · ').map(p => has.call(EN, p) ? EN[p] : p.replace(/^Serpentina (\d+)$/, 'Hairpin $1').replace(/^Zavoj (\d+)$/, 'Turn $1').replace(/^Ovinek (\d+)$/, 'Bend $1').replace(/\b(\d{1,3})\.(\d{3}) m\b/g, '$1,$2 m')).join(' · ');
  }
  // the page as written in index.html: its texts and labels in the chosen language. Each node keeps its Slovenian text (a WeakMap), so a
  // text changed by the game in the meantime is not touched; a text the game wrote in the other language is turned by the dictionary
  const orig = new WeakMap();
  function turn(sl) { return cur === 'en' ? EN[sl] : sl; }
  function srcOf(t, o) {   // the Slovenian text behind what is on the page now (null: not one of the dictionary's)
    if (o && o.set === t) return o.sl;
    if (has.call(EN, t)) return t;
    if (!REV) { REV = {}; for (const k in EN) { const v = EN[k]; REV[v] = has.call(REV, v) ? null : k; } }
    return has.call(REV, t) ? REV[t] : null;
  }
  function apply(root) {
    root = root || document.body;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const p = n.parentElement; if (p && (p.tagName === 'SCRIPT' || p.tagName === 'STYLE')) continue;
      const v = n.nodeValue, t = v.trim(); if (!t) continue;
      const sl = srcOf(t, orig.get(n)); if (sl == null) continue;
      const out = turn(sl); orig.set(n, { sl, set: out });
      if (out !== t) n.nodeValue = v.replace(t, out);
    }
    const els = root.querySelectorAll('[aria-label], [placeholder], [title]');
    for (const el of [root].concat([...els])) {
      if (!el.getAttribute) continue;
      let m = orig.get(el);
      for (const a of ['aria-label', 'placeholder', 'title']) {
        const t = el.getAttribute(a); if (!t) continue;
        const sl = srcOf(t, m && m[a]); if (sl == null) continue;
        const out = turn(sl); if (!m) orig.set(el, m = {}); m[a] = { sl, set: out };
        if (out !== t) el.setAttribute(a, out);
      }
    }
  }
  function set(lang) {
    cur = lang === 'en' ? 'en' : 'sl';
    if (typeof document !== 'undefined') document.documentElement.lang = cur;
  }
  const api = { tr, of, thou, dec, eur, ord, place, apply, set, EN, SAME, get cur() { return cur; }, get locale() { return cur === 'en' ? 'en-GB' : 'sl-SI'; } };
  if (typeof window !== 'undefined') window.Lang = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
