import { useCallback, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   useWaterShader
   ───────────────────────────────────────────────────────────────────────────
   Fullscreen caustic-water field rendered on the GPU.

   The previous implementation looped over every screen pixel on the CPU twice
   per frame (~4M ops/frame at 1080p) which is why the effect never actually
   showed up — it could not hold a frame rate. This is a single fragment
   shader on one triangle instead: constant cost, runs at refresh rate.

   Scroll is the primary driver. Scroll position advances the wave field
   vertically, and scroll *velocity* raises the swell — so the water visibly
   churns while you move down the page and settles when you stop.
   ═══════════════════════════════════════════════════════════════════════════ */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform float uScroll;   // accumulated scroll, in viewport heights
uniform float uVel;      // smoothed scroll velocity, 0..1
uniform vec2  uPointer;  // pixels
uniform float uPointerA; // pointer influence, 0..1

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p    = (frag - 0.5 * uRes) / uRes.y;

  float t = uTime * 0.22;

  // Wave field drifts with scroll position; swell grows with scroll speed
  vec2 q = p * 2.3;
  q.y   += uScroll * 1.15;
  float swell = 0.30 + uVel * 0.75;

  // ── Domain-warped caustics ──
  vec2  c   = q;
  float acc = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    c += vec2(
      sin(c.y * 1.72 + t * 1.15 + fi * 1.31),
      cos(c.x * 1.54 - t * 0.94 + fi * 1.77)
    ) * (0.34 * swell);
    acc += 1.0 / (abs(sin(c.x + c.y + t * 0.62)) * 8.5 + 0.62);
  }
  acc = acc / 5.0;
  acc = pow(clamp(acc - 0.16, 0.0, 1.0), 1.9);

  // ── Pointer wake: expanding rings that fade with distance ──
  vec2  d     = (frag - uPointer) / uRes.y;
  float dist  = length(d);
  float ring  = sin(dist * 34.0 - uTime * 4.6) * exp(-dist * 5.2);
  acc += ring * 0.16 * uPointerA;

  acc = max(acc, 0.0);

  // ── Colour: brand gradient, periwinkle → mint → violet ──
  float band = 0.5 + 0.5 * sin(q.y * 0.55 + t * 0.5);
  vec3  cool = mix(vec3(0.639, 0.698, 1.0), vec3(0.478, 1.0, 0.812), band);
  vec3  warm = vec3(0.737, 0.478, 1.0);
  vec3  col  = mix(cool, warm, smoothstep(0.45, 1.0, acc) * 0.45);

  // Vignette so the effect never fights text at the edges of a column
  float vig = smoothstep(1.25, 0.25, length(p * vec2(0.78, 1.0)));

  // Base term keeps the caustics visible when the page is at rest; the uVel
  // term makes the water churn harder the faster you scroll.
  float a = acc * vig * (0.44 + uVel * 0.38);
  gl_FragColor = vec4(col * a, a);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[water] shader compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function useWaterShader() {
  const canvasRef = useRef(null);
  const raf = useRef(0);

  // Live scroll/pointer state, kept out of React so no re-renders per frame
  const st = useRef({
    scroll: 0,
    vel: 0,
    velTarget: 0,
    lastY: 0,
    px: 0,
    py: 0,
    pa: 0,
    paTarget: 0,
  });

  const onScroll = useCallback(() => {
    const y = window.scrollY;
    const vh = Math.max(1, window.innerHeight);
    const s = st.current;
    const dy = Math.abs(y - s.lastY);
    s.lastY = y;
    s.scroll = y / vh;
    // Normalise: ~90px of travel in a frame counts as "full speed"
    s.velTarget = Math.min(1, dy / 90);
  }, []);

  const onPointer = useCallback((e) => {
    const s = st.current;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    s.px = e.clientX * dpr;
    // WebGL origin is bottom-left; the DOM's is top-left
    s.py = (window.innerHeight - e.clientY) * dpr;
    s.paTarget = 1;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gl =
      canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false }) ||
      canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[water] link failed:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // One oversized triangle covering the viewport
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      scroll: gl.getUniformLocation(prog, 'uScroll'),
      vel: gl.getUniformLocation(prog, 'uVel'),
      pointer: gl.getUniformLocation(prog, 'uPointer'),
      pointerA: gl.getUniformLocation(prog, 'uPointerA'),
    };

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.res, canvas.width, canvas.height);
    };

    resize();
    st.current.lastY = window.scrollY;
    onScroll();

    const start = performance.now();
    let prev = start;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const s = st.current;

      // Velocity decays quickly once scrolling stops → water settles
      s.velTarget *= 0.9;
      s.vel += (s.velTarget - s.vel) * Math.min(1, dt * 6);
      s.paTarget *= 0.96;
      s.pa += (s.paTarget - s.pa) * Math.min(1, dt * 5);

      gl.uniform1f(U.time, reduced ? 0 : (now - start) / 1000);
      gl.uniform1f(U.scroll, s.scroll);
      gl.uniform1f(U.vel, reduced ? 0.12 : s.vel);
      gl.uniform2f(U.pointer, s.px, s.py);
      gl.uniform1f(U.pointerA, reduced ? 0 : s.pa);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);

    const onLost = (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf.current);
    };

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [onScroll, onPointer]);

  return canvasRef;
}
