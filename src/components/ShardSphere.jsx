import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   SHARD SPHERE
   ───────────────────────────────────────────────────────────────────────────
   A sphere built out of ~320 solid triangular panels. A single `progress`
   value (0 = fully assembled, 1 = fully dismantled) drives everything on the
   GPU: each panel spins around its own axis and flies outward along its
   normal, staggered so the shell peels apart instead of popping.

   Nothing here is wireframe — panels are solid, flat-shaded neon with a rim
   term so edges catch light as they tumble.
   ═══════════════════════════════════════════════════════════════════════════ */

const NEON = [
  new THREE.Color('#a3b2ff'), // periwinkle
  new THREE.Color('#7affcf'), // mint
  new THREE.Color('#bc7aff'), // violet
  new THREE.Color('#7fd4f5'), // sky  (from the club logo)
  new THREE.Color('#ffd65c'), // bulb (from the club logo)
];

const VERT = /* glsl */ `
  attribute vec3 aCentroid;
  attribute vec3 aRand;
  attribute vec3 aColor;

  uniform float uProgress;
  uniform float uTime;

  varying vec3 vColor;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vBurst;

  // Rodrigues' rotation
  vec3 rotateAxis(vec3 v, vec3 axis, float a) {
    float c = cos(a);
    return v * c + cross(axis, v) * sin(a) + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    // Stagger: panels release at slightly different moments (aRand.z)
    float t = clamp((uProgress - aRand.z * 0.38) / 0.62, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);          // smoothstep easing

    vec3 axis   = normalize(aRand * 2.0 - 1.0 + vec3(0.0001));
    vec3 outDir = normalize(aCentroid);

    // Spin the panel about its own centroid
    vec3 local = position - aCentroid;
    local  = rotateAxis(local, axis, e * 6.2831853 * (0.35 + aRand.x * 1.1));
    vec3 nrm = rotateAxis(normal, axis, e * 6.2831853 * (0.35 + aRand.x * 1.1));

    // Fly outward, with a little tangential drift so it swirls apart
    vec3 offset  = outDir * (e * (1.15 + aRand.y * 2.7));
    offset      += cross(outDir, axis) * (e * aRand.x * 0.85);

    // Idle breathing while assembled
    offset += outDir * sin(uTime * 1.15 + aRand.z * 6.2831853) * 0.022 * (1.0 - e);

    vec3 pos = aCentroid + local + offset;

    vColor    = aColor;
    vBurst    = e;
    vNormalW  = normalize(normalMatrix * nrm);

    vec4 mv   = modelViewMatrix * vec4(pos, 1.0);
    vViewDir  = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec3 vColor;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying float vBurst;

  void main() {
    vec3  n      = normalize(vNormalW);
    float facing = abs(dot(n, normalize(vViewDir)));
    float rim    = pow(1.0 - facing, 2.1);

    // Solid neon body + rim bloom on the edges
    vec3 col  = vColor * (0.42 + 0.62 * facing);
    col      += vColor * rim * 1.55;
    col      += vec3(1.0) * rim * 0.16;

    // Panels glow a touch hotter mid-flight
    col *= 1.0 + vBurst * 0.35;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Shards({ progressRef }) {
  const matRef = useRef();
  const groupRef = useRef();
  const smoothed = useRef(0);

  const geometry = useMemo(() => {
    // detail 2 → 320 triangular panels, a good readable shard size.
    // PolyhedronGeometry is already non-indexed; calling toNonIndexed() on it
    // just warns, so only convert when there actually is an index buffer.
    const base = new THREE.IcosahedronGeometry(1.45, 2);
    const geo = base.index ? base.toNonIndexed() : base;
    geo.computeVertexNormals(); // non-indexed → flat/face normals

    const pos = geo.attributes.position;
    const faceCount = pos.count / 3;

    const centroid = new Float32Array(pos.count * 3);
    const rand = new Float32Array(pos.count * 3);
    const color = new Float32Array(pos.count * 3);

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const cen = new THREE.Vector3();

    for (let f = 0; f < faceCount; f++) {
      const i0 = f * 3;

      a.fromBufferAttribute(pos, i0 + 0);
      b.fromBufferAttribute(pos, i0 + 1);
      c.fromBufferAttribute(pos, i0 + 2);
      cen.copy(a).add(b).add(c).divideScalar(3);

      // Inset each triangle toward its centroid so panels read as separate
      // plates with hairline gaps, rather than one seamless ball.
      const INSET = 0.88;
      a.lerp(cen, 1 - INSET);
      b.lerp(cen, 1 - INSET);
      c.lerp(cen, 1 - INSET);
      pos.setXYZ(i0 + 0, a.x, a.y, a.z);
      pos.setXYZ(i0 + 1, b.x, b.y, b.z);
      pos.setXYZ(i0 + 2, c.x, c.y, c.z);

      const r0 = Math.random();
      const r1 = Math.random();
      const r2 = Math.random();

      // Mostly the three gradient accents; sky/bulb sprinkled as brand accents
      const pick = Math.random();
      const col =
        pick > 0.9 ? NEON[4] : pick > 0.78 ? NEON[3] : NEON[Math.floor(Math.random() * 3)];

      for (let v = 0; v < 3; v++) {
        const i = (i0 + v) * 3;
        centroid[i] = cen.x;
        centroid[i + 1] = cen.y;
        centroid[i + 2] = cen.z;
        rand[i] = r0;
        rand[i + 1] = r1;
        rand[i + 2] = r2;
        color[i] = col.r;
        color[i + 1] = col.g;
        color[i + 2] = col.b;
      }
    }

    geo.setAttribute('aCentroid', new THREE.BufferAttribute(centroid, 3));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uTime: { value: 0 } }),
    []
  );

  useFrame((state, delta) => {
    const target = progressRef?.current ?? 0;
    // Critically-damped-ish follow so scrubbing feels weighty, not twitchy
    smoothed.current += (target - smoothed.current) * Math.min(1, delta * 4.2);

    if (matRef.current) {
      matRef.current.uniforms.uProgress.value = smoothed.current;
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = t * 0.16;
      groupRef.current.rotation.x = Math.sin(t * 0.21) * 0.13;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Core progressRef={progressRef} />
    </group>
  );
}

/** Glowing nucleus, revealed as the shell peels away then re-swallowed. */
function Core({ progressRef }) {
  const ref = useRef();
  const smoothed = useRef(0);

  useFrame((state, delta) => {
    const target = progressRef?.current ?? 0;
    smoothed.current += (target - smoothed.current) * Math.min(1, delta * 4.2);
    if (!ref.current) return;

    const p = smoothed.current;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.9) * 0.05;
    // Swells as the shell opens, then contracts as pieces scatter far away
    ref.current.scale.setScalar((0.34 + p * 0.5 - p * p * 0.42) * pulse);
    ref.current.material.opacity = 0.5 + p * 0.4;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1, 3]} />
      <meshBasicMaterial
        color="#dff2ff"
        transparent
        opacity={0.55}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/** Sparse drifting motes — depth cue only, deliberately understated. */
function Motes() {
  const ref = useRef();
  const COUNT = 220;

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // Shell distribution so motes hug the sphere instead of filling a cube
      const r = 2.6 + Math.random() * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.035;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#a3b2ff"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function ShardSphere({ progressRef, dpr = [1, 1.75] }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.4], fov: 42 }}
      dpr={dpr}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Shards progressRef={progressRef} />
      <Motes />
    </Canvas>
  );
}
