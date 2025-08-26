/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  useEffect,
  useRef,
} from '../../../../lib/teact/teact';

import type { InputGrammerProps } from './InputGrammar';

import { injectComponent } from '../../injectComponent';

import InputGrammar from './InputGrammar';

// const injectMessageAI = injectComponent(InputGrammar);
const InputGrammarWrapper = (props: InputGrammerProps) => {
  // const containerRef = useRef<HTMLDivElement | null>(null);
  const { inputRef, getHtml, setHtml } = props;
  const containerRef = injectComponent({
    component: InputGrammar,
    props: {
      inputRef,
      getHtml,
      setHtml,
    },
  });
  // useEffect(() => {
  //   if (containerRef.current) {
  //     injectMessageAI(containerRef.current, { inputRef, getHtml, setHtml });
  //   }
  // }, [getHtml, inputRef, setHtml]);
  return (
    <div className="absolute left-0 top-0 w-full h-full pointer-events-none" ref={containerRef} />
  );
};

export default InputGrammarWrapper;
