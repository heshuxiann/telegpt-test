/* eslint-disable max-len */
import React from 'react';

import { SelectedChats } from './selected-chats';

import Icon from '../component/Icon';

import './urgent-alert-tab.scss';

interface TopicItemProps {
  topicName: string;
  topicDesc: string;
  topicId: string;
}

const TopicItem = ({ topic }:{ topic: TopicItemProps }) => {
  return (
    <div className="urgent-topic-item p-[20px] bg-white rounded-[8px] flex flex-row items-center justify-between gap-[24px]">
      <div>{topic.topicName}</div>
      <div className="urgent-topic-item-actions flex flex-row gap-[8px]">
        <Icon name="edit" className="text-[14px] cursor-pointer" />
        <Icon name="close" className="text-[14px] cursor-pointer" />
      </div>
    </div>
  );
};
const AddTopic = () => {
  return (
    <div className="urgent-topic-item p-[20px] bg-white rounded-[8px] flex flex-row items-center gap-[8px] text-[#8C42F0] cursor-pointer">
      <Icon name="add" />
      <span>Add Topic</span>
    </div>
  );
};

const UrgentAlertTab = () => {
  const topics = [{
    topicName: 'Actions Item',
    topicDesc: '2222222',
    topicId: '1',
  }, {
    topicName: 'Cryptocurrency buying recommendations',
    topicDesc: '2222222',
    topicId: '2',
  }];
  return (
    <div className="h-full overflow-auto px-[18px]">
      <div>
        <h3 className="text-[18px] font-semibold">What types of messages require Alert?</h3>
        <div className="flex flex-col gap-[10px]">
          {topics.map((topic) => {
            return <TopicItem topic={topic} />;
          })}
          <AddTopic />
        </div>
      </div>
      <SelectedChats />
    </div>
  );
};

export default UrgentAlertTab;
