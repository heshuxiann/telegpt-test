/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';

import type { MessagePanelPayload } from './message-panel';

import eventEmitter, { Actions } from '../lib/EventEmitter';
import ChatPickerPanel from './chat-picker-panel';
import CustomizationPromptPanel from './customization-prompt-panel';
import MessagePanel from './message-panel';
import PromptTemplatePanel from './prompt-template-panel';
import RightHeader, { RightPanelKey } from './right-header';

interface RightPanelProps {
  closeSummaryModal:()=>void;
}
export const RightPanel = (props: RightPanelProps) => {
  const { closeSummaryModal } = props;
  const [rightPanelKey, setRightPanelKey] = useState<RightPanelKey | null>(RightPanelKey.PromptTemplate);
  const [rightPanelPayload, setRightPanelPayload] = useState<MessagePanelPayload | null>(null);
  const [rightPanelContent, setRightPanelContent] = useState<React.ReactElement | null>(null);
  const handleOpenRightPanle = (payload: { rightPanelKey: RightPanelKey; rightPanelPayload: MessagePanelPayload }) => {
    const { rightPanelKey, rightPanelPayload } = payload;
    setRightPanelKey(rightPanelKey);
    setRightPanelPayload(rightPanelPayload);
  };

  useEffect(() => {
    eventEmitter.on(Actions.ShowGlobalSummaryPanel, handleOpenRightPanle);
    return () => {
      eventEmitter.off(Actions.ShowGlobalSummaryPanel, handleOpenRightPanle);
    };
    // eslint-disable-next-line react-hooks-static-deps/exhaustive-deps
  }, []);

  useEffect(() => {
    switch (rightPanelKey) {
      case RightPanelKey.OriginalMessages:
        setRightPanelContent(<MessagePanel relevantMessages={(rightPanelPayload as MessagePanelPayload)?.relevantMessages} closeSummaryModal={closeSummaryModal} />);
        break;
      case RightPanelKey.PromptTemplate:
        setRightPanelContent(<PromptTemplatePanel />);
        break;
      case RightPanelKey.CustomizationPrompt:
        setRightPanelContent(<CustomizationPromptPanel />);
        break;
      case RightPanelKey.ChatPicker:
        setRightPanelContent(<ChatPickerPanel />);
        break;
    }
  }, [closeSummaryModal, rightPanelKey, rightPanelPayload]);

  const onClose = useCallback(() => {
    setRightPanelKey(null);
    setRightPanelPayload(null);
  }, []);
  if (!rightPanelKey) return null;
  return (
    <div className="right-panel-container w-[375px] h-full bg-white/50 flex flex-col">
      <RightHeader rightPanelKey={rightPanelKey} onClose={onClose} />
      <div className="flex-1 overflow-y-scroll">
        {rightPanelContent}
      </div>
    </div>
  );
};
