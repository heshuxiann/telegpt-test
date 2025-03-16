/* eslint-disable react/no-unused-prop-types */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable max-len */
import React, { useState } from 'react';
import { Tabs, type TabsProps } from 'antd';

import './setting.scss';

interface SettingPanelProps {
  originSummaryPrompt: string;
  appendUnreadPrompt: string;
  appendTodayPrompt: string;
  setAppendUnreadPrompt?: (value: string) => void;
  setAppendTodayPrompt?: (value: string) => void;
}
const UnreadPrompt = (props: SettingPanelProps) => {
  const { originSummaryPrompt, appendUnreadPrompt, setAppendUnreadPrompt = () => { } } = props;
  const [prompt, setPrompt] = useState<string>(appendUnreadPrompt);
  return (
    <div className="chat-ai-setting relative w-full h-full flex flex-col bg-white overflow-scroll">
      <h2 className="text-[14px] text-[#979797] mb-[12px]">提示词</h2>
      <h3>origin prompt</h3>
      <div className="p-2 text-[14px] text-[#979797] border border-[#979797] rounded-[8px] h-auto word-wrap break-all">
        {originSummaryPrompt}
      </div>
      <h3>append prompt</h3>
      <textarea
        className="p-2 text-[14px] text-[#979797] flex-shrink-0 h-[200px] border border-[#979797] rounded-[8px]"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        className="h-[36px] mx-auto left-0 text-center leading-[36px] bg-[#409eff] rounded-[12px] text-white absolute bottom-[12px] right-[12px] w-[100px] hover:bg-[#409eff] hover:opacity-80"
        onClick={() => { setAppendUnreadPrompt(prompt); }}
      >
        Save
      </button>
    </div>
  );
};

const TodayMessagePrompt = (props: SettingPanelProps) => {
  const { originSummaryPrompt, appendTodayPrompt, setAppendTodayPrompt = () => { } } = props;
  const [prompt, setPrompt] = useState<string>(appendTodayPrompt);
  return (
    <div className="chat-ai-setting relative w-full h-full flex flex-col bg-white overflow-scroll">
      <h2 className="text-[14px] text-[#979797] mb-[12px]">提示词</h2>
      <h3>origin prompt</h3>
      <div className="p-2 text-[14px] text-[#979797] border border-[#979797] rounded-[8px] h-auto">
        {originSummaryPrompt}
      </div>
      <h3>append prompt</h3>
      <textarea
        className="p-2 text-[14px] text-[#979797] h-[300px] border border-[#979797] rounded-[8px]"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        className="h-[36px] mx-auto left-0 text-center leading-[36px] bg-[#409eff] rounded-[12px] text-white absolute bottom-[12px] right-[12px] w-[100px] hover:bg-[#409eff] hover:opacity-80"
        onClick={() => { setAppendTodayPrompt(prompt); }}
      >
        Save
      </button>
    </div>
  );
};
const SettingPanel = (props: SettingPanelProps) => {
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'prompt 总结未读',
      // eslint-disable-next-line react/jsx-props-no-spreading
      children: <UnreadPrompt {...props} />,
    },
    {
      key: '2',
      label: 'prompt 总结今日',
      // eslint-disable-next-line react/jsx-props-no-spreading
      children: <TodayMessagePrompt {...props} />,
    },
  ];
  return (
    <div className="chat-ai-setting w-[300px] h-full p-[12px] flex flex-col bg-white">
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};
export default SettingPanel;
