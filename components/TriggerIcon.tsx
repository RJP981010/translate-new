import { Languages } from 'lucide-react';

interface TriggerIconProps {
  onMouseEnter: () => void;
  style: React.CSSProperties;
}

export function TriggerIcon({ onMouseEnter, style }: TriggerIconProps) {
  return (
    <button
      type="button"
      aria-label="翻译"
      onMouseEnter={onMouseEnter}
      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-md transition hover:bg-gray-50 hover:text-blue-600"
      style={style}
    >
      <Languages size={16} />
    </button>
  );
}
