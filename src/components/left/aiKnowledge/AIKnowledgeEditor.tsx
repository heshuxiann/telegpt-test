/* eslint-disable @stylistic/max-len */
/* eslint-disable no-null/no-null */
// Import React dependencies.
import React, {
  type ChangeEvent,
  useCallback, useRef, useState,
} from 'react';
import type { DSlateRef } from '@dslate/antd';
import DSlate from '@dslate/antd';
import { Button, Input } from 'antd';
import type { Descendant } from 'slate';
import { Node } from 'slate';
import { v4 as uuidv4 } from 'uuid';

import type { AiKnowledge } from '../../chatAssistant/store/knowledge-store';

import { ChataiStores } from '../../chatAssistant/store';

type OwnProps = {
  knowledge?: AiKnowledge | null;
  type: 'add' | 'edit';
  onClose: () => void;
  onUpdate: () => void;
};

const ErrorTip = ({ message }: { message: string }) => {
  return (
    <div className="text-[12px] leading-[18px] text-red-400">{message}</div>
  );
};

const AIKnowledgeEditor = (props: OwnProps) => {
  const {
    type, knowledge, onClose, onUpdate,
  } = props;
  const knowledgeId = useRef(uuidv4());
  const [value, setValue] = useState<Descendant[]>(knowledge?.richText || [
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);
  const [question, setQuestion] = useState<string>(knowledge?.question || '');
  const [questionError, setQuestionError] = useState<string>('');
  const [valueError, setValueError] = useState<string>('');
  const ref = useRef<DSlateRef>(null);
  const handleQuestionChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  }, []);
  const serialize = (nodes: Descendant[]) => {
    return nodes.map((n) => Node.string(n)).join('\n');
  };
  const handleSave = useCallback(() => {
    const plainText = serialize(value);
    if (!plainText) {
      setValueError('Please enter your notes');
      return;
    } else {
      setValueError('');
    }
    if (!question) {
      setQuestionError('Please enter a question');
      return;
    } else {
      setQuestionError('');
    }
    const knowledgeIdValue = type === 'add' ? knowledgeId.current : knowledge?.id as string;
    ChataiStores.knowledge?.addKnowledge({
      id: knowledgeIdValue,
      richText: value,
      plainText,
      question,
    }).then(() => {
      onClose();
      onUpdate();
    });
  }, [knowledge?.id, onClose, onUpdate, question, type, value]);
  return (
    <div className="flex flex-col gap-[20px] h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <DSlate
          className="flex-1 flex flex-col overflow-hidden"
          ref={ref}
          value={value}
          onChange={setValue}
          toolbar={['history', 'bold', 'italic', 'decoration', 'text-align', 'list']}
          placeholder="Save your most-used answers as Quick Replies — e.g. your email, Calendly link, or a short project intro. Next time someone asks, insert it in one tap. "
        />
        {valueError && <ErrorTip message={valueError} />}
      </div>
      <div className="flex flex-col gap-[8px]">
        <div>
          Preset standard questions
          <span className="text-[#FF543D]">*</span>
        </div>
        <Input value={question} onChange={handleQuestionChange} />
        {questionError && <ErrorTip message={questionError} />}
      </div>
      <div className="flex flex-row gap-8 justify-end">
        <Button className="!w-[120px] !h-[42px]" onClick={onClose}>Cancel</Button>
        <Button type="primary" className="!w-[120px] !h-[42px]" onClick={handleSave}>Add</Button>
      </div>
    </div>
  );
};

export default AIKnowledgeEditor;
