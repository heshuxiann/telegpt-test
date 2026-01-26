/**
 * Agent 流式响应解析器
 * 处理服务端返回的事件流，按照 AGENT_STREAM_FORMAT.md 规范解析事件
 */

import type {
  BaseEvent,
  PhaseChangeEvent,
  ThinkingEvent,
  ToolStartEvent,
  ToolEndEvent,
  TextEvent,
  CitationEvent,
  StructuredEvent,
  DoneEvent,
  ErrorEvent,
} from './stream-events';
import { EventType, AgentPhase } from './stream-events';

export type EventCallback = (event: BaseEvent) => void;
export type PhaseChangeCallback = (phase: AgentPhase) => void;
export type TextCallback = (chunk: string, fullText: string) => void;
export type CitationCallback = (citation: CitationEvent['data']) => void;
export type ToolStartCallback = (tool: ToolStartEvent['data']) => void;
export type ToolEndCallback = (tool: ToolEndEvent['data']) => void;
export type DoneCallback = (data: DoneEvent['data'], result: { fullText: string; citations: CitationEvent['data'][] }) => void;
export type ErrorCallback = (error: ErrorEvent['data']) => void;

interface StreamParserCallbacks {
  onPhaseChange?: PhaseChangeCallback;
  onPhaseMessage?: (message: string) => void;
  onThinking?: (content: string) => void;
  onToolStart?: ToolStartCallback;
  onToolEnd?: ToolEndCallback;
  onText?: TextCallback;
  onCitation?: CitationCallback;
  onStructured?: (data: StructuredEvent['data']) => void;
  onDone?: DoneCallback;
  onError?: ErrorCallback;
  onEvent?: EventCallback; // 通用事件回调
}

export class AgentStreamParser {
  private currentPhase: AgentPhase | null = null;
  private fullText = '';
  private citations: CitationEvent['data'][] = [];
  private callbacks: StreamParserCallbacks = {};
  private buffer = ''; // 用于处理不完整的行

  constructor(callbacks?: StreamParserCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }
  }

  /**
   * 注册事件回调
   */
  public on<K extends keyof StreamParserCallbacks>(
    eventName: K,
    callback: StreamParserCallbacks[K]
  ) {
    this.callbacks[eventName] = callback;
  }

  /**
   * 处理流式数据块
   */
  public handleChunk(chunk: string) {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');

    // 保留最后一行（可能不完整）
    this.buffer = lines.pop() || '';

    // 处理完整的行
    lines.forEach((line) => this.handleLine(line));
  }

  /**
   * 处理单行事件
   */
  public handleLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const event: BaseEvent = JSON.parse(trimmed);

      // 更新当前阶段
      if (event.phase !== this.currentPhase) {
        this.currentPhase = event.phase;
        this.callbacks.onPhaseChange?.(event.phase);
      }

      // 触发通用事件回调
      this.callbacks.onEvent?.(event);

      // 根据事件类型分发
      this.dispatchEvent(event);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[AgentStreamParser] Failed to parse event:', line, error);
    }
  }

  /**
   * 分发事件到具体的处理器
   */
  private dispatchEvent(event: BaseEvent) {
    switch (event.type) {
      case EventType.PHASE_CHANGE:
        this.handlePhaseChange(event as PhaseChangeEvent);
        break;

      case EventType.THINKING:
        this.handleThinking(event as ThinkingEvent);
        break;

      case EventType.TOOL_START:
        this.handleToolStart(event as ToolStartEvent);
        break;

      case EventType.TOOL_END:
        this.handleToolEnd(event as ToolEndEvent);
        break;

      case EventType.TEXT:
        this.handleText(event as TextEvent);
        break;

      case EventType.CITATION:
        this.handleCitation(event as CitationEvent);
        break;

      case EventType.STRUCTURED:
        this.handleStructured(event as StructuredEvent);
        break;

      case EventType.DONE:
        this.handleDone(event as DoneEvent);
        break;

      case EventType.ERROR:
        this.handleError(event as ErrorEvent);
        break;

      default:
        // eslint-disable-next-line no-console
        console.warn('[AgentStreamParser] Unknown event type:', event.type);
    }
  }

  private handlePhaseChange(event: PhaseChangeEvent) {
    this.callbacks.onPhaseMessage?.(event.data.message);
  }

  private handleThinking(event: ThinkingEvent) {
    this.callbacks.onThinking?.(event.data.content);
  }

  private handleToolStart(event: ToolStartEvent) {
    this.callbacks.onToolStart?.(event.data);
  }

  private handleToolEnd(event: ToolEndEvent) {
    this.callbacks.onToolEnd?.(event.data);
  }

  private handleText(event: TextEvent) {
    this.fullText += event.data.content;
    this.callbacks.onText?.(event.data.content, this.fullText);
  }

  private handleCitation(event: CitationEvent) {
    this.citations.push(event.data);
    this.callbacks.onCitation?.(event.data);
  }

  private handleStructured(event: StructuredEvent) {
    this.callbacks.onStructured?.(event.data);
  }

  private handleDone(event: DoneEvent) {
    this.callbacks.onDone?.(event.data, {
      fullText: this.fullText,
      citations: this.citations,
    });
  }

  private handleError(event: ErrorEvent) {
    this.callbacks.onError?.(event.data);
  }

  /**
   * 处理剩余缓冲区（流结束时调用）
   */
  public flush() {
    if (this.buffer.trim()) {
      this.handleLine(this.buffer);
      this.buffer = '';
    }
  }

  /**
   * 重置解析器状态
   */
  public reset() {
    this.currentPhase = null;
    this.fullText = '';
    this.citations = [];
    this.buffer = '';
  }

  /**
   * 获取当前解析结果
   */
  public getResult() {
    return {
      fullText: this.fullText,
      citations: this.citations,
      phase: this.currentPhase,
    };
  }
}
