/* =====================================================================================================================================
   WORLD — Bathurst, Avstralija: by the circuit on the public roads round the hill (grafika ob progi), from OpenStreetMap, on
   js/world-bathurst.js (RB_LOOK.bathurst on the shared builder of js/world-rbring.js: its hook LK.extra, laid before the trees, the
   houses and the crowds, so they keep clear of it).
   Drawn: the roads off the circuit within ~110 m (OSM highway=tertiary/residential/service/track; the circuit's own ways left out): the
     sealed roads (asphalt, or no surface tag: asphalt, assumed), the gravel and dirt roads and tracks (surface=gravel/dirt/unpaved, or a
     track with no tag: paler, red-brown); the car parks (amenity=parking, no building). The power line along the hill (power=minor_line,
     cables=3; its poles, power=pole, where OSM has them): a timber pole with one cross-arm and three wires sagging between poles. The
     fences of the paddocks within ~90 m (barrier=fence, no fence_type: post and wire, assumed: timber posts 4 m apart, three plain wires),
     the gates within ~90 m (barrier=gate on a road or a fence: a galvanised tube farm gate, closed, between two posts) and the picnic
     shelter and the gazebos (amenity=shelter, picnic_shelter / gazebo: posts and a sheet iron roof on OSM's outline).
     Widths (OSM has no width tags here): the tertiary road 2 × 3.5 m lanes and 0.5 m sealed each side (8 m; Austroads, Guide to Road
     Design Part 3: 3.0 to 3.5 m lanes), the residential road 7 m, the service roads 3.5 m, the aisles 5 m, the gravel roads and tracks
     3.5 and 3 m (assumed). Heights: the pole 10 m, the cross-arm 2.4 m, the fence 1.1 m, the gate 1.2 m (assumed: no height tags).
   Not drawn: the circuit and its walls, the camp pitches and everything OSM marks temporary (the race meeting's stands, screens and
     fuel), the buildings (the houses and the town: js/world-rbring.js), the footways and the steps, the trees (js/world-rbring.js); a road
     inside the barriers.
   Data: OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0), the main API, 2026-11-23; metres, origin = the start line (-33.43930,
   149.55846), x east, z south; the lines simplified to 0.25 m.
   ===================================================================================================================================== */
