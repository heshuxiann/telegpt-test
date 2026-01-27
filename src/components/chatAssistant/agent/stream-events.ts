/**
 * Agent 流式响应事件定义
 *
 * 所有事件都遵循统一格式: { type, phase, data }
 */

// ==================== 阶段定义 ====================

export enum AgentPhase {
  THINKING = 'thinking', // 思考阶段：分析问题，决定工具调用
  TOOL_CALLING = 'tool_calling', // 工具调用阶段：执行工具获取数据
  GENERATING = 'generating', // 生成阶段：生成回答内容
  COMPLETED = 'completed', // 完成阶段：所有处理完成
  ERROR = 'error', // 错误阶段：发生错误
}

// ==================== 事件类型定义 ====================

export enum EventType {
  PHASE_CHANGE = 'phase_change', // 阶段变更
  THINKING = 'thinking', // 思考过程（可选）
  TOOL_START = 'tool_start', // 工具调用开始
  TOOL_END = 'tool_end', // 工具调用结束
  TEXT = 'text', // 文本内容
  CITATION = 'citation', // 引用信息
  STRUCTURED = 'structured', // 结构化数据
  DONE = 'done', // 完成
  ERROR = 'error', // 错误
}

// ==================== 事件数据类型 ====================

export interface BaseEvent {
  type: EventType;
  phase: AgentPhase;
  data: any;
}

export interface PhaseChangeEvent extends BaseEvent {
  type: EventType.PHASE_CHANGE;
  data: {
    message: string;
  };
}

export interface ThinkingEvent extends BaseEvent {
  type: EventType.THINKING;
  phase: AgentPhase.THINKING;
  data: {
    content: string;
  };
}

export interface ToolStartEvent extends BaseEvent {
  type: EventType.TOOL_START;
  phase: AgentPhase.TOOL_CALLING;
  data: {
    toolName: string;
    toolDescription: string;
    params?: Record<string, any>;
  };
}

export interface ToolEndEvent extends BaseEvent {
  type: EventType.TOOL_END;
  phase: AgentPhase.TOOL_CALLING;
  data: {
    toolName: string;
    success: boolean;
    summary: string;
    error?: string;
  };
}

export interface TextEvent extends BaseEvent {
  type: EventType.TEXT;
  phase: AgentPhase.GENERATING;
  data: {
    content: string;
  };
}

export interface CitationEvent extends BaseEvent {
  type: EventType.CITATION;
  phase: AgentPhase.GENERATING;
  data: {
    index: number; // 第几个 citation（从 0 开始）
    messageId: string;
    content: string; // 被引用的文本内容
    senderName: string;
    senderId?: string;
    timestamp: number;
    chatId: string;
  };
}

export interface StructuredEvent extends BaseEvent {
  type: EventType.STRUCTURED;
  phase: AgentPhase.GENERATING;
  data: {
    dataType: string;
    [key: string]: any;
  };
}

export interface DoneEvent extends BaseEvent {
  type: EventType.DONE;
  phase: AgentPhase.COMPLETED;
  data: {
    finishReason: string;
    stats?: {
      totalCitations?: number;
      tokensUsed?: number;
      [key: string]: any;
    };
  };
}

export interface ErrorEvent extends BaseEvent {
  type: EventType.ERROR;
  phase: AgentPhase.ERROR;
  data: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

// ==================== 配置选项 ====================

export interface AgentStreamOptions {
  showThinking?: boolean; // 是否显示思考过程（默认false）
  showToolCalls?: boolean; // 是否显示工具调用（默认true）
  detailedCitations?: boolean; // 是否返回详细的引用信息（默认true）
}

// ==================== 辅助函数 ====================

/**
 * 创建事件对象
 */
export function createEvent(
  type: EventType,
  phase: AgentPhase,
  data: any,
): BaseEvent {
  return { type, phase, data };
}

/**
 * 序列化事件为 JSON 字符串（一行）
 */
export function serializeEvent(event: BaseEvent): string {
  return JSON.stringify(event) + '\n';
}

/**
 * 阶段变更事件辅助函数
 */
export function createPhaseChangeEvent(
  phase: AgentPhase,
  message: string,
): PhaseChangeEvent {
  return {
    type: EventType.PHASE_CHANGE,
    phase,
    data: { message },
  };
}

/**
 * 工具调用开始事件
 */
export function createToolStartEvent(
  toolName: string,
  toolDescription: string,
  params?: Record<string, any>,
): ToolStartEvent {
  return {
    type: EventType.TOOL_START,
    phase: AgentPhase.TOOL_CALLING,
    data: { toolName, toolDescription, params },
  };
}

/**
 * 工具调用结束事件
 */
export function createToolEndEvent(
  toolName: string,
  success: boolean,
  summary: string,
  error?: string,
): ToolEndEvent {
  return {
    type: EventType.TOOL_END,
    phase: AgentPhase.TOOL_CALLING,
    data: { toolName, success, summary, error },
  };
}

/**
 * 文本内容事件
 */
export function createTextEvent(content: string): TextEvent {
  return {
    type: EventType.TEXT,
    phase: AgentPhase.GENERATING,
    data: { content },
  };
}

/**
 * 引用信息事件
 */
export function createCitationEvent(
  index: number,
  messageId: string,
  content: string,
  senderName: string,
  timestamp: number,
  chatId: string,
  senderId?: string,
): CitationEvent {
  return {
    type: EventType.CITATION,
    phase: AgentPhase.GENERATING,
    data: {
      index,
      messageId,
      content,
      senderName,
      senderId,
      timestamp,
      chatId,
    },
  };
}

/**
 * 完成事件
 */
export function createDoneEvent(
  finishReason: string,
  stats?: Record<string, any>,
): DoneEvent {
  return {
    type: EventType.DONE,
    phase: AgentPhase.COMPLETED,
    data: { finishReason, stats },
  };
}

/**
 * 错误事件
 */
export function createErrorEvent(
  code: string,
  message: string,
  recoverable: boolean = false,
): ErrorEvent {
  return {
    type: EventType.ERROR,
    phase: AgentPhase.ERROR,
    data: { code, message, recoverable },
  };
}
