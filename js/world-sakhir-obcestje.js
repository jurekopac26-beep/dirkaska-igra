/* =====================================================================================================================================
   WORLD — Sakhir, Bahrajn: what lies by the road past the barriers (grafika ob progi), from OpenStreetMap, on js/world-sakhir.js (the
   builder's hook LK.extra wrapped: what is here is laid out first, so js/world-sakhir.js's palms and buildings, the builder's trees and the
   crowds keep clear of it, then js/world-sakhir.js's own parts, with the palms OSM has that its list lacks).
   Drawn: the walls (OSM barrier=wall, the parts 2-60 m past the barriers, not the ones running along them within 4 m: those are the
     circuit's own, the builder's; no height or material in OSM: 2 m of grey precast concrete, 0.25 m thick, assumed); the fences (OSM
     barrier=fence; no height or build in OSM: 2 m of chain-link mesh on steel posts, assumed); the gates (OSM barrier=gate, 4, access=no:
     shut); the footways (OSM highway=footway; no width or surface in OSM: 2 m of paving, assumed); the car parks (OSM amenity=parking,
     their parts within 60 m: plain asphalt, under the service roads); the street lamps (OSM highway=street_lamp, 268 within 60 m; no
     height in OSM: an 8 m steel pole with a lamp head, assumed, unlit: an afternoon); 87 palms OSM maps (natural=tree, within 60 m)
     that the track's list (def.sk.trees) has none of within 1.5 m: date palms, as its others.
   Kept open (docs/realizem.md: only from sources): the car parks' markings and the lamps' arms and direction (not in OSM).
   Not drawn again: the circuit's paved area, the barriers, the run-off, the floodlight masts and the grandstands (the builder's and
     js/world-sakhir.js's), the service roads, the buildings, the lawns and the ponds (js/world-sakhir.js); nothing within the barriers;
     the artwork and the attraction (OSM tourism=*: no shape in OSM); no names of the circuit, its parts or its operators.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL), the main API, 2026-11-23; metres, origin = the finish line, x east, z south
   (tools/sakhir/sakhir.json's lat0/lon0, less the track's shift); the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.sakhir;
  if (!LK || typeof LK.extra !== 'function') return;

  // the lines [x0, z0, x1, z1, ...] each; the car parks' outlines (closed); the gates [x, z, the angle of the gate's line, its width, 1 when
  // it stands in a fence's line]; the street lamps [x, z]; the trees OSM has that def.sk.trees lacks [x, z, ...]
  const WALLS = [[399.4,269.8,398.0,285.7,395.8,299.6,392.6,313.4,388.5,326.9,383.6,340.2,378.0,353.1,371.5,365.5,365.2,375.9,358.3,385.8,353.8,382.2,342.0,393.9,329.6,404.9,320.1,412.5,310.3,419.6,300.2,426.3,282.8,436.6],
    [553.4,158.1,543.6,154.9,533.5,152.6,524.8,151.2,516.1,150.5,508.5,150.5,501.0,151.3,493.7,152.7,485.4,155.2,477.5,158.5,476.7,157.3,469.4,160.3,462.3,163.9,455.5,168.1,448.6,173.1,442.0,178.7,436.0,184.8,430.4,191.6,425.4,198.8,420.9,206.4,416.5,215.5,412.9,225.0,404.5,257.0],
    [644.5,202.8,553.7,164.5],
    [337.7,290.0,332.4,296.0,325.3,302.9,318.0,309.1,310.3,314.7,302.1,319.7,293.6,324.2,284.9,327.7,275.9,330.6,266.7,332.7,257.4,334.2,247.5,334.9,237.6,334.9,227.7,334.1,217.9,332.4],
    [357.7,248.2,351.2,259.2,340.1,276.6],
    [444.2,81.7,434.0,94.4,424.4,107.6,415.5,121.0,410.6,129.1],
    [492.2,55.3,483.0,56.9,474.1,59.4,465.4,62.8,457.2,67.1,449.5,72.1,442.3,78.0],
    [507.1,-31.2,527.1,-39.5,542.2,-46.6,571.4,-64.9],
    [339.0,48.2,416.8,11.8],
    [242.8,135.2,296.4,86.3],
    [258.3,-92.6,224.9,-2.9,223.6,-2.9,222.4,0.5,228.5,1.5,225.1,18.2,222.2,35.1,219.8,53.4,218.1,71.8,219.3,73.8,218.3,82.8,218.1,91.7,218.6,103.0,220.5,112.0,222.4,117.3,224.9,122.3,227.9,127.1,231.4,131.8,235.5,136.1,239.9,139.9],
    [298.3,-57.5,290.4,-36.8,282.6,-9.9,280.2,4.9,278.2,20.7],
    [386.8,-146.4,375.6,-140.3,364.8,-133.5,354.0,-125.9,344.7,-118.2,336.0,-109.6,320.8,-91.9,311.9,-78.0,302.8,-61.9],
    [484.4,-170.5,468.1,-165.7],
    [413.7,-149.8,388.8,-142.6],
    [576.7,-207.6,487.5,-166.3],
    [287.9,-276.3,288.1,-279.9,283.3,-279.8,282.5,-288.3,280.9,-296.7,278.3,-304.9,275.2,-312.4,271.2,-319.6,266.7,-326.3,262.4,-331.2,257.7,-335.6,252.6,-339.5,246.1,-342.7,243.4,-343.3,240.5,-343.2,237.8,-342.4,235.1,-340.8],
    [222.0,-212.3,229.3,-248.0,233.5,-273.3,236.9,-298.6,240.1,-333.4],
    [406.2,-500.9,296.0,-543.6,295.0,-539.1,273.8,-542.3,258.6,-543.7],
    [164.1,-533.2,150.8,-534.4,141.9,-535.6,134.9,-537.2,128.8,-539.1,122.9,-541.6,117.2,-544.5,111.8,-547.9,106.7,-551.7,105.8,-550.5],
    [195.5,-301.0,195.4,-298.1],
    [195.3,-296.1,194.5,-277.2],
    [192.8,-386.3,198.7,-413.3,202.8,-427.2,206.7,-437.7],
    [207.7,-440.3,209.6,-445.4,212.8,-451.3,216.2,-455.4,220.1,-459.1,224.6,-461.5,230.1,-463.7,235.6,-464.7,241.2,-464.5,246.7,-463.5],
    [89.2,-458.1,61.2,-446.4,51.8,-440.7,47.7,-437.4,44.5,-432.7,41.6,-426.5,37.1,-427.0,34.0,-412.9],
    [30.2,-392.7,29.5,-383.0],
    [6.9,-572.2,12.1,-636.4],
    [214.3,-487.1,206.4,-480.8,198.1,-475.0,189.4,-469.9,180.3,-465.4,170.4,-461.3,160.2,-458.0,149.7,-455.5,139.1,-453.8,130.6,-452.9],
    [170.6,436.4,167.6,364.6],
    [215.4,336.8,212.3,335.8,209.5,334.3,206.9,332.3,204.7,329.7,202.9,326.7,201.8,323.5,201.1,318.9],
    [-49.6,713.2,9.8,683.0],
    [-65.1,571.5,-79.0,616.6,-88.0,651.1],
    [-35.5,457.8,-70.2,570.2],
    [9.9,589.3,5.9,569.6,2.6,549.7,-0.1,529.8,-2.1,509.6],
    [65.6,613.0,61.9,614.3,55.2,615.9,48.4,616.8,41.6,617.0,35.5,616.2,29.5,614.7,23.5,612.2,18.0,609.0,13.9,606.0,10.3,602.5,7.7,598.9,5.7,595.0,4.2,590.8],
    [308.8,-402.6,312.7,-397.4,319.3,-386.2,322.9,-377.8,325.6,-369.0,327.0,-357.9,327.7,-346.7,327.8,-336.0],
    [246.3,-459.6,259.3,-450.9],
    [311.2,-407.3,285.0,-430.1],
    [282.7,-432.0,268.5,-444.4],
    [263.0,-464.7,257.2,-467.7,257.4,-471.3,256.8,-474.9,255.5,-478.3,253.9,-481.0,251.7,-483.3,249.3,-485.1,246.3,-486.7,239.7,-488.4,235.8,-488.5,231.8,-487.9,217.9,-483.5],
    [391.0,-467.8,371.8,-466.2,350.7,-463.6,332.6,-460.7,314.0,-457.4,297.9,-453.7,279.3,-448.2,274.7,-452.4],
    [500.3,-483.2,423.4,-500.4],
    [666.6,277.4,669.1,273.5,672.5,267.0,675.3,260.2,676.3,254.2,676.3,248.2,675.3,242.2,673.5,237.0,671.1,232.1,667.9,227.7,664.1,223.8,658.9,219.2,644.4,208.7],
    [705.3,-204.4,703.9,-210.4,701.7,-216.2,689.2,-239.0,689.0,-240.5,689.3,-242.0,690.1,-243.3,691.3,-244.3,693.2,-244.9,695.1,-244.7,696.7,-243.7,713.2,-213.1],
    [660.4,-158.0,659.7,-146.1,658.6,-134.2,656.8,-122.2,654.6,-110.2,650.8,-94.9],
    [634.2,-171.1,637.9,-173.0,641.8,-174.4,646.3,-175.3,650.8,-175.4,655.9,-174.4,657.1,-173.8,657.9,-172.7,658.2,-171.5,655.7,-158.8],
    [569.0,-70.1,579.9,-79.6,590.1,-89.7,599.7,-100.5,608.7,-112.0,616.9,-124.1,624.3,-136.7,638.1,-166.1],
    [761.4,-254.7,760.6,-262.0,760.5,-277.8,761.5,-285.2,762.8,-290.8,764.8,-296.4,767.2,-301.7],
    [749.2,291.8,762.2,273.2,772.9,259.7,778.4,250.6,776.0,249.8,780.3,241.9,782.7,242.8,789.8,224.7],
    [652.6,367.9,662.6,363.6,681.0,354.5,689.5,349.8,696.4,345.2,702.9,340.2,715.5,329.4,752.3,296.1],
    [688.7,142.1,681.7,135.1,674.3,128.5,666.6,122.3,655.6,114.5,621.8,93.2,616.2,89.1,610.7,84.6,604.0,78.4,597.9,71.6],
    [566.3,66.1,652.6,120.4,668.6,132.4,677.0,139.8,684.9,147.7],
    [143.0,220.0,140.9,271.5],
    [144.2,190.9,143.2,211.7],
    [144.5,172.2,144.1,181.7],
    [149.3,59.2,145.4,163.5],
    [515.8,406.9,619.6,380.2,652.1,373.3],
    [760.0,-388.1,693.3,-314.3],
    [878.8,-412.5,813.5,-424.6],
    [867.5,-363.7,803.7,-331.7],
    [442.5,442.8,515.3,412.2],
    [400.1,466.4,404.5,464.1]];
  const FENCES = [[-61.8,-497.3,-58.5,-581.1],
    [-54.2,-589.9,-14.7,-588.5,-16.1,-625.7],
    [100.1,-575.9,80.3,-622.3,79.5,-628.2],
    [5.0,-634.7,4.2,-624.8,2.3,-612.2,1.5,-603.2,0.9,-583.5,-0.2,-565.5],
    [102.2,-545.4,89.1,-577.2,80.4,-594.8,72.9,-608.0,59.6,-628.0,64.1,-629.7,62.2,-632.8,56.5,-636.7],
    [-13.0,735.3,-8.4,730.3,-15.0,718.0,-31.6,726.8],
    [-100.1,616.9,-92.0,591.4,-89.7,579.4,-87.4,562.6,-84.8,551.9,-66.8,501.1,-93.5,498.8],
    [-3.2,711.4,10.7,735.4],
    [-15.0,718.0,46.5,683.6],
    [69.2,671.0,95.4,656.3,114.8,692.5,25.0,742.7],
    [279.0,588.1,265.9,564.9,168.8,619.4,182.0,643.5,174.6,646.9,169.3,651.2,167.2,654.0,165.4,657.0,164.0,661.9],
    [707.0,361.9,763.4,323.8,789.2,282.6],
    [871.9,-436.5,852.3,-439.0,843.2,-437.9,835.7,-438.7,781.0,-448.7],
    [774.2,-450.0,717.6,-460.4,708.4,-458.6,704.7,-453.4,691.6,-456.0,648.0,-465.5,637.6,-467.2,611.8,-468.6,602.5,-470.9,593.8,-474.2,459.8,-503.1,395.9,-519.2,394.0,-517.2,353.9,-532.9,352.8,-546.2,355.0,-555.5,356.4,-566.9],
    [417.9,-462.2,441.6,-458.5],
    [722.0,-485.7,736.9,-483.0,739.7,-498.3],
    [835.7,-438.7,842.9,-478.2],
    [842.1,-479.3,738.8,-498.5],
    [724.6,-498.1,722.0,-485.7,698.8,-490.5,691.6,-456.0],
    [764.3,-386.1,765.4,-388.5,765.9,-391.0,765.8,-393.6,765.0,-396.1,763.8,-398.1,762.2,-399.7],
    [273.3,578.0,308.1,560.7]];
  const FOOT = [[-61.8,-282.6,-23.6,-282.2],
    [-12.7,-626.6,-11.1,-581.9,-11.3,-579.7,-12.4,-577.9,-14.3,-576.7,-38.5,-577.1,-40.6,-576.8,-42.3,-575.8,-43.5,-574.0,-53.8,-348.1,-53.9,-346.4,-54.8,-344.9,-56.2,-344.0,-59.8,-343.8],
    [-30.4,-259.3,-20.3,-259.0,-20.9,-240.7,-39.0,-241.3],
    [-39.5,-226.4,-39.8,-212.5,-12.3,-199.3,-35.5,-191.2,-35.6,-188.6],
    [-52.0,-226.8,-39.5,-226.4,-38.5,-258.1],
    [103.5,-561.1,103.4,-556.6,104.0,-552.2,105.1,-547.9,124.7,-503.7],
    [559.8,-526.7,560.2,-515.3,559.8,-512.8,559.1,-511.8,551.9,-505.3],
    [70.8,-178.5,69.9,-175.2,67.0,-169.4,65.8,-165.6,65.3,-161.5,53.2,146.0],
    [-65.2,211.2,-71.0,211.3,-71.8,211.8,-72.3,212.7,-72.6,221.6,-73.0,223.3,-74.0,224.8,-75.4,226.0,-77.1,226.6,-78.9,226.6,-80.5,226.1,-82.0,225.1],
    [50.4,213.7,61.0,214.3],
    [55.5,86.0,65.4,86.5],
    [57.6,34.9,67.5,35.3],
    [59.6,-17.2,69.5,-16.7],
    [61.6,-67.8,71.5,-67.5],
    [63.6,-119.8,73.6,-119.3]];
  const PARK = [[91.2,-364.1,98.9,-364.5,102.8,-364.2,106.7,-363.4,113.9,-360.3,116.9,-357.8,119.1,-354.9,120.7,-351.7,121.1,-348.1,121.1,-318.0,52.0,-321.1,38.5,-322.9,38.4,-333.2,45.5,-333.0,45.9,-348.8,66.3,-347.8,66.3,-352.2,72.0,-351.8,72.5,-354.6,73.6,-357.2,75.0,-359.2,76.9,-360.8,80.2,-362.5,83.8,-363.5],
    [478.2,-516.5,561.4,-517.2,561.2,-664.0,258.4,-663.4,257.0,-663.2,255.8,-662.4,254.9,-661.2,254.6,-659.8,255.0,-658.1,256.1,-656.8,257.7,-656.1,306.8,-646.9,310.7,-645.5,314.3,-643.4,317.7,-640.6,320.6,-637.1,322.7,-633.3,323.8,-629.3,325.9,-625.3,329.0,-621.2,332.8,-617.7,336.9,-615.1,341.4,-613.3,368.8,-608.1,371.1,-606.9,373.1,-605.1,374.6,-603.0,375.5,-600.2,375.6,-597.3,373.2,-578.9,373.4,-573.1,374.2,-567.3,375.6,-561.7,377.8,-555.9,380.8,-550.4,384.3,-545.3,389.8,-539.1,396.1,-533.6,403.0,-529.1,409.6,-525.8,416.6,-523.2,423.9,-521.6,431.2,-520.7,469.7,-520.8,471.7,-519.9,474.7,-517.3,477.0,-516.5]];
  const GATES = [[161.6,-335.2,3.93,5,0],[-10.1,-329.7,4.63,5,0],[144.1,186.1,1.61,5,0],[311.4,558.7,-0.49,5,0]];
  const LAMPS = [[277.7,-5.0],[375.9,-143.6],[521.4,-182.8],[516.9,-180.4],[512.8,-179.0],[504.8,-175.4],[499.4,-173.1],[493.2,-170.3],[478.1,-169.3],[469.8,-167.1],[459.8,-163.9],[418.3,-152.1],[408.8,-149.1],[400.9,-147.2],[385.2,-147.7],[364.0,-135.9],[356.9,-130.5],[348.6,-122.9],[339.9,-115.5],[332.3,-107.8],[325.6,-100.6],[319.1,-91.5],[313.2,-82.1],[307.8,-72.3],[398.5,296.3],[399.4,288.1],[408.7,279.8],[410.6,271.3],[412.4,260.5],[415.9,248.0],[418.1,241.1],[420.1,234.4],[423.7,224.1],[426.3,217.3],[430.0,212.3],[433.3,206.3],[437.0,200.5],[440.8,195.9],[444.9,190.4],[449.7,185.9],[453.8,181.9],[459.6,177.7],[465.6,174.4],[471.9,171.4],[477.7,169.1],[483.9,166.8],[490.3,165.3],[496.4,163.2],[502.0,162.2],[509.2,160.8],[515.1,160.3],[521.8,160.5],[528.1,161.7],[534.9,163.2],[541.0,165.9],[547.0,170.2],[551.9,172.1],[557.5,174.4],[291.1,-50.5],[157.8,-535.6],[137.3,-539.3],[165.9,-307.8],[162.5,-263.2],[36.2,-225.6],[-12.8,-246.8],[-13.2,-225.9],[81.9,587.9],[90.7,581.5],[98.3,576.6],[108.3,573.9],[73.7,592.3],[67.2,597.6],[60.1,601.5],[50.9,602.9],[41.1,602.7],[31.5,601.2],[27.3,599.1],[19.3,607.7],[166.6,521.1],[183.1,531.1],[190.9,527.5],[165.6,541.1],[262.6,-545.3],[556.9,-419.9],[547.5,-421.5],[538.2,-423.7],[529.3,-424.6],[519.5,-426.8],[510.0,-428.2],[500.8,-430.1],[491.3,-431.9],[482.8,-433.5],[463.6,-436.8],[453.6,-438.6],[435.5,-442.3],[425.7,-443.7],[416.2,-444.2],[407.1,-445.5],[397.5,-447.6],[388.3,-449.0],[377.7,-451.5],[369.3,-453.9],[361.3,-455.8],[351.9,-454.7],[341.7,-461.9],[333.0,-459.9],[323.0,-458.4],[314.4,-456.3],[305.9,-455.0],[297.7,-452.7],[559.8,-200.5],[548.8,-195.6],[540.1,-191.7],[563.3,177.3],[568.8,179.4],[574.4,181.9],[579.6,183.9],[585.0,186.1],[591.9,189.5],[598.2,191.7],[605.5,195.4],[611.7,197.7],[619.1,200.9],[625.1,203.3],[631.0,207.9],[636.5,212.6],[642.8,216.7],[648.2,220.3],[651.8,223.2],[654.7,225.7],[657.3,228.2],[659.4,230.0],[661.4,232.2],[663.7,236.2],[665.7,240.6],[667.3,246.1],[667.8,253.5],[667.3,257.4],[666.1,261.9],[663.6,267.4],[660.9,271.8],[657.1,275.4],[653.1,278.8],[648.5,281.3],[640.0,286.2],[633.9,289.7],[627.4,293.5],[620.9,297.1],[613.3,301.0],[141.6,123.9],[142.9,85.8],[137.8,171.9],[30.2,241.1],[-32.0,268.0],[-31.2,247.1],[-30.0,227.9],[-29.2,208.0],[-29.3,188.0],[-77.3,290.7],[606.4,305.9],[599.3,309.7],[591.6,314.4],[582.7,317.5],[563.5,319.5],[573.0,317.7],[659.4,-394.9],[649.1,-400.5],[641.2,-403.8],[631.9,-405.6],[622.3,-407.5],[614.3,-408.9],[603.5,-410.9],[594.1,-412.8],[585.1,-414.7],[576.1,-416.6],[566.1,-418.7],[669.9,-400.0],[679.2,-398.5],[688.6,-396.9],[697.8,-394.9],[707.2,-393.3],[717.0,-391.2],[725.6,-389.4],[734.9,-386.1],[739.8,-378.7],[734.9,-372.3],[726.6,-363.5],[723.9,-360.6],[720.6,-356.7],[716.3,-350.7],[704.4,-337.5],[698.1,-330.3],[693.0,-325.2],[686.1,-317.9],[680.8,-311.7],[675.5,-306.0],[670.0,-300.1],[664.3,-292.1],[651.5,-280.6],[643.2,-276.2],[635.3,-269.1],[630.2,-264.6],[624.8,-259.7],[620.4,-254.5],[615.0,-249.4],[580.6,-218.3],[574.7,-207.2],[569.2,-205.1],[657.6,-285.7],[710.3,-344.6],[243.7,552.3],[283.8,438.5],[300.3,429.8],[309.8,423.0],[319.3,416.7],[344.3,393.9],[351.3,388.1],[367.6,377.5],[371.8,370.1],[374.3,364.2],[378.1,357.2],[381.3,348.7],[387.3,335.0],[392.0,321.3],[394.2,312.3],[396.6,304.1],[555.3,322.3],[546.4,326.7],[539.6,331.6],[529.8,336.9],[513.1,345.0],[522.1,341.9],[505.2,349.6],[497.4,354.7],[488.9,359.9],[480.8,365.0],[472.7,368.9],[464.3,374.0],[455.6,377.5],[447.4,383.1],[438.6,388.6],[431.0,393.1],[423.3,398.0],[414.6,402.9],[405.5,407.4],[397.5,412.2],[389.1,416.4],[380.4,421.0],[373.0,425.6],[364.6,430.9],[356.7,435.6],[348.0,439.4],[340.1,444.2],[331.3,449.6],[323.2,454.0],[313.9,458.6],[306.8,462.8],[298.6,467.3],[290.6,472.3],[282.0,476.8],[273.9,481.1],[265.0,485.6],[257.0,490.6],[248.7,495.6],[240.8,500.1],[232.4,504.4],[215.2,513.8],[207.3,518.2]];
  const TREES = [493.0,196.5,516.0,196.0,459.5,221.0,458.5,212.5,444.0,253.0,527.5,300.0,437.0,269.0,434.5,285.0,373.5,53.0,364.5,59.5,360.5,71.0,324.5,103.0,403.0,93.5,380.5,114.0,368.0,127.0,297.0,112.0,302.0,116.5,257.5,150.5,253.5,160.5,256.0,185.0,254.0,170.0,252.5,199.5,307.0,244.0,311.0,249.0,296.5,265.5,251.5,270.5,281.5,278.0,249.5,292.0,349.0,-167.5,348.0,-143.0,494.5,-189.5,-50.5,-256.5,365.5,-302.5,558.0,-393.0,541.0,-390.0,471.5,-190.5,544.5,-211.5,556.0,-237.0,509.0,-401.5,474.5,-408.0,408.0,-415.0,419.0,-415.0,433.5,-410.0,375.5,-421.5,344.5,-427.0,320.0,-431.5,604.0,259.0,600.0,230.0,585.0,229.5,633.5,-105.0,628.5,-96.5,619.0,-92.0,59.5,96.5,62.5,21.5,62.5,26.5,67.5,-58.0,68.0,-109.0,70.5,-128.5,71.0,-158.0,816.0,-300.5,809.5,-295.5,803.0,-292.5,796.0,-289.0,777.5,-275.0,591.0,-387.5,562.5,-251.0,577.0,-265.5,677.5,-364.5,670.5,-366.0,658.5,-368.0,651.0,-373.5,653.5,-343.5,645.5,-334.0,624.0,-311.0,609.0,-297.5,700.5,-494.0,422.5,304.5,493.0,320.5,473.5,333.0,465.5,334.5,405.0,334.5,418.0,362.5,384.5,386.0,235.0,468.5,221.0,475.5,212.0,476.0,509.5,315.0];
  const TKEY = 'trees', TSTEP = 2, HW = 1;

  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {   // smooth value noise on a 9 m lattice, 0..1
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };

  // what is laid here first, then the track's own parts with its tree list lengthened by TREES for the while (the list itself kept as it is)
  const base = LK.extra;
  LK.extra = function (o) {
    const mine = lay(o), sk = A.T && A.T.def && A.T.def.sk, t0 = sk ? sk[TKEY] : null;
    if (sk && TREES.length) sk[TKEY] = (t0 || []).concat(TREES);
    let st; try { st = base(o) || {}; } finally { if (sk) sk[TKEY] = t0; }
    mine.osmTrees = TREES.length / TSTEP; st.roadside = mine; return st;
  };

  function lay(o) {
    const { root, scen, exclPush: exPush, excluded, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { walls: 0, wallM: 0, wallSkip: 0, fences: 0, fenceM: 0, posts: 0, gates: 0, ways: 0, wayM: 0, parkCells: 0, lamps: 0, meshes: 0 };
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
    // its colour after colAt, the texture U m a tile; only the cells whose middle lies 1.5 to 60 m past the barriers
    const drape = (mt, Q, C, colAt, lift, U, onCell) => {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const i0 = Math.floor(x0 / C), i1 = Math.floor(x1 / C), j0 = Math.floor(z0 / C), j1 = Math.floor(z1 / C), V = new Map();
      const vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + lift, z]], [colAt(x, z)], [[x / U, z / U]]);
      const cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const P = clip(Q, i * C, j * C, (i + 1) * C, (j + 1) * C); if (!P) continue;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        if (!past(cx, cz, 1.5) || !near(cx, cz, 60)) continue;
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
    // a strip along a line, its cross-section prof(x, z, g, nx, nz) a row of points (with its colours and its v texture coordinates) every
    // ~step m, into material mt; a row within m0 m past the barriers left out (the strip broken there); onRow(x, z, g, acc) for each row
    const strip = (W, step, m0, mt, prof, onRow) => {
      const P = walk(W, step); let prev = null, pi = -1, prb = null, L = 0;
      for (let k = 0; k < P.length; k += 3) {
        const x = P[k], z = P[k + 1], acc = P[k + 2];
        if (!past(x, z, m0)) { prev = null; continue; }
        const k0 = Math.max(0, k - 3), k1 = Math.min(P.length - 3, k + 3), dx = P[k1] - P[k0], dz = P[k1 + 1] - P[k0 + 1], dl = Math.hypot(dx, dz) || 1;
        const g = nrGround(x, z), [pts, cols, vs] = prof(x, z, g, -dz / dl, dx / dl), uvs = vs.map(v => [acc / 3, v]), rb = rbAt(mt, x, z);
        if (prev && rb !== prb) pi = rb.row(prev[0], prev[1], prev[2]);
        const r = rb.row(pts, cols, uvs);
        if (prev) { rb.link(pi, r, 0, pts.length - 1); L += acc - prev[3]; }
        prev = [pts, cols, uvs, acc]; pi = r; prb = rb; onRow(x, z, g, acc);
      }
      return L;
    };
    const FEN_C = [0.8, 0.82, 0.84], POST_C = [0.6, 0.61, 0.64];

    // the walls: in pieces of up to 8 m, each from 0.3 m below the lowest ground under it to 2 m above the highest, 0.25 m thick, grey
    // precast concrete; a piece that would stand within 2 m past the barriers left out
    const WALL_C = [0.8, 0.8, 0.78], WALL_T = [0.86, 0.86, 0.84];
    for (const W of WALLS) {
      let drawn = false;
      for (let q = 0; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 8)), l = L / m, rot = Math.atan2(bz - az, bx - ax);
        for (let t = 0; t < m; t++) {
          const x0 = ax + (bx - ax) * t / m, z0 = az + (bz - az) * t / m, x1 = ax + (bx - ax) * (t + 1) / m, z1 = az + (bz - az) * (t + 1) / m, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
          if (!past(mx, mz, 2) || !past(x0, z0, 1.5) || !past(x1, z1, 1.5)) { st.wallSkip++; continue; }
          const g0 = nrGround(x0, z0), g1 = nrGround(x1, z1), gm = nrGround(mx, mz), lo = Math.min(g0, g1, gm) - 0.3, hi = Math.max(g0, g1, gm) + 2;
          box(scen.get(mx, mz), mx, lo, mz, l + 0.05, hi - lo, 0.25, rot, WALL_C, WALL_T, true);
          const n = Math.max(1, Math.round(l / 2.5));
          for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; exclPush(x, z, 1.6); if (near(x, z, 45)) CR.avoid(x, z, 0.9); }
          st.wallM += l; drawn = true;
        }
      }
      if (drawn) st.walls++;
    }

    // the street lamps: a steel pole 8 m high (3 sides, tapering) and a flat lamp head on top, unlit (an afternoon); not within 1.5 m past
    // the barriers
    const LAMP_C = [0.62, 0.63, 0.66], HEAD_C = [0.5, 0.51, 0.54], HEAD_T = [0.85, 0.86, 0.88];
    for (const [x, z] of LAMPS) {
      if (!past(x, z, 1.5) || !cyl) continue;
      const g = scen.get(x, z), y = nrGround(x, z);
      cyl(g, x, y - 0.1, z, 0.09, 8.1, 3, LAMP_C, null, 0.05);
      box(g, x, y + 7.9, z, 0.7, 0.18, 0.3, (x * 7 + z) % 3, HEAD_C, HEAD_T, true);
      exclPush(x, z, 0.8); if (near(x, z, 45)) CR.avoid(x, z, 0.6); st.lamps++;
    }

    // the fences: chain-link mesh 2 m high (the builder's fence texture, as on its catch fences) on rows every ~2.5 m along, on the ground;
    // a steel post every ~5 m; a row within 2 m past the barriers left out
    for (const W of FENCES) {
      let lastPost = -1e9;
      const L = strip(W, 2.5, 2, 1, (x, z, g) => [[[x, g - 0.05, z], [x, g + 2, z]], [FEN_C, FEN_C], [0, 0.76]], (x, z, g, acc) => {
        if (cyl && acc - lastPost > 4.9) { cyl(scen.get(x, z), x, g - 0.1, z, 0.04, 2.1, 3, POST_C); lastPost = acc; st.posts++; }
        exclPush(x, z, 1.2); if (near(x, z, 45)) CR.avoid(x, z, 0.8); });
      if (L > 0) { st.fences++; st.fenceM += L; }
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

    // the ways: paving HW * 2 m wide on rows of two across (the left and the right edge) every ~2.5 m along, 0.1 m over the ground, a
    // little patchy; cut where they run within the barriers
    for (const W of FOOT) {
      const L = strip(W, 2.5, HW + 1.2, 2, (x, z, g, nx, nz) => { const f = 0.95 + 0.08 * patch(x, z), col = [0.95 * f, 0.94 * f, 0.92 * f];
        return [[-HW, HW].map(e => [x + nx * e, nrGround(x + nx * e, z + nz * e) + 0.1, z + nz * e]), [col, col], [-HW / 2, HW / 2]]; }, (x, z, g, acc) => {
        exclPush(x, z, HW + 1); if (Math.round(acc) % 5 === 0 && near(x, z, 45)) CR.avoid(x, z, HW + 0.4); });
      if (L > 0) { st.ways++; st.wayM += L; }
    }

    // the car parks: plain asphalt in 6 m cells, a little patchy, 0.03 m over the ground (the service roads, 0.08 m up, over them)
    const parkAt = (x, z) => { const f = 0.9 + 0.12 * patch(x + 300, z); return [0.78 * f, 0.78 * f, 0.8 * f]; }, pc = new Set();
    for (const Q of PARK) drape(3, Q, 6, parkAt, 0.03, 3, (cx, cz) => {
      const key = Math.floor(cx / 6) + ',' + Math.floor(cz / 6); if (!pc.has(key)) { pc.add(key); st.parkCells++; } });

    // the meshes: the paving over the ground (polygon offset), the car parks' asphalt under the service roads, the mesh of the fences and
    // the gates seen from both sides; MT4 the track's own (the tyre walls)
    const MAT = [null, [tex.fence, 'roadside-fence'], [tex.paving || tex.asphalt, 'roadside-paving'], [tex.asphalt, 'roadside-asphalt'], [tex.tires, 'roadside-tyres']], mats = [];
    for (const { mt, rb } of tiles.values()) {
      if (rb.empty) continue;
      const mat = mats[mt] || (mats[mt] = mt === 1 ? new THREE.MeshLambertMaterial({ map: tex.fence, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide })
        : mt === 4 ? new THREE.MeshLambertMaterial({ map: tex.tires, vertexColors: true, side: THREE.DoubleSide })
        : new THREE.MeshLambertMaterial({ map: MAT[mt][0], vertexColors: true, polygonOffset: true, polygonOffsetFactor: mt === 3 ? -1 : -3, polygonOffsetUnits: mt === 3 ? -2 : -6 }));
      const m = new THREE.Mesh(rb.geometry(), mat); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = MAT[mt][1]; root.add(m); st.meshes++;
    }
    for (let k = 0; k < later.length; k += 3) exPush(later[k], later[k + 1], later[k + 2]);
    st.wallM = Math.round(st.wallM); st.fenceM = Math.round(st.fenceM); st.wayM = Math.round(st.wayM);
    return st;
  }
})();
