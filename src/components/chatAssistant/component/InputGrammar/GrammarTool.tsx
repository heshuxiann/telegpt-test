/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import React from 'react';
import { Tabs, type TabsProps } from 'antd';

import type { Signal } from '../../../../util/signals';

import parseHtmlAsFormattedText from '../../../../util/parseHtmlAsFormattedText';

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
const GrammarTool = (props:GrammarToolProps) => {
  const { getHtml, setHtml, onClose } = props;
  const { text } = parseHtmlAsFormattedText(getHtml());
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: 'Improve',
      children: <ImproveTab text={text} setHtml={setHtml} onClose={onClose} />,
    },
    {
      key: '2',
      label: 'Rephrase',
      children: <RephraseTab text={text} setHtml={setHtml} onClose={onClose} />,
    },
    {
      key: '3',
      label: 'Shorten',
      children: <ShortenTab text={text} setHtml={setHtml} onClose={onClose} />,
    },
    {
      key: '4',
      label: 'Friendly',
      children: <FriendlyTab text={text} setHtml={setHtml} onClose={onClose} />,
    },
    {
      key: '5',
      label: 'Formal',
      children: <FormalTab text={text} setHtml={setHtml} onClose={onClose} />,
    },
  ];
  return (
    <Tabs className="grammar-tool-tabs" defaultActiveKey="1" items={items} tabPosition="bottom" />
  );
};
export default GrammarTool;
