import { useCallback, useState } from 'react';
import { useFloatingPosition } from '../hooks/useFloatingPosition';
import { useLookupStream } from '../hooks/useLookupStream';
import { useSelection } from '../hooks/useSelection';
import { sendMessage } from '../lib/messaging';
import { LookupPanel } from './LookupPanel';
import { TriggerIcon } from './TriggerIcon';

function openSettings() {
  void sendMessage('openSettings', undefined);
}

export function SelectionTranslator() {
  const [panelOpen, setPanelOpen] = useState(false);
  const selection = useSelection(panelOpen);
  const lookup = useLookupStream();

  const iconFloating = useFloatingPosition({
    referenceRect: selection.rect,
    enabled: selection.showIcon && !!selection.rect,
    placement: 'bottom',
    offsetPx: 6,
    elementWidth: 32,
    elementHeight: 32,
  });

  const panelFloating = useFloatingPosition({
    referenceRect: selection.rect,
    enabled: panelOpen && !!selection.rect,
    placement: 'bottom',
    offsetPx: 10,
    elementWidth: 360,
    elementHeight: 120,
    maxHeight: 400,
  });

  const handleIconHover = useCallback(() => {
    if (!selection.text || selection.validationError) return;
    setPanelOpen(true);
    selection.clearIcon();
    lookup.start(selection.text);
  }, [lookup, selection]);

  const handleClose = useCallback(() => {
    lookup.cancel();
    lookup.reset();
    setPanelOpen(false);
  }, [lookup]);

  const handleRetry = useCallback(() => {
    if (selection.text) lookup.start(selection.text);
  }, [lookup, selection.text]);

  const iconStyle: React.CSSProperties | undefined = iconFloating.coords
    ? {
        position: 'fixed',
        left: iconFloating.coords.x,
        top: iconFloating.coords.y,
        zIndex: 2147483646,
      }
    : undefined;

  const panelStyle: React.CSSProperties | undefined = panelFloating.coords
    ? {
        position: 'fixed',
        left: panelFloating.coords.x,
        top: panelFloating.coords.y,
        zIndex: 2147483647,
      }
    : undefined;

  return (
    <div data-translator-root className="pointer-events-none fixed inset-0 z-[2147483645]">
      {selection.validationError && selection.rect && !panelOpen && (
        <div
          className="pointer-events-auto rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow"
          style={{
            position: 'fixed',
            left: selection.rect.left,
            top: selection.rect.bottom + 6,
          }}
        >
          {selection.validationError}
        </div>
      )}

      {selection.showIcon && iconStyle && (
        <div className="pointer-events-auto" style={iconStyle}>
          <TriggerIcon onMouseEnter={handleIconHover} style={{}} />
        </div>
      )}

      {panelOpen && panelStyle && (
        <div className="pointer-events-auto">
          <LookupPanel
            selectedText={selection.text}
            stream={lookup.state}
            onClose={handleClose}
            onRetry={handleRetry}
            onOpenSettings={openSettings}
            style={panelStyle}
            maxHeight={panelFloating.maxHeight}
          />
        </div>
      )}
    </div>
  );
}
