import { useCallback, useEffect, useState } from 'react';
import {
  getCurrentSentenceForSelection,
  getSelectedText,
  getSelectionRect,
  validateSelection,
} from '../lib/selection';

export interface SelectionState {
  text: string;
  selectionId: string | null;
  sentence?: string;
  rect: DOMRect | null;
  showIcon: boolean;
  selectionKey: number;
  validationError: string | null;
}

const initial: SelectionState = {
  text: '',
  selectionId: null,
  sentence: undefined,
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
      if (panelOpen) {
        setState((s) => ({ ...s, showIcon: false, validationError: null }));
        return;
      }
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
        selectionId: crypto.randomUUID(),
        sentence: undefined,
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
      selectionId: crypto.randomUUID(),
      sentence: getCurrentSentenceForSelection(),
      rect,
      showIcon: true,
      selectionKey: Date.now(),
      validationError: null,
    });
  }, [panelOpen]);

  useEffect(() => {
    const onMouseUp = () => {
      requestAnimationFrame(refresh);
    };
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('selectionchange', onMouseUp);
    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('selectionchange', onMouseUp);
    };
  }, [refresh]);

  const clearIcon = useCallback(() => {
    setState((s) => ({ ...s, showIcon: false }));
  }, []);

  return { ...state, refresh, clearIcon };
}
