import React from 'react';
import type { VisualizerSettings, VisualizationMode, BarStyle, WaveStyle, ParticleShape, TemplatePreset } from '../types';

interface Props {
  settings: VisualizerSettings;
  onChange: (patch: Partial<VisualizerSettings>) => void;
  onBgImageChange: (file: File | null) => void;
  bgImageName: string;
  templates: TemplatePreset[];
  onApplyTemplate: (template: TemplatePreset) => void;
  vinylLabelName: string;
  onVinylLabelChange: (file: File | null) => void;
}

const MODES: { id: VisualizationMode; label: string; icon: string }[] = [
  { id: 'bars', label: 'Bars', icon: '📊' },
  { id: 'wave', label: 'Wave', icon: '〰️' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'particles', label: 'Particles', icon: '✨' },
  { id: 'spiral', label: 'Spiral', icon: '🌀' },
  { id: 'rings', label: 'Rings', icon: '⭕' },
  { id: 'tunnel', label: 'Tunnel', icon: '🕳️' },
  { id: 'flower', label: 'Flower', icon: '🌸' },
  { id: 'starfield', label: 'Starfield', icon: '🌟' },
  { id: 'dna', label: 'DNA', icon: '🧬' },
  { id: 'aurora', label: 'Aurora', icon: '🌌' },
  { id: 'matrix', label: 'Matrix', icon: '💚' },
  { id: 'lissajous', label: 'Lissajous', icon: '♾️' },
  { id: 'plasma', label: 'Plasma', icon: '🔥' },
  { id: 'vinyl', label: 'Vinyl', icon: '💿' },
  { id: 'voronoi', label: 'Voronoi', icon: '🔷' },
  { id: 'fractalTree', label: 'Fractal Tree', icon: '🌲' },
  { id: 'kaleidoscope', label: 'Kaleidoscope', icon: '🪩' },
  { id: 'polyhedron', label: 'Polyhedron', icon: '💎' },
  { id: 'sierpinski', label: 'Sierpinski', icon: '🔺' },
];

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{children}</label>;
}

