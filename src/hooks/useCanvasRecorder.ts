import { useRef, useState, useCallback } from 'react';

export function useCanvasRecorder(onVideoReady?: (url: string, name: string) => void) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = useCallback((canvas: HTMLCanvasElement, audioStream: MediaStream | null, format: 'webm' | 'mp4' = 'webm') => {
    chunksRef.current = [];

    // Get canvas stream
    const canvasStream = canvas.captureStream(60);

    // Combine with audio stream if available
    let combinedStream = canvasStream;
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStream.getAudioTracks()
      ]);
    }

    // Pick format based on selection
    let mimeType: string;
    if (format === 'mp4') {
      const mp4Types = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      mimeType = mp4Types.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    } else {
      const webmTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
      mimeType = webmTypes.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    }

    const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 8_000_000 });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const name = `visualization_${Date.now()}.${ext}`;

      if (onVideoReady) {
        onVideoReady(url, name);
      } else {
        // Fallback: auto-download
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      }
    };
    recorder.start(100);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [onVideoReady]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  return { isRecording, startRecording, stopRecording };
}
