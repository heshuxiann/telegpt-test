/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
import React, { useState } from 'react';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';

import type { TabWithProperties } from '../component/TabList';

import SummarizeTab from './surmarize-tab';
import UrgentAlertTab from './urgent-alert-tab';

import TabList from '../component/TabList';
import { useDrawerStore } from '../globalSummary/DrawerContext';

import './personalized-settings.scss';

const PersonalizeSettings = () => {
  const { drawerParams } = useDrawerStore();
  const [selectedTabIndex, setSelectedTabIndex] = useState(drawerParams?.activeKey || 0);
  const transactionTabs: TabWithProperties[] = [
    {
      title: 'Summarize',
    },
    {
      title: 'Urgent Alert',
    },
  ];
  const renderContent = () => {
    switch (selectedTabIndex) {
      case 0:
        return <SummarizeTab />;
      case 1:
        return <UrgentAlertTab />;
      default:
        return undefined;
    }
  };
  return (
    // <Tabs
    //   className="personalized-settings-tab h-full"
    //   defaultActiveKey={activeKey}
    //   items={items}
    //   onChange={onChange}
    // />
    <div className="flex flex-col h-full">
      <TabList
        activeTab={selectedTabIndex}
        tabs={transactionTabs}
        onSwitchTab={setSelectedTabIndex}
      />
      <div className="pt-[20px] flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default PersonalizeSettings;
