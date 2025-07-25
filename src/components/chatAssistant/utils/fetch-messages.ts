/* eslint-disable prefer-const */
/* eslint-disable no-null/no-null */
import { getGlobal } from '../../../global';

import type { ApiChat, ApiMessage } from '../../../api/types';
import type { ThreadId } from '../../../types';
import type { SummaryMessage } from '../type/message';
import { LoadMoreDirection } from '../../../types';

import { hasMessageText } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';

const { callApi } = require('../../../api/gramjs/worker/connector');
// import { callApi } from '../../../api/gramjs/worker/connector';

export const fetchMessage = (props: {
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
  }).then((result: any) => {
    if (!result) {
      return undefined;
    }
    const { messages, count } = result;
    return { messages, count };
  });
};

export const fetchChatUnreadMessage = async (props: {
  chat: ApiChat;
  offsetId: number;
  addOffset: number;
  sliceSize: number;
  threadId: number;
  unreadCount: number;
  maxCount?: number;
}): Promise<ApiMessage[]> => {
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
    const textMessage = resultMessage.filter((msg: ApiMessage) => hasMessageText(msg));
    if (totalCount + textMessage.length > mergeCount) {
      messages = messages.concat(
        textMessage.slice(0, mergeCount - messages.length),
      );
      break;
    } else {
      messages = messages.concat(textMessage);
    }

    totalCount += textMessage.length || 0;
    offsetId = resultMessage[resultMessage.length - 1].id; // 更新 offsetId

    if (resultMessage.length < props.sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return messages;
};

export const fetchChatMessageByDeadline = async (props: {
  chat: ApiChat;
  deadline: number;
  offsetId: number;
  addOffset: number;
  sliceSize: number;
  threadId: number;
  maxCount?: number;
}): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  let {
    // eslint-disable-next-line prefer-const
    offsetId,
    deadline,
    sliceSize,
    maxCount = 100,
  } = props; // 记录偏移量

  while (
    (!messages.length || messages[0]?.date >= deadline)
    && messages.length < maxCount
  ) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: sliceSize,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    const textMessage = result.messages.filter((msg: ApiMessage) => hasMessageText(msg));

    if (result.messages[result.messages.length - 1].date < deadline) {
      const effectMessage = textMessage.filter(
        (msg: any) => msg.date >= deadline,
      );
      messages = messages.concat(effectMessage);
      break;
    } else if (messages.length + textMessage.length > maxCount) {
      messages = messages.concat(
        textMessage.slice(0, maxCount - messages.length),
      );
      break;
    } else {
      messages = messages.concat(textMessage);
    }

    offsetId = result.messages[result.messages.length - 1].id; // 更新 offsetId

    if (result.messages.length < props.sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return messages.reverse();
};

export const fetchChatMessageByOffsetId = async (props: {
  chat: ApiChat;
  addOffset: number;
  offsetId: number;
  sliceSize: number;
  threadId: number;
  maxCount?: number;
}): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  let {
    // eslint-disable-next-line prefer-const
    offsetId,
    sliceSize,
    maxCount = 100,
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
    const textMessage = result.messages.filter((msg: ApiMessage) => hasMessageText(msg));
    if (messages.length + textMessage.length >= maxCount) {
      messages = messages.concat(
        textMessage.slice(0, maxCount - messages.length),
      );
      break;
    } else {
      messages = messages.concat(textMessage);
    }

    offsetId = result.messages[result.messages.length - 1].id; // 更新 offsetId

    if (result.messages.length < props.sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return messages.reverse();
};

export const formateMessage2Summary = (
  messages: ApiMessage[],
): SummaryMessage[] => {
  const global = getGlobal();
  const formateMessages = messages
    .map((message) => {
      if (message.content.text?.text) {
        const peer = message.senderId
          ? selectUser(global, message.senderId)
          : undefined;
        return {
          senderId: message?.senderId || message?.chatId,
          senderName: peer
            ? `${peer.firstName || ''} ${peer.lastName || ''}`
            : '',
          date: message.date,
          messageId: Math.floor(message.id),
          content: message.content.text?.text ?? '',
        };
      }
      return null;
    })
    .filter(Boolean);
  return formateMessages;
};

export const fetchChatMessageByCount = async (props: {
  chat: ApiChat;
  offsetId: number;
  addOffset: number;
  sliceSize: number;
  threadId: number;
  maxCount?: number;
}): Promise<ApiMessage[]> => {
  let messages: any[] = [];
  // eslint-disable-next-line prefer-const
  let { offsetId, sliceSize, maxCount = 100 } = props;
  while (!messages.length || messages.length < maxCount) {
    const result = await callApi('fetchMessages', {
      ...props,
      offsetId,
      limit: sliceSize,
    });

    if (!result || !result.messages?.length) {
      break;
    }
    if (messages.length + result.messages.length >= maxCount) {
      messages = messages.concat(
        result.messages.slice(0, maxCount - messages.length),
      );
      break;
    } else {
      messages = messages.concat(result.messages);
    }

    offsetId = result.messages[result.messages.length - 1].id;

    if (result.messages.length < props.sliceSize) {
      break;
    }
  }
  return messages.reverse();
};

export const loadTextMessages = async ({
  chat,
  sliceSize,
  threadId,
  offsetId,
  direction,
  maxCount = 100,
}: {
  chat: ApiChat;
  sliceSize: number;
  threadId: ThreadId;
  offsetId: number | undefined;
  direction: LoadMoreDirection;
  maxCount?: number;
}) => {
  let messages: any[] = [];
  let addOffset: number | undefined;
  switch (direction) {
    case LoadMoreDirection.Backwards:
      if (offsetId) {
        addOffset = -1;
        sliceSize += 1;
      } else {
        addOffset = undefined;
      }
      break;
    case LoadMoreDirection.Forwards:
      addOffset = -(sliceSize + 1);
      if (offsetId) {
        sliceSize += 1;
      }
      break;
  }
  while (!messages.length && messages.length < maxCount) {
    const result = await callApi('fetchMessages', {
      chat,
      offsetId,
      addOffset,
      limit: sliceSize,
      threadId,
    });

    if (!result || !result.messages?.length) {
      break; // 没有更多消息，退出循环
    }
    const textMessage = result.messages.filter((msg: ApiMessage) => hasMessageText(msg));
    if (messages.length + textMessage.length >= maxCount) {
      messages = messages.concat(
        textMessage.slice(0, maxCount - messages.length),
      );
      break;
    } else {
      messages = messages.concat(textMessage);
    }

    offsetId = result.messages[result.messages.length - 1].id; // 更新 offsetId

    if (result.messages.length < sliceSize) {
      break; // 本次获取的消息不足 sliceSize，说明没有更多消息了
    }
  }

  return messages.reverse();
};
