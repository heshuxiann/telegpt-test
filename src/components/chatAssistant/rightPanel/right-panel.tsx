/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useCallback, useEffect, useState } from 'react';

import type { MessagePanelPayload } from './message-panel';

import AddTopicPanel from './add-topic-panel';
import ChatPickerPanel from './chat-picker-panel';
import CustomizationPromptPanel from './customization-prompt-panel';
import MessagePanel from './message-panel';
import PersonalizeSettings from './personalized-settings';
import RightHeader from './right-header';

import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

interface RightPanelProps {
  closeSummaryModal:()=>void;
}
export const RightPanel = (props: RightPanelProps) => {
  const { closeSummaryModal } = props;
  const {
    isOpen, drawerKey, drawerParams, closeDrawer,
  } = useDrawer();
  const [rightPanelContent, setRightPanelContent] = useState<React.ReactElement | null>(null);

  useEffect(() => {
    switch (drawerKey) {
      case DrawerKey.PersonalizeSettings:
        setRightPanelContent(<PersonalizeSettings />);
        break;
      case DrawerKey.OriginalMessages:
        setRightPanelContent(<MessagePanel relevantMessages={(drawerParams as MessagePanelPayload)?.relevantMessages} closeSummaryModal={closeSummaryModal} />);
        break;
      case DrawerKey.CustomizationPrompt:
        setRightPanelContent(<CustomizationPromptPanel />);
        break;
      case DrawerKey.ChatPicker:
        setRightPanelContent(<ChatPickerPanel />);
        break;
      case DrawerKey.AddTopicPanel:
        setRightPanelContent(<AddTopicPanel />);
        break;
    }
  }, [closeSummaryModal, drawerKey, drawerParams]);

  const onClose = useCallback(() => {
    closeDrawer();
  }, [closeDrawer]);
  if (!isOpen) return null;
  return (
    <div className="right-panel-container w-[375px] h-full bg-white/50 flex flex-col">
      <RightHeader drawerKey={drawerKey} onClose={onClose} />
      <div className="flex-1 overflow-hidden">
        {rightPanelContent}
      </div>
    </div>
  );
};
