/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable no-console */
import { Modal } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import type { FC } from '../../../lib/teact/teact';
import React, { useEffect, useState } from '../../../lib/teact/teact';
import { getActions } from '../../../global';

import type { ApiChat, ApiMessage } from '../../../api/types';
import type { Signal } from '../../../util/signals';

import { CHATAI_IDB_STORE } from '../../../util/browser/idb';
import TranslateIcon from '../../chatAssistant/assets/ai-translate.png';
import chatAILogoPath from '../../chatAssistant/assets/cgat-ai-logo.png';
import GrammerIcon from '../../chatAssistant/assets/grammar.png';
import ScheduleMeetingIcon from '../../chatAssistant/assets/schedule-meeting.png';
import { sendGAEvent } from '../../chatAssistant/utils/analytics';
import { checkGoogleAuthStatus, createGoogleMeet, loginWithGoogle } from '../../chatAssistant/utils/google-api';

import useFlag from '../../../hooks/useFlag';
import useLastCallback from '../../../hooks/useLastCallback';

// import aiSdkService from './ChatApiService';
import eventEmitter, { Actions } from '../../chatAssistant/lib/EventEmitter';
import Icon from '../../common/icons/Icon';
import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import InputLanguageModal from '../InputLanguageModal';
import generateChatgpt from './ChatApiGenerate';

// import { THOUGHT_REGEX_COMPLETE } from './StatusResponse';
import './InputAIMenu.scss';

