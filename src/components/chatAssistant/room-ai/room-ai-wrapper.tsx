/* eslint-disable no-null/no-null */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */

import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../injectComponent';
import { GLOBAL_SUMMARY_CHATID } from '../variables';
import RoomAI from './room-ai';

interface StateProps {
  chatId: string | undefined;
}
// const injectMessageAI = injectComponent(RoomAI);
const RoomAIWrapper = (props: StateProps) => {
  const { chatId } = props;
  // const containerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = injectComponent({
    component: RoomAI,
    props,
  });
  // useEffect(() => {
  //   let injected: { unmount: () => void } | undefined;
  //   const timer = setTimeout(() => {
  //     if (containerRef.current && chatId && chatId !== GLOBAL_SUMMARY_CHATID) {
  //       injected = injectMessageAI(containerRef.current, { ...props });
  //     }
  //   }, 500); // 等动画走完再注入

  //   return () => {
  //     clearTimeout(timer);
  //     injected?.unmount();
  //   };
  // // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  // }, [chatId]);
  return (
    <div className="chat-ai-room flex overflow-hidden" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId }): StateProps => {
    return {
      chatId,
    };
  },
)(RoomAIWrapper));
