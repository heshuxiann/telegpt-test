import type { ApiChat } from '../../../api/types';

import { callApi } from '../../../api/gramjs/worker/connector';

export const fetchMessage = (props:{
  chat: ApiChat;
  offsetId: number;
  addOffset: number;
  sliceSize: number;
  threadId: number;
}) => {
  const {
    chat, offsetId, addOffset, sliceSize, threadId,
  } = props;
  callApi('fetchMessages', {
    chat,
    offsetId,
    addOffset,
    limit: sliceSize,
    threadId,
  }).then((result) => {
    if (!result) {
      return undefined;
    }
    const {
      messages, count,
    } = result;
    return { messages, count };
  });
};

export const fetchChatUnreadMessage = async (
  props: {
    chat: ApiChat;
    offsetId: number;
    addOffset: number;
    sliceSize: number;
    threadId: number;
    unreadCount:number;
  },
): Promise<{ messages: any[]; count: number }> => {
  let messages: any[] = [];
  let totalCount = 0;
  let { offsetId } = props; // 记录偏移量

  while (messages.length < props.unreadCount) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: props.sliceSize,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    if (totalCount + result.messages.length > props.unreadCount) {
      messages = result.messages.slice(0, props.unreadCount - messages.length).concat(messages);
      break;
    } else {
      messages = result.messages.concat(messages);
    }

    totalCount += result.count || 0;
    offsetId = result.messages[result.messages.length - 1].id; // 更新 offsetId

    if (result.messages.length < props.sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return { messages, count: totalCount };
};
