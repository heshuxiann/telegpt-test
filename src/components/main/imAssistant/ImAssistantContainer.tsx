import React, {
  useEffect, useRef,
  useState,
} from '../../../lib/teact/teact';
import { getGlobal } from '../../../global';

import type { IFetchUnreadMessage, ImAssistantChat } from '../../chatAssistant/im-assiatant';
import { type ApiMessage, type ApiPeer, MAIN_THREAD_ID } from '../../../api/types';

import { ALL_FOLDER_ID } from '../../../config';
import { injectComponent } from '../../../lib/injectComponent';
import { getChatAvatarHash, getPeerColorKey, isUserId } from '../../../global/helpers';
import {
  selectChat, selectChatLastMessageId, selectChatMessage, selectUser,
} from '../../../global/selectors';
import * as mediaLoader from '../../../util/mediaLoader';
import { getFirstLetters } from '../../../util/textFormat';
import ImAssistant from '../../chatAssistant/im-assiatant';

import { useFolderManagerForOrderedIds } from '../../../hooks/useFolderManager';

import { fetchChatMessageByDeadline, fetchChatUnreadMessage } from '../../right/ChatAI/fetch-messages';

import './ImAssistant.scss';

const peerColors = ['#D45246', '#F68136', '#6C61DF', '#46BA43', '#5CAFFA', '#408ACF', '#D95574'];

const injectMessageAI = injectComponent(ImAssistant);
const ImAssistantContainer = () => {
  const global = getGlobal();
  // eslint-disable-next-line no-null/no-null
  const containerRef = useRef<HTMLDivElement | null>(null);
  const orderedIds = useFolderManagerForOrderedIds(ALL_FOLDER_ID);
  const [chatList, setChatList] = useState<ImAssistantChat[]>([]);
  useEffect(() => {
    if (orderedIds?.length) {
      const list:ImAssistantChat[] = [];
      orderedIds.forEach((chatId) => {
        const chat = selectChat(global, chatId);
        const user = selectUser(global, chatId);
        const peer = chat || user;
        const peerColor = peerColors[getPeerColorKey(peer) || 0];
        let imageHash: string | undefined;
        if (peer) {
          imageHash = getChatAvatarHash(peer as ApiPeer);
        }
        const mediaData = imageHash ? mediaLoader.getFromMemory(imageHash) : undefined;
        if (chat) {
          list.push({
            chatId,
            name: chat.title,
            avatar: mediaData,
            avatarColor: peerColor,
            nameFirstLetters: getFirstLetters(chat.title, isUserId(chat.id) ? 2 : 1),
            unreadCount: chat.unreadCount,
            lastReadInboxMessageId: chat.lastReadInboxMessageId,
            lastReadOutboxMessageId: chat.lastReadOutboxMessageId,
          });
        }
      });
      setChatList(list);
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [orderedIds]);

  async function getRoomUnreadMessages(params:IFetchUnreadMessage):Promise<ApiMessage[]> {
    const { chatId, offsetId, unreadCount } = params;
    const chat = selectChat(global, chatId);
    if (chat) {
      const messages = await fetchChatUnreadMessage({
        chat,
        offsetId,
        addOffset: -31,
        sliceSize: 30,
        threadId: MAIN_THREAD_ID,
        unreadCount,
      });
      return messages || [];
    }
    return [];
  }

  async function getRoomTodayMessage(chatId: string) {
    const chatLastMessageId = selectChatLastMessageId(global, chatId) || 0;
    const chat = selectChat(global, chatId);
    if (chat && chatLastMessageId) {
      const deadline = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
      const lastMessage = selectChatMessage(global, chatId, chatLastMessageId);
      if (lastMessage && lastMessage?.date < deadline) {
        return [];
      }
      const messages = await fetchChatMessageByDeadline({
        chat,
        deadline,
        offsetId: chatLastMessageId,
        addOffset: -1,
        sliceSize: 30,
        threadId: MAIN_THREAD_ID,
      });
      return messages || [];
    }
    return [];
  }

  useEffect(() => {
    if (containerRef.current) {
      injectMessageAI(containerRef.current, { chatList, getRoomUnreadMessages, getRoomTodayMessage });
    }
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatList]);
  return (
    <div className="im-assistant-container w-full h-full" ref={containerRef} />
  );
};
export default ImAssistantContainer;
