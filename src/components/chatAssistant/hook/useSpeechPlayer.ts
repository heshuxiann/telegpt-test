/* eslint-disable no-null/no-null */
import { useEffect, useRef, useState } from 'react';

let activeId: string | null = null;

type UseSpeechPlayerResult = {
  isSpeaking: boolean;
  speak: (text: string, options?: Partial<SpeechSynthesisUtterance>) => void;
  stop: () => void;
};

const listeners: Record<string, (playing: boolean) => void> = {};

export function useSpeechPlayer(id: string): UseSpeechPlayerResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const localUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 注册播放状态监听
  useEffect(() => {
    listeners[id] = (playing) => setIsSpeaking(playing);
    return () => {
      delete listeners[id];
    };
  }, [id]);

  const speak = (text: string, options: Partial<SpeechSynthesisUtterance> = {}) => {
    // 先取消全局语音
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    Object.assign(utterance, options);
    activeId = id;
    localUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (activeId === id) {
        listeners[id]?.(false);
        activeId = null;
      }
    };

    utterance.onerror = () => {
      if (activeId === id) {
        listeners[id]?.(false);
        activeId = null;
      }
    };

    // 设置本组件为 speaking，其它都设为 false
    Object.entries(listeners).forEach(([key, fn]) => fn(key === id));
    speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (activeId === id && (speechSynthesis.speaking || speechSynthesis.pending)) {
      speechSynthesis.cancel();
      listeners[id]?.(false);
      activeId = null;
    }
  };

  return { isSpeaking, speak, stop };
}
