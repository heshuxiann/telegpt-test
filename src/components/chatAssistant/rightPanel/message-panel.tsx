/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useState } from 'react';
import { Drawer, Skeleton } from 'antd';
import { getGlobal } from '../../../global';

import { type ApiMessage, type ApiUser, MESSAGE_DELETED } from '../../../api/types';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import { updateChatMessage } from '../../../global/reducers/messages';
import { selectChat, selectUser } from '../../../global/selectors';
import { selectChatMessage } from '../../../global/selectors/messages';
import { callApi } from '../../../api/gramjs';
import { formatTimestamp } from '../utils/util';

import Avatar from '../ui/Avatar';

const Message = ({ chatId, messageId }:{ chatId: string; messageId: number }) => {
  const global = getGlobal();
  const chat = selectChat(global, chatId);
  const [message, setMessage] = useState<ApiMessage | undefined>();
  const [peer, setPeer] = useState<ApiUser | undefined>();
  useEffect(() => {
    const message = selectChatMessage(global, chatId, messageId);
    if (message) {
      setMessage(message);
    } else if (chat) {
      callApi('fetchMessage', { chat, messageId }).then((result) => {
        if (result && result !== MESSAGE_DELETED) {
          setMessage(result.message);
          updateChatMessage(global, chat.id, messageId, result.message);
        }
      });
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId, messageId]);
  useEffect(() => {
    if (message) {
      const senderId = message.senderId;
      const peer = senderId ? selectUser(global, senderId) : undefined;
      setPeer(peer);
    }
  }, [message, global]);
  return (
    <div className="pb-[20px] pt-[16px] border-solid border-b-[1px] border-[rgba(0,0,0,0.1)]">
      <div className="flex flex-row items-center mb-[12px]">
        <Avatar
          key={chatId}
          className="overlay-avatar"
          size={34}
          peer={peer}
          withStory
        />
        <span className="text-[16px] font-semibold mr-[8px] ml-[12px]">{peer ? (peer?.firstName || '') + (peer?.lastName || '') : ''}</span>
        <span className="text-[#979797] text-[13px]">{message ? formatTimestamp(message.date * 1000) : ''}</span>
      </div>
      {message ? (
        <div className="text-[15px]">{message.content.text?.text}</div>
      ) : (
        <Skeleton active paragraph={{ rows: 2 }} />
      )}

    </div>
  );
};
const MessagePanel = () => {
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [chats, setChats] = useState< { chatId: string; messageIds: number[] }[] >([]);
  const handleOpenRightPanle = (payload: { chats: { chatId: string; messageIds: number[] }[] }) => {
    setRightPanelOpen(true);
    const { chats } = payload;
    setChats(chats);
  };
  useEffect(() => {
    eventEmitter.on(Actions.ShowGlobalSummaryMessagePanel, handleOpenRightPanle);
    return () => {
      eventEmitter.off(Actions.ShowGlobalSummaryMessagePanel, handleOpenRightPanle);
    };
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);

  const renderMessage = () => {
    return (
      <div>
        {chats.map((item) => {
          const { chatId, messageIds } = item;
          if (!messageIds) return null;
          return (
            <>
              {messageIds.map((messageId) => {
                return <Message chatId={chatId} messageId={messageId} />;
              })}
            </>
          );
        })}
      </div>
    );
  };
  const handleClose = () => {
    setRightPanelOpen(false);
    setChats([]);
  };
  return (
    // eslint-disable-next-line react/jsx-no-bind
    <Drawer open={rightPanelOpen} getContainer={false} onClose={handleClose}>
      {renderMessage()}
    </Drawer>
  );
};

export default MessagePanel;
