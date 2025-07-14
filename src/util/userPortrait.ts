import dayjs from 'dayjs';

import type { ApiUpdateDeleteStory, ApiUpdateStory } from '../api/types';
import type { UserPortraitMessageStory } from '../components/chatAssistant/store/user-portrait-message-store';

import { ChataiStores } from '../components/chatAssistant/store';
import { messageEmbeddingStore } from '../components/chatAssistant/vector-store';

export type TextMessage = {
  messageId: number;
  content: string;
  chatId: string;
  senderId: string;
  timestamp: number;
};

export function groupMessagesByHalfHour(messages: TextMessage[]) {
  const result: {
    timeRange: string;
    time: string;
    chatGroups: {
      chatId: string;
      messages: {
        content: string;
        messageId: number;
        timestamp: number;
      }[];
    }[];
  }[] = [];

  const groupMap: Record<
  string, // day+groupKey
  TextMessage[]
  > = {};

  messages.forEach((msg: TextMessage) => {
    const { timestamp } = msg;
    const date = new Date(timestamp * 1000);
    const hour = date.getHours();
    const minute = date.getMinutes();
    const day = dayjs(timestamp * 1000).format('YYYY-MM-DD');

    let groupKey: string;
    if (minute < 30) {
      groupKey = `${hour.toString().padStart(2, '0')}:00-${hour
        .toString()
        .padStart(2, '0')}:30`;
    } else {
      const nextHour = (hour + 1) % 24;
      groupKey = `${hour.toString().padStart(2, '0')}:30-${nextHour
        .toString()
        .padStart(2, '0')}:00`;
    }

    const dayGroupKey = `${day}_${groupKey}`;
    if (!groupMap[dayGroupKey]) groupMap[dayGroupKey] = [];
    groupMap[dayGroupKey].push(msg);
  });

  // 再在每个 day+groupKey 分组内按 chatId 分组
  Object.entries(groupMap).forEach(([dayGroupKey, items]) => {
    const [day, timeRange] = dayGroupKey.split('_');
    const chatGroupMap: Record<string, TextMessage[]> = {};
    items.forEach((msg) => {
      if (!chatGroupMap[msg.chatId]) chatGroupMap[msg.chatId] = [];
      chatGroupMap[msg.chatId].push(msg);
    });

    const chatGroups = Object.entries(chatGroupMap).map(([chatId, msgs]) => ({
      chatId,
      messages: msgs.map((mItem) => ({
        content: mItem.content,
        messageId: mItem.messageId,
        timestamp: mItem.timestamp,
      })),
    }));

    result.push({
      timeRange,
      time: day,
      chatGroups,
    });
  });

  return result;
}

export async function getMessageBySendId(senderId: string) {
  const vectorSearchResults = await messageEmbeddingStore.documentSearch({
    filterOptions: {
      include: {
        metadata: {
          senderId,
        },
      },
    },
  });
  if (vectorSearchResults.length > 0) {
    const messageList = vectorSearchResults.map((item: any) => ({
      messageId: (item.metadata as { messageId: string }).messageId,
      content: item.text,
      chatId: (item.metadata as { chatId: string }).chatId,
      senderId,
      timestamp: (item.metadata as { timestamp: number }).timestamp,
    }));
    return messageList?.sort(
      (a: TextMessage, b: TextMessage) => a.timestamp - b.timestamp,
    );
  } else {
    return [];
  }
}

export function handleStoryToUserPortraitMessage(data: ApiUpdateStory) {
  const { peerId: userId, story } = data;
  const obj: UserPortraitMessageStory = {
    id: `${userId}-story-${story?.id}`,
    senderId: userId,
    isSummary: false,
    time: dayjs(story.date * 1000).format('YYYY-MM-DD HH:mm:ss'),
    message: story,
  };
  ChataiStores.userPortraitMessage?.addUserPortraitMessage(obj);
}

export function deleteStoryFromUserPortraitMessage(data: ApiUpdateDeleteStory) {
  const id = `${data?.peerId}-story-${data?.storyId}`;
  ChataiStores.userPortraitMessage?.deleteUserPortraitMessage(id);
}

export function searchPortrait(value: string) {
  const flag = value.indexOf('画像') > -1 || value.indexOf('portrait') > -1;
  return flag;
}
