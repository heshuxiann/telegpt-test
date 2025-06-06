/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'antd';

import { debounce } from '../../../../util/schedulers';
import { LeftOutlined, RightOutlined } from '../../icons';
import { getCorrectedText, type GrammarlyCheckItem } from '../../utils/grammarly';
import { sapling } from '../../utils/sapling';

import InputErrorTooltip from './InputErrorTooltip';
import HighlightedText from './tabs/HighlightedText';

import './InputGrammar.scss';

type CorrectionItem = {
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
};
export type ErrorsMarker = {
  left:number;
  top:number;
  width:number;
  height:number;
  replacement:string;
  start:number;
  end:number;
  general_error_type: string;
};
export interface InputGrammerProps {
  inputRef: React.RefObject<HTMLDivElement | null>;
}
const InputGrammar = (props:InputGrammerProps) => {
  const { inputRef } = props;
  const [errorRanges, setErrorRanges] = useState<CorrectionItem[]>([]);
  const [errorMarkers, setErrorMarkers] = useState<ErrorsMarker[]>([]);
  const [spalingLoading, setSpalingLoading] = useState(false);
  const [errorsModalVisible, setErrorsModalVisible] = useState(false);
  const [errorsModalPosition, setErrorsModalPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  useEffect(() => {
    const editor = inputRef.current;
    editor?.addEventListener('input', handleInputChange);
    return () => {
      editor?.removeEventListener('input', handleInputChange);
    };
  });
  const checkTextInput = async () => {
    const text = inputRef.current?.innerText;
    if (text) {
      setSpalingLoading(true);
      const corrections = await sapling.check(text);
      setErrorRanges(corrections as CorrectionItem[]);
      if (corrections.length > 0) {
        highLightErrors(corrections);
      }
      setSpalingLoading(false);
    }
  };
  const inputNlpRuleCheck = debounce(checkTextInput, 2000, false, true);
  const handleInputChange = () => {
    inputNlpRuleCheck();
  };

  function getTextNodes(node: HTMLDivElement) {
    // eslint-disable-next-line no-null/no-null
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    return textNodes;
  }

  function getNodeForIndex(textNodes: Node[], index: number) {
    let remaining = index;
    for (const node of textNodes) {
      if (node.nodeType === Node.TEXT_NODE && remaining <= (node as Text).length) {
        return { node, offset: remaining };
      }
      if (node.nodeType === Node.TEXT_NODE) {
        remaining -= (node as Text).length;
      }
    }
    // eslint-disable-next-line no-null/no-null
    return { node: null, offset: 0 };
  }

  function getUnderlineTOffset(rect: DOMRect, containerRect: DOMRect, editableDiv: HTMLDivElement) {
    const computed = getComputedStyle(editableDiv);
    const lineHeight = parseFloat(computed.lineHeight);
    const top = rect.top - containerRect.top;
    const left = rect.left - containerRect.left;
    return {
      left, top, width: rect.width, height: lineHeight,
    };
  }

  function pruneInvalidRanges(
    text: string,
    corrections: CorrectionItem[],
  ) {
    return corrections.filter((correction: CorrectionItem) => {
      const { start, end } = correction;
      if (end > text.length) return false; // 被删掉了
      const span = text.slice(start, end);
      return /\S/.test(span); // 非空内容才保留
    });
  }
  function highLightErrors(corrections: CorrectionItem[]) {
    const textarea = inputRef.current;
    // const overlay = highlightRef.current;
    if (!textarea) return;
    const textNodes = getTextNodes(textarea);
    const textContent = textarea.textContent || '';
    if (!textNodes) return;
    setErrorMarkers([]);
    const validRanges = pruneInvalidRanges(textContent, corrections);
    const markers = [];
    for (const item of validRanges) {
      const { start, end } = item;
      const { replacement, general_error_type } = item;
      if (start !== undefined && end !== undefined) {
        const range = document.createRange();
        const { node: startNode, offset: startOffset } = getNodeForIndex(textNodes, start);
        const { node: endNode, offset: endOffset } = getNodeForIndex(textNodes, end);

        if (!startNode || !endNode) continue;

        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        const rects = range.getClientRects();
        for (const rect of rects) {
          const marker = document.createElement('div');
          marker.className = 'underline-block';
          const textareaReact = textarea.getBoundingClientRect();
          const {
            left, top, width, height,
          } = getUnderlineTOffset(rect, textareaReact, textarea);
          markers.push({
            left,
            top,
            width,
            height,
            start,
            end,
            replacement,
            general_error_type,
          });
        }
      }
    }
    setErrorMarkers(markers);
  }
  const handleFixError = useCallback((errorItem:{ start: number; end: number; replacement: string;errorIndex:number }) => {
    const {
      start, end, replacement, errorIndex,
    } = errorItem;
    const textarea = inputRef.current;
    if (!textarea) return;
    // eslint-disable-next-line no-console
    console.log(start, end, replacement);
    const textNodes = getTextNodes(textarea);
    const { node: startNode, offset: startOffset } = getNodeForIndex(textNodes, start);
    const { node: endNode, offset: endOffset } = getNodeForIndex(textNodes, end);

    if (!startNode || !endNode) return;

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);

    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));
    const newErrorRanges = errorRanges.filter((_, index) => index !== errorIndex).map((item) => {
      if (item.start > start) {
        const offset = replacement.length - (end - start);
        item.start += offset;
        item.end += offset;
      }
      return item;
    });
    setErrorRanges(newErrorRanges);
    highLightErrors(newErrorRanges);
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [errorRanges, inputRef]);
  const showErrorModal = () => {
    if (inputRef && inputRef.current) {
      const inputReact = inputRef.current.getBoundingClientRect();
      const { left, top } = inputReact;
      setErrorsModalPosition({ left, top: top - 240 });
      setErrorsModalVisible(true);
    }
  };
  const closeErrorModal = useCallback(() => {
    setErrorsModalVisible(false);
  }, []);
  const handleFixAllErrors = useCallback(() => {
    const newErrorRanges = errorRanges.map((item) => {
      return {
        description: item.description,
        offset: item.start,
        length: item.end - item.start,
        originalText: item.original_text,
        remove_segment: false,
        suggestions: [item.replacement],
      };
    });
    const text = inputRef.current?.innerText || '';
    const newText = getCorrectedText(text, newErrorRanges);
    if (newText) {
      inputRef.current!.innerText = newText;
      setErrorMarkers([]);
    }
    closeErrorModal();
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [errorRanges, inputRef]);
  return (
    <>
      <div className="absolute left-0 top-0 pointer-events-auto">
        {errorMarkers.map((item, index) => {
          return (
            <InputErrorTooltip
              left={item.left}
              top={item.top}
              width={item.width}
              height={item.height}
              replacement={item.replacement}
              start={item.start}
              end={item.end}
              errorIndex={index}
              generalErrorType={item.general_error_type}
              handleFixError={handleFixError}
            />
          );
        })}
      </div>
      <div className="sapling-badge-container">
        <div className="sapling-status-container">
          <div className="sapling-badge-errors">
            {errorMarkers.length > 0 && (
              <div className="sapling-badge-errors-count" onClick={showErrorModal}>
                {errorMarkers.length}
              </div>
            )}
          </div>
          {spalingLoading && (<div className="sapling-badge-spinner" />)}
        </div>
      </div>
      <Modal
        className="sapling-errors-modal"
        closable={false}
        footer={null}
        open={errorsModalVisible}
        onCancel={closeErrorModal}
        style={{ top: errorsModalPosition.top, left: errorsModalPosition.left } as React.CSSProperties}
      >
        <ErrorsReview
          errorRanges={errorRanges}
          handleFixError={handleFixError}
          handleFixAllErrors={handleFixAllErrors}
          onClose={closeErrorModal}
        />
      </Modal>
    </>
  );
};

