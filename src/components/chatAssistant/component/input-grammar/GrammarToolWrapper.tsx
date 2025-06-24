/* eslint-disable max-len */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  useEffect, useRef,
} from '../../../../lib/teact/teact';

import type { Signal } from '../../../../util/signals';

import { injectComponent } from '../../../../lib/injectComponent';
import captureEscKeyListener from '../../../../util/captureEscKeyListener';
import parseHtmlAsFormattedText from '../../../../util/parseHtmlAsFormattedText';

import useFlag from '../../../../hooks/useFlag';
import useVirtualBackdrop from '../../../../hooks/useVirtualBackdrop';

import GrammarTool from './GrammarTool';

import './GrammarToolWrapper.scss';

import GrammerInput from '../../assets/grammar-input.png';

interface GrammarToolWrapperProps {
  getHtml: Signal<string>;
  setHtml: (newValue: string) => void;
}

const injectMessageAI = injectComponent(GrammarTool);
const GrammarToolWrapper = (props:GrammarToolWrapperProps) => {
  const [isGrammarToolOpen, openGrammarTool, closeGrammarTool] = useFlag();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { getHtml, setHtml } = props;
  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (containerRef.current && isGrammarToolOpen) {
      injected = injectMessageAI(containerRef.current, { getHtml, setHtml, onClose: closeGrammarTool });
    }
    return () => {
      injected?.unmount();
    };
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [isGrammarToolOpen, closeGrammarTool]);

  useEffect(
    () => (isGrammarToolOpen ? captureEscKeyListener(closeGrammarTool) : undefined),
    [isGrammarToolOpen, closeGrammarTool],
  );

  useVirtualBackdrop(
    isGrammarToolOpen,
    containerRef,
    closeGrammarTool,
    undefined,
    undefined,
  );
  const handleToggleMenu = () => {
    if (isGrammarToolOpen) {
      closeGrammarTool();
    } else {
      const { text } = parseHtmlAsFormattedText(getHtml());
      if (text.trim() === '') return;
      openGrammarTool();
    }
  };
  return (
    <div className="input-ai-actions flex-shrink-0 mr-[8px]">
      <button className="Button input-ai-actions-button" onClick={handleToggleMenu}>
        <img src={GrammerInput} alt="Chat AI Logo" />
      </button>
      {isGrammarToolOpen && (
        <div
          className="grammar-tool-wrapper open"
          ref={containerRef}
        />
      )}
    </div>
  );
};

export default GrammarToolWrapper;
