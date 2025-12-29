/* eslint-disable no-console */
import type { ChangeEvent } from 'react';
import React, { memo, useEffect, useRef, useState } from '@teact';
import { getActions, withGlobal } from '../../../global';

import type { ApiUser } from '../../../api/types';
import type { Signal } from '../../../util/signals';
import type { RoomInputTranslateOptions } from '../../chatAssistant/utils/room-input-translate';

import { getUserFullName } from '../../../global/helpers';
import { selectUser } from '../../../global/selectors';
import buildStyle from '../../../util/buildStyle';
import focusEditableElement from '../../../util/focusEditableElement';
import parseHtmlAsFormattedText from '../../../util/parseHtmlAsFormattedText';
import { callApi } from '../../../api/gramjs';
import { useEventListenerTeact } from '../../chatAssistant/hook/useEventBusTeact';
import { cn } from '../../chatAssistant/utils/util';

import useLastCallback from '../../../hooks/useLastCallback';

import Icon from '../../common/icons/Icon';
import Button from '../../ui/Button';

import './ComposerTranslatededMessage.scss';
interface OwnProps {
  chatId: string;
  getHtml: Signal<string>;
  onUpdate: (html: string) => void;
  onSend: () => void;
}

interface StateProps {
  currentUserId: string | undefined;
  currentUser: ApiUser;
  inputTranslateOptions: RoomInputTranslateOptions;
}
const ComposerTranslatededMessage = ({ chatId, currentUserId, currentUser, getHtml, inputTranslateOptions, onUpdate, onSend }: OwnProps & StateProps) => {
  const [inputValue, setInputValue] = useState<string>('');
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastHtmlRef = useRef<string>('');
  const [isTranslate, setIsTranslate] = useState(false);
  const inputRef = useRef<HTMLDivElement>();
  const { showNotification } = getActions();
  useEffect(() => {
    const html = getHtml();

    // 内容没变，不处理
    if (html === lastHtmlRef.current) return;

    lastHtmlRef.current = html;

    // 清除上一次定时器（防抖）
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      try {
        const { text } = parseHtmlAsFormattedText(html);
        if (!text?.trim()) return;

        setIsTranslate(true);

        callApi('translateTextByTencent', {
          text: [{ text }],
          toLanguageCode: inputTranslateOptions.translateLanguage,
          userId: currentUserId!,
          userName: getUserFullName(currentUser)!,
        }).then((result: any) => {
          if (result && result[0].text) {
            setInputValue(result[0].text);
            inputRef.current!.innerHTML = result[0].text;
          }
        }).finally(() => {
          setIsTranslate(false);
        });
      } catch (e) {
        console.error('translate error', e);
      }
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [chatId, currentUser, currentUserId, getHtml, inputTranslateOptions.translateLanguage]);

  const focusInput = () => {
    if (!inputRef.current) {
      return;
    }
    focusEditableElement(inputRef.current);
  };
  const handleChange = (e: ChangeEvent<HTMLDivElement>) => {
    const { innerHTML } = e.currentTarget;
    setInputValue(innerHTML);
  };

  const handleSend = useLastCallback(() => {
    if (isTranslate || !inputValue) {
      showNotification({
        message: 'Please wait for the translation to finish.',
      });
      return;
    }
    onUpdate(inputValue);
    onSend();
  });

  useEventListenerTeact('actions:sendMessage', handleSend);

  return (
    <div className="ComposerTranslatededMessage px-[0.75rem] py-[10px] flex gap-[10px]">
      <div className="px-[14px] py-[12px] bg-[var(--color-peer-bg-2)] rounded-[14px] flex-1 w-full overflow-hidden">
        <div className="text-[12px] text-[var(--color-text-secondary)] flex items-center gap-[4px]">
          <span>Translated to</span>
          <span>{inputTranslateOptions.translateLanguageName}</span>
        </div>
        <div className="relative w-fit min-w-[32px] max-w-full">
          <div className={cn('absolute w-full h-full z-[-1]', { 'text-loading': isTranslate })}></div>
          {/* <div className="text-[14px] text-[var(--color-text)] break-words">{translateResult}</div> */}
          <div
            ref={inputRef}
            className="message-input text-[14px] text-[var(--color-text)] break-word whitespace-pre-wrap"
            contentEditable
            role="textbox"
            dir="auto"
            tabIndex={0}
            onClick={focusInput}
            onChange={handleChange}
          />
        </div>
      </div>
      <Button
        round
        color="secondary"
        className="!bg-[#E9F2FF] mt-auto"
        onClick={handleSend}
      >
        <Icon name="send" style={buildStyle('color:var(--color-primary)')} />
      </Button>
    </div>
  );
};

export default memo(withGlobal<OwnProps>((global, { chatId }): StateProps => {
  const { currentUserId } = global;
  const currentUser = selectUser(global, currentUserId!)!;
  const inputTranslateOptions = global.roomInputTranslateOptions[chatId];
  return {
    currentUserId,
    currentUser,
    inputTranslateOptions,
  };
})(ComposerTranslatededMessage));
