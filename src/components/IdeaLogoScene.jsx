import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/* ═══════════════════════════════════════════════════════════════════════════
   IDEA LOGO SCENE
   ───────────────────────────────────────────────────────────────────────────
   The club's "I" mark, extruded and split into eight machined shards that
   fly apart and reassemble as the hero is scrolled. Because separation is a
   pure function of scroll position, scrolling back up remantles the logo
   exactly — there is no play/reverse state to get out of sync.

   Geometry and the shard split come from the idea-heropage-v1 reference.
   The lighting, materials and glow are re-graded onto the site palette:
   periwinkle rim, mint fill, amber bulb core, ink background.

   Reads `progressRef.current` (0→1) rather than owning scroll itself, so the
   hero section stays the single source of truth for where the page is.
   ═══════════════════════════════════════════════════════════════════════════ */

const STAR_COUNT = 1400;

// palette, mirrored from index.css
const INK = 0x05070d;
const PERI = 0xa3b2ff;
const MINT = 0x7affcf;
const VIOLET = 0xbc7aff;
const BULB = 0xffd65c;

function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

/**
 * Per-shard separation. Strictly monotonic in scroll: 0 = seated, 1 = flung
 * clear. It used to open and then close again, which made the logo reassemble
 * by itself at the bottom of the rail whether you wanted it to or not. Now
 * nothing reverses on its own — scrolling down takes it apart, scrolling back
 * up puts it together, shard by shard, exactly tracking the scrollbar.
 *
 * `stagger` (0 → 0.35, one value per shard) offsets each shard's window so
 * they leave one at a time rather than all at once.
 */
function shardSeparation(p, stagger) {
  const s = stagger / 0.35; // normalise to 0→1 across the eight shards
  return smoothstep(0.05 + s * 0.35, 0.45 + s * 0.35, p);
}

