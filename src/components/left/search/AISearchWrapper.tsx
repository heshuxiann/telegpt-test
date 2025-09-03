import React from '@teact';
/* eslint-disable no-null/no-null */
import { useEffect, useRef } from '../../../lib/teact/teact';

import { injectComponent } from '../../chatAssistant/injectComponent';
import { AISearch } from '../../chatAssistant/ai-search/AISearch';

const injectMessageAI = injectComponent({ component: AISearch });
export const AISearchWrapper = () => {
  const containerRef = useRef<HTMLDivElement | undefined>(undefined);
  useEffect(() => {
    let injected: { unmount: () => void } | undefined;
    if (containerRef.current) {
      injected = injectMessageAI(containerRef.current);
    }
    return () => {
      injected?.unmount();
    };
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);

  return (
    <div className="LeftSearch--content" ref={containerRef} />
  );
};
