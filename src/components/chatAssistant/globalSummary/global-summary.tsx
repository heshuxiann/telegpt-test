/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
// import type { Dispatch, SetStateAction } from 'react';
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
// import type {
//   Attachment, ChatRequestOptions, CreateMessage, Message,
// } from 'ai';
import type { Message } from 'ai';
import { Button, Modal } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';

import { ALL_FOLDER_ID } from '../../../config';
import eventEmitter, { Actions } from '../lib/EventEmitter';
import { isChatGroup, isSystemBot, isUserId } from '../../../global/helpers';
import {
  selectBot, selectChat, selectChatLastMessageId, selectFirstUnreadId,
  selectUser,
} from '../../../global/selectors';
import { getOrderedIds } from '../../../util/folderManager';
import { intelligentReplyTask } from '../aiTask/intelligent-reply-task';
import { useDidUpdateEffect } from '../hook/useDidUpdateEffect';
import { CloseIcon, MoreIcon } from '../icons';
import { Messages } from '../messages';
// import { MultimodalInput } from '../multimodal-input';
import { UrgentMessageCheckPrompt } from '../prompt';
import { RightPanelKey } from '../rightPanel/right-header';
import { RightPanel } from '../rightPanel/right-panel';
import {
  ChataiGeneralStore, ChataiMessageStore, GLOBAL_SUMMARY_LAST_TIME, GLOBAL_SUMMARY_READ_TIME,
} from '../store';
import { parseMessage2StoreMessage, parseStoreMessage2Message } from '../store/messages-store';
import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../utils/fetch-messages';
import defaultSummaryPrompt, { getGlobalSummaryPrompt } from './summary-prompt';
import UrgentNotification from './urgent-notification';

import ErrorBoundary from '../ErrorBoundary';
import { TestModal } from './TestModal';

import './global-summary.scss';

import AISummaryPath from '../assets/ai-summary.png';
import SerenaPath from '../assets/serena.png';

interface SummaryMessage {
  chatId: string;
  chatTitle: string;
  senderName: string;
  senderId: string | undefined;
  date: number;
  messageId: number;
  content: string;
}

export interface GlobalSummaryRef {
  addNewMessage: (message: ApiMessage) => void;
}

