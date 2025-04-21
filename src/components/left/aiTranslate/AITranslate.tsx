/* eslint-disable max-len */
/* eslint-disable no-null/no-null */
/* eslint-disable @typescript-eslint/no-shadow */
import type { FC } from '../../../lib/teact/teact';
import React, {
  memo,
} from '../../../lib/teact/teact';

import { LAYERS_ANIMATION_NAME } from '../../../util/windowEnvironment';

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
      id="AiKnowledge"
      name={LAYERS_ANIMATION_NAME}
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
