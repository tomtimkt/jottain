interface Props {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  fileName: string;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ isPlaying, isLoaded, currentTime, duration, fileName, onPlay, onPause, onSeek }: Props) {
  const progress = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* File name */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🎵</span>
        <span className="text-sm text-slate-300 truncate flex-1">{fileName || 'No file loaded'}</span>
      </div>

      {/* Seek bar */}
      <div className="relative group">
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden cursor-pointer"
          onClick={e => {
            if (!isLoaded) return;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const t = ((e.clientX - rect.left) / rect.width) * duration;
            onSeek(Math.max(0, Math.min(t, duration)));
          }}>
          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          disabled={!isLoaded}
          onClick={() => onSeek(0)}
          className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold transition-all duration-150
            ${isLoaded
              ? 'bg-slate-600 hover:bg-slate-500 hover:scale-105 active:scale-95'
              : 'bg-slate-700 cursor-not-allowed opacity-50'}`}
          title="Back to start"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><polygon points="19,3 5,12 19,21" /><rect x="3" y="4" width="3" height="16" /></svg>
        </button>
        <button
          disabled={!isLoaded}
          onClick={isPlaying ? onPause : onPlay}
          className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold transition-all duration-150
            ${isLoaded
              ? 'bg-cyan-500 hover:bg-cyan-400 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95'
              : 'bg-slate-600 cursor-not-allowed opacity-50'}`}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><polygon points="5,3 19,12 5,21" /></svg>
          )}
        </button>
        <span className="text-xs font-mono text-slate-400">
          {fmt(currentTime)} / {fmt(duration)}
        </span>
      </div>
    </div>
  );
}
