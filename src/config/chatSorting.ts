// 聊天排序配置接口
export interface ChatSortingConfig {
  enableEngagementSorting: boolean; // 是否启用参与度排序
  smallGroupThreshold: number; // 小群组人数阈值

  // 权重系数
  messageWeight: number; // 消息数量权重 (w1)
  timeWeight: number; // 停留时间权重 (w2)
  clickWeight: number; // 点击次数权重 (w3)

  // 时间衰减因子
  timeDecayFactor: number;

  // 数值归一化参数
  maxNormalizedValue: number;
}

// 默认配置
export const DEFAULT_CHAT_SORTING_CONFIG: ChatSortingConfig = {
  enableEngagementSorting: true,
  smallGroupThreshold: 30,
  messageWeight: 0.6, // w1
  timeWeight: 0.3, // w2
  clickWeight: 0.1, // w3
  timeDecayFactor: 0.1,
  maxNormalizedValue: 100,
};

// 聊天排序配置管理器
export class ChatSortingConfigManager {
  private static instance: ChatSortingConfigManager;
  private config: ChatSortingConfig;
  private readonly STORAGE_KEY = 'chatSortingConfig';

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ChatSortingConfigManager {
    if (!ChatSortingConfigManager.instance) {
      ChatSortingConfigManager.instance = new ChatSortingConfigManager();
    }
    return ChatSortingConfigManager.instance;
  }

  private loadConfig(): ChatSortingConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CHAT_SORTING_CONFIG, ...parsed };
      }
    } catch (error) {
      // 静默处理加载错误
    }
    return { ...DEFAULT_CHAT_SORTING_CONFIG };
  }

  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (error) {
      // 静默处理存储错误
    }
  }

  public getConfig(): ChatSortingConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ChatSortingConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  public resetToDefaults(): void {
    this.config = { ...DEFAULT_CHAT_SORTING_CONFIG };
    this.saveConfig();
  }

  public isEngagementSortingEnabled(): boolean {
    return this.config.enableEngagementSorting;
  }

  public getSmallGroupThreshold(): number {
    return this.config.smallGroupThreshold;
  }

  public getWeights(): { messageWeight: number; timeWeight: number; clickWeight: number } {
    return {
      messageWeight: this.config.messageWeight,
      timeWeight: this.config.timeWeight,
      clickWeight: this.config.clickWeight,
    };
  }

  public getTimeDecayFactor(): number {
    return this.config.timeDecayFactor;
  }

  public getMaxNormalizedValue(): number {
    return this.config.maxNormalizedValue;
  }
}

// 导出单例实例
export const chatSortingConfigManager = ChatSortingConfigManager.getInstance();
