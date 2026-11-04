// (sketch) soft cloud shadows: the sun's light dimmed under drifting clouds, in every shadow-receiving material (index.html?cloud=K)
(function () { const m = /cloud=([\d.]+)/.exec(location.search); if (!m || typeof THREE === 'undefined') return; const K = (+m[1]).toFixed(2), S = (+(/cloudS=([\d.]+)/.exec(location.search) || [0, '2.4'])[1]).toFixed(2);
  const sig = 'float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {';
  THREE.ShaderChunk.shadowmap_pars_fragment = THREE.ShaderChunk.shadowmap_pars_fragment.replace(sig, `float impH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float impN(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(impH(i), impH(i + vec2(1.0, 0.0)), f.x), mix(impH(i + vec2(0.0, 1.0)), impH(i + vec2(1.0, 1.0)), f.x), f.y); }
float impCloud(vec2 p) { float n = impN(p) * 0.55 + impN(p * 2.1 + 3.7) * 0.3 + impN(p * 4.3 + 9.1) * 0.15; return 1.0 - ${K} * smoothstep(0.4, 0.62, n); }
float getShadow0( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord );
float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) { return getShadow0(shadowMap, shadowMapSize, shadowBias, shadowRadius, shadowCoord) * impCloud(shadowCoord.xy * ${S}); }
float getShadow0( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {`);
})();
