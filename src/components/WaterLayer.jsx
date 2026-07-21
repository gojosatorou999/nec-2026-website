import { useWaterShader } from '../hooks/useWaterShader';

/**
 * Fixed, click-through water caustics layer that sits behind all content.
 * Screen-blended at low alpha so body copy stays fully legible.
 */
export default function WaterLayer() {
  const canvasRef = useWaterShader();

  return (
    <canvas
      ref={canvasRef}
      id="water-layer"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        mixBlendMode: 'screen',
        opacity: 0.62,
      }}
    />
  );
}
