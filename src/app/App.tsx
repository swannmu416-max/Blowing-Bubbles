import { useState, useEffect, useCallback, useRef } from 'react';
import { TopBar } from './components/TopBar';
import { CameraPanel } from './components/CameraPanel';
import { BubbleCanvas } from './components/BubbleCanvas';
import { ControlPanel } from './components/ControlPanel';
import { ResultModal } from './components/ResultModal';
import { ParticleField } from './components/ParticleField';
import Orb from './components/Orb';

/** Typewriter hook — reveals text character by character */
function useTypewriter(text: string, speed = 42, startDelay = 600) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timeout = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, speed);
      return () => clearInterval(id);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return displayed;
}

export default function App() {
  const [isBlowing, setIsBlowing]     = useState(false);
  const [currentMAR, setCurrentMAR]   = useState(0);
  const [duration, setDuration]       = useState(0);
  const [mouthState, setMouthState]   = useState<'idle' | 'charging' | 'release'>('idle');
  const [cameraActive, setCameraActive] = useState(false);

  const [sensitivity, setSensitivity]       = useState(50);

  const [showResultModal, setShowResultModal] = useState(false);
  const [lastBubbleCount, setLastBubbleCount] = useState(0);
  const [lastDuration, setLastDuration]       = useState(0);

  const [showWelcome, setShowWelcome] = useState(true);

  const blowStartRef  = useRef<number | null>(null);
  const durationRef   = useRef(0);
  const isBlowingRef  = useRef(false);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const subtitle = useTypewriter('张嘴吹气，创造你的泡泡世界', 48, 800);

  useEffect(() => {
    // 预热摄像头但不自动跳过欢迎页
  }, []);

  const handleGetStarted = useCallback(() => {
    setShowWelcome(false);
    setCameraActive(true);
  }, []);

  useEffect(() => {
    isBlowingRef.current = isBlowing;
    if (isBlowing) {
      blowStartRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - (blowStartRef.current ?? Date.now())) / 1000;
        durationRef.current = elapsed;
        setDuration(elapsed);
        if (elapsed > 121) setIsBlowing(false);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      blowStartRef.current = null;
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isBlowing]);

  const handleMouthStateChange = useCallback((isOpen: boolean, mar: number) => {
    setCurrentMAR(mar);
    const threshold = 0.15 - (sensitivity - 50) * 0.002;

    if (isOpen && mar > threshold) {
      if (!isBlowingRef.current) {
        setIsBlowing(true);
        setMouthState('charging');
      }
    } else {
      if (isBlowingRef.current) {
        setMouthState('release');
        setTimeout(() => setMouthState('idle'), 500);
      } else {
        setMouthState('idle');
      }
      setIsBlowing(false);
      setDuration(0);
      durationRef.current = 0;
    }
  }, [sensitivity]);

  const handleBubbleRelease = useCallback((count: number, dur: number) => {
    if (dur > 1.0) {
      setLastBubbleCount(count);
      setLastDuration(dur);
      setShowResultModal(true);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  return (
    <div className="size-full flex flex-col" style={{ background: '#08010F' }}>

      {/* ── Welcome / Landing page ── */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: '#08010F' }}
        >
          {/* Particle background on welcome page too */}
          <ParticleField />

          <style>{`
            @keyframes fadeIn    { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
            @keyframes fadeInUp  { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
            @keyframes titleGlow {
              0%,100% { text-shadow: 0 0 30px rgba(157,78,221,0.45), 0 0 60px rgba(157,78,221,0.15); }
              50%      { text-shadow: 0 0 50px rgba(199,125,255,0.65), 0 0 90px rgba(157,78,221,0.25); }
            }
          `}</style>

          {/* Orb + content overlay */}
          <div style={{ position: 'relative', width: 560, height: 560, flexShrink: 0, zIndex: 1 }}>
            {/* Orb */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <Orb
                hoverIntensity={0.5}
                rotateOnHover={true}
                hue={270}
                forceHoverState={false}
                backgroundColor="#08010F"
              />
            </div>

            {/* Centered content */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                gap: 0,
              }}
            >
              {/* Version / system tag */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(157,78,221,0.10)',
                  border: '1px solid rgba(157,78,221,0.30)',
                  borderRadius: 2,
                  padding: '0.22rem 0.8rem',
                  marginBottom: '1rem',
                  animation: 'fadeIn 0.6s ease-out 0.1s both',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#C77DFF',
                    boxShadow: '0 0 6px #C77DFF',
                    animation: 'cyber-pulse 2s ease-in-out infinite',
                  }}
                />
                <span
                  style={{
                    color: 'rgba(199,125,255,0.75)',
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.12em',
                  }}
                >
                  SYS.INIT · v1.0
                </span>
              </div>

              {/* Main title */}
              <div
                style={{
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '3rem',
                  letterSpacing: '0.06em',
                  lineHeight: 1.15,
                  textAlign: 'center',
                  marginBottom: '0.9rem',
                  animation: 'fadeIn 0.7s ease-out 0.2s both, titleGlow 3s ease-in-out 1s infinite',
                }}
              >
                Breath Bubble
              </div>

              {/* Typewriter subtitle */}
              <div
                style={{
                  color: 'rgba(157,78,221,0.65)',
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.08em',
                  marginBottom: '2rem',
                  minHeight: '1.2em',
                  animation: 'fadeIn 0.5s ease-out 0.5s both',
                }}
              >
                {subtitle}
                {/* Blinking cursor */}
                <span
                  style={{
                    display: 'inline-block',
                    width: 2,
                    height: '0.9em',
                    background: '#9D4EDD',
                    marginLeft: 2,
                    verticalAlign: 'middle',
                    animation: 'cyber-cursor 1s step-end infinite',
                  }}
                />
              </div>

              {/* Get Started button */}
              <div style={{ animation: 'fadeInUp 0.7s ease-out 0.5s both' }}>
                <button
                  onClick={handleGetStarted}
                  style={{
                    background: 'rgba(157,78,221,0.10)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    color: '#C77DFF',
                    border: '1px solid rgba(157,78,221,0.45)',
                    borderRadius: 2,
                    padding: '0.7rem 2.8rem',
                    fontSize: '0.78rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    letterSpacing: '0.16em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                    position: 'relative',
                    zIndex: 3,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(157,78,221,0.20)';
                    e.currentTarget.style.borderColor = 'rgba(199,125,255,0.7)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(157,78,221,0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(157,78,221,0.10)';
                    e.currentTarget.style.borderColor = 'rgba(157,78,221,0.45)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  GET STARTED
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main app layout ── */}
      <TopBar cameraActive={cameraActive} mouthState={mouthState} duration={duration} />

      <div className="flex-1 relative overflow-hidden">
        <BubbleCanvas
          isBlowing={isBlowing}
          mouthOpenness={currentMAR}
          duration={duration}
          onBubbleRelease={handleBubbleRelease}
        />

        {/* Camera overlay — bottom-right */}
        <div className="absolute bottom-4 right-4 z-10">
          <CameraPanel
            onMouthStateChange={handleMouthStateChange}
            mouthState={mouthState}
          />
        </div>
      </div>

      <ControlPanel
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
        mouthState={mouthState}
        isBlowing={isBlowing}
        duration={duration}
      />

      <ResultModal
        isOpen={showResultModal}
        bubbleCount={lastBubbleCount}
        duration={lastDuration}
        onClose={handleCloseModal}
      />
    </div>
  );
}