const InputAIMenu: FC = ({ getHtml, chat }: { getHtml: Signal<string>;chat:ApiChat }) => {
  const [isAIToolMenuOpen, openAIToolMenu, closeAIToolMenu] = useFlag();
  const [inputLanguageModalOpen, openInputLanguageModal, closeInputLanguageModal] = useFlag();
  const [currentLanguage, setCurrentLanguage] = useState({
    langCode: 'en',
    translatedName: 'English',
  });
  useEffect(() => {
    CHATAI_IDB_STORE.get('input-translate-language').then((langCode = 'en') => {
      const translatedNames = new Intl.DisplayNames([langCode as string], { type: 'language' });
      const translatedName = translatedNames.of(langCode as string)!;
      setCurrentLanguage({
        langCode: langCode ? langCode as string : 'en',
        translatedName,
      });
    });
  }, [isAIToolMenuOpen]);
  const handleToggleMenu = () => {
    if (isAIToolMenuOpen) {
      closeAIToolMenu();
    } else {
      openAIToolMenu();
    }
  };
  const handleTranslate = useLastCallback(() => {
    const text = getHtml().trim();
    if (!text) {
      return;
    }
    eventEmitter.emit('update-input-spiner', true);
    generateChatgpt({
      data: {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that translates text to the target language.',
            id: '1',
          },
          {
            role: 'system',
            content: 'give me the translated text only',
            id: '2',
          },
          {
            role: 'user',
            content: `Translate the following text to ${currentLanguage.langCode}: ${text}`,
            id: '3',
          },
        ],
      },
      onResponse: (message) => {
        eventEmitter.emit('update-input-text', message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
    sendGAEvent('input_translate');
  });
  const handleGrammar = useLastCallback(() => {
    eventEmitter.emit('update-input-spiner', true);
    const text = getHtml().trim();
    generateChatgpt({
      data: {
        messages: [
          {
            role: 'system',
            content: `你是一个文本优化助手,作为专业级文本优化引擎，您需同时承担以下角色：
                1. 语法纠错员（检测拼写/语法/标点错误）
                2. 风格雕塑师（调整正式/口语化/幽默等语体）
                3. 内容架构师（优化逻辑结构与信息密度）
                4. 读者体验官（评估可读性与情感共鸣）
                请使用${currentLanguage.langCode}语言进行回复，并直接给出优化后的文本
            `,
            id: '1',
          },
          {
            role: 'user',
            content: `请优化下面这段文本: ${text},直接返回优化后的文本`,
            id: '2',
          },
        ],
      },
      onResponse: (message) => {
        eventEmitter.emit('update-input-text', message);
      },
      onFinish: () => {
        console.log('Finish');
      },
    });
    sendGAEvent('input_grammar');
  });
  const onTranslationClick = useLastCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openInputLanguageModal();
  });

  const sendMessage = (message:string) => {
    console.log('message', message);
    const { id } = chat;
    getActions().sendMessage({
      messageList: {
        chatId: id,
        threadId: '-1',
        type: 'thread',
      },
      text: message,
    });
  };

  const handleCreateGoogleMeet = ({ date, email, accessToken }:{ date:string;email:string[];accessToken:string }) => {
    sendMessage('I\'ll send you the meeting invitation later.');
    createGoogleMeet({
      startDate: new Date(date),
      endDate: new Date(new Date(date).getTime() + 30 * 60 * 1000),
      selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Add timezone
      emails: email,
      googleToken: accessToken as string,
    }).then((createMeetResponse) => {
      console.log('createMeetResponse', createMeetResponse);
      if (createMeetResponse) {
        const eventMessage = `Event details \n📝 Title\n${createMeetResponse.summary}\n👥 Guests\n${createMeetResponse.attendees.map((attendee) => attendee.email).join('\\n')}\n📅 Time\n${createMeetResponse.start.dateTime} - ${createMeetResponse.end.dateTime}\n${createMeetResponse.start.timeZone}\n🔗 Meeting link\n${createMeetResponse.hangoutLink}
        `;
        sendMessage(eventMessage);
      }
    });
  };
  const handleGoogleAuthCheck = async ({ date, email }:{ date:string;email:string[] }) => {
    const accessToken = await checkGoogleAuthStatus();
    if (accessToken) {
      console.log('google 认证完成');
      handleCreateGoogleMeet({ date, email, accessToken });
    } else {
      console.log('google 认证失败');
      Modal.confirm({
        title: 'Google 授权',
        content: '将获取你的google日历授权，请确认',
        okText: '确认',
        cancelText: '取消',
        onOk() {
          // ✅ 点击确认按钮后的回调
          console.log('用户点击了确认');
          loginWithGoogle().then(({ accessToken }) => {
            handleCreateGoogleMeet({ date, email, accessToken });
          });
        },
        onCancel() {
          console.log('用户点击了取消');
        },
      });
    }
  };

  const getMeetParamsByAITools = (message:string): Promise<any> => {
    return new Promise((resolve, reject) => {
      fetch('https://telegpt-three.vercel.app/tool-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{
            id: uuidv4(),
            content: message,
            role: 'user',
          }],
        }),
      }).then((res) => res.json()).then((toolResults) => {
        let email: string[] | null = null;
        let date: string | null = null;
        if (toolResults && toolResults.length > 0) {
          toolResults.forEach((toolCall: any) => {
            if (toolCall.toolName === 'parseTime') {
              date = toolCall.result;
            } else if (toolCall.toolName === 'extractEmail') {
              email = toolCall.result;
            }
          });
          resolve({
            date,
            email,
          });
        } else {
          resolve({});
        }
      }).catch((err) => {
        reject(err);
      });
    });
  };
  const handleScheduleMeeting = () => {
    let email: string[] | null = null;
    let date: string | null = null;

    let timeout: NodeJS.Timeout;

    const cleanup = () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      eventEmitter.off(Actions.NewTextMessage, handler);
      clearTimeout(timeout);
      console.log('[🔁 清理监听器]');
    };
    const handler = async ({ message }:{ message: ApiMessage }) => {
      if (message.content.text && message.chatId === chat.id && !message.isOutgoing) {
        const { text } = message.content.text;
        const toolCheckRes = await getMeetParamsByAITools(text);
        if (toolCheckRes.email) email = toolCheckRes.email;
        if (toolCheckRes.date) date = toolCheckRes.date;
        if (!email && !date) {
          sendMessage('请告诉我你的约会时间和邮箱');
          return;
        } else if (!email) {
          sendMessage('请告诉我你的邮箱');
          return;
        } else if (!date) {
          sendMessage('请告诉我你的约会时间');
          return;
        }
        if (email && date) {
          cleanup();
          console.log('[✅ 工作流完成]:', { date, email });
          handleGoogleAuthCheck({ date, email });
        }
      }
    };

    // 注册监听器
    eventEmitter.on(Actions.NewTextMessage, handler);

    // 超时自动清理
    timeout = setTimeout(() => {
      cleanup();
      console.log('已超过五分钟未完成输入，工作流已结束。');
    }, 1000 * 60 * 5);

    sendMessage('你好，请告诉我你的约会时间和邮箱。');
  };
  return (
    <div className="chat-ai-menu flex-shrink-0">
      <button className="Button chat-ai-logo-button" onClick={handleToggleMenu}>
        <img src={chatAILogoPath} alt="Chat AI Logo" />
      </button>
      <Menu
        id="attach-menu-controls"
        isOpen={isAIToolMenuOpen}
        autoClose
        positionX="right"
        positionY="bottom"
        onClose={closeAIToolMenu}
        className="AttachMenu--menu fluid"
        onCloseAnimationEnd={closeAIToolMenu}
        ariaLabelledBy="attach-menu-button"
      >
        <MenuItem onClick={handleTranslate}>
          <div className="ai-tool-menu-item">
            <img src={TranslateIcon} alt="" className="w-[18px] h-[18px]" />
            <span>Translate</span>
            <div
              className="ai-tool-menu-language ml-auto flex flex-row items-center hover:text-[#3390EC]"
              onClick={onTranslationClick}
            >
              <Icon name="language" className="!mx-0 " />
              <span>{currentLanguage.translatedName}</span>
            </div>
          </div>
        </MenuItem>
        <MenuItem onClick={handleGrammar}>
          <div className="ai-tool-menu-item">
            <img src={GrammerIcon} alt="" className="w-[18px] h-[18px]" />
            <span>Grammar</span>
          </div>
        </MenuItem>
        <MenuItem onClick={handleScheduleMeeting}>
          <div className="ai-tool-menu-item">
            <img src={ScheduleMeetingIcon} alt="" className="w-[18px] h-[18px]" />
            <span>Schedule a meeting</span>
          </div>
        </MenuItem>
      </Menu>
      <InputLanguageModal isOpen={inputLanguageModalOpen} closeInputLanguageModal={closeInputLanguageModal} />
    </div>
  );
};

export default InputAIMenu;