(function () {
  'use strict';
  if (typeof World === 'undefined' || !World.api) return;
  const A = World.api, LK = A.rbLook && A.rbLook.bathurst;
  if (!LK) return;

  // the roads: [class, lanes, x0, z0, ...]: class 0 the tertiary road, 1 the residential road, 3 the sealed service roads, 4 the aisles, 5 the
  // tracks (gravel or dirt), 6 the service roads of gravel or dirt; lanes as OSM's lanes tag (0: none)
  const WAYS = [
    [0,0,-245.4,-32.2,-257.0,-41.8,-273.4,-45.9,-355.3,-60.9],
    [3,0,240.6,-59.0,260.4,-63.3],
    [0,0,321.0,-17.4,285.0,14.8,242.5,49.8],
    [3,0,212.4,282.9,193.9,290.3,182.0,298.4,170.6,304.9,160.9,307.5,149.8,308.1,102.6,300.7],
    [3,0,240.6,-59.0,284.9,-53.8],
    [3,0,296.6,-44.0,295.2,-38.9,291.1,-34.4],
    [3,0,240.6,-59.0,138.2,-78.3,-159.6,-129.4,-232.1,-140.1,-257.8,-142.3],
    [3,0,-303.3,-124.1,-311.7,-117.3,-323.4,-109.2],
    [3,0,223.1,213.8,222.6,173.6,225.3,106.6,224.6,98.6,223.5,95.5,221.2,93.2,211.1,87.6,208.2,85.0,202.9,74.7,199.7,70.9,194.2,67.4,172.0,58.8,167.3,55.2,163.7,50.6,159.9,43.5,155.5,39.7,141.2,33.9],
    [3,0,114.9,844.0,108.0,842.6,98.9,837.3,90.7,830.3,87.6,824.1,85.3,815.2,84.2,801.5,85.6,789.2,93.5,753.4,95.3,742.2,95.2,735.5,94.2,728.9,91.3,715.7,82.3,692.0],
    [3,0,114.9,844.0,143.0,849.8],
    [3,0,344.9,555.7,328.6,640.0,321.6,668.4,313.6,690.6,302.8,712.1,257.9,775.0,227.2,811.9,214.6,824.9,200.9,836.7,191.3,842.7,179.3,847.2,169.4,849.5,159.1,851.1,151.1,850.9,143.0,849.8],
    [3,0,-120.6,-68.9,-177.0,-81.5,-181.7,-85.9,-188.6,-98.9,-195.6,-105.6,-211.1,-114.5,-224.3,-119.3],
    [3,0,-224.3,-119.3,-229.3,-123.3,-232.2,-129.0,-232.1,-140.1],
    [4,0,327.7,27.8,310.0,36.6,353.3,43.6],
    [4,0,349.8,31.2,327.7,27.8],
    [3,0,-950.8,1786.3,-957.5,1802.0,-959.6,1811.0,-956.7,1847.7,-958.8,1864.5,-959.7,1892.8,-961.9,1908.0],
    [3,0,-981.0,1087.3,-966.8,1096.0,-947.4,1108.8,-932.0,1121.8,-924.0,1130.4,-916.0,1141.9,-909.4,1154.5,-904.7,1166.5,-902.9,1178.1,-903.3,1194.4,-907.4,1215.5,-913.2,1236.9,-918.1,1250.1,-922.5,1256.7,-929.5,1264.2,-951.8,1285.1,-962.2,1293.0,-974.6,1304.1,-1007.8,1331.9,-1026.5,1342.3,-1041.2,1347.4,-1051.0,1354.1,-1060.4,1365.5,-1067.1,1376.1,-1084.0,1408.4,-1105.6,1442.6,-1119.6,1466.5,-1125.8,1479.2,-1129.3,1490.6,-1134.5,1513.4,-1138.9,1550.5,-1140.2,1569.4,-1139.5,1592.4,-1137.7,1605.3,-1134.5,1616.9,-1120.2,1647.3,-1115.8,1658.5,-1109.5,1684.2,-1100.2,1718.5,-1080.2,1744.9,-1034.2,1823.6,-1013.7,1850.5,-1006.2,1855.2,-997.5,1857.2,-987.3,1857.0,-976.2,1858.9,-958.8,1864.5],
    [3,0,-958.8,1864.5,-916.9,1883.2,-881.4,1900.6,-867.6,1907.0,-821.7,1930.4],
    [3,0,-752.6,1933.1,-747.8,1931.8,-736.8,1926.5,-722.0,1917.1,-716.1,1917.5],
    [3,0,-881.4,1900.6,-860.8,1884.1],
    [3,0,-777.9,1898.5,-746.3,1903.3,-730.0,1912.8,-722.0,1917.1],
    [3,0,-922.5,1256.7,-938.6,1243.0,-948.9,1238.2,-960.0,1234.7,-984.3,1224.1],
    [3,0,207.5,316.3,224.4,318.5,234.7,322.1,230.3,355.6,227.7,360.5,223.4,362.4,200.8,359.9],
    [3,0,286.3,323.0],
    [4,0,298.9,341.8,303.8,311.0],
    [3,0,314.9,312.7,291.6,309.2,289.1,304.9,285.5,300.7,279.7,299.1,274.1,300.9,270.3,305.5,266.8,317.1,265.2,319.4],
    [3,0,-974.6,1304.1,-992.5,1298.5,-1025.4,1292.6,-1038.1,1292.1,-1059.4,1292.5],
    [3,0,-273.1,237.6,-249.3,225.7,-237.3,212.8,-216.6,136.1,-214.1,124.1,-206.3,78.4],
    [3,0,-1059.4,1292.5,-1059.4,1289.8,-1058.4,1285.9,-1044.1,1282.3,-1029.5,1281.7,-1014.9,1282.0,-986.8,1287.5,-962.2,1293.0],
    [3,0,-1059.4,1292.5,-1082.2,1303.0],
    [3,0,-1167.1,1428.9,-1173.2,1454.2,-1178.5,1471.6,-1183.4,1485.6,-1189.0,1505.5,-1193.0,1525.8,-1194.5,1537.3],
    [3,0,327.7,27.8,327.4,12.9,312.6,-9.9],
    [4,0,310.0,36.6,306.9,54.2],
    [5,0,-991.9,1679.5,-971.0,1679.0,-960.1,1682.5,-954.1,1686.5,-948.7,1691.7,-944.8,1697.4,-942.4,1703.5,-941.3,1709.0,-941.9,1715.2],
    [3,0,-611.2,1045.5,-616.4,1053.7,-621.3,1056.4,-626.6,1057.5,-657.1,1059.1,-666.1,1061.0,-673.4,1065.3,-679.8,1071.9,-692.8,1086.5,-712.7,1114.6],
    [3,0,-720.9,1135.5,-723.9,1146.3,-733.1,1216.7,-733.1,1223.3],
    [6,0,-448.3,1081.0,-446.4,1096.5,-447.3,1107.3,-448.7,1112.8,-455.1,1120.8,-469.4,1134.4,-498.6,1159.8,-506.2,1163.3,-518.5,1164.2,-530.5,1165.9,-544.7,1168.9,-553.3,1169.1,-563.0,1166.9],
    [6,0,-295.9,136.6,-307.9,135.8,-318.4,137.8,-329.9,144.6,-336.4,151.2,-341.6,158.6,-350.1,166.1,-334.1,193.1,-325.4,187.9,-315.3,177.2,-312.0,170.3,-307.9,135.8],
    [6,0,-5.6,1726.9,2.1,1728.6,5.7,1730.9,26.8,1739.3,33.7,1743.5,41.0,1749.9,47.4,1757.7,52.1,1765.7,55.0,1774.3,56.4,1791.4,56.0,1828.3,60.9,1848.3,51.3,1866.8,48.9,1881.2,61.9,1901.5,73.1,1907.8,77.5,1903.5],
    [6,0,80.1,1886.0,64.8,1864.1,60.9,1848.3],
    [3,0,-2.0,1704.3,-26.0,1700.8,-84.8,1690.2],
    [4,0,-105.0,1995.2,-106.5,1962.4],
    [6,0,-390.2,185.3,-400.0,183.6],
    [3,0,-6.6,1732.6,-21.6,1731.7,-43.0,1728.6,-48.1,1729.7,-53.1,1733.6],
    [6,0,-352.8,527.0,-458.4,508.6],
    [3,0,-78.4,2008.5,-105.0,1995.2],
    [6,0,-361.2,574.0,-368.6,575.1,-379.4,583.2,-384.2,594.5,-383.9,609.8],
    [6,0,-12.1,1952.2,-7.7,1980.9,-8.0,1999.8,-2.9,2019.2,14.6,2048.5,21.9,2056.9],
    [3,0,-14.1,1777.8,-29.2,1775.4,-50.8,1761.8,-59.1,1757.6,-75.4,1752.5,-97.6,1748.3,-112.6,1746.7,-119.9,1748.0],
    [3,0,108.5,972.7,133.9,973.4,195.8,980.4,213.2,983.3],
    [3,0,-461.7,1067.5,-455.7,1074.4,-449.4,1077.5,-448.3,1081.0],
    [3,0,56.6,1317.5,8.5,1317.4,-2.5,1318.5],
    [3,0,3.8,1666.7,-13.9,1665.1,-100.5,1649.7],
    [3,0,-106.5,1962.4,-106.6,1955.5,-104.8,1953.1,-101.4,1952.1,-72.7,1952.8,-59.0,1951.0,-46.7,1950.2],
    [6,0,9.7,1628.0,18.6,1633.8,115.9,1654.3],
    [6,0,-334.1,193.1,-344.3,193.8,-361.4,190.4],
    [3,0,9.7,1628.0,-73.1,1613.6,-94.0,1610.3],
    [6,0,-325.8,372.4,-339.4,368.9,-351.7,371.5,-382.9,363.2,-403.2,352.7],
    [3,0,-311.5,290.8,-321.0,289.7,-416.4,273.3],
    [3,0,-760.5,963.5,-756.5,954.3,-756.1,948.3,-758.6,944.1,-768.2,938.0,-776.1,928.1],
    [3,0,-858.3,1061.4,-864.5,1066.2,-868.2,1066.6,-871.3,1064.6,-884.5,1050.0,-888.3,1047.5],
    [6,0,-420.4,956.8,-416.6,961.7,-411.2,989.5,-384.0,1019.8],
    [3,0,-338.9,446.7,-366.5,440.5,-372.2,434.8,-383.8,429.1,-396.1,426.4,-407.2,427.3,-419.7,431.2,-429.9,431.0,-446.1,425.4],
    [3,0,-304.5,251.0,-312.7,244.4,-371.0,202.8,-394.8,196.3,-404.8,194.6],
    [6,0,-452.9,1002.0,-527.2,912.5],
    [3,0,-371.8,635.2,-343.8,650.1,-351.9,688.2,-355.9,693.4,-362.0,697.1,-370.9,698.9,-382.7,698.5],
    [6,0,-373.3,820.5,-298.2,833.3],
    [3,0,-361.4,190.4,-390.2,185.3,-389.1,179.2,-386.6,174.9,-379.8,174.8,-369.3,188.9],
    [3,0,-393.4,760.8,-405.2,752.3,-421.7,725.4,-427.3,719.1,-434.2,716.5,-489.1,713.8,-494.8,714.1],
    [3,0,80.5,1158.2,57.8,1154.2,55.2,1154.1,52.1,1154.8,49.6,1156.0,47.4,1157.9,38.6,1168.3,34.9,1171.8,29.9,1175.0,26.3,1176.6,23.2,1177.2,20.1,1177.3,15.4,1177.0,3.4,1175.2],
    [3,0,114.1,934.9,103.7,934.0,71.6,934.4,62.6,935.2,34.7,939.3,26.6,942.0,20.3,945.9,14.4,952.5,11.4,968.6,1.3,991.0],
    [6,0,-383.9,609.8,-386.9,638.1,-391.9,663.9,-395.6,670.3,-403.0,677.2,-417.0,682.2,-447.6,687.5,-460.8,687.6,-470.7,684.7,-485.5,677.2],
    [6,0,-862.1,1056.8,-856.7,1049.1,-855.3,1044.2,-855.8,1040.0,-862.1,1025.4,-863.8,1018.2,-862.9,1010.7,-861.0,1004.9,-856.6,997.8,-850.6,992.0,-843.2,987.4,-833.3,984.6,-823.3,985.1,-814.8,987.6,-805.6,991.4,-790.2,1000.8,-783.6,1006.1,-758.2,1036.3,-751.9,1044.5],
    [3,0,-1106.9,1656.3,-1115.8,1658.5],
    [5,0,-866.0,1927.5,-867.6,1907.0],
    [4,0,-860.8,1884.1,-852.0,1882.5,-776.6,1890.5],
    [3,0,-776.6,1890.5,-777.9,1898.5,-783.9,1928.7],
    [6,0,-976.2,1858.9,-993.7,1813.0,-1029.2,1744.3,-1041.0,1725.4,-1059.5,1703.5,-1098.9,1670.2,-1106.9,1656.3],
    [3,0,-115.2,2067.7,-109.1,2072.0,-130.9,2108.4,-131.9,2115.0,-130.8,2122.3,-127.8,2128.1,-88.6,2159.7],
    [3,0,-1052.1,1277.6,-1044.1,1282.3],
    [6,0,-1011.2,1011.2,-988.9,1015.5,-981.9,1016.1,-972.7,1015.8,-957.7,1016.3],
    [6,0,-862.6,843.3,-866.7,847.0,-876.1,853.9],
    [3,0,-310.8,1851.6,-317.7,1887.4,-318.2,1899.5,-317.5,1903.9,-313.7,1912.8,-294.7,1942.1,-276.3,1954.4,-263.6,1968.1,-247.6,1976.8,-242.3,1982.4],
    [3,0,93.5,753.4,80.0,758.4,70.1,766.4,61.4,778.2,51.7,799.8,45.2,824.0,42.9,843.0,41.5,848.2,39.0,853.0,34.3,857.6,26.7,859.7,17.9,859.0],
    [3,0,-455.6,1189.6,-446.9,1145.3,-437.6,1104.9,-446.4,1096.5],
    [3,0,-253.8,242.2,-300.8,478.1],
    [4,0,-260.7,276.8,-199.7,286.8],
    [4,0,95.4,346.5,140.9,353.9],
    [4,0,-185.2,97.4,-207.5,232.6],
    [3,0,101.1,581.9,110.2,573.8,120.2,561.6],
    [4,0,-288.9,418.5,-224.6,428.9],
    [4,0,-268.9,317.6,-208.8,327.8],
    [4,0,75.7,499.5,110.8,505.4],
    [4,0,87.4,397.9,132.3,405.3],
    [4,0,-296.8,457.7,-232.0,468.2],
    [4,0,-278.3,364.9,-217.9,375.0],
    [4,0,80.1,450.1,125.5,457.6],
    [3,0,257.9,775.0,273.8,792.0],
    [4,0,80.5,541.4,100.8,544.7],
    [4,0,92.4,365.5,137.9,373.1],
    [4,0,-258.2,264.0,-197.2,274.1],
    [4,0,-191.1,235.2,-249.3,225.7],
    [3,0,-301.7,234.3,-273.1,237.6,-253.8,242.2,-196.8,251.4],
    [4,0,73.5,478.0,118.3,485.5],
    [4,0,-228.4,449.2,-293.0,438.6],
    [4,0,98.6,324.8,144.0,332.1],
    [4,0,79.1,520.2,104.3,524.6],
    [4,0,90.8,377.1,135.7,384.3],
    [4,0,-236.0,488.9,-300.8,478.1],
    [4,0,-205.5,306.7,-264.7,296.7],
    [4,0,82.9,424.6,127.8,431.9],
    [4,0,-218.6,399.9,-283.1,389.2],
    [4,0,-212.8,348.4,-273.0,338.3],
    [4,0,144.0,332.1,137.9,373.1,135.7,384.3,132.3,405.3],
    [3,0,-339.1,646.3,-335.6,644.4,-331.6,643.3,-327.5,643.2,-269.0,653.3],
    [6,0,-354.9,538.6,-253.5,558.4,-248.5,559.8],
    [3,0,291.6,309.2,286.3,323.0],
    [3,0,141.2,33.9,16.9,12.9,-48.7,1.1,-189.9,-23.4,-202.3,-24.8,-208.2,-24.7,-213.8,-23.8,-219.9,-22.2,-226.1,-20.1,-231.4,-17.3,-236.8,-13.9,-246.9,-6.1,-250.4,-2.1,-253.1,1.9,-254.9,5.9,-256.3,11.7,-260.6,32.7,-279.8,109.6],
    [3,0,-991.9,1679.5,-970.9,1711.6,-957.2,1735.5],
    [3,0,-36.3,1912.2,-29.3,1914.7,-26.3,1916.3,-23.6,1918.1,-21.4,1920.6,-19.7,1923.7,-15.5,1935.0,-12.1,1952.2],
    [3,0,-120.7,25.5,-117.0,1.5],
    [3,0,-117.0,1.5,-115.2,-10.4],
    [3,0,-54.4,36.3,-50.3,12.3],
    [3,0,-50.3,12.3,-48.7,1.1],
    [3,0,11.8,47.5,15.3,23.0],
    [3,0,15.3,23.0,16.9,12.9],
    [3,0,78.1,58.5,82.2,33.8],
    [3,0,82.2,33.8,83.8,24.2],
    [4,0,-168.6,100.6,-185.2,97.4],
    [4,0,127.8,431.9,125.5,457.6,122.4,476.4,118.3,485.5,110.8,505.4,104.3,524.6,100.8,544.7],
    [3,0,265.2,319.4,241.1,322.8],
    [3,0,-121.7,32.1,-55.4,43.5,91.9,67.7,103.5,73.0,94.7,123.3],
    [3,0,-166.3,84.9,-206.3,78.4,-196.8,20.1,-121.7,32.1],
    [3,0,175.4,60.1,171.4,77.5,158.1,95.6,150.7,79.4,148.3,69.9,150.1,63.0,153.6,57.0,155.7,50.5,157.4,41.3],
    [5,0,-625.6,1823.9,-598.6,1828.6,-514.3,1846.5,-503.4,1850.7],
    [5,0,-535.8,1806.0,-549.2,1809.1,-564.7,1810.1,-575.0,1809.8,-612.9,1805.1],
    [5,0,-524.8,1807.6,-484.3,1748.5],
    [3,0,-941.9,1715.2,-952.5,1763.2,-955.0,1769.1,-960.9,1777.3],
    [3,0,-1018.9,1691.4,-997.9,1680.6,-991.9,1679.5],
    [5,0,-415.3,1910.9,-419.8,1891.5,-424.6,1876.4,-425.8,1873.8,-432.2,1862.6,-448.8,1845.7,-478.6,1822.1,-492.7,1816.6,-524.8,1807.6,-535.8,1806.0,-549.2,1796.4,-561.1,1786.6,-571.4,1780.5,-605.0,1763.6,-625.7,1755.2,-646.9,1748.4,-662.1,1745.5,-686.2,1743.4],
    [3,0,-253.7,1973.6,-247.9,1954.6,-244.4,1949.4,-232.2,1941.6,-220.4,1936.4,-211.3,1935.3,-196.4,1935.5,-188.4,1933.9],
    [3,0,-21.6,1731.7,-32.4,1742.1,-35.4,1743.7,-38.6,1744.1,-42.1,1743.2,-53.1,1733.6,-58.3,1728.0,-63.8,1724.3,-69.0,1722.2,-87.6,1719.7],
    [3,0,-113.5,1716.0,-87.6,1719.7,-83.4,1716.6,-77.1,1713.2,-70.7,1703.6,-66.8,1693.6],
    [3,0,-110.1,2024.6,-104.9,2005.8,-105.0,1995.2],
    [3,0,-242.3,1982.4,-235.6,1992.5,-231.5,1996.3,-222.7,2001.3,-215.7,2003.2,-205.0,2005.3,-198.1,2008.6,-195.0,2013.9,-193.7,2025.1,-191.0,2030.6,-184.3,2037.6,-159.6,2058.1,-153.1,2059.7,-147.8,2058.4,-128.1,2046.2,-118.0,2037.8,-110.9,2027.8,-110.1,2024.6],
    [3,0,-949.7,1322.3,-951.5,1316.0,-935.7,1298.9,-925.5,1286.5,-920.9,1277.5,-917.7,1264.9,-922.5,1256.7],
    [4,0,-941.3,1174.7,-925.1,1177.9],
    [4,0,-946.0,1197.7,-924.7,1202.9],
    [4,0,-966.2,1214.4,-929.9,1223.8],
    [4,0,-939.4,1151.1,-933.4,1159.7,-928.4,1168.4,-925.1,1177.9,-924.7,1202.9,-929.9,1223.8],
    [3,0,-1160.8,1670.2,-1153.5,1677.7,-1145.3,1684.5,-1139.1,1687.3,-1132.9,1689.0,-1109.5,1684.2],
    [3,0,-1194.5,1537.3,-1192.5,1567.0,-1189.9,1582.5,-1185.8,1597.6,-1170.0,1647.1,-1160.8,1670.2],
    [4,0,138.9,933.1,140.7,942.3,168.1,946.4,172.4,945.6,174.6,943.2,180.2,923.6,194.9,926.6],
    [4,0,138.9,933.1,184.2,898.6,199.6,903.8],
    [4,0,184.2,898.6,183.5,911.7,180.2,923.6],
    [4,0,129.3,957.0,172.5,963.3,178.7,961.5,183.8,958.5,187.7,954.4,192.1,945.7,194.9,926.6,199.6,903.8,204.2,873.5,209.4,870.1,249.6,847.2],
    [4,0,221.1,863.4,229.2,903.3],
    [4,0,-1042.3,1292.4,-995.7,1321.8],
    [4,0,-1071.4,1298.2,-1017.2,1337.2],
    [4,0,-1088.7,1310.7,-1037.1,1346.0],
    [4,0,-1100.1,1328.1,-1053.0,1356.6],
    [4,0,-1111.2,1340.4,-1064.6,1372.3],
    [4,0,-1127.1,1354.3,-1099.2,1373.2],
    [4,0,-1138.3,1371.7,-1083.5,1407.5],
    [4,0,-1149.4,1387.5,-1094.4,1424.9],
    [4,0,-1156.2,1407.8,-1106.0,1443.4],
    [4,0,-1172.1,1449.5,-1125.8,1479.2],
    [4,0,-1177.2,1467.2,-1130.2,1494.4],
    [4,0,-1183.4,1485.6,-1134.6,1513.9],
    [4,0,-1190.3,1580.2,-1137.9,1603.7],
    [4,0,-1178.2,1621.3,-1151.9,1639.0],
    [4,0,-1184.3,1602.5,-1130.3,1625.6],
    [4,0,-1086.0,1737.3,-1107.6,1752.5],
    [4,0,-1076.4,1751.3,-1097.6,1765.3],
    [4,0,-1075.3,1753.2,-1040.0,1727.0],
    [4,0,-1089.9,1782.9,-1067.1,1767.2],
    [4,0,-1080.3,1796.7,-1058.6,1781.9],
    [4,0,-1072.3,1812.1,-1049.6,1797.2],
    [4,0,-1064.4,1818.5,-1044.6,1805.8],
    [4,0,-1095.9,1724.3,-1116.6,1738.6],
    [5,0,-989.9,1857.0,-991.8,1869.6,-1026.9,1865.3],
    [5,0,-959.7,1892.8,-1000.4,1888.0],
    [5,0,-729.3,1921.8,-729.7,1932.0],
    [5,0,-862.4,1926.4,-860.3,1910.8],
    [5,0,-882.6,1900.0,-886.3,1925.9],
    [5,0,-910.1,1925.1,-905.2,1888.9],
    [5,0,-919.2,1882.2,-924.9,1922.7],
    [5,0,-939.5,1915.6,-933.6,1876.0],
    [3,0,-716.1,1917.5,-711.0,1920.1,-708.7,1925.4,-707.2,1933.8],
    [3,0,-298.5,698.0,-291.2,693.3,-285.9,685.1,-279.1,662.0,-278.9,657.5,-280.2,654.0,-283.2,650.8],
    [3,0,291.1,-34.4,283.6,-30.8,276.1,-31.2,269.7,-34.6,240.6,-59.0]
  ];
  // the car parks: their outlines
  const PARK = [
    [-120.6,-68.9,-113.1,-117.3,135.9,-75.0,227.0,-58.9,238.6,-54.3,268.8,-32.4,271.4,-28.9,271.6,-25.9,268.2,-22.0,246.3,-13.9,221.0,-11.1,167.0,-16.2,131.4,-21.5,-77.4,-56.0,-121.0,-65.9],
    [366.2,31.2,362.0,54.5,358.5,63.5,313.9,56.3,311.8,68.9,305.4,67.9,300.6,62.0,305.8,32.7,320.1,24.2,335.7,26.1],
    [-108.7,2003.9,-110.7,1963.7,-92.2,1961.1,-87.9,1967.2,-99.5,2002.3],
    [-858.9,1878.3,-763.9,1883.7,-769.6,1907.0,-784.8,1904.6,-787.5,1899.6,-795.1,1897.5,-825.0,1895.2,-833.3,1893.4,-846.9,1888.0,-855.1,1886.9],
    [-201.6,83.2,-192.0,24.1,91.0,70.9,81.1,130.3],
    [183.1,101.3,145.1,92.8,130.5,171.9,169.2,178.2]
  ];
  // the fences: [x0, z0, ...]
  const FENCE = [
    [204.4,933.5,202.5,946.1,198.2,956.6,190.1,966.3,180.5,972.1,175.0,973.7],
    [-445.4,1118.0,-445.4,1118.0],
    [-898.7,1068.0,-868.8,1073.1,-847.7,1100.2,-843.2,1138.0,-862.3,1245.5,-885.8,1275.2,-927.1,1299.2,-933.4,1305.4],
    [-916.3,1293.0,-925.0,1284.6,-927.9,1283.4,-946.2,1299.9,-959.8,1311.5,-987.9,1340.7,-1064.2,1417.9,-1086.8,1479.7,-1092.6,1488.7,-1092.7,1497.2,-1096.0,1510.0,-1106.0,1543.2,-1112.1,1565.4,-1007.9,1732.6,-963.7,1800.1,-964.6,1809.2,-959.3,1809.4,-954.6,1810.9,-950.7,1814.2,-924.8,1840.3,-908.0,1845.1,-900.4,1848.2,-895.4,1851.2,-886.9,1858.5,-873.7,1863.0,-835.2,1859.3,-741.2,1833.3,-677.7,1832.8,-672.5,1834.6,-672.3,1830.6,-651.6,1832.6,-630.3,1833.9,-595.4,1852.7,-573.8,1865.1,-563.2,1873.0,-523.5,1866.4,-503.1,1862.5,-473.1,1887.7,-470.8,1926.0,-411.3,1923.9,-388.5,1944.5,-355.4,1969.1,-307.6,2005.7,-251.8,2028.9,-223.2,2070.2,-204.3,2113.5,-185.5,2131.0,-156.3,2141.4,-149.2,2131.5,-70.1,2191.9,-79.6,2229.4,-219.6,2136.6,-261.4,2063.7,-296.7,2038.2,-326.6,2012.6,-347.4,1992.9,-353.6,1982.3,-378.3,1960.9,-413.2,1928.8,-471.2,1938.2,-489.9,1939.4,-508.0,1937.9,-532.1,1933.8,-533.4,1937.4,-544.1,1938.4,-550.3,1941.3,-553.2,1939.2,-565.9,1941.7,-584.0,1944.3,-647.1,1932.2],
    [-974.9,1115.2,-934.8,1141.5,-926.1,1152.3,-915.6,1174.3,-914.8,1183.7,-915.4,1210.3,-927.7,1247.1,-933.8,1240.0],
    [-195.8,94.0,-198.4,97.4,-205.5,125.9,-227.5,121.2,-206.6,-2.3],
    [-195.8,94.0,-190.3,92.7,-41.0,120.3,-39.1,121.4,-40.4,152.5,-23.0,155.9,-21.9,150.0,-11.6,151.7,-7.6,126.4,86.1,141.9,88.6,126.8],
    [-276.5,240.5,-268.9,243.8,-277.8,291.1,-328.8,541.8,-344.5,538.9],
    [-379.9,-76.6,-368.0,-78.2,-337.5,-72.4,92.4,0.0,110.1,1.7,122.2,4.2],
    [122.2,4.2,133.3,5.7],
    [133.3,5.7,152.1,10.1,174.3,12.3,193.6,12.2,210.3,10.7,222.1,8.8,234.3,6.1,252.2,0.9,266.6,-4.5,283.2,-12.5,295.3,-19.1,306.5,-26.8,318.1,-35.8,337.5,-53.4,339.4,-56.5],
    [309.9,14.6,278.1,45.4,262.2,75.0,257.2,105.3,252.1,139.1,233.0,255.8,231.2,269.8,224.4,311.7],
    [-328.8,541.8,-200.6,564.5],
    [-933.8,1240.0,-941.5,1232.2],
    [-947.7,1242.6,-933.0,1256.6,-932.5,1257.9,-933.4,1260.5,-957.1,1281.5,-1002.9,1274.7],
    [-433.4,-60.2,-502.6,-70.8,-529.9,80.6,-408.4,102.7,-296.1,122.4]
  ];
  // the power line: its spans, pole to pole [x0, z0, x1, z1, ...]
  const SPAN = [282.5,639.3,319.9,392.6,319.9,392.6,344.7,248.7,344.7,248.7,365.9,113.3,365.9,113.3,254.1,-54.0,254.1,-54.0,115.7,-75.6,115.7,-75.6,-6.9,-95.8,-6.9,-95.8,-200.0,-128.1,145.4,1657.9,138.3,1498.4,138.3,1498.4,130.8,1328.3,130.8,1328.3,126.2,1229.8,126.2,1229.8,123.4,1164.5,123.4,1164.5,91.9,1158.5,123.6,1154.1,123.4,1164.5,123.4,1164.5,191.0,1175.3,-1014.0,1763.1,-1077.7,1716.1,-1077.7,1716.1,-1127.0,1681.2,-1127.0,1681.2,-1128.6,1641.3,-1093.3,1611.1,-1054.7,1392.1,-1054.7,1392.1,-1040.3,1376.8,-1040.3,1376.8,-1015.1,1350.1,-1015.1,1350.1,-988.7,1323.6,-988.7,1323.6,-958.1,1278.9,-958.1,1278.9,-939.0,1224.5,-939.0,1224.5,-914.0,1184.1,-914.0,1184.1,-899.6,1160.9,-899.6,1160.9,-885.5,1137.2,-885.5,1137.2,-866.4,1116.6,-866.4,1116.6,-517.8,1050.5,-517.8,1050.5,-459.2,1084.0,-459.2,1084.0,-431.2,1066.3,-431.2,1066.3,-395.9,1038.0,-517.8,1050.5,-519.8,1097.6,-605.1,1821.0,-642.3,1864.2,-642.3,1864.2,-661.8,1895.4,-661.8,1895.4,-681.4,1925.8,-661.8,1895.4,-634.2,1884.3,-634.2,1884.3,-605.3,1882.1,-605.3,1882.1,-558.2,1880.0,-558.2,1880.0,-514.0,1885.9,-514.0,1885.9,-471.5,1900.2];
  // the gates: [x, z, angle (along the gate, radians: x east, z south), ...]
  const GATE = [170.6,304.9,4.309,125.5,31.3,-1.403,-236.8,-13.9,4.112,-958.6,1861.4,3.27,-973.7,1859.5,1.885,-935.7,1298.9,0.723,-997.9,1680.6,1.221,-317.5,1903.9,2.818,-653.5,1040.4,4.419,-807.0,1138.3,3.772,-951.9,1760.4,3.378,-335.0,1919.3,2.523,-751.9,1044.5,2.486,-425.8,1873.8,-0.501,-417.2,1901.6,-0.23,-247.6,1976.8,2.225,-110.9,2027.8,0.544,-107.9,2016.5,0.266,-472.3,1149.3,-0.863,-212.2,30.6,-1.403,-214.1,124.1,0.175];
  // the picnic shelter and the gazebos: their outlines
  const SHEL = [
    [-958.7,1698.2,-952.8,1697.3,-951.5,1703.3,-957.6,1704.4,-958.7,1698.2],
    [196.3,76.3,197.9,79.3,199.7,78.4,198.0,75.3,196.3,76.3]
  ];

  // each class: its lane's width and its sealed edge each side, its width with no lanes tag (assumed), its colour over the asphalt's
  // picture (the tertiary road darker and even, the small roads paler, the gravel and dirt red-brown: the hill's soil)
  const CL = [[3.5, 0.5, 8, [0.8, 0.8, 0.83]], [0, 0, 7, [0.86, 0.86, 0.88]], [0, 0, 5, [0.9, 0.9, 0.9]], [0, 0, 3.5, [0.95, 0.94, 0.93]],
    [0, 0, 5, [1, 1, 1]], [0, 0, 3, [1.5, 1.16, 0.9]], [0, 0, 3.5, [1.45, 1.13, 0.9]]];
  const wide = (W) => { const [lw, e, w0] = CL[W[0]]; return W[1] ? W[1] * lw + 2 * e : w0; };
  const segD = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1))); return Math.hypot(px - ax - dx * t, pz - az - dz * t); };
  const PK = [1.02, 1.02, 1.04], POLE = [0.62, 0.64, 0.66], PLATE = [0.94, 0.94, 0.92], SEAT = [0.6, 0.46, 0.32], BIN = [0.42, 0.45, 0.48];
  // smooth patches (value noise on a 9 m lattice, from the place alone: the same every time, no draw from the world's random numbers)
  const hash = (i, j) => { let h = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const patch = (x, z) => {
    const u = x / 9, v = z / 9, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv);
    const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const tone = (c, x, z) => { const f = 0.95 + 0.08 * patch(x + 500, z); return [c[0] * f, c[1] * f, c[2] * f]; };

  const base = LK.extra, lotOk = LK.lotOk;
  LK.extra = function (o) { const mine = lay(o); const st = (base && base(o)) || {}; st.roadside = mine; return st; };
  // the town's houses (js/world-rbring.js lays them before this scenery) keep off these roads: none whose 16 m square (11 m to its
  // corners) would reach the asphalt
  LK.lotOk = (x, z) => { if (lotOk && !lotOk(x, z)) return false; for (const W of WAYS) { const m = wide(W) / 2 + 11; for (let q = 2; q + 3 < W.length; q += 2) if (segD(x, z, W[q], W[q + 1], W[q + 2], W[q + 3]) < m) return false; } return true; };

  function lay(o) {
    const { root, scen, exclPush, CR, tex } = o, { RB, nrGround, nrNear, box } = A, cyl = A.cyl;
    const st = { ways: 0, wayM: 0, narrowed: 0, split: 0, parkCells: 0, meshes: 0, spans: 0, poles: 0, fences: 0, posts: 0, gates: 0, shelters: 0 };
    const past = (x, z, m) => { const n = nrNear(x, z); return n.i < 0 || n.dd >= m; };
    const near = (x, z, m) => { const n = nrNear(x, z); return n.i >= 0 && n.dd < m; };
    // what is laid on the ground goes into a mesh per 600 m square (few draw calls), so three.js leaves out of the frame what is out of view
    const TILE = 600, tiles = new Map();
    const rbAt = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tiles.get(key); if (!t) tiles.set(key, t = new RB(true)); return t; };

    // the roads: rows of two across (the left and the right edge), every 2.5 m along, on the ground; cut where they run inside the barriers;
    // a stretch goes into the tile of the row it ends at (the row before it copied there when the tile or the mesh changes). Within FADE m
    // of a cut or of a free end (one that meets no other road drawn here: a road at an underpass, the edge of the data) the asphalt fades
    // out: those stretches go into a see-through mesh per tile, so no road stops with a hard edge in the grass
    const FADE = 20, tilesF = new Map();
    const rbFade = (x, z) => { const key = Math.floor(x / TILE) + ',' + Math.floor(z / TILE); let t = tilesF.get(key); if (!t) tilesF.set(key, t = new RB(true, true)); return t; };
    const joined = (W, x, z) => {   // the parking aisles end in the car park; any other end must meet another way
      if (W[0] === 4) return true;
      for (const V of WAYS) if (V !== W) for (let q = 2; q + 3 < V.length; q += 2) if (segD(x, z, V[q], V[q + 1], V[q + 2], V[q + 3]) < 1.5) return true;
      return false;
    };
    // at an end, the width of the roads of its class that end there too, together (0: none): where a road meets narrower ones end to end
    // (the main street where OSM gives it fewer lanes) it narrows to that over up to 30 m (half of it)
    const endW = (W, x, z) => { let w = 0; for (const V of WAYS) if (V !== W && V[0] === W[0]) for (const q of [2, V.length - 2]) if (Math.hypot(V[q] - x, V[q + 1] - z) < 0.5) w += wide(V); return w; };
    // at an end where a road splits in two narrower ones of its class (OSM starts both at one point; none in
    // today's data here, kept for a later OSM edit): the other one, how far apart their lines must be to
    // lie side by side over the wider one's end, and which way across (along the rows' normal) this one keeps clear of the other (null:
    // no split there). They keep that far apart until OSM's lines are, then follow them: the island opens where they part
    const split = (W, atEnd) => {
      const q = atEnd ? W.length - 2 : 2, x = W[q], z = W[q + 1], at = [];
      for (const V of WAYS) if (V[0] === W[0]) for (const p of [2, V.length - 2]) if (Math.hypot(V[p] - x, V[p + 1] - z) < 0.5) {
        const r = p === 2 ? 4 : V.length - 4, ux = V[r] - x, uz = V[r + 1] - z, l = Math.hypot(ux, uz) || 1;
        at.push({ V, w: wide(V), ux: ux / l, uz: uz / l });
      }
      const B = at.reduce((b, a) => (a.w > b.w ? a : b), at[0]), sib = at.filter(a => a.w < B.w - 0.2), me = sib.find(a => a.V === W);
      if (!me || sib.length !== 2) return null;
      const Q = sib[sib[0] === me ? 1 : 0], lx = B.uz, lz = -B.ux, dx = atEnd ? -me.ux : me.ux, dz = atEnd ? -me.uz : me.uz, two = me.w + Q.w;
      const sg = (me.ux * lx + me.uz * lz > Q.ux * lx + Q.uz * lz ? 1 : -1) * Math.sign(-dz * lx + dx * lz || 1);
      return { Q: Q.V, d: Math.min(B.w, two) - two / 2 - 0.3, sg };   // (0.3: a little overlap, no seam of grass between them)
    };
    for (const W of WAYS) {
      const col = CL[W[0]][3], w = wide(W), U = 3, pts = [], ok = [], s = [];
      for (let q = 2; q + 3 < W.length; q += 2) {
        const ax = W[q], az = W[q + 1], bx = W[q + 2], bz = W[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.ceil(L / 2.5));
        for (let t = q > 2 ? 1 : 0; t <= m; t++) pts.push(ax + (bx - ax) * t / m, az + (bz - az) * t / m);
      }
      const n = pts.length / 2, cut = new Float64Array(n), hw = new Float64Array(n);
      for (let k = 0; k < n; k++) s.push(k ? s[k - 1] + Math.hypot(pts[2 * k] - pts[2 * k - 2], pts[2 * k + 1] - pts[2 * k - 1]) : 0);
      const S = s[n - 1], LT = Math.min(30, S / 2), e0 = endW(W, W[2], W[3]), e1 = endW(W, W[W.length - 2], W[W.length - 1]);
      const w0 = e0 && e0 < w - 0.2 ? e0 : w, w1 = e1 && e1 < w - 0.2 ? e1 : w;
      const P0 = pts.slice();   // (moved across along the line's normal, as the rows below are laid)
      for (const [o, back] of [[split(W, false), false], [split(W, true), true]]) if (o) {
        for (let i = 0; i < n; i++) {
          const k = back ? n - 1 - i : i, x = P0[2 * k], z = P0[2 * k + 1]; let D = 1e9;
          for (let q = 2; q + 3 < o.Q.length; q += 2) D = Math.min(D, segD(x, z, o.Q[q], o.Q[q + 1], o.Q[q + 2], o.Q[q + 3]));
          if (D >= o.d || i > n / 2) break;
          const k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), dx = P0[2 * k1] - P0[2 * k0], dz = P0[2 * k1 + 1] - P0[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1;
          const f = o.sg * (o.d - D) / 2; pts[2 * k] -= dz / dl * f; pts[2 * k + 1] += dx / dl * f;
        }
        st.split++;
      }
      if (w0 < w || w1 < w) st.narrowed++;
      for (let k = 0; k < n; k++) {
        hw[k] = Math.min(w0 + (w - w0) * Math.min(1, s[k] / LT), w1 + (w - w1) * Math.min(1, (S - s[k]) / LT)) / 2;
        ok.push(past(pts[2 * k], pts[2 * k + 1], hw[k] + 1.2));
      }
      let c0 = joined(W, W[2], W[3]) ? -1e9 : 0;   // the distance along to the nearest cut or free end: one pass forwards, one back
      for (let k = 0; k < n; k++) { if (!ok[k]) c0 = s[k]; cut[k] = s[k] - c0; }
      c0 = joined(W, W[W.length - 2], W[W.length - 1]) ? 1e9 : s[n - 1];
      for (let k = n - 1; k >= 0; k--) { if (!ok[k]) c0 = s[k]; cut[k] = Math.min(cut[k], c0 - s[k]); }
      let prev = null;
      for (let k = 0; k < n; k++) {
        if (!ok[k]) { prev = null; continue; }
        const x = pts[2 * k], z = pts[2 * k + 1], k0 = Math.max(0, k - 1), k1 = Math.min(n - 1, k + 1), h = hw[k];
        const dx = pts[2 * k1] - pts[2 * k0], dz = pts[2 * k1 + 1] - pts[2 * k0 + 1], dl = Math.hypot(dx, dz) || 1, nx = -dz / dl, nz = dx / dl;
        const row = [-h, h].map(f => [x + nx * f, nrGround(x + nx * f, z + nz * f) + 0.1, z + nz * f]);
        const t = Math.min(1, cut[k] / FADE), a = t * t * (3 - 2 * t), c = tone(col, x, z), c4 = [c[0], c[1], c[2], a];
        const cur = { row, cols: [c4, c4], uvs: [[-h / U, s[k] / U], [h / U, s[k] / U]], a, s: s[k], rb: null, i: -1 };
        if (prev) {
          const rb = prev.a < 1 || a < 1 ? rbFade(x, z) : rbAt(x, z), pi = prev.rb === rb ? prev.i : rb.row(prev.row, prev.cols, prev.uvs);
          cur.rb = rb; cur.i = rb.row(row, cur.cols, cur.uvs); rb.link(pi, cur.i, 0, 1); st.wayM += cur.s - prev.s;
        } else st.ways++;
        prev = cur; exclPush(x, z, h + 1);
        if (k % 2 === 0 && near(x, z, 45)) CR.avoid(x, z, h + 0.4);
      }
    }

    // the car park: laid on the ground in 4 m cells (whole ones share their corners within a tile; the edge ones cut to the outline,
    // Sutherland-Hodgman, and triangulated), each in the tile of its centre; none inside the barriers
    const area = (P) => { let s = 0; for (let k = 0; k < P.length; k += 2) { const j = (k + 2) % P.length; s += P[k] * P[j + 1] - P[j] * P[k + 1]; } return s / 2; };
    const clip = (Q, x0, z0, x1, z1) => {
      let P = Q;
      for (const [ax, c, s] of [[0, x0, 1], [0, x1, -1], [1, z0, 1], [1, z1, -1]]) {
        const R = [], n = P.length / 2;
        for (let k = 0; k < n; k++) {
          const j = (k + 1) % n, px = P[2 * k], pz = P[2 * k + 1], qx = P[2 * j], qz = P[2 * j + 1];
          const pv = ((ax ? pz : px) - c) * s, qv = ((ax ? qz : qx) - c) * s;
          if (pv >= 0) R.push(px, pz);
          if ((pv >= 0) !== (qv >= 0)) { const t = pv / (pv - qv); R.push(px + (qx - px) * t, pz + (qz - pz) * t); }
        }
        if (R.length < 6) return null; P = R;
      }
      return P;
    };
    const C = 4, U = 3, vtx = (rb, x, z) => rb.row([[x, nrGround(x, z) + 0.08, z]], [tone(PK, x, z)], [[x / U, z / U]]);
    for (const Q of PARK) {
      let x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      for (let k = 0; k < Q.length; k += 2) { x0 = Math.min(x0, Q[k]); x1 = Math.max(x1, Q[k]); z0 = Math.min(z0, Q[k + 1]); z1 = Math.max(z1, Q[k + 1]); }
      const V = new Map(), cor = (rb, i, j) => { let M = V.get(rb); if (!M) V.set(rb, M = new Map()); const key = i * 100003 + j; let v = M.get(key); if (v === undefined) M.set(key, v = vtx(rb, i * C, j * C)); return v; };
      for (let j = Math.floor(z0 / C); j <= Math.floor(z1 / C); j++) for (let i = Math.floor(x0 / C); i <= Math.floor(x1 / C); i++) {
        const P = clip(Q, i * C, j * C, (i + 1) * C, (j + 1) * C); if (!P) continue;
        let cx = 0, cz = 0; for (let k = 0; k < P.length; k += 2) { cx += P[k]; cz += P[k + 1]; } cx /= P.length / 2; cz /= P.length / 2;
        if (!past(cx, cz, 1.5)) continue;
        const rb = rbAt(cx, cz);
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
        exclPush(cx, cz, 3); st.parkCells++;
      }
    }

    // the power line: three wires a span (cables=3) from the cross-arm's two ends and the pin on top of the pole, each sagging 1.5 % of
    // the span (assumed) in six straight pieces; a pole at each end of a span (once), its arm across the line (across both spans' mean
    // where it carries two)
    const ouRod = A.ouRod, poles = new Map(), WOOD = [0.56, 0.48, 0.39], ARM = [0.5, 0.43, 0.35], WIRE = [0.32, 0.32, 0.34];
    const GALV = [0.8, 0.82, 0.84], ROOF = [0.84, 0.86, 0.87], PH = 10, AW = 1.1;
    for (let s = 0; s + 3 < SPAN.length; s += 4) {
      const x0 = SPAN[s], z0 = SPAN[s + 1], x1 = SPAN[s + 2], z1 = SPAN[s + 3], L = Math.hypot(x1 - x0, z1 - z0); if (L < 2) continue;
      const ux = (x1 - x0) / L, uz = (z1 - z0) / L;
      for (const [x, z] of [[x0, z0], [x1, z1]]) { const k = x + ',' + z, p = poles.get(k); if (p) { p.ux += ux; p.uz += uz; } else poles.set(k, { x, z, ux, uz }); }
    }
    const armAt = (x, z) => { const p = poles.get(x + ',' + z), l = Math.hypot(p.ux, p.uz) || 1; return [-p.uz / l, p.ux / l]; };
    for (let s = 0; s + 3 < SPAN.length && ouRod; s += 4) {
      const x0 = SPAN[s], z0 = SPAN[s + 1], x1 = SPAN[s + 2], z1 = SPAN[s + 3], L = Math.hypot(x1 - x0, z1 - z0); if (L < 2) continue;
      const a0 = armAt(x0, z0), a1 = armAt(x1, z1), y0 = nrGround(x0, z0) + PH - 0.6, y1 = nrGround(x1, z1) + PH - 0.6, sag = 0.015 * L;
      for (const [f, up] of [[-AW + 0.1, 0], [AW - 0.1, 0], [0, 0.6]]) {
        const P = (t) => [x0 + (x1 - x0) * t + (a0[0] + (a1[0] - a0[0]) * t) * f, y0 + (y1 - y0) * t + up - 4 * sag * t * (1 - t), z0 + (z1 - z0) * t + (a0[1] + (a1[1] - a0[1]) * t) * f];
        for (let k = 0; k < 6; k++) { const p = P(k / 6), q = P((k + 1) / 6); ouRod(scen.get((p[0] + q[0]) / 2, (p[2] + q[2]) / 2), p, q, 0.012, WIRE, 3); }
      }
      st.spans++;
    }
    for (const p of poles.values()) {
      const [ax, az] = armAt(p.x, p.z), g = scen.get(p.x, p.z), y = nrGround(p.x, p.z) - 0.3;
      cyl(g, p.x, y, p.z, 0.13, PH + 0.3, 7, WOOD, WOOD);
      box(g, p.x, y + PH - 0.6, p.z, 2 * AW, 0.1, 0.1, Math.atan2(az, ax), ARM, ARM);
      cyl(g, p.x, y + PH + 0.3, p.z, 0.03, 0.3, 4, GALV, GALV);
      exclPush(p.x, p.z, 1.2); CR.avoid(p.x, p.z, 1); st.poles++;
    }

    // the fences: timber posts every 4 m (and at every bend), three plain wires between them (at 0.4, 0.7 and 1.0 m), cut where they
    // come inside the barriers; the gates: two posts and a closed tube gate between them, across the road or along the fence it is on
    for (const F of FENCE) {
      for (let q = 0; q + 3 < F.length; q += 2) {
        const ax = F[q], az = F[q + 1], bx = F[q + 2], bz = F[q + 3], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.round(L / 4));
        let prev = null;
        for (let k = 0; k <= m; k++) {
          const x = ax + (bx - ax) * k / m, z = az + (bz - az) * k / m;
          if (!past(x, z, 2.5)) { prev = null; continue; }
          const g = scen.get(x, z), y = nrGround(x, z);
          if (k < m || q + 4 >= F.length) { cyl(g, x, y - 0.2, z, 0.06, 1.35, 5, WOOD, WOOD); st.posts++; }
          if (prev && ouRod) for (const h of [0.4, 0.7, 1.0]) ouRod(g, [prev[0], prev[1] + h, prev[2]], [x, y + h, z], 0.008, WIRE, 3);
          prev = [x, y, z]; exclPush(x, z, 0.8);
        }
      }
      st.fences++;
    }
    for (let s = 0; s + 2 < GATE.length; s += 3) {
      const x = GATE[s], z = GATE[s + 1], a = GATE[s + 2], ux = Math.cos(a), uz = Math.sin(a), W = 3.6; if (!past(x, z, 3)) continue;
      const g = scen.get(x, z), y = nrGround(x, z);
      for (const f of [-W / 2 - 0.1, W / 2 + 0.1]) cyl(g, x + ux * f, y - 0.3, z + uz * f, 0.08, 1.65, 6, WOOD, WOOD);
      for (const h of [0.25, 0.6, 0.95, 1.2]) box(g, x, y + h, z, W, 0.045, 0.045, a, GALV, GALV);
      for (const f of [-W / 2 + 0.05, 0, W / 2 - 0.05]) box(g, x + ux * f, y + 0.25, z + uz * f, 0.045, 1.0, 0.045, a, GALV, GALV);
      exclPush(x, z, W / 2 + 0.5); CR.avoid(x, z, W / 2); st.gates++;
    }
    // the picnic shelter and the gazebos: a post at each corner of OSM's outline, a flat sheet iron roof over it at 2.4 m (assumed)
    for (const S of SHEL) {
      let cx = 0, cz = 0, n = 0, y = 1e9; for (let k = 0; k + 1 < S.length; k += 2) { cx += S[k]; cz += S[k + 1]; n++; y = Math.min(y, nrGround(S[k], S[k + 1])); }
      cx /= n; cz /= n; if (!past(cx, cz, 4)) continue;
      const g = scen.get(cx, cz); let r = 0;
      for (let k = 0; k + 1 < S.length; k += 2) { cyl(g, S[k], y - 0.2, S[k + 1], 0.06, 2.6, 6, GALV, GALV); r = Math.max(r, Math.hypot(S[k] - cx, S[k + 1] - cz)); }
      const ang = Math.atan2(S[3] - S[1], S[2] - S[0]), w = Math.hypot(S[2] - S[0], S[3] - S[1]), d = Math.hypot(S[4] - S[2], S[5] - S[3]);
      box(g, cx, y + 2.45, cz, w + 0.5, 0.08, d + 0.5, ang, ROOF, ROOF);
      exclPush(cx, cz, r + 1); CR.avoid(cx, cz, r + 0.5); st.shelters++;
    }

    const opt = { map: tex.asphalt, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 };
    const mat = new THREE.MeshLambertMaterial(opt), matF = new THREE.MeshLambertMaterial(Object.assign({ transparent: true, depthWrite: false }, opt));
    for (const [T, M] of [[tiles, mat], [tilesF, matF]]) for (const rb of T.values()) {
      if (rb.empty) continue;
      const m = new THREE.Mesh(rb.geometry(), M); m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); m.name = 'roadside-asphalt'; root.add(m); st.meshes++;
    }
    st.wayM = Math.round(st.wayM);
    return st;
  }
})();

