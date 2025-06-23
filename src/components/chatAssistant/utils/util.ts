/* eslint-disable max-len */
import type { CoreAssistantMessage, CoreToolMessage, Message } from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = date.toDateString() === now.toDateString();
  const isSameYear = date.getFullYear() === now.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timePart = `${hours}:${minutes}`;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();

  if (isSameDay) {
    return timePart;
  } else if (isSameYear) {
    return `${month} ${day} / ${timePart}`;
  } else {
    return `${date.getFullYear()}/${month} ${day} / ${timePart}`;
  }
}

/**
 * 时间戳专用时间范围格式化工具
 * @param {number} start 开始时间戳（支持毫秒/秒级）
 * @param {number} end 结束时间戳（支持毫秒/秒级）
 * @returns {string} 格式化后的时间范围字符串
 */
export function formatTimestampRange(start:number | undefined, end:number | undefined) {
  // 时间戳标准化处理（自动识别秒/毫秒）
  const normalizeTimestamp = (ts:number) => {
    if (ts.toString().length <= 10) return ts * 1000; // 秒级转毫秒
    return ts; // 毫秒级直接使用
  };

  const startDate = start ? new Date(normalizeTimestamp(start)) : undefined;
  const endDate = end ? new Date(normalizeTimestamp(end)) : undefined;
  const now = new Date();

  // 日期比较函数
  const isSameDay = (d1:Date, d2:Date) => d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();

  const isToday = (date:Date) => isSameDay(date, now);

  // 时间格式化组件
  const formatTime = (date:Date) => {
    const pad = (n:number) => String(n).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const formatDate = (date:Date) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const month = monthNames[date.getMonth()];
    const pad = (n:number) => String(n).padStart(2, '0');
    return `${month} ${pad(date.getDate())} / ${formatTime(date)}`;
  };

  if (!startDate && !endDate) {
    return '';
  }
  if (!startDate && endDate) {
    return `${formatDate(endDate)}`;
  }
  if (startDate && !endDate) {
    return `${formatDate(startDate)}`;
  }
  if (startDate && endDate) {
    // 范围判断逻辑
    if (isToday(startDate) && isToday(startDate)) {
      return `${formatTime(startDate)} - ${formatTime(endDate)}`;
    } else {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
  }
  return '';
}
export function validateAndFixJsonStructure(jsonString:string) {
  // 计数大括号和方括号的数量
  let braceCount = 0;
  let bracketCount = 0;

  // 记录所有多余或缺失的闭合符号
  let fixedJsonString = jsonString;

  // 遍历 JSON 字符串，检查并计算每个括号
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
    } else if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
    }
  }

  // 如果大括号数量不匹配，补充缺失的大括号
  while (braceCount > 0) {
    fixedJsonString += '}'; // 补充闭合大括号
    braceCount--;
  }

  while (braceCount < 0) {
    fixedJsonString = `{${fixedJsonString}`; // 补充开始大括号
    braceCount++;
  }

  // 如果方括号数量不匹配，补充缺失的方括号
  while (bracketCount > 0) {
    fixedJsonString += ']'; // 补充闭合方括号
    bracketCount--;
  }

  while (bracketCount < 0) {
    fixedJsonString = `[${fixedJsonString}`; // 补充开始方括号
    bracketCount++;
  }

  // 最后尝试解析 JSON，检查是否格式正确
  try {
    const parsed = JSON.parse(fixedJsonString);
    return { valid: true, parsed, fixedJson: fixedJsonString };
  } catch (error) {
    return { valid: false, error };
  }
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function sanitizeResponseMessages({
  messages,
  reasoning,
}: {
  messages: Array<ResponseMessage>;
  reasoning: string | undefined;
}) {
  const toolResultIds: Array<string> = [];

  for (const message of messages) {
    if (message.role === 'tool') {
      for (const content of message.content) {
        if (content.type === 'tool-result') {
          toolResultIds.push(content.toolCallId);
        }
      }
    }
  }

  const messagesBySanitizedContent = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (typeof message.content === 'string') return message;

    const sanitizedContent = message.content.filter((content) => (content.type === 'tool-call'
      ? toolResultIds.includes(content.toolCallId)
      : content.type === 'text'
        ? content.text.length > 0
        : true));

    if (reasoning) {
      // @ts-expect-error: reasoning message parts in sdk is wip
      sanitizedContent.push({ type: 'reasoning', reasoning });
    }

    return {
      ...message,
      content: sanitizedContent,
    };
  });

  return messagesBySanitizedContent.filter(
    (message) => message.content.length > 0,
  );
}

export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  const messagesBySanitizedToolInvocations = messages.map((message) => {
    if (message.role !== 'assistant') return message;

    if (!message.toolInvocations) return message;

    const toolResultIds: Array<string> = [];

    for (const toolInvocation of message.toolInvocations) {
      if (toolInvocation.state === 'result') {
        toolResultIds.push(toolInvocation.toolCallId);
      }
    }

    const sanitizedToolInvocations = message.toolInvocations.filter(
      (toolInvocation) => toolInvocation.state === 'result'
        || toolResultIds.includes(toolInvocation.toolCallId),
    );

    return {
      ...message,
      toolInvocations: sanitizedToolInvocations,
    };
  });

  return messagesBySanitizedToolInvocations.filter(
    (message) => message.content.length > 0
      || (message.toolInvocations && message.toolInvocations.length > 0),
  );
}
