import * as THREE from "three";

// Shader de matriz LED: cuantiza la textura en celdas y dibuja cada píxel como un diodo redondo.
export function createLedMaterial(map: THREE.Texture, res = new THREE.Vector2(200, 80)) {
  return new THREE.ShaderMaterial({
    toneMapped: false,
    uniforms: {
      uMap: { value: map },
      uRes: { value: res },
      uTime: { value: 0 },
      uBright: { value: 2.4 },
      uOn: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec2 uRes;
      uniform float uTime;
      uniform float uBright;
      uniform float uOn;
      varying vec2 vUv;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main() {
        vec2 cell = vUv * uRes;
        vec2 id = floor(cell);
        vec2 f = fract(cell) - 0.5;
        vec3 c = texture2D(uMap, (id + 0.5) / uRes).rgb;
        float d = length(f);
        float diode = smoothstep(0.48, 0.18, d);
        float halo = smoothstep(0.75, 0.0, d) * 0.35;
        // encendido progresivo por filas + leve parpadeo
        float boot = step(hash(id) * 0.6 + vUv.y * 0.4, uOn);
        float flick = 0.94 + 0.06 * sin(uTime * 40.0 + id.y * 0.7);
        vec3 col = c * (diode + halo) * uBright * flick * boot;
        // base apagada de los diodos
        col += vec3(0.012, 0.016, 0.03) * diode;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}
