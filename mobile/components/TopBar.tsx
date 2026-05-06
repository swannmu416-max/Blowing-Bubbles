interface TopBarProps {
  cameraActive: boolean;
  mouthState: 'idle' | 'charging' | 'release';
  duration: number;
}

const STATE_LABEL: Record<string, string> = {
  idle:     'STANDBY',
  charging: 'BLOWING',
  release:  'RELEASE',
};

const STATE_COLOR: Record<string, string> = {
  idle:     '#4D96FF',
  charging: '#FFD93D',
  release:  '#6BCB77',
};

export function TopBar({ cameraActive, mouthState, duration }: TopBarProps) {
  const color = STATE_COLOR[mouthState];

  return (
    <div
      className="flex items-center justify-between px-4 shrink-0 relative no-select"
      style={{
        height: 44,
        background: 'rgba(8, 1, 15, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid transparent',
        backgroundImage: `
          linear-gradient(rgba(8,1,15,0.96), rgba(8,1,15,0.96)),
          linear-gradient(90deg, transparent 0%, rgba(157,78,221,0.6) 30%, rgba(199,125,255,0.8) 50%, rgba(157,78,221,0.6) 70%, transparent 100%)
        `,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <polygon
            points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5"
            stroke="rgba(199,125,255,0.8)"
            strokeWidth="1.2"
            fill="rgba(157,78,221,0.12)"
          />
          <circle cx="10" cy="10" r="2.5" fill="#C77DFF" opacity="0.9" />
        </svg>
        <span
          style={{
            color: '#C77DFF',
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            fontFamily: 'var(--font-mono)',
            textShadow: '0 0 16px rgba(199,125,255,0.5)',
          }}
        >
          BREATH BUBBLE
        </span>
      </div>

      {/* ── Right: status + cam ── */}
      <div className="flex items-center gap-2">
        {/* Mouth state badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
          style={{
            background: `rgba(${
              mouthState === 'idle'     ? '77,150,255' :
              mouthState === 'charging' ? '255,217,61' :
                                          '107,203,119'
            }, 0.08)`,
            border: `1px solid ${color}35`,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: color,
              boxShadow: `0 0 5px ${color}`,
              animation: mouthState === 'charging'
                ? 'cyber-blink 1.4s ease-in-out infinite'
                : 'none',
            }}
          />
          <span
            style={{
              color,
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {STATE_LABEL[mouthState]}
          </span>
          {mouthState === 'charging' && (
            <span
              style={{
                color: '#FFD93D',
                fontSize: '0.62rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                minWidth: '2.6rem',
                textAlign: 'right',
                textShadow: '0 0 10px rgba(255,217,61,0.6)',
              }}
            >
              {duration.toFixed(1)}s
            </span>
          )}
        </div>

        {/* Camera dot */}
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: cameraActive ? '#6BCB77' : 'rgba(255,255,255,0.2)',
            boxShadow: cameraActive ? '0 0 8px #6BCB77' : 'none',
            animation: cameraActive ? 'cyber-pulse 2s ease-in-out infinite' : 'none',
          }}
        />
      </div>
    </div>
  );
}
