/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';

import type { MessagePanelPayload } from './message-panel';

import AddTopicPanel from './add-topic-panel';
import ChatPickerPanel from './chat-picker-panel';
import CustomizationPromptPanel from './customization-prompt-panel';
import MessagePanel from './message-panel';
import PersonalizeSettings from './personalized-settings';
import RightHeader from './right-header';

import { DrawerKey, useDrawer } from '../globalSummary/DrawerContext';

export const RightPanel = () => {
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
        setRightPanelContent(<MessagePanel relevantMessages={(drawerParams as MessagePanelPayload)?.relevantMessages} />);
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
  }, [drawerKey, drawerParams]);

  if (!isOpen) return null;
  return (
    <div className="right-panel-container w-[375px] h-full bg-[var(--color-background)] flex flex-col">
      <RightHeader drawerKey={drawerKey} onClose={closeDrawer} />
      <div className="flex-1 overflow-hidden">
        {rightPanelContent}
      </div>
    </div>
  );
};
