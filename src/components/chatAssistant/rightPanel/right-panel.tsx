/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-null/no-null */
/* eslint-disable max-len */
import React, { useEffect, useState } from 'react';
import cx from 'classnames';

import type { MessagePanelPayload } from './message-panel';

import AddTopicPanel from './add-topic-panel';
import ChatPickerPanel from './chat-picker-panel';
import CustomizationPromptPanel from './customization-prompt-panel';
import MessagePanel from './message-panel';
import PersonalizeSettings from './personalized-settings';
import RightHeader from './right-header';

import { DrawerKey, useDrawerStore } from '../global-summary/DrawerContext';

import './right-panel.scss';

export const RightPanel = () => {
  const {
    isOpen, drawerKey, drawerParams, closeDrawer,
  } = useDrawerStore();
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
      default:
        setRightPanelContent(null);
    }
  }, [drawerKey, drawerParams]);

  return (
    <div className={cx('summary-panel-container', {
      'summary-panel-open': isOpen,
    })}
    >
      <RightHeader drawerKey={drawerKey} onClose={closeDrawer} />
      <div className="flex-1 overflow-hidden">
        {rightPanelContent}
      </div>
    </div>
  );
};
