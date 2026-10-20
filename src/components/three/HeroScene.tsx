"use client";
/* eslint-disable react-hooks/immutability -- R3F: los uniforms, texturas y la cámara se mutan imperativamente dentro de useFrame. */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, RoundedBox, Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { AD_H, AD_W, paintLoop } from "@/lib/adPainter";
import { createLedMaterial } from "./LedMaterial";

// PRNG determinístico (mulberry32) para que la escena sea estable entre renders.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Props = { progress: MutableRefObject<number>; brand: MutableRefObject<string> };

function useAdTexture(brand: MutableRefObject<string>, period = 3.2) {
  const { canvas, ctx, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = AD_W;
    canvas.height = AD_H;
    const ctx = canvas.getContext("2d")!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    return { canvas, ctx, tex };
  }, []);
  const t0 = useRef(0);
  useFrame((_, dt) => {
    t0.current += dt;
    paintLoop(ctx, t0.current, period, brand.current || undefined);
    tex.needsUpdate = true;
  });
  useEffect(() => () => tex.dispose(), [tex, canvas]);
  return tex;
}

function LedScreen({
  w,
  h,
  brand,
  position,
  res,
}: {
  w: number;
  h: number;
  brand: MutableRefObject<string>;
  position: [number, number, number];
  res?: THREE.Vector2;
}) {
  const tex = useAdTexture(brand);
  const mat = useMemo(() => createLedMaterial(tex, res), [tex, res]);
  const boot = useRef(0);
  useFrame((s, dt) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    boot.current = Math.min(1.2, boot.current + dt * 0.45);
    mat.uniforms.uOn.value = boot.current;
  });
  return (
    <mesh position={position} material={mat}>
      <planeGeometry args={[w, h]} />
    </mesh>
  );
}

function LineSign({ position }: { position: [number, number, number] }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 96;
    c.height = 32;
    const x = c.getContext("2d")!;
    x.fillStyle = "#000";
    x.fillRect(0, 0, 96, 32);
    x.font = "800 26px 'Space Grotesk', sans-serif";
    x.fillStyle = "#ffb627";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("102", 48, 17);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  const mat = useMemo(() => {
    const m = createLedMaterial(tex, new THREE.Vector2(48, 16));
    m.uniforms.uBright.value = 2;
    return m;
  }, [tex]);
  useFrame((s) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <mesh position={position} material={mat}>
      <planeGeometry args={[0.6, 0.2]} />
    </mesh>
  );
}

function Bus({ brand }: { brand: MutableRefObject<string> }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current) return;
    const t = s.clock.elapsedTime;
    g.current.position.y = Math.sin(t * 2.2) * 0.008 + Math.sin(t * 5.3) * 0.004;
    g.current.rotation.z = Math.sin(t * 1.3) * 0.004;
  });
  const W = 2.55;
  const H = 3.05;
  const D = 9;
  const z0 = 0; // cara trasera
  return (
    <group ref={g}>
      {/* carrocería */}
      <RoundedBox args={[W, H, D]} radius={0.14} smoothness={4} position={[0, H / 2 + 0.32, -D / 2]}>
        <meshPhysicalMaterial color="#161616" metalness={0.6} roughness={0.32} clearcoat={1} clearcoatRoughness={0.15} />
      </RoundedBox>
      {/* franja de marca */}
      <mesh position={[0, 1.02, z0 + 0.012]}>
        <planeGeometry args={[W - 0.12, 0.05]} />
        <meshBasicMaterial color="#2ee6f5" toneMapped={false} />
      </mesh>
      {/* vidrio luneta */}
      <RoundedBox args={[W - 0.3, 1.05, 0.04]} radius={0.06} position={[0, 2.55, z0 + 0.005]}>
        <meshPhysicalMaterial color="#020308" metalness={0.2} roughness={0.05} transmission={0} clearcoat={1} />
      </RoundedBox>
      {/* pantalla LED 1,60 × 0,64 m */}
      <mesh position={[0, 2.55, z0 + 0.03]}>
        <planeGeometry args={[1.72, 0.76]} />
        <meshStandardMaterial color="#05060b" roughness={0.6} />
      </mesh>
      <LedScreen w={1.6} h={0.64} brand={brand} position={[0, 2.55, z0 + 0.034]} />
      {/* cartel de línea */}
      <LineSign position={[0, 3.18, z0 + 0.02]} />
      {/* luces traseras */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 - 0.16), 1.55, z0 + 0.02]}>
          <mesh>
            <planeGeometry args={[0.13, 0.95]} />
            <meshBasicMaterial color={[4, 0.15, 0.1]} toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <planeGeometry args={[0.13, 0.26]} />
            <meshBasicMaterial color={[3.5, 1.4, 0.1]} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* rejilla motor */}
      {Array.from({ length: 7 }).map((_, i) => (
        <mesh key={i} position={[0, 1.6 - i * 0.075, z0 + 0.01]}>
          <boxGeometry args={[1.5, 0.025, 0.02]} />
          <meshStandardMaterial color="#1a1f36" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      {/* paragolpes */}
      <RoundedBox args={[W + 0.04, 0.32, 0.22]} radius={0.06} position={[0, 0.5, z0 + 0.02]}>
        <meshStandardMaterial color="#07080f" metalness={0.4} roughness={0.5} />
      </RoundedBox>
      {/* chapa patente */}
      <mesh position={[0, 0.92, z0 + 0.015]}>
        <planeGeometry args={[0.52, 0.16]} />
        <meshStandardMaterial color="#e9edf5" roughness={0.6} />
      </mesh>
      {/* ruedas */}
      {[-1, 1].map((s) =>
        [-1.6, -6.9].map((z) => (
          <mesh key={`${s}${z}`} position={[s * (W / 2 - 0.05), 0.5, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.5, 0.5, 0.3, 32]} />
            <meshStandardMaterial color="#040406" roughness={0.9} />
          </mesh>
        )),
      )}
      {/* luz bajo el colectivo */}
      <pointLight position={[0, 0.6, 0.8]} color="#ff2a20" intensity={3} distance={6} />
      <pointLight position={[0, 2.5, 1.2]} color="#3f7bff" intensity={6} distance={7} />
    </group>
  );
}

function Streaks() {
  const count = 70;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const random = rng(7);
    return Array.from({ length: count }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * (3 + random() * 9),
        y: 0.25 + random() * 1.2,
        z: -random() * 120,
        s: 14 + random() * 24,
        l: 1 + random() * 4,
        red: i % 3 === 0,
      }));
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => {
    const arr = new Float32Array(count * 3);
    data.forEach((d, i) => {
      const c = d.red ? new THREE.Color(5, 0.3, 0.2) : new THREE.Color(0.6, 1.8, 3.2);
      c.toArray(arr, i * 3);
    });
    return arr;
  }, [data]);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    data.forEach((d, i) => {
      d.z += d.s * dt * (d.red ? -0.4 : 1);
      if (d.z > 12) d.z = -120;
      if (d.z < -120) d.z = 12;
      dummy.position.set(d.x, d.y, d.z);
      dummy.scale.set(0.04, 0.04, d.l);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </instancedMesh>
  );
}

