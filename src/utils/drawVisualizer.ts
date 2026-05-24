import type { VisualizerSettings, Particle } from '../types';

let particles: Particle[] = [];
let hueShift = 0;
let globalRotation = 0;
let stars: { x: number; y: number; z: number; prevX: number; prevY: number }[] = [];
let matrixDrops: { x: number; y: number; speed: number; chars: string[]; len: number }[] = [];
let plasmaTime = 0;

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
}

function applyGlow(ctx: CanvasRenderingContext2D, color: string, strength: number) {
  ctx.shadowColor = color;
  ctx.shadowBlur = strength;
}

function clearGlow(ctx: CanvasRenderingContext2D) {
  ctx.shadowBlur = 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyUint8Array = any;

export function drawBars(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, barCount, sensitivity, mirrorBars, glow, glowColor, glowStrength, barStyle, bassBoost } = settings;
  const count = Math.min(barCount, dataArray.length);
  const step = Math.floor(dataArray.length / count);
  const barW = width / count - 1;

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  for (let i = 0; i < count; i++) {
    let val = dataArray[i * step] * sensitivity;
    // Bass boost: amplify low frequencies
    if (bassBoost > 0 && i < count * 0.2) {
      val = Math.min(255, val * (1 + bassBoost * 0.3));
    }
    const barH = (val / 255) * height;
    const t = i / count;
    const color = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);

    if (barStyle === 'outline') {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      if (mirrorBars) {
        ctx.strokeRect(x + i * (barW + 1), y + height / 2 - barH / 2, barW, barH);
      } else {
        ctx.strokeRect(x + i * (barW + 1), y + height - barH, barW, barH);
      }
    } else if (barStyle === 'rounded') {
      const radius = Math.min(barW / 2, 6);
      const bx = x + i * (barW + 1);
      const by = mirrorBars ? y + height / 2 - barH / 2 : y + height - barH;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(bx + radius, by);
      ctx.lineTo(bx + barW - radius, by);
      ctx.quadraticCurveTo(bx + barW, by, bx + barW, by + radius);
      ctx.lineTo(bx + barW, by + barH - radius);
      ctx.quadraticCurveTo(bx + barW, by + barH, bx + barW - radius, by + barH);
      ctx.lineTo(bx + radius, by + barH);
      ctx.quadraticCurveTo(bx, by + barH, bx, by + barH - radius);
      ctx.lineTo(bx, by + radius);
      ctx.quadraticCurveTo(bx, by, bx + radius, by);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      if (mirrorBars) {
        ctx.fillRect(x + i * (barW + 1), y + height / 2 - barH / 2, barW, barH);
      } else {
        ctx.fillRect(x + i * (barW + 1), y + height - barH, barW, barH);
      }
    }
  }

  clearGlow(ctx);
}

export function drawWave(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, lineWidth, glow, glowColor, glowStrength, waveStyle } = settings;
  const count = dataArray.length;
  const sliceW = width / count;

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  const gradient = ctx.createLinearGradient(x, y, x + width, y);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(0.5, colorMid);
  gradient.addColorStop(1, colorEnd);

  if (waveStyle === 'filled') {
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const v = (dataArray[i] / 128.0) * sensitivity;
      const py = y + (v * height) / 2;
      const px = x + i * sliceW;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (waveStyle === 'dots') {
    for (let i = 0; i < count; i += 2) {
      const v = (dataArray[i] / 128.0) * sensitivity;
      const py = y + (v * height) / 2;
      const px = x + i * sliceW;
      const t = i / count;
      ctx.fillStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
      ctx.beginPath();
      ctx.arc(px, py, lineWidth, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';

    for (let i = 0; i < count; i++) {
      const v = (dataArray[i] / 128.0) * sensitivity;
      const py = y + (v * height) / 2;
      const px = x + i * sliceW;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.stroke();
  }

  clearGlow(ctx);
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, barCount, sensitivity, lineWidth, glow, glowColor, glowStrength, innerRadius } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) * innerRadius;
  const count = Math.min(barCount, dataArray.length);
  const step = Math.floor(dataArray.length / count);

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  // Inner circle ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = colorStart + '44';
  ctx.lineWidth = 1;
  ctx.stroke();

  for (let i = 0; i < count; i++) {
    const val = dataArray[i * step] * sensitivity;
    const barH = (val / 255) * radius * 1.5;
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const t = i / count;

    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + barH);
    const y2 = cy + Math.sin(angle) * (radius + barH);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Mirror inside
    const x3 = cx - Math.cos(angle) * radius;
    const y3 = cy - Math.sin(angle) * radius;
    const x4 = cx - Math.cos(angle) * (radius + barH * 0.5);
    const y4 = cy - Math.sin(angle) * (radius + barH * 0.5);
    ctx.beginPath();
    ctx.moveTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.strokeStyle = lerpColor(colorEnd, colorMid, t) + '88';
    ctx.stroke();
  }

  clearGlow(ctx);
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings,
  _canvasWidth: number,
  _canvasHeight: number
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, particleCount, glow, glowColor, glowStrength, particleShape } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Get average energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  // Spawn particles
  const toSpawn = Math.floor(avg * 8);
  for (let i = 0; i < toSpawn && particles.length < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * avg * 6;
    particles.push({
      x: cx + (Math.random() - 0.5) * 20,
      y: cy + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 40 + Math.random() * 80,
      size: 2 + Math.random() * 4,
      color: Math.random() < 0.5 ? lerpColor(colorStart, colorMid, Math.random()) : lerpColor(colorMid, colorEnd, Math.random()),
      hue: hueShift,
    });
  }

  hueShift = (hueShift + 0.5) % 360;

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.5);

  // Update and draw
  particles = particles.filter(p => p.life < p.maxLife);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.vx *= 0.99;
    p.life++;

    const alpha = 1 - p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    const sz = p.size * alpha;
    if (particleShape === 'square') {
      ctx.fillRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
    } else if (particleShape === 'star') {
      ctx.beginPath();
      for (let j = 0; j < 5; j++) {
        const a1 = (j * 2 * Math.PI / 5) - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        ctx.lineTo(p.x + Math.cos(a1) * sz, p.y + Math.sin(a1) * sz);
        ctx.lineTo(p.x + Math.cos(a2) * sz * 0.4, p.y + Math.sin(a2) * sz * 0.4);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  clearGlow(ctx);
}

export function resetParticles() {
  particles = [];
}

export function incrementRotation(speed: number) {
  globalRotation = (globalRotation + speed) % 360;
}

export function resetRotation() {
  globalRotation = 0;
}

export function drawSpiral(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, scaleMultiplier, glow, glowColor, glowStrength } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 * scaleMultiplier;

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  ctx.beginPath();
  ctx.strokeStyle = colorStart;
  ctx.lineWidth = 2;

  const points = Math.min(dataArray.length, 256);
  for (let i = 0; i < points; i++) {
    const val = (dataArray[i] / 255) * sensitivity;
    const angle = (i / points) * Math.PI * 2 + (globalRotation * Math.PI / 180);
    const radius = (i / points) * maxRadius + val * maxRadius * 0.3;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    const t = i / points;
    ctx.strokeStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  clearGlow(ctx);
}

export function drawRings(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, ringCount, scaleMultiplier, glow, glowColor, glowStrength } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const maxRadius = Math.min(width, height) / 2 * scaleMultiplier;

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.5);

  const step = Math.floor(dataArray.length / ringCount);

  for (let i = 0; i < ringCount; i++) {
    const val = dataArray[i * step] * sensitivity;
    const ringRadius = ((i + 1) / ringCount) * maxRadius + (val / 255) * maxRadius * 0.2;
    const t = i / ringCount;

    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
    ctx.lineWidth = 2 + (val / 255) * 3;
    ctx.stroke();
  }

  clearGlow(ctx);
}

