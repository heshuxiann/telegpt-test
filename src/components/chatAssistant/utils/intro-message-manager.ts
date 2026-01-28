import type { Message } from '../messages/types';

import { createGlobalIntroduceMessage } from '../global-summary/summary-utils';
import { createRoomDescriptionMessage } from '../room-ai/room-ai-utils';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

/**
 * 初始化消息管理器
 * 统一管理各个 chat 的初始介绍消息，不再依赖 storage 是否为空来判断
 */
class IntroMessageManager {
  private static STORAGE_KEY = 'chat-ai-intro-initialized';

  /**
   * 检查某个 chatId 是否已经初始化过介绍消息
   */
  static isInitialized(chatId: string): boolean {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) return false;

    try {
      const initialized = JSON.parse(data);
      return initialized[chatId] === true;
    } catch {
      return false;
    }
  }

  /**
   * 标记某个 chatId 已经初始化
   */
  static markAsInitialized(chatId: string): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const initialized = data ? JSON.parse(data) : {};
    initialized[chatId] = true;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialized));
  }

  /**
   * 获取某个 chatId 的初始介绍消息
   * 如果已经初始化过，返回 undefined
   * 如果未初始化，返回对应的介绍消息并标记为已初始化
   */
  static getIntroMessage(chatId: string): Message | undefined {
    // 如果已经初始化过，不再创建介绍消息
    if (this.isInitialized(chatId)) {
      return undefined;
    }

    // 创建对应的介绍消息
    const introMessage = chatId === GLOBAL_SUMMARY_CHATID
      ? createGlobalIntroduceMessage()
      : createRoomDescriptionMessage(chatId);

    // 标记为已初始化
    this.markAsInitialized(chatId);

    return introMessage;
  }

  /**
   * 重置某个 chatId 的初始化状态（用于测试或重置场景）
   */
  static reset(chatId?: string): void {
    if (chatId) {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const initialized = JSON.parse(data);
        delete initialized[chatId];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialized));
      }
    } else {
      // 重置所有
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}

export default IntroMessageManager;
