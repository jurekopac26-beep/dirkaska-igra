/* =====================================================================================================================================
   WORLD — Lusail, Katar: what lies by the road past the barriers (grafika ob progi), from OpenStreetMap, on js/world-lusail.js (the
   builder's hook LK.extra wrapped: what is here is laid out first, so js/world-lusail.js's lone trees, the builder's trees and the crowds
   keep clear of it, then js/world-lusail.js's own parts).
   Drawn: the karting track (OSM area:highway=raceway, sport=karting, its outline within ~60-190 m of the road; no surface tag: asphalt,
     assumed); the walls (OSM barrier=wall, 27; no height or material in OSM: 2 m of concrete, 0.25 m thick, assumed; their colour after
     WALL_B, the user's choice in the PR: (a) grey precast concrete, (b) sand-coloured render); the fences (OSM barrier=fence, 7, the four
     round the karting track among them; no height or build in OSM: 2 m of chain-link mesh on steel posts, assumed); the gates (OSM
     barrier=gate, 5; shut, assumed); the concrete block on a footway (OSM barrier=block); the bleachers (OSM leisure=bleachers, no height)
     by the tight right-hand corner some 700 m before the finish line, in two parts after their outline (the long part facing the braking
     zone, the short south part facing the corner's apex), rows of steps, empty, the rows' depth and rise assumed; the footways (OSM
     highway=footway; no width or surface in OSM: 2 m of paving, assumed).
   Kept open (docs/realizem.md: only from sources): the karting track's kerbs and markings (not in OSM).
   Not drawn again: the circuit's paved area, the barriers, the run-off and the grandstands (the builder's), the service roads, the
     buildings, the carports, the paddock, the palms and the lawns (js/world-lusail.js); nothing within the barriers; the fences along the
     circuit (the builder's catch fences); no names of the circuit, the karting track, its clubs or its operators.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-22; metres, origin = the finish line, x east, z south
   (tools/lusail/lusail.json's lat0/lon0); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.lusail;
  if (!LK || typeof LK.extra !== 'function') return;

  const WALL_B = false;   // the walls without a material in OSM: false (a) grey precast concrete, true (b) sand-coloured render (the user's choice, PR)
  // the karting track's outline, the outer and the inner ring: [x0, z0, x1, z1, ...] (closed)
  const KART_O = [902.8,-293.3,900.6,-294.7,898.2,-295.6,893.2,-295.8,890.7,-295.2,885.1,-292.2,879.7,-288.4,874.6,-284,866.8,-275.3,864.9,-271.9,863.7,-267,863.6,-255.9,862.9,-253.5,861.6,-251.4,859.9,-249.7,857.8,-248.5,850.1,-245,844.2,-243.2,838.1,-242.1,687.8,-223.4,683,-222.5,675,-219.7,672.1,-218.1,663.3,-211.8,661.7,-210.1,660.7,-208.1,660.3,-205.9,660.5,-203.6,661.4,-201.4,662.8,-199.7,664.6,-198.3,667.8,-197.2,668.5,-196.3,668.6,-195.3,666.3,-190.4,664,-186.9,653.9,-174,652.3,-170.5,651.3,-166.8,651,-163.5,651.2,-160.2,652,-157,654,-153.6,656.9,-150.6,659.8,-148.6,663.1,-147.2,670.7,-145.5,674.8,-145.1,683,-145.4,685.2,-145.7,687.2,-146.6,688.9,-147.9,692,-152.1,693.3,-154.9,694,-157.9,694.2,-161,692.4,-177.4,692.8,-180.9,693.7,-184.3,695.5,-187.8,698,-190.8,704.8,-197,705.7,-197.5,706.7,-197.5,707.8,-196.8,708.4,-195.6,708.4,-190.6,707.3,-183.5,705.1,-175.4,704.8,-170.7,706.2,-162.1,708.5,-158.4,710.7,-156.4,713.4,-154.9,716.7,-153.9,720.6,-153.9,727.6,-155.2,731.4,-156.4,735.1,-158,738.7,-160.2,742,-162.9,744.3,-165.5,745.6,-168.9,744.6,-177,744.8,-180.9,745.8,-184.6,747.8,-188.1,750.3,-191.1,753.2,-193.6,764.4,-200.8,773.1,-204.3,775.3,-204.3,777.3,-203.7,783.4,-198.8,784.9,-198.1,788.4,-197.7,796.7,-198.3,800.5,-200.1,805.6,-203.9,807.1,-204.6,808.8,-204.8,810.4,-204.3,812.4,-202.3,812.9,-201,812.7,-199.2,811.1,-196,809.7,-194.8,804.4,-192.4,800.8,-191.6,788.8,-191.3,782.6,-190.1,776.7,-188.1,769.5,-184.6,766.3,-182.7,763.5,-180.3,761.3,-177.4,759.4,-173.5,757.6,-165,757.4,-160.6,757.6,-157.5,758.2,-155.6,760.7,-152.3,762.9,-151,765.3,-150.3,774.1,-150.1,864.9,-165.2,870.7,-166.3,876.3,-167.9,880.1,-170,883.5,-172.7,886.4,-175.8,888.7,-179.7,889.6,-182.4,889.8,-185.2,889.5,-188,888.6,-190.6,886.9,-193.4,884.6,-195.7,881.8,-197.3,878.8,-198.3,872.3,-198.9,870.7,-199.7,869.9,-201,869.6,-202.4,870,-203.8,888,-225.9,889.8,-227.7,892,-228.8,894.6,-229.1,897,-228.6,899.1,-227.4,910.5,-215.7,913.2,-214,916.3,-212.8,919.5,-212.2,922.8,-212.2,937.4,-216.3,941.2,-218,944.4,-220.7,946.7,-224.1,948.1,-228,948.3,-231.5,947.5,-236.2,943.3,-245.7,913.3,-289.7,908.9,-293.9,903.5,-296.7,902.8,-293.3];
  const KART_I = [935.5,-223.6,937.8,-225.1,939.6,-227.2,940.6,-229.8,940.8,-232.5,940.1,-235.2,937.4,-241.1,908.5,-284.3,906.1,-286.4,903.4,-287.8,900.4,-288.5,897.2,-288.4,894.2,-287.6,887,-283.3,883.1,-280.4,876,-273.3,874,-270.6,872.6,-267.6,872.3,-264.1,872.9,-257.5,872.6,-254.5,871.7,-251.6,870.1,-248.6,868,-246,865.3,-243.9,859.9,-240.7,853.8,-237.8,849,-236.2,844,-235.3,707.4,-217.6,703.4,-217,699.6,-215.6,696.4,-213.7,686.7,-204.6,682.4,-200.2,678.8,-195.3,670.6,-181.2,664.1,-173.2,660.8,-168.4,659.8,-165.3,659.9,-162.4,660.8,-159.5,662.5,-157,668.3,-154.1,672,-153.2,679.8,-153.4,681.9,-153.8,683.7,-154.7,685.3,-156,686.5,-157.8,687.1,-159.7,687.2,-161.8,684.8,-174.8,684.8,-179.7,685.7,-184.5,687,-187.8,688.8,-191,691,-193.8,702,-205,703.4,-206.5,705.1,-207.4,707.1,-207.9,709.5,-207.8,713.4,-205.9,714.7,-204.6,715.7,-202.7,716.4,-192.8,715.5,-182.7,713.5,-173.8,713.1,-167.7,713.8,-165.5,715.2,-163.5,717.2,-162.1,719.2,-161.7,724,-162.2,729.8,-163.7,735.7,-167,737.1,-168,738,-169.5,738.3,-171.3,737.5,-178.1,738.1,-183.1,739.6,-187.7,742.1,-191.9,745.2,-195.5,753.5,-203.2,758.6,-206.5,764.1,-209.1,769.1,-210.8,774.2,-211.8,777.5,-211.7,780.6,-210.9,783.4,-209.7,788.1,-206.1,790.8,-205.2,792.8,-205.2,794.8,-205.6,804.5,-211,807.5,-211.8,810.7,-211.9,813.8,-211.3,816.2,-210.3,820.4,-207,821.7,-203.7,821.4,-196.7,818.8,-191.6,816.7,-189.6,809.1,-185.6,805.3,-184.5,801.4,-184,791.6,-183.9,785.8,-183,780.8,-181.4,776.1,-179.2,771.7,-176.3,769.4,-174.5,767.6,-172.2,766.5,-169.5,765.8,-160.6,766.4,-159.2,767.6,-158.1,771.1,-157.5,871,-174,873.8,-174.6,876.4,-175.8,878.7,-177.6,880.4,-179.4,882.5,-183.7,882.7,-185.5,882.3,-187.2,881.4,-188.8,880.1,-189.9,878.4,-190.6,869.7,-190.8,867.4,-191.6,865.3,-193.2,863.6,-195.3,862.5,-198,862.5,-201.7,863.5,-205.6,865.1,-208.5,882.5,-230.5,886.8,-234.6,889.4,-236,892.4,-236.9,895.4,-237.1,898.9,-236.5,902.2,-235.1,905,-232.9,916.1,-221.7,918,-220.6,920.1,-219.9,924.6,-219.9,935.5,-223.6];
  // the walls: [x0, z0, x1, z1, ...] each
  const WALLS = [[-31.4,-629.8,-26.6,-616.7,-18.8,-597.5,-15.4,-586.5,-9.5,-564.2,-3.5,-537,-2.6,-530.6,-2.1,-518.3,3.1,-518.2,3.1,-496.7,11.9,-496.7,11.9,-518.1,23.4,-518,23.4,-516,62.3,-516.6,60.6,-638.5,22.2,-637.6,12.4,-637.7,12.4,-633.6,-31.4,-629.8],
    [83.3,303.4,99.2,294.6],
    [484.5,-384,438.6,-348.1,435.1,-344.9,433.4,-341.9,432.6,-338.6,432.6,-335.2,433.4,-332,435.1,-329,437.5,-326.6,440.4,-324.9,443.7,-323.9,447.6,-323.7,451.9,-324.5],
    [300.6,-426.4,305.1,-430.9,313.3,-437.4,322.2,-442.6,329.9,-445.8,390.7,-463.9,397.1,-465,403.5,-465.4,410,-465.2,416.4,-464.5,424.6,-462.6,432.4,-459.9,439.9,-456.2,445.6,-452.8,451.1,-448.9,456.1,-444.5,461.3,-438.9,465.9,-432.7,488.4,-390.8],
    [302.6,-314.9,247.8,-321.1,240.8,-322.8,234,-325.2,227.5,-328.2,221.2,-332,215.3,-336.5,209.8,-341.6,205,-347.1,167,-401.4],
    [392.2,-307.7,391.1,-325.7,391.4,-332.2,392.5,-338.8,394.2,-345.1,396.3,-350.7,398.9,-356,402,-361.1,410.9,-371.5,424.9,-385.5,427.6,-389.6,429.7,-394.1,431,-398.9,431.5,-403.4,431.3,-408,430.4,-412.4,428.8,-416.7,425.5,-422.9],
    [550.2,408.1,547.8,406.5,545.5,404.1,544.1,401.2,543.4,398.1,543.3,394.9,543.7,392.1,544.7,389.3,594.9,291.2],
    [185.7,499.5,192.2,512.7,202.8,507.5,196.4,494.6],
    [198.4,493.6,177,503.6,175.7,500.8],
    [742.6,-158.2,744.2,-160.8,745.3,-163.9,746.8,-170.5,748.1,-179.5,749,-182.4,750.4,-185.2,752.9,-188.5,756.2,-191.2,760.3,-193.9,769.8,-198.9,772.6,-199.8,775.1,-200,777.7,-199.4,787.2,-194.6,803.3,-194.7,806.9,-196.1,808.4,-197.1,809.8,-198.8,810.2,-199.9,810.1,-201.1,809.4,-202.1,808.4,-202.6,807.1,-202.7],
    [852,-174.3,855.4,-180.1,856.6,-184,856.9,-186.6,856.6,-189.2,855.4,-191.9,853.6,-194.3,846.6,-200,845.5,-201.6,843.7,-203.2,839.6,-205.4,838.5,-206.5,838.1,-207.6,838.3,-218.7,837.7,-221.4,836.3,-224.2,834.3,-226.5],
    [648.2,-128.7,645.8,-129.5,643.7,-130.9,642,-132.8,640.6,-135.6,632.1,-201.5],
    [971.9,-230.7,982.8,-211.4,935.5,-182.2,930.7,-178.8,926.3,-174.4,924.7,-173.5,919.4,-172.3,917.8,-171.6,907.8,-165.2,902.1,-162.6,895.9,-161,701.4,-136.7,694.5,-134.5,682.4,-134.4,675.7,-133.5,669.2,-131.9],
    [49.3,-516.4,49.1,-537,62.1,-537.1],
    [179.1,493.1,195.2,484.6],
    [507.7,453,500.6,464.2,511.9,471.3,519,460.1,507.7,453],
    [490.2,-184.7,484.3,-174,497.2,-166.9,503.2,-177.6,490.2,-184.7],
    [740.3,-472.7,729.1,-462.5],
    [648.4,-601.5,638.7,-588.3,649.8,-580.3,659.5,-593.5,648.4,-601.5],
    [517.1,-640.3,498.7,-631.7,495.1,-638.2,504.6,-643,504.9,-644.8,513.2,-648.3,517.1,-640.3],
    [193,-633.9,189.5,-637,177.9,-624,183.8,-618.9,195.3,-631.8,193,-633.9],
    [287,-774.1,301,-790.5,303.9,-791],
    [195.2,-670.2,192.8,-666.9],
    [372.4,-820.2,365.5,-815.1],
    [361.6,-836.3,354,-830.4],
    [288.5,-937.2,277.3,-931.2,285,-916.7,296.3,-922.6,288.5,-937.2],
    [336.8,503.1,323.7,510.3,327.8,517.7,340.9,510.6,336.8,503.1]];
  // the fences: [x0, z0, x1, z1, ...] each (the last four round the karting track)
  const FENCES = [[209,321.8,250.9,399,256.3,406.3,262.8,413.3],
    [232.8,333.6,260.4,318],
    [185.7,252.3,183,246.4,190.3,242.3,189,239.4,185.1,233.2],
    [890,-297.4,886.4,-297,882.9,-296.1,879.6,-294.7,876.1,-292.4,869.1,-285.8,866.1,-282.2,863.4,-277.8,860.1,-270.5,857.8,-261,854,-254.9,851.2,-251.8,847.3,-249.6,843.1,-247.9,837.6,-246.6,832,-246.2,683,-227.1,677.5,-225.8,672.2,-223.8,667.8,-221.4,663.6,-218.7,659.7,-215.4,655.6,-210,652.4,-204.1,650.3,-198.3,648.9,-192.4,648.4,-186.3,647.6,-170.8,647,-165.6,647.1,-162.2,647.8,-159,650.6,-153.5,652.5,-151.2,655.8,-148.6,659.3,-146.4,663.1,-144.8,667.2,-143.6,671.5,-143,678.6,-143.4],
    [815.9,-187.2,812.1,-184.2,809.1,-182.8,805.9,-182.1,796.2,-182.1,790.5,-181.7,785.7,-180.6,781,-179,774.7,-175.9,772.7,-174.2,771.2,-172.1,770.4,-170.1,770,-168,770.2,-163.7,770.8,-162.6,772.2,-161.6,774.3,-161.6,776,-162.4,780.9,-162.6,870.3,-177.2,873,-178.1,875.5,-179.6,878.7,-182.4,879.4,-183.7,879.5,-185.1,879,-186.4,878.1,-187.6,871.4,-189,865.6,-190.7,862.8,-192.4,860.9,-194.2,859.3,-196.9,858.8,-199.6,858.9,-202.9,859.8,-206.1,861.3,-209,874.9,-228.2,881.9,-236.6,885,-238.6,888.5,-240,892.2,-240.6,896.5,-240.3,900.6,-239.1,904.3,-236.9,907.4,-234.3,910.7,-231.1,914.2,-226.7,916.6,-225.1,919.3,-224,922.1,-223.5,925,-223.6,932,-225.8,934,-226.9,935.6,-228.5,936.6,-230.5,936.9,-232.9,935.5,-237.7,932.5,-244.1,905.1,-284.1,901.4,-286.5,899.2,-287,896.9,-287,894.6,-286.6,887.6,-282.7,883.1,-279.3,876.3,-272.2,874.6,-269.4,874.2,-267.4,874.5,-255.1,873.5,-251.4,871.7,-248,867.8,-243.8,863.5,-241.2,858.1,-236.4,852.7,-233.4,847.1,-232.2,781.5,-223.9,758.7,-221.5,751.4,-219.7,743.8,-217.1,736,-215.3,729.7,-214.5,723.4,-214.2,711.2,-214.5,705.4,-213.7,699.8,-212.1,696.1,-210.2,691.8,-207.1,689.4,-206.3,688.3,-205.6,678.9,-193.3,676.2,-188.8,674,-184.1,670.8,-179,664.8,-172.1,663.3,-169.3,662.5,-166.6,662.4,-163.8,663.3,-161.2,664.9,-159,667,-157.3,673.2,-156,676.9,-156.2,679.4,-156.9,681.5,-158.5,682.6,-160.4,683.2,-162.6,681.8,-173.5,682.1,-185.1,683.3,-190.3,685.1,-195.5,686.9,-199.1,689,-202.5,690.8,-204.5,696.8,-208.1,703.8,-210.6,706.9,-211,710.1,-210.5,712.7,-209.4,715,-207.7,716.9,-205.6,718.9,-202.9,720.2,-199.9,720.8,-196.3,719.6,-185.5,716.5,-177.6,715.5,-172.9,715.6,-170.1,716.4,-167.9,717.8,-166.2,719.6,-165.4,721.6,-165.2,723.7,-165.7,730.8,-169.1,732.3,-170.2,733.5,-171.6,734.4,-173.7,734.9,-183.2,735.5,-187,736.8,-190.6,739,-194.5,742,-197.8,746.4,-202.4,751.3,-206.4,760,-211.3,764.7,-213.1,768.6,-214,772.5,-214.4,778.8,-213.8,781.8,-212.9,786.3,-209.7,789,-208.9,791.4,-208.7,793.8,-209.2,796,-210.1,807.5,-217.4,810.8,-217.6,816.4,-214.3,820.1,-208.8,821,-208.2,823.8,-207.4,824.4,-206.7,824.7,-205.7,824.4,-204.1,821.9,-197.3,821,-193.1,819.5,-190.4],
    [674.3,-231,670.5,-229.9,667,-228.3,663.8,-226.2,656.1,-218.9,653.3,-215.6,647.2,-206.3,644.5,-200,642.8,-194.4,641.9,-188.6,641.6,-182.7,642.3,-175.5,642.1,-164,642.8,-159.9,644,-156.6,647.4,-150.5,651,-147.1,655,-144.3,659.4,-141.9,663.7,-140.4,668.1,-139.3,672.7,-138.8,677.2,-138.9,680.8,-139.6,684.2,-140.9,687.3,-142.8,690.5,-145.3,693.2,-148.5,695.3,-152,696.3,-155,697,-161.7,696.1,-169.6,696.5,-178.2,697.2,-181,700,-187.3,700.6,-190,702.3,-191,703.2,-190.9,703.5,-189,702.9,-188,700.7,-186.6,699.3,-183.8,697.8,-177.2,697.6,-174.2,697.8,-171.1,699.4,-166.2,700.5,-160.4,701.4,-158.4,702.6,-156.9,704.1,-155.8,714.2,-150.8,720.9,-149.3,724.4,-149.3,727.9,-149.7,734.7,-151.8,739.2,-154.9,742.6,-158.2],
    [747.3,-162.2,750,-160.1,752,-156.3,754.8,-155.6,759.6,-151.3,762.4,-149.7,765.4,-148.7,772.3,-148,820.4,-156.4,868.1,-162,875.7,-163.7,879.5,-165.2,892.2,-171.5,895.9,-175.4,896.6,-177,896.7,-178.6,895.5,-183.3,893.8,-186.8,891.3,-189.8,890.1,-193.9,888.9,-195.8,886.3,-198.7,883.2,-201,875.6,-202.8,875.1,-203.3,874.9,-204.4,875.9,-206.4,880.4,-212.4,884.2,-216.4,886.2,-219.2,888.8,-223.7,890.1,-225.1,893.2,-226.8,895.3,-227,897.5,-226.5,899.3,-224.9,904.4,-218.4,906.5,-216.7,911.4,-213.8,913,-211.8,915.1,-210.1,918,-209,931.8,-208.7,936.5,-210,946.9,-216,950.7,-218.9,952.4,-221.2,954.5,-225.9,955.2,-230]];
  // the bleachers' outline (closed), and the two parts it is laid out in: o the point the front edge starts at, a the one it runs to, idx
  // the outline's points of the part (the parts meet along the outline's points 10 to 4)
  const STAND = [363.2,708.6,351.9,711.5,355.4,724.4,378.1,718.6,388.5,698.5,395.9,702.4,440.9,617.9,428.4,611.3,429.2,609.8,422.2,606.5,370.1,704.4,368.3,706.5,365.9,707.9,363.2,708.6];
  const PARTS = [{ o: 9, a: 10, idx: [9, 10, 4, 5, 6, 7, 8] }, { o: 1, a: 12, idx: [10, 11, 12, 0, 1, 2, 3, 4] }];
  // the gates: [x, z, the angle of the gate's line, its width, 1 when it stands in a fence's line]; the block: [x, z, the angle across the way]
  const GATES = [[121.2,274.1,4.2,2,0],[535.6,414.5,2.05,5,0],[169.9,-539.2,4.7,5,0],[189,239.4,-2.09,2,1],[241.3,328.8,-0.51,5,1]];
  const BLOCK = [-2.66, -123.24, -0.51];
  // the footways: [x0, z0, x1, z1, ...] each
  const FOOT = [[-75.3,29.2,-60.3,21.3,-58.3,19.8,-56.6,17.8,-55.5,15.4,-54.9,12.9,-55,10.3],
    [-108,-26.8,-88.1,-36.6,-85.5,-39.5,-84.8,-42.4,-85.3,-44.9,-86.1,-46.6],
    [126.5,24.4,51,-114,49.9,-115.5,48.3,-116.3,46.4,-116.4,44.7,-115.7,11.6,-97.5],
    [144.3,14.5,92.7,43.3,91.3,43.3,90.2,42.7,-3.9,-125.4,-6.1,-126.1,-12.6,-123.4,-14.7,-123,-16.8,-123.4,-18.6,-124.5,-31.5,-145.3],
    [-83.8,-264.7,-83.8,-258.7,-83.2,-255.5,-82,-252.5,-76.7,-243.7,-72.2,-234.6,-68.8,-226.2,-66,-217.7,-59.5,-192.2,-55.7,-181.9,-52.3,-177.8,-49.9,-176.2,-47.2,-175,-44.4,-175.1],
    [-119.6,-368.6,-117.8,-357.4,-116,-350.3,-113.8,-343.2,-107.8,-328,-101.2,-312.9,-94.8,-299.7,-73.4,-258.1],
    [-98.8,-275.8,-97.5,-266.1,-97.7,-251.9,-97,-250.3,-95.9,-249.4,-91,-248.6,-89.3,-247.3,-75.7,-223.4],
    [-123.5,-371.1,-124.6,-363.8,-125,-356.4,-124.5,-349.4,-123.2,-342.4,-119.3,-327.6,-112.9,-309.1,-112.7,-306.4,-113.1,-304,-114,-301.8,-115.5,-299.8],
    [-123.5,-371.1,-133.5,-378.3,-135.6,-378.4,-136.5,-377.9,-137.3,-376.8,-137.6,-375.4,-136.8,-365.2,-135.5,-356.5,-132.8,-345,-126.6,-323.2,-122.2,-313.1,-115.5,-299.8,-98.8,-275.8,-88.6,-267.8,-68.8,-255.2],
    [-74.5,-525,-89.7,-527.8,-95.3,-530.2,-186.4,-589.6,-192.2,-592.3,-198.4,-594,-202.9,-594.7,-210.8,-594.4,-216.7,-593.2,-222.3,-591,-256.4,-571.7,-313.4,-540.6,-316.6,-538,-319.4,-534.6,-321.2,-530.1,-321.5,-525.7,-320.9,-521.5,-318.2,-513.2,-309.4,-489.4,-300.1,-465.8,-297.3,-457.5,-295.8,-451.2,-295.5,-448.1,-296.1,-411.7,-295.2,-409.9,-293.8,-408.5,-292,-407.7,-273.8,-404.4],
    [-59.3,-237,-61.2,-285.2,-62.3,-300.9,-64.2,-316.2,-66.6,-329.9,-70.1,-343.1,-72.3,-349.5,-81.7,-372.3,-85.3,-379.4,-89.8,-385.9,-93.4,-390.1,-97.4,-393.9,-101.8,-397.4,-120.1,-409.8,-121.4,-409.7,-122.3,-408.8,-122.4,-407.6,-111.1,-391.4,-110.2,-389.4,-109.9,-387.2,-110.1,-383.2],
    [-52.1,-500.9,-54.4,-495.8],
    [-15.2,-477.1,-18.4,-466.1],
    [43.2,-496.9,21.5,-495.1,19.7,-494.6,-6.5,-481,-7.1,-480.7,-7.3,-479.6,-3,-473.6,-2.4,-472.1,-2.8,-470.6,-4.2,-469.8,-5,-469.7,-5.8,-470,-15.2,-477.1,-52.1,-500.9,-58.5,-556.5,-59.8,-562,-62.3,-566.1,-118.6,-646.5,-128.3,-657.4,-132.9,-661.7,-158.9,-683.2,-174,-668.5],
    [472.2,584.9,500.2,600,510.6,579.1,483,564.5],
    [261.6,326.8,258.9,322.1,345.3,273.3,347.3,270,347.8,267.8,347.8,265.6,347.3,263.4,315.8,206.7,217.1,26.8,215.5,24.5,213.6,23,211.3,22.1,205.7,21.5,203.9,17.8],
    [211.3,319.2,221.9,312.7,222.7,311,222.7,309,217.4,300.9,214.8,298.8,209.1,295.9,207.6,294.4,193.1,268.4,192.2,266.4,192.1,264.3,194.3,259.3,194.6,257.6,194.2,255.8,189.9,248.5],
    [72.7,290.7,96.2,277.1,98.5,276.7,99.8,276.8,102.4,279.4,104.9,283.3,136.8,341.3,138.3,342.4,139.5,342.6,141.6,341.3,141.9,339.5,134.3,324.7],
    [191.5,238,218.6,286.4,219.1,288.9,218.4,290.1,217.2,290.8,215.8,290.8,214.6,290.2,206.1,275.1],
    [121.2,274.1,104.9,283.3],
    [179.1,193.1,200.1,233.2],
    [200.1,233.2,189,239.5],
    [182.1,191.4,189,195.6,194.9,201.3,227.8,252],
    [74.9,246.1,75.7,249,75.7,251.9,75,254.8,73.6,257.5,71.5,259.6,68.9,261.2,58.9,266.3],
    [152.4,29.8,101.4,58.1,100.6,59.4,100.5,61,101.1,62.5,173.3,192.9,175.1,193.9,177.2,194,179.1,193.1,221.8,169.5],
    [26,208.2,41.8,200,43.7,197.5,44.7,194.4,44.4,191.3,43.1,188.4],
    [-8.6,146.4,4.6,138.1,8.1,137.3,11.7,137.6,15.2,138.8],
    [-41,88.7,-23.9,78.9,-21.5,78.6,-19.2,79.1,-16,81.7]];

  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {   // smooth value noise on a 9 m lattice, 0..1
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };

  const base = LK.extra;
  LK.extra = function (o) { const mine = lay(o); const st = base(o) || {}; st.roadside = mine; return st; };

  function lay(o) {
    const { root, scen, exclPush: exPush, excluded, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { kartCells: 0, walls: 0, wallM: 0, wallSkip: 0, exHit: 0, fences: 0, fenceM: 0, posts: 0, gates: 0, block: 0, standRows: 0, standSpans: 0, ways: 0, wayM: 0, wayEx: 0, meshes: 0 };
    // the clearances of what is laid here are pushed at the end, so that while it is laid out the builder's list holds only what was there
    // before it (and what is laid here does not take its own clearances for another's)
    const later = [], exclPush = (x, z, r) => { later.push(x, z, r); };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };
    // what is laid on the ground goes into a mesh per material and 120 m square, so three.js leaves out of the frame what is out of view
    const TILE = 120, tiles = new Map();
    const rbAt = (mt, x, z) => { const key = mt + ',' + Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tiles.get(key); if (!t) tiles.set(key, t = { mt, rb: new RB(true) }); return t.rb; };
    const area = (P) => { let s = 0; for (let k = 0; k < P.length; k += 2) { const j = (k + 2) % P.length; s += P[k] * P[j + 1] - P[j] * P[k + 1]; } return s / 2; };
    // a polygon [x0, z0, ...] cut to the cell x0..x1, z0..z1 (Sutherland-Hodgman), null when nothing of it is left
    const clip = (Q, x0, z0, x1, z1) => { let P = Q;
      for (const [ax, c, s] of [[0, x0, 1], [0, x1, -1], [1, z0, 1], [1, z1, -1]]) { const R = [], n = P.length / 2;
        for (let k = 0; k < n; k++) { const j = (k + 1) % n, px = P[2 * k], pz = P[2 * k + 1], qx = P[2 * j], qz = P[2 * j + 1];
          const pv = ((ax ? pz : px) - c) * s, qv = ((ax ? qz : qx) - c) * s;
          if (pv >= 0) R.push(px, pz);
          if ((pv >= 0) !== (qv >= 0)) { const t = pv / (pv - qv); R.push(px + (qx - px) * t, pz + (qz - pz) * t); } }
        if (R.length < 6) return null; P = R; }
      return P; };
    // a polygon laid on the ground in cells of C m (a whole cell two triangles on its shared corners, a cut one triangulated), lift m up,
    // its colour after colAt, the texture U m a tile; a cell whose middle lies within 1.5 m past the barriers left out
    const drape = (mt, Q, C, colAt, lift, U, onCell) => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const i0 = Math.floor(x0 / C), i1 = Math.floor(x1 / C), j0 = Math.floor(z0 / C), j1 = Math.floor(z1 / C), V = new Map();
      const vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + lift, z]], [colAt(x, z)], [[x / U, z / U]]);
      const cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const P = clip(Q, i * C, j * C, (i + 1) * C, (j + 1) * C); if (!P) continue;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        if (!past(cx, cz, 1.5)) continue;
        const rb = rbAt(mt, cx, cz);
        if (Math.abs(Math.abs(area(P)) - C * C) < 1e-3) { const a = cor(rb, i, j), b = cor(rb, i + 1, j), c = cor(rb, i + 1, j + 1), d = cor(rb, i, j + 1); rb.I.push(a, c, b, a, d, c); }
        else {
          const n = P.length / 2, b0 = rb.n; if (Math.abs(area(P)) < 0.01) continue;
          for (let k = 0; k < n; k++) vtx(rb, P[2 * k], P[2 * k + 1]);
          const tri = THREE.ShapeUtils.triangulateShape(Array.from({ length: n }, (_, k) => new THREE.Vector2(P[2 * k], P[2 * k + 1])), []);
          for (const [a, b, c] of tri) {
            const cr = (P[2 * b] - P[2 * a]) * (P[2 * c + 1] - P[2 * a + 1]) - (P[2 * b + 1] - P[2 * a + 1]) * (P[2 * c] - P[2 * a]);
            if (cr < 0) rb.I.push(b0 + a, b0 + b, b0 + c); else rb.I.push(b0 + a, b0 + c, b0 + b);   // (up-facing: x east, z south)
          }
        }
        onCell(cx, cz);
      }
    };
    // the points every ~step m along a line (its own points kept), each with its distance along the line: [x, z, acc, ...]
    const walk = (W, step) => { const P = [W[0], W[1], 0]; let acc = 0;
      for (let q = 0; q + 3 < W.length; q += 2) { const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / step));
        for (let t = 1; t <= m; t++) P.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m, acc + L * t / m);
        acc += L; }
      return P; };

    // the karting track: its area between the two rings, triangulated, laid on the ground in 6 m cells; asphalt, a little lighter and greyer
    // than the circuit's, a little patchy as worn asphalt is
    const ring = (F) => { const P = []; for (let k = 0; k < F.length; k += 2) P.push(new THREE.Vector2(F[k], F[k + 1])); if (P.length > 1 && P[0].equals(P[P.length - 1])) P.pop(); return P; };
    const KO = ring(KART_O), KI = ring(KART_I), ktri = THREE.ShapeUtils.triangulateShape(KO, [KI]), KV = KO.concat(KI);
    const kartAt = (x, z) => { const f = 0.94 + 0.1 * patch(x + 500, z); return [0.82 * f, 0.82 * f, 0.84 * f]; }, kc = new Set();
    for (const [a, b, c] of ktri) drape(0, [KV[a].x, KV[a].y, KV[b].x, KV[b].y, KV[c].x, KV[c].y], 6, kartAt, 0.1, 3, (cx, cz) => {
      const key = Math.floor(cx / 6) + ',' + Math.floor(cz / 6); if (!kc.has(key)) { kc.add(key); exclPush(cx, cz, 4); st.kartCells++; } });

    // the walls: in pieces of up to 8 m, each from 0.3 m below the lowest ground under it to 2 m above the highest, 0.25 m thick; a piece that
    // would stand within 2 m past the barriers left out
    const WALL_C = WALL_B ? [0.87, 0.8, 0.66] : [0.8, 0.8, 0.78], WALL_T = WALL_B ? [0.92, 0.86, 0.74] : [0.86, 0.86, 0.84];
    for (const W of WALLS) {
      let drawn = false;
      for (let q = 0; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 8)), l = L / m, rot = Math.atan2(bz - az, bx - ax);
        for (let t = 0; t < m; t++) {
          const x0 = ax + (bx - ax) * t / m, z0 = az + (bz - az) * t / m, x1 = ax + (bx - ax) * (t + 1) / m, z1 = az + (bz - az) * (t + 1) / m, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
          if (!past(mx, mz, 2) || !past(x0, z0, 1.5) || !past(x1, z1, 1.5)) { st.wallSkip++; continue; }
          if (excluded(mx, mz) && near(mx, mz, 60)) st.exHit++;
          const g0 = nrGround(x0, z0), g1 = nrGround(x1, z1), gm = nrGround(mx, mz), lo = Math.min(g0, g1, gm) - 0.3, hi = Math.max(g0, g1, gm) + 2;
          box(scen.get(mx, mz), mx, lo, mz, l + 0.05, hi - lo, 0.25, rot, WALL_C, WALL_T, true);
          const n = Math.max(1, Math.round(l / 2.5));
          for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; exclPush(x, z, 1.6); if (near(x, z, 45)) CR.avoid(x, z, 0.9); }
          st.wallM += l; drawn = true;
        }
      }
      if (drawn) st.walls++;
    }

    // the fences: chain-link mesh 2 m high (the builder's fence texture, as on its catch fences) on rows every ~2.5 m along, on the ground;
    // a steel post every ~5 m; a row within 2 m past the barriers left out
    const FEN_C = [0.8, 0.82, 0.84], POST_C = [0.6, 0.61, 0.64];
    for (const W of FENCES) {
      const P = walk(W, 2.5);
      let prev = null, pi = -1, prb = null, lastPost = -1e9, drawn = false;
      for (let k = 0; k < P.length; k += 3) {
        const x = P[k], z = P[k + 1], acc = P[k + 2];
        if (!past(x, z, 2)) { prev = null; continue; }
        const g = nrGround(x, z), row = [[x, g - 0.05, z], [x, g + 2, z]], cols = [FEN_C, FEN_C], uvs = [[acc / 3, 0], [acc / 3, 0.76]], rb = rbAt(1, x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(row, cols, uvs);
        if (prev) { rb.link(pi, r, 0, 1); st.fenceM += acc - prev[3]; drawn = true; }
        prev = [row, cols, uvs, acc]; pi = r; prb = rb;
        if (cyl && acc - lastPost > 4.9) { cyl(scen.get(x, z), x, g - 0.1, z, 0.04, 2.1, 3, POST_C); lastPost = acc; st.posts++; }
        exclPush(x, z, 1.2); if (near(x, z, 45)) CR.avoid(x, z, 0.8);
      }
      if (drawn) st.fences++;
    }

    // the gates: two steel posts, a rail at the foot and one at the top, the mesh between them where the gate does not stand in a fence's line
    for (const [x, z, ang, w, inF] of GATES) {
      if (!past(x, z, 1.5)) continue;
      const g = scen.get(x, z), y = nrGround(x, z), c = Math.cos(ang), s = Math.sin(ang);
      for (const f of [-0.5, 0.5]) box(g, x + c * w * f, y - 0.2, z + s * w * f, 0.1, 2.3, 0.1, ang, POST_C, POST_C, true);
      for (const h of [0.1, 1.95]) box(g, x, y + h, z, w, 0.06, 0.06, ang, POST_C, POST_C, true);
      if (!inF) {
        const rb = rbAt(1, x, z), ends = [-0.5, 0.5].map(f => [x + c * w * f, z + s * w * f]);
        const r0 = rb.row([[ends[0][0], y + 0.12, ends[0][1]], [ends[0][0], y + 1.95, ends[0][1]]], [FEN_C, FEN_C], [[0, 0], [0, 0.68]]);
        const r1 = rb.row([[ends[1][0], y + 0.12, ends[1][1]], [ends[1][0], y + 1.95, ends[1][1]]], [FEN_C, FEN_C], [[w / 3, 0], [w / 3, 0.68]]);
        rb.link(r0, r1, 0, 1);
      }
      exclPush(x, z, w / 2 + 1); if (near(x, z, 45)) CR.avoid(x, z, w / 2 + 0.5); st.gates++;
    }

    // the concrete block on the footway: 1.2 m across the way, 0.6 m along it, 0.65 m high (its size not in OSM: assumed)
    if (past(BLOCK[0], BLOCK[1], 1.5)) {
      const [x, z, ang] = BLOCK; box(scen.get(x, z), x, nrGround(x, z) - 0.05, z, 1.2, 0.7, 0.6, ang, [0.76, 0.76, 0.74], [0.82, 0.82, 0.8], true);
      exclPush(x, z, 1.2); if (near(x, z, 45)) CR.avoid(x, z, 1); st.block = 1;
    }

    // the bleachers: in each part the rows run along its front edge (o to a), one behind the other going away from it, each row's spans where
    // the line through its middle crosses the part's outline; a tread 0.42 m above the one before (assumed; the depth of a row ~0.9 m: the
    // part's depth over a whole number of rows), the first 0.55 m above the lowest ground under the outline; before the front edge (the south
    // part's east end, where it meets the long part) a deck 0.15 m up; a wall 1.1 m high at the back of the top row; empty (as few spectators
    // as can be: CLAUDE.md)
    const SP = []; for (let k = 0; k + 1 < STAND.length; k += 2) SP.push([STAND[k], STAND[k + 1]]);
    let y0 = 1e9; for (const [x, z] of SP) y0 = Math.min(y0, nrGround(x, z));
    const ST_C = [0.62, 0.63, 0.66], ST_T = [0.7, 0.71, 0.74], ST_W = [0.58, 0.59, 0.62];
    for (const pt of PARTS) {
      const O = SP[pt.o], E = SP[pt.a], al = Math.hypot(E[0] - O[0], E[1] - O[1]), a = [(E[0] - O[0]) / al, (E[1] - O[1]) / al], Q = pt.idx.map(i => SP[i]);
      let n = [-a[1], a[0]], cx = 0, cz = 0; for (const [x, z] of Q) { cx += x; cz += z; } cx /= Q.length; cz /= Q.length;
      if ((cx - O[0]) * n[0] + (cz - O[1]) * n[1] < 0) n = [-n[0], -n[1]];
      if (!past(O[0], O[1], 6) || !past(E[0], E[1], 6)) continue;
      const F = Q.map(([x, z]) => [(x - O[0]) * a[0] + (z - O[1]) * a[1], (x - O[0]) * n[0] + (z - O[1]) * n[1]]);
      let vmin = 0, vmax = 0; for (const [, v] of F) { vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
      const K = Math.max(1, Math.round(vmax / 0.9)), D = vmax / K, rot = Math.atan2(a[1], a[0]);
      const spans = (v) => { const X = [];
        for (let k = 0; k < F.length; k++) { const [u0, v0] = F[k], [u1, v1] = F[(k + 1) % F.length]; if ((v0 <= v) !== (v1 <= v)) X.push(u0 + (u1 - u0) * (v - v0) / (v1 - v0)); }
        X.sort((p, q) => p - q); const R = []; for (let k = 0; k + 1 < X.length; k += 2) R.push([X[k], X[k + 1]]); return R; };
      const at = (u, v) => [O[0] + a[0] * u + n[0] * v, O[1] + a[1] * u + n[1] * v];
      for (let k = Math.floor(vmin / D); k < K; k++) {
        const v = (k + 0.5) * D, top = k < 0 ? y0 + 0.15 : y0 + 0.55 + 0.42 * k;
        let any = false;
        for (const [u0, u1] of spans(v)) {
          if (u1 - u0 < 0.5) continue;
          const [x, z] = at((u0 + u1) / 2, v);
          box(scen.get(x, z), x, y0 - 0.5, z, u1 - u0, top - y0 + 0.5, D + 0.02, rot, ST_C, ST_T, true);
          if (k === K - 1) { const [bx, bz] = at((u0 + u1) / 2, vmax - 0.05); box(scen.get(bx, bz), bx, top, bz, u1 - u0, 1.1, 0.1, rot, ST_W, ST_W, true); }
          st.standSpans++; any = true;
        }
        if (any) st.standRows++;
      }
      for (let v = vmin + 1.5; v < vmax; v += 4) for (const [u0, u1] of spans(v)) for (let u = u0 + 1.5; u < u1; u += 4) { const [x, z] = at(u, v); exclPush(x, z, 3); CR.exclAdd(x, z, 3); }
    }

    // the footways: paving 2 m wide on rows of two across (the left and the right edge) every ~2.5 m along, on the ground; cut where they
    // run within the barriers; a stretch goes into the tile of the row it ends at (the row before it copied there when the tile changes)
    const HW = 1, UP = 2;
    for (const W of FOOT) {
      const pts = [];
      for (let q = 0; q + 3 < W.length; q += 2) { const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 0 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m); }
      let prev = null, pi = -1, prb = null, al = 0, pAl = 0;
      for (let k = 0; k < pts.length; k += 2) { const x = pts[k], z = pts[k + 1];
        if (k) al += Math.hypot(x - pts[k - 2], z - pts[k - 1]);
        if (!past(x, z, HW + 1.2)) { prev = null; continue; }
        if (excluded(x, z)) st.wayEx++;
        const k0 = Math.max(0, k - 2), k1 = Math.min(pts.length - 2, k + 2), dx = pts[k1] - pts[k0], dz = pts[k1 + 1] - pts[k0 + 1], dl = Math.hypot(dx, dz) || 1;
        const nx = -dz / dl, nz = dx / dl, f = 0.95 + 0.08 * patch(x, z), col = [0.95 * f, 0.94 * f, 0.92 * f];
        const row = [-HW, HW].map(e => [x + nx * e, nrGround(x + nx * e, z + nz * e) + 0.1, z + nz * e]);
        const cols = [col, col], uvs = [[-HW / UP, al / UP], [HW / UP, al / UP]], rb = rbAt(2, x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(row, cols, uvs);
        if (prev) { rb.link(pi, r, 0, 1); st.wayM += al - pAl; } else st.ways++;
        prev = [row, cols, uvs]; pi = r; prb = rb; pAl = al; exclPush(x, z, HW + 1);
        if (k % 4 === 0 && near(x, z, 45)) CR.avoid(x, z, HW + 0.4); } }

    // the meshes: the asphalt and the paving lie over the ground (polygon offset), the mesh of the fences and the gates is seen from both sides
    const MAT = [[tex.asphalt, 'roadside-asphalt'], [tex.fence, 'roadside-fence'], [tex.paving, 'roadside-paving']], mats = [];
    for (const { mt, rb } of tiles.values()) {
      if (rb.empty) continue;
      const mat = mats[mt] || (mats[mt] = mt === 1 ? new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })
        : new THREE.MeshLambertMaterial({ map: MAT[mt][0], vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
      const m = new THREE.Mesh(rb.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = MAT[mt][1]; root.add(m); st.meshes++;
    }
    for (let k = 0; k < later.length; k += 3) exPush(later[k], later[k + 1], later[k + 2]);
    st.wallM = Math.round(st.wallM); st.fenceM = Math.round(st.fenceM); st.wayM = Math.round(st.wayM);
    return st;
  }
})();
