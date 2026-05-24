import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { VisualizerSettings } from '../types';
import {
  drawBars,
  drawWave,
  drawCircle,
  drawParticles,
  drawSpiral,
  drawRings,
  drawTunnel,
  drawFlower,
  drawStarfield,
  drawDNA,
  drawAurora,
  drawMatrix,
  drawLissajous,
  drawPlasma,
  drawVinyl,
  drawVoronoi,
  drawFractalTree,
  drawKaleidoscope,
  drawPolyhedron,
  drawSierpinski,
  resetParticles,
  resetRotation,
  resetStarfield,
  resetMatrix,
  resetVoronoi,
  incrementRotation,
} from '../utils/drawVisualizer';

interface Props {
  analyser: AnalyserNode | null;
  settings: VisualizerSettings;
  isPlaying: boolean;
  backgroundImageObj: HTMLImageElement | null;
  vinylLabelObj: HTMLImageElement | null;
}

export interface VisualizerCanvasRef {
  canvas: HTMLCanvasElement | null;
}

const VisualizerCanvas = forwardRef<VisualizerCanvasRef, Props>(
  ({ analyser, settings, isPlaying, backgroundImageObj, vinylLabelObj }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataArrayRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      get canvas() { return canvasRef.current; }
    }));

    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas must fit both the viz area and the bg image area
      const hasBg = !!backgroundImageObj;
      const canvasWidth = hasBg
        ? Math.max(settings.width, settings.bgImageX + settings.bgImageWidth)
        : settings.width;
      const canvasHeight = hasBg
        ? Math.max(settings.height, settings.bgImageY + settings.bgImageHeight)
        : settings.height;

      // Keep canvas element size in sync
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      if (settings.trailStrength > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, 1 - settings.trailStrength));
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
      } else {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // Background image
      if (backgroundImageObj) {
        ctx.save();
        ctx.globalAlpha = settings.backgroundOpacity * (settings.trailStrength > 0 ? 0.4 : 1);
        const bgW = settings.bgImageWidth;
        const bgH = settings.bgImageHeight;
        const imgRatio = backgroundImageObj.width / backgroundImageObj.height;
        const bgRatio = bgW / bgH;
        let dw = bgW, dh = bgH, dx = settings.bgImageX, dy = settings.bgImageY;
        if (imgRatio > bgRatio) {
          dh = bgH;
          dw = dh * imgRatio;
          dx = settings.bgImageX + (bgW - dw) / 2;
        } else {
          dw = bgW;
          dh = dw / imgRatio;
          dy = settings.bgImageY + (bgH - dh) / 2;
        }
        ctx.drawImage(backgroundImageObj, dx, dy, dw, dh);
        ctx.restore();
      }

      // Get audio data
      if (analyser && dataArrayRef.current) {
        if (settings.mode === 'wave') {
          analyser.getByteTimeDomainData(dataArrayRef.current);
        } else {
          analyser.getByteFrequencyData(dataArrayRef.current);
        }
      } else if (dataArrayRef.current) {
        if (settings.mode === 'wave') {
          dataArrayRef.current.fill(128);
        } else {
          dataArrayRef.current.fill(0);
        }
      }

      const data = dataArrayRef.current ?? new Uint8Array(512).fill(settings.mode === 'wave' ? 128 : 0);

      if (['spiral', 'rings', 'tunnel', 'flower', 'dna', 'lissajous', 'aurora', 'vinyl'].includes(settings.mode)) {
        incrementRotation(settings.rotationSpeed);
      }

      switch (settings.mode) {
        case 'bars':
          drawBars(ctx, data, settings);
          break;
        case 'wave':
          drawWave(ctx, data, settings);
          break;
        case 'circle':
          drawCircle(ctx, data, settings);
          break;
        case 'particles':
          drawParticles(ctx, data, settings, canvasWidth, canvasHeight);
          break;
        case 'spiral':
          drawSpiral(ctx, data, settings);
          break;
        case 'rings':
          drawRings(ctx, data, settings);
          break;
        case 'tunnel':
          drawTunnel(ctx, data, settings);
          break;
        case 'flower':
          drawFlower(ctx, data, settings);
          break;
        case 'starfield':
          drawStarfield(ctx, data, settings, canvasWidth, canvasHeight);
          break;
        case 'dna':
          drawDNA(ctx, data, settings);
          break;
        case 'aurora':
          drawAurora(ctx, data, settings);
          break;
        case 'matrix':
          drawMatrix(ctx, data, settings);
          break;
        case 'lissajous':
          drawLissajous(ctx, data, settings);
          break;
        case 'plasma':
          drawPlasma(ctx, data, settings);
          break;
        case 'vinyl':
          drawVinyl(ctx, data, settings, vinylLabelObj);
          break;
        case 'voronoi':
          drawVoronoi(ctx, data, settings);
          break;
        case 'fractalTree':
          drawFractalTree(ctx, data, settings);
          break;
        case 'kaleidoscope':
          drawKaleidoscope(ctx, data, settings);
          break;
        case 'polyhedron':
          drawPolyhedron(ctx, data, settings);
          break;
        case 'sierpinski':
          drawSierpinski(ctx, data, settings);
          break;
        default:
          drawBars(ctx, data, settings);
      }

      // Title overlay
      if (settings.showTitle && settings.title) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(settings.title, canvasWidth / 2, canvasHeight - 30);
        ctx.restore();
      }

      // Render additional layers on top
      const enabledLayers = settings.layers.filter(l => l.enabled);
      for (const layer of enabledLayers) {
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        // Use layer-specific position and size
        const layerSettings = { ...settings, x: layer.x, y: layer.y, width: layer.width, height: layer.height };
        switch (layer.mode) {
          case 'bars': drawBars(ctx, data, layerSettings); break;
          case 'wave': drawWave(ctx, data, layerSettings); break;
          case 'circle': drawCircle(ctx, data, layerSettings); break;
          case 'particles': drawParticles(ctx, data, layerSettings, canvasWidth, canvasHeight); break;
          case 'spiral': drawSpiral(ctx, data, layerSettings); break;
          case 'rings': drawRings(ctx, data, layerSettings); break;
          case 'tunnel': drawTunnel(ctx, data, layerSettings); break;
          case 'flower': drawFlower(ctx, data, layerSettings); break;
          case 'starfield': drawStarfield(ctx, data, layerSettings, canvasWidth, canvasHeight); break;
          case 'dna': drawDNA(ctx, data, layerSettings); break;
          case 'aurora': drawAurora(ctx, data, layerSettings); break;
          case 'matrix': drawMatrix(ctx, data, layerSettings); break;
          case 'lissajous': drawLissajous(ctx, data, layerSettings); break;
          case 'plasma': drawPlasma(ctx, data, layerSettings); break;
          case 'vinyl': drawVinyl(ctx, data, layerSettings, vinylLabelObj); break;
          case 'voronoi': drawVoronoi(ctx, data, layerSettings); break;
          case 'fractalTree': drawFractalTree(ctx, data, layerSettings); break;
          case 'kaleidoscope': drawKaleidoscope(ctx, data, layerSettings); break;
          case 'polyhedron': drawPolyhedron(ctx, data, layerSettings); break;
          case 'sierpinski': drawSierpinski(ctx, data, layerSettings); break;
        }
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    }, [analyser, settings, backgroundImageObj]);

    useEffect(() => {
      if (analyser) {
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
    }, [analyser]);

  useEffect(() => {
    resetParticles();
    resetRotation();
    resetStarfield();
    resetMatrix();
    resetVoronoi();
  }, [settings.mode]);

    useEffect(() => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
      return () => cancelAnimationFrame(rafRef.current);
    }, [draw, isPlaying]);

    return (
      <canvas
        ref={canvasRef}
        width={settings.width}
        height={settings.height}
        className="w-full h-full object-contain rounded-xl"
      />
    );
  }
);

VisualizerCanvas.displayName = 'VisualizerCanvas';
export default VisualizerCanvas;
