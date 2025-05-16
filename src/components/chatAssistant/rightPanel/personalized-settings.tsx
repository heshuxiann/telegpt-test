/* eslint-disable no-console */
/* eslint-disable react/jsx-no-bind */
import React from 'react';
import type { TabsProps } from 'antd';
import { Tabs } from 'antd';

import SummarizeTab from './surmarize-tab';

// import UrgentAlertTab from './urgent-alert-tab';
import './personalized-settings.scss';

const PersonalizeSettings = () => {
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Summarize',
      children: <SummarizeTab />,
    },
    // {
    //   key: '2',
    //   label: 'Urgent Alert',
    //   children: <UrgentAlertTab />,
    // },
  ];
  const onChange = (key: string) => {
    console.log(key);
  };
  return <Tabs className="personalized-settings-tab h-full" defaultActiveKey="1" items={items} onChange={onChange} />;
};

export default PersonalizeSettings;
