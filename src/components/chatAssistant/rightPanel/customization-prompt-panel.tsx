/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import TextArea from '../component/textarea';
import { ChataiStores } from '../store';

import InputText from '../component/InputText';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

const CustomizationPromptPanel = () => {
  const { openDrawer } = useDrawerStore();
  const [form, setForm] = useState({ title: '', prompt: '' });
  const [titleError, setTitleError] = useState(false);
  const [promptError, setPromptError] = useState(false);
  const handleSave = useCallback(async () => {
    if (form.title.trim().length === 0) {
      setTitleError(true);
      return;
    }
    if (form.prompt.trim().length === 0) {
      setPromptError(true);
      return;
    }
    await ChataiStores.summaryTemplate?.addSummaryTemplate({
      id: uuidv4(),
      ...form,
    });
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: 0,
    });
  }, [form, openDrawer]);
  const handleCancel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: 0,
    });
  }, [openDrawer]);
  const handleTopicNameChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const title = e.currentTarget.value;
    setForm((prev) => {
      prev.title = title;
      return { ...prev };
    });
    if (title.trim().length) {
      setTitleError(false);
    }
  }, []);
  const handleTopicDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const prompt = e.currentTarget.value;
    setForm((prev) => {
      prev.prompt = prompt;
      return { ...prev };
    });
    if (prompt.trim().length) {
      setPromptError(false);
    }
  }, []);
  return (
    <div className="h-full flex flex-col px-[18px]">
      <p className="text-[14px] text-[#666666]">Please enter the specific topic you want to summarize accurately and add a detailed description. The message summary service will show the content as per your needs.</p>
      <InputText
        label="Topic name"
        value={form.title}
        onChange={handleTopicNameChange}
        error={titleError ? 'Please enter the topic name' : undefined}
      />
      <TextArea
        label="Topic description"
        value={form.prompt}
        noReplaceNewlines
        error={promptError ? 'Please enter the topic description' : undefined}
        onChange={handleTopicDescriptionChange}
      />
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
