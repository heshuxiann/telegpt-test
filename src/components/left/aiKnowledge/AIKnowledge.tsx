import type { FC } from '../../../lib/teact/teact';
import React, { memo } from '../../../lib/teact/teact';

import { LAYERS_ANIMATION_NAME } from '../../../util/windowEnvironment';

import useLastCallback from '../../../hooks/useLastCallback';

import Transition from '../../ui/Transition';
import AIKnowledgeContent from './AIKnowledgeContent';
import AIKnowledgeHeader from './AIKnowledgeHeader';

export type OwnProps = {
  onReset: (forceReturnToChatList?: true | Event) => void;
};
const AIKnowledge:FC<OwnProps> = ({ onReset }) => {
  const handleReset = useLastCallback(() => {
    onReset(true);
  });
  function renderCurrentSection() {
    return (
      <>
        <AIKnowledgeHeader onReset={handleReset} />
        <AIKnowledgeContent />
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

export default memo(AIKnowledge);
