/* eslint-disable @stylistic/max-len */
/* eslint-disable no-null/no-null */

import type React from '../../../lib/teact/teact';
import {
  memo, useCallback, useEffect, useRef, useState,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../../../lib/injectComponent';
import buildStyle from '../../../util/buildStyle';
import RoomAIEntryButton from './room-ai-entry-button';

import './room-ai.module.scss';

interface StateProps {
  chatId: string;
}

const injectMessageAI = injectComponent(RoomAIEntryButton);

const RoomAIEntryWrapper = (props: StateProps) => {
  const { chatId } = props;
  const containerRef = useRef<HTMLDivElement>();
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: 0,
    y: 224, // 14rem = 224px (14 * 16)
  });
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    startX: 0,
    startY: 0,
  });
  const hasDraggedRef = useRef(false);
  const isDraggingRef = useRef(false);
  const positionRef = useRef(position);

  // 同步position到ref
  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  // 同步isDragging到ref
  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // 从localStorage加载位置
  const loadPosition = useCallback(() => {
    const savedPosition = localStorage.getItem('room-ai-position');
    if (savedPosition) {
      const pos = JSON.parse(savedPosition);
      setPosition(pos);
    } else {
      // 设置默认位置：右侧16px，底部224px
      const defaultX = -16; // max(1rem, env(safe-area-inset-right)) ≈ 16px
      setPosition({ x: defaultX, y: 224 });
    }
  }, []);

  // 保存位置到localStorage
  const savePosition = useCallback((pos: { x: number; y: number }) => {
    localStorage.setItem('room-ai-position', JSON.stringify(pos));
  }, []);

  const longPressTimerRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    hasDraggedRef.current = true;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const newPosition = {
      x: dragStartRef.current.startX + deltaX,
      y: dragStartRef.current.startY - deltaY, // 修正Y轴方向：鼠标向下移动时减少Y值
    };

    // 边界限制
    const containerWidth = 62;
    const containerHeight = 62;
    const minX = -window.innerWidth + containerWidth; // 左边界
    const maxX = 0; // 右边界
    const minY = 0; // 距离底部最小距离（贴底）
    const maxY = window.innerHeight - containerHeight; // 距离底部最大距离（贴顶）

    newPosition.x = Math.max(minX, Math.min(maxX, newPosition.x));
    newPosition.y = Math.max(minY, Math.min(maxY, newPosition.y));

    setPosition(newPosition);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    // 清除长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 只有在真正拖拽时才保存位置
    if (isDragging) {
      if (hasDraggedRef.current) {
        savePosition(positionRef.current);
      }
    }
    setIsDragging(false);

    // 延迟重置拖拽标记，防止立即触发点击事件
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 100);
  }, [isDragging, savePosition]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startX: position.x,
      startY: position.y,
    };

    // 设置长按定时器，150ms后开始拖拽
    longPressTimerRef.current = window.setTimeout(() => {
      setIsDragging(true);
    }, 150);
  }, [position]);

  const handleMouseLeave = useCallback(() => {
    // 鼠标离开时清除长按定时器
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // 如果刚刚完成拖拽，阻止点击事件
    if (hasDraggedRef.current || isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [isDragging]);

  // 添加全局鼠标事件监听
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    loadPosition();
  }, [loadPosition]);

  useEffect(() => {
    if (containerRef.current && chatId) {
      injectMessageAI(containerRef.current, { chatId });
    }
  }, [chatId]);

  return (
    <div
      className="room-ai-entry-wrapper"
      ref={containerRef}
      data-dragging={isDragging}
      style={buildStyle(`right: ${-position.x}px; bottom: ${position.y}px; cursor: ${isDragging ? 'grabbing' : 'grab'}; userSelect: none`)}
      onMouseDown={handleMouseDown}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    />
  );
};

export default memo(withGlobal(
  (global, { chatId }): StateProps => {
    return {
      chatId,
    };
  },
)(RoomAIEntryWrapper));
