import { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { CameraPanel } from './components/CameraPanel';
import { BubbleCanvas } from './components/BubbleCanvas';
import { ControlPanel } from './components/ControlPanel';
import { StatusFeedback } from './components/StatusFeedback';
import { ResultModal } from './components/ResultModal';

export default function App() {
  const [isBlowing, setIsBlowing] = useState(false);
  const [currentMAR, setCurrentMAR] = useState(0);
  const [duration, setDuration] = useState(0);
  const [mouthState, setMouthState] = useState<'idle' | 'charging' | 'release'>('idle');
  const [blowStartTime, setBlowStartTime] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const [sensitivity, setSensitivity] = useState(50);
  const [gravity, setGravity] = useState(50);
  const [surfaceTension, setSurfaceTension] = useState(50);

  const [showResultModal, setShowResultModal] = useState(false);
  const [lastBubbleSize, setLastBubbleSize] = useState(0);
  const [lastDuration, setLastDuration] = useState(0);

  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    setCameraActive(true);
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isBlowing) {
      if (!blowStartTime) setBlowStartTime(Date.now());
      const interval = setInterval(() => {
        if (blowStartTime) {
          const elapsed = (Date.now() - blowStartTime) / 1000;
          setDuration(elapsed);
          if (elapsed > 121) setIsBlowing(false); // hard cap at world record threshold
        }
      }, 100);
      return () => clearInterval(interval);
    } else {
      setBlowStartTime(null);
    }
  }, [isBlowing, blowStartTime]);

  const handleMouthStateChange = useCallback((isOpen: boolean, mar: number) => {
    setCurrentMAR(mar);
    const adjustedThreshold = 0.15 - (sensitivity - 50) * 0.002;

    if (isOpen && mar > adjustedThreshold) {
      if (!isBlowing) {
        setIsBlowing(true);
        setMouthState('charging');
        setBlowStartTime(Date.now());
      }
    } else {
      if (isBlowing && duration > 1.5) {
        setMouthState('release');
        setTimeout(() => setMouthState('idle'), 500);
      } else {
        setMouthState('idle');
      }
      setIsBlowing(false);
      setDuration(0);
    }
  }, [isBlowing, duration, sensitivity]);

  const handleBubbleRelease = useCallback((size: number, dur: number) => {
    if (dur > 1.5) {
      setLastBubbleSize(size);
      setLastDuration(dur);
      setTimeout(() => setShowResultModal(true), 800);
    }
  }, []);

  return (
    <div className="size-full flex flex-col" style={{ background: '#0B0F1A' }}>
      {/* Welcome overlay */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(11,15,26,0.96)',
            animation: 'fadeOut 0.6s ease-out 2.4s forwards',
          }}
        >
          <style>{`@keyframes fadeOut { to { opacity: 0; pointer-events: none; } }`}</style>
          <div className="text-center" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <div className="text-white text-4xl mb-3 font-light tracking-widest">🫧</div>
            <div className="text-white text-2xl font-semibold mb-2 tracking-wide">Breath Bubble AI</div>
            <div className="text-white text-base opacity-60" style={{ animationDelay: '0.4s', animation: 'fadeIn 0.5s ease-out 0.4s both' }}>
              Open your mouth to blow a bubble
            </div>
          </div>
        </div>
      )}

      <TopBar cameraActive={cameraActive} />

      {/* Main area: BubbleCanvas fills all space, CameraPanel overlaid bottom-right */}
      <div className="flex-1 relative overflow-hidden">
        <BubbleCanvas
          isBlowing={isBlowing}
          mouthOpenness={currentMAR}
          duration={duration}
          onBubbleRelease={handleBubbleRelease}
          gravity={gravity / 50}
          wind={(gravity - 50) / 50}
          surfaceTension={surfaceTension / 50}
        />

        {/* Camera small window — bottom-right corner */}
        <div className="absolute bottom-4 right-4 z-10">
          <CameraPanel
            onMouthStateChange={handleMouthStateChange}
            mouthState={mouthState}
          />
        </div>
      </div>

      <ControlPanel
        sensitivity={sensitivity}
        gravity={gravity}
        surfaceTension={surfaceTension}
        onSensitivityChange={setSensitivity}
        onGravityChange={setGravity}
        onSurfaceTensionChange={setSurfaceTension}
        mouthState={mouthState}
      />

      <StatusFeedback
        currentMAR={currentMAR}
        duration={duration}
        isBlowing={isBlowing}
        mouthState={mouthState}
      />

      <ResultModal
        isOpen={showResultModal}
        bubbleSize={lastBubbleSize}
        duration={lastDuration}
        onClose={() => setShowResultModal(false)}
      />
    </div>
  );
}
