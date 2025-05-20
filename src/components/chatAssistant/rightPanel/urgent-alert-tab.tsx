/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';

import type { UrgentTopic } from '../store/urgent-topic-store';

import { urgentCheckTask } from '../aiTask/urgent-check-task';
import { ChataiGeneralStore, ChataiUrgentTopicStore } from '../store';
import { URGENT_CHATS } from '../store/general-store';
import { SelectedChats } from './selected-chats';

import Icon from '../component/Icon';
import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

import './urgent-alert-tab.scss';

const TopicItem = ({ topic, onDelete }: { topic: UrgentTopic;onDelete: (id: string) => void }) => {
  const { openDrawer } = useDrawer();
  const handeleDeleteTopic = () => {
    onDelete(topic.id);
  };
  const handleEditTopic = () => {
    openDrawer(DrawerKey.AddTopicPanel, topic);
  };
  return (
    <div className="urgent-topic-item p-[20px] bg-white rounded-[8px] flex flex-row items-center justify-between gap-[24px]">
      <div>{topic.topicName}</div>
      <div className="urgent-topic-item-actions flex flex-row gap-[8px]">
        <Icon name="edit" className="text-[14px] cursor-pointer" onClick={handleEditTopic} />
        <Icon name="close" className="text-[14px] cursor-pointer" onClick={handeleDeleteTopic} />
      </div>
    </div>
  );
};
const AddTopic = () => {
  const { openDrawer } = useDrawer();
  const handleAddTopic = () => {
    console.log('add topic');
    openDrawer(DrawerKey.AddTopicPanel);
  };
  return (
    <div
      className="urgent-topic-item p-[20px] bg-white rounded-[8px] flex flex-row items-center gap-[8px] text-[#8C42F0] cursor-pointer"
      onClick={handleAddTopic}
    >
      <Icon name="add" />
      <span>Add Topic</span>
    </div>
  );
};

const UrgentAlertTab = () => {
  const [topics, setTopics] = useState<UrgentTopic[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const { openDrawer } = useDrawer();
  useEffect(() => {
    ChataiUrgentTopicStore.getAllUrgentTopic().then((topics) => {
      console.log('topics', topics);
      setTopics(topics);
    });
    ChataiGeneralStore.get(URGENT_CHATS).then((res) => {
      setSelectedChats(res || []);
    });
  }, []);

  const handleDelete = useCallback((id: string) => {
    const newSelected = selectedChats.filter((item) => item !== id);
    ChataiGeneralStore.set(URGENT_CHATS, newSelected);
    setSelectedChats(newSelected);
    urgentCheckTask.updateUrgentChats(newSelected);
  }, [selectedChats]);

  const handleOpenChatSelect = useCallback(async () => {
    const selectedChats = await ChataiGeneralStore.get(URGENT_CHATS);
    openDrawer(DrawerKey.ChatPicker, {
      selectedChats,
      onSave: (chats: string[]) => {
        ChataiGeneralStore.set(URGENT_CHATS, chats);
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: '2',
        });
        urgentCheckTask.updateUrgentChats(chats);
      },
      onCancel: () => {
        openDrawer(DrawerKey.PersonalizeSettings, {
          activeKey: '2',
        });
      },
    });
  }, [openDrawer]);

  const handeleDeleteTopic = (id:string) => {
    ChataiUrgentTopicStore.deleteUrgentTopic(id);
    setTopics(topics.filter((t) => t.id !== id));
  };
  return (
    <div className="h-full overflow-auto px-[18px]">
      <div>
        <h3 className="text-[18px] font-semibold">What types of messages require Alert?</h3>
        <div className="flex flex-col gap-[10px]">
          {topics.map((topic) => {
            return <TopicItem topic={topic} onDelete={handeleDeleteTopic} />;
          })}
          <AddTopic />
        </div>
      </div>
      <SelectedChats
        onOpenChatSelect={handleOpenChatSelect}
        selected={selectedChats}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default UrgentAlertTab;
