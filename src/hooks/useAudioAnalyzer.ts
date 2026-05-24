import { useRef, useState, useCallback, useEffect } from 'react';

export interface AudioAnalyzerState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  fileName: string;
  analyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  audioStream: MediaStream | null;
}

export function useAudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<AudioAnalyzerState>({
    isPlaying: false,
    isLoaded: false,
    currentTime: 0,
    duration: 0,
    fileName: '',
    analyser: null,
    audioContext: null,
    audioStream: null,
  });

  const updateTime = useCallback(() => {
    if (audioContextRef.current && state.isPlaying) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current + offsetRef.current;
      setState(s => ({ ...s, currentTime: Math.min(elapsed, s.duration) }));
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [state.isPlaying]);

  useEffect(() => {
    if (state.isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state.isPlaying, updateTime]);

  const loadFile = useCallback(async (file: File) => {
    try {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;

      // Create MediaStreamDestination for recording
      const mediaStreamDestination = ctx.createMediaStreamDestination();
      analyser.connect(mediaStreamDestination);
      audioStreamRef.current = mediaStreamDestination.stream;

      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      offsetRef.current = 0;

      setState({
        isPlaying: false,
        isLoaded: true,
        currentTime: 0,
        duration: audioBuffer.duration,
        fileName: file.name,
        analyser,
        audioContext: ctx,
        audioStream: mediaStreamDestination.stream,
      });
    } catch (e) {
      console.error('Error loading audio:', e);
    }
  }, []);

  const play = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current || !analyserRef.current) return;
    const ctx = audioContextRef.current;

    if (ctx.state === 'suspended') ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(analyserRef.current);
    source.start(0, offsetRef.current);
    source.onended = () => {
      setState(s => {
        if (s.isPlaying) {
          offsetRef.current = 0;
          return { ...s, isPlaying: false, currentTime: 0 };
        }
        return s;
      });
    };
    sourceRef.current = source;
    startTimeRef.current = ctx.currentTime;

    setState(s => ({ ...s, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    if (sourceRef.current && audioContextRef.current) {
      sourceRef.current.stop();
      offsetRef.current += audioContextRef.current.currentTime - startTimeRef.current;
      sourceRef.current = null;
    }
    setState(s => ({ ...s, isPlaying: false }));
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioBufferRef.current) return;
    const wasPlaying = state.isPlaying;
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    offsetRef.current = time;
    setState(s => ({ ...s, currentTime: time, isPlaying: false }));
    if (wasPlaying) {
      setTimeout(() => play(), 50);
    }
  }, [state.isPlaying, play]);

  const updateSmoothing = useCallback((value: number) => {
    if (analyserRef.current) {
      analyserRef.current.smoothingTimeConstant = value;
    }
  }, []);

  return { state, loadFile, play, pause, seek, updateSmoothing };
}
