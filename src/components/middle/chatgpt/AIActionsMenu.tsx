/* eslint-disable react/jsx-no-useless-fragment */
import React, { useEffect, useRef, useState } from '../../../lib/teact/teact';

import eventEmitter, { Actions } from './EventEmitter';
import Grammar from './Icon/Grammar';
import SmartReply from './Icon/SmartReply';
import Summarize from './Icon/Summarize';
import Translate from './Icon/Translate';

export enum AIActionsMenuType {
  InputMenu = 'InputMenu',
  MessageMenu = 'MessageMenu',
}
interface AIActionsMenuParams {
  menuType: AIActionsMenuType;
  messageText: string;
  menuPosition: {
    x: number;
    y: number;
  };
}
const AIActionsMenu = () => {
  const [menuType, setMenuType] = useState<AIActionsMenuType>(AIActionsMenuType.InputMenu);
  const [messageText, setMessageText] = useState<string>('');
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  const [menuVisable, setMenuVisable] = useState<boolean>(false);
  // eslint-disable-next-line no-null/no-null
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDomClick = (e: MouseEvent) => {
      if (menuVisable && menuRef.current && !(e.target as Node).contains(menuRef.current)) {
        setMenuVisable(false);
      }
    };
    const handleShowMenu = (params: AIActionsMenuParams) => {
      setMenuType(params.menuType);
      setMenuPosition(params.menuPosition);
      setMessageText(params.messageText);
      setMenuVisable(true);
    };
    eventEmitter.on(Actions.ShowMenu, handleShowMenu);
    document.addEventListener('click', handleDomClick);
    return () => {
      eventEmitter.off(Actions.ShowMenu, handleShowMenu);
      document.removeEventListener('click', handleDomClick);
    };
  }, [menuVisable]);
  const handleTranslate = () => {
    // eslint-disable-next-line no-console
    console.log(messageText);
  };
  const handleSummarize = () => {

  };
  return (
    <>
      {menuVisable && (
        <div ref={menuRef} className="ai-tool-menu" style={`left:${menuPosition.x}px;top:${menuPosition.y}px`}>
          {menuType === AIActionsMenuType.MessageMenu && (
            <div className="ai-tool-menu-item" onClick={handleSummarize}>
              <Summarize size={18} />
              <span>Summarize</span>
            </div>
          )}
          {menuType === AIActionsMenuType.MessageMenu && (
            <div className="ai-tool-menu-item">
              <SmartReply size={18} />
              <span>Smart Reply</span>
            </div>
          )}
          <div className="ai-tool-menu-item" onClick={handleTranslate}>
            <Translate size={18} />
            <span>Translate</span>
          </div>
          {menuType === AIActionsMenuType.InputMenu && (
            <div className="ai-tool-menu-item">
              <Grammar size={18} />
              <span>Grammar</span>
            </div>
          )}
        </div>
      )}
    </>

  );
};

export default AIActionsMenu;
