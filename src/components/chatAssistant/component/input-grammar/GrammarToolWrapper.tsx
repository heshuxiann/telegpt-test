import React, {
  useEffect, useRef,
} from '../../../../lib/teact/teact';
import { getActions } from '../../../../global';

import type { Signal } from '../../../../util/signals';

import captureEscKeyListener from '../../../../util/captureEscKeyListener';
import parseHtmlAsFormattedText from '../../../../util/parseHtmlAsFormattedText';
import { checkCredisBalance } from '../../../../util/paymentErrorHandler';
import { injectComponent } from '../../injectComponent';

import useFlag from '../../../../hooks/useFlag';
import useVirtualBackdrop from '../../../../hooks/useVirtualBackdrop';

import GrammarTool from './GrammarTool';

import './GrammarToolWrapper.scss';

import GrammerInput from '../../assets/input/grammar-input.png';

interface GrammarToolWrapperProps {
  getHtml: Signal<string>;
  setHtml: (newValue: string) => void;
}

const GrammarToolWrapper = (props: GrammarToolWrapperProps) => {
  const [isGrammarToolOpen, openGrammarTool, closeGrammarTool] = useFlag();
  const containerRef = useRef<HTMLDivElement>();
  const { getHtml, setHtml } = props;
  const injectMessageAI = injectComponent({
    component: GrammarTool, props: {
      getHtml,
      setHtml,
      onClose: closeGrammarTool,
    },
  });
  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (containerRef.current && isGrammarToolOpen) {
      // 类型断言确保 ref 是 HTMLElement
      injected = injectMessageAI(containerRef.current as HTMLElement);
    }
    return () => {
      injected?.unmount();
    };
  }, [isGrammarToolOpen, closeGrammarTool, getHtml, setHtml, injectMessageAI]);

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
    if (!checkCredisBalance()) {
      getActions().openPayPackageModal();
      return;
    }
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
