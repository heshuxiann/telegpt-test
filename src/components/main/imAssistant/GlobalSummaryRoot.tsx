/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types/messages';
import type { GlobalSummaryRef } from '../../chatAssistant/globalSummary/global-summary';

import { injectComponent } from '../../../lib/injectComponent';
import { selectChat } from '../../../global/selectors';
import GlobalSummary from '../../chatAssistant/globalSummary/global-summary';

import useLastCallback from '../../../hooks/useLastCallback';

import eventEmitter, { Actions } from '../../chatAssistant/lib/EventEmitter';

const injectMessageAI = injectComponent(GlobalSummary);
const GlobalSummaryRoot = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [instance, setInstance] = useState<GlobalSummaryRef | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current).then(setInstance);
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);
  useEffect(() => {
    eventEmitter.on(Actions.AddNewMessageToAiAssistant, handleAddNewMessage);
    return () => {
      eventEmitter.off(Actions.AddNewMessageToAiAssistant, handleAddNewMessage);
    };
  }, [instance]);

  const handleAddNewMessage = useLastCallback((payload: { message: ApiMessage }) => {
    const message = payload.message;
    if (instance) {
      instance.addNewMessage(message);
    }
  });
  return (
    <div className="w-[40px] h-[40px] ml-[0.625rem]" ref={containerRef} />
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
)(GlobalSummaryRoot));