export default function IdeaLogoScene({ progressRef }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let width = host.clientWidth;
    let height = host.clientHeight;
    if (!width || !height) return;

    /* ── Scene ── */
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(INK);
    scene.fog = new THREE.FogExp2(INK, 0.008);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    // Closer than the reference's 21 so the mark fills more of the frame
    camera.position.set(-3.4, 1.6, 17.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.15).texture;
    pmrem.dispose();

    /* ── Post: MSAA target keeps shard edges clean under bloom ── */
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.SRGBColorSpace,
      samples: 8,
    });
    const composer = new EffectComposer(renderer, renderTarget);
    composer.addPass(new RenderPass(scene, camera));

    // High threshold: only genuinely hot pixels (the bulb core, edge speculars)
    // bloom. A low threshold made the entire mark glow and hurt to look at.
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.42, 1.0, 0.92);
    composer.addPass(bloomPass);

    const finishPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uGrain: { value: 0.03 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uGrain;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        void main() {
          vec2 centered = vUv - 0.5;
          float dist = length(centered);

          float ca = smoothstep(0.25, 0.75, dist) * 0.004;
          vec2 dir = normalize(centered + 1e-6);
          float r = texture2D(tDiffuse, vUv + dir * ca).r;
          float g = texture2D(tDiffuse, vUv).g;
          float b = texture2D(tDiffuse, vUv - dir * ca).b;
          vec3 color = vec3(r, g, b);

          float vig = smoothstep(0.95, 0.35, dist);
          color *= mix(0.7, 1.0, vig);

          color += (hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 61.7) - 0.5) * uGrain;
          gl_FragColor = vec4(color, 1.0);
        }`,
    });
    composer.addPass(finishPass);

    /* ── Starfield ── */
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starPhase = new Float32Array(STAR_COUNT);
    const starSize = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 60 + Math.random() * 240;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
      starPhase[i] = Math.random() * Math.PI * 2;
      starSize[i] = 0.5 + Math.random() * 1.8;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('phase', new THREE.BufferAttribute(starPhase, 1));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSize, 1));

    const starMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPixelRatio;
        attribute float phase;
        attribute float size;
        varying float vTwinkle;
        void main() {
          vTwinkle = sin(uTime * 1.8 + phase) * 0.5 + 0.5;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (220.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying float vTwinkle;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.5, d)) * (0.22 + vTwinkle * 0.5);
          gl_FragColor = vec4(vec3(0.72, 0.79, 1.0), alpha);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    /* ── Logo group ── */
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);
    logoGroup.rotation.y = -0.3;
    logoGroup.rotation.x = 0.1;
    logoGroup.position.y = -1.2;

    const extrudeSettings = {
      depth: 0.9,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.05,
    };

    /* ── Ghost framework: the whole "I", shown as wireframe while apart ── */
    const fullShape = new THREE.Shape();
    fullShape.moveTo(-5, 5);
    fullShape.lineTo(5, 5);
    fullShape.lineTo(5, 3);
    fullShape.lineTo(3, 3);
    fullShape.lineTo(3, -3);
    fullShape.lineTo(5, -3);
    fullShape.lineTo(5, -5);
    fullShape.lineTo(0.6, -5);
    fullShape.lineTo(0.6, -0.2);
    fullShape.lineTo(-0.6, -0.2);
    fullShape.lineTo(-0.6, -5);
    fullShape.lineTo(-5, -5);
    fullShape.lineTo(-5, -3);
    fullShape.lineTo(-3, -3);
    fullShape.lineTo(-3, 3);
    fullShape.lineTo(-5, 3);
    fullShape.lineTo(-5, 5);

    const fullGeo = new THREE.ExtrudeGeometry(fullShape, extrudeSettings);
    fullGeo.translate(0, 0, -0.45);

    const edges = new THREE.EdgesGeometry(fullGeo);
    const frameworkMaterial = new THREE.LineBasicMaterial({
      color: PERI,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    logoGroup.add(new THREE.LineSegments(edges, frameworkMaterial));

    /* ── Shards ── */
    // Legible against ink without glaring. The presence comes from a light
    // base colour catching the key light — emissive and bloom are kept low on
    // purpose, since driving brightness through those is what blew the whole
    // mark out into a white blob.
    const shardMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x7c8ab8,
      roughness: 0.19,
      metalness: 0.84,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
      envMapIntensity: 1.5,
      emissive: new THREE.Color(PERI),
      emissiveIntensity: 0.08,
    });

    const metalPieces = [];

    function createShard(points, targetPos, targetRot, stagger) {
      const s = new THREE.Shape();
      s.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
      s.lineTo(points[0][0], points[0][1]);

      const geo = new THREE.ExtrudeGeometry(s, extrudeSettings);
      geo.translate(0, 0, -0.45);
      geo.computeBoundingBox();
      const center = new THREE.Vector3();
      geo.boundingBox.getCenter(center);
      geo.translate(-center.x, -center.y, -center.z);

      const mesh = new THREE.Mesh(geo, shardMaterial);
      mesh.position.copy(center);

      metalPieces.push({
        mesh,
        data: {
          origPos: center.clone(),
          targetPos: new THREE.Vector3(...targetPos),
          qOrig: new THREE.Quaternion(),
          qTarget: new THREE.Quaternion().setFromEuler(new THREE.Euler(...targetRot)),
          stagger,
        },
      });
      logoGroup.add(mesh);
    }

    createShard([[-5, 5], [0, 5], [0, 3], [-3, 3], [-5, 3]], [-15, 20, 10], [Math.PI, Math.PI / 2, Math.PI / 4], 0.0);
    createShard([[0, 5], [5, 5], [5, 3], [3, 3], [0, 3]], [20, 15, -15], [-Math.PI / 2, Math.PI, Math.PI / 3], 0.05);
    createShard([[-3, 3], [0, 3], [0, 1.5], [-3, 1]], [-25, 5, 25], [Math.PI / 4, -Math.PI / 2, 0], 0.1);
    createShard([[0, 3], [3, 3], [3, 1], [0, 1.5]], [25, 10, -5], [0, Math.PI / 3, Math.PI / 2], 0.15);
    createShard([[-3, 1], [0, 1.5], [0, -0.2], [-0.6, -0.2], [-0.6, -2], [-3, -2.5]], [-20, -10, -20], [-Math.PI, 0, Math.PI / 4], 0.2);
    createShard([[0, 1.5], [3, 1], [3, -2.5], [0.6, -2], [0.6, -0.2], [0, -0.2]], [30, -5, 20], [Math.PI / 2, Math.PI / 4, -Math.PI], 0.25);
    createShard([[-3, -2.5], [-0.6, -2], [-0.6, -5], [-5, -5], [-5, -3], [-3, -3]], [-15, -25, 15], [Math.PI / 3, -Math.PI / 4, Math.PI / 2], 0.3);
    createShard([[0.6, -2], [3, -2.5], [3, -3], [5, -3], [5, -5], [0.6, -5]], [20, -20, -25], [-Math.PI / 2, Math.PI / 2, 0], 0.35);

    /* ── Bulb core, revealed as the shards clear ── */
    const bulbMaterial = new THREE.MeshPhysicalMaterial({
      color: BULB,
      emissive: new THREE.Color(BULB),
      emissiveIntensity: 0.22,
      metalness: 0.15,
      roughness: 0.42,
      clearcoat: 0.25,
      clearcoatRoughness: 0.55,
    });

    const frontZ = 0.55;
    const bulbDepth = 0.3;

    const bulbMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, bulbDepth, 64),
      bulbMaterial
    );
    bulbMesh.rotation.x = Math.PI / 2;
    bulbMesh.position.set(0, 1.0, frontZ);
    logoGroup.add(bulbMesh);

    const bulbBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, bulbDepth), bulbMaterial);
    bulbBase.position.set(0, -0.1, frontZ);
    logoGroup.add(bulbBase);

    // the mark's radiating rays
    const rayGeo = new THREE.BoxGeometry(0.35, 0.1, bulbDepth);
    [30, 60, 90, 120, 150].forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      const ray = new THREE.Mesh(rayGeo, bulbMaterial);
      ray.position.set(Math.cos(rad) * 1.6, 1.0 + Math.sin(rad) * 1.6, frontZ);
      ray.rotation.z = rad;
      logoGroup.add(ray);
    });

    const filamentMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x050505,
      roughness: 0.1,
      metalness: 1.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const filZ = frontZ + 0.15;
    const filDepth = 0.12;
    [
      { size: [0.08, 0.7, filDepth], pos: [-0.35, 0.5, filZ], rotZ: 0 },
      { size: [0.08, 0.7, filDepth], pos: [0.35, 0.5, filZ], rotZ: 0 },
      { size: [0.08, 0.45, filDepth], pos: [-0.18, 0.95, filZ], rotZ: -0.4 },
      { size: [0.08, 0.45, filDepth], pos: [0.18, 0.95, filZ], rotZ: 0.4 },
      { size: [0.7, 0.08, filDepth], pos: [0, 0.15, filZ], rotZ: 0 },
    ].forEach((f) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(...f.size), filamentMaterial);
      m.position.set(...f.pos);
      m.rotation.z = f.rotZ;
      logoGroup.add(m);
    });

    /* ── Lights, graded to the site palette ── */
    scene.add(new THREE.AmbientLight(PERI, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-10, 15, 15);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(PERI, 1.5);
    rimLight.position.set(15, 10, -15);
    scene.add(rimLight);
    const fillLight = new THREE.DirectionalLight(MINT, 0.5);
    fillLight.position.set(0, -8, 12);
    scene.add(fillLight);
    const violetLight = new THREE.DirectionalLight(VIOLET, 0.45);
    violetLight.position.set(-14, -6, -10);
    scene.add(violetLight);
    const coreLight = new THREE.PointLight(0xffa028, 0.25, 8, 2);
    coreLight.position.set(0, 0, 1);
    logoGroup.add(coreLight);

    /* ── Resize ── */
    const handleResize = () => {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      bloomPass.resolution.set(width, height);
      starMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);

    /* ── Loop ── */
    const clock = new THREE.Clock();
    let frameId = 0;
    let smoothed = progressRef.current ?? 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // frame-rate independent easing toward the section's reported progress
      const k = 1 - Math.exp(-dt * 4.5);
      smoothed += ((progressRef.current ?? 0) - smoothed) * k;
      const p = smoothed;

      const meanSep = shardSeparation(p, 0.15);
      logoGroup.rotation.y += dt * (0.16 + meanSep * 0.1);
      stars.rotation.y += dt * 0.004;
      // dolly the group toward camera while apart, so shards tumble past rather
      // than shrinking away into the fog
      logoGroup.position.z = meanSep * 5.0;
      logoGroup.position.y = -1.2 + meanSep * 1.6;

      let sepSum = 0;
      for (let i = 0; i < metalPieces.length; i++) {
        const { mesh, data } = metalPieces[i];
        const sep = shardSeparation(p, data.stagger);
        sepSum += sep;
        mesh.position.lerpVectors(data.origPos, data.targetPos, sep);
        mesh.quaternion.slerpQuaternions(data.qOrig, data.qTarget, sep);
      }
      const sepAvg = sepSum / metalPieces.length;

      const flicker = 0.92 + Math.sin(t * 23.0) * 0.04 + Math.sin(t * 7.3) * 0.04;
      // Small floor so the mark is edge-lit even when whole — with no floor the
      // logo only appeared once it had already broken apart.
      frameworkMaterial.opacity = (0.16 + sepAvg * 0.4) * flicker;
      // framework drifts peri → violet as the logo opens up
      frameworkMaterial.color.setHex(PERI).lerp(new THREE.Color(VIOLET), sepAvg * 0.6);

      // Separation no longer falls back to 0 at the end of the rail, so these
      // now *rest* at their maximum rather than passing through it. Ranges are
      // tightened accordingly — the old peaks left the bulb sitting blown out
      // as a white blob for the whole bottom of the hero.
      shardMaterial.emissiveIntensity = 0.08 + sepAvg * 0.1;
      coreLight.intensity = 0.22 + sepAvg * 0.16;
      bulbMaterial.emissiveIntensity = 0.18 + sepAvg * 0.1;

      starMat.uniforms.uTime.value = t;
      finishPass.uniforms.uTime.value = t;

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      composer.dispose();
      renderer.dispose();
      renderTarget.dispose();
      starGeo.dispose();
      starMat.dispose();
      fullGeo.dispose();
      edges.dispose();
      rayGeo.dispose();
      frameworkMaterial.dispose();
      metalPieces.forEach(({ mesh }) => mesh.geometry.dispose());
      bulbMesh.geometry.dispose();
      bulbBase.geometry.dispose();
      shardMaterial.dispose();
      bulbMaterial.dispose();
      filamentMaterial.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [progressRef]);

  return <div ref={hostRef} aria-hidden="true" style={{ position: 'absolute', inset: 0 }} />;
}
