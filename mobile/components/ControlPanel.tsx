import * as Slider from '@radix-ui/react-slider';

interface ControlPanelProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  mouthState: 'idle' | 'charging' | 'release';
  isBlowing: boolean;
  duration: number;
}

/** 5-bar waveform shown while blowing */
function WaveformBars({ active }: { active: boolean }) {
  const bars = [0.4, 0.75, 1, 0.65, 0.35];
  return (
    <div className="flex items-end gap-[3px]" style={{ height: 16 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: 'linear-gradient(to top, #9D4EDD, #C77DFF)',
            boxShadow: active ? '0 0 6px rgba(157,78,221,0.7)' : 'none',
            height: active ? `${h * 100}%` : '20%',
            transition: 'height 0.15s ease-out',
            animation: active
              ? `wave-bar-${i} ${0.55 + i * 0.08}s ease-in-out infinite alternate`
              : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes wave-bar-0 { from { height: 30% } to { height: 80% } }
        @keyframes wave-bar-1 { from { height: 55% } to { height: 100% } }
        @keyframes wave-bar-2 { from { height: 70% } to { height: 100% } }
        @keyframes wave-bar-3 { from { height: 45% } to { height: 85% } }
        @keyframes wave-bar-4 { from { height: 25% } to { height: 65% } }
      `}</style>
    </div>
  );
}

export function ControlPanel({
  sensitivity,
  onSensitivityChange,
  isBlowing,
  duration,
}: ControlPanelProps) {
  return (
    <div
      className="shrink-0 no-select"
      style={{
        background: 'rgba(8, 1, 15, 0.97)',
        borderTop: '1px solid transparent',
        backgroundImage: `
          linear-gradient(rgba(8,1,15,0.97), rgba(8,1,15,0.97)),
          linear-gradient(90deg, transparent 0%, rgba(157,78,221,0.5) 30%, rgba(199,125,255,0.7) 50%, rgba(157,78,221,0.5) 70%, transparent 100%)
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Row 1: Sensitivity slider ── */}
      <div
        className="flex items-center gap-3 px-4"
        style={{ height: 48 }}
      >
        <span
          style={{
            color: 'rgba(157,78,221,0.6)',
            fontSize: '0.6rem',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
          }}
        >
          SENS
        </span>
        <Slider.Root
          value={[sensitivity]}
          onValueChange={([val]) => onSensitivityChange(val)}
          min={0}
          max={100}
          step={1}
          className="relative flex items-center flex-1 min-w-0 h-5 cursor-pointer select-none touch-none"
        >
          <Slider.Track
            className="relative h-[3px] w-full rounded-full overflow-hidden"
            style={{ background: 'rgba(157,78,221,0.15)' }}
          >
            <Slider.Range
              className="absolute h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #9D4EDD, #C77DFF)',
                boxShadow: '0 0 8px rgba(157,78,221,0.6)',
              }}
            />
          </Slider.Track>
          <Slider.Thumb
            className="block outline-none"
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: '#C77DFF',
              boxShadow: '0 0 0 2px rgba(199,125,255,0.25), 0 0 12px rgba(199,125,255,0.6)',
              transition: 'box-shadow 0.2s',
            }}
          />
        </Slider.Root>
        <span
          style={{
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: '#C77DFF',
            minWidth: '1.8rem',
            textAlign: 'right',
            textShadow: '0 0 8px rgba(199,125,255,0.5)',
          }}
        >
          {sensitivity}
        </span>
      </div>

      {/* ── Row 2: Blow status ── */}
      <div
        className="flex items-center justify-center"
        style={{ height: 40, borderTop: '1px solid rgba(157,78,221,0.08)' }}
      >
        {isBlowing ? (
          <div className="flex items-center gap-2">
            <WaveformBars active={true} />
            <span
              style={{
                color: '#FFD93D',
                fontSize: '1.2rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textShadow: '0 0 20px rgba(255,217,61,0.6)',
                lineHeight: 1,
              }}
            >
              {duration.toFixed(1)}
              <span style={{ fontSize: '0.65rem', marginLeft: 2, opacity: 0.7 }}>s</span>
            </span>
            <WaveformBars active={true} />
          </div>
        ) : (
          <span
            style={{
              color: 'rgba(157,78,221,0.35)',
              fontSize: '0.6rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.14em',
            }}
          >
            [ 张嘴吹气 → 创造泡泡 ]
          </span>
        )}
      </div>
    </div>
  );
}
