/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
// import type { Dispatch, SetStateAction } from 'react';
import React, {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from 'react';
import type { Message } from 'ai';
import { Modal } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { InfiniteScrollRef } from '../component/InfiniteScroll';
import type { StoreMessage } from '../store/messages-store';
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
import { CloseIcon, SettingIcon } from '../icons';
import { Messages } from '../messages';
// import { MultimodalInput } from '../multimodal-input';
import { UrgentMessageCheckPrompt } from '../prompt';
import { RightPanel } from '../rightPanel/right-panel';
import {
  ChataiGeneralStore, ChataiMessageStore, GLOBAL_SUMMARY_LAST_TIME, GLOBAL_SUMMARY_READ_TIME,
} from '../store';
import { SUMMARY_CHATS } from '../store/general-store';
import { parseStoreMessage2Message } from '../store/messages-store';
import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../utils/fetch-messages';
import { formatSummaryText, formatUrgentCheckText } from './formate-summary-text';
import defaultSummaryPrompt, { getGlobalSummaryPrompt } from './summary-prompt';
// import TestActions from './test-actions';
import UrgentNotification from './urgent-notification';

import { InfiniteScroll } from '../component/InfiniteScroll';
import ErrorBoundary from '../ErrorBoundary';

// import { TestModal } from './TestModal';
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
    const [pendingSummaryMessages, setPendingSummaryMessages] = useState<Record<string, ApiMessage[]>>({});
    const [messageList, setMessageList] = useState<Message[]>([]);
    const [summaryModalVisible, setSummaryModalVisible] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState<Message | null>(null);
    const [unreadSummaryCount, setUnreadSummaryCount] = useState(0);
    // const [testModalVisable, setTestModalVisible] = useState(false);
    const [globalSummaryPrompt, setGlobalSummaryPrompt] = useState('');
    const [customizationTemplate, setCustomizationTemplate] = useState<{ title: string; prompt: string } | null>(null);
    const [urgentChecks, setUrgentChecks] = useState<ApiMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pageInfo, setPageInfo] = useState<{ lastTime: number | undefined; hasMore: boolean }>({ lastTime: undefined, hasMore: true });
    const summaryChats = useRef<string[]>([]);
    const orderedIds = React.useMemo(() => getOrderedIds(ALL_FOLDER_ID) || [], []);
    useImperativeHandle(ref, () => ({
      addNewMessage,
    }));
    useEffect(() => {
      ChataiGeneralStore.get(SUMMARY_CHATS).then((res) => {
        summaryChats.current = res || [];
      });
    }, []);
    const handleLoadMore = useCallback(() => {
      return new Promise<void>((resolve) => {
        ChataiMessageStore.getMessages(GLOBAL_SUMMARY_CHATID, pageInfo?.lastTime, 10)?.then((res) => {
          if (res.messages) {
            const localChatAiMessages = parseStoreMessage2Message(res.messages);
            setMessageList((prev) => [...localChatAiMessages, ...prev]);
          }
          setPageInfo({
            lastTime: res.lastTime,
            hasMore: res.hasMore,
          });
          resolve();
        });
      });
    }, [pageInfo?.lastTime]);
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

    const handleSummaryChatsUpdate = (payload: any) => {
      const { chats } = payload;
      if (chats) {
        summaryChats.current = chats || [];
        setPendingSummaryMessages((prev) => {
          const newPendingSummaryMessages: Record<string, ApiMessage[]> = {};
          Object.keys(prev).forEach((chatId) => {
            if (chats.includes(chatId)) {
              newPendingSummaryMessages[chatId] = prev[chatId];
            }
          });
          return newPendingSummaryMessages;
        });
      }
    };

    const handleClose = React.useCallback(() => {
      setSummaryModalVisible(false);
    }, []);

    const handleSummary = (
      {
        messages,
        summaryInfo,
        customizationTemplate,
      }: {
        messages: Message[];
        summaryInfo: {};
        customizationTemplate: { title: string; prompt: string } | null;
      },
    ) => {
      setIsLoading(true);
      fetch('https://telegpt-three.vercel.app/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          setIsLoading(false);
          const formatResponse = formatSummaryText(res.text);
          if (formatResponse) {
            const content = {
              ...formatResponse,
              summaryInfo,
              customizationTemplate,
            };
            const newMessage: StoreMessage = {
              chatId: GLOBAL_SUMMARY_CHATID,
              timestamp: new Date().getTime(),
              content: JSON.stringify(content),
              id: uuidv4(),
              createdAt: new Date(),
              role: 'assistant',
              annotations: [{
                type: 'global-summary',
              }],
            };
            ChataiMessageStore.storeMessage(newMessage);
            setMessageList((prev) => [...prev, newMessage]);
            // 通知
            window.Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                const notification = new Notification('Chat Summary', {
                  body: 'You have received a new Chat Summary',
                });
                notification.onclick = () => {
                  setSummaryModalVisible(true);
                };
                setTimeout(() => notification.close(), 5000);
              }
            });
          }
        });
    };

    const handleUrgentMessageCheck = (messages: Message[]) => {
      fetch('https://telegpt-three.vercel.app/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          const formatResponse = formatUrgentCheckText(res.text);
          if (formatResponse) {
            const newMessage: StoreMessage = {
              chatId: GLOBAL_SUMMARY_CHATID,
              timestamp: new Date().getTime(),
              content: JSON.stringify(formatResponse),
              id: uuidv4(),
              createdAt: new Date(),
              role: 'assistant',
              annotations: [{
                type: 'urgent-message-check',
              }],
            };
            ChataiMessageStore.storeMessage(newMessage);
            setMessageList((prev) => [...prev, newMessage]);
            setNotificationMessage(newMessage);
          }
        });
    };

    useEffect(() => {
      initSummaryTemplate();
    }, []);
    useEffect(() => {
      eventEmitter.on(Actions.GlobalSummaryTemplateUpdate, initSummaryTemplate);
      eventEmitter.on(Actions.HideGlobalSummaryModal, handleClose);
      eventEmitter.on(Actions.UpdateSummaryChats, handleSummaryChatsUpdate);
      return () => {
        eventEmitter.off(Actions.GlobalSummaryTemplateUpdate, initSummaryTemplate);
        eventEmitter.off(Actions.HideGlobalSummaryModal, handleClose);
        eventEmitter.off(Actions.UpdateSummaryChats, handleSummaryChatsUpdate);
      };
    }, [handleClose]);
    // 检测是否是紧急消息
    useEffect(() => {
      const timer = setInterval(() => {
        const checkmsgs = urgentChecks.map((msg) => {
          const global = getGlobal();
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
          handleUrgentMessageCheck([
            {
              id: uuidv4(),
              role: 'user',
              content: `${JSON.stringify(checkmsgs)}\n\n${UrgentMessageCheckPrompt}`,
            },
          ]);
        }
        setUrgentChecks([]);
      }, 1000 * 60);
      return () => {
        clearInterval(timer);
      };
    }, [urgentChecks]);

    const startSummary = useCallback(async (messages: Record<string, ApiMessage[]>, prompt?: string) => {
      // eslint-disable-next-line no-console
      console.log('开始总结', messages, globalSummaryPrompt);
      const global = getGlobal();
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
      handleSummary({
        messages: [{
          id: uuidv4(),
          role: 'user',
          content: `${prompt || globalSummaryPrompt || defaultSummaryPrompt}\n\n${JSON.stringify(summaryMessageContent)}`,
        }],
        summaryInfo: {
          summaryStartTime: globalSummaryLastTime || null,
          summaryEndTime: summaryTime,
          summaryMessageCount: summaryMessages.length,
          summaryChatIds: Object.keys(messages),
        },
        customizationTemplate,
      });
      setPendingSummaryMessages({});
      ChataiGeneralStore.set(GLOBAL_SUMMARY_LAST_TIME, new Date().getTime());
      setUnreadSummaryCount(unreadSummaryCount + 1);
    }, [customizationTemplate, globalSummaryPrompt, unreadSummaryCount]);

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
          setMessageList((prev) => [...localChatAiMessages, ...prev]);
        }
        setPageInfo({
          lastTime: res.lastTime,
          hasMore: res.hasMore,
        });
      });
      // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, []);
    const summaryAllUnreadMessages = async () => {
      const unreadMap: Record<string, ApiMessage[]> = {};
      const global = getGlobal();
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
      const global = getGlobal();
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

    const addNewMessage = useCallback((message: ApiMessage) => {
      const global = getGlobal();
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
            if (!isChatGroup(chat) || message.isMentioned) {
              intelligentReplyTask.addNewMessage(message);
            }
            setUrgentChecks((prev) => [...prev, message]);
          }
          // TODO 添加到自动总结消息队列
          if (summaryChats.current.length === 0 || summaryChats.current.includes(message.chatId)) {
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
      }
    }, [summaryChats]);

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
        setMessageList((prev) => prev.filter((message) => message.id !== messageId));
      });
    }, []);

    // const handleReSummary = useCallback(async (prompt: string) => {
    //   const unreadMap: Record<string, ApiMessage[]> = {};
    //   for (let i = 0; i < orderedIds.length; i++) {
    //     const chatId = orderedIds[i];
    //     const chat = selectChat(global, chatId);
    //     const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
    //     if (chat && chat.unreadCount && !chatBot) {
    //       if (chat?.membersCount && chat?.membersCount > 100) {
    //         continue;
    //       }
    //       const firstUnreadId = selectFirstUnreadId(global, chatId, MAIN_THREAD_ID) || chat.lastReadInboxMessageId;
    //       const roomUnreadMsgs = await fetchChatUnreadMessage({
    //         chat,
    //         offsetId: firstUnreadId || 0,
    //         addOffset: -30,
    //         sliceSize: 30,
    //         threadId: MAIN_THREAD_ID,
    //         unreadCount: chat.unreadCount,
    //         maxCount: 100,
    //       });
    //       if (roomUnreadMsgs.length > 0) {
    //         unreadMap[chatId] = roomUnreadMsgs;
    //       }
    //     }
    //   }
    //   if (Object.keys(unreadMap).length) {
    //     startSummary(unreadMap, prompt);
    //   }
    // }, [global, orderedIds, startSummary]);

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
            messages={messageList}
            isLoading={isLoading}
            onClose={handleClose}
            deleteMessage={deleteMessage}
            loadMore={handleLoadMore}
            hasMore={pageInfo?.hasMore}
          />
          {/* <TestActions
            // eslint-disable-next-line react/jsx-no-bind
            summaryAllUnreadMessages={summaryAllUnreadMessages}
            // eslint-disable-next-line react/jsx-no-bind
            // showTestModalVisible={() => { setTestModalVisible(true); }}
          /> */}
          {/* <TestModal
            visible={testModalVisable}
            // eslint-disable-next-line react/jsx-no-bind
            onClose={() => setTestModalVisible(false)}
            handleReSummary={handleReSummary}
          /> */}
        </Modal>
        <UrgentNotification message={notificationMessage} />
      </ErrorBoundary>

    );
  },
);
interface SummaryContentProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  messages: Message[];
  isLoading: boolean;
  deleteMessage: (messageId: string) => void;
  onClose: () => void;
}

