# 🎧 Audio Visualizer Studio

A fully client-side, **offline-capable** audio visualization & video generation web app. Drop in an audio file, pick from 15 stunning visualization modes, customize everything, and **record the result as a video** synced perfectly with the audio — all without uploading a single byte to any server.

Built with **React 19**, **Vite 7**, **TypeScript 5**, and **Tailwind CSS 4**.

---

## ✨ Features

### 🎨 15 Visualization Modes
| Mode | Description |
|------|-------------|
| 📊 **Bars** | Classic frequency bar spectrum |
| 〰️ **Wave** | Time-domain waveform |
| ⭕ **Circle** | Radial frequency spectrum |
| ✨ **Particles** | Reactive particle system |
| 🌀 **Spiral** | Spiraling spectrum trails |
| ⭕ **Rings** | Concentric pulsing rings |
| 🕳️ **Tunnel** | 3D tunnel-of-light effect |
| 🌸 **Flower** | Symmetrical petal patterns |
| 🌟 **Starfield** | Warp-speed star travel |
| 🧬 **DNA** | Double/triple helix strands |
| 🌌 **Aurora** | Smooth aurora-borealis ribbons |
| 💚 **Matrix** | Falling green-rain digits |
| ♾️ **Lissajous** | Audio-driven Lissajous curves |
| 🔥 **Plasma** | Procedural plasma field |
| 💿 **Vinyl** | Spinning vinyl record (with custom label image) |

### 🎛️ Deep Customization
- **Colors** — start / mid / end gradient + per-mode color cycling
- **Glow** — toggle, color, and strength
- **Sensitivity, smoothing, bass boost, trail strength, scale**
- **Bar / wave / particle styles** (filled, outlined, rounded, dots, stars…)
- **Symmetry, rotation speed, inner radius**
- **Mode-specific knobs**: petal count, ring count, DNA strands, matrix drop speed, plasma complexity, star speed
- **Background image** with positionable size/opacity, plus solid background color
- **Optional title overlay**
- **Custom vinyl center-label image**

### 🧩 Layer System
Stack multiple visualizers on top of each other — each layer has its own mode, opacity, position, and dimensions. Make a Matrix-rain background with bars in the foreground, or a vinyl record with a particle storm around it.

### 📐 Built-in Templates
One-click presets to get started fast:
- 🎛️ **Default** — Cyan/purple bars
- 💿 **Retro Vinyl** — Warm orange spinning vinyl
- 🎉 **Neon Party** — High-glow magenta bars + particles
- 🌌 **Chill Aurora** — Soft aurora + starfield
- 💚 **Matrix Hacker** — Falling code + faint bars
- 🪐 **Cosmic Rings** — Pulsing rings on a starfield
- 🧬 **DNA Lab** — Helix with subtle wave overlay
- 🎵 **Vinyl + Bars** — Vinyl with bar spectrum overlay

### 🎥 Video Recording
- Captures the canvas at **60 fps** via `canvas.captureStream()`
- Mixes the original **audio track** in via `MediaStream`
- Uses **`MediaRecorder`** at **8 Mbps** for crisp output
- Auto-selects best codec — **WebM** (VP9/VP8 + Opus) or **MP4** when supported
- One-click **Stop & Download**

### 🌐 100% Offline & Private
- Audio never leaves your browser — all decoding/analysis runs in the **Web Audio API**
- Builds to a **single self-contained `index.html`** (via `vite-plugin-singlefile`) you can double-click and use anywhere — no server, no install, no internet

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20.19+** or **22.12+** (required by Vite 7)
- **npm** (or your preferred package manager)

### Install & run
```bash
npm install
npm run dev
```
Then open the URL Vite prints (usually `http://localhost:5173`).

### Build a single-file offline bundle
```bash
npm run build
```
The output `dist/index.html` is a **single self-contained file** with all JS/CSS/assets inlined. Open it directly in any modern browser — no server required.

### Preview the production build
```bash
npm run preview
```

---

## 🪟 Windows Convenience Scripts

This repo ships with two helpers for Windows users:

| File | What it does |
|------|--------------|
| `start-app.bat` | Launches `npm run dev` from the project folder |
| `create-shortcut.ps1` | Creates a desktop shortcut "Audio Visualizer" pointing at `start-app.bat` |

