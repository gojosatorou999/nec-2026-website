import { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, Billboard, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { DEPARTMENTS } from '../data/site';
import { DEPARTMENT_SVG_STRINGS } from './DepartmentIcons';

/* ═══════════════════════════════════════════════════════════════════════════
   WINNERS SCENE
   ───────────────────────────────────────────────────────────────────────────
   The full cube field from the WinnerPagetemp build, not a row of seven. Read
   out of that bundle rather than eyeballed:

     · field       — a 15×11 grid spanning x −6..8, z −5..5, with the seven
                     team cells punched out of it (chunk 750, module 1228)
     · team cells  — tech [0,1] marketing [2,1] design [1,0] events [3,0]
                     pr [0,−1] content [1,−2] finance [3,−2]
     · glass       — transmission 1, roughness .04, metalness .11,
                     thickness .65, chromaticAberration .1, distortion .28,
                     distortionScale 1, temporalDistortion .2, envMap .1
     · lighting    — lightformers #94b2cb @2.32, #3236d1 @1.54, #3dccff @0.5
     · entrance    — each cube drops in from −1−4·rand on its own delay
     · select      — the chosen cube spins −2.2π and squashes on the way
                     round; the rest scale to zero and sink

   The 158 filler cubes are one InstancedMesh with a cheap opaque material —
   giving each of them a transmission material would mean 165 render targets
   and no framerate at all. Only the seven team cubes are real glass.
   ═══════════════════════════════════════════════════════════════════════════ */

const DEPT_CELLS = {
  tech: [0, 1],
  marketing: [2, 1],
  design: [1, 0],
  events: [3, 0],
  pr: [0, -1],
  content: [1, -2],
  finance: [3, -2],
};

/* Low-power devices get a smaller field and much cheaper glass. Seven
   MeshTransmissionMaterials each cost their own render pass, which is what made
   this page crawl on phones. `deviceMemory` is the direct signal for the 4GB
   handsets this has to run on; the others are fallbacks for browsers that
   don't expose it. */
const LOW_POWER =
  typeof navigator !== 'undefined' &&
  ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches));

const GRID_X = LOW_POWER ? [-3, 5] : [-6, 8];
const GRID_Z = LOW_POWER ? [-3, 3] : [-5, 5];
// centroid of the seven live cubes, so the cluster sits centred in frame
const FOCUS = new THREE.Vector3(1.43, 0, -0.43);

const CUBE = 0.9; // leaves a visible gutter at 1.0 spacing
const SPIN_TIME = 2.0;
const EXIT_TIME = 0.8;

/** drei's RoundedBox is a component, so build the shared geometry by hand. */
function makeRoundedBoxGeometry(size, radius, segments = 4) {
  const half = size / 2 - radius;
  const shape = new THREE.Shape();
  shape.moveTo(-half, -half - radius);
  shape.lineTo(half, -half - radius);
  shape.absarc(half, -half, radius, -Math.PI / 2, 0);
  shape.lineTo(half + radius, half);
  shape.absarc(half, half, radius, 0, Math.PI / 2);
  shape.lineTo(-half, half + radius);
  shape.absarc(-half, half, radius, Math.PI / 2, Math.PI);
  shape.lineTo(-half - radius, -half);
  shape.absarc(-half, -half, radius, Math.PI, Math.PI * 1.5);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: size - radius * 2,
    bevelEnabled: true,
    bevelSize: radius,
    bevelThickness: radius,
    bevelSegments: segments,
    curveSegments: segments,
    steps: 1,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t) => Math.max(0, Math.min(1, t));

/** Renders a department SVG to a canvas so it can ride inside the glass. */
function useIconTexture(deptId, colorStr) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const svgStr = (DEPARTMENT_SVG_STRINGS[deptId] || '').replace(
      'stroke="currentColor"',
      `stroke="${colorStr || '#ffffff'}"`
    );

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    const img = new Image();
    const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      const iconSize = size * 0.55;
      ctx.drawImage(img, (size - iconSize) / 2, (size - iconSize) / 2, iconSize, iconSize);
      tex.needsUpdate = true;
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return tex;
  }, [deptId, colorStr]);
}

