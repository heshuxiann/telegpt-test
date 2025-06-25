/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { Form, Input } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import { ChataiStores } from '../store';

import { DrawerKey, useDrawerStore } from '../globalSummary/DrawerContext';

const { TextArea } = Input;
const CustomizationPromptPanel = () => {
  const { openDrawer } = useDrawerStore();
  const [form] = Form.useForm();
  const handleSave = useCallback(() => {
    form.validateFields().then(async (values) => {
      await ChataiStores.summaryTemplate?.addSummaryTemplate({
        id: uuidv4(),
        ...values,
      });
      openDrawer(DrawerKey.PersonalizeSettings, {
        activeKey: '1',
      });
    }).catch((errorInfo) => {
      // eslint-disable-next-line no-console
      console.log('errorInfo', errorInfo);
    });
  }, [form, openDrawer]);
  const handleCancel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: '1',
    });
  }, [openDrawer]);
  return (
    <div className="h-full flex flex-col px-[18px]">
      <p className="text-[14px] text-[#666666]">Please enter the specific topic you want to summarize accurately and add a detailed description. The message summary service will show the content as per your needs.</p>
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item label="Topic name" name="title" rules={[{ required: true, message: 'Please enter topic name' }]}>
          <Input className="bg-[var(--color-chat-hover)]" placeholder="Primary Subject" />
        </Form.Item>
        <Form.Item label="Topic description" name="prompt" rules={[{ required: true, message: 'Please enter topic description' }]}>
          <TextArea
            className="bg-[var(--color-chat-hover)]"
            placeholder="Content description"
          />
        </Form.Item>
      </Form>
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
