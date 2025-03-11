/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-use-before-define */
// @ts-nocheck
import React, {
  forwardRef, useImperativeHandle, useState,
} from 'react';
import { useChat } from '@ai-sdk/react';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import type { ApiChat } from '../../../api/types';
import type { ApiMessage } from '../../../api/types/messages';

import useLastCallback from '../../../hooks/useLastCallback';

import { ThinkingMessage } from '../../right/ChatAI/message';
// import { Messages } from '../../right/ChatAI/messages';
import ImAssistantMessage from './ImAssistantMessage';

interface IProps {
  memoSelectChat:(chatId:string) => ApiChat | undefined;
}
export interface ImAssistantContentRef {
  addNewMessage: (message:ApiMessage) => void;
  startSummary:()=>void;
}
const ImAssistantContent = forwardRef<ImAssistantContentRef, IProps>(
  ({ memoSelectChat }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [enableSummary, setEnableSummary] = useState(false);
    const {
      messages, setMessages, append, isLoading,
    } = useChat({
      api: 'https://ai-api-sdm.vercel.app/chat',
      sendExtraMessageFields: true,
    });
    useImperativeHandle(ref, () => ({
      addNewMessage,
      startSummary,
    }));
    const addNewMessage = (message:ApiMessage) => {
      // eslint-disable-next-line no-console
      console.log('addNewMessage');
      if (message.content.text) {
        const chat = memoSelectChat(message.chatId);
        // eslint-disable-next-line no-console
        console.log(chat, '------聊天房间');
        const { entities } = message.content.text;
        const hasMention = entities?.some((entity) => entity.userId !== undefined);
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
    const startSummary = () => {
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
      //   append({
      //     id: uuidv4(),
      //     role: 'user',
      //     content: '请总结上面的聊天内容，请按\'🗂 主要讨论主题\',\'❗ 待处理事项\',\'🚫 垃圾消息\'这几个大类目进行分类，然后每个大类目下按照发送人进行分类,直接输出总结内容',
      //     annotations: [{
      //       isAuxiliary: true,
      //     }],
      //   });
      setEnableSummary(false);
    };
    const handShowSummaryModal = useLastCallback(() => {
      setIsExpanded(true);
      if (enableSummary) {
        startSummary();
      }
    });
    return (
      <motion.div
        className="fixed bottom-[100px] left-[200px] flex items-center justify-center"
        animate={{ width: isExpanded ? '80vw' : 60, height: isExpanded ? '70vh' : 60 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {isExpanded ? (
          <motion.div
            className="bg-white shadow-lg rounded-xl p-4 w-full h-full flex flex-col justify-between"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-[20px]">未读消息总结</span>
              <button onClick={() => setIsExpanded(false)} className="text-gray-500 hover:text-gray-800">
                ✕
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
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
              {isLoading
        && messages.length > 0
        && messages[messages.length - 1].role === 'user' && <ThinkingMessage />}
              {/* <Messages
                isLoading={isLoading}
                messages={messages}
              /> */}
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="bg-blue-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handShowSummaryModal}
          >
            <span className="text-white text-xl">+</span>
          </motion.div>
        )}
      </motion.div>
    );
  },
);

export default ImAssistantContent;
