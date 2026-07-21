import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ═══════════════════════════════════════════════════════════════════════════
   VOXEL IDEA INCUBATOR LOGO
   ───────────────────────────────────────────────────────────────────────────
   The club mark rebuilt in 3D: the logo is rasterised to a small offscreen
   canvas, and every filled pixel becomes a solid cube. Because the source is
   the real logo geometry (sky field, heavy serif "I", amber bulb) the voxel
   build is an exact replica rather than an approximation.

   One `progress` value (0 = assembled, 1 = dismantled) drives the whole thing
   on the GPU — each cube tumbles about its own axis and flies outward,
   staggered so the mark peels apart instead of popping.
   ═══════════════════════════════════════════════════════════════════════════ */

// Heavy serif "I" with the split foot, traced from the supplied logo SVG
// and normalised to a 100×100 box.
const I_PATH =
  'M20.4 16.7 H79.6 V29.2 H64.8 V64.8 H79.6 V75.5 H53.7 V54.6 ' +
  'H47.2 V75.5 H20.4 V64.8 H37 V29.2 H20.4 Z';

const GRID = 40; // cubes per side
const LOGO_SIZE = 3.5; // world units across

// kind → [colour, depth multiplier, z offset in cells]
const KINDS = {
  field: { color: new THREE.Color('#8ce1fd'), depth: 0.5, z: -0.3 },
  ink: { color: new THREE.Color('#141b2b'), depth: 1.15, z: 0.05 },
  bulb: { color: new THREE.Color('#ffd65c'), depth: 1.7, z: 0.32 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw the logo at GRID×GRID and read it back as pixels. */
function rasterizeLogo(n) {
  const canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = n;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.scale(n / 100, n / 100);

  // Sky field
  ctx.fillStyle = '#8ce1fd';
  roundRect(ctx, 0, 0, 100, 100, 20);
  ctx.fill();

  // The "I"
  ctx.fillStyle = '#0b0f16';
  ctx.fill(new Path2D(I_PATH));

  // Bulb glass
  ctx.fillStyle = '#f9c744';
  ctx.beginPath();
  ctx.arc(50, 45, 10.5, 0, Math.PI * 2);
  ctx.fill();

  // Screw base
  ctx.beginPath();
  ctx.moveTo(45.6, 53.5);
  ctx.lineTo(54.4, 53.5);
  ctx.lineTo(52.9, 59.5);
  ctx.lineTo(47.1, 59.5);
  ctx.closePath();
  ctx.fill();

  return ctx.getImageData(0, 0, n, n);
}

function classify(r, g, b) {
  if (r > 190 && g > 140 && b < 140) return 'bulb';
  if (r < 95 && g < 105 && b < 115) return 'ink';
  return 'field';
}

const VERT = /* glsl */ `
  attribute vec3 iOffset;
  attribute vec3 iColor;
  attribute vec3 iRand;
  attribute vec3 iScale;

  uniform float uProgress;
  uniform float uTime;

  varying vec3  vColor;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vBurst;

  vec3 rotateAxis(vec3 v, vec3 axis, float a) {
    float c = cos(a);
    return v * c + cross(axis, v) * sin(a) + axis * dot(axis, v) * (1.0 - c);
  }

  void main() {
    // Stagger so the mark peels apart from a moving front
    float t = clamp((uProgress - iRand.z * 0.42) / 0.58, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);

    vec3 axis = normalize(iRand * 2.0 - 1.0 + vec3(0.0001));
    float spin = e * 6.2831853 * (0.3 + iRand.x * 1.2);

    vec3 local = rotateAxis(position * iScale, axis, spin);
    vec3 nrm   = rotateAxis(normal, axis, spin);

    // Burst outward from the centre of the plate, biased toward the viewer
    vec3 dir = normalize(vec3(iOffset.xy, 0.55) + (iRand - 0.5) * 0.7);
    vec3 pos = iOffset + local + dir * (e * (1.5 + iRand.y * 3.0));

    // Idle shimmer while assembled
    pos.z += sin(uTime * 1.15 + iOffset.x * 1.7 + iOffset.y * 1.3) * 0.026 * (1.0 - e);

    vColor   = iColor;
    vBurst   = e;
    vNormalW = normalize(normalMatrix * nrm);

    vec4 mv  = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;

  varying vec3  vColor;
  varying vec3  vNormalW;
  varying vec3  vViewDir;
  varying float vBurst;

  void main() {
    vec3  n      = normalize(vNormalW);
    float facing = abs(dot(n, normalize(vViewDir)));
    float rim    = pow(1.0 - facing, 2.0);

    vec3 col  = vColor * (0.52 + 0.62 * facing);
    col      += vColor * rim * 1.05;
    col      += vec3(1.0) * rim * 0.18;
    col      *= 1.0 + vBurst * 0.3;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function Voxels({ progressRef }) {
  const matRef = useRef();
  const groupRef = useRef();
  const smoothed = useRef(0);

  const geometry = useMemo(() => {
    const img = rasterizeLogo(GRID);
    if (!img) return null;

    const cell = LOGO_SIZE / GRID;
    const offsets = [];
    const colors = [];
    const rands = [];
    const scales = [];

    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        const i = (y * GRID + x) * 4;
        const a = img.data[i + 3];
        if (a < 40) continue;

        const kind = KINDS[classify(img.data[i], img.data[i + 1], img.data[i + 2])];

        offsets.push(
          (x + 0.5 - GRID / 2) * cell,
          (GRID / 2 - y - 0.5) * cell,
          kind.z * cell
        );
        colors.push(kind.color.r, kind.color.g, kind.color.b);
        rands.push(Math.random(), Math.random(), Math.random());
        scales.push(cell * 0.9, cell * 0.9, cell * kind.depth);
      }
    }

    const box = new THREE.BoxGeometry(1, 1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.index = box.index;
    geo.setAttribute('position', box.attributes.position);
    geo.setAttribute('normal', box.attributes.normal);

    geo.setAttribute('iOffset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geo.setAttribute('iColor', new THREE.InstancedBufferAttribute(new Float32Array(colors), 3));
    geo.setAttribute('iRand', new THREE.InstancedBufferAttribute(new Float32Array(rands), 3));
    geo.setAttribute('iScale', new THREE.InstancedBufferAttribute(new Float32Array(scales), 3));

    geo.instanceCount = offsets.length / 3;
    // Never frustum-cull: cubes fly well outside the assembled bounds
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    // NB: `box` is deliberately not disposed — its position/normal/index
    // buffers are now owned by `geo`, and disposing would release them.
    return geo;
  }, []);

  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uTime: { value: 0 } }),
    []
  );

  useFrame((state, delta) => {
    const target = progressRef?.current ?? 0;
    smoothed.current += (target - smoothed.current) * Math.min(1, delta * 4);

    if (matRef.current) {
      matRef.current.uniforms.uProgress.value = smoothed.current;
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }

    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      // Gentle idle sway, plus a little parallax toward the pointer
      const targetY = Math.sin(t * 0.32) * 0.3 + state.pointer.x * 0.42;
      const targetX = Math.sin(t * 0.24) * 0.14 - state.pointer.y * 0.26;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * Math.min(1, delta * 2);
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * Math.min(1, delta * 2);
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERT}
          fragmentShader={FRAG}
          uniforms={uniforms}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

export default function VoxelLogo({ progressRef, dpr = [1, 1.75] }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 42 }}
      dpr={dpr}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Voxels progressRef={progressRef} />
    </Canvas>
  );
}
