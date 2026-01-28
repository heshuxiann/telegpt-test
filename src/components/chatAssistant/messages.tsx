/* eslint-disable no-null/no-null */
import React, {
  memo, useEffect,
  useRef,
} from 'react';
import equal from 'fast-deep-equal';
import { motion } from 'framer-motion';

import type { ToolCallState } from './agent/useAgentChat';
import type { ChatStatus, Message } from './messages/types';

import { AgentPhase } from './agent/stream-events';
import { useMessages } from './hook/use-messages';
import { usePerformanceMonitor } from './hook/usePerformanceMonitor';
import { cn } from './utils/util';
import { PreviewMessage, ThinkingMessage } from './message';
import RoomStorage from './room-storage';
import { GLOBAL_SUMMARY_CHATID } from './variables';

import './messages.scss';

const EMPTY_TOOL_CALLS: ToolCallState[] = [];

// 获取阶段的简洁描述
const getPhaseText = (phase: AgentPhase): string => {
  switch (phase) {
    case AgentPhase.THINKING:
      return 'Thinking...';
    case AgentPhase.TOOL_CALLING:
      return 'Getting data...';
    case AgentPhase.GENERATING:
      return 'Generating response...';
    case AgentPhase.COMPLETED:
      return 'Completed';
    case AgentPhase.ERROR:
      return 'Error occurred';
    default:
      return 'Processing...';
  }
};

// 获取工具调用的简洁描述
const getToolCallText = (tool: ToolCallState): string => {
  const statusIcon = tool.status === 'success' ? '✓' : tool.status === 'failed' ? '✗' : '⋯';
  return `${statusIcon} ${tool.toolDescription}`;
};

interface MessagesProps {
  chatId: string;
  className?: string;
  isLoading?: boolean;
  status: ChatStatus;
  messages: Array<Message>;
  hasMore?: boolean;
  currentPhase?: AgentPhase | null;
  toolCalls?: ToolCallState[];
  deleteMessage?: (messageId: string) => void;
  loadMore: () => Promise<void>;
}
function PureMessages({
  chatId,
  className,
  isLoading,
  status,
  messages,
  hasMore,
  currentPhase,
  toolCalls = EMPTY_TOOL_CALLS,
  deleteMessage,
  loadMore,
}: MessagesProps) {
  // 性能监控
  usePerformanceMonitor('ChatAssistant/Messages', { logThreshold: 30 });

  const upLoadRef = useRef(false);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    onViewportEnter,
    onViewportLeave,
  } = useMessages({
    chatId,
    status,
  });

  // 将副作用移到 useEffect 中
  useEffect(() => {
    if (isAtBottom) {
      RoomStorage.updateRoomAIData(GLOBAL_SUMMARY_CHATID, 'unreadCount', 0);
    }
  }, [isAtBottom]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container || upLoadRef.current) return;

    const { scrollTop } = container;

    if (scrollTop === 0 && hasMore) {
      upLoadRef.current = true;
      const anchor = container.firstChild?.firstChild as HTMLDivElement || null;
      anchorRef.current = anchor;
      loadMore().finally(() => {
        upLoadRef.current = false;
        if (anchorRef.current) {
          anchorRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
        // scrollBuffer.current = calculateBuffer();
      });
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className={cn('ai-message-container custom-scroll flex flex-col min-w-0 gap-[10px] h-full overflow-y-auto relative pt-4 overflow-x-hidden select-text', className)}
    >
      {(messages || []).map((message, index) => {
        return (
          <PreviewMessage
            message={message}
            deleteMessage={deleteMessage}
            key={message.id}
            isLoading={status === 'streaming' && messages.length - 1 === index}
          />
        );
      })}

      {/* 思考过程和工具调用占位符 - 在 streaming 时显示，当有实际回复内容时隐藏 */}
      {status === 'streaming' && (Boolean(currentPhase) || toolCalls.length > 0) ? (
        (() => {
          const lastMessage = messages[messages.length - 1];
          const hasReplyContent = lastMessage?.role === 'assistant' && lastMessage?.content;

          // 只在没有实际回复内容时显示思考过程和工具调用
          if (!hasReplyContent) {
            return (
              <div className="px-3 py-2 text-sm text-[var(--color-text-secondary)] flex flex-col gap-1">
                {/* 当前阶段指示器 - 行内文本形式 */}
                {Boolean(currentPhase) && (
                  <div className="flex items-center gap-2 animate-pulse">
                    <span className="inline-block w-1 h-1 rounded-full animate-ping" />
                    <span className="opacity-70">{getPhaseText(currentPhase)}</span>
                  </div>
                )}

                {/* 工具调用 - 简洁文本列表 */}
                {toolCalls.length > 0 && (
                  <div className="flex flex-col gap-1 ml-3">
                    {toolCalls.map((tool, index) => (
                      <div
                        key={`${tool.toolName}_${index}`}
                        className={cn(
                          'flex items-center gap-2 text-xs',
                          tool.status === 'pending' && 'animate-pulse',
                          tool.status === 'success' && 'opacity-70',
                          tool.status === 'failed' && 'text-[var(--color-error)]',
                        )}
                      >
                        <span>{getToolCallText(tool)}</span>
                        {tool.summary && (
                          <span className="opacity-50 truncate">
                            •
                            {tool.summary}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()
      ) : null}

      {/* 提交状态的思考提示 */}
      {
        (
          (status === 'submitted'
            && messages.length > 0
            && messages[messages.length - 1].role === 'user') || isLoading
        ) && <ThinkingMessage />
      }
      <motion.div
        ref={messagesEndRef}
        className="shrink-0 min-w-[24px] min-h-[24px]"
        onViewportLeave={onViewportLeave}
        onViewportEnter={onViewportEnter}
      />
    </div>

  );
}
export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (prevProps.currentPhase !== nextProps.currentPhase) return false;
  if (prevProps.toolCalls?.length !== nextProps.toolCalls?.length) return false;
  if (prevProps.status && nextProps.status) return false;
  if (prevProps.messages.length !== nextProps.messages.length) return false;
  if (!equal(prevProps.messages, nextProps.messages)) return false;
  if (!equal(prevProps.toolCalls, nextProps.toolCalls)) return false;

  return true;
});