/** Renders a team name to a canvas so it can float under its cube.
 *  The cubes on their own gave no clue they were clickable — a name and a
 *  "tap" cue is the cheapest way to make the field self-explanatory. */
function useLabelTexture(text, colorStr) {
  return useMemo(() => {
    const w = 512;
    const h = 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = '600 54px Sora, system-ui, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2 - 8);

    ctx.shadowBlur = 8;
    ctx.font = '500 26px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = colorStr || '#a3b2ff';
    const verb = window.matchMedia?.('(pointer: coarse)').matches ? 'TAP' : 'CLICK';
    ctx.fillText(`${verb} TO OPEN`, w / 2, h / 2 + 40);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [text, colorStr]);
}

/* ── The dark field the team cubes sit in ────────────────────────────────── */
function FillerField({ geometry, anySelected }) {
  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const cells = useMemo(() => {
    const taken = new Set(Object.values(DEPT_CELLS).map(([x, z]) => `${x},${z}`));
    const out = [];
    for (let x = GRID_X[0]; x <= GRID_X[1]; x++) {
      for (let z = GRID_Z[1]; z >= GRID_Z[0]; z--) {
        if (!taken.has(`${x},${z}`)) out.push([x, z]);
      }
    }
    return out;
  }, []);

  // Per-cube entrance character, fixed once so the field always assembles the
  // same way rather than reshuffling on every re-render.
  const seeds = useMemo(
    () =>
      cells.map(() => ({
        delay: Math.random() * 0.5,
        drop: -1 - 4 * Math.random(),
        rx: Math.random() * Math.PI,
      })),
    [cells]
  );

  const t = useRef(0);
  const exit = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    t.current += delta;
    // one shared exit progress — the whole field clears when a team is picked
    const target = anySelected ? 1 : 0;
    exit.current += (target - exit.current) * Math.min(1, delta * (1 / EXIT_TIME) * 3.2);

    for (let i = 0; i < cells.length; i++) {
      const [x, z] = cells[i];
      const s = seeds[i];

      const appear = easeOutCubic(clamp01((t.current - s.delay) / 1.1));
      const e = easeOutCubic(exit.current);

      const scale = Math.max(0.0001, appear * (1 - e));
      dummy.position.set(x, s.drop * (1 - appear) + s.drop * e, z);
      dummy.rotation.set(s.rx * (1 - appear) + s.rx * e, 0, 0);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, cells.length]}
      frustumCulled={false}
      raycast={() => null} // filler is scenery; only team cubes are clickable
    >
      <meshPhysicalMaterial
        color="#0d1424"
        roughness={0.32}
        metalness={0.55}
        clearcoat={0.5}
        clearcoatRoughness={0.35}
        envMapIntensity={0.5}
      />
    </instancedMesh>
  );
}

