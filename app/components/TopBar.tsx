import { Settings } from 'lucide-react';

interface TopBarProps {
  cameraActive: boolean;
}

export function TopBar({ cameraActive }: TopBarProps) {
  return (
    <div className="h-[60px] flex items-center justify-between px-6" style={{
      background: 'rgba(255, 255, 255, 0.05)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '0 0 16px 16px'
    }}>
      <div className="text-white font-semibold">Breath Bubble AI</div>
      <div className="text-white flex items-center gap-2">
        Camera: {cameraActive ? 'ON 👄' : 'OFF'}
      </div>
      <button className="text-white flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </div>
  );
}
