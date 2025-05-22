/* eslint-disable no-null/no-null */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */

import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../../../lib/injectComponent';

import ChatAIRoom from './ChatAIRoom';

interface StateProps {
  chatId: string | undefined;
}
const injectMessageAI = injectComponent(ChatAIRoom);
const RoomAIWrapper = (props: StateProps) => {
  const { chatId } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { ...props });
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId]);
  return (
    <div className="chat-ai-room w-full h-full overflow-hidden" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId }): StateProps => {
    return {
      chatId,
    };
  },
)(RoomAIWrapper));
