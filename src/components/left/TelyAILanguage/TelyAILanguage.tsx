import React from '@teact';
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';

import Transition from '../../ui/Transition';
import TelyAILanguageContent from './TelyAILanguageContent';
import TelyAILanguageHeader from './TelyAILanguageHeader';

export type OwnProps = {
  onReset: (forceReturnToChatList?: true | Event) => void;
};
const TelyAILanguage:FC<OwnProps> = ({ onReset }) => {
  function renderCurrentSection() {
    return (
      <>
        <TelyAILanguageHeader onReset={onReset} />
        <TelyAILanguageContent onReset={onReset} />
      </>
    );
  }
  return (
    <Transition
      id="TelyAILanguageSelector"
      name='fade'
      activeKey={0}
      renderCount={1}
      shouldWrap
      withSwipeControl
    >
      {renderCurrentSection}
    </Transition>
  );
};

export default memo(TelyAILanguage);