const GLOBAL_SUMMARY_CHATID = '777888';
const GlobalSummary = forwardRef<GlobalSummaryRef>(
  (_, ref) => {
    const global = getGlobal();
    const [pendingSummaryMessages, setPendingSummaryMessages] = useState<Record<string, ApiMessage[]>>({});
    const [localChatAiMessages, setLocalChatAiMessages] = useState<Message[]>([]);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    // const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const [unreadSummaryCount, setUnreadSummaryCount] = useState(0);
    const [testModalVisable, setTestModalVisible] = useState(false);
    const [globalSummaryPrompt, setGlobalSummaryPrompt] = useState('');
    const [customizationTemplate, setCustomizationTemplate] = useState<{ title: string; prompt: string } | null>(null);
    const [urgentChecks, setUrgentChecks] = useState<ApiMessage[]>([]);
    // input, setInput, stop, handleSubmit,
    const {
      messages, setMessages, append, isLoading,
    } = useChat({
      // api: 'https://sdm-ai-api.vercel.app/chat',
      api: 'https://telegpt-three.vercel.app/chat',
      sendExtraMessageFields: true,
    });

    const orderedIds = React.useMemo(() => getOrderedIds(ALL_FOLDER_ID) || [], []);
    useImperativeHandle(ref, () => ({
      addNewMessage,
    }));
    const initSummaryTemplate = () => {
      getGlobalSummaryPrompt().then((result) => {
        if (result) {
          if (result.prompt) {
            setGlobalSummaryPrompt(result.prompt);
          } else {
            setGlobalSummaryPrompt(defaultSummaryPrompt);
          }
          if (result.customizationTemplate) {
            setCustomizationTemplate(result.customizationTemplate);
          }
        }
      });
    };
    useEffect(() => {
      initSummaryTemplate();
    }, []);
    useEffect(() => {
      eventEmitter.on(Actions.GlobalSummaryTemplateUpdate, initSummaryTemplate);
      return () => {
        eventEmitter.off(Actions.GlobalSummaryTemplateUpdate, initSummaryTemplate);
      };
    }, []);
    // 检测是否是紧急消息
    useEffect(() => {
      const timer = setInterval(() => {
        const checkmsgs = urgentChecks.map((msg) => {
          if (msg.content.text?.text) {
            const peer = msg.senderId ? selectUser(global, msg.senderId) : undefined;
            return {
              chatId: msg.chatId,
              messageId: msg.id,
              senderName: peer ? `${peer.firstName || ''} ${peer.lastName || ''}` : '',
              content: msg.content.text?.text || '',
            };
          }
          return false;
        }).filter(Boolean);
        if (checkmsgs.length) {
          append({
            id: uuidv4(),
            role: 'user',
            content: `${JSON.stringify(checkmsgs)}\n\n${UrgentMessageCheckPrompt}`,
            annotations: [{
              isAuxiliary: true,
              type: 'urgent-message-check',
            }],
          });
          setUrgentChecks([]);
        }
      }, 1000 * 60);
      return () => {
        clearInterval(timer);
      };
    }, [append, global, urgentChecks]);

    const startSummary = useCallback(async (messages: Record<string, ApiMessage[]>, prompt?: string) => {
      // eslint-disable-next-line no-console
      console.log('开始总结', messages, globalSummaryPrompt);
      const globalSummaryLastTime = await ChataiGeneralStore.get(GLOBAL_SUMMARY_LAST_TIME) || 0;
      const summaryTime = new Date().getTime();
      if (!Object.keys(messages).length) return;
      const summaryMessages: SummaryMessage[] = Object.entries(messages).flatMap(([chatId, messages]) => {
        const chat = selectChat(global, chatId);
        return messages.map((message) => {
          if (message.content.text?.text) {
            const peer = message.senderId ? selectUser(global, message.senderId) : undefined;
            return {
              chatId,
              chatTitle: chat?.title ?? 'Unknown',
              chatType: isUserId(chatId) ? 'private' : 'group',
              senderId: message.senderId,
              senderName: peer ? `${peer.firstName || ''} ${peer.lastName || ''}` : '',
              date: message.date,
              messageId: Math.floor(message.id),
              content: message.content.text?.text ?? '',
            };
          }
          return null;
        }).filter(Boolean);
      });
      if (!summaryMessages.length) return;
      const summaryMessageContent = {
        messageList: summaryMessages,
      };
      append({
        id: uuidv4(),
        role: 'user',
        content: `${prompt || globalSummaryPrompt || defaultSummaryPrompt}\n\n${JSON.stringify(summaryMessageContent)}`,
        annotations: [{
          isAuxiliary: true,
          type: 'global-summary',
          customizationTemplate: customizationTemplate || null,
          summaryInfo: {
            summaryStartTime: globalSummaryLastTime || null,
            summaryEndTime: summaryTime,
            summaryMessageCount: summaryMessages.length,
            summaryChatIds: Object.keys(messages),
          },
        }],
      });
      ChataiGeneralStore.set(GLOBAL_SUMMARY_LAST_TIME, new Date().getTime());
      setUnreadSummaryCount(unreadSummaryCount + 1);
    }, [append, customizationTemplate, global, globalSummaryPrompt, unreadSummaryCount]);

    const initUnSummaryMessage = async () => {
      const globalSummaryLastTime: number | undefined = await ChataiGeneralStore.get(GLOBAL_SUMMARY_LAST_TIME);
      if (!globalSummaryLastTime) {
        // TODO 总结所有的未读消息
        summaryAllUnreadMessages();
      } else if (globalSummaryLastTime < Date.now() - 1000 * 60 * 60 * 10) {
        summaryMessageByDeadline(globalSummaryLastTime);
      }
    };

    useDidUpdateEffect(() => {
      if (orderedIds?.length) {
        initUnSummaryMessage();
      }
    }, [globalSummaryPrompt, orderedIds?.length]);

    useEffect(() => {
      const executeTask = () => {
        const currentTime = new Date();
        const hours = currentTime.getHours();
        const minutes = currentTime.getMinutes();
        // eslint-disable-next-line no-console
        console.log('计时任务hours', hours);
        // eslint-disable-next-line no-console
        console.log('计时任务minutes', minutes);
        // 9:00 - 12:00 每30分钟执行一次
        if (hours >= 9 && hours < 12 && minutes % 30 === 0) {
          startSummary(pendingSummaryMessages);
        }

        // 14:00 - 17:00 每30分钟执行一次
        if (hours >= 14 && hours < 17 && minutes % 30 === 0) {
          startSummary(pendingSummaryMessages);
        }

        // 17:00 - 23:00 每2小时执行一次
        if (hours >= 17 && hours < 23 && (hours - 17) % 2 === 0 && minutes === 0) {
          startSummary(pendingSummaryMessages);
        }
      };

      // 每分钟执行一次来检查时间段
      const intervalId = setInterval(executeTask, 60000);

      return () => clearInterval(intervalId); // 清理定时器
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, [pendingSummaryMessages, startSummary]);

    useEffect(() => {
      ChataiGeneralStore.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
      ChataiMessageStore.getMessages(GLOBAL_SUMMARY_CHATID, undefined, 10)?.then((res) => {
        if (res.messages) {
          const localChatAiMessages = parseStoreMessage2Message(res.messages);
          setLocalChatAiMessages(localChatAiMessages);
        }
      });
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, []);

    useEffect(() => {
      if (messages.length > 0 && !isLoading) {
        const parsedMessage = parseMessage2StoreMessage(GLOBAL_SUMMARY_CHATID, messages);
        ChataiMessageStore.storeMessages([...parsedMessage]);
      }
    }, [messages, isLoading]);

    const summaryAllUnreadMessages = async () => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      for (let i = 0; i < orderedIds.length; i++) {
        const chatId = orderedIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        if (chat && chat.unreadCount && !chatBot) {
          if (chat?.membersCount && chat?.membersCount > 100) {
            continue;
          }
          const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID) || chat.lastReadInboxMessageId;
          const roomUnreadMsgs = await fetchChatUnreadMessage({
            chat,
            offsetId: firstUnreadId || 0,
            addOffset: -30,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
            unreadCount: chat.unreadCount,
            maxCount: 100,
          });
          if (roomUnreadMsgs.length > 0) {
            unreadMap[chatId] = roomUnreadMsgs;
          }
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap);
      }
    };

    const summaryMessageByDeadline = async (deadline: number) => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      for (let i = 0; i < orderedIds.length; i++) {
        const chatId = orderedIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
        if (chat && chat.unreadCount && !chatBot && chatLastMessageId) {
          if (chat?.membersCount && chat?.membersCount > 100) {
            continue;
          }
          const roomUnreadMsgs = await fetchChatMessageByDeadline({
            chat,
            deadline: deadline / 1000,
            offsetId: chatLastMessageId,
            addOffset: -30,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
            maxCount: 100,
          });
          unreadMap[chatId] = roomUnreadMsgs;
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap);
      }
    };

    const addNewMessage = (message: ApiMessage) => {
      if (message.content.text) {
        const chatId = message.chatId;
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        if (chat && !chatBot) {
          if (chat.membersCount && chat?.membersCount > 100) {
            return;
          }
          // TODO 这里需要判断是否是紧急消息/知识库自动回复
          const { isRestricted } = chat;
          if (!message.isOutgoing && !isRestricted) {
            if (!isChatGroup(chat)) {
              intelligentReplyTask.addNewMessage(message);
            }
            setUrgentChecks((prev) => [...prev, message]);
          }
          setPendingSummaryMessages((messages) => {
            if (messages[chatId]) {
              messages[chatId].push(message);
            } else {
              messages[chatId] = [message];
            }
            return messages;
          });
        }
      }
    };
    const handleClose = React.useCallback(() => {
      setSummaryModalVisible(false);
    }, []);

    const openGlobalSummaryModal = async () => {
      setSummaryModalVisible(true);
      // 距离上次浏览到现在间隔超过2个周期
      const lastReadTime: number | undefined = await ChataiGeneralStore.get(GLOBAL_SUMMARY_READ_TIME);
      if (lastReadTime && unreadSummaryCount > 2) {
        summaryMessageByDeadline(lastReadTime);
      }
      ChataiGeneralStore.set(GLOBAL_SUMMARY_READ_TIME, new Date().getTime());
      setUnreadSummaryCount(0);
    };

    const deleteMessage = useCallback((messageId: string) => {
      ChataiMessageStore.delMessage(messageId).then(() => {
        setLocalChatAiMessages((prev) => prev.filter((message) => message.id !== messageId));
        setMessages((prev) => prev.filter((message) => message.id !== messageId));
      });
    }, [setMessages]);

    const handleReSummary = useCallback(async (prompt: string) => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      for (let i = 0; i < orderedIds.length; i++) {
        const chatId = orderedIds[i];
        const chat = selectChat(global, chatId);
        const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
        if (chat && chat.unreadCount && !chatBot) {
          if (chat?.membersCount && chat?.membersCount > 100) {
            continue;
          }
          const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID) || chat.lastReadInboxMessageId;
          const roomUnreadMsgs = await fetchChatUnreadMessage({
            chat,
            offsetId: firstUnreadId || 0,
            addOffset: -30,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
            unreadCount: chat.unreadCount,
            maxCount: 100,
          });
          if (roomUnreadMsgs.length > 0) {
            unreadMap[chatId] = roomUnreadMsgs;
          }
        }
      }
      if (Object.keys(unreadMap).length) {
        startSummary(unreadMap, prompt);
      }
    }, [global, orderedIds, startSummary]);

    return (
      <ErrorBoundary>
        <div className="w-full h-full flex justify-center items-center cursor-pointer" onClick={openGlobalSummaryModal}>
          <img className="w-[24px] h-[24px]" src={AISummaryPath} alt="AI Summary" />
        </div>
        <Modal
          open={summaryModalVisible}
          width="100vw"
          height="100vh"
          footer={null}
          closeIcon={null}
          className="global-summary-modal"
          wrapClassName="global-summary-modal-wrap"
        >
          <SummaryModalContent
            localChatAiMessages={localChatAiMessages}
            messages={messages}
            // input={input}
            // setInput={setInput}
            isLoading={isLoading}
            // stop={stop}
            // attachments={attachments}
            // setAttachments={setAttachments}
            onClose={handleClose}
            // setMessages={setMessages}
            // handleSubmit={handleSubmit}
            // append={append}
            deleteMessage={deleteMessage}
          />
          <Button type="primary" className="absolute left-[20px] bottom-[64px]" onClick={summaryAllUnreadMessages}>
            Summarize all unread
          </Button>
          <Button type="primary" className="absolute left-[20px] bottom-[20px]" onClick={() => { setTestModalVisible(true); }}>
            Test entry
          </Button>
          <TestModal
            visible={testModalVisable}
            // eslint-disable-next-line react/jsx-no-bind
            onClose={() => setTestModalVisible(false)}
            handleReSummary={handleReSummary}
          />
        </Modal>
        <UrgentNotification messages={messages} isLoading={isLoading} />
      </ErrorBoundary>

    );
  },
);
interface SummaryContentProps {
  localChatAiMessages: Message[];
  messages: Message[];
  isLoading: boolean;
  deleteMessage: (messageId: string) => void;
  // input: string;
  // setInput: (value: string) => void;
  // stop: () => void;
  // attachments: Array<Attachment>;
  // setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  // setMessages: Dispatch<SetStateAction<Array<Message>>>;
  // handleSubmit: (
  //   event?: {
  //     preventDefault?: () => void;
  //   },
  //   chatRequestOptions?: ChatRequestOptions,
  // ) => void;
  // append: (message: Message | CreateMessage, chatRequestOptions?: ChatRequestOptions) => Promise<string | null | undefined>;
  onClose: () => void;
}

