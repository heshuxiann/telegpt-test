/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { Form, Input, Switch } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import type { UrgentTopic } from '../store/urgent-topic-store';

import { ChataiUrgentTopicStore } from '../store';

import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

const { TextArea } = Input;

const AddTopicPanel = () => {
  const [form] = Form.useForm();
  const { openDrawer, drawerParams } = useDrawer();
  const initialValues:UrgentTopic = drawerParams || {
    id: uuidv4(),
    topicName: '',
    topicDescription: '',
    strongAlert: false,
    phoneNumber: '',
  };
  const [strongAlert, setStrongAlert] = useState(drawerParams?.strongAlert || false);
  const strongAlertChange = (checked:boolean) => {
    setStrongAlert(checked);
  };
  const handleSave = useCallback(() => {
    form.validateFields().then((values) => {
      console.log('values', values);
      const topicId = drawerParams?.topicId || uuidv4();
      ChataiUrgentTopicStore.addUrgentTopic({ id: topicId, ...values });
      openDrawer(DrawerKey.PersonalizeSettings);
    }).catch((errorInfo) => {
      console.log('errorInfo', errorInfo);
    });
  }, [drawerParams?.topicId, form, openDrawer]);
  const handleCancel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings);
  }, [openDrawer]);
  return (
    <div className="h-full overflow-hidden px-[18px] flex flex-col">
      <div className="h-full overflow-y-auto flex-1">
        <div className="text-[14px] text-[#666666] mb-[24px]">
          Please set the topics and content descriptions for which you need alerts. When a message contains these contents, an alert will be triggered.
        </div>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
        >
          <Form.Item label="Topic name" name="topicName" rules={[{ required: true, message: 'Please enter topic name' }]}>
            <Input placeholder="Please enter the content topics" />
          </Form.Item>
          <Form.Item label="Topic description" name="topicDescription" rules={[{ required: true, message: 'Please enter topic description' }]}>
            <TextArea
              placeholder="Please describe the specific content or keywords that should trigger an alert. For example, if 'Vitalik' + 'ETH' + 'sell' appear, please notify me."
            />
          </Form.Item>
          <div className="mb-[24px]">
            <div className="flex items-center justify-between px-[14px] py-[10px] bg-white rounded-[6px] mb-[12px]">
              <span>Enable strong alerts</span>
              <Form.Item name="strongAlert" valuePropName="checked" noStyle>
                <Switch onChange={strongAlertChange} />
              </Form.Item>
            </div>
            <span className="text-[14px] text-[#767676]">
              Once enabled, these types of messages will trigger a phone alert.
            </span>
          </div>
          {strongAlert && (
            <Form.Item label="Phone number" name="phoneNumber" rules={[{ required: true, message: 'Please enter phone number' }]}>
              <Input />
            </Form.Item>
          )}
        </Form>
      </div>
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

export default AddTopicPanel;
