import { useCallback, useEffect, useState } from 'react';
import { getSelectedText, getSelectionRect, validateSelection } from '../lib/selection';

export interface SelectionState {
  text: string;
  rect: DOMRect | null;
  showIcon: boolean;
  selectionKey: number;
  validationError: string | null;
}

const initial: SelectionState = {
  text: '',
  rect: null,
  showIcon: false,
  selectionKey: 0,
  validationError: null,
};

export function useSelection(panelOpen: boolean) {
  const [state, setState] = useState<SelectionState>(initial);

  const refresh = useCallback(() => {
    const raw = getSelectedText();
    const rect = getSelectionRect();
    if (!raw || !rect || rect.width === 0) {
      setState((s) => ({
        ...initial,
        selectionKey: s.selectionKey,
      }));
      return;
    }

    const validation = validateSelection(raw);
    if (!validation.ok) {
      setState({
        text: raw,
        rect,
        showIcon: false,
        selectionKey: Date.now(),
        validationError:
          validation.reason === 'too_long'
            ? '选区过长，请缩小范围'
            : '无可查词内容',
      });
      return;
    }

    setState({
      text: validation.text,
      rect,
      showIcon: !panelOpen,
      selectionKey: Date.now(),
      validationError: null,
    });
  }, [panelOpen]);

  useEffect(() => {
    const onMouseUp = () => {
      requestAnimationFrame(refresh);
    };
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [refresh]);

  const clearIcon = useCallback(() => {
    setState((s) => ({ ...s, showIcon: false }));
  }, []);

  return { ...state, refresh, clearIcon };
}