const SummaryModalContent = (props: SummaryContentProps) => {
  // input, setInput, handleSubmit, attachments, setAttachments, setMessages, append, stop,
  const {
    localChatAiMessages, isLoading, messages, onClose, deleteMessage,
  } = props;
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const sentinelTopRef = useRef<HTMLDivElement>(null);
  const sentinelBottomRef = useRef<HTMLDivElement>(null);
  const handleShowTemplate = useCallback(() => {
    eventEmitter.emit(Actions.ShowGlobalSummaryPanel, {
      rightPanelKey: RightPanelKey.PromptTemplate,
    });
  }, []);
  return (
    <div className="globa-summary-container flex flex-col w-full h-full">
      <div className="h-[56px] w-full px-[20px] flex items-center bg-white/50">
        <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
        <span className="text-[15px] font-semibold">Serena AI</span>
        <div className="flex items-center ml-auto gap-[20px]">
          <div className="cursor-pointer text-black" onClick={handleShowTemplate}>
            <MoreIcon />
          </div>
          <div className="cursor-pointer text-black" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div
            className="chat-ai-output-wrapper flex-1 overflow-auto"
            ref={messageContainerRef}
          >
            <div ref={sentinelTopRef} className="h-[1px]" />
            {localChatAiMessages && (
              <Messages isLoading={false} messages={localChatAiMessages} deleteMessage={deleteMessage} />
            )}
            <Messages
              isLoading={isLoading}
              messages={messages}
              deleteMessage={deleteMessage}
            />
            <div ref={sentinelBottomRef} className="h-[1px]" />
          </div>
          {/* <form className="flex mx-auto px-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
            <MultimodalInput
              chatId={GLOBAL_SUMMARY_CHATID}
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
          </form> */}
        </div>
        <RightPanel closeSummaryModal={onClose} />

      </div>
    </div>
  );
};

export default GlobalSummary;
