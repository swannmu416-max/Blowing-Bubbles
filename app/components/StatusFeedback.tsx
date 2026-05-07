interface StatusFeedbackProps {
  currentMAR: number;
  duration: number;
  isBlowing: boolean;
  mouthState: 'idle' | 'charging' | 'release';
}

export function StatusFeedback({ currentMAR, duration, isBlowing, mouthState }: StatusFeedbackProps) {
  const getStateColor = () => {
    switch (mouthState) {
      case 'idle': return '#4D96FF';
      case 'charging': return '#FFD93D';
      case 'release': return '#6BCB77';
      default: return '#4D96FF';
    }
  };

  const openness = Math.min(Math.max((currentMAR - 0.1) / 0.5 * 100, 0), 100);

  return (
    <div className="h-[70px] flex items-center justify-between px-12" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    }}>
      <div className="flex items-center gap-4" style={{
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '12px 20px',
        borderRadius: '12px',
        border: `1px solid ${getStateColor()}40`,
      }}>
        <div className="text-2xl">👄</div>
        <div>
          <div className="text-white text-sm">Current Status</div>
          <div className="text-white font-semibold">
            {isBlowing ? `Blowing... (MAR: ${currentMAR.toFixed(2)})` : 'Idle'}
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        <div className="flex flex-col gap-2">
          <div className="text-white text-sm">Mouth Openness</div>
          <div className="flex items-center gap-2">
            <div className="w-48 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
              <div
                className="h-full rounded-full transition-all duration-150"
                style={{
                  width: `${openness}%`,
                  background: getStateColor(),
                  boxShadow: `0 0 10px ${getStateColor()}`,
                }}
              />
            </div>
            <span className="text-white text-sm w-12">{Math.round(openness)}%</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-white text-sm">Hold Time</div>
          <div className="flex items-center gap-2">
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                  fill="none"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={getStateColor()}
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(duration / 15, 1))}`}
                  style={{
                    filter: `drop-shadow(0 0 5px ${getStateColor()})`,
                    transition: 'stroke-dashoffset 0.1s linear',
                  }}
                />
              </svg>
            </div>
            <span className="text-white text-sm font-semibold">{duration.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
