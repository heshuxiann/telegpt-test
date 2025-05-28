/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  useEffect, useRef,
} from '../../../../lib/teact/teact';

import type { InputGrammerProps } from './InputGrammer';

import { injectComponent } from '../../../../lib/injectComponent';

import InputGrammer from './InputGrammer';

const injectMessageAI = injectComponent(InputGrammer);
const InputGrammerWrapper = (props:InputGrammerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { ...props });
    }
  }, [props]);
  return (
    <div className="absolute left-0 top-0" ref={containerRef} />
  );
};

export default InputGrammerWrapper;