> ⚠️ Both scripts hardcode the path `c:\AI.-PROJECTS\audio-visualization-video-generator`. Edit them if you've placed the project elsewhere.

To create the desktop shortcut, right-click `create-shortcut.ps1` → **Run with PowerShell** (or run it from a PowerShell prompt).

---

## 🎬 Usage

1. **Load audio** — drag and drop an audio file onto the upload zone, or click to browse. Supported: **MP3, WAV, OGG, FLAC, AAC, M4A**, and anything else your browser can decode.
2. **Pick a mode or template** — use the bottom mode-bar or the *Templates* section in the right sidebar.
3. **Tweak settings** — open the right sidebar (`▶ Settings`) and adjust colors, sensitivity, glow, layers, etc.
4. **Optionally** load a **background image** and/or a **vinyl label image**.
5. **Press play** ▶ to preview.
6. Click **🔴 Record Video** — playback auto-starts and the canvas + audio are recorded together.
7. Click **■ Stop & Download** to finish. A green **⬇️ Download Video** button appears with your file (`visualization_<timestamp>.webm` or `.mp4`).

> 💡 **Tip:** WebM is the most reliable format across browsers. Use MP4 only if your browser advertises native MP4 recording support (Chrome/Edge on supported platforms).

---

## 🧱 Project Structure

```
.
├─ index.html                       # Vite HTML entry
├─ vite.config.ts                   # React + Tailwind 4 + single-file plugin
├─ tsconfig.json
├─ package.json
├─ start-app.bat                    # Windows: launch dev server
├─ create-shortcut.ps1              # Windows: create desktop shortcut
└─ src/
   ├─ main.tsx                      # React root
   ├─ App.tsx                       # Top-level UI, state, templates, layout
   ├─ index.css                     # Tailwind + global styles
   ├─ types.ts                      # VisualizerSettings, LayerConfig, TemplatePreset, …
   ├─ components/
   │  ├─ VisualizerCanvas.tsx       # Canvas element + render loop
   │  ├─ SettingsPanel.tsx          # Right-hand settings sidebar
   │  └─ AudioPlayer.tsx            # Play / pause / seek / timeline
   ├─ hooks/
   │  ├─ useAudioAnalyzer.ts        # Web Audio API + AnalyserNode
   │  └─ useCanvasRecorder.ts       # MediaRecorder canvas → video
   └─ utils/
      ├─ drawVisualizer.ts          # All per-mode draw routines
      └─ cn.ts                      # clsx + tailwind-merge helper
```

---

## 🔧 Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | **React 19.2** |
| Build tool | **Vite 7** + `@vitejs/plugin-react` |
| Styling | **Tailwind CSS 4** (`@tailwindcss/vite`) |
| Language | **TypeScript 5.9** |
| Audio | **Web Audio API** (`AnalyserNode`) |
| Rendering | **HTML5 Canvas 2D** |
| Recording | **MediaRecorder** + `canvas.captureStream(60)` |
| Bundling | `vite-plugin-singlefile` → one offline-capable HTML file |
| Utilities | `clsx`, `tailwind-merge` |

---

## 🌐 Browser Support

Recording requires:
- ✅ `MediaRecorder` — Chrome, Edge, Firefox, Opera (all modern), Safari 14.1+
- ✅ `HTMLCanvasElement.captureStream()` — same as above
- ✅ Web Audio API — universal in modern browsers

**Recommended:** Chrome or Edge (best codec support, most reliable MediaRecorder).
**MP4 recording** depends on browser/OS — the app gracefully falls back to WebM when MP4 isn't supported. Note: even when a browser advertises MP4 support, the resulting file may use non-standard codecs that don't play in every video player. **WebM is the safest, most portable choice.**

---

## 📜 Available Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Build the single-file production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |

---

## 🤝 Contributing

PRs and ideas welcome! Some natural extensions:

- 🎚️ Beat-detection-driven effects
- 🖼️ Per-frame PNG export for high-quality renders
- 🎙️ Microphone input mode
- 🪄 More visualization modes (Voronoi, fractal trees, kaleidoscope…)
- 💾 Save/load custom presets to `localStorage`
- ♿ Accessibility & keyboard-shortcut pass

---

## 📄 License

[MIT](./LICENSE) © 2026 Toomas