const SummaryModalContent = (props: SummaryContentProps) => {
  // input, setInput, handleSubmit, attachments, setAttachments, setMessages, append, stop,
  const {
    isLoading, messages, onClose, deleteMessage, loadMore, hasMore,
  } = props;
  const messageListRef = useRef<InfiniteScrollRef | null>(null);
  const handleShowRightPanel = useCallback(() => {
    eventEmitter.emit(Actions.ShowGlobalSummaryPanel);
  }, []);
  return (
    <div className="globa-summary-container flex flex-col w-full h-full">
      <div className="h-[56px] w-full px-[20px] flex items-center bg-white/50">
        <img className="w-[40px] h-[40px] rounded-full mr-[12px]" src={SerenaPath} alt="Serena" />
        <span className="text-[15px] font-semibold">Serena AI</span>
        <div className="flex items-center ml-auto gap-[20px]">
          <div className="cursor-pointer text-black flex flex-row gap-[6px] items-center" onClick={handleShowRightPanel}>
            <SettingIcon />
            <span className="text-[16px] font-semibold">Personalize</span>
          </div>
          <div className="cursor-pointer text-black" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-row overflow-hidden">
        <div className="chat-ai-output-wrapper flex-1 h-full">
          <InfiniteScroll
            className="chat-ai-output-wrapper"
            loadMore={loadMore}
            hasMore={hasMore}
            ref={messageListRef}
          >
            <Messages
              isLoading={isLoading}
              messages={messages}
              deleteMessage={deleteMessage}
            />
          </InfiniteScroll>

        </div>
        <RightPanel closeSummaryModal={onClose} />

      </div>
    </div>
  );
};

export default GlobalSummary;
