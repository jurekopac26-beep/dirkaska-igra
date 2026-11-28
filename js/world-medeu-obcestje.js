/* =========================================================================
   WORLD — Medeu, Kazahstan: the roadside (docs/proge/medeu.md, »Obcestje«), on top of the pass's own world (js/world-prelaz.js and
   js/world-medeu.js, PL_LOOK.medeu; its hooks LK.pre and LK.extra wrapped, the base hook's own work done first): the side streets, the
   service roads and drives, the footways, the paths and tracks, the steps and the boardwalks and footbridges of the gorge, from the road out
   to ~60 m (asphalt, paving, gravel, dirt, wood or metal as the map has them; over the verge's ditch a little fill on a culvert); the
   sidewalks beside the road (drawn along the game's own asphalt edge, where the map's lines fall within the road's room); the benches, the
   litter bins, the guideposts and the information boards (blank), the lift gates across two drives and a bicycle stand. Places, kinds,
   widths and surfaces from OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0, read through Overture Maps' OpenStreetMap source, release
   2026-10-21.0; README.md »Zasluge«; the ways' ids in their rows); all generic: no names, letters or signs. Graphics only, into the
   scenery's chunks (no draw call of its own), nothing knockable; no def.zebras, no def.sideRoads (the traffic's and the walkers' AI keep to
   the road as it was); the driving, physics and def.hills untouched. The trees, plants and rocks are kept off the new surfaces only past
   the corner signs', the pennants' and the finish's line (bar + 1.6 m: what stands within it, its colliders too, stays as it was)
   ========================================================================= */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api || !World.api.PL_LOOK) return;
  const API = World.api, LK = API.PL_LOOK.medeu;
  if (!LK) return;
  const { box, cyl, caGround, vrNear, rpHash } = API;
  let T; API.sync.push(() => { ({ T } = API); });

  // the ways from the road: [OSM way, kind (0 street, 1 service road or drive, 2 footway, 3 path or track, 4 steps, 5 boardwalk or footbridge),
  // surface (0 asphalt, 1 paving or concrete, 3 gravel, 4 dirt, 5 wood, 6 metal), width (dm), x, z, ...], out to ~60 m from the road (the rest
  // left out; a way that crosses the road's room split there, so one id may stand in more than one row; s: about where along the road). Kind
  // (highway=*; bridge=yes or boardwalk on a footway or path: a boardwalk or footbridge), surface and width as the map has them; where it has
  // no width or surface, by the kind
  const WAYS = [
    [192592873, 0, 0, 50, 43.6, 20.5, 53.8, 16.6, 110.6, -1.3],   // s 47
    [1241972814, 0, 0, 60, 79.7, 53.4, 90.1, 64.9, 102, 80.9, 132.2, 127.6],   // s 94
    [1241972814, 0, 0, 60, 247.5, 924.9, 267.2, 914.5, 325.1, 896.5],   // s 2045
    [1241972808, 0, 0, 50, 410.3, 1958.1, 439.8, 1984.2, 463.5, 1997.5, 494.5, 2010.9, 540.5, 2024.8],   // s 4095
    [536650842, 1, 0, 35, -196, -80.6, -181, -109.2, -181.5, -115.1, -182.5, -117.7],   // s -160
    [1317807535, 1, 0, 35, -137.1, -80, -134.4, -75.2, -135.8, -70.8, -148.4, -62.6, -146.8, -56.9, -130.3, -52.8, -117.1, -60.9],   // s -160
    [1466381109, 1, 0, 35, -186.6, -65.1, -178.4, -47.8, -180, -38.9],   // s -160
    [771898161, 1, 0, 35, -117.1, -60.9, -109.2, -46.3, -95.1, -22.8, -82.5, -7.6, -48.9, 2.8, -26.9, 14.4, -8.5, 19.5],   // s -133
    [1504085549, 1, 0, 35, -0.1, -0, 2.8, -7.6],   // s -1
    [1207908169, 1, 0, 50, 55.2, 51.3, 61.9, 67.8, 63.4, 77.1, 61.5, 86.8, 46, 101.1, 28.8, 101.9, 22, 110.2, 17.5, 117.1, 11.5, 123.7, 8.6, 125.3, 6, 124.9, -0.6, 121.7, -38.2, 98.7, -41, 94.3, -40.3, 91.5],   // s 77
    [171513660, 1, 0, 35, 72.8, 45.8, 65.9, 49.2, 61.4, 51.1, 55.2, 51.3, 48.9, 49.1, 28.6, 35.3, 3.9, 22.3, -8.5, 19.5, -35.1, 18.3, -91.5, 21.5],   // s 86
    [771898163, 1, 0, 35, 90.1, 64.9, 94, 79.8, 102.3, 105.4, 109.2, 121.1, 112.1, 123.7, 115.9, 124.2, 119.2, 123.1, 121.6, 121.2, 122.7, 118.3, 122.3, 112.6],   // s 109
    [171504569, 1, 0, 35, 71.1, 114.4, 84.2, 114.8, 90.5, 115.9, 93.7, 117.5, 98.3, 121.6, 101.7, 129.3, 101.8, 135.1, 99.3, 141.8, 93.8, 147.3],   // s 157
    [1207938438, 1, 0, 50, 46, 101.1, 20.2, 132.1],   // s 161
    [1207938439, 1, 0, 50, 28.8, 101.9, 8, 99.1],   // s 172
    [1414575687, 1, 0, 35, 68.6, 133, 69.6, 138.2, 72.6, 142.9, 77.6, 146.3, 85.2, 148, 93.8, 147.3],   // s 174
    [1207938437, 1, 0, 50, 17.5, 117.1, 2, 107.3],   // s 191
    [171504572, 1, 0, 35, 21.9, 167.6, 29.5, 169.6, 38.9, 169.5, 46.3, 168.6, 77.9, 158.7, 89, 151.3, 93.8, 147.3],   // s 231
    [472284859, 1, 0, 35, 256, 844.9, 261.5, 844.7],   // s 1978
    [255190130, 1, 0, 35, 265.7, 938.2, 282.5, 939.1, 322.3, 944.9, 341.3, 946.1, 350.2, 949.9, 360.3, 951.4, 374.2, 951.5, 387.1, 950.5, 405.2, 953.3, 421.1, 951.2, 435.8, 948.5, 467.1, 950.1, 523.9, 949.9, 546.6, 944.2],   // s 2068
    [171513662, 1, 0, 35, 241.5, 1047.4, 233.1, 1051.6, 223.4, 1054.7, 210.5, 1061.5, 200.6, 1066.1, 194.4, 1070.5, 187.8, 1080.9, 183.8, 1091.1, 181.9, 1099.1, 181.9, 1131, 180.9, 1144.6, 176.7, 1160.8, 166.1, 1184, 161.2, 1190.8, 144.8, 1203.5, 116.4, 1220.5, 105.4, 1231.1, 68.4, 1273.6, 65, 1283.4, 66.6, 1300.6, 69.2, 1306.7],   // s 2867
    [472284862, 1, 0, 35, 22.5, 1366.9, 40.6, 1371.8, 55.9, 1376.7, 59.8, 1388.3, 58.5, 1411.1],   // s 3340
    [171513662, 1, 0, 35, 138, 1465.5, 133.5, 1461.6, 124.1, 1433.8, 101, 1367.9, 98.3, 1362.6],   // s 3462
    [171513662, 1, 0, 35, 83.9, 1592.2, 121.8, 1556.6, 140.8, 1535.3],   // s 3582
    [1479615306, 2, 1, 20, -94.3, -69.8, -91.9, -72.2],   // s -120
    [1504085548, 2, 1, 20, -18.7, -18.1, -14.9, -21.8, -2.6, -19],   // s -26
    [1414575678, 2, 1, 20, 53.8, 16.6, 19.7, 0.6, -48.1, -32.3, -72.5, -51.5, -167.1, -130.9],   // s 53
    [1412121464, 2, 1, 20, 107.3, 77.8, 135.4, 116.1, 129.6, 123.7, 126.1, 130.1],   // s 122
    [1453886205, 2, 3, 15, 126.1, 130.1, 129.1, 134.5],   // s 148
    [1554685622, 2, 1, 20, 126.1, 130.1, 118.7, 146.6],   // s 148
    [1414575682, 2, 1, 20, 64.3, 108.1, 70.3, 115.4, 74.1, 119.1, 78.3, 124.3],   // s 156
    [1414575681, 2, 1, 20, 75.9, 133.5, 75.4, 130.8, 75.8, 128, 77.1, 125.5, 79.1, 123.5, 81.6, 122.3, 84.5, 121.9, 87.4, 122.5, 89.9, 124.1, 91.8, 126.3, 92.8, 129.1, 92.8, 132, 91.8, 134.8, 89.9, 137.1, 87.4, 138.7, 84.7, 139.3, 81.9, 139, 79.4, 137.9, 77.3, 136],   // s 170
    [1414575683, 2, 1, 20, 81.9, 139, 80.4, 147],   // s 171
    [1453886207, 2, 1, 20, 66.1, 181.6, 55.6, 198.5],   // s 209
    [1453886208, 2, 1, 20, 66.1, 181.6, 83.6, 193.9],   // s 209
    [1453886212, 2, 1, 20, 55, 218.1, 61.8, 212.9, 65.7, 210.6, 68.2, 209.7],   // s 225
    [1453886211, 2, 3, 15, 37.9, 219.5, 35.8, 224.8, 35.4, 226.6],   // s 235
    [1453886219, 2, 1, 20, 30, 210.1, 33, 178.8, 76.3, 168.6, 86.8, 165.2, 94.3, 160.9, 100.1, 155.8, 102.8, 152.7, 106.2, 147.2, 109.7, 142.1, 111.8, 140.5, 114.7, 139.7, 126.1, 140],   // s 235
    [1411408531, 2, 3, 15, 11.3, 163.9, 18.7, 159.3, 25.1, 148.1, 64.3, 108.1],   // s 241
    [1411408531, 2, 3, 15, -12.3, 159.6, 1.1, 163.9],   // s 268
    [472279663, 2, 3, 15, 367.9, 928.8, 373.5, 928.4],   // s 2166
    [472279664, 2, 3, 15, 373, 912.9, 376.6, 913],   // s 2167
    [635099010, 2, 3, 15, 374.1, 950.4, 373.7, 936.8],   // s 2177
    [472338452, 2, 3, 15, 375.4, 992.6, 368.8, 992.9],   // s 2187
    [1520687650, 2, 3, 15, 640.2, 1035, 444.2, 1038.9],   // s 2464
    [1423239279, 2, 3, 15, 444.4, 1045.9, 444.2, 1038.9],   // s 2663
    [472279662, 2, 3, 15, 377.5, 1046.1, 376.7, 1037.6],   // s 2730
    [1421544112, 2, 3, 15, 564.7, 2004.6, 562.6, 2005.6, 561.5, 2008.4],   // s 4209
    [1534651167, 2, 3, 15, 672.4, 2007.4, 675.6, 2029.6],   // s 4481
    [1077562955, 2, 3, 15, 687.6, 2036.6, 681, 2037.5],   // s 4515
    [1092016924, 3, 4, 12, -81.5, 135.9, -80, 117.6, -74.9, 105.2, -67.3, 99.5, -62.1, 93, -58.1, 89.8],   // s 341
    [1324053207, 3, 4, 12, -137.5, 131.7, -141.7, 125.1, -161.2, 113.1, -190.7, 107.7, -204.8, 96.5, -226.8, 89.9, -229, 84.3, -229, 82.8],   // s 396
    [1076461595, 3, 4, 12, -557.4, 223.7, -565.9, 208.2, -578.5, 207.3, -607.3, 206.3, -614.2, 202.3],   // s 836
    [1076461594, 3, 4, 12, 247.5, 924.9, 236.9, 933, 235.2, 939.2, 237, 951.2, 229.5, 963.8, 210, 971.9],   // s 2045
    [1379293470, 3, 4, 12, 636.1, 1022.3, 629, 1002.8, 620.3, 995.3, 615.6, 989.8, 604.5, 979.8, 598.1, 975.7, 593.6, 971.7, 581.9, 966.5, 569.2, 960.1, 560.9, 953.9, 550.5, 945],   // s 2450
    [1421538736, 3, 3, 30, 640.2, 1035, 653.9, 1042.7, 671.2, 1043.4, 700.2, 1040.7],   // s 2464
    [171513665, 3, 3, 30, 659.2, 1096, 656.1, 1094.8, 647.5, 1094, 607.9, 1096.6, 537.7, 1100.4, 499.4, 1101.6, 445.7, 1101.2, 426.8, 1100.2, 401.3, 1103, 341.2, 1102.6, 270.3, 1104.8, 245.4, 1107.2, 242.6, 1108.3],   // s 2474
    [1076461594, 3, 4, 12, 153.4, 1050.5, 134.4, 1039.1, 134.4, 1036.9, 136.4, 1034.6, 142, 1034.6, 148.2, 1032.6, 152.3, 1028, 164.5, 1012.9, 175.3, 996.2, 185.2, 984.4, 186, 984],   // s 2957
    [1330889197, 3, 4, 12, 75.6, 1632.2, 62.6, 1637.2, 54.7, 1646.4, 48.8, 1654.1],   // s 3605
    [1058264012, 3, 4, 12, 107.9, 1622.8, 92.1, 1634.7, 80.2, 1641.5, 76.9, 1638.6, 75.1, 1629.9, 77.7, 1622.3, 87.4, 1608.5],   // s 3624
    [1169386785, 3, 4, 12, 613.1, 1885.9, 517.7, 1842.6],   // s 4353
    [1421538743, 3, 4, 12, 686.5, 1951.8, 684.9, 1944.3, 659, 1923.4, 648.9, 1908.2, 636.7, 1902.1, 626, 1892.3, 613.1, 1885.9, 608.3, 1873.2, 601.9, 1865.9, 590.6, 1860, 584.6, 1859.1, 579.4, 1853, 570.4, 1850.8, 562.2, 1844.6, 557.5, 1845.2, 547.4, 1840.8, 542.9, 1836.4],   // s 4445
    [1563821162, 3, 4, 12, 754.9, 2098.9, 745.2, 2110.8],   // s 4611
    [1467750070, 3, 4, 12, 745.2, 2110.8, 744, 2115.1],   // s 4618
    [1000408888, 3, 4, 12, 744, 2115.1, 740.6, 2127.1, 741.4, 2133.2],   // s 4621
    [1467750071, 3, 4, 12, 744, 2115.1, 738.7, 2113.9],   // s 4621
    [1268715689, 3, 4, 12, 780, 2128.5, 777.6, 2132.5, 778.2, 2139, 798.9, 2160, 801.3, 2164.2, 811.8, 2173.7, 813.7, 2178.8, 813.3, 2185.3, 807.5, 2196.8, 804.2, 2200.6, 805, 2204.3],   // s 4648
    [1318130743, 3, 4, 12, 780, 2128.5, 756.6, 2113.2, 745.2, 2110.8],   // s 4648
    [1000408955, 3, 4, 12, 816.2, 2140.5, 794.5, 2123.6, 754.9, 2098.9],   // s 4675
    [1467750069, 3, 4, 12, 816.2, 2140.5, 797.5, 2137.5, 780, 2128.5],   // s 4675
    [1534651169, 3, 4, 12, 827.6, 2148.8, 826.2, 2152.7, 831, 2157.9, 830.2, 2162.9, 827.4, 2166.4, 825.8, 2176.4, 813.3, 2185.3],   // s 4689
    [1379300574, 3, 3, 30, 1089.4, 2345.8, 1096.4, 2336.3, 1114.1, 2331.8, 1136.1, 2330.2, 1149.3, 2330.7],   // s 5021
    [1504085547, 4, 1, 20, -2.4, -10.2, 2.2, -16.7],   // s -7
    [1504085546, 4, 1, 20, 2.8, -7.6, 6.5, -14.7],   // s -1
    [1317807549, 4, 1, 20, 64.3, 108.1, 57.9, 101.2],   // s 156
    [1453886206, 4, 1, 20, 66.1, 181.6, 83.7, 178.4, 92.7, 174.9, 101.4, 169.1, 108.7, 162, 114.2, 154.9, 118.7, 146.6],   // s 209
    [1453886209, 4, 1, 20, 55.6, 198.5, 50.3, 202, 45.8, 205.6, 42.5, 209.9, 40, 214.2, 37.9, 219.5],   // s 220
    [227760082, 5, 5, 15, 170.7, 1174.4, 196.1, 1180.4],   // s 3059
    [1409254478, 5, 5, 15, 494.5, 2010.9, 498.6, 2005.2, 507.5, 2005.9, 514.7, 2003.1, 526.4, 1995.9, 526.3, 1992.3, 538.9, 1982.1, 540.6, 1977.1, 540.7, 1973.3, 538.7, 1968, 538.8, 1963.6, 540.3, 1956.6, 540.5, 1953.1, 540, 1949.1, 538.2, 1944.8, 535.2, 1928.4, 538.1, 1926.3, 542.9, 1923.7, 546.7, 1921.2, 550.3, 1915.7, 553.3, 1913.8, 563.4, 1922.3, 570.7, 1924, 584.3, 1932.5, 586.7, 1938.7, 597, 1946.1, 599.8, 1952.2, 610.8, 1956.7, 623, 1959.3, 628.2, 1962.9, 647, 1970.6, 653.6, 1971.6, 661.8, 1976.8, 666.6, 1982.5],   // s 4179
    [1534651168, 5, 5, 15, 538.9, 1982.1, 555.4, 1992.2, 562.6, 2005.6],   // s 4209
    [1421544110, 5, 6, 15, 675.3, 1953.1, 671.3, 1952.3, 668, 1952.8, 663.8, 1957.4, 664, 1960.9, 667, 1970.8, 667.6, 1979.2, 666.6, 1982.5],   // s 4436
    [1534651166, 5, 5, 15, 666.6, 1982.5, 669.6, 2005.6, 672.4, 2007.4],   // s 4450
    [1421544111, 5, 6, 15, 725.8, 2008.6, 719.7, 1997, 709.9, 1982, 703.2, 1975.1, 693.9, 1967.7, 688.2, 1960.3, 675.3, 1953.1],   // s 4515
    [1563821161, 5, 6, 10, 753.3, 2097.9, 701, 2064.2],   // s 4610
    [1000406946, 5, 5, 20, 738.7, 2113.9, 731.5, 2112.2],   // s 4618
  ];
  // the sidewalks (footway=sidewalk, their lines within the road's room on the game's wider road): [OSM way, x, z of one end's place on the
  // road and of the other's, x, z of a point of the map's line (its side)]; drawn as a strip of paving 1.5 m wide just past the asphalt
  // the benches (amenity=bench: [x, z, backrest: 0 where the map has backrest=no]; their direction not on the map: facing the road, a group of
  // four or more facing its middle), the litter bins (amenity=waste_basket), the guideposts (information=guidepost) and the boards
  // (information=board), all blank, the lift gates (barrier=lift_gate, each on the drive nearest it) and the bicycle stand
  // (amenity=bicycle_parking)
  const WALKS = [[1411408531, 11.1, 170.5, 2.4, 170.5, 6.8, 164.9], [1411408531, -14.8, 165.6, -498, 190, -258.6, 140.4], [1504085550, -0.2, -0.1, 38.8, 18.1, 20.4, 6.5]];
  const BENCH = [[74.8, 128.9, 1], [82.8, 120.4, 1], [93.6, 132.2, 1], [83.3, 140.2, 1], [75.1, 133.9, 1], [89.5, 138.8, 1], [92.4, 124.6, 1], [87.4, 120.7, 1], [242.7, 922.1, 1], [241.9, 924.6, 1], [244, 925.2, 1], [368.8, 992.9, 1], [538.2, 1039.3, 1], [531, 1039.5, 1], [524.4, 1039.4, 1], [450.1, 1034.1, 1], [444.3, 1034.2, 1], [439.1, 1034.5, 1], [381.4, 1019.5, 1], [78.6, 1644.8, 0], [374.1, 1882.9, 1], [375.6, 1882.9, 1], [376.2, 1884.4, 1], [375.5, 1885.8, 1], [488.6, 2006.9, 1], [518, 1956.9, 0], [517.2, 1956.1, 0], [518.1, 1954.4, 0], [517.2, 1955.1, 0]];
  const BIN = [[-551.6, 208.2], [242.4, 923.4], [486.4, 2005.6], [517.5, 1956.6], [517.6, 1954.6]];
  const GUIDE = [[66.2, 19.4], [83.3, 12.5], [635.7, 1026.6], [690.4, 1948]];
  const BOARD = [[77, 12.8], [87.3, 10], [483.7, 2004.2], [497.8, 2010.9]];
  const LIFT = [[-135.8, -70.8], [65.9, 49.2]];
  const BIKE = [[16.1, -11.9]];

  const SURF = [[0.42, 0.42, 0.43], [0.66, 0.65, 0.62], [0.55, 0.53, 0.5], [0.52, 0.49, 0.44], [0.5, 0.42, 0.32], [0.5, 0.36, 0.22], [0.55, 0.57, 0.58]];
  const SKIRT = [0.45, 0.41, 0.35], WOOD = [0.5, 0.36, 0.22], WOOD_D = [0.4, 0.29, 0.18], CONC = [0.64, 0.63, 0.6], CONC_T = [0.71, 0.7, 0.67], STEEL = [0.6, 0.61, 0.6];
  const PALE = [0.86, 0.82, 0.64], RED = [0.78, 0.16, 0.13], WHITE = [0.93, 0.92, 0.9], METAL = [0.55, 0.57, 0.58], BINC = [0.55, 0.58, 0.55], POST = [0.62, 0.6, 0.56];
  const SIGN_LINE = 1.6;   // (no exclusion of trees reaches within bar + this: the corner signs at bar + 0.9 and 1.2, the pennants at 1.3, the finish's at 1.4)

  // the road's frame: the nearest sample, the offset across (+: right), the distance along
  const near = (x, z) => { const n = vrNear(x, z); if (n.i < 0) return null; const i = n.i, u = (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i];
    return { i, lat: n.lat, sd: n.lat >= 0 ? 1 : -1, s: i * T.ds + u }; };
  const bar = (i, sd) => (sd > 0 ? T.br[i] : T.bl[i]);
  const wAt = (i) => (T.wAt ? T.wAt(i) : T.w);
  // a point at the distance s along the road, o across it, y over the road's height
  const at = (s, o, y) => { const f0 = s / T.ds, i = Math.max(0, Math.min(T.N - 2, Math.floor(f0))), f = f0 - i, j = i + 1, L = (a) => a[i] + (a[j] - a[i]) * f;
    return [L(T.px) + L(T.nx) * o, L(T.hy) + y, L(T.pz) + L(T.nz) * o]; };
  // the distance from a point to a way's middle line
  const dWay = (pa, x, z) => { let m = 1e9; const Q = pa.P; for (let j = 0; j + 1 < Q.length; j++) { const ax = Q[j][0], az = Q[j][1], dx = Q[j + 1][0] - ax, dz = Q[j + 1][1] - az, L2 = dx * dx + dz * dz || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2)); m = Math.min(m, Math.hypot(x - ax - dx * t, z - az - dz * t)); } return m; };
  const clearOfWays = (x, z, m) => { for (const pa of PATHS) if (dWay(pa, x, z) < pa.W / 2 + m) return false; return true; };

  let PATHS = [], SPOT = null, BLD = [], BLDS = [], PF = null, PADS = [];
  // on one of the builder's level plots (the stadium's, the pull-offs': P.pads)
  const inPadPt = (x, z) => { for (const p of PADS) if (Math.hypot(x - p.x, z - p.z) < p.r - 0.5) return true; return false; };
  // within one of the map's buildings (T.def.bld: [x, z, L, W, ang, ...]; the pavilions js/world-medeu.js draws are among them), grown by h metres
  const inMapBld = (x, z, h) => { for (const q of (T.def && T.def.bld) || []) if (inBld({ x: q[0], z: q[1], ang: q[4], L: q[2] + 2 * h, W: q[3] + 2 * h }, x, z)) return true; return false; };

  /* ---- the ways' middle lines: the junction's end first (a way with neither end at the road as the map has it); rounded (two passes of corner
     cutting, the ends kept), but the steps; run in under the road until their whole end lies under its top (the streets, drives, footways and
     paths that meet it); sampled at 0.3 m across the road's room, 0.6 m to 25 m out, 1.2 m past it. And the sidewalks: along the road every
     metre, 1.15 m past the asphalt's edge, on the map's side ---- */
  function paths() {
    const out = [];
    for (const wy of WAYS) {
      const [id, kind, surf, wd] = wy, W = wd / 10; let Q = [];
      for (let j = 4; j + 1 < wy.length; j += 2) Q.push([wy[j], wy[j + 1]]);
      const onRoad = (p) => { const n = near(p[0], p[1]); return !!n && Math.abs(n.lat) < 6; };
      const a0 = onRoad(Q[0]), a1 = onRoad(Q[Q.length - 1]), free = !a0 && !a1;
      if (!free && !a0) Q.reverse();
      const both = a0 && a1;
      if (kind !== 4) for (let p = 0; p < 2; p++) { const R = [Q[0]];
        for (let j = 0; j + 1 < Q.length; j++) { const a = Q[j], b = Q[j + 1]; R.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }
        R.push(Q[Q.length - 1]); Q = R; }
      const ext = (first) => { const a = first ? Q[0] : Q[Q.length - 1], b = first ? Q[1] : Q[Q.length - 2], n = near(a[0], a[1]); if (!n) return;
        let dx = a[0] - b[0], dz = a[1] - b[1]; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        const cs = Math.abs(dx * T.nx[n.i] + dz * T.nz[n.i]), sn = Math.sqrt(Math.max(0, 1 - cs * cs));
        const e = Math.min(8, Math.max(0, (Math.abs(n.lat) + W / 2 * sn - (wAt(n.i) - 0.6)) / Math.max(0.35, cs)));
        if (e > 0.05) { const p = [a[0] + dx * e, a[1] + dz * e]; if (first) Q.unshift(p); else Q.push(p); } };
      if (kind < 4 && !free) { ext(true); if (both) ext(false); }
      const P = [Q[0].slice()]; let j = 0, x = Q[0][0], z = Q[0][1];
      for (;;) { const n = near(x, z), a = n ? Math.abs(n.lat) : 1e9; let st = n && a < bar(n.i, n.sd) + 2.4 ? 0.3 : a < 25 ? 0.6 : 1.2;
        while (j < Q.length - 1) { const bx = Q[j + 1][0], bz = Q[j + 1][1], L = Math.hypot(bx - x, bz - z);
          if (L >= st) { x += (bx - x) * st / L; z += (bz - z) * st / L; st = 0; break; } st -= L; x = bx; z = bz; j++; }
        if (j >= Q.length - 1) { const e = Q[Q.length - 1], l = P[P.length - 1]; if (Math.hypot(e[0] - l[0], e[1] - l[1]) < 0.15) P[P.length - 1] = e.slice(); else P.push(e.slice()); break; }
        P.push([x, z]); }
      out.push({ id, kind, surf, W, P, Q, both });
    }
    for (const [id, xA, zA, xB, zB, xM, zM] of WALKS) { const nA = near(xA, zA), nB = near(xB, zB), nM = near(xM, zM); if (!nA || !nB || !nM) continue;
      const s0 = Math.max(0, Math.min(nA.s, nB.s)), s1 = Math.min((T.N - 1) * T.ds, Math.max(nA.s, nB.s)), sd = nM.sd, P = [];
      for (let s = s0; s <= s1 + 1e-6; s += 1) { const i = Math.max(0, Math.min(T.N - 1, Math.round(s / T.ds))), q = at(s, sd * (wAt(i) + 1.15), 0); P.push([q[0], q[2]]); }
      if (P.length >= 2) out.push({ id, kind: 2, surf: 1, W: 1.5, P, Q: P, both: false, walk: true }); }
    return out;
  }

  // a house's footprint grown by h metres all round holds the point
  const inHouse = (x, z, h) => { for (const b of BLDS) if (inBld({ x: b.x, z: b.z, ang: b.ang, L: b.L + 2 * h, W: b.W + 2 * h }, x, z)) return true; return false; };

  // the furniture's places: each as near its mapped place as can be, out past the road's room (1.9 m past its barrier: past the verge's ditch),
  // clear of the ways and of the houses, none on the builder's level plots nor within the map's buildings (the pavilions' own room); at most MOVE
  // metres from it, else left out (st.left); a group of four benches or more (within 9 m of each other) facing its middle. The gates slid along
  // their drives out of the road's room (bar + 1.6 m), at most 12 m, else left out
  const MOVE = 8;
  function spots() {
    const S = { bench: [], bin: [], guide: [], board: [], gate: [], bike: [], left: [] }, off = (x, z) => inPadPt(x, z) || inMapBld(x, z, 0.3);
    const BB = PATHS.map((pa) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const q of pa.P) { a = Math.min(a, q[0]); b = Math.min(b, q[1]); c = Math.max(c, q[0]); d = Math.max(d, q[1]); } return [a, b, c, d]; });
    const clear = (x, z, m) => PATHS.every((pa, k) => { const e = pa.W / 2 + m, B = BB[k]; return x < B[0] - e || x > B[2] + e || z < B[1] - e || z > B[3] + e || dWay(pa, x, z) >= e; });
    const ok = (x, z, m, h) => { const n = near(x, z); return !(n && Math.abs(n.lat) < bar(n.i, n.sd) + 1.9) && !inPadPt(x, z) && !inHouse(x, z, h) && clear(x, z, m); };
    // the nearest good place: on rings 0.5 m apart, each searched from the side away from the road
    const place = (kind, x0, z0, m, h) => { if (ok(x0, z0, m, h)) return { x: x0, z: z0, n: near(x0, z0), moved: 0 };
      const n0 = near(x0, z0), t0 = n0 ? Math.atan2(T.nz[n0.i] * n0.sd, T.nx[n0.i] * n0.sd) : 0;
      for (let r = 0.5; r <= MOVE + 1e-6; r += 0.5) { const nA = Math.max(8, Math.ceil(2 * Math.PI * r / 0.6));
        for (let a = 0; a < nA; a++) { const t = t0 + (a % 2 ? 1 : -1) * Math.ceil(a / 2) * 2 * Math.PI / nA, x = x0 + Math.cos(t) * r, z = z0 + Math.sin(t) * r;
          if (ok(x, z, m, h)) return { x, z, n: near(x, z), moved: r }; } }
      S.left.push(kind); return null; };
    const up = BENCH.map((_, k) => k), root = (k) => (up[k] === k ? k : (up[k] = root(up[k])));
    for (let a = 0; a < BENCH.length; a++) for (let b = a + 1; b < BENCH.length; b++) if (Math.hypot(BENCH[a][0] - BENCH[b][0], BENCH[a][1] - BENCH[b][1]) < 9) up[root(a)] = root(b);
    const G = new Map(); BENCH.forEach((_, k) => { const r = root(k); if (!G.has(r)) G.set(r, []); G.get(r).push(k); });
    for (const ks of G.values()) { const M = ks.filter((k) => !off(BENCH[k][0], BENCH[k][1]));
      const mid = M.length >= 4 ? [M.reduce((a, k) => a + BENCH[k][0], 0) / M.length, M.reduce((a, k) => a + BENCH[k][1], 0) / M.length] : null;
      for (const k of M) { const p = place('bench', BENCH[k][0], BENCH[k][1], 0.2, 0.3); if (p) S.bench.push(Object.assign(p, { back: !!BENCH[k][2], mid })); } }
    const put = (kind, pts) => { for (const [x, z] of pts) { if (off(x, z)) continue; const p = place(kind, x, z, 0.3, 0.3); if (p) S[kind].push(p); } };
    put('bin', BIN); put('guide', GUIDE); put('board', BOARD); put('bike', BIKE);
    for (const [x, z] of LIFT) { let pa = null, db = 8; for (const q of PATHS) { if (q.walk || q.kind > 1) continue; const d = dWay(q, x, z); if (d < db) { db = d; pa = q; } }
      if (!pa) { S.left.push('gate'); continue; }
      let jb = 0, dj = 1e9; pa.P.forEach((q, j) => { const d = Math.hypot(q[0] - x, q[1] - z); if (d < dj) { dj = d; jb = j; } });
      const outOf = (j) => { const n = near(pa.P[j][0], pa.P[j][1]); return !n || Math.abs(n.lat) - pa.W / 2 - 0.3 >= bar(n.i, n.sd) + SIGN_LINE; };
      let jg = -1; for (let e = 0; e < pa.P.length && jg < 0; e++) for (const j of [jb + e, jb - e]) if (j >= 0 && j < pa.P.length && jg < 0 && Math.hypot(pa.P[j][0] - x, pa.P[j][1] - z) <= 12 && outOf(j)) jg = j;
      if (jg < 0) { S.left.push('gate'); continue; }
      const a = pa.P[Math.max(0, jg - 2)], b = pa.P[Math.min(pa.P.length - 1, jg + 2)], Lb = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, gx = pa.P[jg][0], gz = pa.P[jg][1];
      S.gate.push({ x: gx, z: gz, tx: (b[0] - a[0]) / Lb, tz: (b[1] - a[1]) / Lb, W: pa.W, moved: Math.hypot(gx - x, gz - z) }); }
    return S;
  }
  // keeps the trees, plants and rocks off a circle, made smaller until it stays past the signs' line of every part of the road it is near
  function keep(exclPush, x, z, r) {
    for (let rr = r; rr >= 0.45; rr *= 0.8) { let ok = true;
      for (let k = 0; k < 9 && ok; k++) { const a = k * Math.PI / 4, px = k < 8 ? x + Math.cos(a) * rr : x, pz = k < 8 ? z + Math.sin(a) * rr : z, n = near(px, pz);
        if (n && Math.abs(n.lat) - (k < 8 ? 0 : rr) < bar(n.i, n.sd) + SIGN_LINE) ok = false; }
      if (ok) { exclPush(x, z, rr); return rr; } }
    return 0;
  }
  const inBld = (b, x, z) => { const c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0), dx = x - b.x, dz = z - b.z, u = dx * c + dz * s, v = -dx * s + dz * c;
    return Math.abs(u) < (b.L || 0) / 2 && Math.abs(v) < (b.W || 0) / 2; };

  /* ---- before the terrain: the shared builder's trees, plants and rocks kept off the ways and the furniture's places ---- */
  const basePre = LK.pre;
  LK.pre = function (o) {
    const r = basePre ? basePre.call(this, o) : undefined; if (!T) return r;
    const { exclPush, blds } = o;
    BLDS = blds || []; PADS = (o.P && o.P.pads) || []; PATHS = paths(); SPOT = spots(); BLD = [];
    for (const pa of PATHS) { const Q = pa.P; let acc = 99;
      for (let j = 1; j < Q.length; j++) { acc += Math.hypot(Q[j][0] - Q[j - 1][0], Q[j][1] - Q[j - 1][1]); if (acc < 2.5) continue; acc = 0;
        const [x, z] = Q[j], rr = keep(exclPush, x, z, pa.W / 2 + 0.8);
        if (rr < pa.W / 2 + 0.5) { const a = Q[j - 1], L = Math.hypot(x - a[0], z - a[1]) || 1, cx = -(z - a[1]) / L, cz = (x - a[0]) / L;
          for (const sg of [-1, 1]) keep(exclPush, x + cx * sg * pa.W / 2, z + cz * sg * pa.W / 2, 1.1); } }
      if (blds && pa.P.some((p) => blds.some((b) => inBld(b, p[0], p[1])))) BLD.push(pa.id); }
    const R = { bench: 1.3, bin: 0.6, guide: 1, board: 1.2, gate: 3.5, bike: 2 };
    for (const k in R) for (const q of SPOT[k]) keep(exclPush, q.x, q.z, R[k]);
    return r;
  };

  /* ---- the furniture: laid after the road's own landmarks (out.medeuRoadside: what was built, the tests) ---- */
  const baseX = LK.extra;
  LK.extra = function (o) { const r = baseX ? baseX.call(this, o) : undefined; if (!T || !PATHS.length) return r; PF = o.out.propFloor || null; o.out.medeuRoadside = lay(o); return r; };

  // the verge's own top at a point within the road's room (between the two samples about it)
  function verge(lat, s) { if (!PF) return 0; const f0 = s / T.ds, i = Math.max(0, Math.min(T.N - 2, Math.floor(f0))), f = f0 - i;
    return PF({ d: lat, i, s: -1 }, true) * (1 - f) + PF({ d: lat, i: i + 1, s: -1 }, true) * f; }
  // a new surface's height at a point (y: lifted against the flicker) over the ground one sees there (b: the verge's top within the road's room,
  // the terrain's past it, caGround's own mesh within 300 m of the road); over the verge's ditch a little fill on a culvert (at most 0.6 m, none
  // where the ditch is deep); on the asphalt under the road's top (hid)
  function hAt(x, z, lift) {
    const g = caGround(x, z), v = vrNear(x, z); if (v.i < 0) return { y: g + lift, b: g, hid: false };
    const i = v.i, lat = v.lat, a = Math.abs(lat), sd = lat >= 0 ? 1 : -1, w = wAt(i), oE = bar(i, sd) + 1.9;
    if (a > oE) return { y: g + lift, b: g, hid: false };
    const s = i * T.ds + (x - T.px[i]) * T.tx[i] + (z - T.pz[i]) * T.tz[i], ry = at(s, 0, 0)[1];
    if (a <= w - 0.3) return { y: ry - 0.06, b: ry, hid: true };
    if (a <= w) return { y: ry + 0.02, b: ry, hid: false };
    const top = Math.max(ry + verge(lat, s), g), E = at(s, sd * oE, 0), gE = Math.max(caGround(E[0], E[2]), ry + verge(sd * oE, s));
    const d = ry + (gE - ry) * (a - w) / (oE - w) - top, f = d <= 0 ? 0 : d <= 0.6 ? d : d * Math.max(0, Math.min(1, (1.2 - d) / 0.6));
    return { y: top + f + lift, b: top, hid: false };
  }

  // where the road has its rails (world-prelaz.js's own rule, as there: the corners from sev 2 on, the drops beside the road; not at the start's
  // and the finish's 30 m nor by the pull-offs; short gaps closed, short pieces dropped): a junction there has no gap in them, so its way starts
  // past the road's room
  function railNeed(pulls) {
    const N = T.N, need = [new Uint8Array(N), new Uint8Array(N)];
    for (const c of T.corners || []) if (c.sev >= 2) { const sd = -c.dir > 0 ? 1 : 0; for (let k = Math.max(0, c.i0 - 8); k <= Math.min(N - 1, c.i1 + 8); k++) need[sd][k] = 1; }
    for (let i = 0; i < N; i += 2) for (const side of [-1, 1]) { const b = side > 0 ? T.br[i] : T.bl[i];
      for (const d of [4, 8, 13, 19, 26]) { const o = side * (b + d);
        if (caGround(T.px[i] + T.nx[i] * o, T.pz[i] + T.nz[i] * o) < T.hy[i] - (d <= 8 ? 2.4 : 2.4 + (d - 8) * 0.35)) { need[side > 0 ? 1 : 0][i] = 1; if (i + 1 < N) need[side > 0 ? 1 : 0][i + 1] = 1; break; } } }
    const iS0 = T.idx(T.startS + 30), iS1 = T.idx(T.finishS - 30), byPull = (i) => { for (const p of pulls) if (Math.hypot(T.px[i] - p.x, T.pz[i] - p.z) < p.r + 6) return true; return false; };
    for (const side of [-1, 1]) { const nd = need[side > 0 ? 1 : 0];
      for (let i = 0; i < N; i++) if (i < iS0 || i > iS1 || byPull(i)) nd[i] = 0;
      for (let i = 1, last = -1; i < N; i++) { if (nd[i]) { if (last >= 0 && i - last > 1 && i - last < 12) for (let k = last; k < i; k++) nd[k] = 1; last = i; } }
      for (let i = 0; i < N;) { if (!nd[i]) { i++; continue; } let j = i; while (j < N && nd[j]) j++; if (j - i < 6) for (let k = i; k < j; k++) nd[k] = 0; i = j; } }
    return need;
  }

  // a thin square beam from A to B (r: its half-width), its four sides facing away from its axis
  function beam(g, A, B, r, col) {
    const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dy, dz) || 1, ex = dx / L, ey = dy / L, ez = dz / L;
    let ux = -ez, uy = 0, uz = ex; if (Math.hypot(ux, uz) < 0.1) { ux = 0; uy = ez; uz = -ey; }
    const l = Math.hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
    const vx = ey * uz - ez * uy, vy = ez * ux - ex * uz, vz = ex * uy - ey * ux, M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
    const C = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([a, b]) => [(ux * a + vx * b) * r, (uy * a + vy * b) * r, (uz * a + vz * b) * r]);
    for (let k = 0; k < 4; k++) { const p = C[k], q = C[(k + 1) % 4];
      g.quadO([A[0] + p[0], A[1] + p[1], A[2] + p[2]], [B[0] + p[0], B[1] + p[1], B[2] + p[2]], [B[0] + q[0], B[1] + q[1], B[2] + q[2]], [A[0] + q[0], A[1] + q[1], A[2] + q[2]], col, M); }
  }

  function lay({ scen, P }) {
    const st = { ways: 0, walks: 0, ribbon: 0, cells: 0, skirts: 0, cut: [], pads: 0, bld: BLD.slice(), bldCells: 0, steps: 0, decks: 0, deck: 0, posts: 0,
      benches: 0, bins: 0, guides: 0, boards: 0, gates: 0, bikes: 0, verts: 0, at: {}, left: [] };
    for (const k of ['bench', 'bin', 'guide', 'board', 'gate', 'bike']) st.at[k] = SPOT[k].map((q) => +q.moved.toFixed(2)); st.left = SPOT.left.slice();
    let v0 = 0; for (const g of scen.map.values()) v0 += g.P.length / 3;
    const pads = (P && P.pads) || [], need = railNeed(pads);
    st.rails = +((need[0].reduce((a, b) => a + b, 0) + need[1].reduce((a, b) => a + b, 0)) / (2 * T.N)).toFixed(3);   // (to hold against the builder's own: its out.stats.rails)
    const inPad = (x, z) => { for (const p of pads) if (Math.hypot(x - p.x, z - p.z) < p.r - 0.5) return true; return false; };
    // a house the builder moved back from the road onto a way (L.hotels): the way's cells within its walls (and 0.3 m about them) left out
    const inB = (x, z) => inHouse(x, z, 0.3);
    const quad = (A, B, C, D, col) => scen.get((A[0] + C[0]) / 2, (A[2] + C[2]) / 2).quadUp(A, B, C, D, [col, col, col, col]);
    const wall = (A, B, C, D, col, ins) => scen.get((A[0] + C[0]) / 2, (A[2] + C[2]) / 2).quadO(A, B, C, D, col, ins);
    const inRoom = (x, z) => { const n = near(x, z); return !!n && Math.abs(n.lat) < bar(n.i, n.sd) + 1.95; };
    // a junction on a stretch with rails: the rows within the road's room left out
    const railed = (rows, fromEnd) => { let lo = 1e9, hi = -1, sd = 0; const R = fromEnd ? rows.slice().reverse() : rows;
      for (const row of R) { let any = false; for (const v of row) { const n = near(v[0], v[2]); if (n && Math.abs(n.lat) < bar(n.i, n.sd) + 1.95) { any = true; lo = Math.min(lo, n.i); hi = Math.max(hi, n.i); sd = n.sd; } } if (!any) break; }
      if (hi < 0) return false; const nd = need[sd > 0 ? 1 : 0]; for (let i = Math.max(0, lo - 1); i <= Math.min(T.N - 1, hi + 1); i++) if (nd[i]) return true; return false; };

    // the ways: a ribbon of cells across (4 on a way 3 m wide or more, 2 on a narrower one), each corner on the ground one sees, a little over it;
    // where an edge stands over the ground (the culvert's fill, the ground's folds) a bank of earth down to it
    PATHS.forEach((pa, k) => {
      if (pa.kind >= 4) return;
      const M = pa.W >= 3 ? 4 : 2, lift = 0.06 + 0.006 * (k % 4), c0 = SURF[pa.surf] || SURF[0], Q = pa.P;
      let rows = Q.map((p, j) => { const a = Q[Math.max(0, j - 1)], b = Q[Math.min(Q.length - 1, j + 1)], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, cx = -(b[1] - a[1]) / L, cz = (b[0] - a[0]) / L, R = [];
        for (let m = 0; m <= M; m++) { const o = -pa.W / 2 + pa.W * m / M, x = p[0] + cx * o, z = p[1] + cz * o, h = hAt(x, z, lift); R.push([x, h.y, z, h.b, h.hid]); } return R; });
      for (const fromEnd of pa.walk ? [] : pa.both ? [false, true] : [false]) if (railed(rows, fromEnd)) { st.cut.push(pa.id);
        if (fromEnd) { while (rows.length && rows[rows.length - 1].some((v) => inRoom(v[0], v[2]))) rows.pop(); }
        else { let j = 0; while (j < rows.length && rows[j].some((v) => inRoom(v[0], v[2]))) j++; rows = rows.slice(j); } }
      if (rows.length < 2) return;
      if (pa.walk) st.walks++; else st.ways++;
      for (let j = 0; j + 1 < rows.length; j++) { const A = rows[j], B = rows[j + 1], q = 0.95 + 0.08 * rpHash(j >> 2, 300 + k), col = [c0[0] * q, c0[1] * q, c0[2] * q];
        st.ribbon += Math.hypot(B[M >> 1][0] - A[M >> 1][0], B[M >> 1][2] - A[M >> 1][2]);
        for (let m = 0; m < M; m++) { const a = A[m], b = A[m + 1], c = B[m + 1], d = B[m]; if (a[4] && b[4] && c[4] && d[4]) continue;
          if (inPad((a[0] + c[0]) / 2, (a[2] + c[2]) / 2)) { st.pads++; continue; }
          if (inB((a[0] + c[0]) / 2, (a[2] + c[2]) / 2)) { st.bldCells++; continue; }
          quad([a[0], a[1], a[2]], [b[0], b[1], b[2]], [c[0], c[1], c[2]], [d[0], d[1], d[2]], col); st.cells++; }
        for (const m of [0, M]) { const a = A[m], d = B[m]; if (a[4] || d[4] || Math.max(a[1] - a[3], d[1] - d[3]) <= 0.085) continue;
          if (inPad((a[0] + d[0]) / 2, (a[2] + d[2]) / 2) || inB((a[0] + d[0]) / 2, (a[2] + d[2]) / 2)) continue;
          const c = A[M >> 1]; wall([a[0], a[3] - 0.1, a[2]], [d[0], d[3] - 0.1, d[2]], [d[0], d[1], d[2]], [a[0], a[1], a[2]], SKIRT, [c[0], c[1] - 0.3, c[2]]); st.skirts++; } }
    });
    st.ribbon = Math.round(st.ribbon);

    // the steps: a concrete step every 0.9 m of the way, each a slab on the ground's slope (over the ditch on the culvert's fill); none on the
    // road and its strip, none within the road's room where its rails run
    for (const pa of PATHS) { if (pa.kind !== 4) continue; const Q = pa.Q;
      const n0 = near(Q[0][0], Q[0][1]), cut = !!n0 && need[n0.sd > 0 ? 1 : 0][n0.i] === 1; if (cut) st.cut.push(pa.id);
      for (let j = 0; j + 1 < Q.length; j++) { const x0 = Q[j][0], z0 = Q[j][1], dx = Q[j + 1][0] - x0, dz = Q[j + 1][1] - z0, L = Math.hypot(dx, dz), rot = Math.atan2(dz, dx);
        for (let d = 0.45; d < L; d += 0.9) { const x = x0 + dx * d / L, z = z0 + dz * d / L, n = near(x, z);
          if (n && Math.abs(n.lat) < wAt(n.i) + 0.3) continue; if (cut && inRoom(x, z)) continue;
          const y = hAt(x, z, 0).y; box(scen.get(x, z), x, y - 0.3, z, 0.9, 0.42, pa.W, rot, CONC, CONC_T); st.steps++; } } }

    // the boardwalks and footbridges: a deck of planks (of metal where the map has it) over the ground (a short one, under 70 m, straight from end
    // to end over its gully; a long one over the highest ground within 3 m along it), its edges' boards down to 0.12 m under it, a post every
    // 2.5 m or so on each side (a stout one where it stands over 3 m) and a handrail along them; none of it within the road's room (bar + 1.6 m)
    for (const pa of PATHS) { if (pa.kind !== 5) continue; const Q = pa.P, col = pa.surf === 6 ? METAL : WOOD, colP = pa.surf === 6 ? STEEL : WOOD_D, hw = pa.W / 2;
      const S = [0]; for (let j = 1; j < Q.length; j++) S.push(S[j - 1] + Math.hypot(Q[j][0] - Q[j - 1][0], Q[j][1] - Q[j - 1][1])); const len = S[S.length - 1]; if (len < 1) continue;
      // a point at the distance d along the way: x, z and the way's left hand
      const ptAt = (d) => { let j = 0; while (j < Q.length - 2 && S[j + 1] < d) j++; const L = S[j + 1] - S[j] || 1, f = Math.max(0, Math.min(1, (d - S[j]) / L));
        const dx = Q[j + 1][0] - Q[j][0], dz = Q[j + 1][1] - Q[j][1], l = Math.hypot(dx, dz) || 1; return [Q[j][0] + dx * f, Q[j][1] + dz * f, -dz / l, dx / l]; };
      const gMax = (d) => { const p = ptAt(d); let m = -1e9; for (const sg of [-1, 0, 1]) m = Math.max(m, caGround(p[0] + p[2] * sg * hw, p[1] + p[3] * sg * hw)); return m; };
      const g0 = gMax(0), g1 = gMax(len);
      const deckY = (d) => { if (len < 70) return Math.max(g0 + (g1 - g0) * d / len, gMax(d)) + 0.35; let m = -1e9; for (let e = -3; e <= 3; e += 1.5) m = Math.max(m, gMax(Math.max(0, Math.min(len, d + e)))); return m + 0.35; };
      const nP = Math.max(1, Math.ceil(len / 2.5)), D = [], out = (d) => { const p = ptAt(d), n = near(p[0], p[1]); return !n || Math.abs(n.lat) - hw >= bar(n.i, n.sd) + SIGN_LINE; };
      for (let k = 0; k <= nP; k++) { const d = len * k / nP, p = ptAt(d), y = deckY(d); D.push({ d, p, y, ok: out(d) }); }
      let drawn = 0;
      for (let k = 0; k < nP; k++) { const A = D[k], B = D[k + 1]; if (!A.ok || !B.ok || !out((A.d + B.d) / 2)) continue;
        const a = A.p, b = B.p, g = scen.get((a[0] + b[0]) / 2, (a[1] + b[1]) / 2), E = (q, y, sg, h) => [q[0] + q[2] * sg * hw, y + h, q[1] + q[3] * sg * hw];
        const ins = [(a[0] + b[0]) / 2, (A.y + B.y) / 2 - 0.06, (a[1] + b[1]) / 2];
        quad(E(a, A.y, -1, 0), E(a, A.y, 1, 0), E(b, B.y, 1, 0), E(b, B.y, -1, 0), col);
        for (const sg of [-1, 1]) wall(E(a, A.y, sg, -0.12), E(b, B.y, sg, -0.12), E(b, B.y, sg, 0), E(a, A.y, sg, 0), col, ins);
        st.deck += B.d - A.d; drawn++;
        for (const [q, y, last] of [[a, A.y, false], [b, B.y, true]]) { if (last && k + 1 < nP && D[k + 2] && D[k + 2].ok) continue;
          for (const sg of [-1, 1]) { const x = q[0] + q[2] * sg * (hw - 0.05), z = q[1] + q[3] * sg * (hw - 0.05), gy = caGround(x, z), pw = y - gy > 3 ? 0.26 : 0.1;
            box(g, x, gy - 0.2, z, pw, y + 1.0 - gy + 0.2, pw, Math.atan2(b[1] - a[1], b[0] - a[0]), colP); st.posts++; } }
        for (const sg of [-1, 1]) beam(g, E(a, A.y, sg * (1 - 0.05 / hw), 0.95), E(b, B.y, sg * (1 - 0.05 / hw), 0.95), 0.03, colP); }
      if (drawn) st.decks++; }
    st.deck = Math.round(st.deck);

    // the benches: a wooden seat on the ground and, where the map has one, its back; facing the road, a group's facing its middle; shorter where
    // the neighbours stand close (0.9 of the nearest one's distance, 0.9 to 1.6 m)
    for (const b of SPOT.bench) { const n = b.n; if (!n) continue; const g = scen.get(b.x, b.z);
      let fx = -T.nx[n.i] * n.sd, fz = -T.nz[n.i] * n.sd;
      if (b.mid) { const dx = b.mid[0] - b.x, dz = b.mid[1] - b.z, l = Math.hypot(dx, dz); if (l > 0.3) { fx = dx / l; fz = dz / l; } }
      let nn = 1e9; for (const q of SPOT.bench) if (q !== b) nn = Math.min(nn, Math.hypot(q.x - b.x, q.z - b.z));
      const Lb = Math.max(0.9, Math.min(1.6, 0.9 * nn)), hl = Lb / 2, hd = Math.atan2(fx, -fz), ux = Math.cos(hd), uz = Math.sin(hd);
      let lo = 1e9, hi = -1e9; for (const [u, v] of [[-hl, -0.25], [hl, -0.25], [hl, 0.25], [-hl, 0.25]]) { const y = caGround(b.x + ux * u + fx * v, b.z + uz * u + fz * v); lo = Math.min(lo, y); hi = Math.max(hi, y); }
      box(g, b.x, lo - 0.05, b.z, Lb, hi - lo + 0.5, 0.42, hd, WOOD);
      if (b.back) box(g, b.x - fx * 0.18, hi + 0.45, b.z - fz * 0.18, Lb, 0.42, 0.07, hd, WOOD);
      st.benches++; }

    // the litter bins: a round bin on the ground
    for (const p of SPOT.bin) { const y = caGround(p.x, p.z); cyl(scen.get(p.x, p.z), p.x, y - 0.05, p.z, 0.25, 0.9, 8, BINC, BINC); st.bins++; }

    // the guideposts: a post with two blank boards, one along the road, one along the way nearest it
    for (const p of SPOT.guide) { const g = scen.get(p.x, p.z), y = hAt(p.x, p.z, 0).b, n = p.n; let hs = n ? Math.atan2(T.tz[n.i], T.tx[n.i]) : 0, hw = hs + Math.PI / 2;
      let bw = null, bd = 1e9; for (const pa of PATHS) { const d = dWay(pa, p.x, p.z); if (d < bd) { bd = d; bw = pa; } }
      if (bw && bd < 30) { const a = bw.P[0], b = bw.P[Math.min(bw.P.length - 1, 40)]; hw = Math.atan2(b[1] - a[1], b[0] - a[0]); }
      box(g, p.x, y - 0.2, p.z, 0.11, 2.8, 0.11, hs, POST);
      box(g, p.x + Math.cos(hs) * 0.38, y + 2.2, p.z + Math.sin(hs) * 0.38, 0.85, 0.2, 0.03, hs, PALE);
      box(g, p.x + Math.cos(hw) * 0.38, y + 1.9, p.z + Math.sin(hw) * 0.38, 0.85, 0.2, 0.03, hw, PALE);
      st.guides++; }

    // the information boards: a blank panel on two posts, along the road
    for (const p of SPOT.board) { const n = p.n, g = scen.get(p.x, p.z), y = hAt(p.x, p.z, 0).b, hd = n ? Math.atan2(T.tz[n.i], T.tx[n.i]) : 0, ux = Math.cos(hd), uz = Math.sin(hd);
      for (const sg of [-1, 1]) box(g, p.x + ux * sg * 0.55, y - 0.2, p.z + uz * sg * 0.55, 0.08, 1.9, 0.08, hd, WOOD_D);
      box(g, p.x, y + 0.95, p.z, 1.3, 0.8, 0.04, hd, PALE);
      st.boards++; }

    // the lift gates: the post with the counterweight on one side, the rest post on the other, the arm across, red and white, lowered
    for (const G of SPOT.gate) { const cx = -G.tz, cz = G.tx, h = G.W / 2 + 0.3, rot = Math.atan2(cz, cx), g = scen.get(G.x, G.z);
      const ax = G.x + cx * h, az = G.z + cz * h, bx = G.x - cx * h, bz = G.z - cz * h, ya = caGround(ax, az), yb = caGround(bx, bz), yArm = Math.max(ya, yb) + 0.98;
      box(g, ax, ya - 0.2, az, 0.25, yArm - ya + 0.35, 0.25, rot, [0.7, 0.7, 0.68]);
      box(g, ax + cx * 0.45, yArm - 0.12, az + cz * 0.45, 0.6, 0.24, 0.2, rot, [0.66, 0.66, 0.64]);
      box(g, bx, yb - 0.2, bz, 0.12, yArm - yb + 0.18, 0.12, rot, [0.7, 0.7, 0.68]);
      const L = 2 * h, nSeg = 8; for (let k = 0; k < nSeg; k++) { const u = h - L * (k + 0.5) / nSeg; box(g, G.x + cx * u, yArm - 0.05, G.z + cz * u, L / nSeg, 0.1, 0.08, rot, k % 2 ? WHITE : RED); }
      st.gates++; }

    // the bicycle stand: four steel hoops in a row along the road, 0.9 m apart
    for (const p of SPOT.bike) { const n = p.n, g = scen.get(p.x, p.z), hd = n ? Math.atan2(T.tz[n.i], T.tx[n.i]) : 0, ux = Math.cos(hd), uz = Math.sin(hd), cx = -uz, cz = ux;
      for (let k = 0; k < 4; k++) { const u = (k - 1.5) * 0.9, hx = p.x + ux * u, hz = p.z + uz * u, y = caGround(hx, hz);
        for (const sg of [-1, 1]) box(g, hx + cx * sg * 0.4, y - 0.2, hz + cz * sg * 0.4, 0.05, 1.0, 0.05, hd, STEEL);
        box(g, hx, y + 0.75, hz, 0.05, 0.05, 0.85, hd, STEEL); }
      st.bikes++; }

    st.inHouse = ['bench', 'bin', 'guide', 'board', 'gate', 'bike'].flatMap((k) => SPOT[k].filter((q) => inB(q.x, q.z)).map(() => k));
    for (const g of scen.map.values()) st.verts += g.P.length / 3; st.verts -= v0;
    return st;
  }
})();