export function drawTunnel(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, scaleMultiplier, glow, glowColor, glowStrength } = settings;
  const cy = y + height / 2;
  const count = Math.min(64, dataArray.length);
  const step = Math.floor(dataArray.length / count);

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  for (let i = 0; i < count; i++) {
    const val = dataArray[i * step] * sensitivity;
    const depth = i / count;
    const scale = 0.2 + depth * 0.8;
    const barW = (width / count - 1) * scaleMultiplier * scale;
    const barH = (val / 255) * height * scaleMultiplier * scale;
    const t = i / count;

    ctx.fillStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
    const xPos = x + i * (width / count) + (width / count - barW) / 2;
    ctx.fillRect(xPos, cy - barH / 2, barW, barH);
  }

  clearGlow(ctx);
}

export function drawFlower(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, petalCount, scaleMultiplier, glow, glowColor, glowStrength } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const radius = Math.min(width, height) / 2 * scaleMultiplier;
  const count = Math.min(petalCount, dataArray.length);
  const step = Math.floor(dataArray.length / count);

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  for (let i = 0; i < count; i++) {
    const val = dataArray[i * step] * sensitivity;
    const petH = (val / 255) * radius * 0.6;
    const angle = (i / count) * Math.PI * 2 + (globalRotation * Math.PI / 180);
    const t = i / count;

    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * (radius + petH);
    const y2 = cy + Math.sin(angle) * (radius + petH);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  clearGlow(ctx);
}

// ─── Starfield ────────────────────────────────────────────────────────────────

export function resetStarfield() {
  stars = [];
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings,
  _canvasWidth: number,
  _canvasHeight: number
) {
  const { x, y, width, height, sensitivity, colorStart, colorEnd, glow, glowColor, glowStrength, starSpeed } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;

  // Get average energy for speed boost
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;
  const speed = (starSpeed + avg * 20) * 0.5;

  // Spawn new stars
  const toSpawn = Math.floor(2 + avg * 5);
  for (let i = 0; i < toSpawn && stars.length < 600; i++) {
    stars.push({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: width,
      prevX: 0,
      prevY: 0,
    });
  }

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.4);

  // Update and draw stars
  const nextStars: typeof stars = [];
  for (const s of stars) {
    s.prevX = (s.x / s.z) * width + cx;
    s.prevY = (s.y / s.z) * height + cy;
    s.z -= speed;
    const sx = (s.x / s.z) * width + cx;
    const sy = (s.y / s.z) * height + cy;

    if (s.z > 1 && sx > x - 50 && sx < x + width + 50 && sy > y - 50 && sy < y + height + 50) {
      const t = 1 - s.z / width;
      const brightness = Math.min(1, t * 2);
      ctx.strokeStyle = lerpColor(colorStart, colorEnd, t);
      ctx.globalAlpha = brightness;
      ctx.lineWidth = 1 + brightness * 2;
      ctx.beginPath();
      ctx.moveTo(s.prevX, s.prevY);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      nextStars.push(s);
    }
  }
  ctx.globalAlpha = 1;
  stars = nextStars;

  clearGlow(ctx);
}

// ─── DNA Helix ────────────────────────────────────────────────────────────────

