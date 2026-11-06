# Killar, Indija (dirka, kronometer, promet)

[← Vse proge](../../README.md#proge) · proga `killar` (`js/tracks/killar.js`)

Cesta iz vasi Killar v dolini Pangi (Himačal Pradeš, Indija) ob reki Chenab proti Kishtwarju: en sam pas makadama na polici, vklesani v strmo pobočje visoko nad reko, skoraj povsod brez ograj. Proga se začne v Killarju (2.402 m), pelje vzdolž pečin nad Chenabom, zavije v stransko dolino Hangrung Nale, jo prečka po mostu in se vrne nad prepad; cilj je 4,4 km od starta (2.412 m). Cesta je skoraj ravna (naklon največ 8,5 %), v merilu igre široka 9 m. Ves odsek je v Himačal Pradešu. Kartica proge je ena, s stikalom **Dirka / Kronometer / Promet**:

- **Dirka**: 21 tekmecev, start v vasi (štartna mreža za črto), ena vožnja vzdolž pečin do cilja. Cesta ima en sam pas, zato stojita stolpca štartne mreže bližje skupaj (kot na Moki Dugway); prehitevanje nad prepadom je tvegano. Po cilju vsak avto zapelje na svoje mesto ob cesti. Kvalifikacij ni (odprta cesta).
- **Kronometer**: sam proti uri, štiri kontrolne točke z vmesnimi časi in višino, lestvica najboljših 10, duh in medalje (zlata 2:01, srebrna 2:07, bronasta 2:17, v dežju 2:14 / 2:21 / 2:31; zlato je čas relijskega avta na avtopilotu).
- **Promet**: dvoboj z enim tekmecem po odprti cesti. V obe smeri vozijo džipi, pickupi in motoristi, nekaj tovornjakov in avtobusov, redko kolesarji.
- **Prepadi brez ograj**: več kot dve tretjini poti je na levi strani prepad proti reki (`def.drops`): rob je tik za ozko bankino, avto, ki zapelje čez, pade (napis ZGRMEL SI V PREPAD!), se vrne na cesto, kjer je zgrmel, in je poškodovan; počasen dotik roba ga le ustavi. Na mostu prepada ni.
- **Makadam**: po vsej dolžini, z oprijemom in fiziko kot na Ouninpohji, za avti se dviga siv rjav prah.
- Med vožnjo se pod uro izpišejo kraji (Killar, Reka Chenab, Hangrung Nala, Cilj · 2.412 m); komentator ima na tej progi svoje stavke ob startu in cilju.
- **Oblika in višine**: sredinska črta je iz OpenStreetMap, zglajena in kjer se ne ujema s terenom premaknjena na pobočje na višino ceste (v povprečju 8,6 m). Višine so iz višinskega modela Copernicus DEM GLO-30, očiščene in z naklonom največ 8,5 %.

Okolica (graditelj Uncompahgra s svojo podobo, `UNK` v `js/world-uncompahgre.js`):

- **Himalaja**: jasno visokogorsko popoldne, sonce z jugozahoda nad Chenabom. Teren je iz pravega višinskega modela (12 m celice), raba tal iz ESA WorldCover: suha olivna in slamnata pobočja, sivo rjav skrilavec in gnajs (brez rdečkastih žil Uncompahgra), melišča. Ob prepadu je polica vrezana globlje v pobočje, pečina pod njo je višja.
- **Gozd**: cedre deodar in borovci (temni, stožčasti), v vlažnejših kotih orehi in topoli (temnejše zeleni od trepetlik); grmičevje, šopi trave, kamenje ob cesti.
- **Vas Killar in kmetije**: hiše po tlorisih iz OpenStreetMap, kamnite ali pobeljene, s temnim lesenim pasom med nadstropji in nizko streho iz barvane pločevine (rdeče, zelene, modre ali sive).
- **Reka in potoki**: Chenab spodaj v dolini, Hangrung Nala pod mostom in Sansari Nala (OpenStreetMap), s tekočo vodo.
- **Živali**: trope modrih ovac (bharal) po skalnih pobočjih in vaške koze; na jasah ob cesti kozorogi, ovce in himalajski črni medved (`js/world-zivali.js`).
- **Cesta**: makadam brez črt, beli smerniki, ob prepadu visoke palice z oranžnim vrhom, rumene puščice v ovinkih, mreža proti padajočemu kamenju pod najvišjimi useki. Table so generične (CHENAB RIVER, HANGRUNG NALA, NARROW ROAD, DRIVE SLOWLY, FALLING ROCK, LANDSLIDE AREA, KISHTWAR 99 KM).
- **Start in cilj**: start z lučmi v vasi (merilna hišica, gledalci, molilne zastavice ob cesti), portali kontrolnih točk z višino, cilj z rjavo tablo KILLAR · PANGI VALLEY in višino. Ime prireditve na transparentu je izmišljeno.
- **Meni**: slika proge (maketa terena, `assets/tracks/killar.webp` in `killar-rain.webp`), zastava Indije, kraj na globusu (start, poravnan na višinski model) in video zavoja (kamera 3: lasnica čez most nad Hangrung Nalo, `assets/maps/corner-killar.webm`). Zemljevida od zgoraj in preleta še ni.
