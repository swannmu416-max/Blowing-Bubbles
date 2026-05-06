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

const STATE_LABEL = {
  idle:     'IDLE',
  charging: 'BLOWING',
  release:  'RELEASED',
} as const;

/** L-shaped corner bracket rendered as absolute-positioned divs */
function CornerBrackets({ color }: { color: string }) {
  const size = 10;
  const thickness = 2;
  const corners = [
    { top: 0,    left: 0,    borderTop: thickness, borderLeft: thickness,  borderRight: 0, borderBottom: 0 },
    { top: 0,    right: 0,   borderTop: thickness, borderRight: thickness, borderLeft: 0,  borderBottom: 0 },
    { bottom: 0, left: 0,    borderBottom: thickness, borderLeft: thickness,  borderRight: 0, borderTop: 0 },
    { bottom: 0, right: 0,   borderBottom: thickness, borderRight: thickness, borderLeft: 0,  borderTop: 0 },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderStyle: 'solid',
            borderColor: color,
            borderTopWidth:    c.borderTop    ?? 0,
            borderLeftWidth:   c.borderLeft   ?? 0,
            borderRightWidth:  c.borderRight  ?? 0,
            borderBottomWidth: c.borderBottom ?? 0,
            top:    c.top    !== undefined ? c.top    : undefined,
            left:   c.left   !== undefined ? c.left   : undefined,
            right:  c.right  !== undefined ? c.right  : undefined,
            bottom: c.bottom !== undefined ? c.bottom : undefined,
            zIndex: 10,
            transition: 'border-color 0.25s ease-out',
          }}
        />
      ))}
    </>
  );
}

export function CameraPanel({ onMouthStateChange, mouthState }: CameraPanelProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);

  const color = STATE_COLORS[mouthState];
  const SIZE = 200;

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => { stream.getTracks().forEach((t) => t.stop()); setCameraReady(true); })
      .catch(() => setCameraError('Camera access denied'));
  }, []);

  useEffect(() => {
    if (!cameraReady) return;
    const load = async () => {
      try {
        const det = await faceLandmarksDetection.createDetector(
          faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
          {
            runtime: 'mediapipe',
            solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
            maxFaces: 1,
          } as faceLandmarksDetection.MediaPipeFaceMeshMediaPipeModelConfig
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
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      const faces = await detector.estimateFaces(video);
      if (!faces.length || !ctx) return;

      const keypoints = faces[0].keypoints;
      ctx.fillStyle = color;
      keypoints.forEach((pt) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      const upperLip   = keypoints[13];
      const lowerLip   = keypoints[14];
      const leftMouth  = keypoints[61];
      const rightMouth = keypoints[291];

      if (upperLip && lowerLip && leftMouth && rightMouth) {
        const mar = Math.abs(upperLip.y - lowerLip.y) / Math.abs(leftMouth.x - rightMouth.x);
        onMouthStateChange(mar > 0.15, mar);
      }
    };

    const interval = setInterval(detect, 50);
    return () => clearInterval(interval);
  }, [detector, onMouthStateChange, color]);

  if (cameraError) {
    return (
      <div
        className="relative flex flex-col items-center justify-center gap-2 text-center"
        style={{
          width: SIZE, height: SIZE,
          background: 'rgba(8,1,15,0.95)',
          border: '1px solid rgba(255,60,60,0.35)',
        }}
      >
        <CornerBrackets color="rgba(255,60,60,0.7)" />
        <div className="text-3xl">📷</div>
        <div
          style={{
            color: 'rgba(255,100,100,0.8)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            padding: '0 8px',
          }}
        >
          {cameraError}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            color: '#C77DFF',
            padding: '4px 12px',
            background: 'rgba(157,78,221,0.15)',
            border: '1px solid rgba(157,78,221,0.4)',
            borderRadius: 2,
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >
          RETRY
        </button>
      </div>
    );
  }

  if (!cameraReady) {
    return (
      <div
        className="relative flex items-center justify-center"
        style={{
          width: SIZE, height: SIZE,
          background: 'rgba(8,1,15,0.95)',
          border: '1px solid rgba(157,78,221,0.25)',
        }}
      >
        <CornerBrackets color="rgba(157,78,221,0.5)" />
        <div
          style={{
            color: 'rgba(157,78,221,0.6)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            animation: 'cyber-blink 1.4s ease-in-out infinite',
          }}
        >
          INIT...
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: SIZE,
        height: SIZE,
        border: `1px solid ${color}55`,
        boxShadow: `0 0 14px ${color}30, inset 0 0 14px rgba(0,0,0,0.4)`,
        transition: 'border-color 0.25s ease-out, box-shadow 0.25s ease-out',
        flexShrink: 0,
        background: '#000',
      }}
    >
      {/* L-shape corner brackets */}
      <CornerBrackets color={color} />

      {/* Webcam feed */}
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{ width: 320, height: 320, facingMode: 'user' }}
        style={{ width: SIZE, height: SIZE, display: 'block', objectFit: 'cover', opacity: 0.88 }}
        onUserMedia={() => setCameraReady(true)}
        onUserMediaError={() => setCameraError('Cannot access camera')}
      />

      {/* Face landmark overlay */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE }}
      />

      {/* Scan line — animates every 4s */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${color}80, transparent)`,
          animation: 'cyber-scan 4s ease-in infinite',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* Top-right: cam ID */}
      <div
        style={{
          position: 'absolute',
          top: 6,
          right: 10,
          color: 'rgba(157,78,221,0.45)',
          fontSize: '0.55rem',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.08em',
          zIndex: 6,
        }}
      >
        CAM-01
      </div>

      {/* Bottom: state label */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: 6,
          zIndex: 6,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'rgba(8,1,15,0.75)',
            border: `1px solid ${color}40`,
            padding: '2px 8px',
            fontSize: '0.6rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            color,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 5px ${color}`,
              animation: mouthState === 'charging' ? 'cyber-blink 1.4s ease-in-out infinite' : 'none',
              display: 'inline-block',
            }}
          />
          {STATE_LABEL[mouthState]}
        </span>
      </div>
    </div>
  );
}