function Slider({
  label, min, max, step = 1, value, onChange
}: {
  label: string; min: number; max: number; step?: number; value: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <Label>{label}</Label>
        <span className="text-xs text-cyan-400 font-mono">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-400"
      />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-10 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
        />
        <span className="text-xs font-mono text-slate-400">{value}</span>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${value ? 'bg-cyan-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );
}

function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="w-full bg-slate-700 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function SettingsPanel({ settings, onChange, onBgImageChange, bgImageName, templates, onApplyTemplate, vinylLabelName, onVinylLabelChange }: Props) {
  return (
    <div className="flex flex-col gap-3 text-white">

      {/* Templates */}
      <div>
        <Label>Templates</Label>
        <div className="grid grid-cols-2 gap-1">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => onApplyTemplate(t)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${settings.activeTemplate === t.id
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Mode */}
      <div>
        <Label>Visualization Mode</Label>
        <div className="grid grid-cols-2 gap-1">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => onChange({ mode: m.id })}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                ${settings.mode === m.id
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              <span>{m.icon}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Position X / Y */}
      <div className="grid grid-cols-2 gap-3">
        <Slider label="Position X" min={0} max={1920} step={5} value={settings.x} onChange={v => onChange({ x: v })} />
        <Slider label="Position Y" min={0} max={1080} step={5} value={settings.y} onChange={v => onChange({ y: v })} />
      </div>

      {/* Size */}
      <div className="grid grid-cols-2 gap-3">
        <Slider label="Width" min={100} max={1920} step={10} value={settings.width} onChange={v => onChange({ width: v })} />
        <Slider label="Height" min={100} max={1080} step={10} value={settings.height} onChange={v => onChange({ height: v })} />
      </div>

      {/* Colors */}
      <div className="grid grid-cols-2 gap-3">
        <ColorPicker label="Color Start" value={settings.colorStart} onChange={v => onChange({ colorStart: v })} />
        <ColorPicker label="Color End" value={settings.colorEnd} onChange={v => onChange({ colorEnd: v })} />
      </div>
      <ColorPicker label="Color Mid" value={settings.colorMid} onChange={v => onChange({ colorMid: v })} />

      {/* ── Mode-specific settings ────────────────────────────── */}

      {/* Bars */}
      {settings.mode === 'bars' && (
        <>
          <Slider label="Bar Count" min={16} max={256} value={settings.barCount} onChange={v => onChange({ barCount: v })} />
          <Select<BarStyle> label="Bar Style" value={settings.barStyle} onChange={v => onChange({ barStyle: v })} options={[
            { value: 'filled', label: 'Filled' },
            { value: 'outline', label: 'Outline' },
            { value: 'rounded', label: 'Rounded' },
          ]} />
          <Toggle label="Mirror Bars" value={settings.mirrorBars} onChange={() => onChange({ mirrorBars: !settings.mirrorBars })} />
        </>
      )}

      {/* Wave */}
      {settings.mode === 'wave' && (
        <>
          <Slider label="Line Width" min={1} max={10} step={0.5} value={settings.lineWidth} onChange={v => onChange({ lineWidth: v })} />
          <Select<WaveStyle> label="Wave Style" value={settings.waveStyle} onChange={v => onChange({ waveStyle: v })} options={[
            { value: 'line', label: 'Line' },
            { value: 'filled', label: 'Filled' },
            { value: 'dots', label: 'Dots' },
          ]} />
        </>
      )}

      {/* Circle */}
      {settings.mode === 'circle' && (
        <>
          <Slider label="Bar Count" min={16} max={256} value={settings.barCount} onChange={v => onChange({ barCount: v })} />
          <Slider label="Line Width" min={1} max={10} step={0.5} value={settings.lineWidth} onChange={v => onChange({ lineWidth: v })} />
          <Slider label="Inner Radius" min={0.05} max={0.5} step={0.01} value={settings.innerRadius} onChange={v => onChange({ innerRadius: v })} />
        </>
      )}

      {/* Particles */}
      {settings.mode === 'particles' && (
        <>
          <Slider label="Max Particles" min={50} max={2000} value={settings.particleCount} onChange={v => onChange({ particleCount: v })} />
          <Select<ParticleShape> label="Particle Shape" value={settings.particleShape} onChange={v => onChange({ particleShape: v })} options={[
            { value: 'circle', label: 'Circle' },
            { value: 'square', label: 'Square' },
            { value: 'star', label: 'Star' },
          ]} />
        </>
      )}

      {/* Spiral / Rings / Tunnel / Flower */}
      {(settings.mode === 'spiral' || settings.mode === 'rings' || settings.mode === 'tunnel' || settings.mode === 'flower') && (
        <>
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
          <Slider label="Scale Multiplier" min={0.5} max={2.5} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
        </>
      )}

      {settings.mode === 'rings' && (
        <Slider label="Ring Count" min={3} max={24} value={settings.ringCount} onChange={v => onChange({ ringCount: Math.round(v) })} />
      )}

      {settings.mode === 'flower' && (
        <Slider label="Petal Count" min={6} max={32} value={settings.petalCount} onChange={v => onChange({ petalCount: Math.round(v) })} />
      )}

      {/* Starfield */}
      {settings.mode === 'starfield' && (
        <Slider label="Star Speed" min={1} max={20} step={0.5} value={settings.starSpeed} onChange={v => onChange({ starSpeed: v })} />
      )}

      {/* DNA */}
      {settings.mode === 'dna' && (
        <>
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
          <Slider label="Scale Multiplier" min={0.5} max={2.5} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
          <Slider label="DNA Strands" min={2} max={6} step={1} value={settings.dnaStrands} onChange={v => onChange({ dnaStrands: Math.round(v) })} />
        </>
      )}

      {/* Aurora */}
      {settings.mode === 'aurora' && (
        <>
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
          <Slider label="Scale Multiplier" min={0.5} max={2.5} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
        </>
      )}

      {/* Matrix */}
      {settings.mode === 'matrix' && (
        <Slider label="Drop Speed" min={1} max={10} step={0.5} value={settings.matrixDropSpeed} onChange={v => onChange({ matrixDropSpeed: v })} />
      )}

      {/* Lissajous */}
      {settings.mode === 'lissajous' && (
        <>
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
          <Slider label="Scale Multiplier" min={0.5} max={2.5} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
          <Slider label="Line Width" min={1} max={10} step={0.5} value={settings.lineWidth} onChange={v => onChange({ lineWidth: v })} />
          <Slider label="Symmetry" min={1} max={12} step={1} value={settings.symmetry} onChange={v => onChange({ symmetry: Math.round(v) })} />
        </>
      )}

      {/* Plasma */}
      {settings.mode === 'plasma' && (
        <Slider label="Plasma Complexity" min={2} max={20} step={1} value={settings.plasmaComplexity} onChange={v => onChange({ plasmaComplexity: Math.round(v) })} />
      )}

      {/* Voronoi */}
      {settings.mode === 'voronoi' && (
        <>
          <Slider label="Cell Count" min={10} max={100} step={1} value={settings.voronoiCellCount || 40} onChange={v => onChange({ voronoiCellCount: Math.round(v) })} />
          <Slider label="Noise Scale" min={1} max={10} step={0.5} value={settings.voronoiNoiseScale || 3} onChange={v => onChange({ voronoiNoiseScale: v })} />
        </>
      )}

      {/* Fractal Tree */}
      {settings.mode === 'fractalTree' && (
        <>
          <Slider label="Tree Depth" min={3} max={12} step={1} value={settings.fractalDepth || 8} onChange={v => onChange({ fractalDepth: Math.round(v) })} />
          <Slider label="Branch Angle" min={10} max={45} step={1} value={settings.fractalBranchAngle || 25} onChange={v => onChange({ fractalBranchAngle: Math.round(v) })} />
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
        </>
      )}

      {/* Kaleidoscope */}
      {settings.mode === 'kaleidoscope' && (
        <>
          <Slider label="Segments" min={4} max={24} step={1} value={settings.kaleidoscopeSegments || 8} onChange={v => onChange({ kaleidoscopeSegments: Math.round(v) })} />
          <Slider label="Scale Multiplier" min={0.5} max={2.5} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
        </>
      )}

      {/* Polyhedron */}
      {settings.mode === 'polyhedron' && (
        <>
          <Select<typeof settings.polyhedronShape> label="Shape" value={settings.polyhedronShape || 'cube'} onChange={v => onChange({ polyhedronShape: v })} options={[
            { value: 'cube', label: 'Cube' },
            { value: 'octahedron', label: 'Octahedron' },
            { value: 'icosahedron', label: 'Icosahedron' },
            { value: 'dodecahedron', label: 'Dodecahedron' },
          ]} />
          <Slider label="Rotation Speed" min={0.5} max={10} step={0.1} value={settings.polyhedronSpeed || 2} onChange={v => onChange({ polyhedronSpeed: v })} />
          <Slider label="Scale Multiplier" min={0.5} max={2.5} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
        </>
      )}

      {/* Sierpinski */}
      {settings.mode === 'sierpinski' && (
        <>
          <Slider label="Recursion Depth" min={3} max={8} step={1} value={settings.sierpinskiDepth || 6} onChange={v => onChange({ sierpinskiDepth: Math.round(v) })} />
          <Slider label="Bass Response" min={0} max={3} step={0.1} value={settings.sierpinskiBassResponse || 1} onChange={v => onChange({ sierpinskiBassResponse: v })} />
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
        </>
      )}

      {/* Vinyl */}
      {settings.mode === 'vinyl' && (
        <>
          <Slider label="Rotation Speed" min={0} max={12} step={0.1} value={settings.rotationSpeed} onChange={v => onChange({ rotationSpeed: v })} />
          <Slider label="Scale Multiplier" min={0.3} max={2} step={0.05} value={settings.scaleMultiplier} onChange={v => onChange({ scaleMultiplier: v })} />
          <div>
            <Label>Vinyl Label Image</Label>
            <label className="flex items-center gap-2 cursor-pointer bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-2 transition-colors text-sm">
              <span className="text-lg">💿</span>
              <span className="text-slate-300 truncate flex-1">{vinylLabelName || 'Choose Label Image...'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  onVinylLabelChange(f);
                }}
              />
            </label>
            {vinylLabelName && (
              <button
                onClick={() => onVinylLabelChange(null)}
                className="mt-1 text-xs text-red-400 hover:text-red-300"
              >✕ Remove label image</button>
            )}
          </div>
        </>
      )}

      {/* ── Universal settings ──────────────────────────────── */}

      <Slider label="Trail Strength" min={0} max={0.95} step={0.01} value={settings.trailStrength} onChange={v => onChange({ trailStrength: v })} />

      {/* Sensitivity */}
      <Slider label="Sensitivity" min={0.2} max={3} step={0.05} value={settings.sensitivity} onChange={v => onChange({ sensitivity: v })} />

      {/* Smoothing */}
      <Slider label="Smoothing" min={0} max={0.99} step={0.01} value={settings.smoothing} onChange={v => onChange({ smoothing: v })} />

      {/* Bass Boost */}
      <Slider label="Bass Boost" min={0} max={10} step={0.5} value={settings.bassBoost} onChange={v => onChange({ bassBoost: v })} />

      {/* Color Cycle Speed */}
      <Slider label="Color Cycle Speed" min={0} max={10} step={0.1} value={settings.colorCycleSpeed} onChange={v => onChange({ colorCycleSpeed: v })} />

      {/* Glow */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Glow Effect</Label>
          <button
            onClick={() => onChange({ glow: !settings.glow })}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${settings.glow ? 'bg-cyan-500' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${settings.glow ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        {settings.glow && (
          <div className="grid grid-cols-2 gap-3 pl-2 border-l-2 border-cyan-500/30">
            <ColorPicker label="Glow Color" value={settings.glowColor} onChange={v => onChange({ glowColor: v })} />
            <Slider label="Glow Strength" min={5} max={80} value={settings.glowStrength} onChange={v => onChange({ glowStrength: v })} />
          </div>
        )}
      </div>

      {/* Background */}
      <div className="border-t border-slate-700 pt-4">
        <Label>Background</Label>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <ColorPicker label="BG Color" value={settings.backgroundColor} onChange={v => onChange({ backgroundColor: v })} />
        </div>

        <div className="mb-3">
          <Label>Background Image</Label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-2 transition-colors text-sm">
            <span className="text-lg">🖼️</span>
            <span className="text-slate-300 truncate flex-1">{bgImageName || 'Choose Image...'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0] ?? null;
                onBgImageChange(f);
              }}
            />
          </label>
          {bgImageName && (
            <button
              onClick={() => onBgImageChange(null)}
              className="mt-1 text-xs text-red-400 hover:text-red-300"
            >✕ Remove image</button>
          )}
        </div>

        {bgImageName && (
          <>
            <Slider label="BG Opacity" min={0} max={1} step={0.01} value={settings.backgroundOpacity} onChange={v => onChange({ backgroundOpacity: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Slider label="BG Width" min={100} max={1920} step={10} value={settings.bgImageWidth} onChange={v => onChange({ bgImageWidth: v })} />
              <Slider label="BG Height" min={100} max={1080} step={10} value={settings.bgImageHeight} onChange={v => onChange({ bgImageHeight: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Slider label="BG X" min={-500} max={500} step={5} value={settings.bgImageX} onChange={v => onChange({ bgImageX: v })} />
              <Slider label="BG Y" min={-500} max={500} step={5} value={settings.bgImageY} onChange={v => onChange({ bgImageY: v })} />
            </div>
          </>
        )}
      </div>

      {/* Layers (overlay modes) */}
      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center justify-between mb-2">
          <Label>Overlay Layers</Label>
          <button
            onClick={() => onChange({ layers: [...settings.layers, { mode: 'particles' as VisualizationMode, opacity: 0.5, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] })}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
          >+ Add Layer</button>
        </div>
        {settings.layers.length === 0 && (
          <p className="text-xs text-slate-500 italic">No overlay layers. Add one to stack effects.</p>
        )}
        {settings.layers.map((layer, idx) => (
          <div key={idx} className="bg-slate-800 rounded-lg p-2 mb-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <select
                value={layer.mode}
                onChange={e => {
                  const newLayers = [...settings.layers];
                  newLayers[idx] = { ...newLayers[idx], mode: e.target.value as VisualizationMode };
                  onChange({ layers: newLayers });
                }}
                className="flex-1 bg-slate-700 text-white rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {MODES.map(m => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
              </select>
              <Toggle label="" value={layer.enabled} onChange={() => {
                const newLayers = [...settings.layers];
                newLayers[idx] = { ...newLayers[idx], enabled: !newLayers[idx].enabled };
                onChange({ layers: newLayers });
              }} />
              <button
                onClick={() => onChange({ layers: settings.layers.filter((_, i) => i !== idx) })}
                className="text-red-400 hover:text-red-300 text-xs font-bold px-1"
              >✕</button>
            </div>
            {layer.enabled && (
              <>
                <Slider label="Opacity" min={0.05} max={1} step={0.05} value={layer.opacity} onChange={v => {
                  const newLayers = [...settings.layers];
                  newLayers[idx] = { ...newLayers[idx], opacity: v };
                  onChange({ layers: newLayers });
                }} />
                <div className="grid grid-cols-2 gap-2">
                  <Slider label="X" min={0} max={1920} step={5} value={layer.x} onChange={v => {
                    const newLayers = [...settings.layers];
                    newLayers[idx] = { ...newLayers[idx], x: v };
                    onChange({ layers: newLayers });
                  }} />
                  <Slider label="Y" min={0} max={1080} step={5} value={layer.y} onChange={v => {
                    const newLayers = [...settings.layers];
                    newLayers[idx] = { ...newLayers[idx], y: v };
                    onChange({ layers: newLayers });
                  }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Slider label="Width" min={100} max={1920} step={10} value={layer.width} onChange={v => {
                    const newLayers = [...settings.layers];
                    newLayers[idx] = { ...newLayers[idx], width: v };
                    onChange({ layers: newLayers });
                  }} />
                  <Slider label="Height" min={100} max={1080} step={10} value={layer.height} onChange={v => {
                    const newLayers = [...settings.layers];
                    newLayers[idx] = { ...newLayers[idx], height: v };
                    onChange({ layers: newLayers });
                  }} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Title */}
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <Label>Show Title</Label>
          <button
            onClick={() => onChange({ showTitle: !settings.showTitle })}
            className={`w-12 h-6 rounded-full transition-colors duration-200 relative ${settings.showTitle ? 'bg-cyan-500' : 'bg-slate-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${settings.showTitle ? 'translate-x-6' : ''}`} />
          </button>
        </div>
        {settings.showTitle && (
          <input
            type="text"
            value={settings.title}
            onChange={e => onChange({ title: e.target.value })}
            placeholder="Enter title..."
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-500"
          />
        )}
      </div>

      {/* Export */}
      <div className="border-t border-slate-700 pt-4">
        <Label>Video Export Format</Label>
        <Select
          label=""
          value={settings.videoFormat}
          onChange={v => onChange({ videoFormat: v as 'webm' | 'mp4' })}
          options={[
            { value: 'webm', label: 'WebM (.webm)' },
            { value: 'mp4', label: 'MP4 (.mp4)' },
          ]}
        />
      </div>
    </div>
  );
}
