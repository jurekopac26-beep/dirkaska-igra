/* The settings of the new screen (maketa): the categories (the tabs at the top) and the settings in each, one under the other, each with
   the picture over it (anim: its SetAnim scene). story: what the picture shows for that option (the storyboard's captions). */
window.SETTINGS_DATA = (function () {
  const OFFON = (a, b) => [{ v: 0, l: 'Izklop', story: a }, { v: 1, l: 'Vklop', story: b }];
  return {
    cats: [
      { id: 'pavza', name: 'Pavza', icon: 'pause', pauseOnly: true, items: [
        { key: 'pitCmp', anim: 'pitCmp', name: 'Gume v boksih', when: 'dirka z boksi', opts: [
          { v: 'auto', l: 'Samodejno', story: 'Mehanik (A) sam izbere gume za postanek; barva se menja.' },
          { v: 'S', l: 'Mehke', story: 'Rdeča guma: najhitrejši krog, a se hitro obrabi.' },
          { v: 'M', l: 'Srednje', story: 'Rumena guma: vmes, hitrost in obraba.' },
          { v: 'H', l: 'Trde', story: 'Bela guma: počasnejši krog, obraba počasna.' }] }
      ] },
      { id: 'voznja', name: 'Vožnja', icon: 'wheel', items: [
        { key: 'control', anim: 'control', name: 'Upravljanje', opts: [
          { v: 'buttons', l: 'Tipke', story: 'Levi palec tapka puščici ◀ ▶, desni drži plin; avto zavija v ritmu tapkanja.' },
          { v: 'wheel', l: 'Volan', story: 'Levi palec vrti volan na zaslonu; bolj ko ga zavrti, bolj avto zavije.' },
          { v: 'tilt', l: 'Nagib', story: 'Ves telefon se nagiba kot volan; leva polovica zaslona je zavora, desna plin.' }] },
        { key: 'tiltSens', anim: 'tiltSens', name: 'Občutljivost nagiba', only: { control: 'tilt' }, range: { min: 10, max: 40, step: 1, unit: '°', story: [10, 22, 40] },
          story: 'Pahljača pokaže, za koliko stopinj nagneš telefon do polnega zavoja. Malo stopinj: že rahel nagib zavije do konca (zlati volan, 100 %).' },
        { key: 'tiltInvert', anim: 'tiltInvert', name: 'Smer nagiba', only: { control: 'tilt' }, extra: 'calibrate', storyT: 1.2, opts: [
          { v: 0, l: 'Običajna', story: 'Telefon nagneš desno (bela puščica) in avto zavije desno (zlata puščica). Kljukica: v isto smer.' },
          { v: 1, l: 'Obrnjena', story: 'Telefon nagneš desno, avto zavije levo. Puščici kažeta narazen.' }] },
        { key: 'autoGas', anim: 'autoGas', name: 'Samodejni plin', opts: OFFON(
          'Palec mora držati PLIN; ko ga spusti, avto upočasni (merilnik pade).',
          'PLIN z zlatim »A« sveti sam, avto vozi naprej; palec le pritisne ZAVORO.') },
        { key: 'assist', anim: 'assist', name: 'Pomoč pri driftu', storyT: 5.6, storyTp: 3.3, opts: [
          { v: 0, l: 'Nizka', story: 'Avto zanese daleč ven do roba, se po ovinku še ziba, veliko dima: drift loviš sam.' },
          { v: 1, l: 'Srednja', story: 'Zmeren drift, nekoliko širša linija, en zamah repa na izhodu.' },
          { v: 2, l: 'Visoka', story: 'Avto sam drži lep, tesen drift skozi lasnico in se takoj poravna.' }] },
        { key: 'kontrole', anim: 'kontrole', name: 'Kontrole', link: 'Tipke, plošček in volan', story: 'Tipkovnica, plošček in volan se izmenično prižigajo: tu jim določiš tipke.' }
      ] },
      { id: 'kamera', name: 'Kamera', icon: 'camera', items: [
        { key: 'camera', anim: 'camera', name: 'Kamera', opts: [
          { v: 'iso', l: 'Izometrična', sub: 'telefon ležeče', story: 'Telefon leži. Pogled od zgoraj, sever vedno gor: proga stoji, avto se obrača po njej.' },
          { v: 'chase', l: 'Za avtom', sub: 'telefon pokonci', story: 'Telefon se obrne pokonci. Kamera je za avtom: avto vedno kaže navzgor, proga se vrti okoli njega.' }] },
        { key: 'zoom', anim: 'zoom', name: 'Oddaljenost', opts: [
          { v: 1.1, l: 'Blizu', story: 'Kamera (levo) je blizu avta: avto je velik, ceste vidiš malo.' },
          { v: 1.4, l: 'Srednje', story: 'Kamera se odmakne: avto manjši, vidiš več okolice.' },
          { v: 1.7, l: 'Daleč', story: 'Kamera daleč: avto majhen, vidiš največ proge pred seboj.' }] },
        { key: 'carLow', anim: 'carLow', name: 'Položaj avta', hint: 'nižje v sliki', opts: [
          { v: 0, l: 'Običajno', story: 'Avto je tam, kjer je bil vedno.' },
          { v: 1, l: '2 m', story: 'Avto se spusti malo niže (črtkani obris je običajno mesto).' },
          { v: 2, l: '5 m', story: 'Niže: pred avtom je več ceste.' },
          { v: 3, l: '7 m', story: 'Še niže: ovinek pred tabo vidiš prej.' },
          { v: 4, l: '10 m', story: 'Čisto spodaj: največ ceste pred avtom.' }] }
      ] },
      { id: 'prikaz', name: 'Prikaz', icon: 'hud', items: [
        { key: 'line', anim: 'line', name: 'Idealna linija', opts: OFFON(
          'Cesta je prazna, avto vozi sam po svoje.',
          'Pred avtom se nariše trak: zeleno plin, rdeče zaviranje pred ovinkom, rumeno skozi ovinek.') },
        { key: 'notes', anim: 'notes', name: 'Opozorila za ovinke', opts: OFFON(
          'Ovinki pridejo brez opozorila.',
          'Pred vsakim ovinkom se zgoraj prikaže tabla s puščico: zelena hiter, rumena srednji, rdeča lasnica.') },
        { key: 'pkNotes', anim: 'pkNotes', name: 'Opozorila na ovinke', hint: 'Pikes Peak', storyT: 1.3, opts: OFFON(
          'Na gorski cesti ni opozoril.',
          'Pod uro se pokaže ploščica z oceno ovinka (LEVI 4, DESNA LASNICA) in razdaljo, ki se odšteva.') },
        { key: 'ghost', anim: 'ghost', name: 'Duh najboljše vožnje', opts: OFFON(
          'Na progi je samo tvoj avto.',
          'Prosojen moder avto (tvoja najboljša vožnja) vozi pred tabo; zgoraj zaostanek za njim.') },
        { key: 'tower', anim: 'tower', name: 'Časovna tabela', opts: OFFON(
          'Ob strani ni razvrstitve.',
          'Levo je razvrstitev s presledki kot na televiziji; ko koga prehitiš, vrstici zamenjata mesti.') }
      ] },
      { id: 'dirka', name: 'Dirka', icon: 'flag', items: [
        { key: 'difficulty', anim: 'difficulty', name: 'Težavnost', opts: [
          { v: 0, l: 'Lahka', story: 'Tekmeci zaostajajo za tvojim (rdečim) avtom; ena črtica.' },
          { v: 1, l: 'Srednja', story: 'Tekmeci vozijo ob tebi, boj za mesto; dve črtici.' },
          { v: 2, l: 'Težka', story: 'Tekmeci ti uidejo naprej; tri črtice.' },
          { v: 3, l: 'Super težka', story: 'Še policija ti je za petami (beg pred policijo); štiri rdeče črtice.' }] },
        { key: 'damage', anim: 'damage', name: 'Poškodbe avtov', storyT: 2.7, opts: [
          { v: 0, l: 'Izklop', story: 'Avto se odbije od zidu in ostane cel; hitrost ista.' },
          { v: 1, l: 'Samo videz', story: 'Avto se zmečka in odleti kos, ikona pordeči, a hitrost ostane ista.' },
          { v: 2, l: 'Vklop', story: 'Avto se zmečka, kadi se in vozi počasneje (hitrost pade).' }] },
        { key: 'faults', anim: 'faults', name: 'Okvare', hint: 'guma, zavore, motor', storyT: 3.6, opts: OFFON(
          'Avto vozi brez težav.',
          'Guma se izprazni (PREDRTA GUMA), zavore se razžarijo (VROČE ZAVORE), iz motorja se kadi (VROČ MOTOR).') },
        { key: 'radio', anim: 'radio', name: 'Radio ekipe', opts: OFFON(
          'Slušalke so tiho, ni sporočil.',
          'Inženir sporoča razlike, postanek v boksih in vreme (rumena oznaka RADIO).') },
        { key: 'intro', anim: 'intro', name: 'Uvod pred dirko', opts: [
          { v: 0, l: 'Polni', story: 'Globus z letom do proge, helikopter nad progo, nato start (dolg trak spodaj).' },
          { v: 1, l: 'Kratki', story: 'Samo helikopter nad progo, nato start.' },
          { v: 2, l: 'Brez', story: 'Takoj luči in start.' }] },
        { key: 'pkFly', anim: 'pkFly', name: 'Prelet proge pred startom', hint: 'Pikes Peak, Katu-Jaryk', opts: OFFON(
          'Takoj na start gorske ceste.',
          'Kamera najprej preleti vso gorsko cesto do vrha (PRELET PROGE), nato start.') },
        { key: 'hlv', anim: 'hlv', name: 'Video najboljšega trenutka', hint: 'po dirki', opts: OFFON(
          'Po cilju takoj rezultati.',
          'Po cilju se predvaja posnetek najboljšega trenutka (prehitevanje), nato rezultati.') }
      ] },
      { id: 'grafika', name: 'Grafika', icon: 'image', items: [
        { key: 'quality', anim: 'quality', name: 'Grafika', opts: [
          { v: 'retro', l: 'Retro', story: 'Velike kocke pik kot v starih igrah.' },
          { v: 'normal', l: 'Normalno', story: 'Ostra slika, preproste ostre sence.' },
          { v: 'high', l: 'Visoko', story: 'Mehke sence, sončni sij, oblaki, mehak rob slike (miniatura).' }] },
        { key: 'detail', anim: 'detail', name: 'Podrobnosti', opts: [
          { v: 'low', l: 'Nizka', story: 'Ob progi le nekaj dreves, daleč nič.' },
          { v: 'med', l: 'Srednja', story: 'Več dreves, gledalci, nekaj predmetov.' },
          { v: 'high', l: 'Visoka', story: 'Gozd do obzorja, polna tribuna, zastave, gume, skale.' },
          { v: 'auto', l: 'Samodejno', story: 'Merilnik telefona (A) sam izbira: ko se slika zatika, odvzame podrobnosti.' }] },
        { key: 'shadows', anim: 'shadows', name: 'Sence', opts: OFFON('Avto, drevesa in hiša so brez senc.', 'Vse meče sence na tla.') },
        { key: 'saver', anim: 'saver', name: 'Varčevanje z baterijo', opts: [
          { v: 'off', l: 'Izklop', story: 'Gladka slika (60), baterija pada hitro.' },
          { v: 'auto', l: 'Samodejno', story: 'Ko baterija pade na 20 %, se vklopi varčevanje (list); na polnilcu se izklopi.' },
          { v: 'on', l: 'Vklop', story: 'Slika v korakih (30), baterija pada počasi (list).' }] }
      ] },
      { id: 'zvok', name: 'Zvok', icon: 'sound', items: [
        { key: 'sound', anim: 'sound', name: 'Zvok', opts: OFFON('Zvočnik prečrtan, črta tiha; avto pelje mimo brez zvoka.', 'Zvočnik oddaja valove, motor brni v ritmu.') },
        { key: 'music', anim: 'music', name: 'Glasba v uvodu', opts: OFFON('Uvod je brez glasbe.', 'Iz uvoda (globus) letijo note, izenačevalnik skače.') },
        { key: 'comm', anim: 'comm', name: 'Komentator', hint: 'angleščina', extra: 'voice', opts: OFFON('Mikrofon je prečrtan, ni oblačka.', 'Mikrofon in oblaček z angleškim komentarjem.') },
        { key: 'codrv', anim: 'codrv', name: 'Sovoznik na reliju', hint: 'angleščina', storyT: 1.3, opts: OFFON('Avto drsi po makadamu, sovoznik molči.', 'Sovoznik bere opombe: »Left 4 … Right 2 tightens!«.') },
        { key: 'vibrate', anim: 'vibrate', name: 'Vibracija', storyT: 1.08, opts: OFFON('Ob trku telefon miruje.', 'Ob trku se telefon strese (valovi ob robu).') }
      ] },
      { id: 'splosno', name: 'Splošno', icon: 'cog', items: [
        { key: 'lang', anim: 'lang', name: 'Jezik · Language', opts: [
          { v: 'sl', l: 'Slovenščina', story: 'Napisi v igri so slovenski.' },
          { v: 'en', l: 'English', story: 'Črke se obrnejo kot na letališki tabli: napisi so angleški.' }] },
        { key: 'name', anim: 'name', name: 'Ime voznika', input: true, story: 'Ime, ki ga tipkaš, se sproti izpiše na lestvici.' },
        { key: 'profile', anim: 'profile', name: 'Profil', buttons: ['Izvozi v datoteko', 'Uvozi iz datoteke'], story: 'Datoteka s tvojimi rekordi gre iz telefona v mapo in nazaj.' }
      ] }
    ],
    // the pause's own buttons (the first tab, only during a race)
    pause: [
      { act: 'restart', l: 'Ponovi dirko', icon: 'restart' }, { act: 'photo', l: 'Foto', icon: 'photo' },
      { act: 'car-view', l: 'Ogled vozila', icon: 'car' }, { act: 'cam-next', l: 'Kamera: za avtom', icon: 'camera' },
      { act: 'fullscreen', l: 'Celoten zaslon', icon: 'full' }, { act: 'retire', l: 'Odstopi', icon: 'retire' },
      { act: 'to-title', l: 'Glavni meni', icon: 'home', ghost: true }
    ]
  };
})();
