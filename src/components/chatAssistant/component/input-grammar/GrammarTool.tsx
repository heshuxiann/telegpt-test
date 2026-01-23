/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-len */
import React, {
  useMemo, useRef, useState,
} from '../../../../lib/teact/teact';

import type { Signal } from '../../../../util/signals';
import type { TabWithProperties } from '../TabList';

import parseHtmlAsFormattedText from '../../../../util/parseHtmlAsFormattedText';

import TabList from '../../../ui/TabList';
import FormalTab from './tabs/FormalTab';
import FriendlyTab from './tabs/FriendlyTab';
import ImproveTab from './tabs/ImproveTab';
import RephraseTab from './tabs/RephraseTab';
import ShortenTab from './tabs/ShortenTab';
import useLastCallback from '../../../../hooks/useLastCallback';

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

const TABS: TabWithProperties[] = [
  { id: 0, title: 'Improve' },
  { id: 1, title: 'Rephrase' },
  { id: 2, title: 'Shorten' },
  { id: 3, title: 'Friendly' },
  { id: 4, title: 'Formal' },
];

const GrammarTool = (props: GrammarToolProps) => {
  const { getHtml, setHtml, onClose } = props;

  const html = getHtml();
  const text = parseHtmlAsFormattedText(html).text;;

  const [selectedTabIndex, setSelectedTabIndex] = useState(0);

  // 跟踪已经挂载过的tab，避免重复请求
  const mountedTabsRef = useRef<Set<number>>(new Set([0]));

  const handleSwitchTab = useLastCallback((newIndex: number) => {
    setSelectedTabIndex(newIndex);
    // 记录已访问的tab
    if (!mountedTabsRef.current.has(newIndex)) {
      mountedTabsRef.current.add(newIndex);
    }
  });

  const shouldMount = (index: number) => mountedTabsRef.current.has(index);
  const isVisible = (index: number) => selectedTabIndex === index;

  return (
    <>
      <div className="px-[20px] py-[13px]">
        {shouldMount(0) && (
          <div style={isVisible(0) ? undefined : `display: none`}>
            <ImproveTab text={text} setHtml={setHtml} onClose={onClose} />
          </div>
        )}
        {shouldMount(1) && (
          <div style={isVisible(1) ? undefined : `display: none`}>
            <RephraseTab text={text} setHtml={setHtml} onClose={onClose} />
          </div>
        )}
        {shouldMount(2) && (
          <div style={isVisible(2) ? undefined : `display: none`}>
            <ShortenTab text={text} setHtml={setHtml} onClose={onClose} />
          </div>
        )}
        {shouldMount(3) && (
          <div style={isVisible(3) ? undefined : `display: none`}>
            <FriendlyTab text={text} setHtml={setHtml} onClose={onClose} />
          </div>
        )}
        {shouldMount(4) && (
          <div style={isVisible(4) ? undefined : `display: none`}>
            <FormalTab text={text} setHtml={setHtml} onClose={onClose} />
          </div>
        )}
      </div>
      <TabList
        activeTab={selectedTabIndex}
        tabs={TABS}
        onSwitchTab={handleSwitchTab}
      />
    </>
  );
};

export default GrammarTool;
