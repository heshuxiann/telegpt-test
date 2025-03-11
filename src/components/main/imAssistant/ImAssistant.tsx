/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
import React, {
  memo, useEffect, useRef, useState,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import type { ApiChat } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';
import type { ImAssistantContentRef } from './ImAssistantContent';

import eventEmitter, { Actions } from '../../../lib/EventEmitter';
import { injectComponent } from '../../../lib/injectComponent';
import { selectChat } from '../../../global/selectors';

import useLastCallback from '../../../hooks/useLastCallback';

import ImAssistantContent from './ImAssistantContent';

import './ImAssistant.scss';

interface StateProps {
  memoSelectChat:(chatId:string) => ApiChat | undefined;
}

const injectMessageAI = injectComponent(ImAssistantContent);
const ImAssistant = (props:StateProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [instance, setInstance] = useState<ImAssistantContentRef | null>(null);
  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { ...props }).then(setInstance);
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
    // eslint-disable-next-line no-console
    console.log('添加新的消息到智能客服', message);
    if (instance) {
      instance.addNewMessage(message);
    }
  });
  return (
    <div className="im-assistant-container" ref={containerRef} />
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
)(ImAssistant));
