/* eslint-disable react/jsx-no-bind */
/* eslint-disable max-len */
import React from 'react';
import { Input, Switch } from 'antd';

const { TextArea } = Input;

const AddTopicPanel = () => {
  const strongAlertChange = () => {};
  return (
    <div className="h-full overflow-hidden">
      <div className="flex-1 flex flex-col gap-[10px] overflow-auto">
        <div className="text-[14px] text-[#666666]">
          Please set the topics and content descriptions for which you need alerts. When a message contains these contents, an alert will be triggered.
        </div>
        <div>
          <label className="text-[14px] text-[#767676]">Topic name</label>
          <Input placeholder="Please enter the content topics" />
        </div>
        <div>
          <label className="text-[14px] text-[#767676]">Topic description</label>
          <TextArea
            placeholder="Please describe the specific content or keywords that should trigger an alert. For example, if 'Vitalik' + 'ETH' + 'sell' appear, please notify me."
          />
        </div>
        <div>
          <div className="flex items-center justify-between px-[14px] py-[10px] bg-white rounded-[6px]">
            <span>Enable strong alerts</span>
            <Switch onChange={strongAlertChange} />
          </div>
          <span className="text-[14px] text-[#767676]">
            Once enabled, these types of messages will trigger a phone alert.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AddTopicPanel;
