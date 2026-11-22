// WORLD — realizem 15: Biķernieki, Latvija (docs/realizem.md, »Postopek za vse proge«)
// What OpenStreetMap maps beside the lap and the circuit's own world (js/world-bikernieki.js: lakes, reeds, buildings) does not draw:
//   · highway=raceway off the lap (the circuit's other layouts and loops): asphalt, with lanes=1 narrower, with surface=gravel as gravel;
//   · highway=tertiary (lanes=4, surface=asphalt): the street beyond the fence, its two stubs within 66 m of the lap;
//   · highway=service: surface=asphalt as asphalt, compacted or untagged as pale gravel; highway=track: compacted as gravel, the rest
//     (surface=ground, grade3 to grade5) as earth;
//   · highway=footway: asphalt or (untagged) gravel; highway=path (surface=ground, sand or none): trodden earth;
//   · barrier=gate on a drawn service road, track, footway or path outside the lap's barriers: five bars between two posts, closed across it.
// Every way is cut 66 m from the lap (there it fades into the ground), at the lap's own ground (its barriers and the verge beyond them), at the
// pit complex and the stands of the shared builder, at the circuit's buildings and in its lakes; a footway or a path also stops at a small thing
// of the builder's by the lap (a camera tower stands on grass, not on a path). No trees and no spectators on them.
// Assumed and said so in the pull request (OSM has no width on any of these ways): the widths (raceway 11 m as the lap, one lane 6 m, gravel
// loop 8 m, street 14 m, service roads and tracks 3.6 m, footways 1.8 m, paths 1.2 m), the colours, the pale gravel of the untagged service
// roads and footways, the form of the gates.
// Not drawn: ways in tunnels under the lap, steps, paths with trail_visibility=bad, gates on raceways or on ways not drawn, fences (the lap has
// the builder's own), true outlines of buildings and bleachers (the circuit's own boxes and five stands stand there), car parks, gravel beds
// (the builder's own), ditches, benches, bins, lamps, towers, tree rows.
// The two forest tracks that the collective Realizem E (#779) puts into the track file as side roads (`stranske`) are left to it: when the
// track has `stranske`, ways 256784391 and 38218947 are skipped here (no double drawing, whichever lands first).
// No names anywhere: only OSM's way and node numbers. Data: © OpenStreetMap contributors, ODbL 1.0 (README.md, »Zasluge«); x east and z south
// of the middle of the start line, in metres.
// Hooked by wrapping the look's extra (API.rbLook.bikernieki.extra): loaded right after the circuit's own world (js/world-bikernieki.js) and
// before the shared builder (js/world-rbring.js), which calls it with the scenery's chunks before its crowds and trees.
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const API = World.api, lk = API.rbLook && API.rbLook.bikernieki;
  if (!lk || !lk.extra) return;
  const { GB, box, clamp, inPoly, nrGround, nrGCol, nrDist, nrNear } = API;

  // the ways, cut 66 m from the lap: [OSM way, kind, fades at its start, at its end, [x, z, …]]; kinds: 0 raceway, 1 raceway with one lane,
  // 2 gravel raceway, 3 street, 4 asphalt service road, 5 gravel service road or track, 6 earth track, 7 asphalt footway, 8 gravel footway, 9 path
  const WAYS = [
    [4421912, 3, 1, 0, [74.2, 565.7, 123.8, 505.4]],
    [4709716, 4, 1, 1, [199.7, 355, 193.4, 388.6, 193.1, 391.5]],
    [25507828, 0, 0, 1, [-269.2, 208.9, -276.5, 210.2, -279.4, 211.2]],
    [25507836, 4, 1, 0, [-806.8, -511.4, -796.8, -513.1, -787.4, -512.3, -775.7, -508.3, -749.5, -494.9, -743.3, -493.9, -736.6, -495.8]],
    [37115942, 6, 0, 1, [-296.4, -215.6, -292.5, -229.6, -284.1, -245.8, -271.3, -256.3, -270.8, -256.9]],
    [38218946, 9, 1, 1, [3.9, 555.4, 9.1, 543.6, -3.5, 524.9, -7.6, 511.1, -9.1, 490.6, -5.3, 465.7, -18.6, 428.1, -47.8, 384.6, -95.3, 338, -107.2, 331.9, -148, 299, -162.3, 292.4, -173.6, 281.4, -194.3, 269.3, -210.7, 252.2, -220.8, 239.5, -232.3, 233.8, -248.1, 230.8, -259.7, 225.6, -266.6, 219.8, -269.2, 208.9, -271.1, 195.7, -271.7, 186.3, -273.8, 177.5, -298.5, 157]],
    [38218947, 6, 0, 1, [-268.5, -579.9, -292.4, -581.3]],
    [38218947, 6, 1, 0, [-664.8, -542, -697.8, -536, -721.4, -534.4, -739.8, -533.6]],
    [93211587, 0, 1, 1, [67.6, -11.2, 67.7, -9.5, 69.2, -5.4, 95.2, 48.2]],
    [93211600, 4, 0, 0, [32.9, -16.1, 40.8, 0.7, 69.3, 67.8, 87.3, 105, 99.9, 135.3, 103.9, 146.1]],
    [93211602, 4, 0, 1, [103.9, 146.1, 111.4, 147, 117.9, 149.6, 133.9, 167.9, 138.8, 172.4, 144.4, 175, 159.7, 178.8]],
    [93213226, 4, 0, 1, [0, 0, 16.2, -9, 26.1, -12.4, 32.9, -16.1, 35.2, -36.5, 31.9, -49.1, 29.3, -54.3, 43.1, -61]],
    [93213229, 4, 0, 0, [29.3, -54.3, 12, -46.3, 8.7, -42.5, 7.8, -37, 9.1, -32.6, 12.5, -24.8, 19.6, -17.6, 26.1, -12.4]],
    [93218052, 4, 1, 1, [26, -454.5, 23.3, -453.4, 28, -441.4, 8.3, -433.1, 4.5, -429.9, 7.3, -422.5, 9.1, -420.3, 11.1, -418.9, 13.8, -418.1, 16.8, -418.3, 38.7, -427]],
    [93218059, 5, 0, 0, [-152.2, -590.5, -167.8, -583.6, -173.8, -578.5]],
    [93218060, 5, 1, 0, [32.6, 566.9, 42, 550.9, 65.7, 506.7, 72.2, 494.1]],
    [93218065, 4, 0, 1, [-548.3, -921.2, -550, -926.5, -549.8, -933.1, -547.3, -942.7, -520.5, -998.5]],
    [93229449, 1, 1, 1, [-139, -130.3, -133, -129, -129.5, -129.1, -126.4, -130.1, -124.8, -131.9, -123.8, -134.8, -123.7, -138.6, -125.8, -155.7, -127.1, -161.4, -128.6, -165.4, -130, -167.5, -131.9, -169.2, -136.3, -171.2, -140.9, -171.4, -145.3, -170.3, -148.9, -168.6, -152.6, -165.8, -154.2, -164.2]],
    [93229449, 1, 1, 0, [-52.2, 44.2, -29.2, 56]],
    [93229455, 1, 0, 0, [-52.3, 5, -56.6, -5.6, -57.7, -16.9, -55.5, -44.8, -51.3, -62.1, -50.6, -84.6, -52.2, -100.9]],
    [171569466, 9, 0, 0, [-430, -890.5, -421.9, -881.9, -412.2, -865.7, -388, -851, -348.9, -806.9, -315.8, -774.1, -307, -760.2, -299.3, -750.9, -285, -736.7, -277.9, -722, -277.3, -643.5, -269.1, -622.4, -264.4, -619, -248.4, -609, -237.4, -597.2, -227.2, -588.7, -223.5, -579.8]],
    [171713692, 9, 0, 1, [-422.6, -919, -421.3, -922, -421.7, -927.1, -423.3, -934.5, -434.6, -978.7, -438.3, -987.7]],
    [171713704, 9, 1, 1, [-74.1, -346.1, -70.5, -334.3, -61.2, -325.1, -54.6, -312.6, -52.4, -303.4, -63.4, -286.9, -78.8, -273.7, -89, -263.3, -102.4, -246.6, -112.6, -237.8, -134.7, -225.6, -158.3, -213.2]],
    [171713704, 9, 1, 0, [-226.5, -212, -292.5, -229.6, -317.9, -246.1, -393.8, -304.1]],
    [171713706, 9, 0, 1, [-223.5, -579.8, -221.5, -560.2, -223.2, -540.8, -226.2, -529.2]],
    [171713706, 9, 1, 0, [-251.1, -238.8, -255, -219.6, -266.9, -186.4]],
    [182485056, 9, 0, 0, [-323.6, -107.3, -323.3, -124]],
    [187894035, 7, 1, 0, [-333.1, -115.3, -323.3, -124]],
    [225052880, 9, 1, 0, [-75.7, -356.6, -51, -368.5, -24.5, -379.1]],
    [225052882, 8, 0, 0, [7.8, -392.5, 27, -401.9]],
    [256784381, 9, 0, 0, [-393.8, -304.1, -404.5, -312, -456.7, -362.2, -478.6, -377.2, -562.4, -418.6, -580.6, -425.8, -605.9, -438.2, -639.2, -457.5, -660.2, -472.3, -677.5, -498.6, -697.9, -532, -697.8, -536]],
    [256784386, 0, 0, 1, [-206.2, 211, -196.4, 200.5, -157.2, 160.7]],
    [256784387, 0, 0, 0, [-245.8, 210, -236.2, 200.4, -228.4, 189.4, -223.1, 176.2]],
    [256784389, 9, 0, 0, [-431.2, -292.6, -439.6, -300.5, -462, -322.6, -468.7, -325.8, -473.3, -329.4, -488.5, -339.4, -508.9, -346.9, -573.1, -384.3, -592.4, -392, -661.7, -422.8, -709.6, -447.3, -744.3, -447.7]],
    [256784391, 5, 0, 1, [-464.9, -335.1, -480.9, -324.6, -487.4, -319.8, -516.1, -301.5]],
    [256785370, 9, 1, 0, [-805.8, -501.2, -795.2, -499.2, -783.4, -494.2, -769.9, -475.8, -709.6, -447.3]],
    [256824695, 9, 0, 0, [-326.8, -166.7, -347.1, -201, -387.7, -253.5]],
    [258252927, 5, 1, 1, [27.2, -257.8, 24.9, -263.1, 34.9, -267.7]],
    [258253093, 5, 0, 0, [40.8, 0.7, 61.8, -4.1, 69.2, -5.4]],
    [258253731, 4, 1, 0, [201, 340.7, 188.3, 337.5]],
    [258253732, 5, 0, 1, [163.5, 304.3, 160.2, 291.6, 158.2, 272.5, 160.5, 215.9, 161.5, 212.9, 164.4, 210.9, 173.5, 210.5]],
    [258253732, 5, 1, 0, [180.4, 227, 176.6, 305.4]],
    [258253733, 5, 0, 0, [178.6, 334.7, 172.9, 354.5, 158.3, 388.3, 144, 423.7, 134.3, 444.8, 127.2, 456, 91.5, 502.5]],
    [372188436, 5, 1, 0, [46.1, -410, 27, -401.9, 26.6, -394.8, 24.9, -389.9, 24.1, -377.7, 26.5, -346.7, 26.2, -342.7, 20.2, -324, -5.7, -264.7, -15, -246.1, -16.5, -239.8, -16.2, -233.8, -21.4, -229.2, -26.2, -225.9, -26.8, -211.2]],
    [374635585, 7, 0, 0, [188.3, 397.9, 142.7, 454.7, 122.6, 479.2]],
    [374635897, 4, 0, 0, [144.4, 175, 135.1, 202.9, 117.8, 211.3]],
    [374635899, 4, 0, 1, [90.7, 220.1, 81, 219, 67.8, 211.5, 65.8, 206.5, 61.4, 199.3, 54.1, 196.7, 41.8, 194.1, 24.1, 167.1, 20.2, 162.7, 14.5, 159.7, -0.9, 154.7]],
    [523849729, 0, 0, 0, [-265.9, -153.4, -255.6, -139.8, -251.2, -138.3]],
    [525812655, 8, 0, 0, [8.7, -42.5, 3, -49.7, -1.7, -50.2, -24.7, -97.5, -17.3, -115.9, -55, -191.8, -52.8, -214.2, -33, -239.7]],
    [525812658, 8, 0, 0, [-48.8, -219.3, -40, -219.8]],
    [525812660, 5, 0, 0, [-40, -219.8, -26.2, -225.9]],
    [548357986, 4, 1, 0, [-103.3, -614.7, -106.2, -612.2, -113.7, -608, -139.1, -596.6, -149.8, -591.3, -152.2, -590.5]],
    [551272258, 9, 0, 1, [-89.8, 343.7, -92.4, 353.7, -96.3, 406.1]],
    [551272487, 0, 1, 0, [-336.6, -78.8, -329, -78, -297.7, -65.6]],
    [554500800, 0, 0, 0, [-19.6, -38.7, -30, -43.3, -37, -44.2, -55.5, -44.8]],
    [554500804, 4, 0, 0, [61.4, 199.3, 66.1, 181.2]],
    [554693539, 9, 0, 0, [-326.8, -166.7, -320.3, -176, -312.8, -185.6]],
    [555968454, 7, 0, 0, [-53.7, -268.6, -42.4, -258, -16.5, -239.8]],
    [588947714, 0, 1, 0, [-60.8, 26.1, -39.9, 31.4]],
    [588947722, 2, 0, 1, [-251.2, -138.3, -227.2, -133.3, -218.4, -129.5, -212.1, -124.3, -205.8, -117.1, -201.3, -107.5]],
    [588947722, 2, 1, 1, [-205.3, -65.6, -221.3, -45.1, -227.4, -36.1, -229.7, -28, -229.9, -21.1, -223, 37.7, -209.7, 130.1, -207.7, 135.3, -202.4, 139.6, -195.3, 142.2, -184.8, 142.2, -177.4, 135.9, -174.9, 125.4, -173.4, 108.5]],
    [684243767, 4, 0, 1, [117.9, 149.6, 138.5, 138.6]],
    [738493084, 4, 1, 0, [135.6, 515.2, 123.8, 505.4]],
    [740733996, 9, 1, 0, [-335.5, -34.3, -331.7, -31.8, -319.3, -48, -312.2, -58.7]],
    [740734012, 9, 1, 0, [-323.3, -305.7, -337.8, -298.8, -368.6, -284.8]],
    [740734021, 9, 1, 0, [-316.9, -630, -304.2, -619.1, -281, -595.9, -271.1, -587.2, -268.5, -579.9]],
    [740734024, 9, 1, 0, [-639, -595.6, -697.8, -536]],
    [793166572, 9, 1, 0, [-716.6, -403.8, -704.2, -399]],
    [864955518, 9, 0, 0, [-444.8, -350.8, -450.4, -344.1, -456.4, -339.6]],
    [930694355, 5, 0, 1, [-52.3, 5, -67.5, 12.2, -67.9, 12]],
    [932616913, 9, 0, 1, [-727.4, -609.1, -742.7, -610.3, -754.9, -616.3, -764.4, -625.4, -769.9, -627.9]],
    [933825271, 5, 0, 0, [-438.7, -884, -437.5, -894, -435.2, -900.7]],
    [945640986, 0, 0, 1, [-239.5, -175.8, -228.2, -178, -206.5, -180.3]],
    [945640986, 0, 1, 0, [-158.8, -190.3, -129.5, -199.7, -120.8, -201.1]],
    [964935173, 5, 0, 0, [94.3, 196.3, 102.2, 190.1, 109.6, 181.3, 114.8, 174.3, 115.6, 166.3, 114.1, 153.3, 117.9, 149.6]],
    [990460512, 4, 1, 0, [-26.4, -537.3, -33.9, -540.1, -38.9, -554.3]],
    [1092293461, 6, 1, 0, [56.5, -365.5, 45.6, -374.6, 29.3, -395.8, 26.9, -397.9]],
    [1092293462, 5, 0, 1, [-16.2, -233.8, 1.5, -233.1, 4.1, -233.5]],
    [1094946440, 4, 0, 0, [-456.4, -339.6, -464.9, -335.1]],
    [1094951613, 9, 0, 0, [-52.4, -303.4, -42.6, -319.2, -41.1, -334, -51, -358.7, -51, -368.5]],
    [1094957609, 9, 0, 1, [-205.6, -556.3, -175.4, -542.3, -170.1, -536.6, -162.3, -524.9, -155.4, -510.1, -143.7, -476.4, -140.1, -469.5]],
    [1094957609, 9, 1, 1, [-99.3, -408.7, -84.7, -388, -79.9, -368.8]],
    [1095357613, 9, 0, 0, [-404.5, -312, -392.6, -311.3, -369.7, -300.1, -346.7, -294.8]],
    [1120077076, 6, 0, 0, [-331.7, -31.8, -330.6, -43.9, -332.4, -66.1]],
    [1120100970, 0, 0, 0, [-297.7, -65.6, -287.5, -64.1, -278.8, -67.1, -270.6, -75.9]],
    [1120158806, 0, 0, 0, [-120.8, -201.1, -111.4, -199.7, -102, -195.4, -92.7, -186.8]],
    [1120160270, 0, 0, 0, [-197.9, 225.8, -217.7, 217.7, -230.8, 213, -245.8, 210]],
    [1120160272, 0, 0, 0, [-245.8, 210, -257.2, 208.9, -269.2, 208.9]],
    [1120160990, 0, 0, 0, [-265.9, -153.4, -257.7, -166.2, -253.1, -169.9, -248.4, -172.8, -239.5, -175.8]],
    [1120176766, 9, 0, 0, [-387.7, -253.5, -422.2, -284.8]],
    [1120176767, 9, 0, 0, [-387.7, -253.5, -387.9, -260.6, -415.5, -286.9, -417, -289.2, -420.2, -292.5, -431.5, -300.5, -439.6, -300.5]],
    [1120176768, 9, 0, 0, [-422.2, -284.8, -431.2, -292.6]],
    [1120359527, 3, 0, 1, [123.8, 505.4, 168.2, 453.1]],
    [1148557171, 9, 0, 0, [-438, -865.4, -431.2, -864.8, -412.2, -865.7]],
    [1148557172, 9, 0, 0, [-271.3, -628.1, -261.8, -631.5]],
    [1148557342, 9, 0, 0, [-672.9, -561, -672.3, -540.5, -671.3, -528.8, -673.7, -518.6, -673.9, -509.1, -670.5, -496, -655.9, -483.1, -650.4, -476.4, -639.2, -457.5]],
    [1152486990, 9, 0, 0, [-323.7, -95.8, -323.6, -107.3]],
    [1152971733, 4, 0, 0, [4.5, -429.9, -7.8, -424.4, -10.8, -426.9, -34.3, -476.8]],
    [1181366025, 9, 0, 1, [-737.2, -439.6, -757.5, -436.3, -774.2, -438.4]],
    [1219063011, 4, 0, 0, [-197.8, -588.6, -212.7, -581.2]],
    [1220026550, 9, 0, 0, [-501, -896.6, -472.4, -891, -448.9, -879.1, -446.6, -869.9, -438, -865.4]],
    [1220026557, 9, 0, 0, [-438.7, -884, -438, -865.4]],
    [1222204480, 9, 0, 0, [-205.6, -556.3, -216.4, -574.4, -218, -580]],
    [1259819639, 9, 1, 0, [-801.7, -482.6, -785.4, -476.7, -769.9, -475.8]],
    [1268596250, 9, 0, 1, [-468.7, -325.8, -474.5, -310.8, -478.6, -302.1, -483.1, -290.9, -486.2, -277.2]],
    [1279278050, 9, 0, 0, [-42.6, -319.2, -27.5, -347.7, -29.9, -361.8, -32.9, -370.2, -32.9, -375.7]],
    [1287323461, 5, 0, 1, [138.2, 193.7, 168.2, 197.8]],
    [1287323462, 5, 0, 0, [188.3, 337.5, 178.6, 334.7, 171.4, 328.4, 168.5, 322.2, 166.9, 314.9, 163.5, 304.3]],
    [1287323463, 5, 0, 0, [163.5, 304.3, 189.9, 306.6]],
    [1333030895, 9, 0, 1, [-769.9, -475.8, -781.5, -446]],
    [1374232649, 9, 0, 0, [-769.9, -475.8, -744.3, -447.7, -737.2, -439.6, -704.2, -399]],
    [1374232650, 9, 0, 1, [-487.4, -319.8, -492.6, -307.6, -496.4, -294.2, -499.2, -289.2]],
    [1374232651, 9, 0, 0, [-323.3, -124, -321.9, -127.4, -319.7, -139.9, -324.5, -159.7, -326.8, -166.7]],
    [1374232653, 9, 0, 0, [-250.7, -579.5, -235.6, -573.5, -221.5, -560.2, -205.6, -556.3]],
    [1374232656, 6, 0, 0, [-218, -580, -250.7, -579.5, -268.5, -579.9]],
    [1374232657, 9, 0, 1, [-438, -865.4, -440.8, -855.6, -446.3, -841.9]],
    [1375885395, 9, 1, 0, [-588.4, -700.7, -624.9, -737.9]],
    [1375885396, 9, 1, 0, [-631.2, -611.8, -674, -639.8]],
    [1435177480, 0, 1, 0, [-46.9, 55.7, -29.2, 56]],
    [1435177481, 1, 1, 0, [-10.4, 134.3, -9.4, 132.1, -8.6, 127.9, -8.4, 116.7, -9.7, 101.4]],
    [1435177482, 1, 0, 1, [-29.2, 56, -37.7, 75.6]],
    [1435177483, 1, 0, 1, [-55.5, -44.8, -61.4, -65.3, -64.3, -72.1, -69.3, -81.1, -74.1, -90.7, -78.6, -94.6, -81.5, -96.1, -84.4, -97.2, -87.7, -97.9, -90.8, -98, -94.2, -97.7, -97.6, -96.2, -99.8, -94.1, -101.1, -91.5, -101, -88.5, -89, -28.9]],
    [1435177484, 1, 0, 0, [102.1, 210.9, 74.3, 189.4, 66.1, 181.2, 31.8, 129.2, 8.4, 111.7, -9.7, 101.4]],
    [1435177485, 1, 0, 0, [-9.7, 101.4, -39.9, 31.4, -52.3, 5]],
    [1436460755, 7, 0, 1, [57.1, -27.5, 51.5, -37.3, 50.9, -39.3, 52.1, -43.1]],
    [1436460755, 7, 1, 0, [118.5, 98.5, 116.5, 97.6, 108, 92.1]],
    [1466726919, 9, 0, 1, [-337.8, -298.8, -307.9, -291.3]],
    [1522898254, 9, 0, 1, [-323.7, -101.5, -334.1, -105.1]],
    [1531275231, 7, 1, 0, [194.2, 386.8, 188.3, 397.9]],
    [1531275234, 7, 1, 0, [169.3, 451.1, 162.1, 445.5]],
    [1531275235, 7, 0, 0, [162.1, 445.5, 154.7, 439.7]],
    [1531961988, 7, 0, 1, [122.6, 479.2, 57.6, 558.6, 50.3, 568.7]],
  ];
  const GATE = [[1080594603, 5, -152.2, -590.5, -15.6, 6.9], [2625350996, 9, -266.6, 219.8, -9.4, -16.7], [2625351053, 5, -464.9, -335.1, -8.4, 5.7], [2625351103, 4, 16.2, -9, 26.1, -12.4], [2625351132, 0, -196.4, 200.5, 48.3, -49.6], [2625351147, 4, -212.7, -581.2, -14.9, 7.4], [2625351172, 9, -450.4, -344.1, -11.6, 11.2], [2625351248, 9, -271.1, 195.7, -2.5, -22.6], [2636488155, 4, 188.3, 337.5, -14, -3.6], [5098958990, 0, -255.6, -139.8, 9.4, 8.2], [5363424579, 7, -42.4, -258, 24.2, 19.8], [8062106290, 6, -721.4, -534.4, -42, 2.3], [8926462511, 5, 102.2, 190.1, 15.2, -15], [10723808802, 4, 0.8, -428.2, -12.3, 5.5]];
  const ASPHALT = [0.95, 0.95, 0.97], GRAVEL = [1.485, 1.406, 1.247], EARTH = [1.3, 1.1, 0.82], GALV = [0.62, 0.64, 0.66];
  const HW = [5.5, 3, 4, 7, 1.8, 1.8, 1.8, 0.9, 0.9, 0.6], COL = [ASPHALT, ASPHALT, GRAVEL, ASPHALT, ASPHALT, GRAVEL, EARTH, ASPHALT, GRAVEL, EARTH];
  const LIFT = [0.065, 0.065, 0.065, 0.058, 0.051, 0.051, 0.044, 0.037, 0.037, 0.03];   // (the wider and the paved lie over the narrower where they cross)
  const SIDE = [256784391, 38218947];   // the two forest tracks of the side roads (`stranske`)
  const FADE = 6, STEP = 3.5, EPS = 1e-9, VERGE = 2.9, CELL = 1e6;   // (VERGE: a ribbon ends 0.3 m under the outer edge of the lap's verge; CELL: one mesh per square of this side)

  const pts = (f) => { const P = []; for (let k = 0; k + 1 < f.length; k += 2) P.push([f[k], f[k + 1]]); return P; };
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  // --- a flat piece laid on the terrain's own triangles (the mesh has two per 8 m cell: nrGround) ---
  function cut(P, f) {   // both sides of the line f = 0 (a point on it goes to both); a crossing is always worked out from the same end, so neighbours share it bit for bit
    const A = [], B = [];
    for (let k = 0; k < P.length; k++) {
      const p = P[k], q = P[(k + 1) % P.length], fp = f(p), fq = f(q);
      if (fp <= EPS) A.push(p);
      if (fp >= -EPS) B.push(p);
      if ((fp < -EPS && fq > EPS) || (fp > EPS && fq < -EPS)) {
        const sw = p[0] > q[0] || (p[0] === q[0] && p[1] > q[1]), a = sw ? q : p, b = sw ? p : q, fa = sw ? fq : fp, fb = sw ? fp : fq, t = fa / (fa - fb);
        const m = a.map((v, i) => v + (b[i] - v) * t); A.push(m); B.push(m);
      }
    }
    return [A, B];
  }
  function fan(D, P, lift) {   // one part inside one of the terrain's triangles: a fan, lift over the ground (slivers skipped)
    if (P.length < 3) return;
    const V = P.map(p => [p[0], nrGround(p[0], p[1]) + lift, p[1]]), UV = P.map(p => [p[0] / 8, -p[1] / 8]), CL = P.map(p => [p[2], p[3], p[4]]);
    for (let k = 1; k + 1 < P.length; k++) {
      const a2 = (P[k][0] - P[0][0]) * (P[k + 1][1] - P[0][1]) - (P[k][1] - P[0][1]) * (P[k + 1][0] - P[0][0]);
      if (Math.abs(a2) < 2e-6) continue;
      D.g.triUp(V[0], V[k], V[k + 1], [CL[0], CL[k], CL[k + 1]], [UV[0], UV[k], UV[k + 1]]); D.n++;
    }
  }
  function drape(D, P, lift) {   // P: convex, its points [x, z, r, g, b]; by the terrain's columns, then its cells, then each cell's diagonal
    const G = D.G, C = API.NRC || 8; let x0 = 1e9, x1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
    let rest = P;
    for (let i = Math.floor((x0 - G.x0) / C); rest.length >= 3; i++) {
      const X = G.x0 + C * (i + 1); let col;
      if (X >= x1) { col = rest; rest = []; } else [col, rest] = cut(rest, p => p[0] - X);
      if (col.length < 3) continue;
      let z0 = 1e9, z1 = -1e9; for (const p of col) { z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
      let restZ = col;
      for (let j = Math.floor((z0 - G.z0) / C); restZ.length >= 3; j++) {
        const Z = G.z0 + C * (j + 1); let cell;
        if (Z >= z1) { cell = restZ; restZ = []; } else [cell, restZ] = cut(restZ, p => p[1] - Z);
        if (cell.length < 3) continue;
        const S = G.x0 + G.z0 + C * (i + j + 1);
        for (const part of cut(cell, p => p[0] + p[1] - S)) fan(D, part, lift);
      }
    }
  }
  function quad(D, Q, lift) {   // a ribbon's quad: convex in one piece, otherwise along the diagonal through its reflex corner
    const cr = (k) => { const a = Q[(k + 3) % 4], b = Q[k], c = Q[(k + 1) % 4]; return (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]); };
    const s = [cr(0), cr(1), cr(2), cr(3)], pos = s.filter(v => v > 1e-9).length, neg = s.filter(v => v < -1e-9).length;
    if (!pos || !neg) { drape(D, Q, lift); return; }
    const k = s.findIndex(v => (pos < neg ? v > 1e-9 : v < -1e-9));
    if (k === 1 || k === 3) { drape(D, [Q[0], Q[1], Q[3]], lift); drape(D, [Q[1], Q[2], Q[3]], lift); }
    else { drape(D, [Q[0], Q[1], Q[2]], lift); drape(D, [Q[0], Q[2], Q[3]], lift); }
  }
  function sections(P, hw) {   // a way's cross sections: mitred at its bends, every STEP m between them
    const n = P.length, seg = [], cum = [0];
    for (let k = 0; k + 1 < n; k++) { const dx = P[k + 1][0] - P[k][0], dz = P[k + 1][1] - P[k][1], l = Math.hypot(dx, dz) || 1e-6; seg.push({ l, nx: -dz / l, nz: dx / l }); cum.push(cum[k] + l); }
    const J = [];
    for (let k = 0; k < n; k++) {
      const a = seg[Math.max(0, k - 1)], b = seg[Math.min(n - 2, k)]; let nx = a.nx + b.nx, nz = a.nz + b.nz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const c0 = Math.max(0.625, nx * a.nx + nz * a.nz);
      J.push({ nx, nz, w: hw / c0, back: hw * Math.sqrt(Math.max(0, 1 - c0 * c0)) / c0 });
    }
    const S = [], put = (u, x, z, nx, nz, w) => S.push({ u, c: [x, z], a: [x + nx * w, z + nz * w], b: [x - nx * w, z - nz * w] });
    for (let k = 0; k < n; k++) {
      put(cum[k], P[k][0], P[k][1], J[k].nx, J[k].nz, J[k].w);
      if (k === n - 1) break;
      const s = seg[k], m = Math.max(1, Math.ceil(s.l / STEP));
      for (let q = 1; q < m; q++) {
        const d = s.l * q / m; if (d < J[k].back + 0.2 || d > s.l - J[k + 1].back - 0.2) continue;
        const t = d / s.l; put(cum[k] + d, P[k][0] + (P[k + 1][0] - P[k][0]) * t, P[k][1] + (P[k + 1][1] - P[k][1]) * t, s.nx, s.nz, hw);
      }
    }
    return { S, U: cum[n - 1] };
  }
  function prism(g, P, T, y0, y1, wc, tc, uc) {   // an outline's walls (outward), its top and, if asked, its underside
    let A = 0; for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length]; A += a[0] * b[1] - b[0] * a[1]; }
    const sg = A > 0 ? 1 : -1;
    for (let k = 0; k < P.length; k++) {
      const a = P[k], b = P[(k + 1) % P.length], el = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = sg * (b[1] - a[1]) / el, nz = -sg * (b[0] - a[0]) / el;
      g.quadO([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], wc, [(a[0] + b[0]) / 2 - nx, (y0 + y1) / 2, (a[1] + b[1]) / 2 - nz]);
    }
    for (let k = 0; k + 2 < T.length; k += 3) {
      const a = P[T[k]], b = P[T[k + 1]], c = P[T[k + 2]];
      g.triUp([a[0], y1, a[1]], [b[0], y1, b[1]], [c[0], y1, c[1]], [tc, tc, tc]);
      if (uc) g.triO([a[0], y0, a[1]], [b[0], y0, b[1]], [c[0], y0, c[1]], uc, [a[0], y0 + 5, a[1]]);
    }
  }

  const prev = lk.extra;
  lk.extra = (o) => {
    const st = prev(o) || {}, T = API.T, def = T.def, sk = def.sk || {};
    const within = (x, z, m) => { const q = nrNear(x, z); return q.i >= 0 && q.dd < m; };
    const onLap = (x, z) => within(x, z, VERGE);   // on the lap's own ground: its barriers and the grass verge beyond them (rbVerge)
    const keep = (x, z, r) => { o.exclPush(x, z, r); if (nrDist(x, z) < 60) o.CR.avoid(x, z, r); };   // no trees, no spectators
    // what stands in a way's way: the circuit's buildings (0.6 m around each), its lakes, the builder's pit complex and stands
    const bld = [], b6 = sk.bld || [], lakes = (sk.lakes || []).map(L => pts(L.slice(1))), zones = [];
    for (let k = 0; k + 5 < b6.length; k += 6) { const r = b6[k + 4] * Math.PI / 180; bld.push([b6[k], b6[k + 1], b6[k + 2] / 2 + 0.6, b6[k + 3] / 2 + 0.6, Math.cos(r), Math.sin(r)]); }
    if (lk.pitBox) zones.push([lk.pitBox[0] - 22, lk.pitBox[1] + 22, lk.pitBox[2], 29]);   // [from, to (m from the start line), side, m beyond the barrier]: the apron and the garages
    for (const [a, b, sd, rows] of def.stands || []) zones.push([a - 3, b + 3, sd, rows * 0.95 + 6]);
    const free = (x, z) => {
      for (const b of bld) { const dx = x - b[0], dz = z - b[1]; if (Math.abs(dx * b[4] + dz * b[5]) < b[2] && Math.abs(dz * b[4] - dx * b[5]) < b[3]) return false; }
      for (const P of lakes) if (inPoly(P, x, z)) return false;
      const q = nrNear(x, z); if (q.i < 0 || !zones.length) return true;
      const L = T.len, sd = q.lat < 0 ? -1 : 1, dd = q.dd; let s = q.i * T.ds - T.startS; s = ((s % L) + L) % L; if (s > L / 2) s -= L;
      for (const [a, b, zs, dep] of zones) if (sd === zs && s >= a && s <= b && dd < dep) return false;
      return true;
    };
    const tiles = new Map(), G = API.NR.G;
    const tile = (x, z) => { const k = Math.floor(x / CELL) + ',' + Math.floor(z / CELL); let D = tiles.get(k); if (!D) tiles.set(k, D = { g: new GB(true), G, n: 0 }); return D; };
    const pull = (c, e) => {   // an edge point on the lap's ground pulled toward the middle; the fraction of the half width left
      if (!onLap(e[0], e[1])) return 1;
      let lo = 0, hi = 1;
      for (let k = 0; k < 7; k++) { const t = (lo + hi) / 2; if (onLap(c[0] + (e[0] - c[0]) * t, c[1] + (e[1] - c[1]) * t)) hi = t; else lo = t; }
      e[0] = c[0] + (e[0] - c[0]) * lo; e[1] = c[1] + (e[1] - c[1]) * lo; return lo;
    };
    // a small thing of the builder's (a camera tower by the lap): its keep-off circle holds the point and nothing 12 m around does; the footways and paths stop at it
    const RING = [0, 1, 2, 3, 4, 5, 6, 7].map(k => [Math.cos(k * Math.PI / 4) * 12, Math.sin(k * Math.PI / 4) * 12]);
    const small = (x, z) => o.excluded(x, z) && !RING.some(([dx, dz]) => o.excluded(x + dx, z + dz));
    const clear = (s, hw) => !onLap(s.c[0], s.c[1]) && free(s.c[0], s.c[1]) && (hw <= 2 || (free(s.a[0], s.a[1]) && free(s.b[0], s.b[1]))) && !(hw < 1 && small(s.c[0], s.c[1]));
    const edge = (g, b, hw) => {   // the last good section between a good one and a bad one
      const at = (t) => ({ u: g.u + (b.u - g.u) * t, c: lerp2(g.c, b.c, t), a: lerp2(g.a, b.a0, t), b: lerp2(g.b, b.b0, t) });
      const fine = (s) => clear(s, hw) && !onLap(s.a[0], s.a[1]) && !onLap(s.b[0], s.b[1]);
      let lo = 0, hi = 1;
      for (let k = 0; k < 7; k++) { const t = (lo + hi) / 2; if (fine(at(t))) lo = t; else hi = t; }
      return lo > 0.02 ? at(lo) : null;
    };
    // first every way's runs (what is free of the above), then the ribbons: the narrow and unpaved first, so the wider lie over them
    const skip = (def.stranske || []).length ? SIDE : [], all = [];
    for (const [id, kind, f0, f1, flat] of WAYS) {
      if (skip.includes(id)) continue;
      const hw = HW[kind], { S, U } = sections(pts(flat), hw);
      for (const s of S) {
        s.a0 = s.a.slice(); s.b0 = s.b.slice();
        const left = pull(s.c, s.a) + pull(s.c, s.b);
        s.ok = left >= 1 && clear(s, hw);
      }
      let run = [];
      const flush = () => { if (run.length > 1 && run[run.length - 1].u - run[0].u >= 3) all.push({ kind, f0, f1, U, run }); run = []; };
      for (let k = 0; k < S.length; k++) {
        const s = S[k], p = k ? S[k - 1] : null;
        if (s.ok) { if (p && !p.ok) { const e = edge(s, p, hw); if (e) run.push(e); } run.push(s); }
        else { if (p && p.ok) { const e = edge(p, s, hw); if (e) run.push(e); } flush(); }
      }
      flush();
    }
    all.sort((a, b) => LIFT[a.kind] - LIFT[b.kind]);
    let metres = 0;
    for (const { kind, f0, f1, U, run } of all) {
      const hw = HW[kind], base = COL[kind];
      const vtx = (p, u) => {   // a cut end fades into the ground's own colour over its last FADE m
        const w = clamp(Math.max(f0 ? 1 - u / FADE : 0, f1 ? 1 - (U - u) / FADE : 0), 0, 1);
        if (w <= 0) return [p[0], p[1], base[0], base[1], base[2]];
        const gc = nrGCol(p[0], p[1]), t = w * w * (3 - 2 * w);
        return [p[0], p[1], base[0] + (gc[0] * 1.2 - base[0]) * t, base[1] + (gc[1] * 1.2 - base[1]) * t, base[2] + (gc[2] * 1.2 - base[2]) * t];
      };
      for (let k = 0; k + 1 < run.length; k++) { const p = run[k], q = run[k + 1]; quad(tile(p.c[0], p.c[1]), [vtx(p.a, p.u), vtx(q.a, q.u), vtx(q.b, q.u), vtx(p.b, p.u)], LIFT[kind]); }
      for (const s of run) keep(s.c[0], s.c[1], Math.max(hw + 1.5, 2.4));
      metres += run[run.length - 1].u - run[0].u;
    }
    st.osmRuns = all.length; st.osmMetres = Math.round(metres); st.osmTris = 0; st.osmTiles = 0;
    const mat = new THREE.MeshLambertMaterial({ map: o.tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
    for (const D of tiles.values()) {
      if (D.g.empty) continue;
      const m = new THREE.Mesh(D.g.geometry(), mat);
      m.receiveShadow = true; m.matrixAutoUpdate = false; m.name = 'osmWays'; o.root.add(m); st.osmTris += D.n; st.osmTiles++;
    }
    // the gates: five bars between two posts, closed across the way, as wide as it
    const rod = API.ouRod; st.osmGates = 0;
    if (rod) for (const [, kind, x, z, dx, dz] of GATE) {
      if (kind < 4 || onLap(x, z) || !free(x, z)) continue;
      const l = Math.hypot(dx, dz) || 1, px = -dz / l, pz = dx / l, W = Math.max(HW[kind], 0.75), g = o.scen.get(x, z);
      const ya = nrGround(x - px * W, z - pz * W), yb = nrGround(x + px * W, z + pz * W), Y = (t) => ya + (yb - ya) * (t + W) / (2 * W), at = (t, h) => [x + px * t, Y(t) + h, z + pz * t];
      for (const t of [-W - 0.07, W + 0.07]) box(g, x + px * t, Y(t) - 0.2, z + pz * t, 0.12, 1.55, 0.12, Math.atan2(pz, px), GALV, GALV, true);
      for (const h of [0.22, 0.45, 0.68, 0.91, 1.14]) rod(g, at(-W, h), at(W, h), 0.025, GALV, 4);
      for (const t of [-W, 0, W]) rod(g, at(t, 0.22), at(t, 1.14), 0.025, GALV, 4);
      rod(g, at(-W, 0.22), at(W, 1.14), 0.02, GALV, 4);
      keep(x, z, W + 1); st.osmGates++;
    }
    return st;
  };
})();
