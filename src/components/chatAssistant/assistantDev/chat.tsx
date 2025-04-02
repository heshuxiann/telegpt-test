/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { Attachment, Message } from 'ai';
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage, ApiMessageEntityMentionName } from '../../../api/types';
import type { IFetchUnreadMessage, ImAssistantChat } from './im-assistant';

import TagsModal from '../modal/tagsModal';
import SettingPanel from '../setting-panel';
import { ChataiUserStore } from '../store';
import { MultimodalInput } from './multimodal-input';

import { Messages } from '../../right/ChatAI/messages';

interface IProps {
  currentChat: ImAssistantChat;
  currentUser?:{
    id:string;
    name:string;
    phoneNumber:string;
  } | undefined;
  getRoomUnreadMessages:(params:IFetchUnreadMessage)=>Promise<ApiMessage[]>;
  getRoomTodayMessage:(chatId:string)=>Promise<ApiMessage[]>;
}
const summaryData = {
  range: {
    startTime: 0,
    endTime: 0,
  },
  summaryCount: 0,
  mainTopic: [],
  pendingMatters: [],
  menssionMessage: [],
  garbageMessage: [],
};
const originSummaryPrompt = `请总结上面的聊天内容,按照下面的 json 格式输出：
              ${JSON.stringify(summaryData)};\n 主要讨论的主题放在mainTopic数组中,待处理事项放在pendingMatters数组中,被@的消息总结放在menssionMessage数组中(传入的消息中hasUnreadMention表示被@了),垃圾消息放在garbageMessage数组中;对应的消息都以字符串的形式放入分类的数组中,range中的startTime是总结的第一条消息的时间(time字段),range中的endTime是总结的最后一条消息的时间(time字段),summaryCount是总结的消息数量`;
