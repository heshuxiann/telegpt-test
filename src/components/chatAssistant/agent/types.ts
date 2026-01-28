export interface AgentExecuteParams {
  userId: string; // 用户ID (必需)
  deviceId: string; // 设备ID (必需，标识请求来源设备)
  messages: Array<{
    // 对话历史 (必需)
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  creditCode: number; // 计费代码 (必需)
  contextData: {
    // 上下文数据 (可选)
    chatId?: string; // 当前聊天ID
    selectedMessages?: Array<{
      // 用户选中的消息 (支持场景1和3)
      messageId: string; // 消息ID
      content: string; // 完整消息内容
      senderId?: string; // 发送者ID
      senderName?: string; // 发送者名称
      timestamp?: number; // 时间戳
      selectedText?: string; // 选中的文本片段 (支持场景2)
    }>;
  };
  maxIterations?: number; // 最大迭代次数 (默认: 10)
  streaming?: boolean; // 是否流式响应 (默认: true)
  options: {
    // Agent 选项配置
    showThinking?: boolean; // 是否显示思考过程 (默认: false)
    showToolCalls?: boolean; // 是否显示工具调用 (默认: true)
    detailedCitations?: boolean; // 是否返回详细的引用信息 (默认: true)
  };
}

export interface AgentExecuteResult {
  success: boolean;
  response?: ReadableStream; // 流式响应
  error?: string;
  usage?: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
  };
}