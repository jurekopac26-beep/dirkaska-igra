import fs from 'fs';
// (pictures only) 27. 10., the user: "Naredi celo novo mapo v 15 slikah od zgoraj" - the whole map (x -370..370, z -410..330) in 15 equal parts, 3 across
// and 5 down (each ~247 x 148 m, 1500 x 900, a little overlap), and the whole map once for the index (map15)
export default { tag: 'map15', list: [
  { viewport: [1200, 1200] }, { kind: 'top', name: 'M00', cx: 0, cz: -40, span: 740 },
  { viewport: [1500, 900] },
  { kind: 'top', name: 'T01', cx: -246.67, cz: -336.00, span: 152 },
  { kind: 'top', name: 'T02', cx: 0.00, cz: -336.00, span: 152 },
  { kind: 'top', name: 'T03', cx: 246.67, cz: -336.00, span: 152 },
  { kind: 'top', name: 'T04', cx: -246.67, cz: -188.00, span: 152 },
  { kind: 'top', name: 'T05', cx: 0.00, cz: -188.00, span: 152 },
  { kind: 'top', name: 'T06', cx: 246.67, cz: -188.00, span: 152 },
  { kind: 'top', name: 'T07', cx: -246.67, cz: -40.00, span: 152 },
  { kind: 'top', name: 'T08', cx: 0.00, cz: -40.00, span: 152 },
  { kind: 'top', name: 'T09', cx: 246.67, cz: -40.00, span: 152 },
  { kind: 'top', name: 'T10', cx: -246.67, cz: 108.00, span: 152 },
  { kind: 'top', name: 'T11', cx: 0.00, cz: 108.00, span: 152 },
  { kind: 'top', name: 'T12', cx: 246.67, cz: 108.00, span: 152 },
  { kind: 'top', name: 'T13', cx: -246.67, cz: 256.00, span: 152 },
  { kind: 'top', name: 'T14', cx: 0.00, cz: 256.00, span: 152 },
  { kind: 'top', name: 'T15', cx: 246.67, cz: 256.00, span: 152 },
] };
