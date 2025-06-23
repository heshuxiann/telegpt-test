/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable new-cap */
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import { diff_match_patch } from 'diff-match-patch';
import debounce from 'lodash.debounce';

import { sapling } from '../../utils/grammar';

export interface CorrectionItem {
  description:string;
  end: number;
  error_type: string;
  general_error_type: string;
  id: string;
  replacement: string;
  sentence: string;
  sentence_start: number;
  original_text:string;
  start: number;
}

export interface ErrorMarker {
  left: number;
  top: number;
  width: number;
  height: number;
  start: number;
  end: number;
  replacement: string;
  general_error_type: string;
}

const dmp = new diff_match_patch();

function getTextNodes(node: HTMLElement) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
  const textNodes: Node[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  return textNodes;
}

function getNodeForIndex(textNodes: Node[], index: number) {
  let remaining = index;
  for (const node of textNodes) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const textLength = (node as Text).length;
    if (remaining <= textLength) {
      return { node, offset: remaining };
    }
    remaining -= textLength;
  }
  return { node: null, offset: 0 };
}

function getUnderlineOffset(rect: DOMRect, containerRect: DOMRect, editableDiv: HTMLElement) {
  const computed = getComputedStyle(editableDiv);
  const lineHeight = parseFloat(computed.lineHeight || '16');
  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    width: rect.width,
    height: lineHeight,
  };
}

function pruneInvalidRanges(text: string, corrections: CorrectionItem[]) {
  return corrections.filter(({ start, end, original_text }) => {
    if (end > text.length) return false;
    const span = text.slice(start, end);
    return span === original_text && /\S/.test(span);
  });
}

function updateErrorOffsetsWithInvalidate(
  oldText: string,
  newText: string,
  errors: CorrectionItem[],
): CorrectionItem[] {
  const diffs = dmp.diff_main(oldText, newText);
  dmp.diff_cleanupSemantic(diffs);

  const newErrors: CorrectionItem[] = [];
  let oldCursor = 0;

  for (const err of errors) {
    const start = err.start;
    const end = err.end;
    let valid = true;
    let offset = 0;
    oldCursor = 0;

    for (const [op, text] of diffs) {
      const len = text.length;

      if (op === 0) {
        oldCursor += len;
      } else if (op === -1) {
        // deletion
        if (oldCursor + len <= start) {
          offset -= len;
          oldCursor += len;
        } else if (oldCursor < end) {
          valid = false;
          break;
        }
      } else if (op === 1) {
        // insertion
        if (oldCursor <= start) {
          offset += len;
        } else if (oldCursor < end) {
          valid = false;
          break;
        }
      }
    }

    if (valid) {
      newErrors.push({
        ...err,
        start: start + offset,
        end: end + offset,
      });
    }
  }

  return newErrors;
}

export function useGrammarChecker(
  inputRef: React.RefObject<HTMLElement | null>,
  setErrorMarkers: (m: ErrorMarker[]) => void,
  {
    delay = 1000,
  }: {
    delay?: number;
  },
) {
  const [errorRanges, setErrorRanges] = useState<CorrectionItem[]>([]);
  const [spalingLoading, setSpalingLoading] = useState(false);
  const lastTextRef = useRef('');
  const lastCheckTimeRef = useRef(Date.now());

  const highLightErrors = useCallback((corrections: CorrectionItem[]) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const textContent = textarea.textContent || '';
    const textNodes = getTextNodes(textarea);
    if (!textNodes) return;

    setErrorMarkers([]);
    const validRanges = pruneInvalidRanges(textContent, corrections);
    const markers: ErrorMarker[] = [];

    for (const item of validRanges) {
      const {
        start, end, replacement, general_error_type,
      } = item;
      const { node: startNode, offset: startOffset } = getNodeForIndex(textNodes, start);
      const { node: endNode, offset: endOffset } = getNodeForIndex(textNodes, end);
      if (!startNode || !endNode) continue;

      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      const rects = range.getClientRects();
      const textareaRect = textarea.getBoundingClientRect();
      for (const rect of rects) {
        markers.push({
          ...getUnderlineOffset(rect, textareaRect, textarea),
          start,
          end,
          replacement,
          general_error_type,
        });
      }
    }

    setErrorMarkers(markers);
  }, [inputRef, setErrorMarkers]);

  const checkTextInput = async () => {
    const text = inputRef.current?.innerText || '';
    setSpalingLoading(true);
    const corrections = await sapling.check(text);
    lastTextRef.current = text;
    lastCheckTimeRef.current = Date.now();

    setErrorRanges(corrections);
    if (corrections.length > 0) {
      highLightErrors(corrections);
    } else {
      setErrorMarkers([]);
    }
    setSpalingLoading(false);
  };

  const inputNlpRuleCheck = useRef(debounce(checkTextInput, delay, { leading: false, trailing: true })).current;

  const handleInputChange = useCallback(() => {
    const newText = inputRef.current?.innerText || '';
    if (errorRanges.length > 0) {
      const updatedErrors = updateErrorOffsetsWithInvalidate(lastTextRef.current, newText, errorRanges);
      setErrorRanges(updatedErrors);
      highLightErrors(updatedErrors);
    }
    lastTextRef.current = newText;
    inputNlpRuleCheck();
  }, [errorRanges, highLightErrors, inputNlpRuleCheck, inputRef]);

  useEffect(() => {
    const editor = inputRef.current;
    editor?.addEventListener('input', handleInputChange);
    return () => {
      editor?.removeEventListener('input', handleInputChange);
    };
  }, [handleInputChange, inputRef]);

  const fixError = (index: number) => {
    const correction = errorRanges[index];
    const el = inputRef.current;
    if (!correction || !el || !correction.replacement) return;

    const { start, end, replacement } = correction;
    const fullText = el.innerText || '';

    const newText = fullText.slice(0, start) + replacement + fullText.slice(end);
    el.innerText = newText;

    // 更新 errorRanges：剔除当前项，重新计算剩余项的位置
    const newErrors: CorrectionItem[] = [];
    const offsetChange = replacement.length - (end - start);

    for (let i = 0; i < errorRanges.length; i++) {
      if (i === index) continue;

      const err = errorRanges[i];
      if (err.start >= end) {
        newErrors.push({
          ...err,
          start: err.start + offsetChange,
          end: err.end + offsetChange,
        });
      } else {
        newErrors.push(err);
      }
    }

    setErrorRanges(newErrors);
    lastTextRef.current = newText;
    highLightErrors(newErrors);
  };
  // ✅ 替换所有错误
  const fixAllErrors = () => {
    const el = inputRef.current;
    if (!el || errorRanges.length === 0) return;

    let fullText = el.innerText || '';
    const sorted = [...errorRanges].sort((a, b) => a.start - b.start);

    let offset = 0;
    for (const { start, end, replacement } of sorted) {
      if (!replacement) continue;
      const realStart = start + offset;
      const realEnd = end + offset;
      fullText = fullText.slice(0, realStart) + replacement + fullText.slice(realEnd);
      offset += replacement.length - (end - start);
    }

    el.innerText = fullText;
    lastTextRef.current = fullText;

    setErrorRanges([]);
    setErrorMarkers([]);
    inputNlpRuleCheck();
  };

  return {
    corrections: errorRanges,
    spalingLoading,
    fixError,
    fixAllErrors,
  };
}
