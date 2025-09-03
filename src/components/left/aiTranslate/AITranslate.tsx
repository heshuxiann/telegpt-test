import React from '@teact';
/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import type { FC } from '../../../lib/teact/teact';
import { memo } from '../../../lib/teact/teact';

import Transition from '../../ui/Transition';
import AITranslateContent from './AITranslateContent';
import AITranslateHeader from './AITranslateHeader';

export type OwnProps = {
  onReset: (forceReturnToChatList?: true | Event) => void;
};
const AITranslate:FC<OwnProps> = ({ onReset }) => {
  function renderCurrentSection() {
    return (
      <>
        <AITranslateHeader onReset={onReset} />
        <AITranslateContent onReset={onReset} />
      </>
    );
  }
  return (
    <Transition
      id="AiTranslate"
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

export default memo(AITranslate);