export function drawDNA(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, scaleMultiplier, glow, glowColor, glowStrength, dnaStrands } = settings;
  const cy = y + height / 2;
  const amplitude = height * 0.3 * scaleMultiplier;
  const points = Math.min(dataArray.length, 200);
  const strandCount = dnaStrands;

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.6);

  for (let s = 0; s < strandCount; s++) {
    const phaseOffset = (s / strandCount) * Math.PI * 2;
    const color1 = s === 0 ? colorStart : s === 1 ? colorEnd : colorMid;
    const color2 = s === 0 ? colorEnd : s === 1 ? colorStart : colorMid;

    ctx.beginPath();
    ctx.strokeStyle = color1;
    ctx.lineWidth = 2;

    for (let i = 0; i < points; i++) {
      const t = i / points;
      const px = x + t * width;
      const val = dataArray[i] ? (dataArray[i] / 255) * sensitivity : 0;
      const wave = Math.sin(t * Math.PI * 6 + (globalRotation * Math.PI / 180) + phaseOffset);
      const py = cy + wave * (amplitude + val * amplitude * 0.5);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw connecting rungs between first two strands
    if (s === 0 && strandCount >= 2) {
      for (let i = 0; i < points; i += 8) {
        const t = i / points;
        const px = x + t * width;
        const val = dataArray[i] ? (dataArray[i] / 255) * sensitivity : 0;
        const wave1 = Math.sin(t * Math.PI * 6 + (globalRotation * Math.PI / 180));
        const wave2 = Math.sin(t * Math.PI * 6 + (globalRotation * Math.PI / 180) + Math.PI);
        const py1 = cy + wave1 * (amplitude + val * amplitude * 0.5);
        const py2 = cy + wave2 * (amplitude + val * amplitude * 0.5);

        ctx.beginPath();
        ctx.moveTo(px, py1);
        ctx.lineTo(px, py2);
        ctx.strokeStyle = lerpColor(color1, color2, 0.5) + '66';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  clearGlow(ctx);
}

// ─── Aurora ───────────────────────────────────────────────────────────────────

export function drawAurora(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, scaleMultiplier, glow, glowColor, glowStrength } = settings;
  const layers = 5;

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.8);

  for (let l = 0; l < layers; l++) {
    const t = l / layers;
    const baseY = y + height * (0.2 + t * 0.5);
    const amplitude = height * 0.15 * scaleMultiplier;

    const gradient = ctx.createLinearGradient(x, baseY - amplitude, x, baseY + amplitude);
    gradient.addColorStop(0, lerpColor(colorStart, colorMid, t) + '00');
    gradient.addColorStop(0.5, lerpColor(colorStart, colorEnd, t) + 'aa');
    gradient.addColorStop(1, lerpColor(colorEnd, colorMid, t) + '00');

    ctx.beginPath();
    ctx.moveTo(x, baseY);

    const points = Math.min(dataArray.length, 128);
    const step = Math.floor(dataArray.length / points);
    for (let i = 0; i <= points; i++) {
      const px = x + (i / points) * width;
      const val = dataArray[Math.min(i * step, dataArray.length - 1)] * sensitivity;
      const wave = Math.sin((i / points) * Math.PI * 3 + globalRotation * 0.02 + l * 0.8);
      const py = baseY + wave * (amplitude + (val / 255) * amplitude * 0.8);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  clearGlow(ctx);
}

// ─── Matrix Rain ──────────────────────────────────────────────────────────────

const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()ｱｲｳｴｵｶｷｸｹｺ';

export function resetMatrix() {
  matrixDrops = [];
}

export function drawMatrix(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, sensitivity, glow, glowColor, glowStrength, matrixDropSpeed } = settings;
  const fontSize = 14;
  const cols = Math.floor(width / fontSize);

  // Get bass energy for speed boost
  let bassSum = 0;
  const bassRange = Math.min(20, dataArray.length);
  for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
  const bassAvg = (bassSum / bassRange / 255) * sensitivity;
  const speed = (matrixDropSpeed + bassAvg * 8) * 0.3;

  // Initialize drops
  while (matrixDrops.length < cols) {
    matrixDrops.push({
      x: matrixDrops.length * fontSize,
      y: Math.random() * -height,
      speed: 0.5 + Math.random() * 1.5,
      chars: Array.from({ length: 20 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
      len: 8 + Math.floor(Math.random() * 16),
    });
  }

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.6);

  ctx.font = `${fontSize}px monospace`;

  for (const drop of matrixDrops) {
    drop.y += drop.speed * speed;

    for (let i = 0; i < drop.len; i++) {
      const charY = drop.y - i * fontSize;
      if (charY < y || charY > y + height) continue;

      const alpha = 1 - i / drop.len;
      if (i === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha;
      } else {
        const t = i / drop.len;
        ctx.fillStyle = lerpColor(colorStart, colorEnd, t);
        ctx.globalAlpha = alpha * 0.8;
      }
      ctx.fillText(drop.chars[i % drop.chars.length], x + drop.x, charY);
    }

    // Randomly change a character
    if (Math.random() < 0.05) {
      const idx = Math.floor(Math.random() * drop.chars.length);
      drop.chars[idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    }

    // Reset if off screen
    if (drop.y - drop.len * fontSize > y + height) {
      drop.y = y - Math.random() * height * 0.5;
      drop.speed = 0.5 + Math.random() * 1.5;
      drop.len = 8 + Math.floor(Math.random() * 16);
    }
  }

  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

// ─── Lissajous ────────────────────────────────────────────────────────────────

export function drawLissajous(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, scaleMultiplier, lineWidth, glow, glowColor, glowStrength, symmetry } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const maxR = Math.min(width, height) / 2 * scaleMultiplier;
  const points = Math.min(dataArray.length, 512);
  const a = symmetry;
  const b = symmetry + 1;
  const rot = globalRotation * Math.PI / 180;

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  ctx.beginPath();
  ctx.lineWidth = lineWidth;

  for (let i = 0; i < points; i++) {
    const t = (i / points) * Math.PI * 2;
    const val = dataArray[i] ? (dataArray[i] / 255) * sensitivity : 0;
    const modR = maxR * (0.5 + val * 0.5);
    const px = cx + Math.sin(a * t + rot) * modR;
    const py = cy + Math.sin(b * t) * modR;

    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }

  const gradient = ctx.createLinearGradient(cx - maxR, cy, cx + maxR, cy);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(0.5, colorMid);
  gradient.addColorStop(1, colorEnd);
  ctx.strokeStyle = gradient;
  ctx.stroke();

  clearGlow(ctx);
}

// ─── Plasma ───────────────────────────────────────────────────────────────────

export function drawPlasma(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, glow, glowColor, glowStrength, plasmaComplexity } = settings;
  const [r1, g1, b1] = hexToRgb(colorStart);
  const [r2, g2, b2] = hexToRgb(colorEnd);
  const [r3, g3, b3] = hexToRgb(colorMid);

  // Get average energy for animation intensity
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  plasmaTime += 0.03 + avg * 0.05;

  // Use a lower resolution for performance
  const res = 4;
  const cols = Math.ceil(width / res);
  const rows = Math.ceil(height / res);

  const imgData = ctx.createImageData(width, height);
  const data = imgData.data;

  const comp = plasmaComplexity;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = col * res;
      const py = row * res;

      const nx = (col / cols) * comp;
      const ny = (row / rows) * comp;

      let v = Math.sin(nx + plasmaTime);
      v += Math.sin(ny + plasmaTime * 0.5);
      v += Math.sin((nx + ny) * 0.5 + plasmaTime * 0.3);
      v += Math.sin(Math.sqrt(nx * nx + ny * ny) + plasmaTime * 0.7);
      v = (v / 4 + 1) * 0.5; // normalize to 0..1

      // Modulate with audio
      const freqIdx = Math.floor((col / cols) * Math.min(dataArray.length, 128));
      const audioVal = dataArray[freqIdx] ? (dataArray[freqIdx] / 255) * sensitivity : 0;
      v = v * (0.5 + audioVal * 0.5);

      // Map to 3-color gradient
      let r: number, g: number, b: number;
      if (v < 0.5) {
        const t = v * 2;
        r = r1 + (r3 - r1) * t;
        g = g1 + (g3 - g1) * t;
        b = b1 + (b3 - b1) * t;
      } else {
        const t = (v - 0.5) * 2;
        r = r3 + (r2 - r3) * t;
        g = g3 + (g2 - g3) * t;
        b = b3 + (b2 - b3) * t;
      }

      // Fill the res x res block
      for (let dy = 0; dy < res && py + dy < height; dy++) {
        for (let dx = 0; dx < res && px + dx < width; dx++) {
          const idx = ((py + dy) * width + (px + dx)) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imgData, x, y);

  if (glow) {
    applyGlow(ctx, glowColor, glowStrength * 0.3);
    ctx.fillStyle = 'transparent';
    ctx.fillRect(x, y, width, height);
    clearGlow(ctx);
  }
}

// ─── Vinyl Record ─────────────────────────────────────────────────────────────

// ─── Voronoi Cells ───────────────────────────────────────────────────────────

interface VoronoiSite {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

let voronoiSites: VoronoiSite[] = [];

export function resetVoronoi() {
  voronoiSites = [];
}

export function drawVoronoi(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, glow, glowColor, glowStrength, voronoiCellCount, voronoiNoiseScale } = settings;
  const cellCount = voronoiCellCount || 40;

  // Get average energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  // Initialize sites or adjust count
  if (voronoiSites.length === 0) {
    for (let i = 0; i < cellCount; i++) {
      voronoiSites.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: Math.random() < 0.5 ? colorStart : colorEnd,
      });
    }
  } else if (voronoiSites.length < cellCount) {
    // Add more sites to reach cellCount
    while (voronoiSites.length < cellCount) {
      voronoiSites.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: Math.random() < 0.5 ? colorStart : colorEnd,
      });
    }
  } else if (voronoiSites.length > cellCount) {
    // Remove excess sites
    voronoiSites.length = cellCount;
  }

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.5);

  // Update sites with audio + noise
  const noiseScale = voronoiNoiseScale || 3;
  for (let i = 0; i < voronoiSites.length; i++) {
    const site = voronoiSites[i];
    const freqIdx = Math.floor((i / voronoiSites.length) * Math.min(dataArray.length, 64));
    const audioForce = (dataArray[freqIdx] / 255) * sensitivity * 8;
    
    site.vx += (Math.random() - 0.5) * noiseScale * 0.1;
    site.vy += (Math.random() - 0.5) * noiseScale * 0.1;
    site.vx += Math.sin(Date.now() * 0.001 + i) * 0.3;
    site.vy += Math.cos(Date.now() * 0.001 + i) * 0.3;
    site.vx += (Math.random() - 0.5) * avg * 4;
    site.vy += (Math.random() - 0.5) * avg * 4;
    site.vx *= 0.95;
    site.vy *= 0.95;
    site.vx += audioForce * (Math.random() - 0.5);
    site.vy += audioForce * (Math.random() - 0.5);
    
    site.x += site.vx;
    site.y += site.vy;
    
    // Wrap around
    if (site.x < 0) site.x += width;
    if (site.x > width) site.x -= width;
    if (site.y < 0) site.y += height;
    if (site.y > height) site.y -= height;
    
    // Update color
    const t = (i / voronoiSites.length + Date.now() * 0.0001) % 1;
    site.color = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
  }

  // Draw cells using pixel-based approach for performance
  const res = 4;
  const cols = Math.ceil(width / res);
  const rows = Math.ceil(height / res);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = col * res;
      const py = row * res;
      
      // Find closest two sites
      let minDist1 = Infinity, minDist2 = Infinity;
      let closestIdx = 0;
      
      for (let i = 0; i < voronoiSites.length; i++) {
        const d = Math.hypot(px - voronoiSites[i].x, py - voronoiSites[i].y);
        if (d < minDist1) {
          minDist2 = minDist1;
          minDist1 = d;
          closestIdx = i;
        } else if (d < minDist2) {
          minDist2 = d;
        }
      }
      
      const edgeDist = minDist2 - minDist1;
      const site = voronoiSites[closestIdx];
      
      // Fill with cell color, edges get darker
      const edgeWidth = 2 + avg * 3;
      if (edgeDist < edgeWidth) {
        ctx.fillStyle = site.color + '33';
      } else {
        ctx.fillStyle = site.color;
      }
      ctx.globalAlpha = 0.3 + avg * 0.5;
      ctx.fillRect(x + px, y + py, res, res);
    }
  }
  
  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