function CityBokeh() {
  const pts = useMemo(() => {
    const random = rng(42);
    const n = 900;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const palette = [new THREE.Color("#2ee6f5"), new THREE.Color("#2b3cff"), new THREE.Color("#ffb46b"), new THREE.Color("#ffffff")];
    for (let i = 0; i < n; i++) {
      const side = random() < 0.5 ? -1 : 1;
      pos[i * 3] = side * (8 + random() * 30);
      pos[i * 3 + 1] = random() * 22;
      pos[i * 3 + 2] = -10 - random() * 110;
      palette[i % 4].toArray(col, i * 3);
    }
    return { pos, col };
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pts.pos, 3]} />
        <bufferAttribute attach="attributes-color" args={[pts.col, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.16} vertexColors transparent opacity={0.85} sizeAttenuation toneMapped={false} />
    </points>
  );
}

function Road() {
  const dash = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!dash.current) return;
    dash.current.position.z = (dash.current.position.z + dt * 9) % 6;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]}>
        <planeGeometry args={[80, 140]} />
        <MeshReflectorMaterial
          mirror={0.6}
          blur={[400, 120]}
          resolution={1024}
          mixBlur={6}
          mixStrength={14}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#1d1d1d"
          metalness={0.6}
          roughness={0.85}
        />
      </mesh>
      <group ref={dash}>
        {Array.from({ length: 24 }).map((_, i) =>
          [-2.2, 2.2].map((x) => (
            <mesh key={`${i}${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.005, 8 - i * 6]}>
              <planeGeometry args={[0.12, 2.4]} />
              <meshBasicMaterial color="#555555" />
            </mesh>
          )),
        )}
      </group>
    </group>
  );
}

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state, dt) => {
    const aspect = state.size.width / state.size.height;
    const portrait = aspect < 1;
    // en pantallas anchas el colectivo se corre a la derecha para dejar lugar al titular;
    // en vertical se aleja y sube al tercio superior
    const shift = aspect > 1.2 ? 1 : 0.15;
    const p = progress.current;
    const e = p * p * (3 - 2 * p);
    const x = THREE.MathUtils.lerp(portrait ? 0.4 : 1.2, 0, e) + pointer.x * 0.6 * (1 - e);
    const y = THREE.MathUtils.lerp(portrait ? 1.2 : 1.9, 2.55, e) + pointer.y * 0.25 * (1 - e);
    const z = THREE.MathUtils.lerp(portrait ? 17 : 7.6, portrait ? 2.2 : 1.15, e);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 4, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 4, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 4, dt);
    target.set(THREE.MathUtils.lerp(-2.4 * shift, 0, e), THREE.MathUtils.lerp(portrait ? -0.6 : 2.1, 2.55, e), 0);
    camera.lookAt(target);
  });
  return null;
}

export default function HeroScene({ progress, brand }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ position: [2.8, 1.9, 7.6], fov: 38, near: 0.1, far: 200 }}
    >
      <color attach="background" args={["#232323"]} />
      <fog attach="fog" args={["#232323", 18, 90]} />
      <ambientLight intensity={0.15} />
      <spotLight position={[6, 9, 6]} angle={0.5} penumbra={1} intensity={60} color="#8fb4ff" />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} color="#2b3cff" position={[-6, 4, 2]} scale={[2, 8, 1]} />
        <Lightformer form="rect" intensity={4} color="#2ee6f5" position={[6, 4, -2]} scale={[2, 8, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffffff" position={[0, 8, 4]} scale={[10, 1, 1]} />
      </Environment>
      <Bus brand={brand} />
      <Road />
      <Streaks />
      <CityBokeh />
      <Rig progress={progress} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.85} luminanceSmoothing={0.2} radius={0.75} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0004)} />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
