# Livingstone, Zambija (osnutek, v delu)

Proga #2 s seznama `docs/proge-z-znamenitostjo.md`. Znamenitost vrste »druga«: star jekleni ločni most čez sotesko Zambezija in slapovi ob njem. Model mostu iz Blenderja (`tools/znamenitost/`, vzorec Luanda #711). Brez napisov, tabel, logotipov, kipov.

## Podatki (OSM, 15. 11. 2026, `tools/livingstone/config.json`)
- Cesta: glavna cesta iz Livingstona proti jugu (OSM pot 23591193, ref T1, brez imena), ~5,96 km od mesta do zambijskega konca mostu. Ovinki so blagi; zadnjih ~1,2 km (od vhoda v park in mejnega prehoda do mostu) zavije proti zahodu in se spusti k soteski.
- Most: OSM pot 22083857 (`bridge=yes`, ~202 m), obris mostu 1425593384. Slapovi: OSM `natural=cliff` (Eastern Cataract 584420041, Rainbow Falls 585168375, Main Falls 579843539 …), od ceste ~100–300 m.
- Osnutek poti: ~4,5 km od južnega roba Livingstona do mostu.

## Odprto (za naslednjo sejo)
1. **Znamenitost pri 25–75 % dirke in ~40–60 m od ceste**: most je na koncu zambijske ceste (cesta pelje nanj). Možnosti: (a) cilj pred mejnim prehodom, most in slapovi vidni levo/desno v zadnjem delu (preveri razdalje in vidnost s kamere za avtom); (b) proga čez most v Zimbabve (Livingstone Way, ~1,4 km do ~-17.924, 25.844), most pri ~60 % — a proga bi tekla čez dve državi in mejo; ne izbiraj sam, vprašaj (stran Odločitve).
2. Ovinkavost: cesta je pretežno blaga; preveri merilo 1.0 (ovinkasto, malo ravnin) in izletno cono, preden se proga začne graditi.
3. Nato: `python3 -I tools/proga-podatki.py tools/livingstone/config.json RAW route data`, `tools/znamenitost/livingstone.py` (most: lok, nosilci, krov, ograja; daljna raven), svet, `js/lang.js`, slike menija, test proge.
