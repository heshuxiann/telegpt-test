/**
 * TelGPT WebSocket 工具调用处理器
 * 处理服务端通过 WebSocket 发送的工具调用请求
 */

import { getGlobal } from "../global";

import type { ApiChat, ApiMessage } from "../api/types";

import { selectChat, selectUser } from "../global/selectors";
import { callApi } from "../api/gramjs";

/**
 * 工具调用请求消息
 */
export interface TelGPTToolCallMessage {
  requestId: string;
  action: string;
  params: Record<string, any>;
}

/**
 * 工具调用响应消息
 */
export interface TelGPTToolResponseMessage {
  requestId: string;
  success: boolean;
  data?: any;
  error?:any;
}

/**
 * get_messages 工具的参数
 */
interface GetMessagesParams {
  chatId: string;
  startTime?: number; // Unix timestamp in milliseconds
  endTime?: number; // Unix timestamp in milliseconds
  limit?: number;
  senderIds?: string[];
}

/**
 * 处理 TelGPT 工具调用请求
 */
export async function handleTelGPTToolCall(
  message: TelGPTToolCallMessage,
): Promise<TelGPTToolResponseMessage> {
  const { requestId, action, params } = message;

  try {
    // eslint-disable-next-line no-console
    console.log(`[TelGPT Tool] Handling tool call: ${action}`, params);

    let result: any;

    switch (action) {
      case "get_messages":
        result = await handleGetMessages(params as GetMessagesParams);
        break;

      default:
        throw new Error(`Unknown tool action: ${action}`);
    }

    return {
      requestId,
      success: true,
      data: result,
    };
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("[TelGPT Tool] Error:", error);

    return {
        requestId,
        success: false,
        error: error.message || "Unknown error occurred",
    };
  }
}

/**
 * 处理 get_messages 工具调用
 */
async function handleGetMessages(params: GetMessagesParams): Promise<{
  messages:Array<{
    chatId:string;
    messageId: string;
    content: string;
    senderId: string;
    senderName: string;
    timestamp: number;
  }>,
}> {
  const { chatId, startTime, endTime, limit = 100, senderIds } = params;

  // eslint-disable-next-line no-console
  console.log(`[TelGPT Tool] Fetching messages for chat ${chatId}`, {
    startTime,
    endTime,
    limit,
    senderIds,
  });

  const global = getGlobal();
  const chat = selectChat(global, chatId);

  if (!chat) {
    throw new Error(`Chat not found: ${chatId}`);
  }

  // 获取消息
  const messages = await fetchMessagesWithFilters({
    chat,
    startTime,
    endTime,
    limit,
    senderIds,
  });

  // 格式化消息
  const formattedMessages = messages.map((message: ApiMessage) =>
    formatMessageForAgent(message),
  );

  // 返回格式与后端期望一致：只包含 messageCount 和 messages
  return {
    messages: formattedMessages,
  };
}

/**
 * 获取并过滤消息
 */
async function fetchMessagesWithFilters({
  chat,
  startTime,
  endTime,
  limit,
  senderIds,
}: {
  chat: ApiChat;
  startTime?: number;
  endTime?: number;
  limit: number;
  senderIds?: string[];
}): Promise<ApiMessage[]> {
  const messages: ApiMessage[] = [];
  let offsetId: number | undefined;
  const batchSize = 100;
  const maxMessages = Math.min(limit, 500);

  // eslint-disable-next-line no-console
  console.log('[TelGPT Tool] Starting message fetch loop', {
    chatId: chat.id,
    maxMessages,
    startTime,
    endTime,
  });

  while (messages.length < maxMessages) {
    // eslint-disable-next-line no-console
    console.log('[TelGPT Tool] Fetching batch', {
      offsetId,
      currentCount: messages.length,
      batchSize,
    });

    const result = await callApi('fetchMessages', {
      chat,
      offsetId,
      addOffset: offsetId ? -1 : undefined,
      limit: batchSize,
      threadId: -1, // MAIN_THREAD_ID
    });

    // eslint-disable-next-line no-console
    console.log('[TelGPT Tool] API result', {
      success: !!result,
      messageCount: result?.messages?.length || 0,
    });

    if (!result || !result.messages?.length) {
      // eslint-disable-next-line no-console
      console.log('[TelGPT Tool] No more messages, breaking');
      break;
    }

    // 过滤消息
    const filteredMessages = result.messages.filter((msg: ApiMessage) => {
      // 只要文本消息
      if (!msg.content.text?.text) {
        return false;
      }

      // 时间过滤 (API 返回的是秒级时间戳)
      if (startTime && msg.date*1000 < startTime) {
        return false;
      }
      if (endTime && msg.date*1000 > endTime) {
        return false;
      }

      // 发送者过滤
      if (senderIds && senderIds.length > 0 && msg.senderId) {
        if (!senderIds.includes(msg.senderId)) {
          return false;
        }
      }

      return true;
    });

    // eslint-disable-next-line no-console
    console.log('[TelGPT Tool] Filtered messages', {
      total: result.messages.length,
      filtered: filteredMessages.length,
    });

    messages.push(...filteredMessages);

    // 更新 offsetId（使用原始消息列表的最后一条）
    const lastMsg = result.messages[result.messages.length - 1];
    offsetId = lastMsg.id;

    // 如果达到限制，截断并退出
    if (messages.length >= maxMessages) {
      messages.splice(maxMessages);
      // eslint-disable-next-line no-console
      console.log('[TelGPT Tool] Reached maxMessages limit, breaking');
      break;
    }

    // 如果返回的消息少于请求数量，说明没有更多消息了
    if (result.messages.length < batchSize) {
      // eslint-disable-next-line no-console
      console.log('[TelGPT Tool] Got less than batch size, no more messages');
      break;
    }

    // 如果有开始时间限制，且最后一条消息早于开始时间，停止获取
    if (startTime && lastMsg.date*1000 < startTime) {
      // eslint-disable-next-line no-console
      console.log('[TelGPT Tool] Reached startTime, breaking');
      break;
    }
  }

  // eslint-disable-next-line no-console
  console.log('[TelGPT Tool] Fetch complete', {
    totalMessages: messages.length,
  });

  // 按时间正序排列 (旧消息在前)
  return messages.reverse();
}

/**
 * 格式化消息为服务端期望的格式
 */
function formatMessageForAgent(message: ApiMessage) {
  const global = getGlobal();
  const sender = message.senderId
    ? selectUser(global, message.senderId)
    : undefined;

  return {
    chatId: message.chatId,
    messageId: String(message.id),
    content: message.content.text?.text || "",
    senderId: message.senderId || message.chatId,
    senderName: sender
      ? `${sender.firstName || ""} ${sender.lastName || ""}`.trim()
      : "Unknown",
    timestamp: message.date * 1000, // 转换为毫秒
  };
}
