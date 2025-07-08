/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import React, { useState } from 'react';

import type { Signal } from '../../../../util/signals';
import type { TabWithProperties } from '../TabList';

import parseHtmlAsFormattedText from '../../../../util/parseHtmlAsFormattedText';

import TabList from '../TabList';
import FormalTab from './tabs/FormalTab';
import FriendlyTab from './tabs/FriendlyTab';
import ImproveTab from './tabs/ImproveTab';
import RephraseTab from './tabs/RephraseTab';
import ShortenTab from './tabs/ShortenTab';

export interface GrammarTabProps {
  text: string;
  setHtml: (newValue: string) => void;
  onClose: () => void;
}
export interface GrammarToolProps {
  getHtml: Signal<string>;
  setHtml: (newValue: string) => void;
  onClose: () => void;
}
const GrammarTool = (props: GrammarToolProps) => {
  const { getHtml, setHtml, onClose } = props;
  const { text } = parseHtmlAsFormattedText(getHtml());
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const tabs: TabWithProperties[] = [
    {
      title: 'Improve',
    },
    {
      title: 'Rephrase',
    },
    {
      title: 'Shorten',
    },
    {
      title: 'Friendly',
    },
    {
      title: 'Formal',
    },
  ];
  const renderContent = () => {
    switch (selectedTabIndex) {
      case 0:
        return <ImproveTab text={text} setHtml={setHtml} onClose={onClose} />;
      case 1:
        return <RephraseTab text={text} setHtml={setHtml} onClose={onClose} />;
      case 2:
        return <ShortenTab text={text} setHtml={setHtml} onClose={onClose} />;
      case 3:
        return <FriendlyTab text={text} setHtml={setHtml} onClose={onClose} />;
      case 4:
        return <FormalTab text={text} setHtml={setHtml} onClose={onClose} />;
      default:
        return undefined;
    }
  };
  return (
    <>
      <div className="px-[20px] py-[13px]">
        {renderContent()}
      </div>
      <TabList
        activeTab={selectedTabIndex}
        tabs={tabs}
        onSwitchTab={setSelectedTabIndex}
        inversion
      />
    </>
  );
};
export default GrammarTool;
