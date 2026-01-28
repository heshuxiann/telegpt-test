/* eslint-disable no-null/no-null */
/**
 * useAgentChat Hook
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Message } from '../messages/types';
import type {
  CitationEvent,
  DoneEvent,
  ErrorEvent,
  ToolEndEvent,
  ToolStartEvent,
} from './stream-events';
import type { AgentExecuteParams } from './types';
import { AIMessageType } from '../messages/types';

import { SERVER_API_URL } from '../../../config';
import { getCurrentUserInfo } from '../utils/chat-api';
import { getApihHeaders } from '../utils/telegpt-fetch';
import { AgentPhase } from './stream-events';
import { AgentStreamParser } from './stream-parser';
import { getDeviceId } from './utils';

export type ChatStatus = 'ready' | 'streaming' | 'error';

export interface UseAgentChatOptions {
  chatId?: string;
  selectedMessages?: AgentExecuteParams['contextData']['selectedMessages'];
  maxIterations?: number;
  onError?: (error: Error) => void;
  onFinish?: (result: {
    fullText: string;
    citations: CitationEvent['data'][];
  }) => void;
  showThinking?: boolean;
  showToolCalls?: boolean;
  detailedCitations?: boolean;
}

interface ChatParams {
  userId: string;
  deviceId: string;
  messages: AgentExecuteParams['messages'];
  chatId: string;
  selectedMessages: AgentExecuteParams['contextData']['selectedMessages'];
  maxIterations: number;
  streaming: boolean;
  options: AgentExecuteParams['options'];
}

export interface UseAgentChatReturn {
  messages: Message[];
  status: ChatStatus;
  currentPhase: AgentPhase | null;
  isStreaming: boolean;
  toolCalls: ToolCallState[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  append: (message: Message) => Promise<void>;
  stop: () => void;
  reload: () => Promise<void>;
}

export interface ToolCallState {
  toolName: string;
  toolDescription: string;
  params?: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  summary?: string;
  error?: string;
}

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const {
    chatId,
    selectedMessages,
    maxIterations = 10,
    onError,
    onFinish,
    showThinking = false,
    showToolCalls = true,
    detailedCitations = true,
  } = options;

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [currentPhase, setCurrentPhase] = useState<AgentPhase | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallState[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const parserRef = useRef<AgentStreamParser | null>(null);
  const currentAssistantMessageRef = useRef<string>('');
  const citationsRef = useRef<CitationEvent['data'][]>([]);
  const messagesRef = useRef<Message[]>(messages);

  // 同步 messagesRef 和 messages 状态
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const isStreaming = status === 'streaming';

  /**
   * 停止当前流式请求
   */
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('ready');
    setCurrentPhase(null);
  }, []);

  /**
   * 发送消息到 Agent API
   */
  const sendMessage = useCallback(
    async (messagesToSend: Message[]) => {
      if (!chatId) {
        const error = new Error('chatId is required');
        onError?.(error);
        return;
      }

      // 重置状态
      currentAssistantMessageRef.current = '';
      citationsRef.current = [];
      setToolCalls([]);
      setStatus('streaming');

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      const { userId } = getCurrentUserInfo();

      // 获取 deviceId（从 localStorage 或生成新的）
      const deviceId = getDeviceId();

      try {
        // 创建流式解析器
        const parser = new AgentStreamParser({
          onPhaseChange: (phase) => {
            setCurrentPhase(phase);
          },

          onPhaseMessage: (message) => {
            // eslint-disable-next-line no-console
            console.log('[Agent] Phase:', message);
          },

          onThinking: (content) => {
            if (showThinking) {
              // eslint-disable-next-line no-console
              console.log('[Agent] Thinking:', content);
            }
          },

          onToolStart: (tool: ToolStartEvent['data']) => {
            if (showToolCalls) {
              setToolCalls((prev) => [
                ...prev,
                {
                  toolName: tool.toolName,
                  toolDescription: tool.toolDescription,
                  params: tool.params,
                  status: 'pending',
                },
              ]);
            }
            // TODO: 引入封装的相关工具
          },

          onToolEnd: (tool: ToolEndEvent['data']) => {
            if (showToolCalls) {
              setToolCalls((prev) => {
                const index = prev.findIndex(
                  (t) => t.toolName === tool.toolName && t.status === 'pending',
                );
                if (index === -1) return prev;

                const newToolCalls = [...prev];
                newToolCalls[index] = {
                  ...newToolCalls[index],
                  status: tool.success ? 'success' : 'failed',
                  summary: tool.summary,
                  error: tool.error,
                };
                return newToolCalls;
              });
            }
          },

          onText: (chunk, fullText) => {
            currentAssistantMessageRef.current = fullText;

            // 更新消息列表中的最后一条助手消息
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    content: fullText,
                  },
                ];
              }
              // 如果没有助手消息，创建新的
              return [
                ...prev,
                {
                  id: `assistant_${Date.now()}`,
                  role: 'assistant',
                  content: fullText,
                  createdAt: new Date(),
                  type: AIMessageType.Default,
                  timestamp: Date.now(),
                },
              ];
            });
          },

          onCitation: (citation: CitationEvent['data']) => {
            if (detailedCitations) {
              citationsRef.current.push(citation);
              // eslint-disable-next-line no-console
              console.log('[Agent] Citation:', citation);
              // TODO: 在 UI 中显示引用
            }
          },

          onStructured: (data) => {
            // eslint-disable-next-line no-console
            console.log('[Agent] Structured data:', data);
          },

          onDone: (doneData: DoneEvent['data'], result) => {
            setStatus('ready');
            setCurrentPhase(AgentPhase.COMPLETED);
            onFinish?.(result);
          },

          onError: (error: ErrorEvent['data']) => {
            setStatus('error');
            setCurrentPhase(AgentPhase.ERROR);
            onError?.(new Error(error.message));
          },
        });

        parserRef.current = parser;

        // 过滤掉 teleai-system 消息，并限制最多 20 条
        const filteredMessages = messagesToSend
          .filter((msg) => msg.role !== 'teleai-system')
          .slice(-20); // 取最后 20 条

        // 构建请求体 - 符合 AgentExecuteParams 类型
        const requestBody: ChatParams = {
          userId: userId!,
          deviceId,
          messages: filteredMessages.map((msg) => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
          })),
          chatId,
          selectedMessages,
          maxIterations,
          streaming: true,
          options: {
            showThinking,
            showToolCalls,
            detailedCitations,
          },
        };

        // 发送请求
        const response = await fetch(`${SERVER_API_URL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': userId!,
            'device-id': deviceId,
            ...getApihHeaders(),
          },
          body: JSON.stringify(requestBody),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is empty');
        }

        // 读取流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          parser.handleChunk(chunk);
        }

        // 处理剩余缓冲区
        parser.flush();
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // eslint-disable-next-line no-console
          console.log('[Agent] Request aborted');
          setStatus('ready');
        } else {
          // eslint-disable-next-line no-console
          console.error('[Agent] Error:', error);
          setStatus('error');
          onError?.(error);
        }
      } finally {
        abortControllerRef.current = null;
        parserRef.current = null;
      }
    },
    [
      chatId,
      selectedMessages,
      maxIterations,
      showThinking,
      showToolCalls,
      detailedCitations,
      onError,
      onFinish,
    ],
  );

  /**
   * 添加新消息并发送
   */
  const append = useCallback(
    async (message: Message) => {
      // 使用 ref 获取最新的 messages，避免闭包陷阱
      const newMessages = [...messagesRef.current, message];
      setMessages(newMessages);
      await sendMessage(newMessages);
    },
    [sendMessage],
  );

  /**
   * 重新发送最后一条用户消息
   */
  const reload = useCallback(async () => {
    // 使用 ref 获取最新的 messages
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    // 找到最后一条用户消息
    let lastUserMessageIndex = -1;
    for (let i = currentMessages.length - 1; i >= 0; i--) {
      if (currentMessages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    // 重新发送从开始到最后一条用户消息的所有消息
    const messagesToSend = currentMessages.slice(0, lastUserMessageIndex + 1);
    setMessages(messagesToSend);
    await sendMessage(messagesToSend);
  }, [sendMessage]);

  // 清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    status,
    currentPhase,
    isStreaming,
    toolCalls,
    setMessages,
    append,
    stop,
    reload,
  };
}
