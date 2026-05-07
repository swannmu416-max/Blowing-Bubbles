import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface ResultModalProps {
  isOpen: boolean;
  bubbleSize: number;
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

// 7-tier achievement table based on Hold Time
const ACHIEVEMENTS: Achievement[] = [
  {
    maxSeconds: 3,
    vol: '< 500 mL',
    emoji: '🍎',
    name: 'An Apple',
    message: 'A little puff. Did a mosquito just sneeze?',
  },
  {
    maxSeconds: 8,
    vol: '~ 1,500 mL',
    emoji: '🍾',
    name: 'A 1.5L Soda Bottle',
    message: "Not bad! Enough to blow out all your birthday candles.",
  },
  {
    maxSeconds: 15,
    vol: '~ 3,000 mL',
    emoji: '🍉',
    name: 'A Watermelon',
    message: 'Solid lungs! You just blew a watermelon out of thin air.',
  },
  {
    maxSeconds: 30,
    vol: '~ 4,500 mL',
    emoji: '🎈',
    name: 'A Party Balloon',
    message: 'Impressive control! But take a breath before you pass out.',
  },
  {
    maxSeconds: 60,
    vol: '~ 6,000 mL',
    emoji: '🏀',
    name: 'A Basketball',
    message: 'Iron Lungs unlocked! Are you secretly a professional swimmer?',
  },
  {
    maxSeconds: 120,
    vol: '~ 7,500 mL',
    emoji: '🤿',
    name: 'A Scuba Tank',
    message: 'Human limit shattered! A single breath for over a minute?!',
  },
  {
    maxSeconds: Infinity,
    vol: '~ 8,000 mL (Max)',
    emoji: '🏆',
    name: 'World Record Trophy',
    message: '121 SECONDS! You just tied the Guinness World Record! Are you even human?',
  },
];

function getAchievement(seconds: number): Achievement {
  return ACHIEVEMENTS.find((a) => seconds < a.maxSeconds) ?? ACHIEVEMENTS[ACHIEVEMENTS.length - 1];
}

export function ResultModal({ isOpen, bubbleSize, duration, onClose }: ResultModalProps) {
  const [displayBEU, setDisplayBEU] = useState(0);
  const [copied, setCopied] = useState(false);

  const achievement = getAchievement(duration);
  // BEU formula: size × duration × multiplier
  const calculatedBEU = Math.round(bubbleSize * duration * 50);

  // Count-up animation
  useEffect(() => {
    if (!isOpen) return;
    setDisplayBEU(0);
    setCopied(false);
    let current = 0;
    const increment = calculatedBEU / 50;
    const id = setInterval(() => {
      current += increment;
      if (current >= calculatedBEU) {
        setDisplayBEU(calculatedBEU);
        clearInterval(id);
      } else {
        setDisplayBEU(Math.floor(current));
      }
    }, 20);
    return () => clearInterval(id);
  }, [isOpen, calculatedBEU]);

  const handleShare = async () => {
    const text = [
      '🫧 Breath Bubble AI',
      `${achievement.emoji} ${achievement.name}`,
      `⏱️ Hold Time: ${duration.toFixed(1)}s`,
      `💨 Estimated Vol: ${achievement.vol}`,
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)' }}
    >
      <motion.div
        initial={{ scale: 0.86, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative p-8 rounded-2xl text-center"
        style={{
          background: 'oklch(0.12 0.02 240)',
          border: '1px solid oklch(0.28 0.04 240)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
          width: 480,
        }}
      >
        {/* Header */}
        <div className="text-white text-xl font-semibold mb-5 tracking-wide">
          ✨ Blow Complete!
        </div>

        {/* BEU */}
        <div className="mb-5">
          <div className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'oklch(0.6 0.04 240)' }}>
            Virtual Breath Energy Index
          </div>
          <div className="text-5xl font-bold tabular-nums" style={{ color: '#FFD93D' }}>
            🏆 {displayBEU.toLocaleString()} BEU
          </div>
        </div>

        {/* Achievement icon */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.25, damping: 12, stiffness: 200 }}
          className="text-7xl mb-2"
        >
          {achievement.emoji}
        </motion.div>
        <div className="text-white text-lg font-semibold mb-1">{achievement.name}</div>
        <div className="text-sm italic mb-5 leading-relaxed" style={{ color: 'oklch(0.7 0.03 240)' }}>
          "{achievement.message}"
        </div>

        {/* Stats grid */}
        <div
          className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-xl text-sm"
          style={{ background: 'oklch(0.17 0.025 240)' }}
        >
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.55 0.04 240)' }}>
              Hold Time
            </div>
            <div className="text-white font-semibold tabular-nums">{duration.toFixed(1)}s</div>
          </div>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.55 0.04 240)' }}>
              Estimated Vol
            </div>
            <div className="text-white font-semibold">{achievement.vol}</div>
          </div>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.55 0.04 240)' }}>
              Visual Case
            </div>
            <div className="text-white font-semibold">{achievement.emoji} {achievement.name}</div>
          </div>
          <div className="text-left">
            <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: 'oklch(0.55 0.04 240)' }}>
              Max Bubble Size
            </div>
            <div className="text-white font-semibold tabular-nums">{Math.round(bubbleSize)}px</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'oklch(0.44 0.18 240)',
              boxShadow: '0 4px 16px oklch(0.44 0.18 240 / 0.35)',
            }}
          >
            🔄 Blow Again
          </button>
          <button
            onClick={handleShare}
            className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: copied ? 'oklch(0.52 0.16 145)' : 'oklch(0.46 0.14 145)',
              boxShadow: `0 4px 16px oklch(${copied ? '0.52 0.16 145' : '0.46 0.14 145'} / 0.35)`,
              transition: 'background 0.2s ease-out',
            }}
          >
            {copied ? '✓ Copied!' : '🚀 Share Result'}
          </button>
        </div>

        <div className="mt-4 text-xs leading-relaxed" style={{ color: 'oklch(0.45 0.03 240)' }}>
          All visual mappings are metaphorical and used only for playful interaction feedback.
        </div>
      </motion.div>
    </div>
  );
}
