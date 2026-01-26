/* eslint-disable no-null/no-null */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable no-console */

import React, { useState } from 'react';
import {
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type {
  Message,
} from 'ai';
import cx from 'classnames';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';

import { sanitizeUIMessages } from '../../../lib/utils';
import type { ChatStatus } from '../agent/useAgentChat';
import { AITextarea } from '../component/AITextarea';
import { Button } from '../component/button';
import { StopIcon } from '../icons';

function PureMultimodalInput({
  status,
  stop,
  setMessages,
  handleInputSubmit,
  className,
}: {
  status: ChatStatus;
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
  handleInputSubmit: (inputValue:string)=>void;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();

  useEffect(() => {
    if (textareaRef.current) {
      adjustHeight();
    }
  }, []);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(200, Math.max(90, textareaRef.current.scrollHeight + 2))}px`;
    }
  };

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = '90px';
    }
  };

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    '',
  );

  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      // Prefer DOM value over localStorage to handle hydration
      const finalValue = domValue || localStorageInput || '';
      // setInput(finalValue);
      setInputValue(finalValue);
      adjustHeight();
    }
    // Only run once after hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks-static-deps/exhaustive-deps
  }, []);

  useEffect(() => {
    setLocalStorageInput(inputValue);
  }, [inputValue, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    adjustHeight();
  };

  const submitForm = useCallback(() => {
    if (!inputValue) {
      return;
    }
    handleInputSubmit(inputValue);
    setInputValue('');
    setLocalStorageInput('');
    resetHeight();

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [handleInputSubmit, inputValue, setLocalStorageInput, width]);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AITextarea
        ref={textareaRef}
        placeholder="Ask me about your chats..."
        value={inputValue}
        onChange={handleInput}
        className={cx(
          'h-[90px] overflow-y-auto border-[#7D40FF] resize-none rounded-2xl !text-base pb-10 focus-visible:!ring-0 !ring-offset-0 dark:border-[#2F2F2F]',
          className,
        )}
        rows={2}
        autoFocus
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            if (status !== 'ready') {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }
        }}
      />

      <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row items-center justify-end">
        {status === 'streaming' ? (
          <StopButton stop={stop} setMessages={setMessages} />
        ) : (
          <SendButton
            input={inputValue}
            submitForm={submitForm}
          />
        )}
      </div>
    </div>
  );
}

export const RoomAIInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    return true;
  },
);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: Dispatch<SetStateAction<Array<Message>>>;
}) {
  return (
    <Button
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => sanitizeUIMessages(messages));
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);

function PureSendButton({
  submitForm,
  input,
}: {
  submitForm: () => void;
  input: string;
}) {
  return (
    <Button
      onClick={(event) => {
        event.preventDefault();
        submitForm();
      }}
      disabled={input.length === 0}
    >
      {/* <ArrowUpIcon size={14} /> */}
      <i className="icon icon-send text-[#B27AFF] text-[24px]" />
    </Button>
  );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
  if (prevProps.input !== nextProps.input) return false;
  return true;
});
