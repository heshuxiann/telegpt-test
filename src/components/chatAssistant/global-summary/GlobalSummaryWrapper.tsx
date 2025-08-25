import { injectComponent } from '../../../lib/injectComponent';
import GlobalSummary from './global-summary';
// import ReactDemo from './ReactDemo';
const GlobalSummaryWrapper = () => {
  const containerRef = injectComponent({
    component: GlobalSummary,
  });
  return (
    <div className="flex w-full h-full overflow-hidden" ref={containerRef} />
  );
};

export default GlobalSummaryWrapper;

