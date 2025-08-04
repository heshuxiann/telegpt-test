/* eslint-disable no-null/no-null */
/* eslint-disable teactn/no-unused-prop-types */
/* eslint-disable react/no-unused-prop-types */

import React, {
  memo, useEffect, useRef,
} from '../../../lib/teact/teact';
import { withGlobal } from '../../../global';

import { injectComponent } from '../../../lib/injectComponent';
import RoomAIEntryButton from './room-ai-entry-button';

import './room-ai.module.scss';

interface StateProps {
  chatId: string;
}
const injectMessageAI = injectComponent(RoomAIEntryButton);
const RoomAIEntryWrapper = (props: StateProps) => {
  const { chatId } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (containerRef.current && chatId) {
      injectMessageAI(containerRef.current, { ...props });
    }
  // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, [chatId]);
  return (
    <div className="room-ai-entry-wrapper" ref={containerRef} />
  );
};

export default memo(withGlobal(
  (global, { chatId }): StateProps => {
    return {
      chatId,
    };
  },
)(RoomAIEntryWrapper));
