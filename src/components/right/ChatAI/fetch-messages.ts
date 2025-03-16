import type { ApiChat, ApiMessage } from '../../../api/types';

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
): Promise<ApiMessage[]> => {
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
    const resultMessage = result.messages.reverse();
    if (totalCount + resultMessage.length > props.unreadCount) {
      messages = messages.concat(resultMessage.slice(0, props.unreadCount - messages.length));
      break;
    } else {
      messages = messages.concat(resultMessage);
    }

    totalCount += resultMessage.length || 0;
    offsetId = resultMessage[resultMessage.length - 1].id; // 更新 offsetId

    if (resultMessage.length < props.sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return messages;
};

export const fetchChatMessageByDeadline = async (
  props: {
    chat: ApiChat;
    deadline: number;
    offsetId: number;
    addOffset: number;
    sliceSize: number;
    threadId: number;
  },
): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  let {
    // eslint-disable-next-line prefer-const
    offsetId, deadline, sliceSize,
  } = props; // 记录偏移量

  while (!messages.length || messages[0]?.date >= deadline) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: sliceSize,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    if (result.messages[result.messages.length - 1].date < deadline) {
      const effectMessage = result.messages.filter((msg) => msg.date >= deadline);
      messages = messages.concat(effectMessage);
      break;
    } else {
      messages = messages.concat(result.messages);
    }

    offsetId = result.messages[result.messages.length - 1].id; // 更新 offsetId

    if (result.messages.length < props.sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return messages.reverse();
};
