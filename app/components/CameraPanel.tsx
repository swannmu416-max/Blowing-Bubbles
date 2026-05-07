import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

interface CameraPanelProps {
  onMouthStateChange: (isOpen: boolean, mar: number) => void;
  mouthState: 'idle' | 'charging' | 'release';
}

const STATE_COLORS = {
  idle:     '#4D96FF',
  charging: '#FFD93D',
  release:  '#6BCB77',
} as const;

export function CameraPanel({ onMouthStateChange, mouthState }: CameraPanelProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);

  const color = STATE_COLORS[mouthState];

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        setCameraReady(true);
      })
      .catch(() => setCameraError('Camera access denied'));
  }, []);

  useEffect(() => {
    if (!cameraReady) return;
    const load = async () => {
      try {
        const det = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'tfjs',
            maxFaces: 1,
          } as faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig
        );
        setDetector(det);
      } catch {
        setCameraError('Face detection model failed to load');
      }
    };
    load();
  }, [cameraReady]);

  useEffect(() => {
    if (!detector) return;

    const detect = async () => {
      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (!video || video.readyState !== 4 || !canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      const faces = await detector.estimateFaces(video);
      if (!faces.length || !ctx) return;

      const keypoints = faces[0].keypoints;

      // Draw only mouth-region landmarks (indices 61–291 area)
      ctx.fillStyle = color;
      keypoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      const upperLip  = keypoints[13];
      const lowerLip  = keypoints[14];
      const leftMouth = keypoints[61];
      const rightMouth = keypoints[291];

      if (upperLip && lowerLip && leftMouth && rightMouth) {
        const mouthHeight = Math.abs(upperLip.y - lowerLip.y);
        const mouthWidth  = Math.abs(leftMouth.x - rightMouth.x);
        const mar = mouthHeight / mouthWidth;
        onMouthStateChange(mar > 0.15, mar);
      }
    };

    // 50ms interval for snappier response
    const interval = setInterval(detect, 50);
    return () => clearInterval(interval);
  }, [detector, onMouthStateChange, color]);

  const SIZE = 200; // square side in px

  if (cameraError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-2xl text-center"
        style={{
          width: SIZE, height: SIZE,
          background: 'rgba(255,60,60,0.12)',
          border: `2px solid rgba(255,60,60,0.35)`,
        }}
      >
        <div className="text-3xl">📷</div>
        <div className="text-white text-xs px-2">{cameraError}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-white px-3 py-1 rounded-lg"
          style={{ background: 'rgba(77,150,255,0.7)' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!cameraReady) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: SIZE, height: SIZE,
          background: 'rgba(77,150,255,0.08)',
          border: `2px solid rgba(77,150,255,0.25)`,
        }}
      >
        <div className="text-3xl animate-pulse">📷</div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        width: SIZE,
        height: SIZE,
        border: `2px solid ${color}`,
        boxShadow: `0 0 18px ${color}60`,
        transition: 'border-color 0.25s ease-out, box-shadow 0.25s ease-out',
        flexShrink: 0,
      }}
    >
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{ width: 320, height: 320, facingMode: 'user' }}
        style={{
          width: SIZE,
          height: SIZE,
          display: 'block',
          objectFit: 'cover',
        }}
        onUserMedia={() => setCameraReady(true)}
        onUserMediaError={() => setCameraError('Cannot access camera')}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: SIZE, height: SIZE,
        }}
      />
      {/* State label */}
      <div
        className="absolute bottom-1.5 left-0 right-0 flex justify-center"
      >
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(0,0,0,0.55)',
            color,
            border: `1px solid ${color}50`,
          }}
        >
          {mouthState === 'idle' ? '● Idle' : mouthState === 'charging' ? '● Blowing' : '● Released'}
        </span>
      </div>
    </div>
  );
}
