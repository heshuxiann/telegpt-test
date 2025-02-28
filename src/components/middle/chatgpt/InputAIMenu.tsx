import type { FC } from '../../../lib/teact/teact';
import React from '../../../lib/teact/teact';

import useFlag from '../../../hooks/useFlag';

import Menu from '../../ui/Menu';
import MenuItem from '../../ui/MenuItem';
import Grammar from './Icon/Grammar';
import Translate from './Icon/Translate';

import './InputAIMenu.scss';

import chatAILogoPath from '../../../assets/cgat-ai-logo.png';

const InputAIMenu: FC = () => {
  const [isAIToolMenuOpen, openAIToolMenu, closeAIToolMenu] = useFlag();
  const handleToggleMenu = () => {
    if (isAIToolMenuOpen) {
      closeAIToolMenu();
    } else {
      openAIToolMenu();
    }
  };
  return (
    <div className="chat-ai-menu">
      <button className="Button chat-ai-logo-button" onClick={handleToggleMenu}>
        <img src={chatAILogoPath} alt="Chat AI Logo" />
      </button>
      <Menu
        id="attach-menu-controls"
        isOpen={isAIToolMenuOpen}
        autoClose
        positionX="right"
        positionY="bottom"
        onClose={closeAIToolMenu}
        className="AttachMenu--menu fluid"
        onCloseAnimationEnd={closeAIToolMenu}
        ariaLabelledBy="attach-menu-button"
      >
        <MenuItem>
          <div className="ai-tool-menu-item">
            <Translate size={18} />
            <span>Translate</span>
          </div>
        </MenuItem>
        <MenuItem>
          <div className="ai-tool-menu-item">
            <Grammar size={18} />
            <span>Smart Reply</span>
          </div>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default InputAIMenu;