// ─── Fractal Tree ─────────────────────────────────────────────────────────────

interface Branch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  depth: number;
  angle: number;
}

export function drawFractalTree(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, glow, glowColor, glowStrength, fractalDepth, fractalBranchAngle, rotationSpeed, bassBoost } = settings;
  const depth = fractalDepth || 8;
  const branchAngle = (fractalBranchAngle || 25) * Math.PI / 180;
  const cx = x + width / 2;
  const cy = y + height * 0.85;
  const trunkLen = height * 0.25;

  // Get bass energy
  let bassSum = 0;
  const bassRange = Math.min(20, dataArray.length);
  for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
  const bass = (bassSum / bassRange / 255) * sensitivity * (1 + bassBoost * 0.3);
  
  // Get overall energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.4);

  const branches: Branch[] = [];
  const rotOffset = (globalRotation * Math.PI / 180) * (rotationSpeed * 0.1);

  function growBranch(x1: number, y1: number, len: number, a: number, d: number) {
    if (d > depth) return;
    
    const x2 = x1 + Math.sin(a) * len;
    const y2 = y1 - Math.cos(a) * len;
    
    branches.push({ x1, y1, x2, y2, depth: d, angle: a });
    
    const newLen = len * 0.7;
    const audioMod = 1 + bass * Math.sin(Date.now() * 0.005 + d) * 0.3;
    
    growBranch(x2, y2, newLen * audioMod, a - branchAngle * (0.5 + avg * 0.3), d + 1);
    growBranch(x2, y2, newLen * audioMod, a + branchAngle * (0.5 + avg * 0.3), d + 1);
  }

  growBranch(cx, cy, trunkLen * (1 + bass * 0.2), rotOffset, 0);

  for (const branch of branches) {
    const t = branch.depth / depth;
    ctx.beginPath();
    ctx.moveTo(branch.x1, branch.y1);
    ctx.lineTo(branch.x2, branch.y2);
    ctx.strokeStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
    ctx.lineWidth = Math.max(1, (depth - branch.depth) * 1.5);
    ctx.stroke();
  }

  clearGlow(ctx);
}

