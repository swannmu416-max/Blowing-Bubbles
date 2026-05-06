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
  const size = 8;
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

type PermissionStatus = 'idle' | 'granted' | 'denied';

export function CameraPanel({ onMouthStateChange, mouthState }: CameraPanelProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [cameraError, setCameraError] = useState<string>('');
  const [cameraReady, setCameraReady] = useState(false);
  // 'idle' = 未授权/未尝试，'granted' = 用户已点击授权（Webcam 开始渲染），'denied' = 出错
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('idle');

  const color = STATE_COLORS[mouthState];
  // 手机版摄像头尺寸：120×120
  const SIZE = 120;

  // 检查已有权限状态（不触发弹窗）
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            // 已有权限，直接让 Webcam 渲染
            setPermissionStatus('granted');
          } else if (result.state === 'denied') {
            setPermissionStatus('denied');
            setCameraError('Camera access denied');
          }
          // 'prompt' 状态 → 保持 'idle'，等待用户点击授权按钮
        })
        .catch(() => {
          // 不支持 permissions API，保持 idle 等待用户手动触发
        });
    }
  }, []);

  // 用户点击"授权使用"按钮 → 直接让 Webcam 渲染，由 Webcam 自己触发权限弹窗
  const requestCameraPermission = () => {
    setPermissionStatus('granted');
  };

  useEffect(() => {
    // cameraReady 由 Webcam 的 onUserMedia 回调设置，确保摄像头真正就绪后再加载模型
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
        ctx.arc(pt.x, pt.y, 1.0, 0, Math.PI * 2);
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

  // 等待用户主动触发权限申请
  if (permissionStatus === 'idle') {
    return (
      <div
        className="relative flex flex-col items-center justify-center gap-2 text-center"
        style={{
          width: SIZE, height: SIZE,
          background: 'rgba(8,1,15,0.95)',
          border: '1px solid rgba(157,78,221,0.35)',
        }}
      >
        <CornerBrackets color="rgba(157,78,221,0.6)" />
        <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>📷</div>
        <div
          style={{
            color: 'rgba(199,125,255,0.75)',
            fontSize: '0.5rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            padding: '0 8px',
            lineHeight: 1.4,
          }}
        >
          需要摄像头权限<br />以检测口型
        </div>
        <button
          onClick={requestCameraPermission}
          style={{
            fontSize: '0.5rem',
            fontFamily: 'var(--font-mono)',
            color: '#C77DFF',
            padding: '5px 10px',
            background: 'rgba(157,78,221,0.18)',
            border: '1px solid rgba(157,78,221,0.5)',
            borderRadius: 2,
            cursor: 'pointer',
            letterSpacing: '0.08em',
            minHeight: 'unset',
            WebkitTapHighlightColor: 'transparent',
          }}
          onTouchStart={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.32)'; }}
          onTouchEnd={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.18)'; }}
        >
          授权使用
        </button>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div
        className="relative flex flex-col items-center justify-center gap-1.5 text-center"
        style={{
          width: SIZE, height: SIZE,
          background: 'rgba(8,1,15,0.95)',
          border: '1px solid rgba(255,60,60,0.35)',
        }}
      >
        <CornerBrackets color="rgba(255,60,60,0.7)" />
        <div style={{ fontSize: '1.4rem', lineHeight: 1 }}>📷</div>
        <div
          style={{
            color: 'rgba(255,100,100,0.8)',
            fontSize: '0.5rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            padding: '0 6px',
            lineHeight: 1.4,
          }}
        >
          摄像头不可用
        </div>
        <button
          onClick={() => {
            setCameraError('');
            setCameraReady(false);
            setPermissionStatus('granted');
          }}
          style={{
            fontSize: '0.5rem',
            fontFamily: 'var(--font-mono)',
            color: '#C77DFF',
            padding: '5px 10px',
            background: 'rgba(157,78,221,0.15)',
            border: '1px solid rgba(157,78,221,0.4)',
            borderRadius: 2,
            cursor: 'pointer',
            letterSpacing: '0.06em',
            minHeight: 'unset',
            WebkitTapHighlightColor: 'transparent',
          }}
          onTouchStart={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.28)'; }}
          onTouchEnd={e => { e.currentTarget.style.background = 'rgba(157,78,221,0.15)'; }}
        >
          RETRY
        </button>
        <div
          style={{
            color: 'rgba(157,78,221,0.5)',
            fontSize: '0.45rem',
            fontFamily: 'var(--font-mono)',
            padding: '0 6px',
            lineHeight: 1.4,
          }}
        >
          如仍失败请在<br />系统设置中开启
        </div>
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
            fontSize: '0.55rem',
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
        boxShadow: `0 0 10px ${color}25, inset 0 0 10px rgba(0,0,0,0.4)`,
        transition: 'border-color 0.25s ease-out, box-shadow 0.25s ease-out',
        flexShrink: 0,
        background: '#000',
      }}
    >
      <CornerBrackets color={color} />

      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={{ width: 240, height: 240, facingMode: 'user' }}
        style={{ width: SIZE, height: SIZE, display: 'block', objectFit: 'cover', opacity: 0.88 }}
        onUserMedia={() => setCameraReady(true)}
        onUserMediaError={() => setCameraError('Cannot access camera')}
      />

      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE }}
      />

      {/* Scan line */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: 1,
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
          top: 4,
          right: 6,
          color: 'rgba(157,78,221,0.45)',
          fontSize: '0.48rem',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em',
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
          paddingBottom: 4,
          zIndex: 6,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(8,1,15,0.75)',
            border: `1px solid ${color}40`,
            padding: '1px 6px',
            fontSize: '0.5rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.08em',
            color,
          }}
        >
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 4px ${color}`,
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
