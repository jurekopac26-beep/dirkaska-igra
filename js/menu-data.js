/* Real Roads Atlas menu: the texts and the per-track map data of the menu (the tracks themselves, the cars, the times and the settings come from the game).
   Made from maketa-menija/data.js; edit here. */
window.MENU = {
 "game": {
  "l1": "REAL ROADS ATLAS",
  "l2": "RACING GAME"
 },
 "modes": [
  {
   "id": "race",
   "name": "Circuit race",
   "sub": "Laps against 12 rivals. Finish as high as you can.",
   "chip": "12 RIVALS",
   "img": "assets/menu/mode-race.webp"
  },
  {
   "id": "chase",
   "name": "Police chase",
   "sub": "The police are on your tail. Shake them off.",
   "chip": "GET AWAY IN 3:00",
   "img": "assets/menu/mode-chase.webp"
  },
  {
   "id": "trial",
   "name": "Time trial",
   "sub": "Alone against the clock and your own ghost.",
   "chip": "GOLD · SILVER · BRONZE",
   "img": "assets/menu/mode-trial.webp"
  }
 ],
 "groups": [
  {
   "id": "circuit",
   "name": "Circuits"
  },
  {
   "id": "road",
   "name": "Open roads"
  },
  {
   "id": "rally",
   "name": "Rally"
  },
  {
   "id": "test",
   "name": "Test"
  }
 ],
 "mapVersions": [
  {
   "n": 1,
   "name": "Flyover"
  },
  {
   "n": 2,
   "name": "Map"
  }
 ],
 "wideMaps": {
  "vrsic": 300,
  "pikes": 300,
  "ouninpohja": 300,
  "riviera": 240,
  "monaco": 240,
  "rbring": 240,
  "suzuka": 240,
  "spa": 240,
  "nring": 240
 },
 "routeMaps": {
  "vrsic": {
   "start": "Kranjska Gora",
   "finish": "Vršič",
   "alt": [
    810,
    1611
   ],
   "hud": [
    [
     0,
     "Kranjska Gora"
    ],
    [
     1700,
     "Lake Jasna"
    ],
    [
     3006,
     "Erika Bridge"
    ],
    [
     6480,
     "Mihov dom"
    ],
    [
     7000,
     "Russian Chapel"
    ],
    [
     8230,
     "Koča na Gozdu"
    ],
    [
     11200,
     "Erjavčeva koča"
    ],
    [
     12150,
     "Vršič Pass"
    ]
   ]
  },
  "pikes": {
   "start": "Crystal Reservoir",
   "finish": "Summit",
   "alt": [
    2862,
    4301
   ],
   "hud": [
    [
     0,
     "Crystal Reservoir"
    ],
    [
     960,
     "Halfway Picnic Grounds"
    ],
    [
     1964,
     "Ski Area"
    ],
    [
     2650,
     "Glen Cove"
    ],
    [
     4000,
     "Devil's Playground"
    ],
    [
     4440,
     "Bottomless Pit"
    ],
    [
     5900,
     "Summit"
    ]
   ]
  },
  "ouninpohja": {
   "start": "Hämepohja",
   "finish": "Flying finish",
   "stage": "SS 2",
   "surface": "Gravel",
   "base": 130,
   "hud": [
    [
     0,
     "Hämepohja"
    ],
    [
     800,
     "Lake Naarajärvi"
    ],
    [
     1640,
     "Ouni"
    ],
    [
     2170,
     "Keltainen talo"
    ],
    [
     2980,
     "Farm Bend"
    ],
    [
     4400,
     "Forest crests"
    ],
    [
     6040,
     "Village"
    ],
    [
     7980,
     "Fast Crest"
    ],
    [
     8700,
     "Kakaristo"
    ],
    [
     9550,
     "Flying finish"
    ]
   ]
  },
  "gora": {
   "start": "Start",
   "finish": "Finish",
   "stage": "SS 1",
   "surface": "Gravel",
   "base": 1485,
   "hud": [
    [
     0,
     "Stage start"
    ],
    [
     545,
     "Split 1"
    ],
    [
     1090,
     "Split 2"
    ],
    [
     1590,
     "Stage finish"
    ]
   ]
  },
  "jezero": {
   "base": 532
  },
  "riviera": {
   "base": 4
  },
  "monaco": {
   "base": 8
  },
  "rbring": {
   "base": 677
  },
  "suzuka": {
   "base": 45
  },
  "spa": {
   "base": 400
  },
  "nring": {
   "base": 616
  }
 },
 "intro": {
  "skip": "Skip",
  "music": "Music",
  "summit": "SUMMIT",
  "top": "HIGHEST POINT",
  "surface": "Asphalt",
  "specs": {
   "lap": "Lap",
   "length": "Length",
   "start": "Start",
   "finish": "Finish",
   "climb": "Climb",
   "top": "Highest",
   "rise": "Rise",
   "grade": "Steepest",
   "corners": "Corners",
   "surface": "Surface",
   "record": "Record"
  }
 },
 "weekend": {
  "kick": "Race weekend",
  "title": "Weekend calendar",
  "mode": "Circuit race",
  "sat": "Saturday",
  "sun": "Sunday",
  "quali": "Qualifying",
  "race": "Race",
  "grid": "Grid",
  "skipped": "Skipped",
  "hint": "Switch Saturday on to fight for pole",
  "onNote": "Saturday's lap sets your place on Sunday's grid.",
  "go": "Race!",
  "goSub": "Start from last place",
  "goQ": "Start qualifying",
  "goQSub": "Saturday first",
  "back": "Back to the tracks",
  "switch": "Saturday's qualifying",
  "track": { "dry": "dry track", "wet": "wet track", "change": "may change" },
  "sky": { "sun": "Sunny", "part": "Mostly sunny", "clear": "Clear", "rain": "Rain", "storm": "Storm", "change": "Changeable" }
 },
 "credits": [
  [
   "Roads, buildings and land",
   "© OpenStreetMap contributors (openstreetmap.org/copyright). The road lines, side streets, buildings, bridges, water and land use of the tracks are made from OpenStreetMap data, available under the Open Database License (ODbL) 1.0 (opendatacommons.org/licenses/odbl/1-0). The data derived from it in the track files is available under the same licence. Partly read through Overture Maps Foundation (overturemaps.org) and Protomaps (protomaps.com)."
  ],
  [
   "Track layouts",
   "Some circuit centre lines: TUMFTM racetrack-database, Technical University of Munich (LGPL-3.0), derived from OpenStreetMap. Layout checks: f1-circuits by Tomislav Bacinger (MIT)."
  ],
  [
   "Heights (Copernicus)",
   "Copernicus DEM GLO-30: produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved."
  ],
  [
   "Heights (other)",
   "Relief de la Wallonie - Modèle Numérique de Terrain (MNT) 2021-2022, © Service public de Wallonie (SPW), CC BY 4.0, via Mapterhorn (mapterhorn.com). ArcticDEM: DEMs provided by the Polar Geospatial Center under NSF-OPP awards 1043681, 1559691 and 1542736; © Maxar; CC BY 4.0. Seabed: ETOPO (NOAA, public domain) and GLOBathy (CC BY 4.0)."
  ],
  [
   "Trees",
   "High Resolution Canopy Height Maps, Meta and World Resources Institute (2024), CC BY 4.0."
  ],
  [
   "The Earth",
   "NASA Blue Marble, NASA Earth Observatory. Public domain."
  ],
  [
   "Land cover",
   "© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by ESA WorldCover consortium. Licence: CC BY 4.0 (creativecommons.org/licenses/by/4.0)."
  ],
  [
   "Heights",
   "Terrain Tiles by Mapzen, made from: SRTM and 3DEP (NASA, USGS), GMTED2010 and ETOPO1, public domain; EU-DEM: Produced using Copernicus data and information funded by the European Union - EU-DEM layers; © offene Daten Österreichs - Digitales Geländemodell (DGM) Österreich, CC BY 4.0."
  ],
  [
   "Countries",
   "Outlines and names: Natural Earth. Public domain."
  ],
  [
   "Typeface",
   "Roboto, © The Roboto Project Authors (github.com/googlefonts/roboto-3-classic), Apache License 2.0 (apache.org/licenses/LICENSE-2.0)."
  ],
  [
   "Online play",
   "PeerJS 1.5.5 (peerjs.com), by Michelle Bu, Eric Zhang and contributors, MIT licence. Players find each other through the free public PeerJS server."
  ],
  [
   "Music and sound",
   "Original, made for this game."
  ],
  [
   "Names",
   "Only place names are used. Cars, drivers, signs and fans are fictional and not connected to any real brand, company, event or person."
  ]
 ],
 "creditLine": "NASA · © ESA WorldCover 2021, Copernicus · EU-DEM, USGS · Natural Earth"
};