// ─── Kaleidoscope ─────────────────────────────────────────────────────────────

export function drawKaleidoscope(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, glow, glowColor, glowStrength, kaleidoscopeSegments, scaleMultiplier, rotationSpeed } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const segments = kaleidoscopeSegments || 8;
  const maxR = Math.min(width, height) / 2 * scaleMultiplier;
  const rot = globalRotation * Math.PI / 180 * (rotationSpeed * 0.2);

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  // Get average energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  const segmentAngle = (Math.PI * 2) / segments;

  for (let s = 0; s < segments; s++) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot + s * segmentAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);

    const points = Math.min(dataArray.length, 128);
    const freqStep = Math.floor(points / 24);
    const segAngle = segmentAngle * 0.8;

    for (let i = 0; i < 24; i++) {
      const freqIdx = Math.min(i * freqStep, dataArray.length - 1);
      const val = dataArray[freqIdx] * sensitivity;
      const r = (i / 24) * maxR + (val / 255) * maxR * 0.5;
      const px = Math.cos(segAngle) * r;
      const py = -Math.sin(segAngle) * r;
      const t = i / 24;
      ctx.fillStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
      ctx.globalAlpha = 0.4 + avg * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, 3 + (val / 255) * 8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw connecting lines between segments
  ctx.globalAlpha = 0.3 + avg * 0.5;
  for (let s = 0; s < segments; s++) {
    const a1 = rot + s * segmentAngle;
    const a2 = rot + (s + 1) * segmentAngle;
    
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a1) * maxR * 0.3, cy + Math.sin(a1) * maxR * 0.3);
    ctx.lineTo(cx + Math.cos(a2) * maxR * 0.3, cy + Math.sin(a2) * maxR * 0.3);
    ctx.strokeStyle = colorMid;
    ctx.lineWidth = 1 + avg * 3;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

// ─── Polyhedron (3D shapes) ───────────────────────────────────────────────────

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function project3D(v: Vec3, cx: number, cy: number, scale: number): { x: number; y: number; z: number } {
  const fov = 300;
  const factor = fov / (fov + v.z + scale * 100);
  return {
    x: cx + v.x * factor,
    y: cy + v.y * factor,
    z: v.z,
  };
}

function rotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function rotateZ(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
}

