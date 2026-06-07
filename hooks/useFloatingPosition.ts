import { useEffect, useState } from 'react';

interface UseFloatingPositionOptions {
  referenceRect: DOMRect | null;
  enabled: boolean;
  placement?: 'bottom' | 'top';
  offsetPx?: number;
  elementWidth?: number;
  elementHeight?: number;
  maxHeight?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function useFloatingPosition({
  referenceRect,
  enabled,
  placement = 'bottom',
  offsetPx = 8,
  elementWidth = 360,
  elementHeight = 32,
  maxHeight = 420,
}: UseFloatingPositionOptions) {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [floatingMaxHeight, setFloatingMaxHeight] = useState(maxHeight);

  useEffect(() => {
    if (!enabled || !referenceRect) {
      setCoords(null);
      return;
    }

    const padding = 12;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let x = referenceRect.left + referenceRect.width / 2 - elementWidth / 2;
    x = clamp(x, padding, viewportW - elementWidth - padding);

    const spaceBelow = viewportH - referenceRect.bottom - padding;
    const spaceAbove = referenceRect.top - padding;
    let useTop = placement === 'top';

    if (placement === 'bottom' && spaceBelow < 200 && spaceAbove > spaceBelow) {
      useTop = true;
    }

    let y: number;
    if (useTop) {
      y = referenceRect.top - offsetPx - elementHeight;
      setFloatingMaxHeight(Math.min(maxHeight, referenceRect.top - padding - offsetPx));
    } else {
      y = referenceRect.bottom + offsetPx;
      setFloatingMaxHeight(Math.min(maxHeight, spaceBelow - offsetPx));
    }

    y = clamp(y, padding, viewportH - elementHeight - padding);
    setCoords({ x, y });
  }, [
    referenceRect,
    enabled,
    placement,
    offsetPx,
    elementWidth,
    elementHeight,
    maxHeight,
  ]);

  return { coords, maxHeight: floatingMaxHeight };
}
