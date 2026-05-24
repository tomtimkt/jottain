import { useState, useRef, useCallback, useEffect } from 'react';
import type { VisualizerSettings, TemplatePreset } from './types';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { useCanvasRecorder } from './hooks/useCanvasRecorder';
import VisualizerCanvas from './components/VisualizerCanvas';
import type { VisualizerCanvasRef } from './components/VisualizerCanvas';
import SettingsPanel from './components/SettingsPanel';
import AudioPlayer from './components/AudioPlayer';

const DEFAULT_SETTINGS: VisualizerSettings = {
  mode: 'bars',
  x: 0,
  y: 60,
  width: 1280,
  height: 600,
  colorStart: '#00e5ff',
  colorEnd: '#a855f7',
  colorMid: '#ff4081',
  barCount: 80,
  sensitivity: 1.2,
  backgroundImage: null,
  backgroundOpacity: 0.7,
  backgroundColor: '#0a0a1a',
  showTitle: false,
  title: '',
  smoothing: 0.8,
  particleCount: 800,
  lineWidth: 3,
  mirrorBars: false,
  glow: true,
  glowColor: '#00e5ff',
  glowStrength: 20,
  rotationSpeed: 2,
  trailStrength: 0,
  scaleMultiplier: 1,
  petalCount: 8,
  ringCount: 8,
  barStyle: 'filled',
  waveStyle: 'line',
  particleShape: 'circle',
  symmetry: 3,
  bassBoost: 0,
  colorCycleSpeed: 0,
  innerRadius: 0.25,
  starSpeed: 5,
  dnaStrands: 2,
  matrixDropSpeed: 3,
  plasmaComplexity: 8,
  voronoiCellCount: 40,
  voronoiNoiseScale: 3,
  fractalDepth: 8,
  fractalBranchAngle: 25,
  kaleidoscopeSegments: 8,
  polyhedronShape: 'cube',
  polyhedronSpeed: 2,
  sierpinskiDepth: 6,
  sierpinskiBassResponse: 1,
  bgImageWidth: 1280,
  bgImageHeight: 720,
  bgImageX: 0,
  bgImageY: 0,
  layers: [],
  activeTemplate: '',
  vinylLabelImage: null,
  videoFormat: 'webm',
};

