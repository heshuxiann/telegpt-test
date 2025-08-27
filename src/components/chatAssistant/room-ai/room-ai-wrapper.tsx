/* eslint-disable no-null/no-null */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */

import React, { memo } from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../injectComponent';
import RoomAI from './room-ai';

interface StateProps {
  chatId: string | undefined;
}
const RoomAIWrapper = (props: StateProps) => {
  const containerRef = injectComponent({
    component: RoomAI,
    props,
  });
  return (
    <div className="chat-ai-room flex overflow-hidden" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId }): StateProps => {
    return {
      chatId,
    };
  },
)(RoomAIWrapper));