export function Chat(props:IProps) {
  const {
    currentChat, getRoomUnreadMessages, getRoomTodayMessage, currentUser,
  } = props;
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [appendUnreadPrompt, setAppendUnreadPrompt] = useState<string>('');
  const [appendTodayPrompt, setAppendTodayPrompt] = useState<string>('');
  const [tagsModalVisable, setTagsModalVisable] = useState<boolean>(false);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const {
    messages, handleSubmit, setMessages, input, setInput, append, isLoading, stop,
  } = useChat({
    api: 'https://ai-api-sdm.vercel.app/chat',
    id: currentChat?.chatId,
    sendExtraMessageFields: true,
    initialMessages,
    experimental_throttle: 100,
  });
  useEffect(() => {
    if (currentChat) {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      if (currentChat?.chatType === 'single') {
        ChataiUserStore.getUser(currentChat.chatId).then((userInfo) => {
          if (userInfo) {
            let content = `这是一个IM聊天室,你的名字是${userInfo.name},你的手机号是${userInfo.phoneNumber};`;
            if (userInfo?.tags) {
              content += `你的附加信息是${userInfo?.tags};`;
            }
            if (currentUser) {
              content += `对方的名字是${currentUser.name},对方的手机号是${currentUser.phoneNumber}`;
            }
            setInitialMessages([{
              id: uuidv4(),
              content,
              role: 'system',
              annotations: [{
                isAuxiliary: true,
              }],
            }]);
          }
        });
      }
    }
  }, [currentChat, currentUser]);
  async function handleSummaryUnreadMessage() {
    const unreadMessage = await getRoomUnreadMessages({
      chatId: currentChat?.chatId as string,
      offsetId: currentChat?.lastReadInboxMessageId as number,
      unreadCount: currentChat?.unreadCount as number,
    });
    if (unreadMessage.length) {
      const addMessage: Message[] = [];
      unreadMessage?.forEach((message) => {
        if (message && message.content.text) {
          const { entities } = message.content.text;
          const hasMention = entities?.some((entity) => (entity as ApiMessageEntityMentionName).userId !== undefined);
          addMessage.push({
            id: uuidv4(),
            content: `content:${message.content.text?.text},hasUnreadMention:${hasMention},time:${message.date}`,
            role: 'user',
            annotations: [{
              isAuxiliary: true,
            }],
          });
        }
      });
      setMessages([...messages, ...addMessage]);
      append({
        role: 'user',
        id: uuidv4(),
        content: originSummaryPrompt + appendUnreadPrompt,
        annotations: [{
          isAuxiliary: true,
          isSummary: true,
        }],
      });
    }
  }
  async function handleSummaryTodayMessage() {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const todayMessages = await getRoomTodayMessage(currentChat?.chatId as string);
    // eslint-disable-next-line no-console
    if (todayMessages.length) {
      const addMessage: Message[] = [];
      todayMessages?.forEach((message) => {
        if (message && message.content.text) {
          const { entities } = message.content.text;
          const hasMention = entities?.some((entity) => (entity as ApiMessageEntityMentionName).userId !== undefined);
          addMessage.push({
            id: uuidv4(),
            content: `content:${message.content.text?.text},hasUnreadMention:${hasMention},time:${message.date}`,
            role: 'user',
            annotations: [{
              isAuxiliary: true,
            }],
          });
        }
      });
      setMessages([...messages, ...addMessage]);
      append({
        role: 'user',
        id: uuidv4(),
        content: originSummaryPrompt,
        annotations: [{
          isAuxiliary: true,
          isSummary: true,
        }],
      });
    }
  }
  return (
    <>
      <div className="im-assistant-right-header flex-none bg-white">
        <div className="flex flex-row items-center p-[9px] cursor-pointer">
          <div className="w-[40px] h-[40px] rounded-full overflow-hidden mr-[0.5rem]">
            {currentChat?.avatar ? (
              <img className="w-full h-full" src={currentChat?.avatar} alt="" />
            ) : (
              <div className="w-full h-full text-[25px] font-bold flex items-center justify-center text-white" style={{ backgroundImage: `linear-gradient(#ffffff -300%, ${currentChat?.avatarColor})` } as React.CSSProperties}>{currentChat?.nameFirstLetters}</div>
            )}
          </div>
          <div className="text-[16px] font-semibold flex-1 overflow-hidden whitespace-nowrap text-ellipsis">{currentChat?.name}</div>
          <div
            className="text-[#409eff] text-[16px] cursor-pointer ml-auto mr-[60px]"
            onClick={() => { setTagsModalVisable(true); }}
          >
            添加标签
          </div>
        </div>
      </div>
      <div className="im-assistant-chat-main h-full flex-1 flex flex-row overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="chat-ai-output-wrapper flex-1 overflow-auto">
            <Messages
              isLoading={isLoading}
              messages={messages}
            />
          </div>
          <div className="chat-ai-input-wrapper">
            <div className="chat-ai-actions flex flex-row gap-[12px] mx-auto px-4 pb-4 md:pb-6 w-full md:max-w-3xl">
              <div className="flex-1 p-[12px] bg-[#ecf5ff] border border-[#b3d8ff] text-[#409eff] rounded-[12px] cursor-pointer text-center" onClick={handleSummaryUnreadMessage}>总结未读消息</div>
              <div className="flex-1 p-[12px] bg-[#ecf5ff] border border-[#b3d8ff] text-[#409eff] rounded-[12px] cursor-pointer text-center" onClick={handleSummaryTodayMessage}>总结今天的消息</div>
            </div>
            <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
              <MultimodalInput
                chatId={currentChat?.chatId as string}
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isLoading={isLoading}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                setMessages={setMessages}
                append={append}
              />
            </form>
          </div>
        </div>
        <SettingPanel
          appendUnreadPrompt={appendUnreadPrompt}
          originSummaryPrompt={originSummaryPrompt}
          appendTodayPrompt={appendTodayPrompt}
          // eslint-disable-next-line react/jsx-no-bind
          setAppendUnreadPrompt={(value) => { setAppendUnreadPrompt(value); }}
          // eslint-disable-next-line react/jsx-no-bind
          setAppendTodayPrompt={(value) => { setAppendTodayPrompt(value); }}
        />
      </div>
      <TagsModal
        tagsModalVisable={tagsModalVisable}
        userId={currentChat.chatId}
        // eslint-disable-next-line react/jsx-no-bind
        close={() => setTagsModalVisable(false)}
      />
    </>
  );
}
