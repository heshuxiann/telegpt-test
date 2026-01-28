import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import type { Message } from '../components/chatAssistant/messages/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export function sanitizeUIMessages(messages: Array<Message>): Array<Message> {
  // 对于自定义 Message 类型，过滤掉空内容的消息
  return messages.filter((message) => message.content && message.content.length > 0);
}
