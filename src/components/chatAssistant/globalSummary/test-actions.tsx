/* eslint-disable react/jsx-no-bind */
import React from 'react';
import { Button } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import { getGlobal } from '../../../global';

import type { ApiMessage } from '../../../api/types';
import { MAIN_THREAD_ID } from '../../../api/types';

import { ALL_FOLDER_ID } from '../../../config';
import { isSystemBot } from '../../../global/helpers';
import { selectBot, selectChat, selectFirstUnreadId } from '../../../global/selectors';
import { getOrderedIds } from '../../../util/folderManager';
import { fetchChatUnreadMessage } from '../utils/fetch-messages';
import { signOutGoogle } from '../utils/google-api';

import './test-actions.scss';

interface IProps {
  summaryAllUnreadMessages?: () => Promise<void>;
  showTestModalVisible?: () => void;
}
const TestActions = (props: IProps) => {
  const { summaryAllUnreadMessages, showTestModalVisible } = props;
  // const handleNotification = () => {
  //   window.Notification.requestPermission().then((permission) => {
  //     if (permission === 'granted') {
  //       const notification = new Notification('通知标题：', {
  //         body: '通知内容',
  //         icon: 'https://pic1.zhuanstatic.com/zhuanzh/50b6ffe4-c7e3-4317-bc59-b2ec4931f325.png',
  //       });
  //       setTimeout(() => notification.close(), 5000);
  //     }
  //   });
  // };

  const handleVoiceCall = () => {
    fetch('https://telegpt-three.vercel.app/voice-call?phoneNumber=17671617800', {
      method: 'GET',
    });
  };
  const handleToolcheck = () => {
    fetch('http://localhost:3000/tool-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          id: uuidv4(),
          content: '我的邮箱是824767401@qq.com',
          role: 'user',
        }],
      }),
    }).then((res) => res.json())
      .then((toolResults) => {
        console.log(toolResults);
      });
  };
  const handleSignOut = () => {
    signOutGoogle();
  };
  const getUnreadMessages = async () => {
    const unreadMessages: Record<string, ApiMessage[]> = {};
    const global = getGlobal();
    const orderedIds = getOrderedIds(ALL_FOLDER_ID) || [];
    for (let i = 0; i < orderedIds.length; i++) {
      const chatId = orderedIds[i];
      const chat = selectChat(global, chatId);
      const chatBot = !isSystemBot(chatId) ? selectBot(global, chatId) : undefined;
      if (chat && chat.unreadCount && !chatBot) {
        // if (chat?.membersCount && chat?.membersCount > 100) {
        //   continue;
        // }
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
          unreadMessages[chatId] = roomUnreadMsgs;
        }
      }
    }
    console.log(unreadMessages);
  };
  return (
    <div className="test-actions-wrapper absolute left-[20px] bottom-[20px] flex flex-col gap-[12px]">
      <Button type="primary" onClick={summaryAllUnreadMessages}>
        Summarize all unread
      </Button>
      <Button type="primary" onClick={showTestModalVisible}>
        Test entry
      </Button>
      <Button type="primary" onClick={getUnreadMessages}>
        获取所有未读消息
      </Button>
      {/* <Button type="primary" onClick={handleVoiceCall}>
        语音通知
      </Button>
      <Button type="primary" onClick={handleToolcheck}>
        tool check
      </Button>
      <Button type="primary" onClick={handleSignOut}>
        退出谷歌登录
      </Button> */}
    </div>
  );
};

export default TestActions;