export function drawPolyhedron(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, glow, glowColor, glowStrength, polyhedronShape, polyhedronSpeed, scaleMultiplier, bassBoost } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const baseScale = Math.min(width, height) * 0.25 * scaleMultiplier;
  const speed = (polyhedronSpeed || 2) * 0.01;

  // Get bass energy
  let bassSum = 0;
  const bassRange = Math.min(20, dataArray.length);
  for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
  const bass = (bassSum / bassRange / 255) * sensitivity * (1 + bassBoost * 0.5);

  // Get average energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  if (glow) applyGlow(ctx, glowColor, glowStrength);

  const shape = polyhedronShape || 'cube';
  let vertices: Vec3[];
  let edges: [number, number][];

  // Define polyhedra
  if (shape === 'cube') {
    const s = baseScale * (1 + bass * 0.2);
    vertices = [
      { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s },
      { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
      { x: -s, y: -s, z: s }, { x: s, y: -s, z: s },
      { x: s, y: s, z: s }, { x: -s, y: s, z: s },
    ];
    edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ];
  } else if (shape === 'octahedron') {
    const s = baseScale * (1 + bass * 0.3);
    vertices = [
      { x: 0, y: -s, z: 0 }, { x: s, y: 0, z: 0 },
      { x: 0, y: 0, z: s }, { x: -s, y: 0, z: 0 },
      { x: 0, y: s, z: 0 }, { x: 0, y: 0, z: -s },
    ];
    edges = [
      [0,1],[0,2],[0,3],[0,5],
      [4,1],[4,2],[4,3],[4,5],
      [1,2],[2,3],[3,1],
    ];
  } else if (shape === 'icosahedron') {
    const s = baseScale * (1 + bass * 0.25);
    const phi = 1.618;
    vertices = [
      { x: -s, y: s*phi, z: 0 }, { x: s, y: s*phi, z: 0 },
      { x: -s, y: -s*phi, z: 0 }, { x: s, y: -s*phi, z: 0 },
      { x: 0, y: -s, z: s*phi }, { x: 0, y: s, z: s*phi },
      { x: 0, y: -s, z: -s*phi }, { x: 0, y: s, z: -s*phi },
      { x: s*phi, y: 0, z: -s }, { x: s*phi, y: 0, z: s },
      { x: -s*phi, y: 0, z: -s }, { x: -s*phi, y: 0, z: s },
    ];
    edges = [
      [0,1],[0,5],[0,7],[0,10],[0,11],
      [1,5],[1,7],[1,8],[1,9],
      [2,3],[2,4],[2,6],[2,10],[2,11],
      [3,4],[3,6],[3,8],[3,9],
      [4,5],[4,9],[4,11],
      [6,7],[6,8],[6,10],
      [7,8],[7,9],[10,11],
    ];
  } else {
    // dodecahedron
    const s = baseScale * (1 + bass * 0.22);
    const phi = 1.618;
    vertices = [
      { x: s, y: s, z: s }, { x: s, y: s, z: -s },
      { x: s, y: -s, z: s }, { x: s, y: -s, z: -s },
      { x: -s, y: s, z: s }, { x: -s, y: s, z: -s },
      { x: -s, y: -s, z: s }, { x: -s, y: -s, z: -s },
      { x: 0, y: s/phi, z: s*phi }, { x: 0, y: s/phi, z: -s*phi },
      { x: 0, y: -s/phi, z: s*phi }, { x: 0, y: -s/phi, z: -s*phi },
      { x: s/phi, y: s, z: 0 }, { x: s/phi, y: -s, z: 0 },
      { x: -s/phi, y: s, z: 0 }, { x: -s/phi, y: -s, z: 0 },
      { x: s/phi, y: 0, z: s }, { x: s/phi, y: 0, z: -s },
      { x: -s/phi, y: 0, z: s }, { x: -s/phi, y: 0, z: -s },
    ];
    edges = [
      [0,2],[0,4],[0,12],[0,16],
      [1,3],[1,5],[1,13],[1,17],
      [2,6],[2,10],[2,14],
      [3,7],[3,11],[3,15],
      [4,8],[4,14],[4,18],
      [5,9],[5,13],[5,19],
      [6,10],[6,16],[6,18],
      [7,11],[7,17],[7,19],
      [8,10],[8,18],[9,11],[9,19],
      [12,16],[12,17],[13,16],[13,17],
      [14,18],[15,19],
    ];
  }

  const rotX = globalRotation * speed;
  const rotY = globalRotation * speed * 0.7 + bass * 0.3;
  const rotZ = globalRotation * speed * 0.3;

  // Transform and project vertices
  const projected = vertices.map(v => {
    let rotated = rotateY(rotateX(rotateZ(v, rotZ), rotX), rotY);
    return project3D(rotated, cx, cy, baseScale);
  });

  // Draw edges with audio-reactive thickness
  for (const [i, j] of edges) {
    const v1 = projected[i];
    const v2 = projected[j];
    
    ctx.beginPath();
    ctx.moveTo(v1.x, v1.y);
    ctx.lineTo(v2.x, v2.y);
    
    const dist = Math.hypot(v2.x - v1.x, v2.y - v1.y);
    const freqIdx = Math.floor((dist / (baseScale * 2)) * Math.min(dataArray.length, 32));
    const val = dataArray[freqIdx] ? (dataArray[freqIdx] / 255) * sensitivity : 0;
    
    const t = Math.min(1, Math.max(0, (v1.z + v2.z) / 2 / (baseScale * 2) + 0.5));
    ctx.strokeStyle = t < 0.5 ? lerpColor(colorStart, colorMid, t * 2) : lerpColor(colorMid, colorEnd, (t - 0.5) * 2);
    ctx.lineWidth = 1 + val * 4 + bass * 2;
    ctx.stroke();
  }

  // Draw vertices as glowing dots
  ctx.globalAlpha = 0.6 + avg * 0.4;
  for (const v of projected) {
    ctx.beginPath();
    ctx.arc(v.x, v.y, 3 + bass * 5, 0, Math.PI * 2);
    ctx.fillStyle = colorMid;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  clearGlow(ctx);
}