/* ── One of the seven team cubes ─────────────────────────────────────────── */
function DeptCube({ dept, geometry, selectedId, onSelect }) {
  const groupRef = useRef();
  const innerRef = useRef();
  const labelRef = useRef();
  const haloRef = useRef();
  const tex = useIconTexture(dept.id, dept.accent);
  const labelTex = useLabelTexture(dept.title.split(' & ')[0], dept.accent);

  const cell = DEPT_CELLS[dept.id] ?? [0, 0];
  const isSelected = selectedId === dept.id;
  const dimmed = Boolean(selectedId) && !isSelected;

  const seed = useMemo(
    () => ({ delay: Math.random() * 0.4, drop: -1 - 4 * Math.random(), rx: Math.random() * Math.PI }),
    []
  );

  const t = useRef(0);
  const spin = useRef(0);
  const exit = useRef(0);

  useFrame((state, delta) => {
    const g = groupRef.current;
    const inner = innerRef.current;
    if (!g || !inner) return;

    t.current += delta;
    const appear = easeOutCubic(clamp01((t.current - seed.delay) / 1.1));

    // spin drives forward only while selected, and rewinds when deselected
    spin.current = clamp01(spin.current + (delta / SPIN_TIME) * (isSelected ? 1 : -2.5));
    exit.current += ((dimmed ? 1 : 0) - exit.current) * Math.min(1, delta * 3.4);

    const e = easeOutCubic(exit.current);
    const p = spin.current;

    g.position.set(cell[0], seed.drop * (1 - appear) + seed.drop * e, cell[1]);

    // squash on the way round — |2p−1| pinches at the halfway point, which is
    // what gives the spin its jelly rather than a rigid rotation
    const squash = 0.4 * Math.abs((p - 0.5) * 2) + 0.6;
    const base = appear * (1 - e);
    g.scale.setScalar(Math.max(0.0001, base * (p > 0 ? squash : 1)));

    inner.rotation.set(
      seed.rx * (1 - appear) + seed.rx * e,
      -2.2 * Math.PI * p,
      0.05 * Math.PI * p
    );

    // idle float, damped out once the cube is the centre of attention
    const idle = (1 - p) * appear * (1 - e);
    g.position.y += Math.sin(state.clock.elapsedTime * 1.6 + cell[0] * 1.7) * 0.045 * idle;

    // Attract cue: while nothing is chosen the halo breathes, so the seven
    // live cubes read as buttons rather than as scenery.
    const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 2 + cell[0] * 0.9);
    if (haloRef.current) {
      const show = idle * (selectedId ? 0 : 1);
      haloRef.current.material.opacity = (0.18 + pulse * 0.22) * show;
      const s = 1 + pulse * 0.12;
      haloRef.current.scale.set(s, s, s);
    }
    // Labels belong to the browsing state only — once a team is open the
    // sidebar names it, so they would just be noise.
    if (labelRef.current) {
      labelRef.current.material.opacity = idle * (selectedId ? 0 : 1);
    }
  });

  useEffect(() => () => tex?.dispose(), [tex]);
  useEffect(() => () => labelTex?.dispose(), [labelTex]);

  return (
    <group ref={groupRef}>
      <group ref={innerRef}>
        <mesh
          geometry={geometry}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(isSelected ? null : dept);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = '';
          }}
        >
          {LOW_POWER ? (
            /* A transmission material runs its own render pass per cube —
               seven of those is what made this unusable on a phone. The
               physical material approximates the same glass in one pass. */
            <meshPhysicalMaterial
              color="#cfe4ff"
              roughness={0.12}
              metalness={0.1}
              transmission={0.72}
              thickness={0.5}
              ior={1.3}
              clearcoat={0.7}
              clearcoatRoughness={0.15}
              envMapIntensity={0.6}
              transparent
              opacity={0.92}
            />
          ) : (
            <MeshTransmissionMaterial
              transmission={1}
              roughness={0.04}
              metalness={0.11}
              thickness={0.65}
              chromaticAberration={0.1}
              distortion={0.28}
              distortionScale={1}
              temporalDistortion={0.2}
              envMapIntensity={0.1}
              color="#dfefff"
              resolution={256}
              samples={6}
            />
          )}
        </mesh>

        {/* Team mark suspended inside the glass, always facing the camera */}
        {tex && (
          <Billboard>
            <mesh raycast={() => null}>
              <planeGeometry args={[0.42, 0.42]} />
              <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* Breathing halo — the "this is a button" cue */}
      <mesh ref={haloRef} position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[0.52, 0.78, 40]} />
        <meshBasicMaterial
          color={dept.accent}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Team name + tap cue, floating above the cube */}
      {labelTex && (
        <Billboard position={[0, 0.98, 0]}>
          <mesh ref={labelRef} raycast={() => null}>
            <planeGeometry args={[1.5, 0.375]} />
            <meshBasicMaterial
              map={labelTex}
              transparent
              opacity={0}
              depthWrite={false}
              depthTest={false}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      )}
    </group>
  );
}

