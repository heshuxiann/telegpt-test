/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, {
  forwardRef, useEffect, useImperativeHandle, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { ApiChat, ApiMessageEntityMentionName } from '../../../api/types';
import { type ApiMessage, MAIN_THREAD_ID } from '../../../api/types/messages';

import { ALL_FOLDER_ID } from '../../../config';
import { selectChat } from '../../../global/selectors';
import { CHATAI_IDB_STORE } from '../../../util/browser/idb';

import { useFolderManagerForOrderedIds } from '../../../hooks/useFolderManager';
import useLastCallback from '../../../hooks/useLastCallback';

import { fetchChatUnreadMessage } from '../../right/ChatAI/fetch-messages';
import { ThinkingMessage } from '../../right/ChatAI/message';
// import { Messages } from '../../right/ChatAI/messages';
import ImAssistantMessage from './ImAssistantMessage';

import SerenaPath from '../../../assets/serena.png';

interface IProps {
  memoSelectChat:(chatId:string) => ApiChat | undefined;
}
export interface ImAssistantContentRef {
  addNewMessage: (message:ApiMessage) => void;
}
const ImAssistantContent = forwardRef<ImAssistantContentRef, IProps>(
  ({ memoSelectChat }, ref) => {
    const orderedIds = useFolderManagerForOrderedIds(ALL_FOLDER_ID);
    const global = getGlobal();
    const [isExpanded, setIsExpanded] = useState(false);
    const [enableSummary, setEnableSummary] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState<Record<string, ApiMessage[]>>({});
    const [localChatAiMessages, setLocalChatAiMessages] = useState<Message[]>([]);
    const {
      messages, setMessages, append, isLoading,
    } = useChat({
      api: 'https://ai-api-sdm.vercel.app/chat',
      sendExtraMessageFields: true,
    });
    useImperativeHandle(ref, () => ({
      addNewMessage,
    }));

    useEffect(() => {
      CHATAI_IDB_STORE.get('777888').then((localChatAiMessages = []) => {
        setLocalChatAiMessages(localChatAiMessages as Array<Message>);
      });
      if (orderedIds) {
        getAllUnreadMessages();
      }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
    }, []);

    useEffect(() => {
      if (messages.length > 0) {
        CHATAI_IDB_STORE.set('777888', messages);
      }
    }, [messages]);
    const getAllUnreadMessages = async () => {
      if (!orderedIds?.length) return;
      const unreadMessagesEntries = await Promise.all(
        orderedIds.map(async (chatId) => {
          const chat = selectChat(global, chatId);
          if (!chat?.unreadCount) return undefined;

          const { unreadCount, lastReadInboxMessageId } = chat;
          const result = await fetchChatUnreadMessage({
            chat,
            offsetId: lastReadInboxMessageId || 0,
            addOffset: -31,
            sliceSize: 30,
            threadId: MAIN_THREAD_ID,
            unreadCount,
          });

          return result?.messages.length ? [chatId, result.messages] : undefined;
        }),
      );

      // eslint-disable-next-line @typescript-eslint/no-shadow
      const unreadMessages = Object.fromEntries(
        unreadMessagesEntries.filter(Boolean) as [string, ApiMessage[]][],
      );

      // eslint-disable-next-line no-console
      console.log('所有未读消息获取完成:', unreadMessages);
      setUnreadMessages(unreadMessages);
      startSummary(unreadMessages);
    };

    const startSummary = (unreadMessages:Record<string, ApiMessage[]>) => {
      // eslint-disable-next-line no-console
      console.log('开始总结');
      const pendingMessages:Message[] = Object.entries(unreadMessages).flatMap(([chatId, messages]) => {
        const chat = selectChat(global, chatId);
        return messages.map((message) => ({
          id: uuidv4(),
          role: 'user',
          content: `sender:${chat?.title ?? 'Unknown'},content:${message.content.text?.text ?? ''},hasUnreadMention:${Boolean(
            message.content.text?.entities?.some((entity) => (entity as ApiMessageEntityMentionName).userId),
          )}`,
          annotations: [{ isAuxiliary: true }],
        }));
      });
      setMessages((prev) => {
        return [...prev, ...pendingMessages];
      });
      const responseData = {
        mainTopic: [{
          sender: '',
          content: [],
        }],
        pendingMatters: [{
          sender: '',
          content: [],
        }],
        menssionMessage: [{
          sender: '',
          content: [],
        }],
        garbageMessage: [{
          sender: '',
          content: [],
        }],
      };
      append({
        id: uuidv4(),
        role: 'user',
        content: `请总结上面的聊天内容,按照下面的 json 格式输出：
            ${JSON.stringify(responseData)};\n 主要讨论的主题放在mainTopic数组中,待处理事项放在pendingMatters数组中,被@的消息总结放在menssionMessage数组中(传入的消息中hasUnreadMention表示被@了),垃圾消息放在garbageMessage数组中,每个 sender 总结的消息以数组的形式放在 content 中。
        `,
        annotations: [{
          isAuxiliary: true,
        }],
      });
    };
    const addNewMessage = (message:ApiMessage) => {
      // eslint-disable-next-line no-console
      console.log('addNewMessage');
      if (message.content.text) {
        const chat = memoSelectChat(message.chatId);
        // eslint-disable-next-line no-console
        console.log(chat, '------聊天房间');
        const { entities } = message.content.text;
        const hasMention = entities?.some((entity) => (entity as ApiMessageEntityMentionName).userId !== undefined);
        setEnableSummary(true);
        setMessages((prev) => {
          return [...prev, {
            id: uuidv4(),
            role: 'user',
            content: `sender:${chat?.title},content:${message.content.text?.text},hasUnreadMention:${hasMention}`,
            annotations: [{
              isAuxiliary: true,
            }],
          }];
        });
      }
    };
    const handShowSummaryModal = useLastCallback(() => {
      setIsExpanded(true);
    });
    return (
      <>
        <motion.div
          className="flex flex-col w-full h-full"
        >
          <div className="MiddleHeader flex items-center bg-white">
            <img className="mr-[0.625rem] w-[40px] h-[40px] rounded-full" src={SerenaPath} alt="Serena" />
            <h3 className="fullName FullNameTitle-module__fullName">Serena</h3>
          </div>
          <div className="flex-grow overflow-y-auto flex-1 px-[40px]">
            {localChatAiMessages && localChatAiMessages.map((message) => {
              if (message.role === 'assistant') {
                // const messageContent = JSON.parse(message.content.replace(/^```json\n/, '').replace(/```$/, ''));
                return (
                  <ImAssistantMessage
                    isLoading={false}
                    message={message}
                  />
                );
              } else {
                return undefined;
              }
            })}
            {
              messages.map((message, index) => {
                if (message.role === 'assistant') {
                  // const messageContent = JSON.parse(message.content.replace(/^```json\n/, '').replace(/```$/, ''));
                  return (
                    <ImAssistantMessage
                      isLoading={isLoading && messages.length - 1 === index}
                      message={message}
                    />
                  );
                } else {
                  return undefined;
                }
              })
            }
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
            {/* <Messages
               isLoading={isLoading}
               messages={messages}
             /> */}
          </div>
        </motion.div>
        {/* <motion.div
          className="fixed bottom-[100px] left-[200px] bg-blue-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          // whileHover={{ scale: 1.1 }}
          // whileTap={{ scale: 0.9 }}
          onClick={handShowSummaryModal}
        >
          <span className="text-white text-xl">+</span>
        </motion.div> */}
      </>
    );
  },
);

export default ImAssistantContent;
