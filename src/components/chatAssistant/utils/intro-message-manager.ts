import type { Message } from '../messages/types';

import { createGlobalIntroduceMessage } from '../global-summary/summary-utils';
import { createRoomDescriptionMessage } from '../room-ai/room-ai-utils';
import { GLOBAL_SUMMARY_CHATID } from '../variables';

/**
 * 初始化消息管理器
 * 统一管理各个 chat 的初始介绍消息
 * 使用固定 ID，通过数据库查询判断是否已存在
 */
class IntroMessageManager {
  /**
   * 获取某个 chatId 的初始介绍消息
   * 总是返回新创建的介绍消息，调用方负责检查数据库中是否已存在
   */
  static getIntroMessage(chatId: string): Message {
    // 创建对应的介绍消息
    const introMessage = chatId === GLOBAL_SUMMARY_CHATID
      ? createGlobalIntroduceMessage()
      : createRoomDescriptionMessage(chatId);

    return introMessage;
  }
}

export default IntroMessageManager;