// ─── Sierpinski Triangle ──────────────────────────────────────────────────────

function drawSierpinskiTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  depth: number,
  color: string,
  alpha: number
) {
  if (depth === 0) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fill();
    return;
  }

  const mid1x = (x1 + x2) / 2;
  const mid1y = (y1 + y2) / 2;
  const mid2x = (x2 + x3) / 2;
  const mid2y = (y2 + y3) / 2;
  const mid3x = (x3 + x1) / 2;
  const mid3y = (y3 + y1) / 2;

  drawSierpinskiTriangle(ctx, x1, y1, mid1x, mid1y, mid3x, mid3y, depth - 1, color, alpha);
  drawSierpinskiTriangle(ctx, mid1x, mid1y, x2, y2, mid2x, mid2y, depth - 1, color, alpha * 0.8);
  drawSierpinskiTriangle(ctx, mid3x, mid3y, mid2x, mid2y, x3, y3, depth - 1, color, alpha * 0.6);
}

export function drawSierpinski(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, glow, glowColor, glowStrength, sierpinskiDepth, sierpinskiBassResponse, rotationSpeed } = settings;
  const depth = sierpinskiDepth || 6;
  const bassResponse = sierpinskiBassResponse || 1;

  // Get bass energy for pulsing
  let bassSum = 0;
  const bassRange = Math.min(30, dataArray.length);
  for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
  const bass = (bassSum / bassRange / 255) * sensitivity;

  // Get average energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  if (glow) applyGlow(ctx, glowColor, glowStrength * (0.5 + bass * 0.5));

  const cx = x + width / 2;
  const cy = y + height / 2;
  const baseSize = Math.min(width, height) * 0.4 * (1 + bass * bassResponse * 0.3);
  const rot = (globalRotation * Math.PI / 180) * (rotationSpeed * 0.15);

  // Equilateral triangle vertices
  const h = baseSize * Math.sqrt(3) / 2;
  const x1 = cx;
  const y1 = cy - h * 0.6;
  const x2 = cx - baseSize / 2;
  const y2 = cy + h * 0.4;
  const x3 = cx + baseSize / 2;
  const y3 = cy + h * 0.4;

  // Rotate entire triangle
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);
  
  function rotatePoint(px: number, py: number): [number, number] {
    const dx = px - cx;
    const dy = py - cy;
    return [cx + dx * cosR - dy * sinR, cy + dx * sinR + dy * cosR];
  }

  const [rx1, ry1] = rotatePoint(x1, y1);
  const [rx2, ry2] = rotatePoint(x2, y2);
  const [rx3, ry3] = rotatePoint(x3, y3);

  // Draw inverted triangle in center (hole)
  const mid1x = (rx1 + rx2) / 2;
  const mid1y = (ry1 + ry2) / 2;
  const mid2x = (rx2 + rx3) / 2;
  const mid2y = (ry2 + ry3) / 2;
  const mid3x = (rx3 + rx1) / 2;
  const mid3y = (ry3 + ry1) / 2;

  // Dynamic depth based on audio
  const dynamicDepth = Math.min(8, depth + Math.floor(bass * 2));

  // Draw outer filled triangles
  const alpha = 0.5 + avg * 0.4;
  
  // Three outer regions with gradient colors
  const grad1 = lerpColor(colorStart, colorMid, 0.3);
  const grad2 = lerpColor(colorMid, colorEnd, 0.5);
  const grad3 = lerpColor(colorEnd, colorStart, 0.7);

  ctx.globalAlpha = alpha;
  drawSierpinskiTriangle(ctx, rx1, ry1, mid1x, mid1y, mid3x, mid3y, dynamicDepth, grad1, alpha);
  drawSierpinskiTriangle(ctx, mid1x, mid1y, rx2, ry2, mid2x, mid2y, dynamicDepth, grad2, alpha * 0.7);
  drawSierpinskiTriangle(ctx, mid3x, mid3y, mid2x, mid2y, rx3, ry3, dynamicDepth, grad3, alpha * 0.5);

  // Draw center hole (inverted triangle)
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.moveTo(mid1x, mid1y);
  ctx.lineTo(mid2x, mid2y);
  ctx.lineTo(mid3x, mid3y);
  ctx.closePath();
  ctx.fillStyle = settings.backgroundColor;
  ctx.fill();

  // Pulsing center glow
  if (bass > 0.3) {
    ctx.globalAlpha = bass * 0.5;
    ctx.beginPath();
    ctx.moveTo(mid1x, mid1y);
    ctx.lineTo(mid2x, mid2y);
    ctx.lineTo(mid3x, mid3y);
    ctx.closePath();
    ctx.strokeStyle = colorMid;
    ctx.lineWidth = 2 + bass * 5;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  clearGlow(ctx);
}

