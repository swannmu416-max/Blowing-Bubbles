import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

interface ResultModalProps {
  isOpen: boolean;
  bubbleCount: number;
  duration: number;
  onClose: () => void;
}

interface Achievement {
  maxSeconds: number;
  vol: string;
  emoji: string;
  name: string;
  message: string;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    maxSeconds: 3,
    vol: '< 500 mL',
    emoji: '🌼',
    name: '蒲公英',
    message: '就这？蚊子打个哈欠都比你这口长。',
  },
  {
    maxSeconds: 8,
    vol: '~ 1,500 mL',
    emoji: '🎂',
    name: '生日蜡烛',
    message: '恭喜！你成功吹灭了 1 岁生日蛋糕上的蜡烛。',
  },
  {
    maxSeconds: 15,
    vol: '~ 3,000 mL',
    emoji: '🫧',
    name: '肥皂泡泡',
    message: '完美的张力！这是一个教科书级大小的泡泡。',
  },
  {
    maxSeconds: 30,
    vol: '~ 4,500 mL',
    emoji: '🎈',
    name: '派对气球',
    message: '耐力惊人！这个气球已经可以拿去布置派对了。',
  },
  {
    maxSeconds: 60,
    vol: '~ 6,000 mL',
    emoji: '🎷',
    name: '萨克斯',
    message: '专业级控制力！你是在悄悄练习萨克斯吗？',
  },
  {
    maxSeconds: 120,
    vol: '~ 7,500 mL',
    emoji: '🛶',
    name: '充气皮划艇',
    message: '不可思议！你凭一己之力充好了一艘皮划艇。',
  },
  {
    maxSeconds: Infinity,
    vol: '~ 8,000 mL',
    emoji: '🏆',
    name: '世界纪录',
    message: '121秒！吉尼斯世界纪录已达成。你真的不是外星人吗？',
  },
];

function getAchievement(seconds: number): Achievement {
  return ACHIEVEMENTS.find((a) => seconds < a.maxSeconds) ?? ACHIEVEMENTS[ACHIEVEMENTS.length - 1];
}

