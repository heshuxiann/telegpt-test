import React from '@teact';
import { injectComponent } from '../injectComponent';
import GlobalSummary from './global-summary';
const GlobalSummaryWrapper = () => {
  const containerRef = injectComponent({
    component: GlobalSummary,
  });
  return (
    <div className="flex w-full h-full overflow-hidden" ref={containerRef} />
  );
};

export default GlobalSummaryWrapper;

