/* eslint-disable no-null/no-null */
import React, { useEffect, useRef } from '../../../lib/teact/teact';

import { injectComponent } from '../../../lib/injectComponent';
import { AISearch } from '../../chatAssistant/ai-search/AISearch';

const injectMessageAI = injectComponent(AISearch);
export const AISearchWrapper = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current);
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);

  return (
    <div className="LeftSearch--content" ref={containerRef} />
  );
};
