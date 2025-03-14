/* eslint-disable max-len */
import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import type { Attachment, Message } from 'ai';
import List from 'rc-virtual-list';
import { v4 as uuidv4 } from 'uuid';

import type { ApiMessage, ApiMessageEntityMentionName } from '../../api/types';

import { CHATAI_IDB_STORE } from '../../util/browser/idb';
import { MultimodalInput } from './multimodal-input';
import SettingPanel from './setting-panel';

import { Messages } from '../right/ChatAI/messages';

import SerenaPath from '../../assets/serena.png';

export interface IFetchUnreadMessage {
  chatId:string;
  offsetId:number;
  unreadCount:number ;
}

interface ImAssistantProps {
  chatList:ImAssistantChat[];
  getRoomUnreadMessages:(params:IFetchUnreadMessage)=>Promise<ApiMessage[]>;
  getRoomTodayMessage:(chatId:string)=>Promise<ApiMessage[]>;
}
export interface ImAssistantChat {
  chatId:string;
  name: string;
  nameFirstLetters: string;
  avatar: string | undefined;
  avatarColor:string;
  unreadCount: number | undefined;
  lastReadInboxMessageId: number | undefined;
  lastReadOutboxMessageId: number | undefined;
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
const ImAssistant = (props:ImAssistantProps) => {
  const { chatList, getRoomUnreadMessages, getRoomTodayMessage } = props;
  const [assiatantModalOpen, setAssiatantModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const [currentChat, setCurrentChat] = useState<ImAssistantChat>();
  const [appendUnreadPrompt, setAppendUnreadPrompt] = useState<string>('');
  const [appendTodayPrompt, setAppendTodayPrompt] = useState<string>('');
  const [localChatAiMessages, setLocalChatAiMessages] = useState<Message[]>([]);
  const originSummaryPrompt = `请总结上面的聊天内容,按照下面的 json 格式输出：
              ${JSON.stringify(summaryData)};\n 主要讨论的主题放在mainTopic数组中,待处理事项放在pendingMatters数组中,被@的消息总结放在menssionMessage数组中(传入的消息中hasUnreadMention表示被@了),垃圾消息放在garbageMessage数组中;range中的startTime是总结的第一条消息的时间(time字段),range中的endTime是总结的最后一条消息的时间(time字段),summaryCount是总结的消息数量`;
  const {
    messages, handleSubmit, setMessages, input, setInput, append, isLoading, stop,
  } = useChat({
    api: 'https://ai-api-sdm.vercel.app/chat',
    id: currentChat?.chatId,
    sendExtraMessageFields: true,
  });

  useEffect(() => {
    if (currentChat && messages && messages.length) {
      CHATAI_IDB_STORE.set(currentChat.chatId, messages);
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [messages, currentChat]);

  useEffect(() => {
    if (currentChat) {
      setMessages([]);
      setLocalChatAiMessages([]);
      // eslint-disable-next-line @typescript-eslint/no-shadow
      CHATAI_IDB_STORE.get(currentChat?.chatId).then((localChatAiMessages = []) => {
        setLocalChatAiMessages(localChatAiMessages as Array<Message>);
      });
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [currentChat]);
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
    console.log(todayMessages, '------todayMessages');
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
    <div className="im-assistant-main">
      <div className="w-[60px] h-[60px] fixed left-[260px] bottom-[100px] cursor-pointer" onClick={() => setAssiatantModalOpen(true)}>
        <img className="w-full h-full rounded-full" src={SerenaPath} alt="" />
      </div>
      {assiatantModalOpen && (
        <div className="im-assistant-modal bg-[rgba(0,0,0,0.5)] fixed w-full h-full top-0 left-0 flex items-center justify-center z-[999]">
          <div className="im-assistant-inner relative w-[90%] h-[90%] flex flex-row bg-white rounded-[16px] overflow-hidden">
            <div className="absolute cursor-pointer text-[24px] right-[24px] top-[12px]" onClick={() => setAssiatantModalOpen(false)}>X</div>
            <div className="im-assistant-left w-[320px]">
              {chatList ? (
                <List data={chatList} height={window.innerHeight * 0.9} itemKey="id" itemHeight={30}>
                  {(item) => {
                    return (
                      <div className="flex flex-row items-center p-[9px] cursor-pointer" onClick={() => setCurrentChat(item)}>
                        <div className="w-[54px] h-[54px] rounded-full overflow-hidden mr-[0.5rem]">
                          {item.avatar ? (
                            <img className="w-full h-full" src={item.avatar} alt="" />
                          ) : (
                            <div className="w-full h-full text-[25px] font-bold flex items-center justify-center text-white" style={{ backgroundImage: `linear-gradient(#ffffff -300%, ${item.avatarColor})` } as React.CSSProperties}>{item.nameFirstLetters}</div>
                          )}
                        </div>
                        <div className="text-[16px] font-semibold flex-1 overflow-hidden whitespace-nowrap text-ellipsis">{item.name}</div>
                      </div>
                    );
                  }}
                </List>
              ) : (
                <span>empty</span>
              )}

            </div>
            {currentChat && (
              <div className="im-assistant-right flex-1 flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(172, 182, 229, 0.5) 10%, rgba(116, 235, 213, 0.5) 90%)' } as CSSProperties}>
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
                  </div>
                </div>
                <div className="im-assistant-chat-main h-full flex-1 flex flex-row overflow-hidden">
                  <div className="flex-1 flex flex-col">
                    <div className="chat-ai-output-wrapper flex-1 overflow-auto">
                      {localChatAiMessages && (
                        <Messages isLoading={false} messages={localChatAiMessages} />
                      )}
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
                    setAppendTodayPrompt={(value) => { setAppendTodayPrompt(value); }}
                  />
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ImAssistant;
