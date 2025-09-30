import { getGlobal } from '../global';

import type { ApiChat } from '../api/types';

import { selectChat, selectChatLastMessage } from '../global/selectors';
import RoomStorage from '../components/chatAssistant/room-storage';

// 配置选项
export interface ChatSortingConfig {
  enableEngagementSorting?: boolean; // 是否启用参与度排序，默认true
  groupSizeThreshold: number; // 群规模阈值，默认30
  weights: {
    messageCount: number; // 消息数权重，默认0.6
    stayDuration: number; // 停留时长权重，默认0.3
    clickCount: number; // 点击次数权重，默认0.1
  };
}

const DEFAULT_CONFIG: ChatSortingConfig = {
  enableEngagementSorting: true,
  groupSizeThreshold: 30,
  weights: {
    messageCount: 0.6,
    stayDuration: 0.3,
    clickCount: 0.1,
  },
};

// 数据标准化函数
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

// 计算用户参与度权重
export function calculateEngagementWeight(
  chatId: string,
  allEngagementData: Record<string, any>,
  config: ChatSortingConfig = DEFAULT_CONFIG,
): number {
  const chatData = allEngagementData[chatId];
  if (!chatData) return 0;

  // 获取所有聊天的数据用于标准化
  const allValues = Object.values(allEngagementData);
  if (allValues.length === 0) return 0;

  // 计算各项指标的最大最小值
  const messageCountValues = allValues.map((data: any) => data.messageCount || 0);
  const stayDurationValues = allValues.map((data: any) => data.stayDuration || 0);
  const clickCountValues = allValues.map((data: any) => data.clickCount || 0);

  const messageCountMin = Math.min(...messageCountValues);
  const messageCountMax = Math.max(...messageCountValues);
  const stayDurationMin = Math.min(...stayDurationValues);
  const stayDurationMax = Math.max(...stayDurationValues);
  const clickCountMin = Math.min(...clickCountValues);
  const clickCountMax = Math.max(...clickCountValues);

  // 标准化各项指标
  const normalizedMessageCount = normalizeValue(
    chatData.messageCount || 0,
    messageCountMin,
    messageCountMax,
  );
  const normalizedStayDuration = normalizeValue(
    chatData.stayDuration || 0,
    stayDurationMin,
    stayDurationMax,
  );
  const normalizedClickCount = normalizeValue(
    chatData.clickCount || 0,
    clickCountMin,
    clickCountMax,
  );

  // 计算加权总分
  return (
    config.weights.messageCount * normalizedMessageCount
    + config.weights.stayDuration * normalizedStayDuration
    + config.weights.clickCount * normalizedClickCount
  );
}

// 判断是否为私聊
function isPrivateChat(chat: ApiChat): boolean {
  return chat.type === 'chatTypePrivate';
}

// 判断是否为小群（成员数 < 阈值）
function isSmallGroup(chat: ApiChat, threshold: number): boolean {
  if (chat.type !== 'chatTypeBasicGroup' && chat.type !== 'chatTypeSuperGroup') {
    return false;
  }
  return (chat.membersCount || 0) < threshold;
}

// 获取聊天的最后未读消息时间
function getLastUnreadMessageTime(chatId: string): number {
  const global = getGlobal();
  const lastMessage = selectChatLastMessage(global, chatId);
  return lastMessage?.date || 0;
}

// 获取聊天的最后活跃时间
function getLastActiveTime(chatId: string, allEngagementData: Record<string, any>): number {
  const engagementData = allEngagementData[chatId];
  if (engagementData?.lastActiveTime) {
    return engagementData.lastActiveTime;
  }

  // 如果没有参与度数据，使用最后消息时间作为兜底
  return getLastUnreadMessageTime(chatId);
}

// 聊天分类枚举
enum ChatCategory {
  UnreadPrivate = 1, // 有未读私聊
  UnreadSmallGroup = 2, // 有未读小群
  Others = 3, // 其他会话
}

// 获取聊天分类
function getChatCategory(
  chat: ApiChat,
  config: ChatSortingConfig = DEFAULT_CONFIG,
): ChatCategory {
  const hasUnread = chat.unreadCount && chat.unreadCount > 0;

  if (hasUnread && isPrivateChat(chat)) {
    return ChatCategory.UnreadPrivate;
  }

  if (hasUnread && isSmallGroup(chat, config.groupSizeThreshold)) {
    return ChatCategory.UnreadSmallGroup;
  }

  return ChatCategory.Others;
}

// 主要排序函数
export function sortChatsByEngagement(
  chatIds: string[],
  global = getGlobal(),
): string[] {
  const config = DEFAULT_CONFIG;

  if (!config.enableEngagementSorting) {
    // 如果未启用参与度排序，返回原始顺序
    return chatIds;
  }

  const allEngagementData = RoomStorage.getAllEngagementData();

  // 分类聊天
  const categorizedChats = chatIds.map((chatId) => {
    const chat = selectChat(global, chatId);
    if (!chat) return undefined;

    const category = getChatCategory(chat, DEFAULT_CONFIG);
    const engagementWeight = calculateEngagementWeight(chatId, allEngagementData, DEFAULT_CONFIG);
    const lastActiveTime = getLastActiveTime(chatId, allEngagementData);

    return {
      chatId,
      chat,
      category,
      engagementWeight,
      lastActiveTime,
    };
  }).filter(Boolean);

  // 按类别和权重排序
  categorizedChats.sort((a, b) => {
    // 首先按类别排序
    if (a.category !== b.category) {
      return a.category - b.category;
    }

    // 同类别内按参与度权重排序
    if (Math.abs(a.engagementWeight - b.engagementWeight) > 0.001) {
      return b.engagementWeight - a.engagementWeight;
    }

    // 权重相同时按最后活跃时间排序
    return b.lastActiveTime - a.lastActiveTime;
  });

  return categorizedChats.map((item) => item.chatId);
}

// 导出配置和工具函数
export { DEFAULT_CONFIG, ChatCategory };
