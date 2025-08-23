/* eslint-disable no-null/no-null */
import {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../../../lib/injectComponent';
import { selectChat } from '../../../global/selectors';
import GlobalSummary from './global-summary';

const injectMessageAI = injectComponent(GlobalSummary);
const GlobalSummaryWrapper = () => {
  const containerRef = useRef<HTMLDivElement>();
  useEffect(() => {
    let injected: { ref: { current: any }; unmount: () => void } | null = null;
    if (containerRef.current) {
      injected = injectMessageAI(containerRef.current, {});
    }
    return () => {
      injected?.unmount();
    };
  }, []);
  return (
    <div className="flex w-full h-full overflow-hidden" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global) => {
    const memoSelectChat = (chatId: string) => {
      return selectChat(global, chatId);
    };
    return {
      memoSelectChat,
    };
  },
)(GlobalSummaryWrapper));