export function drawVinyl(
  ctx: CanvasRenderingContext2D,
  dataArray: AnyUint8Array,
  settings: VisualizerSettings,
  vinylLabelImage: HTMLImageElement | null = null
) {
  const { x, y, width, height, colorStart, colorEnd, colorMid, sensitivity, scaleMultiplier, glow, glowColor, glowStrength } = settings;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const maxR = Math.min(width, height) / 2 * scaleMultiplier;
  const rot = globalRotation * Math.PI / 180;

  // Get bass energy for wobble
  let bassSum = 0;
  const bassRange = Math.min(20, dataArray.length);
  for (let i = 0; i < bassRange; i++) bassSum += dataArray[i];
  const bassAvg = (bassSum / bassRange / 255) * sensitivity;

  // Get overall energy
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
  const avg = (sum / dataArray.length / 255) * sensitivity;

  if (glow) applyGlow(ctx, glowColor, glowStrength * 0.3);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);

  // Outer rim (metallic edge)
  const rimGrad = ctx.createRadialGradient(0, 0, maxR * 0.95, 0, 0, maxR);
  rimGrad.addColorStop(0, '#333');
  rimGrad.addColorStop(0.5, '#666');
  rimGrad.addColorStop(1, '#222');
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  // Vinyl surface (dark with subtle sheen)
  const surfGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.94);
  surfGrad.addColorStop(0, '#111');
  surfGrad.addColorStop(0.3, '#1a1a1a');
  surfGrad.addColorStop(0.7, '#111');
  surfGrad.addColorStop(1, '#0d0d0d');
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.94, 0, Math.PI * 2);
  ctx.fillStyle = surfGrad;
  ctx.fill();

  // Grooves - concentric rings that react to audio
  const grooveCount = 40;
  for (let i = 0; i < grooveCount; i++) {
    const t = i / grooveCount;
    const grooveR = maxR * (0.25 + t * 0.68);
    const freqIdx = Math.floor(t * Math.min(dataArray.length, 128));
    const val = dataArray[freqIdx] ? (dataArray[freqIdx] / 255) * sensitivity : 0;
    const wobble = 1 + val * 0.01 * (1 + bassAvg * 2);

    ctx.beginPath();
    ctx.arc(0, 0, grooveR * wobble, 0, Math.PI * 2);
    const grooveAlpha = 0.08 + val * 0.15;
    ctx.strokeStyle = `rgba(255,255,255,${grooveAlpha})`;
    ctx.lineWidth = 0.5 + val * 1.5;
    ctx.stroke();
  }

  // Light reflection streak (rotating sheen)
  ctx.save();
  ctx.rotate(-rot * 0.3); // slower counter-rotation for sheen
  const sheenGrad = ctx.createLinearGradient(-maxR, -maxR * 0.1, maxR, maxR * 0.1);
  sheenGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(0.45, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  sheenGrad.addColorStop(0.55, 'rgba(255,255,255,0)');
  sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.93, 0, Math.PI * 2);
  ctx.fillStyle = sheenGrad;
  ctx.fill();
  ctx.restore();

  // Label (center circle)
  const labelR = maxR * 0.22;
  if (vinylLabelImage) {
    // Draw custom label image
    ctx.save();
    ctx.rotate(-rot); // counter-rotate so image stays readable
    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    ctx.clip();
    const imgRatio = vinylLabelImage.width / vinylLabelImage.height;
    let dw = labelR * 2, dh = labelR * 2;
    if (imgRatio > 1) {
      dw = dh * imgRatio;
    } else {
      dh = dw / imgRatio;
    }
    ctx.drawImage(vinylLabelImage, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    // Label ring
    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    ctx.strokeStyle = colorEnd + '88';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Procedural label gradient
    const labelGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, labelR);
    labelGrad.addColorStop(0, colorMid);
    labelGrad.addColorStop(0.6, colorStart);
    labelGrad.addColorStop(1, colorEnd);
    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    ctx.fillStyle = labelGrad;
    ctx.fill();

    // Label ring
    ctx.beginPath();
    ctx.arc(0, 0, labelR, 0, Math.PI * 2);
    ctx.strokeStyle = colorEnd + '88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label text (rotates with the record)
    ctx.save();
    ctx.rotate(-rot); // counter-rotate so text stays readable
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.max(10, labelR * 0.35)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.9;
    ctx.fillText('♪', 0, -labelR * 0.15);
    ctx.font = `${Math.max(7, labelR * 0.2)}px Inter, sans-serif`;
    ctx.globalAlpha = 0.6;
    ctx.fillText('VINYL', 0, labelR * 0.25);
    ctx.restore();
  }

  // Spindle hole
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.03, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // Audio-reactive highlight ring
  if (avg > 0.3) {
    ctx.beginPath();
    ctx.arc(0, 0, maxR * (0.25 + avg * 0.1), 0, Math.PI * 2);
    ctx.strokeStyle = colorStart + Math.floor(avg * 80).toString(16).padStart(2, '0');
    ctx.lineWidth = 1 + avg * 3;
    ctx.stroke();
  }

  ctx.restore();

  // Tonearm (doesn't rotate, stays fixed)
  const armBaseX = cx + maxR * 0.85;
  const armBaseY = cy - maxR * 0.85;
  const armLen = maxR * 0.75;
  const armAngle = Math.PI * 0.55 + bassAvg * 0.05; // slight wobble with bass

  ctx.save();
  ctx.translate(armBaseX, armBaseY);
  ctx.rotate(armAngle);

  // Arm shadow
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(armLen, 2);
  ctx.stroke();

  // Arm
  const armGrad = ctx.createLinearGradient(0, 0, armLen, 0);
  armGrad.addColorStop(0, '#888');
  armGrad.addColorStop(0.5, '#ccc');
  armGrad.addColorStop(1, '#999');
  ctx.strokeStyle = armGrad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(armLen, 0);
  ctx.stroke();

  // Cartridge/headshell at the end
  ctx.fillStyle = '#aaa';
  ctx.fillRect(armLen - 8, -4, 12, 8);

  // Needle tip
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(armLen + 4, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Arm pivot base
  ctx.beginPath();
  ctx.arc(armBaseX, armBaseY, 6, 0, Math.PI * 2);
  const pivotGrad = ctx.createRadialGradient(armBaseX, armBaseY, 0, armBaseX, armBaseY, 6);
  pivotGrad.addColorStop(0, '#ccc');
  pivotGrad.addColorStop(1, '#666');
  ctx.fillStyle = pivotGrad;
  ctx.fill();

  clearGlow(ctx);
}
