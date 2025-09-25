/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from 'antd';

import type { Signal } from '../../../../util/signals';

import { LeftOutlined, RightOutlined } from '../../icons';
import { type GrammarlyCheckItem } from '../../utils/grammarly';
import { useGrammarChecker } from './useGrammarChecker';

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
export interface InputGrammerProps {
  inputRef: React.RefObject<HTMLDivElement | undefined>;
  getHtml: Signal<string>;
  setHtml: (newValue: string) => void;
}
const InputGrammar = (props:InputGrammerProps) => {
  const { inputRef, getHtml, setHtml } = props;
  // const [errorMarkers, setErrorMarkers] = useState<ErrorMarker[]>([]);
  const [errorsModalVisible, setErrorsModalVisible] = useState(false);
  const [errorsModalPosition, setErrorsModalPosition] = useState<{ left: number; top: number }>({ left: 0, top: 0 });
  const {
    corrections, spalingLoading, errorMarkers, fixError, fixAllErrors,
  } = useGrammarChecker(inputRef, getHtml, setHtml, {});
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
              errorIndex={index}
              generalErrorType={item.general_error_type}
              handleFixError={fixError}
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
        destroyOnHidden
        style={{ top: errorsModalPosition.top, left: errorsModalPosition.left } as React.CSSProperties}
      >
        <ErrorsReview
          errorRanges={corrections}
          handleFixError={fixError}
          handleFixAllErrors={fixAllErrors}
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
  handleFixError:(errorIndex:number)=>void; }) => {
  const [currentErrorIndex, setCurrentErrorIndex] = useState(0);
  const [currentErrorRange, setCurrentErrorRange] = useState<CorrectionItem>(errorRanges[0]);
  const [currentError, setCurrentError] = useState<GrammarlyCheckItem[]>([]);
  const [currentSentence, setCurrentSentence] = useState('');

  useEffect(() => {
    const curRange = errorRanges[currentErrorIndex];
    if (curRange) {
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
    }
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
    handleFixError(currentErrorIndex);
    if (errorRanges.length === 1) {
      onClose();
    }
    if (currentErrorIndex === errorRanges.length - 1) {
      onClose();
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [currentErrorIndex, currentErrorRange]);

  const handleAcceptAll = useCallback(() => {
    handleFixAllErrors();
    onClose();
  }, [handleFixAllErrors, onClose]);

  return (
    <div className="h-[190px] flex flex-col overflow-hidden">
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-[var(--color-text)]">Review suggestions</h3>
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
          onClick={handleAcceptAll}
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
