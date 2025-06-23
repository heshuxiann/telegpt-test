/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { Input } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import { ChataiStores } from '../store';

import { DrawerKey, useDrawerStore } from '../globalSummary/DrawerContext';

const { TextArea } = Input;
const CustomizationPromptPanel = () => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const { openDrawer } = useDrawerStore();
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);
  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }, []);
  const handleSave = useCallback(() => {
    if (!title || !prompt) {
      return;
    }
    ChataiStores.summaryTemplate?.addSummaryTemplate({
      id: uuidv4(),
      title,
      prompt,
    });
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: '1',
    });
  }, [title, prompt, openDrawer]);
  const handleCancel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: '1',
    });
  }, [openDrawer]);
  return (
    <div className="h-full flex flex-col px-[18px]">
      <p className="text-[14px] text-[#666666]">Please enter the specific topic you want to summarize accurately and add a detailed description. The message summary service will show the content as per your needs.</p>
      <Input placeholder="Primary Subject" className="h-[40px] bg-[var(--color-chat-hover)]" onChange={handleTitleChange} />
      <TextArea className="mt-[12px] bg-[var(--color-chat-hover)]" rows={4} placeholder="Content description" onChange={handlePromptChange} />
      <div className="flex flex-row justify-center gap-[14px] mt-auto mb-[24px]">
        <button
          className="w-[158px] h-[40px] border-[1px] border-[#8C42F0] rounded-[20px]"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="w-[158px] h-[40px] border-[1px] border-[#8C42F0] bg-[#8C42F0] rounded-[20px] text-white"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CustomizationPromptPanel;
