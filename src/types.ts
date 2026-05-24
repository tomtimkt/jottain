export type VisualizationMode = 'bars' | 'wave' | 'circle' | 'particles' | 'spiral' | 'rings' | 'tunnel' | 'flower' | 'starfield' | 'dna' | 'aurora' | 'matrix' | 'lissajous' | 'plasma' | 'vinyl';

export type BarStyle = 'filled' | 'outline' | 'rounded';
export type WaveStyle = 'line' | 'filled' | 'dots';
export type ParticleShape = 'circle' | 'square' | 'star';

export interface VisualizerSettings {
  mode: VisualizationMode;
  x: number;
  y: number;
  width: number;
  height: number;
  colorStart: string;
  colorEnd: string;
  colorMid: string;
  barCount: number;
  sensitivity: number;
  backgroundImage: string | null;
  backgroundOpacity: number;
  backgroundColor: string;
  showTitle: boolean;
  title: string;
  smoothing: number;
  particleCount: number;
  lineWidth: number;
  mirrorBars: boolean;
  glow: boolean;
  glowColor: string;
  glowStrength: number;
  rotationSpeed: number;
  trailStrength: number;
  scaleMultiplier: number;
  petalCount: number;
  ringCount: number;
  barStyle: BarStyle;
  waveStyle: WaveStyle;
  particleShape: ParticleShape;
  symmetry: number;
  bassBoost: number;
  colorCycleSpeed: number;
  innerRadius: number;
  starSpeed: number;
  dnaStrands: number;
  matrixDropSpeed: number;
  plasmaComplexity: number;
  bgImageWidth: number;
  bgImageHeight: number;
  bgImageX: number;
  bgImageY: number;
  layers: LayerConfig[];
  activeTemplate: string;
  vinylLabelImage: string | null;
  videoFormat: 'webm' | 'mp4';
}

export interface LayerConfig {
  mode: VisualizationMode;
  opacity: number;
  enabled: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TemplatePreset {
  id: string;
  label: string;
  icon: string;
  settings: Partial<VisualizerSettings>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  hue: number;
}