const ErrorsReview = ({
  errorRanges, onClose, handleFixAllErrors, handleFixError,
}:{
  errorRanges:CorrectionItem[];
  onClose:()=>void;
  handleFixAllErrors:()=>void;
  handleFixError:({
    start, end, replacement, errorIndex,
  }:{ start: number; end: number; replacement: string; errorIndex:number })=>void; }) => {
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [currentErrorRange, setCurrentErrorRange] = useState<CorrectionItem>(errorRanges[0]);
  const [currentError, setCurrentError] = useState<GrammarlyCheckItem[]>([]);
  const [currentSentence, setCurrentSentence] = useState('');

  useEffect(() => {
    const curRange = errorRanges[currentErrorIndex];
    setCurrentErrorRange(curRange);
    setCurrentError([{
      description: curRange.description,
      offset: curRange.start - curRange.sentence_start,
      length: curRange.end - curRange.start,
      originalText: curRange.original_text,
      remove_segment: false,
      suggestions: [curRange.replacement],
    }]);
    setCurrentSentence(curRange.sentence);
  }, [currentErrorIndex, errorRanges]);

  const handleClickPrev = () => {
    if (currentErrorIndex > 0) {
      setCurrentErrorIndex(currentErrorIndex - 1);
    }
  };
  const handleClickNext = () => {
    if (currentErrorIndex < errorRanges.length - 1) {
      setCurrentErrorIndex(currentErrorIndex + 1);
    }
  };
  const handleAccept = useCallback(() => {
    handleFixError({
      start: currentErrorRange.start,
      end: currentErrorRange.end,
      replacement: currentErrorRange.replacement,
      errorIndex: currentErrorIndex,
    });
    if (errorRanges.length === 1) {
      onClose();
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [currentErrorIndex, currentErrorRange]);

  return (
    <div className="h-[190px] flex flex-col overflow-hidden">
      <div className="flex flex-row items-center justify-between">
        <h3>Review suggestions</h3>
        <div className="h-[26px] rounded-[6px] overflow-hidden flex flex-row">
          <div className="w-[21px] bg-[#F1F1F1] cursor-pointer" onClick={handleClickPrev}>
            <LeftOutlined />
          </div>
          <div className="px-[5px] text-[#979797]">{currentErrorIndex + 1}/{errorRanges.length}</div>
          <div className="w-[21px] bg-[#F1F1F1] cursor-pointer" onClick={handleClickNext}>
            <RightOutlined />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-row items-center gap-[8px]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#FF9900]" />
          <span className="text-[14px] text-[#959595]">Improve your text</span>
        </div>
        <div className="flex-1 overflow-auto">
          {currentError ? (
            <HighlightedText text={currentSentence} errors={currentError} />
          ) : undefined}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between  pt-[10px] border-t-[1px] border-black/10">
        <div
          className="text-[#7D40FF] border-[1px] border-[#7D40FF] rounded-[6px] px-[8px] py-[5px]"
          onClick={handleFixAllErrors}
        >
          Accept all ({errorRanges.length})
        </div>
        <div className="flex flex-row items-center gap-[8px]">
          {/* <Button color="default" variant="text">
            Dismiss
          </Button> */}
          <Button color="purple" variant="solid" onClick={handleAccept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputGrammar;