export const TEMPLATES: TemplatePreset[] = [
  {
    id: 'default',
    label: 'Default',
    icon: '🎛️',
    settings: { mode: 'bars', colorStart: '#00e5ff', colorEnd: '#a855f7', colorMid: '#ff4081', backgroundColor: '#0a0a1a', layers: [] },
  },
  {
    id: 'retro-vinyl',
    label: 'Retro Vinyl',
    icon: '💿',
    settings: { mode: 'vinyl', colorStart: '#ff6b35', colorEnd: '#d62828', colorMid: '#fcbf49', backgroundColor: '#1a1a2e', rotationSpeed: 3, scaleMultiplier: 1.1, layers: [] },
  },
  {
    id: 'neon-party',
    label: 'Neon Party',
    icon: '🎉',
    settings: { mode: 'bars', colorStart: '#ff00ff', colorEnd: '#00ffff', colorMid: '#ffff00', backgroundColor: '#0a001a', glow: true, glowStrength: 40, barStyle: 'rounded', bassBoost: 3, layers: [{ mode: 'particles', opacity: 0.3, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] },
  },
  {
    id: 'chill-aurora',
    label: 'Chill Aurora',
    icon: '🌌',
    settings: { mode: 'aurora', colorStart: '#43e97b', colorEnd: '#38f9d7', colorMid: '#667eea', backgroundColor: '#0c0c1f', sensitivity: 0.8, rotationSpeed: 1, layers: [{ mode: 'starfield', opacity: 0.5, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] },
  },
  {
    id: 'matrix-hacker',
    label: 'Matrix Hacker',
    icon: '💚',
    settings: { mode: 'matrix', colorStart: '#00ff41', colorEnd: '#008f11', colorMid: '#00ff41', backgroundColor: '#000000', matrixDropSpeed: 5, layers: [{ mode: 'bars', opacity: 0.15, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] },
  },
  {
    id: 'cosmic-rings',
    label: 'Cosmic Rings',
    icon: '🪐',
    settings: { mode: 'rings', colorStart: '#7c3aed', colorEnd: '#06b6d4', colorMid: '#ec4899', backgroundColor: '#050510', ringCount: 12, rotationSpeed: 1.5, layers: [{ mode: 'starfield', opacity: 0.4, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] },
  },
  {
    id: 'dna-lab',
    label: 'DNA Lab',
    icon: '🧬',
    settings: { mode: 'dna', colorStart: '#22d3ee', colorEnd: '#a855f7', colorMid: '#10b981', backgroundColor: '#0a0a1a', dnaStrands: 3, rotationSpeed: 2, layers: [{ mode: 'wave', opacity: 0.2, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] },
  },
  {
    id: 'vinyl-bars',
    label: 'Vinyl + Bars',
    icon: '🎵',
    settings: { mode: 'vinyl', colorStart: '#f97316', colorEnd: '#8b5cf6', colorMid: '#ef4444', backgroundColor: '#111118', rotationSpeed: 3, scaleMultiplier: 0.7, layers: [{ mode: 'bars', opacity: 0.6, enabled: true, x: 0, y: 0, width: 1280, height: 720 }] },
  },
];

export default function App() {
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_SETTINGS);
  const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null);
  const [bgImageName, setBgImageName] = useState('');
  const [vinylLabelObj, setVinylLabelObj] = useState<HTMLImageElement | null>(null);
  const [vinylLabelName, setVinylLabelName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');

  const canvasRef = useRef<VisualizerCanvasRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state: audioState, loadFile, play, pause, seek, updateSmoothing } = useAudioAnalyzer();
  const { isRecording, startRecording, stopRecording } = useCanvasRecorder((url, name) => {
    setVideoUrl(url);
    setVideoName(name);
  });

  const patchSettings = useCallback((patch: Partial<VisualizerSettings>) => {
    setSettings(s => ({ ...s, ...patch }));
  }, []);

  const handleApplyTemplate = useCallback((template: TemplatePreset) => {
    setSettings(s => ({ ...s, ...template.settings, activeTemplate: template.id }));
  }, []);

  // Sync smoothing to analyser when changed
  useEffect(() => {
    updateSmoothing(settings.smoothing);
  }, [settings.smoothing, updateSmoothing]);

  const handleAudioFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, OGG, FLAC, etc.)');
      return;
    }
    await loadFile(file);
    // Auto-set title from filename
    const name = file.name.replace(/\.[^.]+$/, '');
    patchSettings({ title: name });
  }, [loadFile, patchSettings]);

  const handleBgImage = useCallback((file: File | null) => {
    if (!file) {
      setBgImageObj(null);
      setBgImageName('');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setBgImageObj(img);
      setBgImageName(file.name);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const handleVinylLabel = useCallback((file: File | null) => {
    if (!file) {
      setVinylLabelObj(null);
      setVinylLabelName('');
      patchSettings({ vinylLabelImage: null });
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      setVinylLabelObj(img);
      setVinylLabelName(file.name);
      patchSettings({ vinylLabelImage: file.name });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [patchSettings]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleAudioFile(file);
  }, [handleAudioFile]);

  const handleRecordToggle = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      const canvas = canvasRef.current?.canvas;
      if (!canvas) return;
      if (!audioState.isPlaying) play();
      startRecording(canvas, audioState.audioStream, settings.videoFormat);
    }
  }, [isRecording, stopRecording, startRecording, audioState, play, settings.videoFormat]);

  return (
    <div className="h-screen bg-[#0d0d1a] text-white flex flex-col overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm shadow-lg">
            🎧
          </div>
          <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Audio Visualizer Studio
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:block">Works Offline ✓</span>
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
            title="Toggle Settings"
          >
            {sidebarOpen ? '◀ Hide' : '▶ Settings'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0 p-3 gap-2 overflow-hidden">

          {/* Upload zone */}
          {!audioState.isLoaded && (
            <div
              onDrop={handleDrop}
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-shrink-0 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
                ${isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                  : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'}`}
            >
              <div className="text-3xl mb-2">🎵</div>
              <p className="text-sm font-semibold text-slate-300">Drop audio file here or click to browse</p>
              <p className="text-xs text-slate-500 mt-1">Supports MP3, WAV, OGG, FLAC, AAC, M4A...</p>
              <input ref={fileInputRef} type="file" accept="audio/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleAudioFile(f);
                }}
              />
            </div>
          )}

          {/* Canvas preview - constrained height */}
          <div className="flex-1 min-h-0 relative bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
            <VisualizerCanvas
              ref={canvasRef}
              analyser={audioState.analyser}
              settings={settings}
              isPlaying={audioState.isPlaying}
              backgroundImageObj={bgImageObj}
              vinylLabelObj={vinylLabelObj}
            />

          {/* Canvas overlay buttons */}
          {audioState.isLoaded && (
            <div className="absolute top-3 left-3 flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs text-slate-300 backdrop-blur transition-colors"
              >
                📂 Change File
              </button>
            </div>
          )}

            {/* Resolution badge */}
            <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-slate-900/70 text-xs text-slate-400 backdrop-blur">
              {bgImageName ? `${Math.max(settings.width, settings.bgImageX + settings.bgImageWidth)} × ${Math.max(settings.height, settings.bgImageY + settings.bgImageHeight)}` : `${settings.width} × ${settings.height}`}
            </div>
          </div>

          {/* Player + Record controls */}
          {audioState.isLoaded && (
            <div className="flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 overflow-x-auto">
              <div className="flex-1 min-w-0">
                <AudioPlayer
                  isPlaying={audioState.isPlaying}
                  isLoaded={audioState.isLoaded}
                  currentTime={audioState.currentTime}
                  duration={audioState.duration}
                  fileName={audioState.fileName}
                  onPlay={play}
                  onPause={pause}
                  onSeek={seek}
                />
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                {/* Record button */}
                <button
                  onClick={handleRecordToggle}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150
                    ${isRecording
                      ? 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/30 animate-pulse'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20'
                    }`}
                >
                  {isRecording ? (
                    <>
                      <span className="w-3 h-3 rounded-sm bg-white inline-block" />
                      Stop & Download
                    </>
                  ) : (
                    <>
                      <span className="w-3 h-3 rounded-full bg-white inline-block" />
                      Record Video
                    </>
                  )}
                </button>

                {isRecording && (
                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    REC
                  </div>
                )}

                {/* Download button - appears after recording */}
                {videoUrl && !isRecording && (
                  <a
                    href={videoUrl}
                    download={videoName}
                    onClick={() => setVideoUrl(null)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20 transition-all duration-150 whitespace-nowrap"
                  >
                    <span className="text-lg">⬇️</span>
                    Download Video
                  </a>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Settings Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 flex-shrink-0">
              <h2 className="text-sm font-bold text-slate-200">⚙️ Settings</h2>
              <button
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Reset
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
              <SettingsPanel
                settings={settings}
                onChange={patchSettings}
                onBgImageChange={handleBgImage}
                bgImageName={bgImageName}
                templates={TEMPLATES}
                onApplyTemplate={handleApplyTemplate}
                vinylLabelName={vinylLabelName}
                onVinylLabelChange={handleVinylLabel}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Mode quick-switch footer */}
      <footer className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900/80 border-t border-slate-800 flex-shrink-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {[
          { id: 'bars', label: '📊 Bars' },
          { id: 'wave', label: '〰️ Wave' },
          { id: 'circle', label: '⭕ Circle' },
          { id: 'particles', label: '✨ Particles' },
          { id: 'spiral', label: '🌀 Spiral' },
          { id: 'rings', label: '⭕ Rings' },
          { id: 'tunnel', label: '🕳️ Tunnel' },
          { id: 'flower', label: '🌸 Flower' },
          { id: 'starfield', label: '🌟 Starfield' },
          { id: 'dna', label: '🧬 DNA' },
          { id: 'aurora', label: '🌌 Aurora' },
          { id: 'matrix', label: '💚 Matrix' },
          { id: 'lissajous', label: '♾️ Lissajous' },
          { id: 'plasma', label: '🔥 Plasma' },        {id: 'vinyl', label: '💿 Vinyl'},
          { id: 'voronoi', label: '🔷 Voronoi' },
          { id: 'fractalTree', label: '🌲 FractalTree' },
          { id: 'kaleidoscope', label: '🪩 Kaleidoscope' },
          { id: 'polyhedron', label: '💎 Polyhedron' },
          { id: 'sierpinski', label: '🔺 Sierpinski' },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => patchSettings({ mode: m.id as VisualizerSettings['mode'] })}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 whitespace-nowrap
              ${settings.mode === m.id
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
          >
            {m.label}
          </button>
        ))}
        <span className="text-slate-700 text-[10px] ml-2 hidden lg:block">Tip: Record auto-starts playback</span>
      </footer>
    </div>
  );
}
