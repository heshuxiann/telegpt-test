/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
import React, { useCallback, useState } from 'react';
import { message as showMessage, Switch } from 'antd';

import type { IUrgentTopic } from '../api/user-settings';

import { telegptSettings } from '../api/user-settings';

import InputText from '../component/InputText';
import TextArea from '../component/TextArea';
import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

const AddTopicPanel = () => {
  const { phone } = telegptSettings.telegptSettings;
  const { openDrawer, drawerParams } = useDrawerStore();
  const [topicError, setTopicError] = useState(false);
  const [descriptionError, setDescriptionError] = useState(false);
  const [phoneNumberError, setPhoneNumberError] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const initialValues:IUrgentTopic = drawerParams || {
    topic: '',
    prompt: '',
    is_call: false,
    is_open: false,
  };
  const [form, setForm] = useState<IUrgentTopic>(initialValues);
  const strongAlertChange = (checked:boolean) => {
    setForm((prev:IUrgentTopic) => {
      prev.is_call = checked;
      return { ...prev };
    });
    if (!checked) {
      setPhoneNumberError(false);
    }
  };

  const handleTopicNameChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const topicName = e.currentTarget.value;
    setForm((prev:IUrgentTopic) => {
      prev.topic = topicName;
      return { ...prev };
    });
    if (topicName.trim().length) {
      setTopicError(false);
    }
  }, []);

  const handleTopicDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const topicDescription = e.currentTarget.value;
    setForm((prev:IUrgentTopic) => {
      prev.prompt = topicDescription;
      return { ...prev };
    });
    if (topicDescription.trim().length) {
      setDescriptionError(false);
    }
  }, []);

  const handlePhoneNumberChange = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const number = e.currentTarget.value.trim();
    setPhoneNumber(number);
    if (number.trim().length === 0) {
      setPhoneNumberError(false);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (form.topic.trim().length === 0) {
      setTopicError(true);
      return;
    }
    if (form.prompt.trim().length === 0) {
      setDescriptionError(true);
      return;
    }
    if (form.is_call && phoneNumber.length === 0) {
      setPhoneNumberError(true);
      return;
    }
    telegptSettings.updateUrgentTopic(form).then((res:any) => {
      if (res.code === 0) {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: 1,
        });
      } else {
        showMessage.info('save failed');
      }
    }).catch(() => {
      showMessage.info('save failed');
    });
    if (form.is_call && phoneNumber.length > 0) {
      telegptSettings.setSettingOption({
        phone: phoneNumber,
      });
    }
  }, [form, openDrawer, phoneNumber]);

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
          value={form.topic}
          onChange={handleTopicNameChange}
          error={topicError ? 'Please enter the topic name' : undefined}
        />
        <div className="mb-[24px]">
          <TextArea
            className="!mb-[12px]"
            label="Topic Description"
            value={form.prompt}
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
            <Switch value={form.is_call} onChange={strongAlertChange} />
          </div>
          <span className="text-[14px] text-[#767676]">
            Once enabled, these types of messages will trigger a phone alert.
          </span>
        </div>
        <InputText
          label="Phone Number"
          type="number"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          error={phoneNumberError ? 'Please enter a valid phone number' : undefined}
        />
      </div>
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

export default AddTopicPanel;
