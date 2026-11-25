const { SNAP, load } = require('./lib.js');
const { C } = load(SNAP);
console.log('KV_IDS', C.KV_IDS, 'TX', JSON.stringify(C.TX));
console.log('KV.real', JSON.stringify(C.KV.real));
console.log('models', C.MODELS.length, C.MODELS.map(m => m.id + ':' + m.mass + ':' + m.len + 'x' + m.wid).join(' '));
