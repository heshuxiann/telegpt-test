import type { ApiChat, ApiMessage } from '../../../api/types';

const { callApi } = require('../../../api/gramjs/worker/connector');
// import { callApi } from '../../../api/gramjs/worker/connector';

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
  }).then((result:any) => {
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
    maxCount?:number;
  },
): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  let totalCount = 0;
  let { offsetId } = props; // 记录偏移量
  const mergeCount = Math.min(props.unreadCount, props.maxCount || 100);
  while (messages.length < mergeCount) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: props.sliceSize,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    const resultMessage = result.messages.reverse();
    if (totalCount + resultMessage.length > mergeCount) {
      messages = messages.concat(resultMessage.slice(0, mergeCount - messages.length));
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
    maxCount?:number;
  },
): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  let {
    // eslint-disable-next-line prefer-const
    offsetId, deadline, sliceSize, maxCount = 100,
  } = props; // 记录偏移量

  while ((!messages.length || messages[0]?.date >= deadline) && messages.length < maxCount) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: sliceSize,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    if (result.messages[result.messages.length - 1].date < deadline) {
      const effectMessage = result.messages.filter((msg:any) => msg.date >= deadline);
      messages = messages.concat(effectMessage);
      break;
    } else if (messages.length + result.messages.length > maxCount) {
      messages = messages.concat(result.messages.slice(0, maxCount - messages.length));
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

export const fetchChatMessageByOffsetId = async (
  props: {
    chat: ApiChat;
    addOffset: number;
    offsetId: number;
    sliceSize: number;
    threadId: number;
    maxCount?:number;
  },
): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  let {
    // eslint-disable-next-line prefer-const
    offsetId, sliceSize, maxCount = 100,
  } = props; // 记录偏移量

  while (!messages.length && messages.length < maxCount) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: sliceSize,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    if (messages.length + result.messages.length >= maxCount) {
      messages = messages.concat(result.messages.slice(0, maxCount - messages.length));
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