/** Eases the camera onto the chosen cube and drifts with the pointer otherwise. */
function CameraRig({ selectedId }) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3().copy(FOCUS));
  const home = useRef(camera.position.clone());

  // The seven live cubes span roughly six world units across the isometric
  // projection. Pinning the overview zoom to a constant pushed the outer teams
  // off a phone screen entirely, so derive it from the smaller viewport axis
  // and let the cluster always fit.
  const overviewZoom = useMemo(
    () => Math.max(34, Math.min(78, Math.min(size.width, size.height * 1.5) / 7.1)),
    [size.width, size.height]
  );

  // On a phone the title card occupies the top of the screen, so the cluster is
  // nudged into the clear space below it rather than sitting behind the copy.
  // setViewOffset shifts the projection itself — moving the camera would just
  // translate the whole scene with it.
  useEffect(() => {
    const narrow = size.width < 900;
    if (narrow) {
      camera.setViewOffset(
        size.width,
        size.height,
        0,
        -size.height * 0.16,
        size.width,
        size.height
      );
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    return () => camera.clearViewOffset();
  }, [camera, size.width, size.height]);

  useFrame((state, delta) => {
    const cell = DEPT_CELLS[selectedId];
    const k = Math.min(1, delta * 2.2);

    if (cell) {
      target.current.lerp(new THREE.Vector3(cell[0], 0, cell[1]), k);
    } else {
      target.current.lerp(
        new THREE.Vector3(
          FOCUS.x + state.pointer.x * 0.6,
          FOCUS.y - state.pointer.y * 0.35,
          FOCUS.z
        ),
        k
      );
    }

    // Orthographic framing, so the camera stays put and only the look-at moves;
    // dollying a parallel projection does nothing useful.
    camera.position.set(
      home.current.x + (target.current.x - FOCUS.x),
      home.current.y,
      home.current.z + (target.current.z - FOCUS.z)
    );
    camera.lookAt(target.current);

    const wantZoom = cell ? overviewZoom * 1.9 : overviewZoom;
    camera.zoom += (wantZoom - camera.zoom) * Math.min(1, delta * 2.4);
    camera.updateProjectionMatrix();
  });

  return null;
}

function Scene({ selectedId, onSelect }) {
  const geometry = useMemo(() => makeRoundedBoxGeometry(CUBE, 0.1, 4), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      <FillerField geometry={geometry} anySelected={Boolean(selectedId)} />

      {DEPARTMENTS.map((dept) => (
        <DeptCube
          key={dept.id}
          dept={dept}
          geometry={geometry}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}

      {/* Lighting rig lifted from the reference build */}
      <Environment resolution={LOW_POWER ? 128 : 256} frames={LOW_POWER ? 1 : Infinity}>
        <Lightformer
          form="rect"
          color="#94b2cb"
          intensity={2.32}
          position={[-6, 1, -6]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="rect"
          color="#3236d1"
          intensity={1.54}
          position={[-2, 5, 3]}
          rotation={[-Math.PI / 3, 0, 0]}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="rect"
          color="#3dccff"
          intensity={0.5}
          position={[5, 3, -3]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>

      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 12, 8]} intensity={0.7} color="#a3b2ff" />
      <CameraRig selectedId={selectedId} />
    </>
  );
}

export default function WinnersScene({ selectedId, onSelect }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [16, 22, 20], zoom: 78, near: -100, far: 200 }}
      dpr={LOW_POWER ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
      style={{ background: 'transparent' }}
    >
      <Scene selectedId={selectedId} onSelect={onSelect} />
    </Canvas>
  );
}
