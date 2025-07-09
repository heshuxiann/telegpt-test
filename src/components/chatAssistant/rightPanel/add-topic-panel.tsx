/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { Switch } from 'antd';
import { v4 as uuidv4 } from 'uuid';

import type { UrgentTopic } from '../store/urgent-topic-store';

import TextArea from '../component/textarea';
import { ChataiStores } from '../store';

import InputText from '../component/InputText';
import { DrawerKey, useDrawerStore } from '../globalSummary/DrawerContext';

const AddTopicPanel = () => {
  const { openDrawer, drawerParams } = useDrawerStore();
  const [topicError, setTopicError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const initialValues:UrgentTopic = drawerParams || {
    id: uuidv4(),
    topicName: '',
    topicDescription: '',
    strongAlert: false,
    phoneNumber: '',
  };
  const [form, setForm] = useState<UrgentTopic>(initialValues);
  const strongAlertChange = (checked:boolean) => {
    setForm((prev) => {
      prev.strongAlert = checked;
      return { ...prev };
    });
    if (!checked) {
      setPhoneNumberError(false);
    }
  };
  const updateAllTopicPhoneNumber = async (phoneNumber:string) => {
    const allTopics = await ChataiStores.urgentTopic?.getAllUrgentTopic();
    allTopics?.map((topic) => {
      if (topic.phoneNumber) {
        topic.phoneNumber = phoneNumber;
      }
      return topic;
    });
    return ChataiStores.urgentTopic?.addUrgentTopics(allTopics || []);
  };
  const handleTopicNameChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const topicName = e.currentTarget.value;
    setForm((prev) => {
      prev.topicName = topicName;
      return { ...prev };
    });
    if (topicName.trim().length) {
      setTopicError(false);
    }
  }, []);
  const handleTopicDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const topicDescription = e.currentTarget.value;
    setForm((prev) => {
      prev.topicDescription = topicDescription;
      return { ...prev };
    });
    if (topicDescription.trim().length) {
      setDescriptionError(false);
    }
  }, []);

  const handlePhoneNumberChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const phoneNumber = e.currentTarget.value;
    setForm((prev) => {
      prev.phoneNumber = phoneNumber;
      return { ...prev };
    });
    if (phoneNumber.trim().length) {
      setDescriptionError(false);
    }
  }, []);
  const handleSave = useCallback(async () => {
    if (form.topicName.trim().length === 0) {
      setTopicError(true);
      return;
    }
    if (form.topicDescription.trim().length === 0) {
      setDescriptionError(true);
      return;
    }
    if (form.strongAlert && form.phoneNumber.trim().length === 0) {
      setPhoneNumberError(true);
      return;
    }
    await ChataiStores.urgentTopic?.addUrgentTopic({ ...form });
    if (form.phoneNumber?.trim().length) {
      await updateAllTopicPhoneNumber(form.phoneNumber);
    }
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: 1,
    });
    // form.validateFields().then(async (values) => {
    //   console.log('values', values);
    //   const topicId = drawerParams?.id || uuidv4();
    //   await ChataiStores.urgentTopic?.addUrgentTopic({ id: topicId, ...values });
    //   if (values.phoneNumber) {
    //     await updateAllTopicPhoneNumber(values.phoneNumber);
    //     console.log(3333);
    //   }
    //   openDrawer(DrawerKey.PersonalizeSettings, {
    //     activeKey: 1,
    //   });
    // }).catch((errorInfo) => {
    //   console.log('errorInfo', errorInfo);
    // });
  }, [form, openDrawer]);
  const handleCancel = useCallback(() => {
    openDrawer(DrawerKey.PersonalizeSettings, {
      activeKey: 1,
    });
  }, [openDrawer]);
  return (
    <div className="urgent-topic-edit h-full overflow-hidden px-[18px] flex flex-col">
      <div className="h-full overflow-y-auto flex-1">
        <div className="text-[14px] text-[#666666] mb-[24px]">
          Please set the topics and content descriptions for which you need alerts. When a message contains these contents, an alert will be triggered.
        </div>
        <InputText
          label="Topic Name"
          value={form.topicName}
          onChange={handleTopicNameChange}
          error={topicError ? 'Please enter the topic name' : undefined}
        />
        <div className="mb-[24px]">
          <TextArea
            className="!mb-[12px]"
            label="Topic Description"
            value={form.topicDescription}
            noReplaceNewlines
            error={descriptionError ? 'Please enter the topic description' : undefined}
            onChange={handleTopicDescriptionChange}
          />
          <div className="text-[14px] text-[#767676]">
            Please describe the specific content or keywords that should trigger an alert. For example, if ‘Vitalik’ + ‘ETH’ + ‘sell’ appear, please notify me.
          </div>
        </div>
        <div className="mb-[24px]">
          <div className="flex items-center justify-between px-[14px] py-[10px] bg-[var(--color-chat-hover)] rounded-[6px] mb-[12px]">
            <span className="text-[var(--color-text)]">Enable strong alerts</span>
            <Switch onChange={strongAlertChange} />
          </div>
          <span className="text-[14px] text-[#767676]">
            Once enabled, these types of messages will trigger a phone alert.
          </span>
        </div>
        <InputText
          label="Phone Number"
          value={form.phoneNumber}
          onChange={handlePhoneNumberChange}
          error={phoneNumberError ? 'Please enter phone number' : undefined}
        />
        {/* <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
        >
          <Form.Item label="Topic name" name="topicName" rules={[{ required: true, message: 'Please enter topic name' }]}>
            <Input className="bg-[var(--color-chat-hover)]" placeholder="Please enter the content topics" />
          </Form.Item>
          <Form.Item label="Topic description" name="topicDescription" rules={[{ required: true, message: 'Please enter topic description' }]}>
            <TextArea
              className="bg-[var(--color-chat-hover)]"
              placeholder="Please describe the specific content or keywords that should trigger an alert. For example, if 'Vitalik' + 'ETH' + 'sell' appear, please notify me."
            />
          </Form.Item>
          <div className="mb-[24px]">
            <div className="flex items-center justify-between px-[14px] py-[10px] bg-[var(--color-chat-hover)] rounded-[6px] mb-[12px]">
              <span className="text-[var(--color-text)]">Enable strong alerts</span>
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
        </Form> */}
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
