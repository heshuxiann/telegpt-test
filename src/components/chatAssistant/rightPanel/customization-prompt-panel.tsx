/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { message as showMessage } from 'antd';

import type { ISummaryTemplate } from '../api/user-settings';

import { telegptSettings } from '../api/user-settings';

import InputText from '../component/InputText';
import TextArea from '../component/TextArea';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

const CustomizationPromptPanel = () => {
  const { openDrawer, drawerParams } = useDrawerStore();
  const [titleError, setTitleError] = useState(false);
  const [promptError, setPromptError] = useState(false);
  const initialValues:ISummaryTemplate = drawerParams || {
    topic: '',
    prompt: '',
  };
  const [form, setForm] = useState(initialValues);
  const handleSave = useCallback(() => {
    if (form.topic.trim().length === 0) {
      setTitleError(true);
      return;
    }
    if (form.prompt.trim().length === 0) {
      setPromptError(true);
      return;
    }
    telegptSettings.updateSummarizeTemplate(form).then((res:any) => {
      if (res.code === 0) {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 0,
        });
      } else {
        showMessage.info('save failed');
      }
    }).catch(() => {
      showMessage.info('save failed');
    });
  }, [form, openDrawer]);
  const handleCancel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: 0,
    });
  }, [openDrawer]);
  const handleTopicNameChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const topic = e.currentTarget.value;
    setForm((prev) => {
      prev.topic = topic;
      return { ...prev };
    });
    if (topic.trim().length) {
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
        value={form.topic}
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
          className="w-[158px] h-[40px] border-[1px] border-[var(--color-chat-active)] rounded-[20px]"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="w-[158px] h-[40px] border-[1px] border-[var(--color-chat-active)] bg-[var(--color-chat-active)] rounded-[20px] text-white"
          onClick={handleSave}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default CustomizationPromptPanel;
