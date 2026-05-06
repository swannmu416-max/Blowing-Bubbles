import * as Slider from '@radix-ui/react-slider';

interface ControlPanelProps {
  sensitivity: number;
  gravity: number;
  surfaceTension: number;
  onSensitivityChange: (value: number) => void;
  onGravityChange: (value: number) => void;
  onSurfaceTensionChange: (value: number) => void;
  mouthState: 'idle' | 'charging' | 'release';
}

const STATE_COLORS = {
  idle: '#4D96FF',
  charging: '#FFD93D',
  release: '#6BCB77',
} as const;

interface SliderFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}

function SliderField({ label, value, onChange, color }: SliderFieldProps) {
  return (
    <div className="flex flex-col gap-3 w-64">
      <div className="flex items-center justify-between">
        <label className="text-white text-sm font-medium tracking-wide opacity-80">
          {label}
        </label>
        <span
          className="text-xs font-mono tabular-nums"
          style={{ color }}
        >
          {value}
        </span>
      </div>
      <Slider.Root
        value={[value]}
        onValueChange={([val]) => onChange(val)}
        min={0}
        max={100}
        step={1}
        className="relative flex items-center w-full h-5 cursor-pointer select-none touch-none"
      >
        <Slider.Track
          className="relative h-1.5 w-full rounded-full overflow-hidden"
          style={{ background: 'rgba(255, 255, 255, 0.15)' }}
        >
          <Slider.Range
            className="absolute h-full rounded-full"
            style={{
              background: color,
              boxShadow: `0 0 8px ${color}80`,
            }}
          />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          style={{
            background: color,
            boxShadow: `0 0 12px ${color}, 0 0 4px ${color}`,
            transition: 'box-shadow 0.2s ease-out',
          }}
        />
      </Slider.Root>
    </div>
  );
}

export function ControlPanel({
  sensitivity,
  gravity,
  surfaceTension,
  onSensitivityChange,
  onGravityChange,
  onSurfaceTensionChange,
  mouthState,
}: ControlPanelProps) {
  const color = STATE_COLORS[mouthState];

  return (
    <div
      className="h-[120px] flex items-center justify-around px-12"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <SliderField
        label="Breath Sensitivity"
        value={sensitivity}
        onChange={onSensitivityChange}
        color={color}
      />
      <SliderField
        label="Gravity / Wind"
        value={gravity}
        onChange={onGravityChange}
        color={color}
      />
      <SliderField
        label="Surface Tension"
        value={surfaceTension}
        onChange={onSurfaceTensionChange}
        color={color}
      />
    </div>
  );
}