export function ResultModal({ isOpen, bubbleCount, duration, onClose }: ResultModalProps) {
  const [displayBEU, setDisplayBEU] = useState(0);
  const [copied, setCopied]         = useState(false);

  const achievement   = getAchievement(duration);
  const calculatedBEU = Math.round(bubbleCount * duration * 40);

  // Count-up animation
  useEffect(() => {
    if (!isOpen) return;
    setDisplayBEU(0);
    setCopied(false);
    let current = 0;
    const step  = Math.max(1, calculatedBEU / 60);
    const id    = setInterval(() => {
      current += step;
      if (current >= calculatedBEU) {
        setDisplayBEU(calculatedBEU);
        clearInterval(id);
      } else {
        setDisplayBEU(Math.floor(current));
      }
    }, 16);
    return () => clearInterval(id);
  }, [isOpen, calculatedBEU]);

  const handleShare = async () => {
    const text = [
      '🫧 Breath Bubble AI',
      `${achievement.emoji} ${achievement.name}`,
      `⏱️ 吹气时长: ${duration.toFixed(1)}s`,
      `🫧 气泡数量: ${bubbleCount}个`,
      `💨 估算肺活量: ${achievement.vol}`,
      `🏆 ${calculatedBEU.toLocaleString()} BEU`,
      `"${achievement.message}"`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(4, 0, 10, 0.88)' }}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.90, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 26, stiffness: 340 }}
            className="relative text-center overflow-hidden"
            style={{
              width: 440,
              background: 'rgba(8, 1, 15, 0.98)',
              border: '1px solid rgba(157, 78, 221, 0.35)',
              boxShadow: '0 0 0 1px rgba(157,78,221,0.08), 0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(157,78,221,0.08)',
            }}
          >
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTop: 2, borderLeft: 2 },
              { top: 0, right: 0, borderTop: 2, borderRight: 2 },
              { bottom: 0, left: 0, borderBottom: 2, borderLeft: 2 },
              { bottom: 0, right: 0, borderBottom: 2, borderRight: 2 },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 12, height: 12,
                  borderStyle: 'solid',
                  borderColor: '#C77DFF',
                  borderTopWidth:    c.borderTop    ?? 0,
                  borderLeftWidth:   c.borderLeft   ?? 0,
                  borderRightWidth:  c.borderRight  ?? 0,
                  borderBottomWidth: c.borderBottom ?? 0,
                  top:    c.top    !== undefined ? c.top    : undefined,
                  left:   c.left   !== undefined ? c.left   : undefined,
                  right:  c.right  !== undefined ? c.right  : undefined,
                  bottom: c.bottom !== undefined ? c.bottom : undefined,
                  zIndex: 10,
                }}
              />
            ))}

            {/* Shimmer top bar */}
            <div
              style={{
                height: 3,
                background: 'linear-gradient(90deg, #3C096C, #9D4EDD, #C77DFF, #9D4EDD, #3C096C)',
                backgroundSize: '200% 100%',
                animation: 'cyber-shimmer 3s linear infinite',
              }}
            />

            <div className="p-8">
              {/* Header */}
              <div
                style={{
                  color: 'rgba(199,125,255,0.9)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.18em',
                  marginBottom: '1.5rem',
                  textTransform: 'uppercase',
                }}
              >
                ── SESSION COMPLETE ──
              </div>

              {/* BEU score */}
              <div className="mb-6">
                <div
                  style={{
                    color: 'rgba(157,78,221,0.45)',
                    fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  BREATH ENERGY UNITS
                </div>
                <div
                  style={{
                    color: '#FFD93D',
                    fontSize: '3.2rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    lineHeight: 1,
                    textShadow: '0 0 30px rgba(255,217,61,0.45)',
                  }}
                >
                  {displayBEU.toLocaleString()}
                  <span
                    style={{
                      fontSize: '1.1rem',
                      marginLeft: '0.4rem',
                      fontWeight: 600,
                      opacity: 0.6,
                      color: '#FFD93D',
                    }}
                  >
                    BEU
                  </span>
                </div>
              </div>

              {/* Achievement */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.2, damping: 16, stiffness: 240 }}
                style={{ marginBottom: '0.5rem' }}
              >
                {/* Circular achievement frame */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: '1px solid rgba(157,78,221,0.45)',
                    background: 'rgba(157,78,221,0.08)',
                    boxShadow: '0 0 20px rgba(157,78,221,0.15)',
                    fontSize: '2.2rem',
                  }}
                >
                  {achievement.emoji}
                </div>
              </motion.div>

              <div
                style={{
                  color: '#C77DFF',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  marginBottom: '0.35rem',
                  letterSpacing: '0.06em',
                }}
              >
                {achievement.name}
              </div>
              <div
                style={{
                  color: 'rgba(157,78,221,0.45)',
                  fontSize: '0.78rem',
                  fontStyle: 'italic',
                  marginBottom: '1.5rem',
                  lineHeight: 1.6,
                  padding: '0 1rem',
                }}
              >
                "{achievement.message}"
              </div>

              {/* Stats grid */}
              <div
                className="grid grid-cols-2 gap-px mb-6"
                style={{
                  background: 'rgba(157,78,221,0.12)',
                  border: '1px solid rgba(157,78,221,0.15)',
                }}
              >
                {[
                  { label: 'DURATION',   value: `${duration.toFixed(1)}s` },
                  { label: 'BUBBLES',    value: `${bubbleCount}` },
                  { label: 'LUNG VOL',   value: achievement.vol },
                  { label: 'RANK',       value: achievement.name },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="text-left px-3 py-2.5"
                    style={{ background: 'rgba(8,1,15,0.95)', borderLeft: '2px solid rgba(157,78,221,0.3)' }}
                  >
                    <div
                      style={{
                        color: 'rgba(157,78,221,0.45)',
                        fontSize: '0.55rem',
                        fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-center">
                {/* Primary */}
                <button
                  onClick={onClose}
                  className="flex items-center gap-2 font-semibold text-sm transition-all duration-150 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #9D4EDD, #C77DFF)',
                    color: '#fff',
                    padding: '9px 24px',
                    border: 'none',
                    borderRadius: 2,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    boxShadow: '0 0 16px rgba(157,78,221,0.4)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 0 24px rgba(199,125,255,0.6)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 0 16px rgba(157,78,221,0.4)';
                  }}
                >
                  RETRY
                </button>

                {/* Secondary */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 font-semibold text-sm transition-all duration-150 active:scale-95"
                  style={{
                    background: copied ? 'rgba(107,203,119,0.12)' : 'rgba(157,78,221,0.08)',
                    color: copied ? '#6BCB77' : 'rgba(199,125,255,0.8)',
                    padding: '9px 24px',
                    borderRadius: 2,
                    border: `1px solid ${copied ? 'rgba(107,203,119,0.4)' : 'rgba(157,78,221,0.35)'}`,
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-out',
                  }}
                  onMouseEnter={e => {
                    if (!copied) {
                      e.currentTarget.style.borderColor = 'rgba(199,125,255,0.6)';
                      e.currentTarget.style.background = 'rgba(157,78,221,0.14)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!copied) {
                      e.currentTarget.style.borderColor = 'rgba(157,78,221,0.35)';
                      e.currentTarget.style.background = 'rgba(157,78,221,0.08)';
                    }
                  }}
                >
                  {copied ? '✓ COPIED' : 'SHARE'}
                </button>
              </div>

              <div
                style={{
                  marginTop: '1.2rem',
                  color: 'rgba(157,78,221,0.22)',
                  fontSize: '0.58rem',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  lineHeight: 1.6,
                }}
              >
                所有数据仅供娱乐参考，不代表真实肺活量测量结果。
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
